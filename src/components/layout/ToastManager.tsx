import React from 'react';
import { Toaster } from '@/components/ui/sonner';

// Define custom options for toast types
interface CustomToastOptions {
  style?: React.CSSProperties;
  success?: { style?: React.CSSProperties };
  error?: { style?: React.CSSProperties };
  warning?: { style?: React.CSSProperties };
  info?: { style?: React.CSSProperties };
}

export const ToastManager = () => {
  return (
    <Toaster 
      position="bottom-right"
      toastOptions={{
        // Apply our theme colors to the toasts
        style: {
          background: 'var(--background)',
          color: 'var(--text)',
          border: '1px solid var(--border)'
        },
        // Custom toast types
        success: {
          style: {
            borderLeft: '4px solid var(--primary)',
          },
        },
        error: {
          style: {
            borderLeft: '4px solid #e11d48',
          },
        },
        warning: {
          style: {
            borderLeft: '4px solid #f59e0b',
          },
        },
        info: {
          style: {
            borderLeft: '4px solid var(--secondary)',
          },
        },
      } as CustomToastOptions}
    />
  );
};