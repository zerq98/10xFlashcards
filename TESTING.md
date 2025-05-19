# Testing Guide for 10xFlashcards

This document provides an overview of the testing setup and best practices for the 10xFlashcards application.

## Testing Technologies

- **Unit Testing**: Vitest with React Testing Library
- **E2E Testing**: Playwright with Page Object Model
- **API Mocking**: MSW (Mock Service Worker)

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Run tests with the Vitest UI
npm run test:ui

# Generate test coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode for debugging
npm run test:e2e:ui
```

## Test Directory Structure

```
src/
├── components/
│   └── component-name/
│       └── __tests__/          # Unit tests for components
│           └── Component.test.tsx
├── hooks/
│   └── __tests__/              # Unit tests for hooks
│       └── useHook.test.ts
├── test/                       # Test utilities and setup
│   ├── mocks/                  # Mock API handlers
│   │   └── handlers.ts
│   ├── setup.ts                # Vitest setup configuration
│   ├── test-types.d.ts         # TypeScript definitions for tests
│   └── test-utils.tsx          # Common testing utilities
└── ...
e2e/                           # End-to-End tests with Playwright
├── page-objects/              # Page Object Models
│   └── auth-page.ts
├── auth.spec.ts
└── flashcard-flow.spec.ts
```

## Best Practices

### Unit Testing

Following the guidelines from our Vitest configuration:

1. **Test Doubles**: Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions
2. **Mock Factory Patterns**: Use `vi.mock()` factories at the top level of test files
3. **Custom Matchers**: Use Testing Library's custom matchers for better assertions
4. **Inline Snapshots**: Use `expect(value).toMatchInlineSnapshot()` for readable assertions
5. **Test Organization**: Group related tests with descriptive `describe` blocks
6. **AAA Pattern**: Follow Arrange-Act-Assert pattern for clear test structure

Example:

```typescript
describe('Component', () => {
  it('should render correctly', () => {
    // Arrange
    render(<Component prop="value" />);
    
    // Act
    const element = screen.getByText('Expected Text');
    
    // Assert
    expect(element).toBeInTheDocument();
  });
});
```

### E2E Testing

Following the Playwright guidelines:

1. **Page Object Model**: Use Page Objects to encapsulate page interactions
2. **Isolated Tests**: Use new browser contexts for test isolation
3. **Resilient Selectors**: Prefer role-based and text-based selectors
4. **Visual Testing**: Use screenshots for complex UI verification
5. **Test Setup**: Use `beforeEach` to set up common test state
6. **Explicit Assertions**: Use explicit waits and assertions

Example:

```typescript
test('user can login', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.gotoLogin();
  await authPage.login('user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

## Contributing New Tests

When adding new tests, follow these guidelines:

1. **Component Tests**: Place in `__tests__` folder next to the component
2. **Hook Tests**: Place in `src/hooks/__tests__` directory
3. **API Mocks**: Add new handlers to `src/test/mocks/handlers.ts`
4. **E2E Tests**: Add new Page Objects for each significant page or feature
5. **Test Naming**: Use descriptive names that explain what's being tested
6. **Test Coverage**: Aim for at least 70% coverage for critical paths

### Mocking Supabase Client

For testing components and hooks that interact with Supabase, we provide a mock Supabase client:

- The mock is defined in `src/test/mocks/supabase.ts`
- Import and use it in your tests:
  ```typescript
  import { vi } from 'vitest';
  import { mockSupabaseClient } from '../../test/mocks/supabase';
  
  // Mock the Supabase client module
  vi.mock('../../db/supabase.client', () => ({
    createClient: () => mockSupabaseClient,
    supabaseClient: mockSupabaseClient
  }));
  
  // Customize behavior for specific tests if needed
  mockSupabaseClient.from('topics').select.mockImplementation(() => ({
    eq: () => ({
      then: (callback) => Promise.resolve(callback({
        data: [{ id: 'custom-id', name: 'Custom Topic' }],
        error: null
      }))
    })
  }));
  ```

Remember to run tests before submitting PRs to ensure all tests pass.
