-- Let classmates in the same chat room see each other's name and avatar.
create function public.shares_room_with(other uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.chat_members mine
    join public.chat_members theirs on theirs.room_id = mine.room_id
    where mine.user_id = auth.uid() and theirs.user_id = other
  );
$$;

create policy "room members read profiles" on public.profiles
  for select using (public.shares_room_with(id));
