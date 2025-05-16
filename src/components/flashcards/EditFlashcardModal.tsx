import { useState, useEffect } from "react";
import { type FlashcardVM } from "../../hooks/useFlashcards";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

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

  // Load flashcard data when modal opens
  useEffect(() => {
    if (isOpen && flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      // Clear any errors
      setFrontError(null);
      setBackError(null);
    }
  }, [isOpen, flashcard]);

  // Handle front text change with validation
  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFront(value);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="bg-background border border-gray-700 rounded-lg shadow-medium w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Edytuj fiszkę</h3>{" "}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Zamknij"
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 overflow-y-auto max-h-[calc(90vh-130px)]"
        >
          <div className="space-y-4">
            {" "}
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
            </div>{" "}
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
            {" "}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-md text-white hover:bg-gray-800 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              Anuluj
            </button>{" "}
            <button
              type="submit"
              className={`px-4 py-2 rounded-md bg-gradient-to-r from-primary via-secondary-400 to-accent-200 text-white shadow-light hover:shadow-medium transition-shadow ${
                isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
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
      </div>
    </div>
  );
}
