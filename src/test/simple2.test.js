import { describe, it, expect } from 'vitest';

describe('Basic Math Operations', () => {
  it('should add two numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should subtract two numbers correctly', () => {
    expect(5 - 3).toBe(2);
  });
  
  it('should multiply two numbers correctly', () => {
    expect(3 * 4).toBe(12);
  });
  
  it('should divide two numbers correctly', () => {
    expect(10 / 2).toBe(5);
  });
});

describe('Basic String Operations', () => {
  it('should concatenate strings correctly', () => {
    expect('hello' + ' ' + 'world').toBe('hello world');
  });
  
  it('should get the correct string length', () => {
    expect('testing'.length).toBe(7);
  });
  
  it('should convert to uppercase correctly', () => {
    expect('test'.toUpperCase()).toBe('TEST');
  });
  
  it('should find substrings correctly', () => {
    expect('testing'.includes('test')).toBe(true);
  });
});

describe('Array Operations', () => {
  it('should push elements to an array correctly', () => {
    const arr = [1, 2];
    arr.push(3);
    expect(arr).toEqual([1, 2, 3]);
  });
  
  it('should filter arrays correctly', () => {
    const arr = [1, 2, 3, 4, 5];
    const filtered = arr.filter(num => num % 2 === 0);
    expect(filtered).toEqual([2, 4]);
  });
  
  it('should map arrays correctly', () => {
    const arr = [1, 2, 3];
    const doubled = arr.map(num => num * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});
