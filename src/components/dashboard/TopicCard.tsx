import React, { useState } from 'react';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

interface TopicCardProps {
  id: string;
  name: string;
  flashcardCount: number;
  onDelete: (id: string) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ 
  id, 
  name, 
  flashcardCount, 
  onDelete 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <>
      <div className="rounded-lg border border-gray-700 bg-background p-5 shadow-light transition-shadow hover:shadow-medium">
        <div className="flex justify-between items-start">
          <a 
            href={`/topics/${id}`} 
            className="truncate max-w-[80%] text-xl font-semibold text-primary hover:text-opacity-80 transition-colors"
          >
            {name}
          </a>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Usuń temat"
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
        </div>
        <div className="mt-3 flex items-center">
          <span className="bg-accent bg-opacity-20 text-accent text-xs font-medium px-2.5 py-0.5 rounded-full">
            {flashcardCount} fiszek
          </span>
        </div>
      </div>
      
      {showDeleteDialog && (
        <ConfirmDeleteDialog
          isOpen={showDeleteDialog}
          topicId={id}
          topicName={name}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={onDelete}
        />
      )}
    </>
  );
};