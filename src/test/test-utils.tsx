import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';

/**
 * Custom render function that includes common providers
 * Add any providers needed for testing components here
 */
export function render(ui: ReactElement, options?: RenderOptions) {
  return {
    ...rtlRender(ui, options),
    user: userEvent.setup(),
  };
}

/**
 * Re-export everything from testing-library
 */
export * from '@testing-library/react';
export { userEvent };
