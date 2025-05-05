# Specyfikacja modułu autentykacji (US-001, US-002, US-003, US-004, US-005)

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Struktura stron i układ Auth / Non-Auth
- Nowe strony Astro:
  - `src/pages/register.astro` – strona rejestracji (AuthLayout)
  - `src/pages/login.astro` – strona logowania (AuthLayout)
  - `src/pages/forgot-password.astro` – formularz wysłania linku resetującego (US-003, AuthLayout)
  - `src/pages/reset-password/[token].astro` – formularz ustawienia nowego hasła po kliknięciu w link e-mail (AuthLayout)
  - `src/pages/account/change-password.astro` – formularz zmiany hasła (US-004, wymaga zalogowania, Layout + protectRoute)
  - `src/pages/account/delete-account.astro` – formularz usunięcia konta (US-005, wymaga zalogowania, Layout + protectRoute)
- Layouty:
  - `src/layouts/AuthLayout.astro` – uproszczony layout dla stron auth (bez głównego NavBar)
  - `src/layouts/Layout.astro` – istniejący layout rozszerzony o kontrolę widoczności elementów zależnie od stanu sesji
- Komponenty React (w `src/components/auth`):
  - `RegisterForm.tsx` – formularz rejestracji
  - `LoginForm.tsx` – formularz logowania
  - `ForgotPasswordForm.tsx` – wysłanie żądania resetu hasła (email)
  - `ResetPasswordForm.tsx` – ustawienie nowego hasła z tokenem URL
  - `ChangePasswordForm.tsx` – formularz zmiany hasła
  - `DeleteAccountForm.tsx` – formularz usunięcia konta
- NavBar:
  - Rozszerzenie istniejącego NavBar: wyświetlanie przycisków „Zaloguj”/„Rejestruj” lub „Wyloguj”/„Profil” w zależności od zalogowania
- Wszystkie pozostałe strony aplikacji (np. lista tematów, widok pojedynczego tematu, sesja nauki) są chronione i dostępne dopiero po zalogowaniu użytkownika; każda trasa SSR używa middleware `protectRoute`.

### 1.2. Rozdzielenie odpowiedzialności
- Astro (SSR):
  - Renderowanie struktury stron i przekazywanie początkowego stanu sesji (token z ciasteczka)
  - Middleware do ochrony tras chronionych – przekierowanie na `/login` jeśli brak sesji
- React (CSR):
  - Zarządzanie stanem formularzy (useState, useId, useOptimistic)
  - Walidacja po stronie klienta (Zod + react-hook-form)
  - Wyświetlanie komunikatów błędów inline i bannerów
  - Integracja z API auth via fetch do Astro Server Endpoints

### 1.3. Walidacja i komunikaty błędów
- Rejestracja:
  - Email: validacja formatu i unikalności (błąd z API)
  - Hasło: min. 8 znaków, co najmniej jedna cyfra, jeden duży znak, jeden mały znak i znak specjalny
- Logowanie:
  - Pola niepuste, niepoprawne dane → komunikat „Nieprawidłowy email lub hasło”
- Odzyskiwanie hasła (US-003):
  - Email: format i istnienie w systemie (błąd gdy brak konta)
  - Nowe hasło: wymagania bezpieczeństwa jak przy rejestracji
  - Token resetujący: weryfikacja ważności i poprawności
  - Komunikaty: potwierdzenie wysłania e-mail, błędy wygasłego/nieprawidłowego tokenu, problemy serwera
- Zmiana hasła (US-004): aktualne hasło + nowe hasło musi spełniać wymagania bezpieczeństwa i potwierdzenie, walidacja pod klienta i server.
- Usunięcie konta (US-005): potwierdzenie hasłem, alert potwierdzający decyzję.
- Błędy wyświetlane pod polami (`aria-invalid`, aria-describedby) oraz alert banner
- Blokada buttonów przy błędach walidacji lub trwającym żądaniu

### 1.4. Kluczowe scenariusze
- Rejestracja:
  - Sukces → automatyczne logowanie, redirect do `/topics`
  - E-mail istnieje → komunikat o konflikcie
- Logowanie:
  - Sukces → redirect do `/topics`
  - Błąd danych → komunikat
- Odzyskiwanie hasła:
  - Wprowadzenie email → API wysyła link resetujący (potwierdzenie banner)
  - Kliknięcie linku → formularz ustawienia nowego hasła
  - Sukces: hasło zmienione, przekierowanie do `/login` z komunikatem potwierdzenia
  - Błąd: nieprawidłowy/wygaśnięty token lub brak konta → odpowiedni komunikat
- Zmiana hasła:
  - Sukces: po podaniu aktualnego i nowego hasła otrzymuję potwierdzenie i pozostaję zalogowany.
  - Błąd: niepoprawne aktualne hasło lub niespełnienie wymagań → odpowiedni komunikat.
- Usuwanie konta:
  - Sukces: po potwierdzeniu (hasło) moje konto zostaje oznaczone jako usunięte (soft delete) i wylogowuję się.
  - Błąd: niepoprawne hasło lub błąd serwera → odpowiedni komunikat.

## 2. LOGIKA BACKENDOWA

### 2.1. Struktura endpointów API
- `POST /api/auth/register`
  - Body: `{ email: string; password: string }`
  - Response: `{ session: SessionData }` lub `{ error: string }`
- `POST /api/auth/login`
  - Body: `{ email: string; password: string }`
  - Response: `{ session: SessionData }` lub `{ error: string }`
- `POST /api/auth/logout`
  - Body: `{}`
  - Response: `{ success: true }`
- `POST /api/auth/forgot-password`
  - Body: `{ email: string }`
  - Generuje link z tokenem, wysyła e-mail przez Supabase, Response: `{ success: true }` lub `{ error: string }`
- `POST /api/auth/reset-password`
  - Body: `{ token: string; newPassword: string }`
  - Weryfikuje token, ustawia nowe hasło w Supabase, Response: `{ success: true }` lub `{ error: string }`
- PUT `/api/auth/change-password`
  - Body: `{ currentPassword: string; newPassword: string }`
  - Logic: re-authenticate user using `supabase.auth.signInWithPassword({ email, password: currentPassword })`, then call `supabase.auth.updateUser({ password: newPassword })`
  - Response: `{ success: true }` lub `{ error: string }`
- DELETE `/api/auth/delete-account`
  - Body: `{ password: string }`
  - Logic: re-authenticate user via `supabase.auth.signInWithPassword`, then set `deleted_at` timestamp on user profile in database (soft delete), call `supabase.auth.signOut()` to clear session
  - Response: `{ success: true }` lub `{ error: string }`

#### Modele danych
- `User`: `id: UUID`, `email: string`, `created_at`, `updated_at`, `deleted_at: timestamp | null`
- `SessionData`: `access_token`, `refresh_token`, `expires_in`

### 2.2. Walidacja danych wejściowych
- Zod schematy (`src/pages/api/auth/schemas.ts`):
  - `registerSchema`, `loginSchema`
  - Schematy Zod dla odzyskiwania hasła: `forgotPasswordSchema`, `resetPasswordSchema`
  - `changePasswordSchema` (currentPassword, newPassword)
  - `deleteAccountSchema` (password)
- Middleware `validateSchema` przed handlerem
- Early return w przypadku błędów

### 2.3. Obsługa wyjątków
- `try/catch` w endpointach
- Logowanie błędów (Sentry / konsola)
- Status 500 + generyczny komunikat „Wewnętrzny błąd serwera”

### 2.4. Rendering server-side i middleware
- `astro.config.mjs`:
  - Dodanie integracji Cookie + Supabase (via `import.meta.env`)
- `src/middleware/index.ts`:
  - `protectRoute` → sprawdzenie ciasteczka `sb-access-token`, redirect jeśli brak
  - `loadSession` → parsowanie i udostępnianie `context.locals.supabase` i `session`

## 3. SYSTEM AUTENTYKACJI

### 3.1. Supabase Auth
- Rejestracja: `supabase.auth.signUp({ email, password })` w `register` endpoint
- Logowanie: `supabase.auth.signInWithPassword({ email, password })` w `login` endpoint
- Wylogowanie: `supabase.auth.signOut()` w `logout` endpoint
- Zmiana hasła (US-004):
  - Endpoint `/api/auth/change-password`:
    - Re-authenticate: `supabase.auth.signInWithPassword({ email, password: currentPassword })`
    - Update: `supabase.auth.updateUser({ password: newPassword })`
- Usunięcie konta (US-005):
  - Endpoint `/api/auth/delete-account`:
    - Re-authenticate: `supabase.auth.signInWithPassword({ email, password })`
    - Soft delete: update `deleted_at` field in `users` table via Supabase Admin API or direct DB query
    - Sign out: `supabase.auth.signOut()`

### 3.2. Zarządzanie sesją
- Po udanym auth ustawienie ciasteczek HTTP-only:
  - `access_token`, `refresh_token`, `expires_in`
- Odswieżanie tokenu na middleware (przed wygaśnięciem)
- React: odczyt i CTA do API auth, a nie bezpośrednio do SupabaseClient

### 3.3. Kontrakty i integracja
- `src/db/supabase.client.ts` → inicjalizacja klienta do SSR
- `src/components/auth/*.tsx` → fetch do `/api/auth/*`, obsługa promise i errorów
- Typy w `src/types.ts`: `RegisterRequest`, `LoginRequest`, `SessionData`