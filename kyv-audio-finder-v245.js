/* KYV Audio Finder v2.45: deterministic discovery, no guessed associations. */
(function(root){
'use strict';
const str=v=>String(v??'').trim();
const supported=/\.(mp3|wav|aif|aiff|m4a|flac|aac|ogg|opus)$/i;
const norm=v=>str(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\.[a-z0-9]{2,5}$/i,'').replace(/[\s_\-–—]+/g,' ').replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,' ');
function isAudio(name,mime){return supported.test(str(name))||/^audio\//i.test(str(mime))}
function cleanTitle(name){
 return norm(name).replace(/\b(?:demo|mix|master|rough|bounce|provino|stems?|instrumental|instrumentale|acapella|v\d{1,3}|ver\d{1,3}|versione\s*\d{1,3}|final|finale)\b/g,' ').replace(/\s+/g,' ').trim();
}
function safeUrl(v){
 try{const u=new URL(str(v));return u.protocol==='https:'?u.href:null}catch{return null}
}
function record({provider,account='',externalKey,name,path='',mime='',size=null,modified=null,hash=null,url=null,origin='scansione'}={}){
 const p=str(provider),f=str(name),key=str(externalKey),acc=str(account);
 if(!['local','drive','dropbox'].includes(p))throw Error('Sorgente audio non supportata');
 if(!isAudio(f,mime))throw Error('File non audio');
 if(!key||key.length>600||!f||f.length>500||acc.length>180)throw Error('Identificativo o nome non valido');
 const n=size===null||size===''?null:Number(size);
 const bytes=Number.isSafeInteger(n)&&n>=0?n:null;
 const time=modified&&Number.isFinite(Date.parse(modified))?new Date(modified).toISOString():null;
 const contentHash=/^[a-f0-9]{64}$/i.test(str(hash))?str(hash).toLowerCase():null;
 const link=p==='local'?null:safeUrl(url);
 return {provider:p,account_label:acc,external_key:key,nome_file:f,percorso_relativo:str(path).slice(0,1400),
   mime_type:str(mime).slice(0,160)||null,size_bytes:bytes,modificato_il:time,content_hash:contentHash,
   link_file:link,origine:origin};
}
function suggestions(file,projects=[],max=6){
 const title=cleanTitle(file.nome_file),items=[];
 if(title.length<4)return [];
 for(const p of projects){
  const named=norm(p.TITOLO),artist=norm(p.ARTISTA);
  if(named.length<3)continue;
  // An exact title is only a suggestion; it never writes the association.
  const exact=title===named||title.startsWith(named+' ')||title.endsWith(' '+named)||title.includes(' '+named+' ');
  if(!exact)continue;
  const artistPresent=artist.length>=3&&title.includes(artist);
  items.push({id:p.ID,title:p.TITOLO||'Senza titolo',artist:p.ARTISTA||'',reason:artistPresent?'Titolo e artista nel nome':'Titolo presente nel nome',score:artistPresent?2:1});
 }
 return items.sort((a,b)=>b.score-a.score||String(a.title).localeCompare(String(b.title),'it')).slice(0,max);
}
function duplicates(file,catalogue=[]){
 const sameSource=catalogue.filter(x=>x.provider===file.provider&&x.account_label===file.account_label&&x.external_key===file.external_key);
 const sameHash=file.content_hash?catalogue.filter(x=>x.content_hash&&x.content_hash.toLowerCase()===file.content_hash.toLowerCase()):[];
 return {sameSource,sameHash};
}
root.KYV_AUDIO_FINDER_V245=Object.freeze({record,isAudio,cleanTitle,suggestions,duplicates,safeUrl,norm});
})(typeof window!=='undefined'?window:globalThis);
