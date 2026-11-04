/* KYV v2.53 — explicitly triggered scan across already configured cloud sources.
   Never writes records, classifies ownership, deletes files or creates projects. */
(function(root){
'use strict';
const F=root.KYV_AUDIO_FINDER_V245,G=root.KYV_AUDIO_GROUPS_V249,C=root.KYV_AUDIO_CONSENT_V248;
if(!F||!G||!C)throw Error('Audio source and consent modules required');
const T=v=>String(v??'').trim();
const MAX=5000;
const SHA=/^[a-f0-9]{64}$/i;
const sourceNames={drive:'Google Drive configurato',dropbox:'Archivio Dropbox KYV',onedrive:'OneDrive ricerca autorizzata'};
const key=C.key;
const has=x=>x!==null&&x!==undefined&&x!=='';
const fields=['nome_file','size_bytes','modificato_il','percorso_relativo','content_hash','mime_type','link_file'];
function bestCopy(a,b){
  // The first occurrence remains canonical; fill only missing metadata from the same source identity.
  const result={...a};
  for(const k of fields)if(!has(result[k])&&has(b[k]))result[k]=b[k];
  return result;
}
function combine(results=[],limit=MAX){
 if(!Number.isSafeInteger(limit)||limit<1||limit>MAX)throw Error('Limite scansione non valido');
 const files=new Map(),reports=[],warnings=[];
 let encountered=0;
 for(const result of results){
  const provider=T(result?.provider);
  if(!Object.hasOwn(sourceNames,provider))throw Error('Fonte cloud non autorizzata');
  const raw=Array.isArray(result.rows)?result.rows:[];
  const errors=Array.isArray(result.errors)?result.errors.map(T).filter(Boolean):[];
  const incomplete=Boolean(result.truncated||errors.length);
  const report={provider,label:sourceNames[provider],found:raw.length,unique:0,invalid:0,
    redundant:0,conflicts:0,truncated:Boolean(result.truncated),errors,
    status:errors.length&&!raw.length?'error':incomplete?'partial':'complete'};
  for(const row of raw){
   encountered++;
   if(encountered>limit)throw Error('Oltre '+limit+' file cloud rilevati: restringi le sorgenti, nessun salvataggio eseguito');
   if(!row||row.provider!==provider||!T(row.external_key)||!F.isAudio(row.nome_file,row.mime_type)){
    report.invalid++;continue;
   }
   const identity=key(row),existing=files.get(identity);
   if(existing){
    report.redundant++;
    if((T(existing.nome_file)!==T(row.nome_file))||
       (existing.size_bytes!=null&&row.size_bytes!=null&&Number(existing.size_bytes)!==Number(row.size_bytes))||
       (T(existing.content_hash)&&T(row.content_hash)&&T(existing.content_hash)!==T(row.content_hash)))report.conflicts++;
    files.set(identity,bestCopy(existing,row));
   }else{files.set(identity,{...row});report.unique++;}
  }
  if(report.truncated)warnings.push(report.label+': limite di pagine raggiunto, ricerca parziale');
  if(report.errors.length)warnings.push(report.label+': '+report.errors.join(' · ').slice(0,500));
  if(report.invalid)warnings.push(report.label+': '+report.invalid+' risultati non validi esclusi');
  if(report.conflicts)warnings.push(report.label+': '+report.conflicts+' identità con metadati discordanti; verifica manualmente');
  reports.push(report);
 }
 return {rows:[...files.values()].sort((a,b)=>T(a.nome_file).localeCompare(T(b.nome_file),'it')),
   reports,warnings,partial:reports.some(x=>x.status!=='complete')||
     reports.some(x=>x.invalid||x.conflicts),total:files.size};
}
async function scan({drive=false,dropbox=false,onedrive=false,driveReader,dropboxReader,onedriveReader,limit=MAX}={}){
 const tasks=[];
 if(drive){if(typeof driveReader!=='function')throw Error('Connettore Drive non disponibile');
  tasks.push({provider:'drive',read:driveReader});}
 if(dropbox){if(typeof dropboxReader!=='function')throw Error('Archivio Dropbox non disponibile');
  tasks.push({provider:'dropbox',read:dropboxReader});}
 if(onedrive){if(typeof onedriveReader!=='function')throw Error('Connettore OneDrive non disponibile');
  tasks.push({provider:'onedrive',read:onedriveReader});}
 if(!tasks.length)throw Error('Seleziona almeno una fonte cloud da controllare');
 const responses=await Promise.all(tasks.map(async task=>{
  try{
   const value=await task.read();
   if(!value||!Array.isArray(value.rows))throw Error('Risultati della fonte non validi');
   return {provider:task.provider,rows:value.rows,errors:value.errors||[],
    truncated:Boolean(value.truncated)};
  }catch(e){return {provider:task.provider,rows:[],errors:[T(e?.message||e)||'Fonte non raggiungibile'],truncated:false};}
 }));
 return combine(responses,limit);
}
function propose(record,approved=[],max=3){
 const name=G.stem(record);
 const ownHash=SHA.test(T(record?.content_hash))?T(record.content_hash).toLowerCase():'';
 const candidates=[];
 for(const other of approved){
  if(!other||key(other)===key(record))continue;
  const otherHash=SHA.test(T(other.content_hash))?T(other.content_hash).toLowerCase():'';
  const sameHash=Boolean(ownHash&&otherHash&&ownHash===otherHash);
  const candidate=G.stem(other);
  const artistConflict=Boolean(name.normalizedArtist&&candidate.normalizedArtist&&
    name.normalizedArtist!==candidate.normalizedArtist);
  const titleMatches=Boolean(name.searchable&&candidate.searchable&&
    name.normalizedTitle===candidate.normalizedTitle&&!artistConflict);
  if(!sameHash&&!titleMatches)continue;
  const equalSize=record.size_bytes!=null&&other.size_bytes!=null&&
    Number(record.size_bytes)===Number(other.size_bytes);
  candidates.push({
    provider:T(other.provider),name:T(other.nome_file),sameHash,
    relationship:sameHash?'Copia con SHA-256 identico':
      equalSize?'Titolo compatibile e stessa dimensione — da verificare':'Possibile versione dal titolo — da verificare',
    noAutomaticLink:true
  });
 }
 return candidates.sort((a,b)=>Number(b.sameHash)-Number(a.sameHash)||
    a.name.localeCompare(b.name,'it')).slice(0,Math.max(0,Math.min(10,Number(max)||0)));
}
root.KYV_AUDIO_BATCH_V253=Object.freeze({scan,combine,propose,sourceNames});
})(typeof window!=='undefined'?window:globalThis);
