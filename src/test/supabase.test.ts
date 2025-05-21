import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from './mocks/supabase';

describe('Supabase Client Mocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock authentication session retrieval', async () => {
    const { data, error } = await mockSupabaseClient.auth.getSession();
    
    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.session.user.id).toBe('test-user-id');
    expect(data.session.user.email).toBe('test@example.com');
    expect(data.session.access_token).toBe('fake-access-token');
    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it('should mock successful sign in with password', async () => {
    const { data, error } = await mockSupabaseClient.auth.signInWithPassword({ 
      email: 'test@example.com', 
      password: 'password123'
    });
    
    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
    expect(data.user.id).toBe('test-user-id');
    expect(data.user.email).toBe('test@example.com');
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({ 
      email: 'test@example.com', 
      password: 'password123'
    });
  });

  it('should mock successful user registration', async () => {
    const { data, error } = await mockSupabaseClient.auth.signUp({ 
      email: 'new-user@example.com', 
      password: 'password123'
    });
    
    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
    expect(data.user.id).toBe('new-user-id');
    expect(data.user.email).toBe('new-user@example.com');
    expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledTimes(1);
    expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({ 
      email: 'new-user@example.com', 
      password: 'password123'
    });
  });

  it('should mock successful sign out', async () => {
    const { error } = await mockSupabaseClient.auth.signOut();
    
    expect(error).toBeNull();
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('should mock getting topics data from database', async () => {
    const mockResponse = await mockSupabaseClient.from('topics').select().then((res) => res);
    
    expect(mockResponse.error).toBeNull();
    expect(mockResponse.data).toHaveLength(2);
    expect(mockResponse.data[0].name).toBe('JavaScript');
    expect(mockResponse.data[1].name).toBe('React');
  });

  it('should mock getting flashcards data with filters', async () => {
    const mockResponse = await mockSupabaseClient
      .from('flashcards')
      .select()
      .eq('topic_id', '1')
      .then((res) => res);
    
    expect(mockResponse.error).toBeNull();
    expect(Array.isArray(mockResponse.data)).toBe(true);
    expect(mockResponse.data.some(card => card.is_ai_generated)).toBe(true);
    expect(mockResponse.data.some(card => !card.is_ai_generated)).toBe(true);
  });

  it('should mock storing files', async () => {
    const { data, error } = await mockSupabaseClient.storage
      .from('flashcard-images')
      .upload('test-file-path', new File(['test'], 'test.jpg'));
    
    expect(error).toBeNull();
    expect(data.path).toBe('flashcard-images/test-file');
  });

  it('should mock getting topics with counts using RPC', async () => {
    const mockResponse = await mockSupabaseClient
      .rpc('get_topics_with_counts')
      .then((res) => res);
    
    expect(mockResponse.error).toBeNull();
    expect(mockResponse.data).toHaveLength(2);
    expect(mockResponse.data[0].flashcard_count).toBe(10);
    expect(mockResponse.data[1].flashcard_count).toBe(5);
  });
});
