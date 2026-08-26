# KYV Manager Pro v2.21 — Archivio Musicale

## Obiettivo

Cercare file musicali su richiesta, mostrarli prima di qualsiasi inserimento e riconoscere ciò che è già collegato ai progetti.

## Funzioni introdotte

- Nuova pagina `archivio_musicale.html` nella navigazione principale.
- Ricerca manuale nei Drive configurati tramite il collegamento Apps Script esistente.
- Selezione multipla dei file Dropbox tramite Dropbox Chooser.
- Confronto con `PROGETTI`, `DROPBOX_AUDIO_FILES` e documenti `AUDIO_DRIVE`.
- Quattro stati: Già inserito, Nuova versione, Da verificare, Nuovo brano.
- Rilevazione tramite identificativo del provider, link, hash e nome file.
- Segnalazione dei file Drive modificati dopo la precedente archiviazione.
- Filtri per stato, ricerca testuale e riepilogo numerico cliccabile.
- Selezione multipla e inserimento controllato.
- Scelta esplicita del progetto prima del collegamento.
- I suggerimenti basati sul titolo non producono collegamenti automatici.
- Identificativo Drive/Dropbox registrato nelle note dei nuovi file per migliorare i confronti futuri.
- Guida contestuale dedicata.

## Compatibilità

La versione riutilizza le tabelle esistenti. Non crea nuove tabelle, non modifica lo schema e non esegue operazioni distruttive.

## Prova consigliata

1. Aprire Archivio Musicale.
2. Cercare gli audio su un Drive configurato.
3. Controllare che i file già archiviati risultino non selezionabili.
4. Scegliere più file Dropbox e verificare la classificazione.
5. Collegare una nuova versione a un progetto esistente.
6. Aprire la Scheda Progetto e verificare la presenza della versione.
