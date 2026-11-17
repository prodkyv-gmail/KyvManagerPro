/* KYV Today Home v5 — home operativa producer-first, read-only. */
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
if(page!=='index.html'&&page!=='')return;

const FOLLOWUP_DAYS=5;
let db=null,renderToken=0;

const text=v=>String(v??'').trim();
const H=v=>window.KYV?.safeHtml?KYV.safeHtml(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=v=>{const n=new Date(v||0).getTime();return Number.isFinite(n)?n:0;};
const daysSince=v=>{const n=time(v);return n?Math.max(0,Math.floor((Date.now()-n)/86400000)):null;};
const isPaid=v=>window.KYV?.isPaid?KYV.isPaid(v):/^(si|sì|yes|true|1|pagat|incassat)/i.test(text(v));
const amount=row=>{
 const raw=row?.ImportoTotaleDocumento??row?.PrezzoTotale??row?.PrezzoUnitario??row?.ImportoPagamento??0;
 if(window.KYV?.parseNumber)return KYV.parseNumber(raw)||0;
 const n=Number(String(raw??'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;
};
const euro=v=>window.KYV?.formatEuro?KYV.formatEuro(v):new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const fmtDate=v=>v?(window.KYV?.formatDate?KYV.formatDate(v,'—'):new Date(v).toLocaleDateString('it-IT')):'—';
const todayStart=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};
function daysUntil(v){const n=time(v);if(!n)return null;return Math.floor((n-todayStart().getTime())/86400000);}
function doneProject(p){return /uscita|pubblicat|completat|chius|finita/i.test(text(p?.STATO)+' '+text(p?.SVILUPPO));}
function projectLabel(p){return [text(p?.ARTISTA)||'Artista non indicato',text(p?.TITOLO)||'Senza titolo'].join(' · ');}
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
async function rows(table,select,limit,order){
 try{
   let q=client().from(table).select(select).limit(limit);
   if(order)q=q.order(order,{ascending:false});
   const {data,error}=await q;if(error)throw error;return data||[];
 }catch(error){console.warn('[KYV Today v5] '+table+' non disponibile',error);return null;}
}
function pitchClosed(r){return /confermat|approvat|accettat|(^|\s|\/)(no|pass)(\s|$)|rifiut|declin|non interess/i.test(text(r?.Stato).toLowerCase());}
function latestActivity(r){return r?.Data_Conferma||r?.Data_Invio||'';}
function item({kind,score,title,detail,meta,href,icon}){return{kind,score,title,detail,meta,href,icon};}
function build(projects,invoices,sends){
 const out=[],byProject=new Map((projects||[]).map(p=>[String(p.ID),p]));
 (sends||[]).filter(r=>!pitchClosed(r)).forEach(r=>{
   const age=daysSince(latestActivity(r));if(age===null||age<FOLLOWUP_DAYS)return;
   const p=byProject.get(String(r.ID_PROGETTO));
   out.push(item({kind:'followup',score:130+age,title:'Follow-up: '+(text(r.Destinatario)||'destinatario'),detail:projectLabel(p),meta:age+' giorni senza attività',href:'scheda_progetto.html?id='+encodeURIComponent(r.ID_PROGETTO)+'&tab=produzione#kyv-pitch-followup-project',icon:'send'}));
 });
 (projects||[]).forEach(p=>{
   if(doneProject(p))return;
   const follow=daysUntil(p.Prossimo_Followup);
   if(follow!==null&&follow<0)out.push(item({kind:'followup',score:125+Math.abs(follow),title:'Follow-up progetto scaduto',detail:projectLabel(p),meta:Math.abs(follow)+' giorni in ritardo',href:'scheda_progetto.html?id='+encodeURIComponent(p.ID),icon:'alarm-clock'}));
   else if(follow===0)out.push(item({kind:'followup',score:124,title:'Follow-up oggi',detail:projectLabel(p),meta:'Oggi',href:'scheda_progetto.html?id='+encodeURIComponent(p.ID),icon:'alarm-clock'}));

   const session=daysUntil(p.Data_Sessione);
   if(session!==null&&session>=0&&session<=7)out.push(item({kind:'session',score:110-session,title:session===0?'Sessione oggi':'Sessione tra '+session+'g',detail:projectLabel(p),meta:fmtDate(p.Data_Sessione),href:'scheda_progetto.html?id='+encodeURIComponent(p.ID),icon:'mic-2'}));

   const release=daysUntil(p.Data_Pubblicazione);
   if(release!==null&&release>=0&&release<=30)out.push(item({kind:'release',score:105-release/10,title:release===0?'Release oggi':'Release tra '+release+'g',detail:projectLabel(p),meta:fmtDate(p.Data_Pubblicazione),href:'scheda_progetto.html?id='+encodeURIComponent(p.ID),icon:'rocket'}));

   const sviluppo=text(p.SVILUPPO);
   if(sviluppo&&!/^(finita|completata|uscita|pubblicata|chiusa)$/i.test(sviluppo))out.push(item({kind:'project',score:78,title:'Fase: '+sviluppo,detail:projectLabel(p),meta:(follow!==null&&follow>0?'Follow-up '+fmtDate(p.Prossimo_Followup):'Nessun follow-up fissato'),href:'scheda_progetto.html?id='+encodeURIComponent(p.ID),icon:'move-right'}));
 });
 (invoices||[]).filter(f=>!isPaid(f.PAGATA)).forEach(f=>{
   const p=byProject.get(String(f.ID_PROGETTO));
   out.push(item({kind:'money',score:118,title:'Incasso da verificare',detail:p?projectLabel(p):(text(f.Denominazione)||'Fattura '+(text(f.Numero)||'#'+text(f.ID_FT))),meta:euro(amount(f))+' · '+fmtDate(f.Data),href:f.ID_PROGETTO?'scheda_progetto.html?id='+encodeURIComponent(f.ID_PROGETTO)+'&tab=amministrazione':'fatture.html',icon:'badge-euro'}));
 });
 const seen=new Set();
 return out.sort((a,b)=>b.score-a.score).filter(x=>{const k=x.kind+'|'+x.title+'|'+x.detail;if(seen.has(k))return false;seen.add(k);return true;});
}
function summary(projects,invoices,sends,items){
 const now=items.filter(x=>x.kind==='followup'&&/oggi|ritardo|senza attività/i.test(x.meta||x.title)).length;
 const week=items.filter(x=>['session','followup'].includes(x.kind)&&!/ritardo|senza attività/i.test(x.meta||'')).length;
 const check=items.filter(x=>['project','release'].includes(x.kind)).length;
 const unpaid=(invoices||[]).filter(f=>!isPaid(f.PAGATA));
 return{now,week,check,unpaidCount:unpaid.length,unpaidTotal:unpaid.reduce((s,f)=>s+amount(f),0),projectCount:(projects||[]).length,sendCount:(sends||[]).length};
}
function style(){
 if(document.getElementById('kyv-today-home-v5-style'))return;
 const s=document.createElement('style');s.id='kyv-today-home-v5-style';s.textContent=`
#kyv-today-home-v5{margin-bottom:1rem}.kyv-today5-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}.kyv-today5-head h3{font-size:1.15rem;font-weight:900;color:#fff}.kyv-today5-head p{font-size:.7rem;color:#94a3b8;margin-top:.25rem;max-width:48rem}
.kyv-today5-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.55rem;margin-top:.8rem}.kyv-today5-stat{border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.025);border-radius:.85rem;padding:.7rem}.kyv-today5-stat span{display:block;color:#94a3b8;font-size:.58rem;text-transform:uppercase;letter-spacing:.09em;font-weight:900}.kyv-today5-stat strong{display:block;color:#fff;font-size:.98rem;margin-top:.25rem}
.kyv-today5-list{display:grid;gap:.5rem;margin-top:.75rem}.kyv-today5-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:.7rem;align-items:start;border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.025);border-radius:.85rem;padding:.72rem .78rem;transition:.15s}.kyv-today5-row:hover{background:rgba(99,102,241,.065);border-color:rgba(99,102,241,.25)}.kyv-today5-icon{width:34px;height:34px;border-radius:.7rem;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,.09);color:#c7d2fe}.kyv-today5-row.followup .kyv-today5-icon{background:rgba(244,63,94,.08);color:#fecdd3}.kyv-today5-row.money .kyv-today5-icon{background:rgba(16,185,129,.08);color:#a7f3d0}.kyv-today5-row.release .kyv-today5-icon{background:rgba(139,92,246,.08);color:#ddd6fe}.kyv-today5-row strong{display:block;color:#fff;font-size:.76rem;line-height:1.35}.kyv-today5-row p{color:#94a3b8;font-size:.64rem;margin-top:.18rem}.kyv-today5-meta{color:#cbd5e1;font-size:.6rem;font-weight:850;white-space:nowrap;margin-top:.1rem}.kyv-today5-empty{padding:1rem;border:1px dashed rgba(255,255,255,.1);border-radius:.8rem;color:#94a3b8;font-size:.7rem;text-align:center}
@media(max-width:720px){.kyv-today5-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.kyv-today5-head{flex-direction:column}.kyv-today5-row{grid-template-columns:34px minmax(0,1fr)}.kyv-today5-meta{grid-column:2;white-space:normal}}
`;document.head.appendChild(s);
}
function mount(){
 let panel=document.getElementById('kyv-today-home-v5');if(panel)return panel;
 const start=document.getElementById('kyv-producer-start'),quick=document.querySelector('.kyv-quick-actions'),header=document.querySelector('main section > header');
 if(!header)return null;
 panel=document.createElement('section');panel.id='kyv-today-home-v5';panel.className='kyv-panel p-4 sm:p-5';
 const wrapper=document.createElement('details');
 wrapper.id='kyv-today-cabin-collapse';wrapper.className='kyv-collapse kyv-pastel-lavender mb-5';
 wrapper.innerHTML='<summary><span class="text-sm font-black text-white">Cabina operativa</span><span class="text-xs text-kyv-text"> · Priorità, incassi e cose da controllare</span><i data-lucide="chevron-down" class="kyv-collapse-chevron w-5 h-5 text-kyv-text"></i></summary>';
 wrapper.appendChild(panel);
 const projectActions=start?.closest('#kyv-dashboard-project-actions');
 if(projectActions)projectActions.insertAdjacentElement('afterend',wrapper);
 else if(start)start.insertAdjacentElement('afterend',wrapper);
 else if(quick)quick.insertAdjacentElement('beforebegin',wrapper);
 else header.insertAdjacentElement('afterend',wrapper);
 return panel;
}
function render(projects,invoices,sends){
 const token=++renderToken,panel=mount();if(!panel)return false;
 const all=build(projects||[],invoices||[],sends||[]),top=all.slice(0,5),s=summary(projects||[],invoices||[],sends||[],all);
 panel.innerHTML=`<div class="kyv-today5-head"><div><p class="text-[9px] uppercase tracking-[.14em] font-black text-indigo-200">Cabina operativa</p><h3 class="mt-1">Cosa richiede attenzione adesso</h3><p>Massimo cinque priorità reali. Se non c’è nulla da fare, non creo alert artificiali.</p></div><a href="pipeline.html" class="kyv-chip">Pipeline & opportunità</a></div>
 <div class="kyv-today5-summary">
  <div class="kyv-today5-stat"><span>Oggi</span><strong>${s.now}</strong></div>
  <div class="kyv-today5-stat"><span>Questa settimana</span><strong>${s.week}</strong></div>
  <div class="kyv-today5-stat"><span>Da controllare</span><strong>${s.check}</strong></div>
  <div class="kyv-today5-stat"><span>Da incassare</span><strong>${s.unpaidCount?euro(s.unpaidTotal):'€ 0'}</strong></div>
 </div>
 <div class="kyv-today5-list">${top.length?top.map(x=>`<a class="kyv-today5-row ${H(x.kind)}" href="${H(x.href)}"><span class="kyv-today5-icon"><i data-lucide="${H(x.icon)}" class="w-4 h-4"></i></span><span><strong>${H(x.title)}</strong><p>${H(x.detail)}</p></span><span class="kyv-today5-meta">${H(x.meta||'')}</span></a>`).join(''):'<div class="kyv-today5-empty">Nessuna priorità urgente rilevata. Puoi lavorare da Progetti, Ascolto o Agenda.</div>'}</div>`;
 if(token===renderToken&&window.lucide)lucide.createIcons({root:panel});
 return true;
}
async function load(){
 if(!client())return;
 const [projects,invoices,sends]=await Promise.all([
  rows('PROGETTI','ID,TITOLO,ARTISTA,STATO,SVILUPPO,Data_Sessione,Data_Pubblicazione,Prossimo_Followup',1000,'ID'),
  rows('FATTURE','ID_FT,Numero,Data,Denominazione,ImportoTotaleDocumento,PrezzoTotale,PrezzoUnitario,ImportoPagamento,PAGATA,ID_PROGETTO',1500,'ID_FT'),
  rows('INVII_AUDIO','ID_INVIO,ID_PROGETTO,Destinatario,Stato,Data_Invio,Data_Conferma',2000,'ID_INVIO')
 ]);
 render(projects||[],invoices||[],sends||[]);
}
function boot(){
 style();
 let attempts=0;const tryMount=()=>{attempts++;if(mount()){load();return true;}return false;};
 if(tryMount())return;
 const t=setInterval(()=>{if(tryMount()||attempts>=24)clearInterval(t);},200);
 setTimeout(()=>clearInterval(t),5200);
}
window.KYV_TODAY_HOME_V5={refresh:load};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();