-- v2.84 · Progetti: «Archivia» senza cancellare.
-- Modifica DB additiva e reversibile: una colonna nullable. Nessun dato esistente viene toccato.
-- Le policy RLS esistenti su PROGETTI (kyv_owner_select/insert/update/delete per authenticated) coprono già la colonna.
-- Annullare: alter table public."PROGETTI" drop column "Archiviato_Il";  (solo se nessun progetto è stato archiviato, altrimenti si perde la data)
alter table public."PROGETTI" add column if not exists "Archiviato_Il" timestamptz null;
comment on column public."PROGETTI"."Archiviato_Il" is 'Quando il progetto è stato archiviato dall utente (NULL = attivo). Nasconde dalle liste di Progetti, non cancella nulla.';
create index if not exists idx_progetti_archiviato_il on public."PROGETTI" ("Archiviato_Il");
