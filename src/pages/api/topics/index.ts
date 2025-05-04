import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { ApiErrorResponse, ApiSuccessResponse, TopicDTO,CreateTopicRequestDTO } from '../../../types';

// Define response structure with pagination
interface TopicsListResponseDTO {
  topics: TopicDTO[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

// Define query parameters interface
interface TopicsListQuery {
  userId: string;
  page: number;
  perPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  filter?: string;
}

// Validation schema for query parameters with detailed error messages
const queryParamsSchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be positive")
    .default(1)
    .transform(val => Math.floor(val)), // Ensure integer value
  
  per_page: z.coerce
    .number()
    .int("Items per page must be an integer")
    .positive("Items per page must be positive")
    .max(100, "Maximum 100 items per page allowed")
    .default(20)
    .transform(val => Math.floor(val)), // Ensure integer value
  
  sort_by: z.enum(['name', 'created_at', 'updated_at'], {
    errorMap: () => ({ message: "Sort field must be one of: name, created_at, updated_at" })
  }).default('created_at'),
  
  sort_order: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: "Sort order must be either 'asc' or 'desc'" })
  }).default('desc'),
  
  filter: z.string().trim().optional(),
});

/**
 * GET /api/topics - Retrieves a paginated list of user's topics
 * 
 * @param {Object} context - Astro API route context
 * @returns {Response} JSON response with topics list or error details
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Validate and normalize query parameters - handle this first to fail fast
    const url = new URL(request.url);
    const validationResult = queryParamsSchema.safeParse(Object.fromEntries(url.searchParams));
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: {
          code: 'INVALID_PARAMS',
          message: 'Invalid query parameters',
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
    
    const params = validationResult.data;
    
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
    
    // 3. Build database query with optimization considerations
    const query: TopicsListQuery = {
      userId,
      page: params.page,
      perPage: params.per_page,
      sortBy: params.sort_by,
      sortOrder: params.sort_order,
      filter: params.filter,
    };

    // Start query building with count enabled for pagination
    let topicsQuery = supabase
      .from('topics')
      .select('id, name, created_at, updated_at', { 
        count: 'exact',
        // Only select the columns we need (optimization)
        head: false 
      })
      .eq('user_id', userId)
      .order(query.sortBy, { ascending: query.sortOrder === 'asc' })
      .range((query.page - 1) * query.perPage, query.page * query.perPage - 1);
      
    // Apply name filter if provided (case insensitive)
    if (query.filter && query.filter.trim().length > 0) {
      topicsQuery = topicsQuery.ilike('name', `%${query.filter.trim()}%`);
    }
    
    // Execute the query
    const { data: topics, count, error } = await topicsQuery;
    
    if (error) {
      console.error('Database query error:', error);
      return new Response(JSON.stringify({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch topics',
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
    
    // 4. Format the response
    const totalPages = count ? Math.ceil(count / query.perPage) : 0;
    const paginationData = {
      current_page: query.page,
      total_pages: totalPages,
      total_items: count || 0,
      per_page: query.perPage
    };
    
    // Handle the case when no topics are found
    if (!topics || topics.length === 0) {
      return new Response(JSON.stringify({
        data: {
          topics: [],
          pagination: paginationData
        }
      } satisfies ApiSuccessResponse<TopicsListResponseDTO>), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=60' // Cache empty results for 60 seconds
        }
      });
    }
    
    // Convert database topics to DTOs
    const topicDTOs: TopicDTO[] = topics.map(topic => ({
      id: topic.id,
      name: topic.name,
      created_at: topic.created_at,
      updated_at: topic.updated_at
    }));
    
    // Return response with proper headers
    return new Response(JSON.stringify({
      data: {
        topics: topicDTOs,
        pagination: paginationData
      }
    } satisfies ApiSuccessResponse<TopicsListResponseDTO>), {
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
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : String(error)
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

// Definition of schema for input validation
const createTopicSchema = z.object({
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

/**
 * Validates and sanitizes a topic name input
 * @param data - The raw input data to validate
 * @returns Validated CreateTopicRequestDTO or throws error
 */
const validateCreateTopicRequest = (data: unknown): CreateTopicRequestDTO => {
  try {
    const result = createTopicSchema.parse(data);
    
    // Additional sanitization (remove excessive whitespace)
    return {
      name: result.name.replace(/\s+/g, " ").trim()
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
 * Step 3: Repository functionality - Check if topic name already exists for user
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param name - Topic name to check
 * @returns true if name is unique, false if it already exists
 */
const checkNameUniqueness = async (
  supabase: any,
  userId: string,
  name: string
): Promise<boolean> => {
  const { data, error, count } = await supabase
    .from("topics")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .ilike("name", name.trim());
  
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
 * Step 4: Repository functionality - Create a new topic in the database
 * @param supabase - Supabase client
 * @param command - Command containing user ID and topic name
 * @returns Created topic DTO
 */
const createTopic = async (
  supabase: any,
  command: { userId: string; name: string }
): Promise<TopicDTO> => {
  // Prepare topic data for insertion
  const topicData = {
    user_id: command.userId,
    name: command.name,
  };

  // Insert topic into database
  const { data, error } = await supabase
    .from("topics")
    .insert(topicData)
    .select("id, name, created_at, updated_at")
    .single();

  if (error) {
    console.error("Error creating topic:", error);
    throw {
      code: "DATABASE_ERROR",
      message: "Failed to create topic",
      details: error.message
    };
  }

  if (!data) {
    throw {
      code: "DATABASE_ERROR",
      message: "Failed to create topic: no data returned",
    };
  }

  // Map database response to DTO
  return {
    id: data.id,
    name: data.name,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

/**
 * POST /api/topics - Create a new topic
 * 
 * Creates a new topic with the specified name for the authenticated user.
 * Returns the created topic data or an error if validation fails or the name already exists.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get Supabase client from locals per guidelines
    const supabase = locals.supabase;
    
    // 1. Check authentication - using supabase from context.locals
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to create a topic"
          }
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }
    
    const userId = session.user.id;
    
    // 2. Validate request body
    let requestData: CreateTopicRequestDTO;
    try {
      const rawData = await request.json();
      requestData = validateCreateTopicRequest(rawData);
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
    
    // 3. Check name uniqueness
    try {
      const isNameUnique = await checkNameUniqueness(supabase, userId, requestData.name);
      
      if (!isNameUnique) {
        return new Response(
          JSON.stringify({
            error: {
              code: "DUPLICATE_NAME",
              message: "A topic with this name already exists",
              details: "Topic names must be unique for each user"
            }
          } satisfies ApiErrorResponse),
          {
            status: 409, // Conflict
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store"
            }
          }
        );
      }
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          error: {
            code: error.code || "INTERNAL_SERVER_ERROR",
            message: error.message || "An error occurred checking topic name uniqueness",
            details: error.details
          }
        } satisfies ApiErrorResponse),
        {
          status: error.code === "DATABASE_ERROR" ? 500 : 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }
    
    // 4. Create topic in database
    let createdTopic: TopicDTO;
    try {
      createdTopic = await createTopic(supabase, {
        userId,
        name: requestData.name
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({
          error: {
            code: error.code || "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to create topic",
            details: error.details
          }
        } satisfies ApiErrorResponse),
        {
          status: error.code === "DATABASE_ERROR" ? 500 : 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }
    
    // 5. Return success response
    return new Response(
      JSON.stringify({
        data: createdTopic
      } satisfies ApiSuccessResponse<TopicDTO>),
      {
        status: 201, // Created
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
    
  } catch (error) {
    console.error("Error creating topic:", error);
    
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