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
