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

-- Bài công khai: bản chụp của một bài hát mà chủ bài bấm "Đăng công khai".
-- Ai cũng đọc được (kể cả chưa đăng nhập); chỉ chủ bài được đăng, cập nhật, gỡ.
-- Bài trong bảng songs vẫn riêng tư: sửa bài không tự lên bản công khai cho tới khi bấm "Cập nhật".
create table if not exists public.public_songs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  song_id      text not null,
  title        text not null check (char_length(title) between 1 and 200),
  key          text not null default 'C' check (char_length(key) <= 8),
  capo         smallint not null default 0 check (capo between 0 and 12),
  body         text not null check (char_length(body) <= 20000),
  author_name  text check (char_length(author_name) <= 100),
  published_at timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  search       text generated always as (lower(title || ' ' || coalesce(author_name, ''))) stored,
  unique (user_id, song_id)
);

create index if not exists public_songs_updated_idx on public.public_songs (updated_at desc);

alter table public.public_songs enable row level security;

drop policy if exists "anyone reads public songs" on public.public_songs;
create policy "anyone reads public songs" on public.public_songs
  for select to anon, authenticated
  using (true);

drop policy if exists "own public songs insert" on public.public_songs;
create policy "own public songs insert" on public.public_songs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "own public songs update" on public.public_songs;
create policy "own public songs update" on public.public_songs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own public songs delete" on public.public_songs;
create policy "own public songs delete" on public.public_songs
  for delete to authenticated
  using ((select auth.uid()) = user_id);
