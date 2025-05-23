import React, { useState, useId } from 'react';

// Maksymalna długość pola hasła
const MAX_PASSWORD_LENGTH = 128;

// Komponent dialogu potwierdzającego usunięcie konta
interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* Dialog content */}
      <div 
        className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 p-6 w-full max-w-md relative z-10"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
      >
        <h2 
          id="dialog-title" 
          className="text-xl font-semibold text-red-400 mb-4"
        >
          Potwierdź usunięcie konta
        </h2>
        <p 
          id="dialog-desc" 
          className="text-text mb-6"
        >
          Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-end">          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors shadow-md"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white shadow-md"
          >
            Usuń konto
          </button>
        </div>
      </div>
    </div>
  );
};

export const DeleteAccountForm = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // IDs for accessibility
  const passwordId = useId();
  const errorId = useId();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Sprawdzanie czy hasło jest wprowadzone
    if (!password) {
      setError('Wprowadź swoje hasło, aby kontynuować');
      return;
    }
    
    // Otwórz dialog potwierdzający
    setIsDialogOpen(true);
  };
    const handleConfirmDelete = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Wywołanie API /api/auth/delete-account
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
        if (!response.ok) {
        // Specjalna obsługa błędu przekroczenia limitu
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          let waitTime = 'jakiś czas';
          
          if (retryAfter) {
            const minutes = Math.ceil(parseInt(retryAfter) / 60);
            waitTime = `${minutes} ${minutes === 1 ? 'minutę' : minutes < 5 ? 'minuty' : 'minut'}`;
          }
          
          throw new Error(data.error?.message || `Przekroczono limit prób. Spróbuj ponownie za ${waitTime}.`);
        }
        
        throw new Error(data.error?.message || 'Nieznany błąd podczas usuwania konta');
      }
      
      // Przekierowanie na stronę główną po pomyślnym usunięciu konta
      window.location.href = '/login?deleted=true';
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas usuwania konta. Sprawdź, czy hasło jest poprawne.');
      setIsDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <DeleteAccountDialog 
        isOpen={isDialogOpen} 
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">        <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-lg">
          <h3 className="text-lg font-medium text-red-400 mb-2">
            Uwaga: Działanie nieodwracalne
          </h3>
          <p className="text-text mb-4">
            Usunięcie konta spowoduje trwałe usunięcie wszystkich Twoich danych, w tym fiszek i ustawień. Odzyskanie konta jest możliwe wyłącznie poprzez kontakt z supportem.
          </p>
        </div>
        
        {/* Alert z błędem */}
        {error && (
          <div 
            className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md" 
            role="alert"
            id={errorId}
          >
            <p>{error}</p>
          </div>
        )}
          <div className="space-y-2">
          <label 
            htmlFor={passwordId} 
            className="block text-sm font-medium"
          >
            Wprowadź hasło, aby potwierdzić
          </label>          <div
            className="group focus-within:bg-gradient-to-r focus-within:from-primary focus-within:via-secondary focus-within:to-accent bg-transparent p-[2px] rounded-md transition-all duration-300"
          >
            <input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              maxLength={MAX_PASSWORD_LENGTH}
              className="w-full px-4 py-2 bg-gray-800 rounded-md focus:outline-none text-text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby={error ? errorId : undefined}
            />
          </div>
        </div>
          {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 rounded-md font-medium transition-all bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? 'Usuwanie konta...' : 'Usuń konto'}
          </button>
        </div>
      </form>
    </>
  );
};
