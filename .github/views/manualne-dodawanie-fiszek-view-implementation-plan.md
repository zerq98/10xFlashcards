# Plan implementacji widoku: Manualne Dodawanie Fiszek

## 1. Przegląd
Celem tego widoku jest umożliwienie użytkownikom manualnego dodawania nowych fiszek do wybranego tematu. Proces odbywa się poprzez dedykowany przycisk w widoku tematu, który otwiera modalne okno z formularzem. Formularz zawiera pola na "Przód" i "Tył" fiszki, z walidacją limitu znaków (500 na pole). Po pomyślnym zapisaniu, fiszka jest dodawana do listy w bieżącym temacie z flagą `isAiGenerated` ustawioną na `false`.

## 2. Routing widoku
Funkcjonalność manualnego dodawania fiszek jest częścią istniejącego widoku tematu, dostępnego pod ścieżką `/topics/:topicId`. Akcja dodawania inicjuje otwarcie modalnego okna, nie zmieniając głównej ścieżki URL.

## 3. Struktura komponentów
```
TopicView (Strona Astro / Komponent React)
  └── AddManualFlashcardButton (Komponent React)
      └── ManualFlashcardFormModal (Komponent React)
          └── ManualFlashcardForm (Komponent React)
              ├── TextareaField (Komponent React) - dla "Przód" (z licznikiem znaków)
              ├── TextareaField (Komponent React) - dla "Tył" (z licznikiem znaków)
              ├── Button (Komponent React) - "Zapisz"
              └── Button (Komponent React) - "Anuluj"
```

## 4. Szczegóły komponentów

### `AddManualFlashcardButton` (React)
- **Opis komponentu**: Prosty przycisk umieszczony w widoku tematu (`TopicView`), służący do otwarcia modala `ManualFlashcardFormModal`.
- **Główne elementy**: Element `<button>` (np. z biblioteki `shadcn/ui`).
- **Obsługiwane interakcje**:
    - `onClick`: Ustawia stan (np. w `TopicView` lub globalnym store) odpowiedzialny za otwarcie `ManualFlashcardFormModal`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Standardowe propsy przycisku.
- **Propsy**:
    - `onClick: () => void` (lub `onOpen: () => void`) - funkcja wywoływana po kliknięciu, inicjująca otwarcie modala.

### `ManualFlashcardFormModal` (React)
- **Opis komponentu**: Modalne okno dialogowe, które zawiera `ManualFlashcardForm`. Zarządza swoją widocznością na podstawie propsa `isOpen`.
- **Główne elementy**: Komponent modalny (np. `Dialog` z `shadcn/ui`), zawierający `ManualFlashcardForm`.
- **Obsługiwane interakcje**:
    - Zamknięcie modala (np. przez kliknięcie przycisku "X", "Anuluj" w formularzu, lub kliknięcie tła modala).
- **Obsługiwana walidacja**: Delegowana do `ManualFlashcardForm`.
- **Typy**:
    - `FlashcardViewModel` (zdefiniowany w sekcji 5. Typy)
- **Propsy**:
    - `isOpen: boolean` - Kontroluje widoczność modala.
    - `onClose: () => void` - Funkcja wywoływana przy próbie zamknięcia modala.
    - `topicId: string` - ID bieżącego tematu, przekazywane do `ManualFlashcardForm`.
    - `onFlashcardAdded: (newFlashcard: FlashcardViewModel) => void` - Callback wywoływany po pomyślnym dodaniu fiszki, przekazujący nową fiszkę do komponentu nadrzędnego.

### `ManualFlashcardForm` (React)
- **Opis komponentu**: Formularz do wprowadzania danych dla nowej fiszki. Zawiera pola tekstowe dla "Przód" i "Tył", liczniki znaków, oraz przyciski "Zapisz" i "Anuluj". Odpowiada za walidację pól i komunikację z API w celu zapisu fiszki.
- **Główne elementy**:
    - Dwa komponenty `TextareaField` (lub `textarea` z odpowiednią logiką) dla "Przód" i "Tył".
    - Liczniki znaków dla każdego pola tekstowego.
    - Przycisk "Zapisz" (`type="submit"`).
    - Przycisk "Anuluj".
- **Obsługiwane interakcje**:
    - `onChange` na polach tekstowych: aktualizacja stanu formularza, walidacja w czasie rzeczywistym.
    - `onSubmit` na formularzu: uruchomienie procesu zapisu fiszki.
    - `onClick` na przycisku "Anuluj": wywołanie `props.onCancel`.
- **Obsługiwana walidacja**:
    - Pole "Przód":
        - Wymagane (nie może być puste po usunięciu białych znaków).
        - Maksymalna długość: 500 znaków.
    - Pole "Tył":
        - Wymagane (nie może być puste po usunięciu białych znaków).
        - Maksymalna długość: 500 znaków.
    - Przycisk "Zapisz" jest nieaktywny, jeśli którekolwiek pole jest niepoprawne lub trwa proces wysyłania.
- **Typy**:
    - `FlashcardCreateRequestDTO` (zdefiniowany w sekcji 5. Typy)
    - `FlashcardViewModel` (zdefiniowany w sekcji 5. Typy)
    - `ApiError` (ogólny typ dla błędów API)
- **Propsy**:
    - `topicId: string` - ID bieżącego tematu.
    - `onSaveSuccess: (newFlashcard: FlashcardViewModel) => void` - Callback wywoływany po pomyślnym zapisaniu fiszki.
    - `onCancel: () => void` - Callback wywoływany po kliknięciu przycisku "Anuluj".

## 5. Typy

### `FlashcardCreateRequestDTO`
Służy do wysłania danych nowej fiszki do API.
```typescript
interface FlashcardCreateRequestDTO {
  front: string; // Treść przedniej strony fiszki, max 500 znaków
  back: string;  // Treść tylnej strony fiszki, max 500 znaków
}
```

### `FlashcardViewModel`
Reprezentuje fiszkę w interfejsie użytkownika, używany również jako typ odpowiedzi z API po utworzeniu fiszki.
```typescript
interface FlashcardViewModel {
  id: string;                 // UUID fiszki
  front: string;
  back: string;
  topicId: string;            // UUID tematu, do którego należy fiszka
  userId: string;             // UUID użytkownika, który stworzył fiszkę
  isAiGenerated: false;       // Dla manualnie dodanych zawsze false
  wasEditedBeforeSave: false; // Dla manualnie dodanych zawsze false
  createdAt: string;          // Data utworzenia w formacie ISO (np. "2023-10-26T08:30:00.000Z")
  updatedAt: string;          // Data ostatniej modyfikacji w formacie ISO
}
```

### `ManualFlashcardFormState` (stan wewnętrzny komponentu `ManualFlashcardForm`)
```typescript
interface ManualFlashcardFormState {
  front: string;
  back: string;
  frontError: string | null;
  backError: string | null;
  isSubmitting: boolean;
  apiError: string | null; // Ogólny błąd API
}
```

## 6. Zarządzanie stanem

- **Stan widoczności modala**: Zarządzany w komponencie nadrzędnym (`TopicView`) lub globalnym store (np. Zustand). Przekazywany do `ManualFlashcardFormModal` jako prop `isOpen`.
    - Przykład (Zustand store, jeśli potrzebny globalnie):
      ```typescript
      // stores/uiStore.ts
      import { create } from 'zustand';

      interface UIStore {
        isManualFlashcardModalOpen: boolean;
        openManualFlashcardModal: () => void;
        closeManualFlashcardModal: () => void;
      }

      export const useUIStore = create<UIStore>((set) => ({
        isManualFlashcardModalOpen: false,
        openManualFlashcardModal: () => set({ isManualFlashcardModalOpen: true }),
        closeManualFlashcardModal: () => set({ isManualFlashcardModalOpen: false }),
      }));
      ```
- **Stan formularza `ManualFlashcardForm`**: Zarządzany lokalnie w komponencie `ManualFlashcardForm` za pomocą `useState` lub `useReducer`. Obejmuje wartości pól `front` i `back`, komunikaty błędów dla tych pól (`frontError`, `backError`), flagę `isSubmitting` oraz ewentualny ogólny błąd API (`apiError`).
- **Niestandardowy hook `useFlashcardFormValidation` (opcjonalnie)**:
    - **Cel**: Hermetyzacja logiki walidacji dla pól formularza fiszki.
    - **Funkcjonalność**: Przyjmuje wartości `front` i `back`, zwraca `frontError`, `backError` oraz `isValid`.
    - **Użycie**: Wewnątrz `ManualFlashcardForm` do obsługi walidacji.
- **Niestandardowy hook `useCreateFlashcardApi` (opcjonalnie)**:
    - **Cel**: Hermetyzacja logiki wywołania API do tworzenia fiszki.
    - **Funkcjonalność**: Udostępnia funkcję `createFlashcard(topicId, data)`, oraz stany `isLoading`, `error`.
    - **Użycie**: Wewnątrz `ManualFlashcardForm` do obsługi wysyłki danych.

## 7. Integracja API

- **Endpoint**: `POST /api/topics/{topicId}/flashcards`
- **Metoda**: `POST`
- **Parametry ścieżki**:
    - `topicId: string` - ID tematu, do którego dodawana jest fiszka.
- **Ciało żądania (`Request Body`)**:
    - Typ: `FlashcardCreateRequestDTO`
    - Przykład: `{ "front": "Pytanie?", "back": "Odpowiedź." }`
- **Odpowiedź sukcesu (np. `201 Created`)**:
    - Typ: `FlashcardViewModel`
    - Przykład: `{ "id": "uuid-...", "front": "Pytanie?", "back": "Odpowiedź.", "topicId": "uuid-topic-...", ..., "isAiGenerated": false, ... }`
- **Odpowiedzi błędów**:
    - `400 Bad Request`: Błędy walidacji (np. przekroczony limit znaków, puste pola - jeśli walidacja serwerowa jest bardziej rygorystyczna lub klient ją ominął). Odpowiedź może zawierać szczegóły błędów.
    - `401 Unauthorized`: Użytkownik nie jest zalogowany.
    - `403 Forbidden`: Użytkownik nie ma uprawnień do dodawania fiszek do tego tematu.
    - `404 Not Found`: Temat o podanym `topicId` nie istnieje.
    - `500 Internal Server Error`: Ogólny błąd serwera.

## 8. Interakcje użytkownika

1.  **Otwarcie modala**:
    - Użytkownik klika przycisk "Dodaj fiszkę ręcznie" w widoku tematu.
    - Modal `ManualFlashcardFormModal` otwiera się, wyświetlając pusty `ManualFlashcardForm`.
2.  **Wprowadzanie danych**:
    - Użytkownik wpisuje tekst w pola "Przód" i "Tył".
    - Liczniki znaków aktualizują się na bieżąco.
    - Walidacja (puste pole, limit 500 znaków) odbywa się `onChange` lub `onBlur`.
    - Komunikaty o błędach i wizualne wskaźniki (np. czerwona ramka) pojawiają się przy niepoprawnych polach.
    - Przycisk "Zapisz" jest aktywny tylko wtedy, gdy oba pola są poprawne.
3.  **Anulowanie**:
    - Użytkownik klika przycisk "Anuluj" lub zamyka modal w inny sposób (np. klawisz Esc, kliknięcie tła).
    - Modal zamyka się, wprowadzone dane są tracone.
4.  **Zapisywanie**:
    - Użytkownik klika przycisk "Zapisz" (gdy jest aktywny).
    - Przycisk "Zapisz" staje się nieaktywny, może pojawić się wskaźnik ładowania (spinner).
    - Formularz wysyła żądanie `POST` do `/api/topics/{topicId}/flashcards`.
    - **Po sukcesie**:
        - Modal zamyka się.
        - Nowa fiszka (zwrócona przez API) jest dodawana do listy fiszek w widoku tematu (`TopicView`).
        - Może pojawić się komunikat toast o pomyślnym dodaniu fiszki.
    - **Po błędzie**:
        - Modal pozostaje otwarty (lub jest ponownie otwierany, jeśli błąd wystąpił po zamknięciu).
        - Wyświetlany jest komunikat o błędzie (np. w formularzu lub jako toast).
        - Przycisk "Zapisz" staje się ponownie aktywny (po zakończeniu próby wysłania).

## 9. Warunki i walidacja

- **Pole "Przód" (`front`)**:
    - **Warunek**: Musi zawierać treść (nie może być puste po usunięciu białych znaków).
    - **Walidacja**: Sprawdzane w `ManualFlashcardForm` przed wysłaniem i potencjalnie `onChange/onBlur`.
    - **Wpływ na UI**: Komunikat "Pole wymagane", czerwona ramka, blokada przycisku "Zapisz".
    - **Warunek**: Długość nie może przekraczać 500 znaków.
    - **Walidacja**: Sprawdzane w `ManualFlashcardForm`.
    - **Wpływ na UI**: Komunikat "Maksymalnie 500 znaków", czerwona ramka, blokada przycisku "Zapisz", licznik znaków zmieniający kolor.
- **Pole "Tył" (`back`)**:
    - Analogiczne warunki i walidacja jak dla pola "Przód".
- **Ogólna walidacja formularza**:
    - Przycisk "Zapisz" w `ManualFlashcardForm` jest aktywny (`enabled`) tylko wtedy, gdy oba pola (`front` i `back`) przechodzą walidację i nie trwa proces wysyłania (`isSubmitting === false`).

## 10. Obsługa błędów

- **Błędy walidacji klienta**: Obsługiwane bezpośrednio w `ManualFlashcardForm` poprzez wyświetlanie komunikatów przy polach i blokowanie przycisku "Zapisz".
- **Błędy sieciowe / API**:
    - **Stan ładowania**: Podczas wysyłania żądania do API, komponent `ManualFlashcardForm` powinien być w stanie `isSubmitting = true`. Przycisk "Zapisz" powinien być zablokowany, a na nim lub obok niego może pojawić się spinner.
    - **Błędy (np. 4xx, 5xx, brak sieci)**:
        - Przechwytywane w logice wysyłania żądania (np. w bloku `catch` dla `fetch` lub w obsłudze błędów biblioteki do zapytań HTTP).
        - Stan `isSubmitting` jest ustawiany z powrotem na `false`.
        - Komunikat o błędzie jest wyświetlany użytkownikowi. Może to być:
            - Ogólny komunikat w obrębie modala (np. "Nie udało się zapisać fiszki. Spróbuj ponownie.").
            - Bardziej szczegółowy komunikat, jeśli API zwraca informacje o błędzie (np. dla błędu walidacji serwera 400).
            - Toast wyświetlany globalnie.
        - W przypadku błędu walidacji serwera (400), jeśli to możliwe, błędy powinny być mapowane na konkretne pola formularza.
    - **Błąd 401/403**: Powinien być obsługiwany globalnie (np. przez interceptor API), przekierowując do logowania (401) lub wyświetlając komunikat o braku uprawnień i zamykając modal (403).

## 11. Kroki implementacji

1.  **Przygotowanie typów**: Zdefiniować `FlashcardCreateRequestDTO` i `FlashcardViewModel` w `src/types.ts` (lub odpowiednim pliku).
2.  **Implementacja `AddManualFlashcardButton`**:
    - Stworzyć komponent React.
    - Dodać logikę `onClick` do otwierania modala (np. poprzez zmianę stanu w `TopicView` lub wywołanie akcji w globalnym store).
3.  **Implementacja `ManualFlashcardFormModal`**:
    - Stworzyć komponent React używający komponentu modalnego z `shadcn/ui` (lub innego).
    - Przyjmować propsy `isOpen`, `onClose`, `topicId`, `onFlashcardAdded`.
    - Renderować wewnątrz `ManualFlashcardForm`.
4.  **Implementacja `ManualFlashcardForm`**:
    - Stworzyć komponent React.
    - Dodać lokalny stan dla pól formularza, błędów i stanu wysyłania (`ManualFlashcardFormState`).
    - Zaimplementować pola `<textarea>` dla "Przód" i "Tył" wraz z licznikami znaków.
    - Dodać logikę walidacji `onChange` i/lub `onBlur` dla obu pól (wymagane, max 500 znaków).
    - Wyświetlać komunikaty o błędach i odpowiednio stylizować pola.
    - Dodać przyciski "Zapisz" i "Anuluj". Przycisk "Zapisz" powinien być dynamicznie włączany/wyłączany.
    - Zaimplementować logikę `onSubmit`:
        - Zapobiec domyślnej akcji formularza.
        - Ustawić `isSubmitting = true`.
        - Wywołać API: `POST /api/topics/{props.topicId}/flashcards` z danymi z formularza.
        - Obsłużyć odpowiedź sukcesu: wywołać `props.onSaveSuccess(responseData)`, zresetować formularz, ustawić `isSubmitting = false`.
        - Obsłużyć odpowiedź błędu: ustawić `apiError`, ustawić `isSubmitting = false`.
    - Po kliknięciu "Anuluj", wywołać `props.onCancel`.
5.  **Integracja w `TopicView`**:
    - Dodać stan do zarządzania widocznością modala (np. `isAddFlashcardModalOpen`).
    - Dodać funkcję `handleFlashcardAdded` do aktualizacji listy fiszek po dodaniu nowej.
    - Umieścić `AddManualFlashcardButton` w odpowiednim miejscu.
    - Renderować `ManualFlashcardFormModal` przekazując odpowiednie propsy (`isOpen`, `onClose`, `topicId`, `onFlashcardAdded`).
6.  **Styling**: Zastosować Tailwind CSS zgodnie z wytycznymi projektu i `ui-plan.md`.
7.  **Testowanie**:
    - Testy jednostkowe dla logiki walidacji w `ManualFlashcardForm`.
    - Testy komponentów dla interakcji użytkownika (otwieranie modala, wypełnianie formularza, wyświetlanie błędów, wysyłanie).
    - (Opcjonalnie) Testy E2E dla całego przepływu.
8.  **Obsługa API (Backend)**: Upewnić się, że endpoint `POST /api/topics/{topicId}/flashcards` jest zaimplementowany na backendzie zgodnie z oczekiwaniami (przyjmuje `FlashcardCreateRequestDTO`, ustawia `isAiGenerated = false`, zwraca `FlashcardViewModel`).
