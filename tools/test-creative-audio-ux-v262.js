// KYVManagerPro v2.62 — creative + audio UI regression and interaction focus.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const desk=read('kyv_scrivania_creativa.html'),finder=read('kyv_audio_finder.html');
const creative=read('kyv-creative-desk-ui-v244.js');
const audio=read('kyv-audio-finder-ui-v245.js'),theme=read('kyv-theme.css');
for(const [label,html] of [['creative',desk],['audio',finder]]){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,label+' IDs must remain unique');
 assert.equal((html.match(/<details\b/g)||[]).length,(html.match(/<\/details>/g)||[]).length,
  label+' native disclosures need matching closures');
}
for(const file of ['kyv-creative-desk-ui-v244.js','kyv-audio-finder-ui-v245.js'])
 new vm.Script(read(file),{filename:file});
for(const id of [
 'desk-legacy-tools','desk-creative-insights','desk-summary','desk-method','desk-search',
 'desk-archived','tab-hub','tab-sessions','tab-pitches','desk-hub','desk-sessions',
 'desk-pitches','hub-pitch-analysis','hub-pitch-chart','hub-more-filters',
 'hub-search','hub-artist','hub-status','hub-mode','hub-clear','hub-active-filters',
 'session-form','session-id','session-title','session-date','session-type','session-people',
 'session-outcome','session-place','session-minutes','session-notes','session-more-fields',
 'session-submit','session-link-form','session-link-project','pitch-form','pitch-id',
 'pitch-project','pitch-recipient','pitch-sent','pitch-stage','pitch-followup',
 'pitch-recipient-type','pitch-contact','pitch-response','pitch-notes','pitch-more-fields',
 'pitch-submit','hub-project-modal'
]) assert.ok(desk.includes('id="'+id+'"'),'Creative control must survive: '+id);
assert.ok(desk.includes('<details id="desk-creative-insights"'));
assert.ok(desk.includes('<details id="hub-pitch-analysis"'));
assert.ok(desk.includes('<details id="hub-more-filters"'));
assert.ok(desk.includes('class="desk-disclosure desk-form-extras wide"'));
assert.ok(desk.includes('<details id="session-more-fields"'));
assert.ok(desk.includes('<details id="pitch-more-fields"'));
assert.ok(creative.includes('const creativeQueries={sessions:\'\',pitches:\'\'}'),
 'Session and pitch searches must have independent values');
assert.ok(creative.includes("const sessionSearch=text(creativeQueries.sessions)"));
assert.ok(creative.includes("const pitchSearch=text(creativeQueries.pitches)"));
assert.ok(creative.includes("if(currentTab==='hub')renderHub()"),
 'Local search should not recompute all hub charts and finance on each keystroke');
assert.ok(creative.includes("document.body.dataset.creativeTab=tab"));
assert.ok(creative.includes("currentTab!=='hub')creativeQueries[currentTab]=$('desk-search').value"));
assert.ok(creative.includes("$('hub-clear').addEventListener('click'"));
assert.ok(creative.includes("$('hub-active-filters').textContent=activeAdvanced"));
assert.ok(creative.includes("if(tab==='hub')renderHub()"));
assert.ok(creative.includes("$('session-more-fields').open=true"));
assert.ok(creative.includes("$('pitch-more-fields').open=true"));
assert.ok(creative.includes("event.key==='Home'")&&creative.includes("event.key==='End'"),
 'Keyboard tab navigation must preserve Home/End and arrows');
assert.ok(creative.includes("KYV_MUSIC_HUB_V259.build("),'Original read-only view still used');
assert.ok(creative.includes("await save('KYV_SESSIONI',payload,id)"));
assert.ok(creative.includes("await save('KYV_PIAZZAMENTI',payload,id)"));
assert.ok(creative.includes("await save('KYV_SESSIONI_PROGETTI',{annullato:true},id)"));
assert.ok(creative.includes("'KYV_PIAZZAMENTI_EVENTI'"),'Pitch follow-up history retained');
assert.ok(!creative.includes(".delete("),'No destructive operations added');
assert.ok(creative.includes("String(p.ID)===targetProject"),'Project context must be exact ID, not name');
assert.ok(creative.includes("!$('pitch-project').value"),'Do not override a previous explicit form choice');
assert.ok(creative.includes("tab=pitches&project="),'Hub links preserve verified project context');
const match=creative.match(/function showTab\(tab\)\{([\s\S]*?)\n\}/);
assert.ok(match,'showTab remains extractable and tab-specific');
const elements=new Map;
const el=id=>{if(!elements.has(id))elements.set(id,{
 hidden:false,value:'',placeholder:'',tabIndex:0,attrs:{},
 setAttribute(k,v){this.attrs[k]=v}
});return elements.get(id)};
const ctx={$:el,document:{body:{dataset:{}}}};
vm.runInNewContext(`
let data=null,currentTab='hub';
const creativeQueries={sessions:'',pitches:''};
function render(){};
function renderHub(){};
function showTab(tab){${match[1]}\n}
this.showTab=showTab;`,ctx,{filename:'showTab-v262.js'});
ctx.showTab('sessions');
assert.equal(el('desk-legacy-tools').hidden,false);
assert.equal(el('desk-sessions').hidden,false);
assert.equal(el('desk-hub').hidden,true);
el('desk-search').value='Studio Milano';
ctx.showTab('pitches');
assert.equal(el('desk-search').value,'');
el('desk-search').value='Carosello';
ctx.showTab('sessions');
assert.equal(el('desk-search').value,'Studio Milano','Session query restored');
ctx.showTab('pitches');
assert.equal(el('desk-search').value,'Carosello','Pitch query restored');
ctx.showTab('hub');
assert.equal(el('desk-legacy-tools').hidden,true);
assert.equal(el('tab-hub').attrs['aria-selected'],'true');
assert.equal(el('tab-pitches').attrs['aria-selected'],'false');
assert.equal(el('tab-hub').tabIndex,0);
assert.equal(el('tab-sessions').tabIndex,-1);
for(const id of [
 'finder-explorer','explorer-query','explorer-source','explorer-account','explorer-linked',
 'explorer-sort','explorer-items','explorer-more','finder-audit-details','finder-audit',
 'audit-kpis','audit-type','audit-items','finder-sources-details','finder-sources',
 'finder-drive','finder-dropbox','finder-folder','finder-files','finder-preview',
 'finder-preview-query','finder-preview-state','finder-save','finder-review-details',
 'review-generate','review-save','finder-version-groups-details','finder-version-groups',
 'finder-group-query','finder-group-source','finder-group-mode','finder-group-detail',
 'finder-advanced','finder-detail','finder-link-form','link-project','link-kind'
])assert.ok(finder.includes('id="'+id+'"'),'Finder control must survive: '+id);
assert.ok(finder.includes('data-finder-jump="finder-sources-details"'));
assert.ok(finder.includes('data-finder-jump="finder-audit-details"'));
assert.ok(finder.includes('data-finder-jump="finder-version-groups-details"'));
assert.ok(audio.includes("const jumpIds=['finder-sources-details','finder-audit-details'"));
assert.ok(audio.includes("if(node?.tagName==='DETAILS')node.open=true"));
assert.ok(audio.includes("if(parent.tagName==='DETAILS')parent.open=true"));
assert.ok(audio.includes("window.addEventListener('hashchange'"));
assert.ok(audio.includes("function renderCatalogue()"));
assert.match(audio,/function render\(\)\{\r?\n renderCatalogue\(\);\r?\n renderGroups\(\);\r?\n renderExplorer\(\);\r?\n renderAudit\(\);\r?\n\}/);
for(const token of [
 "$('finder-query').addEventListener('input',()=>{shown=120;renderCatalogue()})",
 "$('finder-source').addEventListener('change',()=>{shown=120;renderCatalogue()})",
 "$('finder-link-status').addEventListener('change',()=>{shown=120;renderCatalogue()})",
 "$('finder-more').addEventListener('click',()=>{shown+=120;renderCatalogue()})"
])assert.ok(audio.includes(token),'Catalogue-only repaint required: '+token);
assert.ok(audio.includes("selected=b.dataset.groupOpenFile;$('finder-advanced').open=true;"),
 'Grouped file detail must open its actual target disclosure');
assert.ok(audio.includes('const approvedSelections=preview.filter(f=>f._explicit)'),
 'Indexing can use only explicit classifications');
assert.ok(audio.includes("if(!confirm('Confermi '+plan.approved.length"));
assert.ok(audio.includes("G.planVersionLinks("),'Group links remain guarded');
assert.ok(audio.includes('groupProject=\'\'; // Never preselect a destination'));
assert.ok(!audio.includes("db.from('PROGETTI').insert"),'No automatic projects');
for(const token of [
 'body.kyv-v260 :is(.desk-disclosure,.finder-workflow-details)','body.kyv-v260 .hub-query-bar',
 'body.kyv-v260 .desk-form-extras-grid','body.kyv-v260 .finder-journey',
 'body.kyv-v260 .finder-workflow-details','body.kyv-v260 #finder-explorer'
])assert.ok(theme.includes(token),'Shared CSS missing '+token);
const pkg=JSON.parse(read('package.json')),sw=read('sw.js');
assert.equal(pkg.version,(require('./release-contract').version()+'.0'));
assert.equal(read('VERSION').trim(),require('./release-contract').version());
assert.ok(read('config.js').includes("APP_VERSION: '"+require('./release-contract').version()+"'"));
assert.ok(sw.includes(require('./release-contract').cacheName()));
assert.equal(pkg.scripts['check:creative-audio-ux-v262'],'node tools/test-creative-audio-ux-v262.js');
assert.ok(pkg.scripts.check.includes('check:creative-audio-ux-v262'));
assert.ok(read('guida.html').includes('v2.62'));
assert.ok(read('kyv-help.js').includes('v2.62'));
console.log('OK: v2.62 tab-specific creative search, no duplicate metrics, optional forms, finder disclosure and catalogue-only redraw');
