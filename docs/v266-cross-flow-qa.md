# KYVManagerPro v2.66 — collaudo funzionale autenticato

Stato: **da verificare sull'app installata/autenticata**. I test Node/GitHub Actions sono mock e controlli statici; non provano un browser con dati reali. Non eseguire interventi su Vercel senza richiesta.

1. Desktop: entra con account autorizzato; verifica che Home, Progetti, Scheda, Scrivania creativa, Audio Finder, Economia e Studio Editor aprano una sola vista coerente, senza menu duplicati.
2. Mobile/PWA: verifica navigazione inferiore, apertura e chiusura della guida, ricerca, tabelle e pannelli richiudibili; controlla focus e scorrimento.
3. Premi Cerca (oppure Cmd/Ctrl+K), digita un progetto esistente, aprilo e verifica scheda corrispondente.
4. Ripeti con una fattura legata a un progetto, un invio e una versione: controllo dei tab e delle sezioni di destinazione.
5. Digita durante il primo caricamento: non deve comparire “0 risultati verificati”. Interrompi la connessione (solo in ambiente di prova): compare errore e Riprova.
6. Torna online e premi Riprova; il risultato deve essere coerente e completo, non mescolato con il vecchio.
7. Modifica un titolo tramite Record Editor; dopo salvataggio riuscito riapri Cerca e verifica il nuovo titolo. In caso di modifica da un'altra pagina usa Aggiorna.
8. Annulla una modifica all'Editor o una conferma relazione: non deve esserci alcun cambiamento.
9. Chiudi la scheda e riapri l'app: nessun titolo recente privato deve essere mantenuto fra pagine o account diversi.
10. Prova dalla sorgente audio autorizzata un brano personale e una reference: solo il primo può essere proposto, mai creato/associato senza scelta e conferma.
11. Seleziona un progetto manualmente, verifica doppioni, versioni, sorgente e conferma finale. Se annulli non deve essere creato un nuovo progetto.
12. Fatture: controlla Incassata/PAGATA vs incasso riconciliato, PrezzoUnitario, ripartizioni; non devono cambiare come conseguenza della UI.
13. Controlla dati reali SIAE/IMAIE: importi, segni e rapporti non devono essere modificati.
14. Offline/PWA: riapri dopo refresh della cache, verifica la versione mostrata 2.66; non utilizzare la cache per le richieste API.
15. Documenta qui eventuali problemi con schermata, azione, risultato atteso, risultato osservato e log console (senza credenziali).

Riferimento automatico: `npm run check` + `node tools/test-cross-flow-v266.js`.

## Registro esito collaudo manuale
Compilare soltanto dopo una prova autenticata: data, dispositivo/browser, versione PWA visualizzata, funzione, esito e passi per riprodurre eventuali problemi. Non includere credenziali o contenuti audio privati.
