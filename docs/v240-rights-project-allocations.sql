-- KYVManagerPro v2.40: attribuzione MANUALE di bonifici SIAE/IMAIE ai singoli progetti.
-- Additiva, senza alterare fatture, diritti già registrati o progetti.
CREATE TABLE IF NOT EXISTS public."KYV_ATTRIBUZIONI_DIRITTI" (
 "ID_ATTRIBUZIONE" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 "ID_LIQUIDAZIONE" bigint NOT NULL REFERENCES public."KYV_LIQUIDAZIONI_DIRITTI"("ID_LIQUIDAZIONE") ON DELETE RESTRICT,
 "ID_PROGETTO" bigint NOT NULL REFERENCES public."PROGETTI"("ID") ON DELETE RESTRICT,
 "Importo" numeric(12,2) NOT NULL CHECK ("Importo" > 0),
 "Note" text CHECK (char_length("Note") <= 500),
 owner_id uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kyv_attrib_dir_owner_liq ON public."KYV_ATTRIBUZIONI_DIRITTI"(owner_id,"ID_LIQUIDAZIONE");
CREATE INDEX IF NOT EXISTS kyv_attrib_dir_owner_project ON public."KYV_ATTRIBUZIONI_DIRITTI"(owner_id,"ID_PROGETTO");

CREATE TABLE IF NOT EXISTS public."KYV_ATTRIBUZIONI_DIRITTI_STORNI" (
 "ID_STORNO" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 "ID_ATTRIBUZIONE" bigint NOT NULL UNIQUE REFERENCES public."KYV_ATTRIBUZIONI_DIRITTI"("ID_ATTRIBUZIONE") ON DELETE RESTRICT,
 "Motivo" text NOT NULL CHECK (char_length(btrim("Motivo")) BETWEEN 10 AND 500),
 owner_id uuid NOT NULL DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kyv_attr_storni_owner_idx ON public."KYV_ATTRIBUZIONI_DIRITTI_STORNI"(owner_id,"ID_ATTRIBUZIONE");

ALTER TABLE public."KYV_ATTRIBUZIONI_DIRITTI" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."KYV_ATTRIBUZIONI_DIRITTI_STORNI" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS kyv_attr_dir_select ON public."KYV_ATTRIBUZIONI_DIRITTI";
CREATE POLICY kyv_attr_dir_select ON public."KYV_ATTRIBUZIONI_DIRITTI"
 FOR SELECT TO authenticated USING (owner_id=(select auth.uid()));
DROP POLICY IF EXISTS kyv_attr_dir_insert ON public."KYV_ATTRIBUZIONI_DIRITTI";
CREATE POLICY kyv_attr_dir_insert ON public."KYV_ATTRIBUZIONI_DIRITTI"
 FOR INSERT TO authenticated WITH CHECK (owner_id=(select auth.uid()));
DROP POLICY IF EXISTS kyv_attr_storni_select ON public."KYV_ATTRIBUZIONI_DIRITTI_STORNI";
CREATE POLICY kyv_attr_storni_select ON public."KYV_ATTRIBUZIONI_DIRITTI_STORNI"
 FOR SELECT TO authenticated USING (owner_id=(select auth.uid()));
DROP POLICY IF EXISTS kyv_attr_storni_insert ON public."KYV_ATTRIBUZIONI_DIRITTI_STORNI";
CREATE POLICY kyv_attr_storni_insert ON public."KYV_ATTRIBUZIONI_DIRITTI_STORNI"
 FOR INSERT TO authenticated WITH CHECK (owner_id=(select auth.uid()));

-- Serializza gli inserimenti sulla liquidazione: impedisce assegnazioni > bonifico
-- anche da due browser che inseriscono contemporaneamente. SECURITY DEFINER
-- usato soltanto per bloccare il parent (la UI non ha UPDATE sul registro bonifici).
CREATE OR REPLACE FUNCTION public.kyv_guard_rights_allocation()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE v_owner uuid; v_net numeric(12,2); v_assigned numeric(12,2);
BEGIN
 v_owner := auth.uid();
 IF v_owner IS NULL OR NEW.owner_id IS DISTINCT FROM v_owner THEN
   RAISE EXCEPTION 'Proprietario non autorizzato';
 END IF;
 SELECT "ImportoNetto" INTO v_net FROM public."KYV_LIQUIDAZIONI_DIRITTI"
 WHERE "ID_LIQUIDAZIONE"=NEW."ID_LIQUIDAZIONE" AND owner_id=v_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Liquidazione non disponibile per questo utente'; END IF;
 PERFORM 1 FROM public."PROGETTI" WHERE "ID"=NEW."ID_PROGETTO" AND owner_id=v_owner;
 IF NOT FOUND THEN RAISE EXCEPTION 'Progetto non disponibile per questo utente'; END IF;
 SELECT coalesce(sum(a."Importo"),0) INTO v_assigned
 FROM public."KYV_ATTRIBUZIONI_DIRITTI" a
 WHERE a."ID_LIQUIDAZIONE"=NEW."ID_LIQUIDAZIONE" AND a.owner_id=v_owner
   AND NOT EXISTS (SELECT 1 FROM public."KYV_ATTRIBUZIONI_DIRITTI_STORNI" s
                   WHERE s."ID_ATTRIBUZIONE"=a."ID_ATTRIBUZIONE");
 IF v_assigned + NEW."Importo" > v_net THEN
   RAISE EXCEPTION 'Attribuzione eccede il netto della liquidazione: disponibile % euro',v_net-v_assigned;
 END IF;
 RETURN NEW;
END
$function$;
REVOKE ALL ON FUNCTION public.kyv_guard_rights_allocation() FROM PUBLIC;
DROP TRIGGER IF EXISTS kyv_guard_rights_allocation_insert ON public."KYV_ATTRIBUZIONI_DIRITTI";
CREATE TRIGGER kyv_guard_rights_allocation_insert BEFORE INSERT
 ON public."KYV_ATTRIBUZIONI_DIRITTI"
 FOR EACH ROW EXECUTE FUNCTION public.kyv_guard_rights_allocation();

CREATE OR REPLACE FUNCTION public.kyv_guard_rights_allocation_reversal()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $function$
DECLARE v_owner uuid; v_liq_id bigint;
BEGIN
 v_owner := auth.uid();
 IF v_owner IS NULL OR NEW.owner_id IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'Proprietario non autorizzato';
 END IF;
 SELECT a."ID_LIQUIDAZIONE" INTO v_liq_id
 FROM public."KYV_ATTRIBUZIONI_DIRITTI" a
 WHERE a."ID_ATTRIBUZIONE"=NEW."ID_ATTRIBUZIONE" AND a.owner_id=v_owner;
 IF NOT FOUND THEN RAISE EXCEPTION 'Attribuzione non disponibile'; END IF;
 PERFORM 1 FROM public."KYV_LIQUIDAZIONI_DIRITTI"
 WHERE "ID_LIQUIDAZIONE"=v_liq_id AND owner_id=v_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Liquidazione non disponibile'; END IF;
 RETURN NEW;
END
$function$;
REVOKE ALL ON FUNCTION public.kyv_guard_rights_allocation_reversal() FROM PUBLIC;
DROP TRIGGER IF EXISTS kyv_guard_rights_allocation_reversal_insert ON public."KYV_ATTRIBUZIONI_DIRITTI_STORNI";
CREATE TRIGGER kyv_guard_rights_allocation_reversal_insert BEFORE INSERT
 ON public."KYV_ATTRIBUZIONI_DIRITTI_STORNI"
 FOR EACH ROW EXECUTE FUNCTION public.kyv_guard_rights_allocation_reversal();

GRANT SELECT,INSERT ON public."KYV_ATTRIBUZIONI_DIRITTI" TO authenticated;
GRANT SELECT,INSERT ON public."KYV_ATTRIBUZIONI_DIRITTI_STORNI" TO authenticated;
COMMENT ON TABLE public."KYV_ATTRIBUZIONI_DIRITTI" IS 'Quote di bonifici SIAE/IMAIE attribuite manualmente ai progetti, non fatturato.';
COMMENT ON TABLE public."KYV_ATTRIBUZIONI_DIRITTI_STORNI" IS 'Storni append-only delle attribuzioni, originali conservati.';
