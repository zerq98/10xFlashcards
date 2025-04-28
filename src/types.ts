import { type Database } from "./db/database.types"

// Base type aliases for database tables
type TablesRow<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

// Auth DTOs
export interface RegisterRequestDTO {
  email: string
  password: string
}

export type LoginRequestDTO = RegisterRequestDTO

export interface ResetPasswordRequestDTO {
  email: string
}

// Topics DTOs
export type TopicDTO = Pick<TablesRow<"topics">, "id" | "name" | "created_at" | "updated_at">

export type CreateTopicRequestDTO = Pick<TablesInsert<"topics">, "name">

export type UpdateTopicRequestDTO = Required<Pick<TablesUpdate<"topics">, "name">>

// Flashcards DTOs
export type FlashcardDTO = Pick<
  TablesRow<"flashcards">,
  "id" | "front" | "back" | "is_ai_generated" | "sr_state" | "created_at" | "updated_at"
>

export type CreateFlashcardRequestDTO = Pick<TablesInsert<"flashcards">, "front" | "back">

export type UpdateFlashcardRequestDTO = Required<Pick<TablesUpdate<"flashcards">, "front" | "back">>

// AI Generation DTOs
export interface GenerateFlashcardsRequestDTO {
  text: string
  count: number
}

export interface GenerateFlashcardsResponseDTO {
  status: Database["public"]["Enums"]["ai_generation_status"]
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

export interface SaveGeneratedFlashcardsRequestDTO {
  flashcards: Array<{
    front: string
    back: string
    was_edited_before_save: boolean
  }>
}

// Response wrapper types for consistent API responses
export interface ApiSuccessResponse<T> {
  data: T
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse