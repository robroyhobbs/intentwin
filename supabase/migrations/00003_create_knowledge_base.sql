-- Make vector type accessible from extensions schema
SET search_path TO public, extensions;

-- Uploaded source documents (past proposals, case studies, etc.)
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_name text not null,
  file_type text not null check (file_type in ('docx', 'pdf', 'pptx')),
  file_size_bytes bigint not null,
  storage_path text not null,
  mime_type text not null,

  -- Classification metadata
  document_type text not null default 'proposal'
    check (document_type in (
      'proposal', 'case_study', 'methodology',
      'capability', 'team_bio', 'template', 'rfp', 'other'
    )),
  industry text,
  service_line text,
  client_name text,
  win_status text check (win_status in ('won', 'lost', 'pending', 'unknown')),
  tags text[] default '{}',

  -- Processing status
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  processing_error text,
  chunk_count integer default 0,
  parsed_text_preview text,

  -- Ownership
  uploaded_by uuid not null references auth.users(id),
  team_id uuid references public.teams(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Document chunks with embeddings
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,

  content text not null,
  chunk_index integer not null,
  token_count integer,

  -- Structural metadata
  section_heading text,
  page_number integer,
  slide_number integer,

  -- Vector embedding (1024 dimensions for Voyage-3)
  embedding vector(1024),

  -- Flexible metadata
  metadata jsonb default '{}',

  created_at timestamptz not null default now()
);

-- Indexes
create index idx_documents_type on public.documents(document_type);
create index idx_documents_processing on public.documents(processing_status);
create index idx_documents_team on public.documents(team_id);
create index idx_documents_tags on public.documents using gin(tags);
create index idx_documents_industry on public.documents(industry);
create index idx_documents_service_line on public.documents(service_line);

create index idx_chunks_document on public.document_chunks(document_id);
create index idx_chunks_section on public.document_chunks(section_heading);

-- HNSW index for fast approximate nearest neighbor search
create index idx_chunks_embedding on public.document_chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Full-text search index
create index idx_chunks_content_fts on public.document_chunks
  using gin (to_tsvector('english', content));

-- Auto-update
create trigger documents_updated_at
  before update on public.documents
  for each row
  execute function extensions.moddatetime(updated_at);
