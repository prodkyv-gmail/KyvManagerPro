# Changelog

## v2.31.0 - Scheda Progetto 2.0

- Ricomposta la Scheda Progetto in un flusso producer-first unico: header compatto, prossima azione, Versioni, Invii & Follow-up, Release Desk e Timeline.
- Le versioni usano `AUDIO_VERSIONI` con fallback compatibile ai file storici e vengono ordinate dalla più recente, distinguendo demo, revisioni e finali.
- Ogni nuovo invio registra la versione scelta dentro `INVII_AUDIO`; gli esiti operativi sono In attesa, Interessato, Da revisionare e Chiuso / non interessato.
- Confermata la regola automatica del follow-up dopo 5 giorni senza attività, visibile nella scheda e nell’Agenda.
- Mantenuti gli 8 controlli Release Desk già esistenti e portati nel flusso principale della scheda.
- Aggiunta una timeline unica ricostruita dai dati esistenti, senza nuove tabelle o migrazioni Supabase.
- Aggiornata la cache PWA e aggiunti controlli automatici dedicati alla Scheda Progetto 2.0 e alla non regressione della pagina Progetti.

## v2.28.0 - Pipeline & Opportunità

- Aggiunta la nuova pagina `pipeline.html` con vista kanban dei progetti nelle fasi Idea, Sessione, Inviato, In ascolto, Interessamento, Contratto, Produzione, Master e Uscito.
- La fase viene calcolata dai campi già presenti in `PROGETTI` senza sovrascrivere `STATO` o `SVILUPPO`, preservando diciture storiche e note operative.
- Aggiunti filtri per artista, label/management, priorità e follow-up, ricerca testuale e filtro per singola fase.
- Le card sono ordinate per urgenza e mostrano follow-up scaduti/imminenti, priorità, partner e accesso diretto alla Scheda Progetto.
- Aggiunto riepilogo con progetti visibili, attivi, follow-up nei prossimi 7 giorni e follow-up scaduti.
- Inserita la voce **Pipeline** nella navigazione globale e resa visibile in tutta l'app la versione corrente **Manager Pro 2.28**.
- Aggiornato `package.json` a `2.28.0` e la cache PWA a `kyv-studio-v2-28-pipeline-opportunita`.
- Nessuna nuova tabella e nessuna migrazione Supabase; la pagina usa il client centrale e resta compatibile con RLS.

## v2.27.0 - Scheda Progetto evoluta

- Aggiunto il modulo `kyv-project-hub-v227.js`, caricato soltanto nella Scheda Progetto.
- Inserito un blocco **Prossima azione** che usa follow-up, sessione, contratto, master, fatture, incassi e release per suggerire il prossimo passaggio operativo.
- Aggiunto editor rapido del follow-up direttamente nella scheda con `Prossimo_Followup`, `Priorita_Followup`, `Esito_Ascolto`, `Note_Followup` e opzione per registrare `Ultimo_Sollecito`.
- Aggiunto riepilogo economico del singolo progetto: fatturato, incassato, da incassare e spese collegate.
- Aggiunta timeline unica che aggrega sessioni, contratti, master, follow-up, pubblicazione, fatture, documenti, audio e invii.
- Aggiunte azioni rapide verso Ascolto, Audio, Documenti, Spese e Fatture mantenendo il contesto del progetto.
- Nessuna nuova tabella e nessuna migrazione Supabase: il modulo usa le tabelle esistenti ed è compatibile con la RLS v2.25.

## v2.26.0 - Centro operativo

- Integrati nella coda della Panoramica i follow-up presenti in `PROGETTI`, usando `Prossimo_Followup`, `Priorita_Followup`, `Ultimo_Sollecito`, `Esito_Ascolto` e `Note_Followup`.
- Aggiunti filtro Follow-up, ordinamento per scadenza e priorità, collegamento diretto alla Scheda Progetto e riepilogo dedicato nello Stato operativo.
- Rimossi URL e chiavi Supabase legacy dalle pagine: il browser usa unicamente `KYV.createSupabaseClient()` e `KYV_CONFIG`, mantenendo sessione e JWT necessari alle policy RLS.
- Nessuna modifica allo schema Supabase e nessuna nuova migrazione.

## v2.25.0 - Stabilizzazione tecnica

- Uniformato il login al client Supabase centrale `KYV.createSupabaseClient()`.
- Resa centralizzata in `kyv-auth.js` la protezione delle pagine operative: tutte le pagine che caricano il modulo richiedono una sessione valida, salvo esplicito opt-out.
- Aggiunto redirect `login.html?next=...` con validazione della destinazione per tornare alla pagina richiesta dopo l'accesso.
- Bloccata la versione di Lucide nella pagina login invece di usare `@latest`.
- Aggiunti controlli locali con `npm run check` per sintassi JavaScript e asset locali richiamati dagli HTML.

### Nota sicurezza

Questa release migliora la protezione lato applicazione, ma la sicurezza definitiva richiede la fase database: RLS Supabase, rimozione degli accessi anonimi e policy coerenti con il modello utenti reale.
