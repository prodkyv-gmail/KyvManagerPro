# KYVManagerPro — Calendar e Drive, aggiornamento v285

## Risultato in KYVManagerPro
- Viste **Giorno, Settimana, Mese, Anno, Elenco**.
- Apertura della vista Giorno sulla data odierna; pulsante **Oggi** sempre disponibile.
- Navigazione libera nel passato e nel futuro. **Carica periodo** invia richieste per le date visualizzate.
- La vista Anno invia dodici richieste mensili, evitando la soglia di 45 giorni del servizio; i risultati parziali vengono segnalati.
- Nuovo evento: titolo, data, ora di inizio, ora di fine, descrizione e luogo facoltativi.
- La lettura e la creazione degli eventi passano esclusivamente tramite Google Apps Script. Il vecchio collegamento Google Calendar API OAuth 2.0 è stato rimosso dall'app.

## Pubblicazione Apps Script (intervento manuale necessario)
Il file completo da incollare è `integrations/google-apps-script/kyv-calendar-drive-v2.gs`.

1. Apri il progetto Apps Script già collegato alla voce Agenda (non crearne uno nuovo).
2. Prima, conserva una copia del vecchio codice.
3. Nel file che contiene il vecchio `doGet`, **sostituisci** quel codice con il contenuto di `kyv-calendar-drive-v2.gs`. Non lasciare due funzioni `doGet`.
4. Nelle impostazioni progetto Apps Script imposta il fuso orario **Europe/Rome**.
5. Esegui le autorizzazioni eventualmente richieste per Calendar e Drive.
6. Apri **Distribuisci → Gestisci deployment → Modifica → Nuova versione → Distribuisci**. Aggiorna il deployment **esistente**: così l'URL `/exec` rimane lo stesso.
7. Verifica prima `action=getEvents&startDate=2020-01-01&endDate=2020-02-01`, poi crea un appuntamento di prova da KYVManagerPro, controllando orari e descrizione sul calendario.

## Compatibilità
- `getEvents` senza periodo mantiene la lettura dei successivi 14 giorni per vecchi consumer.
- `getEvents&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`: intervallo con fine esclusiva, massimo 45 giorni.
- `createEvent&title=...&date=...&time=HH:MM&endTime=HH:MM&description=...&location=...`.
- Le chiamate legacy a `createEvent` senza `endTime` creano ancora una sessione di 2 ore.
- `getDriveFiles` conserva filtro MP3 >2MB, 20 file per pagina e token di continuazione.

## Protezione e limiti
- Il deploy sul repository/Vercel **non aggiorna automaticamente** il progetto Apps Script di Google: completare la pubblicazione indicata sopra.
- L'attuale Web App usa `doGet` anche per scrivere eventi: se il deployment Apps Script è accessibile pubblicamente, il suo URL potrebbe consentire chiamate dirette. Prima dell'uso in produzione è opportuno proteggere la scrittura con un segreto server-side o migrare la creazione eventi a un endpoint Vercel autenticato. Il solo controllo sessione nel proxy Vercel non protegge l'accesso diretto a `/exec`.
- I dati storici restano su Google Calendar. L'app non li importa in Supabase.
- La vista Anno usa 12 richieste: potrebbe risentire di limiti Apps Script o del proxy, e segnala ogni caricamento parziale. Non deve indicare come confermato un anno incompleto.

## Aggiornamento Agenda v287 — Storico e dettaglio eventi
- Giorno, Settimana e Mese caricano automaticamente ogni periodo selezionato, anche negli anni passati; il tasto `Carica periodo` rimane per ripetere la lettura.
- La vista Anno carica i 12 mesi in massimo 3 richieste contemporanee, senza richiedere un anno completo in una sola chiamata.
- In Elenco, `Aggiorna agenda` legge i **30 giorni precedenti e i 14 giorni successivi**, usando `startDate` e `endDate`. Per date più lontane usare Giorno/Settimana/Mese/Anno.
- Gli eventi sono selezionabili con click, tocco o tastiera; il popup mostra titolo, giorno, inizio e fine, descrizione e luogo (quando presenti nel payload).
- Il popup usa `textContent` per tutti i campi provenienti da Google, senza renderizzare HTML dell'evento.
- Se il deployment Apps Script risponde senza `range` coerente, l'interfaccia **non dichiara completo il periodo** e invita ad aggiornare il deployment di Google Apps Script.
- Non sono stati introdotti OAuth Google, tabelle Supabase o scritture ai dati storici.

## Aggiornamento v288 — Storico Google Calendar disattivato
- `getEvents` restituisce solo eventi da oggi in avanti; gli eventi passati non vengono letti. Non cancella appuntamenti su Google Calendar.
- Per compatibilità con Giorno/Settimana/Mese/Anno, una richiesta che include date precedenti conserva il `range` richiesto e aggiunge `historyDisabled:true`; il server interroga Google soltanto da oggi in avanti. Se tutto il periodo è nel passato, `events:[]` senza accesso al calendario.
- L'Agenda segnala espressamente che lo storico non è disponibile; i periodi interamente passati non generano chiamate Apps Script.
- L'Elenco legge oggi e i 14 giorni successivi, non più i 30 giorni precedenti.
- Creazione eventi, descrizione, orari, luogo e ricerca MP3 Drive restano invariati.
- **Pubblicazione manuale obbligatoria:** il codice nel repository non aggiorna il progetto Google Apps Script. Copiare `integrations/google-apps-script/kyv-calendar-drive-v2.gs` nel progetto esistente, salvare, quindi Distribuisci → Gestisci deployment → Modifica → Nuova versione → Distribuisci (mantenere lo stesso URL `/exec`).
