const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function assert(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1);}}
const fields=read('kyv-editor-project-fields.js');
const nav=read('kyv-nav-order.js');
const config=read('config.js');
const sw=read('sw.js');

assert(fields.includes("'ARTISTA','AUTORI','Label','MANAGEMENT','STATO','SVILUPPO'"),'campi progetto ricorrenti non coperti');
assert(fields.includes("from('PROGETTI').select(RECURRENT_FIELDS.join(','))"),'i valori delle tendine non vengono letti da PROGETTI');
assert(fields.includes("input.removeAttribute('list')"),'il datalist nativo non viene disattivato per le combobox custom');
assert(fields.includes('scrivine uno nuovo'),'le tendine devono consentire anche valori nuovi');
assert(fields.includes("type==='date'"),'i campi data non vengono preservati come input calendario');
assert(fields.includes("tr.dataset.kyvProjectRowId"),'le righe progetto non sono marcate per apertura modifica');
assert(fields.includes("isInteractiveTarget(event.target)"),'il click riga non protegge controlli interattivi');
assert(fields.includes("cell.removeAttribute('contenteditable')"),'Progetti mantiene editing inline in conflitto col click riga');
assert(nav.includes("a[href=\"ascolto.html\"]")&&nav.includes("a[href=\"pipeline.html\"]"),'riordino Ascolto/Pipeline mancante');
assert(nav.includes('Pipeline & opportunità'),'etichetta Pipeline non aggiornata');
assert(config.includes("editorProjectFields.src='kyv-editor-project-fields.js'"),'config non carica smart fields');
assert(config.includes("navOrder.src='kyv-nav-order.js'"),'config non carica ordine navigazione');
assert(sw.includes("'./kyv-editor-project-fields.js'"),'PWA non include smart fields');
assert(sw.includes("'./kyv-nav-order.js'"),'PWA non include nav order');
console.log('OK: Studio Editor Progetti usa campi tipizzati, valori reali e apertura riga sicura.');
