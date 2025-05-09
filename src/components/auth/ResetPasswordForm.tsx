import React, { useState, useId } from 'react';

// Walidacja hasła
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Hasło musi mieć co najmniej 8 znaków';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Hasło musi zawierać co najmniej jedną dużą literę';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Hasło musi zawierać co najmniej jedną małą literę';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Hasło musi zawierać co najmniej jedną cyfrę';
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Hasło musi zawierać co najmniej jeden znak specjalny';
  }
  
  return null;
};

// Maksymalna długość pola hasła
const MAX_PASSWORD_LENGTH = 128;

interface ResetPasswordFormProps {
  token: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // IDs for accessibility
  const passwordId = useId();
  const passwordErrorId = useId();
  const passwordConfirmId = useId();
  const errorId = useId();
  const successId = useId();
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    
    // Ogranicz długość hasła
    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      return;
    }
    
    setPassword(newPassword);
    
    // Walidacja hasła w czasie rzeczywistym
    if (newPassword) {
      const error = validatePassword(newPassword);
      setPasswordError(error);
    } else {
      setPasswordError(null);
    }
  };
  
  const handlePasswordConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Ogranicz długość potwierdzenia hasła
    if (value.length > MAX_PASSWORD_LENGTH) {
      return;
    }
    
    setPasswordConfirm(value);
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Sprawdzenie czy hasła są wypełnione
    if (!password || !passwordConfirm) {
      setError('Wszystkie pola są wymagane');
      return;
    }
    
    // Sprawdzenie czy hasła się zgadzają
    if (password !== passwordConfirm) {
      setError('Hasła muszą być identyczne');
      return;
    }
    
    // Walidacja hasła
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    
    setIsLoading(true);
    
    // Symulacja do implementacji - w rzeczywistości zostanie zaimplementowane z API
    try {
      console.log('Ustawianie nowego hasła z tokenem:', token);
      // Tutaj będzie wywołanie API /api/auth/reset-password
      await new Promise(resolve => setTimeout(resolve, 600)); // symulacja opóźnienia
      
      // Po implementacji backendu - komunikat o sukcesie
      setSuccess(true);
    } catch (err) {
      setError('Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie lub zażądaj nowego linku resetującego.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Po udanym zresetowaniu hasła, wyświetlamy tylko komunikat sukcesu
  if (success) {
    return (
      <div 
        className="bg-green-950/50 border border-green-500/50 text-green-200 px-4 py-6 rounded-md"
        role="status"
        id={successId}
      >
        <h3 className="text-lg font-medium mb-2">Hasło zostało zmienione!</h3>
        <p className="mb-4">Twoje hasło zostało pomyślnie zmienione. Możesz teraz się zalogować.</p>
        <a
          href="/login"
          className="inline-block w-full py-2 px-4 rounded-md font-medium text-center transition-all bg-gradient-to-r from-primary via-secondary-400 to-accent-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white shadow-md"
        >
          Przejdź do logowania
        </a>
      </div>
    );
  }

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
      
      <div className="mb-4">
        <p className="text-text opacity-80 mb-4">
          Wprowadź nowe hasło dla swojego konta.
        </p>
      </div>
      
      {/* Password field */}
      <div className="space-y-2">
        <label 
          htmlFor={passwordId} 
          className="block text-sm font-medium"
        >
          Nowe hasło
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="new-password"
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
      
      {/* Confirm Password field */}
      <div className="space-y-2">
        <label 
          htmlFor={passwordConfirmId} 
          className="block text-sm font-medium"
        >
          Potwierdź nowe hasło
        </label>
        <input
          id={passwordConfirmId}
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          maxLength={MAX_PASSWORD_LENGTH}
          className={`w-full px-4 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text ${
            password !== passwordConfirm && passwordConfirm 
              ? 'border-red-500' 
              : 'border-gray-700'
          }`}
          value={passwordConfirm}
          onChange={handlePasswordConfirmChange}
          aria-invalid={password !== passwordConfirm && passwordConfirm ? 'true' : 'false'}
        />
        {password !== passwordConfirm && passwordConfirm && (
          <p className="text-red-400 text-xs mt-1">
            Hasła nie są identyczne
          </p>
        )}
      </div>
      
      {/* Zabezpieczenia informacyjne */}
      <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-md">
        <p className="text-xs text-text opacity-80">
          Twoje hasło powinno zawierać:
        </p>
        <ul className="text-xs list-disc list-inside space-y-1 mt-2 text-text opacity-80">
          <li>Przynajmniej 8 znaków</li>
          <li>Przynajmniej jedną dużą literę</li>
          <li>Przynajmniej jedną małą literę</li>
          <li>Przynajmniej jedną cyfrę</li>
          <li>Przynajmniej jeden znak specjalny</li>
        </ul>
      </div>
      
      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading || !!passwordError || password !== passwordConfirm || !password || !passwordConfirm}
          className="w-full py-2 px-4 rounded-md font-medium transition-all bg-gradient-to-r from-primary via-secondary-400 to-accent-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-white shadow-md"
        >
          {isLoading ? 'Zmienianie hasła...' : 'Ustaw nowe hasło'}
        </button>
      </div>
    </form>
  );
};
