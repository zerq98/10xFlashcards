import React, { useState, useEffect } from "react";
import { GenerationInputStep } from "./GenerationInputStep";
import { GenerationPreviewStep, type GeneratedFlashcardPreviewViewModel } from "./GenerationPreviewStep";
import type { FlashcardDTO, GenerateFlashcardsResponseDTO, SaveGeneratedFlashcardsRequestDTO } from "../../types";
import { useToast } from "../../hooks/useToast";
import { LoadingIndicator } from "../ui/loading-indicator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface AIGenerationModalProps {
  isOpen: boolean;
  topicId: string;
  onClose: () => void;
  onSaveSuccess: (newFlashcards: FlashcardDTO[]) => void;
}

enum GenerationStep {
  INPUT = "input",
  GENERATING = "generating",
  PREVIEW = "preview",
  SAVING = "saving"
}

// Niepotrzebne enum Error zostało usunięte

export const AIGenerationModal = ({
  isOpen,
  topicId,
  onClose,
  onSaveSuccess,
}: AIGenerationModalProps) => {
  const [currentStep, setCurrentStep] = useState<GenerationStep>(GenerationStep.INPUT);
  const [sourceText, setSourceText] = useState("");
  const [flashcardCount, setFlashcardCount] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedFlashcardPreviewViewModel[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  
  const toast = useToast();  const handleInputSubmit = async (text: string, count: number) => {
    setSourceText(text);
    setFlashcardCount(count);
    setCurrentStep(GenerationStep.GENERATING);
    setError(null);
    
    try {
      // Track generation start time to ensure minimum loading time for better UX
      const startTime = Date.now();
      
      const response = await fetch(`/api/topics/${topicId}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          count,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMsg = responseData.error?.message || 
                         responseData.error?.code || 
                         "Nie udało się wygenerować fiszek";
                         
        console.error("Generation error details:", responseData.error);
        throw new Error(errorMsg);
      }
      
      if (!responseData.data) {
        throw new Error("Otrzymano nieprawidłową odpowiedź z serwera");
      }
      
      const generationResponse = responseData.data as GenerateFlashcardsResponseDTO;
      
      if (generationResponse.status === "error") {
        throw new Error(generationResponse.error_info || "Wystąpił błąd podczas generowania fiszek");
      }
      
      setGenerationId(generationResponse.generation_id);
      
      // Map the response to our view model
      const flashcardPreviews = generationResponse.flashcards.map(card => ({
        localId: card.id,
        front: card.front,
        back: card.back,
        isAiGenerated: true,
        wasEdited: false,
      }));
      
      setGeneratedFlashcards(flashcardPreviews);
      
      // Ensure minimum loading time of 1.5s for better UX
      const elapsedTime = Date.now() - startTime;
      const minimumLoadingTime = 1500; // 1.5 seconds
      
      if (elapsedTime < minimumLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minimumLoadingTime - elapsedTime));
      }
      
      setCurrentStep(GenerationStep.PREVIEW);
      
      // Customize message based on count
      const countText = flashcardPreviews.length === 1 
        ? '1 fiszkę' 
        : `${flashcardPreviews.length} ${flashcardPreviews.length < 5 ? 'fiszki' : 'fiszek'}`;
        
      toast.success(`Pomyślnie wygenerowano ${countText}`);
      
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      setCurrentStep(GenerationStep.INPUT);
      toast.error("Nie udało się wygenerować fiszek");
    }
  };

  const handleEditFlashcard = (localId: string, newFront: string, newBack: string) => {
    setGeneratedFlashcards(prev => 
      prev.map(card => 
        card.localId === localId 
          ? { ...card, front: newFront, back: newBack, wasEdited: true }
          : card
      )
    );
  };

  const handleDeleteFlashcard = (localId: string) => {
    console.log("Deleting flashcard with localId:", localId);
    setGeneratedFlashcards(prev => prev.filter(card => card.localId !== localId));
  };
  const handleSaveFlashcards = async (flashcardsToSave: SaveGeneratedFlashcardsRequestDTO) => {
    if (!generationId) {
      setError("Brak identyfikatora generacji");
      toast.error("Błąd podczas zapisywania: brak identyfikatora generacji");
      return;
    }
    
    // Don't save if there are no flashcards
    if (flashcardsToSave.flashcards.length === 0) {
      setError("Brak fiszek do zapisania");
      toast.error("Nie ma żadnych fiszek do zapisania");
      return;
    }
    
    setCurrentStep(GenerationStep.SAVING);
    setError(null);
    
    try {
      const response = await fetch(`/api/topics/${topicId}/generate/${generationId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flashcardsToSave),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMsg = responseData.error?.message || 
                         responseData.error?.code || 
                         "Nie udało się zapisać fiszek";
                         
        console.error("Save error details:", responseData.error);
        throw new Error(errorMsg);
      }
      
      if (!responseData.data) {
        throw new Error("Otrzymano nieprawidłową odpowiedź z serwera");
      }
      
      const savedFlashcards = responseData.data as FlashcardDTO[];
      const count = savedFlashcards.length;
      
      toast.success(`Pomyślnie zapisano ${count} ${count === 1 ? 'fiszkę' : count < 5 ? 'fiszki' : 'fiszek'}`);
      onSaveSuccess(savedFlashcards);
      
    } catch (err) {
      console.error("Error saving flashcards:", err);
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      setCurrentStep(GenerationStep.PREVIEW);
      toast.error("Nie udało się zapisać fiszek");
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case GenerationStep.INPUT:
        return (
          <GenerationInputStep
            initialText={sourceText}
            initialCount={flashcardCount}
            onSubmit={handleInputSubmit}
            isLoading={currentStep === GenerationStep.GENERATING}
          />
        );      case GenerationStep.GENERATING:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingIndicator 
              size="large" 
              text="Trwa generowanie fiszek w oparciu o podany tekst. To może zająć kilka chwil..." 
            />
            <p className="mt-4 text-xs text-gray-500">
              System analizuje treść i generuje pomocne fiszki, które będziesz mógł edytować przed zapisaniem
            </p>
          </div>
        );
      case GenerationStep.PREVIEW:
      case GenerationStep.SAVING:
        return (
          <GenerationPreviewStep
            previewFlashcards={generatedFlashcards}
            onSave={handleSaveFlashcards}
            onEditFlashcard={handleEditFlashcard}
            onDeleteFlashcard={handleDeleteFlashcard}
            isLoading={currentStep === GenerationStep.SAVING}
          />
        );
      default:
        return null;
    }
  };  // Komponent Dialog automatycznie obsługuje klawisze Escape
    // Komponent Dialog automatycznie obsługuje zablokowanie przewijania body
  
  const isCloseDisabled = 
    currentStep === GenerationStep.GENERATING || 
    currentStep === GenerationStep.SAVING;
  // Add ability to go back to input step from preview
  const handleBackToInput = () => {
    if (currentStep === GenerationStep.PREVIEW) {
      setCurrentStep(GenerationStep.INPUT);
    }
  };
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isCloseDisabled) {
          onClose();
        }
      }}
    >
      <DialogContent 
        className="border-0 bg-gray-900 m-0"
        onEscapeKeyDown={(e) => {
          if (isCloseDisabled) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-center">
            {currentStep === GenerationStep.PREVIEW && (
              <button
                onClick={handleBackToInput}
                className="mr-3 p-1 text-gray-400 hover:text-white transition-colors"
                aria-label="Wróć do edycji tekstu"
                title="Wróć do edycji tekstu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <DialogTitle className="text-xl font-semibold leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-400 to-accent-200">
              {currentStep === GenerationStep.PREVIEW || currentStep === GenerationStep.SAVING
                ? "Podgląd wygenerowanych fiszek"
                : "Generowanie fiszek AI"}
            </DialogTitle>
          </div>
          {currentStep !== GenerationStep.PREVIEW && currentStep !== GenerationStep.SAVING && (
            <p className="mt-2 text-sm text-gray-400">
              Wprowadź tekst, na podstawie którego zostaną wygenerowane fiszki.
            </p>
          )}
        </DialogHeader>
        
        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-500 rounded-md p-3 mb-6 animate-pulse">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          {renderCurrentStep()}
        </div>
        
        <DialogClose
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Zamknij"
          onClick={(e) => {
            if (isCloseDisabled) {
              e.preventDefault();
            } else {
              onClose();
            }
          }}
          disabled={isCloseDisabled}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${isCloseDisabled ? "text-gray-600" : ""}`}
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
};
