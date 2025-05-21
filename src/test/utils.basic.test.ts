import { describe, it, expect } from 'vitest';

// A simple utility function to test
function formatTopicName(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) {
    return name;
  }
  return `${name.substring(0, maxLength - 3)}...`;
}

// Another utility to test
function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

describe('Utility Functions Tests', () => {
  describe('formatTopicName', () => {
    it('should return the original name if it is shorter than maxLength', () => {
      const name = 'JavaScript';
      expect(formatTopicName(name)).toBe(name);
    });
      it('should truncate the name and add ellipsis if longer than maxLength', () => {
      const longName = 'This is a very long topic name that needs to be truncated';
      const truncated = formatTopicName(longName, 20);
      expect(truncated).toBe('This is a very lo...');
      expect(truncated.length).toBe(20);
    });
    
    it('should handle empty strings', () => {
      expect(formatTopicName('')).toBe('');
    });
    
    it('should use the default maxLength if not specified', () => {
      const longName = 'A'.repeat(40);
      const truncated = formatTopicName(longName);
      expect(truncated.length).toBe(30);
      expect(truncated.endsWith('...')).toBe(true);
    });
  });
  
  describe('sortByName', () => {
    it('should sort items by name property', () => {
      const items = [
        { name: 'React', id: '1' },
        { name: 'Angular', id: '2' },
        { name: 'Vue', id: '3' }
      ];
      
      const sorted = sortByName(items);
      expect(sorted[0].name).toBe('Angular');
      expect(sorted[1].name).toBe('React');
      expect(sorted[2].name).toBe('Vue');
    });
    
    it('should not modify the original array', () => {
      const items = [
        { name: 'React', id: '1' },
        { name: 'Angular', id: '2' }
      ];
      
      sortByName(items);
      expect(items[0].name).toBe('React');
      expect(items[1].name).toBe('Angular');
    });
    
    it('should handle empty arrays', () => {
      expect(sortByName([])).toEqual([]);
    });
    
    it('should be case insensitive', () => {
      const items = [
        { name: 'react', id: '1' },
        { name: 'Angular', id: '2' }
      ];
      
      const sorted = sortByName(items);
      expect(sorted[0].name).toBe('Angular');
      expect(sorted[1].name).toBe('react');
    });
  });
});
