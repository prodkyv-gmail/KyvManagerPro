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
- **Sincronizza Ora**: Aggiorna calendario/eventi.
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
- **Sincronizza Ora**: Aggiorna calendario/eventi.
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
