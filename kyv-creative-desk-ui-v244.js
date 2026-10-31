/* KYV Studio Manager v2.44 — Sessioni & Piazzamenti. Authenticated, owner-RLS, no deletes. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const text=v=>String(v??'').trim();
const H=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const day=v=>window.KYV_CREATIVE_DESK_V244.date(v);
const sessionTypes=['scrittura','produzione','registrazione','revisione','altro'];
const sessionStates=['in_lavorazione','demo','proposta','produzione','pubblicazione','accantonato'];
const pitchStates=['da_proporre','inviato','in_ascolto','interessato','opzionato','confermato','rifiutato','accantonato'];
const recipients=['artista','a_r','etichetta','publisher','management','altro'];
const friendly={in_lavorazione:'In lavorazione',demo:'Demo',proposta:'Proposta',produzione:'Produzione',pubblicazione:'Pubblicazione dichiarata',accantonato:'Accantonato',da_proporre:'Da proporre',inviato:'Inviato',in_ascolto:'In ascolto',interessato:'Interessato',opzionato:'Opzionato',confermato:'Confermato',rifiutato:'Rifiutato',a_r:'A&R',scrittura:'Scrittura',registrazione:'Registrazione',revisione:'Revisione',etichetta:'Etichetta',artista:'Artista',publisher:'Publisher',management:'Management',altro:'Altro'};
const label=v=>friendly[v]||text(v).replaceAll('_',' ');
let client=null,data=null,busy=false,shownArchived=false;
const LIMIT=10000,SIZE=500;
function status(s,error=false){$('desk-status').textContent=s;$('desk-status').className='desk-status'+(error?' error':'');}
async function read(table,columns,order){
 const q=await client.from(table).select(columns,{count:'exact'}).order(order,{ascending:false}).range(0,SIZE-1);
 if(q.error)throw Error(table+': '+q.error.message);
 if(q.count===null||q.count>LIMIT)throw Error(table+': conteggio non verificabile o oltre il limite');
 const items=[...(q.data||[])];
 while(items.length<q.count){
  const r=await client.from(table).select(columns).order(order,{ascending:false}).range(items.length,Math.min(items.length+SIZE-1,q.count-1));
  if(r.error||!r.data?.length)throw Error(table+': lettura incompleta');
  items.push(...r.data);
 }
 if(items.length!==q.count)throw Error(table+': risultati incompleti; operazioni bloccate');
 return items;
}
async function refresh(){
 if(busy)return;busy=true;$('desk-content').hidden=true;
 try{
  client=client||window.KYV?.createSupabaseClient?.();
  if(!client)throw Error('Sessione autenticata non disponibile');
  status('Lettura completa delle sessioni, dei pitch e dei progetti…');
  const [sessions,links,pitches,events,projects]=await Promise.all([
   read('KYV_SESSIONI','id,data_sessione,titolo,tipo,partecipanti,luogo,durata_minuti,esito,note,archiviata,created_at,updated_at','data_sessione'),
   read('KYV_SESSIONI_PROGETTI','id,id_sessione,id_progetto,note,annullato,created_at','created_at'),
   read('KYV_PIAZZAMENTI','id,id_progetto,destinatario,tipo_destinatario,referente,data_invio,stato,prossimo_followup,data_risposta,note,archiviata,created_at,updated_at','created_at'),
   read('KYV_PIAZZAMENTI_EVENTI','id,id_piazzamento,tipo,nota,created_at','created_at'),
   read('PROGETTI','ID,TITOLO,ARTISTA,STATO,FEE,Data_Pubblicazione','ID')
  ]);
  data={sessions,links,pitches,events,projects};
  fillProjects();render();$('desk-content').hidden=false;
  status('Dati aggiornati. Sessioni e piazzamenti restano distinti dalle fatture e dai diritti incassati.');
 }catch(e){data=null;status('Impossibile verificare l’archivio: '+e.message,true);}
 finally{busy=false;}
}
const projectName=id=>{const p=data?.projects.find(p=>text(p.ID)===text(id));return p?(p.TITOLO||'Senza titolo')+' · '+(p.ARTISTA||'—')+' (#'+p.ID+')':'Progetto #'+id;};
const sessionById=id=>data.sessions.find(x=>x.id===id);
const pitchById=id=>data.pitches.find(x=>x.id===id);
function options(list,current){return list.map(x=>'<option value="'+H(x)+'"'+(current===x?' selected':'')+'>'+H(label(x))+'</option>').join('');}
function fillProjects(){
 const list=data.projects.slice().sort((a,b)=>projectName(a.ID).localeCompare(projectName(b.ID),'it'));
 for(const id of ['session-link-project','pitch-project']){
  const box=$(id),old=box.value;
  box.innerHTML='<option value="">Seleziona un progetto</option>'+list.map(p=>'<option value="'+p.ID+'">'+H(projectName(p.ID))+'</option>').join('');
  if(Array.from(box.options).some(o=>o.value===old))box.value=old;
 }
}
function render(){
 if(!data)return;
 const now=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Rome'});
 const rep=window.KYV_CREATIVE_DESK_V244.analyze(data,now);
 const cards=[
  ['Sessioni registrate',rep.sessions,'Solo sessioni inserite nel nuovo archivio'],
  ['Brani collegati',rep.projectsWithSession,'Progetti distinti; una sessione può contenere più brani'],
  ['Proposte attive',rep.pitches,'Invii e opportunità registrati manualmente'],
  ['Follow-up scaduti',rep.overdue.length,'Non prova mancata risposta; verifica prima di sollecitare'],
  ['Ore documentate',rep.datedDurationSessions?String((rep.durationMin/60).toFixed(1)).replace('.',','):'Non disponibili',rep.datedDurationSessions+' sessioni con durata indicata'],
  ['Conversione delle sessioni','Non calcolabile','Non ricostruibile dal numero di schede progetto']
 ];
 $('desk-summary').innerHTML=cards.map(x=>'<article class="desk-stat"><small>'+H(x[0])+'</small><strong>'+H(x[1])+'</strong><small>'+H(x[2])+'</small></article>').join('');
 $('desk-method').textContent=rep.caveat+' '+rep.feeCaveat;
 const sessions=data.sessions.filter(s=>shownArchived||!s.archiviata);
 const search=text($('desk-search').value).toLocaleLowerCase('it-IT');
 const filtered=sessions.filter(s=>!search||(s.titolo+' '+s.partecipanti+' '+s.luogo).toLocaleLowerCase('it-IT').includes(search));
 $('session-rows').innerHTML=filtered.map(s=>{
  const projectLinks=data.links.filter(l=>l.id_sessione===s.id&&!l.annullato);
  const names=projectLinks.map(l=>'<a href="scheda_progetto.html?id='+encodeURIComponent(l.id_progetto)+'">'+H(projectName(l.id_progetto))+'</a>').join(' · ');
  const pending=data.links.filter(l=>l.id_sessione===s.id&&!l.annullato);
  const actions='<div class="desk-actions"><button type="button" data-edit-session="'+H(s.id)+'">Modifica</button><button type="button" data-link-session="'+H(s.id)+'">Collega brano</button><button type="button" data-archive-session="'+H(s.id)+'">'+(s.archiviata?'Ripristina':'Archivia')+'</button></div>';
  return '<article class="desk-entry"><div class="desk-entry-body"><b>'+H(s.titolo)+'</b><small>'+H(s.data_sessione)+' · '+H(label(s.tipo))+' · '+H(label(s.esito))+(s.archiviata?' · Archiviata':'')+'</small><small>'+H(s.partecipanti||'Partecipanti non indicati')+(s.durata_minuti?' · '+s.durata_minuti+' min':' · Durata non registrata')+'</small><small>'+H(s.luogo||'')+'</small><div class="desk-links">'+(names||'<span>Non collegata a un progetto</span>')+'</div><div class="desk-actions">'+pending.map(l=>'<button type="button" class="quiet" data-unlink-id="'+H(l.id)+'" title="Scollega senza cancellare il progetto">Scollega #'+H(l.id_progetto)+'</button>').join('')+'</div></div>'+actions+'</article>';
 }).join('')||'<p class="desk-empty">Nessuna sessione trovata. Inseriscila soltanto se è stata effettivamente svolta.</p>';
 const pitches=data.pitches.filter(p=>shownArchived||!p.archiviata).filter(p=>!search||[p.destinatario,p.referente,projectName(p.id_progetto)].join(' ').toLocaleLowerCase('it-IT').includes(search));
 $('pitch-rows').innerHTML=pitches.map(p=>{
  const history=data.events.filter(e=>e.id_piazzamento===p.id).slice(0,5);
  const alert=day(p.prossimo_followup)&&p.prossimo_followup<now&&!['rifiutato','confermato','accantonato'].includes(p.stato);
  const actions='<div class="desk-actions"><button type="button" data-edit-pitch="'+H(p.id)+'">Modifica</button><button type="button" data-note-pitch="'+H(p.id)+'">Aggiungi nota</button><button type="button" data-archive-pitch="'+H(p.id)+'">'+(p.archiviata?'Ripristina':'Archivia')+'</button></div>';
  return '<article class="desk-entry"><div class="desk-entry-body"><b>'+H(p.destinatario)+'</b><small>'+H(label(p.tipo_destinatario))+' · '+H(label(p.stato))+(p.archiviata?' · Archiviato':'')+'</small><a href="scheda_progetto.html?id='+encodeURIComponent(p.id_progetto)+'">'+H(projectName(p.id_progetto))+'</a><small>Invio: '+H(p.data_invio||'non indicato')+' · Follow-up: '+H(p.prossimo_followup||'non fissato')+(alert?' · DA VERIFICARE':'')+'</small>'+(p.referente?'<small>Referente: '+H(p.referente)+'</small>':'')+'<small>'+H(p.note||'')+'</small><details><summary>Storico ('+data.events.filter(e=>e.id_piazzamento===p.id).length+')</summary>'+history.map(e=>'<p>'+H(e.created_at.slice(0,10))+' · '+H(e.nota)+'</p>').join('')+'</details></div>'+actions+'</article>';
 }).join('')||'<p class="desk-empty">Nessun piazzamento trovato. Una proposta è un evento commerciale, non una pubblicazione.</p>';
 $('desk-followups').innerHTML=rep.overdue.slice(0,12).map(p=>'<li><b>'+H(p.destinatario)+'</b> · '+H(projectName(p.id_progetto))+' · '+H(p.prossimo_followup)+'</li>').join('')||'<li>Nessun follow-up scaduto nel nuovo archivio.</li>';
 $('desk-session-count').textContent=filtered.length+' sessioni mostrate';
 $('desk-pitch-count').textContent=pitches.length+' piazzamenti mostrati';
}
function resetSession(){
 $('session-form').reset();$('session-id').value='';
 $('session-date').value=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Rome'});
 $('session-submit').textContent='Registra sessione';
}
function resetPitch(){
 $('pitch-form').reset();$('pitch-id').value='';$('pitch-submit').textContent='Registra proposta';
}
function showTab(tab){
 for(const name of ['sessions','pitches']){
  $('desk-'+name).hidden=name!==tab;
  $('tab-'+name).setAttribute('aria-selected',String(name===tab));
 }
}
function editSession(id){
 const s=sessionById(id);if(!s)return;
 $('session-id').value=s.id;
 for(const [field,value] of [['title',s.titolo],['date',s.data_sessione],['type',s.tipo],['people',s.partecipanti],['place',s.luogo],['minutes',s.durata_minuti],['outcome',s.esito],['notes',s.note]])$('session-'+field).value=value??'';
 $('session-submit').textContent='Salva modifiche';
 showTab('sessions');$('session-form').scrollIntoView({block:'start',behavior:'smooth'});
}
function editPitch(id){
 const p=pitchById(id);if(!p)return;
 $('pitch-id').value=p.id;
 for(const [field,value] of [['project',p.id_progetto],['recipient',p.destinatario],['recipient-type',p.tipo_destinatario],['contact',p.referente],['sent',p.data_invio],['stage',p.stato],['followup',p.prossimo_followup],['response',p.data_risposta],['notes',p.note]])$('pitch-'+field).value=value??'';
 $('pitch-submit').textContent='Salva modifiche';
 showTab('pitches');$('pitch-form').scrollIntoView({block:'start',behavior:'smooth'});
}
function validateString(v,min,max,label){const t=text(v);if(t.length<min||t.length>max)throw Error(label+': lunghezza non valida');return t;}
function sessionPayload(){
 const dateValue=$('session-date').value;if(!day(dateValue))throw Error('Inserisci la data reale della sessione.');
 const minutes=text($('session-minutes').value);
 if(minutes&&(!/^\d+$/.test(minutes)||Number(minutes)<1||Number(minutes)>1440))throw Error('Durata: indica minuti compresi tra 1 e 1440.');
 const tipo=$('session-type').value,esito=$('session-outcome').value;
 if(!sessionTypes.includes(tipo)||!sessionStates.includes(esito))throw Error('Tipo o esito non valido.');
 return {titolo:validateString($('session-title').value,2,180,'Titolo'),data_sessione:dateValue,tipo,esito,
  partecipanti:text($('session-people').value).slice(0,1000)||null,
  luogo:text($('session-place').value).slice(0,200)||null,
  durata_minuti:minutes?Number(minutes):null,note:text($('session-notes').value).slice(0,4000)||null};
}
function pitchPayload(){
 const project=$('pitch-project').value;
 if(!data.projects.some(p=>text(p.ID)===project))throw Error('Seleziona un progetto realmente presente nel tuo archivio.');
 const type=$('pitch-recipient-type').value,stage=$('pitch-stage').value;
 if(!recipients.includes(type)||!pitchStates.includes(stage))throw Error('Stato o tipo destinatario non valido.');
 const out={id_progetto:Number(project),destinatario:validateString($('pitch-recipient').value,2,200,'Destinatario'),
   tipo_destinatario:type,stato:stage,referente:text($('pitch-contact').value).slice(0,200)||null,
   note:text($('pitch-notes').value).slice(0,4000)||null};
 for(const [key,input] of [['data_invio','pitch-sent'],['prossimo_followup','pitch-followup'],['data_risposta','pitch-response']]){
  const v=$(input).value;if(v&&!day(v))throw Error('Data non valida: '+key);out[key]=v||null;
 }
 return out;
}
async function mutate(task,refreshAfter=true){
 if(busy||!data)return;busy=true;
 try{
  status('Salvataggio in corso…');
  await task();
  busy=false;
  if(refreshAfter)await refresh();
 }catch(e){status('Operazione non completata: '+e.message,true);busy=false;}
}
async function save(table,payload,id){
 let q=client.from(table);
 if(id)q=q.update(payload).eq('id',id);
 else q=q.insert(payload);
 const r=await q.select('id').single();
 if(r.error||!r.data?.id)throw Error(r.error?.message||'Salvataggio non confermato');
 return r.data.id;
}
async function saveSession(){
 const id=$('session-id').value,payload=sessionPayload();
 await save('KYV_SESSIONI',payload,id);
 resetSession();
}
async function savePitch(){
 const id=$('pitch-id').value,payload=pitchPayload();
 await save('KYV_PIAZZAMENTI',payload,id);
 resetPitch();
}
async function linkProject(){
 const s=$('session-link-id').value,p=$('session-link-project').value;
 if(!sessionById(s)||!data.projects.some(x=>text(x.ID)===p))throw Error('Seleziona sessione e progetto.');
 const record=data.links.find(l=>l.id_sessione===s&&text(l.id_progetto)===p);
 if(record&&!record.annullato)throw Error('Progetto già collegato alla sessione.');
 if(record){
  await save('KYV_SESSIONI_PROGETTI',{annullato:false},record.id);
 }else await save('KYV_SESSIONI_PROGETTI',{id_sessione:s,id_progetto:Number(p)},null);
 $('session-link-id').value='';$('session-link-project').value='';
 $('desk-link-dialog').hidden=true;
}
async function unlink(id){
 const x=data.links.find(x=>x.id===id);if(!x||x.annullato)return;
 if(!confirm('Scollegare questo progetto dalla sessione? I due record rimarranno archiviati.'))return;
 await save('KYV_SESSIONI_PROGETTI',{annullato:true},id);
}
async function archive(table,id,archived){
 if(!confirm(archived?'Ripristinare questo elemento?':'Archiviare questo elemento senza cancellarlo?'))return;
 await save(table,{archiviata:!archived},id);
}
async function notePitch(id){
 const p=pitchById(id);if(!p)return;
 const answer=prompt('Nota di follow-up per '+p.destinatario+' (2–2000 caratteri):','');
 if(answer===null)return;const nota=validateString(answer,2,2000,'Nota');
 const r=await client.from('KYV_PIAZZAMENTI_EVENTI').insert({id_piazzamento:id,tipo:'nota',nota}).select('id').single();
 if(r.error||!r.data?.id)throw Error(r.error?.message||'Nota non registrata');
}
function bind(){
 $('desk-refresh').addEventListener('click',refresh);
 $('tab-sessions').addEventListener('click',()=>showTab('sessions'));
 $('tab-pitches').addEventListener('click',()=>showTab('pitches'));
 $('desk-search').addEventListener('input',render);
 $('desk-archived').addEventListener('change',e=>{shownArchived=e.target.checked;render();});
 $('session-form').addEventListener('submit',e=>{e.preventDefault();mutate(saveSession);});
 $('pitch-form').addEventListener('submit',e=>{e.preventDefault();mutate(savePitch);});
 $('session-reset').addEventListener('click',resetSession);
 $('pitch-reset').addEventListener('click',resetPitch);
 $('session-link-form').addEventListener('submit',e=>{e.preventDefault();mutate(linkProject);});
 $('desk-link-cancel').addEventListener('click',()=>{$('desk-link-dialog').hidden=true;});
 $('session-rows').addEventListener('click',e=>{
  const b=e.target.closest('button[data-edit-session],button[data-link-session],button[data-archive-session],button[data-unlink-id]');if(!b)return;
  if(b.dataset.editSession)editSession(b.dataset.editSession);
  if(b.dataset.linkSession){$('session-link-id').value=b.dataset.linkSession;$('desk-link-dialog').hidden=false;$('session-link-project').focus();}
  if(b.dataset.archiveSession){const s=sessionById(b.dataset.archiveSession);if(s)mutate(()=>archive('KYV_SESSIONI',s.id,s.archiviata));}
  if(b.dataset.unlinkId)mutate(()=>unlink(b.dataset.unlinkId));
 });
 $('pitch-rows').addEventListener('click',e=>{
  const b=e.target.closest('button[data-edit-pitch],button[data-archive-pitch],button[data-note-pitch]');if(!b)return;
  if(b.dataset.editPitch)editPitch(b.dataset.editPitch);
  if(b.dataset.archivePitch){const p=pitchById(b.dataset.archivePitch);if(p)mutate(()=>archive('KYV_PIAZZAMENTI',p.id,p.archiviata));}
  if(b.dataset.notePitch)mutate(()=>notePitch(b.dataset.notePitch));
 });
 resetSession();
 const q=new URLSearchParams(location.search).get('tab');
 showTab(q==='pitches'?'pitches':'sessions');
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
