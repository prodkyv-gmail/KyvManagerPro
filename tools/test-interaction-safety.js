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
const releaseDesk = read('kyv-release-desk.js');
const interestToRelease = read('kyv-interest-to-release.js');
const versionToPitch = read('kyv-version-to-pitch.js');
const pitchFollowup = read('kyv-pitch-followup.js');
const sheetControls = read('kyv-sheet-controls.js');
const responsiveMenus = read('kyv-sheet-responsive-menus.js');
const sw = read('sw.js');
const config = read('config.js');

// Editor condiviso: patch-only, anti-race, relazioni confermate e concorrenza ottimistica.
assert.match(editor, /config\.fields\.filter\(key => Object\.prototype\.hasOwnProperty\.call\(row, key\)\)/, 'I record esistenti devono esporre solo campi esplicitamente configurati');
assert.match(editor, /if \(isExisting && comparableField\(key, active\.originalRow\?\.\[key\]\) === comparableField\(key, nextValue\)\) return;/, 'L’editor deve inviare solo campi realmente modificati');
assert.match(editor, /openToken/, 'Le aperture asincrone dell’editor devono avere un token anti-race');
assert.match(editor, /saving/, 'L’editor deve impedire submit concorrenti');
assert.match(editor, /Stai modificando una relazione del record/, 'Le modifiche alle relazioni devono richiedere conferma esplicita');
assert.match(editor, /kyvRecordEditorOwner/, 'Più istanze dell’editor non devono contendersi lo stesso modal senza ownership');
assert.ok(editor.includes('query = guardOriginal(query, key, active.originalRow?.[key])'), 'Ogni campo modificato deve essere protetto contro sovrascritture concorrenti');
assert.ok(editor.includes('Il record è cambiato da un’altra operazione'), 'Un conflitto concorrente deve fermare il salvataggio');
assert.ok(editor.includes('collegamento esistente'), 'Un ID_PROGETTO fuori dalla lista caricata deve restare rappresentato nel select');
assert.ok(editor.includes("if (!isExisting && nextValue === null) return;"), 'I nuovi record non devono scrivere null inutili al posto dei default DB');

// Scheda progetto legacy: il submit completo viene intercettato e trasformato in patch-only.
assert.match(config, /projectEditSafety\.src='kyv-project-edit-safety\.js'/, 'Il guard del quick edit deve essere caricato nella Scheda progetto');
assert.match(quickEditSafety, /stopImmediatePropagation\(\)/, 'Il guard deve fermare il submit legacy distruttivo');
assert.match(quickEditSafety, /if\(compare\(key,snapshot\.values\[key\]\)===compare\(key,next\)\)return;/, 'Il quick edit deve salvare solo differenze reali');
assert.match(quickEditSafety, /pid!==snapshot\.projectId/, 'Il quick edit deve annullarsi se il progetto cambia durante la modifica');
assert.match(quickEditSafety, /relationFields=new Set\(\['IDFT'\]\)/, 'Il collegamento fattura legacy deve essere protetto');

// Fatture: richieste fuori ordine, errori e relazioni moderne/legacy.
assert.match(invoices, /contextRefreshToken/, 'Le letture fatture devono scartare risposte asincrone obsolete');
assert.match(invoices, /token!==contextRefreshToken\|\|contextProjectId!==projectId/, 'Una risposta di un progetto precedente non deve aggiornare il progetto corrente');
assert.match(invoices, /return null;/, 'Un errore di lettura fatture deve essere distinto da un risultato vuoto');
assert.match(invoices, /Fatture non disponibili/, 'L’interfaccia deve mostrare esplicitamente gli errori di lettura fatture');
assert.match(invoices, /Collegamento al progetto non impostato/, 'La creazione fattura deve fallire chiusa se ID_PROGETTO non viene precompilato');
assert.match(invoices, /kyv:invoice-updated/, 'Il salvataggio fattura deve notificare gli altri moduli senza chiamate circolari');
assert.ok(invoices.includes('return uniqueInvoices([...direct,...legacy])'), 'Le fatture moderne e legacy devono essere unite, non sostituirsi a vicenda');
assert.ok(invoices.includes('return uniqueInvoices([...direct,...legacyMatches])'), 'La lista Progetti deve includere sia ID_PROGETTO sia IDFT/FT');
assert.ok(invoices.includes("projectInput.disabled=true"), 'Durante una nuova fattura contestuale ID_PROGETTO deve restare bloccato');
assert.ok(invoices.includes('listCoverageLimited'), 'I limiti di lettura non devono diventare falsi “nessuna fattura”');

// Riepilogo economico: nessun richiamo circolare, nessun falso vuoto e unione delle relazioni.
assert.doesNotMatch(finance, /KYV_PROJECT_INVOICES\?\.refresh/, 'Il riepilogo economico non deve richiamare direttamente il refresh del modulo fatture');
assert.match(finance, /kyv:invoice-updated/, 'Il riepilogo economico deve aggiornarsi tramite evento');
assert.match(finance, /rows===null/, 'Il riepilogo deve distinguere errore di lettura da assenza di fatture');
assert.match(finance, /Stato non disponibile/, 'Il riepilogo deve rendere visibile l’errore senza suggerire dati assenti');
assert.ok(finance.includes('return unique([...(direct.data||[]),...legacy])'), 'I totali economici devono includere fatture moderne e legacy');

// Release: la chiusura non deve distruggere note o sovrascrivere modifiche concorrenti.
assert.match(closeout, /update\(\{STATO:'Pubblicato'\}\)/, 'La chiusura release deve aggiornare soltanto STATO');
assert.doesNotMatch(closeout, /SVILUPPO:'Pubblicata'/, 'SVILUPPO non deve essere sovrascritto automaticamente');
assert.ok(closeout.includes("query=guardSnapshot(query,'STATO',p.STATO)"), 'La chiusura deve verificare che STATO non sia cambiato nel frattempo');
assert.ok(closeout.includes("query=guardSnapshot(query,'SVILUPPO',p.SVILUPPO)"), 'La chiusura deve verificare che SVILUPPO non sia cambiato nel frattempo');
assert.ok(closeout.includes('if(!data)throw new Error'), 'Se il record è cambiato la chiusura deve fermarsi senza sovrascrivere');
assert.ok(closeout.includes('if(text(data.SVILUPPO)!==text(p.SVILUPPO))'), 'La chiusura deve verificare che SVILUPPO sia rimasto invariato');
assert.ok(closeout.includes('function doneProject(p){return /pubblicat|chius|completat|finita/i.test(text(p?.STATO));}'), 'Lo stato di chiusura deve dipendere da STATO, non da testo libero in SVILUPPO');
assert.doesNotMatch(closeout, /observer\.observe\(root,\{childList:true,subtree:true,characterData:true\}\)/, 'Il closeout non deve osservare tutto il sottoalbero e autoalimentarsi');

// Observer sensibili: ogni modulo che usa Lucide dentro un observer deve avere un guard anti-riscrittura.
assert.ok(releaseDesk.includes('if(fp===lastFingerprint&&desk)return true'), 'Release Desk deve fermarsi prima di riscrivere il DOM se i dati non sono cambiati');
assert.ok(interestToRelease.includes('if(changed&&window.lucide)'), 'Interested → Release deve chiamare Lucide solo dopo vere modifiche DOM');
assert.ok(versionToPitch.includes('if(changed&&window.lucide)'), 'Version → Pitch deve chiamare Lucide solo dopo vere modifiche DOM');
assert.ok(versionToPitch.includes('observer?.disconnect(),120000'), 'Version → Pitch deve disconnettere l’observer dopo il periodo utile');
assert.ok(pitchFollowup.includes("else if(!document.getElementById('kyv-pitch-followup-project'))renderProjectPanel(id)"), 'Pitch deve evitare il rerender quando il pannello esiste già');
assert.ok(pitchFollowup.includes('projectObserver?.disconnect(),120000'), 'Pitch deve disconnettere l’observer di bootstrap');

// Foglio dati: filtri per colonna, suggerimenti liberi e REF protetti.
assert.ok(config.includes("sheetControls.src='kyv-sheet-controls.js'"), 'Progetti e Studio Editor devono caricare i controlli foglio condivisi');
assert.ok(config.includes("responsiveMenus.src='kyv-sheet-responsive-menus.js'"), 'Progetti e Studio Editor devono caricare la tipografia responsive dei menu');
assert.ok(sheetControls.includes("if(!['progetti.html','editor.html'].includes(page))return"), 'I controlli foglio devono restare confinati a Progetti e Studio Editor');
assert.ok(sheetControls.includes('projectColumnFilters=new Map()'), 'Progetti deve mantenere filtri per singola colonna');
assert.ok(sheetControls.includes('editorColumnFilters=new Map()'), 'Studio Editor deve mantenere filtri per singola colonna');
assert.ok(sheetControls.includes('relationTargets={'), 'I REF devono usare una mappa esplicita, non relazioni indovinate');
assert.ok(sheetControls.includes("ID_PROGETTO:{table:'PROGETTI'"), 'ID_PROGETTO deve puntare esplicitamente a PROGETTI');
assert.ok(sheetControls.includes("IDFT:{table:'FATTURE'"), 'IDFT deve puntare esplicitamente a FATTURE');
assert.ok(sheetControls.includes("Seleziona un riferimento esistente dall’elenco."), 'Un REF manuale inesistente deve essere rifiutato');
assert.ok(sheetControls.includes('Rimuovere il collegamento esistente da questo record?'), 'La rimozione di un REF esistente deve richiedere conferma esplicita');
assert.ok(sheetControls.includes('onSort:direction=>{sortDomTable(table,index,direction);markSort(table,index,direction);applyFilters(table,editorColumnFilters);}'), 'Il menu Editor deve rispettare esattamente crescente/decrescente senza toggle ambiguo');
assert.ok(sheetControls.includes('await safePatch({table,pk,rowId,column,original,next})'), 'La modifica intelligente deve passare dal salvataggio concorrente protetto');
assert.ok(sheetControls.includes("if(String(live)!==String(original??''))throw new Error"), 'Un valore cambiato altrove deve fermare il salvataggio');
assert.ok(sheetControls.includes('query.is(column,null):query.eq(column,current[column])'), 'L’update deve essere condizionato al valore originale del campo');
assert.ok(sheetControls.includes('observer.observe(table,{childList:true,subtree:true})'), 'L’unico observer del foglio deve essere confinato alla tabella Editor');
assert.doesNotMatch(sheetControls, /observer\.observe\(document\.documentElement/, 'Il foglio non deve introdurre observer globali sul documento');
assert.ok(responsiveMenus.includes('@media (max-width:1024px)'), 'La dimensione dei menu deve adattarsi ai tablet');
assert.ok(responsiveMenus.includes('@media (max-width:640px)'), 'La dimensione dei menu deve adattarsi agli smartphone');
assert.ok(responsiveMenus.includes('.kyv-sheet-values label'), 'I valori nei menu a tendina devono avere tipografia compatta');
assert.ok(responsiveMenus.includes('.kyv-cell-editor input'), 'Anche i menu/campi intelligenti dello Studio Editor devono essere ridimensionati');

// PWA: gli asset di sicurezza devono essere nello stesso ciclo cache del deploy.
assert.match(sw, /kyv-studio-v2-32-easy-secondary-v9-20261028/, 'Il service worker deve ruotare la cache per l’UX Progetti dello Studio Editor');
for (const asset of ['kyv-record-editor.js','kyv-project-invoices.js','kyv-project-finance-summary.js','kyv-project-hub-v3.js','kyv-pipeline-v4.js','kyv-today-home-v5.js','kyv-economy-v6.js','kyv-rights-v7.js','kyv-siae-import-guard.js','kyv-global-search-v8.js','kyv-easy-ux-v9.js','kyv-easy-secondary-v9.js','kyv-release-closeout.js','kyv-project-edit-safety.js','kyv-sheet-controls.js','kyv-sheet-responsive-menus.js','kyv-sheet-dropdown-fix.js','kyv-editor-relations.js','kyv-editor-project-fields.js','kyv-editor-primary-fields.js','kyv-nav-order.js']) {
  assert.ok(sw.includes(`'./${asset}'`), `${asset} deve essere incluso nell’APP_SHELL`);
}

console.log('OK: sicurezza interazioni, observer, fogli responsive e integrità relazioni verificata.');
