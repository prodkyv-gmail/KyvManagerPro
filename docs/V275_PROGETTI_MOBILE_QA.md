# KYVManagerPro v2.75 — collaudo pagina Progetti mobile
1. Su un telefono largo 320–390 px aprire Progetti; il menu ☰ non copre titolo o ricerca, e i pulsanti Nuovo e Ricarica restano utilizzabili.
2. Scorrere la barra Recenti / Da fare / In attesa / Usciti / Tutti: tutti i filtri sono raggiungibili orizzontalmente, senza allargare la pagina.
3. Verificare l'unico conteggio leggibile sotto le viste: risultati, visualizzati e archivio. Selezionare Tutti; il numero dei risultati deve essere quello effettivamente verificato.
4. Cercare un titolo, un artista e un #ID esterno ai primi 40; la ricerca deve esplorare tutto l'archivio, non solo le schede mostrate.
5. Su card: titolo/artista, stato e prossima azione leggibili; Riepilogo apre il popup in sola lettura e Scheda apre il progetto con lo stesso ID.
6. Da Filtri e ordinamento passare da Vista compatta a Vista dettagliata: la data deve comparire solo nella seconda modalità su telefono, senza cambiare dati o numero di schede.
7. Con più di 50 risultati, premere Mostra altri 50: contatore visualizzati aumenta, ricerca e filtri restano identici.
8. Simulare un errore di caricamento: la pagina mostra Archivio non disponibile, nasconde il vecchio grafico e offre Riprova caricamento. Il pulsante ritenta senza refresh totale e senza azzerare i filtri.
9. In desktop verificare tabella, grafico e menu senza regressioni. Confermare l'assenza di nuove scritture, progetti, associazioni audio, fatture o migrazioni.
10. La CI GitHub verifica il codice, non sostituisce test grafico e autenticato su dispositivo né garantisce automaticamente il deployment Vercel.
