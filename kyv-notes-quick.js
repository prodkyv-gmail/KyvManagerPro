/* Taccuino KYV · quick capture button on working pages (no navigation required). */
(function(root){
'use strict';
if(root.KYV_NOTES_QUICK)return;
const core=root.KYV_NOTES_CORE;
if(!core||!root.KYV_NOTES_VOICE)return;
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
if(page==='login.html'||page==='kyv_notes.html')return;
let modal=null,open=false,voice=null,db=null,store=null,drafts=null,uid=null,note=null,audioBlob=null,
 audioSeconds=0,audioUrl=null,busy=false,originalFocus=null;
const $=id=>document.getElementById(id);
function message(value,error=false){
 const el=$('kyv-notes-quick-status');if(!el)return;
 el.textContent=value;el.dataset.kind=error?'error':'';
}
function attach(){
 if($('kyv-notes-quick-fab'))return;
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='kyv-notes.css';
 stylesheet.dataset.kyvQuickNotesCss='1';document.head.appendChild(stylesheet);
 const fab=document.createElement('button');fab.type='button';fab.id='kyv-notes-quick-fab';
 fab.className='kyv-notes-fab';fab.textContent='+ Nota';
 fab.setAttribute('aria-label','Scrivi una nota veloce');fab.addEventListener('click',()=>{void show();});
 document.body.appendChild(fab);
 modal=document.createElement('div');modal.id='kyv-notes-quick-overlay';modal.className='kyv-notes-quick-overlay';
 modal.hidden=true;modal.setAttribute('aria-hidden','true');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.setAttribute('aria-labelledby','kyv-notes-quick-title');
 modal.innerHTML=`<section class="kyv-notes-quick-dialog">
   <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
     <div><p class="kyv-notes-eyebrow">Cattura veloce</p><h2 id="kyv-notes-quick-title">+ Nota</h2></div>
     <button type="button" class="kyv-notes-btn" id="kyv-notes-quick-close" aria-label="Chiudi"><span aria-hidden="true">✕</span></button>
   </div>
   <label for="kyv-notes-quick-category" class="kyv-notes-label">Tipo di nota</label>
   <select id="kyv-notes-quick-category" class="kyv-notes-select">
     <option value="idea">💡 Idea</option><option value="info">📓 Informazione</option>
     <option value="event">🕒 È successo</option><option value="todo">✓ Da fare</option>
   </select>
   <label for="kyv-notes-quick-text" class="kyv-notes-label">Appunto</label>
   <textarea id="kyv-notes-quick-text" maxlength="30000" class="kyv-notes-textarea" placeholder="Scrivi o detta qualcosa…"></textarea>
   <div class="kyv-notes-toolbar">
     <button type="button" id="kyv-notes-quick-dictate" class="kyv-notes-btn">🎙️ Detta testo</button>
     <button type="button" id="kyv-notes-quick-record" class="kyv-notes-btn kyv-notes-recorder" data-recording="false">● Registra audio</button>
   </div>
   <p class="kyv-notes-meta">La dettatura dipende dal browser. Le registrazioni sono private; l’audio non viene trascritto automaticamente.</p>
   <audio id="kyv-notes-quick-player" preload="none" controls hidden aria-label="Anteprima registrazione"></audio>
   <button type="button" id="kyv-notes-quick-download" class="kyv-notes-btn" hidden>Scarica una copia della registrazione</button>
   <p id="kyv-notes-quick-status" role="status" aria-live="polite" class="kyv-notes-status"></p>
   <div class="kyv-notes-toolbar" style="justify-content:space-between">
     <a href="kyv_notes.html" class="kyv-notes-btn" style="text-decoration:none">Apri Taccuino</a>
     <button type="button" id="kyv-notes-quick-save" class="kyv-notes-btn kyv-notes-btn-primary">Salva nota</button>
   </div>
 </section>`;
 document.body.appendChild(modal);
 $('kyv-notes-quick-close').addEventListener('click',dismiss);
 modal.addEventListener('pointerdown',event=>{if(event.target===modal)dismiss();});
 $('kyv-notes-quick-category').addEventListener('change',cacheDraft);
 $('kyv-notes-quick-text').addEventListener('input',cacheDraft);
 $('kyv-notes-quick-save').addEventListener('click',()=>{void persist();});
 $('kyv-notes-quick-dictate').addEventListener('click',()=>{
  if(!voice)return;if(voice.isDictating())voice.stopDictation();else voice.startDictation();
 });
 $('kyv-notes-quick-record').addEventListener('click',()=>{
  if(!voice)return;if(voice.isRecording())voice.stopRecording();else void voice.startRecording();
 });
 $('kyv-notes-quick-download').addEventListener('click',downloadCopy);
 document.addEventListener('keydown',event=>{
  if(!open)return;
  if(event.key==='Escape'){event.preventDefault();dismiss();return;}
  if(event.key!=='Tab')return;
  const focusable=[...modal.querySelectorAll('button:not([disabled]),a[href],textarea,select')]
   .filter(el=>el.getClientRects().length>0);
  const first=focusable[0],last=focusable[focusable.length-1];
  if(!first)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 },true);
 if(root.lucide)lucide.createIcons({root:fab});
}
function releaseAudio(){
 const player=$('kyv-notes-quick-player');
 if(player){player.pause();player.removeAttribute('src');player.load();}
 if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}
}
function contextProject(){
 const params=new URLSearchParams(location.search);
 const id=page==='scheda_progetto.html'?params.get('id'):page==='editor.html'&&params.get('table')==='PROGETTI'?params.get('editId'):params.get('project');
 if(!id||!/^[1-9]\d{0,14}$/.test(id)||!Number.isSafeInteger(Number(id)))return null;
 return Number(id);
}
function cacheDraft(){
 if(!drafts||!note)return;
 note.category=$('kyv-notes-quick-category').value;
 note.content=$('kyv-notes-quick-text').value;
 if(note.content.trim())drafts.put(note);
}
async function show(){
 if(open)return;
 if(!root.KYV_AUTH){location.href='kyv_notes.html?new=1';return;}
 const session=await KYV_AUTH.requireAuth();
 if(!session)return;
 try{
  const userId=session.user.id;
  if(!store||uid!==userId){
   uid=userId;db=KYV.createSupabaseClient();store=core.createStore(db,uid);
   drafts=core.draftStore(uid,root.localStorage);
  }
  attach();
  note={id:crypto.randomUUID(),owner_id:uid,title:'',content:'',category:'idea',project_id:contextProject(),
   is_pinned:false,is_archived:false,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  audioBlob=null;audioSeconds=0;releaseAudio();
  $('kyv-notes-quick-category').value='idea';$('kyv-notes-quick-text').value='';
  $('kyv-notes-quick-player').hidden=true;$('kyv-notes-quick-download').hidden=true;
  voice=KYV_NOTES_VOICE.create({
   getText:()=>$('kyv-notes-quick-text').value,
   onText:text=>{$('kyv-notes-quick-text').value=text;cacheDraft();},
   onAudio:({blob,duration})=>{
    if(blob.size>core.MAX_AUDIO_BYTES||!core.audioMime(blob.type)){
     message('Audio non compatibile o maggiore di 20 MB.',true);return;
    }
    audioBlob=blob;audioSeconds=duration;releaseAudio();
    audioUrl=URL.createObjectURL(blob);
    $('kyv-notes-quick-player').src=audioUrl;$('kyv-notes-quick-player').hidden=false;
    $('kyv-notes-quick-download').hidden=false;
    message('Memo pronto. Premi Salva nota oppure scarica una copia.');
   },
   onError:text=>message(text,true),
   onState:s=>{
    const recording=voice?.isRecording();
    $('kyv-notes-quick-record').textContent=recording?'■ Stop audio':'● Registra audio';
    $('kyv-notes-quick-record').dataset.recording=String(!!recording);
    $('kyv-notes-quick-dictate').textContent=voice?.isDictating()?'■ Stop dettatura':'🎙️ Detta testo';
    if(!audioBlob)message(s.message);
   }
  });
  open=true;originalFocus=document.activeElement;
  modal.hidden=false;modal.setAttribute('aria-hidden','false');
  $('kyv-notes-quick-text').focus();
  message('Scrivi, detta o registra: salva con un solo pulsante.');
 }catch(error){console.warn('[KYV Note] Accesso rapido non disponibile',error);
  location.href='kyv_notes.html?new=1';
 }
}
function downloadCopy(){
 if(!audioBlob)return;
 const url=URL.createObjectURL(audioBlob),a=document.createElement('a');
 a.href=url;a.download='kyv-nota-vocale-'+new Date().toISOString().replaceAll(':','-')+'.'+core.fileExt(core.audioMime(audioBlob.type));
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function dismiss(force=false){
 if(!open||(busy&&!force))return;
 if(!force&&(voice?.isRecording()||audioBlob)){
  const ok=confirm('Registrazione non ancora salvata. Vuoi chiudere e perderla? Usa “Scarica una copia” prima di chiudere, se vuoi conservarla.');
  if(!ok)return;
 }
 voice?.dispose();voice=null;audioBlob=null;releaseAudio();
 modal.hidden=true;modal.setAttribute('aria-hidden','true');open=false;
 if(originalFocus?.isConnected)originalFocus.focus();originalFocus=null;
}
async function persist(){
 if(busy||!note)return;
 cacheDraft();
 if(!note.content.trim()&&!audioBlob){message('Scrivi o registra qualcosa prima di salvare.',true);return;}
 busy=true;$('kyv-notes-quick-save').disabled=true;
 try{
  message('Salvataggio nel tuo Taccuino…');
  const saved=await store.save({...note,allowEmptyForAudio:!!audioBlob});
  note={...note,...saved};
  if(audioBlob){const uploaded=await store.uploadVoice(note.id,audioBlob,audioSeconds);note={...note,...uploaded};audioBlob=null;}
  drafts.clear(note.id);
  message('Nota salvata nel tuo Taccuino.','success');
  if(root.KYV?.showToast)root.KYV.showToast('Nota salvata nel Taccuino.','success');
  dismiss(true);
 }catch(error){
  message('Impossibile salvare: '+(error?.message||'controlla rete e accesso')+'. La bozza testuale resta sul dispositivo.',true);
  $('kyv-notes-quick-download').hidden=!audioBlob;
 }finally{busy=false;$('kyv-notes-quick-save').disabled=false;}
}
async function bootstrap(){
 if(page==='login.html'||page==='kyv_notes.html')return;
 try{
  const session=await root.KYV_AUTH?.getSession();
  if(!session)return;attach();
 }catch(error){console.warn('[KYV Note] Accesso rapido non pronto',error);}
}
root.KYV_NOTES_QUICK=Object.freeze({open:show});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{void bootstrap();},{once:true});
else void bootstrap();
})(typeof window!=='undefined'?window:globalThis);
