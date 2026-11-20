/* KYV ADD Progetto · local audio picker, SHA-256 preflight and private verified upload. */
(function(root){
'use strict';
const BUCKET='kyv-local-audio',MAX_SIZE=50*1024*1024;
const FORMATS=/\.(mp3|wav|m4a|aif|aiff|flac|aac|ogg|opus)$/i;
const ALLOWED=new Set(['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/vnd.wave',
 'audio/aiff','audio/x-aiff','audio/flac','audio/x-flac','audio/mp4','audio/x-m4a',
 'audio/aac','audio/ogg','audio/opus','application/ogg','application/octet-stream']);
function inspect(file){
 if(!file||!FORMATS.test(file.name)||!Number.isFinite(file.size)||file.size<=0||file.size>MAX_SIZE)
  throw Error('Seleziona un file audio MP3, WAV, M4A, AIFF, FLAC, AAC, OGG o OPUS fino a 50 MB.');
 const mime=file.type||'application/octet-stream';
 if(!ALLOWED.has(mime))throw Error('Formato MIME non supportato: '+mime);
 return {name:file.name,bytes:file.size,mime,ext:FORMATS.exec(file.name)[1].toLowerCase()};
}
async function hash(file){
 const digest=await root.crypto.subtle.digest('SHA-256',await file.arrayBuffer());
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function safeProjectId(value){const id=Number(value);return Number.isSafeInteger(id)&&id>0?id:null;}
function publicLink(path){return new URL('kyv_local_audio.html?file='+encodeURIComponent(path),root.location.href).href;}
async function loadProjects(db){
 const all=[],step=500,limit=30;
 for(let i=0;i<limit;i++){
  const {data,error}=await db.from('PROGETTI').select('ID,TITOLO,ARTISTA')
   .order('ID',{ascending:true}).range(i*step,(i+1)*step-1);
  if(error)throw error;if(!Array.isArray(data))throw Error('Archivio progetti non verificato.');
  all.push(...data);if(data.length<step)return all;
 }
 throw Error('Archivio progetti troppo grande: impossibile confermare tutti i progetti.');
}
async function checkDuplicates(db,sha){
 const {data,error}=await db.from('AUDIO_VERSIONI').select('ID_VERSIONE,ID_PROGETTO,NOME_FILE,CONTENT_HASH')
  .eq('CONTENT_HASH',sha).limit(100);
 if(error)throw error;return data||[];
}
function init(){
 const fileInput=document.getElementById('kyv-local-audio-file'),select=document.getElementById('kyv-local-audio-project');
 if(!fileInput||!select)return;
 const $=id=>document.getElementById(id);
 let file=null,info=null,sha=null,duplicates=[],verified=false,busy=false,db=null,projects=[];
 const alert=(message,bad=false)=>{$('kyv-local-audio-status').textContent=message;$('kyv-local-audio-status').dataset.error=String(bad);};
 const update=()=>{$('kyv-local-audio-import').disabled=busy||!verified||!safeProjectId(select.value);};
 const reset=()=>{file=null;info=null;sha=null;verified=false;duplicates=[];$('kyv-local-audio-check').disabled=true;update();};
 async function projectsRefresh(prefer){
  const session=await root.KYV_AUTH.requireAuth();if(!session)return;
  db=db||root.KYV.createSupabaseClient();
  projects=await loadProjects(db);
  select.replaceChildren(new Option('Seleziona progetto…',''),...projects.map(p=>new Option(
   (p.ARTISTA?p.ARTISTA+' · ':'')+(p.TITOLO||'Senza titolo')+' (#'+p.ID+')',String(p.ID))));
  if(prefer&&projects.some(p=>String(p.ID)===String(prefer)))select.value=String(prefer);
  update();
 }
 $('kyv-local-audio-choose').addEventListener('click',()=>fileInput.click());
 fileInput.addEventListener('change',async()=>{
  reset();
  file=fileInput.files?.[0]||null;
  if(!file)return;
  try{
   info=inspect(file);$('kyv-local-audio-flow').hidden=false;
   $('kyv-local-audio-name').textContent=info.name+' · '+(info.bytes/1024/1024).toFixed(2)+' MB';
   $('kyv-local-audio-title').value=root.KYV_AUDIO_PROJECT.cleanTitle(info.name);
   $('kyv-local-audio-check').disabled=false;
   alert('File selezionato sul dispositivo. Premi Controlla duplicati prima di importare.');
   await projectsRefresh(new URLSearchParams(root.location.search).get('project'));
  }catch(error){reset();alert(error.message,true);}
 });
 $('kyv-local-audio-check').addEventListener('click',async()=>{
  if(busy||!file||!info)return;
  busy=true;verified=false;update();
  try{
   alert('Calcolo impronta del file e confronto con l’archivio delle versioni…');
   db=db||root.KYV.createSupabaseClient();
   sha=await hash(file);
   duplicates=await checkDuplicates(db,sha);
   verified=true;
   alert(duplicates.length
    ?'Sono già presenti '+duplicates.length+' versioni con contenuto audio identico (progetti #'+
      [...new Set(duplicates.map(r=>r.ID_PROGETTO))].slice(0,10).join(', ')+'). Verifica prima di continuare.'
    :'Controllo completato: non risultano versioni identiche per impronta SHA-256.');
  }catch(error){alert('Controllo non riuscito: '+error.message,true);sha=null;}
  finally{busy=false;update();}
 });
 select.addEventListener('change',update);
 window.addEventListener('kyv:project-created',event=>{void projectsRefresh(event.detail?.id).catch(error=>alert('Aggiorna elenco progetti: '+error.message,true));});
 $('kyv-local-audio-import').addEventListener('click',async()=>{
  if(busy||!verified||!file||!info||!sha)return;
  const projectId=safeProjectId(select.value),project=projects.find(p=>Number(p.ID)===projectId);
  if(!project){alert('Seleziona un progetto esistente, oppure crealo con ADD Progetto.','true');return;}
  if(duplicates.some(v=>Number(v.ID_PROGETTO)===projectId)){
   alert('Questo audio è già collegato al progetto selezionato. Apri la sua scheda anziché duplicarlo.',true);return;
  }
  if(!root.confirm('Importare davvero «'+info.name+'» dal dispositivo nel progetto «'+(project.TITOLO||'#'+projectId)+
   '»?\n\nIl file sarà caricato nello spazio Supabase privato.\n'+
   (duplicates.length?'Attenzione: esistono altre versioni identiche in archivio.\n':'')+
   'Una volta caricato potrai scaricarlo da altri dispositivi con il tuo account.'))return;
  busy=true;update();let path=null;
  try{
   const session=await root.KYV_AUTH.requireAuth();if(!session)return;
   if(!root.crypto?.randomUUID)throw Error('Connessione sicura richiesta per l’importazione.');
   // Repeat duplicate checks before any write; never silently re-link the same content.
   duplicates=await checkDuplicates(db,sha);
   if(duplicates.some(v=>Number(v.ID_PROGETTO)===projectId))
    throw Error('Il file è già stato registrato in questo progetto. Nessun upload eseguito.');
   path=session.user.id+'/'+root.crypto.randomUUID()+'.'+info.ext;
   alert('Caricamento file privato: '+info.name+'…');
   const up=await db.storage.from(BUCKET).upload(path,file,{contentType:info.mime,upsert:false});
   if(up.error)throw up.error;
   const item={provider:'local',source:'local',providerId:path,id:path,link:publicLink(path),
     name:info.name,fileName:info.name,title:$('kyv-local-audio-title').value.trim()||project.TITOLO||info.name,
     artist:$('kyv-local-audio-artist').value.trim()||project.ARTISTA||'',
     type:$('kyv-local-audio-type').value,version:$('kyv-local-audio-version').value.trim(),
     date:file.lastModified?new Date(file.lastModified).toISOString():null,
     content_hash:sha,mimeType:info.mime,size:info.bytes};
   const linked=await root.KYV_AUDIO_PROJECT.linkToProject(item,projectId,{db,projects});
   if(!linked?._kyvImport?.archived)throw Error('Collegamento non verificato: controlla AUDIO_VERSIONI.');
   alert('Importazione completata: file salvato privatamente e versione collegata al progetto #'+projectId+'.');
   fileInput.value='';reset();
   root.location.href='scheda_progetto.html?id='+encodeURIComponent(projectId);
  }catch(error){
   if(path){
    // A failed RPC can be ambiguous: never remove a blob if a version may reference it.
    try{
     const r=await db.from('AUDIO_VERSIONI').select('ID_VERSIONE').eq('PROVIDER','local').eq('PROVIDER_ID',path).limit(1);
     if(!r.error&&Array.isArray(r.data)&&r.data.length===0){
      const cleanup=await db.storage.from(BUCKET).remove([path]);
      if(cleanup.error)alert('Controllo manuale necessario: il file privato potrebbe essere rimasto nello Storage.',true);
     }else alert('Importazione incerta: verifica AUDIO_VERSIONI prima di riprovare.',true);
    }catch(_){alert('Salvataggio non verificabile: controlla lo storico prima di riprovare.',true);}
   }
   alert('Importazione non completata: '+String(error?.message||error)+'. Controlla lo storico prima di riprovare.',true);
  }finally{busy=false;update();}
 });
}
root.KYV_LOCAL_AUDIO=Object.freeze({MAX_SIZE,inspect,safeProjectId,publicLink,hash});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window!=='undefined'?window:globalThis);
