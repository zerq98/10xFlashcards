# API Endpoint Implementation Plan: POST /api/topics/:topicId/generate/:generationId/save

## 1. Endpoint Overview
This endpoint handles saving AI-generated flashcards after user review. It validates the edited flashcards, updates generation logs, and creates permanent flashcard records in the database.

## 2. Request Details
- Method: POST
- URL Pattern: `/api/topics/:topicId/generate/:generationId/save`
- Path Parameters:
  - topicId: UUID (required) - The topic ID to save flashcards to
  - generationId: UUID (required) - The ID of the AI generation session
- Request Body:
  ```typescript
  {
    flashcards: Array<{
      front: string,
      back: string,
      was_edited_before_save: boolean
    }>
  }
  ```

## 3. Types Used
### DTOs
```typescript
// Request
interface SaveGeneratedFlashcardsRequestDTO {
  flashcards: Array<{
    front: string
    back: string
    was_edited_before_save: boolean
  }>
}

// Response
type SaveGeneratedFlashcardsResponseDTO = ApiSuccessResponse<{
  saved_count: number
  flashcard_ids: string[]
}>
```

### Command Models
```typescript
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
```

## 4. Response Details
### Success Response (201 Created)
```json
{
  "data": {
    "saved_count": 5,
    "flashcard_ids": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
  }
}
```

### Error Responses
- 400 Bad Request - Invalid input parameters
- 401 Unauthorized - User not authenticated
- 403 Forbidden - User not authorized to access topic
- 404 Not Found - Topic or generation not found
- 409 Conflict - Generation already saved
- 500 Internal Server Error - Database or other server issues

## 5. Data Flow
1. Request validation
   - Validate path parameters (topicId, generationId)
   - Validate request body (flashcards array)
2. Authorization check
   - Verify user is authenticated
   - Verify user has access to topic
   - Verify user owns the generation
3. State validation
   - Check if generation exists
   - Check if generation was successful
   - Check if flashcards were already saved
4. Database operations
   - Begin transaction
   - Create flashcard records
   - Update generation log
   - Commit transaction
5. Response formatting
   - Map created flashcards to response DTO

## 6. Security Considerations
1. Authentication & Authorization
   - Require valid JWT token
   - Verify topic ownership
   - Verify generation ownership
2. Input Validation
   - Validate UUIDs format
   - Validate flashcard content
   - Check array size limits
3. State Protection
   - Prevent double-saving
   - Ensure atomic operations
4. Data Sanitization
   - Sanitize flashcard content
   - Trim whitespace
   - Remove invalid characters

## 7. Error Handling
1. Input Validation Errors
   - Invalid UUID formats
   - Invalid flashcard content
   - Array size violations
2. Authorization Errors
   - Missing/invalid token
   - Topic access denied
   - Generation access denied
3. State Errors
   - Generation not found
   - Generation failed
   - Already saved
4. Database Errors
   - Transaction failures
   - Constraint violations
   - Connection issues

## 8. Performance Considerations
1. Database Operations
   - Use bulk insert for flashcards
   - Optimize transaction scope
   - Use appropriate indexes
2. Validation
   - Parallel content validation
   - Early failure for invalid states
3. Response Handling
   - Stream large responses
   - Limit payload size
4. Error Recovery
   - Implement idempotency
   - Handle partial failures

## 9. Implementation Steps
1. Create Route Handler
   ```typescript
   export const POST = async ({ request, params, locals }) => {
     // Implementation
   }
   ```

2. Implement Validation Layer
   ```typescript
   const validateSaveRequest = (data: unknown): SaveGeneratedFlashcardsRequestDTO => {
     // Zod schema validation
   }
   ```

3. Create Database Operations
   ```typescript
   class FlashcardRepository {
     async saveGeneratedFlashcards(command: SaveGeneratedFlashcardsCommand): Promise<string[]> {
       // Database operations
     }
   }
   ```

4. Implement State Checks
   ```typescript
   const validateGenerationState = async (
     generationId: string,
     userId: string
   ): Promise<boolean> => {
     // State validation logic
   }
   ```

5. Add Error Handlers
   ```typescript
   const handleSaveError = (error: SaveError): ApiErrorResponse => {
     // Error handling logic
   }
   ```

6. Implement Content Sanitization
   ```typescript
   const sanitizeFlashcardContent = (content: string): string => {
     // Sanitization logic
   }
   ```

7. Create Response Mapping
   ```typescript
   const mapToSaveResponse = (
     savedIds: string[]
   ): SaveGeneratedFlashcardsResponseDTO => {
     // Response mapping logic
   }
   ```

8. Add Database Transaction Handling
   ```typescript
   const executeSaveTransaction = async (
     command: SaveGeneratedFlashcardsCommand
   ): Promise<string[]> => {
     // Transaction logic
   }
   ```

9. Implement Testing
   - Unit tests for validation
   - Integration tests for database operations
   - E2E tests for complete flow
   - State transition tests

10. Add Monitoring
    - Track save success rate
    - Monitor transaction times
    - Alert on high failure rates
    - Log state transitions