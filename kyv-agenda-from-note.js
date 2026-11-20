/* Prefill Agenda from a private note ONLY. User must choose date and confirm native event form. */
(function(root){
'use strict';
const get=id=>root.document.getElementById(id);
async function init(){
 const noteId=new URLSearchParams(root.location.search).get('fromNote');
 if(!noteId)return;
 if(!root.KYV_NOTES_CORE?.isUuid(noteId))return;
 const form=get('form-new-event');
 if(!form)return;
 const banner=root.document.createElement('div');
 banner.className='kyv-agenda-from-note';banner.id='kyv-agenda-from-note';
 banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');
 banner.textContent='Preparazione attività dal Taccuino in corso…';
 form.parentNode.insertBefore(banner,form);
 try{
  const session=await root.KYV_AUTH.requireAuth();
  if(!session?.user?.id)return;
  const db=root.KYV.createSupabaseClient();
  const {data,error}=await db.from('kyv_notes').select('id,title,content,category,created_at')
   .eq('id',noteId).eq('owner_id',session.user.id).single();
  if(error)throw error;
  if(!data)throw Error('Nota non disponibile.');
  get('ev-title').value=root.KYV_NOTES_CORE.readableTitle(data).slice(0,250);
  get('ev-description').value=String(data.content||'').slice(0,5000);
  get('ev-workflow-note').value=('Origine Taccuino KYV · '+noteId).slice(0,2000);
  get('ev-status').value='da_fare';
  // No invented date and no silent Google Calendar write. The user explicitly selects date.
  get('ev-date').value='';get('ev-end-date').value='';
  const allDay=get('ev-all-day');allDay.checked=true;allDay.dispatchEvent(new Event('change',{bubbles:true}));
  banner.replaceChildren();
  const label=root.document.createElement('strong');label.textContent='Attività preparata dalla nota: '+get('ev-title').value;
  const p=root.document.createElement('p');
  p.textContent='Scegli la data, verifica il testo e premi Salva: nulla è stato creato. Per impostazione iniziale è una attività locale tutto il giorno, senza Google Calendar.';
  const link=root.document.createElement('a');link.href='kyv_notes.html?note='+encodeURIComponent(noteId);
  link.textContent='Torna alla nota';
  banner.append(label,p,link);
  get('ev-date').focus({preventScroll:true});
 }catch(error){
  banner.textContent='Impossibile preparare la nota privata: '+String(error?.message||error)+'. La tua Agenda resta disponibile.';
 }
}
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>{void init();},{once:true});else void init();
})(typeof window!=='undefined'?window:globalThis);
