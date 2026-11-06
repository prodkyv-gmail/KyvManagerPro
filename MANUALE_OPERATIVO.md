## v2.82 — Stabilizzazione letture e test release (5 novembre 2026)

**Economia:** nella pagina Fatture, il cruscotto `kyv-economy-v6.js` non utilizza più quattro `.limit(1000/2000/5000)` che potevano produrre totali incompleti. Riutilizza `KYV_READ_GUARD_V282.readComplete` per PROGETTI, FATTURE, Spese Extra e FATTURE_RIPARTIZIONI, ordinati per le rispettive chiavi ID univoche e con `count:'exact'`. In attesa dei dati vengono nascosti i totali precedenti; errori di rete, conteggi mancanti, record duplicati o oltre il limite di sicurezza interrompono i calcoli, mostrando il messaggio anziché numeri parziali. Le richieste concorrenti usano un contatore di generazione: una risposta vecchia non può sovrascrivere quella nuova.

**KYV Analyst:** le 11 fonti già esistenti usano lo stesso lettore; KYV_SESSIONI, KYV_SESSIONI_PROGETTI e KYV_PIAZZAMENTI, prima ordinati per data non univoca, ora vengono paginati per ID. Il pulsante Rileggi e aggiorna i dati viene disabilitato durante la lettura e riattivato al termine; il messaggio indica archivi completi/11 e record letti. Non vengono mostrati report da dati parziali. Il lettore riprova **solo le letture** su errori transitori di rete (max 2 retry con attese brevi), mai su errori di autorizzazione, schema o validazione.

**Limiti:** fino a 30.000 righe esatte per fonte; se superato, errore esplicito. Il conteggio è richiesto in modo esatto e ogni ID viene visto una sola volta; niente dati stantii o doppi conteggi in caso di pagine mutate. Nessuna modifica a formule, segni SIAE, fee, fatture, quote, costi, storici, permessi o schema. Nessun nuovo MutationObserver, menu o pannello grafico.

**Test:** nuovo controllo `check:read-guard-v282` con simulazioni di più pagine, errori temporanei, permessi negati, ID mancanti/duplicati e conteggio non verificabile. Release contract dinamico centralizzato per evitare di riscrivere decine di test storici a ogni cache/numero di versione. Guide complete e ? aggiornate; checklist manuale `docs/V282_STABILIZATION_QA.md`. Il CI GitHub non verifica da solo la PWA pubblicata su Vercel.

## v2.81 — Economia e KYV Analyst: riconciliazioni documentali in sola lettura (5 novembre 2026)

La **v2.81** integra in KYV Analyst un unico pannello richiudibile **Controllo di coerenza economica**: usa le stesse 11 fonti già lette con paginazione e conteggio verificato, senza nuove query, scritture o accessi a servizi esterni.

**Fatturato e incassi:** il fatturato gestionale deriva da **PrezzoUnitario** per voce fattura, mai dal totale documento XML ripetuto. Sono segnalate ripartizioni con somme non coincidenti, quote verso ID fattura/progetto mancanti, valori unitari non disponibili, movimenti di incasso che superano la voce e pagamenti privi di data o con fattura non trovata. Gli storni sono esclusi dagli incassi attivi. Una vecchia fattura `PAGATA=SI` senza movimento è distinta da un bonifico con data; non si deducono date bancarie.

**SIAE / Nuovo IMAIE:** come liquidazioni nette ricevute sono usate esclusivamente righe `KYV_LIQUIDAZIONI_DIRITTI` con `DataAccredito` verificata e ente SIAE / NUOVO IMAIE. Le liquidazioni prive di data sono mostrate come dati da verificare e non sommate alle ricevute né alle quote ricevute ancora da attribuire. Le righe dell'**ESTRATTO SIAE** grezzo non sono bonifici. Le attribuzioni stornate, con ID progetto/liquidazione assenti o superiori al netto sono evidenziate, senza auto-correzione. La vista operativa di Analyst e la risposta sulle royalties ora mostrano le quote ricevute da attribuire sulla base delle sole liquidazioni datate. Il motore storico v2.40 non è stato modificato.

**Fee e redditività:** FEE=0 è un risultato possibile di una sessione creativa, non un insoluto. FEE positiva senza fattura è un controllo dell'accordo, non un credito certo. Senza costi verificati e attribuiti a un brano non si calcola un utile netto per progetto. Le verifiche non rappresentano diagnosi fiscali automatiche.

**Come usarlo:** apri `kyv_analyst.html` e il pannello v2.81, oppure fai la domanda “Quali riconciliazioni economiche devo verificare?”. Usa i collegamenti Verifica verso Fatture o Liquidazioni; modifica le informazioni soltanto nella schermata originale, quindi premi Rileggi e aggiorna i dati. Guida completa `guida.html#v281-economy`, aiuto ?, collaudo manuale `docs/V281_ECONOMY_AUDIT_QA.md`.

**Compatibilità e sicurezza:** nessuna variazione a Supabase, schema, dati storici, autorizzazioni, SIAE polarity, fatture o collegamenti; nessuna seconda dashboard o nuovo menu. Suite preesistenti più `check:economy-audit-v281` nel CI GitHub.

## v2.80 — Audio Finder: scansione locale/cloud guidata e protezione delle decisioni (4 novembre 2026)

**Novità concrete:** in Audio Finder → Aggiungi audio, un riepilogo delle sorgenti indica soltanto le funzionalità/configurazioni visibili da browser: File/Cartelle (selettore, non crawler), crittografia HTTPS, account Drive configurati, Dropbox archivio/Chooser/OAuth e OneDrive OAuth/indice. La configurazione non implica autenticazione o accesso verificato. Non è stato introdotto alcun nuovo connettore né un permesso più ampio.

**Locale Mac/PC/iOS/Android:** selezioni esplicitamente una cartella o dei file. Il preflight (`kyv-audio-scan-v280.js`) accetta al massimo 5.000 elementi, conta solo audio supportati e mostra quanti file non audio sono stati ignorati; nessuna selezione audio lascia intatta la revisione precedente. La preparazione dell'identificativo SHA-256 è **solo sui metadati** (percorso relativo, dimensione, data di modifica) e aggiorna un contatore ogni 80 file. Non sono mai letti/trasferiti i byte audio. Su smartphone puoi selezionare file dal sistema; la cartella non è garantita da ogni browser. Nessun accesso permanente, scansione nascosta o background.

**Cloud:** Drive riutilizza `KYV_DRIVE.listFiles`; Dropbox riutilizza archivio/Chooser/OAuth; OneDrive mantiene OAuth opzionale con salvataggio disattivato finché la migrazione/abilitazione già richiesta non è completata. Gli stati di ricerca restano parziali quando il provider lo dichiara o le pagine sono limitate; nessuna incompletezza viene presentata come un censimento completo.

**Salvaguardia:** selezione locale, lettura Drive, Dropbox (archivio e Chooser), ricerca online Dropbox/OneDrive e nuova autorizzazione OAuth chiedono la conferma di abbandono delle classificazioni `_explicit` **prima** di eseguire altre letture o navigare via OAuth. Annullare lascia intatta la coda di revisione. La schermata mostra l'esatta copertura, con conteggio unico per provider/account/identificativo, e spiega che altri dispositivi/account/cartelle non sono inclusi.

**Invarianti critiche:** `KYV_AUDIO_DECISIONI` e `KYV_AUDIO_INDICE` sono scritti soltanto dal salvataggio confermato già presente; `KYV_AUDIO_ASSOCIAZIONI` solo da collegamento manuale confermato. La ricerca/coda non creano progetti, non deducono diritti dal nome, non caricano audio e non mutano schema, storico, permessi o servizi. Il motore precedente di suggerimenti, gruppi e approvazione rimane invariato. Test autonomi v2.80 e test precedenti vengono eseguiti su GitHub prima del merge.

## v2.78 + v2.79 — Popup Studio Editor e grafica operativa coordinati (4 novembre 2026)

**Unico rilascio PWA v2.79**, con le due fasi integrate per non intervenire due volte sugli stessi componenti.

**v2.78 — Modifica del record nel popup preesistente:** il form `#form-dynamic` e i campi `.dyn-input[data-key]` non cambiano. L'helper di presentazione `kyv-editor-modal-v278.js` li suddivide in cinque sezioni visive, nascondendo quelle vuote: Dati principali, Collegamenti e riferimenti, Date e scadenze, Importi e condizioni economiche, Altri dettagli. `Trova un campo` filtra per nome tecnico/etichetta e `Solo modificati` filtra i soli campi toccati: nessun input è disabilitato o rimosso dalla ricerca. Il numero di campi e sezioni visibili è sempre indicato. La barra inferiore con numero di modifiche, Salva/Annulla resta visibile durante lo scorrimento. Restano invariati `modalChangedFields()`, conferma delle modifiche non salvate e blocco dei salvataggi doppi. Apertura e chiusura aggiornano aria-hidden e focus.

**v2.79 — Stile coordinato:** il nuovo `kyv-workspace-ui-v279.css` è caricato soltanto nelle pagine Progetti, Sessioni, Fatture e Studio Editor. Lo stile è circoscritto a `body.kyv-v279-workspace`: migliora focus, contrasto, spaziatura, scrollbar, aree touch e popup, senza nuove barre o nuovi menu e senza alterare l'header mobile di Progetti.

**Vincoli:** nessuna modifica a Supabase, database, dati storici, autorizzazioni, invoice/audio link, sign SIAE, query o payload diff-only; nessuna ricerca che scriva sul database. La verifica sulla PWA 2.77 già confermata non sostituisce quella per il rilascio 2.79. Test v2.78 e v2.79 e regressioni precedenti vengono eseguiti via GitHub Actions prima del merge.

## v2.77 — Studio Editor: ricerca efficiente e pannello Colonne (4 novembre 2026)

**Prestazioni:** l'Editor continua a leggere e verificare l'intera tabella con il caricatore preesistente, senza creare nuove query. La cache temporanea `KYV_EDITOR_VIEW_V277` evita di filtrare/ordinare nuovamente gli stessi risultati a ogni `Mostra altre 120 righe` e può restringere l'insieme in modo corretto quando il nuovo testo estende la ricerca precedente. Si invalida su nuova lettura, cambio tabella, errore o salvataggio inline riuscito; le modifiche via popup già richiamano `loadEditorTable`. I criteri di ricerca e ordinamento restano quelli esistenti.

**Ricerca:** in `Filtra tabella corrente` cerca i record anche attraverso le colonne nascoste. La ricerca viene azzerata quando passi a una tabella diversa; quando ricarichi la stessa tabella, inclusi Riprova e salvataggio, il testo resta presente. Nessuna ricerca scrive sul database.

**Colonne:** nello stesso pannello già presente ora trovi `Trova colonna` (nome leggibile o tecnico), `Solo colonne visibili` e un conteggio `visibili / totali · presenti nell'elenco`. Le preferenze restano per tabella nel dispositivo; `Mostra tutte` ripristina la vista. La ricerca delle colonne non filtra i record. È vietato nascondere anche l'ultima colonna. Il pannello supporta un ritorno del focus al pulsante Colonne dopo Esc.

**Schermata mobile:** riga di ricerca del pannello più grande, pannello scorrevole, righe checkbox con aree di tocco da almeno 44 px. Non viene creata una barra aggiuntiva. `Compatta/Larga` modifica soltanto la densità e `Esporta` conserva l'intero dataset caricato, anche le colonne nascoste.

**Limiti:** nessun accesso a Supabase o Vercel durante l'upgrade, nessuna modifica a dati, permessi, schema, query di scrittura, invoice/audio linking o flussi di salvataggio. I test GitHub non sostituiscono un collaudo visivo con login sulla PWA.

## v2.76 — Coerenza operativa Progetti / Sessioni / Fatture / Studio Editor (4 novembre 2026)

**Progetti mobile:** corretta la regola grafica tardiva di `kyv-layout-polish.js` che sovrascriveva la testata compatta introdotta nella v2.75. Rimangono un solo menu, una sola ricerca e le stesse card.

**Sessioni Studio:** intestazione comandi accessibile; riepilogo di `progetti corrispondenti / progetti caricati` e `eventi timeline visibili / totali`, distinguendo il limite di 24 elementi da un numero assoluto. Le metriche Oggi, Prossime, Master e Uscite continuano a riferirsi all'intero archivio caricato. Se una lettura fallisce, metriche, timeline e box laterali non mostrano risultati precedenti come attendibili; il pulsante Ricarica conserva ricerca e filtro.

**Fatture / Economia:** la ricerca per numero, cliente e progetto non viene più cancellata dal caricamento, da Ricarica o da un salvataggio. Un indicatore precisa quante fatture vengono visualizzate e quante sono state ricevute e che i totali sono calcolati sulle righe filtrate (oppure tutte quelle caricate quando non c'è ricerca). In caso di errore il registro è indicato come non disponibile e le somme rimangono non attendibili fino alla lettura successiva.

**Studio Editor:** migliorati i nomi accessibili del menu e dei comandi Esporta, Aggiungi, Compatta/Larga. Il pulsante densità aggiorna lo stato accessibile. La barra operativa condivisa ha controlli da almeno 44 px e focus visibile sulle pagine Sessioni, Economia ed Editor.

**Verifica:** test v2.76 dedicato alle barre, ai contatori, alla semantica delle ricerche e alla guida. Nessuna modifica a database, autorizzazioni, dati storici, associazioni, flussi automatici o Vercel; il collaudo visuale autenticato resta separato dalla CI.

## v2.75 — Progetti mobile più leggibili e aggiornamento della lista (4 novembre 2026)

La pagina **Progetti** su smartphone usa un'intestazione più compatta, mantiene la ricerca a portata di mano, lascia scorrere orizzontalmente le cinque viste principali e mostra il conteggio **risultati · visualizzati · archivio** fuori dalla barra di navigazione. Le schede hanno una gerarchia visiva più chiara: titolo e artista subito sopra stato e prossima azione, con **Riepilogo** per la lettura rapida e **Scheda** per il dettaglio. Non sono stati creati pulsanti o popup duplicati.

**Aggiornamento operativo:** la modalità **Vista compatta** nasconde la sola data di attività sulla card mobile, mentre **Vista dettagliata** la mostra; la modifica non tocca i record. Il comando **Mostra altri 50** indica le righe effettivamente visualizzate. Se il caricamento fallisce, l'app non presenta i vecchi risultati come attendibili e offre **Riprova caricamento** senza ricaricare la pagina o perdere i filtri; il grafico non mostra una distribuzione obsoleta.

**Come usarla:** aprire Progetti, cercare per titolo/artista/#ID, selezionare la vista, toccare Riepilogo o Scheda; usare Tutti per consultare tutto l'archivio. Non sono state introdotte nuove query, scritture, associazioni audio, migrazioni o modifiche di permessi. Guida in-app, ? contestuale, manuali, test e cache PWA aggiornati; il collaudo visivo autenticato su smartphone resta distinto dai test GitHub.

## v2.74 — Ordinamento stabile dei 40 progetti Recenti (4 novembre 2026)

**Correzione:** la vista **Recenti** individua sempre prima i 40 progetti con l'attività più recente, indipendentemente dall'ordinamento selezionato. **Titolo A–Z**, **Artista A–Z**, **Follow-up imminente** e **Attività meno recente** cambiano soltanto l'ordine di questi 40 progetti, senza sostituirli con altri dell'archivio. Il criterio di attività usa le date effettivamente registrate; non inventa date mancanti.

**Per consultare tutti i progetti**, selezionare **Tutti** e poi il criterio di ordinamento desiderato. Una ricerca per nome, artista, note, **#ID** o filtri avanzati continua a lavorare sull'intero archivio caricato e verificato, anche se è selezionata la vista Recenti. Per cancellare tutti i criteri, utilizzare il singolo pulsante **Azzera filtri**.

La pagina Progetti, la Guida completa e la guida contestuale **?** riportano questa distinzione. Aggiunto collaudo automatico v2.74 su appartenenza ai 40 Recenti, ordinamento e ricerca sull'archivio. Nessuna modifica a database, permessi, file audio, fatture, progetti o deployment Vercel.

## v2.73 — Ricerca, filtri e guida pratica dettagliata (4 novembre 2026)

In **Progetti**, il riepilogo dei filtri è ora visibile anche senza aprire il pannello avanzato, con un unico **Azzera filtri** disponibile quando esistono criteri attivi. Ricerca esatta per **#ID / id:ID**, vista Recenti esplicitamente limitata a 40 risultati quando non sono impostati filtri, tasti di scelta con stato accessibile e ricerca sull'intero archivio caricato. Le operazioni restano di sola lettura.

La **Guida completa** apre ora con un capitolo v2.73 esteso, organizzato in ricerca, scheda, sessioni, audio, fatture, diritti, editor e risoluzione problemi. Include istruzioni in sequenza, esempi e significato dei pulsanti. Anche la guida contestuale **?** è stata ampliata per i moduli principali. Il manuale tecnico dedicato è in `docs/MANUALE_PRATICO_V273.md`. Le vecchie sezioni restano disponibili come archivio storico.

Nessuna modifica a dati, schema, permessi o deployment Vercel.

# KYVManagerPro — Manuale pratico dettagliato v2.73

**Data:** 4 novembre 2026 · **Versione:** 2.73

Questo manuale è la spiegazione corrente delle funzioni di KYVManagerPro. L'app conserva sezioni storiche nelle versioni precedenti: quando il nome di un comando è cambiato, fare riferimento alla sezione *Guida pratica v2.73* di `guida.html` e alla guida **?** contestuale.

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


---

## v2.72 — Vista rapida Progetti e Scheda essenziale (4 novembre 2026)

La **Vista rapida** dell'archivio Progetti mostra subito titolo, artista, stato, prossima azione e ultima attività, con un solo collegamento principale **Apri scheda completa**. I dettagli meno frequenti (date di sessione, follow-up, pubblicazione e note) si aprono nel riquadro nativo **Scadenze e note**. I collegamenti secondari per Sessioni, Audio e Collega fattura rimangono disponibili nel riquadro **Sessioni, audio e fatture**. Ogni apertura di un altro progetto riparte dalla vista compatta; non si perde nessuna informazione.

Nella **Scheda progetto** la scelta di vista **Easy/Completa** è il comando unico per mostrare o nascondere i dettagli. L'ulteriore pulsante “Mostra dettagli” è stato rimosso per evitare doppioni, mantenendo **Continua progetto** in Easy e tutti i controlli di modifica nella vista Completa. Gli stati delle scelte sono accessibili (aria-pressed) e il menu del progetto non viene modificato.

Tutti i collegamenti conservano l'identificativo del progetto. Nessuna mutazione automatica di fatture, progetti, file audio o dati storici; nessun accesso Vercel. Per la verifica reale occorre il collaudo autenticato PC/mobile oltre alla CI.

## v2.71 — Progetti mobile e viste secondarie senza interruzioni (4 novembre 2026)

La pagina **Progetti**, con vista indipendente, ha un menu mobile accessibile: il focus entra nel menu aperto, **Esc** lo chiude e ritorna al pulsante, **Tab** naviga all'interno e lo stato è indicato con aria-expanded. La barra inferiore indica la sezione corrente, è disabilitata mentre il menu è aperto e non viene duplicata se una barra condivisa esiste già.

Nelle viste **Easy/Completa** di Pipeline, Fatture e Rendiconto, i pulsanti comunicano la selezione tramite aria-pressed. I pannelli secondari aperti manualmente non si richiudono al refresh, ma seguono i cambi espliciti di modalità.

Il percorso dei dati, le fatture e i file audio sono invariati. Nessun intervento Vercel o database.

## v2.70 — Navigazione senza duplicati (4 novembre 2026)

La barra **Percorso** della Scheda progetto carica ora il modulo di navigazione corretto e mantiene il progetto fra Scheda, Sessioni, Audio Finder e Fatture. È stata eliminata una duplicazione: lo stato della fattura (incassata, da incassare, non emessa o non disponibile) viene mostrato come **etichetta informativa nella voce Fatture**, non in un secondo collegamento. In caso di errore di lettura non viene dedotto che non esistano fatture; nessuna azione di modifica o ripartizione parte dalla navigazione.

Nella Scheda rimane **un solo riquadro principale “Prossima azione”** quando l'Hub operativo è disponibile; il vecchio riquadro resta utilizzabile come ripiego se l'Hub non si carica. Cambiare progetto nella scheda aggiorna anche il riepilogo fatture del progetto corrente.

Sicurezza: nessuna scrittura implicita, modifica dei dati storici, nuove tabelle o intervento Vercel. I controlli automatici verificano le dipendenze e le regressioni, ma non sostituiscono la verifica visiva autenticata su PC/smartphone.

## v2.69 — Percorso Progetto → Sessioni → Audio → Fatture (4 novembre 2026)

Dalla **Scheda progetto** hai un percorso compatto e contestuale con i collegamenti **Scheda, Sessioni, Audio, Fatture**, preservando lo stesso ID progetto tra le pagine. È lo stesso componente di navigazione già esistente, non una seconda barra parallela. Da **Progetti → Vista rapida** puoi ora aprire direttamente **Sessioni del progetto**.

**Sessioni** mostra chiaramente quale progetto stai consultando, limita gli elementi operativi a quel progetto e permette di ritornare a **Vedi tutte le sessioni**. Le metriche generali mantengono il loro significato globale. Il caricamento dell'archivio PROGETTI usa paginazione verificata e segnala eventuali errori, senza trattare come completo un elenco tagliato a 1.000 righe.

**Audio Finder** riceve soltanto il progetto come contesto di scelta. Non effettua scansioni, collegamenti o creazioni automatiche: occorrono sempre file approvati, selezione esplicita e conferma. Il passaggio a **Fatture** usa il contesto informativo `collegaProgetto`: non avvia da solo inserimenti o ripartizioni. La voce esplicita **Collega fattura** nella vista rapida mantiene invece la funzione di avvio manuale esistente.

Nessuna modifica a schema, database, permessi, dati creativi o calcoli. Test di codice in CI non equivalgono a collaudo PWA autenticato su PC/smartphone.

## v2.68 — Studio Editor, modifiche sicure e popup contestuali (4 novembre 2026)

In **Studio Editor**, clicca una riga o *Modifica* per aprire il popup. Il salvataggio **invia solo i campi che hai davvero modificato**: gli altri valori sono preservati e non vengono riscritti, neppure se la UI li mostra in un formato differente. Gli eventuali campi precompilati automaticamente dopo la selezione di una fattura risultano tra quelli cambiati; un campo svuotato intenzionalmente salva `null`.

Il popup indica quanti campi sono cambiati; se premi **Annulla** o **X** senza salvare, chiede conferma prima di scartare le modifiche. Se esci dalla pagina con modifiche pendenti, il browser può mostrare il suo avviso. Durante **Salva modifiche** non puoi avviare un doppio invio; per un record invariato l'app non esegue scritture.

Un record collegato si apre **nel popup** e il salvataggio mantiene visibile la tabella di partenza. Prima di **Elimina Record** viene riportato tabella e ID; l'obiettivo resta quello selezionato, anche se altri eventi aggiornano la UI. I record di **Versioni audio** rimangono di sola lettura. Ricerca globale aggiorna l'indice dopo i salvataggi completati quando necessario.

Questa versione non cambia database, schema, autorizzazioni o archivi audio. I test automatizzati non sostituiscono il collaudo manuale in una sessione autenticata della PWA.

## v2.67 — Studio Editor: uso della ricerca e visualizzazione progressiva (4 novembre 2026)

**Lettura verificata:** apri Studio Editor, scegli una tabella e attendi che il contatore riporti i record verificati. La lettura non è più limitata silenziosamente a 1.000 record: usa pagine da 500, conteggio esatto e ordinamento per chiave. Se il totale è sconosciuto, il permesso nega la lettura, una pagina manca o l'archivio supera 30.000 righe, non mostra un elenco parziale come completo e propone **Riprova**. Le risposte tardive di un tab precedente non sovrascrivono il tab corrente.

**Griglia leggera:** mostra fino a 120 righe iniziali; **Mostra altre 120 righe** aggiunge visibilità senza altre query. Ricerca testuale e ordinamento agiscono su tutto l'insieme caricato e verificato, non solo sulle 120 righe visibili. Il contatore distingue *mostrate*, *corrispondenze* e *totale verificato*. Il CSV esporta l'intera tabella caricata, comprese le colonne nascoste. La selezione delle colonne non altera i record.

**Garanzie:** nessun cambiamento al salvataggio delle celle, ai moduli dati, alla proprietà dei file, ai segni SIAE o alle regole fiscali. I test di caricamento sono simulati; è ancora necessario un collaudo con accesso autorizzato alla PWA, sia desktop sia mobile. Vercel e database non sono stati modificati.

## v2.66 — Uso quotidiano di Ricerca, Editor e approvazioni (4 novembre 2026)

**Ricerca globale:** il comando **Aggiorna** nel popup rilegge su richiesta le sette fonti disponibili, con conteggi verificati come in v2.65. Un salvataggio completato nell'Editor o gli eventi espliciti di aggiornamento di fatture/progetti invalidano l'indice senza polling. Una lettura vecchia terminata dopo l'aggiornamento non può sostituire risultati nuovi. Se digiti prima che la verifica sia completata non compare un falso “zero risultati”: attendi la verifica oppure usa **Riprova** in caso di errore. Il tasto Invio apre il risultato solo quando stai digitando nella casella: i pulsanti del popup conservano la propria funzione.

**Riservatezza:** i risultati recenti restano solo nella memoria della pagina corrente, non in localStorage. Cambiare pagina o aprire una nuova sessione azzera i titoli recenti, evitando che un utente diverso sullo stesso dispositivo li legga prima di una nuova ricerca autenticata.

**Editor:** dopo un effettivo salvataggio pubblica un evento per aggiornare l'indice di ricerca. Se il callback di aggiornamento schermata fallisce, il messaggio distingue il record già salvato dall'errore della vista. Le verifiche di concorrenza, i campi modificati e le conferme delle relazioni non cambiano.

**Collaudo:** `npm run check` comprende `tools/test-cross-flow-v266.js` con simulazioni di indicizzazione, invalidazione e concorrenza, percorsi da risultato a scheda, limiti dell'Editor e conferme audio. La scheda `docs/v266-cross-flow-qa.md` elenca il collaudo manuale autenticato non ancora svolto. Nessun dato storico, autorizzazione o processo di creazione progetti è stato modificato. Nessun accesso Vercel.

## v2.65 — Ricerca globale, Editor e Archivio musicale (4 novembre 2026)

**Ricerca globale:** premi **Cerca** nel menu oppure Cmd+K su Mac o Ctrl+K su PC. La ricerca indicizza i record a cui il tuo account ha accesso in Progetti, Fatture, Invii, Documenti, Versioni, SIAE e IMAIE. Attende il conteggio esatto e legge tutte le pagine necessarie (fino a 30.000 righe per archivio): se una fonte non è verificabile non propone risultati incompleti ma mostra **Ricerca non disponibile** e il pulsante **Riprova**. I risultati visibili sono limitati a 30, con indicazione delle corrispondenze totali. Esc chiude il popup e torna al pulsante di partenza; le frecce navigano tra i risultati e Invio li apre. La ricerca non modifica i record.

**Studio Editor:** la casella **Filtra tabella corrente** filtra solo il dataset già caricato per la tabella selezionata. Non è il motore di ricerca di tutto il database. Per esplorare tutte le aree usa Cerca dal menu. Colonne e operazioni di modifica continuano a essere gestite dal modulo originale.

**Archivio musicale:** la ricerca e il confronto dei file audio rileggono e verificano gli archivi di riferimento senza il precedente taglio alle prime 2.500 o 5.000 righe. In assenza di copertura completa compare un messaggio di errore e gli inserimenti restano disabilitati. Quando un file somiglia al titolo di un tuo progetto, KYV lo segnala come possibile versione ma non lo preseleziona nella casella **Progetto da collegare (scelta manuale)**. Tu puoi scegliere un progetto esistente oppure usare il flusso **Crea un nuovo progetto** nella successiva finestra di conferma. **Seleziona per revisione** e **Rivedi selezionati** aiutano con più file ma mantengono le conferme necessarie. I file già archiviati mantengono il loro effettivo progetto collegato.

Non sono stati creati o collegati progetti durante l'aggiornamento. Nessuna scansione nascosta di PC o cloud, nessuna scrittura di nuove versioni senza tua selezione, nessuna migrazione o modifica a fatture/SIAE/diritti.

## v2.64 — Navigazione, tabelle e popup su mobile (4 novembre 2026)

**Oggi:** quando apri Home, la lista **Attività da chiudere** rimane in primo piano. L'area **Stato operativo** è richiesta solo quando vuoi approfondire; il **Controllo amministrativo** contiene i KPI storici. Per i grafici apri **Grafici di approfondimento**, per le tipologie di fattura apri **Fatture per tipologia**: non esiste più un ulteriore pannello duplicato che nasconda quelle due aree. Il pulsante **Nuovo** è nella sezione principale, mentre Agenda, Progetti, Ascolto e Pipeline sono collegamenti rapidi.

**Menu:** nel menu Produttore trovi **Pipeline & opportunità** subito dopo **Ascolto**, senza modifiche dell'ordine dopo il caricamento. Sul telefono, la barra inferiore contiene Home, Agenda, Nuovo, Progetti e Ascolto e indica il percorso attivo.

**Guida:** apri il pulsante **?**. Il focus si sposta nel popup e Tab/Maiusc+Tab circolano fra i suoi comandi. Esc chiude prima il popup della guida; il focus torna al pulsante ?. Quando la guida non è aperta, Esc può chiudere il menu laterale mobile.

**Tabelle:** le schede semplici possono adattarsi a card sul telefono; le tabelle con molte colonne e le aree di modifica/importazione si scorrono orizzontalmente senza perdere il contenuto. Le righe aggiunte vengono etichettate una sola volta e le etichette scelte da te restano tali. I dati caricati e i valori delle celle non sono trasformati da questa operazione.

I miglioramenti v2.64 non cambiano il valore delle fee, le classificazioni audio, gli incassi, gli estratti SIAE o le attribuzioni. L'uso in produzione va verificato separatamente.

## v2.63 — Utilizzo rapido di Home, Economia e Analyst (4 novembre 2026)

**Home:** consulta subito le attività da chiudere, i prossimi follow-up e i valori sintetici. Per i grafici apri **Grafici di approfondimento**: i filtri di fatturato emesso per tipologia, distribuzione per stato/fase e numero di progetti per artista sono indipendenti. Per la vista storica **PAGATA per tipologia** apri **Fatture per tipologia**; una spunta storica non dimostra la data di un pagamento. Se una lettura non riesce, la pagina segnala **dati non verificabili** e sostituisce gli importi con un trattino anziché un falso zero.

**Economia:** le funzioni operative più comuni restano in testata: ricerca, import XML Aruba, fattura multi-progetto, nuova fattura e ricarica. Il pulsante di riconciliazione incassi continua ad apparire nel modulo di pagamenti quando disponibile. Apri **Analisi e strumenti** per SIAE/IMAIE, KYV Intelligence, KYV Analyst e correlazioni. Il registro mostra subito **Fatture da incassare** con saldo residuo; premi **Fatture incassate** per aprire l'elenco dei saldi interamente ricevuti. Gli acconti compaiono nel riepilogo e nelle fatture ancora aperte: non vengono impropriamente spostati tra le saldate.

**KYV Analyst:** seleziona le verifiche principali oppure inserisci una domanda supportata dal motore a regole. Il grafico **Fatturato attribuito per artista** mostra soltanto valori attribuiti esplicitamente tramite progetti. Scegli **Primi 5, Primi 10 o Primi 20**: la selezione non modifica i filtri della Home, i dati amministrativi o le risposte. Apri **Approfondimento creativo** per consultare indicatori su sessioni, piazzamenti e fee zero. Il fatturato attribuito non va confuso con il totale fiscale emesso, e i progetti senza fatture non sono automaticamente progetti in perdita.

**KYV Intelligence** resta la schermata dedicata a confronti mensili e pluriennali con date dei movimenti verificate. Nessun dato è stato migrato o ricalcolato dal restyling.

## v2.62 — Scrivania creativa e Audio Finder: istruzioni (4 novembre 2026)

In **Scrivania creativa** puoi cambiare fra **Scrivania musicale**, **Sessioni** e **Piazzamenti**. Nel riepilogo musicale cerca per brano/artista/destinatario, apri **Filtri per artista, stato e attività** se vuoi filtri aggiuntivi, oppure apri **Analisi dei piazzamenti** per il grafico dell'intero archivio. **Azzera filtri** modifica solo questa panoramica. In Sessioni e Piazzamenti le ricerche sono indipendenti: puoi passare dall'una all'altra senza perdere il testo digitato. Apri **Indicatori di sessioni e piazzamenti** per il riepilogo generale, senza avere numeri duplicati sullo schermo.

Per registrare una **Sessione**, compila titolo, data, tipologia, partecipanti ed esito; se servono, apri **Luogo, durata e note**. Per un **Piazzamento** usa il brano esistente, destinatario, data invio, stato e follow-up; aggiungi dettagli nel pannello **Tipo destinatario, referente, risposta e note**. Il pulsante Modifica apre automaticamente i relativi dettagli; salvataggio, storicizzazione e annullamento dei collegamenti funzionano come prima. Se apri Piazzamenti dal riepilogo di un progetto, l'ID reale di quel progetto viene preselezionato, ma nessuna proposta viene registrata senza conferma.

In **Audio Finder** la sezione primaria è **Esplora i miei brani**: consulta soltanto i brani confermati come tuoi. La barra con quattro passaggi offre **I miei brani**, **Aggiungi audio**, **Controllo archivio**, **Versioni**. Premi **Aggiungi audio** per aprire la scelta manuale dei file/cartelle e dei provider disponibili; quando scegli dei file, compare la revisione guidata. **Controllo archivio** raccoglie l'audit (senza mutazioni), **Versioni** i raggruppamenti proposti per nome; le associazioni continuano a richiedere conferma esplicita. La **Coda di proposte** resta nel pannello richiudibile dedicato; il blocco **Dettagli e collegamenti avanzati** si apre quando selezioni il dettaglio del file. Nessun crawler autonomo, nessuna generazione automatica di progetti e nessun upload audio implicito.

## v2.61 — Come usare Progetti e Scheda Progetto (4 novembre 2026)

In **Progetti** trovi sempre la ricerca sull'intero archivio e i cinque filtri rapidi. Quando ti serve un filtro specifico, apri **Filtri e ordinamento**: seleziona Artista/Stato/Fase, scegli l'ordine e osserva quanti filtri sono attivi; con **Azzera filtri** torni al punto iniziale. Apri **Analisi archivio** per scegliere il grafico per Stato o Fase: le barre contano tutti i progetti caricati e sono indipendenti dalla lista filtrata. Cliccare una barra filtra i progetti e apre il filtro corrispondente.

Su smartphone non è necessario trascinare una tabella larga: ogni progetto appare come una scheda con titolo, artista, stato, prossima azione, attività e pulsanti. **Riepilogo** è un popup in sola lettura che si chiude con Esc o il pulsante ×; **Scheda** apre la sezione completa e permette gli interventi già esistenti. L'opzione Nuovo presenta ancora le modalità di cattura e selezione manuali.

Nella **Scheda Progetto**, il selettore **Cerca o cambia progetto** elenca inizialmente 12 risultati per non ingombrare; scrivi artista, titolo, management, label o ISRC per cercare nei dati caricati (fino a 80 risultati visualizzati). Quando apri un brano, il selettore si richiude come **Cambia progetto**. In modalità **Easy**, usa **Continua progetto** per scegliere Produzione, Invio, Release, Economia o Modifica: non vedrai doppioni della prossima azione e dei blocchi di navigazione. In **Completa** restano disponibili tutti i pannelli e i campi. Entrambe le viste utilizzano lo stesso database e gli stessi salvataggi protetti.

Non sono state alterate le regole di associazione audio, il valore delle fee, le date mancanti, i dati storici o i diritti delle operazioni.

## v2.60 — Navigazione semplificata e nuova base grafica (4 novembre 2026)

**Dove andare.** Le voci principali del menu includono Oggi, Agenda, Nuovo, Progetti, Scrivania creativa, Ascolto, Audio Finder e Tutte le app. Fatture emesse si trova in Amministrazione; non compare una seconda volta in Ogni giorno. Il gruppo Strumenti contiene gli strumenti specializzati senza ripetere Tutte le app. Sul telefono la barra inferiore apre direttamente Ascolto e non sostituisce più Rubrica dopo il caricamento. Puoi raggiungere i contatti da Strumenti/Launcher o dalla schermata dedicata.

**Scrivania musicale.** La barra contestuale in alto contiene soltanto Audio Finder e Guida, perché le navigazioni generiche sono già nel menu. Restano tutte le schede: Scrivania musicale, Sessioni, Piazzamenti, senza nuove copie delle funzioni.

**Audio Finder.** Cerca normalmente i tuoi brani, conferma Mio/Reference/Da verificare e associa i progetti solo su scelta esplicita. La scansione congiunta Drive + Dropbox già configurati si apre da **Scansione combinata di Drive e Dropbox** (pannello avanzato). In Dropbox, per collegamenti online facoltativi, apri **Dropbox online · autorizzazione OAuth**. Il pulsante Chooser e il registro archivio rimangono sempre disponibili, non è richiesto aprire l'area OAuth per consultarli. I pannelli richiudibili non eliminano o disabilitano alcun controllo.

**Aspetto.** Sono unificati spazi, bordi, card, contrasti, ingressi da tastiera, dimensioni touch e popup su 13 sezioni. Progetti safe è esclusa da questa fase per non compromettere il suo avvio isolato. La grafica delle viste storiche verrà consolidata nelle versioni successive senza alterarne dati e diritti.

## v2.59 — La nuova Scrivania musicale (4 novembre 2026)

Apri **Scrivania creativa**: la scheda iniziale **Scrivania musicale** mostra la situazione dei progetti realmente presenti in KYV. Gli indicatori in alto distinguono progetti, sessioni registrate, collegamenti a soli audio approvati come tuoi, piazzamenti e follow-up scaduti. Il grafico mostra la distribuzione per stato delle proposte registrate, non una conversione effettiva dei brani. I filtri indipendenti ricercano per artista, titolo, destinatario, titolo della sessione, stato e tipo. Per vedere i dettagli di un progetto premi **Apri riepilogo** e consulta il popup con collegamenti diretti alla Scheda Progetto, Audio Finder, Piazzamenti e Fatture. Le schede **Sessioni** e **Piazzamenti** mantengono le funzioni di inserimento e modifica.

Le card mostrano **Fee indicata** (un valore zero non è un insoluto) e, quando leggibili, le **Quote fatturate** assegnate esplicitamente tramite `PrezzoUnitario` o ripartizioni. Nel popup si distinguono gli **Incassi da movimenti registrati** di fatture attribuite direttamente al progetto: gli storni sono esclusi; i flag `PAGATA` legacy senza movimenti sono esposti separatamente; le quote degli incassi di una fattura condivisa non vengono ipotizzate. Se una delle quattro tabelle contabili è incompleta o non raggiungibile, la scrivania non inventa valori zero e mostra un avviso. Per il saldo completo usa Fatture → Riconciliazione.

Un progetto senza sessione o audio nel nuovo archivio non è necessariamente privo di lavoro svolto: potrebbe precedere la digitalizzazione. Un file audio collegato soltanto a una sessione non viene assegnato per analogia a ogni progetto di quella sessione. Nessun nuovo progetto, spostamento di file, invio a etichette, fattura o incasso è creato da questa scrivania.

## v2.58 — Ricerca cloud Dropbox/OneDrive con autorizzazione personale (4 novembre 2026)

**Dropbox online.** Nella pagina **Audio Finder → Dropbox** trovi tre flussi distinti: archivio KYV già registrato (esistente), Chooser ufficiale per selezione file (esistente), e la nuova ricerca **Dropbox online**. Per usare la terza, prima configura nella console Dropbox lo scope `files.metadata.read` e la redirect URI `https://<dominio>/kyv_audio_finder.html` per la app key pubblica presente in `config.js`. Premi **Autorizza Dropbox** e completa l'accesso; la sessione resta valida solo nella pagina aperta. Indica una cartella come `/Musica/Progetti` oppure lascia vuoto per la radice visibile all'app e premi **Cerca audio nella cartella Dropbox autorizzata**. La lettura è ricorsiva ma limitata a 10 pagine e 5.000 elementi; se limitata o interrotta, leggi la segnalazione di scansione parziale. Gli audio vengono mostrati in una coda provvisoria. L'hash Dropbox a blocchi non viene impropriamente promosso a SHA-256 dei byte e i file privi di link condivisibile non ricevono URL inventati.

**OneDrive online.** Il codice contiene OAuth 2.0 PKCE e la ricerca per nome mediante `Microsoft Graph /me/drive/root/search` con scope delegato `Files.Read`, senza modifiche ai file. La ricerca NON È ATTIVA senza: (1) app Microsoft Entra configurata come SPA e autorizzata agli account necessari; (2) redirect URI esatta della pagina Audio Finder; (3) `MICROSOFT_CLIENT_ID` pubblicato in `config.js`; (4) migrazione `docs/v258-onedrive-provider.sql` verificata nel database; (5) flag `ONEDRIVE_INDEX_ENABLED: true` dopo verifica. Fino al punto 3 non puoi collegarti, e fino ai punti 4–5 eventuali risultati OneDrive non possono essere salvati nel catalogo: sono solo anteprime. Non occorre alcun client secret. In alternativa restano disponibili i file da una cartella OneDrive sincronizzata e selezionata manualmente su PC.

**Revisione comune.** Conferma **Mio / Reference / Da verificare** per ogni file; il salvataggio è sempre una seconda operazione esplicita. Solo i tuoi file approvati possono poi essere collegati a un progetto esistente: non si deduce dal nome. La creazione diretta di un nuovo progetto dal dettaglio OneDrive non è abilitata finché non è verificato il flusso di archiviazione. OAuth non persiste access token in Supabase, localStorage, repository o documenti; lo stato PKCE temporaneo è nel sessionStorage. La pagina non scandisce nulla alla riapertura o dopo il redirect. Nessun login reale, migrazione SQL o accesso Vercel effettuato da questo aggiornamento.

## v2.57 — Controllo operativo dell'archivio audio (4 novembre 2026)

Nella pagina **Audio Finder** apri la sezione **Controllo archivio audio** (all'inizio della pagina). L'app legge i record che hai autorizzato e mostra quattro indicatori: da classificare nella scansione corrente, tuoi audio ancora senza progetto KYV collegato, possibili copie con veri hash SHA-256 identici e progetti senza audio personale collegato **in KYV**. Quest'ultimo numero può comprendere anche progetti storici gestiti altrove: non indica necessariamente una mancanza.

Usa **Cerca**, **Tipo verifica** e **Fonte** per restringere i risultati. Gli indicatori mostrano le quantità globali; il filtro fonte seleziona solo le verifiche audio della fonte e non attribuisce file a progetti mancanti. Premi **Dettaglio / collega manualmente** per aprire un audio personale, **Apri nella scansione corrente** per un audio non classificato o **Apri Scheda Progetto** per un progetto. Per vedere tutte le categorie, inclusi i progetti, scegli **Tutte le sorgenti**. La scansione deve essere aperta per poter classificare file non ancora confermati come tuoi.

Il pannello è una diagnostica senza salvataggi: non considera tue reference o file di altri, non deduce un nuovo progetto da un nome e non elimina copie. Un hash identico verifica i byte, non un contratto o l'appartenenza musicale. Continua a collegare solo dopo una tua selezione e conferma negli strumenti esistenti.

## v2.56 — Filtrare davvero le versioni per archivio (3 novembre 2026)

In **Audio Finder → Brani e versioni** apri il gruppo di un brano già approvato come **Mio**. Nel menu **Sorgente** scegli **Drive**, **Dropbox**, **Dispositivo locale** oppure **Tutte le sorgenti**. Se scegli ad esempio Drive, compariranno nella scheda soltanto file Drive e potrai spuntare e collegare soltanto quelli. Per vedere gli altri file della stessa canzone devi tornare a **Tutte le sorgenti**. Cambiare la sorgente cancella le spunte e il progetto selezionato (non cambia alcun dato salvato).

Scegli versioni singole oppure al massimo 25 file distinti, scegli un progetto esistente e premi **Collega solo le versioni selezionate**. Il popup mostra il progetto di destinazione e i file selezionati: verifica entrambi prima di confermare. Una seconda verifica contro il database e i filtri in uso blocca collegamenti obsoleti o non più visibili. La scansione non carica audio, non crea progetti e non decide per te.

## v2.55 — Separazione prudente dei brani omonimi (3 novembre 2026)

Apri **Audio Finder → Brani e versioni** dopo aver confermato i file come **Mio**. Se due file riportano lo stesso titolo ma solo uno specifica l'artista, appaiono in gruppi **separati**: non attribuire il file senza artista a un progetto soltanto perché il titolo coincide. I gruppi senza artista riportano un avviso; sono ipotesi da controllare ascoltando o verificando i nomi, non prove di proprietà.

Usa ricerca, sorgente e filtro **Più versioni/Tutti/Da collegare**. Se la modifica nasconde il gruppo aperto, le spunte precedenti e il progetto scelto sono annullati. Il filtro sorgente seleziona i gruppi che contengono quella sorgente, mentre il dettaglio può mostrare file di più archivi. Apri il gruppo, scegli versioni **distinte**, scegli tu il progetto e conferma nel popup. Per creare un progetto nuovo, resta necessario aprire il singolo file e confermare la proposta separata. Nessun dato storico cambia automaticamente.

## v2.54 — Revisione guidata di file audio e versioni (3 novembre 2026)

**Audio Finder → Verifica unificata e incrementale** ora propone gruppi di file con titolo e artista compatibili per agevolare la revisione di centinaia di demo, mix, master e altre versioni. I gruppi riguardano **solo i file emersi nella scansione avviata manualmente**, prima della classificazione, e sono costruiti da nomi/metadati: non è riconoscimento acustico, non provano che il file sia tuo, non collegano progetti. I brani omonimi con artisti dichiarati diversi vengono mantenuti separati; i file con artista non dichiarato restano in un gruppo distinto. I titoli generici o non riconoscibili rimangono elementi individuali da esaminare.

**Filtri e ricerca dei gruppi:** testo libero per titolo/artista, fonte, gruppi «Da esaminare / Con più versioni / Tutti i gruppi», elenco progressivo con pulsante per mostrare altri gruppi. Aprire un gruppo restringe la coda ai suoi file e permette di ascoltare i file locali riselezionati; «Mostra di nuovo tutti i file» torna alla coda completa. Le scelte individuali `mio/reference/da_verificare` funzionano come nelle versioni precedenti.

**Classificazione in massa più sicura:** seleziona manualmente le singole caselle oppure usa **Seleziona fino a 100 file da verificare, visibili**. Quindi scegli **Conferma come miei solo i file spuntati** o **Escludi come reference solo i file spuntati**. Una finestra riepiloga il numero preciso e chiede conferma; la modifica resta **in memoria** finché non premi **Salva le classificazioni e gli aggiornamenti confermati**, che conserva la precedente rilettura del database e i controlli contro modifiche concorrenti. Non si riclassificano in massa reference già escluse, brani già approvati, metadati già modificati o decisioni individuali già prese: quei casi richiedono una scelta singola. Cambiare filtro o gruppo azzera le caselle spuntate, evitando operazioni su elementi nascosti. Le classificazioni effettive non vengono perse cambiando filtro, ma si perdono solo scartando la scansione o prima di iniziarne un'altra previo avviso.

**Limiti:** il caricamento resta on-demand e dipende dagli account Drive già configurati, dall'archivio Dropbox KYV già registrato o dalla selezione locale autorizzata. Non si esplora autonomamente tutto Dropbox o OneDrive, non si leggono dischi/telefoni senza scelta, non si caricano audio su Supabase e non si creano, modificano o collegano progetti per semplice classificazione o raggruppamento. I collegamenti e la creazione restano attività successive e confermate dall'utente.

## v2.53 — Scansione cloud combinata, versioni tra sorgenti e revisione personale (3 novembre 2026)

In **KYV Audio Finder** è disponibile **Analizza sorgenti cloud insieme**. Seleziona **Google Drive configurati** e/o **Archivio Dropbox registrato** e premi il pulsante per avviare una scansione **solo su tua richiesta**. Le due letture sono indipendenti: anche se una fonte restituisce un errore o raggiunge un limite, puoi verificare i file rilevati dall'altra. Un rapporto mostra il numero di risultati, identità ripetute, eventuali errori, anomalie e scansioni parziali. **Dropbox non viene esplorato nell'intero account:** il pulsante batch legge soltanto i file che KYV ha già registrato in `DROPBOX_AUDIO_FILES`; per scegliere altri file si usa separatamente Dropbox Chooser. OneDrive online non è ancora collegato e i file locali richiedono sempre selezione esplicita dal dispositivo.

I file vengono riuniti secondo **provider + account + external_key**, e non per nome. I record letti più volte con identità identica vengono visualizzati una sola volta nella coda; se la stessa identità presenta metadati discordanti, l'app segnala un'anomalia senza inventare una fusione di versioni. Audio identici in provider differenti restano record distinti finché l'utente non sceglie un collegamento. La ricerca è limitata a massimo 5000 file incontrati complessivamente: oltre il limite si deve restringere la selezione. Nessuna scansione crea o elimina record automaticamente.

Le nuove proposte di possibili versioni si basano soltanto sul confronto con il catalogo degli **audio già approvati come propri**. Un hash SHA-256 realmente identico prova che i byte dei file confrontati coincidono, ma non sostituisce la decisione di appartenenza o di progetto. Titolo, artista e dimensione simili sono **indizi da verificare**, non duplicati certi. Le classificazioni **mio/reference/da verificare**, gli aggiornamenti incrementali e le associazioni ai progetti mantengono conferme esplicite separate. Nessun nuovo progetto viene creato per scansione o suggerimento.

Il pulsante è un'operazione on-demand nel browser e **non è uno scanner persistente, un crawler completo di Dropbox o un'integrazione diretta OneDrive**. È possibile continuare a scegliere cartelle o file su Mac, PC e telefono tramite i selettori già presenti. L'app non carica contenuti audio su Supabase e non modifica dati storici con la sola ricerca.

## v2.52 — Sincronizzazione incrementale assistita (3 novembre 2026)

In **Audio Finder**, ogni nuova scansione avviata dall'utente confronta i metadati dei file selezionati con `KYV_AUDIO_INDICE` e le decisioni già salvate in `KYV_AUDIO_DECISIONI`. Identità della sorgente = **provider + account + external_key**, non solo titolo. La coda mostra **nuovi**, **metadati modificati**, **già indicizzati senza variazioni rilevate**, **revisione non verificabile**, **reference escluse** e **classificazione sospesa**. Il filtro iniziale evidenzia gli elementi da esaminare; è disponibile anche «Tutti i risultati».

**Nessun aggiornamento automatico:** una scansione di soli file già noti è un'operazione senza scritture. Il file già approvato con metadati cambiati mostra **Confermo aggiornamento metadati del mio file**; solo un clic seguito da conferma e **Salva** rende la modifica effettiva. Ogni classificazione resta esplicita. Prima delle scritture l'app rilegge i dati e rifiuta salvataggi basati su revisioni o classificazioni cambiate in un'altra sessione. I file privi di nuovi metadati non sovrascrivono dimensione, data, link o hash precedentemente verificato. Il motore non inserisce campi tecnici di scansione nel database, non cancella file assenti, non elimina versioni, non crea né associa progetti.

**Versioni e duplicati:** per nuovi file e metadati modificati vengono mostrate proposte di possibili versioni dal titolo/artista nel nome; non vengono dedotte identità musicali dall'uguaglianza del titolo. Artisti esplicitamente differenti sono esclusi dalle proposte; solo veri hash SHA-256 identici vengono descritti come copie verificate. Per file locali l'identificativo riflette nome/percorso relativo, dimensione e data di modifica: una modifica può produrre una nuova identità che richiede una nuova classificazione, senza fusione automatica.

**Copertura scansioni:** il connettore Google Drive ora dichiara `truncated` quando raggiunge il numero massimo di pagine mantenendo un `nextPageToken`. La UI segnala **Scansione Drive PARZIALE** e non interpreta mai i file non trovati come cancellati. Dropbox continua a leggere l'archivio esistente o i file esplicitamente scelti con Chooser; non esiste una scansione continua dell'intero account. OneDrive online resta futuro. Non vengono letti file del dispositivo senza selezione manuale né caricati audio binari su Supabase.

## v2.51 — Esploratore unico audio personali (3 novembre 2026)

**KYV Audio Finder → Esplora i miei brani** riunisce in una sola vista i metadati di tutti e soli gli audio già **classificati esplicitamente come lavori tuoi** in `KYV_AUDIO_DECISIONI`: file locali selezionati su PC/Mac, telefono, Google Drive collegati e archivio audio Dropbox. Puoi cercare nomi/cartelle/account tra le sorgenti, filtrare per provider, account e stato di collegamento, ordinare per nome, data di modifica o dimensione, e aprire il dettaglio per collegare manualmente un progetto. Nessun file non classificato o reference appare nei risultati personali. L'interfaccia tecnica rimane sotto **Dettagli e collegamenti avanzati**.

Dalla scheda **Dropbox** puoi ora aprire il **Chooser ufficiale** direttamente in Audio Finder e selezionare più file audio. Il selettore richiede dominio autorizzato e Dropbox App Key già configurata; NON equivale a un accesso API a tutte le cartelle dell'account. La ricerca nel vecchio archivio `DROPBOX_AUDIO_FILES` rimane separata. I link scelti passano per una validazione dell'host Dropbox e la stessa **coda di classificazione manuale**, non per creazione automatica di progetti. Per Drive si continua a utilizzare il connettore e la lettura paginata esistente (con limiti dichiarati). OneDrive online non è ancora connesso.

**Ascolto locale:** selezionando un file audio dal dispositivo puoi premere **Ascolta file locale** nella coda oppure **Ascolta** nel catalogo dei file approvati della scansione corrente. Il player crea un URL temporaneo del browser, senza upload dell'audio o memorizzazione del file nel database. L'URL viene revocato cambiando scansione, scartando l'anteprima o abbandonando la pagina. I file locali da scansioni precedenti richiedono nuova selezione. Per i file cloud si apre il riferimento originale nel provider, se valido e accessibile: la riproduzione in-app non è garantita dalle autorizzazioni del provider.

**Coda di acquisizione:** ricerca temporanea per nome, cartella, account e filtro mio/reference/da verificare. Le azioni massive si applicano a un massimo di 100 file effettivamente visibili nella vista filtrata, sempre dopo conferma. Le reference non entrano nel catalogo. Per creare o collegare un progetto occorre una seconda selezione/approvazione nel dettaglio, secondo il flusso v2.48/v2.49.

Nessuna migrazione di database, nessuna scansione permanente o nascosta dei dispositivi e nessun accesso completo a Dropbox/OneDrive in questa release. Nessun progetto è creato durante ricerche, scelte cloud o ascolti.

## v2.50 — Progetti semplici, ricerca completa e grafici verificabili (3 novembre 2026)

La pagina **Progetti** continua a lavorare in modalità sicura/sola lettura ed espone una **Vista rapida** in popup: titolo, artista, stato e fase registrati, ultima attività datata, sessione, follow-up e uscita. Il popup non carica altri archivi e offre pulsanti per scheda completa, Audio Finder e collegamento fattura. Le modifiche si effettuano soltanto nella scheda. La pagina legge ora l'intero elenco PROGETTI a blocchi paginati con conteggio completo: se i dati non sono leggibili integralmente, mostra un errore e non risultati parziali. La ricerca non è limitata alle prime 40 schede recenti.

**Filtri:** ricerca titolo, artista, stato, fase, note; filtri indipendenti/combinabili per artista, stato, fase e modalità Recenti/Da fare/In attesa/Usciti/Tutti; ordinamento per attività, artista, titolo, follow-up o attività meno recente. Vista compatta/dettagliata, 50 righe alla volta, Azzera filtri. Il grafico **Panoramica archivio** è indipendente dalla selezione della tabella e mostra il numero di progetti per STATO o SVILUPPO, compresi i valori **Non indicato**; un clic su una barra applica un filtro esplicito alla tabella. Non si inventano stati, date o somme economiche.

La Home ha nuovi grafici **indipendenti**, ognuno con i propri filtri: fatturato emesso per anno/tipologia **solo PrezzoUnitario**, conteggio dei progetti per stato o fase, conteggio per artista (top 10, 20 o tutti). Il vecchio grafico **Top Artisti — fatturato** basato su `ID_PROGETTO` e flag `PAGATA` non è più utilizzato, perché le fatture possono ripartirsi fra più progetti. Ogni grafico espone copertura e dati mancanti. I riepiloghi incasso della Home ancora basati sullo storico `PAGATA` sono espressamente indicati come **stima da flag**; per gli incassi bancari verificati si usa Fatture/KYV Intelligence.

Nessuna migrazione del database, nessuna scrittura ai dati storici e nessun caricamento autonomo di audio, file esterni o credenziali. I grafici sono calcolati dai record già letti dalla Home.

## v2.49 — Gruppi proposti di demo, mix e master

Apri **Audio Finder** e carica/approva come **miei** solo i lavori propri tramite la coda v2.48. Nella nuova sezione **Brani e versioni**, i file di più sorgenti sono riuniti in gruppi possibili in base ai nomi. Usa i filtri **Più versioni / Tutti i brani / Da collegare**, la ricerca libera e il filtro sorgente. Se due artisti hanno brani omonimi, verranno separati quando i nomi dei file permettono di riconoscerli; le versioni senza artista possono restare in un gruppo ambiguo. Il sistema **non analizza l'audio** e non può garantire che la somiglianza di nome indichi lo stesso brano.

Apri un gruppo, controlla i file, scegli fino a 25 versioni non collegate, seleziona **manualmente** un progetto già esistente e premi **Collega solo le versioni selezionate**. Conferma nel popup: il sistema rilegge le associazioni ed evita doppioni. Puoi ripetere per le altre versioni.

Per creare un progetto usa il pulsante **Dettaglio** di un singolo file personale, poi **Apri proposta progetto / versione**. Nel popup devi scegliere fra progetto esistente o **Crea un nuovo progetto**; la scelta non è mai precompilata dal sistema. Dopo il salvataggio atomico della versione viene associato il file al catalogo Finder, con avviso se il secondo passaggio non riesce. Nessun progetto viene creato dagli algoritmi di raggruppamento o dalla scansione.

Sono supportati gli audio locali **selezionati** da PC/Mac/Android o da File su iPhone, e i provider cloud già disponibili nel Finder. Accesso completo e continuativo ai dischi, ricerca Dropbox sull'intero account e OneDrive online richiedono passaggi futuri separati.

## v2.48 — Audio personali, PC/Mac e smartphone (3 novembre 2026)

KYV Audio Finder non presume più che qualsiasi audio letto da una cartella autorizzata sia un tuo brano. Dopo aver scelto una cartella su PC/Mac o file da PC, Android o dall'app File su iPhone, compare la coda **Mio / Reference / Da verificare**. Ogni file è inizialmente da verificare; soltanto i file marcati **esplicitamente** "È un mio lavoro" vengono indicizzati e potranno essere collegati a progetti. Le reference vengono ricordate soltanto per identità sorgente (non sono archiviate le loro tracce audio, nomi, URL o percorsi), così la scansione successiva le riconosce come escluse. I file in attesa non entrano nel catalogo.

La classificazione può avvenire file per file o per i primi 100 file visibili, previa conferma. Premendo **Salva soltanto le scelte confermate** si registrano le decisioni e si indicizzano soltanto i file approvati, senza trasferire audio binari né creare progetti. Il comando **Apri proposta progetto / versione** compare soltanto dopo che un file personale è stato approvato e selezionato nel catalogo: apre un ulteriore popup per scegliere progetto esistente o crearne uno nuovo. Nessun progetto si crea dalla scansione, dal nome o automaticamente.

Le cartelle di smartphone non vengono scandite in background: iOS utilizza il file picker, Android supporta la scelta esplicita di file e in alcuni browser di cartelle; il browser non accede a cartelle non selezionate. La connessione OneDrive online, lo scanner persistente e un vero browser Dropbox/Drive cloud sono ancora **future fasi**, non sono dichiarati attivi.

In **Progetti**, la ricerca ora opera sull'intero archivio caricato anche con la scheda Recenti: il limite delle 40 righe si applica soltanto quando non si sta cercando.

Il database additivo `KYV_AUDIO_DECISIONI` conserva owner, provider, account_label, external_key e decisione, protetto da RLS. Non modifica le 175 schede, le fatture, i progetti storici o le cartelle dei dispositivi.

## v2.47 — Duplica riga, più progetti su una fattura (3 novembre 2026)

Apri **Fatture emesse**. Per creare una nuova fattura che comprende più brani usa **Nuova multi-progetto**: compila numero originale, data, cliente, PrezzoUnitario gestionale e, se necessario, totale fiscale separato. Nella prima riga scegli progetto e quota unitario; premi **Duplica riga** per creare una seconda quota: descrizione copiata, progetto e importo lasciati vuoti per evitare doppio conteggio. **Riporta fee** legge la FEE del progetto come proposta modificabile. Puoi aggiungere più righe allo stesso progetto per fee/tranche differenti.

Per una fattura già esistente premi **Ripartisci / Duplica riga** nella sua riga in Fatture; il documento non viene duplicato e i dati fiscali restano intatti. Dalla Scheda Progetto usa **Aggiungi quota a fattura esistente / Duplica riga**, poi seleziona una fattura dall'elenco. La somma delle quote non può superare il PrezzoUnitario della fattura, con avviso quando resta un importo da attribuire. Il salvataggio è un'unica transazione; la sostituzione delle quote non cambia lo storico delle fatture né i bonifici. Tutte le righe restano reversibili nel pannello tramite rimozione e salvataggio.

**Contabilizzazione:** per i calcoli economici si usa **PrezzoUnitario**, mai il totale fiscale `ImportoTotaleDocumento`. Una stessa fattura è contata una sola volta nel fatturato globale; le quote sono conteggiate nei singoli progetti. Un bonifico di una fattura multi-progetto non viene attribuito automaticamente ai brani: il pagamento resta a livello documento fino a ripartizione verificata. Le fatture XML con più DettaglioLinee devono avere il PrezzoUnitario gestionale corretto, senza inferirlo dal totale fiscale.

## Nota operativa 3 novembre 2026 — Importazione XML Aruba

Se l'app mostra “Duplicato intercettato dal database” pur riportando “0 duplicati” nella lettura dei file, controllare prima il vincolo che ha fallito. Un errore su `FATTURE1_pkey` / `ID_FT` indica che il contatore automatico potrebbe essere rimasto indietro rispetto alle fatture storiche: **non prova** che il file XML sia già presente. È stato verificato e corretto un caso con massimo ID 107 e sequenza a 5, ora riallineata a 107 senza modifiche ai record. L'importatore hotfix distingue da qui in avanti errore ID interno e duplicato SHA-256 effettivo. Dopo il riallineamento, riaprire il pannello, riselezionare il file, verificare progetto opzionale e importare; controllare che la fattura compaia nel registro (inizialmente non incassata). Non creare duplicati manuali, né cambiare gli ID esistenti.

# KyvManagerPro — Manuale Operativo Super Esteso v2.24

Questo manuale descrive KyvManagerPro come **assistente operativo per KYV / Vincenzo Centrella**, produttore musicale che deve seguire molti brani, artisti, manager, label, autori, sessioni, file audio, contratti, quote, diritti, fatture, incassi e spese.

L’obiettivo non è solo archiviare dati. L’obiettivo è costruire un percorso professionale che dica sempre:

- cosa è stato fatto;
- cosa si sta facendo;
- cosa manca;
- chi va ricontattato;
- quale file è stato mandato;
- quali diritti o soldi rischiano di restare scoperti;
- dove sono le prove documentali.

## Novità operativa v2.24 — percorso guidato verificato

Aprire **Percorso Brano** all’inizio della giornata. Prima di suggerire attività, la pagina controlla che progetti, versioni audio, invii, documenti, consegne e fatture siano realmente leggibili.

- **Verde:** fonti complete e archivio `AUDIO_VERSIONI` attivo; le priorità sono affidabili.
- **Giallo:** fonti storiche complete ma `AUDIO_VERSIONI` non ancora installata; l’Assistente funziona in compatibilità.
- **Rosso:** almeno una fonte necessaria non è leggibile; calcoli, ricerche e copie delle azioni vengono sospesi per non proporre attività false.

Per ogni brano leggere la percentuale di completamento e usare **Fai ora**. Il comando apre direttamente la parte della Scheda Progetto che contiene il dato da completare. Usare **Pianifica** solo quando serve fissare un sollecito o una data di follow-up; usare **Scheda** quando si vuole una lettura generale del progetto.

La 2.24 non aggiunge tabelle e non richiede SQL. Conserva la migrazione 2.23 per l’archivio audio unificato. La v2.22 sulla protezione degli accessi resta sospesa.

## Novità operativa v2.23 — archivio audio affidabile

Prima di creare un progetto partendo da Drive o Dropbox, eseguire `SUPABASE_MIGRATION_V2_23_AUDIO_VERSIONI.sql` nel SQL Editor di Supabase. La migrazione crea `AUDIO_VERSIONI`, recupera le versioni già presenti negli archivi precedenti e abilita il salvataggio unico di progetto più versione audio.

Nella pagina Archivio Musicale controllare sempre il messaggio sopra i risultati:

- verde: confronto unificato e salvataggio atomico attivi;
- giallo: modalità compatibilità, nuovo progetto più versione bloccati finché non viene installata la migrazione;
- rosso: uno degli archivi non è leggibile, quindi ricerca e inserimenti sono disabilitati per evitare duplicati.

Quando compare “Nuova revisione”, verificare file, progetto e versione: lo stesso elemento cloud risulta modificato rispetto a quello archiviato. La v2.22 sulla protezione degli accessi resta sospesa e non è sostituita da questa migrazione.

---

## 1. Il viaggio completo del brano

### 1. Contatto / opportunità

**Modulo principale:** CRM + Progetti + Assistente  
**Significato:** Arriva una proposta da artista, manager, label, autore o editore.

**Passaggi da fare:** Creare o aggiornare il contatto; creare un progetto anche provvisorio; annotare chi ha chiesto cosa e qual è il prossimo passo.

**Passaggi che si potrebbero fare per essere più professionali:** Preparare una scheda contatto più completa, allegare screenshot della chat, creare evento Calendar o cartella Drive.

### 2. Brief e preparazione sessione

**Modulo principale:** Sessioni Studio + Calendar + Progetti  
**Significato:** La sessione deve essere pianificata e tracciata.

**Passaggi da fare:** Compilare Data_Sessione, artista, autori, manager, label, obiettivo della sessione, note operative.

**Passaggi che si potrebbero fare per essere più professionali:** Inviare recap di convocazione, preparare cartella Drive, caricare reference o appunti.

### 3. Sessione in studio

**Modulo principale:** Sessioni Studio + Scheda Progetto  
**Significato:** Nascono idee, ruoli creativi, contributi, topline, testi, beat, parti suonate.

**Passaggi da fare:** Annotare presenti, ruoli, contributi, strumenti suonati da KYV, note su quote provvisorie.

**Passaggi che si potrebbero fare per essere più professionali:** Copiare checklist sessione, salvare foto/screenshot/appunti, creare documento recap.

### 4. Demo / pezzo grezzo

**Modulo principale:** Progetti + Audio Dropbox + Assistente  
**Significato:** Il brano esiste ma non è ancora chiuso. Rischia di restare fermo.

**Passaggi da fare:** Aggiornare STATO/SVILUPPO, salvare versioni demo, registrare invii in ascolto, impostare follow-up.

**Passaggi che si potrebbero fare per essere più professionali:** Inviare demo a manager/label/artista, registrare feedback, creare versione successiva.

### 5. Lavorazione / revisioni

**Modulo principale:** Scheda Progetto + Audio Dropbox  
**Significato:** Arrivano modifiche, feedback, richieste di mix, arrangiamento, topline o produzione.

**Passaggi da fare:** Aggiornare note, registrare file inviati, distinguere versioni, segnare cosa è stato approvato e cosa no.

**Passaggi che si potrebbero fare per essere più professionali:** Salvare più versioni Dropbox, chiedere conferma scritta, archiviare screenshot in Drive.

### 6. Master / pre-release

**Modulo principale:** Audio Dropbox + Protezione Brano  
**Significato:** Il file è consegnabile ma bisogna provarne versione, data e destinatario.

**Passaggi da fare:** Caricare file su Dropbox, salvare link in Supabase, scegliere file locale per hash SHA-256, registrare invio e conferma.

**Passaggi che si potrebbero fare per essere più professionali:** Generare messaggio WhatsApp/email, salvare prova Drive, verificare ISRC e data uscita.

### 7. Contrattazione

**Modulo principale:** Progetti + Documenti + Schede dati  
**Significato:** Fee, roy, kill fee, percentuali e contratti devono essere chiari.

**Passaggi da fare:** Compilare FEE, ROY, Anticipo_Kill_Fee, quote, contratto link, data contratto, pagamento.

**Passaggi che si potrebbero fare per essere più professionali:** Richiedere contratto, split sheet, conferma quote, liberatorie, NDA o accordo produzione.

### 8. SIAE / IMAIE / protezioni

**Modulo principale:** Protezione + Quote + Autori + Schede dati  
**Significato:** Serve non perdere diritti d’autore e diritti connessi.

**Passaggi da fare:** Verificare quote SIAE, codici IPI, ISWC, ISRC, ruolo IMAIE KYV, produttore fonografico, ricevute.

**Passaggi che si potrebbero fare per essere più professionali:** Generare richiesta dati SIAE/IMAIE, archiviare ricevute Drive, controllare rendiconti.

### 9. Fattura / incasso / spese

**Modulo principale:** Fatture + Fisco + Spese Extra  
**Significato:** Il lavoro deve diventare incasso tracciato e costo contabilizzato.

**Passaggi da fare:** Creare/collegare fattura, segnare pagata/non pagata, registrare spese, controllare piano fiscale.

**Passaggi che si potrebbero fare per essere più professionali:** Importare estratto conto, categorizzare costi, preparare recap per commercialista.

### 10. Archivio e memoria storica

**Modulo principale:** Scheda Progetto + Report + Drive  
**Significato:** Il progetto deve restare ricostruibile nel tempo.

**Passaggi da fare:** Aprire scheda unica e controllare che audio, invii, documenti, fatture, spese e protezione siano presenti.

**Passaggi che si potrebbero fare per essere più professionali:** Chiudere progetto, esportare report PDF, salvare recap finale in Drive.


---

## 2. Regola di fondo: dove stanno le cose

- **Dropbox** contiene i file audio pesanti: demo, master, stems, mix, revisioni.
- **Supabase** contiene i dati strutturati: link, hash, progetti, invii, conferme, fatture, documenti, spese.
- **Drive** contiene documentazione e prove: contratti, split sheet, liberatorie, screenshot WhatsApp/mail, ricevute SIAE/IMAIE.
- **KyvManagerPro** collega tutto e trasforma i dati in azioni.

La cosa importante è non confondere archivio e prova: il file può stare su Dropbox, ma l’invio deve essere registrato in Supabase e la prova può stare su Drive.

---

## 3. Manuale pagina per pagina

## Panoramica / Dashboard — `index.html`

**Fase del viaggio:** Controllo giornaliero generale

### Funzione
È la prima pagina da aprire. Serve a vedere il quadro complessivo: andamento economico, scadenze operative, collegamenti rapidi e moduli più urgenti. Non sostituisce le pagine specialistiche, ma ti dice dove andare.

### Quando si usa
Ogni mattina o prima di iniziare una giornata di lavoro. Utile anche dopo un deploy o dopo aver aggiornato molti dati.

### Sezioni interne
- **Radar operativo**: Mostra indicatori sintetici su sessioni, progetti, master, fatture, protezione e attività recenti.
- **Quick access**: Porta rapidamente ad Assistente Produzione, Sessioni Studio, Scheda Progetto e Protezione Brano.
- **Dati economici**: Riassume importi, fatture, pagamenti e stato amministrativo generale.

### Bottoni e azioni
- **Aggiorna**: Ricarica i dati da Supabase e aggiorna i riepiloghi. Usalo dopo modifiche fatte in altre pagine.
- **Assistente KYV**: Apre il percorso guidato del brano, cioè la pagina che suggerisce cosa fare oggi.
- **Apri Sessioni**: Apre Sessioni Studio per vedere sessioni, follow-up e progetti da lavorare.
- **Scheda Progetto**: Apre l’hub del singolo brano/progetto.
- **Protezione**: Apre il radar legale/burocratico SIAE, IMAIE, contratti, master, fatture.

### Dati con cui interagisce
Legge principalmente PROGETTI, FATTURE, Spese Extra e dati operativi collegati ai moduli recenti.

### A cosa mira
Dare una risposta rapida a: “Dove devo entrare adesso?”

---

## Assistente Produzione — `assistente.html`

**Fase del viaggio:** Viaggio completo del brano

### Funzione
È il cuore concettuale del sistema. Traduce i dati del database in stati operativi: contatto, sessione, lavorazione, master, ascolto senza risposta, diritti, amministrazione. Serve a non dimenticare pezzi fermi e a capire cosa fare prima.

### Quando si usa
Quando vuoi capire le priorità della giornata, preparare un recap, recuperare pezzi fermi o fare una call con management/collaboratori.

### Sezioni interne
- **Priorità**: Elenca progetti che richiedono azione: follow-up, dati mancanti, file inviati senza conferma, contratti o fatture assenti.
- **Kanban**: Organizza i progetti per fase del percorso: brief, sessione, lavorazione, ascolto, diritti, amministrazione.
- **Metodo**: Spiega il ragionamento operativo: non archiviare passivamente, ma trasformare ogni mancanza in una prossima azione.
- **Ricerca**: Filtra per artista, titolo, label, manager o parola chiave.

### Bottoni e azioni
- **Aggiorna**: Rilegge i dati da Supabase e ricalcola priorità e stati.
- **Copia brief di oggi**: Crea un testo riepilogativo con priorità operative da incollare in WhatsApp, note o recap.
- **Scheda progetto**: Apre la scheda unica del progetto selezionato.
- **Priorità**: Mostra la vista focalizzata sulle azioni urgenti.
- **Kanban**: Mostra la vista a colonne per fase del brano.
- **Metodo**: Mostra la spiegazione della logica di lavoro.
- **Copia follow-up**: Nelle card, copia un messaggio operativo sul singolo progetto con azione consigliata e dati mancanti.

### Dati con cui interagisce
Legge PROGETTI, DROPBOX_AUDIO_FILES, INVII_AUDIO, DOCUMENTI_PROGETTO, CONSEGNE_MASTER, FATTURE, Spese Extra.

### A cosa mira
Diventare l’assistente quotidiano di KYV: cosa seguire, chi ricontattare, cosa manca, cosa rischia di essere dimenticato.

---

## Progetti & Uscite — `progetti.html`

**Fase del viaggio:** Archivio centrale del brano

### Funzione
È la tabella madre. Ogni brano, produzione, uscita, demo o sessione importante deve esistere qui. Tutti gli altri moduli ruotano intorno al progetto.

### Quando si usa
Quando nasce un nuovo brano, cambia stato, vengono definiti fee/roy/quote, si aggiunge ISRC, data pubblicazione, contratto o pagamento.

### Sezioni interne
- **Lista progetti**: Mostra tutti i progetti musicali e permette ricerca/filtri.
- **Filtri stato**: Permettono di vedere tutti, uscite finite o progetti in lavorazione.
- **Popup modifica**: Permette di modificare campi creativi, economici, burocratici e documentali.
- **Campi colorati**: Evidenziano dati critici mancanti o compilati in base all’importanza.

### Bottoni e azioni
- **Ricarica**: Rilegge PROGETTI da Supabase.
- **Tutti i Progetti**: Mostra l’intero archivio.
- **Solo Uscite (Finiti)**: Filtra progetti chiusi/pubblicati/finiti.
- **In Lavorazione**: Filtra brani ancora aperti.
- **Salva Modifiche**: Aggiorna il record in PROGETTI.
- **Annulla**: Chiude il popup senza salvare.

### Dati con cui interagisce
Legge e scrive PROGETTI. I campi più importanti sono TITOLO, ARTISTA, AUTORI, Data_Sessione, Data_Consegna_Master, Data_Pubblicazione, FEE, ROY, STATO, SVILUPPO, Contratto link, LINK, Codice_ISRC, Ruolo_IMAIE_Kyv, quote e pagamento.

### A cosa mira
Avere una scheda minima ma completa per ogni brano, anche quando è solo un’idea provvisoria.

---

## Scheda Progetto Unica — `scheda_progetto.html`

**Fase del viaggio:** Hub del singolo brano

### Funzione
È la pagina da aprire quando vuoi vedere tutto di un progetto: dati creativi, timeline, audio, invii, documenti, SIAE/IMAIE, fatture, spese, checklist. Non è una tabella: è il fascicolo operativo del brano.

### Quando si usa
Prima di una call, prima di consegnare un master, prima di chiedere dati SIAE/IMAIE, prima di fatturare, o quando vuoi capire perché un progetto è fermo.

### Sezioni interne
- **Sintesi**: Dati essenziali, stato, artista, label, manager, fee, roy, quote, link utili.
- **Timeline**: Date chiave: sessione, contratto, consegna master, pubblicazione, fattura.
- **Audio & Invii**: File Dropbox, hash, consegne storiche, invii audio e conferme.
- **Documenti**: Contratti, split sheet, liberatorie, screenshot, ricevute e link Drive.
- **SIAE / IMAIE**: Quote, codici, ISRC, ruolo IMAIE, controlli collegati.
- **Fisco / Fatture**: Fatture collegate, importi, pagamento.
- **Spese**: Movimenti di Spese Extra collegati in modo leggero al progetto.
- **Checklist**: Mancanze operative e protezione brano.

### Bottoni e azioni
- **Aggiorna dati**: Ricarica da tutte le tabelle collegate.
- **Lista progetti**: Torna alla selezione dei progetti.
- **Copia recap**: Copia un riassunto completo del progetto per note, WhatsApp, email o call.
- **Copia mancanze**: Copia solo i dati mancanti e le azioni da completare.
- **Modifica dati**: Apre il popup di modifica rapida del record PROGETTI.
- **Apri Drive**: Apre il link Drive salvato nel campo LINK, se presente.
- **Apri contratto**: Apre il link salvato nel campo Contratto link.
- **Sintesi / Timeline / Audio & Invii / Documenti / SIAE / IMAIE / Fisco / Spese / Checklist**: Cambiano tab interna senza uscire dalla scheda.
- **Salva modifiche**: Aggiorna PROGETTI dai campi del popup.
- **Annulla**: Chiude il popup senza salvare.

### Dati con cui interagisce
Legge PROGETTI, DROPBOX_AUDIO_FILES, INVII_AUDIO, DOCUMENTI_PROGETTO, CONSEGNE_MASTER, FATTURE, EXPORT SIAE, EXPORT SIAE VERTICALE, ESTRATTO_IMAIE, Spese Extra.

### A cosa mira
Ricostruire tutta la storia del brano in un punto solo.

---

## Sessioni Studio — `sessioni.html`

**Fase del viaggio:** Preparazione, sessione, follow-up

### Funzione
Serve a organizzare il lavoro creativo: sessioni future, sessioni di oggi, master da consegnare, progetti da seguire e follow-up intelligenti.

### Quando si usa
Prima di andare in studio, subito dopo una sessione, o quando vuoi capire quali progetti creativi sono rimasti aperti.

### Sezioni interne
- **Sessioni future / oggi**: Mostra progetti con Data_Sessione utile.
- **Master da consegnare**: Segnala progetti con consegna master vicina o mancante.
- **Follow-up intelligenti**: Evidenzia progetti che richiedono azione: contratto, ISRC, ruolo IMAIE, master, pagamento, note.
- **Popup progetto**: Permette di modificare il progetto senza uscire dalla pagina.

### Bottoni e azioni
- **Ricarica**: Aggiorna sessioni e follow-up.
- **Copia checklist**: Copia una checklist operativa della sessione/progetto.
- **Scheda completa**: Apre scheda_progetto.html per quel progetto.
- **Apri contratto**: Apre il link del contratto se presente.
- **Apri Drive**: Apre la cartella Drive del progetto se presente.
- **Salva progetto**: Aggiorna PROGETTI dal popup.
- **Annulla**: Chiude il popup senza salvare.

### Dati con cui interagisce
Legge/scrive PROGETTI, soprattutto Data_Sessione, Data_Consegna_Master, Data_Pubblicazione, AUTORI, NOTE, STATO, SVILUPPO, Codice_ISRC, Ruolo_IMAIE_Kyv, Contratto link e LINK.

### A cosa mira
Trasformare una sessione creativa in una traccia organizzata e recuperabile.

---

## Rubrica CRM — `clienti.html`

**Fase del viaggio:** Contatti e relazioni

### Funzione
Serve a tenere separati ma collegabili artisti, manager, label, editori, amministrazioni e collaboratori. È la rubrica professionale del sistema.

### Quando si usa
Quando nasce un nuovo contatto, devi fatturare a qualcuno, devi segnare un referente o recuperare mail/telefono/SDI/P.IVA.

### Sezioni interne
- **Lista contatti**: Mostra tutti i clienti/contatti.
- **Nuovo/modifica contatto**: Permette di inserire dati anagrafici e amministrativi.
- **Note**: Serve per informazioni operative: referente, ruolo, preferenze, storico rapporti.

### Bottoni e azioni
- **Nuovo Contatto**: Apre il form per creare un nuovo record CLIENTI.
- **Salva Contatto**: Inserisce o aggiorna il contatto in Supabase.
- **Elimina**: Cancella il contatto selezionato.
- **Annulla**: Chiude il form senza salvare.

### Dati con cui interagisce
Legge/scrive CLIENTI: Nome_Denominazione, Tipologia, Email, Telefono, Partita_IVA, Codice_SDI, Indirizzo, Note.

### A cosa mira
Evitare di cercare dati amministrativi e contatti tra chat, mail e fogli sparsi.

---

## Audio Dropbox & Invii — `kyv_dropbox.html`

**Fase del viaggio:** File audio, ascolti, master, prove tecniche

### Funzione
Serve a collegare i file audio Dropbox ai progetti e a registrare invii, hash, destinatari e conferme. Dropbox contiene il file; Supabase contiene lo storico; Drive conserva prove e screenshot.

### Quando si usa
Ogni volta che mandi demo, master, stems, revisioni mix o file per ascolto a artista, manager, label, editore o collaboratore.

### Sezioni interne
- **Archivio file**: Registra file audio con progetto, link Dropbox, tipo file, versione, nome file e hash SHA-256.
- **Invii audio**: Seleziona file salvati, genera messaggio e registra a chi è stato mandato.
- **Storico**: Mostra invii già registrati e permette di salvare conferma ricezione e link prova Drive.
- **Impronta digitale**: Calcola hash SHA-256 dal file locale corrispondente al file caricato su Dropbox.

### Bottoni e azioni
- **Archivio file**: Mostra la sezione per salvare file Dropbox in Supabase.
- **Invii audio**: Mostra la sezione per preparare e registrare invii.
- **Storico**: Mostra invii salvati e conferme.
- **Pesca file da Dropbox**: Apre Dropbox Chooser per selezionare un file già caricato e ottenere il link.
- **Salva file in Supabase**: Registra il file in DROPBOX_AUDIO_FILES e mantiene compatibilità con CONSEGNE_MASTER.
- **Genera testo**: Prepara il messaggio di invio senza registrarlo.
- **Registra e copia**: Salva l’invio in INVII_AUDIO e copia il messaggio negli appunti.
- **Apri WhatsApp**: Apre WhatsApp con il testo pronto. L’invio finale resta manuale.
- **Apri Email**: Apre il client email con subject/body già pronti.
- **Ricarica**: Aggiorna file e storico invii.
- **Salva conferma**: Aggiorna INVII_AUDIO con conferma ricezione, data e link prova Drive.

### Dati con cui interagisce
Scrive DROPBOX_AUDIO_FILES, INVII_AUDIO e copia compatibile in CONSEGNE_MASTER. Usa PROGETTI per collegare il brano.

### A cosa mira
Sapere esattamente quale file è stato mandato, a chi, quando, con quale link e con quale hash.

---

## Documenti, Spese & Schede — `documenti.html`

**Fase del viaggio:** Burocrazia, contratti, costi e richieste dati

### Funzione
È il modulo amministrativo-documentale. Serve a catalogare contratti, salvare link Drive, registrare spese extra, importare movimenti da estratto conto e generare schede dati SIAE/IMAIE/fatture.

### Quando si usa
Quando arriva un contratto via mail/WhatsApp, quando salvi documenti su Drive, quando importi spese da conto bancario, quando devi chiedere dati a manager/label/amministrazione.

### Sezioni interne
- **Documenti & Contratti**: Collega contratto, split sheet, liberatorie, ricevute o screenshot a un progetto.
- **Spese Extra**: Analizza e inserisce spese manuali o da CSV bancario.
- **Schede dati SIAE / IMAIE / Fatture**: Genera messaggi di richiesta dati mancanti per depositi, diritti connessi o fatturazione.
- **Struttura Drive**: Copia una struttura cartelle standard per progetto.

### Bottoni e azioni
- **Ricarica**: Aggiorna documenti, progetti e spese.
- **Documenti & Contratti**: Mostra il pannello documentale.
- **Spese Extra**: Mostra analisi e inserimento/import spese.
- **Schede dati SIAE / IMAIE / Fatture**: Mostra generatore richieste dati.
- **Copia struttura Drive**: Copia negli appunti la struttura cartelle consigliata.
- **Anteprima**: Legge il CSV spese scelto e mostra anteprima prima dell’import.
- **Importa nuovi**: Inserisce in Spese Extra solo movimenti non duplicati.
- **Salva spesa**: Inserisce una spesa manuale in Spese Extra.
- **Copia richiesta dati**: Copia un messaggio pronto da inviare a chi deve fornire dati SIAE/IMAIE/fattura.
- **Salva scheda in Documenti**: Salva la richiesta generata in DOCUMENTI_PROGETTO.
- **Apri Scheda Progetto**: Apre la scheda completa del progetto selezionato.
- **Apri contratto**: Apre il link contratto salvato.
- **Apri Drive**: Apre la cartella/documento Drive.
- **Salva documentazione**: Aggiorna PROGETTI e, se possibile, salva anche record in DOCUMENTI_PROGETTO.
- **Annulla**: Chiude popup/form senza salvare.

### Dati con cui interagisce
Legge/scrive DOCUMENTI_PROGETTO, PROGETTI, Spese Extra. Può aggiornare Contratto link, LINK e Data Contratto in PROGETTI.

### A cosa mira
Trasformare documenti e costi dispersi in un archivio rintracciabile e collegato al brano.

---

## Protezione Brano — `protezione.html`

**Fase del viaggio:** Controllo rischi e tutele

### Funzione
È il radar che dice se un progetto è scoperto o protetto: contratto, quote, ISRC, SIAE, IMAIE, master, hash, fatture, pagamenti, Drive.

### Quando si usa
Prima di una release, prima di consegnare master, prima di fatturare, o quando vuoi controllare quali brani hanno rischi aperti.

### Sezioni interne
- **Score protezione**: Punteggio sintetico sullo stato del progetto.
- **Checklist mancanze**: Mostra cosa manca e perché è importante.
- **Filtri critici**: Permettono di vedere solo progetti scoperti o con area specifica mancante.
- **Azioni rapide**: Copia struttura, messaggi di consegna o export CSV.

### Bottoni e azioni
- **Ricarica**: Ricalcola score e checklist.
- **Export CSV**: Scarica un CSV con stato protezione dei progetti.
- **Consegna Dropbox**: Porta ad Audio Dropbox per salvare/inviare file.
- **Copia struttura**: Copia struttura cartelle Drive consigliata.
- **Copia messaggio consegna**: Copia un testo standard per invio/consegna master.

### Dati con cui interagisce
Legge PROGETTI, DROPBOX_AUDIO_FILES, CONSEGNE_MASTER, DOCUMENTI_PROGETTO, FATTURE, export SIAE/IMAIE.

### A cosa mira
Evitare che un brano esca o venga consegnato senza dati essenziali, prove o accordi.

---

## Fatture — `fatture.html`

**Fase del viaggio:** Emissione e incasso

### Funzione
Serve a monitorare fatture collegate ai progetti: numero, data, cliente, importi, descrizione, pagamento e stato pagata/non pagata.

### Quando si usa
Quando una fee viene confermata, quando devi emettere fattura, quando arriva pagamento o quando prepari controllo amministrativo.

### Sezioni interne
- **Lista fatture**: Mostra fatture e stato.
- **Collegamento progetto**: Usa ID_PROGETTO per collegare fattura al brano.
- **Stato pagamento**: Permette di sapere cosa è stato pagato e cosa no.

### Bottoni e azioni
- **Ricarica**: Aggiorna dati fatture da Supabase.

### Dati con cui interagisce
Legge FATTURE e incrocia ID_PROGETTO con PROGETTI quando possibile.

### A cosa mira
Non perdere incassi e non dimenticare fatture da emettere o sollecitare.

---

## Piano Fiscale — `fisco.html`

**Fase del viaggio:** Accantonamenti e tributi

### Funzione
Serve a stimare e memorizzare piano fiscale annuale: fatturato lordo, imponibile, IRPEF, INPS, F24, crediti e accantonamenti.

### Quando si usa
Quando aggiorni situazione annuale, prepari liquidità per imposte/contributi o fai recap con commercialista.

### Sezioni interne
- **Piano anno**: Dati economici annuali.
- **F24 e crediti**: Scadenze/valori IRPEF e INPS.
- **Totale accantonato**: Stato prudenziale della liquidità fiscale.

### Bottoni e azioni
- **Salva Piano**: Inserisce o aggiorna record in PIANI_FISCALI.

### Dati con cui interagisce
Legge/scrive PIANI_FISCALI.

### A cosa mira
Tenere separato il risultato creativo dagli obblighi fiscali futuri.

---

## Quote, Autori, Rendiconti SIAE/IMAIE — `quote.html / autori.html / rendiconto.html / correlazione.html`

**Fase del viaggio:** Diritti, autorialità, rendiconti

### Funzione
Questi moduli servono a leggere SIAE e IMAIE non come file isolati, ma come sistema di controllo: quote per opera, attività di ogni autore, rendiconti e correlazioni con progetti.

### Quando si usa
Quando importi export SIAE/IMAIE, controlli quote, cerchi opere dove compari, confronti rendiconti o prepari richieste dati.

### Sezioni interne
- **Quote per Opera**: Parte dal brano e mostra autori/quote DEM/DRM.
- **Dettaglio Autori**: Parte da una persona e mostra opere/quote/ruoli.
- **Rendiconto**: Analizza incassi SIAE nel tempo.
- **Correlazione**: Aiuta a collegare dati SIAE a progetti interni.

### Bottoni e azioni
- **Ricarica**: Aggiorna dati nei moduli quote/autori/correlazione/fatture.
- **Aggiorna**: Rilegge rendiconti e ricalcola analisi.
- **Salva Modifiche**: Nei moduli che lo prevedono, salva collegamenti/correlazioni.
- **Annulla**: Chiude modifica senza salvare.

### Dati con cui interagisce
Legge EXPORT SIAE, EXPORT SIAE VERTICALE, ESTRATTO SIAE, ESTRATTO_IMAIE e PROGETTI.

### A cosa mira
Capire se le quote e i diritti corrispondono davvero al lavoro fatto.

---

## Import / Export — `importexport.html`

**Fase del viaggio:** Entrata/uscita dati

### Funzione
Serve a importare file CSV/Excel nelle tabelle giuste, scaricare template compatibili e deduplicare dati. È essenziale quando arrivano export SIAE, estratti conto, tabelle clienti o dati amministrativi.

### Quando si usa
Quando devi caricare molti dati senza inserirli a mano.

### Sezioni interne
- **Scelta tabella**: Seleziona tabella Supabase di destinazione.
- **Template CSV**: Scarica intestazioni corrette.
- **Anteprima import**: Mostra dati prima di scrivere.
- **Deduplica**: Evita duplicati secondo chiavi ragionate.

### Bottoni e azioni
- **Scarica template CSV della tabella**: Crea CSV con separatore italiano ; e intestazioni reali.
- **Sfoglia nel PC**: Seleziona file CSV/Excel locale.
- **Importa nel DB**: Scrive i record nuovi in Supabase dopo controlli.

### Dati con cui interagisce
Interagisce con molte tabelle: CLIENTI, PROGETTI, FATTURE, Spese Extra, SIAE, IMAIE e nuove tabelle audio/documenti se abilitate nello schema.

### A cosa mira
Ridurre errori manuali e velocizzare caricamento dati reali.

---

## Studio Editor — `editor.html`

**Fase del viaggio:** Manutenzione dati

### Funzione
È il pannello tecnico per visualizzare e modificare direttamente le tabelle Supabase. È potente: va usato con attenzione.

### Quando si usa
Quando devi correggere un record, verificare una tabella, eliminare dati errati o intervenire su campi non esposti nei moduli dedicati.

### Sezioni interne
- **Tab tabelle**: Progetti, Clienti, Fatture, Consegne, Spese, Piani Fiscali, SIAE, Audio, Invii, Documenti.
- **Griglia dati**: Mostra record della tabella selezionata.
- **Form modifica**: Permette update/insert/delete.

### Bottoni e azioni
- **Progetti / Clienti / Fatture / Consegne / Spese Extra / Piani Fiscali / SIAE / Audio Dropbox / Invii Audio / Documenti / Nuovo IMAIE**: Cambiano tabella da visualizzare/modificare.
- **Esporta**: Scarica i dati della tabella.
- **Aggiungi**: Apre form nuovo record.
- **Salva**: Scrive modifica o nuovo record in Supabase.
- **Elimina Record**: Cancella il record selezionato.
- **Annulla**: Chiude form senza salvare.

### Dati con cui interagisce
Interagisce direttamente con le tabelle definite in kyv-schema.js.

### A cosa mira
Avere un’officina dati interna senza aprire sempre Supabase.

---

## Report & PDF — `report.html`

**Fase del viaggio:** Condivisione e analisi

### Funzione
Serve a generare report leggibili su rubrica, stato finanziario e analisi progetti, anche in PDF.

### Quando si usa
Quando vuoi stampare/condividere un riepilogo, preparare call, fare controllo mensile o archiviare una fotografia dello stato.

### Sezioni interne
- **Rubrica per Tipo**: Organizza contatti per tipologia.
- **Stato Finanziario**: Riepilogo economico.
- **Analisi Progetti**: Riepilogo dei brani e stati.

### Bottoni e azioni
- **Scarica PDF**: Genera PDF del report selezionato.
- **Rubrica per Tipo**: Mostra report contatti.
- **Stato Finanziario**: Mostra report economico.
- **Analisi Progetti**: Mostra report progetti.

### Dati con cui interagisce
Legge CLIENTI, PROGETTI, FATTURE e dati collegati secondo il report.

### A cosa mira
Trasformare il database in documento leggibile.

---

## Drive / Calendar / App Launcher — `integrazioni.html / kyv_drive.html / kyv_calendar.html`

**Fase del viaggio:** Collegamenti esterni

### Funzione
Questi moduli collegano il gestionale agli strumenti esterni: Calendar per sessioni, Drive per file/documenti, Dropbox per audio.

### Quando si usa
Quando devi cercare file, creare sessioni su calendario, passare da una integrazione all’altra.

### Sezioni interne
- **Integrazioni**: Pagina launcher dei moduli esterni.
- **Google Calendar**: Legge/crea eventi di sessione.
- **Google Drive**: Cerca file o documenti collegati.
- **Dropbox**: Rimanda al modulo audio/invii.

### Bottoni e azioni
- **Apri Modulo**: Apre il modulo scelto dal launcher.
- **Aggiorna agenda**: Aggiorna calendario/eventi.
- **Crea su Calendar**: Crea un evento Google Calendar.
- **Avvia Ricerca**: Cerca file su Drive.
- **Indietro / Avanti**: Naviga tra risultati Drive.

### Dati con cui interagisce
Interagisce con Google Apps Script/Drive/Calendar e con i link salvati in PROGETTI/DOCUMENTI_PROGETTO.

### A cosa mira
Evitare che il gestionale sia scollegato dagli strumenti che usi davvero ogni giorno.

---

## Login — `login.html`

**Fase del viaggio:** Accesso

### Funzione
È la porta di ingresso. Usa Supabase Auth per accedere al gestionale.

### Quando si usa
Quando apri il gestionale da browser o dopo logout/sessione scaduta.

### Sezioni interne
- **Form accesso**: Email/password.
- **Messaggi errore**: Avvisi se credenziali errate o problemi di connessione.

### Bottoni e azioni
- **Accedi al Gestionale**: Invia credenziali a Supabase Auth e, se corrette, apre la dashboard.

### Dati con cui interagisce
Interagisce con Supabase Auth, non con tabelle operative.

### A cosa mira
Separare accesso utente dal lavoro gestionale.

---

## 4. Matrice rapida dei bottoni

Questa sezione serve quando non ricordi cosa fa un pulsante.

### Panoramica / Dashboard — `index.html`

- **Aggiorna**: Ricarica i dati da Supabase e aggiorna i riepiloghi. Usalo dopo modifiche fatte in altre pagine.
- **Assistente KYV**: Apre il percorso guidato del brano, cioè la pagina che suggerisce cosa fare oggi.
- **Apri Sessioni**: Apre Sessioni Studio per vedere sessioni, follow-up e progetti da lavorare.
- **Scheda Progetto**: Apre l’hub del singolo brano/progetto.
- **Protezione**: Apre il radar legale/burocratico SIAE, IMAIE, contratti, master, fatture.

### Assistente Produzione — `assistente.html`

- **Aggiorna**: Rilegge i dati da Supabase e ricalcola priorità e stati.
- **Copia brief di oggi**: Crea un testo riepilogativo con priorità operative da incollare in WhatsApp, note o recap.
- **Scheda progetto**: Apre la scheda unica del progetto selezionato.
- **Priorità**: Mostra la vista focalizzata sulle azioni urgenti.
- **Kanban**: Mostra la vista a colonne per fase del brano.
- **Metodo**: Mostra la spiegazione della logica di lavoro.
- **Copia follow-up**: Nelle card, copia un messaggio operativo sul singolo progetto con azione consigliata e dati mancanti.

### Progetti & Uscite — `progetti.html`

- **Ricarica**: Rilegge PROGETTI da Supabase.
- **Tutti i Progetti**: Mostra l’intero archivio.
- **Solo Uscite (Finiti)**: Filtra progetti chiusi/pubblicati/finiti.
- **In Lavorazione**: Filtra brani ancora aperti.
- **Salva Modifiche**: Aggiorna il record in PROGETTI.
- **Annulla**: Chiude il popup senza salvare.

### Scheda Progetto Unica — `scheda_progetto.html`

- **Aggiorna dati**: Ricarica da tutte le tabelle collegate.
- **Lista progetti**: Torna alla selezione dei progetti.
- **Copia recap**: Copia un riassunto completo del progetto per note, WhatsApp, email o call.
- **Copia mancanze**: Copia solo i dati mancanti e le azioni da completare.
- **Modifica dati**: Apre il popup di modifica rapida del record PROGETTI.
- **Apri Drive**: Apre il link Drive salvato nel campo LINK, se presente.
- **Apri contratto**: Apre il link salvato nel campo Contratto link.
- **Sintesi / Timeline / Audio & Invii / Documenti / SIAE / IMAIE / Fisco / Spese / Checklist**: Cambiano tab interna senza uscire dalla scheda.
- **Salva modifiche**: Aggiorna PROGETTI dai campi del popup.
- **Annulla**: Chiude il popup senza salvare.

### Sessioni Studio — `sessioni.html`

- **Ricarica**: Aggiorna sessioni e follow-up.
- **Copia checklist**: Copia una checklist operativa della sessione/progetto.
- **Scheda completa**: Apre scheda_progetto.html per quel progetto.
- **Apri contratto**: Apre il link del contratto se presente.
- **Apri Drive**: Apre la cartella Drive del progetto se presente.
- **Salva progetto**: Aggiorna PROGETTI dal popup.
- **Annulla**: Chiude il popup senza salvare.

### Rubrica CRM — `clienti.html`

- **Nuovo Contatto**: Apre il form per creare un nuovo record CLIENTI.
- **Salva Contatto**: Inserisce o aggiorna il contatto in Supabase.
- **Elimina**: Cancella il contatto selezionato.
- **Annulla**: Chiude il form senza salvare.

### Audio Dropbox & Invii — `kyv_dropbox.html`

- **Archivio file**: Mostra la sezione per salvare file Dropbox in Supabase.
- **Invii audio**: Mostra la sezione per preparare e registrare invii.
- **Storico**: Mostra invii salvati e conferme.
- **Pesca file da Dropbox**: Apre Dropbox Chooser per selezionare un file già caricato e ottenere il link.
- **Salva file in Supabase**: Registra il file in DROPBOX_AUDIO_FILES e mantiene compatibilità con CONSEGNE_MASTER.
- **Genera testo**: Prepara il messaggio di invio senza registrarlo.
- **Registra e copia**: Salva l’invio in INVII_AUDIO e copia il messaggio negli appunti.
- **Apri WhatsApp**: Apre WhatsApp con il testo pronto. L’invio finale resta manuale.
- **Apri Email**: Apre il client email con subject/body già pronti.
- **Ricarica**: Aggiorna file e storico invii.
- **Salva conferma**: Aggiorna INVII_AUDIO con conferma ricezione, data e link prova Drive.

### Documenti, Spese & Schede — `documenti.html`

- **Ricarica**: Aggiorna documenti, progetti e spese.
- **Documenti & Contratti**: Mostra il pannello documentale.
- **Spese Extra**: Mostra analisi e inserimento/import spese.
- **Schede dati SIAE / IMAIE / Fatture**: Mostra generatore richieste dati.
- **Copia struttura Drive**: Copia negli appunti la struttura cartelle consigliata.
- **Anteprima**: Legge il CSV spese scelto e mostra anteprima prima dell’import.
- **Importa nuovi**: Inserisce in Spese Extra solo movimenti non duplicati.
- **Salva spesa**: Inserisce una spesa manuale in Spese Extra.
- **Copia richiesta dati**: Copia un messaggio pronto da inviare a chi deve fornire dati SIAE/IMAIE/fattura.
- **Salva scheda in Documenti**: Salva la richiesta generata in DOCUMENTI_PROGETTO.
- **Apri Scheda Progetto**: Apre la scheda completa del progetto selezionato.
- **Apri contratto**: Apre il link contratto salvato.
- **Apri Drive**: Apre la cartella/documento Drive.
- **Salva documentazione**: Aggiorna PROGETTI e, se possibile, salva anche record in DOCUMENTI_PROGETTO.
- **Annulla**: Chiude popup/form senza salvare.

### Protezione Brano — `protezione.html`

- **Ricarica**: Ricalcola score e checklist.
- **Export CSV**: Scarica un CSV con stato protezione dei progetti.
- **Consegna Dropbox**: Porta ad Audio Dropbox per salvare/inviare file.
- **Copia struttura**: Copia struttura cartelle Drive consigliata.
- **Copia messaggio consegna**: Copia un testo standard per invio/consegna master.

### Fatture — `fatture.html`

- **Ricarica**: Aggiorna dati fatture da Supabase.

### Piano Fiscale — `fisco.html`

- **Salva Piano**: Inserisce o aggiorna record in PIANI_FISCALI.

### Quote, Autori, Rendiconti SIAE/IMAIE — `quote.html / autori.html / rendiconto.html / correlazione.html`

- **Ricarica**: Aggiorna dati nei moduli quote/autori/correlazione/fatture.
- **Aggiorna**: Rilegge rendiconti e ricalcola analisi.
- **Salva Modifiche**: Nei moduli che lo prevedono, salva collegamenti/correlazioni.
- **Annulla**: Chiude modifica senza salvare.

### Import / Export — `importexport.html`

- **Scarica template CSV della tabella**: Crea CSV con separatore italiano ; e intestazioni reali.
- **Sfoglia nel PC**: Seleziona file CSV/Excel locale.
- **Importa nel DB**: Scrive i record nuovi in Supabase dopo controlli.

### Studio Editor — `editor.html`

- **Progetti / Clienti / Fatture / Consegne / Spese Extra / Piani Fiscali / SIAE / Audio Dropbox / Invii Audio / Documenti / Nuovo IMAIE**: Cambiano tabella da visualizzare/modificare.
- **Esporta**: Scarica i dati della tabella.
- **Aggiungi**: Apre form nuovo record.
- **Salva**: Scrive modifica o nuovo record in Supabase.
- **Elimina Record**: Cancella il record selezionato.
- **Annulla**: Chiude form senza salvare.

### Report & PDF — `report.html`

- **Scarica PDF**: Genera PDF del report selezionato.
- **Rubrica per Tipo**: Mostra report contatti.
- **Stato Finanziario**: Mostra report economico.
- **Analisi Progetti**: Mostra report progetti.

### Drive / Calendar / App Launcher — `integrazioni.html / kyv_drive.html / kyv_calendar.html`

- **Apri Modulo**: Apre il modulo scelto dal launcher.
- **Aggiorna agenda**: Aggiorna calendario/eventi.
- **Crea su Calendar**: Crea un evento Google Calendar.
- **Avvia Ricerca**: Cerca file su Drive.
- **Indietro / Avanti**: Naviga tra risultati Drive.

### Login — `login.html`

- **Accedi al Gestionale**: Invia credenziali a Supabase Auth e, se corrette, apre la dashboard.

---

## 5. Regole operative consigliate

- **Ogni progetto deve nascere subito**: Anche se il titolo è provvisorio, crea un record in Progetti. Se non esiste in PROGETTI, gli altri moduli non potranno collegarlo bene.
- **Ogni file audio importante deve essere registrato**: Carica su Dropbox, salva link in DROPBOX_AUDIO_FILES, calcola hash sul file locale corrispondente, registra invio in INVII_AUDIO.
- **Ogni contratto deve avere un link Drive**: Salva il PDF o screenshot in Drive, poi registra link in Documenti & Contratti e nel progetto.
- **Ogni sessione deve produrre una traccia**: Data, presenti, ruoli, contributi, note, versioni audio, prossima azione.
- **Ogni invio deve avere un seguito**: Se mandi un file e nessuno risponde, l’Assistente deve poterlo segnalare. Registra invio e conferma.
- **Ogni brano vicino alla release deve passare da Protezione**: Prima di uscire: contratto, quote, SIAE, IMAIE, ISRC, master, hash, fattura/pagamento.
- **Ogni spesa deve essere categorizzata**: Importa da estratto conto o aggiungi manualmente, poi correggi Categoria se automatica non basta.
- **Ogni dato mancante deve diventare una richiesta**: Usa Schede dati per chiedere a manager/label/amministrazione dati SIAE, IMAIE o fattura.

---

## 6. Routine consigliata

### Ogni giorno

1. Apri **Panoramica**.
2. Apri **Assistente Produzione**.
3. Copia il **brief di oggi**.
4. Controlla progetti in ascolto senza risposta.
5. Apri le schede progetto più urgenti.
6. Aggiorna note, invii, documenti o fatture.

### Dopo ogni sessione

1. Apri **Sessioni Studio**.
2. Aggiorna note e sviluppo.
3. Registra eventuali demo in **Audio Dropbox**.
4. Se hai mandato file, registra invio in **INVII_AUDIO**.
5. Salva screenshot/conferme su Drive e in **Documenti**.

### Prima di consegnare un master

1. Carica il file su Dropbox.
2. Apri **Audio Dropbox**.
3. Pesca o incolla il link.
4. Scegli il file locale e calcola hash SHA-256.
5. Salva file in Supabase.
6. Registra invio a destinatario.
7. Apri WhatsApp/email, invia manualmente.
8. Quando rispondono, salva conferma e prova Drive.

### Prima di una release

1. Apri **Protezione Brano**.
2. Apri **Scheda Progetto Unica**.
3. Controlla contratto, quote, ISRC, SIAE, IMAIE, master, hash, fattura.
4. Usa **Schede dati** per chiedere ciò che manca.
5. Archivia tutto in Drive.

### A fine mese

1. Apri **Fatture**.
2. Controlla pagate/non pagate.
3. Apri **Spese Extra** e importa estratto conto.
4. Apri **Piano Fiscale**.
5. Genera report o PDF se necessario.

---

## 7. Evoluzioni possibili

- Rendere `PROGETTI.ID` primary key/unique, dopo verifica duplicati, per relazioni Supabase più rigide.
- Aggiungere una tabella dedicata alle sessioni, separata da PROGETTI.
- Aggiungere stati standardizzati per il workflow del brano.
- Aggiungere promemoria automatici per invii senza risposta.
- Collegare Gmail/WhatsApp Business API per invii più automatizzati.
- Creare modelli PDF per split sheet, recap sessione, consegna master, richiesta dati SIAE/IMAIE.
- Aggiungere archivio “versioni audio” più dettagliato: demo v1, mix v2, master v3, stems.


---

# Appendice v2.9.5 — Manuale & Guida contestuale dentro l'app

La voce **Manuale & Guida** nel menu laterale è stata ampliata. Non deve essere letta come una pagina generica, ma come un aiuto contestuale: cambia in base alla pagina aperta.

Per ogni modulo ora spiega:

1. **Funzione della pagina**: quale problema risolve nel lavoro di KYV.
2. **Quando usarla**: in quale momento del viaggio del brano aprirla.
3. **Sezioni interne**: cosa rappresentano i blocchi visualizzati.
4. **Passaggi consigliati**: cosa fare in ordine, senza saltare elementi importanti.
5. **Cosa si potrebbe fare**: miglioramenti professionali possibili anche se non obbligatori.
6. **Bottoni**: che cosa fanno, se leggono dati, se salvano dati, se aprono link esterni o se generano testi.
7. **Dati coinvolti**: con quali tabelle Supabase o strumenti esterni interagiscono.
8. **Obiettivo operativo**: perché quel modulo esiste nel percorso produttivo/amministrativo.

La spiegazione PWA è stata ridotta a una sola nota: installazione su device supportati e, su iPhone, Safari → Condividi → Aggiungi alla schermata Home. Il resto dello spazio è dedicato ai flussi reali: contatto, sessione, demo, master, invio ascolto, follow-up, contratti, SIAE, IMAIE, fatture, spese e archivio.


---

## Stazione Ascolto MP3 (`ascolto.html`)

### Funzione
La Stazione Ascolto MP3 è il player interno del gestionale. Serve ad ascoltare demo, master, mix, provini, reference e file locali senza uscire dal mondo KyvManagerPro. Non sostituisce Dropbox come archivio dei file pesanti: usa Dropbox/Drive/Supabase come sorgenti e aggiunge un livello operativo di ascolto, note e feedback.

### Quando usarla
Usala quando devi fare una sessione di ascolto, confrontare versioni, preparare una call, riascoltare brani inviati a label/manager/artista, oppure scrivere note da salvare nella storia del progetto.

### Sorgenti disponibili
- **Archivio**: legge `DROPBOX_AUDIO_FILES` e `CONSEGNE_MASTER`.
- **Dropbox diretto**: apre il Dropbox Chooser e permette di scegliere MP3/WAV/M4A/AIF/FLAC anche se non sono ancora registrati in Supabase. È utile per ascolti veloci, selezioni di repertorio e materiale appena ricevuto/caricato.
- **Drive**: usa il Google Apps Script già presente per cercare file MP3 in Drive.
- **Locale**: carica file audio temporanei dal computer o dallo smartphone. I file non vengono salvati e spariscono chiudendo la pagina.

### Passaggi consigliati
1. Apri `App Launcher`.
2. Entra in `Stazione Ascolto MP3`.
3. Parti da `Archivio` se il file è già stato registrato in Dropbox/Supabase.
4. Usa `Dropbox diretto` se vuoi pescare file direttamente dal tuo Dropbox anche se non sono ancora salvati nel gestionale.
5. Scegli eventualmente un progetto nel campo `Collega a progetto`, così la nota ascolto può essere salvata subito nella storia del brano.
6. Usa `Salva brano corrente in Archivio` o `Salva archivio` se dopo l’ascolto vuoi trasformare il file Dropbox diretto in record stabile dentro `DROPBOX_AUDIO_FILES`.
7. Usa `Drive` se devi cercare reference o demo non ancora archiviate.
8. Usa `Locale` se devi ascoltare rapidamente un file appena ricevuto.
6. Premi `Play` su un brano.
7. Scrivi note di ascolto.
8. Usa `Copia feedback` per mandare appunti via WhatsApp/mail.
9. Usa `Registra ascolto` se vuoi salvare la nota in `DOCUMENTI_PROGETTO`.

### Bottoni principali
- **Archivio**: carica la playlist dai file audio registrati in Supabase/Dropbox.
- **Dropbox diretto**: mostra gli strumenti per scegliere file direttamente da Dropbox senza passare prima da Supabase.
- **Scegli file da Dropbox**: apre il Dropbox Chooser e importa nella playlist i file selezionati. Non li salva automaticamente nel database.
- **Collega a progetto**: assegna temporaneamente i file pescati da Dropbox a un progetto, utile per registrare note ascolto.
- **Tipo file predefinito**: classifica i file Dropbox diretti come Demo, Master, Mix, Provino, Reference o Altro.
- **Salva brano corrente in Archivio**: registra il brano Dropbox diretto in `DROPBOX_AUDIO_FILES`.
- **Salva archivio**: salva in archivio uno specifico brano della lista Dropbox diretta.
- **Drive**: mostra gli strumenti di ricerca MP3 su Google Drive.
- **Locale**: permette di selezionare file dal dispositivo.
- **Cerca MP3 su Drive**: interroga lo stesso Apps Script usato da `kyv_drive.html`.
- **Play**: riproduce il brano selezionato nel player interno.
- **Prev / Next**: passa al brano precedente o successivo.
- **Shuffle**: avvia un brano casuale tra quelli filtrati.
- **Copia lista**: copia la playlist visibile con titoli e link.
- **Archivio audio**: apre `kyv_dropbox.html` per registrare o sistemare i file sorgente.
- **Scheda**: apre la scheda progetto collegata al brano.
- **Apri esterno**: apre il link originale Dropbox/Drive se il browser non riesce a riprodurlo internamente.
- **Copia link**: copia il link audio.
- **Copia feedback**: copia titolo, progetto, note e link.
- **Registra ascolto**: salva una nota in `DOCUMENTI_PROGETTO` se il brano ha `ID_PROGETTO`.

### Dati coinvolti
- Legge: `PROGETTI`, `DROPBOX_AUDIO_FILES`, `CONSEGNE_MASTER`.
- Legge da Dropbox Chooser: file selezionati manualmente dal tuo Dropbox, anche non ancora archiviati in Supabase.
- Scrive: `DOCUMENTI_PROGETTO`, quando registri una nota di ascolto collegata a un progetto.
- Scrive: `DROPBOX_AUDIO_FILES`, quando salvi in archivio un file pescato da Dropbox diretto.
- Usa: `GOOGLE_SCRIPT_URL` per cercare file Drive.

### Attenzioni
Alcuni link Google Drive o Dropbox non pubblici potrebbero non essere riproducibili direttamente nel browser. In quel caso usa `Apri esterno`. Il Dropbox diretto usa il Chooser: richiede che la Dropbox App Key sia configurata e che il browser non blocchi il popup. Per avere ascolto più stabile e memoria storica completa, dopo l’ascolto salva i file buoni in Archivio Audio e collegali sempre al progetto.

---

# v2.9.8 — Navigazione semplificata

La versione 2.9.8 non elimina funzionalità e non cambia le tabelle Supabase. Serve a rendere più leggibile il gestionale.

## Sidebar principale

La sidebar deve contenere solo le sezioni che KYV usa come ingresso stabile nel lavoro:

1. Panoramica
2. Progetti & Uscite
3. Rubriche
4. Fatture
5. Spese Extra
6. Studio Editor
7. Piano Fiscale
8. Quote per Opera
9. Rendiconto SIAE
10. App Launcher
11. Stazione Ascolto
12. Import / Export
13. Manuale

## Strumenti secondari

Le pagine più specialistiche restano disponibili, ma vengono raccolte nel Launcher:

- Assistente Produzione: percorso del brano, follow-up, azioni di oggi.
- Sessioni Studio: pianificazione e controllo sessioni.
- Scheda Progetto: fascicolo unico del brano.
- Protezione Brano: radar contratti, SIAE, IMAIE, master, fatture.
- Audio Dropbox: invii, hash, link e conferme.
- Google Drive / Calendar: strumenti esterni.
- Documenti & Schede: contratti, richieste dati SIAE/IMAIE/fatture.
- Dettaglio Autori, Correlazione, Report/PDF: analisi avanzate.

## Metodo operativo

Il flusso consigliato diventa:

1. Apri Panoramica per capire priorità e numeri.
2. Apri Progetti & Uscite per il database madre dei brani.
3. Usa Rubriche per artisti, manager, label, autori, clienti e referenti.
4. Usa Stazione Ascolto per ascoltare demo/master/reference.
5. Usa App Launcher quando serve uno strumento specifico come Sessioni, Scheda Progetto, Protezione o Dropbox.
6. Usa Fatture, Spese Extra, Piano Fiscale, Quote e Rendiconto SIAE per la parte amministrativa e diritti.

Questo mantiene l'app potente, ma riduce la confusione iniziale.


# v2.9.9 — Metodo operativo per Studio Editor e Backup locale

## Studio Editor: lettura più compatta delle tabelle

Lo Studio Editor resta lo strumento tecnico per leggere e modificare direttamente le tabelle Supabase. Poiché alcune tabelle hanno molte colonne, la versione 2.9.9 introduce una modalità compatta per ridurre l'ingombro visivo.

### Passaggi consigliati

1. Apri **Studio Editor**.
2. Scegli la tabella da controllare: Progetti, Clienti, Fatture, Spese, SIAE, IMAIE, Dropbox Audio, Invii o Documenti.
3. Usa la ricerca per filtrare titolo, artista, label, manager, codice, descrizione o importo.
4. Leggi le righe in modalità compatta: le celle lunghe vengono accorciate, ma il valore completo resta nel tooltip e si espande quando entri nella cella.
5. Se devi lavorare su testi lunghi, clicca **Compatta/Larga** per passare alla vista ampia.
6. Modifica una cella e clicca fuori: lo Studio Editor salva automaticamente il nuovo valore.

### Bottone Compatta/Larga

- **Compatta**: riduce larghezza e padding delle colonne. È la vista consigliata per controllo generale.
- **Larga**: mostra più spazio per ogni campo. È utile quando devi revisionare note, link, messaggi o descrizioni lunghe.

### A cosa mira

Serve a rendere leggibili tabelle molto grandi senza perdere la possibilità di modifica inline. È pensato per controlli veloci su molti progetti, fatture, spese o diritti.

## Import / Export: backup e ripristino locale del database

La pagina **Import / Export** ora contiene anche un modulo di sicurezza operativa: **Backup & Ripristino locale database**.

### Backup DB su PC

Il bottone **Backup DB su PC** legge tutte le tabelle disponibili da Supabase e crea un file `.json` scaricato sul computer. Il file contiene:

- nome app e versione backup;
- data di creazione;
- elenco tabelle;
- colonne logiche;
- chiave primaria nota;
- righe esportate;
- eventuali errori di lettura.

### Quando fare backup

Fallo sempre prima di:

- importare estratti conto o CSV grandi;
- modificare molte righe nello Studio Editor;
- fare test su nuove funzioni;
- cambiare SQL o struttura Supabase;
- ripulire doppioni o dati vecchi.

### Scegli backup da PC

Questo bottone carica un file JSON precedentemente scaricato. L'app mostra un'anteprima con:

- nome tabella;
- etichetta leggibile;
- numero righe presenti nel backup;
- checkbox per scegliere quali tabelle ripristinare.

### Ripristina selezionate

Il ripristino è volutamente non distruttivo: non cancella le tabelle esistenti. Inserisce solo le righe selezionate.

Opzioni:

- **Salta duplicati**: prova a evitare record già presenti usando ID, codici, link, date, descrizioni e chiavi naturali. È l'opzione consigliata.
- **Mantieni ID originali**: conserva gli ID del backup per preservare collegamenti tra tabelle. È utile se stai ripristinando su database vuoto o quasi vuoto. Se stai importando in un database già pieno e ricevi errori di ID duplicato, puoi deselezionarla.

### Metodo consigliato di sicurezza

1. Prima crea un backup nuovo.
2. Poi carica il backup da PC solo se devi recuperare dati.
3. Seleziona poche tabelle alla volta.
4. Lascia attivo **Salta duplicati**.
5. Dopo il ripristino controlla Studio Editor, Progetti e Scheda Progetto.

Questa funzione non sostituisce un backup ufficiale Supabase, ma è molto utile come copia locale rapida e leggibile dal gestionale.


## v2.10.4 — Nota di ripristino

Per stabilità operativa, questa versione ripristina il Piano Fiscale e la sidebar dalla v2.9.9. Il Piano Fiscale torna alla simulazione semplice già presente prima dei test sui file CU/CUD/Unico/dichiarazioni fiscali. La sidebar torna alla navigazione principale della v2.9.9. Le eventuali colonne aggiunte da SQL successive non vengono usate da questa versione e possono restare nel database senza perdere dati.

## Piano Fiscale - v2.10.5

Il Piano Fiscale resta semplice e prende i ricavi dalla tabella `FATTURE`, divisi per anno fiscale.

Campi principali:

- `Fatturato da Fatture`: automatico da `FATTURE`.
- `Coefficiente ATECO`: fisso al 67%.
- `Diritti d'autore / correlati lordi`: inserimento manuale.
- `Quota tassata diritti d'autore`: default 60%.
- `Aliquota INPS stimata`: default 17,9%, modificabile anche a 26%.
- `Credito / acconti imposta`: importi già versati o crediti da scalare.
- `Credito / acconti INPS`: contributi/acconti già versati o eccedenze.

Formula usata:

1. `fatture × 67% = reddito attività`.
2. `diritti/correlati × 60% = reddito diritti`.
3. `reddito attività + reddito diritti = reddito lordo`.
4. `reddito lordo - imposta sostitutiva = reddito netto dopo imposta / base INPS`.
5. `reddito lordo × 5% fino al 2025, poi 15% = imposta sostitutiva`.
6. `reddito netto dopo imposta × aliquota INPS = INPS stimata`.

Per salvare i nuovi campi su Supabase eseguire la SQL `SUPABASE_MIGRATION_V2_10_5_FISCO_DIRITTI.sql`.

## Nota v2.10.6 - Tema grigio topo scuro

La versione v2.10.6 prova una nuova veste grafica: nero sulle parti laterali e grigio topo scuro nella parte centrale dell'app. Le tabelle hanno righe alternate per migliorare la lettura e distinguere meglio colonne, card e blocchi operativi. Se il risultato non convince, si può tornare alla v2.10.5 oppure rimuovere `kyv-theme.css` dalle pagine.


## Stazione Ascolto - Radio Drive + Dropbox

La modalità Radio crea una playlist unica per ascoltare rapidamente i brani MP3/audio presenti tra Drive e Dropbox. Aprire **Stazione Ascolto**, scegliere **Radio**, cliccare **Carica Radio Drive + Dropbox**. La radio carica l'Archivio Audio registrato in Supabase/Dropbox e prova a cercare file audio in Google Drive. Per brani Dropbox non ancora registrati, usare **Aggiungi Dropbox** e selezionare i file dal Dropbox Chooser.

Comandi disponibili: Play/Pausa, Avanti, Indietro, Casuale e Ripeti. Il pulsante Ripeti alterna tra ripetizione lista, ripetizione brano e ripetizione disattivata.


## v2.10.8 - Campi progetto ricercabili e ordinamento menu

- Aggiunto `kyv-searchable-select.js`: i menu a tendina lunghi e i campi di collegamento progetto diventano ricercabili.
- Applicato al campo `Collega a progetto` in `Archivio Audio & Invii Dropbox`.
- Applicato anche ai campi progetto in Stazione Ascolto, Spese Extra e Schede operative.
- I progetti vengono ordinati alfabeticamente per artista/titolo.
- Le tabelle o elenchi dove l'alfabetico non è utile mantengono un ordinamento operativo, per esempio più recente prima.
- Nessuna modifica a Supabase e nessuna nuova SQL richiesta.

## v2.10.9 - Fix blocco webapp su select ricercabili
- Corretto `kyv-searchable-select.js`: la v2.10.8 poteva bloccare la webapp perché il MutationObserver intercettava anche le option riscritte dal componente stesso, generando refresh continui.
- Mantenuti i campi ricercabili e l’ordinamento alfabetico per i collegamenti progetto.
- Nessuna modifica a Supabase, tabelle, dati o Piano Fiscale.
- Aggiornato service worker per forzare la pulizia cache della versione bloccante.

## v2.11.1 - Uso Drive multi-account

Apri `kyv_drive.html`. Nel riquadro laterale scegli:

- `Tutti i Drive configurati`, per leggere tutti gli account Drive disponibili;
- `Drive info@kyvprod.net`, per leggere solo quel Drive;
- `Drive prodkyv@gmail.com`, se è stato configurato il relativo URL Apps Script in `config.js`.

Se un account risulta “Da configurare”, significa che manca l'URL Apps Script per quell'account. Puoi usare il file `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` per creare un deployment separato dall'account Google corretto e poi incollare l'URL nel blocco `GOOGLE_DRIVE_ACCOUNTS`.

La Stazione Ascolto usa lo stesso sistema Drive: nella tab Drive puoi scegliere l'account, mentre la Radio carica i Drive configurati.

## v2.11.1 - Campi con memoria

Alcuni campi ricorrenti leggono automaticamente i valori già presenti nelle colonne Supabase. Per esempio: artista, titolo, tipo file, destinatario, canale, categoria spesa e altri campi operativi. Il campo resta libero: puoi scrivere un valore nuovo oppure scegliere un valore già usato.


## Drive prodkyv@gmail.com configurato - v2.11.1
Nel file `config.js` è stato inserito l'URL Apps Script fornito per l'account `prodkyv@gmail.com`. Da `kyv_drive.html` selezionare `Tutti i Drive configurati` oppure `Drive prodkyv@gmail.com` per verificare la lettura dei file. Se la ricerca non restituisce file, controllare che lo script Apps Script sia pubblicato come Web App, esegua come proprietario e abbia accesso ai file/cartelle Drive.

## Google Drive - errore “Failed to fetch”
Se compare `Failed to fetch`, controllare prima il deployment Apps Script: deve essere Web App, eseguita come proprietario e accessibile a chiunque. La v2.11.2 supporta anche il fallback JSONP, ma richiede che lo script Google Drive sia aggiornato con il template `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` incluso nello ZIP.


## v2.11.3 - Fix definitivo blocco Drive / CORS / Service Worker

- Corretto `sw.js`: ora il service worker non intercetta più richieste esterne verso Google Apps Script, Drive, Dropbox o Supabase. Questo elimina l'errore `Uncaught (in promise) TypeError: Failed to fetch at sw.js`.
- Aggiornato `kyv-drive-bridge.js`: per `script.google.com` usa JSONP come metodo primario, evitando chiamate `fetch` bloccate da CORS.
- Aggiornato `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` alla v2.11.3 con supporto JSONP e fallback DriveApp se il servizio avanzato Drive API non è abilitato.
- In `config.js`, il Drive `info@kyvprod.net` è stato lasciato da riconfigurare perché l'URL precedente restituisce HTTP 404. Il Drive `prodkyv@gmail.com` resta configurato con l'URL fornito dall'utente.
- Nessuna modifica a Supabase, tabelle o dati.

## Nota v2.11.4 - Controlli dopo il deploy

Dopo il caricamento della versione v2.11.4 verificare:

1. `/ascolto.html` → Filtri → Progetto: deve mostrare i progetti ordinati e ricercabili.
2. `/ascolto.html` → Collega a progetto: deve mostrare gli stessi progetti.
3. `/editor.html` → tabella `PROGETTI` → Modifica: i campi ricorrenti come artista, autori, label, management, stato e sviluppo mostrano suggerimenti dai valori già usati.
4. Console browser: non deve più comparire errore `favicon.ico 404`; i link audio non riproducibili mostrano un avviso nella UI invece di bloccare la pagina.

Il warning Tailwind CDN è un avviso di produzione, non un blocco funzionale: verrà risolto solo passando a una build CSS dedicata.


## Aggiornamento v2.11.5 - Correzioni Drive/Dropbox/Auth

- Reinserito e confermato l’URL Apps Script per `prodkyv@gmail.com`.
- Rimossi i `defer` dal caricamento Supabase nelle pagine principali, così `kyv-auth.js` non parte prima della libreria.
- `kyv-auth.js` ora ritenta dopo il caricamento pagina e non stampa più errori quando Supabase non è ancora pronto.
- Corretto Dropbox Chooser: i filtri usano il tipo supportato `audio` invece dell’elenco di estensioni non accettato dal nuovo Chooser.
- Aggiornato service worker a `kyv-studio-v2-11-5-drive-dropbox-auth`.
- Filtrato il warning Tailwind CDN non bloccante dalla console, senza cambiare la grafica.

## Nota v2.11.6 - Google Drive non risponde / CORS

La v2.11.6 non dipende più solo dal JSONP del browser. Dopo il deploy su Vercel, la webapp interroga Google Apps Script tramite il proxy interno `/api/drive-proxy`.

Per testare: aprire `kyv_drive.html`, scegliere `Drive prodkyv@gmail.com` e premere **Diagnosi collegamento**. Se il proxy è deployato correttamente e lo script Apps Script è pubblico, il test deve dare OK. Se compare una pagina di login/autorizzazione nel dettaglio errore, lo script Apps Script non è pubblicato con `Who has access: Anyone` oppure non è stata creata una nuova versione del deployment.

La Radio in `ascolto.html` usa automaticamente lo stesso proxy quando carica i file Drive.


## v2.11.7 - Ricreazione pulita Google Drive

Questa versione mantiene il proxy Vercel `/api/drive-proxy`, ma aggiunge una procedura più stabile per ricreare da zero lo script Google Drive.

Novità:
- nuovo `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` v2.11.7 clean, basato solo su `DriveApp` e `ContentService`;
- non serve più abilitare il servizio avanzato Drive API;
- in `/kyv_drive.html` è disponibile un box “Configura nuovo URL Drive” per incollare il nuovo URL `/exec` e provarlo subito;
- l’URL salvato dal box viene memorizzato nel browser via `localStorage`, quindi non richiede una nuova build della webapp;
- dopo verifica positiva si può riportare lo stesso URL in `config.js` per renderlo definitivo.

Procedura consigliata:
1. Accedere a `script.google.com` con l’account Drive corretto, per esempio `prodkyv@gmail.com`.
2. Creare un nuovo progetto Apps Script.
3. Incollare tutto il contenuto di `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs`.
4. Eseguire una volta `testDrive` e autorizzare.
5. Pubblicare come Web App: Execute as `Me`, accesso `Anyone`.
6. Copiare l’URL `/exec`.
7. Aprire `/kyv_drive.html`, incollare l’URL nel box di configurazione, salvare e fare diagnosi collegamento.

## Link cliccabili e popup anteprima - v2.11.8

Da questa versione i campi LINK presenti nelle tabelle sono cliccabili.

- Se il link punta a PDF, documento, Excel, immagine o file Drive/Dropbox, viene aperto un popup di anteprima nella webapp.
- Se il link punta a un file audio, viene aperta la Stazione Ascolto con il brano già caricato.
- Nel popup sono disponibili i comandi `Copia link`, `Apri esterno` e `Chiudi`.
- Se l’anteprima non si carica, significa in genere che il file non è pubblico o richiede permessi: usare `Apri esterno`.

### Tabelle compatte

Tutte le tabelle vengono compattate automaticamente:

- larghezza iniziale massima cella: circa 4 cm;
- contenuto lungo abbreviato con ellissi;
- testo completo visibile come tooltip;
- doppio click sulla cella per espandere il contenuto;
- trascina il bordo destro dell’intestazione della colonna per allargarla o restringerla manualmente.


## Nuovo progetto da box audio - v2.11.9

Nelle sezioni:

- Stazione Ascolto MP3
- Google Drive
- Archivio Audio & Invii Dropbox

se un box rappresenta un file audio e il titolo del brano non risulta già presente nei campi di PROGETTI, compare il pulsante “Nuovo progetto”.

Premendolo si apre una finestra con titolo, artista, link file e note automatiche. Dopo la conferma viene creato un record in PROGETTI. Nei file già archiviati in DROPBOX_AUDIO_FILES il sistema prova anche a collegare automaticamente il file al nuovo ID progetto.

Se il box non è un file audio, resta il comando “Copia link” per usare manualmente il collegamento.


## Aggiornamento v2.11.10
- Reinserito nel `config.js` il nuovo URL Apps Script per `prodkyv@gmail.com`: `https://script.google.com/macros/s/AKfycbw4S8LZ-LLDewzv3uAEJkLaEjGTfFD1XRJppV0Oy1pOkmK_3exDpp0j_Bw6jmSGjeU0UA/exec`.
- Corretto un problema nascosto in `kyv-drive-bridge.js` nella funzione JSONP (`let script` duplicato) che poteva impedire il caricamento del modulo Drive.
- Cache service worker aggiornata a `kyv-studio-v2-11-10-drive-url-fix`.
- Nessuna modifica Supabase/SQL.


## v2.11.11 - Backup riparato e creazione progetto audio sicura

- Ripristinate le funzioni reali di Backup DB su PC e Ripristino locale in `importexport.html`: esportazione JSON di tutte le tabelle, progress bar, anteprima backup, selezione tabelle, ripristino non distruttivo, deduplica e inserimento a blocchi.
- Corretto `kyv-audio-project.js`: la creazione progetto da box audio usa solo `insert`, mai `update`/`upsert`; calcola un nuovo ID progetto con `max(ID)+1` quando il database lo consente e rifiuta per sicurezza un ID già presente.
- La correzione vale per Stazione Ascolto MP3, Google Drive e Archivio Audio & Invii Dropbox, perché tutte usano lo stesso modulo `KYV_AUDIO_PROJECT`.
- Nessuna nuova SQL e nessuna modifica allo schema Supabase.


---

## v2.11.12 - Stabilizzazione tecnica e diagnostica Drive

- Aggiunti `kyv-toast.js` e `kyv-helpers.js` come primo refactor leggero: toast, parsing numerico, copia testo e download JSON hanno un punto comune.
- Le funzioni locali duplicate `parseKyvNumber` e alcuni `showToast` ora delegano agli helper comuni, senza migrazione Next.js e senza cambiare Supabase.
- `kyv-drive-bridge.js` documenta in testa il flusso Drive corrente: proxy Vercel → JSONP → eventuale fallback CORS disattivato.
- Aggiunto logging Drive in `localStorage` (`kyv_drive_logs_v2`) con evento, account, trasporto, azione, timestamp e messaggio.
- In `kyv_drive.html` aggiunti i comandi **Scarica log** e **Pulisci log** accanto alla diagnosi collegamento.
- Aggiornata cache Service Worker a `kyv-studio-v2-11-12-tech-stabilization`.
- Nessuna nuova SQL e nessuna modifica ai dati Supabase.


## v2.11.14 - Campi intelligenti da valori già usati

- Potenziato `kyv-field-memory.js`: i campi ricorrenti ora propongono valori già presenti nelle colonne Supabase corrispondenti.
- Aggiunti suggerimenti più estesi per clienti, follow-up, documenti, spese, archivio audio, invii e campi dinamici dei progetti.
- I campi restano liberi: si può scegliere un valore già usato o scriverne uno nuovo.
- Aggiunto osservatore sicuro per modali e form generati dinamicamente, così anche modifica progetto/schede rapide ricevono suggerimenti.
- Nessuna nuova SQL e nessuna modifica a Supabase.
- Aggiornata cache Service Worker a `kyv-studio-v2-11-14-data-safety-guard`.

## v2.11.14 - Uso sicuro di backup, ripristino e creazione progetti

### Ripristino backup locale

1. Apri `Import/Export`.
2. Carica il backup JSON dal PC.
3. Lascia attivi `Salta duplicati` e `Backup sicurezza prima`.
4. Premi `Verifica` per vedere quante righe verranno inserite e quante verranno saltate.
5. Premi `Ripristina selezionate` solo dopo la verifica.

Il ripristino non cancella dati e non aggiorna righe esistenti. Le collisioni di ID/chiave primaria vengono sempre saltate per evitare sovrascritture o errori bloccanti.

### Nuovo progetto da audio

Quando un file audio in Stazione Ascolto, Google Drive o Archivio Audio non risulta già presente nei progetti, il pulsante `Nuovo progetto` crea un nuovo record in `PROGETTI` usando solo INSERT protetto. Se il database restituisce un ID già esistente, l'operazione viene annullata.

---

## v2.12.0 — Diagnostica Sistema e consolidamento tecnico

### Diagnostica Sistema
Aprire `diagnostica.html` dal menu laterale o da App Launcher.

La pagina controlla:
- connessione Supabase;
- raggiungibilità `PROGETTI`;
- stato Drive multi-account;
- presenza proxy Vercel `/api/drive-proxy`;
- Service Worker e cache attiva;
- moduli comuni caricati;
- log locali Drive e Data Guard.

Comandi disponibili:
- **Riesegui diagnosi**: ripete tutti i controlli.
- **Scarica report**: esporta un JSON utile per debug.
- **Pulisci log**: svuota log Drive e Data Guard locali.

### Tabelle
Le tabelle ora usano uno standard comune:
- celle compatte con limite iniziale circa 4 cm;
- tooltip automatico;
- doppio click su cella per espandere;
- trascinamento bordo colonna per allargare;
- intestazioni cliccabili per ordinare;
- campo “Cerca in questa tabella” sulle tabelle lunghe;
- link/file/documenti/audio cliccabili tramite popup o Stazione Ascolto.

### Sicurezza dati
La v2.12.0 mantiene le protezioni v2.11.14: creazioni INSERT-only, Data Guard, backup sicuro prima del ripristino e blocco collisioni ID.
