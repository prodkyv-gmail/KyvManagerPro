-- KyvManagerPro v2.10.1 - Piano Fiscale: Quadro LM + registro CU diritti d'autore
-- Eseguire in Supabase SQL editor. Migrazione non distruttiva: aggiunge solo colonne se mancanti.

alter table public."PIANI_FISCALI"
  add column if not exists "Ricavi_Forfetario_Manuali" numeric(14,2),
  add column if not exists "Diritti_Autore_CUD" numeric(14,2),
  add column if not exists "Base_Diritti_Autore_LM" numeric(14,2),
  add column if not exists "Lordo_CU_Diritti_Autore" numeric(14,2),
  add column if not exists "Non_Soggetto_CU_Diritti_Autore" numeric(14,2),
  add column if not exists "Imponibile_CU_Diritti_Autore" numeric(14,2),
  add column if not exists "Ritenute_CU_Diritto_Autore" numeric(14,2),
  add column if not exists "CU_Diritti_Autore_JSON" jsonb default '[]'::jsonb,
  add column if not exists "Coefficiente_Redditivita" numeric(6,2),
  add column if not exists "Percentuale_Imponibile_DA" numeric(6,2),
  add column if not exists "Contributi_Previdenziali_Versati" numeric(14,2),
  add column if not exists "Aliquota_Imposta_Sostitutiva" numeric(6,2),
  add column if not exists "Eccedenza_Imposta_Precedente" numeric(14,2),
  add column if not exists "Eccedenza_Imposta_Compensata_F24" numeric(14,2),
  add column if not exists "Acconti_Imposta_Versati" numeric(14,2),
  add column if not exists "Aliquota_INPS_GS" numeric(6,2),
  add column if not exists "Reddito_Lordo_Forfetario" numeric(14,2),
  add column if not exists "Reddito_Imponibile_DA" numeric(14,2),
  add column if not exists "Reddito_Lordo_Totale" numeric(14,2),
  add column if not exists "Differenza_LM42" numeric(14,2),
  add column if not exists "Imposta_A_Debito" numeric(14,2),
  add column if not exists "Imposta_A_Credito" numeric(14,2),
  add column if not exists "Contributi_INPS_Stimati" numeric(14,2),
  add column if not exists "Metodo_Calcolo" text,
  add column if not exists "Note_Fiscali" text;
