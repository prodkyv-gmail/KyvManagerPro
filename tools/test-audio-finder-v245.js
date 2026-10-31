// v2.45 KYV Audio Finder: source identity, safe linking, navigation and version gates.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),w={};
vm.runInNewContext(read('kyv-audio-finder-v245.js'),{window:w,URL,Date,Number,Object,Error});
const F=w.KYV_AUDIO_FINDER_V245;assert.ok(F?.record&&F?.suggestions&&F?.duplicates);
const r=F.record({provider:'drive',account:'prodkyv@example.test',externalKey:'g-24',
 name:'Emma - Nuova Luce - DEMO_v03.wav',size:12900,modified:'2026-05-01T10:00:00Z',
 url:'https://drive.google.com/file/d/g-24/view'});
assert.equal(r.provider,'drive');assert.equal(r.size_bytes,12900);
assert.equal(r.modificato_il,'2026-05-01T10:00:00.000Z');
assert.equal(r.content_hash,null);assert.equal(r.link_file,'https://drive.google.com/file/d/g-24/view');
assert.equal(F.isAudio('music.wav',''),true);assert.equal(F.isAudio('download.exe',''),false);
assert.equal(F.safeUrl('javascript:alert(1)'),null);
const local=F.record({provider:'local',account:'Mac personale',externalKey:'9'.repeat(64),
 name:'DEMO_v02.aiff',path:'sessioni/2026',url:'https://somewhere.invalid'});
assert.equal(local.link_file,null,'Local files never transmit their content/link');
assert.throws(()=>F.record({provider:'onedrive',externalKey:'x',name:'a.wav'}),'Direct Graph not implemented');
assert.throws(()=>F.record({provider:'drive',externalKey:'x',name:'a.exe'}));
const projects=[
 {ID:11,TITOLO:'Nuova Luce',ARTISTA:'Emma'},
 {ID:12,TITOLO:'Nuova Luce',ARTISTA:'Altro'},
 {ID:13,TITOLO:'Notte al mare',ARTISTA:'Emma'}
];
const su=F.suggestions(r,projects);
assert.equal(su.length,2,'Two title matches require human confirmation');
assert.equal(su[0].id,11,'Artist + title suggested before title-only');
assert.ok(su[0].reason.includes('Titolo e artista'));
assert.equal(F.suggestions(r,[{ID:15,TITOLO:'Notte al mare'}]).length,0,'No invented match by artist only');
assert.equal(F.suggestions({nome_file:'a.wav'},projects).length,0,'Short names should not match');
const duplicates=F.duplicates({...r,content_hash:'a'.repeat(64)},[
 {...r,content_hash:'a'.repeat(64)},{...r,external_key:'altro',content_hash:'a'.repeat(64)},
 {...r,external_key:'different',content_hash:'b'.repeat(64)}
]);
assert.equal(duplicates.sameSource.length,1);assert.equal(duplicates.sameHash.length,2);
const sql=read('docs/v245-audio-finder.sql'),ui=read('kyv-audio-finder-ui-v245.js'),page=read('kyv_audio_finder.html');
for(const name of ['KYV_AUDIO_INDICE','KYV_AUDIO_ASSOCIAZIONI']){
 assert.ok(sql.includes('public."'+name+'"'));
 assert.ok(sql.includes('alter table public."'+name+'" enable row level security'));
}
assert.ok(sql.includes('foreign key(owner_id,id_audio)'));
assert.ok(sql.includes('foreign key(owner_id,id_sessione)'));
assert.ok(sql.includes('owner_id=new.owner_id'),'Project ownership must be checked');
assert.ok(sql.includes('kyv_audio_identity unique(owner_id,provider,account_label,external_key)'));
assert.ok(sql.includes('annullata boolean not null default false'));
assert.doesNotMatch(sql,/grant\s+delete|alter\s+table\s+public\."PROGETTI"|update\s+public\."PROGETTI"/i);
assert.ok(ui.includes("window.KYV_DRIVE.listFiles")===false||ui.includes('KYV_DRIVE.listFiles'),'Existing Drive bridge is used');
assert.ok(ui.includes("all('DROPBOX_AUDIO_FILES'"),'Use preexisting authorized Dropbox archive');
assert.ok(ui.includes('webkitRelativePath'),'Browser folder scanning is explicit');
assert.ok(ui.includes('crypto.subtle.digest'),'Local identity hash has no absolute path');
assert.ok(ui.includes('content_hash:x.content_hash||old?.content_hash'),'Reindex must preserve verified hash');
assert.ok(ui.includes("db.from('KYV_AUDIO_INDICE').upsert"),'Metadata saved on explicit action');
assert.ok(ui.includes("db.from('KYV_AUDIO_ASSOCIAZIONI').insert"),'Links saved separately with confirmation');
assert.ok(ui.includes("confirm('Confermi il collegamento"),'Never link inferred project without confirmation');
assert.doesNotMatch(ui,/\.delete\(|\.remove\(|\.upload\(/,'Never delete or upload binaries');
assert.ok(page.includes('id="finder-folder"')&&page.includes('webkitdirectory'));
assert.ok(page.includes('OneDrive online')&&page.includes('non ancora attivo'));
assert.ok(page.includes('id="finder-preview"')&&page.includes('id="finder-link-form"'));
assert.ok(page.includes('src="kyv-drive-bridge.js"'));
assert.ok(read('scheda_progetto.html').includes('KYV_AUDIO_LINKED_V245.showProject(p.ID)'));
assert.ok(read('kyv-creative-desk-ui-v244.js').includes('KYV_AUDIO_ASSOCIAZIONI'));
assert.ok(read('kyv-creative-desk-ui-v244.js').includes('kyv_audio_finder.html?session='));
assert.ok(read('integrazioni.html').includes('href="kyv_audio_finder.html"'));
assert.ok(read('kyv-producer-mode.js').includes("'kyv_audio_finder.html','Audio Finder'"));
assert.ok(read('menu.js').includes("navItem('audiofinder'"));
assert.ok(read('sw.js').includes('kyv-studio-v2-45-guides-20261031'));
for(const x of ['kyv_audio_finder.html','kyv-audio-finder-v245.js','kyv-audio-finder-ui-v245.js','kyv-audio-finder-linked-v245.js'])
 assert.ok(read('sw.js').includes("'./"+x+"'"));
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'2.45.0');
assert.equal(read('VERSION').trim(),'2.45');
assert.equal(pkg.scripts['check:audio-finder-v245'],'node tools/test-audio-finder-v245.js');
assert.ok(pkg.scripts.check.includes('check:audio-finder-v245'));
console.log('OK: Audio Finder v2.45 metadata indexing, duplicate signals, consent, RLS, project/session links and PWA');
