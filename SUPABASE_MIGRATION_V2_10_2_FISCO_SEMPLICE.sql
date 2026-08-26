-- KyvManagerPro v2.10.2 - Piano Fiscale semplice con dati CU/CUD diritti d'autore
-- Eseguire in Supabase SQL Editor. Non cancella dati esistenti.

alter table public."PIANI_FISCALI"
add column if not exists "Ricavi_Forfetario_Manuali" numeric null,
add column if not exists "Coefficiente_Redditivita" numeric null,
add column if not exists "CU_Diritti_Autore_JSON" jsonb null,
add column if not exists "CU_DA_Lordo" numeric null,
add column if not exists "CU_DA_Non_Soggetto" numeric null,
add column if not exists "CU_DA_Imponibile" numeric null,
add column if not exists "CU_DA_Ritenute" numeric null,
add column if not exists "Diritti_Autore_CUD" numeric null,
add column if not exists "Ritenute_CU_Diritto_Autore" numeric null,
add column if not exists "Percentuale_Imponibile_DA" numeric null,
add column if not exists "Contributi_Previdenziali_Versati" numeric null,
add column if not exists "Aliquota_Imposta_Sostitutiva" numeric null,
add column if not exists "Aliquota_INPS_GS" numeric null,
add column if not exists "Eccedenza_Imposta_Precedente" numeric null,
add column if not exists "Eccedenza_Imposta_Compensata_F24" numeric null,
add column if not exists "Acconti_Imposta_Versati" numeric null,
add column if not exists "Imposta_A_Debito" numeric null,
add column if not exists "Imposta_A_Credito" numeric null,
add column if not exists "Metodo_Calcolo" text null,
add column if not exists "Note_Fiscali" text null;

create index if not exists "idx_piani_fiscali_anno" on public."PIANI_FISCALI" ("Anno");
