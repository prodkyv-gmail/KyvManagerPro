// v2.77 — Studio Editor view cache and column control regression.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const src=read('kyv-editor-view-v277.js'),html=read('editor.html'),css=read('kyv-operational-ui-v276.css');
const host={};vm.runInNewContext(src,{window:host});const API=host.KYV_EDITOR_VIEW_V277;
assert.ok(API&&typeof API.create==='function');
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const parseSort=v=>v==null||v===''?{empty:true,type:'empty',value:''}:{empty:false,type:typeof v==='number'?'number':'text',value:v};
const cache=API.create({normalize,parseSort});
const rows=[
 {ID:1,TITOLO:'Caffè amaro',ARTISTA:'Emma',NOTE:'provino'},
 {ID:2,TITOLO:'Amore mio',ARTISTA:'Malika',NOTE:'testo lento'},
 {ID:3,TITOLO:'Notturno',ARTISTA:'Joseph',NOTE:'demo amaranto'},
 {ID:4,TITOLO:'Estate',ARTISTA:'Emma',NOTE:'niente'}
];
const ids=v=>Array.from(v,x=>x.ID);
cache.setRows(rows);
let a=cache.select({query:'am'});
assert.deepEqual(ids(a),[1,2,3]);
assert.strictEqual(cache.select({query:'am'}),a,'Same criteria reuses result instead of filtering on load more');
let next=cache.select({query:'ama'});
assert.deepEqual(ids(next),[1,3],'Longer query should narrow safely from previous result');
assert.deepEqual(ids(cache.select({query:'am'})),[1,2,3],'Shortened query must search all records again');
assert.deepEqual(ids(cache.select({query:'emma'})),[1,4],'Search uses all columns, including hidden');
assert.deepEqual(ids(cache.select({query:'caffe'})),[1],'Accent normalization unchanged');
assert.deepEqual(ids(cache.select({query:'am',sortColumn:'ID',descending:true})),[3,2,1],'Sort must use verified full results');
assert.deepEqual(ids(cache.select({query:'am',sortColumn:'ID',descending:false})),[1,2,3],'Sort reversal must recalculate');
assert.deepEqual(ids(cache.select({sortColumn:'ID',descending:true})),[4,3,2,1],'Empty query must see every loaded record');
rows[0].TITOLO='Pezzo diverso';
cache.invalidate();
assert.deepEqual(ids(cache.select({query:'caffe'})),[],'Successful inline write invalidates cached search');
assert.deepEqual(ids(cache.select({query:'emma'})),[1,4],'Invalidation preserves other fields');
cache.setRows([{ID:5,TITOLO:'Nuovo brano'}]);
assert.deepEqual(ids(cache.select({query:'am'})),[],'Table change must replace old dataset');
assert.deepEqual(ids(cache.select({query:'nuovo'})),[5],'New dataset can be filtered');
cache.setRows([]);
assert.deepEqual(ids(cache.select({query:'nuovo'})),[],'Load failure must clear cached results');
assert.equal((html.match(/id="editor-column-search"/g)||[]).length,1);
assert.equal((html.match(/id="editor-column-visible-only"/g)||[]).length,1);
assert.equal((html.match(/id="editor-column-selection-count"/g)||[]).length,1);
assert.ok(html.includes('function applyEditorColumnPickerFilters()')&&html.includes('label.hidden=!match'),'Column search affects picker labels only');
assert.ok(html.includes('data-editor-column=')&&html.includes('window.KYV_EDITOR_COLUMNS?.set('),'Existing one-column-visible safety enforced');
assert.ok(html.includes('renderColumnPicker();')&&html.includes('applyEditorColumnPickerFilters();'),'Picker state refreshed after visibility changes');
assert.ok(html.includes("window.KYV_EDITOR_COLUMNS?.showAll(currentEditorTable)"),'Show-all remains table-scoped');
assert.ok(html.includes("editorViewEngine.setRows(processedData)"),'Successful read resets view cache');
assert.ok(html.includes('editorViewEngine.invalidate();'),'Successful inline update invalidates cache');
assert.ok(html.includes("if (searchInput && changingTable) searchInput.value = ''"),'Same-table refresh must retain search; table change clears it');
assert.ok(html.includes('clearTimeout(window.debounceTimer);'),'Refresh clears pending search input debounce');
assert.ok(html.includes('return editorViewEngine.select({'),'Current UI must use shared view cache');
assert.ok(html.includes('editorShownRows += EDITOR_ROWS_STEP'),'Progressive UI remains intact');
assert.ok(html.includes('KYV_EDITOR_READ_V267.readComplete('),'Complete verified data remains');
assert.ok(html.includes('currentEditorData.forEach(row => csv +='),'CSV must include every raw record');
assert.ok(html.includes("const keys = Object.keys(currentEditorData[0])"),'CSV includes every raw column');
assert.ok(html.includes("document.getElementById('editor-columns-toggle')?.focus()"),'Esc returns keyboard focus');
assert.match(css,/#editor-column-panel #editor-column-list label\[hidden\]\{display:none!important\}/);
assert.match(css,/@media\(max-width:767px\)/);
assert.doesNotMatch(src,/\.from\(|MutationObserver|localStorage|fetch\(/,'View helper must have no DB, observer or storage access');
assert.equal(read('VERSION').trim(),'2.81');
assert.equal(require('../package.json').version,'2.81.0');
assert.ok(read('config.js').includes("APP_VERSION: '2.81'"));
assert.ok(read('sw.js').includes('kyv-studio-v2-81-economy-audit-20261105'));
assert.ok(read('sw.js').includes("'./kyv-editor-view-v277.js'"));
assert.ok(read('guida.html').includes('id="v277-editor"'));
const h={};vm.runInNewContext(read('kyv-help.js'),{window:h});
assert.ok(h.KYV_HELP.getContent('editor').content.includes('v2.77 · Cercare e scegliere le colonne'));
assert.ok(read('MANUALE_OPERATIVO.md').includes('v2.77 — Studio Editor'));
assert.ok(read('docs/MANUALE_PRATICO_V273.md').includes('Aggiornamento v2.77'));
assert.ok(require('../package.json').scripts.check.includes('check:editor-view-v277'));
console.log('OK v2.77: memoized search/sort, full CSV, column picker filters, cache invalidation and guides');
