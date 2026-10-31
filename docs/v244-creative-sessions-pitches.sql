-- KYVManagerPro v2.44: sessioni creative, collegamenti ai brani e piazzamenti.
-- MIGRAZIONE ADDITIVA. Non aggiorna PROGETTI né FATTURE; non importa sessioni storiche presunte.
create table if not exists public."KYV_SESSIONI" (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default (select auth.uid()),
  data_sessione date not null,
  titolo text not null check (length(btrim(titolo)) between 2 and 180),
  tipo text not null default 'scrittura'
    check (tipo in ('scrittura','produzione','registrazione','revisione','altro')),
  partecipanti text check (length(partecipanti)<=1000),
  luogo text check (length(luogo)<=200),
  durata_minuti integer check (durata_minuti is null or durata_minuti between 1 and 1440),
  esito text not null default 'in_lavorazione'
    check (esito in ('in_lavorazione','demo','proposta','produzione','pubblicazione','accantonato')),
  note text check (length(note)<=4000),
  archiviata boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kyv_sessioni_owner_id_pair unique (owner_id,id)
);

create table if not exists public."KYV_SESSIONI_PROGETTI" (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default (select auth.uid()),
  id_sessione uuid not null,
  id_progetto bigint not null references public."PROGETTI"("ID") on delete restrict,
  note text check (length(note)<=1000),
  created_at timestamptz not null default now(),
  unique(owner_id,id_sessione,id_progetto),
  foreign key (owner_id,id_sessione) references public."KYV_SESSIONI"(owner_id,id) on delete restrict
);

create table if not exists public."KYV_PIAZZAMENTI" (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default (select auth.uid()),
  id_progetto bigint not null references public."PROGETTI"("ID") on delete restrict,
  destinatario text not null check (length(btrim(destinatario)) between 2 and 200),
  tipo_destinatario text not null default 'artista'
    check(tipo_destinatario in ('artista','a_r','etichetta','publisher','management','altro')),
  referente text check (length(referente)<=200),
  data_invio date,
  stato text not null default 'da_proporre'
    check(stato in ('da_proporre','inviato','in_ascolto','interessato','opzionato','confermato','rifiutato','accantonato')),
  prossimo_followup date,
  data_risposta date,
  note text check (length(note)<=4000),
  archiviata boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kyv_piazzamenti_owner_id_pair unique (owner_id,id)
);

create table if not exists public."KYV_PIAZZAMENTI_EVENTI" (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default (select auth.uid()),
  id_piazzamento uuid not null,
  tipo text not null check(tipo in ('nota','stato','followup')),
  nota text not null check(length(btrim(nota)) between 2 and 2000),
  created_at timestamptz not null default now(),
  foreign key (owner_id,id_piazzamento) references public."KYV_PIAZZAMENTI"(owner_id,id) on delete restrict
);

-- FK su PROGETTI + verifica del proprietario, senza cambiare la tabella storica.
create or replace function public.kyv_v244_validate_project_owner()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if (select auth.uid()) is null or new.owner_id is distinct from (select auth.uid()) then
    raise exception 'Sessione scaduta o proprietario non autorizzato';
  end if;
  if not exists (select 1 from public."PROGETTI" where "ID"=new.id_progetto and owner_id=new.owner_id) then
    raise exception 'Progetto non appartenente al profilo autenticato';
  end if;
  return new;
end;
$$;
revoke all on function public.kyv_v244_validate_project_owner() from public;
grant execute on function public.kyv_v244_validate_project_owner() to authenticated;
drop trigger if exists kyv_session_project_owner_guard on public."KYV_SESSIONI_PROGETTI";
create trigger kyv_session_project_owner_guard before insert or update on public."KYV_SESSIONI_PROGETTI"
for each row execute function public.kyv_v244_validate_project_owner();
drop trigger if exists kyv_pitch_project_owner_guard on public."KYV_PIAZZAMENTI";
create trigger kyv_pitch_project_owner_guard before insert or update on public."KYV_PIAZZAMENTI"
for each row execute function public.kyv_v244_validate_project_owner();

-- Updated_at e audit dello stato dei piazzamenti, indipendenti dalla UI.
create or replace function public.kyv_v244_touch_updated_at()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  new.updated_at=now();
  return new;
end;
$$;
revoke all on function public.kyv_v244_touch_updated_at() from public;
grant execute on function public.kyv_v244_touch_updated_at() to authenticated;
drop trigger if exists kyv_session_touch on public."KYV_SESSIONI";
create trigger kyv_session_touch before update on public."KYV_SESSIONI"
for each row execute function public.kyv_v244_touch_updated_at();
drop trigger if exists kyv_pitch_touch on public."KYV_PIAZZAMENTI";
create trigger kyv_pitch_touch before update on public."KYV_PIAZZAMENTI"
for each row execute function public.kyv_v244_touch_updated_at();

create or replace function public.kyv_v244_log_pitch_changes()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if new.stato is distinct from old.stato then
    insert into public."KYV_PIAZZAMENTI_EVENTI"(owner_id,id_piazzamento,tipo,nota)
      values(new.owner_id,new.id,'stato','Stato: '||old.stato||' → '||new.stato);
  end if;
  if new.prossimo_followup is distinct from old.prossimo_followup then
    insert into public."KYV_PIAZZAMENTI_EVENTI"(owner_id,id_piazzamento,tipo,nota)
      values(new.owner_id,new.id,'followup','Follow-up: '||
        coalesce(old.prossimo_followup::text,'non impostato')||' → '||
        coalesce(new.prossimo_followup::text,'non impostato'));
  end if;
  return new;
end;
$$;
revoke all on function public.kyv_v244_log_pitch_changes() from public;
grant execute on function public.kyv_v244_log_pitch_changes() to authenticated;
drop trigger if exists kyv_pitch_audit_changes on public."KYV_PIAZZAMENTI";
create trigger kyv_pitch_audit_changes after update on public."KYV_PIAZZAMENTI"
for each row execute function public.kyv_v244_log_pitch_changes();

create index if not exists kyv_sessions_owner_date on public."KYV_SESSIONI"(owner_id,data_sessione desc);
create index if not exists kyv_session_links_owner_project on public."KYV_SESSIONI_PROGETTI"(owner_id,id_progetto);
create index if not exists kyv_pitches_owner_followup on public."KYV_PIAZZAMENTI"(owner_id,prossimo_followup);
create index if not exists kyv_pitches_owner_project on public."KYV_PIAZZAMENTI"(owner_id,id_progetto);
create index if not exists kyv_pitch_events_owner_pitch on public."KYV_PIAZZAMENTI_EVENTI"(owner_id,id_piazzamento,created_at desc);

-- Nessun accesso anon, ogni tabella richiede RLS + owner_id.
alter table public."KYV_SESSIONI" enable row level security;
alter table public."KYV_SESSIONI_PROGETTI" enable row level security;
alter table public."KYV_PIAZZAMENTI" enable row level security;
alter table public."KYV_PIAZZAMENTI_EVENTI" enable row level security;

create policy kyv_v244_sessions_select on public."KYV_SESSIONI" for select to authenticated using(owner_id=(select auth.uid()));
create policy kyv_v244_sessions_insert on public."KYV_SESSIONI" for insert to authenticated with check(owner_id=(select auth.uid()));
create policy kyv_v244_sessions_update on public."KYV_SESSIONI" for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy kyv_v244_links_select on public."KYV_SESSIONI_PROGETTI" for select to authenticated using(owner_id=(select auth.uid()));
create policy kyv_v244_links_insert on public."KYV_SESSIONI_PROGETTI" for insert to authenticated with check(owner_id=(select auth.uid()));
create policy kyv_v244_links_update on public."KYV_SESSIONI_PROGETTI" for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy kyv_v244_pitches_select on public."KYV_PIAZZAMENTI" for select to authenticated using(owner_id=(select auth.uid()));
create policy kyv_v244_pitches_insert on public."KYV_PIAZZAMENTI" for insert to authenticated with check(owner_id=(select auth.uid()));
create policy kyv_v244_pitches_update on public."KYV_PIAZZAMENTI" for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy kyv_v244_events_select on public."KYV_PIAZZAMENTI_EVENTI" for select to authenticated using(owner_id=(select auth.uid()));
create policy kyv_v244_events_insert on public."KYV_PIAZZAMENTI_EVENTI" for insert to authenticated with check(owner_id=(select auth.uid()));

revoke all on public."KYV_SESSIONI",public."KYV_SESSIONI_PROGETTI",public."KYV_PIAZZAMENTI",public."KYV_PIAZZAMENTI_EVENTI" from anon;
grant select,insert,update on public."KYV_SESSIONI",public."KYV_SESSIONI_PROGETTI",public."KYV_PIAZZAMENTI" to authenticated;
grant select,insert on public."KYV_PIAZZAMENTI_EVENTI" to authenticated;
comment on table public."KYV_SESSIONI" is 'Sessioni creative inserite dall utente, nessuna attribuzione automatica a PROGETTI.Data_Sessione.';
comment on table public."KYV_SESSIONI_PROGETTI" is 'Relazione molti-a-molti delle sessioni con i progetti musicali.';
comment on table public."KYV_PIAZZAMENTI" is 'Proposte commerciali a artisti A&R etichette e publisher; indipendenti da PROGETTI.STATO.';
