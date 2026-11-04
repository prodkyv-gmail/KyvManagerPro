// KYV v2.53 — explicit multi-source scan, dedup by source identity, no project or index writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),root={};
for(const name of ['kyv-audio-finder-v245.js','kyv-audio-consent-v248.js','kyv-audio-groups-v249.js','kyv-audio-batch-v253.js'])
 vm.runInNewContext(read(name),{window:root,Date,Number,Object,Map,Set,URL,Intl,Promise},{filename:name});
const B=root.KYV_AUDIO_BATCH_V253;
const make=(id,name,provider='drive',account='KYV',extra={})=>({
 provider,account_label:account,external_key:id,nome_file:name,
 size_bytes:1234,mime_type:'audio/wav',modificato_il:'2026-11-03T10:00:00.000Z',
 percorso_relativo:'Studio',content_hash:null,link_file:null,...extra
});
async function tests(){
 const source1=[
  make('d1','Emma - Mia Luce demo.wav'),
  make('d1','Emma - Mia Luce demo.wav'),
  make('d2','Emma - Mia Luce mix.wav'),
  make('bad','notaudio.txt','drive','KYV',{mime_type:'text/plain'})
 ];
 const source2=[make('b1','Emma - Mia Luce master.wav','dropbox','Archivio Dropbox'),
  make('d1','Emma - Mia Luce demo.wav','dropbox','Archivio Dropbox')];
 const combined=B.combine([
  {provider:'drive',rows:source1,errors:[],truncated:true},
  {provider:'dropbox',rows:source2,errors:[],truncated:false}
 ]);
 assert.equal(combined.total,4,'Same provider/account/key collapses; different provider remains distinct');
 assert.equal(combined.reports[0].redundant,1);
 assert.equal(combined.reports[0].invalid,1);
 assert.equal(combined.reports[0].status,'partial');
 assert.equal(combined.reports[1].status,'complete');
 assert.equal(combined.partial,true);
 assert.ok(combined.warnings.some(x=>x.includes('limite di pagine')));
 assert.ok(combined.warnings.some(x=>x.includes('non validi')));
 assert.equal(combined.rows.some(x=>x.nome_file==='notaudio.txt'),false);
 assert.equal(B.combine([{provider:'onedrive',rows:[]}]).reports.length,1,'OneDrive is a bounded optional provider');
 assert.throws(()=>B.combine([{provider:'ftp',rows:[]}]),/non autorizzata/);
 assert.throws(()=>B.combine([{provider:'drive',rows:source1}],2),/Oltre 2 file/);
 const conflicting=B.combine([{provider:'drive',rows:[
  make('abc','Brano demo.wav'),make('abc','Brano master.wav','drive','KYV',{size_bytes:4321})
 ]}]);
 assert.equal(conflicting.total,1);
 assert.equal(conflicting.reports[0].conflicts,1,'Same identity changed metadata requires manual review');
 assert.equal(conflicting.rows[0].nome_file,'Brano demo.wav','No speculative metadata replacement');
 assert.ok(conflicting.warnings.some(x=>x.includes('discordanti')));
 const withoutRevisions=B.combine([{provider:'drive',rows:[
  make('abc','Brano demo.wav','drive','KYV',{content_hash:'a'.repeat(64)}),
  make('abc','Brano demo.wav','drive','KYV',{content_hash:null})
 ]}]);
 assert.equal(withoutRevisions.rows[0].content_hash,'a'.repeat(64));
 const asyncResults=await B.scan({drive:true,dropbox:true,
  driveReader:async()=>({rows:source1.slice(0,1),errors:[],truncated:false}),
  dropboxReader:async()=>{throw Error('Archivio non disponibile')}
 });
 assert.equal(asyncResults.total,1,'Independent source failure must not discard successful source');
 assert.equal(asyncResults.reports.length,2);
 assert.equal(asyncResults.reports[1].status,'error');
 assert.ok(asyncResults.warnings.some(x=>x.includes('Archivio non disponibile')));
 assert.equal(asyncResults.partial,true);
 const limited=await B.scan({drive:true,driveReader:async()=>({rows:source1.slice(0,1),truncated:true})});
 assert.equal(limited.partial,true);
 const onlyDropbox=await B.scan({dropbox:true,dropboxReader:async()=>({rows:source2})});
 assert.equal(onlyDropbox.reports.length,1);
 assert.ok(onlyDropbox.rows.every(x=>x.provider==='dropbox'));
 await assert.rejects(B.scan({}),/Seleziona almeno una fonte/);
 await assert.rejects(B.scan({drive:true}),/Connettore Drive/);
 const verified='b'.repeat(64);
 const original=make('known','Titolo diverso.wav','dropbox','Dropbox',{content_hash:verified});
 const nameCandidate=make('other','Emma - Mia Luce master.wav','dropbox','Dropbox',{content_hash:null});
 const differentArtist=make('other2','Giorgia - Mia Luce master.wav','dropbox','Dropbox');
 const incoming=make('new','Emma - Mia Luce demo.wav','drive','Drive',{content_hash:verified});
 const matches=B.propose(incoming,[original,nameCandidate,differentArtist],5);
 assert.equal(matches.length,2);
 assert.ok(matches.some(x=>x.sameHash&&x.relationship.includes('SHA-256')));
 assert.ok(matches.some(x=>!x.sameHash&&x.relationship.includes('Titolo compatibile')));
 assert.ok(!matches.some(x=>x.name.includes('Giorgia')),'Explicitly different artists must not be matched by title');
 assert.ok(matches.every(x=>x.noAutomaticLink===true));
 const noMatch=B.propose(make('x','Casuale.wav'),[differentArtist],3);
 assert.equal(noMatch.length,0);
 const page=read('kyv_audio_finder.html'),ui=read('kyv-audio-finder-ui-v245.js'),sw=read('sw.js');
 for(const id of ['batch-scan','batch-drive','batch-dropbox','batch-status','batch-warnings'])
  assert.ok(page.includes('id="'+id+'"'),id);
 assert.ok(page.includes('src="kyv-audio-batch-v253.js"'));
 assert.ok(ui.includes('B.scan({drive:driveSelected,dropbox:dropboxSelected'), 'Sources must require explicit selection');
 assert.ok(ui.includes('Promise')===false||ui.includes('B.scan('),'Pure multi-source aggregator owns isolation');
 assert.ok(ui.includes('previewScan(result.rows,'),'Scan only enters the manual review queue');
 assert.ok(ui.includes('B.propose(f,knownPersonal,2)'),'Suggestions consider only approved personal files');
 assert.ok(ui.includes('C.plan(I.safeRows(preview),owner)'),'Ownership approval required before any indexing');
 assert.ok(ui.includes('KYV_AUDIO_PROJECT.createFromItem'),'Project creation remains a separate explicit workflow');
 assert.ok(ui.includes('if(preview.some(f=>f._explicit)'),'Warn before replacing unsaved decisions');
 assert.ok(!ui.includes('createProjectFromScan'),'No auto-project during scanning');
 assert.ok(!read('kyv-audio-batch-v253.js').includes('.from('),'Batch helper must not touch Supabase');
 assert.ok(sw.includes("'./kyv-audio-batch-v253.js'"));
 assert.equal(JSON.parse(read('package.json')).version,'2.74.0');
 assert.equal(read('VERSION').trim() ,'2.74');
 assert.ok(read('guida.html').includes('v2.53'));
 assert.ok(read('kyv-help.js').includes('v2.53'));
 console.log('OK: v2.53 multi-cloud batch scan isolated, exact-source dedup, partial results and human-only project actions');
}
tests().catch(e=>{console.error(e);process.exitCode=1});
