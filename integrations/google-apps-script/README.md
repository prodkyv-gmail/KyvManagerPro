# KYVManagerPro — collegamento Apps Script per Agenda a intervalli

**Stato:** adapter preparato in GitHub; **NON installato né pubblicato sul progetto Apps Script reale**. Il Web App Google esistente non è gestito da questo repository. Nessuna modifica al calendario reale è stata eseguita.

## Obiettivo
Le viste Settimana e Mese inviano al proxy autenticato `getEvents?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (fine **esclusiva**). Un intervallo è confermato **solo** se la risposta contiene `range.startDate` e `range.endDate` identici alla richiesta. Il metodo `getEvents` senza date e la creazione `createEvent` non cambiano.

## Installazione nel progetto Apps Script esistente

1. Aprire il progetto Apps Script **attualmente pubblicato** per l'account Google Calendar configurato, senza crearne un secondo. Prima fare una copia/versione del codice originario.
2. Creare un file script `calendar-range-adapter.gs` copiando il contenuto di [calendar-range-adapter.gs](./calendar-range-adapter.gs).
3. Nella diramazione `getEvents` del **doGet esistente**, **dopo i controlli attuali di autenticazione, autorizzazione e proxySecret**, inserire:

```js
if (e.parameter.startDate || e.parameter.endDate) {
  return jsonResponse_(kyvGetEventsPeriod_(e.parameter, calendar));
}
```

`jsonResponse_` è un segnaposto: sostituirlo con la funzione di risposta JSON già esistente. `calendar` deve essere lo stesso oggetto CalendarApp usato dal precedente ramo `getEvents`; non assumere un account differente. Non sostituire tutto il doGet e non bypassare gli eventuali controlli di accesso.

4. Eseguire test con un calendario di prova e date che includano: settimana normale, mese senza eventi, evento tutto il giorno, eventi ricorrenti, oltre 120 eventi e data non valida. Controllare il fuso orario dello script, preferibilmente **Europe/Rome**, e quello del calendario.
5. **Solo dopo** le verifiche pubblicare una nuova versione dello stesso deployment Web App. Conservare l'URL esistente e verificare che `getEvents` senza intervallo e `createEvent` funzionino come prima.

## Contratto risposta

```json
{
  "events": [
    {"title": "Sessione", "date": "2026-11-06T09:00:00.000Z"},
    {"title": "Giornata", "date": "2026-11-07"}
  ],
  "range": {"startDate": "2026-11-01", "endDate": "2026-12-01"},
  "truncated": false
}
```

L'intervallo di lettura non può superare **45 giorni**. Il backend restituisce al massimo **120 eventi** e imposta `truncated: true` se ne esistono altri; la UI avverte allora che non è una lettura completa. **Non** dichiarare un intervallo completo quando il backend legacy ignora le date.

## Verifica del rilascio

- Controllare che il proxy Vercel continui a essere autenticato e inoltri `startDate`/`endDate`; non passare segreti in URL pubblici e non modificarne la allowlist senza necessità.
- Verificare la vista Elenco, il pulsante Carica periodo, avanti/indietro, Oggi e il comportamento dopo un errore.
- Nessuna modifica allo schema Supabase o ai dati storici.
- Se il servizio non conferma `range`, **non** considerare il periodo verificato e lasciare intatta la gestione preesistente.
