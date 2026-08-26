# KYV Studio Manager Pro — editor fatture e guida globale v2.15

## Fatture

- Ogni riga è cliccabile.
- Il click apre tutti i campi reali del record.
- I campi vuoti possono essere completati senza passare dallo Studio Editor.
- PAGATA e PAGAMENTO usano una scelta Sì/No.
- ID Progetto diventa un elenco leggibile con titolo e artista.
- Il pulsante **Nuova** crea una nuova fattura con i campi principali.
- Dopo il salvataggio, totali ed elenchi vengono ricaricati.

## Correlazione fatture

- Il click sulla riga apre la fattura.
- Il click sul badge del progetto apre invece il progetto collegato.
- Fattura e progetto usano lo stesso editor condiviso.
- Quando manca il collegamento, l’editor della fattura permette di scegliere il progetto.
- Le righe diventano schede leggibili su smartphone.

## Guida contestuale

- Il pulsante **?** è flottante e sempre raggiungibile.
- La guida si apre anche con la sidebar chiusa.
- È presente in tutte le pagine, compreso Login.
- Fatture e Correlazione hanno istruzioni aggiornate sui nuovi comandi.
- Diagnostica e Calendario hanno ora una spiegazione dedicata.
- Il popup si chiude cliccando sullo sfondo o premendo Esc.

## Sicurezza

- Nessuna tabella o colonna Supabase aggiunta.
- Gli identificativi primari non vengono mostrati tra i campi modificabili.
- I campi tecnici `created_at`, `updated_at` e `_RowNumber` sono esclusi.
- Non è stata aggiunta alcuna funzione di eliminazione.
