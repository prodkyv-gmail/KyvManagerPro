/* v2.82 verified paged reads, correctness first. All tests offline with mocked queries. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const mod=require('../kyv-read-guard-v282.js');
const make=(rows,{duplicate=false,errorAt=-1,failTransient=0,badCount=false,missingId=false}={})=>{
 let calls=0,counts=0,sorts=[];
 const client={from(table){
  return {select(fields,opt){
   if(opt?.count==='exact')counts++;
   return {order(key,{ascending}){
    sorts.push([key,ascending]);
    return {async range(start,end){
     calls++;
     if(calls<=failTransient)return {error:{status:503,message:'temporary unavailable'}};
     if(errorAt===start)return {error:{status:401,message:'permission denied'}};
     let page=rows.slice(start,end+1).map(x=>({...x}));
     if(duplicate&&start>0&&page.length)page[0].ID=rows[start-1].ID;
     if(missingId&&start>0&&page.length)page[0].ID=null;
     return {data:page,count:opt?.count==='exact'?(badCount?null:rows.length):null,error:null};
    }};
   }};
  }};
 }};
 return {client,stats:()=>({calls,counts,sorts})};
};
(async()=>{
 const rows=Array.from({length:13},(_,i)=>({ID:i+1,amount:i*3}));
 const input=make(rows);
 const progress=[];
 const result=await mod.readComplete(input.client,'FATTURE','ID,amount','ID',{pageSize:5,onProgress:x=>progress.push(x)});
 assert.equal(result.length,13);
 assert.equal(result[0].ID,1);
 assert.equal(result.at(-1).ID,13);
 assert.equal(input.stats().calls,3);
 assert.equal(input.stats().counts,1,'Only first page may request exact count');
 assert.deepEqual(progress.map(x=>x.loaded),[5,10,13]);
 assert.ok(input.stats().sorts.every(x=>x[0]==='ID'&&x[1]===true),'Stable unique ID ordering');
 await assert.rejects(mod.readComplete(make(rows,{duplicate:true}).client,'FATTURE','*','ID',{pageSize:5}),/duplicata/);
 await assert.rejects(mod.readComplete(make(rows,{missingId:true}).client,'FATTURE','*','ID',{pageSize:5}),/mancante/);
 await assert.rejects(mod.readComplete(make(rows,{errorAt:5}).client,'FATTURE','*','ID',{pageSize:5}),/permission denied/);
 await assert.rejects(mod.readComplete(make(rows,{badCount:true}).client,'FATTURE','*','ID',{pageSize:5}),/totale record non verificabile/);
 await assert.rejects(mod.readComplete(make(rows).client,'FATTURE','*','ID',{pageSize:5,maxRows:10}),/limite/);
 await assert.rejects(mod.readComplete(make(rows).client,'FATTURE','*','ID',{pageSize:0}),/pagina non valida/);
 await assert.rejects(mod.readComplete(make(rows).client,'FATTURE','*','Data_Sessione;drop',{pageSize:5}),/chiave univoca/);
 const transient=make(rows,{failTransient:1});
 assert.equal((await mod.readComplete(transient.client,'FATTURE','*','ID',{pageSize:10})).length,13);
 assert.equal(transient.stats().calls,3,'One transient retry then two pages');
 const empty=make([]);
 assert.deepEqual(await mod.readComplete(empty.client,'PROGETTI','*','ID'),[]);
 assert.equal(empty.stats().calls,1);
 const status=make(rows,{errorAt:0});
 await assert.rejects(mod.readComplete(status.client,'FATTURE','*','ID',{pageSize:5}),/permission denied/);
 assert.equal(status.stats().calls,1,'Auth errors must not be retried');
 const ui=read('kyv-analyst-ui-v241.js'),econ=read('kyv-economy-v6.js'),page=read('kyv_analyst.html'),config=read('config.js'),sw=read('sw.js');
 assert.ok(ui.includes('window.KYV_READ_GUARD_V282?.readComplete'),'Analyst must use shared reader');
 assert.ok(ui.includes('Verifica archivi: '),'Visible progress over 11 sources');
 assert.ok(ui.includes('reload.disabled=true')&&ui.includes('reload.disabled=false'),'Block parallel reload');
 for(const key of ["'KYV_SESSIONI','id,data_sessione,durata_minuti,esito,archiviata','id'","'KYV_PIAZZAMENTI','id,id_progetto,destinatario,stato,prossimo_followup,archiviata','id'"])
  assert.ok(ui.includes(key),'Do not sort paginated records by nonunique dates');
 assert.ok(econ.includes('window.KYV_READ_GUARD_V282?.readComplete'),'Economy must use shared reader');
 assert.ok(econ.includes('lastData=null'),'Never display stale totals after failed read');
 assert.ok(econ.includes('token!==loadGeneration'),'Concurrent refresh result isolation');
 assert.doesNotMatch(econ,/\.limit\((?:1000|2000|5000)\)/,'No silent limits for economic archives');
 for(const t of ["'PROGETTI'","'FATTURE'","'Spese Extra'","'FATTURE_RIPARTIZIONI'"])
  assert.ok(econ.includes('read(c,'+t),'Four economy sources must be complete');
 assert.ok(page.includes('<script src="kyv-read-guard-v282.js"></script>'));
 assert.ok(config.includes("verifiedRead.src='kyv-read-guard-v282.js'"));
 assert.ok(config.indexOf("verifiedRead.src='kyv-read-guard-v282.js'")<config.indexOf("economy.src='kyv-economy-v6.js'"),'Loader before Economy');
 assert.ok(sw.includes("'./kyv-read-guard-v282.js'"),'Offline precache');
 assert.doesNotMatch(read('kyv-read-guard-v282.js'),/\.insert\(|\.update\(|\.upsert\(|\.delete\(|localStorage|MutationObserver/);
 assert.equal(read('VERSION').trim(),'2.82');
 assert.equal(require('../package.json').version,'2.82.0');
 assert.ok(read('config.js').includes("APP_VERSION: '2.82'"));
 assert.ok(read('guida.html').includes('id="v282-stability"'));
 assert.ok(read('kyv-help.js').includes('v2.82 · Stabilizzazione letture'));
 assert.ok(read('docs/V282_STABILIZATION_QA.md').includes('Checklist v2.82'));
 console.log('OK v2.82: complete pagination, unique IDs, retry rules, no silent totals, CI and release contract');
})().catch(e=>{console.error(e);process.exitCode=1});
