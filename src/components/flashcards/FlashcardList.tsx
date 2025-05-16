import { type FlashcardVM } from '../../hooks/useFlashcards';
import { FlashcardItem } from './FlashcardItem';

interface FlashcardListProps {
  flashcards: FlashcardVM[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onFlip: (id: string) => void;
}

export function FlashcardList({ 
  flashcards, 
  onEdit, 
  onDelete, 
  onFlip 
}: FlashcardListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {flashcards.map((flashcard) => (
        <FlashcardItem
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={onEdit}
          onDelete={onDelete}
          onFlip={onFlip}
        />
      ))}
    </div>
  );
};
