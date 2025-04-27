# Dokument wymagań produktu (PRD) - FlashcardMaster

## 1. Przegląd produktu

FlashcardMaster to aplikacja webowa zaprojektowana, aby umożliwić użytkownikom, głównie studentom, szybkie i efektywne tworzenie fiszek edukacyjnych. Aplikacja rozwiązuje problem czasochłonnego, manualnego tworzenia fiszek, oferując funkcję generowania ich za pomocą AI na podstawie dostarczonego tekstu. Użytkownicy mogą również tworzyć fiszki ręcznie. Fiszki są organizowane w ramach "Tematów" tworzonych przez użytkownika. Aplikacja zawiera standardowe funkcje zarządzania kontem użytkownika oraz integruje się z zewnętrzną biblioteką do nauki metodą powtarzania w odstępach (Spaced Repetition - SR). Celem wersji MVP jest dostarczenie podstawowych funkcji tworzenia, zarządzania i nauki fiszek, ze szczególnym naciskiem na usprawnienie procesu tworzenia dzięki AI.

## 2. Problem użytkownika

Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest procesem czasochłonnym i żmudnym. Ten wysiłek często zniechęca potencjalnych użytkowników do korzystania z fiszek jako narzędzia nauki, mimo udowodnionej skuteczności metody Spaced Repetition, która na nich bazuje. Brak efektywnego sposobu szybkiego generowania fiszek stanowi barierę w adopcji tej metody nauki.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontem użytkownika
- Rejestracja użytkownika za pomocą adresu e-mail i hasła.
- Logowanie użytkownika za pomocą adresu e-mail i hasła.
- Funkcja "Zapomniałem hasła" umożliwiająca reset hasła.
- Możliwość zmiany hasła przez zalogowanego użytkownika.
- Możliwość usunięcia konta przez użytkownika (soft delete z opcją odzyskania przez support).

### 3.2. Zarządzanie Tematami
- Tworzenie nowego Tematu poprzez podanie jego nazwy.
- Edycja nazwy istniejącego Tematu.
- Usuwanie Tematu (powoduje kaskadowe usunięcie wszystkich powiązanych fiszek).

### 3.3. Generowanie fiszek przez AI
- Uruchomienie procesu generowania z poziomu widoku Tematu.
- Okno dialogowe do wklejenia tekstu (limit 1000-10000 znaków) i podania żądanej liczby fiszek (limit 1-20).
- Wykorzystanie modeli AI o3-mini lub o4-mini (przez API OpenRouter/OpenAI).
- Generowanie fiszek w formacie Pytanie-Odpowiedź lub Definicja-Termin.
- Limit znaków dla strony "Przód" (Front) i "Tył" (Back) fiszki: 500 znaków.
- Podgląd wygenerowanych fiszek przed zapisaniem.
- Możliwość edycji treści ("Przód", "Tył") pojedynczych fiszek w widoku podglądu.
- Możliwość usunięcia pojedynczych fiszek w widoku podglądu.
- Zapisanie wybranych (nieusuniętych) fiszek do bieżącego Tematu jednym przyciskiem.
- Oznaczanie fiszek flagą `isAiGenerated = true`.
- Oznaczanie fiszek edytowanych w podglądzie flagą `wasEditedBeforeSave = true`.
- Wizualne wskaźniki postępu podczas generowania.
- Obsługa błędów API AI i informowanie użytkownika.
- Oczekiwany czas generowania: ~1-2 sekundy na fiszkę.

### 3.4. Manualne tworzenie fiszek
- Uruchomienie procesu tworzenia z poziomu widoku Tematu.
- Okno dialogowe z polami tekstowymi "Przód" i "Tył".
- Limit znaków dla strony "Przód" i "Tył": 500 znaków.
- Walidacja limitu znaków po stronie klienta i serwera.
- Zapisanie fiszki do bieżącego Tematu.
- Oznaczanie fiszek flagą `isAiGenerated = false`.

### 3.5. Zarządzanie fiszkami
- Przeglądanie listy fiszek w ramach wybranego Tematu.
- Wyraźne oznaczenie fiszek generowanych przez AI i tworzonych manualnie.
- Edycja treści ("Przód", "Tył") istniejących fiszek (po zapisaniu). Edycja nie zmienia flag `isAiGenerated` i `wasEditedBeforeSave`. Aktualizuje datę modyfikacji.
- Usuwanie pojedynczych fiszek.

### 3.6. Integracja Spaced Repetition (SR)
- Wykorzystanie zewnętrznej biblioteki SR.
- Przycisk "Ucz się" w widoku Tematu inicjujący sesję nauki dla fiszek z tego tematu.
- Interfejs nauki prezentujący "Przód" fiszki, a następnie "Tył".
- Mechanizmy oceny odpowiedzi użytkownika dostarczane przez bibliotekę SR (np. przyciski "Łatwe", "Trudne", "Powtórz").
- Animacje interfejsu (np. obrót fiszki).
- Aktualizacja parametrów SR (np. data następnej powtórki, interwał) dla fiszki po ocenie.

### 3.7. Interfejs użytkownika (UI)
- Implementacja docelowego wyglądu kart fiszek (wypukła góra, wklęsły dół, rozwijane opcje).
- Wizualna sygnalizacja błędów walidacji pól tekstowych (np. czerwona ramka, komunikat, zablokowany przycisk zapisu).

### 3.8. Logowanie i Metryki
- Logowanie każdej próby generowania fiszek przez AI (ID próby, ID użytkownika, ID tematu, timestamp, żądana liczba fiszek, hash tekstu wejściowego, liczba faktycznie wygenerowanych fiszek, liczba zapisanych fiszek, status powodzenia/błędu). Tekst wejściowy nie jest logowany, tylko jego hash.
- Poprawne ustawianie flag `isAiGenerated` i `wasEditedBeforeSave` na fiszkach.

## 4. Granice produktu

### 4.1. Co wchodzi w zakres MVP
- Generowanie fiszek przez AI na podstawie wklejonego tekstu.
- Manualne tworzenie fiszek.
- Przeglądanie, edycja i usuwanie fiszek i tematów.
- Podstawowy system kont użytkowników (email/hasło) do przechowywania danych.
- Integracja z gotową, zewnętrzną biblioteką algorytmu powtórek (SR).
- Aplikacja webowa dostępna przez przeglądarkę.

### 4.2. Co NIE wchodzi w zakres MVP
- Rozbudowany, własny algorytm powtórek (jak np. w SuperMemo czy Anki).
- Import fiszek z plików w różnych formatach (np. PDF, DOCX, CSV).
- Funkcje społecznościowe (np. współdzielenie zestawów fiszek, komentowanie).
- Integracje z zewnętrznymi platformami edukacyjnymi lub innymi narzędziami.
- Dedykowane aplikacje mobilne (iOS, Android).
- Zaawansowane formatowanie tekstu na fiszkach (np. Markdown, obrazy).
- Tryb offline.

## 5. Historyjki użytkowników

### 5.1. Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji używając mojego adresu e-mail i hasła, abym mógł zapisywać swoje fiszki.
- Kryteria akceptacji:
    - Mogę wprowadzić adres e-mail i hasło w formularzu rejestracji.
    - Hasło musi spełniać minimalne wymagania bezpieczeństwa (np. długość).
    - System sprawdza, czy e-mail nie jest już zarejestrowany.
    - Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do głównego widoku aplikacji (np. lista tematów).
    - Otrzymuję komunikat o błędzie, jeśli e-mail jest już zajęty lub dane są nieprawidłowe.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji używając mojego adresu e-mail i hasła, abym mógł uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:
    - Mogę wprowadzić zarejestrowany adres e-mail i hasło w formularzu logowania.
    - Po pomyślnym zalogowaniu jestem przekierowany do głównego widoku aplikacji.
    - Otrzymuję komunikat o błędzie, jeśli dane logowania są nieprawidłowe.

- ID: US-003
- Tytuł: Odzyskiwanie zapomnianego hasła
- Opis: Jako zarejestrowany użytkownik, który zapomniał hasła, chcę móc zainicjować proces resetowania hasła, abym mógł odzyskać dostęp do konta.
- Kryteria akceptacji:
    - Mogę wprowadzić mój adres e-mail na stronie "Zapomniałem hasła".
    - Jeśli e-mail istnieje w systemie, otrzymuję na niego wiadomość z linkiem do resetowania hasła.
    - Link do resetowania hasła jest ważny przez określony czas.
    - Po kliknięciu w link mogę ustawić nowe hasło.
    - Nowe hasło musi spełniać minimalne wymagania bezpieczeństwa.
    - Po pomyślnym ustawieniu nowego hasła mogę się nim zalogować.

- ID: US-004
- Tytuł: Zmiana hasła przez zalogowanego użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc zmienić swoje hasło w ustawieniach konta, aby zwiększyć bezpieczeństwo.
- Kryteria akceptacji:
    - Mogę przejść do sekcji ustawień konta.
    - Muszę podać swoje aktualne hasło oraz nowe hasło (dwa razy).
    - Nowe hasło musi spełniać minimalne wymagania bezpieczeństwa.
    - Po pomyślnej zmianie hasła otrzymuję potwierdzenie.
    - Stare hasło przestaje być ważne.

- ID: US-005
- Tytuł: Usuwanie konta użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc usunąć swoje konto, jeśli nie chcę już korzystać z aplikacji.
- Kryteria akceptacji:
    - Mogę znaleźć opcję usunięcia konta w ustawieniach.
    - Muszę potwierdzić chęć usunięcia konta (np. wpisując hasło).
    - Po potwierdzeniu moje konto jest oznaczane jako usunięte (soft delete).
    - Nie mogę się już zalogować na usunięte konto.
    - Moje dane (tematy, fiszki) nie są od razu trwale usuwane, ale stają się niedostępne.
    - Informacja o możliwości odzyskania konta przez kontakt z supportem jest widoczna.

### 5.2. Zarządzanie Tematami

- ID: US-006
- Tytuł: Tworzenie nowego Tematu
- Opis: Jako zalogowany użytkownik, chcę móc stworzyć nowy Temat podając jego nazwę, abym mógł w nim grupować fiszki.
- Kryteria akceptacji:
    - Widzę przycisk/opcję do tworzenia nowego Tematu.
    - Mogę wprowadzić nazwę dla nowego Tematu (np. w oknie dialogowym).
    - Nazwa tematu nie może być pusta.
    - Po utworzeniu nowy Temat pojawia się na liście moich tematów.
    - Jestem przekierowany do widoku nowo utworzonego Tematu.

- ID: US-007
- Tytuł: Przeglądanie listy Tematów
- Opis: Jako zalogowany użytkownik, chcę widzieć listę wszystkich moich Tematów, abym mógł wybrać, z którym chcę pracować.
- Kryteria akceptacji:
    - Po zalogowaniu widzę listę moich Tematów.
    - Każdy temat na liście ma widoczną nazwę.
    - Mogę kliknąć na nazwę tematu, aby przejść do jego widoku (listy fiszek).

- ID: US-008
- Tytuł: Edycja nazwy Tematu
- Opis: Jako zalogowany użytkownik, chcę móc zmienić nazwę istniejącego Tematu, abym mógł lepiej go opisać.
- Kryteria akceptacji:
    - W widoku tematu widzę opcję edycji nazwy.
    - Mogę wprowadzić nową nazwę dla Tematu.
    - Nowa nazwa nie może być pusta.
    - Po zapisaniu zmian widzę zaktualizowaną nazwę Tematu.

- ID: US-009
- Tytuł: Usuwanie Tematu
- Opis: Jako zalogowany użytkownik, chcę móc usunąć istniejący Temat wraz ze wszystkimi jego fiszkami, jeśli już go nie potrzebuję.
- Kryteria akceptacji:
    - W widoku listy tematów lub w widoku tematu widzę opcję usunięcia tematu.
    - Muszę potwierdzić chęć usunięcia Tematu (np. w oknie dialogowym).
    - Po potwierdzeniu Temat znika z listy moich tematów.
    - Wszystkie fiszki należące do tego Tematu są usuwane (kaskadowo).

### 5.3. Generowanie Fiszek AI

- ID: US-010
- Tytuł: Inicjowanie generowania fiszek AI
- Opis: Jako zalogowany użytkownik, będąc w widoku konkretnego Tematu, chcę móc rozpocząć proces generowania fiszek przez AI, abym mógł szybko stworzyć materiały do nauki.
- Kryteria akceptacji:
    - W widoku Tematu widzę przycisk "Generuj fiszki AI" (lub podobny).
    - Kliknięcie przycisku otwiera okno dialogowe do generowania fiszek.

- ID: US-011
- Tytuł: Wprowadzanie danych do generowania AI
- Opis: Jako użytkownik, w oknie dialogowym generowania AI, chcę móc wkleić tekst źródłowy i określić, ile fiszek ma zostać wygenerowanych, aby dostarczyć AI potrzebne dane.
- Kryteria akceptacji:
    - Widzę pole tekstowe do wklejenia tekstu (textarea).
    - Widzę pole do wprowadzenia liczby fiszek (np. input typu number).
    - Pole tekstowe ma limit znaków (1000-10000), a jego przekroczenie jest sygnalizowane i uniemożliwia kontynuację.
    - Pole liczby fiszek (dropdown lub numeric) ma limit (5-20), a jego przekroczenie lub wprowadzenie nieprawidłowej wartości jest sygnalizowane i uniemożliwia kontynuację.
    - Widzę przycisk "Generuj".

- ID: US-012
- Tytuł: Proces generowania i podgląd fiszek AI
- Opis: Jako użytkownik, po kliknięciu "Generuj", chcę widzieć wskaźnik postępu, a następnie podgląd wygenerowanych fiszek, abym mógł je przejrzeć przed zapisaniem.
- Kryteria akceptacji:
    - Po kliknięciu "Generuj" widzę wskaźnik ładowania/postępu.
    - Po zakończeniu generowania (oczekiwany czas ~1-2s/fiszkę) widzę listę wygenerowanych par Przód/Tył.
    - Widzę liczbę wygenerowanych fiszek.
    - W przypadku błędu generowania (np. problem z API AI, niepoprawny format odpowiedzi) widzę stosowny komunikat.

- ID: US-013
- Tytuł: Edycja fiszek AI przed zapisaniem
- Opis: Jako użytkownik, w widoku podglądu wygenerowanych fiszek AI, chcę móc edytować treść ("Przód", "Tył") poszczególnych fiszek, aby poprawić ich jakość lub dostosować do moich potrzeb.
- Kryteria akceptacji:
    - Każda wygenerowana fiszka w podglądzie ma edytowalne pola "Przód" i "Tył".
    - Mogę zmodyfikować tekst w tych polach.
    - Edycja podlega limitowi 500 znaków na pole, co jest walidowane wizualnie.
    - Fiszki edytowane w tym kroku zostaną oznaczone flagą `wasEditedBeforeSave = true` przy zapisie.

- ID: US-014
- Tytuł: Usuwanie fiszek AI przed zapisaniem
- Opis: Jako użytkownik, w widoku podglądu wygenerowanych fiszek AI, chcę móc usunąć poszczególne fiszki, które uważam za nieprzydatne lub błędne.
- Kryteria akceptacji:
    - Każda wygenerowana fiszka w podglądzie ma opcję usunięcia (np. ikonka kosza).
    - Kliknięcie opcji usuwa fiszkę z listy podglądu.
    - Usunięte fiszki nie zostaną zapisane.

- ID: US-015
- Tytuł: Zapisywanie zaakceptowanych fiszek AI
- Opis: Jako użytkownik, po przejrzeniu i ewentualnej edycji/usunięciu fiszek AI, chcę móc zapisać pozostałe fiszki do bieżącego Tematu jednym kliknięciem.
- Kryteria akceptacji:
    - Widzę przycisk "Zapisz" (lub podobny) w widoku podglądu.
    - Kliknięcie przycisku zapisuje wszystkie widoczne (nieusunięte) fiszki w bieżącym Temacie.
    - Zapisane fiszki mają ustawioną flagę `isAiGenerated = true`.
    - Fiszki edytowane przed zapisem mają dodatkowo ustawioną flagę `wasEditedBeforeSave = true`.
    - Po zapisaniu okno dialogowe generowania/podglądu zamyka się, a ja widzę zaktualizowaną listę fiszek w Temacie.
    - Proces logowania próby generowania AI jest zakończony (zapis liczby wygenerowanych i zapisanych fiszek).

### 5.4. Manualne Tworzenie Fiszek

- ID: US-016
- Tytuł: Inicjowanie manualnego tworzenia fiszki
- Opis: Jako zalogowany użytkownik, będąc w widoku konkretnego Tematu, chcę móc rozpocząć proces manualnego tworzenia nowej fiszki.
- Kryteria akceptacji:
    - W widoku Tematu widzę przycisk "Dodaj fiszkę ręcznie" (lub podobny).
    - Kliknięcie przycisku otwiera okno dialogowe do tworzenia fiszki.

- ID: US-017
- Tytuł: Wprowadzanie danych fiszki manualnej
- Opis: Jako użytkownik, w oknie dialogowym tworzenia manualnego, chcę móc wprowadzić tekst dla strony "Przód" i "Tył" fiszki.
- Kryteria akceptacji:
    - Widzę dwa pola tekstowe: "Przód" i "Tył".
    - Pola mają limit 500 znaków, co jest walidowane wizualnie (np. licznik znaków, czerwona ramka przy przekroczeniu).
    - Przycisk "Zapisz" jest nieaktywny, jeśli którekolwiek pole jest puste lub przekracza limit znaków.

- ID: US-018
- Tytuł: Zapisywanie fiszki manualnej
- Opis: Jako użytkownik, po wypełnieniu pól "Przód" i "Tył", chcę móc zapisać nową fiszkę do bieżącego Tematu.
- Kryteria akceptacji:
    - Kliknięcie aktywnego przycisku "Zapisz" zapisuje fiszkę w bieżącym Temacie.
    - Zapisana fiszka ma ustawioną flagę `isAiGenerated = false`.
    - Po zapisaniu okno dialogowe zamyka się, a ja widzę nową fiszkę na liście w Temacie.

### 5.5. Zarządzanie Istniejącymi Fiszkami

- ID: US-019
- Tytuł: Przeglądanie fiszek w Temacie
- Opis: Jako zalogowany użytkownik, po wejściu do Tematu, chcę widzieć listę wszystkich fiszek należących do tego Tematu.
- Kryteria akceptacji:
    - Widzę listę fiszek z ich treścią "Przód" i "Tył" (lub tylko "Przód" z opcją rozwinięcia).
    - Fiszki wygenerowane przez AI są wyraźnie oznaczone (np. ikonką, etykietą).
    - Lista jest scrollowalna, jeśli zawiera wiele fiszek.

- ID: US-020
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako zalogowany użytkownik, chcę móc edytować treść ("Przód", "Tył") zapisanej wcześniej fiszki (zarówno manualnej, jak i AI).
- Kryteria akceptacji:
    - Każda fiszka na liście ma opcję "Edytuj".
    - Kliknięcie "Edytuj" otwiera okno dialogowe z aktualną treścią fiszki w polach "Przód" i "Tył".
    - Mogę modyfikować treść w obu polach.
    - Edycja podlega limitowi 500 znaków na pole, co jest walidowane wizualnie.
    - Przycisk "Zapisz" jest aktywny tylko, jeśli pola nie są puste i nie przekraczają limitu.
    - Zapisanie zmian aktualizuje treść fiszki i jej datę modyfikacji (`updated_at`). Flagi `isAiGenerated` i `wasEditedBeforeSave` pozostają niezmienione.
    - Po zapisaniu okno dialogowe zamyka się, a ja widzę zaktualizowaną fiszkę na liście.

- ID: US-021
- Tytuł: Usuwanie istniejącej fiszki
- Opis: Jako zalogowany użytkownik, chcę móc usunąć pojedynczą, zapisaną fiszkę z Tematu, jeśli już jej nie potrzebuję.
- Kryteria akceptacji:
    - Każda fiszka na liście ma opcję "Usuń".
    - Muszę potwierdzić chęć usunięcia fiszki (np. w oknie dialogowym).
    - Po potwierdzeniu fiszka znika z listy w Temacie i jest usuwana z bazy danych.

### 5.6. Nauka (Spaced Repetition)

- ID: US-022
- Tytuł: Rozpoczynanie sesji nauki
- Opis: Jako zalogowany użytkownik, będąc w widoku Tematu, chcę móc rozpocząć sesję nauki dla fiszek z tego tematu.
- Kryteria akceptacji:
    - W widoku Tematu widzę przycisk "Ucz się".
    - Kliknięcie przycisku rozpoczyna sesję nauki, pobierając fiszki do powtórki z bieżącego tematu na podstawie algorytmu SR (np. te, których data następnej powtórki jest przeszła).
    - Jeśli nie ma fiszek do powtórki, widzę stosowny komunikat.

- ID: US-023
- Tytuł: Przeprowadzanie powtórki fiszki
- Opis: Jako użytkownik w trakcie sesji nauki, chcę widzieć najpierw stronę "Przód" fiszki, a następnie móc odsłonić stronę "Tył", aby sprawdzić swoją odpowiedź.
- Kryteria akceptacji:
    - Widzę stronę "Przód" bieżącej fiszki.
    - Widzę przycisk/opcję "Pokaż odpowiedź".
    - Kliknięcie "Pokaż odpowiedź" odsłania stronę "Tył" fiszki (np. poprzez animację obrotu karty).

- ID: US-024
- Tytuł: Ocenianie odpowiedzi i kontynuacja nauki
- Opis: Jako użytkownik, po zobaczeniu odpowiedzi ("Tył" fiszki), chcę móc ocenić, jak dobrze znałem odpowiedź, aby algorytm SR mógł zaplanować kolejną powtórkę.
- Kryteria akceptacji:
    - Po odsłonięciu strony "Tył" widzę przyciski oceny dostarczone przez bibliotekę SR (np. "Źle", "Trudno", "Dobrze", "Łatwo").
    - Wybranie oceny powoduje zaktualizowanie parametrów SR dla tej fiszki (np. interwał, współczynnik łatwości, data następnej powtórki) za pomocą biblioteki SR.
    - Po ocenie system automatycznie przechodzi do następnej fiszki do powtórki w ramach sesji lub kończy sesję, jeśli nie ma więcej fiszek.
    - Widzę informację o zakończeniu sesji nauki.

## 6. Metryki sukcesu

Kluczowe wskaźniki (KPI) dla oceny sukcesu MVP:

1.  Wskaźnik akceptacji fiszek generowanych przez AI:
    - Cel: >= 75%
    - Pomiar: Stosunek liczby fiszek zapisanych przez użytkownika (`savedCount`) do całkowitej liczby fiszek wygenerowanych przez AI (`generatedCount`) w ramach wszystkich prób generowania. Dane pochodzą z logów generowania AI.
    - Formuła: `SUM(savedCount) / SUM(generatedCount)`

2.  Odsetek fiszek stworzonych przy użyciu AI:
    - Cel: >= 75%
    - Pomiar: Stosunek liczby fiszek w całej bazie danych, które mają ustawioną flagę `isAiGenerated = true`, do całkowitej liczby fiszek w systemie.
    - Formuła: `COUNT(fiszki WHERE isAiGenerated = true) / COUNT(wszystkie fiszki)`

Dodatkowe metryki do monitorowania (niekoniecznie z celami w MVP):
- Średni czas generowania jednej fiszki przez AI.
- Liczba aktywnych użytkowników (dziennie/tygodniowo/miesięcznie).
- Średnia liczba tematów na użytkownika.
- Średnia liczba fiszek (ogółem, AI, manualnych) na użytkownika/temat.
- Częstotliwość rozpoczynania sesji nauki.
- Wskaźnik retencji użytkowników.
