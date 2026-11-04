# KYVManagerPro v2.72 — Collaudo Vista rapida e Scheda progetto

1. Progetti: aprire Rapido su un brano. Titolo, artista, stato, fase e ultima attività devono apparire subito; un solo link Apri scheda completa deve essere direttamente visibile.
2. Aprire Scadenze e note: visualizzare sessione, follow-up, pubblicazione, eventuali note, con gli stessi dati storici e senza scritture.
3. Aprire Sessioni, audio e fatture: verificare che tutti e tre i link funzionino e conservino l'ID del brano corrente; Collega fattura deve rimanere esplicito e manuale.
4. Chiudere e riaprire Rapido su un altro progetto: tutti i pannelli secondari ripartono chiusi, senza contenuti stantii. Il focus torna al comando di apertura dopo la chiusura.
5. Verificare input con titoli o note contenenti caratteri speciali: nessun HTML arbitrario deve essere iniettato.
6. Scheda progetto Easy: un solo pulsante Continua progetto, non un secondo Mostra dettagli. Completa: tutti i tab e i controlli di modifica restano accessibili.
7. Il selettore Easy/Completa espone un gruppo accessibile e aria-pressed per ogni modalità, aggiornandosi quando cambia.
8. Su smartphone popup e disclosure si leggono senza scrolling laterale; Tab/Esc mantengono la gestione dei dialoghi già presente.
9. Verificare assenza di nuovi progetti, file associati o fatture in seguito alla sola navigazione. Nessuna modifica al database o Vercel.

CI: npm run check:project-disclosure-v272; npm run check.
