import { useState, useEffect, useCallback } from 'react';
import type { FlashcardDTO, ApiSuccessResponse, ApiErrorResponse } from '../types';

// Define response structure with pagination
interface FlashcardsListResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
    next_cursor?: string;
  };
}

// Extended type with UI state
export interface FlashcardVM {
  id: string;
  front: string;
  back: string;
  is_ai_generated: boolean;
  sr_state: any; // Using 'any' since we don't know the exact type
  created_at: string;
  updated_at: string;
  isFlipped: boolean;
}

export const useFlashcards = (topicId: string) => {
  const [flashcards, setFlashcards] = useState<FlashcardVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<FlashcardsListResponseDTO['pagination'] | null>(null);

  // Convert DTO to view model
  const mapToViewModel = (dto: FlashcardDTO): FlashcardVM => ({
    ...dto,
    isFlipped: false // Initially not flipped
  });

  // Fetch flashcards from API
  const fetchFlashcards = useCallback(async () => {
    if (!topicId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/topics/${topicId}/flashcards`, {
        credentials: 'same-origin',
      });
        const data = await response.json();
      
      if (!response.ok) {
        const errorResponse = data as ApiErrorResponse;
        throw new Error(errorResponse.error.message || 'Failed to fetch flashcards');
      }
        // The API returns a FlashcardsListResponseDTO which includes flashcards and pagination
      const successResponse = data as ApiSuccessResponse<{
        flashcards: FlashcardDTO[];
        pagination: {
          current_page: number;
          total_pages: number;
          total_items: number;
          per_page: number;
          next_cursor?: string;
        };
      }>;
      
      console.log('API response data:', successResponse);
      
      // Check if the response has the expected structure
      if (!successResponse.data || !Array.isArray(successResponse.data.flashcards)) {
        console.error('Invalid API response format:', successResponse);
        throw new Error('Unexpected API response format: missing flashcards array');
      }
        const flashcardsVMs = successResponse.data.flashcards.map(mapToViewModel);
      setFlashcards(flashcardsVMs);
      
      // Also store the pagination information
      setPagination(successResponse.data.pagination);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  }, [topicId]);
  
  // Update a flashcard
  const updateFlashcard = useCallback(async (id: string, updates: { front: string; back: string }) => {
    try {
      const response = await fetch(`/api/topics/${topicId}/flashcards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'same-origin',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorResponse = data as ApiErrorResponse;
        throw new Error(errorResponse.error.message || 'Failed to update flashcard');
      }
        // Make sure we're handling the correct response structure
      const successResponse = data as ApiSuccessResponse<FlashcardDTO>;
      
      // Update the flashcards list with the updated card
      setFlashcards(currentFlashcards => 
        currentFlashcards.map(card => 
          card.id === id 
            ? { ...mapToViewModel(successResponse.data), isFlipped: card.isFlipped } 
            : card
        )
      );
      
      return successResponse.data;
    } catch (err) {
      console.error('Error updating flashcard:', err);
      throw err;
    }
  }, [topicId]);
  
  // Delete a flashcard
  const deleteFlashcard = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/topics/${topicId}/flashcards/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete flashcard';
        
        // Try to parse error response if it exists
        if (response.headers.get('content-type')?.includes('application/json')) {
          const data = await response.json() as ApiErrorResponse;
          errorMessage = data.error.message || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      // Remove the deleted flashcard from state
      setFlashcards(currentFlashcards => 
        currentFlashcards.filter(card => card.id !== id)
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting flashcard:', err);
      throw err;
    }
  }, [topicId]);
  
  // Toggle flashcard flip state
  const toggleFlip = useCallback((id: string) => {
    setFlashcards(currentFlashcards => 
      currentFlashcards.map(card => 
        card.id === id 
          ? { ...card, isFlipped: !card.isFlipped } 
          : card
      )
    );
  }, []);

  // Load flashcards when the component mounts or topicId changes
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);
  return {
    flashcards,
    loading,
    error,
    pagination,
    fetchFlashcards,
    updateFlashcard,
    deleteFlashcard,
    toggleFlip
  };
};
