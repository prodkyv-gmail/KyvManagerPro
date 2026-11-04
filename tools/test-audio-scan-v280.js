// v2.80 — deterministic, no-network Audio Finder scan preflight and privacy guards.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const host={};
vm.runInNewContext(read('kyv-audio-scan-v280.js'),{window:host});
const S=host.KYV_AUDIO_SCAN_V280;
assert.ok(S&&S.MAX_FILES===5000);
const audio=(name,type)=>/\.(wav|mp3|flac)$/i.test(name)||/^audio\//i.test(type||'');
const mixed=[
 {name:'Ballad demo.wav',type:'audio/wav',size:42,lastModified:20},
 {name:'notes.txt',type:'text/plain'},
 {name:'Ballad mix.MP3',type:'audio/mpeg',size:43,lastModified:21}
];
const p=S.preflight(mixed,{isAudio:audio});
assert.equal(p.selected,3);assert.equal(p.audio,2);assert.equal(p.ignored,1);
assert.deepEqual(Array.from(p.files,x=>x.name),['Ballad demo.wav','Ballad mix.MP3']);
assert.equal(mixed.length,3,'No mutation of browser-selected file objects');
assert.throws(()=>S.preflight([],{isAudio:audio}),/Seleziona/);
assert.throws(()=>S.preflight([{name:'notes.txt'}],{isAudio:audio}),/nessun file audio/);
assert.throws(()=>S.preflight(mixed,{isAudio:audio,max:2}),/massimo 2/);
assert.throws(()=>S.preflight(mixed),/Verifica audio non disponibile/);
const entries=[
 {provider:'local',account_label:'Mac personale',external_key:'a'},
 {provider:'local',account_label:'Mac personale',external_key:'a'},
 {provider:'local',account_label:'Altro Mac',external_key:'a'},
 {provider:'drive',account_label:'Google 1',external_key:'a'},
 {provider:'dropbox',account_label:'KYV',external_key:'b'},
 {provider:'onedrive',account_label:'MS',external_key:''},
 {provider:'cloud-unknown',account_label:'?',external_key:'c'}
];
const scope=S.coverage(entries);
assert.equal(scope.total,4,'Source/account/key are composite identity, never filename or guessed hash');
assert.deepEqual(Array.from(Object.values(scope.counts)),[2,1,1,0]);
assert.equal(scope.details.length,3);
assert.equal(S.coverage([]).total,0);
const notes=S.readiness({secure:true,cryptoReady:true,filePicker:true,folderPicker:true,driveAccounts:2,driveReader:true,
 dropboxChooser:false,dropboxOAuth:true,onedriveOAuth:true,onedriveIndex:false});
assert.equal(notes.length,5);
assert.ok(notes[0].includes('selezione manuale disponibile')&&notes[0].includes('identificazione metadati disponibile'));
assert.ok(notes[1].includes('verifica sul dispositivo'));
assert.ok(notes[2].includes('2 account configurati')&&notes[2].includes('permessi verificati solo alla ricerca'));
assert.ok(notes[3].includes('Chooser da configurare'));
assert.ok(notes[4].includes('non abilitata'));
const limited=S.readiness({secure:false,cryptoReady:false});
assert.ok(limited[0].includes('HTTPS/crypto richiesti'));
assert.ok(limited[2].includes('non pronto'));
const ui=read('kyv-audio-finder-ui-v245.js'),html=read('kyv_audio_finder.html');
assert.ok(html.includes('<script src="kyv-audio-scan-v280.js"></script>'));
for(const key of ['finder-source-readiness','finder-local-progress','finder-scan-coverage'])assert.equal((html.match(new RegExp('id="'+key+'"','g'))||[]).length,1,key+' is a single existing-workflow feedback');
assert.ok(html.includes('id="finder-folder" data-finder-action')&&html.includes('id="finder-files" data-finder-action'),'File selectors locked during explicit scan');
assert.ok(ui.includes('S.preflight(files,{isAudio:(name,mime)=>F.isAudio(name,mime),max:MAX})'));
assert.ok(ui.includes('S.readiness({secure:window.isSecureContext===true'));
assert.ok(ui.includes('S.coverage(rows)'),'Actual selected coverage, not an inferred global crawler');
assert.ok(ui.includes("if((i+1)%80===0||i+1===selection.audio)"),'Bounded periodic progress updates');
assert.ok(ui.includes("new TextEncoder().encode(relative+'|'+f.size+'|'+f.lastModified)"),'Local identity uses metadata, not file bytes');
assert.ok(ui.includes('event.target.value=\'\';'),'Allow same file reselect after a canceled scan');
assert.ok(ui.includes('if(!checkedUnsaved&&!guardScanChanges())return false;'),'No silent replacement of pending review');
for(const fn of ['chooseDropbox','drive','dropbox','local','beginCloud']){
 const fragment=ui.slice(ui.indexOf('async function '+fn+'('),ui.indexOf('async function '+fn+'(')+950);
 assert.ok(fragment.includes('guardScanChanges()'),fn+' must guard pending decisions before I/O or OAuth');
}
assert.ok(ui.includes("if(!guardScanChanges())return;"),'Cloud sources can be canceled without wiping decisions');
assert.ok(ui.includes("db.from('KYV_AUDIO_DECISIONI').upsert"),'Preexisting explicit consent write remains');
assert.ok(ui.includes("db.from('KYV_AUDIO_ASSOCIAZIONI').insert"),'Preexisting separate link write remains');
assert.ok(ui.includes("confirm('Confermi il collegamento"),'Project link still requires human confirmation');
assert.ok(ui.includes('R.planLinks(selections,personalCatalogue(),projects,links,owner)'));
assert.doesNotMatch(read('kyv-audio-scan-v280.js'),/fetch\(|localStorage|(?:db|supabase)\.from\(|MutationObserver|createFromItem/);
assert.equal(read('VERSION').trim(),'2.80');
assert.equal(require('../package.json').version,'2.80.0');
assert.ok(read('config.js').includes("APP_VERSION: '2.80'"));
assert.ok(read('sw.js').includes('kyv-studio-v2-80-guided-audio-scan-20261104'));
assert.ok(read('sw.js').includes("'./kyv-audio-scan-v280.js'"));
assert.ok(read('guida.html').includes('id="v280-audio-scan"'));
assert.ok(read('kyv-help.js').includes('v2.80 · Scansione guidata e copertura reale'));
assert.ok(read('MANUALE_OPERATIVO.md').includes('v2.80 — Audio Finder'));
assert.ok(require('../package.json').scripts.check.includes('check:audio-scan-v280'));
console.log('OK v2.80: local audio preflight, real coverage, source status, pending decisions and explicit links');
