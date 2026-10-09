const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const config = read('config.js');
const relations = read('kyv-editor-relations.js');

assert(
  config.includes("editorRelations.src='kyv-editor-relations.js'"),
  'Studio Editor deve caricare il modulo dei selettori relazionali'
);
assert(
  relations.includes("from('PROGETTI')") && relations.includes("from('FATTURE')"),
  'I menu relazione devono leggere Progetti e Fatture esistenti'
);
assert(
  relations.includes("key==='ID_PROGETTO'") && relations.includes("toUpperCase()==='IDFT'"),
  'Devono essere gestite entrambe le direzioni Fattura → Progetto e Progetto → Fattura'
);
assert(
  relations.includes("document.createElement('select')") &&
  relations.includes('kyv-inline-relation-select') &&
  relations.includes('kyv-editor-relation-select'),
  'Le relazioni devono usare veri select e non semplici input/datalist'
);
assert(
  relations.includes("select.dataset.kyvSearchable='true'") && relations.includes('KYV_SELECTS.refreshSelect'),
  'I select del popup devono essere ricercabili'
);
assert(
  relations.includes('.maybeSingle()') && relations.includes('query.is(field,null)') && relations.includes('query.eq(field,oldValue)'),
  'La modifica inline della relazione deve proteggere da sovrascritture concorrenti'
);
assert(
  !relations.includes('new MutationObserver') && !relations.includes('lucide.createIcons'),
  'Il fix relazioni non deve introdurre observer o loop Lucide'
);

console.log('Controlli relazioni Studio Editor: OK');
