import React, { useState } from 'react';
import { NewTopicModal } from './NewTopicModal';
import { useTopicsStore } from '../../store/useTopicsStore';
import { Plus } from 'lucide-react';
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
    <>      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-white shadow-light transition-all hover:shadow-medium cursor-pointer group relative"
        aria-label="Utwórz nowy temat"
      >
        <span className="relative z-10 mr-2">
          <Plus className="h-5 w-5 text-white group-hover:text-primary transition-all duration-300" />
        </span>
        <span className="relative z-10 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:via-secondary-400 group-hover:to-accent-200 transition-all duration-300">
          Nowy Temat
        </span>
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