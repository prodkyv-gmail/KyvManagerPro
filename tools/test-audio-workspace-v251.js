// KYV v2.51 — approved-only cross-source audio workspace and picker safety.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),root={};
vm.runInNewContext(read('kyv-audio-workspace-v251.js'),{window:root,Map,Set,Object,Number,Intl,URL},{filename:'kyv-audio-workspace-v251.js'});
const W=root.KYV_AUDIO_WORKSPACE_V251;
const rec=(id,name,provider='local',account='Studio')=>({
 id,external_key:'key-'+id,nome_file:name,provider,account_label:account,
 percorso_relativo:provider==='local'?'Mie demo':'KYV',size_bytes:provider==='local'?8000:12000,
 modificato_il:'2026-11-02T10:00:00Z'
});
const catalogue=[
 rec('1','Mio brano demo.wav'),
 rec('2','Reference famosa.wav','drive','Drive creativo'),
 rec('3','Mio brano master.wav','dropbox','Archivio Dropbox KYV'),
 rec('4','Da verificare.wav','local'),
 rec('5','Mio brano mix.wav','drive','Drive creativo'),
 rec('6','Stesso titolo.wav','local')
];
const decisions=catalogue.map((f,i)=>({...f,decision:[0,2,4,5].includes(i)?'mio':i===1?'reference':'da_verificare'}));
const links=[{id_audio:'1',annullata:false,confermata:true},{id_audio:'3',annullata:false,confermata:false},
 {id_audio:'5',annullata:true,confermata:true}];
const listed=W.approved(catalogue,decisions,links);
assert.equal(listed.length,4,'Reference and unknown audio must never appear in the approved catalogue');
assert.equal(listed.some(f=>f.nome_file==='Reference famosa.wav'),false);
assert.equal(listed.find(f=>f.id==='1').linkCount,1);
assert.equal(listed.find(f=>f.id==='3').linkCount,0,'Only confirmed links count');
assert.equal(W.query(listed,{text:'mio BRANO',status:'unlinked'}).length,2);
assert.equal(W.query(listed,{provider:'drive'}).length,1);
assert.equal(W.query(listed,{provider:'drive',account:'Drive creativo'}).length,1);
assert.equal(W.query(listed,{provider:'dropbox'}).length,1);
assert.equal(W.query(listed,{status:'linked'}).length,1);
assert.equal(W.query(listed,{status:'unlinked'}).length,3);
assert.equal(W.query(listed,{text:'Mie demo'}).length,2);
assert.deepEqual(Array.from(W.accounts(listed,'drive')),['Drive creativo']);
assert.equal(W.stats(listed).total,4);
assert.equal(W.stats(listed).bySource.local,2);
assert.equal(W.stats(listed).unlinked,3);
assert.equal(W.query(listed,{provider:'onedrive'}).length,0,'OneDrive is supported but not approved by default');
assert.throws(()=>W.query(listed,{provider:'ftp'}),/Fonte non valida/);
assert.throws(()=>W.query(listed,{sort:'random'}),/Ordine non valido/);
assert.equal(W.previewableLocal(listed[0],[W.KEY(listed[0])]),true);
assert.equal(W.previewableLocal(listed[2],[W.KEY(listed[2])]),false);
const good=W.chooserItem({id:'id:abc',name:'Viva master.wav',link:'https://www.dropbox.com/s/abc/file.wav',bytes:4000});
assert.equal(good?.id,'id:abc');
assert.equal(W.chooserItem({name:'Virus.exe',link:'https://www.dropbox.com/s/a'}),null);
assert.equal(W.chooserItem({name:'Brano.wav',link:'https://evil.test/audio.wav'}),null);
assert.equal(W.chooserItem({name:'Brano.wav',link:'javascript:alert(1)'}),null);
assert.equal(W.chooserItem({name:'Brano.wav',link:'https://dropbox.com.evil.test/a'}),null);
const html=read('kyv_audio_finder.html'),ui=read('kyv-audio-finder-ui-v245.js'),sw=read('sw.js');
for(const id of ['finder-explorer','explorer-items','explorer-query','explorer-source','explorer-account',
 'explorer-linked','explorer-sort','explorer-player','explorer-stop','finder-dropbox-choose',
 'finder-preview-query','finder-preview-state','finder-advanced'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('src="kyv-audio-workspace-v251.js"'));
assert.ok(ui.includes('W.approved(catalogue,decisions,links)'));
assert.ok(ui.includes('W.query(explorerApproved()'));
assert.ok(ui.includes('W.chooserItem'));
assert.ok(ui.includes('Dropbox Chooser')&&ui.includes('chooser.choose('));
assert.ok(ui.includes("previewScan(rows,'File selezionati nel Chooser ufficiale"),'Chooser cannot index directly');
assert.ok(ui.includes('URL.createObjectURL(file)')&&ui.includes('URL.revokeObjectURL(playerObjectUrl)'));
assert.ok(ui.includes("window.addEventListener('pagehide'"),'Stop playback and release memory on exit');
assert.ok(ui.includes("J.selectionPlan(preview,[...scanChecked],previewIndices().slice(0,previewShown))"),
 'Mass approval must only cover currently shown and filtered files');
assert.ok(ui.includes('C.plan(I.safeRows(preview),owner)')&&ui.includes('KYV_AUDIO_PROJECT.createFromItem'),
 'Keep independent explicit ownership and manual project confirmation');
assert.ok(!ui.includes('createProjectFromScan'), 'Discovery must never create a project');
assert.ok(sw.includes("'./kyv-audio-workspace-v251.js'"));
assert.equal(JSON.parse(read('package.json')).version,'2.60.0');
assert.equal(read('VERSION').trim() ,'2.60');
assert.ok(read('guida.html').includes('v2.51'));
assert.ok(read('kyv-help.js').includes('v2.51'));
console.log('OK: v2.51 approved-only explorer, safe Dropbox Chooser, filtered review and temporary audio playback');
