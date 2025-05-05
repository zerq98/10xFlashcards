import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { ApiErrorResponse, ApiSuccessResponse, LoginRequestDTO } from '../../../../types';

/**
 * Interface for authentication response data
 */
interface AuthResponseDTO {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * Interface for authentication command
 */
interface AuthenticateCommand {
  email: string;
  password: string;
}

// Validation schema for login request with detailed error messages
const loginRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password exceeds maximum length")
});

/**
 * Validates and sanitizes login request data
 * @param data - The raw input data to validate
 * @returns Validated LoginRequestDTO or throws error
 */
const validateLoginRequest = (data: unknown): LoginRequestDTO => {
  try {
    const result = loginRequestSchema.parse(data);
    
    return {
      email: result.email,
      password: result.password
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "VALIDATION_ERROR",
        message: "Invalid login data",
        details: error.format()
      };
    }
    throw error;
  }
};

/**
 * Authentication service class
 */
class AuthService {
  private supabase;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Authenticates a user with email and password
   * @param command - Authentication command with email and password
   * @returns Authentication response with user and session data
   */
  async authenticateUser(command: AuthenticateCommand): Promise<AuthResponseDTO> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: command.email,
      password: command.password
    });

    if (error) {
      // Handle different authentication errors
      if (error.status === 400) {
        throw {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
          details: error.message
        };
      } else if (error.status === 429) {
        throw {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many login attempts, please try again later",
          details: error.message
        };
      } else {
        throw {
          code: "AUTHENTICATION_ERROR",
          message: "Authentication failed",
          details: error.message
        };
      }
    }

    if (!data.user || !data.session) {
      throw {
        code: "AUTHENTICATION_ERROR",
        message: "Failed to authenticate user: no user or session data returned",
      };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || ''
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    };
  }
}

/**
 * Sets secure session cookies
 * @param response - Response object
 * @param session - Authentication session data
 * @returns Updated Response with cookies
 */
const setSessionCookies = (
  response: Response,
  session: AuthResponseDTO['session']
): Response => {
  // Calculate expiry time for cookies
  const expiryDate = new Date(session.expires_at * 1000);
  
  // Set session cookies with secure settings
  response.headers.append('Set-Cookie', 
    `access_token=${session.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expiryDate.toUTCString()}`
  );
  
  response.headers.append('Set-Cookie', 
    `refresh_token=${session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expiryDate.toUTCString()}`
  );

  return response;
};

/**
 * Sets CSRF token cookie
 * @param response - Response object
 * @returns Updated Response with CSRF token cookie
 */
const setCsrfToken = (response: Response): Response => {
  const csrfToken = crypto.randomUUID();
  const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  response.headers.append('Set-Cookie', 
    `csrf_token=${csrfToken}; Path=/; Secure; SameSite=Strict; Expires=${expiryDate.toUTCString()}`
  );

  return response;
};

/**
 * POST /api/auth/login - Authenticates a user and creates a session
 * 
 * @param {Object} context - Astro API route context
 * @returns {Response} JSON response with session data or error details
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Validate request body
    let requestData: LoginRequestDTO;
    try {
      const rawData = await request.json();
      requestData = validateLoginRequest(rawData);
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          error: {
            code: error.code || "BAD_REQUEST",
            message: error.message || "Invalid request body",
            details: error.details
          }
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    // 2. Get client IP for rate limiting
    const clientIp = request.headers.get('X-Forwarded-For')?.split(',')[0] || 
                     request.headers.get('CF-Connecting-IP') || 
                     'unknown';
    
    // 3. Check rate limiting (simple implementation)
    // Note: In a production environment, use a more robust rate limiting solution
    // This is a simplified version for the implementation
    const rateLimitKey = `login_attempts:${clientIp}:${requestData.email}`;
    
    // For now, we'll skip actual rate limit checking as it would require
    // additional infrastructure, but we acknowledge it in the implementation

    // 4. Authenticate user
    let authService = new AuthService(locals.supabase);
    let authResponse: AuthResponseDTO;
    
    try {
      authResponse = await authService.authenticateUser({
        email: requestData.email,
        password: requestData.password
      });
    } catch (error: any) {
      // Determine appropriate status code based on error
      let status = 500;
      if (error.code === "INVALID_CREDENTIALS") status = 401;
      if (error.code === "RATE_LIMIT_EXCEEDED") status = 429;
      
      return new Response(
        JSON.stringify({
          error: {
            code: error.code || "AUTHENTICATION_ERROR",
            message: error.message || "Authentication failed",
            details: error.details
          }
        } satisfies ApiErrorResponse),
        {
          status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    // 5. Create response with session data
    let response = new Response(
      JSON.stringify({
        data: authResponse
      } satisfies ApiSuccessResponse<AuthResponseDTO>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
    
    // 6. Set session cookies
    response = setSessionCookies(response, authResponse.session);
    
    // 7. Set CSRF token for additional security
    response = setCsrfToken(response);
    
    return response;
    
  } catch (error) {
    console.error("Unexpected error during login:", error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error)
        }
      } satisfies ApiErrorResponse),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }
};