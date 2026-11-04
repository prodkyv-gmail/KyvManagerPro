// KYV v2.67 — complete Editor reads and progressive visible rows, no writes.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const loader=require('../kyv-editor-read-v267.js');
const html=fs.readFileSync('editor.html','utf8');
const config=fs.readFileSync('config.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const {readComplete,PAGE_SIZE,MAX_ROWS}=loader;
assert.equal(PAGE_SIZE,500);
assert.equal(MAX_ROWS,30000);
let calls=[];
const data=Array.from({length:1205},(_,i)=>({ID:i+1,TITOLO:'Brano '+(i+1)}));
function fakeDB({records=data,total=records.length,missingCount=false,limitAt=Infinity,error=null}={}){
 return{from(name){
  assert.equal(name,'PROGETTI');
  return{select(fields,opts){assert.equal(fields,'*');return{
   order(col){assert.equal(col,'ID');return this;},
   async range(start,end){
    calls.push({start,end,count:opts?.count});
    if(error)return{error};
    return{data:start>=limitAt?[]:records.slice(start,end+1),
      count:opts?.count==='exact'?(missingCount?null:total):null,error:null};
   }
  };}};
 }};
}
(async()=>{
 calls=[];
 const all=await readComplete(fakeDB(),'PROGETTI','ID');
 assert.equal(all.length,1205);
 assert.deepEqual(calls.map(x=>x.start),[0,500,1000]);
 assert.equal(calls[0].count,'exact');
 assert.ok(calls.slice(1).every(x=>!x.count));
 await assert.rejects(readComplete(fakeDB({records:data.slice(0,1000),total:1205}),'PROGETTI','ID'),/lettura incompleta/);
 await assert.rejects(readComplete(fakeDB({total:30001}),'PROGETTI','ID'),/limite di sicurezza/);
 await assert.rejects(readComplete(fakeDB({missingCount:true}),'PROGETTI','ID'),/totale non verificabile/);
 await assert.rejects(readComplete(fakeDB({error:{message:'RLS negata'}}),'PROGETTI','ID'),/RLS negata/);
 assert.deepEqual(await readComplete(fakeDB({records:[],total:0}),'PROGETTI','ID'),[]);
 // Qualified order preserves historical PostgREST column names with spaces and dots.
 let seenOrder='';
 const special={from(){return{select(_fields,opts){return{order(col){seenOrder=col;return this;},async range(){
  return{data:[],count:opts?.count==='exact'?0:null,error:null};
 }};}};}};
 assert.deepEqual(await readComplete(special,'EXPORT SIAE','Cod. Opera'),[]);
 assert.equal(seenOrder,'"Cod. Opera"');
 await assert.rejects(readComplete(fakeDB(),'PROGETTI','ID',{pageSize:1001}),/pagina non valida/);
 assert.ok(html.includes('src="kyv-editor-read-v267.js"'));
 assert.ok(html.includes('KYV_EDITOR_READ_V267.readComplete(supabaseClient,tableName,tablePKs[tableName]'));
 assert.ok(!html.includes('select(querySelection).limit(1000)'),'Do not truncate Editor lists to 1000');
 assert.ok(html.includes('requestId !== editorLoadSerial'),'Old async responses cannot replace the current table');
 assert.ok(html.includes('renderEditorTable(rows.slice(0, visibleCount))'),'Render a bounded visible subset');
 assert.ok(html.includes("editorShownRows += EDITOR_ROWS_STEP"),'Explicit load-more action');
 assert.ok(html.includes("rows.length - visibleCount"),'Show real remaining row count');
 assert.ok(html.includes('Nessun risultato parziale mostrato'),'Incomplete read is visibly blocked');
 assert.ok(html.includes('data-action="retry-table"'));
 assert.ok(html.includes("const EDITOR_ROWS_STEP = 120"));
 assert.ok(html.includes("Colonne nascoste solo nella griglia"),'Column visibility remains independent of data reads');
 assert.ok(html.includes('if (action === \'export-csv\')'),'Existing full data CSV stays available');
 assert.ok(html.includes("const readOnlyTables = new Set(['AUDIO_VERSIONI'])"));
 assert.ok(config.includes("APP_VERSION: '2.73'"));
 assert.ok(sw.includes("'./kyv-editor-read-v267.js'"));
 assert.ok(sw.includes('kyv-studio-v2-73-search-guide-20261104'));
 assert.ok(fs.readFileSync('VERSION','utf8').trim()==='2.73');
 assert.equal(require('../package.json').version,'2.73.0');
 assert.ok(require('../package.json').scripts.check.includes('check:editor-verified-v267'));
 assert.ok(fs.readFileSync('guida.html','utf8').includes('v2.67'));
 assert.ok(fs.readFileSync('kyv-help.js','utf8').includes('v2.67'));
 // Only read methods appear in loader. Existing DB mutation handlers remain owned by Editor.
 assert.doesNotMatch(fs.readFileSync('kyv-editor-read-v267.js','utf8'),/\.(?:insert|update|upsert|delete)\(/);
 console.log('OK: v2.67 Editor verified pagination, bounded rendering, honest counters, retry and load race guard');
})().catch(e=>{console.error(e);process.exit(1);});
