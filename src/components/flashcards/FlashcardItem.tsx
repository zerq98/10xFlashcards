import { type FlashcardVM } from '../../hooks/useFlashcards';

interface FlashcardItemProps {
  flashcard: FlashcardVM;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onFlip: (id: string) => void;
}

export function FlashcardItem({ 
  flashcard, 
  onEdit, 
  onDelete, 
  onFlip 
}: FlashcardItemProps) {
  const { id, front, back, isFlipped, is_ai_generated } = flashcard;
  
  return (
    <div 
      className={`relative h-56 rounded-lg shadow-medium border border-gray-700 transition-all duration-300 ${
        isFlipped ? 'shadow-primary/10' : 'shadow-medium'
      }`}
    >
      {/* AI Badge */}
      {is_ai_generated && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center px-2 py-1 rounded-full bg-accent-200/20 border border-accent-200/30">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-3 h-3 text-accent-200 mr-1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-medium text-accent-200">AI</span>
          </div>
        </div>
      )}      {/* Card Content - Inner container for flip effect */}
      <div 
        className="relative w-full h-full cursor-pointer select-none"
        onClick={() => onFlip(id)}
      >
        {/* Front side */}
        <div 
          className={`absolute inset-0 w-full h-full flex flex-col justify-center items-center p-6 bg-background rounded-lg border border-gray-700 transition-all duration-300 ${
            isFlipped ? 'opacity-0 -z-10 transform rotate-y-180' : 'opacity-100 z-10'
          }`}
        >
          <div className="w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent max-h-36">
            <p className="text-lg text-center text-white font-medium">{front}</p>
          </div>
          <div className="mt-4 text-sm text-gray-400">Kliknij, aby odwrócić</div>
        </div>
        
        {/* Back side */}
        <div 
          className={`absolute inset-0 w-full h-full flex flex-col justify-center items-center p-6 bg-background rounded-lg border border-gray-700 transition-all duration-300 ${
            isFlipped ? 'opacity-100 z-10' : 'opacity-0 -z-10 transform rotate-y-180'
          }`}
        >
          <div className="w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent max-h-36">
            <p className="text-lg text-center text-white">{back}</p>
          </div>
          <div className="mt-4 text-sm text-gray-400">Kliknij, aby odwrócić</div>
        </div>
      </div>

      {/* Control buttons - stays visible on both sides */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 p-3 z-20">        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(id);
          }}
          className="p-2 rounded-full bg-gradient-to-r from-primary/20 via-secondary-400/20 to-accent-200/20 hover:from-primary/40 hover:via-secondary-400/40 hover:to-accent-200/40 text-white transition-colors cursor-pointer"
          aria-label="Edytuj fiszkę"
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
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
            />
          </svg>
        </button>        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-white transition-colors cursor-pointer"
          aria-label="Usuń fiszkę"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
