/* KYV Economy v6 — cruscotto economico professionale, sola lettura. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='fatture.html')return;

let db=null,lastData=null,loadGeneration=0;
const text=v=>String(v??'').trim();
const H=v=>window.KYV?.safeHtml?KYV.safeHtml(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{if(window.KYV?.parseNumber)return KYV.parseNumber(v)||0;const n=Number(String(v??'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;};
const euro=v=>window.KYV?.formatEuro?KYV.formatEuro(v):new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const paid=v=>window.KYV?.isPaid?KYV.isPaid(v):/^(si|sì|yes|true|1|pagat|incassat)/i.test(text(v));
const done=p=>/uscita|pubblicat|completat|chius|finita/i.test(text(p?.STATO)+' '+text(p?.SVILUPPO));
const invoiceAmount=f=>window.KYV_INVOICE_LINE?.amount(f)??Math.max(0,num(f?.PrezzoUnitario));
const feeAmount=p=>num(p?.FEE);
const yearOf=v=>{const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d.getFullYear():null;};
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function projectInvoices(p,invoices){
 const pid=text(p.ID),idft=text(p.IDFT);
 const direct=invoices.filter(f=>text(f.ID_PROGETTO)===pid);
 const byInvoiceId=idft?invoices.filter(f=>text(f.ID_FT)===idft):[];
 return direct.length?direct:byInvoiceId.filter(f=>!text(f.ID_PROGETTO)||text(f.ID_PROGETTO)===pid);
}
function yearMatch(row,year,field){return year==='all'||yearOf(row?.[field])===Number(year);}
function projectYearMatch(p,year){if(year==='all')return true;return [p.Data_Pubblicazione,p.Data_Consegna_Master,p.Data_Sessione].some(v=>yearOf(v)===Number(year));}
function compute(projects,invoices,costs,year,invoiceSplits=[]){
 const inv=invoices.filter(f=>yearMatch(f,year,'Data'));
 const sp=costs.filter(s=>yearMatch(s,year,'Data'));
 const fatturato=inv.reduce((s,f)=>s+invoiceAmount(f),0);
 const paidRows=inv.filter(f=>{const v=window.KYV_COLLECTIONS_V236?.paymentState(f);return v?v.kind==='paid':paid(f.PAGATA);});
 const incassato=inv.reduce((s,f)=>{const v=window.KYV_COLLECTIONS_V236?.paymentState(f);return s+(v?v.received:(paid(f.PAGATA)?invoiceAmount(f):0));},0);
 const openRows=inv.filter(f=>{const v=window.KYV_COLLECTIONS_V236?.paymentState(f);return v?v.remaining>0:!paid(f.PAGATA);});
 const daIncassare=openRows.reduce((s,f)=>{const v=window.KYV_COLLECTIONS_V236?.paymentState(f);return s+(v?v.remaining:invoiceAmount(f));},0);
 const costi=sp.reduce((s,r)=>s+num(r.Importo),0);
 const splitIds=new Set(invoiceSplits.map(x=>text(x.id_ft)));
 const billed=new Map();
 for(const x of invoiceSplits){const id=text(x.id_progetto);billed.set(id,(billed.get(id)||0)+num(x.prezzo_unitario));}
 for(const f of invoices){
  if(splitIds.has(text(f.ID_FT)))continue;
  if(text(f.ID_PROGETTO)){const id=text(f.ID_PROGETTO);billed.set(id,(billed.get(id)||0)+invoiceAmount(f));}
 }
 // Progetti che citano (IDFT) una fattura intestata a un altro progetto e senza quote: risultano fatturati per la loro fee,
 // altrimenti la stessa fattura verrebbe contata una volta sola e gli altri progetti resterebbero «da fatturare».
 const invoiceById=new Map(invoices.map(f=>[text(f.ID_FT),f]));
 for(const p of projects){
  const f=invoiceById.get(text(p.IDFT));if(!f||splitIds.has(text(f.ID_FT)))continue;
  const owner=text(f.ID_PROGETTO);if(!owner||owner===text(p.ID))continue;
  const id=text(p.ID);billed.set(id,(billed.get(id)||0)+feeAmount(p));
 }
 const candidates=projects.filter(p=>feeAmount(p)>0&&projectYearMatch(p,year))
  .map(p=>({...p,feePending:Math.max(0,Math.round((feeAmount(p)-(billed.get(text(p.ID))||0))*100)/100)}))
  .filter(p=>p.feePending>0);
 const closedMissing=candidates.filter(done),activeMissing=candidates.filter(p=>!done(p));
 const feeDaFatturare=candidates.reduce((s,p)=>s+p.feePending,0);
 return{inv,sp,fatturato,incassato,openRows,daIncassare,costi,margine:incassato-costi,candidates,closedMissing,activeMissing,feeDaFatturare,previsionale:daIncassare+feeDaFatturare};
}
function ensureStyles(){
 if(document.getElementById('kyv-economy-v6-style'))return;
 const s=document.createElement('style');s.id='kyv-economy-v6-style';s.textContent=`
#kyv-economy-v6{border:1px solid rgba(148,163,184,.12);background:linear-gradient(135deg,rgba(17,24,39,.95),rgba(15,17,26,.95));border-radius:1rem;padding:1rem}.kyv-econ-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.kyv-econ-head h3{font-size:1.05rem;font-weight:900;color:#fff}.kyv-econ-head p{font-size:.68rem;color:#94a3b8;margin-top:.25rem;max-width:52rem}.kyv-econ-select{background:#0f111a;border:1px solid #2b3242;color:#f8fafc;border-radius:.65rem;padding:.55rem .7rem;font-size:.72rem;font-weight:800}
.kyv-econ-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.55rem;margin-top:.8rem}.kyv-econ-card{border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.025);border-radius:.85rem;padding:.72rem;min-width:0}.kyv-econ-card span{display:block;color:#94a3b8;font-size:.56rem;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.kyv-econ-card strong{display:block;color:#fff;font-size:.95rem;margin-top:.24rem;overflow-wrap:anywhere}.kyv-econ-card em{display:block;font-style:normal;color:#64748b;font-size:.55rem;margin-top:.2rem}.kyv-econ-card.good strong{color:#a7f3d0}.kyv-econ-card.warn strong{color:#fde68a}.kyv-econ-card.bad strong{color:#fecdd3}
.kyv-econ-panels{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-top:.75rem}.kyv-econ-panel{border:1px solid rgba(148,163,184,.1);border-radius:.85rem;padding:.8rem;background:rgba(255,255,255,.02)}.kyv-econ-panel-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem}.kyv-econ-panel h4{font-size:.7rem;font-weight:900;color:#fff}.kyv-econ-panel-head span{font-size:.58rem;color:#94a3b8}.kyv-econ-list{display:grid;gap:.35rem;margin-top:.55rem}.kyv-econ-row{display:flex;justify-content:space-between;gap:.7rem;align-items:center;border-top:1px solid rgba(148,163,184,.08);padding-top:.45rem;font-size:.62rem}.kyv-econ-row:first-child{border-top:0;padding-top:0}.kyv-econ-row a{color:#c7d2fe;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kyv-econ-row span{color:#cbd5e1;font-weight:850;white-space:nowrap}.kyv-econ-empty{color:#64748b;font-size:.62rem;padding:.45rem 0}
@media(max-width:1100px){.kyv-econ-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.kyv-econ-head{flex-direction:column}.kyv-econ-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.kyv-econ-panels{grid-template-columns:1fr}}
`;document.head.appendChild(s);
}
function mount(){
 let root=document.getElementById('kyv-economy-v6');if(root)return root;
 const scroller=document.querySelector('main section > .flex-1.overflow-auto');if(!scroller)return null;
 root=document.createElement('section');root.id='kyv-economy-v6';scroller.insertAdjacentElement('afterbegin',root);return root;
}
function availableYears(invoices,costs){
 const years=[...new Set([...invoices.map(x=>yearOf(x.Data)),...costs.map(x=>yearOf(x.Data))].filter(Boolean))].sort((a,b)=>b-a);
 return years;
}
function rowProject(p){return `<div class="kyv-econ-row"><a href="scheda_progetto.html?id=${encodeURIComponent(p.ID)}">${H((text(p.ARTISTA)||'Artista')+' · '+(text(p.TITOLO)||'Senza titolo'))}</a><span>${H(euro(p.feePending??feeAmount(p)))}</span></div>`;}
function rowInvoice(f){return `<div class="kyv-econ-row"><a href="fatture.html#invoice-${H(f.ID_FT)}">${H('Fattura '+(text(f.Numero_Originale)||text(f.Numero)||'#'+text(f.ID_FT))+' · '+(text(f.Denominazione)||'Cliente'))}</a><span>${H(euro(invoiceAmount(f)))}</span></div>`;}
function render(year='all'){
 const root=mount();if(!root||!lastData)return;
 const {projects,invoices,costs,invoiceSplits}=lastData,r=compute(projects,invoices,costs,year,invoiceSplits),years=availableYears(invoices,costs);
 root.innerHTML=`<div class="kyv-econ-head"><div><p class="text-[9px] uppercase tracking-[.14em] font-black text-emerald-200">Economia</p><h3 class="mt-1">Controllo economico</h3><p>Vista gestionale in sola lettura. “Previsionale minimo” somma soltanto fatture ancora da incassare e fee registrate senza fattura: non stima royalties future.</p></div><select id="kyv-econ-year" class="kyv-econ-select"><option value="all">Tutto lo storico</option>${years.map(y=>`<option value="${y}" ${String(year)===String(y)?'selected':''}>${y}</option>`).join('')}</select></div>
 <div class="kyv-econ-grid">
  <div class="kyv-econ-card"><span>Fatturato</span><strong>${H(euro(r.fatturato))}</strong><em>${r.inv.length} fatture</em></div>
  <div class="kyv-econ-card good"><span>Incassato</span><strong>${H(euro(r.incassato))}</strong><em>${r.inv.filter(f=>{const v=window.KYV_COLLECTIONS_V236?.paymentState(f);return v?v.kind==='paid':paid(f.PAGATA);}).length} fatture incassate</em></div>
  <div class="kyv-econ-card ${r.daIncassare>0?'bad':'good'}"><span>Da incassare</span><strong>${H(euro(r.daIncassare))}</strong><em>${r.openRows.length} fatture aperte</em></div>
  <div class="kyv-econ-card"><span>Costi registrati</span><strong>${H(euro(r.costi))}</strong><em>${r.sp.length} movimenti</em></div>
  <div class="kyv-econ-card ${r.margine>=0?'good':'bad'}"><span>Margine incassato</span><strong>${H(euro(r.margine))}</strong><em>Incassato − costi</em></div>
  <div class="kyv-econ-card ${r.previsionale>0?'warn':'good'}"><span>Previsionale minimo</span><strong>${H(euro(r.previsionale))}</strong><em>Da incassare + fee da fatturare</em></div>
 </div>
 <div class="kyv-econ-panels">
  <div class="kyv-econ-panel"><div class="kyv-econ-panel-head"><h4>Fee da fatturare</h4><span>${r.candidates.length} progetti · ${H(euro(r.feeDaFatturare))}</span></div><div class="kyv-econ-list">${r.candidates.length?r.candidates.slice(0,6).map(rowProject).join(''):'<div class="kyv-econ-empty">Nessuna fee registrata senza fattura collegata.</div>'}</div></div>
  <div class="kyv-econ-panel"><div class="kyv-econ-panel-head"><h4>Controlli di chiusura</h4><span>${r.closedMissing.length} chiusi senza fattura</span></div><div class="kyv-econ-list">${r.closedMissing.length?r.closedMissing.slice(0,6).map(rowProject).join(''):(r.openRows.length?r.openRows.slice(0,6).map(rowInvoice).join(''):'<div class="kyv-econ-empty">Nessun progetto chiuso con fee privo di fattura e nessun incasso aperto.</div>')}</div></div>
 </div>`;
 root.querySelector('#kyv-econ-year')?.addEventListener('change',e=>render(e.target.value));
 if(window.lucide)lucide.createIcons({root});
}
async function load(){
 const token=++loadGeneration,root=mount();
 if(root)root.textContent='Verifica completa degli archivi economici in corso…';
 try{
  const c=client(),read=window.KYV_READ_GUARD_V282?.readComplete;
  if(!c||!read)throw Error('Client autenticato o lettura verificata non disponibile');
  // Fully read every source by unique ID: fixed LIMIT could silently distort totals.
  const [projects,invoices,costs,invoiceSplits]=await Promise.all([
   read(c,'PROGETTI','ID,TITOLO,ARTISTA,FEE,STATO,SVILUPPO,IDFT,Data_Sessione,Data_Consegna_Master,Data_Pubblicazione','ID'),
   read(c,'FATTURE','ID_FT,Numero,Numero_Originale,Data,Denominazione,ImportoTotaleDocumento,PrezzoUnitario,PrezzoTotale,ImportoPagamento,PAGATA,ID_PROGETTO,DataScadenzaPagamento,XML_SHA256','ID_FT'),
   read(c,'Spese Extra','ID_SPESE,Data,Descrizione,Categoria,Importo,ID_PROGETTO','ID_SPESE'),
   read(c,'FATTURE_RIPARTIZIONI','id,id_ft,id_progetto,prezzo_unitario','id')
  ]);
  if(token!==loadGeneration)return; // Stale requests never replace newer refreshes.
  lastData={projects,invoices,costs,invoiceSplits};render('all');
 }catch(error){
  if(token!==loadGeneration)return;
  lastData=null; // Never leave stale financial totals visible as current.
  console.warn('[KYV Economy v2.82] Archivio incompleto',error);
  if(root)root.textContent='Totali economici non disponibili: '+(error?.message||'lettura non completata')+'. Ricarica la pagina o verifica la fonte in KYV Analyst.';
 }
}
function boot(){ensureStyles();let n=0;const t=setInterval(()=>{n++;if(mount()){clearInterval(t);load();}else if(n>=25)clearInterval(t);},120);setTimeout(()=>clearInterval(t),3500);}
window.KYV_ECONOMY_V6={refresh:load,compute};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();