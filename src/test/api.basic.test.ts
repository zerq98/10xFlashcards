import { describe, it, expect, beforeEach } from 'vitest';
import { server } from './setup';

// Make sure test runs

describe('API Basic Tests', () => {
  beforeEach(() => {
    console.log('💡 Starting API basic test...');
  });

  it('should mock a successful login request', async () => {
    console.log('🔍 Testing successful login flow');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(true);
    
    const jsonResponse = await response.json();
    console.log('📦 Response data:', jsonResponse);
    
    expect(jsonResponse.data).toBeDefined();
    if (jsonResponse.data) {
      expect(jsonResponse.data.user).toBeDefined();
      expect(jsonResponse.data.session).toBeDefined();
    }
  });

  it('should mock a failed login with incorrect credentials', async () => {
    console.log('🔍 Testing failed login flow');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      }),
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    
    const jsonResponse = await response.json();
    console.log('📦 Error data:', jsonResponse);
    
    expect(jsonResponse.error).toBeDefined();
    expect(jsonResponse.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should fetch topics list', async () => {
    console.log('🔍 Testing topics list retrieval');
    const response = await fetch('/api/topics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📦 Response status:', response.status);
    expect(response.ok).toBe(true);
    
    const jsonResponse = await response.json();
    console.log('📦 Response data sample:', jsonResponse.data?.slice?.(0, 1));
    
    expect(jsonResponse.data).toBeDefined();
    expect(Array.isArray(jsonResponse.data)).toBe(true);
  });

  it('should create a new flashcard', async () => {
    console.log('🔍 Testing flashcard creation');
    const topicId = '1';
    const flashcardData = {
      front: 'What is Testing?',
      back: 'A process of evaluating software to find bugs and ensure it meets requirements'
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
    if (jsonResponse.data) {
      expect(jsonResponse.data.front).toBe(flashcardData.front);
      expect(jsonResponse.data.back).toBe(flashcardData.back);
    }
  });
});
