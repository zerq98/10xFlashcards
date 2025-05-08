import React, { useEffect } from 'react';
import { useTopicsStore } from '../../store/useTopicsStore';
import { TopicCard } from './TopicCard';
import { SkeletonList } from './SkeletonList';

export const TopicList = () => {
  const { topics, loading, error, fetchTopics, removeTopic } = useTopicsStore();
  
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);
  
  const handleDeleteTopic = (id: string) => {
    removeTopic(id);
  };
  
  if (loading) {
    return <SkeletonList />;
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-red-500">{error}</p>
        <button 
          className="rounded-md px-4 py-2 cursor-pointer text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-primary hover:via-secondary-400 hover:to-accent-200 transition-all duration-300 shadow-light hover:shadow-medium"
          onClick={() => fetchTopics()}
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }
  
  if (topics.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-primary bg-opacity-20 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-primary" 
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
        <p className="mb-4 text-lg font-medium text-text">Nie masz jeszcze żadnych tematów.</p>
        <p className="text-gray-400">Kliknij "Nowy Temat" aby rozpocząć!</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <TopicCard 
          key={topic.id}
          id={topic.id}
          name={topic.name}
          flashcardCount={0} // To be updated when we have flashcard counts
          onDelete={handleDeleteTopic}
        />
      ))}
    </div>
  );
};