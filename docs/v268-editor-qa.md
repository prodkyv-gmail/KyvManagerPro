# KYVManagerPro v2.68 — collaudo di Studio Editor

Checklist per prova manuale autenticata (non eseguita da CI). Evitare prove distruttive su dati di produzione.

1. Apri un progetto noto, modifica soltanto una nota e salva; verifica che FEE, ROY, STATO e dati fiscali non siano cambiati.
2. Apri un record senza modifiche, premi Salva: compare “Nessuna modifica da salvare” e non parte un update.
3. Modifica un campo, premi Annulla: compare conferma. Scegli di restare, poi salva. Ripeti annullando e scartando.
4. Riempi e svuota un campo, verifica l'avviso e il salvataggio esplicito del valore null.
5. Modifica e poi ripristina lo stesso valore: nessun update.
6. Seleziona una fattura collegata con precompilazione dei campi: quelli precompilati vengono segnalati come modificati.
7. Apri dalla tabella Progetti una fattura attraverso il relativo riferimento: chiudi senza modifiche e verifica che resti visibile Progetti. Modifica con prudenza un campo della fattura collegata e verifica che il cambio non coinvolga il progetto non selezionato.
8. Prova la conferma eliminazione con dati di test autorizzati: tabella e ID corrispondono al record iniziale e doppio clic non invia due richieste.
9. Apri una versione audio dal suo archivio: nessun pulsante Salva attivo e nessun input modificabile.
10. Su mobile e desktop verifica Escape/chiusura, indicatore campi modificati, pulsanti durante il salvataggio e avviso prima di lasciare la pagina.

Non sono state aggiunte migrazioni. Vercel e database di produzione restano invariati.
