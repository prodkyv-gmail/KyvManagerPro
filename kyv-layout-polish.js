/* KYV Layout Polish — uniformità visiva e contenitori leggibili nelle viste producer.
   Nessun observer globale: solo retry temporanei ed eventi applicativi. */
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const supported=new Set(['progetti.html','scheda_progetto.html','ascolto.html','kyv_calendar.html','oggi.html','index.html','']);
if(!supported.has(page))return;

function injectStyles(){
  if(document.getElementById('kyv-layout-polish-style'))return;
  const style=document.createElement('style');
  style.id='kyv-layout-polish-style';
  style.textContent=`
/* Scrollbar più discrete e coerenti nelle viste operative. */
.custom-scrollbar::-webkit-scrollbar,.table-scroll::-webkit-scrollbar{width:10px!important;height:10px!important}
.custom-scrollbar::-webkit-scrollbar-track,.table-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,.025)!important}
.custom-scrollbar::-webkit-scrollbar-thumb,.table-scroll::-webkit-scrollbar-thumb{background:#465064!important;border:2px solid #10131b!important;border-radius:999px!important}
.custom-scrollbar::-webkit-scrollbar-thumb:hover,.table-scroll::-webkit-scrollbar-thumb:hover{background:#657086!important}
.custom-scrollbar,.table-scroll{scrollbar-width:thin;scrollbar-color:#465064 rgba(255,255,255,.025)}

/* Barre orizzontali solo dove i dati tabellari possono eccedere il contenitore. */
#tab-admin .overflow-x-auto,#tab-audio .overflow-x-auto,#tab-spese .overflow-x-auto,.kyv-project-table-wrapper,.table-scroll{scrollbar-gutter:stable both-edges;-webkit-overflow-scrolling:touch}
#tab-admin table,#tab-audio table,#tab-spese table{min-width:680px}
#tab-admin .kyv-card,#tab-audio .kyv-card,#tab-spese .kyv-card{min-width:0}

/* Scheda: moduli principali più larghi e testi lunghi leggibili. */
#project-view{max-width:1680px;width:100%;margin-left:auto;margin-right:auto}
#project-view .kyv-card,#project-view .kyv-soft{min-width:0}
#project-view td,#project-view th{overflow-wrap:anywhere}
#project-results{max-height:min(44vh,420px);overflow-y:auto;scrollbar-gutter:stable}
.kyv-project-tabs{scrollbar-gutter:stable}
#score-ring{width:82px!important;height:82px!important}
#score-ring #score-value{font-size:1.15rem!important}
#score-ring span{font-size:8px!important;letter-spacing:.04em}

/* Ascolto: elenchi e versioni scrollabili senza allungare indefinitamente la pagina. */
#kyv-listen-artists,#kyv-listen-projects{scrollbar-gutter:stable}
#kyv-listen-versions{max-height:62vh;overflow-y:auto;padding-right:.3rem;scrollbar-gutter:stable}
#kyv-listen-project-head{min-width:0;overflow-wrap:anywhere}
.kyv-listen-column[data-kyv-column="versions"]{min-width:0}

/* Agenda: forma più operativa e meno tecnica. */
#kyv-agenda-actions{max-height:44vh;overflow-y:auto;padding-right:.25rem;scrollbar-gutter:stable}
#events-list{scrollbar-gutter:stable}
.kyv-agenda-overview{min-width:0;overflow:hidden}
.kyv-agenda-action{min-width:0;overflow-wrap:anywhere}
.kyv-calendar-connection-compact{padding:1rem!important;box-shadow:none!important;background:rgba(21,25,35,.62)!important}
.kyv-calendar-connection-compact h3{margin-bottom:.65rem!important;font-size:.78rem!important;color:#cbd5e1!important}
.kyv-calendar-connection-compact .space-y-3{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:.65rem!important;align-items:center!important}
.kyv-calendar-connection-compact .space-y-3>.rounded-xl{margin:0!important;padding:.55rem .7rem!important}
.kyv-calendar-connection-compact #btn-sync{width:auto!important;min-width:145px!important;padding:.6rem .8rem!important}
.kyv-calendar-connection-compact .kyv-calendar-technical{display:none!important}
@media(min-width:1100px){.kyv-calendar-layout{grid-template-columns:minmax(320px,370px) minmax(0,1fr)!important;align-items:start!important}}

/* Barra percorso e chip fattura: niente tagli su notebook/tablet. */
#kyv-workflow-nav{max-width:100%;overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap!important;padding-bottom:.2rem;scrollbar-width:thin}
#kyv-workflow-nav>*{flex:0 0 auto}

/* Oggi: la lista operativa viene prima dei grafici e resta compatta. */
#kyv-today-priority .kyv-today-priority-list{max-height:55vh;overflow-y:auto;padding-right:.25rem;scrollbar-gutter:stable}

/* Progetti safe: stessa identità visiva del resto dell'app, senza caricare observer/moduli globali. */
body.kyv-safe-projects-polished{background:#111d22!important;color:#edf5f0!important}
body.kyv-safe-projects-polished .sidebar{width:272px;flex-basis:272px;background:linear-gradient(180deg,#1b2b30,#17262b)!important;border-color:rgba(255,255,255,.085)!important;box-shadow:20px 0 55px rgba(0,0,0,.24)}
body.kyv-safe-projects-polished .brand strong{color:#f5f7fb;font-size:20px}
body.kyv-safe-projects-polished .brand span{color:#aaa4ff!important}
body.kyv-safe-projects-polished .nav-label{color:#687083!important}
body.kyv-safe-projects-polished .nav a,body.kyv-safe-projects-polished .group summary{color:#b6c7c6!important;border-radius:12px}
body.kyv-safe-projects-polished .nav a:hover,body.kyv-safe-projects-polished .group summary:hover{background:rgba(255,255,255,.055)!important;color:#fff!important}
body.kyv-safe-projects-polished .nav a.active{background:linear-gradient(90deg,rgba(156,196,180,.19),rgba(156,196,180,.065))!important;border-color:rgba(139,131,255,.24)!important;color:#e4e1ff!important;box-shadow:inset 3px 0 0 #8b83ff}
body.kyv-safe-projects-polished .active .dot{background:#8b83ff!important;box-shadow:0 0 0 4px rgba(139,131,255,.12)!important}
body.kyv-safe-projects-polished .page{background:radial-gradient(circle at 3% 0%,rgba(156,196,180,.075),transparent 28rem),radial-gradient(circle at 96% 8%,rgba(127,177,181,.06),transparent 28rem),#1b292d!important}
body.kyv-safe-projects-polished .header{background:transparent!important;border:0!important;padding:32px 32px 18px!important}
body.kyv-safe-projects-polished .eyebrow{color:#aaa4ff!important}
body.kyv-safe-projects-polished .title{font-size:34px!important;color:#f5f7fb!important}
body.kyv-safe-projects-polished .subtitle{color:#969eae!important;max-width:760px}
body.kyv-safe-projects-polished .content{padding:8px 32px 32px!important}
body.kyv-safe-projects-polished .notice{display:none!important}
body.kyv-safe-projects-polished .table-wrap{background:linear-gradient(180deg,rgba(42,61,66,.94),rgba(33,49,54,.94))!important;border-color:rgba(255,255,255,.085)!important;box-shadow:0 18px 45px rgba(0,0,0,.22)!important;border-radius:16px!important}
body.kyv-safe-projects-polished thead{background:#1d2d31!important;color:#969eae!important}
body.kyv-safe-projects-polished td{border-color:rgba(255,255,255,.065)!important}
body.kyv-safe-projects-polished .row:hover{background:rgba(139,131,255,.07)!important}
body.kyv-safe-projects-polished .filter{background:rgba(255,255,255,.025)!important;border-color:rgba(255,255,255,.085)!important;color:#aab1bf!important}
body.kyv-safe-projects-polished .filter.active{background:rgba(139,131,255,.16)!important;border-color:rgba(139,131,255,.30)!important;color:#e8e6ff!important}
body.kyv-safe-projects-polished .btn.primary{background:linear-gradient(135deg,#779e92,#527d74)!important;border-color:rgba(139,131,255,.28)!important;box-shadow:0 10px 24px rgba(111,101,244,.20)}
body.kyv-safe-projects-polished .open{background:rgba(139,131,255,.11)!important;border-color:rgba(139,131,255,.24)!important;color:#dedbff!important}
/* Navigazione Progetti mobile: soltanto il drawer laterale. */
.kyv-safe-mobile-nav{display:none!important}

@media(max-width:1050px){
  #project-view{max-width:none}
  #tab-admin table,#tab-audio table,#tab-spese table{min-width:760px}
  #kyv-listen-versions{max-height:48vh}
  #kyv-agenda-actions{max-height:52vh}
}
@media(max-width:820px){
  /* v2.76: Late-injected polish must respect the compact project mobile header. */
  body.kyv-safe-projects-polished .header{padding:calc(12px + env(safe-area-inset-top,0px)) 14px 12px!important}
  body.kyv-safe-projects-polished .title{font-size:25px!important}
  body.kyv-safe-projects-polished .subtitle{font-size:12px!important}
  body.kyv-safe-projects-polished .content{padding:6px 16px calc(22px + env(safe-area-inset-bottom))!important}
  body.kyv-safe-projects-polished .table-wrap{border-radius:14px!important}
  .kyv-calendar-connection-compact .space-y-3{grid-template-columns:1fr!important}
  .kyv-calendar-connection-compact #btn-sync{width:100%!important}
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
  ['#tab-admin .overflow-x-auto','#tab-audio .overflow-x-auto','#tab-spese .overflow-x-auto','#events-list','#kyv-agenda-actions','#kyv-listen-versions','#project-results','.table-scroll'].forEach(selector=>{
    document.querySelectorAll(selector).forEach(el=>el.classList.add('custom-scrollbar'));
  });
}

function polishProjects(){
  if(page!=='progetti.html')return;
  document.body.classList.add('kyv-safe-projects-polished');
  const version=document.querySelector('.brand span');
  if(version)version.textContent=`Manager Pro ${window.KYV_CONFIG?.APP_VERSION||'2.32'}`;
  const eyebrow=document.querySelector('.eyebrow');
  if(eyebrow)eyebrow.textContent='Workspace produttore';
  const subtitle=document.querySelector('.subtitle');
  if(subtitle)subtitle.textContent='Apri rapidamente il progetto, controlla lo stato e la prossima azione.';

}

function polishAgenda(){
  if(page!=='kyv_calendar.html')return;
  const title=document.querySelector('main header h2');
  if(title)title.textContent='Agenda';
  const subtitle=document.querySelector('main header p');
  if(subtitle)subtitle.textContent='Sessioni, appuntamenti e sincronizzazione del calendario in un’unica vista.';
  const account=document.getElementById('calendar-account');
  const card=account?.closest('.kyv-calendar-card');
  if(card){
    card.classList.add('kyv-calendar-connection-compact');
    const heading=card.querySelector('h3');
    if(heading)heading.textContent='Google Calendar collegato';
    const technical=document.getElementById('script-url')?.closest('.relative');
    if(technical)technical.classList.add('kyv-calendar-technical');
  }
  const syncText=document.getElementById('sync-text');
  if(syncText&&!/sincronizzazione/i.test(syncText.textContent||''))syncText.textContent='Aggiorna agenda';
  const sidebar=document.querySelector('.kyv-calendar-sidebar');
  if(sidebar&&!sidebar.dataset.kyvUiReordered){
    const cards=[...sidebar.children].filter(el=>el.classList?.contains('kyv-calendar-card'));
    if(cards.length>=2&&cards[0]===card){sidebar.insertBefore(cards[1],cards[0]);sidebar.dataset.kyvUiReordered='1';}
  }
}

function polishScheda(){
  if(page!=='scheda_progetto.html')return;
  const scoreLabel=document.querySelector('#score-ring span');
  if(scoreLabel)scoreLabel.textContent='completezza';
}

function polishToday(){
  if(page!=='oggi.html')return;
  const pulse=document.getElementById('studio-pulse');
  const quick=document.querySelector('.kyv-quick-actions');
  if(pulse&&quick&&!pulse.dataset.kyvUiPriority){quick.insertAdjacentElement('afterend',pulse);pulse.dataset.kyvUiPriority='1';}
}

function polishAscolto(){
  if(page!=='ascolto.html')return;
  const subtitle=document.querySelector('main header p');
  if(subtitle)subtitle.textContent='Ascolta, confronta e registra note sulle versioni del progetto.';
}

function run(){
  injectStyles();
  addScrollClasses();
  polishProjects();
  polishAgenda();
  polishScheda();
  polishToday();
  polishAscolto();
}

function boot(){
  run();
  let passes=0;
  const timer=setInterval(()=>{run();passes++;if(passes>=40)clearInterval(timer);},250);
  window.setTimeout(()=>clearInterval(timer),12000);
  ['kyv:project-v2-ready','kyv:invoice-updated','kyv:pitch-updated'].forEach(name=>window.addEventListener(name,run));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
