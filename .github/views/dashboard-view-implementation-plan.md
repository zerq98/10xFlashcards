# Plan implementacji widoku Dashboard

## 1. Przegląd
Widok Dashboard wyświetla listę tematów użytkownika z licznikiem fiszek, umożliwia tworzenie nowych tematów oraz usuwanie istniejących, z płynną obsługą loadingu i błędów.

## 2. Routing widoku
Ścieżki: `/` oraz `/topics` (oba prowadzą do tego samego komponentu DashboardPage).

## 3. Struktura komponentów
- Layout (Layout.astro)
  ├─ Sidebar (globalny)
  └─ ToastManager (globalny)
- DashboardPage (strona Astro + React)
  ├─ TopicList  
  │   ├─ SkeletonList (widok loadingu)  
  │   └─ TopicCard[]  
  ├─ NewTopicModal (shadcn/ui Dialog)  
  └─ ConfirmDeleteDialog (shadcn/ui Dialog)

## 4. Szczegóły komponentów

### DashboardPage
- Opis: główny kontener; pobiera dane, przekazuje do TopicList; zarządza otwarciem modali.
- Główne elementy: `<Sidebar />`, `<TopicList topics={...} />`, przycisk "Nowy Temat".
- Interakcje:
  - useEffect → fetchTopics
  - Klik „Nowy Temat” → open NewTopicModal
- Walidacja: brak.
- Typy:  
  - Props: brak  
  - Stany: topics: TopicDTO[], loading, error  

### TopicList
- Opis: renderuje listę tematów lub SkeletonList przy loadingu.
- Główne elementy: `<SkeletonList />` lub `topics.map(t => <TopicCard key=... />)`.
- Interakcje: brak.
- Walidacja: brak.
- Typy:  
  - Props: topics: TopicDTO[], loading: boolean  

### TopicCard
- Opis: karta tematu; pokazuje name i badge z liczbą fiszek.
- Główne elementy: `<Link to={`/topics/${id}`}>{name}</Link>`, `<Badge count={flashcardCount} />`, ikona kosza.
- Interakcje:
  - Klik nazwy → nawigacja.
  - Klik kosza → open ConfirmDeleteDialog z przekazanym id.
- Walidacja: brak.
- Typy:
  - Props: id: string; name: string; flashcardCount: number; onDelete(id): void  

### NewTopicModal
- Opis: modal (shadcn/ui Dialog) z formularzem tworzenia tematu.
- Główne elementy: `Dialog`, `DialogTrigger`, `DialogContent`, `<Form>` z polem name (shadcn/ui Input), `DialogFooter` z przyciskami Save/Cancel (shadcn/ui Button), `DialogClose`.
- Interakcje:
  - onSubmit → createTopic API; walidacja Zod (1-255 chars).
  - onSuccess → close modal, navigate `/topics/:newId`.
- Walidacja: nazwa wymagana, długość 1–255.
- Typy:
  - Props: isOpen: boolean; onClose(): void; onCreated(topic: TopicDTO): void  

### ConfirmDeleteDialog
- Opis: dialog (shadcn/ui Dialog) potwierdzenia usunięcia tematu.
- Główne elementy: `Dialog`, `DialogContent` z komunikatem tekstowym, `DialogFooter` z przyciskami Confirm/Cancel (shadcn/ui Button).
- Interakcje:
  - Confirm → deleteTopic API; loading spinner.
  - onSuccess → close modal, update store.
- Walidacja: brak.
- Typy:
  - Props: isOpen: boolean; topicId: string; onClose(): void; onDeleted(id: string): void  

### SkeletonList
- Opis: placeholdery karty podczas ładowania.
- Główne elementy: powtarzalne divy z klasą `animate-pulse`.
- Interakcje: brak.
- Walidacja: brak.
- Typy: brak props lub loading count.

## 5. Typy

```typescript
interface TopicDTO {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CreateTopicRequestDTO {
  name: string;
}

interface TopicsViewModel {
  topics: TopicDTO[];
  loading: boolean;
  error?: string;
}

interface NewTopicFormValues {
  name: string;
}
```

## 6. Zarządzanie stanem
- useTopicsStore (Zustand):  
  - state: topics[], loading, error  
  - actions: fetchTopics(), addTopic(topic), removeTopic(id)  
- useModal (custom): sterowanie otwarciem NewTopicModal i ConfirmDeleteDialog.  
- useToast (shadcn/ui) do komunikatów sukcesu/błędów.

## 7. Integracja API
- fetchTopics(): GET `/api/topics` → ApiSuccessResponse<{ data: TopicDTO[] }>  
- createTopic(body: CreateTopicRequestDTO): POST `/api/topics`  
- deleteTopic(id: string): DELETE `/api/topics/${id}`  
- Request i Response typowane zgodnie z types.ts.

## 8. Interakcje użytkownika
1. Wejście na Dashboard → skeletony → wyświetlenie TopicList.  
2. Klik „Nowy Temat” → otwarcie NewTopicModal.  
3. Wprowadzenie nazwy → walidacja → przycisk aktywny → klik → spinner → toast success i redirect.  
4. Klik ikony kosza przy TopicCard → ConfirmDeleteDialog.  
5. Confirm → spinner → usunięcie karty, success toast.

## 9. Warunki i walidacja
- Nazwa tematu: wymagane, 1–255 znaków (zod schema + react-hook-form).  
- Przycisk Save disabled gdy błąd walidacji.  
- Przy błędzie 401 → przekierowanie do `/login`.  
- 409 (duplikat) → wyświetlenie komunikatu „Temat o tej nazwie już istnieje”.

## 10. Obsługa błędów
- Błędy sieciowe i serwera (>=500) → toast „Wystąpił błąd, spróbuj ponownie”.  
- ValidationError → podświetlenie pola i komunikat pod inputem.  
- 401 → redirect `/login`.  
- 409 → „Temat o tej nazwie już istnieje”.

## 11. Kroki implementacji
1. Utwórz folder `src/pages/topics/index.astro` lub zmodyfikuj istniejący.  
2. W DashboardPage zaimplementuj fetchTopics w `onMount` (React) lub fetch w `getStaticProps`.  
3. Podłącz useTopicsStore, renderuj SkeletonList lub TopicList.  
4. Zaimplementuj TopicCard wg specyfikacji.  
5. Stwórz NewTopicModal: formularz z react-hook-form i Zod, obsłuż API call.  
6. Stwórz ConfirmDeleteDialog z natywnym confirm lub shadcn/ui Dialog.  
7. Dodaj useModal hook dla obu modali.  
8. Dodaj useToast do obu akcji.  
9. Dodaj testy jednostkowe z Jest dla NewTopicModal (walidacja, success, error).  
10. Dodaj e2e testy Playwright: przegląd listy, tworzenie, duplikat, usuwanie.  
11. Sprawdź accessibility: aria-label, focus trapping w modalu.  
12. Przegląd kodu, dokumentacja i merge.