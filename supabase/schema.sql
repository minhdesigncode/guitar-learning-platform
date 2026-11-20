-- Sổ Đàn: chạy 1 lần trong Supabase → SQL Editor → New query → Run.
-- Mỗi người chỉ đọc/ghi được dữ liệu của chính mình (Row Level Security).

create table if not exists public.songs (
  user_id    uuid not null references auth.users on delete cascade,
  id         text not null,
  data       jsonb not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.journal_entries (
  user_id    uuid not null references auth.users on delete cascade,
  id         text not null,
  data       jsonb not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.songs enable row level security;
alter table public.journal_entries enable row level security;

drop policy if exists "own songs" on public.songs;
create policy "own songs" on public.songs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own journal" on public.journal_entries;
create policy "own journal" on public.journal_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Bản thu: bucket riêng tư, file nằm ở recordings/<user id>/<entry id>
insert into storage.buckets (id, name, public, file_size_limit)
values ('recordings', 'recordings', false, 52428800)  -- 50 MB / file
on conflict (id) do nothing;

drop policy if exists "own recordings read" on storage.objects;
create policy "own recordings read" on storage.objects
  for select to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own recordings write" on storage.objects;
create policy "own recordings write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own recordings update" on storage.objects;
create policy "own recordings update" on storage.objects
  for update to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "own recordings delete" on storage.objects;
create policy "own recordings delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
