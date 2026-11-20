# Collaudo documentazione corrente KYV · 20 novembre 2026

## Scopo
La revisione aggiorna soltanto il manuale completo, la guida contestuale e i manuali Markdown alle funzioni **già pubblicate**, senza cambiare interfaccia, JavaScript funzionale, Supabase, dati storici, diritti o incassi.

## Taccuino, Cattura veloce e Home
1. Apri `index.html`: **+ Note** compare immediatamente prima di **Agenda** e apre la cattura rapida senza abbandonare la Home. Il pulsante fluttuante **+ Nota** delle pagine principali ha lo stesso comportamento.
2. La guida **?** di Home (`home`) spiega categoria, dettatura solo se supportata, memo vocali 5 minuti / 20 MB, nessuna trascrizione automatica e copia di sicurezza quando l'upload fallisce.
3. Apri `kyv_notes.html`: conferma che vedi un **elenco**, con titolo, descrizione, data, matita e cestino, ricerca e Nuova nota. **Non** cercare qui pennino, timeline, filtri avanzati o conversione automatica in attività: sono stati tolti dall'interfaccia semplificata.
4. Modifica una nota e controlla che il popup mostri soltanto Titolo e Descrizione, Salva/Annulla. Se esistono contenuti storici, il loro accesso è in **Contenuti già salvati**. La guida **?** (`notes`) non deve presentare controlli rimossi come disponibili.
5. La cancellazione chiede conferma e può rimuovere contenuti associati. La sola bozza locale non vale come salvataggio cloud.

## Agenda
6. Apri `kyv_calendar.html`: **Aggiorna agenda** deve utilizzare Google Apps Script configurato; verifica vista e cronologia. La guida **?** (`calendar`) deve distinguere il salvataggio in Agenda KYV da Google Calendar.
7. Espandi **Archivio locale · Importa appuntamenti da un file**: scegli un `.ics` o `.csv` di massimo 2 MB / 500 eventi; CSV con colonne Titolo e Data. Verifica anteprima, date, eventuali fusi e selezione delle singole righe, poi il comando **Importa selezionati nell'Agenda KYV** con conferma.
8. Un'importazione locale non deve essere descritta come scrittura automatica in Google Calendar. Lo stesso file importato nuovamente deve segnalare già presenti/duplicati; se l'esito è incerto, prima controlla l'archivio.

## ADD Progetto e audio
9. Apri `acquisisci_audio.html` e la guida **?** (`nuovo`). Nel pannello **Hai già un file o un link?** devono risultare Apri Drive, Apri Dropbox e Archivio locale.
10. Per Drive/Dropbox si inserisce un link del singolo audio; per Archivio locale si sceglie un **file audio reale** MP3/WAV/M4A/AIFF/FLAC/AAC/OGG/OPUS massimo 50 MB, poi progetto, controllo SHA-256, importazione esplicita.
11. Le guide di Audio Finder (`audiofinder`) e delle sorgenti Drive/Dropbox devono chiarire che la scansione guidata di metadati non è lo stesso flusso dell'upload reale privato e non assegna un progetto automaticamente.

## Studio Editor
12. Apri `editor.html`: in alto **Progetti, Fatture, Estratto SIAE, IMAIE**, poi **Altre tabelle**. Verifica ordinamento iniziale decrescente per data quando disponibile e fallback ID.
13. I filtri contestuali di **Mostra**, le righe **60/120/240**, **Azzera filtri** e la scelta Essenziale/Completa dei Progetti devono essere descritti nella guida corrente. Non affermare che un'etichetta Incasso da verificare dimostra un pagamento.
14. **Colonne** e **Esporta CSV** non devono essere presentati come azioni che cancellano righe; ricerca ed esportazione operano sui dati verificati.

## Livelli della documentazione e rilascio
15. Controlla `guida.html#guida-aggiornamenti-20261120` e gli altri capitoli correnti. Le istruzioni nuove compaiono **prima** dello storico v2.82/v2.73.
16. Controlla Home, Taccuino, Agenda, Nuovo progetto, Editor e Audio Finder nei popup **?**, oltre a `README.md`, `MANUALE_OPERATIVO.md`, `docs/MANUALE_PRATICO_V273.md` e al registro `docs/GUIDE_SYNC_POLICY.md`.
17. Esegui `npm run check` in CI, verifica cache PWA aggiornata e deployment Vercel. L'esecuzione CI **non** prova da sola il browser autenticato su iPhone o Mac, né i permessi di microfono, Drive, Dropbox e file locali.

**Note:** nessuna migrazione SQL o modifica di schema è richiesta per il solo aggiornamento della documentazione.
