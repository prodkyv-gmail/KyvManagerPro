-- KYV v2.44: append-only session state history, separately applied from base migration.
create table if not exists public."KYV_SESSIONI_EVENTI" (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 id_sessione uuid not null,
 tipo text not null check(tipo in ('esito','nota')),
 nota text not null check(length(btrim(nota)) between 2 and 2000),
 created_at timestamptz not null default now(),
 foreign key(owner_id,id_sessione) references public."KYV_SESSIONI"(owner_id,id) on delete restrict
);
create index if not exists kyv_session_events_owner_session on public."KYV_SESSIONI_EVENTI"(owner_id,id_sessione,created_at desc);
alter table public."KYV_SESSIONI_EVENTI" enable row level security;
create policy kyv_v244_session_event_read on public."KYV_SESSIONI_EVENTI" for select to authenticated using(owner_id=(select auth.uid()));
create policy kyv_v244_session_event_insert on public."KYV_SESSIONI_EVENTI" for insert to authenticated with check(owner_id=(select auth.uid()));
revoke all on public."KYV_SESSIONI_EVENTI" from anon;
grant select,insert on public."KYV_SESSIONI_EVENTI" to authenticated;

create or replace function public.kyv_v244_log_session_changes()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.esito is distinct from old.esito then
   insert into public."KYV_SESSIONI_EVENTI"(owner_id,id_sessione,tipo,nota)
   values(new.owner_id,new.id,'esito','Esito: '||old.esito||' → '||new.esito);
 end if;
 return new;
end;
$$;
revoke all on function public.kyv_v244_log_session_changes() from public;
grant execute on function public.kyv_v244_log_session_changes() to authenticated;
drop trigger if exists kyv_session_audit_changes on public."KYV_SESSIONI";
create trigger kyv_session_audit_changes after update on public."KYV_SESSIONI"
for each row execute function public.kyv_v244_log_session_changes();
