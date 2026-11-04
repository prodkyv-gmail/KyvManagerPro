## v2.61 — Progetti e Scheda Progetto: filtri richiudibili, card mobile e dettagli senza duplicati (4 novembre 2026)

**Progetti safe resta isolata** da `menu.js`, `kyv-theme.css` e observer globali: nessun secondo renderer o scansione dati. In `progetti.html` la ricerca globale, i preset Recenti/Da fare/In attesa/Usciti/Tutti, il motore puro `KYV_PROJECT_V250`, la lettura autenticata/paginata con conteggio `exact`, i controlli di completezza, il limite massimo verificato e gli ID originali sono invariati. **Filtri e ordinamento** e **Analisi archivio** sono ora due `details` nativi richiudibili, con indicazione dei filtri avanzati attivi; il grafico continua a usare tutto l'archivio e, al clic su una barra, apre automaticamente i filtri con il valore applicato. La tabella desktop resta; sotto 820 px diventa un insieme di card responsive con etichette accessibili e ultime attività leggibili anche nella vista compatta. I pulsanti **Riepilogo** e **Scheda** sono due azioni diverse: popup in sola lettura (focus trap, Esc e ritorno focus), e scheda completa per le modifiche. Rimangono immutati gli handler di creazione volontaria, il caricamento e la selezione progressiva.

**Scheda Progetto:** la ricerca nella selezione visualizza 12 risultati iniziali, poi filtra tutti i progetti caricati e mostra fino a 80 corrispondenze. Dopo la selezione, la tendina si chiude mostrando «Cambia progetto». Estese in `kyv-theme.css` le regole relative a selettore, card progetto, blocco produzione, wizard e editor esistente. Nella sola modalità **Easy**, i due lanciatori ridondanti della prossima azione sono nascosti: resta il percorso **Continua progetto** già gestito da `kyv-easy-ux-v9.js`. In **Completa** rimangono tutti i pannelli. Non sono state aggiunte funzioni concorrenti di salvataggio, modifica, ricerca cloud o associazione audio.

**Verifica:** `tools/test-project-ux-v261.js` protegge la pagina safe, il motore di filtri, il grafico autonomo, le card mobile, i popup, le modalità Easy/Completa e la sintassi JS inline. Regole PWA/versione/manuale aggiornate; nessuna migrazione, modifica dei record, accesso Vercel o test live autenticato.

## v2.60 — Fondazione grafica e rimozione duplicazioni nel menu (4 novembre 2026)

L'app conserva il singolo sistema di stile `kyv-theme.css`, ora con token riutilizzabili e classi visive v2.60 abilitate esplicitamente su 13 schermate già compatibili: Home, Scrivania creativa, Audio Finder, Fatture, Launcher, Analyst, Intelligence, Ascolto, Agenda, Rendiconto, Ritorni, Liquidazioni e Scheda Progetto. **Progetti safe resta volutamente isolata**: non è stata caricata la navigazione o il CSS globale nel suo renderer protetto. Sistema comune per superfici, intestazioni, contrasto e gerarchia testi, bordi, spaziature, pulsanti, form, focus da tastiera, popup e mobile; nessun nuovo framework o observer.

**Menu:** in `menu.js` eliminato il duplicato «Fatture» dalla lista Ogni giorno (rimane in Amministrazione) e «Tutte le app» dal gruppo Strumenti (rimane tra le destinazioni principali). In `kyv-producer-mode.js` eliminata la seconda voce «Tutte le app» dagli Strumenti. La bottom bar mobile genera direttamente Ascolto al posto del vecchio collegamento Rubrica successivamente riscritto dal Producer Mode. Il modulo Producer Mode sincronizza lo stato accessibile `aria-current`, non sostituisce più link di destinazione.

**Pagine:** Scrivania creativa e Audio Finder hanno soltanto due collegamenti contestuali nelle testate, con le destinazioni condivise nel menu principale. In Audio Finder le opzioni di scansione combinata e OAuth Dropbox, che sono avanzate e indipendenti dalle altre funzioni, sono raccolte in elementi HTML `details` nativi. Rimangono invariati gli ID e gli handler dei pulsanti, la revisione esplicita `mio/reference/da_verificare`, l'autorizzazione OAuth manuale e la creazione esclusivamente volontaria dei progetti.

**Test:** nuova suite `tools/test-ui-foundation-v260.js` con verifiche su menu mobile, assenza di destinazioni duplicate, presenza dei componenti e integrità dei controlli creativi/audio; suite completa e cache PWA v2.60. Nessuna migrazione, modifica di dati, fatture o accesso a Vercel. La verifica tecnica in CI non sostituisce il collaudo visivo nell'app autenticata, che rimane da svolgere.

## v2.59 — Scrivania musicale unificata (4 novembre 2026)

Nella pagina **Scrivania creativa** compare come prima scheda **Scrivania musicale**, accanto alle precedenti **Sessioni** e **Piazzamenti**. Non è stato creato un secondo archivio: il motore `kyv-music-hub-v259.js` costruisce in sola lettura un riquadro per ciascun progetto già registrato, combinando dati RLS autenticati di `PROGETTI`, `KYV_SESSIONI`, `KYV_SESSIONI_PROGETTI`, `KYV_PIAZZAMENTI`, `KYV_AUDIO_ASSOCIAZIONI`, `KYV_AUDIO_INDICE` e `KYV_AUDIO_DECISIONI`. Sono conteggiate solo sessioni non archiviate e collegate, piazzamenti attivi e audio con decisione esplicita `mio` e relazione diretta al progetto confermata; una relazione di audio alla sola sessione non diventa automaticamente audio del progetto.

**Uso:** KPI globali, barre relative degli stati di piazzamento, ricerca nelle denominazioni di brani/artisti/sessioni/destinatari, filtri indipendenti per artista, stato del progetto e tipologia, navigazione progressiva (30 per volta). Il pulsante **Apri riepilogo** apre un popup in sola lettura con elenco delle sessioni, proposte, audio e riferimenti economici, collegando alle pagine originali per eventuali modifiche. La pagina Sessioni continua a registrare gli eventi creativi separatamente dai progetti; i progetti storici senza sessioni registrate non vengono dichiarati inattivi.

**Economia:** si leggono in modo separato `FATTURE`, `FATTURE_RIPARTIZIONI`, `FATTURE_INCASSI` e `FATTURE_INCASSI_STORNI`. Se anche una fonte è incompleta, la parte economica viene sospesa, senza presentare un 0 fuorviante e senza impedire l'utilizzo creativo. Importi fatturati attribuiti solo a ID progetto espliciti: `PrezzoUnitario` per fattura diretta o somma delle `prezzo_unitario` delle ripartizioni esplicite se presenti; mai `ImportoTotaleDocumento` al posto dell'importo gestionale. Nessuna attribuzione retroattiva o suggerita per somiglianza. Incassi indicati soltanto dai movimenti non stornati delle fatture a singolo progetto: non si ripartiscono automaticamente pagamenti di fatture multi-progetto e un `PAGATA` legacy senza movimento non è chiamato incasso documentato. La fee del progetto resta distinta da importi fatturati e ricevuti: fee zero non equivale a credito aperto. Per dati contabili definitivi usare **Fatture → Riconciliazione e incassi**.

**Regressioni:** `tools/test-music-hub-v259.js` e suite completa, manuale HTML e guida contestuale aggiornati, versione PWA ruotata. Nessuna migrazione, modifica ai dati storici o accesso a Vercel. Il collaudo della PWA autenticata rimane separato dalla CI.

## v2.58 — Ricerca cloud esplicita, Dropbox OAuth e OneDrive preparato (4 novembre 2026)

Aggiunto `kyv-cloud-browser-v258.js`, lettore di sola metadati cloud con OAuth Authorization Code + PKCE per Dropbox e Microsoft Graph. L'autorizzazione avviene solo dal pulsante; token di accesso mantenuti esclusivamente in memoria della pagina (nessun refresh token, cookie applicativo KYV o persistenza su database). Solo lo stato PKCE temporaneo (senza access token) viene conservato in `sessionStorage` fino al redirect, con verifica dello stato e limite di 10 minuti. Nessuna scansione automatica al ritorno dal provider.

**Dropbox online:** viene usata la app key pubblica esistente, ma l'integrazione richiede che l'app Dropbox consenta il redirect OAuth esatto e lo scope `files.metadata.read`. Lettura ricorsiva manuale della cartella indicata o della radice disponibile all'app con `/2/files/list_folder` e paginazione `/continue`; limite 10 pagine e 5.000 elementi, dichiarazione del risultato parziale. Si selezionano solo file audio per metadati, senza creare link pubblici. **ATTENZIONE:** il `content_hash` specifico di Dropbox usa un algoritmo a blocchi e NON è uno SHA-256 diretto del file; pertanto è sempre escluso dal campo KYV `content_hash` a meno di un hash raw verificato ottenuto per altra via.

**OneDrive:** adattatore Microsoft Graph per `GET /me/drive/root/search(q='...')` con autorizzazione delegata `Files.Read`, query manuale e pagine limitate (8 pagine/3.000 risultati). Sono indispensabili un'app SPA Microsoft Entra, un URI di redirect registrato e il `MICROSOFT_CLIENT_ID` nel file `config.js`; il valore è inizialmente vuoto e non viene inventato. Prima di consentire il salvataggio sono richieste l'esecuzione controllata di `docs/v258-onedrive-provider.sql` (i CHECK della colonna provider nelle tabelle `KYV_AUDIO_INDICE` e `KYV_AUDIO_DECISIONI` ammettono ora solo local/drive/dropbox) e l'impostazione di `ONEDRIVE_INDEX_ENABLED=true`. La migrazione NON è stata eseguita e il flag resta false: in questo stato OneDrive è solo predisposto, NON disponibile come connessione di produzione. I file OneDrive selezionati da una cartella locale sincronizzata restano utilizzabili senza Graph.

**Vincoli:** risultati -> anteprima e revisione personale -> solo con conferma e dopo migrazione/flag, possibile salvataggio metadati -> collegamento manuale a progetti esistenti. Nessuna classificazione automatica, scansione ricorrente, eliminazione o audio binario caricato; i dati storici, le policy RLS e i collegamenti sono invariati. La creazione diretta del progetto dal dettaglio OneDrive è bloccata in assenza di supporto verificato del flusso atomico. Test `tools/test-cloud-browser-v258.js` per PKCE, fake API, limitazioni e controllo sorgenti più suite completa. Guida HTML, contestuale, manuale, versione e cache PWA sincronizzati. CI non sostituisce il collaudo live dei permessi e dei redirect; nessun accesso Vercel.

## v2.57 — Controllo archivio audio in sola lettura (4 novembre 2026)

**Audio Finder → Controllo archivio audio** visualizza quattro verifiche, calcolate solo dai dati che l'utente autenticato ha già caricato: (1) file non classificati **nella scansione corrente**, (2) audio con decisione esplicita `mio` senza associazione **confermata** a un progetto, (3) gruppi di almeno due audio personali con hash SHA-256 di contenuto valido e identico, (4) progetti privi di un'associazione confermata a un audio personale **nell'indice KYV**. Le associazioni solo a sessioni, le proposte in attesa, le reference e i collegamenti annullati non vengono contati come associazioni progetto personali. Le decisioni salvate `da_verificare` senza metadata indicizzati sono conteggiate separatamente, non ricostruite per supposizione. I file ancora da classificare non entrano mai nell'esploratore degli audio approvati.

Un motore puro `kyv-audio-audit-v257.js` compone i dati recuperati da `KYV_AUDIO_INDICE`, `KYV_AUDIO_DECISIONI`, `KYV_AUDIO_ASSOCIAZIONI`, `PROGETTI` e dalla coda volatile `preview`: non avvia accessi ai connettori, non crea record e non carica file. Ricerca per testo su titolo, artista, nome file, account e cartella; filtri categoria e fonte, con il conteggio delle card **globale rispetto ai dati letti**. Il filtro fonte non attribuisce i progetti a sorgenti: per vedere i progetti senza audio nel catalogo selezionare `Tutte le sorgenti`. Per gli SHA identici l'elenco mantiene le fonti dei file per confronto, senza cancellazioni o fusioni. Navigazione 40 risultati per volta. Il click sul file apre il dettaglio personale già esistente; sui progetti apre la Scheda Progetto. Nessuna classificazione o collegamento viene eseguito dal pannello.

**Limiti:** l'assenza di audio nel catalogo non implica che il progetto non possieda file fuori KYV; l'assenza di risultati non certifica copertura completa dei cloud. Solo l'identità dei byte tramite hash valido permette l'etichetta «SHA-256 identico», non la paternità musicale. Nessuna migrazione Supabase, nessun accesso Vercel, nessun agente persistente. Test: `check:audio-audit-v257` più suite completa; versione, manuale, guida contestuale e cache PWA aggiornati. Collaudo nell'app autenticata separato dalla CI.

## v2.56 — Filtro fonte realmente applicato alle versioni selezionabili (3 novembre 2026)

La sezione **Audio Finder → Brani e versioni**, che include soltanto file approvati dall'utente come **Mio**, ora applica la sorgente selezionata **anche al dettaglio** del gruppo e al piano di collegamento. Il motore `G.scopedToProvider(group,source,links)` genera una vista delle sole versioni della fonte, con i relativi stati e conteggi senza modificare il gruppo originale. **Tutte le sorgenti** consente di lavorare ancora su file locale, Drive e Dropbox insieme. La ricerca e la scelta del progetto rimangono azioni manuali.

Il cambio del filtro sorgente azzera checkbox e progetto selezionato. `groupSelection` e `saveGroup` usano esclusivamente la stessa vista ridotta; il salvataggio riapplica il filtro dopo rilettura del database e rifiuta modifiche a gruppo/sorgente durante il controllo. Nel popup di conferma compaiono titolo/artista del progetto e nomi dei file selezionati (fino a 6 più conteggio degli altri). Sono vietati collegamenti a file nascosti dal filtro della fonte e resta la protezione contro duplicati, modifica concorrente e creazione automatica.

**Verifica:** `npm run check:audio-source-scope-v256` aggiunto a `npm run check`, regressioni v2.49-v2.55 aggiornate per la versione. Manuale `guida.html`, guida contestuale `kyv-help.js`, policy e PWA ruotati insieme. Nessuna nuova migrazione SQL, nessun accesso Vercel o integrazione OneDrive online; collaudo manuale autenticato distinto dai test CI.

## v2.55 — Raggruppamento sicuro degli audio personali (3 novembre 2026)

In **Audio Finder → Brani e versioni** il raggruppamento degli audio già classificati `mio` isola i file **senza artista dichiarato** anche quando nell'archivio esiste **un solo artista con lo stesso titolo**. Prima venivano separati soltanto se erano presenti due artisti dichiarati diversi, quindi una versione non attribuita poteva apparire sotto il nome del solo artista noto. Rimangono suggerimenti basati sui nomi; nessuna identità musicale viene dedotta dal titolo.

Cambiare i filtri di ricerca, sorgente o modalità e rendere non visibile il gruppo aperto azzera il dettaglio, i file spuntati e il progetto di destinazione. Il filtro sorgente seleziona i gruppi che **contengono** una fonte, non restringe i file al suo interno: verificare tutte le versioni prima di premere Collega. Il motore rifiuta inoltre selezioni contenenti due volte lo stesso ID file. Restano la verifica prima/dopo rilettura del database e la conferma manuale; nessun progetto viene creato o collegato per ricerca, nessuna migrazione SQL, nessun upload audio.

**Test e release:** `npm run check:audio-link-safety-v255` più suite preesistenti; versione `2.55`, cache PWA ruotata. Guide `guida.html`, `kyv-help.js` e manuale sincronizzate. Collaudo PWA autenticata e connettori cloud da verificare separatamente; Vercel non aperto.

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

## v2.49 — Gruppi di versioni audio (3 novembre 2026)

Audio Finder propone **Brani e versioni**, un riepilogo delle demo, mix, master, stems e strumentali presenti nell'indice dei soli audio confermati come **miei**. Raggruppa per nome di brano normalizzato, differenziando artisti diversi quando il nome del file ne contiene esplicitamente più di uno; non usa analisi automatica del contenuto o impronte audio. Se il nome/artista è ambiguo, lascia il gruppo da verificare. I due file con stesso hash SHA-256 verificato vengono segnalati come possibili copie identiche. Ricerca indipendente su tutte le sorgenti autorizzate già indicizzate, filtro per provider e gruppi multi-versione / da collegare.

Le righe del gruppo restano in sola lettura. L'utente sceglie esplicitamente fino a 25 versioni e il progetto esistente di destinazione; la schermata conferma la scelta, rilegge i dati e valida di nuovo prima di inserire collegamenti `KYV_AUDIO_ASSOCIAZIONI`. **Nessun progetto viene creato dal gruppo**. Per un nuovo progetto si apre dal dettaglio di un singolo file approvato il popup `KYV_AUDIO_PROJECT`; ora la destinazione è inizialmente vuota, e la creazione è una voce specifica, con conferma finale. I file locali sono gestiti come provider `local` attraverso il salvataggio atomico disponibile, senza falsi record Drive. Dopo una creazione confermata, viene registrata anche l'associazione Finder; se il secondo collegamento fallisce, viene segnalata la situazione da verificare senza cancellare dati.

Sono stati inoltre introdotti un indice in memoria delle classificazioni **mio** per velocizzare i filtri del catalogo e il controllo dei gruppi con sole versioni ancora da collegare. La v2.49 non introduce migrazioni di database, non esplora l'intero Dropbox o OneDrive, non effettua scansione in background e non unisce file/progetti senza autorizzazione.

## v2.48 — Audio personali, PC/Mac e smartphone (3 novembre 2026)

KYV Audio Finder non presume più che qualsiasi audio letto da una cartella autorizzata sia un tuo brano. Dopo aver scelto una cartella su PC/Mac o file da PC, Android o dall'app File su iPhone, compare la coda **Mio / Reference / Da verificare**. Ogni file è inizialmente da verificare; soltanto i file marcati **esplicitamente** "È un mio lavoro" vengono indicizzati e potranno essere collegati a progetti. Le reference vengono ricordate soltanto per identità sorgente (non sono archiviate le loro tracce audio, nomi, URL o percorsi), così la scansione successiva le riconosce come escluse. I file in attesa non entrano nel catalogo.

La classificazione può avvenire file per file o per i primi 100 file visibili, previa conferma. Premendo **Salva soltanto le scelte confermate** si registrano le decisioni e si indicizzano soltanto i file approvati, senza trasferire audio binari né creare progetti. Il comando **Apri proposta progetto / versione** compare soltanto dopo che un file personale è stato approvato e selezionato nel catalogo: apre un ulteriore popup per scegliere progetto esistente o crearne uno nuovo. Nessun progetto si crea dalla scansione, dal nome o automaticamente.

Le cartelle di smartphone non vengono scandite in background: iOS utilizza il file picker, Android supporta la scelta esplicita di file e in alcuni browser di cartelle; il browser non accede a cartelle non selezionate. La connessione OneDrive online, lo scanner persistente e un vero browser Dropbox/Drive cloud sono ancora **future fasi**, non sono dichiarati attivi.

In **Progetti**, la ricerca ora opera sull'intero archivio caricato anche con la scheda Recenti: il limite delle 40 righe si applica soltanto quando non si sta cercando.

Il database additivo `KYV_AUDIO_DECISIONI` conserva owner, provider, account_label, external_key e decisione, protetto da RLS. Non modifica le 175 schede, le fatture, i progetti storici o le cartelle dei dispositivi.

## KYVManagerPro v2.47 — Fatturazione multi-progetto (3/11/2026)

**Una fattura fiscale, più righe gestionali.** Nuova tabella owner-scoped `FATTURE_RIPARTIZIONI` e funzione transazionale `kyv_v247_save_invoice`, documentate in `docs/v247-fatture-ripartizioni.sql`. Non riscrive fatture/progetti/incassi storici. Ogni riga contiene `id_ft`, progetto, `prezzo_unitario` attribuito, descrizione e riferimento facoltativo alla fee. La stessa fattura può avere più righe e più progetti, e lo stesso progetto più fatture o fee. La funzione crea un documento e le sue righe nella stessa transazione oppure sostituisce atomicamente le sole righe di un documento esistente; rifiuta quote che superano il suo `PrezzoUnitario` e impedisce di creare una nuova fattura con lo stesso numero originale nello stesso anno.

**UI:** `fatture.html` → **Nuova multi-progetto** / su fattura esistente **Ripartisci / Duplica riga**; `kyv-invoice-split-v247.js`. Duplica riga copia soltanto la descrizione, non copia progetto o importo. **Riporta fee** propone `PROGETTI.FEE` ma l'importo rimane modificabile prima del salvataggio. Dalla Scheda Progetto: **Aggiungi quota a fattura esistente / Duplica riga**, con progetto preselezionato. Le righe di ripartizione prevalgono sul vecchio `ID_PROGETTO` senza modificare quel campo: niente doppia contabilizzazione del documento.

**Contabilità:** per il fatturato gestionale si usa sempre `PrezzoUnitario`, anche per XML. `ImportoTotaleDocumento` è solo il totale fiscale di controllo; i file XML multi-riga già importati richiedono una verifica dell'imponibile gestionale/unitario. Le quote fatturate per progetto non equivalgono a incassi attribuiti: i bonifici di fatture condivise restano **da ripartire**, non vengono suddivisi automaticamente. Le viste Economia, Intelligence, Analyst, Ritorno, Scheda e Progetti distinguono quote esplicite, dati storici e mancata attribuzione.

**Prima del rilascio:** applicare lo schema SQL in modo additivo su Supabase e verificare RLS; CI `npm run check` + `tools/test-invoice-split-v247.js`. Non eseguire nessuna duplicazione di righe in `FATTURE` per simulare più progetti.

## 2026-11-03 — Hotfix import XML Aruba (base v2.46)

**Diagnosi verificata sul database KYV:** 107 righe FATTURE, massimo `ID_FT=107`, ma la sequence identity `FATTURE_ID_FT_seq` era a 5. Gli inserimenti XML fallivano con conflitto sulla primary key `FATTURE1_pkey`, erroneamente etichettato «Duplicato XML». La sequenza è stata riallineata a 107 senza cancellare o modificare fatture; la fattura del caso non era stata importata e richiede un nuovo tentativo con il file XML originale.

**Correzione applicativa:** `kyv-aruba-import.js` distingue il conflitto `ID_FT` da `fatture_owner_xml_sha256_unique` (vero XML già importato), permessi/RLS e altri errori. Mantiene verifica preventiva di duplicati, conferma e import non pagato. Regole di recovery nel manuale HTML e nella guida contestuale; test di regressione `tools/test-aruba-import.js`.

**Manutenzione:** dopo eventuali restore con ID espliciti, controllare allineamento sequence/ultimo ID. Solo per amministratori, sotto lock e dopo verifica, usare `setval(pg_get_serial_sequence('public."FATTURE"','ID_FT'),greatest(max(ID_FT),last_value),true)` nella query SQL appropriata. Non riassegnare le chiavi storiche e non interpretare qualunque `23505` come fattura XML duplicata.

## KYVManagerPro v2.46 — Audio Finder: revisione degli abbinamenti (31/10/2026)

- Modulo `kyv-audio-review-v246.js`: classificazione spiegabile di corrispondenze per titolo/artista; titolo ambiguo = nessuna preselezione.
- La nuova **Coda proposte** permette di selezionare manualmente fino a 25 file, scegliere il progetto e confermare tutti i collegamenti in un unico `insert` su `KYV_AUDIO_ASSOCIAZIONI` con rilettura dei dati prima dell'invio. Non aggiorna direttamente PROGETTI o KYV_SESSIONI.
- Ricerca con parole multiple e filtro **Già collegati / Non collegati**. Restano le associazioni manuali, lo scollegamento reversibile e la scansione on-demand di Drive configurati, Dropbox già registrato e cartelle locali selezionate.
- **Limiti:** nessuna autorizzazione cloud OneDrive/Microsoft Graph, nessun crawler permanente e nessun audio binario su Supabase. Nessuna migrazione SQL: mantiene le policy RLS e gli indici v2.45.
- Guida contestuale, manuale HTML e test `check:audio-review-v246` aggiornati nello stesso rilascio; versione PWA sincronizzata.

## KYVManagerPro — Guida sincronizzata con gli upgrade (31/10/2026)

**Regola permanente:** ogni nuovo upgrade deve aggiornare **nella stessa PR** la guida contestuale delle pagine cambiate (`kyv-help.js`), il manuale completo (`guida.html`), i link diretti dalle pagine autonome, la documentazione tecnica e la suite di test. Checklist dettagliata in [docs/GUIDE_SYNC_POLICY.md](docs/GUIDE_SYNC_POLICY.md).

**Intervento su v2.45:** manuale prima fermo a v2.24, ora con intestazione dinamica collegata a `KYV_CONFIG.APP_VERSION`, nuovi capitoli su sessioni/piazzamenti v2.44, Audio Finder v2.45, KYV Analyst e fatture incassate. Allineate nove guide contestuali per Audio Finder, Scrivania creativa, Analyst, Fatture, Progetti, Scheda Progetto, Tutte le app, Drive e Dropbox. Le pagine standalone includono link diretti al capitolo. Il menu carica in modo differito `kyv-help.js` dove mancava, mantiene il contesto della pagina e ripresenta il contenuto specifico nel popup ?. I capitoli storici del manuale rimangono consultabili e sono esplicitamente indicati come storico.

**CI:** nuovo `tools/test-guide-coverage.js` lanciato da `npm run check:guide-coverage` e incluso nella suite completa. Verifica nove guide contestuali con istruzioni reali, capitoli, link da pagine, caricamento tramite menu e supporto PWA. Cache offline ruotata a `kyv-studio-v2-45-guide-sync-20261031`; `guida.html` e `kyv-help.js` aggiunti all'app shell. L'app resta alla release funzionale **2.45** (non si tratta di una nuova funzione del database). Nessun cambiamento al database, a progetti, fee, fatture o audio; nessun accesso a Vercel.

**Collaudo manuale:** aprire Scrivania creativa, Audio Finder, Fatture, Progetti e Scheda Progetto; premere il pulsante flottante ? in ciascuna; controllare che il titolo e il contenuto siano quelli della pagina. Aprire KYV Analyst e usare il link Guida ? nella navigazione. Verificare il manuale su iPhone dopo la cache aggiornata.

## KYV Audio Finder v2.45 — indice metadati audio su richiesta (31/10/2026)

### Funzioni implementate
- Nuova pagina `kyv_audio_finder.html`, disponibile da **menu principale** e **Tutte le app**, con motore `kyv-audio-finder-v245.js` e UI `kyv-audio-finder-ui-v245.js`.
- **Google Drive**: al clic su «Cerca audio su Drive», riusa il bridge attuale `kyv-drive-bridge.js` e i due account configurati. La chiamata legge al massimo 12 pagine per account e può non essere esaustiva su archivi enormi. Errori di un account bloccano il salvataggio dell'anteprima parziale. Non sono state modificate credenziali o proxy.
- **Dropbox**: al clic legge soltanto i file già registrati nella tabella esistente `DROPBOX_AUDIO_FILES`; non è ancora una scansione ricorsiva dell'intero account.
- **Mac/PC**: selezione esplicita di cartella (browser con supporto `webkitdirectory`) o file singoli. Il browser legge solo nome, dimensione, timestamp e sottocartelle relative autorizzate; calcola un hash dell'identità percorso relativo/dimensione/modifica, **non** l'hash del contenuto audio, e non trasmette percorsi assoluti. La scansione non prosegue a browser chiuso. La selezione è anche utilizzabile per cartelle OneDrive sincronizzate localmente, non è una connessione Microsoft Graph.
- I risultati restano in **anteprima** finché l'utente non sceglie «Salva metadati nell'indice». Upsert sull'identità stabile `owner_id + provider + account_label + external_key` e conservazione di eventuali hash verificati e URL originali già presenti. Nessun upload WAV/MP3/AIFF/FLAC, nessuna cancellazione o spostamento file.
- **Collegamenti espliciti** a `PROGETTI` o `KYV_SESSIONI`: suggerimenti da nome file **mai associati automaticamente**; conferma obbligatoria. Correzione tramite `annullata=true`, non con cancellazione. La scheda Progetto visualizza gli audio confermati; la Scrivania creativa mostra i file associati a ogni sessione e rimanda al Finder.
- **OneDrive online via OAuth/Microsoft Graph e scanner locale persistente**: non implementati in questa versione; richiedono ulteriori autorizzazioni o un helper installato localmente e non sono presentati come già attivi.
- SQL additivo `docs/v245-audio-finder.sql` applicato a Supabase: `KYV_AUDIO_INDICE` e `KYV_AUDIO_ASSOCIAZIONI`, RLS `owner_id=auth.uid()`, guardia FK verso progetti dello stesso utente e sessioni con proprietario corrispondente, nessuna migrazione ai progetti o agli archivi storici.
- Test automatici `npm run check:audio-finder-v245` inclusi in `npm run check`. Versioni `config.js=2.45`, `package.json=2.45.0`, `VERSION=2.45` e cache PWA `kyv-studio-v2-45-audio-finder-20261031`.

### Collaudo operativo necessario
Dal proprio account: scansione di una cartella locale contenente pochi WAV/MP3, anteprima, conferma salvataggio, ricerca, collegamento a un progetto e a una sessione e verifica dei nuovi pannelli nelle due schede. Provare quindi i due Drive configurati e l'archivio Dropbox; la presenza del pulsante non certifica che i rispettivi servizi rispondano correttamente. Su iPhone la selezione ricorsiva delle cartelle potrebbe non essere supportata; usare il Mac per le scansioni locali. Nessun accesso diretto a Vercel per verifica o pubblicazione.

## KYVManagerPro v2.44 — Scrivania creativa e piazzamenti (31/10/2026)

### Stato tecnico
- Database Supabase: migrazioni additive `docs/v244-creative-sessions-pitches.sql` e `docs/v244-session-audit.sql` applicate. Cinque tabelle nuove con RLS basata su `owner_id=auth.uid()`; nessuna ALTER/UPDATE ai 172 record storici PROGETTI. Trigger attivi verificano che ogni proposta o relazione sessione→progetto faccia riferimento a una scheda dello stesso proprietario, registrano modifiche dello stato delle proposte, dei follow-up e degli esiti delle sessioni.
- Dati iniziali delle nuove tabelle: **zero record**. Non ricostruire sessioni, ore o pitch dalle singole schede progetto; una sessione può includere più brani e un brano attraversare molte sessioni.
- Frontend: `kyv_scrivania_creativa.html` più `kyv-creative-desk-v244.js` e `kyv-creative-desk-ui-v244.js`. Inserimento/modifica/archiviazione reversibile di sessioni, collegamento manuale molti-a-molti a PROGETTI, piazzamenti a destinatari multipli, note di follow-up e storico eventi. Nessuna cancellazione. Tutte le letture di tabelle sono paginabili e richiedono un conteggio verificabile; in caso di dati incompleti non si visualizzano indicatori come se fossero completi.
- Navigazione: accesso da menu laterale e da `Tutte le app`; KYV Analyst carica separatamente gli indicatori basati sulle nuove sessioni e i nuovi piazzamenti. Le analisi economiche esistenti su fatture/incassi, royalties e fee restano intatte.
- Versioni: config `APP_VERSION=2.44`, package `2.44.0`, `VERSION=2.44` e PWA cache `kyv-studio-v2-44-creative-desk-20261031`.
- Test: `npm run check:creative-desk-v244` incorporato nella suite integrale `npm run check`. Non sono stati eseguiti inserimenti fittizi nel database reale.
- Regole operative: `FEE=0` è normale nelle sessioni esplorative e non comporta alcun credito. Il termine *pubblicazione dichiarata* non certifica un'uscita discografica; non elaborare tassi di conversione finché il campione di sessioni reali non è completo. Le scadenze dei pitch segnalano verifiche possibili, non mancati contatti accertati.
- Deployment: branch `feature/v244-creative-sessions-pitches`, un'unica PR/merge dopo CI verde, Vercel non viene interrogato direttamente come richiesto.

### Collaudo funzionale autenticato consigliato
Aprire Scrivania creativa nel proprio account; inserire una sessione reale, collegare un progetto storico e verificare che il collegamento porti alla scheda corretta. Registrare un pitch reale, cambiare stato, verificare il log automatico e ripristinare un elemento archiviato. Verificare infine KYV Analyst e la navigazione su iPhone. Questo collaudo manuale non è sostituibile dai soli test CI.

## KYVManagerPro v2.43 — accesso mobile e contabilità degli acconti (31/10/2026)

**Navigazione:** in `menu.js` il drawer mobile sincronizza `aria-expanded`, overlay e posizione della sidebar e può essere chiuso con Escape; si porta il focus sul primo link quando viene aperto. Le quattro pagine di analisi autonome (`kyv_intelligence.html`, `kyv_analyst.html`, `kyv_ritorni_progetti.html`, `kyv_liquidazioni.html`) mostrano link diretti a **Home** e **Tutte le app**: non obbligano più a tornare da una sequenza di pagine finanziarie. Nessuna nuova dipendenza JS o lettura dati.

**Distinzione tra incasso completo e acconto:** `fatture.html` mantiene le liste **FATTURE DA INCASSARE** (contiene anche i saldi parziali) e **FATTURE INCASSATE** (soltanto saldate). Il totale accanto alla seconda lista ora somma **solo fatture completamente incassate**; prima comprendeva anche gli acconti delle fatture ancora aperte. Due nuove schede mostrano **Incassato complessivo, inclusi acconti** e **Di cui acconti su fatture aperte**, preservando il saldo residuo da incassare. Le righe parziali riportano ricevuto e residuo; le fatture storiche `PAGATA=SI` senza movimenti evidenziano che la **data bancaria non è verificata**. Una lettura Supabase incompleta produce un errore visibile e azzera il riepilogo invece di lasciare dati parziali, senza modificarli.

`kyv-core.js` interpreta anche eventuali valori testuali storici `incassata/incassato`, pur preservando integralmente `FATTURE.PAGATA`, `SI/NO`, `FATTURE_INCASSI` e storni. Non vengono inseriti pagamenti, ricostruite date o modificate fatture. Nuovo test `npm run check:cash-navigation-v243` incluso nella CI: esegue in VM il vero codice dei totali su quattro fatture campione con saldo completo, pagamento parziale e nessun incasso. Testa inoltre apertura/chiusura del drawer mobile.

Versioni `config.js=2.43`, `package.json=2.43.0`, `VERSION=2.43`, cache offline `kyv-studio-v2-43-mobile-nav-cash-summary-20261031`. Il rilascio segue un'unica PR GitHub e un solo merge dopo CI verde: nessun accesso diretto a Vercel.

## Fix UX v2.42.2 — Amministrazione, Tutte le app e fatture incassate (30/10/2026)

La barra laterale di `kyv-producer-mode.js` mostrava la categoria `Controllo` anziché **Amministrazione**, mentre il menu `menu.js` aveva le fatture fuori dal gruppo e non esponeva direttamente KYV Analyst. Entrambe le navigazioni ora riportano il gruppo **Amministrazione**, con Fatture emesse, KYV Intelligence, KYV Analyst, Ritorno dei progetti e Liquidazioni SIAE/IMAIE; `Tutte le app` è visibile anche come voce diretta senza aprire altri gruppi.

La pagina `integrazioni.html` era priva del bootstrap Supabase (libreria client, `config.js`, `kyv-core.js`) prima di `kyv-auth.js`. Il controllo accessi poteva quindi considerare l'utente non autenticato e rimandarlo al login anziché aprire App Launcher. Ordine degli script corretto; presenti nuove schede Economia, Intelligence e Analyst; la pagina è inclusa anche nella cache PWA.

**Fatture:** nella UI `FATTURE PAGATE` diventa **FATTURE INCASSATE** (il cliente ha saldato e noi abbiamo ricevuto il corrispettivo); in Studio Editor ed editor di riga il campo viene etichettato **Incassata dal cliente**. La colonna Supabase **`FATTURE.PAGATA`**, i valori storici **SI/NO**, la logica incassi parziali/storni e tutti i movimenti sono preservati. `PAGATA=SI` da storico non attribuisce una data bancaria, che resta ignota finché non registrata. I contatori `kyv-economy-v6.js` usano lo stato del registro incassi quando disponibile.

Test `npm run check:navigation-invoices` incluso nella CI integrale. Cache PWA ruotata a `kyv-studio-v2-42-2-admin-launcher-incassate-20261030`. Nessuna migrazione dati né pubblicazione manuale intermedia. La verifica runtime dentro l'account su iPhone resta un collaudo utente separato.

## Correzione etichetta versione PWA (30/10/2026 · v2.42)

L'app pubblicata su Vercel era già alla v2.42, ma il numero **visibile sul telefono** era fermo a 2.32 perché `config.js` non aveva mai aggiornato `APP_VERSION` negli upgrade. Altre copie fisse erano `menu.js` (2.26), `progetti.html` (2.31), `package.json` (2.31.0) e `VERSION` (2.31). Questi numeri erano metadati UI, non prove di una vecchia build.

Corretto: `config.js` espone `APP_VERSION=2.42` come fonte unica **per tutte le etichette visibili**; `menu.js` la legge dinamicamente e la pagina Progetti (safe mode) sincronizza il proprio testo al `DOMContentLoaded` senza introdurre observer. `VERSION` e `package.json` sono aggiornati, con CI `npm run check:version-sync` che ne impedisce la divergenza prima di ogni merge. Rotazione cache PWA `kyv-studio-v2-42-1-version-sync-20261030` per aggiornare le installazioni; nessuna modifica a Supabase, archivi, fatture o progetti.

Su iPhone/iPad PWA: chiudi completamente l'app dalla schermata del multitasking, riaprila con rete attiva e naviga nella home per permettere l'attivazione del service worker. Se il testo resta vecchio, apri lo stesso URL in Safari e ricarica per confrontare la versione servita. Non disinstallare la PWA come primo tentativo, perché la rimozione può cancellare eventuali dati locali non sincronizzati.

## KYV Analyst v2.42 — FEE=0 e fisiologia delle sessioni musicali (30/10/2026)

Il campo `PROGETTI.FEE=0` identifica spesso sessioni di scrittura e progetti esplorativi senza un compenso a sessione, **non un insoluto**. Anche un brano non prodotto, non opzionato o non pubblicato è una componente normale della pipeline musicale; senza dati sul lavoro svolto e sull'esito confermato non va etichettato automaticamente come perdita economica. Questo upgrade non modifica i dati storici e non inventa ore o crediti.

`kyv-creative-funnel-v242.js` suddivide le schede con fee zero in categorie osservabili e disgiunte: pubblicazione **datata**, stato `USCITA` dichiarato **senza data**, proposta/provinata/inviata, sviluppo/bozza/demo, non classificato. `USCITA` non è una certificazione di rilascio. La conversione sessione→pubblicazione viene indicata **non calcolabile** con copertura insufficiente delle date. Domanda guidata nuova su sessioni con fee zero; indicatori contestuali nella pagina KYV Analyst, senza trasformare le 119 fee zero in debiti o follow-up di recupero compensi.

Dati verificati al 30/10/2026: 172 progetti, 119 FEE=0, 42 di questi con stato `USCITA` (senza inferire date), 2 date sessione complessive e 1 data pubblicazione complessiva. Nessuna statistica di conversione attendibile, nessuna stima di ore perse. Per la monetizzazione restano separati importo unitario per fattura, accrediti datati e diritti verificati.

Test: `npm run check:creative-funnel-v242` e suite completa; cache PWA `kyv-studio-v2-42-creative-funnel-20261030`. Solo lettura, zero nuove migrazioni, un solo merge e deployment.

## KYV Analyst v2.41 — assistente economico a regole (30/10/2026)

La pagina `kyv_analyst.html` espone sei domande guidate e una ricerca in linguaggio naturale limitata ad argomenti deterministici: fatturato per voce, concentrazione per artista, follow-up scaduti, royalties SIAE/IMAIE già attribuite, tempi al primo accredito verificabile e qualità dei dati. Il motore `kyv-analyst-engine-v241.js` lavora sui risultati `KYV_PROJECT_RETURNS_V240.analyze` e sulle schede progetti; `kyv-analyst-ui-v241.js` legge soltanto sette archivi Supabase con RLS tramite client autenticato e paginazione con conteggio verificato. **Non esiste integrazione con servizi AI esterni né API key**, non vengono generati suggerimenti automatici di accrediti e non viene eseguita alcuna scrittura in database.

Le proposte sono tracciabili: ogni priorità riporta il criterio che l'ha generata e, quando presente, il link alla scheda originale. La classifica per artista usa solo fatture collegate univocamente ai progetti, non è una classifica dei clienti; le voci non collegate sono esplicitamente escluse. Il numero `FEE=0,00` NON dimostra che un brano non possa generare diritti o compensi in futuro: l'analista distingue l'assenza di entrate documentate dalla mancanza di potenziale economico. Un follow-up con data trascorsa è una **verifica** e non prova che il contatto non sia stato eseguito. Nessuna data bancaria è inferita da `PAGATA=SI`.

Limiti: non un modello linguistico generativo; query sconosciute restituiscono suggerimenti supportati. Nessun ranking di utile netto/ROI senza costi e ore. Tutti i test in `npm run check:analyst-v241`, inclusi nella suite completa. Nuova PWA cache `kyv-studio-v2-41-analyst-rules-20261030`; un solo merge dopo CI green e deployment automatico su `main`.

## KYV Intelligence v2.40 — ritorni economici per progetto (30/10/2026)

La pagina `kyv_ritorni_progetti.html` collega progetti e compensi **per voce** tramite `FATTURE.ID_PROGETTO` o riferimento storico `PROGETTI.IDFT` solo se unico (nessun abbinamento per titolo o artista). Se una fattura ha più progetti possibili, non è duplicata: resta da riconciliare. Le somme di `PrezzoUnitario` e il valore aggregato XML Aruba (`PrezzoTotale`) rispettano la regola gestionale introdotta nella v2.38.1.

Le liquidazioni SIAE/NUOVO IMAIE devono prima essere registrate come **bonifici ricevuti** nel registro v2.39, quindi possono essere ripartite manualmente tra più brani. Le tabelle additive `KYV_ATTRIBUZIONI_DIRITTI` e `KYV_ATTRIBUZIONI_DIRITTI_STORNI` con RLS e trigger su liquidazione impediscono che la somma delle attribuzioni attive superi il netto ricevuto, anche con inserimenti simultanei da due browser. Le attribuzioni sono append-only; gli errori si correggono con storno motivato, preservando l'audit. Il bonifico originale rimane sempre invariato. SQL in `docs/v240-rights-project-allocations.sql`.

La dashboard separa compensi fatturati, incassi fatture con **data effettiva**, stato storico `PAGATA=SI` senza data bancaria e quote di liquidazioni SIAE/IMAIE attribuite. `ESTRATTO SIAE` non viene trasformato automaticamente in un accredito. Il tempo sessione→primo incasso viene calcolato solo con `Data_Sessione` e una data di accredito verificata; il numero di progetti nel campione è sempre visibile, e nessun valore mancante viene inventato. I report dei diritti non attribuiti sono separati dai ritorni per brano.

Questa fase non calcola utili, fiscalità, ROI percentuale o rendimento orario senza costi/ore reali. Test: `npm run check:project-returns-v240`, incluso nella suite `npm run check`. Una sola PR/merge dopo tutti i test; preview Vercel automatiche disattivate per ridurre le build.

## Correzione interfaccia Economia — 29/10/2026 (v2.39.1)

Nella schermata `fatture.html` (**Amministrazione → Economia**), la barra delle azioni è ora disposta sotto il titolo ed è responsive: ricerca che si adatta alla larghezza, pulsanti a capo su desktop/tablet stretti e griglia a due colonne su smartphone. Sono sempre disponibili collegamenti SIAE/IMAIE, KYV Intelligence, Correlazioni, Importa XML Aruba, Nuova, Ricarica e il pulsante dinamico **Riconciliazione e incassi**.

La correzione è localizzata con le classi `kyv-economy-*`, senza modificare la barra delle altre pagine. Sovrascrive solo per Economia il limite mobile generale di 104px che nascondeva comandi. Nessuna modifica ai dati o alle logiche economiche. Test `npm run check:economy-toolbar`; cache `kyv-studio-v2-39-1-economy-toolbar-20261029`.

## v2.39 — Registro liquidazioni SIAE/IMAIE (29 ottobre 2026)

Nuova pagina `kyv_liquidazioni.html`: registrazione **manuale**, con conferma esplicita, di bonifici SIAE o Nuovo IMAIE già ricevuti e **non fatturati**. Campi: ente, data accredito, importo netto, periodo di competenza facoltativo, riferimento bonifico/rendiconto, note. Tabella additiva `KYV_LIQUIDAZIONI_DIRITTI`, RLS proprietario, sola SELECT e INSERT per authenticated, senza update o delete da UI. Le liquidazioni sono **separate** dalle fatture, rappresentate nella dashboard KYV Intelligence in una serie autonoma per data di accredito, senza sommarle a fatturato o incassi fatturati. Le righe grezze `ESTRATTO SIAE` rimangono provvisorie, in sola lettura, senza conversione automatica a bonifici. Attenzione a non registrare importi già fatturati. Test `check:rights-liquidations`. Migrazione Supabase applicata il 29/10/2026.

## Correzione 29 ottobre 2026 — Fatturato per voce (v2.38.1)

**Base gestionale per progetto:** la tabella `FATTURE` contiene *voci*, non necessariamente una riga per fattura distinta. Le righe storiche possono ripetere lo stesso `ImportoTotaleDocumento` per progetti diversi. La somma dei totali-documento gonfiava i report.

Il modulo `kyv-invoice-line-amount.js` definisce un importo per riga:
- Storico e righe collegate ai progetti: **`PrezzoUnitario`**, senza fallback a `ImportoTotaleDocumento`.
- XML Aruba importati come **una riga aggregata** (individuabili da `XML_SHA256`): **`PrezzoTotale`**, che è già la somma delle `DettaglioLinee`; la sola `PrezzoUnitario` prenderebbe erroneamente la prima voce.
- Valori assenti o negativi: non inventare ricavi, evidenziarli per verifica.

La regola è applicata a **KYV Intelligence**, Economia, lista Fatture, riconciliazione/scadenze e riepiloghi nelle schede progetto. Il totale-documento rimane disponibile per verifiche fiscali e quadratura, non viene mai sommato per ogni riga. Le fatture e gli incassi storici nel database non sono stati modificati.

Verifica SQL storica prima della correzione: 107 righe, con somma `PrezzoUnitario` €178.982,74 contro €310.939,89 di somma ingenua `ImportoTotaleDocumento`. Per il 2025: €51.095,11 di voci contro €167.753,11 di totali ripetuti. Questi importi sono ricavi gestionali *da verificare*, non certificazione del fatturato fiscale o della data di incasso.

Regression test `npm run check:invoice-line-amounts`, cache PWA `kyv-studio-v2-38-1-line-items-20261029`. Le prossime fasi riguardano attribuzione delle liquidazioni SIAE/IMAIE e distinzione tra competenza ed effettivo accredito.

## v2.38 — KYV Intelligence: analisi temporale e provenienza degli incassi (29 ottobre 2026)

La pagina `kyv_intelligence.html` (link da **Fatture**) analizza mese per mese e su più anni l'emissione delle fatture, i movimenti di incasso con data esplicita non stornati e la qualità delle informazioni dei progetti. Il modulo `kyv-intelligence-engine-v238.js` effettua calcoli deterministici in sola lettura, senza creare movimenti o cambiare dati storici. Si può selezionare un anno oppure lo storico completo e passare da aggregazione mensile ad annuale.

**Provenienza dei dati:** `FATTURE.Data` è data di fattura, NON data di accredito bancario. Le fatture storiche `PAGATA=SI` senza movimenti non hanno una data di incasso verificabile e sono riportate soltanto in un indicatore separato. Solo `FATTURE_INCASSI.Data` per movimenti non stornati entra nella serie degli incassi datati. Il valore SIAE in `ESTRATTO SIAE` è mostrato come movimento grezzo e provvisorio; NON è contato negli incassi bancari e non è automaticamente identificato come liquidazione. Nuovo IMAIE richiede una fase successiva di rendicontazione e registrazione bonifico. Non si sommano importi SIAE già fatturati due volte.

I report di qualità indicano copertura delle date di sessione, pubblicazione e consegna e progetti non riconciliati. **Non viene calcolato un finto tempo medio di ritorno** senza date iniziali e incassi attribuiti. L'agente KYV Analyst e un registro liquidazioni SIAE/IMAIE sono previsti nelle fasi successive; non sono attivati in v2.38.

Test: `npm run check:intelligence-v238`; integrato in `npm run check`. PWA cache: `kyv-studio-v2-38-intelligence-20261029`.

# KyvManagerPro v2.26 — Centro operativo

## v2.37 — Storni e rettifiche incassi (29/10/2026)

Nella pagina Fatture → Riconciliazione e incassi è disponibile la sezione **Storico incassi e storni**. Un incasso già registrato può essere **stornato integralmente** con conferma esplicita e motivo obbligatorio (10–500 caratteri). Il movimento originale rimane visibile; lo storno viene salvato in `FATTURE_INCASSI_STORNI` con data e audit. L'indice UNIQUE su `ID_INCASSO` impedisce doppi storni. Le policies RLS autorizzano solo il proprietario dell'incasso e della fattura; non vengono concesse modifiche/cancellazioni delle righe storiche. SQL: `docs/v237-payment-reversals.sql`.

Saldi e dashboard escludono gli incassi stornati. Se tutti i movimenti sono stornati, l'importo incassato è zero anche in presenza di un vecchio indicatore `PAGATA=SI`; solo le fatture senza movimenti continuano a rispettare lo stato storico. Per correggere data o importo, stornare il movimento errato e registrare un nuovo incasso corretto. Nessuno storno automatico, nessuna cancellazione, nessuna modifica massiva dello storico.

## v2.36 — riconciliazione fatture, scadenze e incassi parziali (29/10/2026)

Nella pagina **Economia → Fatture** è disponibile **Riconciliazione e incassi** (modulo `kyv-invoice-reconciliation-v236.js`): elenco delle fatture senza `FATTURE.ID_PROGETTO`, evidenza dei riferimenti storici `PROGETTI.IDFT` da controllare manualmente, progetti in uscita/chiusi con fee ma senza fattura riconciliata (solo *da verificare*, non automaticamente fatturabili), e fatture con saldo aperto. Il collegamento è esplicito e seleziona un ID progetto; non presume la relazione dal solo numero fattura. Il pannello non modifica in massa alcun dato esistente.

**Schema Supabase:** campo data facoltativo `FATTURE.DataScadenzaPagamento`; nuova tabella append-only `FATTURE_INCASSI` (ID incasso, ID fattura, data, importo, note, proprietario, created_at), FK su fattura, importo positivo, RLS owner su SELECT/INSERT e filtro su proprietario della fattura. Nessun UPDATE/DELETE esposto al browser; le registrazioni sono definitive nella prima versione. Migrazione documentata in `docs/v236-invoice-collections.sql`.

**Regole del registro incassi:** i 107 record di fattura preesistenti sono conservati; se una fattura non ha movimenti, il valore `PAGATA` storico continua a determinare l’incassato. Se ha movimenti, l’incassato si calcola dalla somma dei movimenti registrati e il residuo dal totale della fattura meno i movimenti (con segnalazione di eventuale eccesso); i movimenti NON modificano retroattivamente `PAGATA`. Prima di inserire un incasso, la UI rilegge saldo e movimenti, richiede conferma e rifiuta importi maggiori del residuo. Non attribuisce mai una scadenza basandosi solo sulla data di emissione: il campo deve essere salvato esplicitamente.

**Interfacce preservate:** **Nuova** fattura, **Importa XML Aruba**, editor manuale e relazioni ID-based. I totali della schermata Fatture e di Economia utilizzano il registro incassi quando caricato, permettendo incassi parziali senza contare due volte il valore della fattura. Nessun aggiornamento automatico dello storico. Suite `npm run check:collections-v236`.

## Importazione fatture elettroniche Aruba XML (28/10/2026)

La pagina **Fatture → Importa XML Aruba** permette di selezionare fino a 50 file **FatturaPA XML** da Aruba (massimo 5 MB ciascuno), leggerli localmente nel browser, visualizzarne una anteprima e registrare soltanto le righe nuove selezionate dall'utente. Sono supportati i campi già presenti in FATTURE: tipo documento, numero numerico, data, cliente, codice fiscale/partita IVA destinatario, descrizione, importi, progressivo e codice destinatario. Le fatture importate partono con `PAGATA=NO`: la presenza dei dati di pagamento non è prova d'incasso. Il file XML originale e l'IBAN non vengono copiati su Supabase.

**Schema database:** aggiunti `FATTURE.Numero_Originale` (testo, es. `FPR 14/26`) e `FATTURE.XML_SHA256` (impronta SHA-256); creato indice unico parziale `fatture_owner_xml_sha256_unique` su `(owner_id, XML_SHA256)` per impedire importazioni ripetute dello stesso file per proprietario. Migrazione additiva, nessuna rielaborazione dello storico. SQL idempotente in `docs/aruba-xml-import-migration.sql`.

**Duplicati:** confronto dell'impronta XML, poi numero originale/anno/tipo documento/cliente/importo; per i record storici privi di numero originale si usa la combinazione numero numerico/anno/cliente/importo. Valori in conflitto o dubbi richiedono verifica manuale e non vengono importati; anche dati non leggibili o letture incomplete bloccano il salvataggio. L'importazione è esplicita e richiede conferma dell'emittente e conferma finale. Lo stesso numero in anni diversi è ammesso. Si può collegare **manualmente** ogni fattura a un progetto tramite `ID_PROGETTO`, oppure lasciarlo vuoto. Il pulsante **Nuova** e la modifica manuale delle fatture restano disponibili. Nessun nuovo `MutationObserver`, nessun invio automatico allo SdI.

## Completamento progetto e fatturazione guidata (28/10/2026)

Nella Scheda Progetto, quando `STATO` indica **Pubblicato, Chiuso, Completato o Finito** e le fatture collegate sono leggibili ma assenti, il riepilogo economico mostra **“Progetto completato · Fattura da emettere”** con l'azione **Crea fattura collegata**. Questa apre l'editor esistente di `FATTURE` precompilando e bloccando `ID_PROGETTO` sull'ID della scheda; l'utente verifica i dati e salva. Non emette fatture elettroniche né scrive nulla senza conferma. La segnalazione scompare quando una relazione ID valida esiste; errori di lettura non sono considerati assenza.

Resta disponibile **Collega fattura esistente (manuale)**: apre `fatture.html?collegaProgetto=<ID>`, che spiega come aprire il record FATTURE esistente o crearne uno con **Nuova**, scegliere manualmente `ID_PROGETTO` e salvare. Anche il pulsante tradizionale **Registra fattura** in Amministrazione rimane attivo e consente più fatture per progetto. Nessuna modifica allo schema o ai dati storici Supabase; nessun nuovo MutationObserver.

## Fix fatture/progetti — priorità delle relazioni ID (28/10/2026)

Le fatture vengono associate ai progetti esclusivamente per **FATTURE.ID_PROGETTO = PROGETTI.ID**, usando **PROGETTI.IDFT = FATTURE.ID_FT** soltanto in assenza di fatture dirette e senza appropriare fatture che hanno ID_PROGETTO di un altro progetto. **PROGETTI.FT / FATTURE.Numero** rimane un dato storico/di visualizzazione: non è una chiave di associazione. Il Centro Qualità Dati segnala le relazioni basate solo su FT e i conflitti tra identificativi, senza correggerli automaticamente. Test anti-regressione per scheda, elenco, riepilogo, Economia e Qualità Dati. Nessuna migrazione, scrittura o modifica ai dati Supabase.

## v2.26 — Follow-up nella Panoramica

La Panoramica include ora i follow-up dei progetti nella coda delle attività: il filtro dedicato mostra scadenza, priorità, ultimo sollecito, esito di ascolto e note, ordinati per urgenza. Ogni riga apre direttamente la Scheda Progetto e il radar operativo riassume quanti follow-up sono presenti e quanti richiedono attenzione immediata.

Tutte le pagine usano il client condiviso `KYV.createSupabaseClient()` e la sola configurazione `KYV_CONFIG`; sono stati rimossi gli URL e le chiavi legacy rimasti nel codice. La release non modifica lo schema Supabase e mantiene la sessione autenticata necessaria alla RLS esistente.

## v2.24 — Un’unica prossima azione per ogni brano

Percorso Brano verifica ora tutte le fonti necessarie prima di calcolare priorità e mancanze. Se progetti, audio, invii, documenti o fatture non sono leggibili, l’Assistente sospende i suggerimenti e mostra un errore esplicito: un problema di connessione o permessi non viene più interpretato come “nessun dato”. La tabella `Spese Extra`, che veniva letta senza essere usata, è stata rimossa dal caricamento del modulo.

Ogni progetto mostra fase, percentuale di completamento, barra di avanzamento e una sola azione principale: **Fai ora**. Il comando apre la Scheda Progetto già posizionata nella sezione corretta — sintesi, produzione, documenti, diritti, amministrazione o checklist — senza costringere a cercare il campo. La scheda conserva anche la sezione scelta nell’indirizzo e include le versioni presenti in `AUDIO_VERSIONI`.

La v2.24 non richiede una nuova migrazione: usa `AUDIO_VERSIONI` quando la migrazione 2.23 è disponibile e resta in modalità compatibilità quando la tabella non è ancora installata. La v2.22 relativa ad autenticazione e isolamento dei dati resta deliberatamente sospesa. Il riepilogo tecnico e le prove sono in `PROVA_GRAFICA_V2_24.md`.

## v2.23 — Versioni audio unificate e salvataggi affidabili

La versione 2.23 introduce `AUDIO_VERSIONI`, un archivio unico per le versioni Google Drive e Dropbox, mantenendo lo specchio nelle tabelle precedenti per non interrompere le altre pagine. La chiave tecnica `DEDUPE_KEY` e i relativi indici impediscono di registrare due volte la stessa revisione.

La funzione Supabase `kyv_salva_audio_v23` salva il nuovo progetto e la prima versione audio nella stessa transazione: o riescono entrambi, oppure non viene scritto nulla. L'Archivio Musicale non interpreta più un errore di lettura come archivio vuoto; se i dati di confronto non sono affidabili, ricerca e inserimento vengono bloccati con un messaggio esplicito.

Prima di usare la creazione progetto da file, eseguire nel SQL Editor di Supabase `SUPABASE_MIGRATION_V2_23_AUDIO_VERSIONI.sql`. La migrazione recupera i record Drive/Dropbox esistenti senza cancellarli. Se la migrazione non è ancora installata, la pagina mostra la modalità compatibilità e consente soltanto le operazioni legacy che non potrebbero lasciare un nuovo progetto senza versione.

La v2.22 relativa ad autenticazione e isolamento dei dati resta deliberatamente sospesa. Le policy indicate come compatibilità v2.23 mantengono temporaneamente il modello di accesso dell'app corrente e dovranno essere sostituite quando verrà ripreso quel lavoro. Il riepilogo tecnico e le prove sono in `PROVA_GRAFICA_V2_23.md`.

## v2.21 — Ricerca Drive e Dropbox con controllo duplicati

La nuova pagina Archivio Musicale avvia ricerche su richiesta, riunisce file Google Drive e file scelti da Dropbox e li confronta con PROGETTI, DROPBOX_AUDIO_FILES e gli audio Drive già registrati. Ogni risultato viene classificato come già inserito, nuova versione, da verificare o nuovo brano. La selezione multipla consente di collegare soltanto i file desiderati; le corrispondenze per titolo restano suggerimenti da confermare. Nessuna nuova tabella o migrazione Supabase. Il riepilogo è in `PROVA_GRAFICA_V2_21.md`.

## v2.20 — Dal file audio al progetto completo

Percorso Brano è ora un modulo principale: consente di iniziare da contatto/brief, Google Drive o Dropbox e rende visibili le sette fasi fino a fattura e incasso. I file audio possono essere collegati a un progetto esistente oppure creare un nuovo progetto; tipo, versione, origine e link vengono archiviati senza trasformare il file nella cartella generale del progetto e senza inventare la data sessione. La Scheda Progetto riunisce le versioni Drive e Dropbox. Nessuna nuova tabella e nessuna migrazione Supabase richiesta. Il riepilogo è in `PROVA_GRAFICA_V2_20.md`.

## v2.19 — Correzione filtri e ordinamento Studio Editor

Studio Editor usa ora un solo sistema di ordinamento e un solo filtro, eliminando il conflitto con gli strumenti automatici delle tabelle. Le modifiche effettuate direttamente nelle celle aggiornano subito anche la copia locale, quindi ricerca e ordinamento non ripristinano più valori precedenti. È stato aggiunto un riepilogo delle righe visualizzate, del filtro e dell’ordinamento attivi, oltre a un comando per cancellare rapidamente la ricerca. Nessuna modifica allo schema Supabase. Il riepilogo completo è in `PROVA_GRAFICA_V2_19.md`.

## v2.18 — Centro attività nella Panoramica

La Panoramica riunisce in una sola coda filtrabile le attività provenienti da Sessioni, Fatture, Documenti e Protezione. Le righe sono ordinate per urgenza e aprono direttamente il modulo corretto. Il precedente riquadro generico “Da completare” è stato eliminato; i quattro segnali operativi sono ora cliccabili. I collegamenti dalla Panoramica possono anche impostare automaticamente il filtro Master o Uscite in Sessioni. Nessuna modifica allo schema Supabase. Il riepilogo completo è in `PROVA_GRAFICA_V2_18.md`.

## v2.17 — Documenti e Protezione operativi

Documenti distingue ora chiaramente i progetti con dati mancanti, da verificare e completati; i filtri sono stati semplificati e le schede sono utilizzabili anche da tastiera. Protezione Brano usa gli stessi tre stati per ogni controllo e permette di correggere direttamente il progetto cliccando la sua intestazione. Dopo il salvataggio il Radar ricalcola score e checklist. Le guide contestuali descrivono il nuovo flusso. Nessuna modifica allo schema Supabase. Il riepilogo completo è in `PROVA_GRAFICA_V2_17.md`.

## v2.16 — Rubrica e Sessioni più dirette

Nella Rubrica l’intera scheda del contatto apre la modifica, mentre email e telefono continuano ad avviare le rispettive azioni. Il comando grafico di modifica duplicato è stato eliminato. In Sessioni Studio le schede sono utilizzabili anche da tastiera, il pulsante ridondante “Apri progetto” è stato rimosso ed è ora possibile creare un progetto direttamente dalla pagina. Le guide contestuali di entrambe le pagine descrivono i nuovi flussi. Nessuna modifica allo schema Supabase. Il riepilogo completo è in `PROVA_GRAFICA_V2_16.md`.

## v2.15 — Editor fatture e guida contestuale globale

Le righe di Fatture e Correlazione Fatture aprono un editor condiviso che permette di aggiungere o correggere i campi e collegare la fattura a un progetto. È disponibile anche il comando Nuova fattura. Un pulsante “?” flottante apre la guida specifica della pagina in tutto il gestionale, compresi Manuale, Diagnostica, Calendario e Login. Nessuna modifica allo schema Supabase. Il riepilogo completo è in `PROVA_GRAFICA_V2_15.md`.

## v2.14 — Progetti e scheda progetto semplificati

La pagina Progetti ora privilegia i lavori in corso, mostra sei blocchi informativi al posto di dieci colonne e offre accesso diretto alla scheda completa. La Scheda Progetto raggruppa produzione e amministrazione, riduce le azioni sempre visibili e mette in evidenza il prossimo controllo da completare. Nessuna modifica ai dati o alle tabelle Supabase. Il riepilogo completo è in `PROVA_GRAFICA_V2_14.md`.

## v2.13 — Prova interfaccia moderna

Nuovo sistema visivo condiviso, home più essenziale e navigazione ridotta alle aree di uso quotidiano. Le funzioni amministrative e tecniche restano disponibili in gruppi richiudibili. Nessuna modifica ai dati o alle tabelle Supabase. Il riepilogo completo è in `PROVA_GRAFICA_V2_13.md`.

KyvManagerPro è un gestionale/assistente personale per KYV / Vincenzo Centrella, pensato per seguire il percorso completo di un brano: contatto, sessione, demo, master, invio, follow-up, contratti, quote, SIAE, IMAIE, fatture, incassi, spese e archivio documentale.

## Novità v2.9.7

Questa versione amplia in modo significativo la documentazione:

- `guida.html` diventa manuale super esteso consultabile dall’app;
- `MANUALE_OPERATIVO.md` spiega passaggi da fare e passaggi che si potrebbero fare;
- ogni pagina è documentata con funzione, utilità, sezioni interne, bottoni, dati coinvolti e obiettivo;
- la matrice bottoni spiega cosa fanno i pulsanti principali;
- la guida rafforza il concetto di “viaggio del brano”.

## Percorso operativo

1. Contatto / opportunità.
2. Brief e preparazione sessione.
3. Sessione in studio.
4. Demo / pezzo grezzo.
5. Lavorazione e revisioni.
6. Master / pre-release.
7. Contrattazione fee, royalty e quote.
8. SIAE / IMAIE / protezioni.
9. Fattura / incasso / spese.
10. Archivio e memoria storica.

## Pagine chiave

- `assistente.html` — cosa fare oggi, progetti fermi, follow-up.
- `scheda_progetto.html` — fascicolo completo del singolo brano.
- `sessioni.html` — sessioni e follow-up creativi.
- `kyv_dropbox.html` — archivio audio Dropbox, hash, invii e conferme.
- `ascolto.html` — stazione di ascolto MP3 interna per demo, master, Drive, Dropbox e file locali.
- `documenti.html` — contratti, Drive, spese, schede dati SIAE/IMAIE/fatture.
- `protezione.html` — radar SIAE/IMAIE/contratti/master/fatture.
- `guida.html` — manuale completo.

## Nota dati

Dropbox contiene i file audio; Supabase contiene link, hash, stati, invii, documenti e fatture; Drive contiene contratti, screenshot e prove documentali.


## v2.9.5 — Guida contestuale ampliata

La versione v2.9.5 amplia il popup **Manuale & Guida** dentro `menu.js`. Ogni pagina ora ha una spiegazione operativa più estesa: funzione, quando usarla, passaggi, bottoni, dati coinvolti e obiettivo. La PWA viene spiegata una sola volta, per lasciare più spazio al metodo di lavoro reale.


## Novità v2.9.7 — Stazione Ascolto MP3

Questa versione aggiunge `ascolto.html`, una stazione di ascolto interna accessibile da App Launcher e dal menu laterale.

La pagina permette di:

- ascoltare file audio registrati in `DROPBOX_AUDIO_FILES`;
- recuperare anche vecchie consegne da `CONSEGNE_MASTER`;
- pescare file direttamente da Dropbox tramite Chooser anche se non sono ancora registrati in Supabase;
- ascoltare subito i file Dropbox diretti e salvarli dopo nell’Archivio Audio;
- cercare MP3 da Google Drive usando lo stesso Apps Script del modulo Drive;
- caricare file audio locali temporanei dal computer o dallo smartphone;
- filtrare per progetto, artista, titolo e tipo file;
- usare player interno con Play, Prev, Next e Shuffle;
- copiare link, playlist e feedback di ascolto;
- registrare note di ascolto in `DOCUMENTI_PROGETTO` quando il file è collegato a un progetto;
- collegare opzionalmente un file Dropbox diretto a un progetto prima o dopo l’ascolto.

Non richiede nuova SQL: usa le tabelle già presenti.

## v2.9.8 — Riordino UX e sidebar semplificata

Questa versione non elimina pagine e non modifica le tabelle Supabase: riordina la navigazione per rendere l'app più comprensibile nello scenario reale di uno studio di produzione musicale.

### Sezioni principali in sidebar

La barra laterale ora mostra solo le porte di ingresso principali:

- Panoramica
- Progetti & Uscite
- Rubriche
- Fatture
- Spese Extra
- Studio Editor
- Piano Fiscale
- Quote per Opera
- Rendiconto SIAE
- App Launcher
- Stazione Ascolto
- Import / Export
- Manuale

### Dove sono le altre funzioni

Le altre funzioni non sono state rimosse. Sono state spostate logicamente in App Launcher, Panoramica o nelle schede operative:

- Assistente Produzione, Sessioni Studio, Scheda Progetto e Protezione Brano: accessibili da Panoramica e App Launcher.
- Audio Dropbox, Google Drive e Google Calendar: accessibili da App Launcher.
- Documenti & Schede dati: accessibili da App Launcher e dalla pagina Spese Extra/Documenti.
- Dettaglio Autori, Correlazione e Report/PDF: accessibili da App Launcher come strumenti avanzati.

### Perché

Il gestionale deve seguire il lavoro di KYV: contatti, sessioni, demo, ascolti, file, contratti, SIAE/IMAIE, fatture, spese e rendiconti. Una sidebar troppo lunga rendeva il flusso meno leggibile. Ora il menu principale è più pulito, mentre l'App Launcher diventa il punto dove trovare tutti gli strumenti specialistici senza perdere dati o funzionalità.


## v2.9.9 — Studio Editor compatto + Backup/Ripristino locale DB

Questa versione migliora due punti operativi:

### Studio Editor
- Tabelle più compatte di default.
- Colonne con larghezza intelligente per ID, date, importi, titoli, artisti, link e note.
- Celle lunghe tagliate con ellissi per evitare tabelle ingestibili.
- Cella espandibile quando viene selezionata o modificata.
- Nuovo bottone **Compatta/Larga** per alternare vista compatta e vista ampia.

### Import / Export
- Nuovo box **Backup & Ripristino locale database**.
- Bottone **Backup DB su PC**: esporta un file JSON locale con tutte le tabelle leggibili da Supabase.
- Bottone **Scegli backup da PC**: carica un backup JSON precedente.
- Anteprima tabelle del backup con conteggio righe.
- Ripristino non distruttivo: non cancella il database esistente.
- Opzioni **Salta duplicati** e **Mantieni ID originali**.

Il backup serve soprattutto prima di import massivi, modifiche nello Studio Editor o migrazioni Supabase.


## v2.10.4 — Ripristino stabile da v2.9.9

Questa versione ripristina la base stabile della v2.9.9 dopo i test fiscali avanzati.

- `fisco.html` torna al Piano Fiscale semplice precedente alle modifiche CU/CUD/Unico/dichiarazioni fiscali.
- `menu.js` e la sidebar tornano alla navigazione funzionante della v2.9.9.
- Restano presenti le funzioni già stabili della v2.9.9: Studio Editor compatto, Backup/Ripristino locale database, Stazione Ascolto, App Launcher riordinato, Spese Extra e Import/Export.
- Non sono richieste nuove SQL.
- I dati Supabase non vengono toccati né cancellati.

## v2.10.5

Piano Fiscale aggiornato in modo semplice: ai ricavi da fatture viene applicato il coefficiente ATECO 67%; i diritti d'autore/correlati inseriti manualmente vengono tassati al 60%; il reddito risultante alimenta imposta sostitutiva e INPS. L'aliquota INPS è modificabile, con default 17,9% e scelta rapida 26%.

SQL consigliata: `SUPABASE_MIGRATION_V2_10_5_FISCO_DIRITTI.sql`.

## v2.10.6 - Prova veste grafica

Questa versione introduce una prova grafica reversibile: la sidebar e le parti laterali restano nere, mentre l'area centrale usa un grigio topo scuro più chiaro, con pannelli e righe tabellari alternate in tonalità diverse di grigio. La modifica è quasi interamente concentrata in `kyv-theme.css`, quindi può essere rimossa facilmente per tornare allo stile precedente.

Non sono state modificate tabelle Supabase o logiche di salvataggio.


## v2.10.7 - Radio Drive + Dropbox

Aggiunta nella Stazione Ascolto MP3 una modalità **Radio** che unisce in una playlist i brani audio presenti nell'Archivio Audio Dropbox/Supabase e quelli trovati su Google Drive tramite Apps Script. Dalla stessa schermata è possibile aggiungere file non ancora registrati usando Dropbox diretto. Sono stati aggiunti comandi Play/Pausa, avanti, indietro, casuale e ripetizione playlist/brano/off. Nessuna nuova tabella Supabase richiesta.


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

## v2.11.1 - Drive multi-account e suggerimenti campi

Questa versione corregge l'architettura del collegamento Google Drive. In `config.js` è presente il blocco `GOOGLE_DRIVE_ACCOUNTS` con due Drive previsti: `info@kyvprod.net` e `prodkyv@gmail.com`.

Il modulo `kyv_drive.html` ora permette di scegliere un Drive singolo o tutti i Drive configurati. La Stazione Ascolto usa lo stesso sistema per caricare la radio MP3 da Drive.

Per leggere davvero due Drive Google separati servono due URL Apps Script, uno autorizzato/deployato da ciascun account, oppure cartelle condivise con l'account dello script esistente. Il file `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` serve come base per creare il secondo deployment.

È stato aggiunto anche `kyv-field-memory.js`: alcuni campi di inserimento mostrano suggerimenti ricavati dai valori già presenti nelle colonne Supabase, così si evita di riscrivere sempre gli stessi nomi, categorie, tipi file, canali e destinatari.


### v2.11.1 - Drive prodkyv@gmail.com configurato
È stato inserito nel file `config.js` l'URL Apps Script per `prodkyv@gmail.com`, così la pagina Google Drive e la Radio/Stazione Ascolto possono interrogare entrambi i Drive configurati.

### v2.11.2 - Google Drive: correzione Failed to fetch
Se la pagina Google Drive o la Radio mostrano `Failed to fetch`, la causa più probabile è il deployment Apps Script non accessibile pubblicamente, oppure il blocco CORS del browser. La v2.11.2 aggiunge fallback JSONP e messaggi diagnostici. Per la massima compatibilità, aggiornare gli Apps Script Drive copiando il file `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` v2.11.2 e ripubblicando la Web App come `Execute as: Me` e `Who has access: Anyone`.


## v2.11.3 - Fix definitivo blocco Drive / CORS / Service Worker

- Corretto `sw.js`: ora il service worker non intercetta più richieste esterne verso Google Apps Script, Drive, Dropbox o Supabase. Questo elimina l'errore `Uncaught (in promise) TypeError: Failed to fetch at sw.js`.
- Aggiornato `kyv-drive-bridge.js`: per `script.google.com` usa JSONP come metodo primario, evitando chiamate `fetch` bloccate da CORS.
- Aggiornato `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` alla v2.11.3 con supporto JSONP e fallback DriveApp se il servizio avanzato Drive API non è abilitato.
- In `config.js`, il Drive `info@kyvprod.net` è stato lasciato da riconfigurare perché l'URL precedente restituisce HTTP 404. Il Drive `prodkyv@gmail.com` resta configurato con l'URL fornito dall'utente.
- Nessuna modifica a Supabase, tabelle o dati.

### v2.11.4

Versione di correzione UI: risolve il problema dei menu progetto non popolati nella Stazione Ascolto, rende più sicuro il componente dei select ricercabili, aggiunge favicon locale, riduce i warning Supabase da client multipli e abilita suggerimenti nei campi ricorrenti dello Studio Editor.


## Aggiornamento v2.11.5 - Correzioni Drive/Dropbox/Auth

- Reinserito e confermato l’URL Apps Script per `prodkyv@gmail.com`.
- Rimossi i `defer` dal caricamento Supabase nelle pagine principali, così `kyv-auth.js` non parte prima della libreria.
- `kyv-auth.js` ora ritenta dopo il caricamento pagina e non stampa più errori quando Supabase non è ancora pronto.
- Corretto Dropbox Chooser: i filtri usano il tipo supportato `audio` invece dell’elenco di estensioni non accettato dal nuovo Chooser.
- Aggiornato service worker a `kyv-studio-v2-11-5-drive-dropbox-auth`.
- Filtrato il warning Tailwind CDN non bloccante dalla console, senza cambiare la grafica.

## v2.11.6 - Google Drive tramite proxy Vercel

La lettura di Google Drive ora usa prima un proxy serverless interno a Vercel: `api/drive-proxy.js`. Questo evita i blocchi CORS e i problemi di JSONP del browser con Google Apps Script. Il modulo `kyv-drive-bridge.js` prova il proxy, poi usa JSONP come fallback. In `kyv_drive.html` è stato aggiunto il pulsante **Diagnosi collegamento** per testare il ping del Drive selezionato.

`prodkyv@gmail.com` resta configurato in `config.js` con l'URL Apps Script fornito. Il Drive `info@kyvprod.net` resta da riconfigurare perché il vecchio URL storico restituiva 404.

Nessuna modifica a Supabase e nessuna nuova SQL.


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

### v2.11.8 - Link cliccabili e tabelle compatte

La versione 2.11.8 aggiunge due moduli globali: `kyv-link-viewer.js` e `kyv-table-tools.js`.

- I campi che contengono URL o colonne con nome LINK/URL/Drive/Dropbox/Documento/File vengono trasformati in pulsanti cliccabili.
- PDF, Excel, documenti e immagini vengono aperti in un popup interno con pulsanti Copia link e Apri esterno.
- I link audio vengono aperti nella Stazione Ascolto tramite `ascolto.html?audio=...`.
- Tutte le tabelle sono rese più compatte: le celle partono con larghezza massima circa 4 cm, con ellissi e tooltip.
- Le colonne possono essere allargate manualmente trascinando la maniglia sul bordo destro dell’intestazione.
- Doppio click su una cella per espanderla e leggere il contenuto completo.

Non sono richieste migrazioni SQL.


### v2.11.9 - Nuovo progetto rapido dai box audio

La versione 2.11.9 aggiunge la funzione “Nuovo progetto” nei box audio di Stazione Ascolto MP3, Google Drive e Archivio Audio & Invii Dropbox.

Quando il nome/titolo del brano non risulta presente in nessun campo dei record PROGETTI già caricati, compare il comando per creare una nuova scheda progetto direttamente dal file audio. Il sistema propone titolo, artista quando deducibile, link e note automatiche; dopo il salvataggio aggiorna l’elenco progetti.

Per i file non audio resta disponibile il comando “Copia link”, così il link può essere inserito manualmente dove serve.

Nessuna nuova SQL e nessuna modifica strutturale a Supabase.


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

### v2.11.14 - Sicurezza dati e ripristino protetto

Questa versione introduce `kyv-data-guard.js`, un modulo comune per proteggere le operazioni critiche sui dati. La creazione di nuovi progetti da file audio usa ora un inserimento protetto solo INSERT e blocca l'operazione se il database restituisce una chiave primaria già presente.

In `Import/Export` il ripristino locale è stato rinforzato: prima di ripristinare è possibile premere `Verifica`, il sistema crea un backup di sicurezza delle tabelle selezionate prima di inserire dati e salta sempre le collisioni di chiave primaria. Al termine viene scaricato un report JSON del ripristino.

---

## v2.12.0 — Consolidamento struttura e Diagnostica Sistema

Versione di stabilizzazione senza migrazione Next.js e senza nuove SQL.

### Novità principali
- Nuova pagina `diagnostica.html` raggiungibile dal menu laterale e da App Launcher.
- Nuovo modulo `kyv-system-diagnostics.js` per controllare:
  - Supabase e tabella `PROGETTI`;
  - Google Drive multi-account;
  - proxy Vercel `/api/drive-proxy`;
  - Service Worker e cache attiva;
  - moduli comuni caricati;
  - log Drive e Data Guard salvati in `localStorage`.
- `kyv-table-tools.js` consolidato: tabelle compatte, link cliccabili, colonne ridimensionabili, doppio click per espansione, ordinamento su intestazioni e ricerca locale nelle tabelle lunghe.
- `kyv-helpers.js` esteso con funzioni comuni per valuta, date, badge, copia testo e download testo/JSON.
- Menu aggiornato a `Manager Pro 2.12.0` con voce `Diagnostica`.
- Cache Service Worker aggiornata a `kyv-studio-v2-12-0-structure-diagnostics`.

### Nota operativa
La pagina Diagnostica non modifica dati Supabase. Serve per capire rapidamente se il problema è Drive, proxy, cache, Supabase o caricamento script.
