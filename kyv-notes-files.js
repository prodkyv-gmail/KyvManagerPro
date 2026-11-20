/* KYV Taccuino C: private per-note files with verified database ownership. */
(function(root){
'use strict';
const TABLE='kyv_note_files',BUCKET='kyv-notes-files',MAX_BYTES=15*1024*1024,MAX_PER_NOTE=30;
const TYPES=Object.freeze({
 'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/heic':'heic','image/heif':'heif',
 'application/pdf':'pdf','text/plain':'txt','text/markdown':'md','application/msword':'doc',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'xlsx',
 'application/vnd.openxmlformats-officedocument.presentationml.presentation':'pptx'
});
function validate(file){
 if(!file||typeof file.name!=='string'||!Number.isFinite(file.size)||file.size<=0||file.size>MAX_BYTES)
  throw Error('File non valido o superiore a 15 MB.');
 const mime=String(file.type||'').split(';')[0].toLowerCase().trim();
 if(!Object.prototype.hasOwnProperty.call(TYPES,mime))
  throw Error('Formato non supportato: usa foto, PDF, testo, Word, Excel o PowerPoint.');
 return {name:file.name.replace(/[\\/\u0000-\u001f]+/g,' ').trim().slice(0,200)||'Allegato',mime,extension:TYPES[mime],size:file.size};
}
function isUuid(id){return /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(id||''));}
function createStore(db,uid){
 if(!db?.from||!isUuid(uid))throw Error('Accesso utente necessario.');
 function owned(id){if(!isUuid(id))throw Error('Identificativo nota non valido.');return id;}
 async function list(noteId){
  owned(noteId);
  const rows=[],step=100;let count=null;
  for(let from=0;from<=10000;from+=step){
   const {data,error,count:total}=await db.from(TABLE).select('*',{count:'exact'})
    .eq('owner_id',uid).eq('note_id',noteId).order('created_at',{ascending:false})
    .order('id',{ascending:true}).range(from,from+step-1);
   if(error)throw error;
   if(!Array.isArray(data))throw Error('Elenco allegati non disponibile.');
   if(count===null)count=total;
   rows.push(...data);
   if(rows.length>=count||data.length<step)break;
  }
  if(count!==null&&rows.length!==count)throw Error('Allegati non caricati completamente.');
  return rows;
 }
 async function upload(noteId,file,kind='attachment'){
  owned(noteId);
  if(!['attachment','drawing'].includes(kind))throw Error('Tipo allegato non valido.');
  const info=validate(file);
  if(kind==='drawing'&&info.mime!=='image/png')throw Error('Il disegno deve essere PNG.');
  const existing=await list(noteId);
  if(existing.length>=MAX_PER_NOTE)throw Error('Limite di 30 allegati per nota raggiunto.');
  const {data:note,error:readError}=await db.from('kyv_notes').select('id').eq('id',noteId).eq('owner_id',uid).maybeSingle();
  if(readError)throw readError;if(!note)throw Error('Salva la nota prima di allegare file.');
  const id=root.crypto.randomUUID(),path=uid+'/'+noteId+'/'+id+'.'+info.extension;
  const storage=db.storage.from(BUCKET);
  const sent=await storage.upload(path,file,{contentType:info.mime,upsert:false});
  if(sent.error)throw sent.error;
  const {data,error}=await db.from(TABLE).insert({
   id,owner_id:uid,note_id:noteId,kind,file_name:info.name,
   mime_type:info.mime,size_bytes:info.size,storage_path:path
  }).select('*').single();
  if(error||!data){
   await storage.remove([path]).catch(()=>{});
   throw error||Error('Allegato non registrato: upload annullato.');
  }
  return data;
 }
 async function download(record){
  if(!record||record.owner_id!==uid||!isUuid(record.note_id)||
     !String(record.storage_path||'').startsWith(uid+'/'+record.note_id+'/'))
   throw Error('Allegato non autorizzato.');
  const {data,error}=await db.storage.from(BUCKET).download(record.storage_path);
  if(error)throw error;return data;
 }
 async function remove(record){
  if(!record||record.owner_id!==uid||!isUuid(record.id)||!isUuid(record.note_id))
   throw Error('Allegato non valido.');
  const {data,error}=await db.from(TABLE).delete().eq('owner_id',uid).eq('note_id',record.note_id)
    .eq('id',record.id).select('id');
  if(error)throw error;
  if(!Array.isArray(data)||data.length!==1)throw Error('Eliminazione allegato non confermata.');
  const result=await db.storage.from(BUCKET).remove([record.storage_path]);
  return {orphan:!!result.error};
 }
 return Object.freeze({list,upload,download,remove});
}
root.KYV_NOTES_FILES=Object.freeze({TABLE,BUCKET,MAX_BYTES,MAX_PER_NOTE,TYPES,validate,createStore});
})(typeof window!=='undefined'?window:globalThis);
