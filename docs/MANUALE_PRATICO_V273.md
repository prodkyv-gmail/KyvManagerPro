# KYVManagerPro — Manuale pratico dettagliato v2.73

**Data:** 4 novembre 2026 · **Versione:** 2.73

Questo manuale è la spiegazione corrente delle funzioni di KYVManagerPro. L'app conserva sezioni storiche nelle versioni precedenti: quando il nome di un comando è cambiato, fare riferimento alla sezione *Guida pratica v2.73* di `guida.html` e alla guida **?** contestuale.

## Aggiornamento v2.75 · Progetti su smartphone

Apri **Progetti**: l'intestazione è compatta e la ricerca rimane accessibile. Scorri le cinque viste orizzontalmente e seleziona il filtro. Il contatore indica **risultati (tutte le corrispondenze), visualizzati (card correnti), archivio (totale verificato)**. Per scorrere archivi lunghi usa **Mostra altri 50**, che aumenta solo le card presentate e non modifica i filtri.

Ogni card riporta **titolo, artista, stato e prossima azione**. Tocca **Riepilogo** per i dati principali in sola lettura, oppure **Scheda** per il progetto completo; il tocco su una parte non interattiva della card apre anch'esso il riepilogo. Il pannello **Filtri e ordinamento** contiene **Vista compatta** e **Vista dettagliata**: la prima omette la data di attività sulla card mobile, la seconda la mostra. Non si alterano i dati.

Se appare **Archivio non disponibile**, premi **Riprova caricamento**: la pagina ricarica solo l'archivio conservando ricerca, stato, fase e artista. Un errore non equivale a nessun progetto e le analisi precedenti non devono comparire come attuali. La vista **Tutti** consulta l'archivio intero caricato e verificato; **#ID** o ricerca testuale possono raggiungere i progetti fuori dai Recenti.

## Aggiornamento v2.74 · Come funziona Recenti

Quando Recenti è attivo **senza altri criteri**, prima vengono individuati i **40 progetti più recenti per attività effettivamente datata**; solo dopo sono ordinati per Titolo A–Z, Artista A–Z, Follow-up imminente o Attività meno recente. Cambiare ordinamento non fa entrare progetti meno recenti nell'elenco di 40. **Tutti** ordina invece l'intero archivio caricato e verificato. Cerca titolo, artista, parole delle note o **#ID**, oppure imposta filtri avanzati, per cercare anche fuori dai 40; nessun filtro limita la ricerca alle sole righe visibili. **Azzera filtri** ritorna a Recenti. I record privi di data non ricevono date ipotetiche.

**Esempio pratico:** se il progetto ID 41 non è tra i 40 più recenti, passare a Tutti oppure digitare `#41`; ordinare per Titolo A–Z senza cambiare vista non lo recupera. Se imposti anche Da fare, verifica che lo stato del progetto sia compatibile; in caso contrario azzera i filtri.

## 1. Ricerca in Progetti: istruzioni passo passo

1. Aprire **Progetti**, verificare se la vista è **Recenti** (max 40 schede senza altri criteri) oppure **Tutti**.
2. Cercare nella barra per titolo, artista, stato, fase/prossima azione, note, o ID. `#41` e `id:41` cercano l'ID esatto. Le ricerche sono insensibili a maiuscole e accenti.
3. Usare le viste **Da fare**, **In attesa**, **Usciti** per gli stati registrati e aprire **Filtri e ordinamento** per artista, fase, stato e ordine.
4. Leggere il **riepilogo dei criteri attivi** sotto la barra: è sempre visibile anche quando i filtri avanzati sono chiusi. Quando almeno un criterio è attivo, **Azzera filtri** permette di tornare a Recenti e svuotare ricerca, filtri e ordinamento.
5. Il conteggio della lista si riferisce ai risultati nell'archivio caricato, mentre il grafico **Analisi archivio** rappresenta la distribuzione dell'intero archivio e può attivare un filtro su Stato/Fase.
6. Cliccare **Riepilogo** per la vista rapida in sola lettura o **Scheda** per il progetto completo; l'ID deve restare corretto nei collegamenti.

**Esempio:** con `#41` individui esattamente il progetto ID 41. Se Da fare è attivo, un progetto chiuso può essere escluso anche se l'ID esiste: passa a Tutti o azzera i filtri.

**Nessun risultato:** prima controllare vista, stato, fase, artista e testo; poi usare Azzera filtri. Un errore di caricamento non significa elenco vuoto: non cancellare o ricreare progetti per questo motivo.

## 2. Ricerca globale Ctrl/Cmd+K

Il comando **Ctrl+K** su Windows o **Cmd+K** su Mac apre la ricerca globale dalle pagine compatibili. L'indice è costruito dai record accessibili all'utente nelle fonti **Progetti, Fatture, Invii, Documenti, Versioni audio, SIAE, IMAIE**. La lettura deve risultare completa e verificata: se una sorgente non è accessibile non si deve affermare che tutti i risultati siano presenti.

Digitare almeno due caratteri, usare frecce **↑/↓**, **Invio** e **Esc**. I risultati sono raggruppati per tipo. Gli elementi recenti sono conservati soltanto nella memoria della pagina, non persistiti con titoli privati nel browser tra account.

## 3. Scheda Progetto e Viste

**Riepilogo** in Progetti mostra stato, fase e ultima attività, un collegamento principale e due sezioni espandibili: **Scadenze e note**, **Sessioni, audio e fatture**. Aprirle non modifica il progetto.

**Easy** semplifica il percorso; **Continua progetto** aiuta a scegliere l'azione. **Completa** apre i pannelli tecnici e le funzioni di modifica. Non esiste un secondo pulsante ridondante Mostra dettagli. Il **Percorso** conserva l'ID tra Scheda, Sessioni, Audio, Fatture. Lo stato delle fatture dentro la voce Fatture è informativo.

Prima di **Modifica dati** controllare che ID, artista e titolo siano quelli corretti; verificare i singoli valori prima di salvare. Le operazioni di collegamento e le creazioni sono esplicite.

## 4. Sessioni, Piazzamenti, Audio Finder

- Registrare prima data, artisti e collaboratori; attribuire il progetto corretto selezionandolo.
- Le fee zero possono corrispondere a sessioni non valorizzate o non piazzate: non indicano da sole un errore.
- Monitorare invii, feedback e follow-up senza assumere un piazzamento certo da uno stato.
- In Audio Finder controllare i dati dei file locali o cloud (Drive, Dropbox, OneDrive se connessi). **Trovare un file non equivale a possederlo o a collegarlo.**
- Usare **Conferma collegamento** solo dopo aver verificato e selezionato il progetto corretto. Non creare un progetto automaticamente durante una scansione.

## 5. Fatture, incassi e diritti

Nella sezione **Fatture** controllare numero, cliente, date, importo e stato. **Incassata** descrive il flag registrato nell'app, non necessariamente la verifica esterna del conto. Il collegamento di fatture a progetti deve essere manuale. Se compare **Non disponibili**, verificare lettura e permessi: non interpretarlo come “nessuna fattura”.

Per **SIAE e IMAIE**, non sommare automaticamente diritti e ricavi fatturati. Verificare sempre periodo e convenzione dei segni degli importi negli estratti, prima di grafici o analisi.

## 6. Studio Editor e protezione dei dati

Selezionare archivio, impostare filtri, individuare la riga corretta anche per ID, verificare i campi che si intendono modificare e poi salvare. Un controllo di colonne visibili agisce solo sulla vista. Non intervenire sui dati storici senza una richiesta esplicita, e non considerare una modifica “non fatta” solo perché la UI non mostra immediatamente la conferma.

## 7. Problemi comuni

| Situazione | Verifica | Azione |
| --- | --- | --- |
| Progetto non visibile | Recenti / Da fare / In attesa e filtri | Passare a Tutti oppure cercare #ID; azzerare criteri |
| Nessun risultato con il nome | Contenuto dei campi e copertura archivio | Controllare nome, artista, selezione e caricamento |
| Fattura non disponibile | Errori di lettura e permessi | Riprova; non dedurre importo zero |
| Versione vecchia su telefono | Cache PWA e versione visibile | Aggiornare PWA; distinguere merge GitHub e deployment |
| Audio non collegato | Sorgente, titolarità e selezione progetto | Confermare solo manualmente dopo verifica |
| Stato di una royalty inatteso | Periodo e segno estratto | Ricontrollare documento originale prima dei calcoli |
| Salvataggio incerto | Notifica di conferma e record attuale | Rileggere prima di ripetere l'azione |

## 8. Collaudo essenziale dopo gli upgrade

Verificare il ciclo Progetti → Riepilogo → Scheda → Sessioni/Audio/Fatture su PC e smartphone; le azioni non devono scrivere da sole. Controllare i filtri combinati, Azzera e #ID, i comandi Easy/Completa, l'apertura di finestre e il focus da tastiera. Le suite GitHub Actions controllano il codice; non costituiscono un collaudo autenticato completo di ogni schermata né una conferma di deployment Vercel.
