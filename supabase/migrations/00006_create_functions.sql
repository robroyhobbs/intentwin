-- Make vector type accessible from extensions schema
SET search_path TO public, extensions;

-- Semantic search: match document chunks by vector similarity
create or replace function public.match_document_chunks(
  query_embedding vector(1024),
  match_threshold float default 0.7,
  match_count int default 10,
  filter_document_type text default null,
  filter_industry text default null,
  filter_service_line text default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  section_heading text,
  chunk_index integer,
  similarity float,
  document_title text,
  document_type text,
  file_name text
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.title as document_title,
    d.document_type,
    d.file_name
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where
    d.processing_status = 'completed'
    and dc.embedding is not null
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
    and (filter_document_type is null or d.document_type = filter_document_type)
    and (filter_industry is null or d.industry = filter_industry)
    and (filter_service_line is null or d.service_line = filter_service_line)
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Hybrid search: combine vector similarity with full-text search
create or replace function public.hybrid_search_chunks(
  query_text text,
  query_embedding vector(1024),
  match_count int default 10,
  vector_weight float default 0.7,
  text_weight float default 0.3,
  filter_document_type text default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  section_heading text,
  combined_score float,
  vector_score float,
  text_score float,
  document_title text,
  document_type text
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    (vector_weight * (1 - (dc.embedding <=> query_embedding))) +
    (text_weight * coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0)) as combined_score,
    1 - (dc.embedding <=> query_embedding) as vector_score,
    coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0) as text_score,
    d.title as document_title,
    d.document_type
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where
    d.processing_status = 'completed'
    and dc.embedding is not null
    and (filter_document_type is null or d.document_type = filter_document_type)
  order by combined_score desc
  limit match_count;
end;
$$;

-- Update chunk count on documents when chunks are inserted
create or replace function public.update_document_chunk_count()
returns trigger as $$
begin
  update public.documents
  set chunk_count = (
    select count(*) from public.document_chunks
    where document_id = new.document_id
  )
  where id = new.document_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger update_chunk_count_on_insert
  after insert on public.document_chunks
  for each row
  execute function public.update_document_chunk_count();
