# Changelog

## v2.25.0 - Stabilizzazione tecnica

- Uniformato il login al client Supabase centrale `KYV.createSupabaseClient()`.
- Resa centralizzata in `kyv-auth.js` la protezione delle pagine operative: tutte le pagine che caricano il modulo richiedono una sessione valida, salvo esplicito opt-out.
- Aggiunto redirect `login.html?next=...` con validazione della destinazione per tornare alla pagina richiesta dopo l'accesso.
- Bloccata la versione di Lucide nella pagina login invece di usare `@latest`.
- Aggiunti controlli locali con `npm run check` per sintassi JavaScript e asset locali richiamati dagli HTML.

### Nota sicurezza

Questa release migliora la protezione lato applicazione, ma la sicurezza definitiva richiede la fase database: RLS Supabase, rimozione degli accessi anonimi e policy coerenti con il modello utenti reale.
