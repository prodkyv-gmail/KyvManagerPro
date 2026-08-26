# Prova operativa e grafica — KyvManagerPro v2.24

## Obiettivo

Verificare che Percorso Brano proponga attività soltanto dopo aver letto correttamente tutte le fonti e che **Fai ora** apra la sezione esatta della Scheda Progetto.

## 1. Stato dei dati

1. Aprire `assistente.html` e attendere il caricamento.
2. Con `AUDIO_VERSIONI` installata deve comparire il messaggio verde **Dati verificati: assistente operativo**.
3. Senza `AUDIO_VERSIONI`, ma con tutte le fonti storiche leggibili, deve comparire il messaggio giallo **modalità compatibilità**.
4. Simulare una fonte necessaria non leggibile, per esempio revocando temporaneamente la lettura in un ambiente di prova: deve comparire il messaggio rosso e le priorità non devono essere calcolate.
5. Ripristinare la fonte e premere **Aggiorna**: le card devono tornare disponibili.

Esito atteso: nessun errore di lettura viene mostrato come zero progetti, zero file o dato mancante.

## 2. Completamento e prossima azione

1. Controllare una card nelle viste Priorità, Kanban e Ricerca.
2. Verificare che percentuale e barra siano coerenti con il numero di controlli completati.
3. Premere **Fai ora** su progetti con mancanze differenti:
   - titolo, artista o referente → `tab=sintesi`;
   - sessione, autori, sviluppo, master, link, hash o invio → `tab=produzione`;
   - contratto → `tab=docs`;
   - quote, ISRC o ruolo IMAIE → `tab=diritti`;
   - fee, fattura o pagamento → `tab=amministrazione`;
   - progetto completo → `tab=checklist`.
4. Nella Scheda Progetto scegliere manualmente un’altra sezione e ricaricare la pagina.

Esito atteso: la sezione richiesta resta nell’indirizzo e viene riaperta dopo il caricamento. Per i campi modificabili del progetto si apre direttamente anche **Modifica rapida**; per file, invii, documenti e fatture resta visibile il collegamento al relativo modulo specialistico.

## 3. Audio unificato

1. Scegliere un progetto che abbia versioni soltanto in `AUDIO_VERSIONI`.
2. Controllare che Percorso Brano riconosca link e hash e non li segnali mancanti.
3. Aprire la Scheda Progetto e verificare che la versione compaia nella sezione Produzione.

## 4. Controlli d’interfaccia

- Su telefono i pulsanti non devono uscire dalle card.
- **Fai ora** deve essere visivamente primario; **Pianifica** e **Scheda** secondari.
- Durante il caricamento, ricerca, filtri e comandi di copia devono essere disabilitati.
- In errore rosso devono restare disponibili soltanto **Aggiorna**, Diagnostica e la navigazione generale.
- Il pulsante `?` deve mostrare la guida v2.24 di Percorso Brano.

## Note di rilascio

- Nessuna nuova migrazione Supabase.
- La migrazione `SUPABASE_MIGRATION_V2_23_AUDIO_VERSIONI.sql` resta consigliata.
- La versione 2.22 su autenticazione e isolamento dei dati rimane sospesa.
