# Collaudo integrato v2.78 + v2.79 (unica PWA 2.79)

## Studio Editor — popup di modifica
1. Da Progetti e Fatture in Studio Editor apri un record. Verifica che il popup già esistente sia l'unico aperto e che le cinque sezioni siano mostrate solo quando hanno campi.
2. Controlla che titolo/artista, ID_PROGETTO/IDFT, date e importi originali siano visibili e correttamente classificati; ogni input deve conservare `data-key` e valore.
3. Cerca un campo per nome visualizzato o tecnico. Cambia il testo per verificare che le sezioni scompaiano/ricompaiano senza perdere valori.
4. Modifica un valore e attiva Solo modificati: appare soltanto il campo toccato, ma Salva deve usare la differenza originale, non i filtri grafici. Disattiva per tornare al form completo.
5. Controlla la barra di stato delle modifiche, il pulsante Salva/Crea, Annulla e l'alert di modifica non salvata; prova a chiudere durante un salvataggio (deve rimanere bloccato).
6. Controlla una tabella in sola lettura: input, modifica e Solo modificati non devono permettere scritture. Focus iniziale nel form, focus restituito al pulsante quando si chiude.
7. Prova un collegamento a fattura o progetto con il flusso esistente; nessuna selezione deve creare un progetto o una fattura automaticamente.

## Grafica e navigazione
8. Da PC, tablet e smartphone controlla Progetti, Sessioni, Fatture e Studio Editor: testo leggibile, focus visibile, pulsanti raggiungibili, scrollbar coerenti, nessuna barra o menu duplicati.
9. Soprattutto su smartphone verifica la barra/header di Progetti già corretta nella v2.76 e la navigazione nell'Editor, senza scroll orizzontali indesiderati nel popup.
10. Apri il popup da smartphone con molti campi; verifica che lo scorrimento coinvolga i campi, mentre stato e pulsanti Salva/Annulla restano raggiungibili in fondo.
11. Dopo un aggiornamento della PWA verifica la versione 2.79, eventualmente ricaricando l'app una volta dopo l'installazione del nuovo service worker.
12. Verifica che CSV, filtri, polarià SIAE (segno − originale = valore positivo per noi), lettura di Sessioni e Fatture e dati storici restino invariati.

La suite CI verifica struttura, comportamento dei moduli di sola visualizzazione, asset cache e regressioni. La prova manuale richiede accesso autenticato e non è simulata dai soli test GitHub.
