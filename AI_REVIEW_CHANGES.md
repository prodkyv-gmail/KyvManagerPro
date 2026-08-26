

## v2.9.7 — Stazione Ascolto MP3

- Aggiunta nuova pagina `ascolto.html`.
- Aggiunta card “Stazione Ascolto MP3” in `integrazioni.html` / App Launcher.
- Aggiunta voce “Stazione Ascolto” in `menu.js`.
- Aggiunto accesso rapido dalla dashboard principale.
- Il player legge audio da `DROPBOX_AUDIO_FILES` e vecchie consegne da `CONSEGNE_MASTER`.
- Aggiunta modalità Drive usando `GOOGLE_SCRIPT_URL?action=getDriveFiles`.
- Aggiunta modalità Locale per ascolto temporaneo da dispositivo.
- Aggiunti player, playlist, filtri, shuffle, copia lista, copia feedback, copia link e apertura scheda progetto.
- Aggiunta registrazione note di ascolto in `DOCUMENTI_PROGETTO`.
- Aggiornato `kyv-help.js` con guida contestuale della nuova pagina.
- Aggiornato Service Worker a cache version `kyv-studio-v2-9-6`.
- Nessuna nuova SQL richiesta.

# AI Review Changes — v2.9.5

## v2.9.5 — Follow-up operativo e architettura modulare

- Separato il contenuto lungo del popup Manuale & Guida da `menu.js` in nuovo file `kyv-help.js`.
- Ridotto `menu.js` a navigazione, sidebar, bottom nav, popup base, installazione app e logout button.
- Aggiunto `kyv-auth.js` come protezione auth leggera/passiva: mostra Logout se esiste una sessione Supabase e prepara `requireAuth()`.
- Aggiornate tutte le pagine HTML per caricare `kyv-help.js` e `kyv-auth.js` prima di `menu.js`.
- Potenziata `assistente.html` con nuova sezione `Azioni di oggi`.
- Aggiunto popup `Pianifica follow-up` in Assistente Produzione.
- Il follow-up salva in `PROGETTI` se le colonne v2.9.5 esistono; in caso contrario salva una nota in `DOCUMENTI_PROGETTO`.
- Aggiunto bottone `SQL follow-up` per copiare rapidamente la migration.
- Aggiunto file `SUPABASE_MIGRATION_V2_9_5_FOLLOWUP.sql`.
- Aggiunto collegamento opzionale `ID_PROGETTO` per `Spese Extra`.
- Aggiornata `documenti.html` per scegliere un progetto quando si inserisce una spesa manuale.
- Aggiornata `scheda_progetto.html`: la tab Spese usa prima `ID_PROGETTO`, poi fallback per parole chiave.
- Aggiornato `kyv-schema.js` con campi follow-up e `ID_PROGETTO` su Spese Extra.
- Aggiornato Service Worker a cache version `kyv-studio-v2-9-5`.

---

# AI Review Changes — v2.9.5

## Aggiornamento principale

Questa versione non cambia la struttura tecnica del gestionale, ma amplia in modo profondo la documentazione e la fruibilità concettuale.

## File aggiornati

- `guida.html`
- `MANUALE_OPERATIVO.md`
- `README.md`
- `AI_REVIEW_CHANGES.md`
- `sw.js`

## Cosa è stato ampliato

- Spiegazione del viaggio del brano dalla prima opportunità all’archivio finale.
- Passaggi concreti da fare in ogni fase.
- Passaggi facoltativi/professionali che si potrebbero fare per rafforzare tracciamento e protezione.
- Descrizione pagina per pagina: funzione, utilità, quando usarla, sezioni interne, bottoni, dati coinvolti, obiettivo.
- Matrice dei bottoni principali.
- Routine giornaliera, post-sessione, pre-master, pre-release e fine mese.

## Controlli

È stata rigenerata la documentazione senza modificare la logica Supabase o le tabelle. Non è richiesta nuova SQL.


## v2.9.5 — Manuale & Guida più analitico

- Ampliato `menu.js`: il popup **Manuale & Guida** non è più sintetico.
- Aumentata larghezza del popup da `max-w-3xl` a `max-w-6xl`.
- Aggiunte spiegazioni pagina per pagina: funzione, utilità, passaggi, bottoni, dati coinvolti, obiettivo.
- Ridotta la ripetizione PWA: resta una sola nota generale.
- Aggiornati `guida.html`, `MANUALE_OPERATIVO.md`, `README.md` e cache version.

## v2.9.5 - Correzione mobile header/sidebar

- Reso il topbar mobile molto più compatto: su smartphone il titolo viene limitato a 1-2 righe e i sottotitoli lunghi vengono nascosti nel blocco sticky superiore.
- I pulsanti nel topbar mobile non allungano più l’header andando a capo: diventano una riga orizzontale scorrevole.
- Sidebar laterale mobile resa più compatta: logo, voci menu e footer occupano meno spazio verticale.
- Popup Manuale & Guida ottimizzato su smartphone con header più basso e più spazio al contenuto.
- Aggiornato Service Worker a `kyv-studio-v2-9-4` per forzare refresh della nuova interfaccia.


## v2.9.7 — Dropbox diretto nella Stazione Ascolto

- Aggiornato `ascolto.html` con una nuova sorgente `Dropbox diretto`.
- Aggiunto Dropbox Chooser anche nella Stazione Ascolto, usando la stessa App Key già presente in `kyv_dropbox.html`.
- Ora è possibile pescare MP3/WAV/M4A/AIF/FLAC direttamente da Dropbox anche se non sono ancora registrati in `DROPBOX_AUDIO_FILES`.
- I file Dropbox diretti entrano in playlist, possono essere ascoltati subito, aperti esternamente, copiati come link e usati per feedback.
- Aggiunta scelta opzionale del progetto e del tipo file prima dell’import Dropbox diretto.
- Aggiunti bottoni `Salva brano corrente in Archivio` e `Salva archivio` per registrare successivamente il file in `DROPBOX_AUDIO_FILES`.
- `Registra ascolto` può salvare note in `DOCUMENTI_PROGETTO` anche per file Dropbox diretti, se collegati a un progetto.
- Nessuna nuova SQL obbligatoria.

## v2.9.8 — Riordino navigazione e UX studio

- Sidebar semplificata con sole sezioni principali richieste: Panoramica, Progetti & Uscite, Rubriche, Fatture, Spese Extra, Studio Editor, Piano Fiscale, Quote per Opera, Rendiconto SIAE, App Launcher, Stazione Ascolto, Import/Export, Manuale.
- Nessuna pagina eliminata e nessuna tabella modificata.
- Funzioni secondarie ricollocate in App Launcher: Assistente Produzione, Sessioni Studio, Scheda Progetto, Protezione Brano, Audio Dropbox, Google Drive, Google Calendar, Documenti & Schede, Dettaglio Autori, Correlazione, Report/PDF.
- App Launcher riscritto per gruppi: Produzione musicale, Audio/file/ascolto, Amministrazione/documenti/analisi, Diritti/anagrafiche avanzate.
- Link sidebar “Spese Extra” porta direttamente alla tab spese di `documenti.html?tab=spese`.
- `documenti.html` ora legge `?tab=spese`, `?tab=documenti` o `?tab=schede` e apre direttamente la sezione corretta.
- Mobile bottom nav semplificata: Home, Progetti, Rubrica, Ascolto, Launcher.
- Guida aggiornata con una sezione dedicata alla nuova logica di navigazione.


## v2.9.9 — Studio Editor compatto e Backup/Ripristino locale

- Compattate le colonne dello Studio Editor con larghezze intelligenti per ID, date, importi, titoli, artisti, link e note.
- Aggiunto bottone **Compatta/Larga** nello Studio Editor.
- Le celle lunghe restano leggibili con ellissi e si espandono al focus/modifica.
- Aggiunto in Import/Export il modulo **Backup & Ripristino locale database**.
- Il backup scarica sul PC un file JSON con tabelle, metadata, colonne e righe.
- Il ripristino carica un backup JSON dal PC, mostra anteprima tabelle e consente selezione mirata.
- Ripristino non distruttivo: non elimina dati esistenti.
- Aggiunte opzioni **Salta duplicati** e **Mantieni ID originali**.
- Aggiornato Service Worker a `kyv-studio-v2-9-9`.


## v2.10.4 — Ripristino stabile da v2.9.9

Questa versione ripristina la base stabile della v2.9.9 dopo i test fiscali avanzati.

- `fisco.html` torna al Piano Fiscale semplice precedente alle modifiche CU/CUD/Unico/dichiarazioni fiscali.
- `menu.js` e la sidebar tornano alla navigazione funzionante della v2.9.9.
- Restano presenti le funzioni già stabili della v2.9.9: Studio Editor compatto, Backup/Ripristino locale database, Stazione Ascolto, App Launcher riordinato, Spese Extra e Import/Export.
- Non sono richieste nuove SQL.
- I dati Supabase non vengono toccati né cancellati.

## v2.10.5 - Piano fiscale: diritti d'autore/correlati semplice

- Base ripristinata dalla v2.10.4 / v2.9.9 stabile.
- Aggiornato `fisco.html` senza reintrodurre registro CU complesso.
- Aggiunto campo manuale `Diritti d'autore / correlati lordi`.
- Il campo viene tassato al 60% tramite `Percentuale_Diritti_Autore`, modificabile.
- Formula principale:
  - fatture anno × 67% = reddito attività forfettario;
  - diritti/correlati × 60% = reddito diritti;
  - reddito lordo = reddito attività + reddito diritti;
  - imposta sostitutiva = reddito lordo × 5% fino al 2025, 15% dal 2026;
  - reddito netto dopo imposta = reddito lordo - imposta sostitutiva;
  - INPS stimata = reddito netto dopo imposta × aliquota INPS manuale.
- Aggiunta aliquota INPS manuale, default 17,9%, con bottone rapido 26%.
- Migliorato parsing dei campi monetari con virgola/punto italiani.
- Aggiunta SQL opzionale `SUPABASE_MIGRATION_V2_10_5_FISCO_DIRITTI.sql` per salvare i nuovi campi in `PIANI_FISCALI`.

## v2.10.6 - Prova grafica grigio topo scuro

- Base: v2.10.5 stabile.
- Aggiunto `kyv-theme.css`, caricato in tutte le pagine HTML dopo gli stili esistenti.
- Parti laterali/menu mantenute nere.
- Area centrale resa leggermente più chiara, su grigio topo scuro.
- Pannelli, card, input, modali e tabelle armonizzati con grigi più leggibili.
- Tabelle e righe alternate con due tonalità diverse di grigio.
- Aggiornato `menu.js` label a Manager Pro 2.10.6.
- Aggiornato `sw.js` cache name per evitare cache vecchia.
- Nessuna modifica a Supabase, tabelle o logica dati.


## v2.10.7

- `ascolto.html`: aggiunta modalità Radio Drive + Dropbox.
- Caricamento playlist combinata da `DROPBOX_AUDIO_FILES`/`CONSEGNE_MASTER` e Google Drive.
- Possibilità di aggiungere file Dropbox non registrati tramite Chooser senza perdere la playlist.
- Nuovi controlli player: play/pausa, avanti, indietro, casuale, ripeti lista/brano/off.
- Nessuna modifica a Supabase o SQL.


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

## v2.11.1 - Drive multi-account e campi con memoria

- Aggiunto `kyv-drive-bridge.js` per centralizzare il collegamento Google Drive.
- Aggiunta configurazione `GOOGLE_DRIVE_ACCOUNTS` in `config.js` con due slot: `info@kyvprod.net` e `prodkyv@gmail.com`.
- Rifatta `kyv_drive.html` con selettore account Drive, scansione singola o di tutti i Drive configurati, filtro locale, stato configurazione e gestione errori più chiara.
- Aggiornata `ascolto.html`: la Radio e la tab Drive usano il nuovo bridge multi-account invece del vecchio URL unico.
- Aggiunto template `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` per creare un secondo deployment Apps Script se il Drive `prodkyv@gmail.com` non è accessibile dallo script già configurato.
- Aggiunto `kyv-field-memory.js`: campi ricorrenti con suggerimenti automatici dai valori già presenti nelle colonne Supabase.
- Applicate prime memorie/suggerimenti a progetto, audio Dropbox, invii, spese, documenti e form dinamico progetti.
- Nessuna modifica alle tabelle Supabase e nessuna nuova SQL obbligatoria.


## v2.11.1 - Configurazione Drive prodkyv@gmail.com
- Inserito in `config.js` l'URL Apps Script fornito per l'account `prodkyv@gmail.com`.
- Il blocco `GOOGLE_DRIVE_ACCOUNTS` ora contiene due Drive configurati: `info@kyvprod.net` e `prodkyv@gmail.com`.
- Nessuna modifica a Supabase, tabelle o logiche fiscali.

## v2.11.2 - Fix Google Drive “Failed to fetch”
- Aggiornato `kyv-drive-bridge.js` con timeout, diagnostica chiara e fallback JSONP quando `fetch()` viene bloccato dal browser/CORS o da redirect di autorizzazione Apps Script.
- Aggiornato `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` alla versione 2.11.2 con supporto `callback` JSONP e azione `ping`.
- Nessuna modifica a Supabase o ai dati.
- Aggiornato service worker a `kyv-studio-v2-11-2-drive-fetch-fallback`.


## v2.11.3 - Fix definitivo blocco Drive / CORS / Service Worker

- Corretto `sw.js`: ora il service worker non intercetta più richieste esterne verso Google Apps Script, Drive, Dropbox o Supabase. Questo elimina l'errore `Uncaught (in promise) TypeError: Failed to fetch at sw.js`.
- Aggiornato `kyv-drive-bridge.js`: per `script.google.com` usa JSONP come metodo primario, evitando chiamate `fetch` bloccate da CORS.
- Aggiornato `GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs` alla v2.11.3 con supporto JSONP e fallback DriveApp se il servizio avanzato Drive API non è abilitato.
- In `config.js`, il Drive `info@kyvprod.net` è stato lasciato da riconfigurare perché l'URL precedente restituisce HTTP 404. Il Drive `prodkyv@gmail.com` resta configurato con l'URL fornito dall'utente.
- Nessuna modifica a Supabase, tabelle o dati.

## v2.11.4 - Correzioni blocchi UI, select progetto, audio e client Supabase

- Corretto `kyv-searchable-select.js`: i menu ricercabili ora ricatturano le option quando una pagina riscrive i dati, evitando select vuote/non aggiornate.
- Corretto `/ascolto.html`: i filtri progetto e il collegamento progetto in Stazione Ascolto forzano l'aggiornamento dello snapshot dopo il caricamento da Supabase.
- Corretto player audio: i link non riproducibili non stampano più eccezioni rumorose in console; viene mostrato un messaggio utente e resta disponibile `Apri esterno`.
- Aggiunto `favicon.ico` e link favicon in tutte le pagine per evitare il 404.
- Ridotto il rischio di warning Supabase `Multiple GoTrueClient instances`: `KYV.createSupabaseClient()` ora usa un singleton condiviso e `kyv-auth.js` lo riusa.
- Studio Editor: i modali dinamici ora attivano suggerimenti/datalist sui campi ricorrenti della tabella corrente, inclusi i campi di `PROGETTI` in modifica progetto.
- Nessuna modifica a Supabase, nessuna nuova SQL.


## Aggiornamento v2.11.5 - Correzioni Drive/Dropbox/Auth

- Reinserito e confermato l’URL Apps Script per `prodkyv@gmail.com`.
- Rimossi i `defer` dal caricamento Supabase nelle pagine principali, così `kyv-auth.js` non parte prima della libreria.
- `kyv-auth.js` ora ritenta dopo il caricamento pagina e non stampa più errori quando Supabase non è ancora pronto.
- Corretto Dropbox Chooser: i filtri usano il tipo supportato `audio` invece dell’elenco di estensioni non accettato dal nuovo Chooser.
- Aggiornato service worker a `kyv-studio-v2-11-5-drive-dropbox-auth`.
- Filtrato il warning Tailwind CDN non bloccante dalla console, senza cambiare la grafica.

## v2.11.6 - Drive proxy serverless

- Aggiunto `api/drive-proxy.js`, funzione serverless Vercel che chiama Google Apps Script dal server e restituisce JSON alla webapp.
- Aggiornato `kyv-drive-bridge.js`: per `script.google.com` usa prima `/api/drive-proxy`, poi JSONP come fallback.
- Aggiornato `config.js` con `GOOGLE_DRIVE_USE_PROXY: true` e `GOOGLE_DRIVE_PROXY_URL: '/api/drive-proxy'`.
- Aggiornato `kyv_drive.html` con pulsante `Diagnosi collegamento`.
- Aggiornato `sw.js` cache a `kyv-studio-v2-11-6-drive-proxy`.
- Nessuna modifica Supabase/SQL.


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

## v2.11.8 - Campi LINK cliccabili e tabelle compatte

- Aggiunto `kyv-link-viewer.js`:
  - intercetta i link presenti nelle tabelle e nei campi link/url/drive/dropbox/documento/file;
  - apre PDF, documenti, Excel, immagini e link Drive/Dropbox in una finestra popup interna;
  - per link audio apre direttamente `ascolto.html` con il brano passato in query string;
  - aggiunge pulsanti `Copia link` e `Apri esterno` nel popup.
- Aggiunto `kyv-table-tools.js`:
  - applica compattezza globale alle tabelle;
  - imposta larghezza massima iniziale delle celle a circa 4 cm;
  - aggiunge maniglie di ridimensionamento sulle intestazioni per allargamento/restringimento manuale;
  - consente doppio click su una cella per leggerla espansa;
  - trasforma URL testuali nei campi link in pulsanti cliccabili.
- Aggiornato `ascolto.html`:
  - supporta parametri `?audio=...&title=...` per riprodurre un audio proveniente da un campo LINK.
- Aggiornati tutti gli HTML per caricare i nuovi moduli globali.
- Aggiornato `menu.js` a Manager Pro 2.11.8.
- Aggiornata cache service worker a `kyv-studio-v2-11-8-link-preview-table-compact`.
- Nessuna modifica Supabase/SQL.


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

---

## v2.11.14 - Data Safety Guard, restore protetto e creazioni INSERT-only

### Nuovo modulo
- Aggiunto `kyv-data-guard.js`:
  - helper comuni di sicurezza dati;
  - log locale `kyv_data_guard_logs_v2`;
  - calcolo chiavi primarie e prossimo ID numerico;
  - inserimento protetto `safeInsertNewRecord()` solo INSERT, mai UPDATE/UPSERT;
  - blocco se Supabase restituisce una chiave primaria già esistente.

### Nuovo progetto da audio
- `kyv-audio-project.js` ora delega a `KYV_DATA_GUARD.safeInsertNewRecord()` quando disponibile.
- La funzione resta attiva in:
  - Stazione Ascolto MP3;
  - Google Drive;
  - Archivio Audio & Invii Dropbox.
- La creazione progetto da audio continua a essere solo INSERT e non può sovrascrivere record esistenti.

### Backup e ripristino
- `importexport.html` rinforzato con:
  - pulsante `Verifica` prima del ripristino;
  - checkbox `Backup sicurezza prima`, attiva di default;
  - snapshot automatico delle tabelle selezionate prima del restore;
  - collisioni di chiave primaria sempre saltate, anche se “Salta duplicati” è disattivato;
  - report JSON finale del ripristino;
  - fallback riga-per-riga se un blocco insert fallisce.

### Note tecniche
- Nessuna nuova SQL.
- Nessuna modifica a Supabase.
- Cache aggiornata a `kyv-studio-v2-11-14-data-safety-guard`.

---

## v2.12.0 — Consolidamento struttura e stabilità

Base: v2.11.14.

Modifiche:
- Aggiunto `diagnostica.html`.
- Aggiunto `kyv-system-diagnostics.js`.
- Aggiornato `menu.js` con versione 2.12.0 e voce Diagnostica.
- Aggiornato `integrazioni.html` con card Diagnostica Sistema.
- Esteso `kyv-helpers.js` con funzioni comuni: formatCurrency, formatDate, renderBadge, downloadText.
- Esteso `kyv-table-tools.js` con ordinamento colonne e filtro locale per tabelle lunghe, mantenendo compattezza 4 cm, resize e link viewer.
- Aggiornato `kyv-data-guard.js` a versione interna 2.12.0.
- Aggiornato `sw.js` cache a `kyv-studio-v2-12-0-structure-diagnostics`.

Nessuna nuova SQL. Nessuna modifica Supabase.
