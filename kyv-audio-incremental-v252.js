/* KYV v2.52 — read-only incremental comparison; no automatic index writes.
   An unchanged identity is NOT a guarantee of identical music without a verified content hash. */
(function(root){
'use strict';
const C=root.KYV_AUDIO_CONSENT_V248,G=root.KYV_AUDIO_GROUPS_V249;
if(!C||!G)throw Error('Audio ownership and version helpers required');
const T=v=>String(v??'').trim();
const KEY=C.key;
const fields=Object.freeze(['nome_file','percorso_relativo','size_bytes','modificato_il','mime_type','link_file']);
function differs(a,b){
 if(!a||!b)return[];
 return fields.filter(k=>{
  const next=b[k],old=a[k];
  // Incomplete scans must not overwrite or classify absent metadata as changes.
  if(next==null||next==='')return false;
  if(k==='size_bytes')return Number.isFinite(Number(next))&&(old==null||old===''||Number(next)!==Number(old));
  if(k==='modificato_il'){
   const x=Date.parse(next),y=Date.parse(old);
   return Number.isFinite(x)&&(!Number.isFinite(y)||x!==y);
  }
  return T(next)!==T(old);
 });
}
function hasRevisionInfo(f){return f?.size_bytes!=null||!!T(f?.modificato_il);}
function classify(record,old,decision){
 const state=decision==='reference'?'excluded':decision==='da_verificare'?'pending':
  !old?'new':differs(old,record).length?'changed':
  hasRevisionInfo(record)&&hasRevisionInfo(old)?'unchanged':'unverified';
 return {state,previousDecision:decision||'da_verificare',
  changedFields:old?differs(old,record):[],sameIdentity:!!old};
}
function compare(scanned=[],catalogue=[],decisions=[]){
 const previous=new Map(catalogue.map(x=>[KEY(x),x]));
 const known=new Map(decisions.map(x=>[KEY(x),x.decision]));
 const seen=new Set();
 return scanned.filter(f=>{
  const k=KEY(f);
  if(!T(f?.external_key)||seen.has(k))return false;
  seen.add(k);return true;
 }).map(f=>{
  const old=previous.get(KEY(f));
  return {...f,_sync:classify(f,old,known.get(KEY(f))),_previous:old||null};
 });
}
function summary(items=[]){
 const s={new:0,changed:0,unchanged:0,unverified:0,excluded:0,pending:0,total:items.length};
 for(const f of items)if(Object.hasOwn(s,f?._sync?.state))s[f._sync.state]++;
 return s;
}
function filter(items=[],{query='',status='attention',decision='all'}={}){
 const q=T(query).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it-IT');
 const terms=q.split(/\s+/).filter(Boolean);
 const fold=v=>T(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it-IT');
 return items.map((f,index)=>({f,index})).filter(({f})=>{
  const state=f._sync?.state||'new';
  if(status==='attention'&&!['new','changed','pending','unverified'].includes(state))return false;
  if(status!=='attention'&&status!=='all'&&state!==status)return false;
  if(decision!=='all'&&f.decision!==decision)return false;
  return terms.every(word=>fold([f.nome_file,f.percorso_relativo,f.provider,f.account_label].join(' ')).includes(word));
 }).map(x=>x.index);
}
function preserveRecord(newRow,old){
 if(!old)return newRow;
 const result={...newRow};
 for(const k of fields){
  if(k==='nome_file'||k==='percorso_relativo')continue;
  if((result[k]==null||result[k]==='')&&old[k]!=null&&old[k]!=='')result[k]=old[k];
 }
 if(!T(result.percorso_relativo)&&T(old.percorso_relativo))result.percorso_relativo=old.percorso_relativo;
 return result;
}
function versionSuggestions(record,oldApproved=[],max=4){
 const key=KEY(record),source=G.stem(record);
 if(!source.searchable)return[];
 const currentArtist=source.normalizedArtist;
 const exactHash=/^[a-f0-9]{64}$/i.test(T(record.content_hash))?T(record.content_hash).toLowerCase():'';
 const options=[];
 for(const other of oldApproved){
  if(KEY(other)===key)continue;
  const candidate=G.stem(other);
  if(!candidate.searchable||source.normalizedTitle!==candidate.normalizedTitle)continue;
  // Explicitly different artists must never be merged merely by title.
  if(currentArtist&&candidate.normalizedArtist&&currentArtist!==candidate.normalizedArtist)continue;
  const hashMatch=!!exactHash&&exactHash===T(other.content_hash).toLowerCase();
  options.push({name:T(other.nome_file),provider:T(other.provider),
   reason:hashMatch?'Hash SHA-256 identico verificato':currentArtist&&candidate.normalizedArtist?'Titolo e artista nel nome':'Titolo nel nome; artista da verificare',
   identicalHash:hashMatch});
 }
 return options.sort((a,b)=>Number(b.identicalHash)-Number(a.identicalHash)||
  a.name.localeCompare(b.name,'it')).slice(0,Math.max(0,Math.min(10,max)));
}
root.KYV_AUDIO_INCREMENTAL_V252=Object.freeze({KEY,differs,classify,compare,summary,filter,preserveRecord,versionSuggestions});
})(typeof window!=='undefined'?window:globalThis);
