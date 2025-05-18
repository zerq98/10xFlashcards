import React, { useState, useEffect } from "react";
import { useId } from "react";

interface GenerationInputStepProps {
  initialText: string;
  initialCount: number;
  onSubmit: (text: string, count: number) => void;
  isLoading: boolean;
}

export const GenerationInputStep = ({
  initialText = "",
  initialCount = 5,
  onSubmit,
  isLoading,
}: GenerationInputStepProps) => {
  const [text, setText] = useState(initialText);
  const [count, setCount] = useState(initialCount);
  const [textError, setTextError] = useState<string | null>(null);
  const [countError, setCountError] = useState<string | null>(null);
  const [showTextHint, setShowTextHint] = useState(false);

  // IDs for accessibility
  const textAreaId = useId();
  const textErrorId = useId();
  const countId = useId();
  const countErrorId = useId();

  // Constants for validation
  const MIN_TEXT_LENGTH = 100;
  const MAX_TEXT_LENGTH = 10000;
  const MIN_COUNT = 1;
  const MAX_COUNT = 20;
  
  // Initialize with previous values if available
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
    
    if (initialCount && initialCount >= MIN_COUNT && initialCount <= MAX_COUNT) {
      setCount(initialCount);
    }
  }, [initialText, initialCount]);
  
  // Show hint when textarea is focused but empty
  const handleTextFocus = () => {
    if (text.length === 0) {
      setShowTextHint(true);
    }
  };
  
  const handleTextBlur = () => {
    setShowTextHint(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    
    // Clear error when user starts typing
    setTextError(null);
    
    // Hide hint when user starts typing
    if (value.length > 0) {
      setShowTextHint(false);
    }
    
    // Validate on change for immediate feedback
    if (value.length > MAX_TEXT_LENGTH) {
      setTextError(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`);
    }
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    
    if (isNaN(value)) {
      setCount(MIN_COUNT);
      return;
    }
    
    // Clamp value between MIN_COUNT and MAX_COUNT
    const clampedValue = Math.min(Math.max(value, MIN_COUNT), MAX_COUNT);
    setCount(clampedValue);
    
    // Clear error
    setCountError(null);
    
    // Validate on change
    if (value < MIN_COUNT || value > MAX_COUNT) {
      setCountError(`Liczba fiszek musi być między ${MIN_COUNT} a ${MAX_COUNT}`);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate before submitting
    let hasErrors = false;
    
    if (text.length < MIN_TEXT_LENGTH) {
      setTextError(`Tekst musi zawierać co najmniej ${MIN_TEXT_LENGTH} znaków`);
      hasErrors = true;
    } else if (text.length > MAX_TEXT_LENGTH) {
      setTextError(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`);
      hasErrors = true;
    }
    
    if (count < MIN_COUNT || count > MAX_COUNT) {
      setCountError(`Liczba fiszek musi być między ${MIN_COUNT} a ${MAX_COUNT}`);
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    // Submit the form if validation passes
    onSubmit(text, count);
  };

  // Calculate remaining characters
  const remainingChars = MAX_TEXT_LENGTH - text.length;
  const isNearLimit = remainingChars < 500;
  const isOverLimit = remainingChars < 0;

  const isSubmitDisabled = 
    isLoading || 
    text.length < MIN_TEXT_LENGTH || 
    text.length > MAX_TEXT_LENGTH ||
    count < MIN_COUNT ||
    count > MAX_COUNT;
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label 
            htmlFor={textAreaId} 
            className="block text-sm font-medium text-white"
          >
            Tekst źródłowy
          </label>
          <span 
            className={`text-xs ${
              isOverLimit 
                ? "text-red-500" 
                : isNearLimit 
                  ? "text-yellow-500" 
                  : "text-gray-400"
            }`}
          >
            {text.length}/{MAX_TEXT_LENGTH} znaków
          </span>
        </div>
        
        <div className="relative">
          <textarea
            id={textAreaId}
            value={text}
            onChange={handleTextChange}
            onFocus={handleTextFocus}
            onBlur={handleTextBlur}
            placeholder="Wklej tekst, z którego chcesz wygenerować fiszki..."
            className={`w-full h-60 px-3 py-2 bg-background border rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
              textError ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-primary"
            }`}
            aria-invalid={!!textError}
            aria-describedby={textError ? textErrorId : undefined}
            disabled={isLoading}
          ></textarea>
          
          {showTextHint && (
            <div className="absolute inset-0 bg-background/90 border border-gray-600 rounded-md flex flex-col items-center justify-center p-4 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-1">Wklej tekst, aby rozpocząć</h3>
              <p className="text-center text-gray-400 text-sm">
                Wklej artykuł, notatkę lub dowolny tekst źródłowy, z którego AI wygeneruje fiszki
              </p>
            </div>
          )}
        </div>
        
        {textError && (
          <p id={textErrorId} className="text-sm text-red-500">
            {textError}
          </p>
        )}
        
        <p className="text-xs text-gray-400">
          Najlepsze rezultaty uzyskasz wklejając spójny tekst o pojedynczym temacie, o długości minimum {MIN_TEXT_LENGTH} znaków.
        </p>
      </div>

      <div className="space-y-2">
        <label 
          htmlFor={countId} 
          className="block text-sm font-medium text-white"
        >
          Liczba fiszek do wygenerowania
        </label>
        <div className="flex items-center space-x-2">
          <input
            id={countId}
            type="number"
            min={MIN_COUNT}
            max={MAX_COUNT}
            value={count}
            onChange={handleCountChange}
            className={`w-24 px-3 py-2 bg-background border rounded-md shadow-inner focus:outline-none focus:ring-2 transition-colors ${
              countError ? "border-red-500 focus:ring-red-500" : "border-gray-600 focus:ring-primary"
            }`}
            aria-invalid={!!countError}
            aria-describedby={countError ? countErrorId : undefined}
            disabled={isLoading}
          />
          <div className="text-sm text-gray-400">
            Dozwolony zakres: {MIN_COUNT} - {MAX_COUNT}
          </div>
        </div>
        {countError && (
          <p id={countErrorId} className="text-sm text-red-500">
            {countError}
          </p>
        )}
      </div>

      <div className="border-t border-gray-700 pt-4 mt-6">
        <div className="flex items-center text-gray-400 text-sm mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Wygenerowane fiszki będziesz mógł edytować przed zapisaniem</span>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`rounded-md px-4 py-2 font-medium shadow-light cursor-pointer
              ${isSubmitDisabled
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-primary via-secondary-400 to-accent-200 text-white hover:shadow-medium transition-shadow"
              }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generowanie...
              </span>
            ) : (
              "Generuj fiszki"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
