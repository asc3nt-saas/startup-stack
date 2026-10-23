-- StudyHub initial schema.
-- Every user-owned table has row level security so a student can only ever
-- read and write their own rows. Chat is the exception: rows are visible to
-- members of the room.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  school text,
  grade_scale text not null default 'percent' check (grade_scale in ('percent', 'gpa4', 'five')),
  reminder_hours int not null default 24 check (reminder_hours between 1 and 168),
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Subjects: shared by timetable, assignments, notes, grades and flashcards
-- ---------------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  teacher text,
  room text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 1. Timetable
-- ---------------------------------------------------------------------------
create table public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Monday
  starts_at time not null,
  ends_at time not null,
  room text,
  kind text not null default 'lecture', -- lecture, seminar, lab, ...
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- 2. Assignments and exams
-- ---------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  description text,
  kind text not null default 'assignment' check (kind in ('assignment', 'exam', 'quiz', 'project')),
  due_at timestamptz not null,
  priority smallint not null default 2 check (priority between 1 and 3),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Notes
-- ---------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null default 'Untitled',
  content text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Grades (spreadsheet style: one row per graded item)
-- ---------------------------------------------------------------------------
create table public.grade_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  name text not null,
  category text, -- homework, midterm, final, ...
  score numeric,
  max_score numeric not null default 100,
  weight numeric not null default 1,
  graded_on date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Flashcards
-- ---------------------------------------------------------------------------
create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  deck_id uuid not null references public.flashcard_decks (id) on delete cascade,
  front text not null,
  back text not null,
  -- Spaced repetition (SM-2 style) fields.
  ease numeric not null default 2.5,
  interval_days int not null default 0,
  due_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Study sessions (timer history, streaks, XP)
-- ---------------------------------------------------------------------------
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  started_at timestamptz not null,
  minutes int not null check (minutes > 0),
  mode text not null default 'pomodoro',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7. Group chat
-- ---------------------------------------------------------------------------
create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz not null default now()
);

create table public.chat_members (
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create function public.is_room_member(room uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.chat_members
    where room_id = room and user_id = auth.uid()
  );
$$;

-- Join a room by invite code without exposing every room to every user.
create function public.join_room(code text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  room uuid;
begin
  select id into room from public.chat_rooms where invite_code = code;
  if room is null then
    raise exception 'Invalid invite code';
  end if;
  insert into public.chat_members (room_id, user_id)
  values (room, auth.uid())
  on conflict do nothing;
  return room;
end;
$$;

-- The creator becomes a member automatically.
create function public.handle_new_room()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.chat_members (room_id, user_id) values (new.id, new.created_by);
  return new;
end;
$$;

create trigger on_chat_room_created
  after insert on public.chat_rooms
  for each row execute function public.handle_new_room();

-- ---------------------------------------------------------------------------
-- 8. AI files, summaries and learning roadmaps
-- ---------------------------------------------------------------------------
create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  summary text,
  created_at timestamptz not null default now()
);

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_id uuid references public.files (id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.roadmap_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  position int not null,
  title text not null,
  content text,
  quiz jsonb, -- [{question, options[], answer}]
  completed_at timestamptz,
  xp int not null default 10
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index on public.subjects (user_id);
create index on public.timetable_entries (user_id, weekday);
create index on public.assignments (user_id, due_at);
create index on public.notes (user_id, updated_at desc);
create index on public.grade_items (user_id, subject_id);
create index on public.flashcards (deck_id, due_on);
create index on public.study_sessions (user_id, started_at desc);
create index on public.chat_messages (room_id, created_at);
create index on public.roadmap_nodes (roadmap_id, position);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array[
    'subjects', 'timetable_entries', 'assignments', 'notes', 'grade_items',
    'flashcard_decks', 'flashcards', 'study_sessions', 'files', 'roadmaps',
    'roadmap_nodes'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end;
$$;

alter table public.chat_rooms enable row level security;
create policy "members read rooms" on public.chat_rooms
  for select using (public.is_room_member(id) or created_by = auth.uid());
create policy "anyone signed in creates rooms" on public.chat_rooms
  for insert with check (created_by = auth.uid());
create policy "creator edits room" on public.chat_rooms
  for update using (created_by = auth.uid());
create policy "creator deletes room" on public.chat_rooms
  for delete using (created_by = auth.uid());

alter table public.chat_members enable row level security;
create policy "members see members" on public.chat_members
  for select using (public.is_room_member(room_id));
create policy "leave room" on public.chat_members
  for delete using (user_id = auth.uid());

alter table public.chat_messages enable row level security;
create policy "members read messages" on public.chat_messages
  for select using (public.is_room_member(room_id));
create policy "members send messages" on public.chat_messages
  for insert with check (user_id = auth.uid() and public.is_room_member(room_id));
create policy "author deletes message" on public.chat_messages
  for delete using (user_id = auth.uid());

-- Live updates for chat.
alter publication supabase_realtime add table public.chat_messages;

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded study files (path: <user_id>/<file>)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('study-files', 'study-files', false)
on conflict do nothing;

create policy "own files read" on storage.objects
  for select using (bucket_id = 'study-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files write" on storage.objects
  for insert with check (bucket_id = 'study-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects
  for delete using (bucket_id = 'study-files' and (storage.foldername(name))[1] = auth.uid()::text);
