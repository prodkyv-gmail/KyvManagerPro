/* KYV Workflow Nav — collegamenti rapidi Scheda ↔ Ascolto ↔ Agenda ↔ Oggi. */
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const supported=new Set(['index.html','','scheda_progetto.html','ascolto.html','kyv_calendar.html']);
if(!supported.has(page))return;
function text(v){return String(v??'').trim();}
function params(){return new URLSearchParams(location.search);}
function projectId(){const p=params();return text(p.get('id')||p.get('projectId')||p.get('project'));}
function href(key){const id=projectId();if(key==='today')return'index.html';if(key==='project')return id?`scheda_progetto.html?id=${encodeURIComponent(id)}`:'progetti.html';if(key==='listen')return id?`ascolto.html?projectId=${encodeURIComponent(id)}`:'ascolto.html';if(key==='agenda')return id?`kyv_calendar.html?projectId=${encodeURIComponent(id)}`:'kyv_calendar.html';return'#';}
function active(){if(page==='scheda_progetto.html')return'project';if(page==='ascolto.html')return'listen';if(page==='kyv_calendar.html')return'agenda';return'today';}
function injectStyle(){if(document.getElementById('kyv-workflow-nav-style'))return;const s=document.createElement('style');s.id='kyv-workflow-nav-style';s.textContent=`.kyv-workflow-nav{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}.kyv-workflow-nav a{display:inline-flex;align-items:center;gap:.34rem;padding:.48rem .66rem;border-radius:.7rem;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);color:#cbd5e1;font-size:.67rem;font-weight:850;transition:.15s}.kyv-workflow-nav a:hover{color:#fff;background:rgba(255,255,255,.08)}.kyv-workflow-nav a.active{color:#fff;border-color:rgba(190,182,255,.35);background:rgba(190,182,255,.11)}.kyv-workflow-nav-label{font-size:.58rem;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#94a3b8;margin-right:.15rem}@media(max-width:640px){.kyv-workflow-nav{gap:.3rem}.kyv-workflow-nav a{padding:.45rem .55rem;font-size:.63rem}}`;document.head.appendChild(s);}
function build(){if(document.getElementById('kyv-workflow-nav'))return null;const nav=document.createElement('nav');nav.id='kyv-workflow-nav';nav.className='kyv-workflow-nav';nav.setAttribute('aria-label','Percorso rapido di lavoro');const current=active();const items=[['project','folder-kanban','Scheda'],['listen','headphones','Ascolto'],['agenda','calendar-days','Agenda'],['today','sun','Oggi']];nav.innerHTML='<span class="kyv-workflow-nav-label">Percorso</span>'+items.map(([key,icon,label])=>`<a href="${href(key)}" class="${current===key?'active':''}" data-kyv-workflow="${key}"><i data-lucide="${icon}" class="w-3.5 h-3.5"></i>${label}</a>`).join('');return nav;}
function host(){return document.querySelector('#kyv-song-desk .kyv-desk-head')||document.querySelector('#kyv-listening-phase4 header > div')||document.querySelector('#kyv-agenda-phase5 > div:first-child')||document.querySelector('#kyv-today-project-actions > div:first-child')||document.querySelector('main section > header');}
function mount(){injectStyle();const h=host();if(!h)return false;const nav=build();if(!nav)return true;h.appendChild(nav);if(window.lucide)lucide.createIcons({root:nav});return true;}
function boot(){if(mount())return;const o=new MutationObserver(()=>{if(mount())o.disconnect();});o.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),9000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
