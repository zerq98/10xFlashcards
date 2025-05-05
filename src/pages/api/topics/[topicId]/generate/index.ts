import type { APIRoute } from "astro"
import { z } from "zod"
import { createHash } from "crypto"
import { v4 as uuidv4 } from "uuid"

import {
  type GenerateFlashcardsRequestDTO,
  type GenerateFlashcardsResponseDTO,
  type ApiSuccessResponse,
  type ApiErrorResponse
} from "../../../../../types"

// Validation schema for request body
const generateFlashcardsSchema = z.object({
  text: z.string().min(1, "Text is required").max(10000, "Text is too long, maximum is 10000 characters"),
  count: z.number().int().min(1).max(20, "Maximum flashcard count is 20")
})

// Interface for AI service response
interface GeneratedFlashcard {
  front: string
  back: string
}

// Command model 
interface GenerateFlashcardsCommand {
  userId: string
  topicId: string
  text: string
  count: number
}

/**
 * OpenRouter AI service for generating flashcards
 */
class OpenRouterService {
  private readonly apiKey: string
  private readonly baseUrl: string
  
  constructor() {
    this.apiKey = import.meta.env.OPEN_ROUTER_API_KEY
    this.baseUrl = import.meta.env.OPEN_ROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions"
    
    if (!this.apiKey) {
      throw new Error("OPEN_ROUTER_API_KEY environment variable is not set")
    }
  }
  
  /**
   * Generate flashcards from provided text
   * @param text The text to generate flashcards from
   * @param count Number of flashcards to generate
   * @returns Array of generated flashcards with front and back text
   */
  async generateFlashcards(text: string, count: number): Promise<GeneratedFlashcard[]> {
    try {
      // Construct the prompt for the AI
      const systemPrompt = `You are a flashcard creation assistant. Create ${count} educational flashcards from the provided text. 
      Format your response as a valid JSON array with each object having "front" and "back" properties.
      The front should contain a question or concept, and the back should contain the answer or explanation. 
      Keep both sides concise but comprehensive. Don't include any explanation outside the JSON.`
      
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": import.meta.env.SITE_URL || "https://10xflashcards.com"
        },
        body: JSON.stringify({
          model: "openai/gpt-4-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`)
      }
      
      const data = await response.json()
      
      // Extract and parse the JSON from the AI response
      const content = data.choices[0]?.message?.content
      if (!content) {
        throw new Error("Empty response from AI service")
      }
      
      // Extract JSON from the response (handling potential text around the JSON)
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No valid JSON found in the AI response")
      }
      
      const flashcards = JSON.parse(jsonMatch[0]) as GeneratedFlashcard[]
      
      // Validate the structure of each flashcard
      if (!Array.isArray(flashcards) || flashcards.length === 0) {
        throw new Error("Invalid flashcards format in AI response")
      }
      
      return flashcards.slice(0, count).map(card => ({
        front: card.front,
        back: card.back
      }))
    } catch (error) {
      console.error("OpenRouter service error:", error)
      throw error
    }
  }
}

/**
 * Hash the input text for privacy and caching purposes
 */
function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex")
}

/**
 * Cache manager for storing and retrieving generated flashcards
 */
class CacheManager {
  // In a production environment, this would be replaced with Redis or another cache solution
  private static memoryCache: Record<string, {
    timestamp: number,
    flashcards: GeneratedFlashcard[]
  }> = {}
  
  // Cache expiration time in milliseconds (default 24 hours)
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000
  
  /**
   * Get cached flashcards if available
   * @param cacheKey The cache key (text hash)
   * @returns Cached flashcards or null if not found or expired
   */
  static getFromCache(cacheKey: string): GeneratedFlashcard[] | null {
    const cached = this.memoryCache[cacheKey]
    
    if (!cached) {
      return null
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      delete this.memoryCache[cacheKey]
      return null
    }
    
    return cached.flashcards
  }
  
  /**
   * Store flashcards in cache
   * @param cacheKey The cache key (text hash)
   * @param flashcards The flashcards to cache
   */
  static storeInCache(cacheKey: string, flashcards: GeneratedFlashcard[]): void {
    this.memoryCache[cacheKey] = {
      timestamp: Date.now(),
      flashcards
    }
  }
}

/**
 * Rate limiter for controlling API usage
 */
class RateLimiter {
  // In a production environment, this would be replaced with Redis
  private static userRequests: Record<string, {
    count: number,
    resetTime: number
  }> = {}
  
  // Rate limit configuration
  private static readonly RATE_LIMIT = 10 // Maximum requests per time window
  private static readonly RATE_WINDOW = 60 * 60 * 1000 // Time window in milliseconds (1 hour)

  static getRateLimit() {
    return this.RATE_LIMIT
    }
  
  /**
   * Check if user has exceeded their rate limit
   * @param userId User ID to check
   * @returns Whether the user is rate limited
   */
  static isRateLimited(userId: string): boolean {
    this.cleanupExpiredEntries()
    
    const userEntry = this.userRequests[userId]
    
    if (!userEntry) {
      // First request from this user
      this.userRequests[userId] = {
        count: 1,
        resetTime: Date.now() + this.RATE_WINDOW
      }
      return false
    }
    
    // Check if user has exceeded the rate limit
    if (userEntry.count >= this.RATE_LIMIT) {
      return true
    }
    
    // Increment the request count
    userEntry.count++
    return false
  }
  
  /**
   * Get remaining requests allowed for user
   * @param userId User ID to check
   * @returns Number of remaining requests and reset time
   */
  static getRemainingRequests(userId: string): { remaining: number; resetTime: number } {
    const userEntry = this.userRequests[userId]
    
    if (!userEntry) {
      return {
        remaining: this.RATE_LIMIT,
        resetTime: Date.now() + this.RATE_WINDOW
      }
    }
    
    return {
      remaining: Math.max(0, this.RATE_LIMIT - userEntry.count),
      resetTime: userEntry.resetTime
    }
  }
  
  /**
   * Clean up expired rate limit entries
   */
  private static cleanupExpiredEntries(): void {
    const now = Date.now()
    
    for (const userId in this.userRequests) {
      if (this.userRequests[userId].resetTime < now) {
        delete this.userRequests[userId]
      }
    }
  }
}

export const POST: APIRoute = async ({ request, params, locals }) => {
  try {
    // 1. Request validation
    const topicId = params.topicId
    if (!topicId) {
      return new Response(
        JSON.stringify({
          error: {
            code: "invalid_request",
            message: "Topic ID is required"
          }
        } as ApiErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Validate request body
    let requestBody: GenerateFlashcardsRequestDTO
    try {
      requestBody = generateFlashcardsSchema.parse(await request.json()) as GenerateFlashcardsRequestDTO
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: {
              code: "invalid_request",
              message: "Invalid request data",
              details: error.errors
            }
          } as ApiErrorResponse),
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
      throw error
    }

    // 2. Authorization check
    const { supabase } = locals
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "unauthorized",
            message: "Authentication required"
          }
        } as ApiErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Check if topic exists and belongs to the user
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("id")
      .eq("id", topicId)
      .eq("user_id", user.id)
      .single()
    
    if (topicError || !topic) {
      return new Response(
        JSON.stringify({
          error: {
            code: "not_found",
            message: "Topic not found or access denied"
          }
        } as ApiErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // 3. Check rate limiting
    if (RateLimiter.isRateLimited(user.id)) {
      const { remaining, resetTime } = RateLimiter.getRemainingRequests(user.id)
      
      return new Response(
        JSON.stringify({
          error: {
            code: "rate_limit_exceeded",
            message: "Rate limit exceeded for AI generation",
            details: {
              remaining,
              resetTime,
              resetTimeFormatted: new Date(resetTime).toISOString()
            }
          }
        } as ApiErrorResponse),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "X-RateLimit-Limit": RateLimiter.getRateLimit().toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": Math.floor(resetTime / 1000).toString()
          } 
        }
      )
    }

    // 4. Input processing & caching
    const textHash = hashText(requestBody.text)
    
    // Check cache for previously generated flashcards
    const cachedFlashcards = CacheManager.getFromCache(`${user.id}:${textHash}:${requestBody.count}`)
    let generatedFlashcards: GeneratedFlashcard[]
    
    if (cachedFlashcards) {
      // Use cached flashcards if available
      generatedFlashcards = cachedFlashcards
    } else {
      // Generate new flashcards
      const aiService = new OpenRouterService()
      generatedFlashcards = await aiService.generateFlashcards(requestBody.text, requestBody.count)
      
      // Store in cache for future reuse
      CacheManager.storeInCache(`${user.id}:${textHash}:${requestBody.count}`, generatedFlashcards)
    }

    // 5. Database operations
    // Create log entry for the generation
    const generationId = uuidv4()
    const { error: logError } = await supabase
      .from("ai_generation_logs")
      .insert({
        id: generationId,
        user_id: user.id,
        topic_id: topicId,
        input_text_hash: textHash,
        requested_count: requestBody.count,
        generated_count: generatedFlashcards.length,
        saved_count: 0, // Initially 0 until user saves flashcards
        status: "success"
      })

    if (logError) {
      console.error("Error logging AI generation:", logError)
      return new Response(
        JSON.stringify({
          error: {
            code: "internal_server_error",
            message: "Failed to log flashcard generation"
          }
        } as ApiErrorResponse),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // 6. Prepare response
    const responseData: GenerateFlashcardsResponseDTO = {
      status: "success",
      error_info: null,
      requested_count: requestBody.count,
      generated_count: generatedFlashcards.length,
      generation_id: generationId,
      flashcards: generatedFlashcards.map(card => ({
        id: uuidv4(), // Generate temporary IDs for the frontend
        front: card.front,
        back: card.back,
        is_ai_generated: true
      }))
    }

    return new Response(
      JSON.stringify({ data: responseData } as ApiSuccessResponse<GenerateFlashcardsResponseDTO>),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=0, no-cache"
        } 
      }
    )

  } catch (error) {
    console.error("Error generating flashcards:", error)
    return new Response(
      JSON.stringify({
        error: {
          code: "internal_server_error",
          message: "An unexpected error occurred while generating flashcards"
        }
      } as ApiErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}