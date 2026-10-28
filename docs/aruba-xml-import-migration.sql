-- KYVManagerPro: importatore FatturaPA XML Aruba (additivo, idempotente).
-- Già applicato via Supabase MCP il 28/10/2026.
-- Non modifica fatture storiche, owner_id, ID_FT o ID_PROGETTO.
alter table public."FATTURE"
    add column if not exists "Numero_Originale" text,
    add column if not exists "XML_SHA256" text;

create unique index if not exists "fatture_owner_xml_sha256_unique"
    on public."FATTURE"(owner_id, "XML_SHA256")
    where "XML_SHA256" is not null;

comment on column public."FATTURE"."Numero_Originale"
    is 'Numero esatto della fattura elettronica XML (per esempio FPR 14/26).';
comment on column public."FATTURE"."XML_SHA256"
    is 'Impronta SHA-256 esadecimale del file XML Aruba importato; non include il contenuto del file.';
