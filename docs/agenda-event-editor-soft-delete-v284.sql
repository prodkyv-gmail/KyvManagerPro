-- KYV Agenda event editor: additive only; no existing event is changed or deleted.
-- Owner-scoped UPDATE policy and RLS already exist; no DELETE privilege is granted.
alter table public."KYV_AGENDA_EVENTI"
  add column if not exists edited_in_app boolean not null default false,
  add column if not exists deleted_at timestamptz;
comment on column public."KYV_AGENDA_EVENTI".edited_in_app is
  'User edited local Agenda fields. Google refresh preserves these values.';
comment on column public."KYV_AGENDA_EVENTI".deleted_at is
  'Soft removal in KYV only; preserves history and prevents Google re-import.';
create index if not exists kyv_agenda_owner_active_date_idx
  on public."KYV_AGENDA_EVENTI" (owner_id,event_date) where deleted_at is null;
