// KYV v2.55 — never infer a known artist from unattributed audio; stale group filters cannot link.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const root={},ctx={window:root,Map,Set,Object,Number,Date,Intl,URL,Error};
for(const path of ['kyv-audio-finder-v245.js','kyv-audio-review-v246.js','kyv-audio-groups-v249.js'])
  vm.runInNewContext(read(path),ctx,{filename:path});
const G=root.KYV_AUDIO_GROUPS_V249,R=root.KYV_AUDIO_REVIEW_V246;
const file=(id,name)=>({id,nome_file:name,provider:'local',account_label:'Studio',external_key:id,mime_type:'audio/wav'});
const known=file('known','Emma - Luci Lontane DEMO.wav');
const unknown=file('unknown','Luci Lontane MASTER.wav');
const groups=G.groups([known,unknown],[]);
assert.equal(groups.length,2,'Unattributed master must not enter Emma group');
const named=groups.find(g=>g.artist==='Emma'),unattributed=groups.find(g=>g.ambiguousArtist);
assert.ok(named&&unattributed);
assert.deepEqual(Array.from(named.files.map(x=>x.file.id)),['known']);
assert.deepEqual(Array.from(unattributed.files.map(x=>x.file.id)),['unknown']);
assert.ok(!named.files.some(x=>x.file.id==='unknown'));
const other=file('other','Mew - Luci Lontane demo.wav');
assert.equal(G.groups([known,unknown,other],[]).length,3,'Different declared artists stay distinct');
const noArtists=G.groups([file('x','Le Ore demo.wav'),file('y','Le Ore master.wav')],[]);
assert.equal(noArtists.length,1,'Unknown artists may suggest a group, but only as unattributed');
assert.equal(noArtists[0].ambiguousArtist,true);
assert.equal(noArtists[0].artist,'');
const projects=[{ID:7,TITOLO:'Luci Lontane',ARTISTA:'Emma'}];
assert.throws(()=>G.planVersionLinks({
  group:named,selectedIds:['known','known'],projectId:7,files:[known,unknown],
  projects,links:[],owner:'user',review:R
}),/senza duplicati/,'Repeated selections must not create duplicate links');
assert.throws(()=>G.planVersionLinks({
  group:named,selectedIds:['unknown'],projectId:7,files:[known,unknown],
  projects,links:[],owner:'user',review:R
}),/non autorizzate/,'Unattributed master cannot be linked through a named artist group');
const ui=read('kyv-audio-finder-ui-v245.js'),sw=read('sw.js'),guide=read('guida.html');
assert.ok(ui.includes('if(groupKey&&!filtered.some(g=>g.key===groupKey))'),
  'Filtering a group away must clear its pending link selection');
assert.ok(ui.includes('groupSelected.clear();groupProject=\'\';'),
  'Clearing a hidden group must clear selected versions and project');
assert.ok(ui.includes('Artista non dichiarato: verifica ogni file'),
  'Unattributed group requires a visible warning');
assert.ok(sw.includes('kyv-studio-v2-56-source-scope-20261103'),'PWA cache rotated');
assert.ok(guide.includes('v2.55'),'Guide updated with linking behavior');
assert.equal(JSON.parse(read('package.json')).version,'2.56.0');
assert.equal(read('VERSION').trim(),'2.56');
console.log('OK: v2.55 unknown-artist separation, no duplicate selections, filtered group cannot link silently');
