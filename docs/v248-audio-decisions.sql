-- KYV v2.48 — audio origin classification, no binary files or absolute paths.
-- Distinct from KYV_AUDIO_INDICE: references/pending audio never become project assets.
create table if not exists public."KYV_AUDIO_DECISIONI"(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id),
 provider text not null check(provider in ('local','drive','dropbox')),
 account_label text not null default '' check(length(account_label)<=180),
 external_key text not null check(length(external_key) between 1 and 600),
 decision text not null check(decision in ('mio','reference','da_verificare')),
 updated_at timestamptz not null default now(),
 constraint kyv_audio_decision_identity unique(owner_id,provider,account_label,external_key)
);
create index if not exists kyv_audio_decision_owner_status on public."KYV_AUDIO_DECISIONI"(owner_id,decision);
alter table public."KYV_AUDIO_DECISIONI" enable row level security;
create policy kyv_decision_read_v248 on public."KYV_AUDIO_DECISIONI" for select to authenticated
 using(owner_id=(select auth.uid()));
create policy kyv_decision_insert_v248 on public."KYV_AUDIO_DECISIONI" for insert to authenticated
 with check(owner_id=(select auth.uid()));
create policy kyv_decision_update_v248 on public."KYV_AUDIO_DECISIONI" for update to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
revoke all on public."KYV_AUDIO_DECISIONI" from public,anon,authenticated;
grant select,insert,update on public."KYV_AUDIO_DECISIONI" to authenticated;
comment on table public."KYV_AUDIO_DECISIONI" is
 'Decisioni dell utente su identita dei file audio, senza contenuti, nomi, percorsi assoluti, credenziali o progetti automatici.';
