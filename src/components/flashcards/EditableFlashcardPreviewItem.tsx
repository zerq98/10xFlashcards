import React, { useState } from "react";
import { useId } from "react";

interface EditableFlashcardPreviewItemProps {
  localId: string;
  front: string;
  back: string;
  wasEdited: boolean;
  onEdit: (localId: string, newFront: string, newBack: string) => void;
  onDelete: (localId: string) => void;
}

export const EditableFlashcardPreviewItem = ({
  localId,
  front,
  back,
  wasEdited,
  onEdit,
  onDelete,
}: EditableFlashcardPreviewItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [frontText, setFrontText] = useState(front);
  const [backText, setBackText] = useState(back);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  // IDs for accessibility
  const frontId = useId();
  const frontErrorId = useId();
  const backId = useId();
  const backErrorId = useId();

  // Constants for validation
  const MIN_TEXT_LENGTH = 1;
  const MAX_TEXT_LENGTH = 1000;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFrontText(front);
    setBackText(back);
    setFrontError(null);
    setBackError(null);
  };

  const handleSave = () => {
    // Validate before saving
    let hasErrors = false;

    if (!frontText.trim() || frontText.length < MIN_TEXT_LENGTH) {
      setFrontError(`Przednia strona fiszki jest wymagana`);
      hasErrors = true;
    } else if (frontText.length > MAX_TEXT_LENGTH) {
      setFrontError(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`);
      hasErrors = true;
    }

    if (!backText.trim() || backText.length < MIN_TEXT_LENGTH) {
      setBackError(`Tylna strona fiszki jest wymagana`);
      hasErrors = true;
    } else if (backText.length > MAX_TEXT_LENGTH) {
      setBackError(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`);
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    onEdit(localId, frontText, backText);
    setIsEditing(false);
  };
  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFrontText(value);

    // Clear error when user starts typing
    setFrontError(null);

    // Validate on change for immediate feedback
    if (!value.trim()) {
      setFrontError("Przednia strona fiszki jest wymagana");
    } else if (value.length > MAX_TEXT_LENGTH) {
      setFrontError(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`);
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBackText(value);

    // Clear error when user starts typing
    setBackError(null);

    // Validate on change for immediate feedback
    if (!value.trim()) {
      setBackError("Tylna strona fiszki jest wymagana");
    } else if (value.length > MAX_TEXT_LENGTH) {
      setBackError(`Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`);
    }
  };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = () => {
    console.log("Deleting flashcard with localId:", localId);
    onDelete(localId);
    setShowDeleteConfirm(false);
  };
  return (
    <div className="border border-gray-700 rounded-lg shadow-light p-4 mb-4 bg-background">
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent">
          <div
            className="bg-grays-950 border border-gray-700 rounded-lg shadow-medium w-full max-w-md"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-xl font-bold text-white">
                Potwierdź usunięcie
              </h3>
              <button
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Zamknij"
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

            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-500/20 p-3 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-white">
                  Czy na pewno chcesz usunąć tę fiszkę? Tej operacji nie można
                  cofnąć.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-gray-600 rounded-md text-white hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => handleConfirmDelete()}
                  className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white shadow-light hover:shadow-medium transition-all cursor-pointer"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-primary/20 via-secondary-400/20 to-accent-200/20 text-white">
            AI
          </span>
          {wasEdited && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
              Edytowano
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Anuluj edycję"
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
              <button
                onClick={handleSave}
                className="p-1 text-gray-400 hover:text-green-500 transition-colors cursor-pointer"
                aria-label="Zapisz zmiany"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                aria-label="Edytuj fiszkę"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                aria-label="Usuń fiszkę"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor={frontId}
              className="block text-sm font-medium text-white"
            >
              Przednia strona
            </label>
            <textarea
              id={frontId}
              value={frontText}
              onChange={handleFrontChange}
              className={`w-full min-h-[100px] px-3 py-2 bg-background border rounded-md shadow-inner focus:outline-none focus:ring-2 transition-colors ${
                frontError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-600 focus:ring-primary"
              }`}
              aria-invalid={!!frontError}
              aria-describedby={frontError ? frontErrorId : undefined}
            ></textarea>
            {frontError && (
              <p id={frontErrorId} className="text-sm text-red-500">
                {frontError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor={backId}
              className="block text-sm font-medium text-white"
            >
              Tylna strona
            </label>
            <textarea
              id={backId}
              value={backText}
              onChange={handleBackChange}
              className={`w-full min-h-[100px] px-3 py-2 bg-background border rounded-md shadow-inner focus:outline-none focus:ring-2 transition-colors ${
                backError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-600 focus:ring-primary"
              }`}
              aria-invalid={!!backError}
              aria-describedby={backError ? backErrorId : undefined}
            ></textarea>
            {backError && (
              <p id={backErrorId} className="text-sm text-red-500">
                {backError}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-1">
              Przednia strona
            </h4>
            <p className="text-white">{frontText}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-1">
              Tylna strona
            </h4>
            <p className="text-white">{backText}</p>
          </div>
        </div>
      )}
    </div>
  );
};
