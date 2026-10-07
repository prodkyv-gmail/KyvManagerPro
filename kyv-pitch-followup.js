/* KYV Pitch & Follow-up — pipeline invii e solleciti, senza nuove tabelle. */
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'').toLowerCase();
if(!['scheda_progetto.html','kyv_calendar.html'].includes(page))return;

const FOLLOWUP_DAYS=5;
let db=null;
let pitchRows=[];
let projectVersions=[];
let agendaProjects=[];
let agendaRows=[];
let lastProjectId='';
let projectLoading=false;
let projectObserver=null;
let agendaObserver=null;
let refreshTimer=null;

const statusMeta={
  waiting:{label:'In attesa',className:'kyv-pitch-waiting',icon:'clock-3'},
  due:{label:'Da sollecitare',className:'kyv-pitch-due',icon:'alarm-clock'},
  revision:{label:'Da revisionare',className:'kyv-pitch-feedback',icon:'message-square-text'},
  interested:{label:'Interessato',className:'kyv-pitch-confirmed',icon:'circle-check-big'},
  closed:{label:'Chiuso / non interessato',className:'kyv-pitch-no',icon:'circle-x'}
};

function text(value){return String(value??'').trim();}
function H(value){
  if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function toast(message,type='success'){if(window.KYV&&typeof KYV.showToast==='function')KYV.showToast(message,type);}
function currentProjectId(){const p=new URLSearchParams(location.search);return text(p.get('id')||p.get('projectId')||p.get('project'));}
function formatDate(value){
  if(!value)return'';
  if(window.KYV&&typeof KYV.formatDate==='function')return KYV.formatDate(value,'');
  const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('it-IT');
}
function timeValue(value){const n=new Date(value||0).getTime();return Number.isFinite(n)?n:0;}
function activityDate(row){return row?.Data_Conferma||row?.Data_Invio||row?.updated_at||row?.created_at||'';}
function daysSince(value){const t=timeValue(value);if(!t)return 0;return Math.max(0,Math.floor((Date.now()-t)/86400000));}
function statusKey(row){
  const raw=text(row?.Stato).toLowerCase();
  if(/interessat|confermat|approvat|accettat|scelt|preso/.test(raw))return'interested';
  if(/chius|(^|\s|\/)(no|pass)(\s|$)|rifiut|declin|non interess|scartat/.test(raw))return'closed';
  if(/da revisionare|feedback|rispost|revision|comment/.test(raw))return'revision';
  if(/da sollecitare|sollecito dovuto|follow-up dovuto/.test(raw))return'due';
  return daysSince(activityDate(row))>=FOLLOWUP_DAYS?'due':'waiting';
}
function statusChip(row){const key=statusKey(row),meta=statusMeta[key];return `<span class="kyv-pitch-status ${meta.className}"><i data-lucide="${meta.icon}" class="w-3 h-3"></i>${meta.label}</span>`;}
function projectLabel(p){return [text(p?.ARTISTA)||'Artista non indicato',text(p?.TITOLO)||'Senza titolo'].join(' · ');}
function rowProjectId(row){return text(row?.ID_PROGETTO||row?.id_progetto||row?.PROGETTO_ID);}
function rowSort(a,b){return (timeValue(activityDate(b))||Number(b?.ID_INVIO||0))-(timeValue(activityDate(a))||Number(a?.ID_INVIO||0));}
function dedupeRows(rows){const map=new Map();(rows||[]).forEach((row,index)=>{const key=text(row.ID_INVIO)||`row-${index}`;if(!map.has(key)||rowSort(row,map.get(key))<0)map.set(key,row);});return [...map.values()].sort(rowSort);}
function versionDate(row){return timeValue(row?.DATA_FILE||row?.Data_Caricamento||row?.updated_at||row?.created_at)||Number(row?.ID_VERSIONE||row?.ID_FILE||0);}
function versionName(row){return text(row?.NOME_FILE||row?.Nome_File||row?.TITOLO||row?.Titolo)||'Versione audio';}
function versionKey(row){
  if(row?._versionKey)return text(row._versionKey);
  if(row?.ID_VERSIONE!==undefined&&row?.ID_VERSIONE!==null)return`v:${row.ID_VERSIONE}`;
  if(row?.ID_FILE!==undefined&&row?.ID_FILE!==null)return`f:${row.ID_FILE}`;
  return'';
}
function latestFile(){return [...projectVersions].sort((a,b)=>versionDate(b)-versionDate(a))[0]||null;}
function versionMarker(row){if(!row)return'';const source=row.ID_VERSIONE?`AUDIO_VERSIONI #${row.ID_VERSIONE}`:`DROPBOX_AUDIO_FILES #${row.ID_FILE}`;return`Versione inviata: [${source}] ${versionName(row)}`;}
function exactVersion(row){
  const marker=text(row?.Messaggio).match(/Versione inviata:\s*(?:\[[^\]]+\]\s*)?([^\n]+)/i);if(marker)return marker[1].trim();
  const match=projectVersions.find(item=>String(item.ID_FILE||item?.METADATI?.id_legacy||'')===String(row?.ID_FILE||''));return match?versionName(match):(row?.ID_FILE?`File #${row.ID_FILE}`:'Versione non indicata');
}

function injectStyles(){
  if(document.getElementById('kyv-pitch-followup-style'))return;
  const style=document.createElement('style');style.id='kyv-pitch-followup-style';style.textContent=`
#kyv-pitch-followup-project{border:1px solid rgba(169,218,255,.22);border-radius:1rem;padding:1rem;margin-bottom:1rem;background:linear-gradient(135deg,rgba(169,218,255,.08),rgba(15,17,26,.58))}.kyv-pitch-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.kyv-pitch-head h3{font-size:1rem;font-weight:900;color:#fff}.kyv-pitch-head p{font-size:.7rem;color:#94a3b8;margin-top:.25rem;max-width:48rem}.kyv-pitch-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.45rem;margin-top:.8rem}.kyv-pitch-summary div{border:1px solid rgba(255,255,255,.08);border-radius:.72rem;padding:.55rem .6rem;background:rgba(255,255,255,.025)}.kyv-pitch-summary strong{display:block;color:#fff;font-size:.95rem}.kyv-pitch-summary span{display:block;color:#94a3b8;font-size:.57rem;margin-top:.08rem}.kyv-pitch-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;margin-top:.8rem}.kyv-pitch-card{border:1px solid rgba(255,255,255,.08);border-radius:.85rem;padding:.75rem;background:rgba(255,255,255,.025)}.kyv-pitch-card h4{color:#fff;font-size:.78rem;font-weight:900}.kyv-pitch-card p{color:#94a3b8;font-size:.64rem;margin-top:.2rem;line-height:1.4}.kyv-pitch-status{display:inline-flex;align-items:center;gap:.28rem;padding:.25rem .45rem;border-radius:999px;border:1px solid rgba(255,255,255,.10);font-size:.57rem;font-weight:900;white-space:nowrap}.kyv-pitch-waiting{color:#dbeafe;background:rgba(59,130,246,.09);border-color:rgba(59,130,246,.22)}.kyv-pitch-due{color:#fed7aa;background:rgba(249,115,22,.10);border-color:rgba(249,115,22,.28)}.kyv-pitch-feedback{color:#ddd6fe;background:rgba(139,92,246,.10);border-color:rgba(139,92,246,.28)}.kyv-pitch-confirmed{color:#bbf7d0;background:rgba(34,197,94,.09);border-color:rgba(34,197,94,.24)}.kyv-pitch-no{color:#fecdd3;background:rgba(244,63,94,.09);border-color:rgba(244,63,94,.24)}.kyv-pitch-actions{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.65rem}.kyv-pitch-btn{display:inline-flex;align-items:center;justify-content:center;gap:.28rem;padding:.42rem .55rem;border-radius:.6rem;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);color:#e5e7eb;font-size:.61rem;font-weight:850}.kyv-pitch-btn:hover{background:rgba(255,255,255,.09)}.kyv-pitch-btn.primary{border-color:rgba(56,189,248,.28);background:rgba(56,189,248,.09);color:#e0f2fe}.kyv-pitch-btn.good{border-color:rgba(34,197,94,.25);background:rgba(34,197,94,.08);color:#dcfce7}.kyv-pitch-btn.bad{border-color:rgba(244,63,94,.22);background:rgba(244,63,94,.07);color:#ffe4e6}.kyv-pitch-form{display:none;margin-top:.8rem;padding:.8rem;border:1px solid rgba(255,255,255,.09);border-radius:.85rem;background:rgba(15,17,26,.55)}.kyv-pitch-form.open{display:block}.kyv-pitch-form-grid{display:grid;grid-template-columns:1.15fr .85fr .85fr 1fr;gap:.5rem}.kyv-pitch-input{width:100%;border:1px solid rgba(255,255,255,.10);border-radius:.65rem;background:rgba(15,17,26,.8);color:#fff;padding:.55rem .62rem;font-size:.68rem;outline:none}.kyv-pitch-input:focus{border-color:rgba(56,189,248,.5);box-shadow:0 0 0 3px rgba(56,189,248,.07)}.kyv-pitch-label{display:block;font-size:.54rem;text-transform:uppercase;letter-spacing:.08em;font-weight:900;color:#94a3b8;margin-bottom:.25rem}.kyv-pitch-feedback-editor{display:none;margin-top:.6rem}.kyv-pitch-feedback-editor.open{display:block}.kyv-pitch-feedback-editor textarea{min-height:76px;resize:vertical}.kyv-pitch-empty{grid-column:1/-1;text-align:center;border:1px dashed rgba(255,255,255,.10);border-radius:.85rem;padding:1.2rem;color:#94a3b8;font-size:.7rem}#kyv-pitch-agenda{margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,.10)}.kyv-pitch-agenda-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin-top:.65rem}.kyv-pitch-agenda-card{border:1px solid rgba(249,115,22,.20);border-radius:.85rem;padding:.75rem;background:rgba(249,115,22,.05)}.kyv-pitch-agenda-card h5{font-size:.74rem;font-weight:900;color:#fff}.kyv-pitch-agenda-card p{font-size:.62rem;color:#94a3b8;margin-top:.2rem}@media(max-width:900px){.kyv-pitch-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.kyv-pitch-grid,.kyv-pitch-agenda-grid{grid-template-columns:1fr}.kyv-pitch-form-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.kyv-pitch-head{flex-direction:column}.kyv-pitch-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.kyv-pitch-form-grid{grid-template-columns:1fr}}
`;document.head.appendChild(style);
}

async function loadProjectRows(projectId){
  const c=client();if(!c||!projectId)return{rows:[],files:[]};
  let direct=[],byFile=[],files=[],versions=[];
  try{
    const versionResult=await c.from('AUDIO_VERSIONI').select('*').eq('ID_PROGETTO',projectId).order('DATA_FILE',{ascending:false}).limit(150);
    if(!versionResult.error)versions=(versionResult.data||[]).map(row=>({...row,_versionKey:`v:${row.ID_VERSIONE}`}));
  }catch(_){}
  try{
    const fileResult=await c.from('DROPBOX_AUDIO_FILES').select('*').eq('ID_PROGETTO',projectId).order('ID_FILE',{ascending:false}).limit(100);
    if(!fileResult.error)files=(fileResult.data||[]).map(row=>({...row,_versionKey:`f:${row.ID_FILE}`}));
  }catch(_){}
  try{
    const directResult=await c.from('INVII_AUDIO').select('*').eq('ID_PROGETTO',projectId).order('ID_INVIO',{ascending:false}).limit(250);
    if(!directResult.error)direct=directResult.data||[];
  }catch(_){}
  const ids=files.map(f=>f.ID_FILE).filter(v=>v!==null&&v!==undefined&&String(v)!=='');
  if(ids.length){
    try{
      const fileInvii=await c.from('INVII_AUDIO').select('*').in('ID_FILE',ids).order('ID_INVIO',{ascending:false}).limit(250);
      if(!fileInvii.error)byFile=fileInvii.data||[];
    }catch(_){}
  }
  const merged=[...versions,...files].filter((row,index,all)=>all.findIndex(candidate=>text(candidate.LINK_FILE||candidate.Link_Dropbox||versionKey(candidate))===text(row.LINK_FILE||row.Link_Dropbox||versionKey(row)))===index).sort((a,b)=>versionDate(b)-versionDate(a));
  return{rows:dedupeRows([...direct,...byFile]),files:merged};
}

function summaryCounts(){const counts={waiting:0,due:0,revision:0,interested:0,closed:0};pitchRows.forEach(row=>{counts[statusKey(row)]++;});return counts;}
function renderProjectPanel(projectId){
  const host=document.getElementById('kyv-project-v2-pitch')||document.getElementById('tab-audio');if(!host||!projectId)return false;
  let panel=document.getElementById('kyv-pitch-followup-project');
  if(panel&&panel.dataset.projectId!==String(projectId)){panel.remove();panel=null;}
  if(panel&&panel.parentElement!==host)host.prepend(panel);
  if(!panel){panel=document.createElement('section');panel.id='kyv-pitch-followup-project';panel.dataset.projectId=String(projectId);host.insertBefore(panel,host.firstChild);}
  const counts=summaryCounts(),latest=latestFile();
  panel.innerHTML=`
    <div class="kyv-pitch-head"><div><p class="text-[9px] uppercase tracking-[.14em] font-black text-sky-200">INVII_AUDIO</p><h3 class="mt-1">Invii & Follow-up</h3><p>Versione, destinatario ed esito restano nello stesso flusso. Dopo ${FOLLOWUP_DAYS} giorni senza attività compare “Da sollecitare”.</p></div><button type="button" class="kyv-pitch-btn primary" data-pitch-new><i data-lucide="send" class="w-3.5 h-3.5"></i>Nuovo invio</button></div>
    <div class="kyv-pitch-summary">
      <div><strong>${counts.waiting}</strong><span>In attesa</span></div><div><strong>${counts.due}</strong><span>Da sollecitare</span></div><div><strong>${counts.revision}</strong><span>Da revisionare</span></div><div><strong>${counts.interested}</strong><span>Interessati</span></div><div><strong>${counts.closed}</strong><span>Chiusi</span></div>
    </div>
    <form class="kyv-pitch-form" data-pitch-form>
      <div class="kyv-pitch-form-grid">
        <label><span class="kyv-pitch-label">Destinatario</span><input class="kyv-pitch-input" name="recipient" required placeholder="Artista, manager, A&R..."></label>
        <label><span class="kyv-pitch-label">Tipo</span><select class="kyv-pitch-input" name="recipientType"><option>Artista</option><option>Manager</option><option>Label</option><option>Editore</option><option>A&R</option><option>Autore</option><option>Altro</option></select></label>
        <label><span class="kyv-pitch-label">Canale</span><select class="kyv-pitch-input" name="channel"><option>WhatsApp</option><option>Email</option><option>Telegram</option><option>iMessage</option><option>DM / altro</option></select></label>
        <label><span class="kyv-pitch-label">Contesto</span><select class="kyv-pitch-input" name="context"><option>Pitch brano</option><option>Ascolto demo</option><option>Invio a label / editore</option><option>Revisione</option><option>Approvazione finale</option><option>Altro</option></select></label>
      </div>
      <label class="block mt-2"><span class="kyv-pitch-label">Versione inviata</span><select class="kyv-pitch-input" name="versionKey">${projectVersions.length?projectVersions.map((row,index)=>`<option value="${H(versionKey(row))}">${index===0?'Ultima · ':''}${H(versionName(row))}</option>`).join(''):'<option value="">Nessuna versione collegata</option>'}</select></label>
      <label class="block mt-2"><span class="kyv-pitch-label">Nota opzionale</span><textarea class="kyv-pitch-input" name="note" rows="2" placeholder="Cosa stai aspettando"></textarea></label>
      <div class="flex flex-wrap items-center justify-between gap-2 mt-2"><span class="text-[10px] text-kyv-text">${latest?`Versione proposta: ${H(versionName(latest))}.`:'L’invio resta collegato al progetto; aggiungi una versione per tracciare il file esatto.'}</span><div class="flex gap-2"><button type="button" class="kyv-pitch-btn" data-pitch-cancel>Annulla</button><button type="submit" class="kyv-pitch-btn primary" data-pitch-submit><i data-lucide="save" class="w-3.5 h-3.5"></i>Registra invio</button></div></div>
    </form>
    <div class="kyv-pitch-grid">${pitchRows.length?pitchRows.map(renderPitchCard).join(''):'<div class="kyv-pitch-empty">Nessun pitch registrato. Usa “Nuovo invio” quando mandi il brano a un artista, manager, A&R, label o editore.</div>'}</div>`;
  wireProjectPanel(panel,projectId);
  if(window.lucide)lucide.createIcons({root:panel});
  return true;
}

function renderPitchCard(row){
  const key=statusKey(row),age=daysSince(activityDate(row)),feedback=text(row.Conferma_Ricezione),last=formatDate(activityDate(row))||'—',version=exactVersion(row);
  const dueText=key==='due'?`${age}g senza attività`:`Ultima attività: ${last}`;
  return `<article class="kyv-pitch-card" data-pitch-id="${H(row.ID_INVIO)}"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><p class="text-[9px] uppercase tracking-wider font-black text-sky-200">Invio #${H(row.ID_INVIO)}</p><h4 class="mt-1 break-words">${H(row.Destinatario||'Destinatario non indicato')}</h4><p>${H([row.Tipo_Destinatario,row.Canale,row.Contesto].filter(Boolean).join(' · ')||'Pitch')}</p><p class="text-blue-200"><strong>Versione:</strong> ${H(version)}</p></div>${statusChip(row)}</div><p class="mt-2">${H(dueText)}${row.Data_Invio?` · inviato ${H(formatDate(row.Data_Invio))}`:''}</p>${feedback?`<p class="mt-2 text-violet-200"><strong>Nota:</strong> ${H(feedback)}</p>`:''}<div class="kyv-pitch-actions">${key==='due'?'<button type="button" class="kyv-pitch-btn primary" data-pitch-followup><i data-lucide="send" class="w-3 h-3"></i>Sollecitato</button>':''}<button type="button" class="kyv-pitch-btn" data-pitch-wait><i data-lucide="clock-3" class="w-3 h-3"></i>In attesa</button><button type="button" class="kyv-pitch-btn" data-pitch-revision><i data-lucide="message-square-text" class="w-3 h-3"></i>Da revisionare</button><button type="button" class="kyv-pitch-btn good" data-pitch-interest><i data-lucide="circle-check-big" class="w-3 h-3"></i>Interessato</button><button type="button" class="kyv-pitch-btn bad" data-pitch-close><i data-lucide="circle-x" class="w-3 h-3"></i>Chiudi</button></div><div class="kyv-pitch-feedback-editor" data-feedback-editor><textarea class="kyv-pitch-input" rows="3" placeholder="Revisione o feedback ricevuto...">${H(feedback.replace(/^Feedback:\s*/i,''))}</textarea><div class="kyv-pitch-actions justify-end"><button type="button" class="kyv-pitch-btn" data-feedback-cancel>Annulla</button><button type="button" class="kyv-pitch-btn primary" data-feedback-save>Salva revisione</button></div></div></article>`;
}

function wireProjectPanel(panel,projectId){
  const form=panel.querySelector('[data-pitch-form]');
  panel.querySelector('[data-pitch-new]')?.addEventListener('click',()=>{form?.classList.add('open');setTimeout(()=>form?.querySelector('[name="recipient"]')?.focus(),0);});
  panel.querySelector('[data-pitch-cancel]')?.addEventListener('click',()=>form?.classList.remove('open'));
  form?.addEventListener('submit',event=>{event.preventDefault();createPitch(projectId,form);});
  panel.querySelectorAll('[data-pitch-id]').forEach(card=>{
    const id=card.dataset.pitchId;
    card.querySelector('[data-pitch-followup]')?.addEventListener('click',event=>markFollowup(id,event.currentTarget));
    card.querySelector('[data-pitch-wait]')?.addEventListener('click',event=>setPitchStatus(id,'In attesa',event.currentTarget));
    card.querySelector('[data-pitch-interest]')?.addEventListener('click',event=>setPitchStatus(id,'Interessato',event.currentTarget));
    card.querySelector('[data-pitch-close]')?.addEventListener('click',event=>setPitchStatus(id,'Chiuso / non interessato',event.currentTarget));
    const editor=card.querySelector('[data-feedback-editor]');
    card.querySelector('[data-pitch-revision]')?.addEventListener('click',()=>{editor?.classList.add('open');setTimeout(()=>editor?.querySelector('textarea')?.focus(),0);});
    card.querySelector('[data-feedback-cancel]')?.addEventListener('click',()=>editor?.classList.remove('open'));
    card.querySelector('[data-feedback-save]')?.addEventListener('click',event=>saveFeedback(id,editor?.querySelector('textarea')?.value||'',event.currentTarget));
  });
}

async function createPitch(projectId,form){
  const c=client();if(!c)return;const submit=form.querySelector('[data-pitch-submit]');
  const data=new FormData(form),recipient=text(data.get('recipient'));if(!recipient)return;
  if(submit){submit.disabled=true;submit.textContent='Salvo…';}
  const selected=projectVersions.find(row=>versionKey(row)===text(data.get('versionKey')))||latestFile(),now=new Date().toISOString(),note=text(data.get('note'));
  const message=[versionMarker(selected),note].filter(Boolean).join('\n')||null;
  const payload={ID_PROGETTO:projectId,Destinatario:recipient,Tipo_Destinatario:text(data.get('recipientType'))||'Altro',Canale:text(data.get('channel'))||'Altro',Contesto:text(data.get('context'))||'Pitch brano',Messaggio:message,Stato:'In attesa',Data_Invio:now};
  const legacyId=selected?.ID_FILE||selected?.METADATI?.id_legacy;if(legacyId!==undefined&&legacyId!==null)payload.ID_FILE=legacyId;
  try{
    const {error}=await c.from('INVII_AUDIO').insert([payload]);if(error)throw error;
    toast('Invio registrato.');form.reset();form.classList.remove('open');await refreshProject(projectId,true);
  }catch(error){console.error('KYV Pitch: insert',error);toast('Errore registrazione invio.','error');}
  finally{if(submit){submit.disabled=false;submit.innerHTML='<i data-lucide="save" class="w-3.5 h-3.5"></i>Registra invio';if(window.lucide)lucide.createIcons({root:submit});}}
}

async function updatePitch(id,payload,button,message){
  const c=client();if(!c||!id)return false;if(button)button.disabled=true;
  try{const {error}=await c.from('INVII_AUDIO').update(payload).eq('ID_INVIO',id);if(error)throw error;toast(message||'Pitch aggiornato.');if(page==='scheda_progetto.html')await refreshProject(currentProjectId(),true);else await loadAgendaPitch();return true;}
  catch(error){console.error('KYV Pitch: update',error);toast('Errore aggiornamento pitch.','error');return false;}
  finally{if(button)button.disabled=false;}
}
function setPitchStatus(id,status,button){return updatePitch(id,{Stato:status,Data_Conferma:new Date().toISOString()},button,`Stato: ${status}.`);}
function markFollowup(id,button){return updatePitch(id,{Stato:'In attesa',Data_Conferma:new Date().toISOString()},button,'Sollecito registrato: riparte il conteggio.');}
function saveFeedback(id,note,button){const clean=text(note);if(!clean){toast('Scrivi la revisione richiesta.','warning');return;}return updatePitch(id,{Stato:'Da revisionare',Conferma_Ricezione:`Feedback: ${clean}`,Data_Conferma:new Date().toISOString()},button,'Revisione salvata.');}

function syncProjectView(projectId){
  try{
    if(typeof state!=='undefined'&&String(state?.currentView?.p?.ID)===String(projectId))state.currentView.matches.invii=[...pitchRows];
  }catch(_){}
  window.dispatchEvent(new CustomEvent('kyv:pitch-updated',{detail:{projectId}}));
}

async function refreshProject(projectId,force=false){
  projectId=text(projectId);if(!projectId||projectLoading)return;
  const panel=document.getElementById('kyv-pitch-followup-project');
  if(!force&&projectId===lastProjectId&&panel){renderProjectPanel(projectId);return;}
  if(!force&&projectId===lastProjectId&&!panel&&pitchRows.length>=0){renderProjectPanel(projectId);return;}
  projectLoading=true;
  try{const result=await loadProjectRows(projectId);pitchRows=result.rows;projectVersions=result.files;lastProjectId=projectId;syncProjectView(projectId);renderProjectPanel(projectId);}catch(error){console.warn('KYV Pitch: caricamento progetto non disponibile',error);}finally{projectLoading=false;}
}
function watchProjectPage(){
  injectStyles();
  const run=()=>{const id=currentProjectId();if(!id)return;if(id!==lastProjectId)refreshProject(id,true);else if(!document.getElementById('kyv-pitch-followup-project'))renderProjectPanel(id);};
  run();
  projectObserver=new MutationObserver(()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(run,80);});
  projectObserver.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>projectObserver?.disconnect(),120000);
  window.addEventListener('kyv:project-v2-ready',()=>refreshProject(currentProjectId(),true));
}

async function loadAgendaPitch(){
  const c=client();if(!c)return;
  try{
    const [pResult,iResult]=await Promise.all([c.from('PROGETTI').select('*').limit(1000),c.from('INVII_AUDIO').select('*').order('ID_INVIO',{ascending:false}).limit(1500)]);
    agendaProjects=pResult.error?[]:(pResult.data||[]);agendaRows=iResult.error?[]:(iResult.data||[]);renderAgendaPitch();
  }catch(error){console.warn('KYV Pitch Agenda: dati non disponibili',error);agendaProjects=[];agendaRows=[];renderAgendaPitch();}
}
function agendaDueRows(){
  const projectIds=new Set(agendaProjects.map(p=>String(p.ID)));
  return agendaRows.filter(row=>statusKey(row)==='due'&&rowProjectId(row)&&projectIds.has(String(rowProjectId(row)))).sort((a,b)=>timeValue(activityDate(a))-timeValue(activityDate(b)));
}
function agendaProject(id){return agendaProjects.find(p=>String(p.ID)===String(id))||null;}
function renderAgendaPitch(){
  const phase=document.getElementById('kyv-agenda-phase5');if(!phase)return false;
  let box=document.getElementById('kyv-pitch-agenda');if(!box){box=document.createElement('section');box.id='kyv-pitch-agenda';const anchor=document.getElementById('kyv-agenda-actions')?.parentElement;if(anchor)anchor.insertAdjacentElement('afterend',box);else phase.appendChild(box);}
  const due=agendaDueRows();
  box.innerHTML=`<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><p class="text-[9px] uppercase tracking-[.14em] font-black text-orange-200">Pitch & follow-up</p><h4 class="text-sm font-black text-white mt-1">Solleciti da non perdere</h4><p class="text-[10px] text-kyv-text mt-1">Compaiono qui dopo ${FOLLOWUP_DAYS} giorni senza attività.</p></div><span class="kyv-pitch-status ${due.length?'kyv-pitch-due':'kyv-pitch-confirmed'}">${due.length} ${due.length===1?'sollecito':'solleciti'}</span></div>${due.length?`<div class="kyv-pitch-agenda-grid">${due.slice(0,8).map(renderAgendaCard).join('')}</div>`:'<div class="mt-3 text-xs text-kyv-text">Nessun pitch da sollecitare adesso.</div>'}`;
  box.querySelectorAll('[data-pitch-plan]').forEach(btn=>btn.addEventListener('click',()=>planPitch(btn.dataset.pitchPlan)));
  box.querySelectorAll('[data-pitch-followup-agenda]').forEach(btn=>btn.addEventListener('click',event=>markFollowup(btn.dataset.pitchFollowupAgenda,event.currentTarget)));
  if(window.lucide)lucide.createIcons({root:box});return true;
}
function renderAgendaCard(row){
  const p=agendaProject(rowProjectId(row)),age=daysSince(activityDate(row));
  return `<article class="kyv-pitch-agenda-card" data-project-id="${H(rowProjectId(row))}"><div class="flex items-start justify-between gap-2"><div><h5>Sollecitare ${H(row.Destinatario||'destinatario')}</h5><p>${H(projectLabel(p))}</p><p>${H([row.Canale,row.Contesto].filter(Boolean).join(' · ')||'Pitch')} · ${age}g senza attività</p></div><span class="kyv-pitch-status kyv-pitch-due"><i data-lucide="alarm-clock" class="w-3 h-3"></i>Da sollecitare</span></div><div class="kyv-pitch-actions"><button type="button" class="kyv-pitch-btn" data-pitch-plan="${H(row.ID_INVIO)}"><i data-lucide="calendar-plus" class="w-3 h-3"></i>Pianifica</button><a class="kyv-pitch-btn" href="scheda_progetto.html?id=${encodeURIComponent(rowProjectId(row))}&tab=produzione"><i data-lucide="panel-top-open" class="w-3 h-3"></i>Progetto</a><button type="button" class="kyv-pitch-btn primary" data-pitch-followup-agenda="${H(row.ID_INVIO)}"><i data-lucide="send" class="w-3 h-3"></i>Sollecitato</button></div></article>`;
}
function localDate(){const d=new Date(),off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,10);}
function planPitch(id){
  const row=agendaRows.find(x=>String(x.ID_INVIO)===String(id));if(!row)return;const p=agendaProject(rowProjectId(row));
  const title=document.getElementById('ev-title'),date=document.getElementById('ev-date'),time=document.getElementById('ev-time');
  document.querySelector('[data-kind="followup"]')?.click();if(title)title.value=`Follow-up · ${text(row.Destinatario)||'destinatario'} — ${projectLabel(p)}`;if(date&&!text(date.value))date.value=localDate();if(time&&!text(time.value))time.value='12:00';document.getElementById('form-new-event')?.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>title?.focus(),200);
}
function watchAgendaPage(){
  injectStyles();
  const run=()=>{if(document.getElementById('kyv-agenda-phase5')){loadAgendaPitch();return true;}return false;};
  if(run())return;
  agendaObserver=new MutationObserver(()=>{if(run())agendaObserver?.disconnect();});
  agendaObserver.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>agendaObserver?.disconnect(),12000);
}

function boot(){if(page==='scheda_progetto.html')watchProjectPage();else watchAgendaPage();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
