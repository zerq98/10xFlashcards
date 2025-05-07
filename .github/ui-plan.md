# Architektura UI dla 10xFlashcards

## 1. Przegląd struktury UI

Aplikacja opiera się na głównych widokach dostępnych przez nawigację boczną (sidebar) oraz dedykowanych ścieżkach URL. Kluczowe elementy:
- Pasek boczny (Sidebar) z linkami do Dashboard, Moich Tematów i Ustawień Konta oraz wylogowaniem.
- Dashboard wyświetlający listę tematów z badge liczby fiszek.
- Widok Tematu z listą fiszek i akcjami CUD oraz sesją nauki.
- Formularze autentykacji (Logowanie, Rejestracja, Zapomniałem hasła, Reset hasła).
- Modalne okna do generowania fiszek AI oraz tworzenia/edycji fiszek manualnych.
- Tryb nauki SR z animacją obrotu karty.
- Toasty, spinnery (Button/Global) i skeletony dla ładowania i powiadomień.

## 2. Lista widoków

1. **Logowanie** (`/login`)
   - Cel: uwierzytelnienie użytkownika
   - Zawartość: formularz email + hasło, linki do rejestracji i resetu hasła
   - Kluczowe komponenty: Form, Input, Button, Toasty
   - Dostępność: aria-invalid, focus-visible

2. **Rejestracja** (`/register`)
   - Cel: utworzenie konta
   - Zawartość: formularz email, hasło, potwierdzenie hasła
   - Komponenty: Form, Input.Password, Button, Toasty

3. **Zapomniałem hasła** (`/forgot-password`)
   - Cel: inicjacja resetu hasła
   - Zawartość: formularz email, komunikat po wysłaniu
   - Komponenty: Form, Button, Toasty

4. **Reset hasła** (`/reset-password?token=...`)
   - Cel: ustawienie nowego hasła
   - Zawartość: formularz nowe hasło + confirm, komunikat sukcesu
   - Komponenty: Form, Input.Password, Button, Toasty

5. **Dashboard / Lista Tematów** (`/` lub `/topics`)
   - Cel: przegląd tematów użytkownika
   - Zawartość: karty tematów (nazwa + badge), przycisk nowego tematu
   - Komponenty: Sidebar, TopicCard, Button, Skeleton
   - UX: staggered load animation, responsywność

6. **Widok Tematu** (`/topics/:topicId`)
   - Cel: zarządzanie fiszkami w temacie
   - Zawartość: tytuł z edycją, akcje Generuj AI, Dodaj ręcznie, Ucz się, lista fiszek
   - Komponenty: FlashcardList, FlashcardItem, Modals (AIGenerationFlow, ManualFlashcardForm), Badge, Button
   - UX: kliknięcie Przód wysuwa Tył (inset shadow), menu kontekstowe desktop, responsywne

7. **Tryb nauki (Spaced Repetition)** (`/topics/:topicId/learn`)
   - Cel: przeprowadzenie sesji nauki
   - Zawartość: karta do obracania (front/back), przyciski oceny dostarczone przez bibliotekę SR
   - Komponenty: LearnCard, SRButtons, Animacja obrotu, aria-live

8. **Ustawienia Konta** (`/settings`)
   - Cel: zmiana hasła i usunięcie konta
   - Zawartość: formularz zmiany hasła, przycisk usunięcia konta, informacja o soft delete
   - Komponenty: Form, Dialog, Button, Toasty
   - Bezpieczeństwo: potwierdzenie hasła przy usunięciu

## 3. Mapa podróży użytkownika

- Brak sesji:
  - /login → (logowanie) → Dashboard
  - opcjonalnie /register lub /forgot-password
- Po zalogowaniu:
  - Dashboard → wybór Tematu → /topics/:topicId
  - Widok Tematu → Generuj AI / Dodaj ręcznie / Ucz się → powrót do widoku Tematu
  - Edycja nazwy → zapis → odświeżenie listy fiszek
- Globalnie:
  - Sidebar nawigacja → Dashboard, Tematy, Ustawienia, Wyloguj
  - Wygaśnięcie sesji → przekierowanie do /login + toast

## 4. Układ i struktura nawigacji

- **Sidebar** (Desktop: stały/zwijalny, Mobile: hamburger):
  - Logo "10xFlashcards" (gradient)
  - Linki: Dashboard(`/`), Moje Tematy(`/topics`), Ustawienia(`/settings`)
  - Button: Wyloguj
  - Stopka: Copywrite gradientowe
- **Główna zawartość** obok/below sidebar
- **Breadcrumbs/Link powrotny** na widoku Tematu
- **Modale** centralne z animacją fade

## 5. Kluczowe komponenty

- **Sidebar**: gradient header, link list, logout, footer
- **TopicCard**: nazwa + badge, skeleton
- **FlashcardItem**: front/back panel, inset shadow, corner radius, slide animation
- **AIGenerationFlow**: wieloetapowy modal (tekst → podgląd → zapis)
- **ManualFlashcardForm**: front/back fields, char counter, block
- **LearnCard**: obrót karty, SRButtons, aria-live
- **FormComponents**: Input, Button, Toasty, Spinner, Skeleton
- **Animation wrappers**: fade, slide, staggered
- **ZustandStore**: topics, flashcards, session
