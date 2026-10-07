/* KYV Layout Polish — scroll e contenitori leggibili nelle viste producer. */
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const supported=new Set(['progetti.html','scheda_progetto.html','ascolto.html','kyv_calendar.html','index.html','']);
if(!supported.has(page))return;

function injectStyles(){
  if(document.getElementById('kyv-layout-polish-style'))return;
  const style=document.createElement('style');
  style.id='kyv-layout-polish-style';
  style.textContent=`
/* barre orizzontali solo dove i dati tabellari possono eccedere il contenitore */
#tab-admin .overflow-x-auto,#tab-audio .overflow-x-auto,#tab-spese .overflow-x-auto,.kyv-project-table-wrapper,.table-scroll{scrollbar-gutter:stable both-edges;-webkit-overflow-scrolling:touch}
#tab-admin table,#tab-audio table,#tab-spese table{min-width:680px}
#tab-admin .kyv-card,#tab-audio .kyv-card,#tab-spese .kyv-card{min-width:0}

/* Scheda: moduli principali più larghi e testi lunghi leggibili */
#project-view{max-width:1680px;width:100%;margin-left:auto;margin-right:auto}
#project-view .kyv-card,#project-view .kyv-soft{min-width:0}
#project-view td,#project-view th{overflow-wrap:anywhere}
#project-results{max-height:min(44vh,420px);overflow-y:auto;scrollbar-gutter:stable}
.kyv-project-tabs{scrollbar-gutter:stable}

/* Ascolto: elenchi e versioni devono poter scorrere senza allungare indefinitamente la pagina */
#kyv-listen-artists,#kyv-listen-projects{scrollbar-gutter:stable}
#kyv-listen-versions{max-height:62vh;overflow-y:auto;padding-right:.3rem;scrollbar-gutter:stable}
#kyv-listen-project-head{min-width:0;overflow-wrap:anywhere}
.kyv-listen-column[data-kyv-column="versions"]{min-width:0}

/* Agenda: da pianificare e calendario con scroll verticale autonomo sui desktop/notebook */
#kyv-agenda-actions{max-height:44vh;overflow-y:auto;padding-right:.25rem;scrollbar-gutter:stable}
#events-list{scrollbar-gutter:stable}
.kyv-agenda-overview{min-width:0;overflow:hidden}
.kyv-agenda-action{min-width:0;overflow-wrap:anywhere}

/* Barra percorso e chip fattura: niente tagli su notebook/tablet */
#kyv-workflow-nav{max-width:100%;overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap!important;padding-bottom:.2rem;scrollbar-width:thin}
#kyv-workflow-nav>*{flex:0 0 auto}

/* Oggi: priorità estese scrollabili, mantenendo il pannello compatto */
#kyv-today-priority .kyv-today-priority-list{max-height:55vh;overflow-y:auto;padding-right:.25rem;scrollbar-gutter:stable}

@media(max-width:1050px){
  #project-view{max-width:none}
  #tab-admin table,#tab-audio table,#tab-spese table{min-width:760px}
  #kyv-listen-versions{max-height:48vh}
  #kyv-agenda-actions{max-height:52vh}
}
@media(max-width:720px){
  #tab-admin table,#tab-audio table,#tab-spese table{min-width:720px}
  #kyv-listen-versions{max-height:42vh}
  #kyv-agenda-actions{max-height:54vh}
  #kyv-today-priority .kyv-today-priority-list{max-height:none;overflow:visible;padding-right:0}
}
`;
  document.head.appendChild(style);
}
function addScrollClasses(){
  ['#tab-admin .overflow-x-auto','#tab-audio .overflow-x-auto','#tab-spese .overflow-x-auto','#events-list','#kyv-agenda-actions','#kyv-listen-versions','#project-results'].forEach(selector=>{
    document.querySelectorAll(selector).forEach(el=>el.classList.add('custom-scrollbar'));
  });
}
function run(){injectStyles();addScrollClasses();}
function boot(){
  run();
  const observer=new MutationObserver(()=>run());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
