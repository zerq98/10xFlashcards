interface DeleteConfirmationModalProps {
  isOpen: boolean;
  flashcardId: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  flashcardId,
  onConfirm,
  onClose,
  isLoading,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="bg-background border border-gray-700 rounded-lg shadow-medium w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Potwierdź usunięcie</h3>{" "}
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
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white shadow-light hover:shadow-medium transition-all ${
                isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
              disabled={isLoading}
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
                  Usuwanie...
                </div>
              ) : (
                "Usuń"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
