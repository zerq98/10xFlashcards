<user_journey_analysis>
1. Scieżki użytkownika:
   - Rejestracja (US-001)
   - Logowanie (US-002)
   - Zapomniane hasło / reset hasła (US-003)
   - Zmiana hasła (US-004)
   - Usunięcie konta (US-005)

2. Główne podróże i stany:
   - Proces Rejestracji: formularz → walidacja → sukces / błąd → przekierowanie
   - Proces Logowania: formularz → walidacja → sukces / błąd → przekierowanie
   - Odzyskiwanie hasła: formularz email → wysłanie linku → formularz resetu → walidacja tokenu → zmiana hasła
   - Zmiana hasła: formularz zmiany → walidacja danych → re-autoryzacja → aktualizacja hasła
   - Usuwanie konta: formularz usunięcia → potwierdzenie → re-autoryzacja → soft delete → wylogowanie

3. Punkty decyzyjne:
   - Dane formularza poprawne?
   - E-mail istnieje w systemie?
   - Token resetu ważny?
   - Aktualne hasło poprawne?
   - Użytkownik potwierdza usunięcie?

4. Opis każdego stanu:
   - Formularz...: wyświetlenie pola do wprowadzenia danych
   - Walidacja...: sprawdzenie poprawności danych po stronie klienta/serwera
   - Re-autoryzacja: ponowna weryfikacja obecnego hasła w Supabase
   - Wysłanie linku: generowanie i wysyłka emaila resetującego
   - Soft delete: oznaczenie konta jako usunięte i wyczyszczenie sesji
</user_journey_analysis>

<mermaid_diagram>
```mermaid
stateDiagram-v2
[*] --> StronaGlowna
StronaGlowna --> Rejestracja
StronaGlowna --> Logowanie
StronaGlowna --> ZapomnialemHasla

state "Proces Rejestracji" as Rejestracja {
  [*] --> FormularzRejestracji
  FormularzRejestracji --> WalidacjaDanych : Zarejestruj
  WalidacjaDanych --> if_rej : Dane poprawne?
  if_rej <<choice>>
  if_rej --> SukcesRej : Tak
  if_rej --> BladRej : Nie
  SukcesRej --> [*] : Przekieruj do Tematów
  BladRej --> FormularzRejestracji : Pokaż błąd
}

state "Proces Logowania" as Logowanie {
  [*] --> FormularzLogowania
  FormularzLogowania --> WalidacjaLog : Zaloguj
  WalidacjaLog --> if_log : Dane poprawne?
  if_log <<choice>>
  if_log --> SukcesLog : Tak
  if_log --> BladLog : Nie
  SukcesLog --> [*] : Przekieruj do Tematów
  BladLog --> FormularzLogowania : Pokaż błąd
}

state "Odzyskiwanie hasła" as Reset {
  [*] --> FormularzZapomnialHasla
  FormularzZapomnialHasla --> WalidacjaEmail : Wyślij link
  WalidacjaEmail --> if_email : Email istnieje?
  if_email <<choice>>
  if_email --> WyslijLink : Tak
  if_email --> BladEmail : Nie
  WyslijLink --> [*] : Potwierdzenie wysłania
  [*] --> FormularzResetu : Kliknięcie linku
  FormularzResetu --> WalidacjaToken : Zmień hasło
  WalidacjaToken --> if_token : Token ważny?
  if_token <<choice>>
  if_token --> UstawHaslo : Tak
  if_token --> BladToken : Nie
  UstawHaslo --> WalidacjaHasla : Waliduj nowe
  WalidacjaHasla --> if_zm : Zmiana udana?
  if_zm <<choice>>
  if_zm --> SukcesReset : Tak
  if_zm --> BladZmiana : Nie
  SukcesReset --> [*] : Przekieruj do Logowania
  BladZmiana --> FormularzResetu : Pokaż błąd
}

state "Zmiana hasła" as ChangePwd {
  [*] --> FormularzZmiany
  FormularzZmiany --> WalidacjaChange : Zmień
  WalidacjaChange --> if_change : Dane poprawne?
  if_change <<choice>>
  if_change --> Reautoryzacja : Tak
  if_change --> BladWalid : Nie
  Reautoryzacja --> if_reauth : Hasło poprawne?
  if_reauth <<choice>>
  if_reauth --> UpdateHaslo : Tak
  if_reauth --> BladReauth : Nie
  UpdateHaslo --> SukcesChange : Hasło zmienione
  BladReauth --> FormularzZmiany : Pokaż błąd
  SukcesChange --> [*]
}

state "Usunięcie konta" as DeleteAcc {
  [*] --> FormularzUsuniecia
  FormularzUsuniecia --> Potwierdzenie : Usuń konto
  Potwierdzenie --> ReautDelete : Weryfikuj hasło
  ReautDelete --> if_del : Hasło poprawne?
  if_del <<choice>>
  if_del --> SoftDelete : Tak
  if_del --> BladDel : Nie
  SoftDelete --> Wylogowanie : Konto usunięte
  Wylogowanie --> [*]
  BladDel --> FormularzUsuniecia : Pokaż błąd
}
```
</mermaid_diagram>
