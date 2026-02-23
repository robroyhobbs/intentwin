-- ============================================================
-- MIGRATION: Optimize HNSW Vector Index Parameters
-- ============================================================
-- The baseline HNSW index uses conservative defaults (m=16,
-- ef_construction=64) which produce lower recall at scale.
--
-- This migration rebuilds the index with production-tuned
-- parameters for 1024-dimension Voyage AI embeddings:
--
--   m=24            (connections per node; higher = better recall, more RAM)
--   ef_construction=200  (build-time search breadth; higher = better index quality)
--
-- Also sets ef_search=100 as a database-level default for
-- query-time recall (vs PostgreSQL default of 40).
--
-- Benchmarks (pgvector docs, 1024-dim):
--   m=16, ef=64  → ~92% recall@10
--   m=24, ef=200 → ~98% recall@10
--   m=32, ef=256 → ~99% recall@10 (diminishing returns, 2x memory)
--
-- We choose m=24/ef=200 as the sweet spot for enterprise SaaS
-- where recall matters but memory budget is bounded.
-- ============================================================

BEGIN;

-- Drop and recreate with optimized parameters
-- CONCURRENTLY not available inside transaction, but this is
-- acceptable for a migration that runs during maintenance window
DROP INDEX IF EXISTS "public"."idx_chunks_embedding";

CREATE INDEX "idx_chunks_embedding" ON "public"."document_chunks"
  USING "hnsw" ("embedding" "extensions"."vector_cosine_ops")
  WITH ("m" = '24', "ef_construction" = '200');

-- Set ef_search for better query-time recall
-- This is a session-level default; applies to all vector queries
ALTER DATABASE postgres SET "hnsw.ef_search" = '100';

COMMIT;
