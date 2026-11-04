# KYVManagerPro v2.70 — Collaudo grafico e funzionale

Check automatici su codice, senza richiesta al database di produzione e senza Vercel.

1. Aprire una Scheda progetto con `id` valido: il percorso deve avere quattro link **Scheda, Sessioni, Audio, Fatture** e conservare l'ID scelto su ognuno.
2. Dopo il caricamento delle fatture collegate, dentro l'unico link Fatture deve comparire un'etichetta sintetica: incassata, da incassare, nessuna o non disponibile. Non deve comparire un secondo pulsante di navigazione fatture.
3. Simulare mancata lettura delle fatture: lo stato non deve diventare falsamente «nessuna fattura», ma **Non disponibili**. Il link Fatture rimane un link di sola navigazione.
4. Cambiare il progetto nella scheda, anche tra due progetti con lo stesso nome: l'ID e lo stato fatture nel percorso devono aggiornarsi.
5. L'Hub v3 mostra la **Prossima azione** e quattro aree; il precedente banner della versione v2 non deve ripetersi visivamente. Se l'Hub non viene renderizzato, il banner v2 deve restare visibile e azionabile.
6. Su Oggi, Ascolto, Agenda, quando non esiste il link Fatture del Percorso, deve mantenersi il precedente chip contestuale. Nessun refactor della logica contabile.
7. Da Percorso → Audio Finder il progetto è solo pre-selezionato: non creare nuovi progetti e non collegare file senza consenso.
8. Verificare usabilità PC, tablet e mobile, compresi i titoli lunghi e le etichette di stato fatture.
9. Su mobile ricaricare la PWA, verificare aggiornamento cache v2.70 e nessun doppio comando.
10. Non considerare il solo esito CI come conferma di un deployment. Nessuna operazione Vercel o modifica dati autorizzata.

Per test automatici: `npm run check:project-journey-v269` e `npm run check:ui-consolidation-v270`.
