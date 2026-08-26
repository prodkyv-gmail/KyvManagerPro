-- KyvManagerPro v2.10.3
-- Piano Fiscale semplice: fatture per anno + CU/CUD diritti d'autore manuali + INPS/acconti/saldi.
-- Non cancella dati esistenti. Tutti i campi sono opzionali.

alter table if exists public."PIANI_FISCALI"
  add column if not exists "Ricavi_Fatture_Automatici" numeric null,
  add column if not exists "Rettifica_Ricavi_Fatture" numeric null,
  add column if not exists "Ricavi_Forfetario_Manuali" numeric null,
  add column if not exists "Coefficiente_Redditivita" numeric null default 67,
  add column if not exists "CU_Diritti_Autore_JSON" jsonb null,
  add column if not exists "CU_DA_Lordo" numeric null,
  add column if not exists "CU_DA_Non_Soggetto" numeric null,
  add column if not exists "CU_DA_Imponibile" numeric null,
  add column if not exists "CU_DA_Ritenute" numeric null,
  add column if not exists "Diritti_Autore_CUD" numeric null,
  add column if not exists "Ritenute_CU_Diritto_Autore" numeric null,
  add column if not exists "Contributi_INPS_Stimati" numeric null,
  add column if not exists "Contributi_Previdenziali_Versati" numeric null,
  add column if not exists "Aliquota_Imposta_Sostitutiva" numeric null default 5,
  add column if not exists "Aliquota_INPS_GS" numeric null default 26.07,
  add column if not exists "Acconti_Imposta_Versati" numeric null,
  add column if not exists "Acconti_INPS_Versati" numeric null,
  add column if not exists "Saldo_Imposta" numeric null,
  add column if not exists "Saldo_INPS" numeric null,
  add column if not exists "Acconto_Imposta_Giugno" numeric null,
  add column if not exists "Acconto_Imposta_Novembre" numeric null,
  add column if not exists "Acconto_INPS_Giugno" numeric null,
  add column if not exists "Acconto_INPS_Novembre" numeric null,
  add column if not exists "Note_Fiscali" text null,
  add column if not exists "Metodo_Calcolo" text null;
