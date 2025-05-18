import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ManualFlashcardForm } from "./ManualFlashcardForm";
import type { CreateFlashcardRequestDTO, FlashcardDTO } from "../../types";

interface ManualFlashcardFormModalProps {
  isOpen: boolean;
  topicId: string;
  onClose: () => void;
  onFlashcardAdded: (flashcard: FlashcardDTO) => void;
  isLoading?: boolean;
}

export const ManualFlashcardFormModal = ({
  isOpen,
  topicId,
  onClose,
  onFlashcardAdded,
  isLoading = false,
}: ManualFlashcardFormModalProps) => {
  // State to track form changes and confirmation dialog
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  
  // Function to handle form changes
  const handleFormChange = () => {
    setHasFormChanges(true);
  };
  
  // Function to handle close with confirmation if needed
  const handleClose = () => {
    if (hasFormChanges) {
      // Show confirmation dialog using the onClose handler
      const userConfirmed = window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz zamknąć formularz?");
      
      if (userConfirmed) {
        onClose();
      }
      // If not confirmed, do nothing and keep the dialog open
    } else {
      // No changes, close directly
      onClose();
    }
  };
  // Handle saving the flashcard
  const handleSaveFlashcard = async (
    flashcardData: CreateFlashcardRequestDTO
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/topics/${topicId}/flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flashcardData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData?.error?.message ||
            "Wystąpił błąd podczas zapisywania fiszki"
        );
      }

      const newFlashcard = responseData?.data;

      if (newFlashcard) {
        onFlashcardAdded(newFlashcard);
        onClose();
      }
    } catch (error) {
      console.error("Error saving flashcard:", error);
      throw error;
    }
  };  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent 
        className="border-0 bg-gray-900 m-0"
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleClose();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-400 to-accent-200">
            Dodaj nową fiszkę
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-400">
            Uzupełnij pola, aby utworzyć nową fiszkę w bieżącym temacie.
          </p>
        </DialogHeader>
        
        <div className="mt-6">
          <ManualFlashcardForm
            topicId={topicId}
            onCancel={handleClose}
            onSave={handleSaveFlashcard}
            isLoading={isLoading}
            onChange={handleFormChange}
          />
        </div>
        
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
};
