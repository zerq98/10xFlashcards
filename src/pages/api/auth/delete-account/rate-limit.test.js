/**
 * @jest
 * 
 * Tests for the rate limiting functionality in the delete-account endpoint
 */

// Mock data - to be used in tests
const mockUserId = 'test-user-123';
const mockRequest = {
  json: () => Promise.resolve({ password: 'ValidPassword123!' }),
};

const mockCookies = {
  get: jest.fn().mockReturnValue({ value: mockUserId }),
  delete: jest.fn(),
};

const mockLocals = {
  user: { id: mockUserId, email: 'user@example.com' },
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
  },
};

// Import the module to test
// Note: This will need to be adjusted based on how your module exports are set up
let deleteAccountModule;

// Mock Response constructor
global.Response = jest.fn().mockImplementation((body, options) => ({
  body,
  status: options?.status || 200,
  headers: new Map(Object.entries(options?.headers || {})),
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset the module between tests to clean the rate limiter state
  jest.resetModules();
  
  // Import the module fresh for each test
  deleteAccountModule = require('../index.ts');
});

describe('Delete Account Rate Limiting', () => {
  it('should allow a single request within rate limit', async () => {
    // Mock successful authentication and account deletion
    mockLocals.supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    mockLocals.supabase.single.mockResolvedValue({ data: { is_deleted: false }, error: null });
    mockLocals.supabase.update.mockResolvedValue({ error: null });
    
    const response = await deleteAccountModule.POST({ 
      request: mockRequest, 
      locals: mockLocals,
      cookies: mockCookies,
    });
    
    expect(response.status).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.data.message).toBe('Account deactivated successfully');
  });
  
  it('should block requests after exceeding rate limit', async () => {
    // Mock successful authentication and account deletion for initial calls
    mockLocals.supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    mockLocals.supabase.single.mockResolvedValue({ data: { is_deleted: false }, error: null });
    mockLocals.supabase.update.mockResolvedValue({ error: null });
    
    // Make multiple requests to exceed rate limit
    // This should match the MAX_ATTEMPTS setting in your module
    for (let i = 0; i < 3; i++) {
      await deleteAccountModule.POST({ 
        request: mockRequest, 
        locals: mockLocals,
        cookies: mockCookies,
      });
    }
    
    // This request should be rate limited
    const response = await deleteAccountModule.POST({ 
      request: mockRequest, 
      locals: mockLocals,
      cookies: mockCookies,
    });
    
    expect(response.status).toBe(429);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error.code).toBe('RATE_LIMIT_EXCEEDED');
    
    // Check that Retry-After header is set
    const retryAfter = response.headers.get('Retry-After');
    expect(retryAfter).toBeDefined();
    expect(parseInt(retryAfter)).toBeGreaterThan(0);
  });
  
  it('should reset rate limit counter after window expires', async () => {
    // Mock successful authentication and account deletion
    mockLocals.supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    mockLocals.supabase.single.mockResolvedValue({ data: { is_deleted: false }, error: null });
    mockLocals.supabase.update.mockResolvedValue({ error: null });
    
    // Mock time functions
    const realDateNow = Date.now;
    const mockDate = jest.fn();
    
    // Initial time
    mockDate.mockReturnValue(1000000);
    global.Date.now = mockDate;
    
    // Make initial requests to approach rate limit
    for (let i = 0; i < 3; i++) {
      await deleteAccountModule.POST({ 
        request: mockRequest, 
        locals: mockLocals,
        cookies: mockCookies,
      });
    }
    
    // This request should be rate limited
    let response = await deleteAccountModule.POST({ 
      request: mockRequest, 
      locals: mockLocals,
      cookies: mockCookies,
    });
    expect(response.status).toBe(429);
    
    // Advance time beyond the rate limit window (5 minutes + 1 second)
    mockDate.mockReturnValue(1000000 + 5 * 60 * 1000 + 1000);
    
    // This request should succeed now after time window expired
    response = await deleteAccountModule.POST({ 
      request: mockRequest, 
      locals: mockLocals,
      cookies: mockCookies,
    });
    expect(response.status).toBe(200);
    
    // Restore original Date.now
    global.Date.now = realDateNow;
  });
  
  it('should handle different user IDs separately', async () => {
    // Mock successful authentication and account deletion
    mockLocals.supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
    mockLocals.supabase.single.mockResolvedValue({ data: { is_deleted: false }, error: null });
    mockLocals.supabase.update.mockResolvedValue({ error: null });
    
    // Make multiple requests with first user to exceed rate limit
    const firstUserId = 'user-1';
    const firstUserLocals = { 
      ...mockLocals, 
      user: { ...mockLocals.user, id: firstUserId }
    };
    const firstUserCookies = {
      get: jest.fn().mockReturnValue({ value: firstUserId }),
      delete: jest.fn(),
    };
    
    for (let i = 0; i < 3; i++) {
      await deleteAccountModule.POST({ 
        request: mockRequest, 
        locals: firstUserLocals,
        cookies: firstUserCookies,
      });
    }
    
    // First user should now be rate limited
    let response = await deleteAccountModule.POST({ 
      request: mockRequest, 
      locals: firstUserLocals,
      cookies: firstUserCookies,
    });
    expect(response.status).toBe(429);
    
    // Second user should still be allowed
    const secondUserId = 'user-2';
    const secondUserLocals = { 
      ...mockLocals, 
      user: { ...mockLocals.user, id: secondUserId }
    };
    const secondUserCookies = {
      get: jest.fn().mockReturnValue({ value: secondUserId }),
      delete: jest.fn(),
    };
    
    response = await deleteAccountModule.POST({ 
      request: mockRequest, 
      locals: secondUserLocals,
      cookies: secondUserCookies,
    });
    expect(response.status).toBe(200);
  });
});
