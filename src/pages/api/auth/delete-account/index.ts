import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { ApiErrorResponse, ApiSuccessResponse } from '../../../../types';
import { loadSession } from '../../../../middleware';

// This endpoint is protected - only accessible for authenticated users
export const prerender = false;
export const onRequest = loadSession;

/**
 * Interface for delete account request data
 */
interface DeleteAccountRequestDTO {
  password: string;
}

/**
 * Interface for delete account response data
 */
interface DeleteAccountResponseDTO {
  message: string;
}

// Validation schema for delete account request
const deleteAccountRequestSchema = z.object({
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password exceeds maximum length")
});

/**
 * Validates and sanitizes delete account request data
 * @param data - The raw input data to validate
 * @returns Validated DeleteAccountRequestDTO or throws error
 */
const validateDeleteAccountRequest = (data: unknown): DeleteAccountRequestDTO => {
  try {
    const result = deleteAccountRequestSchema.parse(data);
    return {
      password: result.password
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: error.format()
      };
    }
    throw error;
  }
};

/**
 * Account service for managing user account
 */
class AccountService {
  private supabase;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Soft deletes a user account
   * @param userId - ID of the user to delete
   * @param password - User's password for verification
   * @returns Success message
   */
  async deleteAccount(userId: string, email: string, password: string): Promise<DeleteAccountResponseDTO> {
    // Step 1: Verify user's password
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (signInError) {
      throw {
        code: "INVALID_CREDENTIALS",
        message: "Incorrect password",
        details: signInError.message
      };
    }

    // Step 2: Check if account is already deleted
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('is_deleted')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw {
        code: "PROFILE_ERROR",
        message: "Failed to retrieve user profile",
        details: profileError.message
      };
    }

    if (profile?.is_deleted) {
      throw {
        code: "ALREADY_DELETED",
        message: "This account is already deactivated",
        details: "Account has previously been marked as deleted"
      };
    }

    // Step 3: Soft delete user account (update profile)
    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      throw {
        code: "UPDATE_ERROR",
        message: "Failed to deactivate account",
        details: updateError.message
      };
    }

    return {
      message: "Account deactivated successfully"
    };
  }
}

/**
 * Logs security events for audit purposes
 * @param userId - User ID
 * @param event - Event type
 * @param status - Status (success/failure)
 * @param details - Optional details
 */
const logSecurityEvent = (
  userId: string,
  event: string,
  status: 'success' | 'failure',
  details?: string
) => {
  // In a real application, this would log to a database or secure logging service
  console.log(`SECURITY_LOG: ${new Date().toISOString()} | User: ${userId} | Event: ${event} | Status: ${status}${details ? ' | Details: ' + details : ''}`);
};

// Globalna mapa dla śledzenia prób usunięcia konta (w produkcji warto użyć Redis)
// Kluczem jest identyfikator użytkownika, wartością jest obiekt z licznikiem i czasem ostatniej próby
const deleteAccountAttempts = new Map<string, { count: number, lastAttempt: number }>();

// Konfiguracja rate limitingu
const RATE_LIMIT = {
  MAX_ATTEMPTS: 3,  // maksymalna liczba prób w czasie WINDOW_MS (mniej niż przy zmianie hasła, bo to bardziej wrażliwa operacja)
  WINDOW_MS: 5 * 60 * 1000,  // 5 minut
  BLOCK_DURATION_MS: 30 * 60 * 1000,  // 30 minut blokady po przekroczeniu limitu (dłuższa blokada dla większego bezpieczeństwa)
};

/**
 * Funkcja sprawdzająca czy dana próba usunięcia konta nie przekracza limitu
 * @param identifier - Identyfikator użytkownika (ID)
 * @returns Informacja czy dozwolona jest próba usunięcia konta
 */
function checkRateLimit(identifier: string): { allowed: boolean, message?: string } {
  const now = Date.now();
  const userAttempts = deleteAccountAttempts.get(identifier);
  
  // Jeśli nie ma wcześniejszych prób lub minął okres blokady, resetujemy licznik
  if (!userAttempts || (now - userAttempts.lastAttempt) > RATE_LIMIT.WINDOW_MS) {
    deleteAccountAttempts.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  // Sprawdzenie czy przekroczono limit prób
  if (userAttempts.count >= RATE_LIMIT.MAX_ATTEMPTS) {
    const timeLeft = Math.ceil((userAttempts.lastAttempt + RATE_LIMIT.BLOCK_DURATION_MS - now) / 60000);
    
    if (now - userAttempts.lastAttempt < RATE_LIMIT.BLOCK_DURATION_MS) {
      return {
        allowed: false,
        message: `Za dużo prób usunięcia konta. Spróbuj ponownie za ${timeLeft} minut.`
      };
    } else {
      // Minął okres blokady, resetujemy licznik
      deleteAccountAttempts.set(identifier, { count: 1, lastAttempt: now });
      return { allowed: true };
    }
  }
  
  // Zwiększamy licznik prób
  deleteAccountAttempts.set(identifier, { 
    count: userAttempts.count + 1, 
    lastAttempt: now 
  });
  
  return { allowed: true };
}

/**
 * POST /api/auth/delete-account - Soft deletes a user account
 * 
 * @param context - Astro API route context
 * @returns Response with success message or error details
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const supabase = locals.supabase;
  
  try {
    // Step 1: Check authentication
    const userId = locals.user?.id;
    
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to delete your account",
          },
        } as ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }    // Step 2: Rate limiting
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      logSecurityEvent(userId, 'delete_account', 'failure', 'Rate limit exceeded');
      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: rateLimitResult.message,
          },
        } as ApiErrorResponse),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(Math.floor(RATE_LIMIT.BLOCK_DURATION_MS / 1000)) // Czas w sekundach do następnej dozwolonej próby
          },
        }
      );
    }
    
    // Step 3: Validate request data
    let validatedData: DeleteAccountRequestDTO;
    try {
      const requestData = await request.json();
      validatedData = validateDeleteAccountRequest(requestData);
    } catch (error: any) {
      logSecurityEvent(userId, 'delete_account', 'failure', `Validation error: ${error.message}`);
      
      return new Response(
        JSON.stringify({
          error: {
            code: error.code || "BAD_REQUEST",
            message: error.message || "Invalid request data",
            details: error.details
          },
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Step 4: Additional security verification - match user ID with cookie
    const cookieUserId = cookies.get("user_id")?.value;
    if (cookieUserId && cookieUserId !== userId) {
      logSecurityEvent(userId, 'delete_account', 'failure', `Cookie user ID ${cookieUserId} doesn't match session user ID ${userId}`);
      
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
    
    // Step 5: Get user email for password verification
    const userEmail = locals.user?.email;
    if (!userEmail) {
      logSecurityEvent(userId, 'delete_account', 'failure', 'User email not found in session');
      
      return new Response(
        JSON.stringify({
          error: {
            code: "EMAIL_NOT_FOUND",
            message: "User email not found",
          },
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Step 6: Delete account
    try {
      const accountService = new AccountService(supabase);
      const result = await accountService.deleteAccount(userId, userEmail, validatedData.password);
      
      logSecurityEvent(userId, 'delete_account', 'success');
      
      // Step 7: Clear authentication cookies (similar to logout)
      cookies.delete('access_token', { path: '/' });
      cookies.delete('refresh_token', { path: '/' });
      cookies.delete('user_id', { path: '/' });
      
      // Step 8: Return success response
      return new Response(
        JSON.stringify({
          data: result,
        } as ApiSuccessResponse<DeleteAccountResponseDTO>),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      // Handle specific error codes
      let status = 500;
      switch (error.code) {
        case "INVALID_CREDENTIALS":
          status = 401;
          logSecurityEvent(userId, 'delete_account', 'failure', 'Invalid credentials provided');
          break;
        case "ALREADY_DELETED":
          status = 409;
          logSecurityEvent(userId, 'delete_account', 'failure', 'Account already deleted');
          break;
        case "PROFILE_ERROR":
        case "UPDATE_ERROR":
          status = 500;
          logSecurityEvent(userId, 'delete_account', 'failure', error.details || error.message);
          break;
        default:
          logSecurityEvent(userId, 'delete_account', 'failure', `Unknown error: ${error.message}`);
      }
      
      return new Response(
        JSON.stringify({
          error: {
            code: error.code || "UNKNOWN_ERROR",
            message: error.message || "An unexpected error occurred",
            details: error.details
          },
        } as ApiErrorResponse),
        {
          status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error during account deletion:", error);
    
    logSecurityEvent(locals.user?.id || 'unknown', 'delete_account', 'failure', `Unexpected error: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        error: {
          code: "SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      } as ApiErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
