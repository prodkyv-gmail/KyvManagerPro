/* KYV Scheda snella (v2.85) — riordina e comprime la Scheda progetto senza toccare dati.
   Nessuna query, nessuna scrittura: usa solo gli ID dei blocchi già creati dagli altri moduli.
   Ordine: intestazione del brano → prossima azione e riepilogo → soldi → «Apri» → dettagli (schede).
   I quattro riquadri «Lavorazione/Pitch/Uscita/Controllo» sono nascosti: ripetono il riepilogo e le schede.
   I blocchi più pesanti (note e audio, versioni e uscita, storia) si aprono in un popup. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;
if(window.KYV_SCHEDA_LEAN)return;
const POPUPS=[['kyv-song-desk','Note e audio'],['kyv-project-v2','Versioni e uscita'],['kyv-project-timeline-v10','Storia del progetto']];
const ids=POPUPS.map(x=>x[0]);
const css=`
body.kyv-lean main section>header{margin-bottom:.75rem!important}
body.kyv-lean main section>header h2,body.kyv-lean main section>header p:not(.kyv-eyebrow){display:none!important}
body.kyv-lean #project-view{display:flex;flex-direction:column;gap:1rem}
body.kyv-lean #project-view>*{order:50;margin:0!important}
body.kyv-lean #project-view>.kyv-lean-hero{order:1}
body.kyv-lean #kyv-project-hub-v3{order:2}
body.kyv-lean #kyv-project-progressive{order:3}
body.kyv-lean #kyv-project-finance-summary{order:4}
body.kyv-lean #kyv-lean-bar{order:5}
body.kyv-lean #tabs{order:6}
body.kyv-lean #kyv-project-audio-finder{order:7}
body.kyv-lean #project-view>.tab-panel{order:8}
${ids.map(id=>'body.kyv-lean #'+id).join(',')},body.kyv-lean #kyv-project-progressive{display:none!important}
${ids.map(id=>'body.kyv-lean[data-lean-open="'+id+'"] #'+id).join(',')}{display:block!important;position:fixed!important;inset:max(8px,3vh) max(8px,3vw)!important;z-index:10030;overflow:auto;background:#0f111a;border:1px solid #3c4960;border-radius:1rem;padding:3.4rem 1rem 1rem;box-shadow:0 30px 90px rgba(0,0,0,.6);background-image:none!important;background-color:#0f111a!important}
#kyv-lean-backdrop{display:none;position:fixed;inset:0;z-index:10020;background:rgba(2,6,23,.72)}
body[data-lean-open] #kyv-lean-backdrop{display:block}
#kyv-lean-close{display:none;position:fixed;z-index:10040;top:calc(max(8px,3vh) + .6rem);right:calc(max(8px,3vw) + .8rem);min-height:44px;padding:.5rem 1rem;border-radius:.8rem;border:1px solid #5b6a81;background:#171e2c;color:#fff;font-weight:800;font-size:.8rem;cursor:pointer}
body[data-lean-open] #kyv-lean-close{display:inline-flex;align-items:center;gap:.4rem}
#kyv-lean-title{display:none;position:fixed;z-index:10040;top:calc(max(8px,3vh) + 1rem);left:calc(max(8px,3vw) + 1rem);font-weight:900;font-size:.95rem;color:#e2e8f0}
body[data-lean-open] #kyv-lean-title{display:block}
#kyv-lean-bar{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem;padding:.7rem .85rem;border:1px solid rgba(148,163,184,.18);background:rgba(15,17,26,.6);border-radius:1rem}
#kyv-lean-bar>span{font-size:.65rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;margin-right:.3rem}
#kyv-lean-bar button{min-height:44px;padding:.5rem .95rem;border-radius:.8rem;border:1px solid rgba(129,140,248,.35);background:rgba(99,102,241,.14);color:#e0e7ff;font-weight:800;font-size:.78rem;cursor:pointer}
#kyv-lean-bar button:hover{background:rgba(99,102,241,.26)}
@media(max-width:640px){#kyv-lean-bar button{flex:1 1 100%}#kyv-lean-title{font-size:.85rem;max-width:55%}}
`;
function ensureStyle(){if(document.getElementById('kyv-scheda-lean-style'))return;const s=document.createElement('style');s.id='kyv-scheda-lean-style';s.textContent=css;document.head.appendChild(s);}
function open(id){const title=(POPUPS.find(x=>x[0]===id)||[])[1]||'';document.body.dataset.leanOpen=id;const t=document.getElementById('kyv-lean-title');if(t)t.textContent=title;document.getElementById(id)?.scrollTo?.(0,0);document.getElementById('kyv-lean-close')?.focus();}
function close(){const id=document.body.dataset.leanOpen;delete document.body.dataset.leanOpen;if(id)document.querySelector('#kyv-lean-bar [data-lean="'+id+'"]')?.focus();}
function ensureChrome(){
  if(!document.getElementById('kyv-lean-backdrop')){const b=document.createElement('div');b.id='kyv-lean-backdrop';b.addEventListener('click',close);document.body.appendChild(b);}
  if(!document.getElementById('kyv-lean-close')){const c=document.createElement('button');c.id='kyv-lean-close';c.type='button';c.textContent='Chiudi ✕';c.setAttribute('aria-label','Chiudi popup');c.addEventListener('click',close);document.body.appendChild(c);}
  if(!document.getElementById('kyv-lean-title')){const t=document.createElement('div');t.id='kyv-lean-title';t.setAttribute('aria-hidden','true');document.body.appendChild(t);}
}
function tick(){
  const view=document.getElementById('project-view');if(!view||view.classList.contains('hidden'))return;
  document.body.classList.add('kyv-lean');ensureStyle();ensureChrome();
  const hero=document.getElementById('hero-title')?.closest('#project-view>*');
  if(hero&&!hero.classList.contains('kyv-lean-hero')){view.querySelectorAll(':scope>.kyv-lean-hero').forEach(x=>x.classList.remove('kyv-lean-hero'));hero.classList.add('kyv-lean-hero');}
  if(!document.getElementById('kyv-lean-bar')){
    const bar=document.createElement('section');bar.id='kyv-lean-bar';bar.setAttribute('aria-label','Altre viste del progetto');
    bar.innerHTML='<span>Apri</span>'+POPUPS.map(([id,label])=>'<button type="button" data-lean="'+id+'">'+label+'</button>').join('');
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-lean]');if(b)open(b.dataset.lean);});
    view.appendChild(bar);
  }
}
let pending=0;
function schedule(){if(pending)return;pending=requestAnimationFrame(()=>{pending=0;try{tick();}catch(e){console.error('[KYV Scheda snella]',e);}});}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.dataset.leanOpen){e.preventDefault();close();}});
function boot(){new MutationObserver(schedule).observe(document.getElementById('project-view')||document.body,{childList:true,subtree:false,attributes:true,attributeFilter:['class']});schedule();}
window.KYV_SCHEDA_LEAN={open,close,tick};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
