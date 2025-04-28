# API Endpoint Implementation Plan: POST /api/topics/:topicId/generate

## 1. Endpoint Overview
This endpoint handles the AI-powered generation of flashcards from provided text. It validates user input, processes text through the AI service (Openrouter.ai), and returns generated flashcards for user review before saving.

## 2. Request Details
- Method: POST
- URL Pattern: `/api/topics/:topicId/generate`
- Path Parameters:
  - topicId: UUID (required) - The topic ID to generate flashcards for
- Request Body:
  ```typescript
  {
    text: string,    // Required, text to generate flashcards from
    count: number    // Required, number of flashcards to generate (1-20)
  }
  ```

## 3. Types Used
### DTOs
```typescript
// Request
interface GenerateFlashcardsRequestDTO {
  text: string
  count: number
}

// Response
interface GenerateFlashcardsResponseDTO {
  status: "success" | "error"
  error_info: string | null
  requested_count: number
  generated_count: number
  generation_id: string
  flashcards: Array<{
    id: string
    front: string
    back: string
    is_ai_generated: true
  }>
}
```

### Command Models
```typescript
interface GenerateFlashcardsCommand {
  userId: string
  topicId: string
  text: string
  count: number
}

interface GeneratedFlashcard {
  front: string
  back: string
}
```

## 4. Response Details
### Success Response (200 OK)
```json
{
  "data": {
    "status": "success",
    "error_info": null,
    "requested_count": 5,
    "generated_count": 5,
    "generation_id": "uuid",
    "flashcards": [
      {
        "id": "uuid",
        "front": "Question text",
        "back": "Answer text",
        "is_ai_generated": true
      }
    ]
  }
}
```

### Error Responses
- 400 Bad Request - Invalid input parameters
- 401 Unauthorized - User not authenticated
- 403 Forbidden - User not authorized to access topic
- 404 Not Found - Topic not found
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error - AI service error or other server issues

## 5. Data Flow
1. Request validation
   - Validate path parameter (topicId)
   - Validate request body (text and count)
2. Authorization check
   - Verify user is authenticated
   - Verify user has access to topic
3. Input processing
   - Sanitize input text
   - Calculate input text hash
4. AI Service interaction
   - Call Openrouter.ai API with processed text
   - Process AI response
5. Database operations
   - Create ai_generation_log entry
   - Prepare generated flashcards
6. Response formatting
   - Map generated content to DTO
   - Return response

## 6. Security Considerations
1. Authentication
   - Require valid JWT token
   - Validate token expiration
2. Authorization
   - Verify user owns the topic
   - Check RLS policies
3. Input Validation
   - Sanitize text input
   - Validate count within limits
4. Rate Limiting
   - Implement per-user rate limiting
   - Track API usage in ai_generation_logs
5. Data Protection
   - Hash input text for logging
   - Sanitize AI-generated content

## 7. Error Handling
1. Input Validation Errors
   - Invalid UUID format for topicId
   - Empty or too long text
   - Count outside allowed range (1-20)
2. Authorization Errors
   - Missing or invalid token
   - User not authorized for topic
3. Resource Errors
   - Topic not found
   - Topic was deleted
4. Service Errors
   - AI service timeout
   - AI service error response
   - Database errors
5. Rate Limit Errors
   - User quota exceeded
   - Service quota exceeded

## 8. Performance Considerations
1. Caching
   - Cache topic existence/ownership check
   - Cache recent AI generation results by text hash
2. Database Optimization
   - Use appropriate indexes on ai_generation_logs
   - Implement efficient text hashing
3. AI Service
   - Implement timeout handling
   - Consider parallel processing for multiple cards
4. Rate Limiting
   - Use Redis for rate limit tracking
   - Implement sliding window rate limiting

## 9. Implementation Steps
1. Create Route Handler
   ```typescript
   export const POST = async ({ request, params, locals }) => {
     // Implementation
   }
   ```

2. Implement Validation Layer
   ```typescript
   const validateGenerateRequest = (data: unknown): GenerateFlashcardsRequestDTO => {
     // Zod schema validation
   }
   ```

3. Create AI Service Integration
   ```typescript
   class OpenRouterService {
     generateFlashcards(text: string, count: number): Promise<GeneratedFlashcard[]>
   }
   ```

4. Implement Database Operations
   ```typescript
   class AIGenerationRepository {
     logGeneration(params: LogGenerationParams): Promise<string>
   }
   ```

5. Add Rate Limiting
   ```typescript
   const checkRateLimit = async (userId: string): Promise<boolean> => {
     // Redis-based rate limiting
   }
   ```

6. Create Error Handlers
   ```typescript
   const handleAIServiceError = (error: AIServiceError): ApiErrorResponse => {
     // Error handling logic
   }
   ```

7. Add Response Mapping
   ```typescript
   const mapToGenerateResponse = (result: GenerationResult): GenerateFlashcardsResponseDTO => {
     // Response mapping logic
   }
   ```

8. Implement Testing
   - Unit tests for validation
   - Integration tests for AI service
   - E2E tests for complete flow

9. Add Documentation
   - API documentation
   - Error codes and messages
   - Rate limit details

10. Deploy & Monitor
    - Set up monitoring
    - Configure alerts
    - Track usage metrics