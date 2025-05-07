import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '../../hooks/useToast';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  topicId: string;
  topicName: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export const ConfirmDeleteDialog = ({
  isOpen,
  topicId,
  topicName,
  onClose,
  onDeleted
}: ConfirmDeleteDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      const promise = fetch(`/api/topics/${topicId}`, {
        method: 'DELETE',
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to delete topic');
        }
        return topicId;
      });

      // Show toast with loading state
      toast.promise(promise, {
        loading: 'Usuwanie tematu...',
        success: () => `Temat "${topicName}" został usunięty`,
        error: () => 'Nie udało się usunąć tematu',
      });

      const deletedId = await promise;
      onDeleted(deletedId);
      onClose();
    } catch (error) {
      console.error('Error deleting topic:', error);
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Potwierdź usunięcie</DialogTitle>
        </DialogHeader>
        <p className="mb-6 text-text">
          Czy na pewno chcesz usunąć temat <span className="font-semibold">{topicName}</span>? 
          Wszystkie fiszki w tym temacie zostaną również usunięte. Ta operacja jest nieodwracalna.
        </p>
        <DialogFooter>
          <button
            onClick={onClose}
            className="rounded-md bg-gray-700 px-4 py-2 text-text hover:bg-gray-600"
            disabled={isDeleting}
          >
            Anuluj
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń temat'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};