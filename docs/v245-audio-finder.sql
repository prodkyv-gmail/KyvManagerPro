-- KYV Audio Finder v2.45: catalogo metadati, associazioni esplicite a progetto/sessione.
-- Nessun file binario, cartella privata assoluta, token OAuth o aggiornamento ai dati storici.
create table public."KYV_AUDIO_INDICE" (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 provider text not null check(provider in ('local','drive','dropbox')),
 account_label text not null default '' check (length(account_label)<=180),
 external_key text not null check (length(external_key) between 1 and 600),
 nome_file text not null check (length(btrim(nome_file)) between 1 and 500),
 percorso_relativo text not null default '' check (length(percorso_relativo)<=1400),
 mime_type text check (length(mime_type)<=160),
 size_bytes bigint check (size_bytes is null or size_bytes>=0),
 modificato_il timestamptz,
 content_hash text check (content_hash is null or content_hash ~ '^[a-fA-F0-9]{64}$'),
 link_file text check (link_file is null or (length(link_file)<=2000 and link_file ~ '^https://')),
 origine text not null default 'scansione' check (origine in ('scansione','archivio','selezione')),
 ultimo_avvistamento timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint kyv_audio_identity unique(owner_id,provider,account_label,external_key),
 constraint kyv_audio_owner_pair unique(owner_id,id)
);
create index kyv_audio_owner_filename on public."KYV_AUDIO_INDICE"(owner_id,nome_file);
create index kyv_audio_owner_seen on public."KYV_AUDIO_INDICE"(owner_id,ultimo_avvistamento desc);

create table public."KYV_AUDIO_ASSOCIAZIONI"(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 id_audio uuid not null,
 id_progetto bigint references public."PROGETTI"("ID") on delete restrict,
 id_sessione uuid,
 confermata boolean not null default true,
 annullata boolean not null default false,
 metodo text not null default 'manuale' check(metodo in ('manuale','identita_verificata')),
 nota text check(length(nota)<=1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint kyv_audio_link_one_target check(
  (id_progetto is not null and id_sessione is null)
  or (id_progetto is null and id_sessione is not null)
 ),
 foreign key(owner_id,id_audio) references public."KYV_AUDIO_INDICE"(owner_id,id) on delete restrict,
 foreign key(owner_id,id_sessione) references public."KYV_SESSIONI"(owner_id,id) on delete restrict
);
create unique index kyv_audio_one_active_project on public."KYV_AUDIO_ASSOCIAZIONI"(owner_id,id_audio,id_progetto)
 where id_progetto is not null and not annullata;
create unique index kyv_audio_one_active_session on public."KYV_AUDIO_ASSOCIAZIONI"(owner_id,id_audio,id_sessione)
 where id_sessione is not null and not annullata;
create index kyv_audio_link_owner_project on public."KYV_AUDIO_ASSOCIAZIONI"(owner_id,id_progetto);

create or replace function public.kyv_v245_check_audio_relation()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.owner_id is distinct from (select auth.uid()) then
   raise exception 'Utente non autorizzato';
 end if;
 if new.id_progetto is not null and not exists (
   select 1 from public."PROGETTI"
   where "ID"=new.id_progetto and owner_id=new.owner_id
 ) then
   raise exception 'Progetto non autorizzato';
 end if;
 return new;
end $$;
revoke all on function public.kyv_v245_check_audio_relation() from public;
grant execute on function public.kyv_v245_check_audio_relation() to authenticated;
create trigger kyv_audio_link_guard before insert or update on public."KYV_AUDIO_ASSOCIAZIONI"
 for each row execute function public.kyv_v245_check_audio_relation();

create or replace function public.kyv_v245_audio_touch()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin new.updated_at=now(); return new; end $$;
revoke all on function public.kyv_v245_audio_touch() from public;
grant execute on function public.kyv_v245_audio_touch() to authenticated;
create trigger kyv_audio_touch before update on public."KYV_AUDIO_INDICE"
 for each row execute function public.kyv_v245_audio_touch();
create trigger kyv_audio_link_touch before update on public."KYV_AUDIO_ASSOCIAZIONI"
 for each row execute function public.kyv_v245_audio_touch();

alter table public."KYV_AUDIO_INDICE" enable row level security;
alter table public."KYV_AUDIO_ASSOCIAZIONI" enable row level security;
create policy kyv_audio_read on public."KYV_AUDIO_INDICE" for select to authenticated using(owner_id=(select auth.uid()));
create policy kyv_audio_insert on public."KYV_AUDIO_INDICE" for insert to authenticated with check(owner_id=(select auth.uid()));
create policy kyv_audio_update on public."KYV_AUDIO_INDICE" for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy kyv_audio_links_read on public."KYV_AUDIO_ASSOCIAZIONI" for select to authenticated using(owner_id=(select auth.uid()));
create policy kyv_audio_links_insert on public."KYV_AUDIO_ASSOCIAZIONI" for insert to authenticated with check(owner_id=(select auth.uid()));
create policy kyv_audio_links_update on public."KYV_AUDIO_ASSOCIAZIONI" for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
revoke all on public."KYV_AUDIO_INDICE",public."KYV_AUDIO_ASSOCIAZIONI" from anon;
grant select,insert,update on public."KYV_AUDIO_INDICE",public."KYV_AUDIO_ASSOCIAZIONI" to authenticated;
comment on table public."KYV_AUDIO_INDICE" is 'Metadati di file audio selezionati e scansiti con consenso; nessun audio trasferito su Supabase.';
comment on table public."KYV_AUDIO_ASSOCIAZIONI" is 'Collegamenti ai progetti o sessioni inseriti solo su conferma esplicita. Nessuna associazione per somiglianza automatica.';
