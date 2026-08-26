-- KyvManagerPro v2.9.5 - Follow-up operativo e collegamento spese/progetto
-- Esecuzione opzionale ma consigliata in Supabase SQL Editor.

alter table public."PROGETTI"
  add column if not exists "Prossimo_Followup" date null,
  add column if not exists "Ultimo_Sollecito" date null,
  add column if not exists "Esito_Ascolto" text null,
  add column if not exists "Priorita_Followup" text null,
  add column if not exists "Note_Followup" text null;

alter table public."Spese Extra"
  add column if not exists "ID_PROGETTO" bigint null;

create index if not exists "idx_progetti_prossimo_followup" on public."PROGETTI" ("Prossimo_Followup");
create index if not exists "idx_spese_extra_id_progetto" on public."Spese Extra" ("ID_PROGETTO");
