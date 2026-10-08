const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const editor = read('kyv-record-editor.js');
const invoices = read('kyv-project-invoices.js');
const finance = read('kyv-project-finance-summary.js');
const closeout = read('kyv-release-closeout.js');
const quickEditSafety = read('kyv-project-edit-safety.js');
const sw = read('sw.js');
const config = read('config.js');

// Editor condiviso: niente riscrittura dell'intero record, niente race fra aperture, relazioni confermate.
assert.match(editor, /config\.fields\.filter\(key => Object\.prototype\.hasOwnProperty\.call\(row, key\)\)/, 'I record esistenti devono esporre solo campi esplicitamente configurati');
assert.match(editor, /if \(isExisting && comparableField\(key, active\.originalRow\?\.\[key\]\) === comparableField\(key, nextValue\)\) return;/, 'L’editor deve inviare solo campi realmente modificati');
assert.match(editor, /openToken/, 'Le aperture asincrone dell’editor devono avere un token anti-race');
assert.match(editor, /saving/, 'L’editor deve impedire submit concorrenti');
assert.match(editor, /Stai modificando una relazione del record/, 'Le modifiche alle relazioni devono richiedere conferma esplicita');
assert.match(editor, /kyvRecordEditorOwner/, 'Più istanze dell’editor non devono contendersi lo stesso modal senza ownership');

// Scheda progetto legacy: il submit completo viene intercettato e trasformato in patch-only.
assert.match(config, /projectEditSafety\.src='kyv-project-edit-safety\.js'/, 'Il guard del quick edit deve essere caricato nella Scheda progetto');
assert.match(quickEditSafety, /stopImmediatePropagation\(\)/, 'Il guard deve fermare il submit legacy distruttivo');
assert.match(quickEditSafety, /if\(compare\(key,snapshot\.values\[key\]\)===compare\(key,next\)\)return;/, 'Il quick edit deve salvare solo differenze reali');
assert.match(quickEditSafety, /pid!==snapshot\.projectId/, 'Il quick edit deve annullarsi se il progetto cambia durante la modifica');
assert.match(quickEditSafety, /relationFields=new Set\(\['IDFT'\]\)/, 'Il collegamento fattura legacy deve essere protetto');

// Fatture: richieste fuori ordine e letture fallite non possono diventare falsi “nessuna fattura”.
assert.match(invoices, /contextRefreshToken/, 'Le letture fatture devono scartare risposte asincrone obsolete');
assert.match(invoices, /token!==contextRefreshToken\|\|contextProjectId!==projectId/, 'Una risposta di un progetto precedente non deve aggiornare il progetto corrente');
assert.match(invoices, /return null;/, 'Un errore di lettura fatture deve essere distinto da un risultato vuoto');
assert.match(invoices, /Fatture non disponibili/, 'L’interfaccia deve mostrare esplicitamente gli errori di lettura fatture');
assert.match(invoices, /Collegamento al progetto non impostato/, 'La creazione fattura deve fallire chiusa se ID_PROGETTO non viene precompilato');
assert.match(invoices, /kyv:invoice-updated/, 'Il salvataggio fattura deve notificare gli altri moduli senza chiamate circolari');

// Riepilogo economico: nessun richiamo circolare al modulo fatture e nessun falso vuoto su errore.
assert.doesNotMatch(finance, /KYV_PROJECT_INVOICES\?\.refresh/, 'Il riepilogo economico non deve richiamare direttamente il refresh del modulo fatture');
assert.match(finance, /kyv:invoice-updated/, 'Il riepilogo economico deve aggiornarsi tramite evento');
assert.match(finance, /rows===null/, 'Il riepilogo deve distinguere errore di lettura da assenza di fatture');
assert.match(finance, /Stato non disponibile/, 'Il riepilogo deve rendere visibile l’errore senza suggerire dati assenti');

// Release: la chiusura non deve distruggere note o relazioni.
assert.match(closeout, /update\(\{STATO:'Pubblicato'\}\)/, 'La chiusura release deve aggiornare soltanto STATO');
assert.doesNotMatch(closeout, /SVILUPPO:'Pubblicata'/, 'SVILUPPO non deve essere sovrascritto automaticamente');
assert.match(closeout, /data\?\.SVILUPPO/, 'La chiusura deve verificare che SVILUPPO sia rimasto invariato');
assert.match(closeout, /function doneProject\(p\)\{return \/pubblicat\|chius\|completat\|finita\/i\.test\(text\(p\?\.STATO\)\);\}/, 'Lo stato di chiusura deve dipendere da STATO, non da testo libero in SVILUPPO');
assert.doesNotMatch(closeout, /observer\.observe\(root,\{childList:true,subtree:true,characterData:true\}\)/, 'Il closeout non deve osservare tutto il sottoalbero e autoalimentarsi');

// PWA: gli asset di sicurezza devono essere nello stesso ciclo cache del deploy.
assert.match(sw, /kyv-studio-v2-32-safety-20261008/, 'Il service worker deve usare una cache nuova dopo l’hardening');
for (const asset of ['kyv-record-editor.js','kyv-project-invoices.js','kyv-project-finance-summary.js','kyv-release-closeout.js','kyv-project-edit-safety.js']) {
  assert.ok(sw.includes(`'./${asset}'`), `${asset} deve essere incluso nell’APP_SHELL`);
}

console.log('OK: sicurezza interazioni e integrità relazioni verificata.');
