-- KYV Taccuino · Fasi A+B · note private per utente autenticato e registrazioni audio.
-- Migrazione additiva: non tocca PROGETTI, fatture o lo storico.
create table if not exists public.kyv_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 180),
  content text not null default '' check (char_length(content) <= 30000),
  category text not null default 'info' check (category in ('idea','info','event','todo')),
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  project_id bigint,
  audio_path text,
  audio_mime text,
  audio_duration_seconds integer check (audio_duration_seconds is null or audio_duration_seconds between 0 and 3600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kyv_notes_audio_owned check (
    audio_path is null or left(audio_path,length(owner_id::text)+1)=owner_id::text||'/'
  )
);
create index if not exists kyv_notes_owner_recent_idx on public.kyv_notes(owner_id,is_archived,is_pinned desc,updated_at desc);
create index if not exists kyv_notes_owner_project_idx on public.kyv_notes(owner_id,project_id) where project_id is not null;

alter table public.kyv_notes enable row level security;
revoke all on public.kyv_notes from public, anon;
grant select,insert,update,delete on public.kyv_notes to authenticated;

create policy kyv_notes_owner_select on public.kyv_notes
  for select to authenticated using ((select auth.uid())=owner_id);
create policy kyv_notes_owner_insert on public.kyv_notes
  for insert to authenticated
  with check ((select auth.uid())=owner_id and
    (project_id is null or exists(
      select 1 from public."PROGETTI" p where p."ID"=project_id and p.owner_id=(select auth.uid())
    )));
create policy kyv_notes_owner_update on public.kyv_notes
  for update to authenticated
  using ((select auth.uid())=owner_id)
  with check ((select auth.uid())=owner_id and
    (project_id is null or exists(
      select 1 from public."PROGETTI" p where p."ID"=project_id and p.owner_id=(select auth.uid())
    )));
create policy kyv_notes_owner_delete on public.kyv_notes
  for delete to authenticated using ((select auth.uid())=owner_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('kyv-notes-audio','kyv-notes-audio',false,20971520,ARRAY['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg','audio/x-m4a'])
on conflict (id) do nothing;

-- Cartella obbligatoria <uid>/<note_id>/<file>: nessun audio può attraversare utenti.
create policy kyv_notes_audio_select on storage.objects
  for select to authenticated
  using (bucket_id='kyv-notes-audio' and
         (storage.foldername(name))[1]=(select auth.uid())::text);
create policy kyv_notes_audio_insert on storage.objects
  for insert to authenticated
  with check (bucket_id='kyv-notes-audio' and
              (storage.foldername(name))[1]=(select auth.uid())::text);
create policy kyv_notes_audio_delete on storage.objects
  for delete to authenticated
  using (bucket_id='kyv-notes-audio' and
         (storage.foldername(name))[1]=(select auth.uid())::text);
