import React, { useState, useId } from 'react';

// Walidacja emaila przy pomocy podstawowego wyrażenia regularnego
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Maksymalne długości pól jako zabezpieczenie przed atakami
const MAX_EMAIL_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 128;

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
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
    
    // Walidacja tylko gdy pole nie jest puste
    if (value && !validateEmail(value)) {
      setEmailError('Podaj poprawny adres email');
    } else {
      setEmailError(null);
    }
  };
  
  // Walidacja hasła przy zmianie pola
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Ogranicz długość hasła
    if (value.length > MAX_PASSWORD_LENGTH) {
      return;
    }
    
    setPassword(value);
    
    // Walidacja tylko gdy pole nie jest puste
    if (!value) {
      setPasswordError('Hasło nie może być puste');
    } else {
      setPasswordError(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    // Walidacja przed wysłaniem
    const trimmedEmail = email.trim();
    
    // Sprawdzanie czy pola są wypełnione
    if (!trimmedEmail || !password) {
      setError('Wszystkie pola są wymagane');
      return;
    }
    
    // Sprawdzanie formatu email
    if (!validateEmail(trimmedEmail)) {
      setEmailError('Podaj poprawny adres email');
      return;
    }
    
    setIsLoading(true);
    
    // Symulacja do implementacji - w rzeczywistości zostanie zaimplementowane z API
    try {
      // Używanie przyciętego emaila (trimmed) do logowania
      console.log('Logowanie:', { email: trimmedEmail, password });
      // Tutaj będzie wywołanie API /api/auth/login
      await new Promise(resolve => setTimeout(resolve, 600)); // symulacja opóźnienia
      
      // Po implementacji backendu - przekierowanie na /topics
    } catch (err) {
      setError('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
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
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          required
          placeholder="twój@email.com"
          maxLength={MAX_EMAIL_LENGTH}
          className={`w-full px-4 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text ${
            emailError ? 'border-red-500' : 'border-gray-700'
          }`}
          value={email}
          onChange={handleEmailChange}
          aria-describedby={emailError ? emailErrorId : error ? errorId : undefined}
          aria-invalid={emailError ? 'true' : 'false'}
        />
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
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          maxLength={MAX_PASSWORD_LENGTH}
          className={`w-full px-4 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text ${
            passwordError ? 'border-red-500' : 'border-gray-700'
          }`}
          value={password}
          onChange={handlePasswordChange}
          aria-describedby={passwordError ? passwordErrorId : error ? errorId : undefined}
          aria-invalid={passwordError ? 'true' : 'false'}
        />
        {passwordError && (
          <p id={passwordErrorId} className="text-red-400 text-xs mt-1">
            {passwordError}
          </p>
        )}
      </div>
        {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading || !!emailError || !!passwordError || !email || !password}
          className="w-full py-2 px-4 rounded-md font-medium transition-all bg-gradient-to-r from-primary via-secondary-400 to-accent-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-white shadow-md"
        >
          {isLoading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </div>
    </form>
  );
};
