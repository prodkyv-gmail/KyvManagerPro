// v2.46: batch matching requires explicit per-file approval, never inferred writes.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),root={};
const ctx={window:root,URL,Date,Number,Object,Error};
vm.runInNewContext(read('kyv-audio-finder-v245.js'),ctx);
vm.runInNewContext(read('kyv-audio-review-v246.js'),ctx);
const R=root.KYV_AUDIO_REVIEW_V246;
const files=[
{id:'a',nome_file:'Emma - Nuova Luce - DEMO_v03.wav',provider:'drive',account_label:'A',percorso_relativo:'album'},
{id:'b',nome_file:'Nuova Luce mix.wav',provider:'dropbox',account_label:'D'},
{id:'c',nome_file:'Autunno master.wav',provider:'local',account_label:'Mac'},
{id:'d',nome_file:'test casuale.wav',provider:'local',account_label:'Mac'}];
const projects=[
{ID:1,TITOLO:'Nuova Luce',ARTISTA:'Emma'},
{ID:2,TITOLO:'Nuova Luce',ARTISTA:'Altro'},
{ID:3,TITOLO:'Autunno',ARTISTA:'Mew'}];
const q=R.queue(files,projects,[]);
assert.equal(q.length,3,'No irrelevant file suggestions');
assert.equal(q.find(x=>x.file.id==='a').status,'ambigua','Two same-title projects need explicit choice');
assert.equal(q.find(x=>x.file.id==='a').proposedId,'');
assert.equal(q.find(x=>x.file.id==='b').status,'ambigua');
assert.equal(q.find(x=>x.file.id==='c').status,'verificare');
const unique=R.queue([files[0]],[projects[0]],[])[0];
assert.equal(unique.status,'forte');assert.equal(unique.proposedId,'1');
assert.equal(R.filterCatalogue(files,[],{query:'nuova LUCE',source:'drive'}).length,1);
const links=[{id_audio:'a',id_progetto:1,annullata:false,confermata:true}];
assert.equal(R.filterCatalogue(files,links,{status:'linked'}).length,1);
assert.equal(R.filterCatalogue(files,links,{status:'unlinked'}).length,3);
assert.equal(R.queue(files,projects,links).some(x=>x.file.id==='a'),false);
const batch=R.planLinks([{audioId:'b',projectId:'2'}],files,projects,links,'owner');
assert.equal(batch.length,1);assert.equal(batch[0].id_progetto,2);
assert.equal(batch[0].metodo,'manuale');assert.equal(batch[0].confermata,true);
assert.throws(()=>R.planLinks([{audioId:'a',projectId:'1'}],files,projects,links,'owner'));
assert.throws(()=>R.planLinks([{audioId:'b',projectId:'x'}],files,projects,[],'owner'));
assert.throws(()=>R.planLinks([{audioId:'b',projectId:'2'},{audioId:'b',projectId:'2'}],files,projects,[],'owner'));
assert.throws(()=>R.planLinks([{audioId:'b',projectId:'2'}],files,projects,[],''));
assert.throws(()=>R.planLinks(Array(26).fill({audioId:'b',projectId:'2'}),files,projects,[],'owner'));
const html=read('kyv_audio_finder.html'),ui=read('kyv-audio-finder-ui-v245.js');
for(const x of ['review-generate','review-panel','review-save','finder-link-status','review-list'])assert.ok(html.includes('id="'+x+'"'));
assert.ok(html.includes('kyv-audio-review-v246.js'));
assert.ok(ui.includes("R.planLinks(selections,personalCatalogue(),projects,links,owner)"),"Review can only link approved personal audio");
assert.ok(ui.includes("await fetchAll();\n const payload=R.planLinks"),'Revalidate links before insertion');
assert.ok(ui.includes("db.from('KYV_AUDIO_ASSOCIAZIONI').insert(payload)"),'Single batch insert');
assert.ok(ui.includes("confirm('Confermi '"),'Human consent mandatory');
assert.doesNotMatch(ui,/\b(?:db|client)\.from\([^\n]{0,180}\)\s*\.\s*(?:delete|remove|upload)\s*\(/);
assert.doesNotMatch(ui,/\b(?:db|client)\.storage[^\n]*\.(?:remove|upload)\s*\(/);
assert.ok(read('sw.js').includes("'./kyv-audio-review-v246.js'"));
assert.ok(read('kyv-help.js').includes('Coda proposte'));
assert.ok(read('guida.html').includes('Novità v2.46'));
assert.ok(JSON.parse(read('package.json')).scripts.check.includes('check:audio-review-v246'));
console.log('OK: v2.46 review, ambiguity, explicit approvals, atomic insert and guide');
