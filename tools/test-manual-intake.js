const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {parseLink,classify} = require('../kyv-manual-intake-core.js');
const ID = '1c-yp45ABCRRC9nsQIQQPbgMpi3vvuWLg';
const drive = `https://drive.google.com/file/d/${ID}/view?usp=sharing`;
const d = parseLink(drive);
assert.equal(d.provider,'drive');
assert.equal(d.providerId,ID);
assert.equal(d.canonical,`https://drive.google.com/file/d/${ID}/view`);
assert.throws(()=>parseLink('https://drive.google.com/drive/my-drive'),/link diretto/i);
assert.throws(()=>parseLink('http://drive.google.com/file/d/'+ID+'/view'),/HTTPS/i);
assert.throws(()=>parseLink('https://evil.example/file/d/'+ID+'/view'),/supportati/i);
const a='https://www.dropbox.com/scl/fi/abcdef12/song.mp3?rlkey=xyz&dl=0';
const b='https://www.dropbox.com/scl/fi/abcdef12/song.mp3?rlkey=xyz&dl=1';
assert.equal(parseLink(a).canonical,parseLink(b).canonical);
assert.throws(()=>parseLink('https://www.dropbox.com/scl/fo/abcdef'),/non una cartella/i);
let result=classify({link:drive,name:'Mare Blu demo.mp3',title:'Mare Blu'},[{PROVIDER:'drive',PROVIDER_ID:ID,ID_PROGETTO:10}],[]);
assert.equal(result.status,'existing'); assert.equal(result.projectId,'10');
result=classify({link:b,name:'Mare Blu.mp3',title:'Mare Blu'},[{Link_Dropbox:a,ID_PROGETTO:5}],[]);
assert.equal(result.status,'existing');assert.equal(result.projectId,'5');
result=classify({link:drive,name:'Mare Blu.mp3',title:'Mare Blu',artist:'Anna'},[],[{ID:1,TITOLO:'Mare Blu',ARTISTA:'Anna'},{ID:2,TITOLO:'Mare Blu',ARTISTA:'Marco'}]);
assert.equal(result.status,'review');assert.deepEqual(result.candidates.map(p=>p.ID),[1]);
result=classify({link:drive,name:'Altro.mp3',title:'Altro'},[],[{ID:1,TITOLO:'Mare Blu'}]);
assert.equal(result.status,'new');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'acquisisci_audio.html'),'utf8');
const config=fs.readFileSync(path.join(root,'config.js'),'utf8');
const producer=fs.readFileSync(path.join(root,'kyv-producer-mode.js'),'utf8');
assert.match(html,/data-auth-required="true"/);
assert.match(html,/KYV_AUTH\.requireAuth\(\)/);
assert.match(html,/kyv-manual-intake-core\.js/);
assert.match(html,/id="quick-form"/);
assert.match(html,/Titolo Canzone \*/);
for(const id of ['quick-date','quick-authors','quick-label','quick-management'])
  assert.ok(html.includes('id="'+id+'"'),'Field exists: '+id);
for(const key of ['TITOLO','ARTISTA','NOTE','Data_Sessione','AUTORI','Label','MANAGEMENT'])
  assert.match(html,new RegExp(key+':'),'Quick insert writes real PROGETTI column: '+key);
assert.match(html,/editor\.html\?table=PROGETTI&editId=/,'Original editor deep-link remains as fallback');
assert.match(html,/openProjectEditorPopup\(p\.ID,link\)/,'Apri progetto opens a popup, not a page redirect');
assert.match(html,/dialog\.showModal\(\)/,'The ADD Progetto popup must be modal');
assert.match(html,/url\.searchParams\.set\('embed','1'\)/,'The original editor is embedded');
assert.match(html,/event\.source!==frame\.contentWindow/,'Embedded editor messages require the exact iframe source');
const editor=fs.readFileSync(path.join(root,'editor.html'),'utf8');
assert.match(editor,/window\.openDynamicModal\(data\.ID,'PROGETTI',data\)/,'Original Modifica (PROGETTI) reused');
assert.match(editor,/if\(!kyvEditorEmbedded\)\{/,'Embedded editor must not load the table view');
assert.match(editor,/reportEmbeddedEditor\('ready'\)/,'Parent is notified when original modal is ready');
assert.match(editor,/reportEmbeddedEditor\('closed'\)/,'Parent is notified on original modal close');
assert.match(editor,/KYV_EDITOR_REQUEST_CLOSE=\(\)=>closeEditorModal\(\)/,'Original unsaved-changes guard is preserved');
assert.match(html,/loadProjectSuggestions\(\)/,'Existing values are queried for autocomplete');
assert.match(html,/\.select\('ARTISTA,AUTORI,Label,MANAGEMENT'\)/,'Only the four existing project fields are queried');
assert.match(html,/\.range\(offset,offset\+step-1\)/,'Project autocomplete is paginated');
for(const [id,list] of [['quick-artist','quick-artist-options'],['quick-authors','quick-authors-options'],
  ['quick-label','quick-label-options'],['quick-management','quick-management-options']]){
  assert.match(html,new RegExp('id="'+id+'" list="'+list+'"'),
    'Field '+id+' must permit both existing and new values');
  assert.match(html,new RegExp('<datalist id="'+list+'">'),
    'Dropdown '+list+' must exist');
}
const helper=require('../kyv-project-suggestions.js');
assert.deepEqual(helper.unique(['  Giorgia','giorgia','GIÓRGIA ',' Giorgia  ','Malika Ayane']),
  ['Giorgia','Malika Ayane'],'Case, spaces and accents must not duplicate suggestions');
assert.deepEqual(helper.suggestions([
  {ARTISTA:'Emma',AUTORI:'Kyv, Marco',Label:'Island',MANAGEMENT:'A&R'},
  {ARTISTA:'emma',AUTORI:' kyv,  marco ',Label:'ISLAND',MANAGEMENT:'a&r'},
  {ARTISTA:'Giorgia',AUTORI:'Anna',Label:'Warner',MANAGEMENT:'Arturo'}
]),{
  ARTISTA:['Emma','Giorgia'],AUTORI:['Anna','Kyv, Marco'],
  Label:['Island','Warner'],MANAGEMENT:['A&R','Arturo']
},'Each source column uses one distinct list without duplicates');
assert.doesNotMatch(html,/if\(response\.error\)response=await db\.from\('PROGETTI'\)/,'No blind second insert');
assert.match(html,/id="cloud-flow"/);
assert.match(config,/kyv-producer-mode\.js/);
assert.match(producer,/acquisisci_audio\.html/);
const scripts=[...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(scripts.length,'Expected an inline workflow script');
for(const [,code] of scripts) new vm.Script(code,{filename:'acquisisci_audio.html'});
console.log('OK: parsing, duplicati, auth, cattura rapida, nav e sintassi inline.');
