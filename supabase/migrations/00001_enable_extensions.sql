-- Enable pgvector for vector similarity search
create extension if not exists vector with schema extensions;

-- Enable pg_trgm for trigram-based text search
create extension if not exists pg_trgm with schema extensions;

-- Enable moddatetime for auto-updating updated_at columns
create extension if not exists moddatetime with schema extensions;
