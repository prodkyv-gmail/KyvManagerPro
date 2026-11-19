-- Add only workflow fields to existing owner-scoped agenda archive; preserve all entries.
alter table public."KYV_AGENDA_EVENTI"
  add column if not exists workflow_status text not null default 'da_fare',
  add column if not exists remind_on date,
  add column if not exists workflow_note text not null default '',
  add column if not exists status_updated_at timestamptz;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'kyv_agenda_workflow_status_allowed'
      and conrelid = 'public."KYV_AGENDA_EVENTI"'::regclass
  ) then
    alter table public."KYV_AGENDA_EVENTI"
      add constraint kyv_agenda_workflow_status_allowed
      check (workflow_status in ('da_fare','fatto','chiuso','da_rimandare','da_rivedere','posticipato'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'kyv_agenda_workflow_note_limit'
      and conrelid = 'public."KYV_AGENDA_EVENTI"'::regclass
  ) then
    alter table public."KYV_AGENDA_EVENTI"
      add constraint kyv_agenda_workflow_note_limit check (length(workflow_note)<=2000);
  end if;
end $$;
comment on column public."KYV_AGENDA_EVENTI".remind_on is
  'Local follow-up or postponed date. Never alters the original Google Calendar event.';
