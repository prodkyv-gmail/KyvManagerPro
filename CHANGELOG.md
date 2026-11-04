### v2.66 · 2026-11-04
- Collaudo trasversale automatizzato di ricerca, navigazione, Editor e consenso audio; verifica delle rotte fra progetti, fatture e versioni e dei limiti di ogni modulo.
- Ricerca globale: pulsante Aggiorna reale, invalidazione su salvataggi espliciti, protezione delle richieste in corso da risultati obsoleti e messaggi corretti quando l'indice non è pronto.
- Recenti della ricerca visibili solo nella sessione della pagina: nessun titolo di record privato conservato sul dispositivo tra account. Invio su pulsanti e input rispettato.
- Record Editor: evento di salvataggio solo dopo successo; errore nel refresh della vista separato da un errore del database.
- Test v2.66, guida e cache PWA allineati. Nessuna migrazione, nessuna scansione automatica o collegamento di audio, nessun accesso a Vercel. Collaudo autenticato su PWA ancora da eseguire.

# Changelog

### v2.72 · 2026-11-04
- Progetti: la Vista rapida diventa compatta e propone una sola azione principale, con sezioni native espandibili **Scadenze e note** e **Sessioni, audio e fatture**. Tutti i dati e i link già esistenti restano disponibili con l'ID progetto.
- Scheda: unificato il controllo della densità di vista in Easy/Completa, rimuovendo il pulsante duplicato “Mostra dettagli”; aggiunti role=group e aria-pressed per accessibilità.
- Aggiunti test specifici sulla generazione HTML del popup, unicità dell'azione principale e conservazione dei link; aggiornati guida, versione, cache PWA e aspettative dei test. Nessun cambiamento a database, autorizzazioni o deploy Vercel.


### v2.71 · 2026-11-04
- Pagina Progetti: menu mobile con Esc, Tab, focus di ritorno, aria-expanded e blocco temporaneo della barra inferiore; pagina corrente semanticamente indicata.
- Impedito il doppio montaggio di navigazioni mobili quando una barra comune esiste già; nessun nuovo observer.
- Pipeline/Fatture/Rendiconto: gruppo Easy/Completa con aria-pressed e pannelli che rispettano l'apertura manuale durante i refresh.
- Aggiornati guida, manuale, QA, test e cache PWA. Nessuna modifica ai dati o accesso Vercel.


### v2.70 · 2026-11-04
- Correzione effettiva del caricamento in config.js di `kyv-flow-routes-v269.js`, che ora precede il renderer KYV Workflow Nav. In v2.69 il modulo era presente nell'archivio ma non caricato, quindi il contesto del progetto poteva mancare. Rafforzato anche il test di regressione: non basta confrontare gli indici se la dipendenza è assente.
- Consolidamento della voce **Fatture**: quando compare nel Percorso il riepilogo «da incassare / incassate / nessuna fattura / indisponibile» appare come stato non azionabile dentro quello stesso collegamento. Eliminato il secondo chip di navigazione che duplicava la funzione. Nessun inserimento o ripartizione parte da solo, e non si confonde lettura fallita con assenza fattura. Le pagine senza voce Fatture mantengono il comportamento precedente.
- Nella scheda progetto lo stato delle fatture segue subito la selezione di un altro progetto, anche se due progetti hanno lo stesso titolo.
- Una sola scheda «Prossima azione»: il riepilogo nell'Hub progetto è prioritario; quello nell'hero v2 rimane come ripiego soltanto se l'Hub non è disponibile. Tutte le sezioni e le azioni già esistenti restano accessibili.
- Aggiornati test, guida contestuale, manuale, policy documentale e cache PWA. Nessuna modifica allo schema o ai dati. Il collaudo PWA autenticato resta necessario dopo la distribuzione.


### v2.69 · 2026-11-04
- Percorso contestuale tra Scheda Progetto, Sessioni, Audio Finder e Fatture. Passa l'ID verificato attraverso i parametri già supportati da ciascuna pagina; etichette/URL centralizzati in un modulo puro senza letture o scritture. Nessuna ulteriore barra duplicata: si riusa KYV Workflow Nav.
- Sessioni Studio ora accetta un progetto contestuale con etichetta, filtro esplicito e via d'uscita “Vedi tutte le sessioni”. La lettura degli archivi non è più silenziosamente limitata a 1.000 record: riusa caricatore completo verificato v2.67, con errore in caso di incompleto.
- La vista rapida Progetti include un collegamento contestuale alle Sessioni del medesimo brano. Audio Finder pre-seleziona soltanto il contesto esistente: la scelta finale del file e la conferma del collegamento restano azioni dell'utente. Il passaggio a Fatture usa il parametro informativo collegaProgetto, non l'apertura automatica di una ripartizione.
- Moduli economici, ricerca globale e logiche di salvataggio/consenso restano immutati. Test automatici dei percorsi, guida contestuale, manuale e cache PWA aggiornati. Nessun accesso Vercel né modifica dati DB.
- Collaudo grafico e autenticato in PWA ancora da effettuare dopo il deploy.


### v2.68 · 2026-11-04
- Studio Editor: i popup di modifica inviano al database soltanto i campi effettivamente cambiati dall'utente; non riscrivono campi intatti, null storici, dati provenienti da altre integrazioni o valori trasposti dalla UI. Gli inserimenti inviano soltanto i campi compilati intenzionalmente.
- Indicatore nel popup dei campi ancora da salvare, controllo di chiusura con conferma, avviso nativo in uscita dalla pagina, salvataggio unico con input bloccati durante l'invio e nessun aggiornamento se non ci sono modifiche.
- I riferimenti incrociati si aprono in popup con tabella/ID di destinazione espliciti senza sostituire la griglia di provenienza. Eliminazioni con tabella e ID fissati alla richiesta e pulsante disattivato durante l'operazione.
- Archivio AUDIO_VERSIONI rimane sola lettura anche nel popup. I salvataggi verificati notificano la ricerca globale per invalidare la sua cache temporanea.
- Test automatici specifici (compresi null/date/numeri/autofill), guide e cache PWA aggiornate. Nessuna migrazione o modifica di dati, regole fiscali, formule o proprietà audio. Nessun accesso Vercel.


### v2.67 · 2026-11-04
- Studio Editor: eliminato il troncamento silenzioso alle prime 1.000 righe. Lettura completa per tabella con paginazione da 500, conteggio esatto, ordinamento stabile per chiave e limite esplicito di 30.000 record.
- Se la copertura non è verificabile, errore/limite/permesso negato, la griglia non usa risultati parziali e offre Riprova. Risposte obsolete da altri tab non possono sostituire la tabella selezionata.
- Resa progressiva delle righe: prime 120, pulsante Mostra altre 120. Ricerca, ordinamento e CSV continuano a operare sul dataset completo verificato, indipendentemente dalle colonne nascoste.
- Indicatori con righe mostrate, corrispondenze e totale verificato; controlli di salvataggio/export bloccati durante letture non complete. Non modificati CRUD, formule, RLS, dati, colonne o segni SIAE.
- Test automatici con mock, guida contestuale e manuale, versione e cache PWA aggiornati. Nessun accesso a Vercel o collaudo autenticato su produzione.


### v2.65 · 2026-11-04
- Ricerca globale: letture complete paginate su sette archivi e conteggi esatti, non più limiti silenziosi per tabella; errori, incompletezza, soglia massima e riprova esplicita. Conteggio match totali distinto dai primi 30 risultati mostrati.
- Popup ricerca: focus iniziale/finale, Tab, Esc e indicazioni ARIA. Pulsante Cerca montato dal menu tramite eventi di completamento senza polling; indice in memoria solo dopo letture integralmente verificate.
- Studio Editor: casella di ricerca rinominata e descritta come filtro della tabella corrente; nessun cambiamento a CRUD o colonne.
- Archivio musicale: conteggi verificati e paginazione per tutti gli archivi di confronto; blocco di inserimenti con copertura incompleta; l'eventuale archivio unificato davvero assente conserva il fallback legacy.
- Associazione audio: somiglianza per nome solo suggerita, nessun progetto preselezionato per nuovi file, scelta manuale e conferme finali originali mantenute; azioni multiple denominate «Rivedi» anziché «Inserisci».
- Nuovi test di copertura database simulata, permessi/errore e separazione suggestion/selection; cache, versione e guide sincronizzate.

### v2.64 · 2026-11-04
- Producer Mode: Pipeline & opportunità direttamente dopo Ascolto, eliminato riordino del menu tramite polling di 6 secondi; montaggio sidebar disconnette subito l'observer appena pronto, una sola voce Pipeline.
- Home: Attività da chiudere visibili senza apertura di un secondo pannello, Stato operativo facoltativo, CTA Nuovo senza duplicati; grafici e fatture per tipologia restano dentro i rispettivi pannelli della v2.63 senza riallocazioni DOM.
- Guida contestuale: focus sul controllo di chiusura, ciclo Tab/Maiusc+Tab, Esc prioritario sul dialogo e ripristino del focus sul pulsante che ha aperto il popup; barra mobile con aria-current.
- Responsive: etichette applicate alle sole nuove righe, mantenute le etichette manuali, rilettura completa solo su cambio reale delle intestazioni; ridotti i ricalcoli inutili del MutationObserver.
- Rifiniti focus da tastiera, indicazioni di scorrimento tabelle e aree touch mobile nel tema condiviso; test regression dedicati, guida e cache PWA sincronizzati. Nessuna modifica a database, audio o regole fiscali.

### v2.63 · 2026-11-04
- Home: priorità operative subito visibili; fatture per tipologia PAGATA e grafici dettagliati in pannelli richiudibili, Chart.js ridimensionato all'apertura senza nuove letture. Collegamento Sessioni alla Scrivania creativa attuale. Gli errori mostrano dati non disponibili, non falsi zeri.
- Economia: funzioni operative mantenute; link amministrativi raccolti in Analisi e strumenti; registro suddiviso in Fatture da incassare aperte e Fatture incassate richiudibili, con totali ancora visibili e nessuna modifica a incassi/acconti/ripartizioni.
- Analyst: nuova graduatoria del fatturato esplicitamente attribuito agli artisti con selettore indipendente Top 5/10/20 dal report già calcolato; indicatori creativi secondari richiudibili, verifiche e domande in primo piano.
- Stili comuni, nuova suite regressione UI, guida contestuale e manuale sincronizzati, cache PWA v2.63; nessun database o Vercel modificato.

### v2.62 · 2026-11-04
- Scrivania musicale: pannelli richiudibili per filtri avanzati e grafico globale, azzeramento mirato e riduzione dei KPI duplicati nelle testate delle tre schede.
- Sessioni e Piazzamenti: ricerche indipendenti tra tab, navigazione tastiera, moduli essenziali con campi avanzati facoltativi riaperti alla modifica; invariati validazioni e salvataggi.
- Popup musicale → Piazzamenti: trasporto per ID progetto verificato e sola preselezione senza scrittura.
- Audio Finder: esplorazione dei soli audio personali in primo piano, quattro passaggi con pannelli richiudibili per sorgenti, audit, proposte e versioni, salti ad ancora che aprono le sezioni richieste.
- Catalogo audio: ricerca e filtri ridisegnano la sola lista anziché riconfigurare gruppi/esploratore/audit; apertura automatica del blocco avanzato quando si seleziona un file da un gruppo.
- Suite regressione dedicata, guida contestuale/manuale, versione e cache PWA aggiornate; nessuna migrazione dati né accesso Vercel.

### v2.61 · 2026-11-04
- Progetti safe: grafico globale e filtri avanzati in pannelli nativi richiudibili, conta filtri attivi, apertura automatica del pannello quando si sceglie un intervallo dal grafico; nessun nuovo renderer.
- Layout mobile della lista in card senza scorrimento tabellare, con etichette e attività datate; popup Riepilogo accessibile da tastiera, con chiusura Esc e restituzione del focus.
- Scheda Progetto: selettore iniziale compatto (12 risultati, ricerca in tutto l'archivio caricato, massimo 80 risultati visualizzati); pulsante «Cambia progetto» dopo l'apertura.
- UI della Scheda allineata al tema condiviso; Easy mostra il percorso guidato senza duplicare altri lanciatori, Completa mantiene ogni pannello. Nessun cambiamento su salvataggi, dati, file o database.
- Guida contestuale/manuale/test dedicati e cache PWA allineati alla v2.61.

### v2.60 · 2026-11-04
- Sistema visivo condiviso v2.60 in kyv-theme.css, applicato alle schermate operative compatibili: card, spazio, leggibilità, pulsanti, moduli, focus e mobile; la pagina Progetti safe rimane isolata.
- Navigazione senza ripetizioni: Tutte le app una sola volta, Fatture in Amministrazione, barra mobile con Ascolto diretto e aria-current stabile, senza riscrittura del collegamento Rubrica.
- Scrivania creativa e Audio Finder: collegamenti in testata solo contestuali; scansione combinata e OAuth Dropbox facoltativo dentro pannelli details HTML, con controlli e identificativi originali invariati.
- Aggiunta suite regressione v2.60, guida contestuale/manuale e rotazione cache PWA; nessuna modifica ai flussi database, permessi o calcoli.

### v2.59 · 2026-11-04
- Nuova vista predefinita «Scrivania musicale» nella Scrivania creativa, senza duplicazione di archivi: unione in sola lettura per progetto delle sessioni documentate, piazzamenti attivi, audio personali confermati, fee e fatture esplicitamente attribuite.
- Filtri autonomi, ricerca tra artisti/titoli/sessioni/destinatari, grafico stato piazzamenti, caricamento progressivo e popup di dettaglio con navigazione alle sezioni originali.
- Economia: quote basate su PrezzoUnitario/ripartizioni, incassi solo da movimenti non stornati su fatture a progetto diretto, nessuna ripartizione presunta degli incassi multi-progetto; flag PAGATA legacy segnalato separatamente.
- Se una fonte economica non è disponibile, sospende le metriche economiche senza bloccare le viste creative. Versione, guida e suite regressioni aggiornate; nessuna migrazione dati e nessun accesso Vercel.

### v2.58 · 2026-11-04
- Dropbox: nuovo percorso OAuth PKCE temporaneo e ricerca ricorsiva di sola lettura avviata manualmente su cartelle autorizzate, con paginazione limitata e avvisi per scansioni parziali. Restano archivio e Chooser precedenti.
- OneDrive: predisposti OAuth Microsoft e ricerca per testo con Graph Files.Read; non operativi senza configurazione client ID/SPA. Salvataggio disabilitato finché non viene applicata e verificata la migrazione SQL dei provider e attivato il flag.
- Risultati cloud indirizzati soltanto alla coda di revisione manuale; nessun progetto o audio creato, nessun token memorizzato. Dropbox content_hash non viene scambiato per SHA-256.
- Test automatici PKCE/ricerca, documentazione e versione/cache aggiornati. Nessun accesso Vercel, migrazione applicata o collaudo provider reale.

### v2.57 · 2026-11-04
- Audio Finder: introdotto «Controllo archivio audio», solo in lettura e dai metadati autenticati già caricati.
- Indicatori per file ancora da classificare nella scansione corrente, audio personali senza progetto, gruppi con SHA-256 identico e progetti senza file personali collegati nel catalogo.
- Ricerca combinata per testo, sorgente e categoria, navigazione progressiva e apertura esplicita del dettaglio file o della scheda progetto.
- Nessuna presunzione di proprietà o cancellazione basata sui duplicati; storici e audio esterni non modificati. Guida, test e PWA sincronizzati.

### v2.56 · 2026-11-03
- Audio Finder: quando si seleziona una fonte, il dettaglio del gruppo mostra e rende collegabili solo i file di quella sorgente. «Tutte le sorgenti» mantiene il confronto tra archivi.
- Il cambio fonte azzera selezioni e progetto di destinazione, prevenendo collegamenti di file non più visibili.
- La conferma manuale espone nome progetto e file selezionati; dopo la rilettura del database si verifica di nuovo fonte e gruppo.
- Suite dedicata v2.56, guida contestuale/manuale e cache PWA aggiornate. Nessuna migrazione DB, nessuna scansione continua, nessun accesso Vercel.


### v2.55 · 2026-11-03
- Audio Finder: i file senza artista dichiarato non vengono più raggruppati sotto un artista noto, neppure se il titolo coincide.
- Se un filtro nasconde il gruppo di versioni aperto, la scheda e le selezioni di file e progetto vengono azzerate.
- Bloccata la ripetizione dello stesso file in una selezione manuale da collegare; dettagli e guida esplicitano i limiti dei filtri sorgente.
- Regressioni automatizzate v2.55, manuale e guida contestuale sincronizzati; PWA cache ruotata. Nessuna migrazione DB, nessun audio caricato, nessun accesso Vercel.

### v2.54 · 2026-11-03
- Revisione guidata: gruppi temporanei per titolo e artista dichiarati, separazione brani omonimi e artisti non specificati, filtri e navigazione progressiva.
- Caselle esplicite per selezione multipla fino a 100 file della vista corrente; le classificazioni massive richiedono conferma e salvataggio separato.
- Reference già escluse, file personali già confermati, revisioni metadati e scelte manuali non vengono sovrascritti da azioni massive.
- Cambiare filtri/gruppi azzera le caselle per evitare operazioni invisibili. Audio e progetti non modificati dalla ricerca.
- Test v2.54, manuale, guida, versione e cache PWA aggiornati; nessuna migrazione database.


### v2.53 · 2026-11-03
- Nuovo pulsante manuale **Analizza sorgenti cloud insieme** per Drive configurati e archivio Dropbox registrato, con rapporto distinto per fonte.
- Errori e scansioni parziali non nascondono i risultati delle altre sorgenti; nessuna cancellazione di file non trovati.
- Deduplicazione dei risultati solo per identità completa della sorgente, non per titolo; anomalie dei metadati indicate.
- Suggerimenti di possibili copie fra sorgenti basati su veri hash SHA-256 o somiglianze dichiarate come indizi, senza creazione automatica di progetti.
- Manuale, guida contestuale, versioni, PWA e test aggiornati. Nessuna migrazione DB né accesso Vercel.


### v2.52 · 2026-11-03
- Audio Finder: confronto incrementale per identità sorgente, vista «Nuovi / modificati / invariati / reference / da verificare».
- Gli aggiornamenti di metadati di un proprio brano richiedono conferma esplicita; scansioni senza modifiche non scrivono sul database.
- Rilettura finale contro modifiche concorrenti; conservazione di hash e metadati validi quando una sorgente li omette.
- Proposte di versioni per titolo/artista, nessuna fusione o creazione automatica di progetti.
- Google Drive segnala scansione limitata dal numero di pagine, senza trattare file assenti come eliminati.
- Guida e suite di test aggiornate; nessuna migrazione del database.


### v2.51 · 2026-11-03
- Esploratore unificato dei soli audio personali approvati con filtri incrociati per sorgente, archivio e stato dei collegamenti.
- Dropbox Chooser ufficiale integrato in Audio Finder: selezione file, coda di classificazione e nessuna creazione automatica.
- Player locale temporaneo per file esplicitamente selezionati; nessun upload o accesso permanente ai file.
- Ricerca e filtro nella coda di acquisizione; selezione massiva limitata ai file visibili.
- Catalogo tecnico spostato nei dettagli espandibili, guida e PWA aggiornate.


### v2.50 · 2026-11-03
- Progetti: popup rapido in sola lettura, ricerca completa con paginazione, filtri combinabili e ordinamenti, vista compatta.
- Panoramica grafica del database PROGETTI con conteggi verificabili per stato/fase e dati non indicati.
- Home: grafici indipendenti per fatturato emesso basato su PrezzoUnitario, stati registrati e numero di progetti per artista. Incassi da PAGATA indicati come stime.
- Guida, test e PWA aggiornati senza migrazioni o alterazioni dei dati storici.


## 2026-11-03 — v2.49 Raggruppamento versioni personale e assistito

- Catalogo multi-source: gruppi probabili per titolo e artista, riconoscimento demo/mix/master/stems, duplicati verificati solo per hash identico.
- Filtri di gruppi, ricerca per titolo/versione, selezione e conferma di massimo 25 versioni per un progetto esistente senza creazioni implicite.
- Popup per creare un progetto da audio: scelta destinazione obbligatoria, conferma esplicita, gestione corretta del provider locale e associazione Finder verificata.
- Nessuna tabella nuova, nessun audio binario trasferito; ricerca limitata agli audio personali confermati.
- Migliorata la velocità dei filtri grazie alle identità approvate indicizzate, PWA e manuale aggiornati.


## v2.48 — Audio personali, PC/Mac e smartphone (3 novembre 2026)

KYV Audio Finder non presume più che qualsiasi audio letto da una cartella autorizzata sia un tuo brano. Dopo aver scelto una cartella su PC/Mac o file da PC, Android o dall'app File su iPhone, compare la coda **Mio / Reference / Da verificare**. Ogni file è inizialmente da verificare; soltanto i file marcati **esplicitamente** "È un mio lavoro" vengono indicizzati e potranno essere collegati a progetti. Le reference vengono ricordate soltanto per identità sorgente (non sono archiviate le loro tracce audio, nomi, URL o percorsi), così la scansione successiva le riconosce come escluse. I file in attesa non entrano nel catalogo.

La classificazione può avvenire file per file o per i primi 100 file visibili, previa conferma. Premendo **Salva soltanto le scelte confermate** si registrano le decisioni e si indicizzano soltanto i file approvati, senza trasferire audio binari né creare progetti. Il comando **Apri proposta progetto / versione** compare soltanto dopo che un file personale è stato approvato e selezionato nel catalogo: apre un ulteriore popup per scegliere progetto esistente o crearne uno nuovo. Nessun progetto si crea dalla scansione, dal nome o automaticamente.

Le cartelle di smartphone non vengono scandite in background: iOS utilizza il file picker, Android supporta la scelta esplicita di file e in alcuni browser di cartelle; il browser non accede a cartelle non selezionate. La connessione OneDrive online, lo scanner persistente e un vero browser Dropbox/Drive cloud sono ancora **future fasi**, non sono dichiarati attivi.

In **Progetti**, la ricerca ora opera sull'intero archivio caricato anche con la scheda Recenti: il limite delle 40 righe si applica soltanto quando non si sta cercando.

Il database additivo `KYV_AUDIO_DECISIONI` conserva owner, provider, account_label, external_key e decisione, protetto da RLS. Non modifica le 175 schede, le fatture, i progetti storici o le cartelle dei dispositivi.


## 2026-11-03 — v2.47 Ripartizione fatture multi-progetto

- Nuova fattura multi-progetto e comando **Ripartisci / Duplica riga** sulle fatture esistenti, con importo unitario per progetto e fee riportabile manualmente.
- Un solo documento fiscale e fino a 100 righe; protezione anti duplicati e transazione atomica, con tabella additiva e RLS.
- Scheda Progetto, Progetti, KYV Analyst, Intelligence, Economia e Ritorno dei progetti riconoscono le quote esplicite; nessuna attribuzione automatica degli incassi condivisi.
- Regola finanziaria: **PrezzoUnitario**, non ImportoTotaleDocumento, nei conteggi gestionali (anche XML). Documentazione e PWA aggiornate.


## 2026-11-03 — hotfix Aruba XML e sequenza ID_FT

- Riallineata la sequenza interna dell'ID fatture (5→107 rispetto al massimo ID esistente), senza modificare le 107 fatture storiche e senza importare automaticamente alcun documento XML.
- Importatore: errore chiave primaria ora distinto da duplicato SHA-256 e problemi di autorizzazione, con indicazioni di recupero e nuovi test.
- Aggiornati guida in Fatture, manuale, documentazione e cache PWA. Versione funzionale invariata v2.46.


## 2026-10-31 — v2.46 Audio Finder

- Coda abbinamenti: suggerimenti titolo/artista spiegabili, conflitti ambigui senza selezione predefinita, selezione e conferma multipla (massimo 25) con un unico salvataggio dopo rilettura.
- Filtri per stato del file collegato e ricerca per parole, conservate associazioni manuali e reversibilità.
- Nessun file audio caricato, nessuna nuova integrazione Microsoft Graph/Dropbox full crawl, nessun cambiamento allo schema o allo storico.
- Aggiornati versione, cache PWA, guida contestuale/manuale HTML, documentazione e CI.


## 2026-10-29 — SIAE: polarità estratto + colonne Studio Editor

- Corretto il verso di ESTRATTO SIAE nei calcoli: IMPORTO con segno meno è a nostro favore, senza meno è a nostro sfavore. La conversione è solo in lettura/calcolo tramite `kyv-siae-amount.js`; archivio, deduplica import e importi grezzi non vengono modificati.
- Adeguati Rendiconto SIAE (totale e anni), diritti v7 (movimenti positivi, versati a saldo, ritenute e netto) e Intelligence mensile/annuale (serie provvisoria). Le liquidazioni di bonifici SIAE e IMAIE verificati rimangono distinte e non invertono segno.
- Studio Editor: menu **Colonne** su tutte le tabelle visualizzabili, preferenze per tabella salvate localmente, selezione individuale, ripristina tutte, minimo una colonna, piena ricerca e export CSV, senza modifiche al database. Gli importi di ESTRATTO SIAE in Studio Editor restano originali con legenda di interpretazione.
- Test dedicati `tools/test-siae-sign-editor-columns.js`, suite e PWA aggiornate. Non è stata fatta alcuna modifica DB/RLS o migrazione.


## Consolidamento 2026-10-07

- Aggiunta la pagina **Qualità Dati**, in sola lettura, per individuare progetti senza titolo o artista, possibili duplicati titolo/artista, versioni audio senza hash e documenti senza link.
- Il controllo usa colonne esplicite e limiti per ogni fonte, non modifica record e collega ogni anomalia alla relativa Scheda Progetto.
- La pagina è disponibile da Strumenti, App Launcher e Diagnostica ed è inclusa nella cache PWA.

## v2.31.0 - Scheda Progetto 2.0

- Ricomposta la Scheda Progetto in un flusso producer-first unico: header compatto, prossima azione, Versioni, Invii & Follow-up, Release Desk e Timeline.
- Le versioni usano `AUDIO_VERSIONI` con fallback compatibile ai file storici e vengono ordinate dalla più recente, distinguendo demo, revisioni e finali.
- Ogni nuovo invio registra la versione scelta dentro `INVII_AUDIO`; gli esiti operativi sono In attesa, Interessato, Da revisionare e Chiuso / non interessato.
- Confermata la regola automatica del follow-up dopo 5 giorni senza attività, visibile nella scheda e nell’Agenda.
- Mantenuti gli 8 controlli Release Desk già esistenti e portati nel flusso principale della scheda.
- Aggiunta una timeline unica ricostruita dai dati esistenti, senza nuove tabelle o migrazioni Supabase.
- Aggiornata la cache PWA e aggiunti controlli automatici dedicati alla Scheda Progetto 2.0 e alla non regressione della pagina Progetti.

## v2.28.0 - Pipeline & Opportunità

- Aggiunta la nuova pagina `pipeline.html` con vista kanban dei progetti nelle fasi Idea, Sessione, Inviato, In ascolto, Interessamento, Contratto, Produzione, Master e Uscito.
- La fase viene calcolata dai campi già presenti in `PROGETTI` senza sovrascrivere `STATO` o `SVILUPPO`, preservando diciture storiche e note operative.
- Aggiunti filtri per artista, label/management, priorità e follow-up, ricerca testuale e filtro per singola fase.
- Le card sono ordinate per urgenza e mostrano follow-up scaduti/imminenti, priorità, partner e accesso diretto alla Scheda Progetto.
- Aggiunto riepilogo con progetti visibili, attivi, follow-up nei prossimi 7 giorni e follow-up scaduti.
- Inserita la voce **Pipeline** nella navigazione globale e resa visibile in tutta l'app la versione corrente **Manager Pro 2.28**.
- Aggiornato `package.json` a `2.28.0` e la cache PWA a `kyv-studio-v2-28-pipeline-opportunita`.
- Nessuna nuova tabella e nessuna migrazione Supabase; la pagina usa il client centrale e resta compatibile con RLS.

## v2.27.0 - Scheda Progetto evoluta

- Aggiunto il modulo `kyv-project-hub-v227.js`, caricato soltanto nella Scheda Progetto.
- Inserito un blocco **Prossima azione** che usa follow-up, sessione, contratto, master, fatture, incassi e release per suggerire il prossimo passaggio operativo.
- Aggiunto editor rapido del follow-up direttamente nella scheda con `Prossimo_Followup`, `Priorita_Followup`, `Esito_Ascolto`, `Note_Followup` e opzione per registrare `Ultimo_Sollecito`.
- Aggiunto riepilogo economico del singolo progetto: fatturato, incassato, da incassare e spese collegate.
- Aggiunta timeline unica che aggrega sessioni, contratti, master, follow-up, pubblicazione, fatture, documenti, audio e invii.
- Aggiunte azioni rapide verso Ascolto, Audio, Documenti, Spese e Fatture mantenendo il contesto del progetto.
- Nessuna nuova tabella e nessuna migrazione Supabase: il modulo usa le tabelle esistenti ed è compatibile con la RLS v2.25.

## v2.26.0 - Centro operativo

- Integrati nella coda della Panoramica i follow-up presenti in `PROGETTI`, usando `Prossimo_Followup`, `Priorita_Followup`, `Ultimo_Sollecito`, `Esito_Ascolto` e `Note_Followup`.
- Aggiunti filtro Follow-up, ordinamento per scadenza e priorità, collegamento diretto alla Scheda Progetto e riepilogo dedicato nello Stato operativo.
- Rimossi URL e chiavi Supabase legacy dalle pagine: il browser usa unicamente `KYV.createSupabaseClient()` e `KYV_CONFIG`, mantenendo sessione e JWT necessari alle policy RLS.
- Nessuna modifica allo schema Supabase e nessuna nuova migrazione.

## v2.25.0 - Stabilizzazione tecnica

- Uniformato il login al client Supabase centrale `KYV.createSupabaseClient()`.
- Resa centralizzata in `kyv-auth.js` la protezione delle pagine operative: tutte le pagine che caricano il modulo richiedono una sessione valida, salvo esplicito opt-out.
- Aggiunto redirect `login.html?next=...` con validazione della destinazione per tornare alla pagina richiesta dopo l'accesso.
- Bloccata la versione di Lucide nella pagina login invece di usare `@latest`.
- Aggiunti controlli locali con `npm run check` per sintassi JavaScript e asset locali richiamati dagli HTML.

### Nota sicurezza

Questa release migliora la protezione lato applicazione, ma la sicurezza definitiva richiede la fase database: RLS Supabase, rimozione degli accessi anonimi e policy coerenti con il modello utenti reale.
