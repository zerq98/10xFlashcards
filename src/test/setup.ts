import '@testing-library/jest-dom';
import { afterEach, expect, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// Add testing-library custom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Setup MSW server for API mocking
export const server = setupServer(...handlers);

// Start and reset MSW before/after tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
