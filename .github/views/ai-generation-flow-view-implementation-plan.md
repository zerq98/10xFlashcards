# Plan implementacji widoku Generowanie Fiszek AI

## 1. Przegląd
Widok generowania fiszek AI jest modalnym oknem dialogowym uruchamianym z poziomu widoku konkretnego tematu. Umożliwia użytkownikowi wprowadzenie tekstu źródłowego oraz żądanej liczby fiszek. Po stronie serwera, na podstawie tych danych, generowane są fiszki przy użyciu AI. Użytkownik otrzymuje podgląd wygenerowanych fiszek, gdzie może edytować ich treść (przód i tył) lub usuwać poszczególne fiszki. Finalnie, użytkownik może zapisać zmodyfikowany zestaw fiszek do bieżącego tematu.

## 2. Routing widoku
Widok nie posiada dedykowanej ścieżki URL. Jest to komponent modalny (React), który jest aktywowany i wyświetlany w kontekście widoku tematu (np. `/topics/:topicId`).

## 3. Struktura komponentów
```
AIGenerationModal (React)
  ├── GenerationInputStep (React)
  │     ├── textarea (tekst źródłowy)
  │     ├── input[type=number] (liczba fiszek)
  │     └── button (Generuj)
  ├── LoadingIndicator (React/Astro) (jeśli krok='generating' lub 'saving')
  └── GenerationPreviewStep (React)
        ├── EditableFlashcardPreviewItem[] (React) (lista fiszek)
        │     ├── textarea (przód - edytowalny)
        │     ├── textarea (tył - edytowalny)
        │     └── button (Usuń tę fiszkę)
        └── button (Zapisz do Tematu)
```

## 4. Szczegóły komponentów

### `AIGenerationModal`
- **Opis komponentu:** Główny komponent React zarządzający całym przepływem generowania fiszek AI. Kontroluje aktualny krok (wprowadzanie, generowanie, podgląd, zapis), zarządza stanem danych wejściowych, wygenerowanych fiszek, obsługuje wywołania API i komunikację z komponentami podrzędnymi. Renderuje odpowiedni komponent kroku.
- **Główne elementy HTML i komponenty dzieci:** Warunkowe renderowanie `GenerationInputStep`, `LoadingIndicator`, `GenerationPreviewStep`. Elementy UI dla modala (np. z shadcn/ui: Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter).
- **Obsługiwane zdarzenia:** `onOpenChange` (do zamknięcia modala), wewnętrzne przejścia między krokami, obsługa sukcesu/błędu z API.
- **Warunki walidacji:** Delegowane do `GenerationInputStep` i `EditableFlashcardPreviewItem`. Sam modal zarządza ogólnym stanem ładowania i błędów.
- **Typy:**
    - Props: `topicId: string`, `isOpen: boolean`, `onClose: () => void`, `onSaveSuccess: (newFlashcards: Flashcard[]) => void`
- **Propsy:** `topicId`, `isOpen`, `onClose`, `onSaveSuccess`.

### `GenerationInputStep`
- **Opis komponentu:** Komponent React reprezentujący pierwszy krok przepływu - formularz do wprowadzenia tekstu źródłowego i żądanej liczby fiszek.
- **Główne elementy HTML i komponenty dzieci:** `form`, `textarea` dla tekstu źródłowego, `input type="number"` dla liczby fiszek, przycisk "Generuj". Komponenty z shadcn/ui: Label, Textarea, Input, Button.
- **Obsługiwane zdarzenia:** `onChange` dla `textarea` i `input`, `onSubmit` dla formularza.
- **Warunki walidacji:**
    - Tekst źródłowy: wymagany, długość między 1000 a 10000 znaków.
    - Liczba fiszek: wymagana, wartość między 5 a 20.
    - Przycisk "Generuj" jest wyłączony, jeśli walidacja nie przechodzi.
- **Typy:**
    - Props: `initialText: string`, `initialCount: number`, `onSubmit: (text: string, count: number) => void`, `isLoading: boolean`
- **Propsy:** `initialText`, `initialCount`, `onSubmit`, `isLoading`.

### `GenerationPreviewStep`
- **Opis komponentu:** Komponent React wyświetlający listę wygenerowanych fiszek. Umożliwia użytkownikowi edycję treści każdej fiszki, usunięcie poszczególnych fiszek oraz zapisanie finalnej listy do tematu.
- **Główne elementy HTML i komponenty dzieci:** Lista komponentów `EditableFlashcardPreviewItem`, przycisk "Zapisz do Tematu". Komponenty z shadcn/ui: Button, ScrollArea (dla listy).
- **Obsługiwane zdarzenia:** Kliknięcie przycisku "Zapisz". Wewnętrznie obsługuje zdarzenia od `EditableFlashcardPreviewItem`.
- **Warunki walidacji:** Delegowane do `EditableFlashcardPreviewItem`. Przycisk "Zapisz" może być wyłączony, jeśli np. wszystkie fiszki zostaną usunięte lub któraś fiszka ma błąd walidacji.
- **Typy:**
    - Props: `previewFlashcards: GeneratedFlashcardPreviewViewModel[]`, `onSave: (flashcardsToSave: FlashcardToSaveDto[]) => void`, `onEditFlashcard: (localId: string, newFront: string, newBack: string) => void`, `onDeleteFlashcard: (localId: string) => void`, `isLoading: boolean`
- **Propsy:** `previewFlashcards`, `onSave`, `onEditFlashcard`, `onDeleteFlashcard`, `isLoading`.

### `EditableFlashcardPreviewItem`
- **Opis komponentu:** Komponent React reprezentujący pojedynczą, edytowalną fiszkę w kroku podglądu.
- **Główne elementy HTML i komponenty dzieci:** Dwa `textarea` (dla przodu i tyłu fiszki), przycisk "Usuń". Komponenty z shadcn/ui: Textarea, Button (variant="destructive" lub ikona).
- **Obsługiwane zdarzenia:** `onChange` dla `textarea` (z debouncingiem lub onBlur do aktualizacji stanu nadrzędnego), `onClick` dla przycisku "Usuń".
- **Warunki walidacji:**
    - Przód fiszki: maksymalnie 500 znaków.
    - Tył fiszki: maksymalnie 500 znaków.
    - Wizualne wskazanie przekroczenia limitu.
- **Typy:**
    - Props: `flashcard: GeneratedFlashcardPreviewViewModel`, `onEdit: (newFront: string, newBack: string) => void`, `onDelete: () => void`
- **Propsy:** `flashcard`, `onEdit`, `onDelete`.

### `LoadingIndicator`
- **Opis komponentu:** Prosty komponent (może być Astro lub React) wyświetlający animację ładowania lub tekst informujący o trwającym procesie (np. "Generowanie fiszek...", "Zapisywanie...").
- **Główne elementy HTML i komponenty dzieci:** Ikona spinnera, tekst.
- **Obsługiwane zdarzenia:** Brak.
- **Warunki walidacji:** Brak.
- **Typy:** Props: `message?: string`
- **Propsy:** `message` (opcjonalnie).

## 5. Typy

### DTO (Data Transfer Objects)
-   `GenerateFlashcardsRequestDto`:
    -   `sourceText: string` (Tekst źródłowy do generowania fiszek)
    -   `count: number` (Żądana liczba fiszek)
-   `GeneratedFlashcardDto`:
    -   `front: string` (Treść przodu wygenerowanej fiszki)
    -   `back: string` (Treść tyłu wygenerowanej fiszki)
-   `GenerationApiResponseDto`:
    -   `generationId: string` (ID sesji generowania, używane do zapisu)
    -   `flashcards: GeneratedFlashcardDto[]` (Tablica wygenerowanych fiszek)
-   `FlashcardToSaveDto`:
    -   `front: string` (Finalna treść przodu fiszki do zapisania)
    -   `back: string` (Finalna treść tyłu fiszki do zapisania)
    -   `wasEditedBeforeSave: boolean` (Flaga wskazująca, czy fiszka była edytowana w podglądzie)
-   `SaveGeneratedFlashcardsRequestDto`:
    -   `flashcards: FlashcardToSaveDto[]` (Tablica fiszek do zapisania)
-   `SaveGeneratedFlashcardsResponseDto`:
    -   `savedFlashcards: Flashcard[]` (Tablica zapisanych fiszek, pełny typ `Flashcard` z `src/types.ts`)

### ViewModel (dla stanu klienta w podglądzie)
-   `GeneratedFlashcardPreviewViewModel`:
    -   `localId: string` (Unikalny identyfikator po stronie klienta, np. UUID, do zarządzania listą w React i śledzenia zmian przed zapisem)
    -   `originalFront: string` (Oryginalna treść przodu z API)
    -   `originalBack: string` (Oryginalna treść tyłu z API)
    -   `currentFront: string` (Aktualna, potencjalnie edytowana treść przodu)
    -   `currentBack: string` (Aktualna, potencjalnie edytowana treść tyłu)
    -   `isEdited: boolean` (Wyliczana dynamicznie: `currentFront !== originalFront || currentBack !== originalBack`)
    -   `isMarkedForDeletion: boolean` (Flaga wskazująca, czy użytkownik oznaczył fiszkę do usunięcia z podglądu)

### `Flashcard` (z `src/types.ts` - dla referencji)
-   `id: string`
-   `front: string`
-   `back: string`
-   `topicId: string`
-   `userId: string`
-   `isAiGenerated: boolean`
-   `wasEditedBeforeSave?: boolean`
-   `createdAt: string`
-   `updatedAt: string`

## 6. Zarządzanie stanem
Główny stan przepływu będzie zarządzany w komponencie `AIGenerationModal` przy użyciu hooków React (`useState`, `useReducer` jeśli logika stanie się złożona).
Kluczowe stany:
-   `currentStep: 'input' | 'generating' | 'preview' | 'saving' | 'error'` (Aktualny krok w modalu)
-   `sourceText: string` (Wprowadzony tekst źródłowy)
-   `requestedCount: number` (Żądana liczba fiszek)
-   `generationId: string | null` (ID zwrócone przez API po generacji)
-   `previewFlashcards: GeneratedFlashcardPreviewViewModel[]` (Lista fiszek w podglądzie)
-   `errorMessage: string | null` (Komunikat błędu)
-   `isLoading: boolean` (Ogólna flaga ładowania dla operacji API)

Opcjonalnie, można rozważyć stworzenie customowego hooka `useAIGeneration`, który hermetyzuje logikę zarządzania stanem `previewFlashcards` oraz logikę wywołań API. Byłby on używany wewnątrz `AIGenerationModal` w celu uproszczenia komponentu i lepszej organizacji kodu.

## 7. Integracja API

### Generowanie fiszek
-   **Endpoint:** `POST /api/topics/:topicId/generate`
-   **Żądanie (`GenerateFlashcardsRequestDto`):** `{ sourceText: string, count: number }`
-   **Odpowiedź (`GenerationApiResponseDto`):** `{ generationId: string, flashcards: { front: string, back: string }[] }`
-   **Obsługa:** Wywołanie `fetch` z `AIGenerationModal`. Ustawienie `isLoading=true` i `currentStep='generating'`. Po sukcesie: przetworzenie odpowiedzi na `GeneratedFlashcardPreviewViewModel[]`, zapisanie `generationId`, zmiana `currentStep='preview'`. Po błędzie: ustawienie `errorMessage`, `currentStep='error'`.

### Zapisywanie fiszek
-   **Endpoint:** `POST /api/topics/:topicId/generate/:generationId/save`
-   **Żądanie (`SaveGeneratedFlashcardsRequestDto`):** `{ flashcards: { front: string, back: string, wasEditedBeforeSave: boolean }[] }` (filtrowane o `isMarkedForDeletion=false`; `isAiGenerated` będzie ustawione na serwerze na `true` dla tych fiszek).
-   **Odpowiedź (`SaveGeneratedFlashcardsResponseDto`):** `{ savedFlashcards: Flashcard[] }`
-   **Obsługa:** Wywołanie `fetch` z `AIGenerationModal`. Ustawienie `isLoading=true` i `currentStep='saving'`. Po sukcesie: wywołanie `onSaveSuccess` z zapisanymi fiszkami, zamknięcie modala (`onClose`), reset wewnętrznego stanu. Po błędzie: ustawienie `errorMessage`, `currentStep='error'`.

## 8. Interakcje użytkownika
-   **Otwarcie modala:** Użytkownik klika "Generuj fiszki AI" w widoku tematu. Modal się otwiera, pokazując `GenerationInputStep`.
-   **Wprowadzanie danych:** Użytkownik wkleja tekst, wybiera liczbę fiszek. Walidacja na bieżąco aktywuje/dezaktywuje przycisk "Generuj".
-   **Kliknięcie "Generuj":** Jeśli dane poprawne, rozpoczyna się ładowanie i wywołanie API. Po odpowiedzi, wyświetlany jest podgląd lub błąd.
-   **Edycja/Usuwanie w podglądzie:** Użytkownik modyfikuje lub usuwa fiszki. Zmiany są odzwierciedlane w stanie.
-   **Kliknięcie "Zapisz do Tematu":** Rozpoczyna się ładowanie i wywołanie API zapisu. Po sukcesie, modal się zamyka, a lista fiszek w temacie jest aktualizowana. W przypadku błędu, wyświetlany jest komunikat.
-   **Zamknięcie modala:** Reset stanu modala.

## 9. Warunki i walidacja

### `GenerationInputStep`
-   **Tekst źródłowy:** Wymagany. Długość 1000-10000 znaków.
    -   Komponent: `textarea`.
    -   Wpływ na UI: Komunikat błędu, czerwona ramka, przycisk "Generuj" nieaktywny.
-   **Liczba fiszek:** Wymagana. Wartość całkowita 5-20.
    -   Komponent: `input type="number"`.
    -   Wpływ na UI: Komunikat błędu, czerwona ramka, przycisk "Generuj" nieaktywny.

### `EditableFlashcardPreviewItem`
-   **Treść "Przód":** Maksymalnie 500 znaków.
    -   Komponent: `textarea`.
    -   Wpływ na UI: Wizualny licznik znaków, komunikat/stylizacja przy przekroczeniu.
-   **Treść "Tył":** Maksymalnie 500 znaków.
    -   Komponent: `textarea`.
    -   Wpływ na UI: Jak wyżej.

### Ogólne
-   Przycisk "Zapisz do Tematu" w `GenerationPreviewStep` powinien być nieaktywny, jeśli lista fiszek do zapisu jest pusta lub którakolwiek fiszka ma błędy walidacji.

## 10. Obsługa błędów
-   **Błędy walidacji klienta:** Komunikaty przy polach, dezaktywacja przycisków.
-   **Błędy API (sieciowe, serwera 5xx):** W `AIGenerationModal` ustawiany jest `errorMessage` i `currentStep='error'`. Wyświetlany jest ogólny komunikat błędu i opcja ponowienia/zamknięcia.
-   **Specyficzne błędy API AI:** Backend zwraca odpowiedni komunikat, który frontend wyświetla użytkownikowi.
-   **Przypadki brzegowe:**
    -   Brak wygenerowanych fiszek przez AI: `GenerationPreviewStep` wyświetla stosowny komunikat. Przycisk "Zapisz" nieaktywny.
    -   Użytkownik usuwa wszystkie fiszki w podglądzie: Przycisk "Zapisz" staje się nieaktywny.

## 11. Kroki implementacji
1.  **Definicja typów:** Stworzenie/aktualizacja plików `*.ts` z DTO i ViewModel.
2.  **Struktura komponentów (szkielety):** Utworzenie plików dla komponentów React z podstawową strukturą JSX i propsami.
3.  **Implementacja `GenerationInputStep`:** Formularz, inputy, walidacja, obsługa `onSubmit`, styling.
4.  **Implementacja `EditableFlashcardPreviewItem`:** Pola `textarea`, przycisk usuwania, walidacja, obsługa zdarzeń, styling.
5.  **Implementacja `GenerationPreviewStep`:** Renderowanie listy `EditableFlashcardPreviewItem`, przycisku "Zapisz", przekazywanie handlerów, styling.
6.  **Implementacja `AIGenerationModal` (logika rdzenia):** Zarządzanie stanem, przejścia między krokami, integracja z podkomponentami, logika wywołań API, obsługa odpowiedzi, renderowanie modala.
7.  **Styling i UI/UX:** Dopracowanie wyglądu, wskaźniki ładowania, komunikaty błędów.
8.  **Integracja z widokiem Tematu:** Dodanie przycisku "Generuj fiszki AI", kontrola stanu `isOpen` modala, przekazywanie `topicId` i `onSaveSuccess`.
9.  **Testowanie:** Jednostkowe, komponentów, E2E.
10. **Refaktoryzacja i optymalizacja:** Przegląd kodu, ewentualne wydzielenie custom hooka, optymalizacje.
