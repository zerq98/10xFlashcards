import React, { useState } from 'react';
import { z } from 'zod';
import { useToast } from '../../hooks/useToast';
import type { CreateFlashcardRequestDTO } from '@/types';

// Constants for validation
const MAX_FLASHCARD_LENGTH = 500;

// Validation schema
const flashcardSchema = z.object({
  front: z
    .string()
    .min(1, "Przód fiszki jest wymagany")
    .max(MAX_FLASHCARD_LENGTH, `Przód fiszki może mieć maksymalnie ${MAX_FLASHCARD_LENGTH} znaków`),
  back: z
    .string()
    .min(1, "Tył fiszki jest wymagany")
    .max(MAX_FLASHCARD_LENGTH, `Tył fiszki może mieć maksymalnie ${MAX_FLASHCARD_LENGTH} znaków`)
});

interface ManualFlashcardFormProps {
  topicId: string;
  onCancel: () => void;
  onSave: (flashcard: CreateFlashcardRequestDTO) => Promise<void>;
  isLoading?: boolean;
}

export const ManualFlashcardForm = ({
  topicId,
  onCancel,
  onSave,
  isLoading = false
}) => {
  // Form state
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [frontFocused, setFrontFocused] = useState(false);
  const [backFocused, setBackFocused] = useState(false);
  
  // IDs for accessibility
  const frontId = React.useId();
  const frontErrorId = React.useId();
  const backId = React.useId();
  const backErrorId = React.useId();
  const errorId = React.useId();
  
  const toast = useToast();

  // Handle front field changes
  const handleFrontChange = (e) => {
    const value = e.target.value;
    
    // Limit length
    if (value.length > MAX_FLASHCARD_LENGTH) {
      return;
    }
    
    setFront(value);
    setFrontError(null);
    setApiError(null);
  };

  // Handle back field changes
  const handleBackChange = (e) => {
    const value = e.target.value;
    
    // Limit length
    if (value.length > MAX_FLASHCARD_LENGTH) {
      return;
    }
    
    setBack(value);
    setBackError(null);
    setApiError(null);
  };

  // Validate form before submission
  const validateForm = () => {
    try {
      flashcardSchema.parse({ front, back });
      return true;
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        zodError.errors.forEach((error) => {
          if (error.path[0] === 'front') {
            setFrontError(error.message);
          } else if (error.path[0] === 'back') {
            setBackError(error.message);
          }
        });
      }
      return false;
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSave({ front, back });
    } catch (error) {
      console.error('Error saving flashcard:', error);
      setApiError('Wystąpił błąd podczas zapisywania fiszki. Spróbuj ponownie.');
    }
  };

  // Calculate remaining characters
  const frontCharsRemaining = MAX_FLASHCARD_LENGTH - front.length;
  const backCharsRemaining = MAX_FLASHCARD_LENGTH - back.length;
  
  // Determine if save button should be disabled
  const isSaveDisabled = isLoading || !front.trim() || !back.trim() || Boolean(frontError) || Boolean(backError);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Error Alert */}
      {apiError && (
        <div
          className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md mb-4"
          role="alert"
          id={errorId}
        >
          {apiError}
        </div>
      )}
      
      {/* Front textarea field */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label
            htmlFor={frontId}
            className="block text-sm font-medium text-gray-200"
          >
            Przód fiszki
          </label>
          <span
            className={`text-xs ${
              frontCharsRemaining < 50 ? "text-amber-400" : "text-gray-400"
            }`}
          >
            {frontCharsRemaining} znaków pozostało
          </span>
        </div>
        
        <textarea
          id={frontId}
          value={front}
          onChange={handleFrontChange}
          onFocus={() => setFrontFocused(true)}
          onBlur={() => setFrontFocused(false)}
          aria-invalid={!!frontError}
          aria-describedby={frontError ? frontErrorId : undefined}
          placeholder="Wpisz treść przedniej strony fiszki"
          className={`w-full min-h-[120px] p-3 rounded-md bg-gray-800 text-gray-100 border ${
            frontError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : frontFocused
                ? "border-primary focus:border-primary focus:ring-primary"
                : "border-gray-700 focus:border-gray-600"
          } focus:outline-none focus:ring-2 focus:ring-offset-0`}
          required
        />
        
        {frontError && (
          <p className="text-red-400 text-xs" id={frontErrorId}>
            {frontError}
          </p>
        )}
      </div>
      
      {/* Back textarea field */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label
            htmlFor={backId}
            className="block text-sm font-medium text-gray-200"
          >
            Tył fiszki
          </label>
          <span
            className={`text-xs ${
              backCharsRemaining < 50 ? "text-amber-400" : "text-gray-400"
            }`}
          >
            {backCharsRemaining} znaków pozostało
          </span>
        </div>
        
        <textarea
          id={backId}
          value={back}
          onChange={handleBackChange}
          onFocus={() => setBackFocused(true)}
          onBlur={() => setBackFocused(false)}
          aria-invalid={!!backError}
          aria-describedby={backError ? backErrorId : undefined}
          placeholder="Wpisz treść tylnej strony fiszki"
          className={`w-full min-h-[120px] p-3 rounded-md bg-gray-800 text-gray-100 border ${
            backError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : backFocused
                ? "border-primary focus:border-primary focus:ring-primary"
                : "border-gray-700 focus:border-gray-600"
          } focus:outline-none focus:ring-2 focus:ring-offset-0`}
          required
        />
        
        {backError && (
          <p className="text-red-400 text-xs" id={backErrorId}>
            {backError}
          </p>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 rounded-md text-white hover:text-gray-300 transition-colors"
        >
          Anuluj
        </button>
        
        <button
          type="submit"
          disabled={isSaveDisabled}
          className={`px-4 py-2 rounded-md shadow-light hover:shadow-medium transition-all duration-300 ${
            isSaveDisabled
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-primary via-secondary-400 to-accent-200 text-white hover:opacity-90"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Zapisywanie...
            </span>
          ) : (
            "Zapisz"
          )}
        </button>
      </div>
    </form>
  );
};
