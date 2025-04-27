# Database Schema Plan

## 1. Tables

### profiles
- user_id UUID PRIMARY KEY REFERENCES auth.users(id)
- is_deleted BOOLEAN NOT NULL DEFAULT FALSE
- deleted_at TIMESTAMPTZ
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

### topics
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES profiles(user_id)
- name VARCHAR(255) NOT NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
- UNIQUE(user_id, name)

### flashcards
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES profiles(user_id)
- topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE
- front VARCHAR(500) NOT NULL CHECK (length(front) > 0)
- back VARCHAR(500) NOT NULL CHECK (length(back) > 0)
- is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE
- was_edited_before_save BOOLEAN NOT NULL DEFAULT FALSE
- sr_state JSONB
- ai_generation_log_id UUID REFERENCES ai_generation_logs(id) ON DELETE SET NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

### ai_generation_logs
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- user_id UUID NOT NULL REFERENCES profiles(user_id)
- topic_id UUID REFERENCES topics(id) ON DELETE SET NULL
- requested_count INTEGER NOT NULL
- generated_count INTEGER NOT NULL
- saved_count INTEGER NOT NULL
- input_text_hash BYTEA NOT NULL
- status ai_generation_status NOT NULL
- error_info TEXT
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

### ai_generation_status (ENUM)
- 'success'
- 'error'

## 2. Relations
- profiles 1:1 auth.users via user_id
- profiles 1:N topics via user_id
- topics 1:N flashcards via topic_id
- profiles 1:N ai_generation_logs via user_id
- topics 1:N ai_generation_logs via topic_id
- flashcards N:1 ai_generation_logs via ai_generation_log_id

## 3. Indexes
- B-tree on topics(user_id)
- B-tree on flashcards(user_id)
- B-tree on flashcards(topic_id)
- B-tree on flashcards(ai_generation_log_id)
- B-tree on ai_generation_logs(user_id)
- B-tree on ai_generation_logs(topic_id)
- B-tree on ai_generation_logs(created_at)
- GIN on flashcards(sr_state)

## 4. Row-Level Security (RLS)

### topics
- ENABLE ROW LEVEL SECURITY;
- Policy (SELECT, INSERT, UPDATE, DELETE):
  - USING (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() AND profiles.is_deleted = FALSE
    ))
  - WITH CHECK (user_id = auth.uid())

### flashcards
- ENABLE ROW LEVEL SECURITY;
- Policy (SELECT, INSERT, UPDATE, DELETE):
  - USING (user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() AND profiles.is_deleted = FALSE
    ))
  - WITH CHECK (user_id = auth.uid())

## 5. Additional Notes
- Triggers to auto-update updated_at on profiles, topics, flashcards
- Function `calculate_monthly_ai_metrics(start_range TIMESTAMPTZ, end_range TIMESTAMPTZ)` returns month, total_generated, total_saved, generation_success_ratio
- Use UUIDs (`gen_random_uuid()`), `TIMESTAMPTZ`/`now()`, `JSONB`, `BYTEA` and ENUM types
