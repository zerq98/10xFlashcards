import React from "react";
import { EditableFlashcardPreviewItem } from "./EditableFlashcardPreviewItem";
import type { SaveGeneratedFlashcardsRequestDTO } from "../../types";
import { LoadingIndicator } from "../ui/loading-indicator";

export interface GeneratedFlashcardPreviewViewModel {
  localId: string;
  front: string;
  back: string;
  isAiGenerated: boolean;
  wasEdited: boolean;
}

interface GenerationPreviewStepProps {
  previewFlashcards: GeneratedFlashcardPreviewViewModel[];
  onSave: (flashcardsToSave: SaveGeneratedFlashcardsRequestDTO) => void;
  onEditFlashcard: (localId: string, newFront: string, newBack: string) => void;
  onDeleteFlashcard: (localId: string) => void;
  isLoading: boolean;
}

export const GenerationPreviewStep = ({
  previewFlashcards,
  onSave,
  onEditFlashcard,
  onDeleteFlashcard,
  isLoading,
}: GenerationPreviewStepProps) => {
  const handleSave = () => {
    const flashcardsToSave: SaveGeneratedFlashcardsRequestDTO = {
      flashcards: previewFlashcards.map(card => ({
        front: card.front,
        back: card.back,
        was_edited_before_save: card.wasEdited
      }))
    };
    
    onSave(flashcardsToSave);
  };
  
  const isSaveDisabled = previewFlashcards.length === 0 || isLoading;
    // Get statistics about flashcards
  const totalCount = previewFlashcards.length;
  const editedCount = previewFlashcards.filter(card => card.wasEdited).length;
  const editedPercentage = totalCount > 0 ? Math.round((editedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white mb-2">
          Podgląd wygenerowanych fiszek
        </h3>
        <p className="text-gray-400">
          Możesz edytować lub usunąć fiszki przed zapisaniem do tematu.
        </p>
        {totalCount > 0 && (
          <div className="flex items-center mt-4 p-2 bg-gray-800/50 rounded-md">
            <div className="text-xs text-gray-300">
              <span className="font-bold">{totalCount}</span> fiszek 
              {editedCount > 0 && (
                <> (<span className="font-bold">{editedCount}</span> edytowanych - <span className="font-bold">{editedPercentage}%</span>)</>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
        {isLoading ? (
          <LoadingIndicator text="Zapisywanie fiszek..." />
        ) : previewFlashcards.length > 0 ? (
          previewFlashcards.map((flashcard) => (
            <EditableFlashcardPreviewItem
              localId={flashcard.localId}
              front={flashcard.front}
              back={flashcard.back}
              wasEdited={flashcard.wasEdited}
              onEdit={onEditFlashcard}
              onDelete={onDeleteFlashcard}
            />
          ))
        ) : (
          <div className="text-center p-6 border border-gray-700 rounded-lg">
            <p className="text-gray-400">Brak fiszek do wyświetlenia</p>
            <p className="text-xs text-gray-500 mt-2">Wszystkie fiszki zostały usunięte</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-6">
        <div className="text-sm text-gray-400">
          {totalCount > 0 && !isLoading && (
            <span>Edytuj fiszki przed zapisaniem w celu lepszego dopasowania do własnych potrzeb</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className={`rounded-md px-4 py-2 font-medium shadow-light cursor-pointer
            ${isSaveDisabled
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
              Zapisywanie...
            </span>
          ) : (
            `Zapisz ${totalCount} ${totalCount === 1 ? 'fiszkę' : totalCount < 5 ? 'fiszki' : 'fiszek'}`
          )}
        </button>
      </div>
    </div>
  );
};
