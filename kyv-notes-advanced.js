/* KYV Taccuino C+D: tablet pen, private attachments, timeline, explainable suggestions and Agenda handoff. */
(function(root){
'use strict';
if(!root.KYV_NOTES_FILES||!root.KYV_NOTES_SMART)return;
function init({db,uid,getCurrent,getNotes,saveCurrent,redraw,openNote,notify}){
 const F=root.KYV_NOTES_FILES,S=root.KYV_NOTES_SMART,files=F.createStore(db,uid);
 const doc=root.document,$=id=>doc.getElementById(id);
 let currentFiles=[],currentId=null,fetchSerial=0,uploading=false,drawingDirty=false,penDown=false,eraser=false,
  history=[],previews=[],suggestion=null,viewMode='notes';
 const svg='<svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16"><path fill="none" stroke="currentColor" stroke-width="2" d="M5 12h14M12 5v14"/></svg>';
 const view=doc.createElement('section');view.id='kyv-notes-advanced';view.className='kyv-notes-advanced';
 view.innerHTML=`
  <details class="kyv-notes-advanced-section" id="kyv-notes-drawing-section">
   <summary>✎ Scrittura a mano e disegni <small>Apple Pencil, altri pennini, mouse o dita</small></summary>
   <div class="kyv-notes-advanced-body">
    <p>Scrivi o disegna liberamente; puoi anche usare Scribble nei campi testuali del dispositivo. Un disegno viene salvato come immagine PNG privata della nota.</p>
    <div class="kyv-notes-toolbar">
      <label for="kyv-notes-pen-color">Colore</label><input id="kyv-notes-pen-color" type="color" value="#1c2735" aria-label="Colore penna">
      <label for="kyv-notes-pen-size">Spessore</label><input id="kyv-notes-pen-size" type="range" min="2" max="22" value="4" aria-label="Spessore del tratto">
      <button type="button" id="kyv-notes-eraser" class="kyv-notes-btn" aria-pressed="false">Gomma</button>
      <button type="button" id="kyv-notes-undo" class="kyv-notes-btn">Annulla tratto</button>
      <button type="button" id="kyv-notes-pen-clear" class="kyv-notes-btn">Pulisci foglio</button>
    </div>
    <div class="kyv-notes-canvas-wrap"><canvas id="kyv-notes-canvas" width="900" height="360" role="img" aria-label="Foglio libero per annotazioni e disegni; funziona con pennino, touch e mouse"></canvas></div>
    <div class="kyv-notes-toolbar">
     <button type="button" id="kyv-notes-save-drawing" class="kyv-notes-btn kyv-notes-btn-primary">Salva disegno nella nota</button>
     <button type="button" id="kyv-notes-export-drawing" class="kyv-notes-btn">Scarica PNG</button>
     <span id="kyv-notes-pen-state" class="kyv-notes-meta">Foglio ancora vuoto</span>
    </div>
   </div>
  </details>
  <details class="kyv-notes-advanced-section" id="kyv-notes-files-section" open>
   <summary>📎 Foto, PDF e allegati <small>Privati e collegati alla nota</small></summary>
   <div class="kyv-notes-advanced-body">
    <p>Fino a 30 allegati per nota, massimo 15 MB ciascuno. Solo il proprietario autenticato può aprirli.</p>
    <div class="kyv-notes-toolbar">
      <button type="button" id="kyv-notes-attach" class="kyv-notes-btn">${svg} Allega file</button>
      <button type="button" id="kyv-notes-camera" class="kyv-notes-btn">📷 Scatta foto</button>
      <input type="file" id="kyv-notes-file-input" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,.pdf,.txt,.md,.doc,.docx,.xlsx,.pptx" hidden>
      <input type="file" id="kyv-notes-camera-input" accept="image/*" capture="environment" hidden>
    </div>
    <div id="kyv-notes-files-list" class="kyv-notes-files-list" aria-live="polite">Non ci sono allegati.</div>
    <div id="kyv-notes-file-preview" class="kyv-notes-file-preview" hidden></div>
   </div>
  </details>
  <details class="kyv-notes-advanced-section" id="kyv-notes-smart-section">
   <summary>✨ Organizza e ricorda <small>Consigli locali, senza AI esterna</small></summary>
   <div class="kyv-notes-advanced-body">
    <p>Le proposte di categoria, titolo e riepilogo sono calcolate direttamente sul dispositivo: non modificano la nota finché non le approvi.</p>
    <div class="kyv-notes-toolbar">
     <button type="button" id="kyv-notes-suggest" class="kyv-notes-btn">Suggerisci organizzazione</button>
     <button type="button" id="kyv-notes-agenda" class="kyv-notes-btn kyv-notes-btn-primary">📅 Prepara attività in Agenda</button>
    </div>
    <div id="kyv-notes-suggestion" class="kyv-notes-suggest-output" hidden></div>
   </div>
  </details>`;
 const voice=doc.querySelector('.kyv-notes-voice');
 voice.parentElement.insertBefore(view,voice);
 const tools=doc.querySelector('.kyv-notes-filters');
 const display=doc.createElement('div');display.className='kyv-notes-view-toggle';
 display.innerHTML='<button type="button" id="kyv-notes-view-list" aria-pressed="true">Elenco</button><button type="button" id="kyv-notes-view-timeline" aria-pressed="false">Timeline</button>';
 tools.append(display);
 const canvas=$('kyv-notes-canvas'),ctx=canvas.getContext('2d');
 function initializeCanvas(){
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.lineCap='round';ctx.lineJoin='round';history=[];drawingDirty=false;updatePenState();
 }
 function updatePenState(){
  $('kyv-notes-pen-state').textContent=drawingDirty?'Disegno non salvato · salva prima di cambiare nota':'Foglio pronto';
 }
 function canLeave(){
  if(uploading){notify('Caricamento allegato in corso: non cambiare nota.', 'error');return false;}
  if(drawingDirty&&!root.confirm('Hai un disegno non salvato. Vuoi abbandonarlo?')){
   return false;
  }
  drawingDirty=false;return true;
 }
 function point(event){
  const r=canvas.getBoundingClientRect();
  return {x:(event.clientX-r.left)*canvas.width/r.width,y:(event.clientY-r.top)*canvas.height/r.height};
 }
 function penStart(event){
  if(uploading||event.button>0)return;
  event.preventDefault();canvas.setPointerCapture?.(event.pointerId);
  history.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(history.length>12)history.shift();
  penDown=true;const p=point(event);
  ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.strokeStyle=eraser?'#ffffff':$('kyv-notes-pen-color').value;
  ctx.lineWidth=Number($('kyv-notes-pen-size').value)*(event.pointerType==='pen'?Math.max(.55,event.pressure||.55):1);
  ctx.lineTo(p.x+.03,p.y+.03);ctx.stroke();drawingDirty=true;updatePenState();
 }
 function penMove(event){
  if(!penDown)return;event.preventDefault();
  const p=point(event);ctx.lineTo(p.x,p.y);ctx.stroke();
 }
 function penEnd(event){if(!penDown)return;penDown=false;ctx.closePath();try{canvas.releasePointerCapture?.(event.pointerId);}catch(_){}}
 canvas.addEventListener('pointerdown',penStart);
 canvas.addEventListener('pointermove',penMove);
 ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,penEnd));
 $('kyv-notes-eraser').addEventListener('click',()=>{
  eraser=!eraser;$('kyv-notes-eraser').setAttribute('aria-pressed',String(eraser));
 });
 $('kyv-notes-undo').addEventListener('click',()=>{
  if(!history.length)return;ctx.putImageData(history.pop(),0,0);
  drawingDirty=true;updatePenState();
 });
 $('kyv-notes-pen-clear').addEventListener('click',()=>{
  history.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(history.length>12)history.shift();
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);drawingDirty=true;updatePenState();
 });
 const pngBlob=()=>new Promise((resolve,reject)=>{
  canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Impossibile esportare il disegno.')),'image/png');
 });
 function saveBlob(blob,name){
  const url=URL.createObjectURL(blob),a=doc.createElement('a');
  a.href=url;a.download=name;doc.body.append(a);a.click();a.remove();
  root.setTimeout(()=>URL.revokeObjectURL(url),4000);
 }
 $('kyv-notes-export-drawing').addEventListener('click',async()=>{
  try{saveBlob(await pngBlob(),'KYV-disegno-'+new Date().toISOString().slice(0,10)+'.png');}
  catch(error){notify(error.message,'error');}
 });
 async function ensureNote(){
  const original=getCurrent();if(!original)throw Error('Apri prima una nota.');
  const saved=await saveCurrent(true);
  if(!saved||saved.id!==original.id)throw Error('Salvataggio nota non confermato.');
  return saved.id;
 }
 async function sendDrawing(){
  if(!drawingDirty){notify('Scrivi o disegna qualcosa prima di salvare.','error');return;}
  if(uploading)return;
  uploading=true;$('kyv-notes-save-drawing').disabled=true;
  try{
   const noteId=await ensureNote(),blob=await pngBlob();
   const filename='Disegno '+new Intl.DateTimeFormat('it-IT',{dateStyle:'short',timeStyle:'short'}).format(new Date()).replace(/[\\/:]/g,'-')+'.png';
   const file=new File([blob],filename,{type:'image/png'});
   await files.upload(noteId,file,'drawing');
   initializeCanvas();await loadFiles(noteId);
   notify('Disegno salvato tra gli allegati privati.','success');
  }catch(error){notify('Disegno non salvato: '+error.message+'. Puoi scaricare il PNG come copia.','error');}
  finally{uploading=false;$('kyv-notes-save-drawing').disabled=false;}
 }
 $('kyv-notes-save-drawing').addEventListener('click',()=>{void sendDrawing();});
 $('kyv-notes-attach').addEventListener('click',()=>$('kyv-notes-file-input').click());
 $('kyv-notes-camera').addEventListener('click',()=>$('kyv-notes-camera-input').click());
 async function sendFiles(items){
  if(uploading||!items.length)return;
  uploading=true;let success=0;
  try{
   const noteId=await ensureNote();
   if(currentFiles.length+items.length>F.MAX_PER_NOTE)throw Error('Superato il limite di 30 allegati.');
   for(const file of items){
    try{await files.upload(noteId,file);success++;}
    catch(error){notify('Allegato «'+file.name+'» non salvato: '+error.message,'error');break;}
   }
   await loadFiles(noteId);
   if(success===items.length)notify(success+' allegat'+(success===1?'o':'i')+' salvati nello spazio privato.','success');
  }catch(error){notify('Caricamento allegati: '+error.message,'error');}
  finally{uploading=false;}
 }
 ['kyv-notes-file-input','kyv-notes-camera-input'].forEach(id=>{
  $(id).addEventListener('change',event=>{
   const items=[...(event.target.files||[])];
   event.target.value='';
   void sendFiles(items);
  });
 });
 function clearPreviews(){
  for(const url of previews)URL.revokeObjectURL(url);
  previews=[];
  const panel=$('kyv-notes-file-preview');panel.hidden=true;panel.replaceChildren();
 }
 async function openFile(record){
  try{
   notify('Apertura allegato privato…');
   const blob=await files.download(record);
   if(currentId!==record.note_id)return;
   clearPreviews();
   if(record.mime_type.startsWith('image/')&&!['image/heic','image/heif'].includes(record.mime_type)){
    const url=URL.createObjectURL(blob);previews.push(url);
    const img=doc.createElement('img');img.src=url;img.alt=record.file_name;img.loading='lazy';
    $('kyv-notes-file-preview').append(img);$('kyv-notes-file-preview').hidden=false;
   }else{saveBlob(blob,record.file_name);}
   notify('Allegato disponibile.','success');
  }catch(error){notify('Impossibile aprire allegato: '+error.message,'error');}
 }
 async function removeFile(record){
  if(uploading)return;
  if(!root.confirm('Eliminare definitivamente «'+record.file_name+'»?'))return;
  uploading=true;
  try{
   const result=await files.remove(record);
   await loadFiles(record.note_id);
   notify(result.orphan?'Metadati eliminati, ma il file privato richiede pulizia.':'Allegato eliminato.','success');
  }catch(error){notify('Eliminazione non riuscita: '+error.message,'error');}
  finally{uploading=false;}
 }
 function paintFiles(){
  const panel=$('kyv-notes-files-list');panel.replaceChildren();
  if(!currentFiles.length){panel.textContent='Non ci sono ancora allegati.';return;}
  for(const file of currentFiles){
   const row=doc.createElement('div');row.className='kyv-notes-file-row';
   const info=doc.createElement('div');info.className='kyv-notes-file-info';
   const name=doc.createElement('strong');name.textContent=(file.kind==='drawing'?'✎ ':'📎 ')+file.file_name;
   const size=doc.createElement('small');size.textContent=(file.size_bytes/1024/1024).toFixed(2)+' MB · '+file.mime_type;
   info.append(name,size);row.append(info);
   const actions=doc.createElement('div');actions.className='kyv-notes-toolbar';
   const open=doc.createElement('button');open.type='button';open.className='kyv-notes-btn';open.textContent='Apri / scarica';
   open.addEventListener('click',()=>{void openFile(file);});
   const del=doc.createElement('button');del.type='button';del.className='kyv-notes-btn kyv-notes-btn-danger';del.textContent='Elimina';
   del.addEventListener('click',()=>{void removeFile(file);});
   actions.append(open,del);row.append(actions);panel.append(row);
  }
 }
 async function loadFiles(noteId){
  const serial=++fetchSerial;currentId=noteId;currentFiles=[];clearPreviews();paintFiles();
  if(!noteId)return;
  try{
   const results=await files.list(noteId);
   if(serial!==fetchSerial||getCurrent()?.id!==noteId)return;
   currentFiles=results;paintFiles();
  }catch(error){
   if(serial===fetchSerial)notify('Impossibile caricare allegati: '+error.message,'error');
  }
 }
 function renderTimeline(filtered,container){
  container.replaceChildren();
  const groups=S.groupTimeline(filtered);
  if(!groups.length){container.textContent='Nessuna nota nella timeline con i filtri attuali.';return;}
  for(const group of groups){
   const head=doc.createElement('h3');head.className='kyv-notes-timeline-date';
   head.textContent=group.label+' · '+group.notes.length+' note';container.append(head);
   for(const note of group.notes){
    const btn=doc.createElement('button');btn.className='kyv-notes-item kyv-notes-timeline-item';
    btn.type='button';btn.dataset.selected=String(note.id===getCurrent()?.id);
    const top=doc.createElement('strong');top.textContent=(note.is_pinned?'📌 ':'')+root.KYV_NOTES_CORE.readableTitle(note);
    const body=doc.createElement('small');body.textContent=(note.category==='event'?'È successo · ':'')+
      String(note.content||'').replace(/\s+/g,' ').slice(0,110);
    btn.append(top,body);btn.addEventListener('click',()=>{void openNote(note);});container.append(btn);
   }
  }
 }
 function mode(){return viewMode;}
 ['list','timeline'].forEach(kind=>{$('kyv-notes-view-'+kind).addEventListener('click',()=>{
  viewMode=kind==='timeline'?'timeline':'notes';
  $('kyv-notes-view-list').setAttribute('aria-pressed',String(viewMode==='notes'));
  $('kyv-notes-view-timeline').setAttribute('aria-pressed',String(viewMode==='timeline'));
  redraw();
 });});
 $('kyv-notes-suggest').addEventListener('click',()=>{
  const note=getCurrent();if(!note)return;
  suggestion=S.suggest({title:$('notes-title').value,content:$('notes-content').value});
  const panel=$('kyv-notes-suggestion');panel.replaceChildren();panel.hidden=false;
  const info=doc.createElement('p');info.textContent='Titolo proposto: '+suggestion.title+
   '\nCategoria proposta: '+(root.KYV_NOTES_CORE.CATEGORIES.find(c=>c.id===suggestion.category)?.label||'Informazione')+
   '\nRiepilogo: '+(suggestion.summary||'(nessun testo)')+
   '\n'+suggestion.source;
  info.style.whiteSpace='pre-wrap';panel.append(info);
  const buttons=doc.createElement('div');buttons.className='kyv-notes-toolbar';
  const title=doc.createElement('button');title.type='button';title.className='kyv-notes-btn';title.textContent='Applica titolo';
  title.addEventListener('click',()=>{
   $('notes-title').value=suggestion.title;
   $('notes-title').dispatchEvent(new Event('input',{bubbles:true}));notify('Titolo applicato; il salvataggio mantiene la nota originale.','success');
  });
  const category=doc.createElement('button');category.type='button';category.className='kyv-notes-btn';category.textContent='Applica categoria';
  category.addEventListener('click',()=>{
   $('notes-category').value=suggestion.category;
   $('notes-category').dispatchEvent(new Event('change',{bubbles:true}));notify('Categoria applicata.','success');
  });
  buttons.append(title,category);panel.append(buttons);
 });
 $('kyv-notes-agenda').addEventListener('click',async()=>{
  if(uploading||drawingDirty){
   notify('Salva prima il disegno e termina eventuali caricamenti.','error');return;
  }
  const note=getCurrent();
  if(!note||!($('notes-title').value.trim()||$('notes-content').value.trim())){
   notify('Scrivi almeno un titolo o una descrizione prima di preparare l’attività.','error');return;
  }
  if(!root.confirm('Preparare questa nota nell’Agenda KYV? Potrai scegliere la data e confermare il salvataggio. Non verrà creato alcun evento automaticamente.'))return;
  try{
   const saved=await saveCurrent();
   if(!saved)throw Error('La nota non è stata salvata sul cloud.');
   root.location.href=S.agendaUrl(saved.id);
  }catch(error){notify('Impossibile preparare l’attività: '+error.message,'error');}
 });
 initializeCanvas();
 return Object.freeze({
  onOpen:note=>{initializeCanvas();$('kyv-notes-suggestion').hidden=true;void loadFiles(note?.id||null);},
  canLeave,isBusy:()=>uploading,hasFiles:id=>id===currentId&&currentFiles.length>0,
  renderTimeline,mode,hasUnsavedDrawing:()=>drawingDirty
 });
}
root.KYV_NOTES_ADVANCED=Object.freeze({init});
})(typeof window!=='undefined'?window:globalThis);
