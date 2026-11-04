// KYV v2.66 — cross-flow smoke audit without production requests or database writes.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const search=read('kyv-global-search-v8.js'),editor=read('kyv-record-editor.js');
const archive=read('archivio_musicale.html'),audio=read('kyv-audio-project.js');
const menu=read('menu.js'),producer=read('kyv-producer-mode.js');
for(const name of ['kyv-global-search-v8.js','kyv-record-editor.js','menu.js','kyv-audio-project.js']){
 new vm.Script(read(name),{filename:name});
}
// Real route constructors and search entities under controlled data; no Supabase access.
const part=search.slice(search.indexOf('let db='),search.indexOf('function recents(){'));
assert.ok(part.includes('function invalidateIndex()'));
let tables={PROGETTI:[{ID:41,TITOLO:'Demo nuova',ARTISTA:'Artista Test'}],
 FATTURE:[{ID_FT:7,Numero:'F-7',Denominazione:'Cliente',ID_PROGETTO:41}],
 INVII_AUDIO:[{ID_INVIO:11,ID_PROGETTO:41,Destinatario:'A&R'}],
 DOCUMENTI_PROGETTO:[{ID_DOCUMENTO:9,ID_PROGETTO:41,Titolo_Documento:'Contratto'}],
 AUDIO_VERSIONI:[{ID_VERSIONE:8,ID_PROGETTO:41,NOME_FILE:'mix.wav'}],
 'EXPORT SIAE':[{'Cod. Opera':'W-4',Titolo:'Demo nuova'}],
 ESTRATTO_IMAIE:[{id:6,TITOLO_OPERA:'Demo nuova'}]};
let gate=null,releaseFirst=null,delayFirst=false;
const mock={from(table){
 return {select(_fields,opts={}){
  return {order(){return this;},async range(start,end){
   const rows=(tables[table]||[]).slice();
   if(table==='PROGETTI'&&delayFirst){delayFirst=false;await gate;}
   return {data:rows.slice(start,end+1),count:opts.count==='exact'?rows.length:null,error:null};
  }};
 }};
}};
const context={window:{KYV:{createSupabaseClient:()=>mock}},location:{pathname:'/index.html'},Number,Array,Error,Set,Map};
vm.runInNewContext(part+'\nthis.fetchIndex=fetchIndex;this.invalidateIndex=invalidateIndex;this.current=()=>index;',context);
(async()=>{
 const entries=await context.fetchIndex();
 assert.equal(entries.length,7,'All seven authenticated search sources must be represented');
 const byType=type=>entries.find(x=>x.type===type);
 assert.equal(byType('Progetto').href,'scheda_progetto.html?id=41');
 assert.equal(byType('Fattura').href,'scheda_progetto.html?id=41&tab=amministrazione');
 assert.ok(byType('Invio').href.includes('tab=produzione#kyv-pitch-followup-project'));
 assert.ok(byType('Versione').href.includes('#kyv-project-v2-versions'));
 assert.equal(byType('SIAE').href,'rendiconto.html');
 assert.equal(byType('IMAIE').href,'rendiconto.html');
 // A normal explicit refresh must return data changed after the first complete load.
 tables.PROGETTI=[{ID:41,TITOLO:'Titolo corretto',ARTISTA:'Artista Test'}];
 context.invalidateIndex();
 assert.equal((await context.fetchIndex()).find(x=>x.type==='Progetto').title,'Titolo corretto');
 // If a previous in-flight request completes last, it cannot replace newer results.
 gate=new Promise(resolve=>releaseFirst=resolve);delayFirst=true;
 context.invalidateIndex();
 const oldRequest=context.fetchIndex();
 tables.PROGETTI=[{ID:41,TITOLO:'Titolo attuale',ARTISTA:'Artista Test'}];
 context.invalidateIndex();
 const newRequest=await context.fetchIndex();
 assert.equal(newRequest.find(x=>x.type==='Progetto').title,'Titolo attuale');
 releaseFirst();
 assert.equal(await oldRequest,null,'Stale search results must be discarded');
 assert.equal(context.current().find(x=>x.type==='Progetto').title,'Titolo attuale');
 assert.ok(search.includes("id=\"kyv-gs-refresh\""),'Real manual refresh button');
 assert.ok(search.includes("root.querySelector('#kyv-gs-refresh').addEventListener('click',refreshIndex)"));
 assert.ok(search.includes("if(!index){"),'Typing during loading must not show verified zero matches');
 assert.ok(search.includes("if(revision!==indexRevision)return;"),'UI must not display a superseded generation');
 assert.ok(search.includes("document.addEventListener(name,refreshIndex)"),'Editor/invoice/project events invalidate results');
 assert.ok(!/\blocalStorage\s*\./.test(search),'Recent private record titles must not survive page/account changes');
 assert.ok(search.includes("recentItems.slice(0,6)"));
 assert.ok(search.includes("document.activeElement===root.querySelector('#kyv-gs-input')"),
  'Enter on Refresh/results buttons must preserve native button actions');
 // The editor only notifies after a successful database write, not on an attempted write.
 assert.ok(editor.indexOf("if (error) throw error;")<editor.indexOf("new CustomEvent('kyv:record-saved'"));
 assert.ok(editor.includes("try { await options.onSaved(savedTable); }"));
 assert.ok(editor.includes('Record salvato. Aggiorna la pagina'));
 assert.ok(editor.includes('guardOriginal(query, key, active.originalRow?.[key])'));
 assert.ok(editor.includes('Stai modificando una relazione del record'));
 assert.ok(search.includes("document.addEventListener('kyv:sidebar-ready',mountSidebarButton)"));
 assert.ok(producer.includes("'Pipeline & opportunità'"));
 assert.ok(menu.includes("new Event('kyv:sidebar-ready')"));
 assert.ok(archive.includes('Progetto da collegare (scelta manuale)'));
 assert.ok(archive.includes('suggestedProjectId:classification.projectId'));
 assert.ok(archive.includes('Solo i progetti scelti manualmente saranno collegati'));
 assert.ok(audio.includes("wrap.querySelector('[data-submit]').disabled=!select.value"));
 assert.ok(audio.includes("if(!confirm('Confermi di voler '+actionLabel+"));
 assert.doesNotMatch(search,/\.(?:insert|update|upsert|delete)\(/);
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'2.71.0');
 assert.equal(read('VERSION').trim(),'2.71');
 assert.ok(read('sw.js').includes('kyv-studio-v2-71-mobile-disclosures-20261104'));
 assert.ok(pkg.scripts.check.includes('check:cross-flow-v266'));
 assert.ok(read('guida.html').includes('v2.66'));
 assert.ok(read('kyv-help.js').includes('v2.66'));
 console.log('OK: v2.66 cross-flow search refresh, stale-load isolation, editor save semantics, route continuity and manual audio consent');
})().catch(err=>{console.error(err);process.exit(1);});
