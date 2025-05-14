import { z } from 'zod';
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { ApiErrorResponse, ApiSuccessResponse } from '../../../../types';
import { loadSession } from '../../../../middleware';
import type { Database } from '../../../../db/database.types';

// This endpoint is protected - only accessible for authenticated users
export const prerender = false;
export const onRequest = loadSession;

/**
 * Interface for change password request data
 */
interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}

/**
 * Interface for change password response data
 */
interface ChangePasswordResponseDTO {
  message: string;
}

// Validation schema for password change request with detailed error messages
const changePasswordRequestSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required")
    .max(128, "Password exceeds maximum length"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password exceeds maximum length")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});

/**
 * Validates and sanitizes change password request data
 * @param data - The raw input data to validate
 * @returns Validated ChangePasswordRequestDTO or throws error
 */
const validateChangePasswordRequest = (data: unknown): ChangePasswordRequestDTO => {
  try {
    const result = changePasswordRequestSchema.parse(data);
    
    return {
      currentPassword: result.currentPassword,
      newPassword: result.newPassword
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "VALIDATION_ERROR",
        message: "Invalid password data",
        details: error.format()
      };
    }
    throw error;
  }
};

/**
 * Funkcja logująca zdarzenia związane z bezpieczeństwem konta
 * W rzeczywistym środowisku produkcyjnym powinna zapisywać do bezpiecznego systemu logów
 * @param userId ID użytkownika
 * @param action Nazwa akcji
 * @param status Status akcji (success/failure)
 * @param details Szczegóły zdarzenia
 */
function logSecurityEvent(userId: string, action: string, status: 'success' | 'failure', details?: string) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    userId,
    action,
    status,
    details
  };
  
  // W rzeczywistym systemie zapisalibyśmy to do osobnej bazy danych/serwisu logów
  console.log(`SECURITY_EVENT: ${JSON.stringify(logEntry)}`);
}

/**
 * Password service class
 */
class PasswordService {
  private supabase;

  constructor(supabase: any) {
    this.supabase = supabase;
  }  /**
   * Changes user password
   * @param user - User object from the session context
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Success message
   */
  async changeUserPassword(
    user: App.Locals['user'],
    currentPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResponseDTO> {
    // Check if user exists
    if (!user) {
      throw {
        code: "USER_NOT_FOUND",
        message: "User not found",
        details: "User context is not available"
      };
    }

    // Get user email from the session context
    const userEmail = user.email;
    if (!userEmail) {
      throw {
        code: "EMAIL_NOT_FOUND",
        message: "User email not found",
        details: "Email is required to change password"
      };
    }// Bezpieczniejsze podejście do weryfikacji hasła
    // Używamy admin.verifyOtp zamiast signInWithPassword, aby uniknąć tworzenia nowej sesji
    // W rzeczywistej implementacji, możemy użyć admin API Supabase, które zapewnia weryfikację hasła
    // bez modyfikowania sesji użytkownika
    
    // Tworzenie hasha hasła z pomocą admin API - to przykładowa implementacja
    // W rzeczywistości warto by stworzyć dedykowane API w Supabase za pomocą edge functions
    // które weryfikuje hasło bez wpływania na sesję
    
    // Dla zabezpieczenia przed mieszaniem sesji, używamy aktualnej sesji użytkownika
    const { data: sessionData } = await this.supabase.auth.getSession();    // Get user ID from the user object for comparison with session
    const userId = user.id;
    
    // Sprawdzamy czy zmiana hasła dotyczy aktualnie zalogowanego użytkownika
    if (!sessionData.session || sessionData.session.user.id !== userId) {
      throw {
        code: "SESSION_MISMATCH",
        message: "Session user ID does not match requested user ID",
        details: "Security violation detected: attempting to change password for another user"
      };
    }
    
    // Weryfikacja hasła bez tworzenia nowej sesji
    // W Supabase nie ma bezpośredniej metody weryfikacji hasła bez wpływu na sesję,
    // więc używamy admin API do weryfikacji tożsamości użytkownika
    
    // Ta implementacja nadal używa signInWithPassword, ale z zabezpieczeniami
    // Idealne rozwiązanie wymagałoby dedykowanego API endpoint do weryfikacji hasła
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword
    });

    if (signInError) {
      throw {
        code: "INVALID_CREDENTIALS",
        message: "Current password is incorrect",
        details: signInError.message
      };
    }
    
    // Po weryfikacji przywracamy oryginalną sesję
    if (sessionData.session) {
      await this.supabase.auth.setSession({
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token
      });
    }

    // If current password is correct, update to the new password
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw {
        code: "PASSWORD_UPDATE_ERROR",
        message: "Failed to update password",
        details: updateError.message
      };
    }

    return {
      message: "Password updated successfully"
    };
  }
}

// Globalna mapa dla śledzenia prób zmiany hasła (w produkcji warto użyć Redis)
// Kluczem jest adres IP lub identyfikator użytkownika, wartością jest obiekt z licznikiem i czasem ostatniej próby
const passwordChangeAttempts = new Map<string, { count: number, lastAttempt: number }>();

// Konfiguracja rate limitingu
const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,  // maksymalna liczba prób w czasie WINDOW_MS
  WINDOW_MS: 5 * 60 * 1000,  // 5 minut
  BLOCK_DURATION_MS: 15 * 60 * 1000,  // 15 minut blokady po przekroczeniu limitu
};

/**
 * Funkcja sprawdzająca czy dana próba zmiany hasła nie przekracza limitu
 * @param identifier - Identyfikator użytkownika (ID lub adres IP)
 * @returns Informacja czy dozwolona jest próba zmiany hasła
 */
function checkRateLimit(identifier: string): { allowed: boolean, message?: string } {
  const now = Date.now();
  const userAttempts = passwordChangeAttempts.get(identifier);
  
  // Jeśli nie ma wcześniejszych prób lub minął okres blokady, resetujemy licznik
  if (!userAttempts || (now - userAttempts.lastAttempt) > RATE_LIMIT.WINDOW_MS) {
    passwordChangeAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  // Sprawdzenie czy przekroczono limit prób
  if (userAttempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
    const timeLeft = Math.ceil((userAttempts.lastAttempt + RATE_LIMIT.BLOCK_DURATION_MS - now) / 60000);
    
    if (now - userAttempts.lastAttempt < RATE_LIMIT.BLOCK_DURATION_MS) {
      return {
        allowed: false,
        message: `Za dużo prób zmiany hasła. Spróbuj ponownie za ${timeLeft} minut.`
      };
    } else {
      // Minął okres blokady, resetujemy licznik
      passwordChangeAttempts.set(identifier, { count: 1, lastAttempt: now });
      return { allowed: true };
    }
  }
  
  // Zwiększamy licznik prób
  passwordChangeAttempts.set(identifier, { 
    count: userAttempts.count + 1, 
    lastAttempt: now 
  });
  
  return { allowed: true };
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  /**
   * UWAGA: Obecna implementacja ma ograniczenia w zakresie weryfikacji hasła.
   * 
   * Idealne rozwiązanie wymagałoby:
   * 1. Dedykowanego endpoint API w Supabase Edge Functions do weryfikacji hasła bez wpływu na sesję
   * 2. Mechanizm kryptograficznej weryfikacji hasła po stronie serwera
   * 3. Dodatkowego zabezpieczenia przed atakami brute force (rate limiting)
   * 4. Dodatkowej warstwy audytu zmian hasła
   * 
   * W obecnej implementacji minimalizujemy ryzyko mieszania sesji poprzez:
   * - Weryfikację czy użytkownik zmieniający hasło jest tym samym co zalogowany
   * - Przywracanie oryginalnej sesji po weryfikacji hasła
   * - Wykorzystanie bezpiecznych nagłówków i polityki ciasteczek
   */
  
  // Use Supabase client from locals context (set by middleware)
  const supabase = locals.supabase;
  
  try {    // Get current user from session (middleware guarantees this exists for protected routes)
    const userId = locals.user?.id;
    
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to change your password",
          },
        } as ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
      // Dodatkowa warstwa bezpieczeństwa: weryfikacja zgodności ID użytkownika z sesji z ID w cookie
    const cookieUserId = cookies.get("user_id")?.value;
    if (cookieUserId && cookieUserId !== userId) {
      logSecurityEvent(userId, 'SESSION_MISMATCH', 'failure', `Cookie user ID ${cookieUserId} doesn't match session user ID ${userId}`);
      return new Response(
        JSON.stringify({
          error: {
            code: "SESSION_MISMATCH",
            message: "Security violation detected",
          },
        } as ApiErrorResponse),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
      // Sprawdzenie limitu prób zmiany hasła
    // Używamy userId jako identyfikatora, ponieważ jest to bardziej niezawodne niż IP
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      logSecurityEvent(userId, 'RATE_LIMIT_EXCEEDED', 'failure', 'Too many password change attempts');
      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: rateLimitCheck.message || "Zbyt wiele prób zmiany hasła. Spróbuj ponownie później.",
          },
        } as ApiErrorResponse),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": "900" // 15 minut w sekundach
          },
        }
      );
    }

    // Parse and validate request body
    const requestData = await request.json();
    const validatedData = validateChangePasswordRequest(requestData);
    
    // Get session token from cookie for additional verification
    const accessToken = cookies.get("access_token")?.value;
    
    // Double check that the session is still valid by verifying the token directly
    if (accessToken) {
      const { data: verificationData, error: verificationError } = await supabase.auth.getUser(accessToken);
        // If token verification failed or user ID doesn't match, reject the request
      if (verificationError || verificationData.user?.id !== userId) {
        const errorDetails = verificationError 
          ? `Token verification error: ${verificationError.message}` 
          : `Token user ID mismatch: expected ${userId}, got ${verificationData.user?.id}`;
        
        logSecurityEvent(userId, 'TOKEN_VERIFICATION_FAILED', 'failure', errorDetails);
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_SESSION",
              message: "Your session appears to be invalid. Please log in again.",
            },
          } as ApiErrorResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }      // Create password service and change password    
    try {
      const passwordService = new PasswordService(supabase);
      const result = await passwordService.changeUserPassword(
        locals.user,
        validatedData.currentPassword,
        validatedData.newPassword
      );
      
      // Sukces - resetujemy licznik prób dla tego użytkownika
      passwordChangeAttempts.delete(userId);
      
      // Dodajemy log audytowy
      logSecurityEvent(userId, 'CHANGE_PASSWORD', 'success');
      logSecurityEvent(userId, 'change_password', 'success', 'Password updated successfully');
      
      // Return success response
      return new Response(
        JSON.stringify({
          data: result,
        } as ApiSuccessResponse<ChangePasswordResponseDTO>),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {      // Jeśli to błąd niepoprawnych danych uwierzytelniających, zwiększamy licznik prób
      if (error.code === "INVALID_CREDENTIALS") {
        // Nie resetujemy licznika, ponieważ to była nieudana próba        logSecurityEvent(locals.user?.id || 'unknown', 'CHANGE_PASSWORD', 'failure', 'Invalid credentials');
        logSecurityEvent(locals.user?.id || 'unknown', 'change_password', 'failure', 'Invalid credentials provided');
        
        // Przekazujemy błąd dalej do głównego bloku catch
        throw error;
      }
      
      // Inne błędy przekazujemy dalej
      throw error;
    }
  } catch (error: any) {
    console.error("Password change error:", error);
      // Handle known errors
    if (error.code) {
      // Obsługa konkretnych kodów błędów
      let status = 500;
      switch (error.code) {
        case "VALIDATION_ERROR":
          status = 400;
          break;
        case "INVALID_CREDENTIALS":
          status = 401;
          break;
        case "USER_NOT_FOUND":
          status = 404;
          break;
        case "SESSION_MISMATCH":
          status = 403;
          break;
        case "RATE_LIMIT_EXCEEDED":
          status = 429;
          break;
        default:
          status = 500;
      }
        // Jeśli błąd to niepoprawne dane uwierzytelniające, możemy zalogować tę informację
      if (error.code === "INVALID_CREDENTIALS") {
        // Nie musimy tutaj nic robić - licznik został już zaktualizowany w bloku try/catch powyżej
        console.log("Invalid credentials error caught in main error handler");
      }
      
      logSecurityEvent(locals.user?.id || 'unknown', 'change_password', 'failure', error.message);
      
      return new Response(
        JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        } as ApiErrorResponse),
        {
          status,
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache"
          },
        }
      );
    }
    
    // Handle unexpected errors
    console.error("Unexpected error during password change:", error);
    logSecurityEvent(locals.user?.id || 'unknown', 'change_password', 'failure', 'Unexpected error occurred');
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while changing the password",
        },
      } as ApiErrorResponse),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache"
        },
      }
    );
  }
};
