import { useState, useCallback } from 'react';

export const useModalState = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const openEditModal = useCallback((id: string) => {
    setSelectedId(id);
    setIsEditOpen(true);
  }, []);

  const openDeleteModal = useCallback((id: string) => {
    setSelectedId(id);
    setIsDeleteOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    // We delay clearing the selected ID to avoid UI jumps 
    // during modal closing animations
    setTimeout(() => setSelectedId(null), 300);
  }, []);

  return {
    isEditOpen,
    isDeleteOpen,
    selectedId,
    openEditModal,
    openDeleteModal,
    closeModals
  };
};
