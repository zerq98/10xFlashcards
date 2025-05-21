import { describe, it, expect, beforeEach } from 'vitest';
import { server } from './setup';

describe('Topics API Integration', () => {
  beforeEach(() => {
    console.log('💡 Starting topics API test...');
  });

  it('should fetch topics list successfully', async () => {
    console.log('🔍 Testing topics list retrieval');
    const response = await fetch('/api/topics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    
    const jsonResponse = await response.json();
    console.log('📦 Response data:', jsonResponse);
    
    expect(jsonResponse.data).toBeDefined();
    expect(Array.isArray(jsonResponse.data)).toBe(true);
    expect(jsonResponse.data.length).toBeGreaterThan(0);
    
    // Check first topic structure
    const firstTopic = jsonResponse.data[0];
    expect(firstTopic.id).toBeDefined();
    expect(firstTopic.name).toBeDefined();
    expect(firstTopic.flashcard_count).toBeDefined();
    expect(typeof firstTopic.flashcard_count).toBe('number');
    expect(firstTopic.created_at).toBeDefined();
  });

  it('should create a new topic successfully', async () => {
    console.log('🔍 Testing topic creation');
    const topicData = {
      name: 'TypeScript Basics',
      description: 'Fundamentals of TypeScript programming'
    };
    
    const response = await fetch('/api/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(topicData),
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(true);
    
    const jsonResponse = await response.json();
    console.log('📦 Response data:', jsonResponse);
    
    expect(jsonResponse.data).toBeDefined();
    expect(jsonResponse.data.id).toBeDefined();
    expect(jsonResponse.data.name).toBe(topicData.name);
    expect(jsonResponse.data.description).toBe(topicData.description);
  });

  it('should fail to create a topic without a name', async () => {
    console.log('🔍 Testing topic creation validation');
    const invalidTopicData = {
      description: 'This topic has no name'
    };
    
    const response = await fetch('/api/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidTopicData),
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    
    const errorResponse = await response.json();
    console.log('📦 Error data:', errorResponse);
    
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
    expect(errorResponse.error.message).toBe('Name is required');
  });

  it('should fetch flashcards for a specific topic', async () => {
    console.log('🔍 Testing flashcards retrieval by topic');
    const topicId = '1'; // Using the mock topic ID
    
    const response = await fetch(`/api/topics/${topicId}/flashcards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(true);
    
    const jsonResponse = await response.json();
    console.log('📦 Response data:', jsonResponse);
    
    expect(jsonResponse.data).toBeDefined();
    expect(jsonResponse.data.flashcards).toBeDefined();
    expect(Array.isArray(jsonResponse.data.flashcards)).toBe(true);
    expect(jsonResponse.data.flashcards.length).toBeGreaterThan(0);
    
    // Check pagination structure
    expect(jsonResponse.data.pagination).toBeDefined();
    expect(jsonResponse.data.pagination.current_page).toBeDefined();
    expect(jsonResponse.data.pagination.total_pages).toBeDefined();
    expect(jsonResponse.data.pagination.total_items).toBeDefined();
    expect(jsonResponse.data.pagination.per_page).toBeDefined();
    
    // Check flashcard structure
    const firstFlashcard = jsonResponse.data.flashcards[0];
    expect(firstFlashcard.id).toBeDefined();
    expect(firstFlashcard.front).toBeDefined();
    expect(firstFlashcard.back).toBeDefined();
    expect(typeof firstFlashcard.is_ai_generated).toBe('boolean');
  });

  it('should create a new flashcard for a topic', async () => {
    console.log('🔍 Testing flashcard creation');
    const topicId = '1';
    const flashcardData = {
      front: 'What is TypeScript?',
      back: 'TypeScript is a strongly typed programming language that builds on JavaScript.'
    };
    
    const response = await fetch(`/api/topics/${topicId}/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flashcardData),
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(true);
    
    const jsonResponse = await response.json();
    console.log('📦 Response data:', jsonResponse);
    
    expect(jsonResponse.data).toBeDefined();
    expect(jsonResponse.data.id).toBeDefined();
    expect(jsonResponse.data.front).toBe(flashcardData.front);
    expect(jsonResponse.data.back).toBe(flashcardData.back);
  });

  it('should fail to create a flashcard with missing fields', async () => {
    console.log('🔍 Testing flashcard creation validation');
    const topicId = '1';
    const invalidFlashcardData = {
      // Missing 'front' and 'back' fields
    };
    
    const response = await fetch(`/api/topics/${topicId}/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidFlashcardData),
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    
    const errorResponse = await response.json();
    console.log('📦 Error data:', errorResponse);
    
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
    expect(errorResponse.error.details).toBeDefined();
    expect(errorResponse.error.details.front).toBeDefined();
    expect(errorResponse.error.details.back).toBeDefined();
  });
});
