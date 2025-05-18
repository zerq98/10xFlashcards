import React, { useState, useEffect } from "react";
import { type FlashcardVM } from "../../hooks/useFlashcards";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface EditFlashcardModalProps {
  isOpen: boolean;
  flashcard: FlashcardVM;
  onSave: (data: { front: string; back: string }) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function EditFlashcardModal({
  isOpen,
  flashcard,
  onSave,
  onClose,
  isLoading,
}: EditFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load flashcard data when modal opens  // For tracking the original values to detect changes
  const [originalFront, setOriginalFront] = useState("");
  const [originalBack, setOriginalBack] = useState("");
  
  useEffect(() => {
    if (isOpen && flashcard) {
      const frontContent = flashcard.front;
      const backContent = flashcard.back;
      
      setFront(frontContent);
      setBack(backContent);
      // Store original values
      setOriginalFront(frontContent);
      setOriginalBack(backContent);
      // Clear any errors
      setFrontError(null);
      setBackError(null);
      setHasChanges(false);
    }
  }, [isOpen, flashcard]);
  // Handle front text change with validation
  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFront(value);
    
    // Check if the content is actually different from the original
    setHasChanges(value !== originalFront || back !== originalBack);

    if (!value.trim()) {
      setFrontError("Przód fiszki nie może być pusty");
    } else if (value.length > 500) {
      setFrontError("Maksymalna długość tekstu to 500 znaków");
    } else {
      setFrontError(null);
    }
  };

  // Handle back text change with validation
  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBack(value);
    
    // Check if the content is actually different from the original
    setHasChanges(front !== originalFront || value !== originalBack);

    if (!value.trim()) {
      setBackError("Tył fiszki nie może być pusty");
    } else if (value.length > 500) {
      setBackError("Maksymalna długość tekstu to 500 znaków");
    } else {
      setBackError(null);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fields
    let isValid = true;

    if (!front.trim()) {
      setFrontError("Przód fiszki nie może być pusty");
      isValid = false;
    }

    if (!back.trim()) {
      setBackError("Tył fiszki nie może być pusty");
      isValid = false;
    }

    if (front.length > 500) {
      setFrontError("Maksymalna długość tekstu to 500 znaków");
      isValid = false;
    }

    if (back.length > 500) {
      setBackError("Maksymalna długość tekstu to 500 znaków");
      isValid = false;
    }

    if (isValid) {
      onSave({
        front: front.trim(),
        back: back.trim(),
      });
    }
  };
  // Handle close with confirmation if there are changes
  const handleClose = () => {
    if (hasChanges) {
      const userConfirmed = window.confirm(
        "Masz niezapisane zmiany. Czy na pewno chcesz zamknąć formularz?"
      );
      if (userConfirmed) {
        onClose();
      }
      // If not confirmed, do nothing and keep the dialog open
    } else {
      // No changes, close directly
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >      <DialogContent
        className="border-0 bg-gray-900 m-0"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleClose();
        }}
        onInteractOutside={(e) => {
          if (hasChanges) {
            e.preventDefault();
            handleClose();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-400 to-accent-200">
            Edytuj fiszkę
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-400">
            Edytuj zawartość swojej fiszki poniżej.
          </p>
        </DialogHeader>        {/* Keyboard shortcuts info */}
        <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mt-4">
          <span>Skróty: </span>
          <kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700 text-gray-400">Esc</kbd>
          <span>anuluj</span>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-4">
            {/* Front side */}
            <div className="space-y-2">
              <Label htmlFor="front">Przód</Label>
              <div className="relative">
                <Textarea
                  id="front"
                  value={front}
                  onChange={handleFrontChange}
                  rows={3}
                  className={frontError ? "border-red-500" : ""}
                  placeholder="Wpisz tekst dla przodu fiszki"
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {front.length}/500
                </div>
              </div>
              {frontError && (
                <p className="mt-1 text-sm text-red-500">{frontError}</p>
              )}
            </div>

            {/* Back side */}
            <div className="space-y-2">
              <Label htmlFor="back">Tył</Label>
              <div className="relative">
                <Textarea
                  id="back"
                  value={back}
                  onChange={handleBackChange}
                  rows={3}
                  className={backError ? "border-red-500" : ""}
                  placeholder="Wpisz tekst dla tyłu fiszki"
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {back.length}/500
                </div>
              </div>
              {backError && (
                <p className="mt-1 text-sm text-red-500">{backError}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-600 rounded-md text-white hover:bg-gray-800 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md bg-gradient-to-r from-primary via-secondary-400 to-accent-200 text-white shadow-light hover:shadow-medium transition-shadow ${
                isLoading || !!frontError || !!backError
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              disabled={isLoading || !!frontError || !!backError}
            >
              {isLoading ? (
                <div className="flex items-center">
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
                </div>
              ) : (
                "Zapisz"
              )}
            </button>
          </div>
        </form>

        <DialogClose
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Zamknij"
          onClick={(e) => {
            e.preventDefault();
            handleClose();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
