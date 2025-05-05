<architecture_analysis>
1. Komponenty wymienione w specyfikacji:
   - Layouty: AuthLayout.astro, Layout.astro
   - Strony Astro: register.astro, login.astro,
     forgot-password.astro, reset-password/[token].astro,
     account/change-password.astro, account/delete-account.astro
   - Komponenty React: RegisterForm.tsx,
     LoginForm.tsx, ForgotPasswordForm.tsx,
     ResetPasswordForm.tsx, ChangePasswordForm.tsx,
     DeleteAccountForm.tsx
   - NavBar z przyciskami logowania/profilu
2. Główne strony i odpowiadające im komponenty:
   - register.astro → RegisterForm.tsx
   - login.astro → LoginForm.tsx
   - forgot-password.astro → ForgotPasswordForm.tsx
   - reset-password → ResetPasswordForm.tsx
   - change-password → ChangePasswordForm.tsx
   - delete-account → DeleteAccountForm.tsx
3. Przepływ danych:
   - Formularze React wywołują endpointy API auth
     (/api/auth/*)
   - Layout.astro wykorzystuje middleware protectRoute
     do ochrony stron
   - AuthLayout.astro renderuje strony auth bez NavBar
4. Opis funkcjonalności:
   - AuthLayout i Layout kontrolują widoczność UI
   - Formularze walidują dane i wysyłają żądania
   - NavBar zmienia przyciski w zależności od sesji
</architecture_analysis>

<mermaid_diagram>
flowchart TD
    subgraph "Layouts"
        AuthLayout["AuthLayout.astro"]
        Layout["Layout.astro"]
    end
    subgraph "Strony Astro"
        RegPage["register.astro"] --> RegForm["RegisterForm.tsx"]
        LogPage["login.astro"] --> LogForm["LoginForm.tsx"]
        ForgotPage["forgot-password.astro"] -->
          ForgotForm["ForgotPasswordForm.tsx"]
        ResetPage["reset-password [token]"] -->
          ResetForm["ResetPasswordForm.tsx"]
        ChangePage["change-password.astro"] -->
          ChangeForm["ChangePasswordForm.tsx"]
        DeletePage["delete-account.astro"] -->
          DeleteForm["DeleteAccountForm.tsx"]
    end
    subgraph "Komponenty React"
        RegForm --> APIReg["API: register"]
        LogForm --> APILog["API: login"]
        ForgotForm --> APIForgot["API: forgot pw"]
        ResetForm --> APIReset["API: reset pw"]
        ChangeForm --> APIChange["API: change pw"]
        DeleteForm --> APIDelete["API: delete acct"]
    end
    subgraph "SSR Middleware"
        Middleware["protectRoute"]
        Middleware --> Layout
    end
    subgraph "API Endpoints"
        APIReg --> RegEndpoint["POST auth/register"]
        APILog --> LogEndpoint["POST auth/login"]
        APIForgot --> ForgotEndpoint["POST auth/forgot-password"]
        APIReset --> ResetEndpoint["POST auth/reset-password"]
        APIChange --> ChangeEndpoint["PUT auth/change-password"]
        APIDelete --> DeleteEndpoint["DELETE auth/delete-account"]
    end
</mermaid_diagram>