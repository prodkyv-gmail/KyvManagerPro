const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8');}
function assert(cond,msg){if(!cond){console.error('FAIL:',msg);process.exit(1);}}
const fields=read('kyv-editor-invoice-fields.js');
const config=read('config.js');
const sw=read('sw.js');

assert(fields.includes("'Denominazione','CodiceDestinatario','Cognome','Indirizzo7','NumeroCivico8','CAP9'"),'campi fattura ricorrenti non coperti');
assert(fields.includes("from('FATTURE').select('*').limit(1000)"),'i valori delle tendine non vengono letti da FATTURE');
assert(fields.includes("input.removeAttribute('list')"),'il datalist nativo non viene disattivato per le combobox fattura');
assert(fields.includes('scrivine uno nuovo'),'le tendine fattura devono consentire anche valori nuovi');
assert(fields.includes("input.type='date'"),'Data non viene preservata come calendario');
assert(fields.includes("key==='Numero'"), 'Numero fattura non viene tipizzato come numerico');
assert(fields.includes("tr.dataset.kyvInvoiceRowId"),'le righe fattura non sono marcate per apertura modifica');
assert(fields.includes("isInteractiveTarget(event.target)"),'il click riga fattura non protegge controlli interattivi');
assert(fields.includes("cell.removeAttribute('contenteditable')"),'Fatture mantiene editing inline in conflitto col click riga');
assert(fields.includes("loadValues(true)"),'i valori ricorrenti non vengono aggiornati al reload della tabella');
assert(fields.includes("refresh('')"),'l’apertura della tendina deve mostrare tutti i valori prima del filtro');
assert(!fields.includes('MutationObserver'),'il modulo fatture non deve introdurre nuovi observer');
assert(!fields.includes('lucide.createIcons'),'il modulo fatture non deve introdurre loop Lucide');
assert(config.includes("editorInvoiceFields.src='kyv-editor-invoice-fields.js'"),'config non carica la UX Fatture');
assert(sw.includes("'./kyv-editor-invoice-fields.js'"),'PWA non include la UX Fatture');
console.log('OK: Studio Editor Fatture usa campi tipizzati, valori reali e apertura riga sicura.');
