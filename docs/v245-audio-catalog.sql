-- v2.45 KYV Audio Finder. Catalogo indicizzato su richiesta; non sposta né carica file audio.
-- Nessun aggiornamento delle tabelle storiche e nessuna associazione automatica.
create table public."KYV_AUDIO_CATALOGO" (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 fonte text not null check(fonte in ('locale','google_drive','dropbox','onedrive_locale')),
 account_key text not null check(length(account_key) between 1 and 160),
 provider_key text not null check(length(provider_key) between 1 and 1800),
 nome_file text not null check(length(btrim(nome_file)) between 1 and 500),
 percorso_relativo text check(percorso_relativo is null or length(percorso_relativo)<=1800),
 link_file text check(link_file is null or (length(link_file)<=2048 and link_file ~* '^https://')),
 tipo_audio text not null default 'altro' check(tipo_audio in ('demo','mix','master','stems','provino','reference','altro')),
 dimensione_bytes bigint check(dimensione_bytes is null or dimensione_bytes>=0),
 modificato_il timestamptz,
 firma_sha256 text check(firma_sha256 is null or firma_sha256 ~ '^[0-9a-f]{64}$'),
 stato text not null default 'indicizzato' check(stato in ('indicizzato','confermato')),
 id_progetto bigint references public."PROGETTI"("ID") on delete restrict,
 id_sessione uuid,
 archiviato boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(owner_id,fonte,account_key,provider_key),
 foreign key(owner_id,id_sessione) references public."KYV_SESSIONI"(owner_id,id) on delete restrict,
 constraint audio_confirmed_requires_link check(stato<>'confermato' or (id_progetto is not null or id_sessione is not null))
);
create index kyv_audio_catalog_owner_name on public."KYV_AUDIO_CATALOGO"(owner_id,nome_file);
create index kyv_audio_catalog_owner_project on public."KYV_AUDIO_CATALOGO"(owner_id,id_progetto);
create index kyv_audio_catalog_owner_session on public."KYV_AUDIO_CATALOGO"(owner_id,id_sessione);
create index kyv_audio_catalog_owner_hash on public."KYV_AUDIO_CATALOGO"(owner_id,firma_sha256) where firma_sha256 is not null;

alter table public."KYV_AUDIO_CATALOGO" add constraint kyv_audio_owner_id_pair unique(owner_id,id);

create table public."KYV_AUDIO_ASSOCIAZIONI_EVENTI" (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 id_audio uuid not null,
 vecchio_progetto bigint,
 nuovo_progetto bigint,
 vecchia_sessione uuid,
 nuova_sessione uuid,
 vecchio_stato text,
 nuovo_stato text,
 created_at timestamptz not null default now(),
 foreign key(owner_id,id_audio) references public."KYV_AUDIO_CATALOGO"(owner_id,id) on delete restrict
);
create index kyv_audio_events_owner_audio on public."KYV_AUDIO_ASSOCIAZIONI_EVENTI"(owner_id,id_audio,created_at desc);

create or replace function public.kyv_audio_v245_guard()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or new.owner_id is distinct from auth.uid() then
  raise exception 'Proprietario non autorizzato';
 end if;
 if new.id_progetto is not null and not exists(
    select 1 from public."PROGETTI" where "ID"=new.id_progetto and owner_id=new.owner_id
 ) then raise exception 'Progetto non autorizzato'; end if;
 if new.id_sessione is not null and not exists(
    select 1 from public."KYV_SESSIONI" where id=new.id_sessione and owner_id=new.owner_id
 ) then raise exception 'Sessione non autorizzata'; end if;
 if new.stato='indicizzato' and (new.id_progetto is not null or new.id_sessione is not null) then
  raise exception 'I collegamenti richiedono conferma esplicita';
 end if;
 new.updated_at=now();
 return new;
end;$$;
revoke all on function public.kyv_audio_v245_guard() from public;
grant execute on function public.kyv_audio_v245_guard() to authenticated;
create trigger kyv_audio_v245_before before insert or update on public."KYV_AUDIO_CATALOGO"
for each row execute function public.kyv_audio_v245_guard();

create or replace function public.kyv_audio_v245_audit()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $
begin
 if auth.uid() is null or new.owner_id is distinct from auth.uid() then
  raise exception 'Audit non autorizzato';
 end if;
 if new.id_progetto is distinct from old.id_progetto or
    new.id_sessione is distinct from old.id_sessione or new.stato is distinct from old.stato then
  insert into public."KYV_AUDIO_ASSOCIAZIONI_EVENTI"
    (owner_id,id_audio,vecchio_progetto,nuovo_progetto,vecchia_sessione,nuova_sessione,vecchio_stato,nuovo_stato)
  values(new.owner_id,new.id,old.id_progetto,new.id_progetto,old.id_sessione,new.id_sessione,old.stato,new.stato);
 end if;
 return new;
end;$$;
revoke all on function public.kyv_audio_v245_audit() from public,anon,authenticated;
create trigger kyv_audio_v245_after after update on public."KYV_AUDIO_CATALOGO"
for each row execute function public.kyv_audio_v245_audit();

alter table public."KYV_AUDIO_CATALOGO" enable row level security;
alter table public."KYV_AUDIO_ASSOCIAZIONI_EVENTI" enable row level security;
create policy kyv_audio_v245_select on public."KYV_AUDIO_CATALOGO" for select to authenticated using(owner_id=(select auth.uid()));
create policy kyv_audio_v245_insert on public."KYV_AUDIO_CATALOGO" for insert to authenticated with check(owner_id=(select auth.uid()));
create policy kyv_audio_v245_update on public."KYV_AUDIO_CATALOGO" for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy kyv_audio_v245_events_select on public."KYV_AUDIO_ASSOCIAZIONI_EVENTI" for select to authenticated using(owner_id=(select auth.uid()));
-- Audit events are written only by the database trigger (no client INSERT grant).
revoke all on public."KYV_AUDIO_CATALOGO",public."KYV_AUDIO_ASSOCIAZIONI_EVENTI" from anon;
revoke all on public."KYV_AUDIO_ASSOCIAZIONI_EVENTI" from authenticated;
grant select,insert,update on public."KYV_AUDIO_CATALOGO" to authenticated;
grant select on public."KYV_AUDIO_ASSOCIAZIONI_EVENTI" to authenticated;
comment on table public."KYV_AUDIO_CATALOGO" is 'Indice metadati attivato dall utente. Mai contenuti audio, chiavi OAuth, percorsi assoluti o collegamenti presunti.';
