-- migration for adding can_evolve to characters table

-- Add can_evolve column with default value false
ALTER TABLE public.characters
ADD COLUMN can_evolve BOOLEAN NOT NULL DEFAULT FALSE;
