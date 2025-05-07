# Plan implementacji widoku Tematu

## 1. Przegląd
Widok Tematu umożliwia przegląd listy fiszek, edycję wybranej fiszki oraz usunięcie fiszki. Fiszki są oznaczone jako generowane przez AI lub dodane ręcznie.

## 2. Routing widoku
Ścieżka: `/topics/[topicId]`  
Implementacja: plik Astro `src/pages/topics/[topicId]/index.astro`

## 3. Struktura komponentów
TopicPage (Astro)
└── FlashcardsSection (React)
    ├── FlashcardList
    │   └── FlashcardItem (×n)
    ├── EditFlashcardModal
    └── DeleteConfirmationModal

## 4. Szczegóły komponentów

### TopicPage (Astro)
- Opis: Strona serwerowa Astro, pobiera `topicId` z params, renderuje wrapper i mountuje FlashcardsSection.
- Elementy: `<Layout>`, `<FlashcardsSection client:load topicId={params.topicId} />`
- Propsy: `topicId: string`

### FlashcardsSection
- Opis: Zarządza stanem listy i modali, wywołuje API.
- Elementy: FlashcardList, EditFlashcardModal, DeleteConfirmationModal
- Zdarzenia:  
  • mount → fetchFlashcards()  
  • onEdit(id) → openEditModal  
  • onDelete(id) → openDeleteModal
- Typy:  
  • FlashcardVM  
  • ApiResponse<FlashcardDTO[]>
- Hooki:  
  • useFlashcards(topicId)  
  • useModalState()

### FlashcardList
- Opis: Renders listę FlashcardItem.
- Elementy: map over `flashcards`
- Propsy:  
  • `flashcards: FlashcardVM[]`  
  • `onEdit(id: string)`  
  • `onDelete(id: string)`

### FlashcardItem
- Opis: Pojedyncza fiszka z flipem i akcjami.
- Elementy:  
  • Front/back panel (toggle flip)  
  • Ikona `AI` jeżeli `is_ai_generated`  
  • Button „Edytuj” → onEdit  
  • Button „Usuń” → onDelete
- Propsy:  
  • `flashcard: FlashcardVM`  
  • `onEdit(id: string)`  
  • `onDelete(id: string)`

### EditFlashcardModal
- Opis: Modal z formularzem edycji.
- Elementy: Form z polami `front`, `back`; licznik znaków; przycisk „Zapisz”
- Zdarzenia:  
  • onChange → walidacja length 1–500  
  • onSubmit → updateFlashcard(id, { front, back })
- Typy:  
  • `UpdateFlashcardRequestDTO`
- Propsy:  
  • `isOpen: boolean`  
  • `flashcard: FlashcardVM`  
  • `onSave(updated: FlashcardDTO)`  
  • `onClose()`

### DeleteConfirmationModal
- Opis: Modal potwierdzenia usunięcia.
- Elementy: Tekst potwierdzający; przyciski „Tak” / „Nie”
- Zdarzenia:  
  • onConfirm → deleteFlashcard(id)  
  • onCancel → onClose
- Propsy:  
  • `isOpen: boolean`  
  • `flashcardId: string`  
  • `onConfirm()`  
  • `onClose()`

## 5. Typy
- FlashcardVM = FlashcardDTO & { isFlipped: boolean }
- UpdateFlashcardRequestDTO = { front: string; back: string }
- ApiResponse<T> / ApiErrorResponse (z types.ts)

## 6. Zarządzanie stanem
- useFlashcards(topicId):  
  • `data: FlashcardVM[]`, `loading: boolean`, `error: Error | null`, `refetch()`
- useModalState():  
  • `isEditOpen`, `isDeleteOpen`, `selectedId`, `openEdit(id)`, `openDelete(id)`, `closeModals()`

## 7. Integracja API
- GET `/api/topics/${topicId}/flashcards` → parse ApiResponse<FlashcardDTO[]>
- PUT `/api/topics/${topicId}/flashcards/${id}` (body UpdateFlashcardRequestDTO) → ApiResponse<FlashcardDTO>
- DELETE `/api/topics/${topicId}/flashcards/${id}` → 204

## 8. Interakcje użytkownika
1. Wejście na stronę → spinner podczas fetch  
2. Lista fiszek wyświetlona → każda fiszka pokazuje front, ikona AI/manual  
3. Klik front → animacja flip  
4. Klik „Edytuj” → otwórz EditFlashcardModal  
5. Edycja pól → walidacja  
6. Klik „Zapisz” → spinner w modalu → aktualizacja listy  
7. Klik „Usuń” → otwórz DeleteConfirmationModal  
8. Potwierdź → spinner → usuń z listy

## 9. Warunki i walidacja
- `front` i `back`: wymagane, 1–500 znaków  
- `Zapisz` nieaktywny przy niespełnionych warunkach  
- Inline error messages + czerwona ramka

## 10. Obsługa błędów
- API errors → toast (np. React Hot Toast)  
- 401 → przekierowanie do `/login`  
- 404 → komunikat „Nie znaleziono fiszki”  
- Sieć → global retry/log

## 11. Kroki implementacji
1. Utworzyć plik Astro `src/pages/topics/[topicId]/index.astro` z Layout i FlashcardsSection client:load  
2. Zaimplementować hook `useFlashcards` w `src/hooks/useFlashcards.ts`  
3. Stworzyć komponent `FlashcardsSection.tsx`  
4. Stworzyć `FlashcardList.tsx` i `FlashcardItem.tsx`  
5. Zaimplementować `EditFlashcardModal.tsx` z formularzem i walidacją  
6. Zaimplementować `DeleteConfirmationModal.tsx`  
7. Dodać spinnery/loading skeletony (Tailwind + komponenty FormComponents)  
8. Podłączyć API calls i przetestować flow list–edit–delete  
9. Dodać testy jednostkowe (Jest + Testing Library) dla komponentów  
10. Sprawdzić dostępność (ARIA) i responsywność