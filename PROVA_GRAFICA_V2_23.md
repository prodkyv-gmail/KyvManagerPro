# KYV Manager Pro v2.23 — Affidabilita archivio audio

## Obiettivo

Evitare duplicati e progetti incompleti quando un brano nasce da un file Google Drive o Dropbox, senza affrontare in questa versione il lavoro di autenticazione previsto per la v2.22.

## Modifiche principali

- Nuova migrazione `SUPABASE_MIGRATION_V2_23_AUDIO_VERSIONI.sql`.
- Tabella unica `AUDIO_VERSIONI` per Drive, Dropbox e future sorgenti.
- Chiave univoca `DEDUPE_KEY` basata su provider, identificativo, revisione, hash o link.
- Recupero non distruttivo dei record già presenti in `DROPBOX_AUDIO_FILES` e `DOCUMENTI_PROGETTO`.
- Funzione `kyv_salva_audio_v23` con `security invoker`: progetto e prima versione vengono salvati nella stessa transazione.
- Specchio automatico nelle tabelle precedenti, così Scheda Progetto, Dropbox e gli altri moduli continuano a funzionare.
- Riconoscimento distinto dello stesso file cloud con una revisione successiva.
- Blocco di ricerca e inserimento quando uno degli archivi obbligatori non è leggibile.
- Modalità compatibilità esplicita quando la migrazione non è ancora installata.
- Creazione combinata di progetto e versione disabilitata in modalità compatibilità: nessun progetto orfano viene creato.
- Conteggio finale per l'inserimento multiplo con operazioni completate, annullate o non riuscite.
- Guida contestuale e manuale aggiornati.

## Installazione Supabase

1. Creare un backup dal modulo Import / Export.
2. Aprire il SQL Editor del progetto Supabase corretto.
3. Incollare ed eseguire `SUPABASE_MIGRATION_V2_23_AUDIO_VERSIONI.sql`.
4. Verificare che la transazione termini senza errori.
5. Ricaricare `archivio_musicale.html`.
6. Controllare il messaggio verde “Controllo duplicati v2.23 attivo”.

Lo script non elimina né rinomina tabelle o colonne. Se una parte fallisce, il `BEGIN/COMMIT` evita una migrazione parziale.

## Scenari da verificare con dati reali

1. Cercare un file Drive già archiviato e verificare lo stato “Già inserito”.
2. Modificare o sostituire quel file e verificare “Nuova revisione”.
3. Collegare una nuova versione a un progetto esistente e controllare sia `AUDIO_VERSIONI` sia la Scheda Progetto.
4. Creare un nuovo progetto da un file e verificare che progetto e versione risultino entrambi presenti.
5. Ripetere l'inserimento dello stesso file e verificare che non venga creato un secondo record con la stessa `DEDUPE_KEY`.
6. Simulare un errore di lettura di una tabella di confronto e verificare che ricerca, Dropbox e inserimenti risultino disabilitati.

## Compatibilità e limite noto

La v2.22 è intenzionalmente sospesa. Le policy RLS denominate `kyv_v223_compat_*` mantengono temporaneamente l'accesso anonimo usato dall'app corrente e non rappresentano il modello di sicurezza definitivo. Non sono state applicate automaticamente al database reale: la migrazione deve essere eseguita e verificata manualmente.

## Controlli tecnici eseguiti

- sintassi dei file JavaScript;
- sintassi degli script inline HTML;
- riferimenti locali tra pagine e risorse;
- presenza della migrazione, della funzione transazionale, della chiave univoca e delle policy RLS;
- apertura delle pagine principali tramite server HTTP locale;
- creazione e controllo del pacchetto ZIP di consegna.
