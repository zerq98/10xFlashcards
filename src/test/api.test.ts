import { describe, it, expect } from 'vitest';

describe('API Mocking', () => {
  it('should mock a successful login', async () => {
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
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });
  
  it('should mock a failed login', async () => {
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
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });
});
