/* KYV Agenda: reviewed local .ics/.csv event intake, no upload of source documents. */
(function(root){
'use strict';
const doc=root.document;
function init(){
 const wrap=doc.getElementById('kyv-agenda-local-import');
 if(!wrap||!root.KYV_AGENDA_LOCAL)return;
 const file=doc.getElementById('kyv-agenda-local-file');
 const preview=doc.getElementById('kyv-agenda-local-preview');
 const status=doc.getElementById('kyv-agenda-local-status');
 const save=doc.getElementById('kyv-agenda-local-save');
 const count=doc.getElementById('kyv-agenda-local-count');
 let events=[],source='',busy=false;
 function report(msg,error=false){status.textContent=msg;status.dataset.error=String(error);}
 function reset(){events=[];source='';preview.replaceChildren();save.disabled=true;count.textContent='Nessun evento selezionato';}
 function selected(){return [...preview.querySelectorAll('input[data-event-index]:checked')].map(ch=>events[Number(ch.dataset.eventIndex)]).filter(Boolean);}
 function update(){
  const n=selected().length;
  count.textContent=n+' di '+events.length+' attività selezionate';
  save.disabled=busy||n===0;
 }
 function show(rows){
  preview.replaceChildren();
  for(let i=0;i<rows.length;i++){
   const e=rows[i];
   const line=doc.createElement('label');line.className='kyv-agenda-local-event';
   const checkbox=doc.createElement('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.dataset.eventIndex=String(i);
   const body=doc.createElement('span');body.className='kyv-agenda-local-event-body';
   const name=doc.createElement('strong');name.textContent=e.title;
   const details=doc.createElement('small');
   details.textContent=e.date+(e.endDate!==e.date?' → '+e.endDate:'')+
      (e.allDay?' · Tutto il giorno':' · '+e.time+'–'+e.endTime)+
      (e.timezone?' · Fuso dichiarato: '+e.timezone+' (verifica orario)':'');
   const desc=doc.createElement('small');desc.textContent=(e.location||e.description||'').slice(0,120);
   body.append(name,details,desc);line.append(checkbox,body);preview.append(line);
  }
  update();
 }
 file.addEventListener('change',async()=>{
  reset();
  const chosen=file.files?.[0];
  if(!chosen)return;
  try{
   report('Lettura del file in corso…');
   const result=await root.KYV_AGENDA_LOCAL.readFile(chosen);
   if(!result.records.length)throw Error('Nessun evento valido nel file.');
   events=result.records;source=result.name;show(events);
   report(events.length+' eventi verificati in «'+source+'»'+(result.ignored?' · '+result.ignored+' righe non valide ignorate':'')+
    '. Seleziona quelli da inserire, poi conferma. Fusi orari particolari vanno verificati nell’anteprima.');
  }catch(error){reset();report(error.message||'Importazione non riuscita.',true);}
 });
 preview.addEventListener('change',update);
 doc.getElementById('kyv-agenda-local-all').addEventListener('click',()=>{
  preview.querySelectorAll('input[data-event-index]').forEach(el=>{el.checked=true;});update();
 });
 doc.getElementById('kyv-agenda-local-none').addEventListener('click',()=>{
  preview.querySelectorAll('input[data-event-index]').forEach(el=>{el.checked=false;});update();
 });
 save.addEventListener('click',async()=>{
  if(busy)return;
  const chosen=selected();
  if(!chosen.length)return;
  if(!root.confirm('Importare '+chosen.length+' attività dal file «'+source+'» nell’Agenda KYV? Verranno ignorati i duplicati e Google Calendar resterà invariato.'))return;
  const store=root.KYV_AGENDA_STORE;
  if(!store?.importLocalRecords){report('Archivio Agenda non pronto: ricarica la pagina.',true);return;}
  busy=true;save.disabled=true;
  try{
   report('Salvataggio delle '+chosen.length+' attività selezionate…');
   const result=await store.importLocalRecords(chosen);
   report('Importazione completata: '+result.saved+' eventi nuovi o verificati · '+result.skipped+' già presenti o duplicati. Google Calendar non modificato.');
   reset();file.value='';
   root.dispatchEvent(new CustomEvent('kyv:calendar-created'));
  }catch(error){
   report('Salvataggio non confermato: '+String(error?.message||error)+'. Controlla lo storico prima di ripetere.',true);
  }finally{busy=false;update();}
 });
}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window!=='undefined'?window:globalThis);
