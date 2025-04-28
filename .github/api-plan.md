# REST API Plan

## 1. Resources

### Authentication
- Maps to Supabase auth.users
- Handles user registration, login, and session management

### Profiles
- Maps to `profiles` table
- Represents user profile data and preferences

### Topics
- Maps to `topics` table
- Represents flashcard categories/sets created by users

### Flashcards
- Maps to `flashcards` table
- Represents individual flashcards within topics

### AI Generation
- Maps to `ai_generation_logs` table
- Handles AI-powered flashcard generation requests and tracking

## 2. Endpoints

### Authentication

#### POST /api/auth/register
- Description: Register a new user
- Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```
- Success: 201 Created
- Errors: 400, 409, 500

#### POST /api/auth/login
- Description: Login existing user
- Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```
- Success: 200 OK
- Errors: 400, 401, 500

#### POST /api/auth/logout
- Description: Logout current user
- Success: 200 OK
- Errors: 401, 500

#### POST /api/auth/reset-password
- Description: Request password reset
- Request Body:
```json
{
  "email": "string"
}
```
- Success: 200 OK
- Errors: 400, 404, 500

### Topics

#### GET /api/topics
- Description: List user's topics
- Query Parameters:
  - filter (optional): "name"
- Success: 200 OK
- Response Body:
```json
{
  "data": [{
    "id": "uuid",
    "name": "string",
    "created_at": "string",
    "updated_at": "string"
  }],
}
```
- Errors: 401, 500

#### POST /api/topics
- Description: Create new topic
- Request Body:
```json
{
  "name": "string"
}
```
- Success: 201 Created
- Errors: 400, 401, 409, 500

#### PUT /api/topics/:id
- Description: Update topic
- Request Body:
```json
{
  "name": "string"
}
```
- Success: 200 OK
- Errors: 400, 401, 403, 404, 409, 500

#### DELETE /api/topics/:id
- Description: Delete topic and all associated flashcards
- Success: 204 No Content
- Errors: 401, 403, 404, 500

### Flashcards

#### GET /api/topics/:topicId/flashcards
- Description: List flashcards in a topic
- Success: 200 OK
- Response Body:
```json
{
  "data": [{
    "id": "uuid",
    "front": "string",
    "back": "string",
    "is_ai_generated": "boolean",
    "was_edited_before_save": "boolean",
    "sr_state": "object",
    "created_at": "string",
    "updated_at": "string"
  }]
}
```
- Errors: 401, 403, 404, 500

#### POST /api/topics/:topicId/flashcards
- Description: Create new flashcard manually
- Request Body:
```json
{
  "front": "string",
  "back": "string"
}
```
- Success: 201 Created
- Errors: 400, 401, 403, 404, 500

#### PUT /api/topics/:topicId/flashcards/:id
- Description: Update flashcard
- Request Body:
```json
{
  "front": "string",
  "back": "string"
}
```
- Success: 200 OK
- Errors: 400, 401, 403, 404, 500

#### DELETE /api/topics/:topicId/flashcards/:id
- Description: Delete flashcard
- Success: 204 No Content
- Errors: 401, 403, 404, 500

### AI Generation

#### POST /api/topics/:topicId/generate
- Description: Generate flashcards from text using AI
- Request Body:
```json
{
  "text": "string",
  "count": "number"
}
```
- Success: 200 OK
- Response Body:
```json
{
  "status": "success" | "error",
  "error_info": "string|null",
  "requested_count": "number",
  "generated_count": "number",
  "generation_id": "uuid",
  "flashcards": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "is_ai_generated": true
    }
  ]
}
```
- Errors: 400, 401, 403, 404, 429, 500

#### POST /api/topics/:topicId/generate/:generationId/save
- Description: Save generated flashcards
- Request Body:
```json
{
  "flashcards": [{
    "front": "string",
    "back": "string",
    "was_edited_before_save": "boolean"
  }]
}
```
- Success: 201 Created
- Errors: 400, 401, 403, 404, 500

## 3. Authentication and Authorization

### Authentication
- Uses Supabase authentication system
- JWT tokens for session management
- Tokens stored in secure HTTP-only cookies
- Session validation via middleware

### Authorization
- Row Level Security (RLS) policies enforced at database level
- API endpoints verify user ownership of resources
- Middleware checks for valid session before processing requests

## 4. Validation and Business Logic

### Global Validation Rules
- All string fields must be trimmed
- UUIDs must be valid v4 format
- Pagination parameters must be positive integers
- Sort parameters must match predefined values

### Resource-Specific Validation

#### Topics
- Name: required, 1-255 characters
- Unique per user
- Max topics per user: TBD based on tier

#### Flashcards
- Front/Back: required, 1-500 characters each
- Must belong to existing topic
- Max flashcards per topic: TBD based on tier

#### AI Generation
- Input text: required, max length TBD
- Requested count: 1-20 cards per generation
- Rate limiting: TBD based on tier

### Business Logic Implementation
- Validation using Zod schemas
- Error handling via consistent error response format
- Rate limiting implemented at API gateway level
- Soft deletion for user data (is_deleted flag)
- Automatic timestamp management (created_at, updated_at)
- SR state management via external library integration