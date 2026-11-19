/* KYV Agenda · archivio unico e persistente. Solo eventi sincronizzati o pianificati.
   Le letture di Google restano solo da oggi in poi; nessun dato storico viene eliminato. */
(function(root){
'use strict';
const page=(root.location?.pathname.split('/').pop()||'').toLowerCase();
if(page!=='kyv_calendar.html')return;
const TABLE='KYV_AGENDA_EVENTI',PAGE_SIZE=500;
const state={rows:[],previewRows:[],loaded:false,loading:false,error:'',lastImport:null,persistError:'',filter:'all',formOpen:false,diagnostics:null,hiddenKeys:new Set()};
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
  const day=sourceEventDate(ev),allDay=!!ev.allDay||isDateOnly(ev.date);
  // Some deployed legacy Apps Script versions omit event IDs. Preserve those rows using a
  // deterministic content fingerprint, without pretending it is a Google event ID.
  const basis=[ev.title,day,ev.date,ev.endDate,ev.description,ev.location].map(x=>String(x??'')).join('|');
  let hash=2166136261;for(let i=0;i<basis.length;i++){hash^=basis.charCodeAt(i);hash=Math.imul(hash,16777619);}
  const sourceKey=id?id+'#'+day:'legacy-'+(hash>>>0).toString(36)+'#'+day;
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
    stored:!row.unsaved,unsaved:!!row.unsaved,archiveId:row.unsaved?null:row.id,
    activityType:row.activity_type||'other',workflowStatus:row.workflow_status||'da_fare',
    remindOn:row.remind_on||'',workflowNote:row.workflow_note||'',editedInApp:!!row.edited_in_app};
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
    detail:{events:opened,success:state.loaded,truncated:false,persisted:state.previewRows.length===0}
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
function formHtml(){
  return '<form id="kyv-agenda-inline-form" class="kyv-agenda-inline-form" aria-label="Inserisci un nuovo evento nella tabella">'+
    '<div class="kyv-agenda-form-fields">'+
      '<label>Titolo<input name="title" type="text" maxlength="250" required placeholder="Attività o appuntamento"></label>'+
      '<label>Data<input name="date" type="date" required value="'+dayKey(new Date())+'"></label>'+
      '<label>Inizio<input name="time" type="time" required value="11:00"></label>'+
      '<label>Fine<input name="endTime" type="time" required value="12:00"></label>'+
      '<label>Tipo<select name="activityType"><option value="other">Altro</option><option value="session">Sessione</option><option value="followup">Follow-up</option><option value="deadline">Scadenza</option></select></label>'+
      '<label>Luogo<input name="location" maxlength="500" placeholder="Facoltativo"></label>'+
      '<label class="kyv-agenda-form-notes">Note<input name="description" maxlength="5000" placeholder="Facoltative"></label>'+
    '</div><div class="kyv-agenda-form-actions">'+
      '<button type="submit" class="kyv-agenda-primary">Salva evento nella tabella</button>'+
      '<button type="button" data-kyv-agenda-action="close-form">Annulla</button>'+
      '<span>Questa modalità salva solo nell’app. Per creare anche in Google Calendar usa «Pianifica attività».</span>'+
    '</div></form>';
}
function render(){
  const list=root.document.getElementById('events-list');if(!list)return;
  if(!state.loaded&&!state.previewRows.length){
    list.innerHTML='<p class="kyv-agenda-table-empty">Archivio non ancora verificato. '+H(state.error||'Caricamento in corso…')+'</p>';
    return;
  }
  const originals=[...state.rows,...state.previewRows];
  const today=dayKey(new Date());
  const pending=originals.filter(r=>!['fatto','chiuso'].includes(r.workflow_status||'da_fare'));
  const due=pending.filter(r=>r.remind_on&&r.remind_on<=today).length;
  const review=pending.filter(r=>r.workflow_status==='da_rivedere').length;
  const delay=pending.filter(r=>['da_rimandare','posticipato'].includes(r.workflow_status)).length;
  const activeCount=pending.length;
  const filtered=originals.map((row,index)=>({row,index}))
    .filter(({row})=>state.filter==='all'||(state.filter==='pending'
      ? !['fatto','chiuso'].includes(row.workflow_status||'da_fare')
      : (row.workflow_status||'da_fare')===state.filter))
    .sort((a,b)=>{
      const openA=['fatto','chiuso'].includes(a.row.workflow_status)?1:0;
      const openB=['fatto','chiuso'].includes(b.row.workflow_status)?1:0;
      const keyA=a.row.remind_on||a.row.event_date,keyB=b.row.remind_on||b.row.event_date;
      const futureA=keyA>=today?0:1,futureB=keyB>=today?0:1;
      return openA-openB||futureA-futureB||keyA.localeCompare(keyB)||a.row.title.localeCompare(b.row.title);
    });
  const filters=[['all','Tutti'],['pending','Da gestire'],...Object.entries(statusLabels)];
  const controls='<div class="kyv-agenda-table-controls">'+
    '<div><strong>Archivio Agenda · '+originals.length+' eventi</strong><p>Google Calendar e attività inserite nell’app, senza cancellare lo storico.</p></div>'+
    '<div class="kyv-agenda-table-actions">'+
      '<label>Filtra <select id="kyv-agenda-filter">'+filters.map(([v,label])=>'<option value="'+H(v)+'"'+(state.filter===v?' selected':'')+'>'+H(label)+'</option>').join('')+'</select></label>'+
      '<button type="button" class="kyv-agenda-primary" data-kyv-agenda-action="new-form">+ Nuova attività</button>'+
    '</div></div>'+
    '<div class="kyv-agenda-reminders" role="status">Promemoria: <strong>'+activeCount+' da gestire</strong> · '+
      due+' scaduti/in data odierna · '+review+' da rivedere · '+delay+' da rimandare/posticipati'+
      (state.previewRows.length?' · '+state.previewRows.length+' eventi Google in anteprima NON salvati':'')+
    '</div>';
  const table='<div class="kyv-agenda-table-wrap" role="region" aria-label="Archivio Google Calendar e attività, con stato e promemoria" tabindex="0">'+
    '<table class="kyv-agenda-table"><thead><tr><th scope="col">Data</th><th scope="col">Orario</th><th scope="col">Attività</th><th scope="col">Tipo</th><th scope="col">Fonte</th><th scope="col">Luogo / note</th><th scope="col">Stato</th><th scope="col">Promemoria / rinvio</th><th scope="col">Salva</th></tr></thead><tbody>'+
    (filtered.length?filtered.map(({row,index})=>{
      const status=row.workflow_status||'da_fare';
      const disabled=row.unsaved?' disabled title="Evento Google ancora da archiviare"':'';
      return '<tr class="'+(row.event_date<today?'kyv-agenda-past ':'')+(row.remind_on&&row.remind_on<=today&&!['fatto','chiuso'].includes(status)?'kyv-agenda-reminder-due':'')+'">'+
        '<td>'+H(displayDate(row))+'</td><td>'+H(displayTime(row))+'</td>'+
        '<td><button type="button" class="kyv-agenda-table-title" data-kyv-calendar-index="'+index+'">'+H(row.title)+'</button></td>'+
        '<td>'+H(typeLabel[row.activity_type]||typeLabel.other)+'</td>'+
        '<td><span class="kyv-agenda-source '+(row.unsaved?'kyv-agenda-source-unsaved':row.source==='google'?'kyv-agenda-source-google':'kyv-agenda-source-local')+'">'+H(row.unsaved?'Google · NON salvato':row.source==='google'?'Google Calendar':'Solo app')+'</span></td>'+
        '<td><span title="'+H(row.description||'')+'">'+H(row.location||row.description||'—')+'</span></td>'+
        '<td><select class="kyv-agenda-row-status" aria-label="Stato '+H(row.title)+'"'+disabled+'>'+
        Object.entries(statusLabels).map(([v,label])=>'<option value="'+v+'"'+(status===v?' selected':'')+'>'+H(label)+'</option>').join('')+
        '</select></td>'+
        '<td><input class="kyv-agenda-row-reminder" type="date" aria-label="Data promemoria o rinvio" value="'+H(row.remind_on||'')+'"'+disabled+'>'+
        '<input class="kyv-agenda-row-note" type="text" maxlength="2000" aria-label="Nota promemoria" value="'+H(row.workflow_note||'')+'" placeholder="Nota (facoltativa)"'+disabled+'></td>'+
        '<td><button type="button" class="kyv-agenda-row-save" data-kyv-agenda-id="'+H(row.id||'')+'"'+disabled+'>Salva</button></td></tr>';
    }).join(''):'<tr><td colspan="9" class="kyv-agenda-table-empty">Nessun evento per il filtro selezionato.</td></tr>')+
    '</tbody></table></div>';
  list.innerHTML=controls+(state.formOpen?formHtml():'')+table;
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
      const all=await readAll();
      state.hiddenKeys=new Set(all.filter(r=>r.deleted_at).map(r=>r.source+'|'+r.source_key));
      state.rows=all.filter(r=>!r.deleted_at);state.loaded=true;state.error='';
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
  const previous=await readAll(); // Verify current workflow decisions before Google upsert.
  const existing=new Map(previous.map(row=>[row.source+'|'+row.source_key,row]));
  const rows=uniqueRows(events.map(ev=>{
    const row=normalizeGoogle(ev,userId);if(!row){skipped++;return null;}
    if(!row.calendar_id)idless++;
    const kept=existing.get(row.source+'|'+row.source_key);
    if(kept?.deleted_at)return null; // Tombstone: never resurrect a removed Google event.
    if(kept){
      row.workflow_status=kept.workflow_status||'da_fare';row.remind_on=kept.remind_on||null;
      row.workflow_note=kept.workflow_note||'';row.status_updated_at=kept.status_updated_at||null;
      row.created_from_app=!!kept.created_from_app;
      row.edited_in_app=!!kept.edited_in_app;
      // Preserve user edits to Google-backed events when Google is synchronized again.
      if(kept.edited_in_app){
        for(const field of ['title','event_date','starts_at','ends_at','all_day','activity_type','description','location'])
          row[field]=kept[field];
      }
    }
    return row;
  }).filter(Boolean));
  const saved=await upsertRows(rows);
  // Upsert succeeded; force a fresh verified read and only then drop transient previews.
  await load();
  // A successful upsert response alone does not prove that each row is readable:
  // verify the actual persisted keys before declaring the import completed.
  const storedKeys=new Set(state.rows.filter(r=>r.owner_id===userId).map(r=>r.source+'|'+r.source_key));
  const missing=rows.filter(r=>!storedKeys.has(r.source+'|'+r.source_key));
  if(missing.length)throw Error('Salvataggio Agenda non verificato: '+missing.length+' eventi Google non presenti nella tabella.');
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
  await upsertRows([row]);await load();
  if(!state.rows.some(r=>r.owner_id===userId&&r.source===row.source&&r.source_key===row.source_key))
    throw Error('Nuova attività non verificata nella tabella: salvataggio da controllare.');
  return row;
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

const EDIT_FIELDS=['title','event_date','starts_at','ends_at','all_day','activity_type','description','location'];
function validateDetails(input){
  const title=String(input?.title||'').trim(),day=String(input?.date||'');
  const endDay=String(input?.endDate||day);
  if(!title||title.length>250)throw Error('Il titolo è obbligatorio (max 250 caratteri).');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^\d{4}-\d{2}-\d{2}$/.test(endDay))
    throw Error('Indica date di inizio e fine valide.');
  if(!typeLabel[input.activityType||'other'])throw Error('Tipo attività non valido.');
  const allDay=!!input.allDay;
  const time=allDay?'00:00':String(input.time||'');
  const endTime=allDay?'00:00':String(input.endTime||'');
  if(!/^\d{2}:\d{2}$/.test(time)||!/^\d{2}:\d{2}$/.test(endTime))
    throw Error('Indica gli orari validi.');
  const start=asDate(day+'T'+time);
  const endStart=allDay?asDate(endDay+'T00:00'):null;
  const end=allDay&&endStart?new Date(endStart.getTime()+86400000):allDay?null:asDate(endDay+'T'+endTime);
  if(!start||!end||Number.isNaN(end.getTime())||end<=start)throw Error('La fine deve seguire l’inizio.');
  return {title,event_date:day,starts_at:start.toISOString(),ends_at:end.toISOString(),all_day:allDay,
    activity_type:input.activityType||'other',description:String(input.description||'').slice(0,5000),
    location:String(input.location||'').slice(0,500)};
}
async function updateEvent(id,input){
  const uid=await owner(),original=state.rows.find(r=>r.id===id);
  if(!original)throw Error('Evento non trovato o non modificabile. Ricarica l’Agenda.');
  const fields=validateDetails(input);
  const status=input.workflowStatus||original.workflow_status||'da_fare';
  if(!Object.prototype.hasOwnProperty.call(statusLabels,status))throw Error('Stato non valido.');
  const remind=input.remindOn||null;
  if(remind&&!/^\d{4}-\d{2}-\d{2}$/.test(remind))throw Error('Data promemoria non valida.');
  if(status==='posticipato'&&!remind)throw Error('Per posticipare, indica una data.');
  const patch={...fields,edited_in_app:true,workflow_status:status,remind_on:remind,
    workflow_note:String(input.workflowNote||'').slice(0,2000),status_updated_at:new Date().toISOString()};
  const {data,error}=await client().from(TABLE).update(patch).eq('id',id).eq('owner_id',uid)
    .is('deleted_at',null).select('*');
  if(error)throw error;
  if(!Array.isArray(data)||data.length!==1)throw Error('Modifica non confermata dal database.');
  await load();
  const saved=state.rows.find(r=>r.id===id);
  const sameField=field=>['starts_at','ends_at'].includes(field)
    ? asDate(saved[field])?.getTime()===asDate(patch[field])?.getTime()
    : saved[field]===patch[field];
  if(!saved||!EDIT_FIELDS.every(sameField)||saved.workflow_status!==status)
    throw Error('I dati aggiornati non sono verificabili nella tabella.');
  return saved;
}
async function deleteEvent(id){
  const uid=await owner();
  if(!state.rows.some(r=>r.id===id))throw Error('Evento già rimosso o non disponibile.');
  const stamp=new Date().toISOString();
  const {data,error}=await client().from(TABLE).update({deleted_at:stamp})
    .eq('id',id).eq('owner_id',uid).is('deleted_at',null).select('id,deleted_at');
  if(error)throw error;
  if(!Array.isArray(data)||data.length!==1||!data[0].deleted_at)
    throw Error('Rimozione non confermata dal database.');
  await load();
  const saved=await readAll();
  if(state.rows.some(r=>r.id===id)||!saved.some(r=>r.id===id&&r.deleted_at))
    throw Error('Rimozione non verificata: ricarica l’Agenda.');
  return true;
}

function showPreview(events,message){
  const alreadyStored=new Set([...state.rows.map(row=>row.source+'|'+row.source_key),...state.hiddenKeys]);
  state.previewRows=uniqueRows((events||[]).map(ev=>normalizeGoogle(ev,'preview')).filter(Boolean))
    .filter(row=>!alreadyStored.has(row.source+'|'+row.source_key))
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

const api={updateWorkflow,updateEvent,deleteEvent,saveManual,showPreview,reportSync,statusLabels,load,importGoogle,saveCreated,render,toEvent,normalizeGoogle,kindFromText,getEvents:()=>opened.slice(),getState:()=>({...state})};
root.KYV_AGENDA_STORE=api;
function wireTableActions(list){
  if(!list||typeof list.addEventListener!=='function')return;
  list.addEventListener('change',event=>{
    if(event.target?.id==='kyv-agenda-filter'){
      state.filter=event.target.value;render();
    }
  });
  list.addEventListener('click',async event=>{
    const action=event.target?.closest?.('[data-kyv-agenda-action]');
    if(action){
      if(action.dataset.kyvAgendaAction==='new-form')state.formOpen=true;
      else if(action.dataset.kyvAgendaAction==='close-form')state.formOpen=false;
      render();return;
    }
    const button=event.target?.closest?.('[data-kyv-agenda-id]');
    if(!button||button.disabled)return;
    const tr=button.closest('tr');if(!tr)return;
    const status=tr.querySelector('.kyv-agenda-row-status')?.value;
    const remind=tr.querySelector('.kyv-agenda-row-reminder')?.value||'';
    const note=tr.querySelector('.kyv-agenda-row-note')?.value||'';
    button.disabled=true;button.textContent='Salvo…';
    try{
      await updateWorkflow(button.dataset.kyvAgendaId,status,remind,note);
      showStatus('Stato e promemoria salvati e verificati nella tabella.');
    }catch(err){
      showStatus('Impossibile salvare il promemoria: '+String(err?.message||err),true);
      button.disabled=false;button.textContent='Riprova';
    }
  });
  list.addEventListener('submit',async event=>{
    if(event.target?.id!=='kyv-agenda-inline-form')return;
    event.preventDefault();
    const form=event.target,submit=form.querySelector('button[type="submit"]');
    if(submit?.disabled)return;
    const read=name=>String(form.elements.namedItem(name)?.value||'').trim();
    const input={title:read('title'),date:read('date'),time:read('time'),
      endTime:read('endTime'),activityType:read('activityType'),
      location:read('location'),description:read('description')};
    if(submit){submit.disabled=true;submit.textContent='Salvo…';}
    try{
      await saveManual(input);
      state.formOpen=false;render();
      showStatus('Nuova attività registrata nella tabella. Non inviata a Google Calendar.');
    }catch(err){
      showStatus('Inserimento non riuscito: '+String(err?.message||err),true);
      if(submit){submit.disabled=false;submit.textContent='Riprova salvataggio';}
    }
  });
}

function init(){
  const list=root.document.getElementById('events-list');
  if(!list)return;
  wireTableActions(list);
  let status=root.document.getElementById('kyv-agenda-store-status');
  if(!status){status=root.document.createElement('p');status.id='kyv-agenda-store-status';status.setAttribute('role','status');
    status.className='kyv-agenda-store-status';const main=root.document.querySelector('.kyv-calendar-main');
    main?.firstElementChild?.insertAdjacentElement('afterend',status);}
  load().catch(err=>console.warn('[KYV Agenda] Archivio non disponibile:',err));
}
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(typeof window!=='undefined'?window:globalThis);
