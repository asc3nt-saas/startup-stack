-- AI roadmaps keep the summary, key points and suggested flashcards that
-- Gemini generated, plus the name of the file they came from.
alter table public.roadmaps
  add column subject_id uuid references public.subjects (id) on delete set null,
  add column source_name text,
  add column summary text not null default '',
  add column key_points jsonb not null default '[]',
  add column cards jsonb not null default '[]';

create index on public.roadmaps (user_id, created_at);
