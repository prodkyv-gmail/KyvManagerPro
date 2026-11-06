# KYVManagerPro — Calendar e Drive, aggiornamento v285

## Risultato in KYVManagerPro
- Viste **Giorno, Settimana, Mese, Anno, Elenco**.
- Apertura della vista Giorno sulla data odierna; pulsante **Oggi** sempre disponibile.
- Navigazione libera nel passato e nel futuro. **Carica periodo** invia richieste per le date visualizzate.
- La vista Anno invia dodici richieste mensili, evitando la soglia di 45 giorni del servizio; i risultati parziali vengono segnalati.
- Nuovo evento: titolo, data, ora di inizio, ora di fine, descrizione e luogo facoltativi.
- Modalità OAuth ufficiale rimane opzionale e in sola lettura; Apps Script rimane per la creazione.

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
