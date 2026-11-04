/* KYV Easy Secondary v9 — progressive disclosure for Pipeline, Economy and Rights. */
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
if(!['pipeline.html','fatture.html','rendiconto.html'].includes(page))return;

const MODE_KEY='kyv-easy-ux-v9-mode';
let mode=readMode();
const text=v=>String(v??'').trim();

function readMode(){try{return localStorage.getItem(MODE_KEY)==='complete'?'complete':'easy';}catch(_){return'easy';}}
function saveMode(next){try{localStorage.setItem(MODE_KEY,next);}catch(_){}}

function ensureStyle(){
 if(document.getElementById('kyv-easy-secondary-v9-style'))return;
 const s=document.createElement('style');s.id='kyv-easy-secondary-v9-style';s.textContent=`
.kyv-easy-switch{display:inline-flex;align-items:center;padding:.2rem;border:1px solid rgba(148,163,184,.14);background:rgba(15,17,26,.72);border-radius:.75rem;gap:.15rem;flex:none}.kyv-easy-switch button{border:0;background:transparent;color:#94a3b8;font-size:.62rem;font-weight:900;padding:.42rem .62rem;border-radius:.55rem;cursor:pointer}.kyv-easy-switch button.active{background:rgba(99,102,241,.16);color:#e0e7ff}.kyv-easy-switch small{color:#64748b;font-size:.55rem;margin:0 .35rem}
.kyv-easy-details{border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.018);border-radius:.9rem;overflow:hidden}.kyv-easy-details>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:.7rem;cursor:pointer;padding:.78rem .9rem;color:#cbd5e1;font-size:.68rem;font-weight:900}.kyv-easy-details>summary::-webkit-details-marker{display:none}.kyv-easy-details>summary:after{content:'+';font-size:1rem;color:#64748b}.kyv-easy-details[open]>summary:after{content:'−'}.kyv-easy-details-body{padding:.2rem .9rem .9rem}.kyv-easy-note{font-size:.58rem;color:#64748b;margin-top:.22rem;font-weight:600}
body.kyv-easy-mode .kyv-easy-hide{display:none!important}
body.kyv-easy-mode #pipeline-summary>.pipeline-metric:nth-child(n+4){display:none!important}
body.kyv-easy-mode #pipeline-summary{grid-template-columns:repeat(3,minmax(0,1fr))!important}
body.kyv-easy-mode #pipeline-stage-tabs{display:none!important}
body.kyv-easy-mode #pipeline-artist,body.kyv-easy-mode #pipeline-partner,body.kyv-easy-mode #pipeline-reset{display:none!important}
body.kyv-easy-mode .pipeline-toolbar>div:first-child{grid-template-columns:minmax(0,1.7fr) minmax(190px,.7fr)!important}
body.kyv-easy-mode #pipeline-board .pipeline-column[data-stage="idea"],
body.kyv-easy-mode #pipeline-board .pipeline-column[data-stage="confermato"],
body.kyv-easy-mode #pipeline-board .pipeline-column[data-stage="perso"]{display:none!important}
body.kyv-easy-mode .pipeline-card .pipeline-pill.border-indigo-500\/20{display:none!important}
body.kyv-easy-mode #kyv-economy-register:not([open]) .kyv-easy-details-body,
body.kyv-easy-mode #kyv-rights-history:not([open]) .kyv-easy-details-body{display:none!important}
body.kyv-easy-mode #kyv-rights-v7 .kyv-rights-metrics .kyv-rights-card:not(.kyv-rights-action-card){display:none!important}
body.kyv-easy-mode #kyv-rights-v7 .kyv-rights-metrics{grid-template-columns:repeat(4,minmax(0,1fr))!important}
@media(max-width:850px){body.kyv-easy-mode #pipeline-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}body.kyv-easy-mode #kyv-rights-v7 .kyv-rights-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:640px){.kyv-easy-switch small{display:none}.kyv-easy-switch button{padding:.4rem .52rem}}
`;document.head.appendChild(s);
}

function headerActions(){
 if(page==='pipeline.html')return document.querySelector('main section > header > div:last-child');
 if(page==='fatture.html')return document.querySelector('main section > header .flex.items-center.gap-2.w-full');
 if(page==='rendiconto.html')return document.querySelector('main section > header > div:last-child')||document.querySelector('main section > header');
 return null;
}
function ensureSwitch(){
 if(document.getElementById('kyv-easy-secondary-switch'))return true;
 const host=headerActions();if(!host)return false;
 const wrap=document.createElement('div');wrap.id='kyv-easy-secondary-switch';wrap.className='kyv-easy-switch';wrap.setAttribute('role','group');
 wrap.setAttribute('aria-label','Densità della vista');
 wrap.innerHTML='<button type="button" data-mode="easy" aria-pressed="false">Easy</button><button type="button" data-mode="complete" aria-pressed="false">Completa</button><small>vista</small>';
 host.insertAdjacentElement('afterbegin',wrap);
 wrap.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
 return true;
}

function outerInvoiceSection(tbodyId){
 const table=document.getElementById(tbodyId)?.closest('table');
 return table?.parentElement?.parentElement?.parentElement||null;
}
function prepareEconomy(){
 if(page!=='fatture.html')return true;
 const dashboard=document.getElementById('kyv-economy-v6'),open=outerInvoiceSection('tbody-ft-nopag'),paid=outerInvoiceSection('tbody-ft-pag');
 if(!dashboard||!open||!paid)return false;
 if(!document.getElementById('kyv-economy-register')){
   const details=document.createElement('details');details.id='kyv-economy-register';details.className='kyv-easy-details';details.innerHTML='<summary><span>Registro fatture completo<div class="kyv-easy-note">Pagate, da incassare e storico dettagliato</div></span></summary><div class="kyv-easy-details-body space-y-8"></div>';
   dashboard.insertAdjacentElement('afterend',details);
   const body=details.querySelector('.kyv-easy-details-body');body.appendChild(open);body.appendChild(paid);
 }
 const localSearch=document.getElementById('correlazione-search')?.parentElement;
 const correlation=document.querySelector('a[href="correlazione.html"]');
 const refresh=[...document.querySelectorAll('button')].find(b=>/fetchFattureCorrelate/.test(b.getAttribute('onclick')||''));
 [localSearch,correlation,refresh].filter(Boolean).forEach(el=>el.classList.add('kyv-easy-hide'));
 return true;
}

function prepareRights(){
 if(page!=='rendiconto.html')return true;
 const dashboard=document.getElementById('kyv-rights-v7'),legacySummary=document.getElementById('kyv-siae-legacy-summary'),legacyChart=document.getElementById('kyv-siae-legacy-chart');
 if(!dashboard||!legacySummary||!legacyChart)return false;
 if(!document.getElementById('kyv-rights-history')){
   const details=document.createElement('details');details.id='kyv-rights-history';details.className='kyv-easy-details';details.innerHTML='<summary><span>Storico e grafici tecnici<div class="kyv-easy-note">Riepilogo legacy e distribuzione quote DEM</div></span></summary><div class="kyv-easy-details-body"></div>';
   dashboard.insertAdjacentElement('afterend',details);const body=details.querySelector('.kyv-easy-details-body');body.appendChild(legacySummary);body.appendChild(legacyChart);
 }
 const actionLabels=new Set(['Opere senza ISWC','Quote incoerenti','Pubblicati ↔ SIAE','Da verificare SIAE']);
 dashboard.querySelectorAll('.kyv-rights-metrics .kyv-rights-card').forEach(card=>{
   const label=text(card.querySelector('span')?.textContent);card.classList.toggle('kyv-rights-action-card',actionLabels.has(label));
 });
 return true;
}

function preparePipeline(){
 if(page!=='pipeline.html')return true;
 const toolbar=document.querySelector('.pipeline-toolbar'),board=document.getElementById('pipeline-board');
 if(!toolbar||!board)return false;
 const note=board.parentElement?.nextElementSibling;if(note)note.classList.add('kyv-easy-hide');
 return true;
}

function syncDetails(){
 const economy=document.getElementById('kyv-economy-register'),rights=document.getElementById('kyv-rights-history');
 // Apply the current mode once per disclosure and on explicit mode changes only.
 // Repeated data refreshes must not collapse a panel the user deliberately opened.
 [economy,rights].filter(Boolean).forEach(d=>{
   if(d.dataset.kyvModeApplied===mode)return;
   d.open=mode==='complete';
   d.dataset.kyvModeApplied=mode;
 });
}
function refreshUi(){
 document.body.classList.toggle('kyv-easy-mode',mode==='easy');
 document.body.classList.toggle('kyv-complete-mode',mode==='complete');
 document.querySelectorAll('#kyv-easy-secondary-switch [data-mode]').forEach(btn=>{
   const active=btn.dataset.mode===mode;
   btn.classList.toggle('active',active);
   btn.setAttribute('aria-pressed',String(active));
 });
 syncDetails();
}
function setMode(next){
 mode=next==='complete'?'complete':'easy';saveMode(mode);refreshUi();
}
function prepare(){
 ensureStyle();ensureSwitch();
 const ok=[preparePipeline(),prepareEconomy(),prepareRights()].every(Boolean);
 refreshUi();if(window.lucide)lucide.createIcons();
 return ok;
}
function boot(){
 let n=0;const t=setInterval(()=>{n++;if(prepare()||n>=35)clearInterval(t);},140);setTimeout(()=>clearInterval(t),5500);
}
window.KYV_EASY_SECONDARY_V9={setMode,getMode:()=>mode,refresh:prepare};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();