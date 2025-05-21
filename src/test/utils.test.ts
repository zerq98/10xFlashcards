import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('Utils', () => {
  describe('cn (class name utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('btn', 'btn-primary');
      expect(result).toBe('btn btn-primary');
    });

    it('should filter out falsy values', () => {
      const result = cn('btn', null, undefined, false, 'btn-large');
      expect(result).toBe('btn btn-large');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'btn',
        isActive && 'btn-active',
        isDisabled && 'btn-disabled'
      );
      
      expect(result).toBe('btn btn-active');
    });

    it('should handle tailwind classes and variants', () => {
      const result = cn(
        'px-4 py-2 rounded',
        'text-white',
        'bg-blue-500 hover:bg-blue-600'
      );
      
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('rounded');
      expect(result).toContain('text-white');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('hover:bg-blue-600');
    });

    it('should handle empty or whitespace inputs', () => {
      const result = cn('btn', '', '   ');
      expect(result).toBe('btn');
    });

    it('should handle object notation for conditional classes', () => {
      const result = cn('btn', {
        'btn-active': true,
        'btn-disabled': false,
        'btn-large': true
      });
      
      expect(result).toContain('btn');
      expect(result).toContain('btn-active');
      expect(result).toContain('btn-large');
      expect(result).not.toContain('btn-disabled');
    });

    it('should handle array inputs', () => {
      const result = cn(['btn', 'btn-primary']);
      expect(result).toBe('btn btn-primary');
    });

    it('should handle mixed inputs types', () => {
      const result = cn(
        'btn',
        { 'btn-active': true, 'btn-disabled': false },
        ['btn-large', 'btn-rounded']
      );
      
      expect(result).toContain('btn');
      expect(result).toContain('btn-active');
      expect(result).toContain('btn-large');
      expect(result).toContain('btn-rounded');
      expect(result).not.toContain('btn-disabled');
    });
  });

  // Additional utility tests can be added here as the project grows
});
