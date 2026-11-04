# v2.80 — Collaudo Audio Finder (Mac/PC, smartphone, Drive, Dropbox, OneDrive)

## File locali e dispositivi
1. Da PWA v2.80 apri **Audio Finder → Aggiungi audio**. Leggi il pannello Stato sorgenti. Verifica che distingua le funzionalità configurate da autorizzazioni realmente ottenute.
2. Su Mac/PC scegli una cartella contenente brani .wav/.mp3 e file non audio. Il selettore deve riportare file riconosciuti e ignorati, progresso dei metadati e la coda di revisione. Non vengono caricati byte audio; verificare che non partano salvataggi automatici.
3. Seleziona soltanto file .txt o nulla: la coda precedente non deve essere cancellata. Seleziona di nuovo lo stesso file/cartella e verifica che il browser consenta l'evento change.
4. Su iPhone/Android scegli manualmente dalla app File. Se il selettore Cartella non funziona, usa il selettore File. L'app non scansiona automaticamente tutti i file del telefono.
5. Seleziona più di 5.000 elementi: compare l'avviso di limite, senza elaborazione.

## Consenso e copertura
6. Classifica nella coda un file come Mio ma non salvare. Prova a scegliere una nuova cartella: appare la conferma prima della lettura; premi Annulla e verifica che la classificazione rimanga. Ripeti con Drive/Dropbox e OneDrive (quando disponibili).
7. Il riepilogo Copertura effettiva deve contare le identità sorgente selezionate, non ogni cloud o dispositivo. Due file con lo stesso nome in account differenti devono rimanere distinti.
8. Conferma Mio/Reference/Da verificare e premi Salva, controllando la richiesta di conferma già presente. Verifica che i nuovi file non creino o associno automaticamente progetti.
9. Dall'elenco dei file approvati verifica un suggerimento di collegamento; il progetto deve essere scelto e l'associazione confermata. Le reference non devono comparire in Esplora i miei brani.

## Provider e restrizioni
10. Drive: prova un account configurato e verifica le avvertenze di lettura incompleta. Dropbox: prova l'archivio, il Chooser oppure OAuth solo se configurati.
11. OneDrive: se non è configurato o manca la migrazione, l'anteprima autorizzata non deve poter salvare l'indice. Usa la selezione locale dei file sincronizzati come alternativa.
12. Verifica ricerca, filtri, gruppo versioni, audio preview temporaneo, riproduzione e cancellazione dei riferimenti temporanei alla chiusura della pagina.

I test GitHub coprono strutture e funzioni pure ma non simulano login, consenso OAuth né l'effettivo contenuto di PC/cloud. Il browser può limitare selezione cartella o riproduzione a seconda della piattaforma.
