/* KYV Taccuino semplificato · elenco, ricerca, + nuova, modifica, elimina.
   Riutilizza l'archivio privato e le bozze della Cattura veloce, che resta invariata. */
(function(root){
'use strict';
const doc=root.document,core=root.KYV_NOTES_CORE,fileAPI=root.KYV_NOTES_FILES;
if(!doc||!core)return;
const $=id=>doc.getElementById(id);
const dateFormatter=new Intl.DateTimeFormat('it-IT',{dateStyle:'medium',timeStyle:'short'});
let db=null,session=null,store=null,filesStore=null,drafts=null;
let cloudNotes=[],active=null,baseline=null,dirty=false,busy=false,loading=true,modalToken=0;
let lastFocus=null,audioUrl=null;
const noteIdFromUrl=()=>new URLSearchParams(root.location.search).get('note');
function msg(text,error=false,ok=false){
 const target=$('notes-status');target.textContent=text||'';
 target.dataset.error=String(error);target.dataset.ok=String(ok);
}
function dialogMsg(text,error=false){
 const target=$('notes-dialog-status');target.textContent=text||'';
 target.dataset.error=String(error);
}
function date(value){
 try{return value?dateFormatter.format(new Date(value)):'Adesso';}
 catch(_){return 'Adesso';}
}
function uuid(){return root.crypto.randomUUID();}
function baseNote(project=null){
 const now=new Date().toISOString();
 return {id:uuid(),owner_id:session.user.id,title:'',content:'',category:'info',
  is_pinned:false,is_archived:false,project_id:project,created_at:now,updated_at:now};
}
function hasText(note){return !!(String(note?.title||'').trim()||String(note?.content||'').trim());}
function recoverDraft(draft){
 const now=new Date().toISOString();
 const copy={...draft,id:uuid(),created_at:now,updated_at:now,
  title:('Bozza recuperata · '+(draft.title||core.readableTitle(draft))).slice(0,180),
  audio_path:null,audio_mime:null,audio_duration_seconds:null,base_updated_at:null};
 delete copy.__draft;delete copy.__remote;
 const saved=drafts.put(copy);
 if(saved)drafts.clear(draft.id,draft.pending_at);
 return saved?copy:null;
}
function mergedNotes(){
 const map=new Map(cloudNotes.map(note=>[note.id,{...note,__cloud:true}]));
 for(const draft of drafts.all()){
  const remote=map.get(draft.id);
  const base=Date.parse(draft.base_updated_at||'')||0;
  const remoteUpdated=Date.parse(remote?.updated_at||'')||0;
  if(remote&&(!base||remoteUpdated>base+1000)&&hasText(draft)){
   // Another window updated the server note; preserve both versions instead of overwriting.
   const recovered=recoverDraft(draft);
   if(recovered)map.set(recovered.id,{...recovered,__draft:true,__cloud:false});
   else map.set(draft.id,{...remote,__draft:true});
   continue;
  }
  map.set(draft.id,{...remote,...draft,__draft:true,__cloud:!!remote});
 }
 return [...map.values()].sort((a,b)=>{
  const first=Number(!!b.is_pinned)-Number(!!a.is_pinned);
  return first||((Date.parse(b.updated_at||'')||0)-(Date.parse(a.updated_at||'')||0));
 });
}
function create(tag,className,txt){
 const el=doc.createElement(tag);if(className)el.className=className;
 if(txt!==undefined)el.textContent=String(txt);return el;
}
function icon(name){
 const el=doc.createElement('i');el.dataset.lucide=name;return el;
}
function icons(rootElement){
 if(root.lucide)root.lucide.createIcons({root:rootElement||doc.body});
}
function displayDescription(note){
 const content=String(note.content||'').trim();
 return content|| (note.audio_path?'Memo vocale':'Nessuna descrizione');
}
function render(){
 const target=$('notes-list');target.replaceChildren();
 if(loading){target.append(create('p','kyv-simple-empty','Caricamento delle note…'));return;}
 const all=mergedNotes(),q=core.normalize($('notes-search').value);
 const visible=q?all.filter(n=>core.normalize([n.title,n.content].join(' ')).includes(q)):all;
 $('notes-count').textContent=visible.length===1?'1 nota':visible.length+' note';
 if(!visible.length){
  target.append(create('p','kyv-simple-empty',
   q?'Nessuna nota corrisponde alla ricerca.':'Nessuna nota. Premi + Nuova nota per iniziare.'));
  return;
 }
 for(const note of visible){
  const row=create('article','kyv-simple-note');
  row.dataset.noteId=note.id;
  const body=create('div','kyv-simple-note-body');
  const open=create('button','kyv-simple-note-title',core.readableTitle(note));
  open.type='button';open.dataset.action='edit';open.dataset.noteId=note.id;
  open.setAttribute('aria-label','Apri nota: '+core.readableTitle(note));
  const preview=create('p','kyv-simple-note-description',displayDescription(note));
  const details=create('div','kyv-simple-note-meta');
  details.append(create('span','',date(note.updated_at||note.created_at)));
  if(note.__draft){const d=create('span','','Bozza da salvare');d.dataset.local='true';details.append(d);}
  if(note.is_archived)details.append(create('span','','Archiviata'));
  if(note.audio_path)details.append(create('span','','Memo vocale'));
  body.append(open,preview,details);
  const actions=create('div','kyv-simple-note-actions');
  const edit=create('button','kyv-simple-icon-button');edit.type='button';
  edit.dataset.action='edit';edit.dataset.noteId=note.id;edit.title='Modifica';
  edit.setAttribute('aria-label','Modifica '+core.readableTitle(note));edit.append(icon('pencil'));
  const remove=create('button','kyv-simple-icon-button');remove.type='button';
  remove.dataset.action='delete';remove.dataset.noteId=note.id;remove.title='Elimina';
  remove.setAttribute('aria-label','Elimina '+core.readableTitle(note));remove.append(icon('trash-2'));
  actions.append(edit,remove);row.append(body,actions);target.append(row);
 }
 icons(target);
}
function cleanupAudio(){
 const audio=$('notes-existing-audio');audio.pause();audio.removeAttribute('src');audio.load();
 if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}
}
function closeEditor(force=false){
 if(busy)return false;
 if(!force&&dirty&&!root.confirm('Chiudere senza salvare nel cloud? La bozza resterà nell’elenco per recuperarla.'))return false;
 modalToken++;
 cleanupAudio();
 $('notes-dialog').hidden=true;
 doc.body.classList.remove('kyv-simple-modal-open');
 active=null;baseline=null;dirty=false;
 if(lastFocus?.isConnected)lastFocus.focus();
 lastFocus=null;render();return true;
}
function rememberDraft(){
 if(!active)return;
 active.title=$('notes-title').value;
 active.content=$('notes-content').value;
 dirty=true;
 if(hasText(active)){
  const ok=drafts.put({...active,base_updated_at:baseline?.updated_at||active.base_updated_at||null});
  if(!ok)dialogMsg('La bozza locale non è stata conservata. Premi Salva. ',true);
  else dialogMsg('Modifiche non ancora salvate nel cloud.');
 }else dialogMsg('Inserisci un titolo o una descrizione prima di salvare.');
 render();
}
async function loadExistingMedia(note,token){
 const details=$('notes-existing-media'),audio=$('notes-existing-audio'),files=$('notes-existing-files');
 details.hidden=!note.audio_path;files.replaceChildren();audio.hidden=true;
 if(!note.__cloud)return;
 if(note.audio_path){
  details.hidden=false;audio.hidden=false;
  try{
   const blob=await store.loadVoice(note.audio_path);
   if(token!==modalToken||$('notes-dialog').hidden)return;
   audioUrl=URL.createObjectURL(blob);audio.src=audioUrl;
  }catch(error){if(token===modalToken)files.append(create('p','','Audio non disponibile: '+error.message));}
 }
 try{
  const results=await filesStore.list(note.id);
  if(token!==modalToken||$('notes-dialog').hidden)return;
  if(!results.length)return;
  details.hidden=false;
  for(const record of results){
   const btn=create('button','kyv-simple-file-action','Scarica · '+record.file_name);
   btn.type='button';
   btn.addEventListener('click',async()=>{
    try{
     const blob=await filesStore.download(record);
     const url=URL.createObjectURL(blob),a=doc.createElement('a');
     a.href=url;a.download=record.file_name;doc.body.append(a);a.click();a.remove();
     root.setTimeout(()=>URL.revokeObjectURL(url),5000);
    }catch(error){dialogMsg('Impossibile scaricare il contenuto: '+error.message,true);}
   });
   files.append(btn);
  }
 }catch(error){if(token===modalToken)files.append(create('p','','Allegati non disponibili: '+error.message));}
}
function showEditor(note){
 if(!store||busy)return;
 if(active&&!closeEditor())return;
 const original=cloudNotes.find(row=>row.id===note.id)||null;
 active={...note};baseline=original?{...original}:null;
 dirty=false;
 lastFocus=doc.activeElement;
 $('notes-dialog-title').textContent=original||note.__draft?'Modifica nota':'Nuova nota';
 $('notes-title').value=note.title||'';
 $('notes-content').value=note.content||'';
 $('notes-existing-media').hidden=true;
 $('notes-existing-files').replaceChildren();
 cleanupAudio();
 dialogMsg(note.__draft?'Questa nota contiene una bozza locale. Premi Salva per sincronizzarla.':'');
 $('notes-dialog').hidden=false;
 doc.body.classList.add('kyv-simple-modal-open');
 const token=++modalToken;
 void loadExistingMedia({...note,__cloud:!!original},token);
 $('notes-title').focus();
}
function openNew(){
 if(!session||busy)return;
 const param=new URLSearchParams(root.location.search).get('project');
 const project=param&&Number.isSafeInteger(Number(param))&&Number(param)>0?Number(param):null;
 showEditor(baseNote(project));
}
async function saveEditor(event){
 event.preventDefault();
 if(!active||busy)return;
 active.title=$('notes-title').value.trim();
 active.content=$('notes-content').value;
 if(!hasText(active)&&!active.audio_path&&!baseline){
  dialogMsg('Scrivi un titolo o una descrizione prima di salvare.',true);return;
 }
 busy=true;$('notes-save').disabled=true;
 dialogMsg('Salvataggio…');
 const originalId=active.id;
 try{
  let toSave={...active},wasCopied=false;
  if(baseline){
   const {data:latest,error:checkError}=await db.from('kyv_notes').select('id,updated_at')
    .eq('id',baseline.id).eq('owner_id',session.user.id).maybeSingle();
   if(checkError)throw checkError;
   if(!latest||Date.parse(latest.updated_at||'')>Date.parse(baseline.updated_at||'')+1000){
    // Do not overwrite a newer version from another device.
    toSave={...active,id:uuid(),audio_path:null,audio_mime:null,audio_duration_seconds:null,
     title:(active.title||core.readableTitle(active)).slice(0,180)};
    wasCopied=true;
   }
  }
  const saved=await store.save({...toSave,allowEmptyForAudio:!!baseline});
  const index=cloudNotes.findIndex(n=>n.id===saved.id);
  if(index===-1)cloudNotes.unshift(saved);else cloudNotes[index]=saved;
  const pending=drafts.get(originalId);
  if(pending)drafts.clear(originalId,pending.pending_at);
  if(saved.id!==originalId){const newPending=drafts.get(saved.id);if(newPending)drafts.clear(saved.id,newPending.pending_at);}
  dirty=false;
  busy=false;$('notes-save').disabled=false;
  closeEditor(true);
  msg(wasCopied?'La nota è cambiata su un altro dispositivo: le tue modifiche sono state salvate come nuova nota, senza sovrascrivere l’originale.':'Nota salvata. ',false,true);
  render();
 }catch(error){
  dialogMsg('Impossibile salvare: '+String(error?.message||error)+'. La bozza rimane sul dispositivo.',true);
  busy=false;$('notes-save').disabled=false;
 }
}
async function deleteNote(note){
 if(busy||!note)return;
 if(!root.confirm('Eliminare definitivamente «'+core.readableTitle(note)+'»? Anche eventuali registrazioni e allegati associati verranno eliminati.'))return;
 busy=true;
 const list=$('notes-list');
 const row=[...list.children].find(el=>el.dataset.noteId===note.id);
 if(row)row.querySelectorAll('button').forEach(el=>el.disabled=true);
 try{
  const persisted=cloudNotes.find(n=>n.id===note.id);
  let warnings=false;
  if(persisted){
   const result=await store.remove(persisted);
   warnings=!!(result.orphanAudio||result.orphanFiles);
   cloudNotes=cloudNotes.filter(n=>n.id!==note.id);
  }
  drafts.clear(note.id);
  if(active?.id===note.id){dirty=false;closeEditor(true);}
  msg(warnings?'Nota eliminata, ma alcuni file potrebbero richiedere una pulizia dello Storage.':'Nota eliminata.',false,true);
 }catch(error){msg('Eliminazione non riuscita: '+String(error?.message||error),true);}
 finally{busy=false;render();}
}
async function refresh(){
 if(!store)return;
 try{
  const fresh=await store.listAll();cloudNotes=fresh;loading=false;
  msg('',false);render();
 }catch(error){
  loading=false;
  msg('Impossibile leggere l’archivio cloud: '+String(error?.message||error)+'. Puoi recuperare le bozze locali, ma ricarica prima di modificare note già salvate.',true);
  render();
 }
}
function bind(){
 $('notes-new').addEventListener('click',openNew);
 $('notes-search').addEventListener('input',render);
 $('notes-list').addEventListener('click',event=>{
  const button=event.target.closest('button[data-action]');
  if(!button)return;
  const note=mergedNotes().find(n=>n.id===button.dataset.noteId);
  if(!note)return;
  if(button.dataset.action==='delete')void deleteNote(note);
  else showEditor(note);
 });
 $('notes-form').addEventListener('submit',event=>{void saveEditor(event);});
 $('notes-title').addEventListener('input',rememberDraft);
 $('notes-content').addEventListener('input',rememberDraft);
 $('notes-cancel').addEventListener('click',()=>closeEditor());
 $('notes-dialog-close').addEventListener('click',()=>closeEditor());
 $('notes-dialog').addEventListener('pointerdown',event=>{
  if(event.target===$('notes-dialog'))closeEditor();
 });
 doc.addEventListener('keydown',event=>{
  if($('notes-dialog').hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeEditor();return;}
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){
   event.preventDefault();$('notes-form').requestSubmit();return;
  }
  if(event.key==='Tab'){
   const focusable=[...$('notes-dialog').querySelectorAll('button:not([disabled]),input,textarea,summary,[href]')]
    .filter(el=>!el.closest('[hidden]')&&el.getClientRects().length);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus();}
  }
 });
 root.addEventListener('beforeunload',event=>{
  if(dirty||busy){event.preventDefault();event.returnValue='';}
 });
 doc.addEventListener('visibilitychange',()=>{
  if(!doc.hidden&&!active&&!busy&&store)void refresh();
 });
}
async function boot(){
 if(typeof root.loadKyvSidebar==='function')root.loadKyvSidebar('notes');
 icons(doc.body);
 try{
  session=await root.KYV_AUTH.requireAuth();
  if(!session?.user?.id)return;
  db=root.KYV.createSupabaseClient();
  store=core.createStore(db,session.user.id);
  filesStore=fileAPI.createStore(db,session.user.id);
  drafts=core.draftStore(session.user.id,root.localStorage);
  bind();await refresh();
  const params=new URLSearchParams(root.location.search);
  if(params.get('new')==='1'||params.has('project'))openNew();
  else if(core.isUuid(noteIdFromUrl())){
   const matched=mergedNotes().find(n=>n.id===noteIdFromUrl());
   if(matched)showEditor(matched);
  }
 }catch(error){loading=false;msg('Taccuino non disponibile: '+String(error?.message||error),true);}
}
root.KYV_NOTES_SIMPLE=Object.freeze({displayDescription});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{void boot();},{once:true});
else void boot();
})(typeof window!=='undefined'?window:globalThis);
