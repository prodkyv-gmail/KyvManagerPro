/* Studio Editor v2.67: read-only complete source loader, no partial datasets. */
(function(root,factory){
 const api=factory();
 if(root)root.KYV_EDITOR_READ_V267=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const PAGE_SIZE=500, MAX_ROWS=30000;
 async function readComplete(db,table,sortColumn,{pageSize=PAGE_SIZE,maxRows=MAX_ROWS}={}){
  if(!db||!table||!sortColumn)throw new Error('Lettura Editor: client o tabella non disponibili');
  if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000)throw new Error('Dimensione pagina non valida');
  const rows=[];let expected=null;
  // PostgREST richiede gli identificativi tra virgolette quando contengono spazi o punti
  // (per esempio la chiave storica SIAE "Cod. Opera").
  const orderKey=/^[A-Za-z_][A-Za-z0-9_]*$/.test(sortColumn)?sortColumn:'"'+String(sortColumn).replaceAll('"','""')+'"';
  for(let offset=0;offset<=maxRows;offset+=pageSize){
   const q=db.from(table).select('*',offset===0?{count:'exact'}:{})
     .order(orderKey,{ascending:true});
   const {data,count,error}=await q.range(offset,offset+pageSize-1);
   if(error)throw new Error(table+': '+(error.message||'errore di lettura'));
   if(!Array.isArray(data))throw new Error(table+': risposta non verificabile');
   if(offset===0){
    if(!Number.isSafeInteger(count)||count<0)throw new Error(table+': totale non verificabile');
    expected=count;
    if(expected>maxRows)throw new Error(table+': '+expected+' record oltre il limite di sicurezza '+maxRows+'. Usa la ricerca globale o un archivio dedicato.');
   }
   rows.push(...data);
   if(rows.length===expected)break;
   if(rows.length>expected||data.length===0)throw new Error(table+': lettura incompleta ('+rows.length+'/'+expected+')');
  }
  if(rows.length!==expected)throw new Error(table+': lettura incompleta ('+rows.length+'/'+expected+')');
  return rows;
 }
 return Object.freeze({PAGE_SIZE,MAX_ROWS,readComplete});
});
