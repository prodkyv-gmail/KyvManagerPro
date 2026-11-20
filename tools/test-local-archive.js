/* Local archive: Agenda calendar imports and ADD Progetto real private audio. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const root={location:{href:'https://kyvmanagerpro.example/acquisisci_audio.html'},crypto:{subtle:globalThis.crypto?.subtle}};
const documentStub={readyState:'loading',addEventListener:()=>{}};
vm.runInNewContext(read('kyv-agenda-local.js'),{window:root,Date});
vm.runInNewContext(read('kyv-local-audio.js'),{window:root,URL,document:documentStub});
const agenda=root.KYV_AGENDA_LOCAL,local=root.KYV_LOCAL_AUDIO;
assert.ok(agenda&&local);
assert.equal(agenda.MAX_FILE_BYTES,2097152);
assert.equal(agenda.dateISO('20/11/2026'),'2026-11-20');
assert.equal(agenda.dateISO('20261120'),'2026-11-20');
assert.equal(agenda.dateISO('31/02/2026'),null);
assert.equal(agenda.dateISO('2026-11-20'),'2026-11-20');
assert.deepEqual(JSON.parse(JSON.stringify(agenda.icsDate('20261120T111500Z'))).allDay,false);
const ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:one\r\nSUMMARY:Sessione con Artista\r\nDTSTART;VALUE=DATE:20261120\r\nDTEND;VALUE=DATE:20261122\r\nDESCRIPTION:Riunione con\\n dettagli\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:Seconda sessione\r\nDTSTART:20261123T110000\r\nDTEND:20261123T120000\r\nEND:VEVENT\r\nEND:VCALENDAR';
const cal=agenda.parseIcs(ics);
assert.equal(cal.records.length,2);
assert.equal(cal.records[0].title,'Sessione con Artista');
assert.equal(cal.records[0].date,'2026-11-20');
assert.equal(cal.records[0].endDate,'2026-11-21','ICS all-day end date is exclusive');
assert.equal(cal.records[0].allDay,true);
assert.equal(cal.records[1].time,'11:00');
assert.equal(cal.records[1].endTime,'12:00');
const csv='Titolo;Data;Ora;Ora fine;Descrizione;Luogo\r\n"Sessione; con artisti";20/11/2026;11:00;12:00;"Nota, una";Studio\r\n"Scadenza";21/11/2026;;;;';
const parsed=agenda.parseCsv(csv);
assert.equal(parsed.records.length,2);
assert.equal(parsed.records[0].title,'Sessione; con artisti');
assert.equal(parsed.records[0].time,'11:00');
assert.equal(parsed.records[1].allDay,true);
assert.equal(parsed.records[0].description,'Nota, una');
assert.equal(agenda.key(parsed.records[0]),agenda.key({...parsed.records[0]}));
assert.notEqual(agenda.key(parsed.records[0]),agenda.key(parsed.records[1]));
assert.throws(()=>agenda.parseCsv('Titolo;Luogo\nX;studio'),/Titolo e Data/);
assert.equal(local.MAX_SIZE,50*1024*1024);
assert.equal(local.inspect({name:'sessione.wav',size:1000,type:'audio/wav'}).mime,'audio/wav');
assert.equal(local.inspect({name:'sessione.aiff',size:2000,type:''}).mime,'application/octet-stream');
assert.throws(()=>local.inspect({name:'evil.exe',size:200,type:'application/octet-stream'}),/file audio/);
assert.throws(()=>local.inspect({name:'huge.wav',size:local.MAX_SIZE+1,type:'audio/wav'}),/50 MB/);
assert.equal(local.safeProjectId('48'),48);assert.equal(local.safeProjectId('new'),null);
assert.match(local.publicLink('uid/clip.wav'),/kyv_local_audio\.html\?file=uid%2Fclip\.wav/);
const html=read('kyv_calendar.html'),store=read('kyv-agenda-store.js'),intake=read('acquisisci_audio.html'),
 audio=read('kyv_local_audio.html'),js=read('kyv-local-audio.js'),ui=read('kyv-agenda-local-ui.js'),
 sw=read('sw.js'),sql=read('docs/kyv-local-audio-bucket-20261120.sql');
for(const name of ['kyv-agenda-local.js','kyv-agenda-local-ui.js','kyv-agenda-local.css'])
 assert.ok(html.includes(name),'Agenda includes '+name);
for(const id of ['kyv-agenda-local-file','kyv-agenda-local-preview','kyv-agenda-local-save','kyv-agenda-local-status'])
 assert.ok(html.includes('id="'+id+'"'));
assert.match(store,/async function importLocalRecords\(records\)/);
assert.match(store,/ignoreDuplicates:true/,'Repeat imports do not overwrite historical events');
assert.match(store,/showStatus\(accepted.length/,'User gets saved and duplicate counts');
assert.doesNotMatch(ui,/createEvent\(|calendarRequest\(/,'Local imports never auto-create Google events');
for(const name of ['kyv-local-audio.js','kyv-local-audio-choose','kyv-local-audio-file','kyv-local-audio-project','kyv-local-audio-check','kyv-local-audio-import'])
 assert.ok(intake.includes(name));
assert.match(js,/KYV_AUDIO_PROJECT\.linkToProject\(/,'Local file links through existing atomic project-version workflow');
assert.match(js,/crypto\.subtle\.digest\('SHA-256'/,'Local audio duplicates are content hashed');
assert.match(js,/\.eq\('CONTENT_HASH',sha\)/,'Lookup of existing identical versions');
assert.match(js,/storage\.from\(BUCKET\)\.upload/);
assert.match(audio,/KYV_AUTH\.requireAuth\(\)/);
assert.match(audio,/\.eq\('PROVIDER','local'\)/,'Audio playback verifies archival record');
assert.match(audio,/\.storage\.from\('kyv-local-audio'\)\.download/,'Audio downloaded privately with authorization');
assert.match(sql,/false,52428800/,'Bucket is private and 50 MB bounded');
assert.match(sql,/storage\.foldername\(name\)/,'No cross-user access');
for(const p of ['kyv-agenda-local.js','kyv-agenda-local-ui.js','kyv-agenda-local.css','kyv-local-audio.js','kyv_local_audio.html'])
 assert.ok(sw.includes("'./"+p+"'"),'PWA assets: '+p);
for(const c of [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)])new vm.Script(c[1]);
for(const c of [...intake.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)])new vm.Script(c[1]);
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.scripts['check:local-archive'],'node tools/test-local-archive.js');
(async()=>{
 await assert.rejects(agenda.readFile({name:'x.exe',size:120,text:async()=>''}),/\.ics o \.csv/);
 const out=await agenda.readFile({name:'test.csv',size:90,text:async()=>csv});
 assert.equal(out.records.length,2);
 console.log('OK: local Agenda calendar intake; secure local audio into existing project, duplicate checks and private retrieval.');
})().catch(e=>{console.error(e);process.exitCode=1});
