-- Keep notes.updated_at current on every edit so "recent notes" sort correctly.
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_touch_updated_at
  before update on public.notes
  for each row execute function public.touch_updated_at();
