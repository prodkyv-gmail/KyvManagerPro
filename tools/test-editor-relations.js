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

// Colonne nascoste: il menu fattura deve finire nella colonna IDFT, mai in quella accanto (regressione STRUMENTI_SUONATI).
assert(
  relations.includes("th[data-sort]") && !relations.includes("const keys=Object.keys(dataArray[0]||{})"),
  'Le relazioni devono seguire le colonne mostrate nell\'intestazione, non l\'indice di tutte le colonne dei dati'
);
const vm = require('vm');
const host = {};
vm.runInNewContext(relations, {
  window: host,
  location: { pathname: '/editor.html' },
  document: { readyState: 'complete', addEventListener() {}, getElementById() { return null; }, head: { appendChild() {} }, createElement() { return { style: {} }; } },
  setInterval() { return 0; }, clearInterval() {}, setTimeout() { return 0; }
});
const api = host.KYV_EDITOR_RELATIONS;
assert(api && typeof api.relationColumnsFor === 'function', 'API di prova non disponibile');
const all = ['ID', 'TITOLO', 'ARTISTA', 'Strumenti_Suonati_Kyv', 'IDFT', 'NOTE'];
assert.deepEqual(api.relationColumnsFor(all).map(c => [c.key, c.index]), [['IDFT', 4]]);
const shown = ['ID', 'TITOLO', 'Strumenti_Suonati_Kyv', 'IDFT', 'NOTE']; // ARTISTA nascosta
assert.deepEqual(api.relationColumnsFor(shown).map(c => [c.key, c.index]), [['IDFT', 3]], 'con una colonna nascosta l\'indice cambia');
assert.deepEqual(api.relationColumnsFor(['ID', 'Strumenti_Suonati_Kyv']), [], 'IDFT nascosta: nessun menu in altre colonne');

assert.match(relations,/\.select\('ID,TITOLO,ARTISTA',\{count:'exact'\}\)/);
assert.match(relations,/\.select\('ID_FT,Numero,Denominazione,Data',\{count:'exact'\}\)/);
assert.match(relations,/data\.length!==count/,'Relazioni non possono usare elenchi parziali come completi');
assert.match(relations,/kyv-modal-relation-read-warning/);
assert.match(relations,/kyv-inline-relation-read-warning/);
assert.match(relations,/Collegamenti non verificabili/);
assert.match(relations,/Relazioni non verificabili/);
assert.match(relations,/if\(error\)throw error/,'Errori Supabase non diventano elenchi vuoti');

console.log('Controlli relazioni Studio Editor: OK');
