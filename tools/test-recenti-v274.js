// v2.74 — The Recenti cohort must be invariant under presentation-only sort changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const root={};vm.runInNewContext(read('kyv-project-list-v250.js'),{window:root});
const P=root.KYV_PROJECT_V250;
const projects=Array.from({length:65},(_,i)=>({
 ID:i+1,TITOLO:'Brano '+String(100-i).padStart(3,'0'),
 ARTISTA:'Artista '+String(100-i).padStart(3,'0'),
 STATO:'In lavorazione',SVILUPPO:'Inviare demo',NOTE:'comune',
 updated_at:new Date(Date.UTC(2026,0,i+1)).toISOString(),
 Prossimo_Followup:new Date(Date.UTC(2026,5,65-i)).toISOString()
}));
const ids=(opts={})=>Array.from(P.filterRows(projects,{mode:'RECENTI',...opts}),x=>x.ID);
const ascending=a=>[...a].sort((x,y)=>x-y);
const expected=Array.from({length:40},(_,i)=>i+26);
for(const sort of ['activity','title','artist','oldest','followup']){
 const result=ids({sort});
 assert.equal(result.length,40,sort+' count');
 assert.deepEqual(ascending(result),expected,sort+' must not replace recent projects');
}
assert.equal(ids({sort:'oldest'})[0],26,'Oldest is oldest WITHIN the recent 40');
assert.equal(ids({sort:'activity'})[0],65,'Most recent first');
assert.equal(P.filterRows(projects,{mode:'TUTTI',sort:'title'}).length,65,'All rows available in Tutti');
assert.deepEqual(ids({query:'#1'}),[1],'Exact #ID searches beyond the 40');
assert.deepEqual(ids({query:'Brano 099'}),[2],'Text query searches beyond the 40');
assert.equal(ids({artist:'Artista 099'}).length,1,'Advanced artist filter sees all rows');
assert.equal(ids({query:'comune'}).length,65,'Query does not accidentally cap results to 40');
const page=read('progetti.html'),guide=read('guida.html'),help=read('kyv-help.js');
assert.ok(page.includes('i 40 progetti più recenti'),'UI must explain cohort selection');
assert.ok(guide.includes('Aggiornamento v2.74 · Recenti e ordinamento'));
assert.ok(help.includes('v2.74 · Perché Recenti non cambia quando ordino?'));
assert.doesNotMatch(read('kyv-project-list-v250.js'),/\.(?:insert|update|upsert|delete)\(/);
assert.equal(read('VERSION').trim(),'2.81');
console.log('OK: v2.74 Recenti membership stable across sort, full-search scope and updated help');
