// KYV v2.65 — truthful global coverage and manual audio-to-project selection.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const search=read('kyv-global-search-v8.js');
const archive=read('archivio_musicale.html');
const audio=read('kyv-audio-project.js');
const menu=read('menu.js');
const producer=read('kyv-producer-mode.js');
new vm.Script(search,{filename:'kyv-global-search-v8.js'});
for(const m of archive.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
 if(m[1].trim())new vm.Script(m[1],{filename:'archivio_musicale.html:inline'});
assert.ok(search.includes("const SEARCH_PAGE_SIZE=500,SEARCH_MAX_ROWS=30000"));
assert.ok(search.includes("count:'exact'"),'Global search must request a verified exact count');
assert.ok(search.includes('.range(offset,offset+SEARCH_PAGE_SIZE-1)'));
assert.ok(search.includes('collected.length!==expected'),'Partial search coverage cannot be returned');
assert.ok(search.includes('if(errors.length)')===false,'Do not cache partial tables and label full search');
assert.ok(search.includes("async function readCompleteSource("));
assert.ok(search.includes('try{return await pending;}finally{if(loading===pending)loading=null;}'),
 'Failed full-index loads must allow retry');
assert.ok(search.includes('Mostrati '+'' ) || search.includes("'Mostrati '+ranked.length"));
assert.ok(search.includes("found.length+' risultati · indice verificato'"));
assert.ok(search.includes("Nessun risultato parziale è stato presentato come archivio completo."));
assert.ok(search.includes("id=\"kyv-gs-retry\""));
assert.ok(search.includes("searchFocusReturn=document.activeElement"));
assert.ok(search.includes("if(searchFocusReturn?.isConnected)searchFocusReturn.focus()"));
assert.ok(search.includes("if(e.key==='Tab')"));
assert.ok(search.includes('aria-activedescendant'));
assert.ok(!search.includes('setInterval('),'Search button no longer uses a 5-second polling timer');
assert.ok(search.includes("document.addEventListener('kyv:sidebar-ready',mountSidebarButton)"));
assert.ok(search.includes("document.addEventListener('kyv:producer-nav-ready',mountSidebarButton)"));
assert.ok(menu.includes("new Event('kyv:sidebar-ready')"));
assert.ok(producer.includes("new Event('kyv:producer-nav-ready')"));
for(const src of ['PROGETTI','FATTURE','INVII_AUDIO','DOCUMENTI_PROGETTO','AUDIO_VERSIONI','EXPORT SIAE','ESTRATTO_IMAIE'])
 assert.ok(search.includes("c.from('"+src+"')"),'Keep search source '+src);
assert.doesNotMatch(search,/\.(?:insert|update|upsert|delete)\(/,'Read-only search');
assert.ok(archive.includes("const REFERENCE_PAGE_SIZE=500,REFERENCE_MAX_ROWS=30000"));
assert.ok(archive.includes("readRequiredTable('AUDIO_VERSIONI')"));
assert.ok(!archive.includes("db.from('AUDIO_VERSIONI').select('*').limit(5000)"));
assert.ok(archive.includes('const ex=new Error(')&&archive.includes('ex.code=error.code'));
assert.ok(archive.includes("if(isMissingUnifiedTable(error))unifiedError=error;else throw error;"),
 'Legacy missing-table fallback is allowed only for a genuinely unavailable optional unified table');
assert.ok(archive.includes("projectId:previous?.projectId||''"),
 'Classification must never preselect a filename-suggested project');
assert.ok(archive.includes("projectId:r.projectId||(classification.status==='existing'?classification.projectId:'')"),
 'Only known archived links may survive classification without user action');
assert.ok(archive.includes('suggestedProjectId:classification.projectId'));
assert.ok(archive.includes("if(e.target.dataset.action==='project')r.projectId=e.target.value"));
assert.ok(archive.includes('Progetto da collegare (scelta manuale)'));
assert.ok(archive.includes('Rivedi selezionati'));
assert.ok(archive.includes('Seleziona per revisione'));
assert.ok(archive.includes('Nessun collegamento automatico')||archive.includes('nessun progetto selezionato'));
assert.ok(archive.includes('Solo i progetti scelti manualmente saranno collegati'));
assert.ok(audio.includes("wrap.querySelector('[data-submit]').disabled=!select.value"),
 'Existing audio workflow requires explicit destination selection');
assert.ok(audio.includes("if(!confirm('Confermi di voler '+actionLabel+"),
 'Existing explicit final confirmation remains');
assert.ok(archive.includes('state.referenceReady=false;state.referenceError='));
assert.ok(archive.includes("if(!state.referenceReady){KYV.showToast('Inserimento bloccato"));
assert.ok(read('editor.html').includes('Filtra i dati caricati della tabella corrente'));
const extract=(code,first,last)=>{const start=code.indexOf(first),end=code.indexOf(last,start);
 assert.ok(start>=0&&end>start,first+' extraction unavailable');
 return code.slice(start,end);
};
const script=extract(search,'const SEARCH_PAGE_SIZE=500','async function fetchIndex');
const mockRows=Array.from({length:1205},(_,i)=>({ID:i+1,TITOLO:'Brano '+(i+1)}));
let calls=[];
const makeQuery=({rows=mockRows,expected=rows.length,missingCount=false,stopAt=Infinity,error=null}={})=>()=>({
 select(_columns,opts){
  return {
   order(){return this;},
   async range(start,end){
    calls.push([start,end,opts?.count||null]);
    if(error)return {data:null,error};
    return {data:start>=stopAt?[]:rows.slice(start,end+1),
       count:opts?.count?(missingCount?null:expected):null,error:null};
   }
  };
 }
});
const ctx={Number,Error,Array};
vm.runInNewContext(script+'\nthis.readCompleteSource=readCompleteSource;',ctx);
async function run(){
 calls=[];
 const res=await ctx.readCompleteSource(makeQuery(),'ID,TITOLO','Progetti','ID');
 assert.equal(res.length,1205);
 assert.deepEqual(calls.map(x=>x[0]),[0,500,1000]);
 assert.equal(calls[0][2],'exact');
 assert.equal(calls[1][2],null);
 calls=[];
 await assert.rejects(ctx.readCompleteSource(makeQuery({rows:mockRows.slice(0,1000),expected:1205}),'*','Progetti','ID'),/lettura incompleta/);
 calls=[];
 await assert.rejects(ctx.readCompleteSource(makeQuery({missingCount:true}),'*','Progetti','ID'),/totale archivio non verificabile/);
 calls=[];
 await assert.rejects(ctx.readCompleteSource(makeQuery({expected:30001}),'*','Progetti','ID'),/limite di sicurezza/);
 calls=[];
 await assert.rejects(ctx.readCompleteSource(makeQuery({error:{message:'permesso negato'}}),'*','Progetti','ID'),/permesso negato/);
 const refScript=extract(archive,'const REFERENCE_PAGE_SIZE=500','async function loadReferenceData');
 let activeDb=null;
 const archCtx={Number,Error,Array,db:{from(table){return activeDb(table);}}};
 vm.runInNewContext(refScript+'\nthis.readRequiredTable=readRequiredTable;',archCtx);
 activeDb=table=>makeQuery()();
 calls=[];
 const full=await archCtx.readRequiredTable('PROGETTI');
 assert.equal(full.length,1205);
 assert.equal(calls.length,3);
 activeDb=table=>makeQuery({rows:mockRows.slice(0,500),expected:1205})();
 await assert.rejects(archCtx.readRequiredTable('PROGETTI'),/lettura incompleta/);
 activeDb=table=>makeQuery({missingCount:true})();
 await assert.rejects(archCtx.readRequiredTable('DROPBOX_AUDIO_FILES'),/totale archivio non verificabile/);
 const addSource=archive.match(/function addResults\(items\)\{([\s\S]*?)\n\}/);
 assert.ok(addSource,'addResults must remain extractable');
 const state={referenceReady:true,results:[]},win={KYV_AUDIO_PROJECT:{isAudioItem:()=>true}};
 const addCtx={state,window:win,Map,Set,Array,
  resultKey:i=>i.id,classify:()=>({status:'version',projectId:'55',reason:'Nome simile'}),
  renderAll:()=>{},
  KYV:{showToast:()=>{}}
 };
 vm.runInNewContext('function addResults(items){'+addSource[1]+'\n};this.addResults=addResults;',addCtx);
 addCtx.addResults([{id:'audio-1',name:'Demo omonimo'}]);
 assert.equal(state.results[0].suggestedProjectId,'55');
 assert.equal(state.results[0].projectId,'','A name similarity cannot select a project');
 state.results[0].projectId='41';
 addCtx.addResults([{id:'audio-1',name:'Demo omonimo'}]);
 assert.equal(state.results[0].projectId,'41','A manually chosen project must not be overwritten');
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.version,'2.75.0');
 assert.equal(read('VERSION').trim(),'2.75');
 assert.ok(read('config.js').includes("APP_VERSION: '2.75'"));
 assert.ok(read('sw.js').includes('kyv-studio-v2-75-mobile-projects-20261104'));
 assert.equal(pkg.scripts['check:search-archive-v265'],'node tools/test-search-archive-v265.js');
 assert.ok(pkg.scripts.check.includes('check:search-archive-v265'));
 assert.ok(read('guida.html').includes('v2.65'));
 assert.ok(read('kyv-help.js').includes('v2.65'));
 console.log('OK: v2.65 complete source pagination, fail-closed audio dedup and manual project selection');
}
run().catch(e=>{console.error(e);process.exit(1);});
