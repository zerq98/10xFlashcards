import { describe, it, expect } from 'vitest';

describe('Simple test suite', () => {
  it('should pass this test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world');
  });
});
