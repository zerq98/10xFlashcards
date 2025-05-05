import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { ApiErrorResponse, ApiSuccessResponse, RegisterRequestDTO } from '../../../../types';

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
 * Interface for user creation command
 */
interface CreateUserCommand {
  email: string;
  password: string;
}

/**
 * Interface for profile initialization command
 */
interface InitializeProfileCommand {
  userId: string;
  email: string;
}

// Validation schema for registration request with detailed error messages
const registerRequestSchema = z.object({
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
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
});

/**
 * Validates and sanitizes registration request data
 * @param data - The raw input data to validate
 * @returns Validated RegisterRequestDTO or throws error
 */
const validateRegisterRequest = (data: unknown): RegisterRequestDTO => {
  try {
    const result = registerRequestSchema.parse(data);
    
    return {
      email: result.email,
      password: result.password
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "VALIDATION_ERROR",
        message: "Invalid registration data",
        details: error.format()
      };
    }
    throw error;
  }
};

/**
 * Validates email availability by checking if it already exists in Auth
 * @param supabase - Supabase client
 * @param email - Email to check
 * @returns Promise resolving to true if email is available
 * @throws Error if email is already in use
 */
const validateEmailAvailability = async (
  supabase: any,
  email: string
): Promise<boolean> => {
  // Use Supabase's admin functions to check if user exists
  const { data, error } = await supabase.auth.admin.listUsers({
    filter: { email }
  });
  
  if (error) {
    throw {
      code: "EMAIL_VALIDATION_ERROR",
      message: "Failed to validate email availability",
      details: error.message
    };
  }
  
  if (data && data.users && data.users.length > 0) {
    throw {
      code: "EMAIL_ALREADY_EXISTS",
      message: "This email is already registered",
    };
  }
  
  return true;
};

/**
 * Authentication service class for user registration
 */
class AuthService {
  private supabase;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Registers a new user with email and password
   * @param command - User creation command with email and password
   * @returns Authentication response with user and session data
   */
  async registerUser(command: CreateUserCommand): Promise<AuthResponseDTO> {
    const { data, error } = await this.supabase.auth.signUp({
      email: command.email,
      password: command.password,
      options: {
        // Disable email verification by setting emailConfirm to false
        emailConfirm: false,
        // No email redirect needed since we're skipping verification
      }
    });

    if (error) {
      // Handle different registration errors
      if (error.status === 400) {
        throw {
          code: "REGISTRATION_ERROR",
          message: "Registration failed: Invalid data",
          details: error.message
        };
      } else if (error.status === 422) {
        throw {
          code: "EMAIL_ALREADY_EXISTS",
          message: "This email is already registered",
          details: error.message
        };
      } else {
        throw {
          code: "REGISTRATION_ERROR",
          message: "Registration failed",
          details: error.message
        };
      }
    }

    if (!data.user || !data.session) {
      throw {
        code: "REGISTRATION_ERROR",
        message: "Failed to register user: no user or session data returned",
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
 * Profile service class for user profile management
 */
class ProfileService {
  private supabase;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Creates a new user profile after registration
   * @param command - Profile initialization command with userId and email
   * @returns Promise resolving when profile is created
   */
  async createProfile(command: InitializeProfileCommand): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .insert({
        id: command.userId,
        email: command.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw {
        code: "PROFILE_CREATION_ERROR",
        message: "Failed to create user profile",
        details: error.message
      };
    }
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
 * Executes the registration process within a transaction
 * @param supabase - Supabase client
 * @param command - User creation command with email and password
 * @returns Authentication response with user and session data
 */
const executeRegistrationTransaction = async (
  supabase: any,
  command: CreateUserCommand
): Promise<AuthResponseDTO> => {
  try {
    // 1. Register the user with Supabase Auth
    const authService = new AuthService(supabase);
    const authResponse = await authService.registerUser(command);
    
    // 2. Create the user profile
    const profileService = new ProfileService(supabase);
    await profileService.createProfile({
      userId: authResponse.user.id,
      email: authResponse.user.email
    });
    
    return authResponse;
  } catch (error: unknown) {
    // If registration was successful but profile creation failed,
    // we should attempt to clean up the created user
    if (typeof error === 'object' && error !== null && 
        'code' in error && error.code === "PROFILE_CREATION_ERROR" &&
        'userId' in error) {
      try {
        // Try to delete the user account to avoid orphaned auth accounts
        await supabase.auth.admin.deleteUser(error.userId as string);
      } catch (cleanupError) {
        console.error("Failed to clean up orphaned user after profile creation error:", cleanupError);
      }
    }
    
    throw error;
  }
};

/**
 * POST /api/auth/register - Registers a new user and creates a profile
 * 
 * @param {Object} context - Astro API route context
 * @returns {Response} JSON response with session data or error details
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Validate request body
    let requestData: RegisterRequestDTO;
    try {
      const rawData = await request.json();
      requestData = validateRegisterRequest(rawData);
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

    // 2. Check if email is already registered
    try {
      await validateEmailAvailability(locals.supabase, requestData.email);
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          error: {
            code: error.code || "EMAIL_VALIDATION_ERROR",
            message: error.message || "Email validation failed",
            details: error.details
          }
        } satisfies ApiErrorResponse),
        {
          status: error.code === "EMAIL_ALREADY_EXISTS" ? 409 : 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    // 3. Register user and create profile
    let authResponse: AuthResponseDTO;
    try {
      authResponse = await executeRegistrationTransaction(locals.supabase, {
        email: requestData.email,
        password: requestData.password
      });
    } catch (error: any) {
      // Determine appropriate status code based on error
      let status = 500;
      if (error.code === "EMAIL_ALREADY_EXISTS") status = 409;
      if (error.code === "REGISTRATION_ERROR" && error.details?.includes("already registered")) status = 409;
      
      return new Response(
        JSON.stringify({
          error: {
            code: error.code || "REGISTRATION_ERROR",
            message: error.message || "Registration failed",
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

    // 4. Create response with session data
    let response = new Response(
      JSON.stringify({
        data: authResponse
      } satisfies ApiSuccessResponse<AuthResponseDTO>),
      {
        status: 201, // Created
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
    
    // 5. Set session cookies
    response = setSessionCookies(response, authResponse.session);
    
    // 6. Set CSRF token for additional security
    response = setCsrfToken(response);
    
    return response;
    
  } catch (error) {
    console.error("Unexpected error during registration:", error);
    
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