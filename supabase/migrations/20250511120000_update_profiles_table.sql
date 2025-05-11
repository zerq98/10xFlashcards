-- migration: update profiles table
-- date: 2025-05-11 12:00:00 UTC
-- description: Add id as primary key, keep user_id as foreign key, add unique email column

-- First create a new email column for profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add a unique constraint to the email column
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Add a new id column as identity column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() NOT NULL;

-- First we need to drop the primary key constraint on user_id
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- Now add primary key constraint on the new id column
ALTER TABLE public.profiles
ADD PRIMARY KEY (id);

-- Ensure user_id has a foreign key constraint to auth.users
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add a unique constraint on user_id to maintain one-to-one relationship
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Update Row Level Security (RLS) policies to use user_id for authentication checks
-- but keep the policy names the same

DROP POLICY IF EXISTS "select profiles" ON public.profiles;
CREATE POLICY "select profiles" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert profiles" ON public.profiles;
CREATE POLICY "insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update profiles" ON public.profiles;
CREATE POLICY "update profiles" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete profiles" ON public.profiles;
CREATE POLICY "delete profiles" ON public.profiles
  FOR DELETE USING (user_id = auth.uid());

-- Ensure foreign keys in other tables continue to reference user_id
-- We don't need to modify these as long as user_id remains in the profiles table
