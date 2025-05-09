import React, { useState, useId } from 'react';

// Walidacja emaila
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Maksymalna długość pola email
const MAX_EMAIL_LENGTH = 100;

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // IDs for accessibility
  const emailId = useId();
  const emailErrorId = useId();
  const errorId = useId();
  const successId = useId();
  
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
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Przytnij email
    const trimmedEmail = email.trim();
    
    // Sprawdź czy email jest poprawny
    if (!trimmedEmail) {
      setEmailError('Podaj adres email');
      return;
    }
    
    // Walidacja formatu emaila
    if (!validateEmail(trimmedEmail)) {
      setEmailError('Podaj poprawny adres email');
      return;
    }
    
    setIsLoading(true);
    
    // Symulacja do implementacji - w rzeczywistości zostanie zaimplementowane z API
    try {
      console.log('Reset hasła dla:', trimmedEmail);
      // Tutaj będzie wywołanie API /api/auth/forgot-password
      await new Promise(resolve => setTimeout(resolve, 600)); // symulacja opóźnienia
      
      // Po implementacji backendu - komunikat o sukcesie
      setSuccess(true);
    } catch (err) {
      setError('Wystąpił błąd podczas wysyłania linku resetującego. Spróbuj ponownie.');
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
      
      {/* Alert z sukcesem */}
      {success && (
        <div 
          className="bg-green-950/50 border border-green-500/50 text-green-200 px-4 py-3 rounded-md mb-4" 
          role="status"
          id={successId}
        >
          <p>Link resetujący hasło został wysłany na podany adres email.</p>
        </div>
      )}
        <div className="mb-4">
        <p className="text-text opacity-80 mb-4">
          Wpisz swój adres email, a wyślemy Ci link do zresetowania hasła.
        </p>
      </div>
      
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
          aria-describedby={emailError ? emailErrorId : (error ? errorId : (success ? successId : undefined))}
          aria-invalid={emailError ? 'true' : 'false'}
        />
        {emailError && (
          <p id={emailErrorId} className="text-red-400 text-xs mt-1">
            {emailError}
          </p>
        )}
      </div>
      
      {/* Dodatkowy komunikat bezpieczeństwa */}
      <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-md text-xs text-text opacity-80">
        <p>
          Ze względów bezpieczeństwa, nie potwierdzamy czy podany email istnieje w systemie.
          Jeśli konto z podanym adresem email istnieje, otrzymasz wiadomość z linkiem do resetowania hasła.
        </p>
      </div>
      
      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading || !email || !!emailError}
          className="w-full py-2 px-4 rounded-md font-medium transition-all bg-gradient-to-r from-primary via-secondary-400 to-accent-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-white shadow-md"
        >
          {isLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
        </button>
      </div>
    </form>
  );
};
