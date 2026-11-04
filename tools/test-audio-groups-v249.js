// KYV Audio Finder v2.49: group suggestions are read-only, only personal files and selected links.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const root={},ctx={window:root,Intl,Date,URL,Object,Number,Error,Map,Set};
for(const path of ['kyv-audio-finder-v245.js','kyv-audio-review-v246.js','kyv-audio-consent-v248.js','kyv-audio-groups-v249.js','kyv-audio-project.js'])vm.runInNewContext(read(path),ctx);
const G=root.KYV_AUDIO_GROUPS_V249,R=root.KYV_AUDIO_REVIEW_V246;
const f=(id,name,provider='local',hash=null)=>({id,nome_file:name,provider,account_label:'KYV',external_key:'key-'+id,mime_type:'audio/wav',content_hash:hash,percorso_relativo:'Studio'});
const hash='a'.repeat(64);
const files=[
 f('a','Emma - Nuova Luce - DEMO_v03.wav'),
 f('b','Emma - Nuova Luce - MIX_v04.wav','drive'),
 f('c','Nuova Luce master.wav','dropbox'),
 f('d','Mew - Nuova Luce - DEMO.wav'),
 f('e','Luna Viva demo.wav'),
 f('f','Luna Viva MASTER_v2.wav','drive'),
 f('g','La Finale mix.wav'),
 f('h','La Finale master.wav','dropbox'),
 f('i','Emma - Nuova Luce - acapella.wav','local',hash),
 f('j','Emma - Nuova Luce - instrumental.wav','drive',hash),
 f('k','track.wav')
];
assert.equal(G.versionOf(files[0]).kind,'Demo');
assert.equal(G.versionOf(files[1]).kind,'Mix');
assert.equal(G.versionOf(files[2]).kind,'Master');
assert.equal(G.versionOf(files[9]).kind,'Strumentale');
assert.equal(G.versionOf(files[0]).number,'03');
assert.equal(G.stem(files[0]).title,'Nuova Luce');
assert.equal(G.stem(files[0]).artist,'Emma');
assert.equal(G.stem(files[6]).title,'La Finale','A title containing Finale is not a master label');
const groups=G.groups(files,[]);
assert.ok(groups.every(g=>g.needsReview),'All filename groups are only proposals');
const emma=groups.find(g=>g.artist==='Emma'&&g.title==='Nuova Luce');
const mew=groups.find(g=>g.artist==='Mew'&&g.title==='Nuova Luce');
const unknown=groups.find(g=>g.ambiguousArtist&&g.title==='Nuova Luce');
assert.ok(emma&&mew&&unknown,'Same title from different artists must never be silently merged');
assert.equal(emma.files.length,4);
assert.equal(emma.exactHashDuplicates,1,'Only verified SHA-256 identical copies count');
assert.equal(unknown.files.length,1);
assert.ok(!emma.files.some(e=>e.file.id==='d'),'Other artist excluded');
assert.equal(groups.some(g=>g.title==='track'),false,'Generic file names must not produce projects');
const luna=groups.find(g=>g.title==='Luna Viva');
assert.equal(luna.files.length,2);
assert.deepEqual(Array.from(luna.providers),['drive','local']);
assert.equal(G.filter(groups,{source:'drive',mode:'multi'}).some(g=>g.title==='Luna Viva'),true);
assert.equal(G.filter(groups,{query:'Luna Viva',mode:'all'}).length,1);
const sole=[f('s1','Emma - Sole Vero demo.wav'),f('s2','Sole Vero master.wav')];
const soleGroups=G.groups(sole,[]);
assert.equal(soleGroups.length,2,'One named artist must not absorb the unattributed master');
assert.equal(soleGroups.find(g=>g.artist==='Emma').files.length,1);
assert.ok(soleGroups.find(g=>g.ambiguousArtist).files.some(e=>e.file.id==='s2'));
assert.equal(groups.find(g=>g.title==='Luna Viva').ambiguousArtist,true,'All-unknown-artist group stays marked ambiguous');
const selected=['e','f'];
const projects=[{ID:5,TITOLO:'Luna Viva',ARTISTA:'Emma'}];
const plan=G.planVersionLinks({group:luna,selectedIds:selected,projectId:5,files,projects,links:[],owner:'o',review:R});
assert.equal(plan.length,2);
assert.throws(()=>G.planVersionLinks({group:luna,selectedIds:['e','e'],projectId:5,files,projects,links:[],owner:'o',review:R}),/senza duplicati/);
assert.equal(plan.every(x=>x.id_progetto===5&&x.confermata&&x.metodo==='manuale'),true);
assert.throws(()=>G.planVersionLinks({group:luna,selectedIds:[],projectId:5,files,projects,links:[],owner:'o',review:R}),/Seleziona/);
assert.throws(()=>G.planVersionLinks({group:luna,selectedIds:['x'],projectId:5,files,projects,links:[],owner:'o',review:R}),/non autorizzate/);
assert.throws(()=>G.planVersionLinks({group:luna,selectedIds:selected,projectId:333,files,projects,links:[],owner:'o',review:R}),/progetto valido/);
const linked=[{id_audio:'e',id_progetto:5,confermata:true,annullata:false}];
assert.equal(G.allowedForLink(luna,linked).length,1);
assert.throws(()=>G.planVersionLinks({group:luna,selectedIds:selected,projectId:5,files,projects,links:linked,owner:'o',review:R}),/non autorizzate/);
assert.equal(root.KYV_AUDIO_PROJECT.sourceKind({provider:'local',fileName:'Demo.wav'}),'local');
assert.equal(root.KYV_AUDIO_PROJECT.isAudioItem({fileName:'BranoNormalissimo.wav',source:'Archivio locale'}),true);
const page=read('kyv_audio_finder.html'),ui=read('kyv-audio-finder-ui-v245.js'),project=read('kyv-audio-project.js'),sw=read('sw.js');
for(const s of ['kyv-audio-groups-v249.js','finder-group-list','finder-group-detail','finder-group-project','finder-group-mode']){
 if(s==='finder-group-project'){assert.ok(ui.includes('finder-group-project'));continue;}
 assert.ok(page.includes(s),s);
}
assert.ok(ui.includes('G.groups(personalCatalogue(),links)'), 'Only approved personal files grouped');
assert.ok(ui.includes('G.planVersionLinks'), 'Strong validation before writing');
assert.ok(ui.includes('if(!confirm('), 'Manual approval before linking');
assert.ok(ui.includes("db.from('KYV_AUDIO_ASSOCIAZIONI').insert(verified)"));
assert.ok(!ui.includes('createFromItem(group'), 'Groups never automatically create projects');
assert.ok(project.includes('select.value===\'__new__\''),'Explicit new project choice required');
assert.ok(project.includes("if(!select.value)return"), 'No submission without choosing a destination');
assert.ok(sw.includes("'./kyv-audio-groups-v249.js'"));
assert.equal(JSON.parse(read('package.json')).version,'2.68.0');
assert.equal(read('VERSION').trim() ,'2.68');
assert.ok(read('kyv-help.js').includes('v2.49'));
assert.ok(read('guida.html').includes('v2.49'));
console.log('OK: v2.49 advisory cross-source version grouping, artist ambiguity, no auto-project, manual checked links');
