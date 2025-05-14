import React, { useState, useId, useMemo } from 'react';
import type { ApiErrorResponse } from '../../types';

// Zaawansowana walidacja hasła
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

// Sprawdzenie siły hasła (0-100)
const calculatePasswordStrength = (password: string): number => {
  // Początkowy wynik
  let score = 0;

  // Brak hasła = brak punktów
  if (!password) return 0;

  // Podstawowa długość (do 25 pkt)
  score += Math.min(25, password.length * 2);

  // Różnorodność znaków
  const patterns = [
    /[a-z]/, // małe litery
    /[A-Z]/, // duże litery
    /[0-9]/, // cyfry
    /[^A-Za-z0-9]/, // znaki specjalne
  ];

  // Dodaj punkty za każdy rodzaj znaków (do 25 pkt)
  const uniqueTypes = patterns.filter((pattern) =>
    pattern.test(password)
  ).length;
  score += uniqueTypes * 6.25;

  // Dodatkowe punkty za długość powyżej 10 znaków (do 25 pkt)
  if (password.length > 10) {
    score += Math.min(25, (password.length - 10) * 2.5);
  }

  // Dodatkowe punkty za kombinację rodzajów znaków (do 25 pkt)
  if (uniqueTypes >= 2) score += 10;
  if (uniqueTypes >= 3) score += 10;
  if (uniqueTypes === 4) score += 5;

  // Ogranicz wynik do 100
  return Math.min(100, score);
};

// Maksymalna długość pola hasła
const MAX_PASSWORD_LENGTH = 128;

export const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // IDs for accessibility
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const passwordErrorId = useId();
  const confirmPasswordId = useId();
  const errorId = useId();
  const successId = useId();
  const passwordStrengthId = useId();
  
  // Obliczanie siły hasła
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(newPassword),
    [newPassword]
  );

  // Kolor i etykieta wskaźnika siły hasła
  const getStrengthColor = () => {
    if (passwordStrength < 30) return "bg-red-600";
    if (passwordStrength < 60) return "bg-yellow-600";
    if (passwordStrength < 80) return "bg-lime-600";
    return "bg-green-600";
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 30) return "Słabe";
    if (passwordStrength < 60) return "Średnie";
    if (passwordStrength < 80) return "Dobre";
    return "Silne";
  };
  
  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Ogranicz długość hasła
    if (value.length > MAX_PASSWORD_LENGTH) {
      return;
    }
    
    setCurrentPassword(value);
  };
  
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Ogranicz długość hasła
    if (value.length > MAX_PASSWORD_LENGTH) {
      return;
    }
    
    setNewPassword(value);
    
    // Walidacja hasła w czasie rzeczywistym
    if (value) {
      const error = validatePassword(value);
      setPasswordError(error);
    } else {
      setPasswordError(null);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Sprawdzanie czy wszystkie pola są wypełnione
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Wszystkie pola są wymagane');
      return;
    }
    
    // Sprawdzanie czy nowe hasło jest inne niż aktualne
    if (currentPassword === newPassword) {
      setError('Nowe hasło musi być inne niż aktualne');
      return;
    }
    
    // Sprawdzanie czy nowe hasła się zgadzają
    if (newPassword !== confirmPassword) {
      setError('Nowe hasła muszą być identyczne');
      return;
    }
    
    // Walidacja nowego hasła
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Wywołanie API do zmiany hasła
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
        credentials: 'same-origin',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Obsługa błędów z API
        const errorResponse = data as ApiErrorResponse;
        
        if (errorResponse.error) {
          if (errorResponse.error.code === 'INVALID_CREDENTIALS') {
            setError('Aktualne hasło jest nieprawidłowe');
          } else if (errorResponse.error.code === 'VALIDATION_ERROR') {
            setError('Nieprawidłowe dane. Sprawdź wymagania hasła.');
          } else if (errorResponse.error.code === 'RATE_LIMIT_EXCEEDED') {
            setError('Zbyt wiele prób zmiany hasła. Spróbuj ponownie później.');
          } else if (errorResponse.error.code === 'SESSION_MISMATCH') {
            setError('Problem z sesją użytkownika. Wyloguj się i zaloguj ponownie.');
          } else if (errorResponse.error.code === 'INVALID_SESSION') {
            setError('Twoja sesja wygasła. Wyloguj się i zaloguj ponownie.');
          } else {
            setError(errorResponse.error.message || 'Wystąpił błąd podczas zmiany hasła');
          }
        } else {
          setError('Wystąpił nieznany błąd podczas zmiany hasła');
        }
        return;
      }
      
      // Sukces - wyświetl komunikat i zresetuj formularz
      setSuccess(true);
      
      // Resetowanie formularza
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setError('Wystąpił błąd połączenia z serwerem. Spróbuj ponownie później.');
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
      
      {/* Alert z potwierdzeniem */}
      {success && (
        <div 
          className="bg-green-950/50 border border-green-500/50 text-green-200 px-4 py-3 rounded-md mb-4" 
          role="status"
          id={successId}
        >
          <p>Twoje hasło zostało pomyślnie zmienione.</p>
        </div>
      )}
        <div className="space-y-2">
        <label 
          htmlFor={currentPasswordId} 
          className="block text-sm font-medium"
        >
          Aktualne hasło
        </label>
        <div
          className={`group focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent p-[2px] rounded-md transition-all duration-300`}
        >
          <input
            id={currentPasswordId}
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            maxLength={MAX_PASSWORD_LENGTH}
            className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
            value={currentPassword}
            onChange={handleCurrentPasswordChange}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label 
          htmlFor={newPasswordId} 
          className="block text-sm font-medium"
        >
          Nowe hasło
        </label>
        <div
          className={`group ${
            passwordError
              ? "bg-red-500"
              : "focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent"
          } p-[2px] rounded-md transition-all duration-300`}
        >
          <input
            id={newPasswordId}
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            maxLength={MAX_PASSWORD_LENGTH}
            className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
            value={newPassword}
            onChange={handleNewPasswordChange}
            aria-describedby={passwordError ? passwordErrorId : error ? errorId : undefined}
            aria-invalid={passwordError ? 'true' : 'false'}
          />
        </div>
        {/* Password strength indicator */}
        {newPassword && (
          <div className="mt-2" aria-hidden="true">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs text-text">Siła hasła:</div>
              <div
                className="text-xs"
                id={passwordStrengthId}
                aria-live="polite"
              >
                {getStrengthLabel()}
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getStrengthColor()}`}
                style={{ width: `${passwordStrength}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {passwordError && (
          <p id={passwordErrorId} className="text-red-400 text-xs mt-1">
            {passwordError}
          </p>
        )}
      </div>
        <div className="space-y-2">
        <label 
          htmlFor={confirmPasswordId} 
          className="block text-sm font-medium"
        >
          Potwierdź nowe hasło
        </label>
        <div
          className={`group ${
            newPassword !== confirmPassword && confirmPassword
              ? "bg-red-500"
              : "focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent"
          } p-[2px] rounded-md transition-all duration-300`}
        >
          <input
            id={confirmPasswordId}
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            maxLength={MAX_PASSWORD_LENGTH}
            className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={newPassword !== confirmPassword && confirmPassword ? 'true' : 'false'}
          />
        </div>
        {newPassword !== confirmPassword && confirmPassword && (
          <p className="text-red-400 text-xs mt-1">
            Hasła nie są identyczne
          </p>
        )}
      </div>
        {/* Zabezpieczenia informacyjne */}
      <div className="px-3 bg-transparent rounded-md">
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
      </div>      {/* Submit button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 rounded-md font-medium transition-all bg-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-white shadow-md cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? 'Zmienianie hasła...' : 'Zmień hasło'}
        </button>
      </div>
    </form>
  );
};
