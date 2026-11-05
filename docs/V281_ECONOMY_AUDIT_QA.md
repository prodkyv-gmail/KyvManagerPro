# v2.81 — Collaudo KYV Analyst: fatture, incassi, fee, SIAE e Nuovo IMAIE

## Controllo KYV Analyst
1. Apri KYV Analyst su PC e smartphone. Dopo la lettura autenticata verifica che il pannello **Controllo di coerenza economica · v2.81** sia presente sotto Verifiche principali e inizialmente chiuso, senza grafici duplicati.
2. Espandilo. Controlla che fatturato totale sia basato su **PrezzoUnitario** e non sui totali-documento Aruba/XML ripetuti; controlla le ripartizioni sulle fatture multi-progetto.
3. Il riquadro **Incassi con data registrata** considera solo i movimenti attivi con data registrata; i movimenti stornati non devono comparire come incassi. Se una voce ha troppi movimenti, deve comparire una segnalazione, non un incasso fittizio.
4. Le fatture storiche marcate **PAGATA=SI** senza movimento bancario vanno visualizzate separatamente dai bonifici con data. Il campo originale e i dati storici non devono cambiare.
5. Verifica che SIAE e Nuovo IMAIE siano conteggiate separatamente, utilizzando solo liquidazioni nette in `KYV_LIQUIDAZIONI_DIRITTI` con `DataAccredito`. Le righe ESTRATTO SIAE grezze **non** sono bonifici e il loro segno originale resta invariato.
6. Verifica una liquidazione **senza DataAccredito**: l'importo non deve essere incluso tra i diritti ricevuti né fra quelli ricevuti da attribuire, ma deve essere segnalato come dato da completare.
7. Verifica attribuzioni annullate, quote diritti eccedenti il netto e riferimenti a liquidazioni/progetti non presenti: il controllo non deve scrivere, collegare o modificare automaticamente nulla.
8. Una **FEE=0** deve essere conteggiata come lavoro creativo valido, non un mancato pagamento; una FEE positiva senza fattura è solo una verifica commerciale, non un credito automaticamente esigibile.

## Domande e navigazione
9. In Analyst chiedi **Quali riconciliazioni economiche devo verificare?** e **Quali royalties devo ancora attribuire?**. Le risposte devono essere compatibili con il pannello e distinguere liquidazioni datate da documenti senza data.
10. Premi i link Verifica: devono aprire Fatture o Liquidazioni per eventuali correzioni manuali. Torna in Analyst e usa **Rileggi e aggiorna i dati**. Nessun link deve scrivere da solo.
11. Controlla su mobile testo, responsività, ordine delle verifiche, pulsanti e chiusura del pannello; nessun duplicato di menu/grafici.
12. Controlla che dopo aggiornamento della PWA il menu mostri **v2.81**.

La suite GitHub esegue controlli deterministici con record simulati e regressioni, ma non legge dati personali reali, non confronta movimenti bancari e non verifica la distribuzione live della PWA. Prima di interpretare scostamenti importanti verificare documenti fiscali/bancari.
