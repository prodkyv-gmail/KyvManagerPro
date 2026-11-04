# v2.77 — Piano di verifica Studio Editor

1. Da desktop aprire Studio Editor → Progetti. Filtrare per titolo e per contenuto di una colonna nascosta; verificare i risultati e il contatore completo.
2. Premere Mostra altre 120 righe più volte: i risultati mantenuti devono essere corretti, senza nuove letture del database o mutazioni.
3. Estendere e accorciare il testo cercato; cambiare ordinamento. Verificare che la selezione si allarghi se il testo si accorcia e che le righe non cambino impropriamente quando si ordina.
4. Aprire Colonne: Trova colonna cerca nomi tecnici e visualizzati, Solo colonne visibili mostra solo checkbox spuntati, il contatore riporta visibili/totali/risultati. Un solo pannello Colonne e una sola ricerca principale.
5. Nascondere molte colonne, lasciare almeno una visibile; Mostra tutte ripristina. Passare a Fatture e tornare a Progetti: preferenze locali distinte per tabella.
6. Con un filtro attivo ricaricare la stessa tabella: testo preservato. Passare a tabella diversa: ricerca riparte vuota. In caso di errore usare Riprova della stessa tabella.
7. Modificare un record autorizzato con flusso esistente e cercare il nuovo valore: la cache dev'essere invalidata dopo il salvataggio riuscito. Con errore di salvataggio non deve cambiare il dataset.
8. Esportare CSV dopo aver nascosto una colonna: l'export conserva tutte le colonne e tutti i record caricati.
9. Da smartphone aprire Colonne, cercare, scorrere, selezionare con il dito. Usare tastiera/Escape, verificare il ritorno del focus.
10. La CI automatizzata testa la sintassi e la logica in memoria; controllare manualmente l'interazione autenticata e le dimensioni schermo sulla PWA distribuita.
