# KYV – Importazione manuale assistita (MVP, branch v2.29)

## Obiettivo
Partire dal singolo file scelto manualmente in Google Drive o Dropbox, evitando scansioni massive che possono scadere per timeout. `acquisisci_audio.html` è il percorso principale di acquisizione; `archivio_musicale.html` conserva selettore Dropbox e ricerca avanzata senza rimozione.

## Flusso implementato
1. Aprire Drive o Dropbox nell'interfaccia originale e copiare il link di **un file**.
2. Incollare link HTTPS e inserire nome file; confermare che è audio. Titolo, artista, tipo, versione e data originale sono modificabili e non vengono inventati. Un link da solo NON consente di ricavare automaticamente metadati affidabili.
3. Premere «Controlla file e progetti»: la pagina carica esclusivamente, con sessione Supabase autenticata e RLS, `PROGETTI`, `AUDIO_VERSIONI`, `DROPBOX_AUDIO_FILES` e `DOCUMENTI_PROGETTO` e blocca il salvataggio se una lettura fallisce.
4. Duplicato esatto: stesso ID Drive oppure link cloud canonico, nessuna scrittura e collegamento al progetto quando noto.
5. Corrispondenza di titolo/artista: mostra i progetti candidati, mai associazione automatica.
6. L'utente sceglie esplicitamente un progetto o «Crea un nuovo progetto», poi conferma; prima del salvataggio i dati sono riletti e il controllo duplicati ripetuto.
7. Salvataggio delegato al modulo esistente `KYV_AUDIO_PROJECT` e alla RPC `kyv_salva_audio_v23`, senza secondo archivio, nuove tabelle o migrazioni. La sessione e la RLS restano obbligatorie.

## Cosa non è implementato
- Nessuna lettura dei metadati attraverso il link senza OAuth/Picker. Nome, tipo e data inseriti manualmente sono dichiarazioni dell'utente; la data di sessione resta separata.
- Nessuna scansione Drive/Dropbox nel nuovo percorso.
- Nessuna modifica ai permessi di condivisione dei file, né caricamento/copia di file audio nell'app.
- Nessuna attività, evento Calendar, invio email o follow-up creato automaticamente.
- Lo script Apps Script storico resta separato e presenta ancora limiti di accesso pubblico, indipendenti da questo MVP.

## Test
`npm run check` include test di parsing link Drive/Dropbox, rifiuto cartelle, confronto ID/link cloud e suggerimenti progetto (`tools/test-manual-intake.js`). Verificare la pagina su Vercel preview con un login valido, inclusi link già presenti, link nuovi, annullamento modal, errore RLS e nuovo progetto. Non fare merge se il test autenticato non passa.

## Sviluppi successivi
Google Picker/Dropbox Chooser mirati, recupero metadati via API autorizzata, ricerca progetti lato server quando il numero aumenta, successiva azione suggerita ma confermata. Verificare separatamente la sicurezza degli Apps Script pubblici e il comportamento del service worker PWA prima del rilascio.
