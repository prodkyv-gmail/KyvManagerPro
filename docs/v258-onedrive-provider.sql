-- KYVManager Pro v2.58 — optional, additive provider enablement.
-- RUN MANUALLY ONLY after backup/verification of original v2.45/v2.48 constraints.
-- Does not touch user rows, historical relationships, RLS policies, or indexes.
-- Required ONLY to save approved OneDrive metadata. Dropbox uses the existing provider.
begin;
do $$
begin
 if not exists(select 1 from pg_constraint
  where conrelid='public."KYV_AUDIO_INDICE"'::regclass and conname='kyv_audio_indice_provider_v258') then
  if not exists(select 1 from pg_constraint where
   conrelid='public."KYV_AUDIO_INDICE"'::regclass and conname='KYV_AUDIO_INDICE_provider_check') then
   raise exception 'Unknown KYV_AUDIO_INDICE provider constraint. Review database schema manually.';
  end if;
  alter table public."KYV_AUDIO_INDICE" drop constraint "KYV_AUDIO_INDICE_provider_check";
  alter table public."KYV_AUDIO_INDICE" add constraint kyv_audio_indice_provider_v258
   check(provider in ('local','drive','dropbox','onedrive')) not valid;
  alter table public."KYV_AUDIO_INDICE" validate constraint kyv_audio_indice_provider_v258;
 end if;
 if not exists(select 1 from pg_constraint
  where conrelid='public."KYV_AUDIO_DECISIONI"'::regclass and conname='kyv_audio_decisioni_provider_v258') then
  if not exists(select 1 from pg_constraint where
   conrelid='public."KYV_AUDIO_DECISIONI"'::regclass and conname='KYV_AUDIO_DECISIONI_provider_check') then
   raise exception 'Unknown KYV_AUDIO_DECISIONI provider constraint. Review database schema manually.';
  end if;
  alter table public."KYV_AUDIO_DECISIONI" drop constraint "KYV_AUDIO_DECISIONI_provider_check";
  alter table public."KYV_AUDIO_DECISIONI" add constraint kyv_audio_decisioni_provider_v258
   check(provider in ('local','drive','dropbox','onedrive')) not valid;
  alter table public."KYV_AUDIO_DECISIONI" validate constraint kyv_audio_decisioni_provider_v258;
 end if;
end $$;
commit;

-- Verify afterward:
-- select conname, pg_get_constraintdef(oid) from pg_constraint
-- where conrelid in ('public."KYV_AUDIO_INDICE"'::regclass,
--                   'public."KYV_AUDIO_DECISIONI"'::regclass)
--   and conname like '%provider%';
-- Only after successful verification and Microsoft OAuth setup,
-- set KYV_CONFIG.ONEDRIVE_INDEX_ENABLED = true.
