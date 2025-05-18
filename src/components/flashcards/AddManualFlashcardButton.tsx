import React, { useState } from "react";
import type { FlashcardDTO } from "../../types";
import { ManualFlashcardFormModal } from "./ManualFlashcardFormModal";

interface AddManualFlashcardButtonProps {
  topicId: string;
  variant?: "primary" | "outline";
  size?: "normal" | "large";
  onFlashcardAdded: (flashcard: FlashcardDTO) => void;
}

export const AddManualFlashcardButton = ({
  topicId,
  variant = "primary",
  size = "normal",
  onFlashcardAdded,
}: AddManualFlashcardButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Style based on variant and size
  const getStyle = () => {
    const baseStyle =
      "rounded-md px-4 py-2 font-medium shadow-light cursor-pointer";    const variantStyle =
      variant === "primary"
        ? "bg-transparent text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-400 to-accent-200 border border-gray-600 hover:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-primary hover:via-secondary-400 hover:to-accent-200 duration-300"
        : "bg-transparent text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary-400 to-accent-200 border border-gray-600 hover:border-transparent hover:text-white hover:bg-gradient-to-r hover:from-primary hover:via-secondary-400 hover:to-accent-200 transition-all";

    const sizeStyle =
      size === "large" ? "hover:scale-110 transition-all" : "transition-shadow";

    return `${baseStyle} ${variantStyle} ${sizeStyle}`;
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("AddManualFlashcardButton clicked");
    setIsModalOpen(true);
  };

  return (
    <>
      {" "}
      <button
        className={getStyle()}
        onClick={handleClick}
        type="button"
        aria-label="Dodaj nową fiszkę"
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
      >
        Dodaj fiszki
      </button>
      {isModalOpen && (
        <ManualFlashcardFormModal
          isOpen={isModalOpen}
          topicId={topicId}
          onClose={() => setIsModalOpen(false)}
          onFlashcardAdded={onFlashcardAdded}
        />
      )}
    </>
  );
};
