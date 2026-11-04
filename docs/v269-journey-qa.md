# KYVManagerPro v2.69 — Collaudo percorso progetto

Prove manuali PWA desktop/mobile, non eseguite dalla CI e senza modifiche a dati reali.

1. Progetti → apri Vista rapida su un progetto esistente: premi Sessioni del progetto e verifica ID, titolo e artista.
2. Sessioni mostra etichetta progetto e dati solo del progetto selezionato; premi Vedi tutte le sessioni e verifica il ritorno alla pagina generale. Le metriche della pagina restano globali.
3. Da Scheda Progetto usa il Percorso: Scheda → Sessioni → Audio → Fatture; ogni pagina deve mantenere l'ID senza chiedere di riscegliere il brano.
4. Da Audio Finder aperto con parametro project controlla che venga indicato il progetto nella scelta di destinazione, ma **nessuna** nuova associazione, scansione, proposta di progetto o inserimento parta automaticamente.
5. Fatture aperte con collegaProgetto non devono attivare la finestra di ripartizione. Verifica che il link di ritorno riporti alla scheda del progetto selezionato.
6. Per il comando manuale Collega fattura nella Vista rapida, deve continuare ad aprirsi il flusso di ripartizione esistente: nessuna conferma automatica.
7. Apri senza un ID o con un ID non valido: la navigazione torna alle modalità generali, senza assumere che il nome file sia un tuo progetto.
8. Verifica la visualizzazione dei link e del percorso su mobile e tablet, nonché il ritorno indietro del browser.
9. Con un dataset di più di 1.000 progetti, controlla che Sessioni recuperi anche record oltre la prima pagina; se la lettura è incompleta, deve mostrarsi errore e non un totale fittizio.
10. Nessuna scrittura su progetti, sessioni, file e fatture viene effettuata per il solo attraversamento del percorso.

Nessun accesso a Vercel o operazione sul database di produzione.
