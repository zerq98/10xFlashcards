import { useState, useEffect } from "react";
import { useFlashcards, type FlashcardVM } from "../../hooks/useFlashcards";
import { useModalState } from "../../hooks/useModalState";
import { FlashcardList } from "./FlashcardList";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { useToast } from "../../hooks/useToast";
import type { FlashcardDTO } from "../../types";
import { FlashcardSkeletonList } from "./FlashcardSkeletonList";
import { AddManualFlashcardButton } from "./AddManualFlashcardButton";

interface FlashcardsSectionProps {
  topicId: string;
}

export function FlashcardsSection({ topicId }: FlashcardsSectionProps) {
  const {
    flashcards,
    loading,
    error,
    fetchFlashcards,
    updateFlashcard,
    deleteFlashcard,
    toggleFlip,
  } = useFlashcards(topicId);
  const {
    isEditOpen,
    isDeleteOpen,
    selectedId,
    openEditModal,
    openDeleteModal,
    closeModals,
  } = useModalState();

  const [topicName, setTopicName] = useState<string>("Temat");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  // Fetch topic name
  useEffect(() => {
    const getTopicName = async () => {
      try {
        const response = await fetch(`/api/topics/${topicId}`);
        if (response.ok) {
          const data = await response.json();
          setTopicName(data.data.name);
        }
      } catch (err) {
        console.error("Error fetching topic:", err);
      }
    };

    getTopicName();
  }, [topicId]);

  // Handle flashcard update
  const handleUpdateFlashcard = async (flashcardData: {
    front: string;
    back: string;
  }) => {
    if (!selectedId) return;

    setIsUpdating(true);

    try {
      await updateFlashcard(selectedId, flashcardData);
      toast.success("Fiszka została zaktualizowana");
      closeModals();
    } catch (err) {
      toast.error("Nie udało się zaktualizować fiszki");
      console.error("Error updating flashcard:", err);
    } finally {
      setIsUpdating(false);
    }
  };
  // Handle flashcard deletion
  const handleDeleteFlashcard = async () => {
    if (!selectedId) return;

    setIsDeleting(true);

    try {
      await deleteFlashcard(selectedId);
      toast.success("Fiszka została usunięta");
      closeModals();
    } catch (err) {
      toast.error("Nie udało się usunąć fiszki");
      console.error("Error deleting flashcard:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle new flashcard added
  const handleFlashcardAdded = (newFlashcard: FlashcardDTO) => {
    fetchFlashcards();
    toast.success("Fiszka została dodana");
  };

  // Get the currently selected flashcard
  const selectedFlashcard = selectedId
    ? flashcards.find((card) => card.id === selectedId)
    : null;
  if (loading) {
    return <FlashcardSkeletonList />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-red-500">{error}</p>{" "}
        <button
          className="rounded-md px-4 py-2 cursor-pointer text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:via-secondary-400 hover:to-accent-200 transition-all duration-300 shadow-light hover:shadow-medium"
          onClick={() => fetchFlashcards()}
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-background shadow-medium max-w-lg mx-auto">
        <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-r from-primary/20 via-secondary-400/20 to-accent-200/20 flex items-center justify-center shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 text-gradient bg-gradient-to-r from-primary via-secondary-400 to-accent-200 bg-clip-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold bg-gradient-to-r from-primary via-secondary-400 to-accent-200 text-transparent bg-clip-text">
          Brak fiszek
        </h3>
        <p className="mb-4 text-lg font-medium text-white">
          Nie masz jeszcze fiszek w tym temacie.
        </p>
        <p className="text-gray-400 mb-6">
          Dodaj swoje pierwsze fiszki lub wygeneruj je przy pomocy AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <AddManualFlashcardButton
            topicId={topicId}
            onFlashcardAdded={handleFlashcardAdded}
          />
          <a
            href={`/topics/${topicId}/generate`}
            className="rounded-md px-4 py-2 bg-transparent border border-gradient-to-r from-primary via-secondary-400 to-accent-200 text-white font-medium shadow-light hover:shadow-medium transition-all duration-300 cursor-pointer hover:scale-110"
          >
            Generuj z AI
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary-400 to-accent-200 text-transparent bg-clip-text">
          {topicName}
        </h1>
        <p className="text-gray-400 mt-2">
          {flashcards.length} {flashcards.length === 1 ? "fiszka" : "fiszki"}
        </p>
      </div>
      <div className="flex justify-end mb-6 gap-3">
       <AddManualFlashcardButton
            topicId={topicId}
            onFlashcardAdded={handleFlashcardAdded}
          />
        <a
          href={`/topics/${topicId}/generate`}
          className="rounded-md px-4 py-2 bg-gradient-to-r from-primary via-secondary-400 to-accent-200 text-white font-medium shadow-light hover:shadow-medium transition-shadow duration-300 cursor-pointer"
        >
          Generuj z AI
        </a>
      </div>

      <FlashcardList
        flashcards={flashcards}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onFlip={toggleFlip}
      />

      {selectedFlashcard && isEditOpen && (
        <EditFlashcardModal
          isOpen={isEditOpen}
          flashcard={selectedFlashcard}
          onSave={handleUpdateFlashcard}
          onClose={closeModals}
          isLoading={isUpdating}
        />
      )}
      {selectedId && isDeleteOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteOpen}
          flashcardId={selectedId}
          onConfirm={handleDeleteFlashcard}
          onClose={closeModals}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
