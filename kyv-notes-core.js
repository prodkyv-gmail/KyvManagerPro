/* Taccuino KYV A+B · same authenticated Supabase store for full page and quick entry. */
(function(root){
'use strict';
const TABLE='kyv_notes',BUCKET='kyv-notes-audio';
const CATEGORIES=Object.freeze([
 {id:'idea',label:'Idea',icon:'lightbulb'},
 {id:'info',label:'Informazione',icon:'notebook-pen'},
 {id:'event',label:'È successo',icon:'clock-3'},
 {id:'todo',label:'Da fare',icon:'check-circle'}
]);
const MAX_AUDIO_BYTES=20*1024*1024,MAX_AUDIO_SECONDS=300,NOTE_LIMIT=30000;
function isUuid(id){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||''));}
function normalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').trim();}
function readableTitle(note){return String(note?.title||'').trim()||String(note?.content||'').trim().split('\n')[0].slice(0,66)||'Memo vocale';}
function cleanPayload(raw,ownerId){
 if(!isUuid(ownerId)||!isUuid(raw.id))throw Error('Sessione o nota non valide.');
 const content=String(raw.content||'').trim(),title=String(raw.title||'').trim();
 if(content.length>NOTE_LIMIT||title.length>180)throw Error('Nota troppo lunga: riduci il testo.');
 const category=CATEGORIES.some(c=>c.id===raw.category)?raw.category:'info';
 const projectId=raw.project_id===null||raw.project_id===undefined||raw.project_id===''?null:Number(raw.project_id);
 if(projectId!==null&&(!Number.isSafeInteger(projectId)||projectId<1))throw Error('Progetto collegato non valido.');
 return {
  id:raw.id,owner_id:ownerId,title,content,category,
  is_pinned:Boolean(raw.is_pinned),is_archived:Boolean(raw.is_archived),
  project_id:projectId,updated_at:new Date().toISOString()
 };
}
function audioMime(blobType){
 const type=String(blobType||'').split(';')[0].toLowerCase();
 return ['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg','audio/x-m4a'].includes(type)?type:null;
}
function voiceFormat(recorder){
 const list=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg'];
 if(!recorder||typeof recorder.isTypeSupported!=='function')return '';
 return list.find(x=>recorder.isTypeSupported(x))||'';
}
function fileExt(mime){
 return mime==='audio/mp4'?'m4a':mime==='audio/ogg'?'ogg':mime==='audio/wav'?'wav':mime==='audio/mpeg'?'mp3':'webm';
}
function draftKey(uid){if(!isUuid(uid))throw Error('Utente non valido');return 'kyv-notes-pending-v1:'+uid;}
function draftStore(uid,storage){
 const key=draftKey(uid);
 const read=()=>{try{const o=JSON.parse(storage?.getItem(key)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(_){return{};}};
 function write(obj){try{storage?.setItem(key,JSON.stringify(obj));return true;}catch(_){return false;}}
 return Object.freeze({
  all:()=>Object.values(read()).filter(item=>item&&isUuid(item.id)),
  get:id=>read()[id]||null,
  put:note=>{const value=read();value[note.id]={...note,pending_at:new Date().toISOString()};
   return write(value);},
  clear:(id,expectedPendingAt)=>{
   const value=read();if(!value[id]||(expectedPendingAt&&value[id].pending_at!==expectedPendingAt))return false;
   delete value[id];write(value);return true;
  }
 });
}
function createStore(db,uid){
 if(!db?.from||!isUuid(uid))throw Error('Connessione e accesso necessari.');
 async function listAll(){
  const result=[],step=400;let count=null;
  for(let from=0;from<60000;from+=step){
   const {data,error,count:total}=await db.from(TABLE).select('*',{count:'exact'})
     .eq('owner_id',uid).order('updated_at',{ascending:false}).order('id',{ascending:true})
     .range(from,from+step-1);
   if(error)throw error;
   if(count===null)count=total;
   if(!Array.isArray(data))throw Error('Risposta note incompleta.');
   result.push(...data);
   if(count!==null&&result.length>=count)break;
   if(data.length<step)break;
  }
  if(count!==null&&result.length!==count)throw Error('Caricamento incompleto: alcune note non sono state lette.');
  return result;
 }
 async function save(raw){
  const payload=cleanPayload(raw,uid);
  if(!payload.title&&!payload.content&&!raw.audio_path&&!raw.allowEmptyForAudio)
   throw Error('Scrivi o registra qualcosa prima di salvare.');
  // Never upsert: a partial upsert could erase audio_path and its metadata from an existing note.
  const {data:existing,error:readError}=await db.from(TABLE).select('id')
   .eq('owner_id',uid).eq('id',payload.id).maybeSingle();
  if(readError)throw readError;
  const {id,owner_id,...patch}=payload;
  const {data,error}=existing
   ?await db.from(TABLE).update(patch).eq('owner_id',uid).eq('id',id).select('*').single()
   :await db.from(TABLE).insert(payload).select('*').single();
  if(error)throw error;
  if(!data||data.owner_id!==uid)throw Error('Salvataggio non confermato.');
  return data;
 }
 async function archive(id,archived){
  if(!isUuid(id))throw Error('Nota non valida.');
  const {data,error}=await db.from(TABLE).update({is_archived:Boolean(archived),updated_at:new Date().toISOString()})
   .eq('owner_id',uid).eq('id',id).select('*').single();
  if(error)throw error;return data;
 }
 async function remove(note){
  if(!isUuid(note?.id))throw Error('Nota non valida.');
  const {error,count}=await db.from(TABLE).delete({count:'exact'}).eq('owner_id',uid).eq('id',note.id);
  if(error)throw error;
  if(count===0)throw Error('Nota non eliminata: verifica i permessi.');
  if(note.audio_path){
   const cleanup=await db.storage.from(BUCKET).remove([note.audio_path]);
   if(cleanup.error)return {orphanAudio:true};
  }
  return {orphanAudio:false};
 }
 async function uploadVoice(noteId,blob,duration){
  if(!isUuid(noteId)||!(blob instanceof Blob)||blob.size===0||blob.size>MAX_AUDIO_BYTES)
   throw Error('Registrazione non valida o maggiore di 20 MB.');
  const mime=audioMime(blob.type);
  if(!mime)throw Error('Formato audio non supportato per il salvataggio.');
  const seconds=Math.max(0,Math.min(MAX_AUDIO_SECONDS,Math.round(Number(duration)||0)));
  const path=uid+'/'+noteId+'/'+root.crypto.randomUUID()+'.'+fileExt(mime);
  const uploaded=await db.storage.from(BUCKET).upload(path,blob,{contentType:mime,upsert:false});
  if(uploaded.error)throw uploaded.error;
  const {data,error}=await db.from(TABLE).update({
    audio_path:path,audio_mime:mime,audio_duration_seconds:seconds,updated_at:new Date().toISOString()
  }).eq('owner_id',uid).eq('id',noteId).select('*').single();
  if(error||!data){
   await db.storage.from(BUCKET).remove([path]).catch(()=>{});
   throw error||Error('Audio caricato ma non associato alla nota.');
  }
  return data;
 }
 async function loadVoice(path){
  if(typeof path!=='string'||!path.startsWith(uid+'/'))throw Error('Registrazione non autorizzata.');
  const {data,error}=await db.storage.from(BUCKET).download(path);
  if(error)throw error;
  return data;
 }
 async function projects(limit=500){
  const {data,error}=await db.from('PROGETTI').select('ID,TITOLO,ARTISTA')
    .order('ID',{ascending:false}).limit(limit);
  if(error)throw error;return data||[];
 }
 return Object.freeze({listAll,save,archive,remove,uploadVoice,loadVoice,projects});
}
root.KYV_NOTES_CORE=Object.freeze({
 TABLE,BUCKET,CATEGORIES,MAX_AUDIO_BYTES,MAX_AUDIO_SECONDS,NOTE_LIMIT,
 isUuid,normalize,readableTitle,cleanPayload,audioMime,voiceFormat,fileExt,
 draftKey,draftStore,createStore
});
})(typeof window!=='undefined'?window:globalThis);
