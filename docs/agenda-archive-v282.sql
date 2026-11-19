-- Archivio non distruttivo: eventi Google sincronizzati e attività inserite dall'app.
-- Conserva gli eventi anche quando Google non li restituisce più perché passati.
create table if not exists public."KYV_AGENDA_EVENTI" (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source text not null check (source in ('google','manual')),
  source_key text not null check (length(source_key) between 1 and 500),
  calendar_id text,
  title text not null check (length(title) between 1 and 250),
  event_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  activity_type text not null default 'other' check (activity_type in ('session','followup','deadline','other')),
  description text not null default '' check (length(description)<=5000),
  location text not null default '' check (length(location)<=500),
  created_from_app boolean not null default false,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint kyv_agenda_source_unique unique(owner_id,source,source_key),
  constraint kyv_agenda_end_after_start check (ends_at is null or ends_at>starts_at)
);
comment on table public."KYV_AGENDA_EVENTI" is
  'Archivio append-preserving di Google Calendar e attività pianificate: un sync non elimina eventi storici.';
create index if not exists kyv_agenda_owner_date_idx on public."KYV_AGENDA_EVENTI"(owner_id,starts_at);
alter table public."KYV_AGENDA_EVENTI" enable row level security;
revoke all on public."KYV_AGENDA_EVENTI" from anon;
grant select,insert,update on public."KYV_AGENDA_EVENTI" to authenticated;
revoke delete on public."KYV_AGENDA_EVENTI" from authenticated;
create policy "kyv_agenda_owner_select" on public."KYV_AGENDA_EVENTI"
  for select to authenticated using (owner_id=(select auth.uid()));
create policy "kyv_agenda_owner_insert" on public."KYV_AGENDA_EVENTI"
  for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "kyv_agenda_owner_update" on public."KYV_AGENDA_EVENTI"
  for update to authenticated
  using (owner_id=(select auth.uid()))
  with check (owner_id=(select auth.uid()));
-- Deliberatamente nessuna policy DELETE: una sincronizzazione non cancella lo storico.
