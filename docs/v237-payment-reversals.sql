-- KYVManagerPro v2.37 — Storni integrali auditabili. Applicata 29/10/2026.
create table if not exists public."FATTURE_INCASSI_STORNI" (
 "ID_STORNO" bigint generated always as identity primary key,
 "ID_INCASSO" bigint not null unique references public."FATTURE_INCASSI"("ID_INCASSO") on delete restrict,
 "Data" date not null,
 "Motivo" text not null check (char_length(btrim("Motivo")) between 10 and 500),
 "owner_id" uuid not null default auth.uid(),
 "created_at" timestamptz not null default now()
);
create index if not exists fatture_incassi_storni_owner_idx on public."FATTURE_INCASSI_STORNI" (owner_id,"ID_INCASSO");
alter table public."FATTURE_INCASSI_STORNI" enable row level security;
drop policy if exists kyv_reversals_select on public."FATTURE_INCASSI_STORNI";
create policy kyv_reversals_select on public."FATTURE_INCASSI_STORNI"
for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists kyv_reversals_insert on public."FATTURE_INCASSI_STORNI";
create policy kyv_reversals_insert on public."FATTURE_INCASSI_STORNI"
for insert to authenticated with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public."FATTURE_INCASSI" payment
    join public."FATTURE" inv on inv."ID_FT" = payment."ID_FT"
    where payment."ID_INCASSO" = "FATTURE_INCASSI_STORNI"."ID_INCASSO"
      and payment.owner_id = (select auth.uid()) and inv.owner_id = (select auth.uid())
  )
);
grant select, insert on public."FATTURE_INCASSI_STORNI" to authenticated;
