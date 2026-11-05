// v2.79: shared UI over four existing views without duplicate controls or DB paths.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),css=read('kyv-workspace-ui-v279.css');
for(const path of ['progetti.html','sessioni.html','fatture.html','editor.html']){
 const page=read(path);
 assert.ok(page.includes('kyv-workspace-ui-v279.css'),path+' uses scoped UI tokens');
 assert.match(page,/<body\b[^>]*class="[^"]*\bkyv-v279-workspace\b/);
 assert.equal((page.match(/kyv-workspace-ui-v279\.css/g)||[]).length,1,'No duplicated shared styles in '+path);
}
assert.ok(css.includes('.kyv-v279-workspace'),'All changes scoped to workspace');
assert.ok(css.includes('#modal-dynamic-content')&&css.includes('.kyv-v279-modal-actions'),'Modal and persistent action styles exist');
assert.ok(css.includes('@media(max-width:767px)')&&css.includes('.kyv-v279-field-grid{grid-template-columns:minmax(0,1fr)}'),'Mobile single-column editor');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion support');
assert.ok(css.includes('min-height:44px')&&css.includes(':focus-visible'),'Touch and keyboard controls');
assert.doesNotMatch(css,/\.header\s*\{[^}]*padding/,'Do not override Progetti safe mobile header spacing');
assert.doesNotMatch(css,/\bMutationObserver\b|supabase|\.insert\(|\.update\(/,'Shared styles must not have side effects');
const ed=read('editor.html');
assert.equal((ed.match(/id="editor-search"/g)||[]).length,1,'One search bar in Editor');
assert.equal((ed.match(/id="editor-column-panel"/g)||[]).length,1,'One column panel');
assert.equal((ed.match(/id="modal-dynamic"/g)||[]).length,1,'One record modal');
assert.equal((ed.match(/id="btn-dynamic-salva"/g)||[]).length,1,'One submit action');
assert.ok(ed.includes("currentEditorData.forEach(row => csv +="),'CSV untouched by modal/search');
assert.ok(read('guida.html').includes('id="v279-workspace"'));
assert.ok(read('kyv-help.js').includes('v2.78 + v2.79 · Popup e grafica'));
assert.ok(read('MANUALE_OPERATIVO.md').includes('v2.78 + v2.79'));
assert.ok(read('docs/V279_INTEGRATED_QA.md').includes('Collaudo integrato'));
assert.ok(read('sw.js').includes("'./kyv-workspace-ui-v279.css'"));
assert.ok(read('sw.js').includes("'./kyv-editor-modal-v278.js'"));
assert.ok(read('sw.js').includes(require('./release-contract').cacheName()));
assert.equal(read('VERSION').trim(),require('./release-contract').version());
assert.equal(require('../package.json').version,(require('./release-contract').version()+'.0'));
assert.ok(read('config.js').includes("APP_VERSION: '"+require('./release-contract').version()+"'"));
const pkg=require('../package.json');
assert.ok(pkg.scripts.check.includes('check:editor-modal-v278')&&pkg.scripts.check.includes('check:workspace-ux-v279'));
console.log('OK v2.79: scoped UI on four pages, mobile accessibility, PWA cache, documentation and no duplicate actions');