-- KyvManagerPro v2.10.5 - Piano fiscale semplice con diritti d'autore/correlati
-- Esecuzione consigliata in Supabase SQL Editor.
-- Non cancella dati: aggiunge solo colonne opzionali a PIANI_FISCALI.

alter table public."PIANI_FISCALI"
  add column if not exists "Diritti_Autore_Correlati_Lordi" numeric null,
  add column if not exists "Percentuale_Diritti_Autore" numeric null default 60,
  add column if not exists "Diritti_Autore_Tassati_60" numeric null,
  add column if not exists "Reddito_Attivita_67" numeric null,
  add column if not exists "Reddito_Lordo_Fiscale" numeric null,
  add column if not exists "Aliquota_Imposta_Sostitutiva" numeric null,
  add column if not exists "Aliquota_INPS_Stimata" numeric null default 17.90,
  add column if not exists "INPS_Versata_Deducibile" numeric null,
  add column if not exists "Base_INPS_Stimata" numeric null;

create index if not exists "idx_piani_fiscali_anno" on public."PIANI_FISCALI" ("Anno");
