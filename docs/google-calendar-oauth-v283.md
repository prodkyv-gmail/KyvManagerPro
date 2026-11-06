# KYVManagerPro — Google Calendar API + OAuth 2.0 (prima fase)

## Stato e limiti
Questa integrazione è **opzionale e in sola lettura**. La schermata Agenda continua a usare Google Apps Script per l'Elenco generale e per la creazione di appuntamenti. Quando OAuth è collegato, il tasto **Carica periodo** in Settimana/Mese usa Google Calendar API ufficiale; quando non è collegato, continua il percorso Apps Script.

I token Google sono in un cookie **HttpOnly, Secure, SameSite=Lax e AES-256-GCM cifrato**, limitato al singolo browser/dispositivo, e associato all'ID Supabase dell'utente che ha avviato il consenso. I token non sono visibili da JavaScript. Il cookie dura 30 giorni e può essere rinnovato solo attraverso una nuova autorizzazione; i refresh token di Google in modalità *Testing* possono scadere prima (normalmente dopo 7 giorni). **Non è una sincronizzazione multi-dispositivo o in background.** Non aggiunge tabelle né bucket Supabase.

## Configurazione Vercel (solo variabili server; NON incollarle in chat/GitHub)

Nel progetto Vercel `kyvmanagerpro-db/kyvmanagerpro`, aprire **Settings → Environment Variables** e configurare per **Production**:

| Variabile | Contenuto |
| --- | --- |
| `KYV_GOOGLE_OAUTH_CLIENT_ID` | Client ID del client Google Cloud *Applicazione web* |
| `KYV_GOOGLE_OAUTH_CLIENT_SECRET` | Client Secret dello stesso client |
| `KYV_GOOGLE_OAUTH_COOKIE_KEY` | 32 byte casuali, in esadecimale (**64 caratteri hex**) |
| `KYV_GOOGLE_CALENDAR_EMAIL` | Indirizzo esatto dell'account Calendar consentito (es. `prodkyv@gmail.com`) |

Per generare la cookie key su un PC con Node.js: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. La chiave deve essere **segreta**, e cambiarla disconnetterà tutti i browser. Evitare il log di chiavi, callback URL con `code` e token.

Non impostare il Client Secret come variabile `VITE_*` / `NEXT_PUBLIC_*` o in `config.js`. Il codice di questa fase resta spento se le quattro variabili sono assenti.

## Google Cloud: OAuth

Google Auth Platform → Client, tipo **Applicazione web**. URI redirect autorizzato **esatto**:

`https://kyvmanagerpro-kyvmanagerpro-db.vercel.app/api/google-calendar/callback`

Origine JavaScript autorizzata (se richiesta):

`https://kyvmanagerpro-kyvmanagerpro-db.vercel.app`

Google Calendar API abilitata. In **Data Access / Scopes**, l'app chiede `openid`, `email` e `https://www.googleapis.com/auth/calendar.events.readonly`. In **Audience**, se *Testing* e *External*, aggiungere l'account Google come utente di test. Se Google richiede verifica prima della pubblicazione in produzione, seguire la procedura ufficiale, senza disattivare controlli di sicurezza.

## Collaudo

1. Solo dopo aver predisposto le variabili server, effettuare un nuovo deployment Vercel; la UI mostrerà la disponibilità.
2. Accedere a KYVManagerPro sulla URL canonica, aprire **Agenda → Collega Google Calendar** e autorizzare **l'account esatto** configurato.
3. Verificare la comparsa di "Google Calendar API collegata". In Settimana/Mese premere **Carica periodo** e confrontare gli eventi con Google Calendar. Testare un mese lontano, ricorrenze, eventi giornalieri e più di 120 eventi.
4. Verificare che **Crea su Calendar** e **Aggiorna agenda** funzionino ancora usando Apps Script.
5. Verificare **Disconnetti su questo dispositivo**, accesso da utente Supabase diverso e refresh su pagina.
6. Su altri browser/dispositivi è necessario collegare Google separatamente. Prima di supportare sincronizzazione senza utente attivo o multi-account, progettare una custodia token server-side condivisa: **non** copiarli nei campi di database esistenti.

## Note di sicurezza
- `/start` e `/disconnect` richiedono sessione Supabase valida e `Origin` canonico.
- Il callback verifica il valore casuale `state` tramite cookie cifrato, con scadenza 10 minuti, poi verifica l'email restituita da Google. Dopo la risposta reindirizza all'Agenda rimuovendo il codice OAuth dall'URL.
- `/events` richiede sessione Supabase valida, cookie cifrato e corrispondenza dell'utente proprietario. Intervalli da 1 a 45 giorni, eventi ricorrenti espansi, massimo 120 risultati mostrati e flag `truncated`.
- Nessun token OAuth viene inviato al frontend; non raccogliere Client Secret in chat.
- L'integrazione non modifica la configurazione del proxy Apps Script, la creazione eventi, il database Supabase o le formule economiche.
