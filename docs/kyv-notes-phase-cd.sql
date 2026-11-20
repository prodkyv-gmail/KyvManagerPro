-- KYV Taccuino · Fasi C+D (20 novembre 2026)
-- Incrementale: non altera le note o gli audio preesistenti.
create table if not exists public.kyv_note_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  note_id uuid not null references public.kyv_notes(id) on delete cascade,
  kind text not null default 'attachment' check (kind in ('attachment','drawing')),
  file_name text not null check (char_length(file_name) between 1 and 200),
  mime_type text not null check (char_length(mime_type) between 1 and 180),
  size_bytes bigint not null check (size_bytes between 1 and 15728640),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  constraint kyv_note_file_path_owner check (
    left(storage_path, length(owner_id::text)+length(note_id::text)+2)
    = owner_id::text || '/' || note_id::text || '/'
  )
);
create index if not exists kyv_note_files_owner_note_recent
  on public.kyv_note_files(owner_id,note_id,created_at desc);
alter table public.kyv_note_files enable row level security;
revoke all on public.kyv_note_files from public, anon;
grant select,insert,delete on public.kyv_note_files to authenticated;

create policy kyv_note_files_select on public.kyv_note_files
  for select to authenticated
  using ((select auth.uid())=owner_id and exists (
    select 1 from public.kyv_notes n where n.id=note_id and n.owner_id=(select auth.uid())
  ));
create policy kyv_note_files_insert on public.kyv_note_files
  for insert to authenticated
  with check ((select auth.uid())=owner_id and exists (
    select 1 from public.kyv_notes n where n.id=note_id and n.owner_id=(select auth.uid())
  ));
create policy kyv_note_files_delete on public.kyv_note_files
  for delete to authenticated
  using ((select auth.uid())=owner_id and exists (
    select 1 from public.kyv_notes n where n.id=note_id and n.owner_id=(select auth.uid())
  ));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('kyv-notes-files','kyv-notes-files',false,15728640,
  array['image/png','image/jpeg','image/webp','image/gif','image/heic','image/heif',
        'application/pdf','text/plain','text/markdown',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do nothing;

-- Tutti i download e upload dei file richiedono una sessione e una cartella proprietario.
create policy kyv_note_files_storage_select on storage.objects
  for select to authenticated
  using (bucket_id='kyv-notes-files' and
         (storage.foldername(name))[1]=(select auth.uid())::text);
create policy kyv_note_files_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id='kyv-notes-files' and
              (storage.foldername(name))[1]=(select auth.uid())::text);
create policy kyv_note_files_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id='kyv-notes-files' and
         (storage.foldername(name))[1]=(select auth.uid())::text);
