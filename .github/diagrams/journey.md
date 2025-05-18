<user_journey_analysis>
## Analiza podróży użytkownika

### Ścieżki użytkownika wymienione w dokumentacji
1. **Rejestracja użytkownika** (US-001)
   - Wprowadzenie adresu e-mail i hasła
   - Spełnienie wymagań bezpieczeństwa hasła
   - Weryfikacja unikalności e-maila
   - Automatyczne logowanie po rejestracji
   - Przekierowanie do głównego widoku aplikacji

2. **Logowanie użytkownika** (US-002)
   - Wprowadzenie zarejestrowanego adresu e-mail i hasła
   - Weryfikacja danych logowania
   - Przekierowanie do głównego widoku aplikacji po sukcesie

3. **Odzyskiwanie zapomnianego hasła** (US-003)
   - Wprowadzenie adresu e-mail na stronie "Zapomniałem hasła"
   - Otrzymanie e-maila z linkiem do resetowania hasła
   - Ustawienie nowego hasła spełniającego wymagania bezpieczeństwa
   - Logowanie z nowym hasłem

4. **Zmiana hasła przez zalogowanego użytkownika** (US-004)
   - Dostęp do sekcji ustawień konta
   - Wprowadzenie aktualnego hasła oraz nowego hasła (dwukrotnie)
   - Weryfikacja poprawności aktualnego hasła
   - Potwierdzenie zmiany hasła

5. **Usuwanie konta użytkownika** (US-005)
   - Dostęp do opcji usunięcia konta w ustawieniach
   - Potwierdzenie chęci usunięcia konta (poprzez hasło)
   - Oznaczenie konta jako usunięte (soft delete)
   - Informacja o możliwości odzyskania konta przez kontakt z supportem

### Główne podróże i ich odpowiadające stany
1. **Proces Rejestracji**
   - Stan początkowy: Formularz rejestracji
   - Stany pośrednie: Walidacja danych, Tworzenie konta
   - Stany końcowe: Sukces (przekierowanie do panelu głównego) lub Błąd (ponowna próba)
   - Punkty decyzyjne: Poprawność danych formularza, Unikalność e-maila

2. **Proces Logowania**
   - Stan początkowy: Formularz logowania
   - Stany pośrednie: Weryfikacja danych
   - Stany końcowe: Sukces (przekierowanie do panelu głównego) lub Błąd (ponowna próba)
   - Punkty decyzyjne: Poprawność danych logowania

3. **Odzyskiwanie hasła**
   - Stan początkowy: Formularz przypomnienia hasła
   - Stany pośrednie: Wysłanie e-maila, Formularz resetowania, Walidacja tokenu
   - Stany końcowe: Sukces (przekierowanie do logowania) lub Błąd (wygaśnięcie tokenu)
   - Punkty decyzyjne: Istnienie e-maila w systemie, Ważność tokenu resetowania

4. **Zmiana hasła**
   - Stan początkowy: Formularz zmiany hasła
   - Stany pośrednie: Weryfikacja aktualnego hasła, Walidacja nowego hasła
   - Stany końcowe: Sukces (potwierdzenie zmiany) lub Błąd (niepoprawne hasło)
   - Punkty decyzyjne: Poprawność aktualnego hasła, Spełnienie wymagań przez nowe hasło

5. **Usuwanie konta**
   - Stan początkowy: Formularz usunięcia konta
   - Stany pośrednie: Potwierdzenie, Weryfikacja hasła
   - Stany końcowe: Sukces (wylogowanie i przekierowanie) lub Anulowanie (powrót do ustawień)
   - Punkty decyzyjne: Potwierdzenie przez użytkownika, Poprawność hasła

### Punkty decyzyjne i alternatywne ścieżki
1. **Dane formularza poprawne?** - rozgałęzienie na sukces/błąd w każdym formularzu
2. **E-mail istnieje w systemie?** - weryfikacja podczas logowania i resetu hasła
3. **Token resetu ważny?** - weryfikacja podczas procesu resetowania hasła
4. **Aktualne hasło poprawne?** - weryfikacja przy zmianie hasła i usuwaniu konta
5. **Użytkownik potwierdza akcję?** - potwierdzenie przy krytycznych operacjach

### Cel każdego stanu
1. **Formularze wprowadzania danych** - zbieranie niezbędnych informacji od użytkownika
2. **Stany walidacji** - zapewnienie poprawności i bezpieczeństwa operacji
3. **Stany weryfikacji tokenów** - potwierdzenie tożsamości użytkownika i ważności żądania
4. **Stany potwierdzenia/sukcesu** - informowanie użytkownika o powodzeniu operacji
5. **Stany błędu** - informowanie o problemach i umożliwienie ich naprawy
6. **Stany przekierowania** - nawigacja użytkownika do właściwego kontekstu po operacji
</user_journey_analysis>

<mermaid_diagram>
```mermaid
stateDiagram-v2
    [*] --> StronaGlowna
    
    StronaGlowna --> Rejestracja: Kliknięcie "Zarejestruj się"
    StronaGlowna --> Logowanie: Kliknięcie "Zaloguj się"
    
    state "Proces Rejestracji" as Rejestracja {
        [*] --> FormularzRejestracji
        FormularzRejestracji --> WalidacjaDanych: Przesłanie formularza
        
        state if_rejestracja <<choice>>
        WalidacjaDanych --> if_rejestracja: Walidacja
        if_rejestracja --> TworzenieKonta: Dane poprawne
        if_rejestracja --> FormularzRejestracji: Dane błędne
        
        TworzenieKonta --> WeryfikacjaEmail: Wysłanie emaila weryfikacyjnego
        WeryfikacjaEmail --> PanelGlowny: Przekierowanie do panelu
        
        note right of WeryfikacjaEmail
          Użytkownik zostaje zalogowany automatycznie
          po utworzeniu konta, może korzystać z aplikacji
          przed potwierdzeniem emaila
        end note
    }
    
    state "Proces Logowania" as Logowanie {
        [*] --> FormularzLogowania
        FormularzLogowania --> WeryfikacjaPoswiadczen: Przesłanie formularza
        
        state if_logowanie <<choice>>
        WeryfikacjaPoswiadczen --> if_logowanie: Weryfikacja
        if_logowanie --> PanelGlowny: Dane poprawne
        if_logowanie --> FormularzLogowania: Dane błędne
        
        FormularzLogowania --> OdzyskiwanieHasla: Kliknięcie "Zapomniałem hasła"
    }
    
    state "Odzyskiwanie Hasła" as OdzyskiwanieHasla {
        [*] --> FormularzPrzypomnienia
        FormularzPrzypomnienia --> WeryfikacjaEmaila: Przesłanie formularza
        
        state if_email <<choice>>
        WeryfikacjaEmaila --> if_email: Sprawdzenie
        if_email --> WyslanieEmailaReset: Email istnieje w systemie
        if_email --> PotwierdzenieWyslania: Email nie istnieje
        
        note right of PotwierdzenieWyslania
          Aplikacja nie informuje, czy email
          istnieje w systemie (względy bezpieczeństwa)
        end note
        
        WyslanieEmailaReset --> PotwierdzenieWyslania
        PotwierdzenieWyslania --> [*]
        
        [*] --> FormularzResetuHasla: Kliknięcie linku w emailu
        FormularzResetuHasla --> WeryfikacjaTokenu
        
        state if_token <<choice>>
        WeryfikacjaTokenu --> if_token
        if_token --> ZmianaHasla: Token ważny
        if_token --> TokenNieważny: Token wygasł lub nieprawidłowy
        
        ZmianaHasla --> WalidacjaNowegHasla
        
        state if_haslo <<choice>>
        WalidacjaNowegHasla --> if_haslo
        if_haslo --> PotwierdzeniePomyslnejZmiany: Hasło poprawne
        if_haslo --> ZmianaHasla: Hasło nie spełnia wymogów
        
        PotwierdzeniePomyslnejZmiany --> FormularzLogowania
        TokenNieważny --> FormularzPrzypomnienia
    }
    
    state "Panel Użytkownika" as PanelGlowny {
        [*] --> WidokTematow
        
        WidokTematow --> UstawieniaKonta: Kliknięcie "Ustawienia konta"
        
        state "Ustawienia Konta" as UstawieniaKonta {
            [*] --> OpcjeUstawien
            OpcjeUstawien --> ZmianaHaslaUzytkownika: Wybór "Zmień hasło"
            OpcjeUstawien --> UsuwanieKonta: Wybór "Usuń konto"
        }
        
        state "Zmiana Hasła" as ZmianaHaslaUzytkownika {
            [*] --> FormularzZmianyHasla
            FormularzZmianyHasla --> WeryfikacjaAktualnegoHasla: Przesłanie formularza
            
            state if_aktualne <<choice>>
            WeryfikacjaAktualnegoHasla --> if_aktualne
            if_aktualne --> WalidacjaNowychHasel: Aktualne hasło poprawne
            if_aktualne --> FormularzZmianyHasla: Aktualne hasło niepoprawne
            
            state if_nowe <<choice>>
            WalidacjaNowychHasel --> if_nowe
            if_nowe --> AktualizacjaHasla: Nowe hasło spełnia wymogi
            if_nowe --> FormularzZmianyHasla: Nowe hasło nie spełnia wymogów
            
            AktualizacjaHasla --> PotwierdzeniePomyślnejAktualizacji
            PotwierdzeniePomyślnejAktualizacji --> OpcjeUstawien
        }
        
        state "Usunięcie Konta" as UsuwanieKonta {
            [*] --> FormularzUsuniecia
            FormularzUsuniecia --> PotwierdzenieDzialania: Przesłanie formularza
            
            state if_potwierdzenie <<choice>>
            PotwierdzenieDzialania --> if_potwierdzenie
            if_potwierdzenie --> WeryfikacjaHaslaUsuniecie: Potwierdzono
            if_potwierdzenie --> OpcjeUstawien: Anulowano
            
            state if_haslo_usun <<choice>>
            WeryfikacjaHaslaUsuniecie --> if_haslo_usun
            if_haslo_usun --> SoftDeleteKonta: Hasło poprawne
            if_haslo_usun --> FormularzUsuniecia: Hasło niepoprawne
            
            SoftDeleteKonta --> Wylogowanie
            Wylogowanie --> StronaGlowna: Przekierowanie
            
            note right of SoftDeleteKonta
              Konto oznaczone jako usunięte,
              możliwe odzyskanie przez support
            end note
        }
    }
    
    PanelGlowny --> ProcessWylogowania: Kliknięcie "Wyloguj"
    ProcessWylogowania --> StronaGlowna: Przekierowanie
```
</mermaid_diagram>
