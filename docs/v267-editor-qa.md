# KYVManagerPro v2.67 — collaudo Studio Editor

I test di CI usano mock, non dati reali. Da verificare con accesso autorizzato, senza dati di produzione modificati durante la prova.

1. Apri **Studio Editor → Progetti**: controlla totale verificato, primi 120 record e pulsante per visualizzarne altri se presenti.
2. Cambia rapidamente tab Progetti → Fatture: soltanto la tabella scelta deve comparire, senza risultati tardivi del tab precedente.
3. Cerca una voce che si trova dopo la riga 1000 (su un archivio adatto) e verifica che il filtro la trovi, pur senza mostrare preventivamente tutte le righe.
4. Ordina una colonna e premi Mostra altre 120: l'ordinamento deve restare coerente.
5. Nascondi una colonna, filtra per un suo valore e poi esporta CSV: il valore deve essere presente nei dati esportati.
6. Con una simulazione non distruttiva di errore di rete, l'Editor non deve dichiarare 0 record e deve presentare Riprova. Ripristina la rete e usa Riprova.
7. Se presenti più di 30.000 record in una tabella, deve comparire la soglia e il blocco esplicito: non un falso archivio completo.
8. Verifica le impostazioni compatte/larghe, i popup e lo scorrimento su desktop e mobile.
9. Conserva l'operatività precedente dei moduli edit e dello storico; evita cancellazioni o inserimenti di prova su dati reali.

Nessun accesso Vercel, nessuna migrazione DB, nessuna variazione delle formule o dei segni SIAE.
