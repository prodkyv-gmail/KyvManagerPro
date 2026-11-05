/* v2.82: verified, bounded, ID-ordered archive reads. No writes. */
(function(root,factory){const api=factory();if(root)root.KYV_READ_GUARD_V282=api;if(typeof module==='object'&&module.exports)module.exports=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const PAGE_SIZE=500,MAX_ROWS=30000;
 const wait=ms=>new Promise(done=>setTimeout(done,ms));
 const transient=e=>[408,429,500,502,503,504].includes(Number(e?.status||e?.code||0))||e?.name==='TypeError';
 async function readComplete(client,table,fields,idKey,{pageSize=PAGE_SIZE,maxRows=MAX_ROWS,onProgress=null}={}){
  if(!client?.from||!table||!fields||!/^[A-Za-z_][A-Za-z0-9_]*$/.test(String(idKey)))throw Error('Lettura: origine o chiave univoca non disponibile');
  if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000)throw Error('Lettura: dimensione pagina non valida');
  if(!Number.isSafeInteger(maxRows)||maxRows<pageSize||maxRows>100000)throw Error('Lettura: limite di sicurezza non valido');
  const rows=[],seen=new Set();let expected=null;
  for(let offset=0;offset<=maxRows;offset+=pageSize){
   let response;
   for(let attempt=0;attempt<3;attempt++){
    try{
     response=await client.from(table).select(fields,offset===0?{count:'exact'}:{})
      .order(idKey,{ascending:true}).range(offset,offset+pageSize-1);
     if(response?.error)throw response.error;
     break;
    }catch(error){
     if(attempt===2||!transient(error))throw Error(table+': '+(error?.message||'errore di lettura'));
     await wait(120*(attempt+1));
    }
   }
   const data=response?.data;
   if(!Array.isArray(data))throw Error(table+': risposta incompleta o non verificabile');
   if(offset===0){
    if(!Number.isSafeInteger(response.count)||response.count<0)throw Error(table+': numero totale record non verificabile');
    expected=response.count;
    if(expected>maxRows)throw Error(table+': '+expected+' righe oltre il limite '+maxRows+'; nessun totale parziale verrà mostrato');
   }
   if(data.length>pageSize)throw Error(table+': risposta eccedente la pagina richiesta');
   for(const record of data){
    const key=String(record?.[idKey]??'').trim();
    if(!key||seen.has(key))throw Error(table+': chiave '+idKey+' mancante o duplicata fra pagine; lettura interrotta per evitare doppi conteggi');
    seen.add(key);rows.push(record);
   }
   if(rows.length>expected)throw Error(table+': più righe del totale verificato');
   if(typeof onProgress==='function')onProgress({table,loaded:rows.length,total:expected});
   if(rows.length===expected)break;
   if(!data.length)throw Error(table+': lettura incompleta ('+rows.length+'/'+expected+')');
  }
  if(rows.length!==expected)throw Error(table+': lettura incompleta ('+rows.length+'/'+expected+')');
  return rows;
 }
 return Object.freeze({PAGE_SIZE,MAX_ROWS,readComplete});
});