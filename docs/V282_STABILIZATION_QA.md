# Checklist v2.82 — Stabilizzazione letture, errori, performance e PWA

## Economia (Fatture)
1. Con utente autenticato apri Economia: durante il caricamento viene mostrato **Verifica completa degli archivi economici in corso**, poi il cruscotto esistente (nessuna nuova dashboard).
2. Verifica fatturato da prezzo unitario, incassato, da incassare, costi e fee. Le formule e la polarità SIAE non cambiano. Su archivi con più di 1.000 progetti o 2.000 fatture devono essere lette **tutte** le pagine, fino al limite di sicurezza.
3. Se la lettura di PROGETTI/FATTURE/Spese Extra/FATTURE_RIPARTIZIONI fallisce, l'app deve **nascondere i totali**, mostrare la fonte e chiedere un nuovo caricamento: mai usare somme parziali.
4. Avvia due aggiornamenti Economia in successione (se possibile tramite il flusso già presente): il risultato lento e precedente non deve sovrascrivere quello più recente.

## KYV Analyst
5. Premi **Rileggi e aggiorna i dati**. Il pulsante viene disattivato durante la lettura e si riattiva dopo esito o errore; la schermata mostra il numero degli 11 archivi letti e dei record caricati.
6. Anche in presenza di sessioni/piazzamenti con **la stessa data**, il caricamento è ordinato per ID stabile; le righe non devono comparire più volte o mancare nei calcoli.
7. In caso di errore di permesso o tabella inesistente, non fare retry automatico e non mostrare totali. In caso di errore di rete/temporaneo 429 o 503 il lettore può riprovare fino a due volte con ritardo breve.
8. Se la risposta del database non comunica il totale esatto, supera il limite di sicurezza, perde righe o presenta ID duplicati fra pagine, l'analisi deve fermarsi senza mostrare risultati incompleti.
9. Le risposte su incassi, SIAE, IMAIE e fee zero devono restare identiche a parità di dati. Controllare anche grafico artisti, approfondimento creativo e nuovo audit v2.81.

## Guide, cache e compatibilità
10. Controlla PWA **v2.82** su PC e smartphone, cambiando pagina tra Progetti, Fatture, Studio Editor, Audio Finder e KYV Analyst; verifica l'assenza di pulsanti/menù duplicati.
11. La guida dettagliata e la guida ? devono spiegare limiti di lettura, riprova e differenza fra errore e dato veramente pari a zero.
12. Senza migrazioni o scritture nuove, verificare che dati/storici rimangano immutati. Il solo test GitHub non prova il deploy Vercel né la connessione effettiva ai dati reali.

I test CI verificano l'integrità della paginazione con dati simulati e controlli strutturali; le prove browser autenticate restano da eseguire dopo il deploy.
