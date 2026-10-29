-- KYVManagerPro v2.36 — riconciliazione e incassi parziali.
-- Applicata con Supabase MCP il 29/10/2026.
-- Solo nuove colonne/tabelle; nessuna modifica alle 107 fatture storiche.
ALTER TABLE public."FATTURE"
  ADD COLUMN IF NOT EXISTS "DataScadenzaPagamento" date;

CREATE TABLE IF NOT EXISTS public."FATTURE_INCASSI" (
  "ID_INCASSO" bigint generated always as identity primary key,
  "ID_FT" bigint not null references public."FATTURE"("ID_FT") on delete restrict,
  "Data" date not null,
  "Importo" numeric(12,2) not null check ("Importo" > 0),
  "Note" text,
  "owner_id" uuid not null default auth.uid(),
  "created_at" timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS fatture_incassi_owner_invoice_idx
  ON public."FATTURE_INCASSI" (owner_id, "ID_FT", "Data" DESC);

ALTER TABLE public."FATTURE_INCASSI" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kyv_invoice_payments_select ON public."FATTURE_INCASSI";
CREATE POLICY kyv_invoice_payments_select ON public."FATTURE_INCASSI"
FOR SELECT TO authenticated USING ((select auth.uid()) = owner_id);
DROP POLICY IF EXISTS kyv_invoice_payments_insert ON public."FATTURE_INCASSI";
CREATE POLICY kyv_invoice_payments_insert ON public."FATTURE_INCASSI"
FOR INSERT TO authenticated WITH CHECK (
  (select auth.uid()) = owner_id
  AND EXISTS (
    SELECT 1 FROM public."FATTURE" i
    WHERE i."ID_FT" = "FATTURE_INCASSI"."ID_FT"
      AND i.owner_id = (select auth.uid())
  )
);
-- Nessun UPDATE o DELETE sugli incassi: registro append-only.
GRANT SELECT, INSERT ON public."FATTURE_INCASSI" TO authenticated;
COMMENT ON TABLE public."FATTURE_INCASSI" IS 'Registro immutabile dei nuovi incassi confermati dall utente; per le fatture storiche vale PAGATA se non esistono righe.';
COMMENT ON COLUMN public."FATTURE"."DataScadenzaPagamento" IS 'Scadenza incasso inserita esplicitamente, non inferita dalla data emissione.';
