const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function assert(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1);}}
const fields=read('kyv-editor-project-fields.js');
const nav=read('kyv-nav-order.js');
const producer=read('kyv-producer-mode.js');
const config=read('config.js');
const sw=read('sw.js');

assert(fields.includes("'ARTISTA','AUTORI','Label','MANAGEMENT','STATO','SVILUPPO'"),'campi progetto ricorrenti non coperti');
assert(fields.includes("from('PROGETTI').select(RECURRENT_FIELDS.join(','),{count:'exact'})"),'i valori delle tendine devono leggere PROGETTI con totale verificabile');
assert(fields.includes('data.length!==count'),'La combobox deve segnalare suggerimenti parziali');
assert(fields.includes('state.values=null;')&&fields.includes('throw error;'),'Errore dei valori già usati non può diventare un suggerimento vuoto in cache');
assert(fields.includes('kyv-project-combo-read-warning')&&fields.includes('Suggerimenti non verificabili'),'Studio Editor deve mostrare il fallimento della lettura senza cancellare valori');
assert(fields.includes("input.removeAttribute('list')"),'il datalist nativo non viene disattivato per le combobox custom');
assert(fields.includes('scrivine uno nuovo'),'le tendine devono consentire anche valori nuovi');
assert(fields.includes("type==='date'"),'i campi data non vengono preservati come input calendario');
assert(fields.includes("tr.dataset.kyvProjectRowId"),'le righe progetto non sono marcate per apertura modifica');
assert(fields.includes("isInteractiveTarget(event.target)"),'il click riga non protegge controlli interattivi');
assert(fields.includes("cell.removeAttribute('contenteditable')"),'Progetti mantiene editing inline in conflitto col click riga');
const primary=producer.split('const primary=[')[1]?.split('];')[0]||'';
const control=producer.split('const control=[')[1]?.split('];')[0]||'';
const tools=producer.split('const tools=[')[1]?.split('];')[0]||'';
assert(control.includes("['ascolto.html'")&&control.includes("['pipeline.html'"),'Ascolto/Pipeline devono essere in Amministrazione');
assert(control.indexOf("['pipeline.html'")<control.indexOf("['ascolto.html'"),'Pipeline precede Ascolto nella sorgente di Amministrazione');
assert(control.includes('Pipeline & opportunità'),'etichetta Pipeline non aggiornata');
assert(!tools.includes("['pipeline.html'")&&!primary.includes("['pipeline.html'"),'Pipeline deve comparire una sola volta');
assert(primary.includes("['editor.html'"),'Studio Editor appartiene a Produttore');
assert(!nav.includes('setInterval(')&&!nav.includes('insertBefore('),'Il vecchio nav-order non deve più riordinare il DOM');
assert(config.includes("editorProjectFields.src='kyv-editor-project-fields.js'"),'config non carica smart fields');
assert(config.includes("navOrder.src='kyv-nav-order.js'"),'config non carica ordine navigazione');
assert(sw.includes("'./kyv-editor-project-fields.js'"),'PWA non include smart fields');
assert(sw.includes("'./kyv-nav-order.js'"),'PWA non include nav order');
console.log('OK: Studio Editor Progetti usa campi tipizzati, valori reali e apertura riga sicura.');
