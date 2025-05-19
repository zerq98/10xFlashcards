/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="vitest" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Extend the Assertion interface
declare global {
  namespace Vi {
    interface JestAssertion<T = any> extends jest.Matchers<void, T>, TestingLibraryMatchers<T, void> {}
  }
}
