import { z } from "zod";
import { createHash } from "crypto";
import type { APIRoute } from "astro";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  FlashcardDTO,
} from "../../../../../types";
import type { Json } from "../../../../../db/database.types";

// Define response structure with pagination
interface FlashcardsListResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
    next_cursor?: string; // Optional string, not nullable
  };
}

// Define query parameters interface
interface FlashcardsListQuery {
  userId: string;
  topicId: string;
  page: number;
  perPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  filterAiGenerated?: boolean;
  filterEdited?: boolean;
  cursor?: string;
}

// Validation schema for query parameters with detailed error messages
const queryParamsSchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be positive")
    .default(1)
    .transform((val) => Math.floor(val)), // Ensure integer value

  per_page: z.coerce
    .number()
    .int("Items per page must be an integer")
    .positive("Items per page must be positive")
    .max(100, "Maximum 100 items per page allowed")
    .default(20)
    .transform((val) => Math.floor(val)), // Ensure integer value

  sort_by: z
    .enum(["created_at", "updated_at", "front"], {
      errorMap: () => ({
        message: "Sort field must be one of: created_at, updated_at, front",
      }),
    })
    .default("created_at"),

  sort_order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({
        message: "Sort order must be either 'asc' or 'desc'",
      }),
    })
    .default("desc"),

  filter_ai_generated: z.coerce.boolean().optional(),
  filter_edited: z.coerce.boolean().optional(),

  // Add cursor for cursor-based pagination
  cursor: z.string().optional(),
});

// Safe type for fields that can be used for cursor-based pagination
type CursorSafeField = "created_at" | "updated_at" | "front";
type CursorSafeValue = string | number;

/**
 * Helper function to encode cursor for pagination
 * @param field Sort field name
 * @param value Field value to encode
 */
const encodeCursor = (field: CursorSafeField, value: CursorSafeValue): string => {
  const cursorData = { field, value };
  return Buffer.from(JSON.stringify(cursorData)).toString("base64");
};

/**
 * Helper function to decode cursor for pagination
 * @param cursor Base64 encoded cursor string
 */
const decodeCursor = (cursor: string): { field: CursorSafeField; value: CursorSafeValue } => {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString());
  } catch (error) {
    throw new Error("Invalid cursor format");
  }
};

/**
 * Generate ETag for HTTP caching
 * @param data Response data
 * @param userId User ID
 * @param topicId Topic ID
 */
const generateETag = (
  data: FlashcardsListResponseDTO,
  userId: string,
  topicId: string
): string => {
  return createHash("md5")
    .update(JSON.stringify(data) + userId + topicId)
    .digest("hex");
};

/**
 * Configuration constants for flashcard limits and validation
 */
const FLASHCARD_CONFIG = {
  limits: {
    perTopic: 1000, // Maximum flashcards per topic
    perDay: 200,    // Maximum flashcards created per day per user
  },
  content: {
    maxFrontLength: 500,
    maxBackLength: 500,
    minLength: 1,
  }
};

/**
 * More comprehensive validation schema for creating flashcards with detailed error messages
 */
const createFlashcardSchema = z.object({
  front: z.string()
    .min(FLASHCARD_CONFIG.content.minLength, "Front content is required")
    .max(FLASHCARD_CONFIG.content.maxFrontLength, `Front content must be ${FLASHCARD_CONFIG.content.maxFrontLength} characters or less`)
    .transform((val) => val.trim()),
  back: z.string()
    .min(FLASHCARD_CONFIG.content.minLength, "Back content is required")
    .max(FLASHCARD_CONFIG.content.maxBackLength, `Back content must be ${FLASHCARD_CONFIG.content.maxBackLength} characters or less`)
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
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
    .replace(/javascript:/gi, '') // Remove potential JavaScript protocol handlers
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/(\r\n|\n|\r){3,}/gm, '\n\n') // Normalize excessive line breaks
    .trim();
};

/**
 * Check if user has reached their flashcard creation limits
 * @param supabase Supabase client
 * @param userId User ID
 * @param topicId Topic ID
 * @returns Object with boolean indicating if limits are reached and details
 */
const checkFlashcardLimits = async (
  supabase: App.Locals["supabase"],
  userId: string,
  topicId: string
): Promise<{ limitReached: boolean; reason?: string; count?: number; limit?: number }> => {
  // Check total flashcards per topic limit
  const { count: topicCount, error: topicCountError } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", topicId)
    .eq("user_id", userId);

  if (topicCountError) {
    console.error("Error checking topic flashcard count:", topicCountError);
    return { limitReached: false }; // Don't block creation if we can't check
  }

  if (topicCount !== null && topicCount >= FLASHCARD_CONFIG.limits.perTopic) {
    return { 
      limitReached: true, 
      reason: "TOPIC_LIMIT_REACHED",
      count: topicCount,
      limit: FLASHCARD_CONFIG.limits.perTopic
    };
  }

  // Check daily flashcard creation limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count: dailyCount, error: dailyCountError } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", today.toISOString());

  if (dailyCountError) {
    console.error("Error checking daily flashcard count:", dailyCountError);
    return { limitReached: false }; // Don't block creation if we can't check
  }

  if (dailyCount !== null && dailyCount >= FLASHCARD_CONFIG.limits.perDay) {
    return { 
      limitReached: true, 
      reason: "DAILY_LIMIT_REACHED",
      count: dailyCount,
      limit: FLASHCARD_CONFIG.limits.perDay
    };
  }

  return { limitReached: false };
};

/**
 * GET /api/topics/:topicId/flashcards - Retrieves a paginated list of flashcards for a specific topic
 *
 * @param {Object} context - Astro API route context
 * @returns {Response} JSON response with flashcards list or error details
 */
export const GET: APIRoute = async ({
  request,
  params: routeParams,
  locals,
}) => {
  // Start performance tracking
  const startTime = performance.now();
  let dbQueryTime = 0;

  try {
    // 1. Validate topicId path parameter - handle this first to fail fast
    const { topicId } = routeParams;

    if (
      !topicId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        topicId
      )
    ) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_TOPIC_ID",
            message: "Invalid topic ID format",
            details: "Topic ID must be a valid UUID",
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

    // 2. Validate and normalize query parameters
    const url = new URL(request.url);
    const validationResult = queryParamsSchema.safeParse(
      Object.fromEntries(url.searchParams)
    );

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_PARAMS",
            message: "Invalid query parameters",
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

    const queryParams = validationResult.data;

    // 3. Check authentication - using supabase from context.locals per guidelines
    const supabase = locals.supabase;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to access this resource",
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

    // Check for If-None-Match header for conditional request
    const ifNoneMatch = request.headers.get("If-None-Match");

    // 4. Verify topic ownership and existence
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .eq("user_id", userId)
      .single();

    if (topicError || !topic) {
      const status = topicError?.code === "PGRST116" ? 404 : 403;
      const message =
        status === 404
          ? "Topic not found"
          : "You do not have access to this topic";

      return new Response(
        JSON.stringify({
          error: {
            code: status === 404 ? "TOPIC_NOT_FOUND" : "TOPIC_ACCESS_DENIED",
            message: message,
          },
        } satisfies ApiErrorResponse),
        {
          status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 5. Build database query with all filters
    const query: FlashcardsListQuery = {
      userId,
      topicId,
      page: queryParams.page,
      perPage: queryParams.per_page,
      sortBy: queryParams.sort_by,
      sortOrder: queryParams.sort_order,
      filterAiGenerated: queryParams.filter_ai_generated,
      filterEdited: queryParams.filter_edited,
      cursor: queryParams.cursor,
    };

    // Start DB query performance measurement
    const dbStartTime = performance.now();

    // Determine pagination approach - cursor-based or offset-based
    let flashcardsQuery = supabase
      .from("flashcards")
      .select(
        "id, front, back, is_ai_generated, was_edited_before_save, sr_state, created_at, updated_at",
        {
          count: query.cursor ? undefined : "exact", // Only count when not using cursor-based pagination
          head: false,
        }
      )
      .eq("topic_id", query.topicId)
      .eq("user_id", query.userId);

    // Apply filtering
    if (query.filterAiGenerated !== undefined) {
      flashcardsQuery = flashcardsQuery.eq(
        "is_ai_generated",
        query.filterAiGenerated
      );
    }

    if (query.filterEdited !== undefined) {
      flashcardsQuery = flashcardsQuery.eq(
        "was_edited_before_save",
        query.filterEdited
      );
    }

    // Apply pagination strategy based on presence of cursor
    if (query.cursor) {
      // Cursor-based pagination
      try {
        const cursorData = decodeCursor(query.cursor);

        if (query.sortOrder === "desc") {
          flashcardsQuery = flashcardsQuery
            .lt(cursorData.field, cursorData.value)
            .order(query.sortBy, { ascending: false })
            .limit(query.perPage);
        } else {
          flashcardsQuery = flashcardsQuery
            .gt(cursorData.field, cursorData.value)
            .order(query.sortBy, { ascending: true })
            .limit(query.perPage);
        }
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_CURSOR",
              message: "Invalid pagination cursor",
              details: error instanceof Error ? error.message : String(error),
            },
          } satisfies ApiErrorResponse),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Offset-based pagination
      flashcardsQuery = flashcardsQuery
        .order(query.sortBy, { ascending: query.sortOrder === "asc" })
        .range((query.page - 1) * query.perPage, query.page * query.perPage - 1);
    }

    // Execute the query
    const { data: flashcards, count, error } = await flashcardsQuery;

    // Calculate DB query time
    dbQueryTime = performance.now() - dbStartTime;

    if (error) {
      console.error("Database query error:", error);
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to fetch flashcards",
            details: error.message,
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

    // 6. Format the response
    let paginationData: FlashcardsListResponseDTO['pagination'];
    let nextCursor: string | undefined = undefined;

    if (query.cursor) {
      // For cursor-based pagination, we need to generate the next cursor
      if (flashcards && flashcards.length === query.perPage) {
        const lastItem = flashcards[flashcards.length - 1];
        // Only use valid fields for cursors with proper type checking
        if (query.sortBy === "created_at" || query.sortBy === "updated_at" || query.sortBy === "front") {
          const value = lastItem[query.sortBy];
          if (typeof value === 'string' || typeof value === 'number') {
            nextCursor = encodeCursor(query.sortBy, value);
          }
        }
      }

      // Note: With cursor-based pagination, we don't have an exact count.
      // We just know if there are more items.
      paginationData = {
        current_page: query.page,
        total_pages: nextCursor ? query.page + 1 : query.page, // At least one more if we have a next cursor
        total_items:
          (query.page - 1) * query.perPage +
          (flashcards?.length || 0) +
          (nextCursor ? 1 : 0),
        per_page: query.perPage,
        next_cursor: nextCursor
      };
    } else {
      // For offset-based pagination
      const totalPages = count ? Math.ceil(count / query.perPage) : 0;
      paginationData = {
        current_page: query.page,
        total_pages: totalPages,
        total_items: count || 0,
        per_page: query.perPage
      };
    }

    // Handle the case when no flashcards are found
    if (!flashcards || flashcards.length === 0) {
      const emptyResponse: FlashcardsListResponseDTO = {
        flashcards: [],
        pagination: paginationData
      };

      const etag = generateETag(emptyResponse, userId, topicId);

      // For conditional requests, check if resource has changed
      if (ifNoneMatch && ifNoneMatch === `"${etag}"`) {
        return new Response(null, {
          status: 304, // Not Modified
          headers: {
            ETag: `"${etag}"`,
            "Cache-Control": "max-age=60", // Cache empty results for 60 seconds
          },
        });
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      return new Response(
        JSON.stringify({
          data: emptyResponse
        } satisfies ApiSuccessResponse<FlashcardsListResponseDTO>),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "max-age=60", // Cache empty results for 60 seconds
            ETag: `"${etag}"`,
            "Server-Timing": `db;dur=${dbQueryTime.toFixed(
              2
            )},total;dur=${totalDuration.toFixed(2)}`,
          },
        }
      );
    }

    // Convert database flashcards to FlashcardDTOs using the existing type
    const flashcardDTOs = flashcards.map((flashcard) => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      is_ai_generated: flashcard.is_ai_generated,
      sr_state: flashcard.sr_state as FlashcardDTO["sr_state"],
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    })) as FlashcardDTO[];

    // Build the formatted response object
    const formattedResponse: FlashcardsListResponseDTO = {
      flashcards: flashcardDTOs,
      pagination: paginationData
    };

    // Generate ETag for caching
    const etag = generateETag(formattedResponse, userId, topicId);

    // For conditional requests, check if resource has changed
    if (ifNoneMatch && ifNoneMatch === `"${etag}"`) {
      return new Response(null, {
        status: 304, // Not Modified
        headers: {
          ETag: `"${etag}"`,
          "Cache-Control": "max-age=60",
        },
      });
    }

    // Calculate total response time
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Log performance metrics for monitoring
    console.info(
      `GET /api/topics/${topicId}/flashcards - ${totalDuration.toFixed(
        2
      )}ms - DB: ${dbQueryTime.toFixed(2)}ms - Count: ${count || flashcards.length}`
    );

    // Return response with proper headers including performance metrics and ETag
    return new Response(
      JSON.stringify({
        data: formattedResponse
      } satisfies ApiSuccessResponse<FlashcardsListResponseDTO>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=60", // Cache results for 60 seconds
          ETag: `"${etag}"`,
          "Server-Timing": `db;dur=${dbQueryTime.toFixed(
            2
          )},total;dur=${totalDuration.toFixed(2)}`,
        },
      }
    );
  } catch (error) {
    // Calculate error response time for monitoring
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    console.error(
      `Error in GET /api/topics/:topicId/flashcards - ${totalDuration.toFixed(
        2
      )}ms:`,
      error
    );

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
 * POST /api/topics/:topicId/flashcards - Creates a new flashcard in a specific topic
 * 
 * Request body:
 * {
 *   front: string, // Required, 1-500 characters
 *   back: string   // Required, 1-500 characters
 * }
 * 
 * Success response (201 Created):
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
 * - 403 Forbidden: User not authorized to access topic or limit reached
 * - 404 Not Found: Topic not found
 * - 500 Internal Server Error: Database or other server issues
 * 
 * @param {Object} context - Astro API route context
 * @returns {Response} JSON response with created flashcard or error details
 */
export const POST: APIRoute = async ({
  request,
  params: routeParams,
  locals,
}) => {
  // Start performance tracking
  const startTime = performance.now();
  let dbOperationTime = 0;

  try {
    // 1. Validate topicId path parameter - handle this first to fail fast
    const { topicId } = routeParams;

    if (
      !topicId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        topicId
      )
    ) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_TOPIC_ID",
            message: "Invalid topic ID format",
            details: "Topic ID must be a valid UUID",
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

    // 2. Check authentication - using supabase from context.locals per guidelines
    const supabase = locals.supabase;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to create flashcards",
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
    let requestData: unknown;
    try {
      requestData = await request.json();
    } catch (error) {
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
    const validationResult = createFlashcardSchema.safeParse(requestData);

    if (!validationResult.success) {
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

    // 4. Verify topic ownership and existence
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .eq("user_id", userId)
      .single();

    if (topicError || !topic) {
      const status = topicError?.code === "PGRST116" ? 404 : 403;
      const message =
        status === 404
          ? "Topic not found"
          : "You do not have access to this topic";

      return new Response(
        JSON.stringify({
          error: {
            code: status === 404 ? "TOPIC_NOT_FOUND" : "TOPIC_ACCESS_DENIED",
            message: message,
          },
        } satisfies ApiErrorResponse),
        {
          status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 5. Check flashcard creation limits
    const limitCheck = await checkFlashcardLimits(supabase, userId, topicId);
    if (limitCheck.limitReached) {
      return new Response(
        JSON.stringify({
          error: {
            code: limitCheck.reason || "LIMIT_REACHED",
            message: limitCheck.reason === "TOPIC_LIMIT_REACHED" 
              ? `You have reached the maximum number of flashcards (${limitCheck.limit}) for this topic`
              : `You have reached the daily limit of ${limitCheck.limit} flashcards`,
            details: {
              current: limitCheck.count,
              limit: limitCheck.limit
            },
          },
        } satisfies ApiErrorResponse),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 6. Sanitize flashcard content
    const sanitizedFront = sanitizeFlashcardContent(flashcardData.front);
    const sanitizedBack = sanitizeFlashcardContent(flashcardData.back);

    // If sanitization removed all content, return an error
    if (!sanitizedFront.trim() || !sanitizedBack.trim()) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_CONTENT",
            message: "Flashcard content cannot be empty after sanitization",
            details: {
              front: !sanitizedFront.trim() ? "Empty after sanitization" : "Valid",
              back: !sanitizedBack.trim() ? "Empty after sanitization" : "Valid",
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

    // 7. Create the flashcard in the database
    const dbStartTime = performance.now();
    
    const { data: createdFlashcard, error: insertError } = await supabase
      .from("flashcards")
      .insert([
        {
          topic_id: topicId,
          user_id: userId,
          front: sanitizedFront,
          back: sanitizedBack,
          is_ai_generated: false,
          was_edited_before_save: false,
        },
      ])
      .select("id, front, back, is_ai_generated, sr_state, created_at, updated_at")
      .single();
    
    dbOperationTime = performance.now() - dbStartTime;

    if (insertError || !createdFlashcard) {
      console.error("Database insertion error:", insertError);
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Failed to create flashcard",
            details: insertError?.message || "Unknown database error",
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

    // 8. Map the database response to DTO and return
    const flashcardDTO: FlashcardDTO = {
      id: createdFlashcard.id,
      front: createdFlashcard.front,
      back: createdFlashcard.back,
      is_ai_generated: createdFlashcard.is_ai_generated,
      sr_state: createdFlashcard.sr_state as FlashcardDTO["sr_state"],
      created_at: createdFlashcard.created_at,
      updated_at: createdFlashcard.updated_at,
    };

    // Calculate total response time
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Log performance metrics for monitoring
    console.info(
      `POST /api/topics/${topicId}/flashcards - ${totalDuration.toFixed(
        2
      )}ms - DB: ${dbOperationTime.toFixed(2)}ms`
    );

    // Return created flashcard with status 201
    return new Response(
      JSON.stringify({
        data: flashcardDTO,
      } satisfies ApiSuccessResponse<FlashcardDTO>),
      {
        status: 201,
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
    // Calculate error response time for monitoring
    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    console.error(
      `Error in POST /api/topics/:topicId/flashcards - ${totalDuration.toFixed(
        2
      )}ms:`,
      error
    );

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
