import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { 
  ApiErrorResponse, 
  ApiSuccessResponse, 
  SaveGeneratedFlashcardsRequestDTO 
} from '../../../../../../../types';
import { Constants } from '../../../../../../../db/database.types';

// Validation schemas using Zod
const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID' });

const flashcardItemSchema = z.object({
  front: z.string().trim().min(1, { message: 'Front content cannot be empty' }),
  back: z.string().trim().min(1, { message: 'Back content cannot be empty' }),
  was_edited_before_save: z.boolean()
});

const saveGeneratedFlashcardsSchema = z.object({
  flashcards: z.array(flashcardItemSchema).min(1, { message: 'At least one flashcard must be provided' })
});

// Command model for saving flashcards
interface SaveGeneratedFlashcardsCommand {
  userId: string
  topicId: string
  generationId: string
  flashcards: Array<{
    front: string
    back: string
    was_edited_before_save: boolean
  }>
}

/**
 * Sanitizes flashcard content to ensure it's safe for storage
 * - Trims whitespace
 * - Removes potentially harmful HTML/script tags
 * - Normalizes line breaks
 */
function sanitizeContent(content: string): string {
  if (!content) return '';
  
  // Trim whitespace
  let sanitized = content.trim();
  
  // Remove potentially harmful tags (basic sanitization)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Normalize line breaks
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  return sanitized;
}

export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    // Step 1: Validate path parameters
    const topicId = params.topicId;
    const generationId = params.generationId;
    
    if (!topicId || !generationId) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'MISSING_PARAMS',
            message: 'Topic ID and Generation ID are required',
          },
        } as ApiErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    try {
      uuidSchema.parse(topicId);
      uuidSchema.parse(generationId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_PARAMS',
              message: 'Invalid Topic ID or Generation ID format',
              details: error.format(),
            },
          } as ApiErrorResponse),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 2: Parse and validate request body
    let requestBody: SaveGeneratedFlashcardsRequestDTO;
    
    try {
      const rawBody = await request.json();
      const result = saveGeneratedFlashcardsSchema.safeParse(rawBody);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'INVALID_REQUEST_BODY',
              message: 'Invalid request body',
              details: result.error.format(),
            },
          } as ApiErrorResponse),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      requestBody = result.data;
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse request body',
          },
        } as ApiErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Step 3: Authentication check
    const supabase = locals.supabase;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User is not authenticated',
          },
        } as ApiErrorResponse),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.user.id;
    
    // Step 4: Authorization check - verify topic ownership
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('id', topicId)
      .eq('user_id', userId)
      .single();
    
    if (topicError || !topic) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'User does not have access to this topic',
          },
        } as ApiErrorResponse),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Step 5: Verify generation ownership and state
    const { data: generationLog, error: generationError } = await supabase
      .from('ai_generation_logs')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .single();
    
    if (generationError || !generationLog) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Generation not found or access denied',
          },
        } as ApiErrorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if generation was successful
    if (generationLog.status !== Constants.public.Enums.ai_generation_status[0]) { // 'success'
      return new Response(
        JSON.stringify({
          error: {
            code: 'GENERATION_FAILED',
            message: 'Cannot save flashcards from a failed generation',
            details: generationLog.error_info,
          },
        } as ApiErrorResponse),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if flashcards were already saved
    if (generationLog.saved_count > 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'ALREADY_SAVED',
            message: 'Flashcards from this generation have already been saved',
          },
        } as ApiErrorResponse),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 6: Begin database operations - Save flashcards
    const command: SaveGeneratedFlashcardsCommand = {
      userId,
      topicId,
      generationId,
      flashcards: requestBody.flashcards
    };

    // If the database doesn't have a stored procedure for this transaction,
    // we'll implement it directly
    try {
      // Start a supabase transaction
      const flashcardInsertData = command.flashcards.map(card => ({
        front: sanitizeContent(card.front),
        back: sanitizeContent(card.back),
        user_id: userId,
        topic_id: topicId,
        ai_generation_log_id: generationId,
        is_ai_generated: true,
        was_edited_before_save: card.was_edited_before_save
      }));

      // Insert flashcards
      const { data: savedFlashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .insert(flashcardInsertData)
        .select('id');

      if (flashcardsError) {
        throw flashcardsError;
      }

      // Update the generation log with saved count
      const { error: updateError } = await supabase
        .from('ai_generation_logs')
        .update({ saved_count: command.flashcards.length })
        .eq('id', generationId);

      if (updateError) {
        throw updateError;
      }

      // Return success response with created flashcard IDs
      return new Response(
        JSON.stringify({
          data: {
            saved_count: savedFlashcards.length,
            flashcard_ids: savedFlashcards.map((card: any) => card.id)
          }
        } as ApiSuccessResponse<{
          saved_count: number
          flashcard_ids: string[]
        }>),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (dbError) {
      console.error('Database error while saving flashcards:', dbError);
      
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to save flashcards',
            details: (dbError as Error).message,
          },
        } as ApiErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Unexpected error in save generated flashcards endpoint:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      } as ApiErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};