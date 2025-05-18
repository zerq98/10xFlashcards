import React, { useState } from "react";
import type { FlashcardDTO } from "../../types";
import { AIGenerationModal } from "./AIGenerationModal";

interface AddAIFlashcardButtonProps {
  topicId: string;
  variant?: "primary" | "outline";
  size?: "normal" | "large";
  onFlashcardsAdded: (flashcards: FlashcardDTO[]) => void;
}

export const AddAIFlashcardButton = ({
  topicId,
  variant = "primary",
  size = "normal",
  onFlashcardsAdded,
}: AddAIFlashcardButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);  // Style based on variant and size
  const getStyle = () => {
    const baseStyle =
      "rounded-md px-4 py-2 font-medium shadow-light cursor-pointer";    
    const variantStyle =
      variant === "primary"
        ? "bg-transparent text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-400 to-accent-200 border border-gray-600 hover:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-primary hover:via-secondary-400 hover:to-accent-200 duration-300"
        : "bg-transparent text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-400 to-accent-200 border border-gray-600 hover:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-primary hover:via-secondary-400 hover:to-accent-200 transition-all";

    const sizeStyle =
      size === "large" ? "hover:scale-110 transition-all" : "transition-shadow";

    return `${baseStyle} ${variantStyle} ${sizeStyle}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleSaveSuccess = (newFlashcards: FlashcardDTO[]) => {
    onFlashcardsAdded(newFlashcards);
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        className={getStyle()}
        onClick={handleClick}
        type="button"
        aria-label="Wygeneruj fiszki AI"
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
      >
        Wygeneruj fiszki AI
      </button>
      {isModalOpen && (
        <AIGenerationModal
          isOpen={isModalOpen}
          topicId={topicId}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </>
  );
};
