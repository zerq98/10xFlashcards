import { defineMiddleware, sequence } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types.ts';
import type { Session } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

/**
 * Middleware bezpieczeństwa dla Astro i Supabase Auth
 * 
 * WAŻNE: Ten kod działa WYŁĄCZNIE po stronie serwera.
 * Dane wrażliwe jak SUPABASE_KEY nie są nigdy wysyłane do przeglądarki.
 * 
 * Astro używa wydzielonej kompilacji server-side (SSR) i client-side,
 * dzięki czemu kod middleware nie jest dostępny w DevTools przeglądarki.
 */

// Funkcja pomocnicza do czyszczenia ciasteczek uwierzytelniających
const clearAuthCookies = (context: { cookies: AstroCookies }) => {
  context.cookies.delete('access_token', { path: '/' });
  context.cookies.delete('refresh_token', { path: '/' });
  context.cookies.delete('user_id', { path: '/' });
  context.cookies.delete('csrf_token', { path: '/' });
};

// Funkcja pomocnicza do ustawiania ciasteczek uwierzytelniających
const setAuthCookies = (
  context: { cookies: AstroCookies, locals?: App.Locals },
  session: Session,
  expiryDate: Date
) => {
  // Ustawienie tokenu dostępu
  context.cookies.set('access_token', session.access_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: expiryDate
  });
  
  // Ustawienie tokenu odświeżania
  context.cookies.set('refresh_token', session.refresh_token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: expiryDate
  });
  
  // Ustawienie ID użytkownika (dla weryfikacji)
  context.cookies.set('user_id', session.user.id, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    expires: expiryDate
  });
  
  // Generowanie tokenu CSRF dla dodatkowego zabezpieczenia
  const csrfToken = crypto.randomUUID();
  context.cookies.set('csrf_token', csrfToken, {
    path: '/',
    httpOnly: false, // Musi być dostępne dla JavaScript
    secure: true,
    sameSite: 'strict',
    expires: expiryDate
  });
  
  // Zapisanie tokenu CSRF w locals, jeśli dostępne
  if (context.locals) {
    context.locals.csrfToken = csrfToken;
  }
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
          'X-Client-Info': `astro-middleware-${Math.random().toString(36).substring(2, 10)}`
        }
      }
    }
  );
  
  // Inicjalizacja kontekstu lokalnego
  context.locals.supabase = supabase;
  context.locals.session = null;
  context.locals.user = null;

  // Pobieramy token dostępu i odświeżania z ciasteczek
  const accessToken = context.cookies.get('access_token')?.value;
  const refreshToken = context.cookies.get('refresh_token')?.value;
  // Pobieranie ID użytkownika do weryfikacji (jeśli istnieje)
  const userId = context.cookies.get('user_id')?.value;

  // Jeśli mamy tokeny, ustawiamy sesję
  if(context.url.pathname !== '/login') {
    if (accessToken && refreshToken) {
    try {
      // Ustawiamy sesję klienta używając tokenów z ciasteczek
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Sprawdzamy, czy były jakieś błędy przy ustawianiu sesji
      if (error) {
        console.error('Błąd uwierzytelnienia sesji:', error.message);
        // Usuwamy nieważne tokeny
        clearAuthCookies(context);
        return context.redirect('/login');
      }

      // Dodatkowe zabezpieczenie: Weryfikacja tożsamości użytkownika
      if (userId && session?.user.id && userId !== session.user.id) {
        console.error('Niezgodność ID użytkownika w sesji!');
        // Potencjalne naruszenie bezpieczeństwa - czyścimy tokeny
        clearAuthCookies(context);
        return context.redirect('/login');
      }

      // Ustaw dane sesji w kontekście lokalnym
      context.locals.session = session;
      context.locals.user = session?.user || null;
      
      // Zapisujemy ID użytkownika do przyszłych weryfikacji, jeśli go nie mamy
      if (session?.user.id && !userId) {
        context.cookies.set('user_id', session.user.id, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          expires: new Date((session.expires_at || 0) * 1000)
        });
      }
      
      // W przypadku wygaśnięcia tokenu - odświeżanie
      if (session?.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
        // Token wygaśnie w ciągu minuty, odśwież go
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Błąd odświeżania sesji:', refreshError.message);
          // Nie czyścimy ciasteczek, może się uda przy następnym żądaniu
        } else if (newSession) {
          // Dodatkowa weryfikacja - czy to nadal ten sam użytkownik
          if (session.user.id !== newSession.user.id) {
            console.error('Niezgodność ID użytkownika po odświeżeniu sesji!');
            clearAuthCookies(context);
            return context.redirect('/login');
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
    } catch (error) {
      console.error('Nieoczekiwany błąd sesji:', error);
      clearAuthCookies(context);
      return context.redirect('/login');
    }
  }
  else{
    return context.redirect('/login');
  }
}

  return next();
});

// Middleware chroniące trasy wymagające autentykacji
export const protectRoute = defineMiddleware(async (context, next) => {
  // Sprawdzamy czy jest sesja, jeśli nie - przekierowujemy do logowania
  if (!context.locals.session) {
    return context.redirect('/login');
  }

  return next();
});

// Middleware do weryfikacji CSRF dla żądań modyfikujących dane
export const verifyCsrf = defineMiddleware(async (context, next) => {
  // Weryfikacja tylko dla żądań POST, PUT, DELETE, PATCH
  const method = context.request.method.toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfTokenCookie = context.cookies.get('csrf_token')?.value;
    const csrfTokenHeader = context.request.headers.get('X-CSRF-Token');
    
    if (!csrfTokenCookie || !csrfTokenHeader || csrfTokenCookie !== csrfTokenHeader) {
      return new Response('Zabronione - niepoprawny token CSRF', { status: 403 });
    }
  }

  return next();
});

// Sequence - uruchamiamy loadSession jako główne middleware
export const onRequest = sequence(loadSession);