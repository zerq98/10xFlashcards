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
    
    // Symulacja do implementacji - w rzeczywistości zostanie zaimplementowane z API
    try {
      console.log('Zmiana hasła:', { currentPassword, newPassword });
      // Tutaj będzie wywołanie API /api/auth/change-password
      await new Promise(resolve => setTimeout(resolve, 600)); // symulacja opóźnienia
      
      // Po implementacji backendu - komunikat o sukcesie
      setSuccess(true);
      
      // Resetowanie formularza
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Wystąpił błąd podczas zmiany hasła. Sprawdź, czy aktualne hasło jest poprawne.');
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
        <input
          id={currentPasswordId}
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          maxLength={MAX_PASSWORD_LENGTH}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      
      <div className="space-y-2">
        <label 
          htmlFor={newPasswordId} 
          className="block text-sm font-medium"
        >
          Nowe hasło
        </label>
        <input
          id={newPasswordId}
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          maxLength={MAX_PASSWORD_LENGTH}
          className={`w-full px-4 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text ${
            passwordError ? 'border-red-500' : 'border-gray-700'
          }`}
          value={newPassword}
          onChange={handleNewPasswordChange}
          aria-describedby={passwordError ? passwordErrorId : error ? errorId : undefined}
          aria-invalid={passwordError ? 'true' : 'false'}
        />
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
        <input
          id={confirmPasswordId}
          type="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          maxLength={MAX_PASSWORD_LENGTH}
          className={`w-full px-4 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-text ${
            newPassword !== confirmPassword && confirmPassword 
              ? 'border-red-500' 
              : 'border-gray-700'
          }`}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={newPassword !== confirmPassword && confirmPassword ? 'true' : 'false'}
        />
        {newPassword !== confirmPassword && confirmPassword && (
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
          disabled={
            isLoading || 
            !!passwordError || 
            !currentPassword || 
            !newPassword || 
            !confirmPassword || 
            newPassword !== confirmPassword ||
            currentPassword === newPassword
          }
          className="w-full py-2 px-4 rounded-md font-medium transition-all bg-gradient-to-r from-primary via-secondary-400 to-accent-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-white shadow-md"
        >
          {isLoading ? 'Zmienianie hasła...' : 'Zmień hasło'}
        </button>
      </div>
    </form>
  );
};
