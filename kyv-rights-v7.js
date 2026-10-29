/* KYV Rights v7 — controllo professionale SIAE / IMAIE, sola lettura. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='rendiconto.html')return;

const KYV_IPI='884724692';
let db=null,data=null;
const text=v=>String(v??'').trim();
const H=v=>window.KYV?.safeHtml?KYV.safeHtml(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{if(window.KYV?.parseNumber)return KYV.parseNumber(v)||0;const n=Number(String(v??'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;};
const euro=v=>window.KYV?.formatEuro?KYV.formatEuro(v):new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const yearOf=v=>{const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d.getFullYear():null;};
const normTitle=v=>text(v).toLocaleUpperCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]/g,'');
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function amountForUs(row){return window.KYV_SIAE_AMOUNT?.forUs(row.IMPORTO)??-num(row.IMPORTO);}
function credited(row){return amountForUs(row)>0;}
function op(row){return text(row.OPERAZIONE).toLocaleUpperCase('it');}
function payment(row){return /VERSATI A SALDO/.test(op(row));}
function charge(row){return /RITENUT|BOLLO/.test(op(row));}
function ownRow(row){return text(row['Codice IPI'])===KYV_IPI;}
function published(p){return /uscita|pubblicat|release/i.test(text(p.STATO))||Boolean(text(p.Data_Pubblicazione));}
function years(rows){return [...new Set(rows.map(r=>yearOf(r.DATA)).filter(Boolean))].sort((a,b)=>b-a);}
function filterYear(rows,year){return year==='all'?rows:rows.filter(r=>yearOf(r.DATA)===Number(year));}
function groupWorks(vertical){
 const map=new Map();
 vertical.forEach(r=>{const key=text(r['Cod. Opera'])||normTitle(r.Titolo);if(!key)return;if(!map.has(key))map.set(key,{code:r['Cod. Opera'],title:r.Titolo,iswc:r['Codice ISWC'],rows:[],dem:0,drm:0});const g=map.get(key);g.rows.push(r);if(!g.title&&r.Titolo)g.title=r.Titolo;if(!g.iswc&&r['Codice ISWC'])g.iswc=r['Codice ISWC'];g.dem+=num(r['Quota DEM']);g.drm+=num(r['Quota DRM']);});
 return [...map.values()];
}
function compute(year='all'){
 const estratto=filterYear(data.estratto,year),works=groupWorks(data.vertical),mine=data.vertical.filter(ownRow);
 const credits=estratto.filter(credited).reduce((s,r)=>s+amountForUs(r),0);
 const paid=estratto.filter(payment).reduce((s,r)=>s+Math.max(0,amountForUs(r)),0);
 const charges=estratto.filter(charge).reduce((s,r)=>s+Math.max(0,-amountForUs(r)),0);
 const net=estratto.reduce((s,r)=>s+amountForUs(r),0);
 const myWorkMap=new Map();mine.forEach(r=>{const key=text(r['Cod. Opera'])||normTitle(r.Titolo);if(!myWorkMap.has(key))myWorkMap.set(key,r);});
 const myWorks=[...myWorkMap.values()];
 const avgDem=myWorks.length?myWorks.reduce((s,r)=>s+num(r['Quota DEM']),0)/myWorks.length:0;
 const avgDrm=myWorks.length?myWorks.reduce((s,r)=>s+num(r['Quota DRM']),0)/myWorks.length:0;
 const missingIswc=works.filter(w=>!text(w.iswc));
 const badShares=works.filter(w=>Math.abs(w.dem-100)>0.01||(w.drm>0&&Math.abs(w.drm-100)>0.01));
 const siaeKeys=new Set(data.siae.map(r=>normTitle(r.Titolo)).filter(Boolean));
 const imaieKeys=new Set(data.imaie.map(r=>normTitle(r.TITOLO_OPERA)).filter(Boolean));
 const pub=data.projects.filter(published);
 const noSiae=pub.filter(p=>{const k=normTitle(p.TITOLO);return k&&!siaeKeys.has(k);});
 const siaeMatched=pub.length-noSiae.length;
 const imaieMatched=pub.filter(p=>{const k=normTitle(p.TITOLO);return k&&imaieKeys.has(k);}).length;
 return{estratto,works,mine,myWorks,credits,paid,charges,net,avgDem,avgDrm,missingIswc,badShares,pub,noSiae,siaeMatched,imaieMatched};
}
function styles(){
 if(document.getElementById('kyv-rights-v7-style'))return;
 const s=document.createElement('style');s.id='kyv-rights-v7-style';s.textContent=`
#kyv-rights-v7{margin-bottom:1rem;border:1px solid rgba(148,163,184,.12);background:linear-gradient(135deg,rgba(17,24,39,.97),rgba(15,17,26,.97));border-radius:1rem;padding:1rem}.kyv-rights-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.kyv-rights-head h3{font-size:1.08rem;font-weight:900;color:#fff}.kyv-rights-head p{font-size:.68rem;color:#94a3b8;margin-top:.25rem;max-width:52rem}.kyv-rights-select{background:#0f111a;border:1px solid #2b3242;color:#f8fafc;border-radius:.65rem;padding:.55rem .7rem;font-size:.72rem;font-weight:800}
.kyv-rights-money,.kyv-rights-metrics{display:grid;gap:.55rem;margin-top:.75rem}.kyv-rights-money{grid-template-columns:repeat(4,minmax(0,1fr))}.kyv-rights-metrics{grid-template-columns:repeat(5,minmax(0,1fr))}.kyv-rights-card{border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.025);border-radius:.85rem;padding:.72rem;min-width:0}.kyv-rights-card span{display:block;color:#94a3b8;font-size:.55rem;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.kyv-rights-card strong{display:block;color:#fff;font-size:.94rem;margin-top:.24rem;overflow-wrap:anywhere}.kyv-rights-card em{display:block;color:#64748b;font-style:normal;font-size:.55rem;margin-top:.2rem}.kyv-rights-card.good strong{color:#a7f3d0}.kyv-rights-card.warn strong{color:#fde68a}.kyv-rights-card.bad strong{color:#fecdd3}
.kyv-rights-panels{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-top:.75rem}.kyv-rights-panel{border:1px solid rgba(148,163,184,.1);border-radius:.85rem;padding:.8rem;background:rgba(255,255,255,.02)}.kyv-rights-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.6rem}.kyv-rights-panel h4{font-size:.7rem;font-weight:900;color:#fff}.kyv-rights-panel p{font-size:.58rem;color:#64748b;margin-top:.18rem;line-height:1.4}.kyv-rights-panel-head b{font-size:.62rem;color:#cbd5e1;white-space:nowrap}.kyv-rights-list{display:grid;gap:.34rem;margin-top:.55rem}.kyv-rights-row{display:flex;justify-content:space-between;gap:.7rem;align-items:center;border-top:1px solid rgba(148,163,184,.08);padding-top:.43rem;font-size:.61rem}.kyv-rights-row:first-child{border-top:0;padding-top:0}.kyv-rights-row a{color:#c7d2fe;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kyv-rights-row span{color:#cbd5e1;font-weight:800;white-space:nowrap}.kyv-rights-empty{font-size:.62rem;color:#64748b;padding:.4rem 0}
@media(max-width:1100px){.kyv-rights-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.kyv-rights-money{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.kyv-rights-head{flex-direction:column}.kyv-rights-metrics,.kyv-rights-money{grid-template-columns:repeat(2,minmax(0,1fr))}.kyv-rights-panels{grid-template-columns:1fr}}
`;document.head.appendChild(s);
}
function mount(){
 let root=document.getElementById('kyv-rights-v7');if(root)return root;
 const scroller=document.querySelector('main section > div.p-4');if(!scroller)return null;
 root=document.createElement('section');root.id='kyv-rights-v7';scroller.insertAdjacentElement('afterbegin',root);return root;
}
function projectRow(p){return `<div class="kyv-rights-row"><a href="scheda_progetto.html?id=${encodeURIComponent(p.ID)}">${H((text(p.ARTISTA)||'Artista')+' · '+(text(p.TITOLO)||'Senza titolo'))}</a><span>verifica</span></div>`;}
function workRow(w){return `<div class="kyv-rights-row"><a href="editor.html?table=EXPORT%20SIAE%20VERTICALE">${H(text(w.title)||'Opera senza titolo')}</a><span>${H(text(w.code)||'—')}</span></div>`;}
function render(year='all'){
 const root=mount();if(!root||!data)return;
 const r=compute(year),ys=years(data.estratto);
 root.innerHTML=`<div class="kyv-rights-head"><div><p class="text-[9px] uppercase tracking-[.14em] font-black text-violet-200">Diritti</p><h3 class="mt-1">Controllo SIAE / IMAIE</h3><p>Separazione tra diritti accreditati, pagamenti a saldo e trattenute. Le corrispondenze con i progetti sono solo per titolo normalizzato: un mancato match significa “da verificare”, non “opera non depositata”.</p></div><div class="flex gap-2"><a href="importexport.html" class="kyv-chip">Import controllato</a><select id="kyv-rights-year" class="kyv-rights-select"><option value="all">Tutto lo storico</option>${ys.map(y=>`<option value="${y}" ${String(year)===String(y)?'selected':''}>${y}</option>`).join('')}</select></div></div>
 <div class="kyv-rights-money">
  <div class="kyv-rights-card good"><span>Diritti accreditati</span><strong>${H(euro(r.credits))}</strong><em>Segno − nell’estratto = positivo per noi</em></div>
  <div class="kyv-rights-card"><span>Versati a saldo</span><strong>${H(euro(r.paid))}</strong><em>Pagamenti registrati nell’estratto</em></div>
  <div class="kyv-rights-card warn"><span>Ritenute / bolli</span><strong>${H(euro(r.charges))}</strong><em>Trattenute e oneri</em></div>
  <div class="kyv-rights-card ${r.net<0?'warn':'good'}"><span>Movimento netto estratto</span><strong>${H(euro(r.net))}</strong><em>Segni invertiti rispetto all’estratto; non ricavo per opera</em></div>
 </div>
 <div class="kyv-rights-metrics">
  <div class="kyv-rights-card"><span>Opere SIAE</span><strong>${r.works.length}</strong><em>${data.vertical.length} righe aventi diritto</em></div>
  <div class="kyv-rights-card"><span>Repertorio KYV</span><strong>${r.myWorks.length}</strong><em>IPI ${KYV_IPI}</em></div>
  <div class="kyv-rights-card"><span>Quota media KYV DEM</span><strong>${r.avgDem.toFixed(1)}%</strong><em>DRM ${r.avgDrm.toFixed(1)}%</em></div>
  <div class="kyv-rights-card ${r.missingIswc.length?'warn':'good'}"><span>Opere senza ISWC</span><strong>${r.missingIswc.length}</strong><em>Da verificare sul repertorio</em></div>
  <div class="kyv-rights-card ${r.badShares.length?'bad':'good'}"><span>Quote incoerenti</span><strong>${r.badShares.length}</strong><em>Somma DEM/DRM per opera</em></div>
  <div class="kyv-rights-card"><span>Pubblicati ↔ SIAE</span><strong>${r.siaeMatched}/${r.pub.length}</strong><em>Match esatto titolo</em></div>
  <div class="kyv-rights-card ${r.noSiae.length?'warn':'good'}"><span>Da verificare SIAE</span><strong>${r.noSiae.length}</strong><em>Pubblicati senza match titolo esatto</em></div>
  <div class="kyv-rights-card"><span>Opere IMAIE</span><strong>${data.imaie.length}</strong><em>${r.imaieMatched} match esatti con pubblicati</em></div>
  <div class="kyv-rights-card"><span>Ruolo IMAIE</span><strong>${H(data.imaieRole||'—')}</strong><em>Dato presente nell’estratto</em></div>
  <div class="kyv-rights-card"><span>Ricavi per opera</span><strong>Non attribuibili</strong><em>L’estratto non contiene il titolo</em></div>
 </div>
 <div class="kyv-rights-panels">
  <div class="kyv-rights-panel"><div class="kyv-rights-panel-head"><div><h4>Progetti pubblicati da verificare in SIAE</h4><p>Confronto conservativo per titolo; differenze di naming possono produrre falsi mancati match.</p></div><b>${r.noSiae.length}</b></div><div class="kyv-rights-list">${r.noSiae.length?r.noSiae.slice(0,8).map(projectRow).join(''):'<div class="kyv-rights-empty">Tutti i pubblicati hanno un match titolo esatto nel repertorio SIAE.</div>'}</div></div>
  <div class="kyv-rights-panel"><div class="kyv-rights-panel-head"><div><h4>Opere senza codice ISWC</h4><p>Il codice mancante non implica errore di deposito, ma merita controllo.</p></div><b>${r.missingIswc.length}</b></div><div class="kyv-rights-list">${r.missingIswc.length?r.missingIswc.slice(0,8).map(workRow).join(''):'<div class="kyv-rights-empty">Nessuna opera senza ISWC.</div>'}</div></div>
 </div>`;
 root.querySelector('#kyv-rights-year')?.addEventListener('change',e=>render(e.target.value));
 if(window.lucide)lucide.createIcons({root});
}
async function load(){
 const c=client();if(!c)return;
 const [estratto,siae,vertical,imaie,projects]=await Promise.all([
  c.from('ESTRATTO SIAE').select('ID_ECSIAE,DATA,OPERAZIONE,IMPORTO').limit(2000),
  c.from('EXPORT SIAE').select('"Cod. Opera","Titolo","Codice ISWC"').limit(2000),
  c.from('EXPORT SIAE VERTICALE').select('"ID_SIAVERT","Cod. Opera","Codice ISWC","Titolo","Codice IPI","Quota DEM","Quota DRM"').limit(5000),
  c.from('ESTRATTO_IMAIE').select('id,TITOLO_OPERA,CATEGORIA,COD_OPERA,DATA_PUBBL').limit(2000),
  c.from('PROGETTI').select('ID,TITOLO,ARTISTA,STATO,Data_Pubblicazione').limit(1000)
 ]);
 const errors=[estratto.error,siae.error,vertical.error,imaie.error,projects.error].filter(Boolean);
 if(errors.length){console.warn('[KYV Rights v7] lettura parziale',errors);}
 const imaieRows=imaie.data||[],roles=[...new Set(imaieRows.map(x=>text(x.CATEGORIA)).filter(Boolean))];
 data={estratto:estratto.data||[],siae:siae.data||[],vertical:vertical.data||[],imaie:imaieRows,projects:projects.data||[],imaieRole:roles.join(', ')};
 render('all');
}
function boot(){styles();let n=0;const t=setInterval(()=>{n++;if(mount()){clearInterval(t);load();}else if(n>=25)clearInterval(t);},120);setTimeout(()=>clearInterval(t),3500);}
window.KYV_RIGHTS_V7={refresh:load};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();