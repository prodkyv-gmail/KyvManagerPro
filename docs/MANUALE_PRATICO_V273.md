# Aggiornamento operativo attuale · 20 novembre 2026

> **Priorità delle istruzioni.** Le procedure in questa sezione descrivono l'interfaccia realmente disponibile. I capitoli v2.82 e precedenti riportati sotto sono conservati per riferimento tecnico/storico; se differiscono, valgono queste istruzioni e la guida contestuale **?**. La versione applicativa resta quella dichiarata dal release contract, senza introdurre un numero fittizio per i soli aggiornamenti UI.

## 1. Taccuino KYV, minimale e veloce
Percorso: Home → **+ Note** apre **Cattura veloce**. Menu → **Taccuino KYV** (`kyv_notes.html`) apre invece l'elenco delle note. Sono funzioni diverse ma condividono lo stesso archivio privato `kyv_notes`.

- **Taccuino:** mostra titolo, descrizione (anteprima testuale), data, icona **matita / Modifica** e icona **cestino / Elimina**. Il campo Cerca filtra per titolo e descrizione. **Nuova nota** e **Modifica** aprono lo stesso piccolo popup con due soli campi: Titolo (facoltativo) e Descrizione. Si salva esplicitamente con **Salva** (oppure Ctrl/⌘+Invio). La prima riga del contenuto funge da titolo leggibile se mancante.
- **Elimina** richiede conferma: l'operazione è definitiva e tenta di eliminare anche audio e allegati della nota. Non cancella note di altri utenti. Le bozze testuali possono restare nel `localStorage` del dispositivo se il salvataggio cloud fallisce; non cancellare dati browser prima della sincronizzazione.
- **Cattura veloce** è invariata: nelle principali pagine usa **+ Nota** o in Home **+ Note**; scegli Idea/Informazione/È successo/Da fare, scrivi o usa **Detta testo** se il browser lo supporta, oppure **Registra audio → Stop → Salva nota**. Memo fino a **5 minuti / 20 MB**, privati e senza trascrizione automatica. La dettatura browser potrebbe usare un servizio esterno. Se non riesci a caricare una registrazione, **Scarica una copia** prima di chiudere.
- Le funzioni avanzate precedentemente mostrate nel Taccuino (canvas/pennino, timeline, filtri complessi, classificazione, conversione in attività) **non compaiono più nella pagina semplice**. I file audio e allegati già conservati rimangono consultabili in **Contenuti già salvati** nel dialogo di modifica, soltanto quando esistono. Gli archivi relativi non sono stati cancellati.
- Schemi esistenti: `kyv_notes` (RLS owner), `kyv_note_files` (allegati privati) e bucket `kyv-notes-audio` / `kyv-notes-files`. Nessuna migrazione né aggiornamento distruttivo per la semplificazione UI.

## 2. Agenda: archivio Google e importazione locale
Percorso: `kyv_calendar.html`. Il pulsante **Aggiorna agenda** usa la connessione Google Apps Script configurata. Le attività del modulo **Nuova Attività** hanno Titolo, Data inizio/fine, Ora inizio/fine oppure Tutto il giorno, luogo, descrizione, stato e dati per promemoria/rinvio. Il pulsante **Salva in agenda e Calendar** mostra l'esito; l'app dichiara locali le attività tutto il giorno o su più giorni. Non attribuire un salvataggio Google se non è stato confermato.

**Archivio locale** è una sezione richiudibile separata. **Scegli file dall’archivio locale** accetta file calendario **.ics** o **.csv** da PC, Mac, tablet e smartphone (**2 MB, massimo 500 appuntamenti**). Il CSV richiede Titolo e Data; Ora, Ora fine, Descrizione e Luogo sono facoltativi. Apri **anteprima**, verifica date/fusi orari, seleziona le righe, premi **Importa selezionati nell’Agenda KYV** e conferma. L'importazione è persistita nello storico KYV, verifica duplicati e non scrive automaticamente su Google Calendar. File sorgente letto nel browser, non caricato a Drive/Dropbox. Se c'è un errore, prima verifica lo storico, evitando doppi inserimenti.

## 3. ADD Progetto: file cloud e audio locale
Percorso: `acquisisci_audio.html` → **Hai già un file o un link?**.

- **Apri Drive** / **Apri Dropbox** conducono ai rispettivi servizi. Per registrare un riferimento al singolo file, inserisci **Link Drive o Dropbox** e procedi con controllo duplicati, progetto e conferma.
- **Archivio locale** apre il selettore del dispositivo per audio MP3, WAV, M4A, AIFF, FLAC, AAC, OGG o OPUS (**50 MB per file**). Scegli **Progetto di destinazione**, compila se necessario Titolo, Artista, Tipo, Versione, poi **Controlla duplicati** (SHA-256 del contenuto rispetto a `AUDIO_VERSIONI`). Premi **Importa e collega versione** solo dopo la verifica e la conferma.
- L'audio viene caricato nel bucket privato `kyv-local-audio` con permessi di proprietà per utente, e collegato a `AUDIO_VERSIONI` attraverso il percorso esistente. La pagina `kyv_local_audio.html` consente ascolto e download autenticati. Non si salva un percorso locale `file://`; la scelta del file non avviene in background.
- **Audio Finder** è un modulo distinto: la scansione guidata locale/cloud indicizza metadati e non carica automaticamente i byte audio. Per stem/sessioni oltre 50 MB preferire i collegamenti cloud.

## 4. Studio Editor: navigazione, date e filtri
Percorso: `editor.html`. Schede principali, nell'ordine **Progetti → Fatture → Estratto SIAE → IMAIE**; altre 10 tabelle in **Altre tabelle**. All'apertura una tabella ordina **data più recente prima**, con fallback per ID decrescente se manca una data. L'intestazione modifica l'ordinamento.

Per PROGETTI scegli **Essenziale** (campi chiave + dettaglio in sola lettura) o **Completa** (tutte le colonne, con modifiche consentite). **Mostra** espone filtri 30 giorni/12 mesi/senza data quando disponibili, follow-up e campi mancanti per Progetti; da incassare e incasso da verificare per Fatture. **Righe** consente 60/120/240, impostazione ricordata per tabella; **Azzera filtri** ripristina ricerca e filtri senza eliminare record o colonne. **Colonne** modifica solo la vista; ricerca e **Esporta CSV** usano il dataset verificato e completo, non le sole righe visibili. Le etichette sui pagamenti sono segnalazioni gestionali e non provano un accredito bancario.

## 5. Guida e controlli di sicurezza
Manuale web `guida.html#guida-aggiornamenti-20261120` e popup **?**: Home (`home`), Taccuino (`notes`), Agenda (`calendar`), ADD Progetto (`nuovo`), Studio Editor (`editor`), Audio Finder (`audiofinder`), Drive/Dropbox e schede coinvolte. In caso di discrepanza con i vecchi paragrafi storici, prevale il capitolo corrente. Le modifiche di questo pacchetto sono esclusivamente documentali, senza cambi di tabelle, dati, permessi, OAuth, importi, date, diritti o flussi applicativi. La suite CI non sostituisce la prova manuale da account autenticato su PC e mobile.

---

_Da qui in poi seguono le procedure storiche v2.73–v2.82, conservate per compatibilità._

## Aggiornamento v2.82 · Lettura completa e sicurezza dei totali

1. Apri Economia → Controllo economico: la sezione mostra un messaggio di caricamento finché le quattro fonti non sono state lette per intero. Un valore zero viene mostrato soltanto se l'archivio è stato verificato; non appare una somma parziale.
2. Apri KYV Analyst e premi **Rileggi e aggiorna i dati**: il pulsante viene bloccato durante la richiesta e il testo mostra il progresso delle 11 fonti, evitando richieste ripetute.
3. Ordinamento per ID univoco evita duplicazioni di sessioni o piazzamenti che condividono la stessa data. Se il database risponde con dati mancanti, ID ripetuti o senza un conteggio esatto, il calcolo si blocca con una descrizione dell'errore.
4. Le letture su errori transitori come 503 possono essere ripetute fino a due volte. Per un errore di permessi o schema il controllo fallisce subito; dopo averlo risolto puoi ricaricare la pagina.
5. Il limite prudenziale è 30.000 record per archivio; oltre il limite l'app chiede verifica anziché inventare un totale incompleto.
6. PWA, VERSION e cache vengono testati con riferimenti centralizzati, così i controlli storici restano validi quando si pubblica una nuova versione. La verifica della nuova PWA deve essere eseguita manualmente.
7. Formule di fatture, incassi, fee, SIAE e IMAIE non cambiano; i dati storici rimangono invariati.

## Aggiornamento v2.81 · KYV Analyst e controllo di coerenza economica

1. Apri **KYV Analyst** dopo il caricamento autenticato. Sotto Verifiche principali apri **Controllo di coerenza economica · v2.81**, inizialmente chiuso per non appesantire la pagina.
2. Consulta fatturato per **PrezzoUnitario**, incassi con data (entro l'importo unitario), fatture storiche PAGATA=SI senza movimento, liquidazioni nette con data SIAE e Nuovo IMAIE.
3. Le segnalazioni evidenziano ripartizioni non coincidenti, movimenti eccedenti, date mancanti, ID non presenti e quote diritti problematiche. Premi **Verifica** per correggere solo sulla schermata originale.
4. Un importo in ESTRATTO SIAE grezzo o in una liquidazione senza DataAccredito **non** equivale a un bonifico ricevuto. Le attribuzioni stornate non sono considerate attive.
5. Una fee zero non è un credito insoluto; una fee positiva senza fattura va verificata nei documenti, non è automaticamente un credito. Non si calcola profitto netto senza costi per brano documentati.
6. Prova **Quali riconciliazioni economiche devo verificare?** oppure **Quali royalties devo ancora attribuire?**. Dopo eventuali correzioni premi **Rileggi e aggiorna i dati**.
7. Nessuna modifica a dati storici, schema, fatture, diritti o polarità SIAE; il nuovo pannello è read-only e non sostituisce la verifica fiscale/bancaria.

## Aggiornamento v2.80 · Audio Finder e selezione controllata

1. Apri **Audio Finder → Aggiungi audio da PC, smartphone o cloud**. Nella nuova sezione Sorgenti disponibili puoi leggere le funzioni del browser e gli account/connettori configurati; non è una verifica dei permessi né una scansione globale.
2. **Mac/PC**: seleziona una cartella o un gruppo di file, anche in directory OneDrive sincronizzate. **iPhone/Android**: scegli i file col selettore del sistema; una PWA non legge automaticamente tutte le cartelle.
3. Il preflight accetta massimo 5.000 elementi, conta gli audio supportati e ignora gli altri; il testo sotto il selettore segnala avanzamento dell'identificazione *solo dai metadati*, senza leggere i byte audio. Se non ci sono audio validi, la coda attuale resta disponibile.
4. **Cloud**: scegli Drive (connettore), Dropbox (archivio/Chooser/OAuth) o OneDrive (OAuth opzionale), se configurato. La disponibilità reale dipende da account, permessi, paginazione e abilitazione OneDrive; nessun salvataggio automatico.
5. Con classificazioni non salvate, una nuova selezione o una nuova autorizzazione cloud richiede di confermare la sostituzione; se annulli mantieni la precedente revisione.
6. La barra **Copertura effettiva** della revisione mostra quanti file unici per origine sono stati esaminati. Il numero esclude cartelle/account non scelti e ricerche parziali non concluse.
7. Spunta e classifica solo i tuoi brani. Premi **Salva le classificazioni** e poi, separatamente, collega a un tuo progetto dopo una conferma. La scelta non crea un progetto implicitamente.

## Aggiornamento congiunto v2.78/v2.79 · Popup Editor e grafica

1. In Studio Editor apri il popup **Modifica**: mostra le categorie Dati principali, Collegamenti, Date, Economia, Altri dettagli, solo quando contengono campi.
2. **Trova un campo** cerca etichette e nomi tecnici. **Solo modificati** mostra solo quelli su cui hai lavorato; i campi nascosti non perdono alcun valore e rimangono nel modulo.
3. La barra di stato indica campi e sezioni visibili e, in basso, il numero di modifiche ancora non salvate. **Salva/Annulla** sono raggiungibili sempre mentre scorri.
4. **Esc/Annulla** con modifiche non salvate richiede conferma; salvataggi concorrenti restano bloccati. La ricerca del popup non cambia le query o il CSV.
5. Su smartphone il popup usa una colonna e controlli grandi; Progetti, Sessioni, Fatture ed Editor usano stessi criteri di contrasto, focus, spaziatura e scroll, senza duplicazioni.
6. Testare la PWA aggiornata a 2.79: la verifica precedente v2.77 è già acquisita, ma non sostituisce il controllo della nuova versione.

# KYVManagerPro — Manuale pratico dettagliato v2.73

**Data:** 4 novembre 2026 · **Versione:** 2.73

Questo manuale è la spiegazione corrente delle funzioni di KYVManagerPro. L'app conserva sezioni storiche nelle versioni precedenti: quando il nome di un comando è cambiato, fare riferimento alla sezione *Guida pratica v2.73* di `guida.html` e alla guida **?** contestuale.

## Aggiornamento v2.77 · Studio Editor e colonne

1. Apri **Studio Editor** e scegli la tabella nella barra in alto; al cambio tabella la ricerca riparte vuota, mentre un **Riprova** della stessa tabella mantiene il testo.
2. Scrivi in **Filtra tabella corrente**: cerca tra tutti i campi del dataset verificato, anche quelli nascosti. **Mostra altre 120 righe** amplia la visualizzazione senza rifare la stessa ricerca e senza alterare i criteri.
3. Apri **Colonne** e usa **Trova colonna** per cercare il nome della colonna oppure **Solo colonne visibili** per vedere solo i checkbox attivi. Il contatore riferisce visibili, totali e risultati del pannello.
4. Spunta/deseleziona la colonna desiderata; la griglia si aggiorna, ma non vengono modificati i record. Almeno una colonna resta sempre visibile. **Mostra tutte** ripristina la vista completa della tabella corrente.
5. Su smartphone il pannello è scorrevole e con controlli grandi; con **Esc** ritorni al pulsante Colonne. **Compatta/Larga** cambia soltanto la densità.
6. Il **CSV** esporta tutte le colonne del dataset caricato, comprese quelle non visibili. Dopo un salvataggio la cache di visualizzazione è invalidata: il nuovo valore è visibile nella ricerca soltanto dopo aggiornamento verificato.
7. Il nuovo motore lavora in memoria nella pagina e non genera nuove query, modifiche al database o collegamenti automatici.

## Aggiornamento v2.76 · Coerenza dei comandi operativi

**Progetti:** su smartphone la testata rimane compatta dopo l'applicazione delle personalizzazioni grafiche. Una sola ricerca, nessun secondo menu.

**Sessioni Studio:** digita nel campo Cerca e seleziona il filtro. Sotto il titolo compare quante schede progetto corrispondono nell'archivio caricato e quanti eventi sono mostrati dei complessivi della timeline (max 24 in lista). I numeri delle quattro metriche sono dell'intero archivio caricato, non del filtro. In caso di errore: indicatori non disponibili (—), premi Ricarica senza perdere i criteri.

**Fatture / Economia:** la ricerca agisce su righe e totali; il riepilogo riporta fatture visualizzate/ricevute e specifica il perimetro dei calcoli. Dopo un salvataggio, un import o il pulsante Ricarica la ricerca resta invariata; svuotala se vuoi tutte le fatture. In caso di errore non trattare — come zero.

**Studio Editor:** una sola barra di azioni, con Esporta, Aggiungi, Colonne, Compatta/Larga, e stato leggibile sotto. Le impostazioni Colonne e densità cambiano solo la presentazione, mai i valori. Su smartphone i controlli sono accessibili e da almeno 44 px.

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
