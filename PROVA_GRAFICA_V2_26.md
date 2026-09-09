# Prova v2.26 — Centro operativo

## Ambito

- Nessuna modifica allo schema Supabase.
- Client database unico tramite `KYV.createSupabaseClient()` e `KYV_CONFIG`.
- Compatibilità con la sessione Supabase Auth e con le policy RLS già attive.

## Panoramica

La coda **Attività da chiudere** include un nuovo tipo `followup` ricavato dai campi già presenti in `PROGETTI`:

- `Prossimo_Followup` determina scadenza e urgenza temporale;
- `Priorita_Followup` aumenta o riduce la priorità della riga;
- `Ultimo_Sollecito` evidenzia i follow-up senza nuova data che sono fermi da almeno dieci giorni;
- `Esito_Ascolto` e `Note_Followup` sono visibili nel dettaglio sintetico;
- ogni attività apre `scheda_progetto.html?id=<ID>`.

Il filtro **Follow-up** isola queste attività. Il riquadro **Stato operativo** mostra il totale dei follow-up e quanti richiedono attenzione immediata.

## Verifiche previste

1. Controlli statici JavaScript e riferimenti agli asset locali.
2. Build Vercel del branch.
3. Preview Vercel e verifica visiva della pagina, del filtro e dei collegamenti.
