# Plan Testów Projektu "10xFlashcards"

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji internetowej "10xFlashcards", służącej do tworzenia i nauki fiszek, z możliwością generowania ich przy użyciu sztucznej inteligencji. Projekt jest zbudowany w oparciu o Astro, React, TypeScript i Supabase. Plan ten ma na celu zapewnienie wysokiej jakości produktu końcowego poprzez systematyczne wykrywanie i eliminowanie błędów.

### 1.2. Cele Testowania

Główne cele testowania projektu "10xFlashcards" to:

*   **Weryfikacja funkcjonalności:** Zapewnienie, że wszystkie zaimplementowane funkcje działają zgodnie ze specyfikacją i oczekiwaniami użytkownika.
*   **Zapewnienie bezpieczeństwa:** Sprawdzenie mechanizmów uwierzytelniania, autoryzacji oraz ochrony danych użytkownika.
*   **Weryfikacja integralności danych:** Upewnienie się, że dane (użytkownicy, tematy, fiszki) są poprawnie przechowywane, modyfikowane i usuwane.
*   **Ocena użyteczności:** Sprawdzenie, czy interfejs użytkownika jest intuicyjny, łatwy w obsłudze i responsywny.
*   **Wykrywanie błędów:** Identyfikacja i raportowanie defektów w oprogramowaniu.
*   **Zapewnienie stabilności i niezawodności:** Sprawdzenie, czy aplikacja działa stabilnie pod różnymi warunkami i obciążeniem.
*   **Weryfikacja zgodności z wymaganiami:** Potwierdzenie, że aplikacja spełnia wszystkie zdefiniowane wymagania biznesowe i techniczne.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami:

*   **Moduł Uwierzytelniania:**
    *   Rejestracja nowego użytkownika.
    *   Logowanie istniejącego użytkownika.
    *   Wylogowywanie.
    *   Zmiana hasła.
    *   Usuwanie konta (miękkie usunięcie).
    *   Obsługa sesji użytkownika (ciasteczka, tokeny).
    *   Ochrona ścieżek aplikacji.
    *   Mechanizmy rate limiting dla operacji uwierzytelniania.
*   **Moduł Zarządzania Tematami:**
    *   Tworzenie nowego tematu.
    *   Wyświetlanie listy tematów (z paginacją i filtrowaniem).
    *   Usuwanie tematu (wraz z powiązanymi fiszkami).
    *   Wyświetlanie informacji o pustym stanie (brak tematów).
*   **Moduł Zarządzania Fiszkami:**
    *   Ręczne tworzenie nowej fiszki.
    *   Wyświetlanie listy fiszek w ramach tematu (z paginacją i filtrowaniem).
    *   Edycja istniejącej fiszki.
    *   Usuwanie fiszki.
    *   Odwracanie fiszki (front/back).
    *   Wyświetlanie informacji o pustym stanie (brak fiszek w temacie).
*   **Moduł Generowania Fiszek AI:**
    *   Wprowadzanie tekstu źródłowego i określanie liczby fiszek do wygenerowania.
    *   Proces generowania fiszek i obsługa stanu ładowania.
    *   Wyświetlanie podglądu wygenerowanych fiszek.
    *   Możliwość edycji i usuwania fiszek na etapie podglądu.
    *   Zapisywanie wygenerowanych i zmodyfikowanych fiszek.
    *   Logowanie operacji generowania AI.
*   **Interfejs Użytkownika (UI):**
    *   Nawigacja główna (Sidebar, MobileNavigation).
    *   Komponenty UI (modale, formularze, przyciski, wskaźniki ładowania, szkielety).
    *   System powiadomień (toasty).
    *   Responsywność interfejsu na różnych urządzeniach.
*   **API Backendowe:**
    *   Wszystkie endpointy API (`/api/auth/*`, `/api/topics/*`).
    *   Walidacja danych wejściowych (Zod).
    *   Poprawność odpowiedzi HTTP (statusy, format danych).
    *   Obsługa błędów.

### 2.2. Funkcjonalności nieobjęte testami (jeśli dotyczy):

*   Testy specyficzne dla infrastruktury Supabase (poza interakcją przez API).
*   Dogłębne testy wydajnościowe algorytmów AI (zakładamy, że są dostarczane przez zewnętrzną usługę lub są poza zakresem tego planu).
*   Testy penetracyjne (wymagają specjalistycznych narzędzi i wiedzy, mogą być realizowane osobno).

## 3. Typy Testów do Przeprowadzenia

*   **Testy Jednostkowe (Unit Tests):**
    *   **Cel:** Weryfikacja poprawności działania pojedynczych funkcji, komponentów React, hooków, logiki store'ów Zustand, schematów walidacji Zod, funkcji pomocniczych.
    *   **Zakres:**
        *   Funkcje walidujące w formularzach (np. `validatePassword`, `validateEmail`).
        *   Logika obliczeniowa (np. `calculatePasswordStrength`).
        *   Hooki React (np. `useFlashcards` - mockując `fetch`, `useModalState`, `useToast`).
        *   Akcje i selektory w store Zustand (`useTopicsStore` - mockując `fetch`).
        *   Funkcje pomocnicze (np. `cn` w `src/lib/utils.ts` - choć proste, warto mieć dla pokrycia).
        *   Schematy Zod dla żądań API i formularzy.
        *   Logika renderowania warunkowego w komponentach React.
*   **Testy Integracyjne (Integration Tests):**
    *   **Cel:** Weryfikacja poprawnej współpracy pomiędzy różnymi modułami i komponentami.
    *   **Zakres:**
        *   **Integracja Frontend-Backend (API):** Testowanie endpointów API poprzez wysyłanie żądań HTTP i weryfikację odpowiedzi. Kluczowe dla `src/pages/api/`. Mockowanie zależności bazy danych (Supabase) lub użycie testowej instancji.
        *   **Integracja Komponentów React:** Sprawdzanie, czy komponenty nadrzędne poprawnie komunikują się z komponentami podrzędnymi (np. `FlashcardsSection` z `FlashcardList` i modalem edycji).
        *   **Integracja Middleware:** Testowanie działania middleware (`src/middleware/index.ts`) w kontekście żądań do chronionych i niechronionych stron/API.
        *   **Integracja Store-Komponent:** Sprawdzanie, czy komponenty poprawnie reagują na zmiany w store Zustand i czy akcje wywołane z komponentów modyfikują store zgodnie z oczekiwaniami.
*   **Testy End-to-End (E2E Tests):**
    *   **Cel:** Symulacja rzeczywistych scenariuszy użytkownika, weryfikacja przepływów w całej aplikacji z perspektywy użytkownika.
    *   **Zakres:**
        *   Pełny cykl rejestracji, logowania i wylogowania.
        *   Tworzenie tematu, dodawanie fiszek (ręcznie i AI), nauka, usuwanie tematu/fiszek.
        *   Zmiana hasła.
        *   Usuwanie konta.
*   **Testy API:**
    *   **Cel:** Szczegółowa weryfikacja wszystkich endpointów API, ich logiki, walidacji, obsługi błędów i bezpieczeństwa.
    *   **Zakres:**
        *   Każdy endpoint w `src/pages/api/`.
        *   Testowanie różnych metod HTTP (GET, POST, PUT, DELETE).
        *   Walidacja schematów żądań i odpowiedzi.
        *   Testowanie autoryzacji (dostęp tylko dla zalogowanych, dostęp do własnych zasobów).
        *   Testowanie przypadków brzegowych i błędnych danych wejściowych.
        *   Testowanie rate limitingu.
*   **Testy Użyteczności (Usability Tests):**
    *   **Cel:** Ocena łatwości obsługi, intuicyjności i ogólnego doświadczenia użytkownika.
    *   **Zakres:** Przeprowadzenie testów z udziałem potencjalnych użytkowników (lub wewnętrznie) w celu zebrania feedbacku na temat przepływów, nawigacji, czytelności interfejsu.
*   **Testy Bezpieczeństwa:**
    *   **Cel:** Identyfikacja potencjalnych luk bezpieczeństwa.
    *   **Zakres:**
        *   Weryfikacja ochrony przed podstawowymi atakami (np. XSS poprzez wprowadzanie danych do formularzy - choć Astro/React mają wbudowane mechanizmy, warto sprawdzić).
        *   Testowanie uprawnień (czy użytkownik nie ma dostępu do danych innych użytkowników).
        *   Sprawdzenie bezpieczeństwa sesji (np. ważność tokenów, `HttpOnly`, `Secure`, `SameSite` dla ciasteczek).
        *   Testowanie logiki resetowania/zmiany hasła pod kątem bezpieczeństwa.
        *   Testowanie rate limitingu.
*   **Testy Wydajności (Performance Tests - podstawowe):**
    *   **Cel:** Identyfikacja wąskich gardeł i ocena responsywności aplikacji pod obciążeniem.
    *   **Zakres:**
        *   Czas odpowiedzi API dla list tematów/fiszek przy dużej ilości danych (z paginacją).
        *   Czas ładowania kluczowych stron.
        *   Czas generowania fiszek AI (jeśli jest to znaczący czynnik).
*   **Testy Kompatybilności (Cross-Browser/Cross-Device Tests):**
    *   **Cel:** Zapewnienie poprawnego działania aplikacji na różnych przeglądarkach i urządzeniach.
    *   **Zakres:** Testowanie na najpopularniejszych przeglądarkach (Chrome, Firefox, Safari, Edge) i urządzeniach (desktop, tablet, mobile).
*   **Testy Akceptacyjne Użytkownika (UAT - User Acceptance Tests):**
    *   **Cel:** Potwierdzenie przez klienta lub przedstawicieli użytkowników, że aplikacja spełnia ich wymagania i jest gotowa do wdrożenia.
    *   **Zakres:** Wykonanie predefiniowanych scenariuszy przez użytkowników końcowych.

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

Poniżej przedstawiono przykładowe, wysokopoziomowe scenariusze testowe. Każdy z nich powinien zostać rozwinięty w bardziej szczegółowe przypadki testowe.

### 4.1. Uwierzytelnianie

| ID Scenariusza | Opis Scenariusza                                      | Oczekiwany Rezultat                                                                                                | Priorytet |
| :------------- | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :-------- |
| AUTH_S01       | Poprawna rejestracja nowego użytkownika               | Użytkownik zostaje zarejestrowany, zalogowany i przekierowany na stronę główną (lub tematów). Profil użytkownika utworzony w DB. | Wysoki    |
| AUTH_S02       | Próba rejestracji z już istniejącym adresem email      | Wyświetlenie błędu "Ten adres email jest już używany". Użytkownik nie zostaje zarejestrowany.                      | Wysoki    |
| AUTH_S03       | Próba rejestracji z niepoprawnym formatem email/hasłem | Wyświetlenie odpowiednich błędów walidacji. Użytkownik nie zostaje zarejestrowany.                                  | Wysoki    |
| AUTH_S04       | Poprawne logowanie istniejącego użytkownika            | Użytkownik zostaje zalogowany i przekierowany na stronę główną. Ciasteczka sesji ustawione.                          | Wysoki    |
| AUTH_S05       | Próba logowania z niepoprawnymi danymi                 | Wyświetlenie błędu "Niepoprawny email lub hasło".                                                                    | Wysoki    |
| AUTH_S06       | Próba logowania przy przekroczonym limicie prób (rate limiting) | Wyświetlenie błędu "Zbyt wiele prób logowania. Spróbuj ponownie później". Dostęp zablokowany na określony czas. | Wysoki    |
| AUTH_S07       | Poprawne wylogowanie użytkownika                      | Użytkownik zostaje wylogowany, ciasteczka sesji usunięte, przekierowanie na stronę logowania.                        | Wysoki    |
| AUTH_S08       | Poprawna zmiana hasła                                 | Hasło użytkownika zostaje zmienione. Możliwość zalogowania nowym hasłem.                                             | Wysoki    |
| AUTH_S09       | Próba zmiany hasła z niepoprawnym obecnym hasłem       | Wyświetlenie błędu "Aktualne hasło jest nieprawidłowe".                                                              | Wysoki    |
| AUTH_S10       | Poprawne usunięcie konta (soft delete)                | Konto użytkownika oznaczone jako usunięte w DB. Użytkownik wylogowany, przekierowany z komunikatem o usunięciu.     | Wysoki    |
| AUTH_S11       | Próba usunięcia konta z niepoprawnym hasłem            | Wyświetlenie błędu o niepoprawnym haśle.                                                                             | Wysoki    |
| AUTH_S12       | Dostęp do chronionej strony bez zalogowania           | Użytkownik przekierowany na stronę logowania.                                                                      | Wysoki    |
| AUTH_S13       | Dostęp do strony logowania/rejestracji po zalogowaniu  | Użytkownik przekierowany na stronę główną.                                                                          | Średni    |
| AUTH_S14       | Automatyczne odświeżanie tokenu sesji                 | Sesja użytkownika pozostaje aktywna po wygaśnięciu tokenu dostępu dzięki odświeżeniu.                             | Wysoki    |

### 4.2. Zarządzanie Tematami

| ID Scenariusza | Opis Scenariusza                                      | Oczekiwany Rezultat                                                                                                 | Priorytet |
| :------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :-------- |
| TOPIC_S01      | Utworzenie nowego tematu z poprawną nazwą             | Temat zostaje utworzony i pojawia się na liście. Użytkownik przekierowany do nowego tematu.                         | Wysoki    |
| TOPIC_S02      | Próba utworzenia tematu z pustą nazwą/za długą nazwą  | Wyświetlenie błędu walidacji. Temat nie zostaje utworzony.                                                          | Wysoki    |
| TOPIC_S03      | Próba utworzenia tematu z nazwą już istniejącą u użytkownika | Wyświetlenie błędu "Temat o tej nazwie już istnieje". Temat nie zostaje utworzony.                               | Wysoki    |
| TOPIC_S04      | Wyświetlanie listy tematów użytkownika                 | Lista tematów użytkownika jest poprawnie wyświetlana (zgodnie z paginacją, sortowaniem, filtrowaniem).               | Wysoki    |
| TOPIC_S05      | Usunięcie tematu (z potwierdzeniem)                   | Temat zostaje usunięty z listy i z bazy danych. Powiązane fiszki również usunięte.                                  | Wysoki    |
| TOPIC_S06      | Anulowanie usuwania tematu w dialogu potwierdzającym  | Temat nie zostaje usunięty.                                                                                         | Średni    |
| TOPIC_S07      | Wyświetlanie komunikatu o braku tematów                | Gdy użytkownik nie ma tematów, wyświetlany jest odpowiedni komunikat i sugestia utworzenia nowego.                   | Średni    |

### 4.3. Zarządzanie Fiszkami (Ręczne)

| ID Scenariusza | Opis Scenariusza                                      | Oczekiwany Rezultat                                                                                                 | Priorytet |
| :------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :-------- |
| FLASH_S01      | Ręczne dodanie nowej fiszki z poprawnymi danymi       | Fiszka zostaje utworzona i pojawia się na liście fiszek danego tematu.                                                | Wysoki    |
| FLASH_S02      | Próba dodania fiszki z pustym frontem/tyłem           | Wyświetlenie błędu walidacji. Fiszka nie zostaje utworzona.                                                           | Wysoki    |
| FLASH_S03      | Próba dodania fiszki z za długim frontem/tyłem        | Wyświetlenie błędu walidacji. Fiszka nie zostaje utworzona.                                                           | Wysoki    |
| FLASH_S04      | Wyświetlanie listy fiszek w temacie                    | Lista fiszek jest poprawnie wyświetlana.                                                                            | Wysoki    |
| FLASH_S05      | Edycja istniejącej fiszki z poprawnymi danymi          | Treść fiszki zostaje zaktualizowana.                                                                                | Wysoki    |
| FLASH_S06      | Próba edycji fiszki z pustym frontem/tyłem            | Wyświetlenie błędu walidacji. Zmiany nie są zapisywane.                                                               | Wysoki    |
| FLASH_S07      | Usunięcie fiszki (z potwierdzeniem)                   | Fiszka zostaje usunięta z listy i z bazy danych.                                                                    | Wysoki    |
| FLASH_S08      | Odwrócenie fiszki (kliknięcie)                        | Fiszka odwraca się, pokazując drugą stronę.                                                                         | Średni    |
| FLASH_S09      | Wyświetlanie komunikatu o braku fiszek w temacie       | Gdy temat nie ma fiszek, wyświetlany jest odpowiedni komunikat i sugestia dodania/wygenerowania.                    | Średni    |
| FLASH_S10      | Próba dodania fiszki po przekroczeniu limitu na temat/dzień | Wyświetlenie odpowiedniego błędu. Fiszka nie zostaje utworzona.                                                    | Średni    |

### 4.4. Generowanie Fiszek AI

| ID Scenariusza | Opis Scenariusza                                                                 | Oczekiwany Rezultat                                                                                                              | Priorytet |
| :------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| AI_FLASH_S01   | Poprawne wygenerowanie fiszek AI na podstawie tekstu i liczby                      | Fiszki są generowane, wyświetlane w podglądzie. Log operacji AI zapisany.                                                          | Wysoki    |
| AI_FLASH_S02   | Próba generowania z za krótkim tekstem źródłowym                                  | Wyświetlenie błędu walidacji. Generowanie nie jest uruchamiane.                                                                    | Wysoki    |
| AI_FLASH_S03   | Próba generowania z niepoprawną (poza zakresem) liczbą fiszek                      | Wyświetlenie błędu walidacji. Generowanie nie jest uruchamiane.                                                                    | Wysoki    |
| AI_FLASH_S04   | Edycja wygenerowanej fiszki w podglądzie                                          | Zmiany są widoczne w podglądzie, fiszka oznaczona jako edytowana.                                                                   | Średni    |
| AI_FLASH_S05   | Usunięcie wygenerowanej fiszki w podglądzie                                       | Fiszka znika z podglądu.                                                                                                         | Średni    |
| AI_FLASH_S06   | Zapisanie wygenerowanych (i potencjalnie edytowanych) fiszek do tematu             | Fiszki są zapisywane w bazie danych i pojawiają się na liście fiszek tematu. Informacja o edycji przed zapisem jest zachowana.      | Wysoki    |
| AI_FLASH_S07   | Anulowanie/zamknięcie modala generowania AI przed zapisem (po wygenerowaniu)       | Fiszki nie są zapisywane.                                                                                                        | Średni    |
| AI_FLASH_S08   | Powrót z kroku podglądu do kroku wprowadzania danych                               | Użytkownik wraca do formularza wprowadzania tekstu, poprzednie dane (tekst, liczba) są zachowane.                                | Średni    |
| AI_FLASH_S09   | Obsługa błędu podczas komunikacji z API generującym fiszki                         | Wyświetlenie odpowiedniego komunikatu błędu użytkownikowi. Użytkownik pozostaje na kroku wprowadzania danych lub może spróbować ponownie. | Wysoki    |

## 5. Środowisko Testowe

*   **Środowisko deweloperskie (lokalne):** Do wczesnego testowania przez deweloperów, uruchamianie testów jednostkowych i integracyjnych.
*   **Środowisko stagingowe (testowe):** Odseparowana instancja aplikacji z własną bazą danych Supabase (lub kopią produkcyjnej zanonimizowanej). Powinno jak najwierniej odwzorowywać środowisko produkcyjne. Służy do przeprowadzania testów integracyjnych, E2E, UAT.
*   **Środowisko produkcyjne:** Testy dymne (smoke tests) po wdrożeniu nowej wersji.

**Konfiguracja przeglądarek:**

*   Najnowsze wersje Chrome, Firefox, Safari, Edge.
*   Narzędzia deweloperskie przeglądarek do inspekcji, debugowania i monitorowania żądań sieciowych.

**Urządzenia:**

*   Desktop (Windows, macOS).
*   Urządzenia mobilne (iOS, Android - symulatory i/lub fizyczne urządzenia).
*   Tablety (symulatory i/lub fizyczne urządzenia).

## 6. Narzędzia do Testowania

*   **Testy Jednostkowe:**
    *   **Framework:** Vitest (pasuje do ekosystemu Vite, którego używa Astro) lub Jest.
    *   **Biblioteka do asercji:** Wbudowana w Vitest/Jest.
    *   **Biblioteka do testowania komponentów React:** React Testing Library.
*   **Testy Integracyjne (API):**
    *   **Framework:** Vitest/Jest z wykorzystaniem `supertest` lub natywnego `fetch` do wysyłania żądań do API.
    *   **Mockowanie:** `msw` (Mock Service Worker) do mockowania żądań sieciowych (np. do Supabase, jeśli nie używamy testowej instancji).
*   **Testy E2E:**
    *   **Framework:** Playwright lub Cypress. Zapewniają możliwość interakcji z przeglądarką i symulacji działań użytkownika.
*   **Zarządzanie Testami i Raportowanie Błędów:**
    *   Narzędzia takie jak Jira, TestRail, Xray (jeśli budżet pozwala) lub prostsze rozwiązania (np. arkusze kalkulacyjne, GitHub Issues z odpowiednimi etykietami).
*   **Kontrola wersji:** Git, GitHub/GitLab/Bitbucket.
*   **CI/CD:** GitHub Actions, GitLab CI, Jenkins do automatycznego uruchamiania testów po każdym pushu/merge'u.

## 7. Harmonogram Testów

Harmonogram testów powinien być zintegrowany z cyklem rozwoju oprogramowania (np. sprinty w Agile).

*   **Testy jednostkowe:** Pisane na bieżąco przez deweloperów wraz z implementacją nowych funkcji.
*   **Testy integracyjne:** Pisane po zintegrowaniu kilku modułów lub po zakończeniu implementacji endpointu API.
*   **Testy E2E:** Rozwijane iteracyjnie dla kluczowych przepływów. Pełne cykle testów E2E przed każdym wydaniem.
*   **Testy regresji:** Przed każdym wydaniem, aby upewnić się, że nowe zmiany nie zepsuły istniejących funkcjonalności.
*   **Testy akceptacyjne (UAT):** Na końcowym etapie przed wdrożeniem na produkcję, po zakończeniu wewnętrznych testów.

**Przykładowy cykl testowy dla nowej funkcji:**

1.  Deweloper pisze kod i testy jednostkowe.
2.  Kod jest mergowany do gałęzi deweloperskiej/stagingowej.
3.  Automatyczne testy jednostkowe i integracyjne są uruchamiane przez CI/CD.
4.  Testerzy QA wykonują testy funkcjonalne, eksploracyjne i scenariusze E2E na środowisku stagingowym.
5.  Błędy są raportowane i poprawiane.
6.  Po pomyślnym przejściu testów QA, przeprowadzane są UAT (jeśli dotyczy).
7.  Wdrożenie na produkcję, a następnie testy dymne.

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Rozpoczęcia Testów)

*   Zakończona implementacja testowanej funkcjonalności/modułu.
*   Dostępna dokumentacja techniczna i wymagania.
*   Przygotowane środowisko testowe.
*   Dostępne dane testowe.
*   Pomyślnie zakończone testy jednostkowe (jeśli dotyczy).

### 8.2. Kryteria Wyjścia (Zakończenia Testów)

*   Wykonanie wszystkich zaplanowanych przypadków testowych dla danego etapu.
*   Osiągnięcie wymaganego pokrycia kodu testami (np. 80% dla testów jednostkowych).
*   Naprawienie wszystkich krytycznych i wysokich błędów.
*   Zaakceptowalna liczba błędów o niższym priorytecie (zgodnie z ustaleniami z zespołem/klientem).
*   Przygotowany raport z testów.
*   Pomyślne przejście testów akceptacyjnych (jeśli dotyczy).

## 9. Role i Odpowiedzialności w Procesie Testowania

*   **Deweloperzy:**
    *   Pisanie i wykonywanie testów jednostkowych.
    *   Naprawianie błędów zgłoszonych przez testerów.
    *   Wsparcie testerów w zrozumieniu funkcjonalności i identyfikacji przyczyn błędów.
    *   Udział w testach integracyjnych.
*   **Inżynierowie QA / Testerzy:**
    *   Tworzenie i aktualizacja planu testów i przypadków testowych.
    *   Wykonywanie testów funkcjonalnych, integracyjnych, E2E, regresji, użyteczności.
    *   Raportowanie błędów i weryfikacja poprawek.
    *   Przygotowywanie danych testowych.
    *   Automatyzacja testów (jeśli dotyczy).
    *   Przygotowywanie raportów z testów.
*   **Product Owner / Manager Produktu:**
    *   Definiowanie wymagań i kryteriów akceptacji.
    *   Priorytetyzacja błędów.
    *   Udział w testach akceptacyjnych (UAT).
*   **DevOps (jeśli dotyczy):**
    *   Konfiguracja i utrzymanie środowisk testowych.
    *   Zarządzanie procesem CI/CD i automatyzacją testów.

## 10. Procedury Raportowania Błędów

Każdy znaleziony błąd powinien zostać zaraportowany w systemie do śledzenia błędów (np. Jira, GitHub Issues) i zawierać następujące informacje:

*   **ID Błędu:** Unikalny identyfikator.
*   **Tytuł:** Krótki, zwięzły opis problemu.
*   **Opis:** Szczegółowy opis błędu, w tym:
    *   Kroki do reprodukcji (dokładne i numerowane).
    *   Obserwowany rezultat.
    *   Oczekiwany rezultat.
*   **Środowisko:** Wersja aplikacji, przeglądarka, system operacyjny, urządzenie.
*   **Priorytet:** (np. Krytyczny, Wysoki, Średni, Niski) - określa wpływ błędu na działanie aplikacji i pilność naprawy.
*   **Stopień Poważności (Severity):** (np. Krytyczny, Poważny, Średni, Drobny) - określa techniczny wpływ błędu.
*   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi konsoli/sieciowe.
*   **Przypisany do:** Osoba odpowiedzialna za naprawę.
*   **Status:** (np. Nowy, Otwarty, W Trakcie, Do Weryfikacji, Zamknięty, Odrzucony).
*   **Wersja, w której znaleziono błąd.**
*   **Wersja, w której naprawiono błąd (po weryfikacji).**

**Cykl życia błędu:**

1.  **Nowy/Otwarty:** Błąd zgłoszony przez testera.
2.  **Analiza:** Product Owner/Deweloper analizuje błąd, ustala priorytet.
3.  **W Trakcie (Naprawy):** Deweloper pracuje nad poprawką.
4.  **Do Weryfikacji:** Deweloper zgłasza, że błąd został naprawiony. Tester weryfikuje poprawkę.
5.  **Zamknięty:** Poprawka zweryfikowana pomyślnie.
6.  **Ponownie Otwarty:** Jeśli poprawka nie działa lub jest niekompletna.
7.  **Odrzucony:** Jeśli zgłoszenie nie jest błędem, jest duplikatem lub nie będzie naprawiane.