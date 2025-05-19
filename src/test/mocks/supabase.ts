import { vi } from 'vitest';

// Create a type-safe mock for the Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          access_token: 'fake-access-token',
          refresh_token: 'fake-refresh-token',
          expires_at: Date.now() + 3600
        }
      },
      error: null
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: {
          access_token: 'fake-access-token',
          refresh_token: 'fake-refresh-token',
          expires_at: Date.now() + 3600
        }
      },
      error: null
    }),
    signUp: vi.fn().mockResolvedValue({
      data: {
        user: { id: 'new-user-id', email: 'new-user@example.com' },
        session: {
          access_token: 'fake-access-token',
          refresh_token: 'fake-refresh-token',
          expires_at: Date.now() + 3600
        }
      },
      error: null
    }),
    signOut: vi.fn().mockResolvedValue({
      error: null
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({
      error: null
    }),
    updateUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })
  },
  from: (table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((callback) => {
      const mockData = getMockTableData(table);
      return Promise.resolve(callback({ data: mockData, error: null }));
    })
  }),
  storage: {
    from: (bucket: string) => ({
      upload: vi.fn().mockResolvedValue({ data: { path: `${bucket}/test-file` }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: `https://test-storage.com/${bucket}/test-file` } })
    })
  },
  rpc: vi.fn().mockImplementation((procedure, params) => {
    return {
      then: (callback: any) => {
        if (procedure === 'get_topics_with_counts') {
          return Promise.resolve(callback({
            data: [
              { id: '1', name: 'JavaScript', flashcard_count: 10, user_id: 'test-user-id', created_at: new Date().toISOString() },
              { id: '2', name: 'React', flashcard_count: 5, user_id: 'test-user-id', created_at: new Date().toISOString() }
            ],
            error: null
          }));
        }
        return Promise.resolve(callback({ data: [], error: null }));
      }
    };
  })
};

// Helper function to get mock data for different tables
function getMockTableData(table: string) {
  switch (table) {
    case 'topics':
      return [
        { id: '1', name: 'JavaScript', user_id: 'test-user-id', created_at: new Date().toISOString() },
        { id: '2', name: 'React', user_id: 'test-user-id', created_at: new Date().toISOString() }
      ];
    case 'flashcards':
      return [
        { 
          id: '1', 
          topic_id: '1', 
          question: 'What is JavaScript?', 
          answer: 'JavaScript is a programming language that adds interactivity to your website.', 
          is_ai_generated: false,
          created_at: new Date().toISOString()
        },
        { 
          id: '2', 
          topic_id: '1', 
          question: 'What is a closure in JavaScript?', 
          answer: 'A closure is a function that has access to its outer function scope even after the outer function has returned.', 
          is_ai_generated: true,
          created_at: new Date().toISOString()
        }
      ];
    case 'profiles':
      return [
        { id: 'test-user-id', username: 'testuser', updated_at: new Date().toISOString() }
      ];
    default:
      return [];
  }
}
