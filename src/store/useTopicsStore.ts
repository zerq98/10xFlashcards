import { create } from 'zustand';
import type { TopicDTO } from '../types';

interface TopicsState {
  topics: TopicDTO[];
  loading: boolean;
  error?: string;
  fetchTopics: () => Promise<void>;
  addTopic: (topic: TopicDTO) => void;
  removeTopic: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
}

export const useTopicsStore = create<TopicsState>((set, get) => ({
  topics: [],
  loading: false,
  error: undefined,
  
  fetchTopics: async () => {
    try {
      set({ loading: true, error: undefined });
      const response = await fetch('/api/topics');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch topics');
      }
      
      const { data } = await response.json();
      set({ topics: data, loading: false });
    } catch (error) {
      console.error('Error fetching topics:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred', 
        loading: false 
      });
    }
  },
  
  addTopic: (topic) => {
    set((state) => ({ topics: [...state.topics, topic] }));
  },
  
  removeTopic: (id) => {
    set((state) => ({ 
      topics: state.topics.filter((topic) => topic.id !== id) 
    }));
  },
  
  setLoading: (loading) => {
    set({ loading });
  },
  
  setError: (error) => {
    set({ error });
  }
}));