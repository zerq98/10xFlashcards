import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { ApiErrorResponse, ApiSuccessResponse, TopicDTO, UpdateTopicRequestDTO } from '../../../../types';

/**
 * GET /api/topics/[topicId] - Retrieves data for a specific topic
 * 
 * @param {Object} context - Astro API route context
 * @returns {Response} JSON response with topic data or error details
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate the topicId parameter - handle this first to fail fast
    const topicIdSchema = z.string().uuid('Topic ID must be a valid UUID');
    const validationResult = topicIdSchema.safeParse(params.topicId);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_TOPIC_ID',
          message: 'Invalid topic ID format',
          details: validationResult.error.format()
        }
      } satisfies ApiErrorResponse), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    const topicId = validationResult.data;
    
    // 2. Check authentication - using supabase from context.locals per guidelines
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource'
        }
      } satisfies ApiErrorResponse), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    const userId = session.user.id;
    
    // 3. Fetch the topic data from the database
    const { data: topic, error } = await supabase
      .from('topics')
      .select('id, name, created_at, updated_at')
      .eq('id', topicId)
      .eq('user_id', userId)
      .single();
    
    // 4. Handle database errors
    if (error) {
      // Check if it's a not found error
      if (error.code === 'PGRST116') {
        return new Response(JSON.stringify({
          error: {
            code: 'TOPIC_NOT_FOUND',
            message: 'Topic not found or you do not have access to it'
          }
        } satisfies ApiErrorResponse), {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store' 
          }
        });
      }
      
      // Handle other database errors
      console.error('Database query error:', error);
      return new Response(JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch topic data',
          details: error.message
        }
      } satisfies ApiErrorResponse), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    // 5. Topic not found case (should be caught by error above but adding as a safeguard)
    if (!topic) {
      return new Response(JSON.stringify({
        error: {
          code: 'TOPIC_NOT_FOUND',
          message: 'Topic not found or you do not have access to it'
        }
      } satisfies ApiErrorResponse), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    // 6. Return the topic data (reuse the mapToTopicResponse function defined in this file)
    return new Response(JSON.stringify({
      data: mapToTopicResponse(topic)
    } satisfies ApiSuccessResponse<TopicDTO>), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60' // Cache results for 60 seconds
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    } satisfies ApiErrorResponse), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' 
      }
    });
  }
};


/**
 * Custom error type for topic update operations
 */
interface UpdateError {
  code: string;
  message: string;
  details?: unknown;
  status?: number;
}

/**
 * Handles errors from update operations and formats them into consistent API responses
 * @param error - The error object from update operations
 * @returns Formatted API error response
 */
const handleUpdateError = (error: UpdateError): { response: ApiErrorResponse; status: number } => {
  // Map error codes to appropriate HTTP status codes
  const statusCodeMap: Record<string, number> = {
    'VALIDATION_ERROR': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'DUPLICATE_NAME': 409,
    'CONFLICT': 409,
    'DATABASE_ERROR': 500,
    'INTERNAL_SERVER_ERROR': 500
  };

  // Use mapped status code or default to 500
  const status = error.status || statusCodeMap[error.code] || 500;

  // Create consistent error response
  const response: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    }
  };

  return { response, status };
};

/**
 * Sanitizes topic name by removing excessive whitespace and unwanted characters
 * @param name - Raw topic name to sanitize
 * @returns Sanitized topic name
 */
const sanitizeTopicName = (name: string): string => {
  // Remove excessive whitespace (multiple spaces, leading/trailing spaces)
  let sanitized = name.replace(/\s+/g, " ").trim();

  // Enforce Unicode character safety (letters, numbers, punctuation, spaces)
  sanitized = sanitized.replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, "");

  return sanitized;
};

/**
 * Maps database topic record to the DTO format for API responses
 * @param topic - Raw database topic record
 * @returns Formatted topic DTO
 */
const mapToTopicResponse = (topic: { 
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}): TopicDTO => {
  return {
    id: topic.id,
    name: topic.name,
    created_at: topic.created_at,
    updated_at: topic.updated_at
  };
};

/**
 * Validates and sanitizes a topic update request
 * @param data - The raw input data to validate
 * @returns Validated UpdateTopicRequestDTO or throws error
 */
const validateUpdateTopicRequest = (data: unknown): UpdateTopicRequestDTO => {
  // Define validation schema for update request
  const updateTopicSchema = z.object({
    name: z
      .string()
      .min(1, "Topic name cannot be empty")
      .max(255, "Topic name must be less than 256 characters")
      .trim()
      .refine(
        (value) => !/^\s*$/.test(value),
        "Topic name cannot contain only whitespace"
      )
      .refine(
        (value) => /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(value),
        "Topic name can only contain letters, numbers, punctuation, and spaces"
      )
  });

  try {
    const result = updateTopicSchema.parse(data);
    
    // Apply additional sanitization
    return {
      name: sanitizeTopicName(result.name)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        code: "VALIDATION_ERROR",
        message: "Invalid topic data",
        details: error.format()
      };
    }
    throw error;
  }
};

/**
 * Repository function to check if topic name already exists for user (excluding current topic)
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param name - Topic name to check
 * @param excludeTopicId - ID of the topic to exclude from check
 * @returns true if name is unique, false if it already exists
 */
const checkNameUniqueness = async (
  supabase: any,
  userId: string,
  name: string,
  excludeTopicId: string
): Promise<boolean> => {
  const { data, error, count } = await supabase
    .from("topics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .ilike("name", name.trim())
    .neq("id", excludeTopicId);
  
  if (error) {
    console.error("Error checking topic name uniqueness:", error);
    throw {
      code: "DATABASE_ERROR",
      message: "Failed to check topic name uniqueness",
      details: error.message
    };
  }
  
  return count === 0; // True if name is unique
};

/**
 * Implements optimistic concurrency control for topic updates
 * to prevent lost updates in concurrent scenarios
 * 
 * @param supabase - Supabase client
 * @param command - Command containing user ID, topic ID and new name
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Updated topic DTO
 */
const handleConcurrentUpdate = async (
  supabase: any,
  command: { userId: string; topicId: string; name: string },
  maxRetries: number = 3
): Promise<TopicDTO> => {
  let retries = 0;
  let lastError: any = null;

  while (retries <= maxRetries) {
    try {
      // 1. Get the current version of the topic with its updated_at timestamp
      const { data: currentTopic, error: fetchError } = await supabase
        .from("topics")
        .select("id, name, created_at, updated_at")
        .eq("id", command.topicId)
        .eq("user_id", command.userId)
        .single();

      if (fetchError || !currentTopic) {
        throw {
          code: "NOT_FOUND",
          message: "Topic not found or you don't have permission to update it"
        };
      }

      const lastUpdatedAt = currentTopic.updated_at;

      // 2. Prepare topic data for update with version condition
      const updateData = {
        name: sanitizeTopicName(command.name),
        updated_at: new Date().toISOString()
      };

      // 3. Perform conditional update based on the timestamp
      const { data: updatedTopic, error: updateError } = await supabase
        .from("topics")
        .update(updateData)
        .eq("id", command.topicId)
        .eq("user_id", command.userId)
        .eq("updated_at", lastUpdatedAt) // Optimistic concurrency control
        .select("id, name, created_at, updated_at")
        .single();

      if (updateError) {
        // Check if it's a conflict error (could be due to concurrent update)
        if (updateError.code === '23505') {  // Postgres unique constraint violation
          throw {
            code: "DUPLICATE_NAME",
            message: "A topic with this name already exists",
            details: "Topic names must be unique for each user"
          };
        }

        // For other database errors
        throw {
          code: "DATABASE_ERROR",
          message: "Failed to update topic",
          details: updateError.message
        };
      }

      // If no rows were updated but no error occurred, it means another process updated the record
      if (!updatedTopic) {
        if (retries < maxRetries) {
          // Wait with exponential backoff before retrying
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
          retries++;
          continue;
        } else {
          throw {
            code: "CONFLICT",
            message: "The topic was modified by another process",
            details: "Please refresh and try again"
          };
        }
      }

      // Success - return the updated topic
      return mapToTopicResponse(updatedTopic);
    } catch (error: any) {
      lastError = error;
      
      // If error is not due to concurrency, don't retry
      if (error.code !== "CONFLICT") {
        throw error;
      }
      
      // For concurrency errors, retry if retries remain
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Wait with exponential backoff before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
      retries++;
    }
  }

  // This should never happen due to the loop condition, but TypeScript needs it
  throw lastError || {
    code: "INTERNAL_SERVER_ERROR",
    message: "Failed to update topic after multiple attempts"
  };
};

/**
 * PUT /api/topics/:topicId - Update an existing topic
 * 
 * Updates a topic with the specified ID for the authenticated user.
 * Returns the updated topic data or an error if validation fails or the topic doesn't exist.
 */
export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    // 1. Validate path parameter
    const topicId = params.topicId;
    if (!topicId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topicId)) {
      const error = {
        code: "INVALID_PARAMETER",
        message: "Invalid topic ID format",
        details: "Topic ID must be a valid UUID"
      };
      const { response, status } = handleUpdateError(error);
      return new Response(JSON.stringify(response), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
    
    // 2. Authentication check
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      const error = {
        code: "UNAUTHORIZED",
        message: "You must be logged in to update a topic"
      };
      const { response, status } = handleUpdateError(error);
      return new Response(JSON.stringify(response), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
    
    const userId = session.user.id;
    
    // 3. Validate request body
    let requestData: UpdateTopicRequestDTO;
    try {
      const rawData = await request.json();
      requestData = validateUpdateTopicRequest(rawData);
    } catch (error: any) {
      const updateError = {
        code: error.code || "BAD_REQUEST",
        message: error.message || "Invalid request body",
        details: error.details
      };
      const { response, status } = handleUpdateError(updateError);
      return new Response(JSON.stringify(response), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
    
    // 4. Check if topic exists and belongs to the user
    const { data: existingTopic, error: topicError } = await supabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .eq("user_id", userId)
      .single();
    
    if (topicError || !existingTopic) {
      const error = {
        code: "NOT_FOUND",
        message: "Topic not found or you don't have permission to update it"
      };
      const { response, status } = handleUpdateError(error);
      return new Response(JSON.stringify(response), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
    
    // 5. Check name uniqueness (excluding current topic)
    try {
      const isNameUnique = await checkNameUniqueness(supabase, userId, requestData.name, topicId);
      
      if (!isNameUnique) {
        const error = {
          code: "DUPLICATE_NAME",
          message: "A topic with this name already exists",
          details: "Topic names must be unique for each user"
        };
        const { response, status } = handleUpdateError(error);
        return new Response(JSON.stringify(response), {
          status,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
        });
      }
    } catch (error: any) {
      const updateError = {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message || "An error occurred checking topic name uniqueness",
        details: error.details
      };
      const { response, status } = handleUpdateError(updateError);
      return new Response(JSON.stringify(response), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
    
    // 6. Update topic in database with concurrency handling
    let updatedTopic: TopicDTO;
    try {
      updatedTopic = await handleConcurrentUpdate(supabase, {
        userId,
        topicId,
        name: requestData.name
      });
    } catch (error: any) {
      const updateError = {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to update topic",
        details: error.details
      };
      const { response, status } = handleUpdateError(updateError);
      return new Response(JSON.stringify(response), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
    
    // 7. Return success response
    return new Response(
      JSON.stringify({
        data: updatedTopic
      } satisfies ApiSuccessResponse<TopicDTO>),
      {
        status: 200, // OK
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("Unexpected error while updating topic:", error);
    
    const updateError = {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error)
    };
    const { response, status } = handleUpdateError(updateError);
    return new Response(JSON.stringify(response), {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
};

/**
 * DELETE /api/topics/[topicId] - Delete a topic and all its associated flashcards
 * 
 * @param {Object} context - Astro API route context
 * @returns {Response} 204 No Content on success or error details
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Start performance tracking
  const startTime = performance.now();
  let dbOperationTime = 0;

  try {
    // 1. Validate the topicId parameter - handle this first to fail fast
    const topicIdSchema = z.string().uuid('Topic ID must be a valid UUID');
    const validationResult = topicIdSchema.safeParse(params.topicId);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_TOPIC_ID',
          message: 'Invalid topic ID format',
          details: validationResult.error.format()
        }
      } satisfies ApiErrorResponse), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    const topicId = validationResult.data;
    
    // 2. Check authentication - using supabase from context.locals per guidelines
    const supabase = locals.supabase;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to delete this topic'
        }
      } satisfies ApiErrorResponse), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    const userId = session.user.id;
    
    // 3. Verify that the topic exists and belongs to the user before deletion
    const dbStartTime = performance.now();
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, name')
      .eq('id', topicId)
      .eq('user_id', userId)
      .single();
    
    // 4. Handle database errors and topic not found
    if (topicError) {
      // Check if it's a not found error
      if (topicError.code === 'PGRST116') {
        return new Response(JSON.stringify({
          error: {
            code: 'TOPIC_NOT_FOUND',
            message: 'Topic not found or you do not have access to it'
          }
        } satisfies ApiErrorResponse), {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store' 
          }
        });
      }
      
      // Handle other database errors
      console.error('Database query error:', topicError);
      return new Response(JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to verify topic ownership',
          details: topicError.message
        }
      } satisfies ApiErrorResponse), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    // 5. Topic not found case (should be caught by error above but adding as a safeguard)
    if (!topic) {
      return new Response(JSON.stringify({
        error: {
          code: 'TOPIC_NOT_FOUND',
          message: 'Topic not found or you do not have access to it'
        }
      } satisfies ApiErrorResponse), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    // 6. Perform cascading deletion: first delete all flashcards in the topic
    console.log('DEBUG: Starting cascading deletion for topic', { topicId, userId });
    
    const { error: flashcardsDeleteError } = await supabase
      .from('flashcards')
      .delete()
      .eq('topic_id', topicId)
      .eq('user_id', userId);
    
    if (flashcardsDeleteError) {
      console.error('Error deleting flashcards:', flashcardsDeleteError);
      return new Response(JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete associated flashcards',
          details: flashcardsDeleteError.message
        }
      } satisfies ApiErrorResponse), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    // 7. Delete the topic itself
    const { error: topicDeleteError } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId)
      .eq('user_id', userId);
    
    dbOperationTime = performance.now() - dbStartTime;
    
    if (topicDeleteError) {
      console.error('Error deleting topic:', topicDeleteError);
      return new Response(JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete topic',
          details: topicDeleteError.message
        }
      } satisfies ApiErrorResponse), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store' 
        }
      });
    }
    
    // Calculate total response time
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    // Log performance metrics for monitoring
    console.info(
      `DELETE /api/topics/${topicId} - ${totalDuration.toFixed(2)}ms - DB: ${dbOperationTime.toFixed(2)}ms`
    );
    
    // 8. Return 204 No Content for successful deletion
    return new Response(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-store',
        'Server-Timing': `db;dur=${dbOperationTime.toFixed(2)},total;dur=${totalDuration.toFixed(2)}`
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in delete topic endpoint:', error);
    
    // Calculate total response time even for errors
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    return new Response(JSON.stringify({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    } satisfies ApiErrorResponse), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Server-Timing': `total;dur=${totalDuration.toFixed(2)}`
      }
    });
  }
};