/* KYV Project Invoices — fatture collegate nel flusso producer, senza nuove tabelle. */
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const supported=new Set(['progetti.html','scheda_progetto.html','ascolto.html','kyv_calendar.html','index.html','']);
if(!supported.has(page))return;

let db=null;
let editor=null;
let listInvoices=[];
let listAllocations=[];
let legacyProjects=[];
let contextInvoices=[];
let contextProjectId='';
let listObserver=null;
let adminObserver=null;
let heroInvoiceObserver=null;
let editorPromise=null;
let mountTimer=null;
let contextRefreshToken=0;
let listInvoiceReadFailed=false;
let listCoverageLimited=false;

function text(v){return String(v??'').trim();}
function H(v){
  if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(v??'');
  return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function paid(row){
  if(window.KYV&&typeof KYV.isPaid==='function')return KYV.isPaid(row?.PAGATA)||KYV.isPaid(row?.PAGAMENTO);
  return /^(SI|SÌ|YES|PAGAT|INCASSAT)/i.test(text(row?.PAGATA||row?.PAGAMENTO));
}
function amount(row){
  if(window.KYV_INVOICE_LINE?.amount)return window.KYV_INVOICE_LINE.amount(row);
  const raw=row?.PrezzoUnitario;
  if(window.KYV&&typeof KYV.parseNumber==='function')return Math.max(0,KYV.parseNumber(raw)||0);
  if(typeof raw==='number')return Number.isFinite(raw)?Math.max(0,raw):0;
  const n=Number(String(raw||'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));
  return Number.isFinite(n)?Math.max(0,n):0;
}
function euro(value){
  if(window.KYV&&typeof KYV.formatEuro==='function')return KYV.formatEuro(value);
  return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(value)||0);
}
function currentProjectId(){
  const p=new URLSearchParams(location.search);
  return text(p.get(page==='scheda_progetto.html'?'id':'projectId')||p.get('id')||p.get('project'));
}
function todayIso(){const now=new Date();return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);}
function invoiceKey(row){return text(row?.ID_FT);}
function uniqueInvoices(rows){
  const map=new Map();
  (rows||[]).forEach((row,index)=>map.set(invoiceKey(row)||`row-${index}`,row));
  return [...map.values()];
}
function summary(rows){
  rows=uniqueInvoices(rows);
  if(!rows.length)return{kind:'none',label:'Fattura non emessa',short:'Nessuna fattura',detail:'Nessuna fattura collegata'};
  const open=rows.filter(row=>!paid(row));
  const total=rows.reduce((sum,row)=>sum+amount(row),0);
  if(rows.length===1){
    const row=rows[0];
    const number=text(row.Numero)||`#${text(row.ID_FT)}`;
    if(row._idftShared)return{kind:'open',label:`${number} · condivisa, quota da ripartire`,short:'Quota da ripartire',detail:`${number} · fattura condivisa con altri progetti: la quota di questo progetto non è ancora ripartita`};
    return open.length
      ?{kind:'open',label:`${number} · da incassare`,short:'Da incassare',detail:`${number} · ${euro(amount(row))} · da incassare`}
      :{kind:'paid',label:`${number} · incassata`,short:'Incassata',detail:`${number} · ${euro(amount(row))} · incassata`};
  }
  return open.length
    ?{kind:'open',label:`${rows.length} fatture · ${open.length} da incassare`,short:`${open.length} da incassare`,detail:`${rows.length} fatture · ${euro(total)} · ${open.length} da incassare`}
    :{kind:'paid',label:`${rows.length} fatture · incassate`,short:'Incassate',detail:`${rows.length} fatture · ${euro(total)} · incassate`};
}
function toneClass(kind){if(kind==='paid')return'kyv-invoice-paid';if(kind==='open')return'kyv-invoice-open';return'kyv-invoice-none';}
function injectStyles(){
  if(document.getElementById('kyv-project-invoices-style'))return;
  const style=document.createElement('style');style.id='kyv-project-invoices-style';style.textContent=`
.kyv-invoice-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.48rem .66rem;border-radius:.7rem;border:1px solid rgba(255,255,255,.09);font-size:.67rem;font-weight:850;white-space:nowrap;transition:.15s}.kyv-invoice-chip:hover{color:#fff;filter:brightness(1.08)}.kyv-invoice-none{color:#fcd34d;background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.22)}.kyv-invoice-open{color:#fecaca;background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.22)}.kyv-invoice-paid{color:#a7f3d0;background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.22)}.kyv-invoice-error{color:#fda4af;background:rgba(244,63,94,.06);border-color:rgba(244,63,94,.18)}
.kyv-workflow-nav a .kyv-invoice-inline-state{display:inline-flex;align-items:center;white-space:nowrap;border:1px solid rgba(148,163,184,.24);border-radius:999px;padding:.14rem .4rem;margin-left:.25rem;font-size:.57rem;font-weight:850;letter-spacing:0;line-height:1.4;color:#cbd5e1;background:rgba(148,163,184,.10)}
.kyv-workflow-nav a[data-kyv-invoice-kind="open"] .kyv-invoice-inline-state{color:#fecaca;border-color:rgba(244,63,94,.25);background:rgba(244,63,94,.08)}
.kyv-workflow-nav a[data-kyv-invoice-kind="paid"] .kyv-invoice-inline-state{color:#a7f3d0;border-color:rgba(16,185,129,.25);background:rgba(16,185,129,.08)}
.kyv-workflow-nav a[data-kyv-invoice-kind="none"] .kyv-invoice-inline-state{color:#fde68a;border-color:rgba(245,158,11,.23);background:rgba(245,158,11,.07)}
.kyv-workflow-nav a[data-kyv-invoice-kind="error"] .kyv-invoice-inline-state{color:#fda4af;border-color:rgba(244,63,94,.25);background:rgba(244,63,94,.08)}
.kyv-invoice-cell{min-width:155px}.kyv-invoice-cell a,.kyv-invoice-cell button,.kyv-invoice-cell span{font-size:.66rem;font-weight:850}.kyv-invoice-cell .kyv-invoice-main{display:inline-flex;align-items:center;gap:.35rem;padding:.38rem .5rem;border-radius:.65rem;border:1px solid rgba(255,255,255,.09)}.kyv-invoice-cell .kyv-invoice-add{margin-left:.35rem;color:#c7d2fe}.kyv-invoice-editable{cursor:pointer}.kyv-invoice-editable:hover{background:rgba(99,102,241,.06)}.kyv-invoice-admin-action{display:inline-flex;align-items:center;gap:.4rem;margin-top:.7rem;padding:.55rem .75rem;border-radius:.75rem;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.28);color:#e0e7ff;font-size:.72rem;font-weight:900}.kyv-invoice-admin-action:hover{background:rgba(99,102,241,.20);color:#fff}@media(max-width:640px){.kyv-invoice-chip{padding:.45rem .55rem;font-size:.63rem}.kyv-invoice-cell{min-width:130px}}
`;document.head.appendChild(style);
}
async function ensureDb(){if(db)return db;if(!window.KYV?.createSupabaseClient)throw new Error('Client dati KYV non disponibile.');db=KYV.createSupabaseClient();return db;}
function loadScript(src){return new Promise((resolve,reject)=>{const existing=[...document.scripts].find(s=>String(s.src||'').endsWith(src));if(existing){if(window.KYV_RECORD_EDITOR)return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',()=>reject(new Error(`Impossibile caricare ${src}`)),{once:true});setTimeout(()=>window.KYV_RECORD_EDITOR&&resolve(),80);return;}const script=document.createElement('script');script.src=src;script.async=false;script.dataset.kyvInvoiceRuntime='1';script.onload=resolve;script.onerror=()=>reject(new Error(`Impossibile caricare ${src}`));document.head.appendChild(script);});}
async function ensureEditor(){
  if(editor)return editor;if(editorPromise)return editorPromise;
  editorPromise=(async()=>{await ensureDb();if(!window.KYV_RECORD_EDITOR)await loadScript('kyv-record-editor.js');if(!window.KYV_RECORD_EDITOR?.create)throw new Error('Editor fatture non disponibile.');editor=window.KYV_RECORD_EDITOR.create({client:db,onSaved:async tableName=>{if(tableName!=='FATTURE')return;const pid=contextProjectId||currentProjectId();if(page==='scheda_progetto.html'&&typeof window.refreshAll==='function')await window.refreshAll();await refreshContext(pid);window.dispatchEvent(new CustomEvent('kyv:invoice-updated',{detail:{projectId:pid}}));}});return editor;})();
  try{return await editorPromise;}finally{editorPromise=null;}
}
async function openNewInvoice(projectId,title='',artist=''){
  projectId=text(projectId);if(!projectId)return;
  if(page!=='scheda_progetto.html'){location.href=contextHref(projectId,true);return;}
  try{
    const instance=await ensureEditor();await instance.open('FATTURE',null);
    const modal=document.getElementById('kyv-record-editor-modal');
    const setField=(key,value)=>{const input=modal?.querySelector(`[data-key="${CSS.escape(key)}"]`);if(!input)return false;if(key==='ID_PROGETTO'&&input.tagName==='SELECT'&&![...input.options].some(option=>String(option.value)===String(value)))input.add(new Option(`Progetto #${value}`,String(value)));input.value=value??'';input.dispatchEvent(new Event('change',{bubbles:true}));return String(input.value)===String(value??'');};
    if(!setField('ID_PROGETTO',projectId))throw new Error('Collegamento al progetto non impostato: fattura non aperta per evitare una relazione mancante.');
    const projectInput=modal?.querySelector('[data-key="ID_PROGETTO"]');if(projectInput){projectInput.disabled=true;projectInput.title='Collegamento bloccato sul progetto da cui stai emettendo la fattura.';projectInput.dataset.kyvLockedRelation='1';}
    setField('Data',todayIso());setField('Descrizione',[artist,title].filter(Boolean).join(' · '));
  }catch(error){console.error('[KYV Invoices] Apertura nuova fattura non riuscita',error);if(window.KYV_TOAST)KYV_TOAST.show(error.message||'Impossibile aprire la fattura.','error');}
}
async function openExistingInvoice(invoiceId){if(invoiceId===null||invoiceId===undefined||text(invoiceId)==='')return;try{const instance=await ensureEditor();await instance.open('FATTURE',invoiceId);}catch(error){console.error('[KYV Invoices] Apertura fattura non riuscita',error);if(window.KYV_TOAST)KYV_TOAST.show(error.message||'Impossibile aprire la fattura.','error');}}

const invoiceFields='ID_FT,Numero,Data,Denominazione,Descrizione,PrezzoUnitario,PrezzoTotale,XML_SHA256,PAGATA,ID_PROGETTO';
async function fetchDirectInvoices(projectId){const client=await ensureDb();const {data,error}=await client.from('FATTURE').select(invoiceFields).eq('ID_PROGETTO',projectId).order('Data',{ascending:false}).limit(200);if(error)throw error;return data||[];}
async function loadProjectInvoices(projectId){
 projectId=text(projectId);if(!projectId)return[];
 try{
  const client=await ensureDb();
  const [direct,projectRes,shareRes]=await Promise.all([
    fetchDirectInvoices(projectId),
    client.from('PROGETTI').select('ID,IDFT').eq('ID',projectId).maybeSingle(),
    client.from('FATTURE_RIPARTIZIONI').select('id_ft,id_progetto,prezzo_unitario,descrizione').eq('id_progetto',projectId).limit(1000)]);
  if(projectRes.error)throw projectRes.error;
  if(shareRes.error)throw shareRes.error;
  const project=projectRes.data||{ID:projectId,IDFT:null};
  const candidateIds=[...new Set([...direct.map(row=>text(row.ID_FT)),text(project.IDFT),...(shareRes.data||[]).map(row=>text(row.id_ft))].filter(Boolean))];
  const [docsRes,allocationRes]=candidateIds.length?await Promise.all([
    client.from('FATTURE').select(invoiceFields).in('ID_FT',candidateIds).limit(1000),
    client.from('FATTURE_RIPARTIZIONI').select('id_ft,id_progetto,prezzo_unitario,descrizione').in('id_ft',candidateIds).limit(5000)
  ]):[{data:[],error:null},{data:[],error:null}];
  if(docsRes.error||allocationRes.error)throw(docsRes.error||allocationRes.error);
  const docs=uniqueInvoices([...direct,...(docsRes.data||[])]);
  const missingShare=[...new Set((shareRes.data||[]).map(row=>text(row.id_ft)))].filter(id=>!docs.some(row=>text(row.ID_FT)===id));
  if(missingShare.length)throw Error('Lettura fatture multi-progetto incompleta');
  return window.KYV_PROJECT_RELATIONS.resolveProjectInvoices({project,invoices:docs,allocations:allocationRes.data||[]});
 }catch(error){console.warn('[KYV Invoices] Lettura fatture progetto non riuscita',error);return null;}
}

function contextHref(projectId,create=false){const base=`scheda_progetto.html?id=${encodeURIComponent(projectId)}&tab=amministrazione`;return create?`${base}&newInvoice=1`:base;}
function mountContextChip(projectId,rows){
  const nav=document.getElementById('kyv-workflow-nav');if(!nav)return false;
  const chip=document.getElementById('kyv-project-invoice-chip');
  const mainInvoiceLink=nav.querySelector('[data-kyv-workflow="invoice"]');
  // v2.70: the journey already has one Fatture action. Add a read-only state to that
  // exact link, never a second invoice action or an implicit editor/create route.
  if(mainInvoiceLink){
    chip?.remove();
    const info=rows===null
      ?{kind:'error',short:'Non disponibili',detail:'Lettura fatture non riuscita: nessuna assenza viene dedotta.'}
      :summary(rows);
    let state=mainInvoiceLink.querySelector('[data-kyv-invoice-state]');
    if(!state){
      state=document.createElement('span');
      state.className='kyv-invoice-inline-state';
      state.dataset.kyvInvoiceState='1';
      mainInvoiceLink.appendChild(state);
    }
    state.textContent=info.short;
    mainInvoiceLink.dataset.kyvInvoiceKind=info.kind;
    mainInvoiceLink.title=info.detail;
    mainInvoiceLink.setAttribute('aria-label','Fatture · '+info.detail);
    return true;
  }
  // Compatibility: older/non-journey producer views have no invoice entry.
  // Keep their original actionable chip, including its manual new-invoice shortcut.
  if(rows===null){if(!chip){const error=document.createElement('span');error.id='kyv-project-invoice-chip';nav.appendChild(error);}const existing=document.getElementById('kyv-project-invoice-chip');if(existing.tagName==='A'){const replacement=document.createElement('span');replacement.id=existing.id;existing.replaceWith(replacement);}const errorChip=document.getElementById('kyv-project-invoice-chip');errorChip.className='kyv-invoice-chip kyv-invoice-error';errorChip.textContent='⚠ Fatture non disponibili';errorChip.title='Lettura fatture non riuscita: nessuna assenza viene dedotta.';return true;}
  const info=summary(rows),href=contextHref(projectId,info.kind==='none');let target=chip;
  if(!target||target.tagName!=='A'){const replacement=document.createElement('a');replacement.id='kyv-project-invoice-chip';if(target)target.replaceWith(replacement);else nav.appendChild(replacement);target=replacement;}
  target.href=href;target.className=`kyv-invoice-chip ${toneClass(info.kind)}`;target.textContent=`🧾 ${info.short}`;target.title=info.detail;return true;
}
async function refreshContext(projectId){projectId=text(projectId);const token=++contextRefreshToken;contextProjectId=projectId;if(!projectId){contextInvoices=[];document.getElementById('kyv-project-invoice-chip')?.remove();return;}const rows=await loadProjectInvoices(projectId);if(token!==contextRefreshToken||contextProjectId!==projectId)return;contextInvoices=rows;mountContextChip(projectId,rows);if(page==='scheda_progetto.html')enhanceSchedaAdmin();}
function scheduleContextMount(projectId,attempt=0){clearTimeout(mountTimer);mountTimer=setTimeout(()=>{if(projectId!==contextProjectId)return;if(mountContextChip(projectId,contextInvoices))return;if(attempt<20)scheduleContextMount(projectId,attempt+1);},attempt?250:0);}

async function loadListData(){
  const client=await ensureDb();const invoiceLimit=1500,projectLimit=600;
  const [invoiceRes,projectRes,allocationRes]=await Promise.all([client.from('FATTURE').select(invoiceFields).order('Data',{ascending:false}).limit(invoiceLimit),client.from('PROGETTI').select('ID,IDFT').order('ID',{ascending:false}).limit(projectLimit),client.from('FATTURE_RIPARTIZIONI').select('id_ft,id_progetto,prezzo_unitario,descrizione').order('id',{ascending:false}).limit(5000)]);
  listInvoiceReadFailed=Boolean(invoiceRes.error||projectRes.error||allocationRes.error);listCoverageLimited=!listInvoiceReadFailed&&((invoiceRes.data||[]).length>=invoiceLimit||(projectRes.data||[]).length>=projectLimit);
  if(invoiceRes.error)console.warn('[KYV Invoices] Lettura lista fatture non riuscita',invoiceRes.error);if(projectRes.error)console.warn('[KYV Invoices] Lettura riferimenti legacy non riuscita',projectRes.error);
  listInvoices=invoiceRes.error?[]:(invoiceRes.data||[]);legacyProjects=projectRes.error?[]:(projectRes.data||[]);listAllocations=allocationRes.error?[]:(allocationRes.data||[]);enhanceProjectList();
}
function listInvoicesForProject(projectId){
  const project=legacyProjects.find(row=>text(row.ID)===text(projectId))||{ID:projectId,IDFT:null};
  return window.KYV_PROJECT_RELATIONS.resolveProjectInvoices({project,invoices:listInvoices,allocations:listAllocations});
}
function renderListCell(projectId){
  if(listInvoiceReadFailed)return '<span class="kyv-invoice-main kyv-invoice-error" title="Lettura fatture non riuscita">⚠ Stato non disponibile</span>';
  const rows=listInvoicesForProject(projectId),info=summary(rows);
  if(!rows.length&&listCoverageLimited)return `<a href="${H(contextHref(projectId,false))}" onclick="event.stopPropagation()" class="kyv-invoice-main kyv-invoice-error" title="L’elenco generale ha raggiunto il limite di lettura: verifica nella scheda prima di creare una fattura">⚠ Verifica fattura</a>`;
  if(!rows.length)return `<a href="${H(contextHref(projectId,true))}" onclick="event.stopPropagation()" class="kyv-invoice-main ${toneClass(info.kind)}">+ Fattura</a>`;
  return `<a href="${H(contextHref(projectId,false))}" onclick="event.stopPropagation()" class="kyv-invoice-main ${toneClass(info.kind)}" title="${H(info.detail)}">🧾 ${H(info.short)}</a><a href="${H(contextHref(projectId,true))}" onclick="event.stopPropagation()" class="kyv-invoice-add" title="Registra un'altra fattura">＋</a>`;
}
function enhanceProjectList(){
  const body=document.getElementById('tbody-uscite'),table=document.querySelector('.kyv-project-table')||body?.closest('table'),head=table?.querySelector('thead tr');if(!head||!body)return false;
  if(!head.querySelector('[data-kyv-invoice-column]')){const th=document.createElement('th');th.dataset.kyvInvoiceColumn='1';th.className='px-4 py-3 font-semibold border-r border-kyv-border/40';th.textContent='Fattura';head.insertBefore(th,head.lastElementChild);}
  body.querySelectorAll('[data-kyv-project-id],[data-id]').forEach(row=>{const pid=text(row.dataset.kyvProjectId||row.dataset.id);if(!pid)return;let cell=row.querySelector('[data-kyv-invoice-cell]');if(!cell){cell=document.createElement('td');cell.dataset.kyvInvoiceCell='1';cell.dataset.label='Fattura';cell.className='kyv-invoice-cell px-4 py-3.5 border-r border-kyv-border/40';row.insertBefore(cell,row.lastElementChild);}cell.innerHTML=renderListCell(pid);});
  const notice=document.querySelector('.notice');if(notice?.firstElementChild)notice.firstElementChild.textContent=listCoverageLimited?'Vista fatture parziale: per gli stati non risolti apri la Scheda progetto.':'Modalità stabile: questa vista legge PROGETTI e lo stato FATTURE.';return true;
}
function wireProjectList(){const body=document.getElementById('tbody-uscite');if(!body)return false;if(!listObserver){listObserver=new MutationObserver(()=>enhanceProjectList());listObserver.observe(body,{childList:true});}enhanceProjectList();return true;}

function findInvoiceCard(){const admin=document.getElementById('tab-admin');if(!admin)return null;const heading=[...admin.querySelectorAll('h3')].find(node=>/fatture collegate/i.test(text(node.textContent)));return heading?.closest('.kyv-card')||null;}
function projectMetaFromScheda(){return{title:text(document.getElementById('hero-title')?.textContent),artist:text(document.getElementById('hero-artist')?.textContent)};}
function enhanceSchedaAdmin(){
  const pid=contextProjectId||currentProjectId();if(!pid)return false;const card=findInvoiceCard();if(!card)return false;
  if(contextInvoices!==null&&!card.querySelector('[data-kyv-invoice-admin-new]')){const meta=projectMetaFromScheda(),button=document.createElement('button');button.type='button';button.dataset.kyvInvoiceAdminNew='1';button.className='kyv-invoice-admin-action';button.innerHTML='＋ Registra fattura';button.addEventListener('click',event=>{event.preventDefault();openNewInvoice(pid,meta.title,meta.artist);});const heading=[...card.querySelectorAll('h3')].find(node=>/fatture collegate/i.test(text(node.textContent)));heading?.insertAdjacentElement('afterend',button);}
  if(contextInvoices===null)return true;
  [...card.querySelectorAll('tbody tr')].forEach(row=>{if(row.dataset.kyvInvoiceEditable==='1')return;const invoiceId=text(row.dataset.invoiceId);if(!invoiceId)return;const invoice=(contextInvoices||[]).find(item=>text(item.ID_FT)===invoiceId);if(!invoice)return;row.dataset.kyvInvoiceEditable='1';row.classList.add('kyv-invoice-editable');row.title='Apri e modifica la fattura';row.addEventListener('click',event=>{if(event.target.closest('a,button'))return;openExistingInvoice(invoice.ID_FT);});});return true;
}
function wireScheda(){
  // Changing the picker selection must refresh invoices even when two projects share the same title.
  document.addEventListener('kyv:project-selected',event=>{
    const id=text(event.detail?.projectId);
    if(id)refreshContext(id);
  });
  const admin=document.getElementById('tab-admin');if(admin&&!adminObserver){adminObserver=new MutationObserver(()=>enhanceSchedaAdmin());adminObserver.observe(admin,{childList:true,subtree:false});}const hero=document.getElementById('hero-title');if(hero&&!heroInvoiceObserver){heroInvoiceObserver=new MutationObserver(()=>setTimeout(()=>refreshContext(currentProjectId()),0));heroInvoiceObserver.observe(hero,{childList:true,characterData:true,subtree:true});}}
async function maybeOpenNewFromUrl(){if(page!=='scheda_progetto.html')return;const u=new URL(location.href);if(u.searchParams.get('newInvoice')!=='1')return;const pid=text(u.searchParams.get('id'));if(!pid)return;const ready=()=>document.getElementById('hero-title')&&!document.getElementById('project-view')?.classList.contains('hidden');for(let i=0;i<30&&!ready();i++)await new Promise(resolve=>setTimeout(resolve,150));const meta=projectMetaFromScheda();await openNewInvoice(pid,meta.title,meta.artist);u.searchParams.delete('newInvoice');history.replaceState(history.state,'',`${u.pathname}${u.search}${u.hash}`);}
function wireContextChanges(){if(page==='ascolto.html')document.addEventListener('click',event=>{const button=event.target.closest('#kyv-listen-projects [data-project]');if(!button)return;setTimeout(()=>refreshContext(button.dataset.project),50);});}
async function boot(){injectStyles();try{if(page==='progetti.html'){for(let i=0;i<30&&!wireProjectList();i++)await new Promise(resolve=>setTimeout(resolve,150));await loadListData();return;}wireContextChanges();if(page==='scheda_progetto.html')wireScheda();const pid=currentProjectId();if(pid){await refreshContext(pid);scheduleContextMount(pid);}if(page==='scheda_progetto.html')await maybeOpenNewFromUrl();}catch(error){console.warn('[KYV Invoices] Avvio non riuscito',error);}}

window.addEventListener('beforeunload',()=>{listObserver?.disconnect();adminObserver?.disconnect();heroInvoiceObserver?.disconnect();clearTimeout(mountTimer);},{once:true});
window.KYV_PROJECT_INVOICES={refresh:refreshContext,openNew:openNewInvoice,openExisting:openExistingInvoice};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
