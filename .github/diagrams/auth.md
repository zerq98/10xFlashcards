<authentication_analysis>
## Analiza przepływów autentykacji

### Przepływy autentykacji wymienione w dokumentacji
1. Rejestracja użytkownika za pomocą adresu e-mail i hasła
2. Logowanie użytkownika za pomocą adresu e-mail i hasła
3. Odzyskiwanie zapomnianego hasła
4. Zmiana hasła przez zalogowanego użytkownika
5. Usuwanie konta użytkownika
6. Ochrona tras (middleware protectRoute)
7. Odświeżanie tokenu (middleware przed wygaśnięciem)
8. Wylogowanie

### Główni aktorzy i ich interakcje
1. **Przeglądarka** - interfejs użytkownika, gdzie użytkownik wprowadza dane
2. **Middleware** - warstwa pośrednia weryfikująca tokeny i sesje
3. **Astro API** - obsługuje żądania i komunikuje się z Supabase
4. **Supabase Auth** - odpowiada za uwierzytelnianie i zarządzanie sesjami

### Procesy weryfikacji i odświeżania tokenów
1. **Weryfikacja tokenu dostępu** - sprawdzanie podczas każdego żądania chronionego zasobu
2. **Odświeżanie tokenu** - automatyczne odnowienie tokenu, gdy wygaśnie
3. **Walidacja sesji** - sprawdzenie czy sesja jest aktywna i powiązana z właściwym użytkownikiem
4. **Obsługa wygaśnięcia tokenu** - przekierowanie do ponownego logowania lub ciche odświeżenie
5. **Tokeny w cookies** - przechowywanie tokenów w bezpiecznych cookies HttpOnly

### Kroki autentykacji
1. **Rejestracja** - przesłanie danych rejestracyjnych, walidacja, utworzenie konta w Supabase, wystawienie tokenów
2. **Logowanie** - wprowadzenie poświadczeń, weryfikacja w Supabase Auth, wystawienie tokenów sesyjnych
3. **Odzyskiwanie hasła** - żądanie resetu, wysłanie e-maila z tokenem, utworzenie nowego hasła
4. **Weryfikacja tokenu** - sprawdzenie ważności tokenu w middleware przed dostępem do zasobów
5. **Odświeżanie tokenu** - automatyczne odświeżanie przez middleware przy wygaśnięciu
6. **Wylogowanie** - unieważnienie tokenów sesji, usunięcie danych sesji
7. **Zmiana hasła** - weryfikacja aktualnego hasła, walidacja nowego, aktualizacja w bazie danych
8. **Usunięcie konta** - weryfikacja tożsamości, oznaczenie konta jako usunięte (soft delete)
</authentication_analysis>

<mermaid_diagram>
```mermaid
sequenceDiagram
    autonumber
    
    participant Browser as Przeglądarka
    participant Middleware as Middleware
    participant Astro as Astro API
    participant Auth as Supabase Auth
    
    %% Proces rejestracji
    Note over Browser,Auth: Proces rejestracji użytkownika
    Browser->>Astro: Wysłanie formularza rejestracji
    activate Astro
    Astro->>Astro: Walidacja danych wejściowych
    Astro->>Auth: Przekazanie danych rejestracyjnych
    activate Auth
    Auth->>Auth: Walidacja danych i utworzenie konta
    Auth-->>Astro: Odpowiedź z tokenami (access, refresh)
    deactivate Auth
    Astro-->>Browser: Przekazanie tokenów w cookies
    deactivate Astro
    Auth->>Browser: Wysłanie e-maila weryfikacyjnego
    Browser->>Auth: Kliknięcie linku weryfikacyjnego
    activate Auth
    Auth->>Auth: Weryfikacja e-maila
    Auth-->>Browser: Przekierowanie do aplikacji z potwierdzeniem
    deactivate Auth
    
    %% Proces logowania
    Note over Browser,Auth: Proces logowania użytkownika
    Browser->>Astro: Wysłanie formularza logowania
    activate Astro
    Astro->>Auth: Przekazanie danych logowania
    activate Auth
    Auth->>Auth: Weryfikacja poświadczeń
    Auth-->>Astro: Odpowiedź z tokenami (access, refresh)
    deactivate Auth
    Astro-->>Browser: Przekazanie tokenów w cookies
    Astro-->>Browser: Przekierowanie do panelu głównego
    deactivate Astro
    
    %% Weryfikacja tokenu i dostęp do zasobów
    Note over Browser,Auth: Dostęp do chronionych zasobów
    Browser->>Middleware: Żądanie chronionego zasobu z cookies
    activate Middleware
    Middleware->>Auth: Weryfikacja tokenu dostępu
    activate Auth
    
    alt Token ważny
        Auth-->>Middleware: Token poprawny
        deactivate Auth
        Middleware->>Astro: Przekazanie żądania
        activate Astro
        Astro-->>Browser: Zwrócenie chronionego zasobu
        deactivate Astro
        deactivate Middleware
    else Token wygasł/niepoprawny
        Auth-->>Middleware: Token wygasł/niepoprawny
        deactivate Auth
        
        alt Token refresh ważny
            Middleware->>Auth: Żądanie odświeżenia tokenu
            activate Auth
            Auth-->>Middleware: Nowe tokeny (access, refresh)
            deactivate Auth
            Middleware->>Astro: Przekazanie żądania z nowym tokenem
            activate Astro
            Astro-->>Browser: Zwrócenie chronionego zasobu
            deactivate Astro
            Middleware-->>Browser: Aktualizacja cookies z nowymi tokenami
            deactivate Middleware
        else Token refresh wygasł/niepoprawny
            Middleware-->>Browser: Przekierowanie do strony logowania
            deactivate Middleware
        end
    end
    
    %% Odzyskiwanie hasła
    Note over Browser,Auth: Proces odzyskiwania hasła
    Browser->>Astro: Żądanie resetu hasła
    activate Astro
    Astro->>Auth: Przekazanie żądania resetu
    activate Auth
    Auth->>Auth: Wygenerowanie tokenu resetu
    Auth->>Browser: Wysłanie e-maila z linkiem do resetu
    deactivate Auth
    deactivate Astro
    Browser->>Auth: Kliknięcie linku do resetu
    activate Auth
    Auth->>Auth: Weryfikacja tokenu resetu
    Auth-->>Browser: Wyświetlenie formularza nowego hasła
    deactivate Auth
    Browser->>Astro: Wysłanie nowego hasła
    activate Astro
    Astro->>Auth: Przekazanie nowego hasła
    activate Auth
    Auth->>Auth: Walidacja i zmiana hasła
    Auth-->>Astro: Potwierdzenie zmiany hasła
    deactivate Auth
    Astro-->>Browser: Potwierdzenie zmiany hasła
    deactivate Astro
    
    %% Zmiana hasła przez zalogowanego użytkownika
    Note over Browser,Auth: Zmiana hasła przez zalogowanego użytkownika
    Browser->>Middleware: Żądanie zmiany hasła z tokenem
    activate Middleware
    Middleware->>Auth: Weryfikacja tokenu
    activate Auth
    Auth-->>Middleware: Token poprawny
    deactivate Auth
    Middleware->>Astro: Przekazanie żądania zmiany
    deactivate Middleware
    activate Astro
    Astro->>Auth: Żądanie zmiany hasła
    activate Auth
    Auth->>Auth: Walidacja i zmiana hasła
    Auth-->>Astro: Potwierdzenie zmiany
    deactivate Auth
    Astro-->>Browser: Komunikat o powodzeniu
    deactivate Astro
    
    %% Wylogowanie
    Note over Browser,Auth: Proces wylogowania
    Browser->>Middleware: Żądanie wylogowania
    activate Middleware
    Middleware->>Auth: Unieważnienie tokenów
    activate Auth
    Auth-->>Middleware: Potwierdzenie wylogowania
    deactivate Auth
    Middleware-->>Browser: Usunięcie cookies i przekierowanie
    deactivate Middleware
    
    %% Usuwanie konta
    Note over Browser,Auth: Proces usuwania konta
    Browser->>Middleware: Żądanie usunięcia konta
    activate Middleware
    Middleware->>Auth: Weryfikacja tokenu
    activate Auth
    Auth-->>Middleware: Token poprawny
    deactivate Auth
    Middleware->>Astro: Przekazanie żądania usunięcia
    deactivate Middleware
    activate Astro
    Astro->>Auth: Weryfikacja hasła użytkownika
    activate Auth
    Auth-->>Astro: Hasło poprawne
    Astro->>Auth: Żądanie soft delete konta
    Auth->>Auth: Oznaczenie konta jako usunięte
    Auth-->>Astro: Potwierdzenie usunięcia
    deactivate Auth
    Astro->>Auth: Unieważnienie sesji
    Astro-->>Browser: Usunięcie cookies i przekierowanie
    deactivate Astro
```
</mermaid_diagram>