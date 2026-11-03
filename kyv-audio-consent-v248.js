/* v2.48: explicit personal-music consent for locally/cloud-discovered audio. */
(function(root){
'use strict';
const T=x=>String(x??'').trim();
const OPTIONS=['mio','reference','da_verificare'];
const key=f=>[T(f.provider),T(f.account_label),T(f.external_key)].join('\u0000');
function preview(files,known=[]){
 const saved=new Map(known.map(x=>[key(x),x.decision]));
 const seen=new Set();
 return (files||[]).filter(x=>{
  const k=key(x);if(!x||!T(x.external_key)||seen.has(k))return false;seen.add(k);return true;
 }).map(f=>({...f,decision:OPTIONS.includes(saved.get(key(f)))?saved.get(key(f)):'da_verificare',_explicit:false}));
}
function mark(items,index,decision){
 if(!OPTIONS.includes(decision))throw Error('Classificazione non valida');
 if(!Number.isSafeInteger(index)||index<0||index>=items.length)throw Error('File non disponibile');
 return items.map((x,i)=>i===index?{...x,decision,_explicit:true}:x);
}
function markMany(items,indices,decision){
 if(!OPTIONS.includes(decision))throw Error('Classificazione non valida');
 const set=new Set(indices);
 if(set.size>200||[...set].some(i=>!Number.isSafeInteger(i)||i<0||i>=items.length))throw Error('Selezione troppo ampia o non valida');
 return items.map((x,i)=>set.has(i)?{...x,decision,_explicit:true}:x);
}
function plan(items,owner){
 if(!T(owner))throw Error('Sessione non autenticata');
 const approved=[],changes=[],seen=new Set();
 for(const f of items||[]){
  const k=key(f);
  if(seen.has(k))throw Error('Identità sorgente duplicata');seen.add(k);
  if(!OPTIONS.includes(f.decision))throw Error('Stato audio non valido');
  // Only explicit user decisions can be written, never inferred by filename or location.
  if(!f._explicit)continue;
  changes.push({owner_id:owner,provider:f.provider,account_label:f.account_label,external_key:f.external_key,decision:f.decision,updated_at:new Date().toISOString()});
  if(f.decision==='mio'){
   const {decision,_explicit,...record}=f;approved.push({...record,owner_id:owner,ultimo_avvistamento:new Date().toISOString()});
  }
 }
 if(!changes.length)throw Error('Classifica almeno un file prima di salvare');
 return {approved,changes,excluded:changes.filter(x=>x.decision==='reference').length,
  pending:changes.filter(x=>x.decision==='da_verificare').length};
}
function isAllowed(file,known=[]){
 const previous=known.find(x=>key(x)===key(file));
 return previous?.decision==='mio';
}
root.KYV_AUDIO_CONSENT_V248=Object.freeze({key,preview,mark,markMany,plan,isAllowed,OPTIONS});
})(typeof window!=='undefined'?window:globalThis);
