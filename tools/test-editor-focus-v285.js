/* Studio Editor v2.85 – project-first, read-only presentation tests. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const root={};vm.runInNewContext(read('kyv-editor-focus-v285.js'),{window:root});
const api=root.KYV_EDITOR_FOCUS_V285;
assert.ok(api,'The project focus helper is initialized');
assert.deepEqual(Array.from(api.PROGETTI_COLUMNS),[
 'TITOLO','ARTISTA','STATO','Data_Sessione','Label','MANAGEMENT','Prossimo_Followup','FEE']);
const available=['ID','TITOLO','ARTISTA','STATO','Data_Sessione','AUTORI','MANAGEMENT','Label','FEE','Prossimo_Followup','NOTE','owner_id'];
assert.deepEqual(Array.from(api.essentialKeys('PROGETTI',available)),[
 'TITOLO','ARTISTA','STATO','Data_Sessione','Label','MANAGEMENT','Prossimo_Followup','FEE']);
assert.deepEqual(Array.from(api.essentialKeys('CLIENTI',available)),available,'Other archives preserve all columns');
assert.equal(api.modeFromStorage('{}'),'essential');
assert.equal(api.modeFromStorage('invalid'),'essential');
assert.equal(api.modeFromStorage('{"PROGETTI":"all"}'),'all');
assert.equal(api.valueText('2026-11-19'),'19/11/2026');
assert.equal(api.valueText('2026-11-19T10:00:00Z'),'2026-11-19T10:00:00Z','Keep timestamps unchanged');
assert.equal(api.valueText(null),'—');
assert.equal(api.valueText(0),'0','Zero values are meaningful');
assert.equal(api.valueText(false),'No');
assert.equal(api.isFilled('   '),false);
assert.equal(api.isFilled('0'),true);
const row={ID:148,TITOLO:'Canzone test',ARTISTA:'',STATO:'IDEA',Data_Sessione:'2026-11-19',
 AUTORI:'Autore',Label:'',MANAGEMENT:'M',FEE:'0',Prossimo_Followup:null,NOTE:'<b>Non eseguire</b>',
 FT:1,other_field:'Mantieni',owner_id:'uid'};
const groups=api.sections(row),keys=Array.from(groups.flatMap(g=>g.keys));
assert.equal(new Set(keys).size,Object.keys(row).length,'Each field occurs once');
assert.deepEqual(keys.slice().sort(),Object.keys(row).slice().sort(),'No information may be lost');
assert.deepEqual(Array.from(groups,g=>g.id),['identity','people','dates','economy','technical']);
assert.equal(groups.find(g=>g.id==='people').filled,2);
assert.equal(groups.find(g=>g.id==='technical').keys.includes('other_field'),true);
const html=read('editor.html'),css=read('kyv-editor-focus-v285.css');
for(const id of ['editor-display-mode','editor-project-detail','editor-project-detail-title','editor-project-detail-edit',
 'editor-project-detail-close','editor-project-detail-show-empty','editor-project-detail-body']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Unique UI id '+id);
}
assert.match(html,/kyv-editor-focus-v285\.js/);
assert.match(html,/kyv-editor-focus-v285\.css/);
assert.match(html,/kyv-editor-essential-title/,'Clicking song title opens the record');
assert.match(html,/data-action="open-project-detail"/,'Read-only project details accessible from essential rows');
assert.match(html,/if\(isEssential\)[\s\S]*?return;[\s\S]*?contenteditable="true"/,'Essential cells do not contain an inline editor');
assert.match(html,/openDynamicModal\(row\.ID,'PROGETTI',row\)/,'Details reuse the original editor and full row');
assert.match(html,/renderProjectDetails\(\)/,'Read-only details can be refreshed');
assert.match(html,/document\.createElement\('dd'\)/,'Detail field values use safe textContent, not untrusted HTML');
assert.match(html,/value\.textContent=KYV_EDITOR_FOCUS_V285\.valueText/,'Values are rendered as text');
assert.match(html,/projectDisplayMode='essential'/,'Projects default to essential mode');
assert.match(html,/localStorage\.setItem\(DISPLAY_KEY/,'View preference is remembered locally');
assert.match(html,/if\(!kyvEmbeddedProject\)loadEditorTable\('PROGETTI'\)/,'Previously installed embedded popup still loads only the editor');
assert.match(css,/@media\(max-width:700px\)/,'Drawer is responsive');
assert.doesNotMatch(read('kyv-editor-focus-v285.js'),/\.from\(|\.update\(|\.insert\(|\.delete\(|fetch\(|MutationObserver/,'No database access or new observers');
assert.equal((html.match(/id="modal-dynamic"/g)||[]).length,1,'Keep exactly one original edit dialog');
assert.equal((html.match(/id="form-dynamic"/g)||[]).length,1,'Keep original save form');
console.log('OK editor v2.85: essential/full, complete record coverage, read-only details, original editor, accessibility and no DB changes.');
