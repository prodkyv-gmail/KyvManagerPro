/* KYV Agenda · archivio unico e persistente. Solo eventi sincronizzati o pianificati.
   Le letture di Google restano solo da oggi in poi; nessun dato storico viene eliminato. */
(function(root){
'use strict';
const page=(root.location?.pathname.split('/').pop()||'').toLowerCase();
if(page!=='kyv_calendar.html')return;
const TABLE='KYV_AGENDA_EVENTI',PAGE_SIZE=500;
const state={rows:[],previewRows:[],loaded:false,loading:false,error:'',lastImport:null,persistError:'',filter:'all',diagnostics:null};
let db=null,opened=[],loadingPromise=null;
const H=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const dayKey=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'':[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const isDateOnly=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value??''));
const asDate=value=>{if(value===null||value===undefined||value==='')return null;if(isDateOnly(value)){const [y,m,d]=value.split('-').map(Number);const local=new Date(y,m-1,d);return Number.isNaN(local.getTime())?null:local;}const d=new Date(value);return Number.isNaN(d.getTime())?null:d;};
const sourceEventDate=ev=>isDateOnly(ev.date)?ev.date:dayKey(ev.date);
const kindFromText=value=>{const t=String(value??'').toLowerCase();return /scaden|deadline|consegna|release|uscita|pagament|fattur|deposito|siae/.test(t)?'deadline':/follow|sollecit|feedback|richiam|invio|pitch|contatt/.test(t)?'followup':/session|studio|registr|produz|mix|master|riunion|meeting/.test(t)?'session':'other';};
const typeLabel={session:'Sessione',followup:'Follow-up',deadline:'Scadenza',other:'Altro'};
function client(){return db||(db=root.KYV?.createSupabaseClient?.()||null);}
async function owner(){
  const c=client();if(!c)throw Error('Connessione Supabase non disponibile.');
  const {data,error}=await c.auth.getUser();if(error)throw error;
  if(!data?.user?.id)throw Error('Sessione non autenticata: accedi per salvare lo storico.');
  return data.user.id;
}
function normalizeGoogle(ev,ownerId){
  const start=asDate(ev?.date),end=asDate(ev?.endDate);
  if(!start||!sourceEventDate(ev)||!String(ev?.title||'').trim())return null;
  const id=String(ev?.id||'').trim();
  // Some deployed legacy Apps Script versions omit event IDs. Preserve those rows using a
  // deterministic content fingerprint, without pretending it is a Google event ID.
  const basis=[ev.title,day,ev.date,ev.endDate,ev.description,ev.location].map(x=>String(x??'')).join('|');
  let hash=2166136261;for(let i=0;i<basis.length;i++){hash^=basis.charCodeAt(i);hash=Math.imul(hash,16777619);}
  const sourceKey=id?id+'#'+day:'legacy-'+(hash>>>0).toString(36)+'#'+day;
  const day=sourceEventDate(ev),allDay=!!ev.allDay||isDateOnly(ev.date);
  return {owner_id:ownerId,source:'google',source_key:sourceKey,calendar_id:id||null,
    title:String(ev.title).trim().slice(0,250),event_date:day,starts_at:start.toISOString(),
    ends_at:end?.toISOString()||null,all_day:allDay,
    activity_type:kindFromText(ev.title),description:String(ev.description||'').slice(0,5000),
    location:String(ev.location||'').slice(0,500),imported_at:new Date().toISOString()};
}
function toEvent(row){
  return {id:row.calendar_id||row.id,title:row.title,
    date:row.all_day?row.event_date:row.starts_at,
    endDate:row.all_day?(row.ends_at?dayKey(row.ends_at):''):row.ends_at,
    allDay:!!row.all_day,description:row.description||'',location:row.location||'',
    source:row.source,createdFromApp:row.created_from_app,activityType:row.activity_type,
    stored:true};
}
function uniqueRows(rows){
  const seen=new Set();return rows.filter(r=>{const key=r.source+'|'+r.source_key;if(seen.has(key))return false;seen.add(key);return true;});
}
function showStatus(message,isError=false){
  const el=root.document.getElementById('kyv-agenda-store-status');
  if(!el)return;el.textContent=message;el.classList.toggle('kyv-agenda-store-error',!!isError);
}
function notify(){
  opened=[...state.rows,...state.previewRows].map(toEvent);
  root.dispatchEvent(new CustomEvent('kyv:calendar-events',{
    detail:{events:opened,success:state.loaded,truncated:false,persisted:true}
  }));
}
function displayDate(row){
  const d=asDate(row.all_day?row.event_date:row.starts_at);
  return d?d.toLocaleDateString('it-IT',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}):'—';
}
function displayTime(row){
  if(row.all_day)return 'Tutto il giorno';
  const start=asDate(row.starts_at),end=asDate(row.ends_at);
  const fmt=d=>d?.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})||'—';
  return fmt(start)+' – '+fmt(end);
}
function render(){
  const list=root.document.getElementById('events-list');if(!list)return;
  if(!state.loaded&&!state.previewRows.length){
    list.innerHTML='<p class="kyv-agenda-table-empty">Archivio non ancora verificato. '+H(state.error||'Caricamento in corso…')+'</p>';
    return;
  }
  const rows=[...state.rows,...state.previewRows];
  if(!rows.length){
    list.innerHTML='<p class="kyv-agenda-table-empty">La tabella è vuota. Premi «Aggiorna agenda» per importare gli eventi Google, oppure pianifica una nuova attività.</p>';
    notify();return;
  }
  const future=rows.filter(r=>r.event_date>=dayKey(new Date())).length;
  const header='<div class="kyv-agenda-table-head"><span>Archivio eventi · '+rows.length+' registrati · '+future+' oggi/futuri</span><span>Google Calendar + attività pianificate</span></div>';
  list.innerHTML=header+'<div class="kyv-agenda-table-wrap" role="region" aria-label="Tabella unica agenda e storico" tabindex="0">'+
    '<table class="kyv-agenda-table"><thead><tr><th scope="col">Data</th><th scope="col">Orario</th><th scope="col">Attività</th><th scope="col">Tipo</th><th scope="col">Fonte</th><th scope="col">Luogo / note</th></tr></thead><tbody>'+
    rows.map((row,i)=>'<tr class="'+(row.event_date<dayKey(new Date())?'kyv-agenda-past':'')+'">'+
    '<td data-label="Data">'+H(displayDate(row))+'</td><td data-label="Orario">'+H(displayTime(row))+'</td>'+
    '<td data-label="Attività"><button type="button" class="kyv-agenda-table-title" data-kyv-calendar-index="'+i+'" aria-label="Dettagli di '+H(row.title)+'">'+H(row.title)+'</button></td>'+
    '<td data-label="Tipo">'+H(typeLabel[row.activity_type]||typeLabel.other)+'</td>'+
    '<td data-label="Fonte"><span class="kyv-agenda-source '+(row.source==='google'?'kyv-agenda-source-google':'kyv-agenda-source-local')+'">'+
      H(row.unsaved?'Google · NON salvato':row.source==='google'?(row.created_from_app?'Google · da app':'Google Calendar'):'Solo app')+'</span></td>'+
    '<td data-label="Luogo / note"><span title="'+H(row.description||'')+'">'+H(row.location||row.description||'—')+'</span></td></tr>').join('')+
    '</tbody></table></div>';
  // Mantiene un solo popup dettagli per tabella, giorno, settimana, mese e anno.
  notify();
}
async function readAll(){
  const c=client();if(!c)throw Error('Supabase non disponibile.');
  const rows=[];let offset=0,total=null;
  do{
    const {data,error,count}=await c.from(TABLE).select('*',{count:'exact'}).order('starts_at',{ascending:true}).range(offset,offset+PAGE_SIZE-1);
    if(error)throw error;
    if(!Array.isArray(data)||!Number.isSafeInteger(count))throw Error('Archivio agenda: lettura incompleta.');
    if(total!==null&&total!==count)throw Error('Archivio aggiornato durante la lettura: riprova.');
    total=count;rows.push(...data);offset+=data.length;
    if(data.length===0&&offset<total)throw Error('Archivio agenda: paginazione incompleta.');
  }while(offset<total);
  if(rows.length!==total)throw Error('Archivio agenda: conteggio non verificato.');
  return rows;
}
async function load(){
  if(loadingPromise)return loadingPromise;
  loadingPromise=(async()=>{
    try{
      await owner();
      state.rows=await readAll();state.loaded=true;state.error='';
      showStatus('Archivio permanente disponibile: '+state.rows.length+' eventi conservati.');
      render();return state.rows;
    }catch(err){
      state.error=String(err?.message||err);
      showStatus('Storico non verificabile: '+state.error,true);
      if(!state.loaded)render();
      throw err;
    }finally{loadingPromise=null;}
  })();
  return loadingPromise;
}
async function upsertRows(rows){
  if(!rows.length)return 0;
  const c=client();if(!c)throw Error('Supabase non disponibile.');
  for(let i=0;i<rows.length;i+=100){
    const batch=rows.slice(i,i+100);
    const {error}=await c.from(TABLE).upsert(batch,{onConflict:'owner_id,source,source_key'});
    if(error)throw error;
  }
  return rows.length;
}
async function importGoogle(events){
  if(!Array.isArray(events))throw Error('Gli eventi di Google non sono un elenco valido.');
  const userId=await owner();let skipped=0,idless=0;
  const rows=uniqueRows(events.map(ev=>{const row=normalizeGoogle(ev,userId);if(!row)skipped++;else if(!row.calendar_id)idless++;return row;}).filter(Boolean));
  const saved=await upsertRows(rows);
  // Upsert succeeded; force a fresh verified read and only then drop transient previews.
  await load();
  state.previewRows=[];render();
  state.lastImport=new Date();
  showStatus(saved+' eventi Google salvati o aggiornati; '+state.rows.length+' righe conservate'+(skipped?'. '+skipped+' senza identificativo non archiviati.':'.'),!!skipped);
  return {saved,skipped,idless,total:state.rows.length};
}
async function saveCreated(input,created){
  const userId=await owner(),id=String(created?.eventId||'').trim(),
    start=asDate(created?.date||input.date+'T'+input.time),end=asDate(created?.endDate||input.date+'T'+input.endTime);
  if(!start||!end||end<=start)throw Error('Orari attività non validi.');
  const remote=!!id,day=String(input.date),key=remote?id+'#'+day:'local-'+new Date().getTime()+'-'+Math.random().toString(36).slice(2);
  const row={owner_id:userId,source:remote?'google':'manual',source_key:key,calendar_id:id||null,
    title:String(input.title).trim().slice(0,250),event_date:day,starts_at:start.toISOString(),ends_at:end.toISOString(),
    all_day:false,activity_type:input.activityType||kindFromText(input.title),
    description:String(input.description||'').slice(0,5000),location:String(input.location||'').slice(0,500),
    created_from_app:true,imported_at:new Date().toISOString()};
  await upsertRows([row]);await load();return row;
}

const statusLabels={da_fare:'Da fare',fatto:'Fatto',chiuso:'Chiuso',da_rimandare:'Da rimandare',
  da_rivedere:'Da rivedere',posticipato:'Posticipato a data'};
async function updateWorkflow(id,workflow_status,remind_on,workflow_note=''){
  if(!Object.prototype.hasOwnProperty.call(statusLabels,workflow_status))
    throw Error('Stato evento non valido.');
  if(workflow_status==='posticipato'&&!/^\d{4}-\d{2}-\d{2}$/.test(remind_on||''))
    throw Error('Per posticipare scegli prima una data.');
  if(remind_on&&!/^\d{4}-\d{2}-\d{2}$/.test(remind_on))
    throw Error('Data promemoria non valida.');
  const uid=await owner();
  const {data,error}=await client().from(TABLE).update({
    workflow_status,remind_on:remind_on||null,workflow_note:String(workflow_note||'').slice(0,2000),
    status_updated_at:new Date().toISOString()
  }).eq('id',id).eq('owner_id',uid).select('id');
  if(error)throw error;
  if(!Array.isArray(data)||data.length!==1)throw Error('Aggiornamento non verificabile: nessun evento modificato.');
  await load();return true;
}
async function saveManual(input){
  if(!input?.title||!input?.date||!input?.time||!input?.endTime)throw Error('Titolo, data e orari sono obbligatori.');
  if(input.endTime<=input.time)throw Error('L’ora finale deve essere dopo l’inizio.');
  return saveCreated({...input,activityType:input.activityType||'other'},null);
}
function showPreview(events,message){
  state.previewRows=uniqueRows((events||[]).map(ev=>normalizeGoogle(ev,'preview')).filter(Boolean))
    .map(row=>({...row,unsaved:true}));
  state.error=String(message||'La scrittura in Supabase non è riuscita.');
  showStatus('Anteprima non salvata: '+state.previewRows.length+' eventi Google. '+state.error,true);
  render();
}
function reportSync(info){
  state.diagnostics={...info,at:new Date().toISOString()};
  const el=root.document.getElementById('kyv-agenda-sync-report');
  if(!el)return;
  const stage=String(info.stage||'');
  const pieces=['Google: '+(info.googleCount===null||info.googleCount===undefined?'—':info.googleCount),
    'Scritti nella tabella: '+(info.savedCount===null||info.savedCount===undefined?'—':info.savedCount),
    'Archivio verificato: '+(info.storedCount===null||info.storedCount===undefined?'—':info.storedCount)];
  const period=info.period?' · '+info.period:'';
  el.textContent=(info.error?'Errore '+stage+': '+String(info.error):pieces.join(' · ')+period)+
    (info.warning?' · '+info.warning:'');
  el.classList.toggle('kyv-agenda-sync-error',!!info.error);
  el.hidden=false;
}

const api={updateWorkflow,saveManual,showPreview,reportSync,statusLabels,load,importGoogle,saveCreated,render,toEvent,normalizeGoogle,kindFromText,getEvents:()=>opened.slice(),getState:()=>({...state})};
root.KYV_AGENDA_STORE=api;
function init(){
  const list=root.document.getElementById('events-list');
  if(!list)return;
  let status=root.document.getElementById('kyv-agenda-store-status');
  if(!status){status=root.document.createElement('p');status.id='kyv-agenda-store-status';status.setAttribute('role','status');
    status.className='kyv-agenda-store-status';const main=root.document.querySelector('.kyv-calendar-main');
    main?.firstElementChild?.insertAdjacentElement('afterend',status);}
  load().catch(err=>console.warn('[KYV Agenda] Archivio non disponibile:',err));
}
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(typeof window!=='undefined'?window:globalThis);
