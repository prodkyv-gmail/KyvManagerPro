/* KYV Project Finance Summary — fattura e incasso subito visibili nella Scheda Progetto. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

let db=null;
let refreshTimer=null;
let refreshToken=0;
let heroObserver=null;
let lastFingerprint='';

function text(v){return String(v??'').trim();}
function H(v){if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(v??'');return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function paid(row){if(window.KYV&&typeof KYV.isPaid==='function')return KYV.isPaid(row?.PAGATA)||KYV.isPaid(row?.PAGAMENTO);return /^(SI|SÌ|YES|PAGAT|INCASSAT)/i.test(text(row?.PAGATA||row?.PAGAMENTO));}
function numberValue(value){if(window.KYV&&typeof KYV.parseNumber==='function')return KYV.parseNumber(value)||0;if(typeof value==='number')return Number.isFinite(value)?value:0;const n=Number(String(value??'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
function amount(row){return numberValue(row?.ImportoTotaleDocumento??row?.PrezzoTotale??row?.PrezzoUnitario??row?.ImportoPagamento??0);}
function euro(value){return window.KYV?.formatEuro?KYV.formatEuro(value):new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(value)||0);}
function date(value){return value?(window.KYV?.formatDate?KYV.formatDate(value,'-'):new Date(value).toLocaleDateString('it-IT')):'-';}
function projectId(){const badge=text(document.getElementById('hero-badges')?.textContent).match(/\bID\s+(\d+)\b/i)?.[1];if(badge)return badge;return text(new URLSearchParams(location.search).get('id'));}
function projectMeta(){return{title:text(document.getElementById('hero-title')?.textContent),artist:text(document.getElementById('hero-artist')?.textContent)};}
function key(row){return text(row?.ID_FT);}
function unique(rows){const map=new Map();(rows||[]).forEach((row,index)=>map.set(key(row)||`row-${index}`,row));return[...map.values()];}
const fields='ID_FT,Numero,Data,Denominazione,Descrizione,ImportoTotaleDocumento,PrezzoUnitario,PrezzoTotale,ImportoPagamento,PAGATA,ID_PROGETTO';

async function fetchInvoices(pid){
  if(!client())return null;
  try{
    const direct=await client().from('FATTURE').select(fields).eq('ID_PROGETTO',pid).order('Data',{ascending:false}).limit(200);
    if(direct.error)throw direct.error;
    if((direct.data||[]).length)return unique(direct.data);
    const project=await client().from('PROGETTI').select('ID,IDFT').eq('ID',pid).maybeSingle();
    if(project.error)throw project.error;
    if(!project.data||!text(project.data.IDFT))return [];
    const legacy=await client().from('FATTURE').select(fields).eq('ID_FT',project.data.IDFT).limit(5);
    if(legacy.error)throw legacy.error;
    return unique((legacy.data||[]).filter(row=>!text(row.ID_PROGETTO)||text(row.ID_PROGETTO)===text(pid)));
  }catch(error){console.warn('[KYV Finance Summary] Lettura fatture non riuscita',error);return null;}
}

function ensureStyle(){
  if(document.getElementById('kyv-project-finance-summary-style'))return;
  const style=document.createElement('style');style.id='kyv-project-finance-summary-style';style.textContent=`
#kyv-project-finance-summary{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr) auto;gap:.8rem;align-items:stretch;padding:1rem 1.1rem;border:1px solid rgba(148,163,184,.13);background:linear-gradient(135deg,rgba(21,25,35,.96),rgba(15,17,26,.92));border-radius:1rem;box-shadow:0 16px 42px rgba(0,0,0,.14)}.kyv-finance-block{min-width:0;padding:.75rem .85rem;border-radius:.85rem;border:1px solid rgba(148,163,184,.10);background:rgba(255,255,255,.025)}.kyv-finance-label{font-size:.61rem;line-height:1;text-transform:uppercase;letter-spacing:.11em;font-weight:900;color:#94a3b8}.kyv-finance-value{display:block;margin-top:.38rem;color:#fff;font-size:.95rem;font-weight:900;line-height:1.3;overflow-wrap:anywhere}.kyv-finance-meta{display:block;margin-top:.28rem;color:#94a3b8;font-size:.67rem;line-height:1.35;overflow-wrap:anywhere}.kyv-finance-state{display:inline-flex;align-items:center;gap:.35rem;margin-top:.38rem;padding:.32rem .5rem;border-radius:999px;font-size:.68rem;font-weight:900;border:1px solid rgba(255,255,255,.10)}.kyv-finance-paid{color:#a7f3d0;background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.22)}.kyv-finance-open{color:#fecaca;background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.22)}.kyv-finance-none{color:#fde68a;background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.22)}.kyv-finance-error{color:#fecaca;background:rgba(244,63,94,.07);border-color:rgba(244,63,94,.20)}.kyv-finance-actions{display:flex;flex-direction:column;justify-content:center;gap:.45rem;min-width:154px}.kyv-finance-btn{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;padding:.58rem .7rem;border-radius:.75rem;border:1px solid rgba(99,102,241,.28);background:rgba(99,102,241,.11);color:#e0e7ff;font-size:.7rem;font-weight:900}.kyv-finance-btn:hover{background:rgba(99,102,241,.19);color:#fff}.kyv-finance-btn.secondary{border-color:rgba(148,163,184,.13);background:rgba(255,255,255,.035);color:#cbd5e1}@media(max-width:900px){#kyv-project-finance-summary{grid-template-columns:1fr 1fr}.kyv-finance-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;min-width:0}}@media(max-width:560px){#kyv-project-finance-summary{grid-template-columns:1fr}.kyv-finance-actions{grid-column:auto;grid-template-columns:1fr}}
`;document.head.appendChild(style);
}
function host(){const view=document.getElementById('project-view');if(!view)return null;return[...view.children].find(node=>node.matches?.('section.kyv-card'))||null;}
function stateFor(rows){
  rows=unique(rows).sort((a,b)=>new Date(b.Data||0)-new Date(a.Data||0));
  if(!rows.length)return{rows,total:0,paidTotal:0,openTotal:0,paidCount:0,invoice:'Non emessa',invoiceMeta:'Nessuna fattura collegata al progetto',payment:'Da emettere',kind:'none'};
  const total=rows.reduce((s,row)=>s+amount(row),0);const paidRows=rows.filter(paid);const paidTotal=paidRows.reduce((s,row)=>s+amount(row),0);const openTotal=Math.max(0,total-paidTotal);const latest=rows[0];
  const invoice=rows.length===1?`Fattura ${text(latest.Numero)||text(latest.ID_FT)||'—'}`:`${rows.length} fatture`;
  const invoiceMeta=rows.length===1?`${date(latest.Data)} · ${euro(amount(latest))}`:`Totale ${euro(total)} · ultima ${text(latest.Numero)||text(latest.ID_FT)||'—'} del ${date(latest.Data)}`;
  const allPaid=paidRows.length===rows.length;const payment=allPaid?(rows.length===1?'Incassata':'Tutte incassate'):(paidRows.length?`${paidRows.length}/${rows.length} incassate`:'Da incassare');
  return{rows,total,paidTotal,openTotal,paidCount:paidRows.length,invoice,invoiceMeta,payment,kind:allPaid?'paid':'open'};
}
function fingerprint(pid,rows){return rows===null?`${pid}|read-error`:JSON.stringify([pid,unique(rows).map(row=>[row.ID_FT,row.Numero,row.Data,row.ImportoTotaleDocumento,row.PrezzoTotale,row.PrezzoUnitario,row.ImportoPagamento,row.PAGATA,row.ID_PROGETTO])]);}
function mount(rows,pid){
  const anchor=host();if(!anchor)return false;const fp=fingerprint(pid,rows);const existing=document.getElementById('kyv-project-finance-summary');if(existing&&fp===lastFingerprint)return true;lastFingerprint=fp;
  let panel=existing;if(!panel){panel=document.createElement('section');panel.id='kyv-project-finance-summary';anchor.insertAdjacentElement('afterend',panel);}
  if(rows===null){
    panel.innerHTML='<div class="kyv-finance-block"><span class="kyv-finance-label">Fattura</span><strong class="kyv-finance-value">Stato non disponibile</strong><span class="kyv-finance-meta">La lettura delle fatture non è riuscita. Non viene dedotto che la fattura sia assente.</span></div><div class="kyv-finance-block"><span class="kyv-finance-label">Pagamento</span><span class="kyv-finance-state kyv-finance-error">⚠ Da verificare</span><span class="kyv-finance-meta">Riprova l’aggiornamento prima di registrare nuovi documenti.</span></div><div class="kyv-finance-actions"><button type="button" class="kyv-finance-btn" data-kyv-finance-admin>Amministrazione</button></div>';
  }else{
    const data=stateFor(rows);const paymentMeta=data.kind==='none'?'Quando la emetti, registrala direttamente da qui.':data.kind==='paid'?`Incassato ${euro(data.paidTotal)}`:`Residuo da incassare ${euro(data.openTotal)}`;
    panel.innerHTML=`<div class="kyv-finance-block"><span class="kyv-finance-label">Fattura</span><strong class="kyv-finance-value">${H(data.invoice)}</strong><span class="kyv-finance-meta">${H(data.invoiceMeta)}</span></div><div class="kyv-finance-block"><span class="kyv-finance-label">Pagamento</span><span class="kyv-finance-state kyv-finance-${data.kind}">${data.kind==='paid'?'✓':data.kind==='open'?'●':'○'} ${H(data.payment)}</span><span class="kyv-finance-meta">${H(paymentMeta)}</span></div><div class="kyv-finance-actions"><button type="button" class="kyv-finance-btn" data-kyv-finance-admin>Apri amministrazione</button><button type="button" class="kyv-finance-btn secondary" data-kyv-finance-new>＋ Registra fattura</button></div>`;
  }
  panel.querySelector('[data-kyv-finance-admin]')?.addEventListener('click',()=>{if(typeof window.setTab==='function')window.setTab('amministrazione');setTimeout(()=>document.getElementById('tab-admin')?.scrollIntoView({behavior:'smooth',block:'start'}),60);});
  panel.querySelector('[data-kyv-finance-new]')?.addEventListener('click',()=>{const meta=projectMeta();if(window.KYV_PROJECT_INVOICES?.openNew)KYV_PROJECT_INVOICES.openNew(pid,meta.title,meta.artist);else location.href=`scheda_progetto.html?id=${encodeURIComponent(pid)}&tab=amministrazione&newInvoice=1`;});
  return true;
}
async function refresh(){clearTimeout(refreshTimer);const pid=projectId();if(!pid)return;const token=++refreshToken;const rows=await fetchInvoices(pid);if(token!==refreshToken||pid!==projectId())return;mount(rows,pid);}
function schedule(delay=80){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,delay);}
function watch(){const target=document.getElementById('hero-badges')||document.getElementById('hero-title');if(!target||heroObserver)return false;heroObserver=new MutationObserver(()=>{lastFingerprint='';schedule(60);});heroObserver.observe(target,{childList:true,subtree:true,characterData:true});return true;}
function boot(){ensureStyle();const timer=setInterval(()=>{if(watch()){clearInterval(timer);schedule(0);}},100);setTimeout(()=>{clearInterval(timer);watch();schedule(0);},5000);window.addEventListener('kyv:project-v2-ready',()=>{lastFingerprint='';schedule(40);});window.addEventListener('kyv:pitch-updated',()=>schedule(80));window.addEventListener('kyv:invoice-updated',()=>{lastFingerprint='';schedule(20);});window.addEventListener('beforeunload',()=>heroObserver?.disconnect(),{once:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();