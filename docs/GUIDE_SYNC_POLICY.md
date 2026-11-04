### v2.61 — Safe Projects e Scheda: semplificazione di presentazione
La pagina `progetti.html` resta isolata: evitare di includere script di sidebar globali, renderer aggiuntivi o CSS `kyv-theme.css` senza apposita migrazione e collaudo. Ricerca e filtri continuano a consultare `KYV_PROJECT_V250` sull'archivio autenticato e paginato completamente; non reinterpretare un risultato parziale come zero né rimuovere la protezione sulle righe duplicate. I filtri avanzati e il grafico globale usano `details` nativi: gli ID di tutti i controlli restano stabili e il clic sul grafico mostra il filtro selezionato. Le card mobile presentano gli stessi dati della tabella, senza dedurre date o avanzamenti. Popup rapidi di sola lettura, con focus trap, Esc e ritorno del focus, senza nuovi endpoint. In `scheda_progetto.html` il selettore limita solo i risultati *mostrati*, mai la ricerca; la modalità Easy nasconde le scorciatoie duplicate ma non i dati disponibili in Completa. Ogni modifica a dati, fee o associazioni resta gestita dai moduli esistenti.

### v2.60 — Nuova base visiva senza duplicazioni
Estendere `kyv-theme.css` condiviso, non introdurre un secondo tema o un sistema concorrente di CSS dinamici. Abilitare i componenti opt-in sulle schermate verificate, mantenere intatto il renderer isolato di Progetti safe fino a un intervento specifico. I link primari non devono essere ripetuti in più gruppi dello stesso menu; la bottom navigation crea direttamente le destinazioni, senza riscriverle dopo il render. L'ARIA `aria-current` deve indicare l'elemento attivo. I controlli avanzati di Audio Finder possono essere richiudibili nativamente, ma gli ID, gli handler, la necessità di consenso esplicito, la revisione delle reference e i collegamenti manuali non devono cambiare. Non usare un restyling per reinterpretare dati storici, SIAE, importi di fatture o ownership audio. Ogni modifica estetica richiede regressione su desktop/mobile e guida aggiornata.

### v2.59 — Riepilogo musicale per progetto senza inferenze
Riunire per ID verificati `PROGETTI`, link sessioni non annullati, piazzamenti non archiviati e audio solo con ownership esplicita `mio` + associazione diretta confermata; evitare qualsiasi deduzione da titolo, filename o sessione. Fatturato per progetto esclusivamente da quote esplicite o ID_PROGETTO diretto con PrezzoUnitario valido; non usare importi totali fiscali. Incassi multi-progetto non attribuiti senza evidenze di quote pagamento; gli storni annullano movimenti e i flag PAGATA legacy non sono movimenti. Se la lettura economica fallisce o è incompleta non produrre numeri apparentemente veri. La vista riassuntiva è in sola lettura con popup e collegamenti esistenti; nessuna migrazione, nessuna modifica storica e version/cache/guida/test sincronizzati.

### v2.58 — Cloud: attivazione in due fasi, mai implicita
La nuova integrazione Dropbox online richiede un clic di accesso OAuth PKCE e un secondo clic di scansione della cartella scelta (o radice consentita). Non usare un token persistente né trattare un risultato parziale come completo; non inventare link condivisi; non trasformare l'hash proprietario a blocchi Dropbox nello SHA-256 del contenuto. Microsoft Graph è solo predisposto finché client ID/redirect SPA, migrazione SQL e flag ONEDRIVE_INDEX_ENABLED non sono configurati. Non creare/collegare automaticamente progetti e non salvare alcun file OneDrive se il flag è falso. È vietato aggirare i vincoli RLS dei provider esistenti e le scelte dell'utente su Mio/Reference/Da verificare. Guida, regressioni, PWA e versione devono rimanere sincronizzati.

### v2.57 — Audit non mutante e copertura documentata
Qualsiasi indicatore del Controllo archivio deve derivare solo dai dati già letti e approvati dall'utente autenticato. Distingui file da classificare nella coda corrente dalle decisioni `da_verificare` già salvate senza metadati navigabili; non inventare nomi o attribuzioni. Un audio senza collegamento a progetti non deve essere considerato mancante se compare solo in una sessione. Un progetto senza audio personale **nell'indice** non prova che non esista audio altrove. Descrivere come duplicati certi solo record con SHA-256 valido identico, senza dedurre proprietà o autorizzare operazioni. Filtri di sola presentazione, navigazione manuale, nessuna scansione cloud autonoma, scrittura o migrazione. Guida, test, PWA e versione aggiornati nello stesso rilascio.

### v2.56 — Filtri fonte coerenti con i file collegabili
Nella sezione Brani e versioni, il filtro fonte deve valere simultaneamente per le tessere, il dettaglio, le checkbox, la selezione multipla e **entrambe** le verifiche del collegamento prima dell'insert. Se la sorgente cambia, cancellare selezioni/progetto ed impedire salvataggi con filtri mutati durante un'attesa. Con "Tutte le sorgenti" mantenere il collegamento multi-provider esplicito. Mostrare nel popup di conferma il progetto realmente scelto e un riepilogo di file selezionati; non dedurre l'appartenenza dal nome. Aggiornare guida e regressioni nello stesso rilascio.

### v2.55 — Gruppi personali e filtro non visibile
Per file già approvati come propri, non attribuire mai un audio privo di artista dichiarato all'unico artista noto con lo stesso titolo. I gruppi sono proposte da nome e devono evidenziare l'ambiguità. Se la ricerca o un filtro nasconde il gruppo selezionato, chiudere dettagli e azzerare file/progetto selezionati prima di consentire un inserimento. Il filtro sorgente è a livello di gruppo e può includere file di altre sorgenti: chiarirlo nella guida e nella pagina. Rifiutare file duplicati nella stessa operazione di collegamento; nessuna creazione automatica. Aggiornare test, guida contestuale, manuale, PWA e versione senza migrazione DB.

### v2.54 — Revisione a gruppi senza approvazione implicita
Raggruppamenti da nomi di file solo informativi: non equivalgono a identità acustica, proprietà del brano o associazione di progetto. Separare esplicitamente artisti diversi e quelli non dichiarati. Un bulk può toccare fino a 100 **caselle spuntate e visibili**, e non deve alterare reference già escluse, lavori approvati, aggiornamenti metadati da riconfermare o decisioni individuali già prese. Cambio filtro/gruppo azzera la selezione, ma mantiene decisioni manuali non salvate fino a scarto volontario. La classificazione è sempre seguita da conferma separata di persistenza, senza creare progetti.

### v2.53 — Scansioni cloud selezionate e indipendenti
Il comando batch parte solo su clic ed enumera soltanto Drive già configurati e/o il Dropbox registrato nel database. Non equivale a crawler dell'intero account, e non include dispositivi locali senza file picker. Se una fonte è incompleta o fallisce, segnalare la copertura della fonte e mantenere i risultati disponibili senza inferire cancellazioni. Non unire titoli omonimi: deduplicare solo provider+account+external_key. Suggerimenti di SHA-256 identico e titoli compatibili restano separati dalle decisioni manuali di proprietà e dai collegamenti ai progetti.

### v2.52 — Confronto incrementale e no-op sicuro
Identifica un file per provider, account ed external_key; non dedurre duplicati da nomi uguali. Scansioni senza decisioni/aggiornamenti espliciti non devono scrivere. La classificazione `mio` già concessa non autorizza ad aggiornare metadati cambiati senza una seconda approvazione. Escludi reference; i suggerimenti di versione non sono associazioni. Rileggi le revisioni prima dell'upsert. Mantieni metadati validi se il provider omette campi. Evidenzia paginazione Drive incompleta senza mai cancellare assenti o affermare che l'intero cloud è stato esaminato.

### v2.51 — Esploratore cloud e locale con separazione degli stati
Mostrare nell'esploratore unificato **solo** file approvati `mio`; mantenere la scoperta da Drive/Dropbox/locale nella coda non approvata. Dropbox Chooser è solo un selettore di file, non crawling dell'intero account. Riproduzione locale solo per file scelti dall'utente e con URL temporanei revocati. Non archiviare Blob, non creare progetti per scansione o anteprima. Ricerca/approvazione massiva solo nella selezione visibile filtrata. Confermare accesso cloud, possibile dipendenza da popup/CORS e limiti. Aggiornare simultaneamente guida, test, cache e versioni.

### v2.50 — Viste rapide e grafici autonomi
Progetti non deve duplicare la Scheda Progetto: popup in sola lettura, senza query secondarie o scritture. La ricerca deve coprire tutte le schede e fallire esplicitamente in caso di recupero incompleto. I grafici devono usare dati attestati, mostrare i valori mancanti e conservare filtri autonomi. Fatturato dalla Home sempre su PrezzoUnitario; non usare `PAGATA` per presentare incassi bancari verificati o attribuire fee agli artisti.

### v2.49 — Gruppi di versioni non confermati
Per ogni raggruppamento esporre chiaramente che l'accostamento avviene da nomi dei file e non dal contenuto audio. Non preimpostare destinazioni di progetto, non creare progetti e non scrivere associazioni senza scelta e conferma esplicite. Gli hash reali possono segnalare duplicati, ma non sostituiscono verifica del brano. Aggiornare insieme Audio Finder, PWA, guide e test.

### Regola v2.48 — audio non necessariamente dell'utente
Ogni nuovo file da PC/smartphone/Drive/Dropbox entra nel catalogo KYV soltanto dopo approvazione esplicita come lavoro proprio. Le reference restano escluse, senza dati personali o audio copiati. La creazione del progetto richiede un secondo clic e il popup di conferma; mai auto-creare dalla scansione. Preservare la scelta nei test, nella guida contestuale e nel manuale. La scansione mobile è solo su file/cartelle selezionate e non è persistente.

# KYVManagerPro — Regola di aggiornamento della guida

## Regola operativa permanente
**Ogni upgrade funzionale della app deve includere nello stesso ramo, nella stessa PR e nello stesso controllo CI gli aggiornamenti alla guida delle pagine interessate.** Non dichiarare l'upgrade completo se la guida non riflette realmente le funzioni rilasciate.

### Tre livelli documentali
1. **Manuale generale \`guida.html\`**: aggiornare indice, procedure passo passo, pulsanti, limitazioni, sicurezza e link diretti per ciascuna nuova funzione o modifica sostanziale.
2. **Guida contestuale \`kyv-help.js\`**: per ogni pagina interessata, creare o aggiornare la chiave usata da \`loadKyvSidebar(page)\`. Il menu globale \`menu.js\` carica automaticamente \`kyv-help.js\` e aggiorna il popup ? relativo alla pagina. Le pagine standalone prive del menu devono includere un link diretto al relativo paragrafo in \`guida.html\`.
3. **Documentazione tecnica \`README.md\`**: elencare schema, migrazioni, test, limiti, requisiti, casi particolari e precauzioni di aggiornamento.

### Checklist obbligatoria prima del merge su main
- [ ] Elencare tutte le pagine e i flussi utente modificati nella PR.
- [ ] Per ciascuno, aggiornare la guida contestuale e/o il link alla sezione del manuale.
- [ ] Riflettere **soltanto** pulsanti, dati, stati e integrazioni realmente implementati, distinguendo operativo, incompleto e futuro.
- [ ] Descrivere esempi reali di utilizzo, percorsi per arrivare alla funzione, azioni che scrivono dati e come annullarle.
- [ ] Non inventare esiti e date di progetti, sessioni, ricavi e pagamenti; fee zero non implica insoluto.
- [ ] Verificare messaggi di errore, permessi, autorizzazioni necessarie e comportamento su telefono.
- [ ] Aggiornare test \`tools/test-guide-coverage.js\` e il registro pagine qui sotto se si aggiunge una nuova sezione di menu o una nuova pagina standalone.
- [ ] Includere \`guida.html\` e \`kyv-help.js\` nella PWA \`sw.js\`, ruotando la cache per la release.
- [ ] Eseguire \`npm run check\` e non integrare la PR con CI rossa.

### Registro delle pagine core, testate automaticamente
| Pagina | Chiave guida contestuale | Sezione manuale |
|---|---|---|
| \`kyv_scrivania_creativa.html\` | \`creative\` | \`#guida-creativa\` |
| \`kyv_audio_finder.html\` | \`audiofinder\` | \`#guida-audiofinder\` |
| \`kyv_analyst.html\` | \`analyst\` (standalone con link diretto) | \`#guida-analyst\` |
| \`fatture.html\` | \`fatture\` | \`#guida-economia\` |
| \`progetti.html\` | \`progetti\` | \`#guida-creativa\` |
| \`scheda_progetto.html\` | \`scheda\` | \`#guida-audiofinder\` |
| \`integrazioni.html\` | \`integrazioni\` | \`#novita-v245\` |
| \`kyv_drive.html\` | \`drive\` | \`#guida-audiofinder\` |
| \`kyv_dropbox.html\` | \`dropbox\` | \`#guida-audiofinder\` |

Se una pagina viene aggiunta o modificata, estendere qui il registro e aggiungere asserzioni mirate nel test. Il popup ? non deve mai mostrare il fallback generico per le nuove sezioni. Il manuale storico rimane disponibile ma **le istruzioni più recenti hanno priorità**.

### v2.47 — Regole dei duplicati e delle quote
Nella pagina Fatture il comando Duplica riga crea una quota, **non** un secondo record fiscale FATTURE. Aggiornare guida e test quando cambiano PrezzoUnitario, commissioni dei progetti o calcoli degli incassi; ImportoTotaleDocumento non è una base per le fee gestionali. Il modulo e le sue somme devono essere presenti nella cache PWA e nei test v2.47.

### Regola di distribuzione
Usare un branch GitHub per il pacchetto, eseguire la CI e fare **un solo squash merge**. Non accedere direttamente a Vercel salvo richiesta espressa o necessità reale. Verificare separatamente il comportamento nel browser autenticato; i test statici non provano i connettori Drive/Dropbox con account reali.
