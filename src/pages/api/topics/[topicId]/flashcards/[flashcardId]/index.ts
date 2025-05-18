import { z } from "zod";
import type { APIRoute } from "astro";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  FlashcardDTO,
  UpdateFlashcardRequestDTO,
} from "../../../../../../types";

/**
 * Configuration constants for flashcard limits and validation
 */
const FLASHCARD_CONFIG = {
  content: {
    maxFrontLength: 500,
    maxBackLength: 500,
    minLength: 1,
  },
};

/**
 * Validation schema for updating flashcards with detailed error messages
 */
const updateFlashcardSchema = z.object({
  front: z
    .string()
    .min(FLASHCARD_CONFIG.content.minLength, "Front content is required")
    .max(
      FLASHCARD_CONFIG.content.maxFrontLength,
      `Front content must be ${FLASHCARD_CONFIG.content.maxFrontLength} characters or less`
    )
    .transform((val) => val.trim()),
  back: z
    .string()
    .min(FLASHCARD_CONFIG.content.minLength, "Back content is required")
    .max(
      FLASHCARD_CONFIG.content.maxBackLength,
      `Back content must be ${FLASHCARD_CONFIG.content.maxBackLength} characters or less`
    )
    .transform((val) => val.trim()),
});

/**
 * Enhanced sanitization function for flashcard content
 * @param content Content to sanitize
 * @returns Sanitized content
 */
const sanitizeFlashcardContent = (content: string): string => {
  // Basic sanitization - remove dangerous HTML, scripts, iframes, and excessive whitespace
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>/g, "") // Remove any remaining HTML tags
    .replace(/javascript:/gi, "") // Remove potential JavaScript protocol handlers
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/(\s{2,})/g, " ") // Replace multiple spaces with a single space
    .trim(); // Trim whitespace from start and end
};

/**
 * Validates if a user has access to a specific flashcard
 * @param supabase Supabase client
 * @param userId User ID
 * @param topicId Topic ID
 * @param flashcardId Flashcard ID
 * @returns Object with validation result and error details if applicable
 */
const validateFlashcardAccess = async (
  supabase: any,
  userId: string,
  topicId: string,
  flashcardId: string
): Promise<{
  isValid: boolean;
  status?: number;
  message?: string;
  flashcard?: any;
  suspiciousActivity?: boolean;
}> => {
  // Validate that userId is a valid UUID
  if (
    !userId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId
    )
  ) {
    console.error(
      "SECURITY: Invalid user ID format in flashcard access check",
      { userId }
    );
    return {
      isValid: false,
      status: 401,
      message: "Invalid authentication",
      suspiciousActivity: true,
    };
  }

  // Check if flashcard exists at all (regardless of ownership)
  const { data: flashcardExists, error: existsError } = await supabase
    .from("flashcards")
    .select("user_id, topic_id")
    .eq("id", flashcardId)
    .single();

  // Check if the flashcard exists but belongs to a different user - potencjalne wymieszanie sesji
  if (flashcardExists) {
    const isWrongUser = flashcardExists.user_id !== userId;
    const isWrongTopic = flashcardExists.topic_id !== topicId;

    if (isWrongUser || isWrongTopic) {
      // Zwiększ poziom logowania dla potencjalnych prób wymieszania sesji
      const severity = isWrongUser ? "CRITICAL" : "WARNING";
      console.warn(`SECURITY ${severity}: Potential session mixing detected`, {
        requestedBy: userId,
        ownedBy: flashcardExists.user_id,
        requestedTopicId: topicId,
        actualTopicId: flashcardExists.topic_id,
        flashcardId,
        mismatchType: isWrongUser ? "user_id" : "topic_id",
      });

      return {
        isValid: false,
        status: 403,
        message: "You don't have access to this flashcard",
        suspiciousActivity: true,
      };
    }
  }

  // Check if flashcard exists and belongs to the user
  const { data: flashcard, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", flashcardId)
    .eq("topic_id", topicId)
    .eq("user_id", userId)
    .single();

  if (error || !flashcard) {
    console.log("ERROR: Flashcard access validation failed", {
      error: error?.message,
      userId,
      topicId,
      flashcardId,
    });

    if (error?.code === "PGRST116") {
      // Record not found error code from PostgREST
      return {
        isValid: false,
        status: 404,
        message: "Flashcard not found",
      };
    }

    return {
      isValid: false,
      status: 403,
      message: "You don't have access to this flashcard",
    };
  }

  return {
    isValid: true,
    flashcard,
  };
};

/**
 * PUT /api/topics/:topicId/flashcards/:flashcardId - Updates a specific flashcard
 *
 * Request body:
 * {
 *   front: string, // Required, 1-500 characters
 *   back: string   // Required, 1-500 characters
 * }
 *
 * Success response (200 OK):
 * {
 *   data: {
 *     id: string,
 *     front: string,
 *     back: string,
 *     is_ai_generated: boolean,
 *     sr_state: object | null,
 *     created_at: string,
 *     updated_at: string
 *   }
 * }
 *
 * Error responses:
 * - 400 Bad Request: Invalid input parameters
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User not authorized to access flashcard
 * - 404 Not Found: Flashcard not found
 * - 500 Internal Server Error: Database or other server issues
 *
 * @param {Object} context - Astro API route context
 * @returns {Response} JSON response with updated flashcard or error details
 */
export const PUT: APIRoute = async ({
  request,
  params: routeParams,
  locals,
}) => {
  // Start performance tracking
  const startTime = performance.now();
  let dbOperationTime = 0;

  console.log(
    "DEBUG: Starting PUT /api/topics/:topicId/flashcards/:flashcardId handler"
  );

  try {
    // 1. Validate path parameters - handle this first to fail fast
    const { topicId, flashcardId } = routeParams;

    if (
      !topicId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        topicId
      )
    ) {
      console.log("ERROR: Invalid topicId", { topicId });
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMETER",
            message: "Invalid topic ID format",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (
      !flashcardId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        flashcardId
      )
    ) {
      console.log("ERROR: Invalid flashcardId", { flashcardId });
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMETER",
            message: "Invalid flashcard ID format",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    } // 2. Check authentication - using session from context.locals per guidelines
    console.log("DEBUG: Checking authentication");
    const supabase = locals.supabase;
    const session = locals.session;
    console.log(
      "DEBUG: PUT /api/topics/:topicId/flashcards/:flashcardId - Session status:",
      session ? "Authenticated" : "Not authenticated"
    );

    // Dodatkowa weryfikacja dla zapobiegania wymieszaniu sesji
    if (session && (!session.user?.id || typeof session.user.id !== "string")) {
      console.warn("SECURITY: Invalid session structure detected", {
        hasUserId: !!session.user?.id,
        userIdType: typeof session.user?.id,
        endpoint: "PUT /api/topics/:topicId/flashcards/:flashcardId",
      });

      // Dodaj losowe opóźnienie dla utrudnienia ataków czasowych
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 500)
      );

      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication failed",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (!session) {
      console.log("ERROR: Authentication failed - No valid session");
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to update flashcards",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const userId = session.user.id;

    // 3. Validate and parse request body
    console.log("DEBUG: PUT - Parsing and validating request body");
    let requestData: unknown;
    try {
      requestData = await request.json();
      console.log("DEBUG: PUT - Request body parsed successfully");
    } catch (error) {
      console.log(
        "ERROR: PUT - Failed to parse request body",
        error instanceof Error ? error.message : String(error)
      );
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON request body",
            details: error instanceof Error ? error.message : String(error),
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Validate the request data against our schema
    console.log("DEBUG: PUT - Validating request data against schema");
    const validationResult = updateFlashcardSchema.safeParse(requestData);

    if (!validationResult.success) {
      console.log(
        "ERROR: PUT - Schema validation failed",
        validationResult.error.format()
      );
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid flashcard data",
            details: validationResult.error.format(),
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const flashcardData = validationResult.data;
    console.log("DEBUG: PUT - Schema validation succeeded, parsed data", {
      frontLength: flashcardData.front.length,
      backLength: flashcardData.back.length,
    });

    // 4. Validate that the user has access to this flashcard
    console.log("DEBUG: PUT - Validating flashcard access");
    const dbStartTime = performance.now();
    const accessValidation = await validateFlashcardAccess(
      supabase,
      userId,
      topicId,
      flashcardId
    );

    if (!accessValidation.isValid) {
      const logLevel = accessValidation.suspiciousActivity ? "warn" : "log";
      console[logLevel]("SECURITY: PUT - Access validation failed", {
        status: accessValidation.status,
        message: accessValidation.message,
        userId,
        flashcardId,
        topicId,
        suspiciousActivity: accessValidation.suspiciousActivity,
      });

      // For security reasons, add a small delay to prevent timing attacks when suspicious activity is detected
      if (accessValidation.suspiciousActivity) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code:
              accessValidation.status === 404
                ? "FLASHCARD_NOT_FOUND"
                : "FLASHCARD_ACCESS_DENIED",
            message: accessValidation.message || "Access denied",
          },
        } satisfies ApiErrorResponse),
        {
          status: accessValidation.status || 403,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 5. Sanitize flashcard content
    console.log("DEBUG: PUT - Sanitizing flashcard content");
    const sanitizedFront = sanitizeFlashcardContent(flashcardData.front);
    const sanitizedBack = sanitizeFlashcardContent(flashcardData.back);
    console.log("DEBUG: PUT - Content after sanitization", {
      frontOrigLength: flashcardData.front.length,
      frontSanitizedLength: sanitizedFront.length,
      backOrigLength: flashcardData.back.length,
      backSanitizedLength: sanitizedBack.length,
    });

    // If sanitization removed all content, return an error
    if (!sanitizedFront.trim() || !sanitizedBack.trim()) {
      console.log("ERROR: PUT - Empty content after sanitization", {
        frontEmpty: !sanitizedFront.trim(),
        backEmpty: !sanitizedBack.trim(),
      });
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_CONTENT",
            message: "Flashcard content cannot be empty after sanitization",
            details: {
              front: !sanitizedFront.trim()
                ? "Empty after sanitization"
                : "Valid",
              back: !sanitizedBack.trim()
                ? "Empty after sanitization"
                : "Valid",
            },
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 6. Update the flashcard in the database
    console.log("DEBUG: PUT - Updating flashcard in database", {
      flashcardId,
      userId,
    });

    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({
        front: sanitizedFront,
        back: sanitizedBack,
        updated_at: new Date().toISOString(),
      })
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select(
        "id, front, back, is_ai_generated, sr_state, created_at, updated_at"
      )
      .single();

    dbOperationTime = performance.now() - dbStartTime;
    console.log(
      "DEBUG: PUT - Database operation completed in",
      dbOperationTime.toFixed(2),
      "ms"
    );

    if (updateError || !updatedFlashcard) {
      console.log("ERROR: PUT - Database update error", {
        error: updateError?.message,
        code: updateError?.code,
        details: updateError?.details,
      });
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to update flashcard",
            details: updateError?.message || "Unknown database error",
          },
        } satisfies ApiErrorResponse),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 7. Map the database response to DTO and return
    const flashcardDTO: FlashcardDTO = {
      id: updatedFlashcard.id,
      front: updatedFlashcard.front,
      back: updatedFlashcard.back,
      is_ai_generated: updatedFlashcard.is_ai_generated,
      sr_state: updatedFlashcard.sr_state as FlashcardDTO["sr_state"],
      created_at: updatedFlashcard.created_at,
      updated_at: updatedFlashcard.updated_at,
    };

    // Calculate total response time
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Log performance metrics for monitoring
    console.info(
      `PUT /api/topics/${topicId}/flashcards/${flashcardId} - ${totalDuration.toFixed(
        2
      )}ms - DB: ${dbOperationTime.toFixed(2)}ms`
    );

    // Return updated flashcard with status 200
    return new Response(
      JSON.stringify({
        data: flashcardDTO,
      } satisfies ApiSuccessResponse<FlashcardDTO>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Server-Timing": `db;dur=${dbOperationTime.toFixed(
            2
          )},total;dur=${totalDuration.toFixed(2)}`,
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error in update flashcard endpoint:", error);

    // Calculate total response time even for errors
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error),
        },
      } satisfies ApiErrorResponse),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Server-Timing": `total;dur=${totalDuration.toFixed(2)}`,
        },
      }
    );
  }
};

/**
 * DELETE /api/topics/:topicId/flashcards/:flashcardId - Deletes a specific flashcard
 *
 * Success response (204 No Content)
 *
 * Error responses:
 * - 400 Bad Request: Invalid input parameters
 * - 401 Unauthorized: User not authenticated
 * - 403 Forbidden: User not authorized to access flashcard
 * - 404 Not Found: Flashcard not found
 * - 500 Internal Server Error: Database or other server issues
 *
 * @param {Object} context - Astro API route context
 * @returns {Response} Empty response with success status code or error details
 */
export const DELETE: APIRoute = async ({ params: routeParams, locals }) => {
  // Start performance tracking
  const startTime = performance.now();
  let dbOperationTime = 0;

  console.log(
    "DEBUG: Starting DELETE /api/topics/:topicId/flashcards/:flashcardId handler"
  );

  try {
    // 1. Validate path parameters - handle this first to fail fast
    const { topicId, flashcardId } = routeParams;

    if (
      !topicId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        topicId
      )
    ) {
      console.log("ERROR: Invalid topicId", { topicId });
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMETER",
            message: "Invalid topic ID format",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (
      !flashcardId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        flashcardId
      )
    ) {
      console.log("ERROR: Invalid flashcardId", { flashcardId });
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMETER",
            message: "Invalid flashcard ID format",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    } // 2. Check authentication - using session from context.locals per guidelines
    console.log("DEBUG: Checking authentication");
    const supabase = locals.supabase;
    const session = locals.session;
    console.log(
      "DEBUG: DELETE /api/topics/:topicId/flashcards/:flashcardId - Session status:",
      session ? "Authenticated" : "Not authenticated"
    );

    // Dodatkowa weryfikacja dla zapobiegania wymieszaniu sesji
    if (session && (!session.user?.id || typeof session.user.id !== "string")) {
      console.warn("SECURITY: Invalid session structure detected", {
        hasUserId: !!session.user?.id,
        userIdType: typeof session.user?.id,
        endpoint: "DELETE /api/topics/:topicId/flashcards/:flashcardId",
      });

      // Dodaj losowe opóźnienie dla utrudnienia ataków czasowych
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 500)
      );

      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication failed",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (!session) {
      console.log("ERROR: Authentication failed - No valid session");
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to delete flashcards",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const userId = session.user.id;

    // 3. Validate that the user has access to this flashcard
    console.log("DEBUG: DELETE - Validating flashcard access");
    const dbStartTime = performance.now();
    const accessValidation = await validateFlashcardAccess(
      supabase,
      userId,
      topicId,
      flashcardId
    );
    if (!accessValidation.isValid) {
      const logLevel = accessValidation.suspiciousActivity ? "warn" : "log";
      console[logLevel]("SECURITY: DELETE - Access validation failed", {
        status: accessValidation.status,
        message: accessValidation.message,
        userId,
        flashcardId,
        topicId,
        suspiciousActivity: accessValidation.suspiciousActivity,
      });

      // For security reasons, add a small delay to prevent timing attacks when suspicious activity is detected
      if (accessValidation.suspiciousActivity) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 500)
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code:
              accessValidation.status === 404
                ? "FLASHCARD_NOT_FOUND"
                : "FLASHCARD_ACCESS_DENIED",
            message: accessValidation.message || "Access denied",
          },
        } satisfies ApiErrorResponse),
        {
          status: accessValidation.status || 403,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 4. Delete the flashcard
    console.log("DEBUG: DELETE - Deleting flashcard from database", {
      flashcardId,
      userId,
    });

    const { error: deleteError } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", flashcardId)
      .eq("user_id", userId);

    dbOperationTime = performance.now() - dbStartTime;
    console.log(
      "DEBUG: DELETE - Database operation completed in",
      dbOperationTime.toFixed(2),
      "ms"
    );

    if (deleteError) {
      console.log("ERROR: DELETE - Database deletion error", {
        error: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
      });
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to delete flashcard",
            details: deleteError.message || "Unknown database error",
          },
        } satisfies ApiErrorResponse),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Calculate total response time
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Log performance metrics for monitoring
    console.info(
      `DELETE /api/topics/${topicId}/flashcards/${flashcardId} - ${totalDuration.toFixed(
        2
      )}ms - DB: ${dbOperationTime.toFixed(2)}ms`
    );

    // Return 204 No Content for successful deletion
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
        "Server-Timing": `db;dur=${dbOperationTime.toFixed(
          2
        )},total;dur=${totalDuration.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Unexpected error in delete flashcard endpoint:", error);

    // Calculate total response time even for errors
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error),
        },
      } satisfies ApiErrorResponse),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Server-Timing": `total;dur=${totalDuration.toFixed(2)}`,
        },
      }
    );
  }
};
