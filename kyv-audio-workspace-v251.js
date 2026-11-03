/* KYV v2.51 — unified, read-only browser for owner-approved audio metadata.
   Discovery always stays in a separate user-confirmation queue. */
(function(root){
'use strict';
const T=v=>String(v??'').trim();
const folded=v=>T(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('it-IT').replace(/\s+/g,' ');
const KEY=f=>[T(f.provider),T(f.account_label),T(f.external_key)].join('\u0000');
const sources=Object.freeze(['local','drive','dropbox']);
function approved(catalogue=[],decisions=[],links=[]){
 const mine=new Set(decisions.filter(x=>x.decision==='mio').map(KEY));
 const connected=new Map();
 for(const link of links){
  if(!link||link.annullata||link.confermata!==true)continue;
  const id=T(link.id_audio);
  if(!id)continue;
  connected.set(id,(connected.get(id)||0)+1);
 }
 return (catalogue||[]).filter(f=>sources.includes(T(f.provider))&&mine.has(KEY(f)))
  .map(f=>({...f,linkCount:connected.get(T(f.id))||0}));
}
function query(items=[],{text='',provider='',account='',status='all',sort='name'}={}){
 const terms=folded(text).split(' ').filter(Boolean);
 if(provider&&!sources.includes(provider))throw Error('Fonte non valida');
 if(!['all','linked','unlinked'].includes(status))throw Error('Stato non valido');
 const result=(items||[]).filter(f=>{
  if(provider&&f.provider!==provider)return false;
  if(account&&f.account_label!==account)return false;
  if(status==='linked'&&!(f.linkCount>0))return false;
  if(status==='unlinked'&&f.linkCount>0)return false;
  const hay=folded([f.nome_file,f.account_label,f.percorso_relativo,f.provider].join(' '));
  return terms.every(w=>hay.includes(w));
 });
 const byName=(a,b)=>folded(a.nome_file).localeCompare(folded(b.nome_file),'it')||
  folded(a.account_label).localeCompare(folded(b.account_label),'it')||
  T(a.id).localeCompare(T(b.id),'it');
 if(sort==='name')result.sort(byName);
 else if(sort==='recent')result.sort((a,b)=>(Date.parse(b.modificato_il)||0)-(Date.parse(a.modificato_il)||0)||byName(a,b));
 else if(sort==='size')result.sort((a,b)=>(Number(b.size_bytes)||0)-(Number(a.size_bytes)||0)||byName(a,b));
 else throw Error('Ordine non valido');
 return result;
}
function accounts(items=[],provider=''){
 return [...new Set(items.filter(x=>!provider||x.provider===provider).map(x=>T(x.account_label)).filter(Boolean))]
   .sort((a,b)=>a.localeCompare(b,'it'));
}
function stats(items=[]){
 const bySource={local:0,drive:0,dropbox:0},linked=items.filter(x=>x.linkCount>0).length;
 for(const f of items)if(Object.hasOwn(bySource,f.provider))bySource[f.provider]++;
 return Object.freeze({total:items.length,linked,unlinked:items.length-linked,bySource});
}
function previewableLocal(file,transientKeys=[]){
 return !!file&&file.provider==='local'&&transientKeys.includes(KEY(file));
}
function chooserItem(file){
 const name=T(file?.name),link=T(file?.link),id=T(file?.id);
 if(!/\.(mp3|wav|aif|aiff|m4a|flac|aac|ogg|opus)$/i.test(name))return null;
 let url;
 try{url=new URL(link);}catch{return null;}
 if(url.protocol!=='https:'||!/(^|\.)dropbox\.com$/i.test(url.hostname))return null;
 if(!id&&!link)return null;
 return {name,link:url.href,id:id.slice(0,600),size:Number.isSafeInteger(file?.bytes)&&file.bytes>=0?file.bytes:null};
}
root.KYV_AUDIO_WORKSPACE_V251=Object.freeze({KEY,approved,query,accounts,stats,previewableLocal,chooserItem});
})(typeof window!=='undefined'?window:globalThis);
