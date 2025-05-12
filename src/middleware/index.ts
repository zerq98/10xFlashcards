import { defineMiddleware, sequence } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";
import type { Session } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

/**
 * Middleware bezpieczeństwa dla Astro i Supabase Auth
 *
 * WAŻNE: Ten kod działa WYŁĄCZNIE po stronie serwera.
 * Dane wrażliwe jak SUPABASE_KEY nie są nigdy wysyłane do przeglądarki.
 *
 * Astro używa wydzielonej kompilacji server-side (SSR) i client-side,
 * dzięki czemu kod middleware nie jest dostępny w DevTools przeglądarki.
 */

// Tablica ścieżek, które nie wymagają autoryzacji
export const unprotectedRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// Funkcja pomocnicza do czyszczenia ciasteczek uwierzytelniających
const clearAuthCookies = (context: { cookies: AstroCookies }) => {
  context.cookies.delete("access_token", { path: "/" });
  context.cookies.delete("refresh_token", { path: "/" });
  context.cookies.delete("user_id", { path: "/" });
};

// Funkcja pomocnicza do ustawiania ciasteczek uwierzytelniających
const setAuthCookies = (
  context: { cookies: AstroCookies; locals?: App.Locals },
  session: Session,
  expiryDate: Date
) => {
  // Ustawienie tokenu dostępu
  context.cookies.set("access_token", session.access_token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: expiryDate,
  });

  // Ustawienie tokenu odświeżania
  context.cookies.set("refresh_token", session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: expiryDate,
  });

  // Ustawienie ID użytkownika (dla weryfikacji)
  context.cookies.set("user_id", session.user.id, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: expiryDate,
  });
};

// Middleware do ładowania sesji i udostępniania jej w context.locals
export const loadSession = defineMiddleware(async (context, next) => {
  // Tworzenie nowej instancji klienta Supabase dla każdego żądania
  // to zwiększa bezpieczeństwo poprzez pełną izolację sesji między zapytaniami
  const supabase = createClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      auth: {
        persistSession: false, // Nie przechowujemy sesji w pamięci przeglądarki
        autoRefreshToken: false, // Sami zarządzamy odświeżaniem tokenów
      },
      global: {
        headers: {
          // Dodajemy nagłówek identyfikujący źródło żądania
          "X-Client-Info": `astro-middleware-${Math.random()
            .toString(36)
            .substring(2, 10)}`,
        },
      },
    }
  );  // Inicjalizacja kontekstu lokalnego
  context.locals.supabase = supabase;
  context.locals.session = null;
  context.locals.user = null;
  
  // Sprawdzamy czy aktualna ścieżka wymaga autoryzacji
  const pathname = new URL(context.request.url).pathname;
  const isProtectedRoute = !unprotectedRoutes.includes(pathname);

  // Pobieramy token dostępu i odświeżania z ciasteczek
  const accessToken = context.cookies.get("access_token")?.value;
  const refreshToken = context.cookies.get("refresh_token")?.value;
  // Pobieranie ID użytkownika do weryfikacji (jeśli istnieje)
  const userId = context.cookies.get("user_id")?.value;
  
  // Jeśli nie mamy tokenów a ścieżka jest chroniona, przekierowujemy do logowania
  if ((!accessToken || !refreshToken) && isProtectedRoute) {
    return context.redirect("/login");
  }
  
  // Jeśli mamy tokeny, ustawiamy sesję
  if (accessToken && refreshToken) {

    if(!isProtectedRoute) {
      return context.redirect("/");
    }

    try {
      // Ustawiamy sesję klienta używając tokenów z ciasteczek
      const {
        data: { session },
        error,
      } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Sprawdzamy, czy były jakieś błędy przy ustawianiu sesji
      if (error) {
        console.error("Błąd uwierzytelnienia sesji:", error.message);
        // Usuwamy nieważne tokeny
        clearAuthCookies(context);
        // Przekierowujemy tylko jeśli to chroniona ścieżka
        if (isProtectedRoute) {
          return context.redirect("/login");
        }
      }

      // Dodatkowe zabezpieczenie: Weryfikacja tożsamości użytkownika
      if (userId && session?.user.id && userId !== session.user.id) {
        console.error("Niezgodność ID użytkownika w sesji!");
        // Potencjalne naruszenie bezpieczeństwa - czyścimy tokeny
        clearAuthCookies(context);
        // Przekierowujemy tylko jeśli to chroniona ścieżka
        if (isProtectedRoute) {
          return context.redirect("/login");
        }
      }

      // Ustaw dane sesji w kontekście lokalnym
      if (session) {
        context.locals.session = session;
        context.locals.user = session.user || null;

        // Zapisujemy ID użytkownika do przyszłych weryfikacji, jeśli go nie mamy
        if (session.user.id && !userId) {
          context.cookies.set("user_id", session.user.id, {
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            expires: new Date((session.expires_at || 0) * 1000),
          });
        }

        // W przypadku wygaśnięcia tokenu - odświeżanie
        if (
          session?.expires_at &&
          session.expires_at * 1000 < Date.now() + 60000
        ) {
          // Token wygaśnie w ciągu minuty, odśwież go
          const {
            data: { session: newSession },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error("Błąd odświeżania sesji:", refreshError.message);
            // Nie czyścimy ciasteczek, może się uda przy następnym żądaniu
          } else if (newSession) {
            // Dodatkowa weryfikacja - czy to nadal ten sam użytkownik
            if (session.user.id !== newSession.user.id) {
              console.error("Niezgodność ID użytkownika po odświeżeniu sesji!");
              clearAuthCookies(context);
              // Przekierowujemy tylko jeśli to chroniona ścieżka
              if (isProtectedRoute) {
                return context.redirect("/login");
              }
            }

            // Aktualizuj ciasteczka z nowymi tokenami
            const expiryDate = new Date((newSession.expires_at || 0) * 1000);

            // Ustawianie wszystkich potrzebnych ciasteczek bezpiecznie
            setAuthCookies(context, newSession, expiryDate);

            // Aktualizacja danych w kontekście lokalnym
            context.locals.session = newSession;
            context.locals.user = newSession.user;
          }
        }
      }
    } catch (error) {
      console.error("Nieoczekiwany błąd sesji:", error);
      clearAuthCookies(context);
      // Przekierowujemy tylko jeśli to chroniona ścieżka
      if (isProtectedRoute) {
        return context.redirect("/login");
      }
    }
  }
  
  // Ostatnia weryfikacja - jeśli to chroniona ścieżka i nie mamy sesji, przekieruj
  if (isProtectedRoute && !context.locals.session) {
    return context.redirect("/login");
  }
  
  return next();
});

// Sequence - uruchamiamy tylko loadSession, która zawiera całą logikę uwierzytelniania
export const onRequest = sequence(loadSession);
