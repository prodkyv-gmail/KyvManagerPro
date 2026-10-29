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
