/* KYV Projects Safe — renderer deterministico per la pagina Progetti.
   Legge solo PROGETTI, non usa observer DOM e neutralizza il loader legacy. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='progetti.html')return;

window.KYV_PROJECTS_PHASE3_ACTIVE=true;
window.KYV_PROJECTS_SAFE_MODE=true;

const FILTERS=[['RECENTI','Recenti'],['DA_FARE','Da fare'],['ATTESA','In attesa'],['USCITI','Usciti'],['TUTTI','Tutti']];
let db=null,projects=[],activeFilter='RECENTI',ready=false,loading=false,pendingReload=false;

function text(v){return String(v??'').trim();}
function upper(v){return text(v).toUpperCase();}
function H(v){
  if(window.KYV&&typeof window.KYV.safeHtml==='function')return window.KYV.safeHtml(v??'');
  return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function done(p){return /USCITA|PUBBLICAT|COMPLETAT|FINITA|CHIUS/.test(`${upper(p.STATO)} ${upper(p.SVILUPPO)}`);}
function waiting(p){return /ATTESA|WAIT|INVIAT|PITCH|FEEDBACK|RISPOST|APPROVA/.test(`${upper(p.STATO)} ${upper(p.SVILUPPO)}`);}
function nextAction(p){const v=text(p.SVILUPPO);return !v||/^(FINITA|COMPLETATA|USCITA|PUBBLICATA|CHIUSA)$/i.test(v)?'':v;}
function dateValue(v){const n=new Date(v||0).getTime();return Number.isFinite(n)?n:0;}
function activity(p){return Math.max(...['updated_at','Data_Sessione','Data_Pubblicazione','created_at','DATA_AGGIORNAMENTO','Data_Aggiornamento'].map(k=>dateValue(p[k])),Number(p.ID||0));}
function activityLabel(p){
  const raw=Math.max(...['updated_at','Data_Sessione','Data_Pubblicazione','created_at','DATA_AGGIORNAMENTO','Data_Aggiornamento'].map(k=>dateValue(p[k])),0);
  if(!raw)return 'Non datata';
  const days=Math.max(0,Math.floor((Date.now()-raw)/86400000));
  if(days===0)return'Oggi';if(days===1)return'Ieri';if(days<45)return`${days} gg fa`;
  return new Date(raw).toLocaleDateString('it-IT');
}
function normalizeFilter(v){const key=upper(v);if(key==='WIP')return'RECENTI';if(key==='USCITE')return'USCITI';return FILTERS.some(([k])=>k===key)?key:activeFilter;}

function mountProducerSidebar(){
  const sidebar=document.getElementById('sidebar');const nav=sidebar?.querySelector('nav');
  if(!nav||nav.dataset.projectsSafe==='1')return;
  nav.dataset.projectsSafe='1';
  const item=(href,label,icon,active=false)=>`<li><a href="${href}" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-bold ${active?'bg-indigo-500/10 text-indigo-200 border border-indigo-500/25':'text-kyv-text hover:text-white hover:bg-kyv-border/50 border border-transparent'}"><i data-lucide="${icon}" class="w-4 h-4 mr-3"></i><span>${label}</span></a></li>`;
  nav.innerHTML=`<div><p class="px-3 text-[10px] font-black text-kyv-text uppercase tracking-wider mb-2">Produttore</p><ul class="space-y-1">${item('index.html','Oggi','layout-dashboard')}${item('kyv_calendar.html','Agenda','calendar-days')}${item('acquisisci_audio.html','Nuovo','circle-plus')}${item('progetti.html','Progetti','music-2',true)}${item('ascolto.html','Ascolto','headphones')}</ul></div><details class="kyv-nav-group"><summary><i data-lucide="landmark"></i><span>Controllo</span><i data-lucide="chevron-down" class="kyv-chevron w-4 h-4"></i></summary><ul class="space-y-1">${item('fatture.html','Fatture e incassi','receipt')}${item('documenti.html?tab=spese','Spese','receipt-euro')}${item('documenti.html','Documenti','folder-lock')}${item('fisco.html','Piano fiscale','calculator')}${item('quote.html','Quote / split','pie-chart')}${item('rendiconto.html','Rendiconto SIAE','bar-chart-2')}</ul></details><details class="kyv-nav-group"><summary><i data-lucide="wrench"></i><span>Strumenti</span><i data-lucide="chevron-down" class="kyv-chevron w-4 h-4"></i></summary><ul class="space-y-1">${item('clienti.html','Contatti','users')}${item('editor.html','Studio Editor','database')}${item('archivio_musicale.html','Archivio musicale','archive')}${item('assistente.html','Percorso brano','route')}${item('pipeline.html','Pipeline','columns-3')}${item('integrazioni.html','Tutte le app','grid-3x3')}${item('importexport.html','Import / Export','arrow-down-up')}${item('diagnostica.html','Diagnostica','activity')}${item('guida.html','Manuale','book-open')}</ul></details>`;
  const brand=sidebar.querySelector('h1 + p');if(brand&&window.KYV_CONFIG)brand.textContent=`Manager Pro ${window.KYV_CONFIG.APP_VERSION}`;
  if(window.lucide)window.lucide.createIcons({root:sidebar});
}
function mountChrome(){
  const title=document.querySelector('main header h2');if(title)title.textContent='Progetti';
  const subtitle=document.querySelector('main header h2 + p');if(subtitle)subtitle.textContent='Cosa stai facendo, a che punto è e qual è la prossima cosa da fare.';
  const eyebrow=document.querySelector('main header .kyv-eyebrow');if(eyebrow)eyebrow.textContent='Lavoro creativo';
  const search=document.getElementById('uscite-search');if(search){search.placeholder='Titolo, artista, prossima azione…';search.removeAttribute('oninput');search.oninput=render;}
  const newButton=[...document.querySelectorAll('main header button')].find(btn=>String(btn.getAttribute('onclick')||'').includes('openNewProjectChoices'));
  if(newButton){newButton.setAttribute('onclick',"location.href='acquisisci_audio.html'");newButton.innerHTML='<i data-lucide="circle-plus" class="w-4 h-4 mr-2"></i><span>Nuovo</span>';}
  const reload=[...document.querySelectorAll('main header button')].find(btn=>String(btn.getAttribute('onclick')||'').includes('fetchUscite'));
  if(reload){reload.removeAttribute('onclick');reload.onclick=requestLoad;}
  const filterHost=document.querySelector('.uscite-filter-btn')?.parentElement;
  if(filterHost){
    filterHost.innerHTML=FILTERS.map(([key,label],i)=>`<button type="button" data-safe-filter="${key}" class="kyv-filter-pill border-kyv-border text-kyv-text ${i===0?'bg-indigo-600 text-white border-indigo-500':''}">${label}</button>`).join('');
    filterHost.querySelectorAll('[data-safe-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeFilter=btn.dataset.safeFilter;render();}));
  }
  const head=document.querySelector('.kyv-project-table thead tr');
  if(head)head.innerHTML='<th class="px-4 py-3 font-semibold">Progetto</th><th class="px-4 py-3 font-semibold">Stato</th><th class="px-4 py-3 font-semibold">Prossima azione</th><th class="px-4 py-3 font-semibold">Ultima attività</th><th class="px-4 py-3 font-semibold text-right">Azioni</th>';
}
function visibleRows(){
  let rows=[...projects].sort((a,b)=>activity(b)-activity(a));
  if(activeFilter==='DA_FARE')rows=rows.filter(p=>nextAction(p)&&!done(p));
  else if(activeFilter==='ATTESA')rows=rows.filter(p=>waiting(p)&&!done(p));
  else if(activeFilter==='USCITI')rows=rows.filter(done);
  else if(activeFilter==='RECENTI')rows=rows.slice(0,40);
  const q=upper(document.getElementById('uscite-search')?.value||'');
  if(q)rows=rows.filter(p=>[p.TITOLO,p.ARTISTA,p.STATO,p.SVILUPPO,p.NOTE].some(v=>upper(v).includes(q)));
  return rows;
}
function render(){
  const body=document.getElementById('tbody-uscite');if(!body)return;
  const rows=visibleRows();
  document.querySelectorAll('[data-safe-filter]').forEach(btn=>{const on=btn.dataset.safeFilter===activeFilter;btn.classList.toggle('bg-indigo-600',on);btn.classList.toggle('text-white',on);btn.classList.toggle('border-indigo-500',on);btn.classList.toggle('text-kyv-text',!on);});
  const count=document.getElementById('project-count');if(count)count.textContent=activeFilter==='RECENTI'&&projects.length>rows.length?`${rows.length} recenti · ${projects.length} totali`:`${rows.length} ${rows.length===1?'progetto':'progetti'}`;
  if(!rows.length){body.innerHTML='<tr><td colspan="5" class="p-10 text-center text-kyv-text">Nessun progetto in questa vista.</td></tr>';return;}
  body.innerHTML=rows.map(p=>{const pid=encodeURIComponent(String(p.ID));const status=text(p.STATO)||(!done(p)&&nextAction(p)?'In lavorazione':'Stato non indicato');return `<tr class="border-b border-kyv-border/40 hover:bg-indigo-500/5 cursor-pointer" data-safe-project="${H(p.ID)}"><td class="px-4 py-3.5 min-w-[220px]"><strong class="block text-sm text-white">${H(p.TITOLO||'Senza titolo')}</strong><span class="block text-xs text-cyan-200 font-bold mt-1">${H(p.ARTISTA||'Artista non indicato')}</span></td><td class="px-4 py-3.5"><span class="inline-flex px-2 py-1 rounded-full border border-white/10 text-xs font-bold">${H(status)}</span></td><td class="px-4 py-3.5 text-white font-semibold">${H(nextAction(p)||(done(p)?'Progetto chiuso':'Da decidere'))}</td><td class="px-4 py-3.5 text-kyv-text">${H(activityLabel(p))}</td><td class="px-4 py-3.5 text-right"><a href="scheda_progetto.html?id=${pid}" class="inline-flex px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold" onclick="event.stopPropagation()">Apri</a></td></tr>`;}).join('');
  body.querySelectorAll('[data-safe-project]').forEach(row=>row.addEventListener('click',event=>{if(event.target.closest('a,button'))return;location.href=`scheda_progetto.html?id=${encodeURIComponent(row.dataset.safeProject)}`;}));
}
async function load(){
  if(!ready){pendingReload=true;return;}
  if(loading){pendingReload=true;return;}
  loading=true;pendingReload=false;
  const body=document.getElementById('tbody-uscite');if(body)body.innerHTML='<tr><td colspan="5" class="p-10 text-center text-kyv-text">Carico i progetti…</td></tr>';
  try{
    const {data,error}=await db.from('PROGETTI').select('*').order('ID',{ascending:false}).limit(500);
    if(error)throw error;projects=data||[];render();
  }catch(error){console.error('[KYV Projects Safe]',error);if(body)body.innerHTML=`<tr><td colspan="5" class="p-10 text-center text-rose-300">Errore caricamento progetti: ${H(error.message||'errore sconosciuto')}</td></tr>`;}
  finally{loading=false;if(pendingReload){pendingReload=false;load();}}
}
function requestLoad(){if(!ready){pendingReload=true;return Promise.resolve();}return load();}
async function boot(){
  // Sovrascrive le funzioni legacy prima che il loro listener DOMContentLoaded prosegua.
  window.fetchUscite=requestLoad;
  window.applyUsciteFilters=function(filter){if(filter)activeFilter=normalizeFilter(filter);if(ready)render();};
  mountChrome();mountProducerSidebar();
  db=window.KYV?.createSupabaseClient?.();
  if(!db){const body=document.getElementById('tbody-uscite');if(body)body.innerHTML='<tr><td colspan="5" class="p-10 text-center text-rose-300">Client dati non disponibile.</td></tr>';return;}
  const authRequired=window.KYV_AUTH?.authRequired?.()!==false;
  const session=await window.KYV_AUTH?.requireAuth?.();
  if(authRequired&&!session)return;
  ready=true;
  await load();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
