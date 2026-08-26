# KYV Manager Pro v2.20 — Percorso Brano

## Obiettivo

Seguire il lavoro reale: contatto e brief, sessione, produzione, voce/versioni, master e invio, diritti/documenti, fattura e incasso.

## Cambiamenti principali

- `Percorso Brano` è nella navigazione principale desktop e mobile.
- La pagina offre tre ingressi chiari: contatto, Google Drive e Dropbox.
- Da un file audio si può creare un progetto o collegare una nuova versione a un progetto esistente.
- Il modulo riconosce in modo indicativo Demo, Produzione, Voce, Mix, Master e Stems e prova a leggere versioni come v1/v2/finale.
- La data sessione non viene più impostata automaticamente: va confermata dall'utente.
- Il link del singolo file non viene più salvato come cartella generale del progetto.
- Le versioni Dropbox usano `DROPBOX_AUDIO_FILES`; le versioni Google Drive usano `DOCUMENTI_PROGETTO` con tipo `AUDIO_DRIVE`.
- La Scheda Progetto mostra Drive e Dropbox in un unico archivio versioni.
- Le guide contestuali di Percorso, Drive e Dropbox spiegano il nuovo flusso.
- Il comando tecnico SQL follow-up è stato tolto dalla schermata quotidiana.

## Compatibilità dati

Non vengono create nuove tabelle. I dati già presenti restano compatibili e non sono previste operazioni distruttive.

## Prova consigliata

1. Aprire `Percorso Brano`.
2. Scegliere `Da Google Drive` e collegare un file a un progetto esistente.
3. Tornare alla Scheda Progetto e verificare la versione nella sezione Produzione.
4. Ripetere con un file Dropbox non ancora collegato.
5. Provare `Da contatto / brief` e controllare che il modulo Nuovo Progetto si apra automaticamente.
