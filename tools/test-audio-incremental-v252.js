// KYV v2.52 — incremental audio scan regressions: no duplicates or implicit project creation.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),w={};
for(const name of ['kyv-audio-finder-v245.js','kyv-audio-consent-v248.js','kyv-audio-groups-v249.js','kyv-audio-incremental-v252.js'])
 vm.runInNewContext(read(name),{window:w,Map,Set,Date,Number,Object,Error,URL,Intl},{filename:name});
const I=w.KYV_AUDIO_INCREMENTAL_V252,C=w.KYV_AUDIO_CONSENT_V248;
const f=(id,name,overrides={})=>({
 provider:'drive',account_label:'Studio',external_key:id,
 nome_file:name,percorso_relativo:'Miei lavori',mime_type:'audio/wav',
 modificato_il:'2026-11-01T10:00:00.000Z',size_bytes:100,
 content_hash:null,link_file:null,...overrides
});
const saved=[
 {...f('a','Emma - Luna Blu demo.wav'),id:'a-row',content_hash:'a'.repeat(64)},
 {...f('b','Musica di altri.wav'),id:'b-row'},
 {...f('c','Da completare.wav'),id:'c-row'},
 {...f('d','Giorgia - Luna Blu mix.wav'),id:'d-row'},
 {...f('e','Emma - Luna Blu mix.wav'),id:'e-row'}
];
const decisions=saved.map((x,i)=>({...x,decision:i===1?'reference':i===2?'da_verificare':'mio'}));
const scan=[
 f('a','Emma - Luna Blu demo.wav'),
 f('b','Musica di altri.wav'),
 f('c','Da completare.wav'),
 f('d','Giorgia - Luna Blu mix.wav',{size_bytes:120}),
 f('e','Emma - Luna Blu mix.wav',{modified_at:null,modificato_il:null,size_bytes:null}),
 f('f','Emma - Luna Blu master.wav',{size_bytes:103}),
 f('a','Emma - Luna Blu demo.wav')
];
const compared=I.compare(scan,saved,decisions);
assert.equal(compared.length,6,'Same source identity cannot be indexed twice');
const preview=C.preview(compared,decisions);
assert.equal(preview.length,6);
assert.equal(preview[0]._sync.state,'unchanged');
assert.equal(preview[1]._sync.state,'excluded','Known reference stays excluded');
assert.equal(preview[2]._sync.state,'pending','Pending selection stays pending');
assert.equal(preview[3]._sync.state,'changed','An existing Drive id with changed size is an update candidate');
assert.equal(preview[4]._sync.state,'unverified','Missing revision metadata is not proof of no changes');
assert.equal(preview[5]._sync.state,'new');
const summary=I.summary(preview);
assert.equal(summary.new,1);
assert.equal(summary.changed,1);
assert.equal(summary.unchanged,1);
assert.equal(summary.excluded,1);
assert.equal(summary.pending,1);
assert.equal(summary.unverified,1);
assert.deepEqual(Array.from(I.filter(preview,{status:'attention'})),[2,3,4,5]);
assert.deepEqual(Array.from(I.filter(preview,{status:'changed'})),[3]);
assert.deepEqual(Array.from(I.filter(preview,{status:'excluded'})),[1]);
assert.deepEqual(Array.from(I.filter(preview,{status:'all',decision:'mio'})),[0,3,4]);
assert.deepEqual(Array.from(I.filter(preview,{status:'all',query:'luna blu'})),[0,3,4,5]);
assert.throws(()=>C.plan(I.safeRows(preview),'owner'),/Classifica/,'Re-scanning unchanged files must never write');
const chosen=C.mark(C.mark(preview,3,'mio'),5,'mio');
const safe=I.safeRows(chosen);
assert.ok(safe.every(x=>!Object.hasOwn(x,'_sync')&&!Object.hasOwn(x,'_previous')),'Never send scan annotations to Supabase');
const plan=C.plan(safe,'owner');
assert.equal(plan.approved.length,2);
assert.equal(plan.changes.length,2,'Unchanged old audio and references are not re-written');
assert.equal(plan.approved.find(x=>x.external_key==='d').size_bytes,120);
assert.equal(plan.approved.some(x=>x.external_key==='b'),false);
assert.equal(plan.changes.some(x=>x.external_key==='a'),false);
const preserved=I.preserveRecord({
 ...f('a','Emma - Luna Blu demo.wav',{size_bytes:null,modificato_il:null,content_hash:null,link_file:null})
},saved[0]);
assert.equal(preserved.content_hash,'a'.repeat(64),'Keep real SHA-256 hash when scan lacks one');
assert.equal(preserved.size_bytes,100,'Keep old size when source omits it');
assert.equal(preserved.modificato_il,'2026-11-01T10:00:00.000Z');
assert.equal(I.differs(saved[0],f('a','Emma - Luna Blu demo.wav')).length,0);
assert.ok(I.differs(saved[3],scan[3]).includes('size_bytes'));
const hints=I.versionSuggestions(scan[5],saved.filter((x,i)=>decisions[i].decision==='mio'),6);
assert.ok(hints.some(x=>x.name.includes('Emma - Luna Blu')),'Potential title/version suggestions must be read only');
assert.ok(hints.every(x=>!x.name.includes('Giorgia')),'Different explicit artists not merged');
assert.ok(hints.every(x=>x.identicalHash===false),'No guessed audio hashes');
const renamed=I.classify(f('new-local-key','Emma - Luna Blu v02.wav',{provider:'local',account_label:'Phone'}),null,'da_verificare');
assert.equal(renamed.state,'pending','Local key changes require separate user classification');
const page=read('kyv_audio_finder.html'),ui=read('kyv-audio-finder-ui-v245.js'),drive=read('kyv-drive-bridge.js'),sw=read('sw.js');
for(const id of ['finder-sync-state','finder-sync-summary','finder-preview-query','finder-preview-state']){
 assert.ok(page.includes('id="'+id+'"'),id);
}
assert.ok(ui.includes('I.compare(rows,catalogue,decisions)'));
assert.ok(ui.includes('C.preview(compared,decisions)'));
assert.ok(ui.includes('C.plan(I.safeRows(preview),owner)'));
assert.ok(ui.includes('I.preserveRecord(x,indexByKey.get(C.key(x)))'));
assert.ok(ui.includes('const decisionByKey=new Map'),'Prevent stale user decisions from being silently overwritten');
assert.ok(ui.includes("if(!approvedSelections.length)"),'No-op for a scan without new confirmed actions');
assert.ok(ui.includes("data-confirm-update"),'Updated metadata must have an explicit confirmation');
assert.ok(ui.includes("J.selectionPlan(preview,[...scanChecked],previewIndices().slice(0,previewShown))"));
assert.ok(!ui.includes('createProjectFromScan'),'New projects cannot be created by the sync engine');
assert.ok(!ui.includes('.delete().eq('),'No sync-time deletion');
assert.ok(drive.includes('truncated:limitedAccounts.length>0'));
assert.ok(drive.includes('if(pageToken)limitedAccounts.push('),'Drive page limit must be detectable');
assert.ok(sw.includes("'./kyv-audio-incremental-v252.js'"));
assert.equal(JSON.parse(read('package.json')).version,'2.81.0');
assert.equal(read('VERSION').trim() ,'2.81');
assert.ok(read('guida.html').includes('v2.52'));
assert.ok(read('kyv-help.js').includes('v2.52'));
console.log('OK: incremental scan no-op for unchanged, accurate statuses, safe metadata-only updates, no auto-projects');
