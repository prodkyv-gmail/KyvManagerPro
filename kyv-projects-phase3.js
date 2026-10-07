/* KYV Projects Phase 3 — lista operativa producer-first, stabile e senza observer di rendering. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='progetti.html')return;

window.KYV_PROJECTS_PHASE3_ACTIVE=true;
window.KYV_PROJECTS_PHASE3_PENDING=false;

const FILTERS=[['RECENTI','Recenti'],['DA_FARE','Da fare'],['ATTESA','In attesa'],['USCITI','Usciti'],['TUTTI','Tutti']];
const STALE_DAYS=14;
let db=null,projects=[],audioRows=[],activeFilter='RECENTI',loading=false;

function text(v){return String(v??'').trim();}
function H(v){
  if(window.KYV&&typeof window.KYV.safeHtml==='function')return window.KYV.safeHtml(v??'');
  return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function upper(v){return text(v).toUpperCase();}
function dateValue(v){if(!v)return 0;const n=new Date(v).getTime();return Number.isFinite(n)?n:0;}
function projectDone(row){return /USCITA|PUBBLICAT|COMPLETAT|FINITA|CHIUS/.test(`${upper(row.STATO)} ${upper(row.SVILUPPO)}`);}
function waiting(row){return /ATTESA|WAIT|INVIAT|PITCH|FEEDBACK|RISPOST|APPROVA/.test(`${upper(row.STATO)} ${upper(row.SVILUPPO)}`);}
function nextAction(row){const v=text(row.SVILUPPO);return !v||/^(FINITA|COMPLETATA|USCITA|PUBBLICATA|CHIUSA)$/i.test(v)?'':v;}
function normalizeFilter(v){const key=upper(v);if(key==='WIP')return'RECENTI';if(key==='USCITE')return'USCITI';return FILTERS.some(([k])=>k===key)?key:activeFilter;}
function daysSince(ts){return ts?Math.max(0,Math.floor((Date.now()-ts)/86400000)):null;}
function activityLabel(ts){if(!ts)return'Attività non datata';const d=daysSince(ts);if(d===0)return'Oggi';if(d===1)return'Ieri';if(d<45)return`${d} gg fa`;return new Date(ts).toLocaleDateString('it-IT');}
function audioProjectId(row){return text(row.ID_PROGETTO||row.id_progetto||row.Progetto_ID||row.progetto_id);}
function audioTimestamp(row){return Math.max(...['DATA_FILE','Data_Caricamento','Data_Documento','Data_Consegna','updated_at','created_at'].map(k=>dateValue(row[k])),0);}
function audioName(row){return text(row.NOME_FILE||row.Nome_File||row.Titolo_Documento||row.TITOLO||row.Titolo||row.Progetto)||'Versione audio';}
function audioLink(row){return text(row.LINK_FILE||row.Link_Drive||row.Link_Dropbox);}
function audioSource(row){const p=upper(row.PROVIDER||row.provider);if(p.includes('DRIVE')||row.Link_Drive)return'Drive';if(p.includes('DROPBOX')||row.Link_Dropbox)return'Dropbox';return'Audio';}
function latestAudioMap(){
  const map=new Map();
  audioRows.forEach((row,index)=>{
    const pid=audioProjectId(row);if(!pid)return;
    const score=audioTimestamp(row)||Number(row.ID_VERSIONE||row.ID_FILE||row.ID_DOCUMENTO||row.ID_CONSEGNA||index)||0;
    const current=map.get(pid);if(!current||score>current.score)map.set(pid,{row,score});
  });
  return map;
}
function projectMeta(row,audioMap){
  const audio=audioMap.get(String(row.ID))||null;
  const own=Math.max(...['updated_at','Data_Sessione','Data_Pubblicazione','created_at','DATA_AGGIORNAMENTO','Data_Aggiornamento'].map(k=>dateValue(row[k])),0);
  const activity=Math.max(own,audio?.score||0);
  return{row,audio,activity,staleDays:projectDone(row)?null:daysSince(activity)};
}
function statusTone(row){if(projectDone(row))return'done';if(waiting(row))return'wait';if(nextAction(row))return'active';return'neutral';}

function injectStyles(){
  if(document.getElementById('kyv-projects-phase3-style'))return;
  const s=document.createElement('style');s.id='kyv-projects-phase3-style';s.textContent=`
#kyv-project-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem;margin-bottom:1rem}
#kyv-project-summary .kyv-project-stat{border:1px solid rgba(255,255,255,.09);border-radius:1rem;padding:.85rem 1rem;min-height:78px}
#kyv-project-summary .kyv-project-stat b{display:block;font-size:1.15rem;color:#fff;margin-top:.25rem}
#kyv-project-summary .kyv-project-stat span{font-size:.65rem;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#aab1bf}
.kyv-project-table .kyv-project-row{transition:background .16s ease,border-color .16s ease}.kyv-project-table .kyv-project-row:hover{background:rgba(99,102,241,.08)}
.kyv-project-table .kyv-project-row.is-stale{border-left:4px solid rgba(251,113,133,.8)}.kyv-project-table .kyv-project-row.is-wait{border-left:4px solid rgba(125,211,252,.7)}.kyv-project-table .kyv-project-row.is-active{border-left:4px solid rgba(167,243,208,.65)}.kyv-project-table .kyv-project-row.is-done{border-left:4px solid rgba(196,181,253,.55)}
.kyv-project-title{font-size:.88rem;font-weight:900;color:#fff}.kyv-project-artist{font-size:.72rem;font-weight:800;color:#a5f3fc;margin-top:.18rem}.kyv-project-muted{font-size:.68rem;color:#94a3b8;line-height:1.45}.kyv-next-action{font-size:.76rem;font-weight:800;color:#f8fafc;line-height:1.4}
.kyv-stale{display:inline-flex;margin-top:.35rem;padding:.2rem .42rem;border-radius:999px;background:rgba(244,63,94,.10);border:1px solid rgba(244,63,94,.22);color:#fda4af;font-size:.62rem;font-weight:900}
.kyv-status-chip{display:inline-flex;padding:.3rem .48rem;border-radius:999px;border:1px solid rgba(255,255,255,.10);font-size:.64rem;font-weight:900;color:#e2e8f0;background:rgba(255,255,255,.04)}.kyv-status-chip.done{color:#ddd6fe;background:rgba(139,92,246,.08)}.kyv-status-chip.wait{color:#bae6fd;background:rgba(56,189,248,.08)}.kyv-status-chip.active{color:#a7f3d0;background:rgba(16,185,129,.08)}
.kyv-audio-name{font-size:.72rem;font-weight:850;color:#e0e7ff;line-height:1.35;overflow-wrap:anywhere}
@media(max-width:900px){#kyv-project-summary{grid-template-columns:1fr 1fr}}`;
  document.head.appendChild(s);
}

function mountChrome(){
  const title=document.querySelector('main header h2');if(title)title.textContent='Progetti';
  const subtitle=document.querySelector('main header h2 + p');if(subtitle)subtitle.textContent='Cosa stai facendo, a che punto è e qual è la prossima cosa da fare.';
  const eyebrow=document.querySelector('main header .kyv-eyebrow');if(eyebrow)eyebrow.textContent='Lavoro creativo';
  const search=document.getElementById('uscite-search');if(search){search.placeholder='Titolo, artista, prossima azione…';search.removeAttribute('oninput');search.oninput=()=>render();}
  const newButton=[...document.querySelectorAll('main header button')].find(btn=>String(btn.getAttribute('onclick')||'').includes('openNewProjectChoices'));
  if(newButton){newButton.setAttribute('onclick',"location.href='acquisisci_audio.html'");newButton.innerHTML='<i data-lucide="circle-plus" class="w-4 h-4 mr-2"></i><span>Nuovo</span>';}
  const filterHost=document.querySelector('.uscite-filter-btn')?.parentElement;
  if(filterHost){
    filterHost.innerHTML=FILTERS.map(([key,label],i)=>`<button type="button" data-kyv-project-filter="${key}" class="kyv-filter-pill border-kyv-border text-kyv-text uscite-filter-btn ${i===0?'bg-indigo-600 text-white border-indigo-500':''}">${label}</button>`).join('');
    filterHost.querySelectorAll('[data-kyv-project-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeFilter=btn.dataset.kyvProjectFilter;render();}));
  }
  const table=document.querySelector('.kyv-project-table');const head=table?.querySelector('thead tr');
  if(head)head.innerHTML='<th class="px-4 py-3 font-semibold border-r border-kyv-border/40">Progetto</th><th class="px-4 py-3 font-semibold border-r border-kyv-border/40">Stato</th><th class="px-4 py-3 font-semibold border-r border-kyv-border/40">Prossima azione</th><th class="px-4 py-3 font-semibold border-r border-kyv-border/40">Ultima attività</th><th class="px-4 py-3 font-semibold border-r border-kyv-border/40">Ultimo audio</th><th class="px-4 py-3 font-semibold text-right">Azioni</th>';
  const wrapper=table?.closest('.bg-kyv-card');if(wrapper&&!document.getElementById('kyv-project-summary')){const summary=document.createElement('div');summary.id='kyv-project-summary';wrapper.parentNode.insertBefore(summary,wrapper);}
}

function renderSummary(all){
  const el=document.getElementById('kyv-project-summary');if(!el)return;
  const todo=all.filter(x=>nextAction(x.row)&&!projectDone(x.row)).length;
  const wait=all.filter(x=>waiting(x.row)&&!projectDone(x.row)).length;
  const stale=all.filter(x=>x.staleDays!==null&&x.staleDays>=STALE_DAYS).length;
  const done=all.filter(x=>projectDone(x.row)).length;
  el.innerHTML=`<div class="kyv-project-stat kyv-pastel-mint"><span>Da fare</span><b>${todo}</b></div><div class="kyv-project-stat kyv-pastel-sky"><span>In attesa</span><b>${wait}</b></div><div class="kyv-project-stat kyv-pastel-rose"><span>Fermi da ${STALE_DAYS}+ gg</span><b>${stale}</b></div><div class="kyv-project-stat kyv-pastel-lavender"><span>Usciti</span><b>${done}</b></div>`;
}
function visibleProjects(all){
  let out=[...all].sort((a,b)=>(b.activity-a.activity)||(Number(b.row.ID||0)-Number(a.row.ID||0)));
  if(activeFilter==='DA_FARE')out=out.filter(x=>nextAction(x.row)&&!projectDone(x.row));
  else if(activeFilter==='ATTESA')out=out.filter(x=>waiting(x.row)&&!projectDone(x.row));
  else if(activeFilter==='USCITI')out=out.filter(x=>projectDone(x.row));
  else if(activeFilter==='RECENTI')out=out.slice(0,40);
  const q=upper(document.getElementById('uscite-search')?.value||'');
  return out.filter(({row})=>!q||[row.TITOLO,row.ARTISTA,row.STATO,row.SVILUPPO,row.NOTE].some(v=>upper(v).includes(q)));
}
function render(){
  const body=document.getElementById('tbody-uscite');if(!body)return;
  try{
    document.querySelectorAll('[data-kyv-project-filter]').forEach(btn=>{const on=btn.dataset.kyvProjectFilter===activeFilter;btn.classList.toggle('bg-indigo-600',on);btn.classList.toggle('text-white',on);btn.classList.toggle('border-indigo-500',on);});
    const audioMap=latestAudioMap();const all=projects.map(row=>projectMeta(row,audioMap));renderSummary(all);const visible=visibleProjects(all);
    const count=document.getElementById('project-count');if(count)count.textContent=activeFilter==='RECENTI'&&all.length>visible.length?`${visible.length} recenti · ${all.length} totali`:`${visible.length} ${visible.length===1?'progetto':'progetti'}`;
    if(!visible.length){body.innerHTML='<tr><td colspan="6" class="p-10 text-center text-kyv-text">Nessun progetto in questa vista.</td></tr>';return;}
    body.innerHTML=visible.map(({row,audio,activity,staleDays})=>{
      const status=text(row.STATO)||(!projectDone(row)&&nextAction(row)?'In lavorazione':'Stato non indicato');const tone=statusTone(row);const action=nextAction(row);const a=audio?.row||null;const stale=staleDays!==null&&staleDays>=STALE_DAYS;const pid=encodeURIComponent(String(row.ID));const link=a?audioLink(a):'';
      return `<tr class="kyv-project-row ${stale?'is-stale':tone==='wait'?'is-wait':tone==='done'?'is-done':'is-active'} cursor-pointer border-b border-kyv-border/40" data-kyv-project-id="${H(row.ID)}"><td data-label="Progetto" class="px-4 py-3.5 border-r border-kyv-border/40 min-w-[220px]"><span class="kyv-project-title block">${H(row.TITOLO||'Senza titolo')}</span><span class="kyv-project-artist block">${H(row.ARTISTA||'Artista non indicato')}</span></td><td data-label="Stato" class="px-4 py-3.5 border-r border-kyv-border/40"><span class="kyv-status-chip ${tone}">${H(status)}</span></td><td data-label="Prossima azione" class="px-4 py-3.5 border-r border-kyv-border/40 min-w-[200px]"><span class="kyv-next-action">${H(action||(projectDone(row)?'Nessuna: progetto chiuso':'Da decidere'))}</span></td><td data-label="Ultima attività" class="px-4 py-3.5 border-r border-kyv-border/40"><span class="block text-white font-bold">${H(activityLabel(activity))}</span>${stale?`<span class="kyv-stale">Fermo da ${staleDays} gg</span>`:''}</td><td data-label="Ultimo audio" class="px-4 py-3.5 border-r border-kyv-border/40">${a?`<span class="kyv-audio-name block">${H(audioName(a))}</span><span class="kyv-project-muted block mt-1">${H(audioSource(a))}</span>${link?`<a href="${H(link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="text-[10px] font-black text-indigo-200">Apri file ↗</a>`:''}`:'<span class="kyv-project-muted">Nessun audio collegato</span>'}</td><td data-label="Azioni" class="px-4 py-3.5 text-right"><div class="flex items-center justify-end gap-2"><a href="scheda_progetto.html?id=${pid}" onclick="event.stopPropagation()" class="kyv-row-primary">Apri</a><button data-action="open-ref" data-id="${H(row.ID)}" onclick="event.stopPropagation()" class="kyv-row-menu" title="Modifica">✎</button></div></td></tr>`;
    }).join('');
    body.querySelectorAll('[data-kyv-project-id]').forEach(row=>row.addEventListener('click',event=>{if(event.target.closest('a,button'))return;location.href=`scheda_progetto.html?id=${encodeURIComponent(row.dataset.kyvProjectId)}`;}));
  }catch(error){
    console.error('[KYV Projects] Render non riuscito',error);
    body.innerHTML='<tr><td colspan="6" class="p-8 text-center text-rose-300">Errore nella visualizzazione dei progetti.</td></tr>';
  }
}

async function safeRows(table,limit){try{const {data,error}=await db.from(table).select('*').limit(limit);return error?[]:(data||[]);}catch(_){return[];}}
async function load(){
  if(loading)return;loading=true;
  const body=document.getElementById('tbody-uscite');if(body)body.innerHTML='<tr><td colspan="6" class="p-8 text-center text-kyv-text">Carico i progetti…</td></tr>';
  try{
    const {data,error}=await db.from('PROGETTI').select('*').order('ID',{ascending:false}).limit(500);if(error)throw error;
    projects=data||[];audioRows=[];render();
    setTimeout(async()=>{
      try{const [a,d,docs]=await Promise.all([safeRows('AUDIO_VERSIONI',2500),safeRows('DROPBOX_AUDIO_FILES',1500),safeRows('DOCUMENTI_PROGETTO',1500)]);audioRows=[...a,...d,...docs];render();}catch(_){/* la lista progetti resta utilizzabile */}
    },120);
  }catch(error){console.error('[KYV Projects] Caricamento non riuscito',error);if(body)body.innerHTML=`<tr><td colspan="6" class="p-8 text-center text-rose-300">Impossibile caricare i progetti: ${H(error.message||'errore')}</td></tr>`;}
  finally{loading=false;}
}

async function boot(){
  injectStyles();mountChrome();db=window.KYV?.createSupabaseClient?.();if(!db)return;
  // Sovrascrive subito i due entry point legacy prima che il vecchio DOMContentLoaded li invochi.
  window.fetchUscite=load;window.applyUsciteFilters=(filter)=>{if(filter)activeFilter=normalizeFilter(filter);render();};
  const authRequired=window.KYV_AUTH?.authRequired?.()!==false;
  const session=await window.KYV_AUTH?.requireAuth?.();if(authRequired&&!session)return;
  load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
