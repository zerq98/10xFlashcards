import { describe, it, expect, beforeEach } from 'vitest';
import { server } from './setup';

describe('API Mocking', () => {
  beforeEach(() => {
    console.log('💡 Starting test...');
  });

  it('should mock a successful login', async () => {
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
    
    const jsonResponse = await response.json();
    console.log('📦 Response data:', jsonResponse);
    const data = jsonResponse.data; // Dostęp do właściwości data, w której znajdują się dane
    
    expect(response.ok).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });
    it('should mock a failed login', async () => {
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
    console.log('🚫 Response status:', response.status);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    
    const data = await response.json();
    console.log('📦 Error data:', data);
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });
  
  it('should validate console logs are working', async () => {
    // Ten test sprawdza, czy console.log w mocku działa
    console.log('Test console output');
    
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
    
    expect(response.ok).toBe(true);
  });
});
