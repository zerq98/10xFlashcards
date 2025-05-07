import React, { useState } from 'react';
import { NewTopicModal } from './NewTopicModal';
import { useTopicsStore } from '../../store/useTopicsStore';
import type { TopicDTO } from '../../types';

export const NewTopicButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addTopic } = useTopicsStore();
  
  const handleTopicCreated = (topic: TopicDTO) => {
    addTopic(topic);
    setIsModalOpen(false);
    
    // Navigate to the newly created topic
    window.location.href = `/topics/${topic.id}`;
  };
  
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center rounded-md bg-gradient-primary px-4 py-2 text-white shadow-light transition-shadow hover:shadow-medium"
        aria-label="Utwórz nowy temat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2 h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Nowy Temat
      </button>
      
      {isModalOpen && (
        <NewTopicModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleTopicCreated}
        />
      )}
    </>
  );
};