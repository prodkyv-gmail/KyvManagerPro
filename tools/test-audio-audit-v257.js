// KYV v2.57 — audit reads only approved user metadata and current scan decisions.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),root={};
const ctx={window:root,Map,Set,Object,Number,Date,Intl,URL,Error};
for(const path of ['kyv-audio-consent-v248.js','kyv-audio-workspace-v251.js','kyv-audio-audit-v257.js'])
 vm.runInNewContext(read(path),ctx,{filename:path});
const A=root.KYV_AUDIO_AUDIT_V257;
const hash='A'.repeat(64),otherHash='b'.repeat(64);
const f=(id,name,provider='local',digest=null)=>({
 id,provider,account_label:'KYV',external_key:'key-'+id,nome_file:name,
 mime_type:'audio/wav',content_hash:digest,percorso_relativo:'Studio'
});
const approved1=f('a','Emma - Là dove vado demo.wav','local',hash);
const approved2=f('b','Emma - Là dove vado mix.wav','drive',hash.toLowerCase());
const approved3=f('c','Sissi - Estate master.wav','dropbox',otherHash);
const reference=f('ref','Reference.wav','drive',hash);
const undecided=f('unknown','Memo esterna.wav','local',hash);
const catalogue=[approved1,approved2,approved3,reference,undecided];
const decisions=catalogue.map((x,i)=>({...x,decision:i<3?'mio':i===3?'reference':'da_verificare'}));
const links=[
 {id_audio:'a',id_progetto:12,confermata:true,annullata:false},
 {id_audio:'a',id_progetto:12,confermata:false,annullata:false},
 {id_audio:'b',id_progetto:13,confermata:false,annullata:false},
 {id_audio:'c',id_sessione:'S1',confermata:true,annullata:false},
 {id_audio:'ref',id_progetto:13,confermata:true,annullata:false},
 {id_audio:'c',id_progetto:13,confermata:true,annullata:true}
];
const projects=[{ID:12,TITOLO:'Là dove vado',ARTISTA:'Emma'},{ID:13,TITOLO:'Estate',ARTISTA:'Sissi'},{ID:14,TITOLO:'Brano storico',ARTISTA:'Altro'}];
const preview=[
 {...undecided,decision:'da_verificare'},
 {...undecided,decision:'da_verificare'}, // duplicate identity from a partial scan is counted once
 {...reference,decision:'reference'},
 {...approved1,decision:'mio',_explicit:true},
 f('new','Una demo non attribuita.wav','drive',null)
].map(x=>({...x,decision:x.decision||'da_verificare'}));
const snapshot=A.report({catalogue,decisions,links,projects,preview});
const s=snapshot.summary;
assert.equal(s.approved,3,'Only files approved as mine count');
assert.equal(s.pendingScan,2,'Only undecided current-scan identities count');
assert.equal(s.savedPending,1,'Saved review decisions reported separately without guessing file names');
assert.equal(s.unlinked,2,'Unconfirmed and session-only links do not count as project associations');
assert.equal(s.duplicateGroups,1,'Hash of reference cannot create a personal duplicate');
assert.equal(s.duplicateFiles,2);
assert.equal(s.projectsWithoutApprovedAudio,2,'A reference-only project has no approved personal audio');
assert.equal(s.projectsChecked,3);
const types=snapshot.findings.reduce((n,x)=>(n[x.type]=(n[x.type]||0)+1,n),{});
assert.equal(types.pending,2);assert.equal(types.unlinked,2);
assert.equal(types.duplicates,1);assert.equal(types.projects,2);
assert.ok(!snapshot.findings.some(x=>x.type==='unlinked'&&x.title==='Reference.wav'));
assert.ok(!snapshot.findings.some(x=>x.type==='duplicates'&&x.files.some(f=>f.id==='ref')));
const d=A.filterFindings(snapshot,{type:'duplicates'});
assert.equal(d.length,1);
assert.deepEqual(Array.from(d[0].sources),['drive','local']);
assert.equal(A.filterFindings(snapshot,{source:'drive',type:'unlinked'}).length,1);
assert.equal(A.filterFindings(snapshot,{source:'local',type:'projects'}).length,0,
 'Projects without catalogued personal audio are global, never invented per source');
assert.equal(A.filterFindings(snapshot,{query:'LA DOVE',type:'duplicates'}).length,1,'Accent-insensitive search');
assert.equal(A.filterFindings(snapshot,{query:'Sissi',type:'projects'}).length,1);
assert.equal(A.filterFindings(snapshot,{type:'pending',source:'drive'}).length,1);
assert.equal(A.filterFindings(snapshot,{source:'onedrive'}).length,0,'OneDrive is valid but not approved here');
assert.throws(()=>A.filterFindings(snapshot,{source:'ftp'}),/Sorgente/);
assert.throws(()=>A.filterFindings(snapshot,{type:'hidden'}),/Filtro/);
assert.equal(A.report().summary.approved,0);
const source=read('kyv-audio-audit-v257.js'),ui=read('kyv-audio-finder-ui-v245.js'),
 html=read('kyv_audio_finder.html'),sw=read('sw.js');
assert.ok(!source.includes('.from('),'Audit has no database writes or reads');
assert.ok(!source.includes('fetch('),'Audit must never search cloud automatically');
assert.ok(ui.includes("A.report({catalogue,decisions,links,projects,preview})"));
assert.ok(ui.includes('function renderAudit()')&&ui.includes('function focusAuditPending(name)'));
assert.ok(ui.includes('data-audit-file')&&ui.includes('data-audit-pending'));
assert.ok(ui.includes("renderExplorer();renderAudit();info('Anteprima scartata"));
assert.ok(ui.includes(' updateScanSelected();\n renderAudit();'));
for(const id of ['finder-audit','audit-kpis','audit-coverage','audit-status',
 'audit-items','audit-more','audit-query','audit-type','audit-source'])assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('kyv-audio-audit-v257.js'));
assert.ok(sw.includes("'./kyv-audio-audit-v257.js'"));
assert.ok(sw.includes('kyv-studio-v2-68-safe-mutations-20261104'));
assert.equal(JSON.parse(read('package.json')).version,'2.68.0');
assert.equal(read('VERSION').trim(),'2.68');
assert.ok(read('guida.html').includes('v2.57'));
assert.ok(read('kyv-help.js').includes('v2.57'));
console.log('OK: v2.57 approved-only audit, SHA copy proof, pending scan, projects and manual navigation');
