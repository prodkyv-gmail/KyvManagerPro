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
function amount(row){return window.KYV_INVOICE_LINE?.amount(row)??Math.max(0,numberValue(row?.PrezzoUnitario));}
function euro(value){return window.KYV?.formatEuro?KYV.formatEuro(value):new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(value)||0);}
function date(value){return value?(window.KYV?.formatDate?KYV.formatDate(value,'-'):new Date(value).toLocaleDateString('it-IT')):'-';}
function projectId(){const badge=text(document.getElementById('hero-badges')?.textContent).match(/\bID\s+(\d+)\b/i)?.[1];if(badge)return badge;return text(new URLSearchParams(location.search).get('id'));}
function projectMeta(){return{title:text(document.getElementById('hero-title')?.textContent),artist:text(document.getElementById('hero-artist')?.textContent)};}
function currentProject(pid){try{const project=typeof state!=='undefined'?state?.currentView?.p:null;return project&&text(project.ID)===text(pid)?project:null;}catch(_){return null;}}
function completedProject(project){const status=text(project?.STATO).toLowerCase().trim();return !/\b(?:non\s+completat[oa]|da\s+completare|non\s+pubblicat[oa]|incomplet[oa])\b/.test(status)&&/\b(?:pubblicat[oa]|chius[oa]|completat[oa]|finit[oa])\b/.test(status);}
function awaitingInvoice(project,rows){return !!project&&Array.isArray(rows)&&rows.length===0&&completedProject(project);}
function key(row){return text(row?.ID_FT);}
function unique(rows){const map=new Map();(rows||[]).forEach((row,index)=>map.set(key(row)||`row-${index}`,row));return[...map.values()];}
const fields='ID_FT,Numero,Data,Denominazione,Descrizione,ImportoTotaleDocumento,PrezzoUnitario,PrezzoTotale,ImportoPagamento,PAGATA,ID_PROGETTO,XML_SHA256';

async function fetchInvoices(pid){
  if(!client())return null;
  try{
    const direct=await client().from('FATTURE').select(fields).eq('ID_PROGETTO',pid).order('Data',{ascending:false}).limit(200);
    if(direct.error)throw direct.error;
    // v2.47: explicit allocation rows take precedence over the historical single ID_PROGETTO.
    const shares=await client().from('FATTURE_RIPARTIZIONI').select('id_ft,prezzo_unitario')
      .eq('id_progetto',pid).limit(1000);
    if(shares.error)throw shares.error;
    const shareById=new Map();
    for(const r of shares.data||[])shareById.set(text(r.id_ft),(shareById.get(text(r.id_ft))||0)+Number(r.prezzo_unitario));
    const ids=[...shareById.keys()];
    const shared=ids.length?await client().from('FATTURE').select(fields).in('ID_FT',ids).limit(1000):{data:[],error:null};
    if(shared.error)throw shared.error;
    if((shared.data||[]).length!==ids.length)throw Error('Fatture ripartite non leggibili interamente');
    const relevantDirect=direct.data||[];
    const directIds=relevantDirect.map(r=>r.ID_FT);
    const allShare=directIds.length?await client().from('FATTURE_RIPARTIZIONI').select('id_ft').in('id_ft',directIds).limit(1000):{data:[],error:null};
    if(allShare.error)throw allShare.error;
    const splitIds=new Set((allShare.data||[]).map(a=>text(a.id_ft)));
    const explicit=(shared.data||[]).map(f=>({...f,PrezzoUnitario:String(shareById.get(text(f.ID_FT))),PrezzoTotale:String(shareById.get(text(f.ID_FT))),XML_SHA256:null,_v247_shared:true}));
    const legacyDirect=relevantDirect.filter(f=>!splitIds.has(text(f.ID_FT)));
    if(explicit.length||legacyDirect.length)return unique([...explicit,...legacyDirect]);
    const project=await client().from('PROGETTI').select('ID,IDFT').eq('ID',pid).maybeSingle();
    if(project.error)throw project.error;
    if(!project.data||!text(project.data.IDFT))return [];
    const legacy=await client().from('FATTURE').select(fields).eq('ID_FT',project.data.IDFT).limit(5);
    if(legacy.error)throw legacy.error;
    const own=(legacy.data||[]).filter(row=>!text(row.ID_PROGETTO)||text(row.ID_PROGETTO)===text(pid));
    // Fattura citata da IDFT ma intestata a un altro progetto e senza quote: si mostra, con quota da ripartire.
    const foreign=(legacy.data||[]).filter(row=>text(row.ID_PROGETTO)&&text(row.ID_PROGETTO)!==text(pid));
    let quoted=new Set();
    if(foreign.length){const q=await client().from('FATTURE_RIPARTIZIONI').select('id_ft').in('id_ft',foreign.map(row=>row.ID_FT)).limit(1000);if(q.error)throw q.error;quoted=new Set((q.data||[]).map(a=>text(a.id_ft)));}
    const idftShared=foreign.filter(row=>!quoted.has(text(row.ID_FT))).map(row=>({...row,PrezzoUnitario:'0',PrezzoTotale:'0',ImportoPagamento:null,XML_SHA256:null,_idft_shared:true}));
    return unique([...own,...idftShared]);
  }catch(error){console.warn('[KYV Finance Summary] Lettura fatture non riuscita',error);return null;}
}

function ensureStyle(){
  if(document.getElementById('kyv-project-finance-summary-style'))return;
  const style=document.createElement('style');style.id='kyv-project-finance-summary-style';style.textContent=`
#kyv-project-finance-summary{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr) auto;gap:.8rem;align-items:stretch;padding:1rem 1.1rem;border:1px solid rgba(148,163,184,.13);background:linear-gradient(135deg,rgba(21,25,35,.96),rgba(15,17,26,.92));border-radius:1rem;box-shadow:0 16px 42px rgba(0,0,0,.14)}.kyv-finance-block{min-width:0;padding:.75rem .85rem;border-radius:.85rem;border:1px solid rgba(148,163,184,.10);background:rgba(255,255,255,.025)}.kyv-finance-label{font-size:.61rem;line-height:1;text-transform:uppercase;letter-spacing:.11em;font-weight:900;color:#94a3b8}.kyv-finance-value{display:block;margin-top:.38rem;color:#fff;font-size:.95rem;font-weight:900;line-height:1.3;overflow-wrap:anywhere}.kyv-finance-meta{display:block;margin-top:.28rem;color:#94a3b8;font-size:.67rem;line-height:1.35;overflow-wrap:anywhere}.kyv-finance-state{display:inline-flex;align-items:center;gap:.35rem;margin-top:.38rem;padding:.32rem .5rem;border-radius:999px;font-size:.68rem;font-weight:900;border:1px solid rgba(255,255,255,.10)}.kyv-finance-paid{color:#a7f3d0;background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.22)}.kyv-finance-open{color:#fecaca;background:rgba(244,63,94,.08);border-color:rgba(244,63,94,.22)}.kyv-finance-none{color:#fde68a;background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.22)}.kyv-finance-error{color:#fecaca;background:rgba(244,63,94,.07);border-color:rgba(244,63,94,.20)}.kyv-finance-actions{display:flex;flex-direction:column;justify-content:center;gap:.45rem;min-width:154px}.kyv-finance-btn{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;padding:.58rem .7rem;border-radius:.75rem;border:1px solid rgba(99,102,241,.28);background:rgba(99,102,241,.11);color:#e0e7ff;font-size:.7rem;font-weight:900}.kyv-finance-btn:hover{background:rgba(99,102,241,.19);color:#fff}.kyv-finance-btn.secondary{border-color:rgba(148,163,184,.13);background:rgba(255,255,255,.035);color:#cbd5e1}@media(max-width:900px){#kyv-project-finance-summary{grid-template-columns:1fr 1fr}.kyv-finance-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;min-width:0}}@media(max-width:560px){#kyv-project-finance-summary{grid-template-columns:1fr}.kyv-finance-actions{grid-column:auto;grid-template-columns:1fr}}
.kyv-finance-reminder{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.92rem 1rem;border:1px solid rgba(245,158,11,.3);background:rgba(245,158,11,.075);border-radius:.85rem}.kyv-finance-reminder>div{min-width:0}.kyv-finance-reminder-label{display:block;color:#fcd34d;font-size:.62rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.kyv-finance-reminder strong{display:block;margin-top:.25rem;color:#fff;font-size:.9rem}.kyv-finance-reminder p{margin-top:.3rem;color:#cbd5e1;font-size:.72rem;line-height:1.5}.kyv-finance-reminder [data-kyv-finance-new]{background:rgba(245,158,11,.17);border-color:rgba(245,158,11,.4);color:#fef3c7;flex-shrink:0}.kyv-finance-manual{font-size:.67rem;line-height:1.3;text-align:center;text-decoration:underline;text-underline-offset:2px;color:#bfdbfe}@media(max-width:680px){.kyv-finance-reminder{flex-direction:column;align-items:stretch}.kyv-finance-reminder [data-kyv-finance-new]{width:100%}}
`;document.head.appendChild(style);
}
function host(){const view=document.getElementById('project-view');if(!view)return null;return[...view.children].find(node=>node.matches?.('section.kyv-card'))||null;}
function stateFor(rows){
  rows=unique(rows).sort((a,b)=>new Date(b.Data||0)-new Date(a.Data||0));
  if(!rows.length)return{rows,total:0,paidTotal:0,openTotal:0,paidCount:0,invoice:'Non emessa',invoiceMeta:'Nessuna fattura collegata al progetto',payment:'Da emettere',kind:'none'};
  const total=rows.reduce((s,row)=>s+amount(row),0);const shared=rows.some(row=>row._v247_shared||row._idft_shared);const paidRows=rows.filter(row=>!row._v247_shared&&!row._idft_shared&&paid(row));const paidTotal=paidRows.reduce((s,row)=>s+amount(row),0);const openTotal=Math.max(0,total-paidTotal);const latest=rows[0];
  const invoice=rows.length===1?`Fattura ${text(latest.Numero)||text(latest.ID_FT)||'—'}`:`${rows.length} fatture`;
  const invoiceMeta=rows.length===1?(latest._idft_shared?`${date(latest.Data)} · condivisa con altri progetti, quota da ripartire`:`${date(latest.Data)} · ${euro(amount(latest))}`):`Totale ${euro(total)} · ultima ${text(latest.Numero)||text(latest.ID_FT)||'—'} del ${date(latest.Data)}`;
  const allPaid=!shared&&paidRows.length===rows.length;const payment=shared?'Quote incasso da attribuire':allPaid?(rows.length===1?'Incassata':'Tutte incassate'):(paidRows.length?`${paidRows.length}/${rows.length} incassate`:'Da incassare');
  return{rows,total,paidTotal,openTotal,paidCount:paidRows.length,invoice,invoiceMeta,payment,kind:allPaid?'paid':'open',shared};
}
function fingerprint(pid,rows){const status=text(currentProject(pid)?.STATO);return rows===null?`${pid}|${status}|read-error`:JSON.stringify([pid,status,unique(rows).map(row=>[row.ID_FT,row.Numero,row.Data,row.ImportoTotaleDocumento,row.PrezzoTotale,row.PrezzoUnitario,row.ImportoPagamento,row.PAGATA,row.ID_PROGETTO,row._idft_shared?1:0])]);}
function mount(rows,pid){
  const anchor=host();if(!anchor)return false;const fp=fingerprint(pid,rows);const existing=document.getElementById('kyv-project-finance-summary');if(existing&&fp===lastFingerprint)return true;lastFingerprint=fp;
  let panel=existing;if(!panel){panel=document.createElement('section');panel.id='kyv-project-finance-summary';anchor.insertAdjacentElement('afterend',panel);}
  if(rows===null){
    panel.innerHTML='<div class="kyv-finance-block"><span class="kyv-finance-label">Fattura</span><strong class="kyv-finance-value">Stato non disponibile</strong><span class="kyv-finance-meta">La lettura delle fatture non è riuscita. Non viene dedotto che la fattura sia assente.</span></div><div class="kyv-finance-block"><span class="kyv-finance-label">Pagamento</span><span class="kyv-finance-state kyv-finance-error">⚠ Da verificare</span><span class="kyv-finance-meta">Riprova l’aggiornamento prima di registrare nuovi documenti.</span></div><div class="kyv-finance-actions"><button type="button" class="kyv-finance-btn" data-kyv-finance-admin>Amministrazione</button></div>';
  }else{
    const data=stateFor(rows),pending=awaitingInvoice(currentProject(pid),rows);const paymentMeta=data.kind==='none'?'Quando la emetti, registrala direttamente da qui.':data.shared?'Incasso della fattura non attribuito ai singoli progetti.':data.kind==='paid'?`Incassato ${euro(data.paidTotal)}`:`Residuo da incassare ${euro(data.openTotal)}`;
    const reminder=pending?`<div class="kyv-finance-reminder" role="status"><div><span class="kyv-finance-reminder-label">Da fatturare</span><strong>Progetto completato · Fattura da emettere</strong><p>Nessuna fattura collegata. Puoi registrarla con il progetto già selezionato, oppure collegare manualmente una fattura esistente. Nessun invio allo SdI viene eseguito da questa schermata.</p></div><button type="button" class="kyv-finance-btn" data-kyv-finance-new>Crea fattura collegata</button></div>`:'';
    const register=pending?'':'<button type="button" class="kyv-finance-btn secondary" data-kyv-finance-new>＋ Registra fattura</button>';
    const splitBtn='<button type="button" class="kyv-finance-btn secondary" data-kyv-finance-split title="Una sola fattura divisa su più progetti, con la descrizione di ciascuno">Fattura su più progetti</button>';
    panel.innerHTML=`${reminder}<div class="kyv-finance-block"><span class="kyv-finance-label">Fattura</span><strong class="kyv-finance-value">${H(data.invoice)}</strong><span class="kyv-finance-meta">${H(data.invoiceMeta)}</span></div><div class="kyv-finance-block"><span class="kyv-finance-label">Pagamento</span><span class="kyv-finance-state kyv-finance-${data.kind}">${data.kind==='paid'?'✓':data.kind==='open'?'●':'○'} ${H(data.payment)}</span><span class="kyv-finance-meta">${H(paymentMeta)}</span></div><div class="kyv-finance-actions"><button type="button" class="kyv-finance-btn" data-kyv-finance-admin>Apri amministrazione</button>${register}${splitBtn}<a class="kyv-finance-manual" data-kyv-finance-manual href="fatture.html?ripartizione_progetto=${encodeURIComponent(pid)}">Aggiungi quota a fattura esistente / Duplica riga</a></div>`;
  }
  panel.querySelector('[data-kyv-finance-admin]')?.addEventListener('click',()=>{if(typeof window.setTab==='function')window.setTab('amministrazione');setTimeout(()=>document.getElementById('tab-admin')?.scrollIntoView({behavior:'smooth',block:'start'}),60);});
  panel.querySelector('[data-kyv-finance-split]')?.addEventListener('click',()=>{location.href=`fatture.html?ripartizione_progetto=${encodeURIComponent(pid)}`;});
  panel.querySelector('[data-kyv-finance-new]')?.addEventListener('click',()=>{const meta=projectMeta();if(window.KYV_PROJECT_INVOICES?.openNew)KYV_PROJECT_INVOICES.openNew(pid,meta.title,meta.artist);else location.href=`scheda_progetto.html?id=${encodeURIComponent(pid)}&tab=amministrazione&newInvoice=1`;});
  return true;
}
async function refresh(){clearTimeout(refreshTimer);const pid=projectId();if(!pid)return;const token=++refreshToken;const rows=await fetchInvoices(pid);if(token!==refreshToken||pid!==projectId())return;mount(rows,pid);}
function schedule(delay=80){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,delay);}
function watch(){const target=document.getElementById('hero-badges')||document.getElementById('hero-title');if(!target||heroObserver)return false;heroObserver=new MutationObserver(()=>{lastFingerprint='';schedule(60);});heroObserver.observe(target,{childList:true,subtree:true,characterData:true});return true;}
function boot(){ensureStyle();const timer=setInterval(()=>{if(watch()){clearInterval(timer);schedule(0);}},100);setTimeout(()=>{clearInterval(timer);watch();schedule(0);},5000);window.addEventListener('kyv:project-v2-ready',()=>{lastFingerprint='';schedule(40);});window.addEventListener('kyv:pitch-updated',()=>schedule(80));window.addEventListener('kyv:invoice-updated',()=>{lastFingerprint='';schedule(20);});window.addEventListener('beforeunload',()=>heroObserver?.disconnect(),{once:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();