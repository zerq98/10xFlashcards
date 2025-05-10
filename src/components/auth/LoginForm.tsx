import React, { useState, useId, useEffect } from 'react';
import { z } from 'zod';
import type { ApiErrorResponse, LoginRequestDTO } from '../../types';

// Funkcja do pobierania tokena CSRF z ciasteczek
function getCsrfToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      return value;
    }
  }
  return null;
}

// Walidacja emaila przy pomocy podstawowego wyrażenia regularnego
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Maksymalne długości pól jako zabezpieczenie przed atakami
const MAX_EMAIL_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 128;

// Schema walidacji zgodna z backendem
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Nieprawidłowy format adresu email")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .max(100, "Hasło przekracza maksymalną długość")
});

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // IDs for accessibility
  const emailId = useId();
  const emailErrorId = useId();
  const passwordId = useId();
  const passwordErrorId = useId();
  const errorId = useId();
  // Walidacja emaila przy zmianie pola
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Ogranicz długość emaila
    if (value.length > MAX_EMAIL_LENGTH) {
      return;
    }
    
    setEmail(value);
    // Czyścimy ewentualne błędy przy edycji pola
    setEmailError(null);
    setError(null);
  };
  
  // Walidacja hasła przy zmianie pola
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Ogranicz długość hasła
    if (value.length > MAX_PASSWORD_LENGTH) {
      return;
    }
    
    setPassword(value);
    // Czyścimy ewentualne błędy przy edycji pola
    setPasswordError(null);
    setError(null);
  };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    // Walidacja przed wysłaniem
    const trimmedEmail = email.trim();
    
    // Sprawdzanie tylko czy pola nie są puste - podstawowa walidacja
    // Nie informujemy użytkownika o szczegółach błędu dla bezpieczeństwa
    if (!trimmedEmail || !password) {
      setError('Niepoprawny email lub hasło');
      return;
    }
    
    // Minimalne sprawdzenie formatu email - nie wyświetlamy szczegółowego błędu
    if (!trimmedEmail.includes('@')) {
      setError('Niepoprawny email lub hasło');
      return;
    }
    
    // Cicha walidacja przez Zod - nie pokazujemy szczegółowych błędów
    try {
      loginSchema.parse({ email: trimmedEmail, password });
    } catch (zodError) {
      // Generyczny komunikat błędu zamiast szczegółowych błędów walidacji
      setError('Niepoprawny email lub hasło');
      return;
    }
    
    setIsLoading(true);
      try {
      // Pobieramy token CSRF z ciasteczka (dodane w naszym middleware)
      const csrfToken = getCsrfToken();
      
      // Wywołanie API do logowania
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Dodajemy token CSRF do nagłówka dla zabezpieczenia
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        } as LoginRequestDTO),
        credentials: 'same-origin', // Ważne dla ciasteczek
      });
      
      const data = await response.json();
        if (!response.ok) {
        // Obsługa błędów z API
        const errorResponse = data as ApiErrorResponse;
            // Dla błędów związanych z uwierzytelnieniem (401) używamy generycznego komunikatu
        if (response.status === 401) {
          setError('Niepoprawny email lub hasło');
        } 
        // Obsługa błędów związanych z CSRF (403)
        else if (response.status === 403) {
          // Odśwież stronę, aby pobrać nowy token CSRF
          window.location.reload();
          return;
        }
        // Jedyny wyjątek: rate limiting - możemy poinformować użytkownika
        else if (response.status === 429) {
          setError('Zbyt wiele prób logowania. Spróbuj ponownie później');
        } 
        // Dla pozostałych błędów serwera - ogólny komunikat
        else {
          // Logujemy błąd do konsoli, ale nie pokazujemy szczegółów użytkownikowi
          console.error('Login error:', errorResponse.error);
          setError('Wystąpił problem z zalogowaniem. Spróbuj ponownie później.');
        }
        return;
      }
      
      // Logowanie pomyślne - przekierowanie
      window.location.href = '/';
      
    } catch (err) {
      setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Alert z błędem */}
      {error && (
        <div 
          className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md mb-4" 
          role="alert"
          id={errorId}
        >
          <p>{error}</p>
        </div>
      )}
        {/* Email field */}
      <div className="space-y-2">
        <label 
          htmlFor={emailId} 
          className="block text-sm font-medium"
        >
          Adres email
        </label>        <div className={`group ${
          emailError ? 'bg-red-500' : 'focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent'
        } p-[2px] rounded-md transition-all duration-300`}>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            placeholder="twój@email.com"
            maxLength={MAX_EMAIL_LENGTH}
            className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
            value={email}
            onChange={handleEmailChange}
            aria-describedby={emailError ? emailErrorId : error ? errorId : undefined}
            aria-invalid={emailError ? 'true' : 'false'}
          />
        </div>
        {emailError && (
          <p id={emailErrorId} className="text-red-400 text-xs mt-1">
            {emailError}
          </p>
        )}
      </div>
        {/* Password field */}
      <div className="space-y-2">
        <label 
          htmlFor={passwordId} 
          className="block text-sm font-medium"
        >
          Hasło
        </label>        <div className={`group ${
          passwordError ? 'bg-red-500' : 'focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent'
        } p-[2px] rounded-md transition-all duration-300`}>
          <input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            maxLength={MAX_PASSWORD_LENGTH}
            className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
            value={password}
            onChange={handlePasswordChange}
            aria-describedby={passwordError ? passwordErrorId : error ? errorId : undefined}
            aria-invalid={passwordError ? 'true' : 'false'}
          />
        </div>
        {passwordError && (
          <p id={passwordErrorId} className="text-red-400 text-xs mt-1">
            {passwordError}
          </p>
        )}
      </div>
        {/* Submit button */}
      <div>        <button
          type="submit"
          disabled={isLoading || !!emailError || !!passwordError}
          className="w-full py-2 px-4 rounded-md font-medium transition-all bg-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-white shadow-md cursor-pointer disabled:cursor-none"
        >
          {isLoading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </div>
    </form>
  );
};
