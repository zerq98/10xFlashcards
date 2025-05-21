import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabaseClient } from './mocks/supabase';

describe('Supabase Mock Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock authentication session retrieval', async () => {
    const { data, error } = await mockSupabaseClient.auth.getSession();
    
    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.session?.user.id).toBe('test-user-id');
    expect(data.session?.user.email).toBe('test@example.com');
    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1);
  });
  
  it('should mock sign in with password', async () => {
    const credentials = { 
      email: 'test@example.com', 
      password: 'password123' 
    };
    
    const { data, error } = await mockSupabaseClient.auth.signInWithPassword(credentials);
    
    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
    expect(data.user?.email).toBe('test@example.com');
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
  });
  
  it('should mock fetching data from tables', async () => {
    const mockResponse = await mockSupabaseClient
      .from('topics')
      .select()
      .then(res => res);
      
    expect(mockResponse.error).toBeNull();
    expect(mockResponse.data).toBeDefined();
    expect(Array.isArray(mockResponse.data)).toBe(true);
    
    // Check topic structure if data exists
    if (mockResponse.data && mockResponse.data.length > 0) {
      expect(mockResponse.data[0]).toHaveProperty('id');
      expect(mockResponse.data[0]).toHaveProperty('name');
      expect(mockResponse.data[0]).toHaveProperty('user_id');
    }
  });
  
  it('should mock RPC calls', async () => {
    const mockResponse = await mockSupabaseClient
      .rpc('get_topics_with_counts')
      .then(res => res);
      
    expect(mockResponse.error).toBeNull();
    expect(mockResponse.data).toBeDefined();
    expect(Array.isArray(mockResponse.data)).toBe(true);
    expect(mockResponse.data.length).toBeGreaterThan(0);
    expect(mockResponse.data[0]).toHaveProperty('flashcard_count');
  });
});
