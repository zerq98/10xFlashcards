import { toast } from 'sonner';

// Define the types of toasts supported
type ToastType = 'success' | 'error' | 'info' | 'warning';

// Define props for the useToast hook
interface ToastOptions {
  duration?: number;
  id?: string;
}

export const useToast = () => {
  const showToast = (message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const { duration = 5000, id } = options || {};
    
    switch (type) {
      case 'success':
        toast.success(message, { duration, id });
        break;
      case 'error':
        toast.error(message, { duration, id });
        break;
      case 'warning':
        toast.warning(message, { duration, id });
        break;
      case 'info':
      default:
        toast.info(message, { duration, id });
        break;
    }
  };
  
  return {
    success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
    error: (message: string, options?: ToastOptions) => showToast(message, 'error', options),
    warning: (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
    info: (message: string, options?: ToastOptions) => showToast(message, 'info', options),
    // Promise helper for showing loading toast during async operations
    promise: <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      },
      options?: ToastOptions
    ) => {
      return toast.promise(promise, {
        loading,
        success: (data) => (typeof success === 'function' ? success(data) : success),
        error: (err) => (typeof error === 'function' ? error(err) : error),
        ...(options || {})
      });
    },
  };
};