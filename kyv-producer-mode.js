/* KYV Producer Mode — interfaccia creativa semplice, dati e pagine storiche intatti. */
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const primary=[
  ['index.html','Oggi','layout-dashboard','dashboard'],
  ['kyv_calendar.html','Agenda','calendar-days','calendar'],
  ['acquisisci_audio.html','Nuovo','circle-plus','nuovo'],
  ['progetti.html','Progetti','music-2','progetti'],
  ['ascolto.html','Ascolto','headphones','ascolto']
];
const control=[
  ['fatture.html','Fatture e incassi','receipt','fatture'],
  ['documenti.html?tab=spese','Spese','receipt-euro','spese'],
  ['documenti.html','Documenti','folder-lock','spese'],
  ['fisco.html','Piano fiscale','calculator','fisco'],
  ['quote.html','Quote / split','pie-chart','quote'],
  ['rendiconto.html','Rendiconto SIAE','bar-chart-2','rendiconto']
];
const tools=[
  ['clienti.html','Contatti','users','clienti'],
  ['editor.html','Studio Editor','database','editor'],
  ['archivio_musicale.html','Archivio musicale','archive','archivio'],
  ['assistente.html','Percorso brano','route','assistente'],
  ['pipeline.html','Pipeline','columns-3','pipeline'],
  ['integrazioni.html','Tutte le app','grid-3x3','integrazioni'],
  ['importexport.html','Import / Export','arrow-down-up','importexport'],
  ['diagnostica.html','Diagnostica','activity','diagnostica'],
  ['guida.html','Manuale','book-open','guida']
];

function ensurePastelStyles(){
  if(document.querySelector('link[data-kyv-pastel]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='kyv-pastel.css';
  link.dataset.kyvPastel='1';
  document.head.appendChild(link);
}
function loadActionBridge(){
  if(document.querySelector('script[data-kyv-action-bridge]'))return;
  const script=document.createElement('script');
  script.src='kyv-action-bridge.js';
  script.async=false;
  script.dataset.kyvActionBridge='1';
  document.head.appendChild(script);
}
function loadProjectPhase2(){
  if(page!=='scheda_progetto.html'||document.querySelector('script[data-kyv-project-phase2]'))return;
  const script=document.createElement('script');
  script.src='kyv-project-phase2.js';
  script.async=false;
  script.dataset.kyvProjectPhase2='1';
  document.head.appendChild(script);
}
function loadProjectsPhase3(){
  if(page!=='progetti.html'||document.querySelector('script[data-kyv-projects-phase3]'))return;
  const script=document.createElement('script');
  script.src='kyv-projects-phase3.js';
  script.async=false;
  script.dataset.kyvProjectsPhase3='1';
  document.head.appendChild(script);
}
function currentKey(){
  const map={
    'index.html':'dashboard','':'dashboard','kyv_calendar.html':'calendar','acquisisci_audio.html':'nuovo',
    'progetti.html':'progetti','scheda_progetto.html':'progetti','ascolto.html':'ascolto','fatture.html':'fatture',
    'correlazione.html':'fatture','documenti.html':'spese','fisco.html':'fisco','quote.html':'quote','autori.html':'quote',
    'rendiconto.html':'rendiconto','clienti.html':'clienti','editor.html':'editor','archivio_musicale.html':'archivio',
    'assistente.html':'assistente','pipeline.html':'pipeline','integrazioni.html':'integrazioni','kyv_dropbox.html':'integrazioni',
    'kyv_drive.html':'integrazioni','importexport.html':'importexport','diagnostica.html':'diagnostica','guida.html':'guida'
  };
  return map[page]||page.replace(/\.html$/,'');
}
function item([href,label,icon,key]){
  const active=currentKey()===key;
  return `<li><a href="${href}" class="flex items-center px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${active?'bg-indigo-500/10 text-indigo-200 border border-indigo-500/25':'text-kyv-text hover:text-white hover:bg-kyv-border/50 border border-transparent'}"><i data-lucide="${icon}" class="w-4 h-4 mr-3 ${key==='nuovo'?'text-cyan-300':'text-slate-300'}"></i><span>${label}</span></a></li>`;
}
function details(label,icon,entries,open){
  return `<details class="kyv-nav-group" ${open?'open':''}><summary><i data-lucide="${icon}"></i><span>${label}</span><i data-lucide="chevron-down" class="kyv-chevron w-4 h-4"></i></summary><ul class="space-y-1">${entries.map(item).join('')}</ul></details>`;
}
function mountSimpleSidebar(){
  const sidebar=document.getElementById('sidebar');
  const nav=sidebar?.querySelector('nav');
  if(!nav||nav.dataset.producerMode==='1')return false;
  const key=currentKey();
  nav.dataset.producerMode='1';
  nav.innerHTML=`<div><p class="px-3 text-[10px] font-black text-kyv-text uppercase tracking-wider mb-2">Produttore</p><ul class="space-y-1">${primary.map(item).join('')}</ul></div>${details('Controllo','landmark',control,control.some(x=>x[3]===key))}${details('Strumenti','wrench',tools,tools.some(x=>x[3]===key))}`;
  const brand=sidebar.querySelector('h1 + p');
  if(brand&&window.KYV_CONFIG)brand.textContent=`Manager Pro ${KYV_CONFIG.APP_VERSION}`;
  if(window.lucide)lucide.createIcons({root:sidebar});
  return true;
}
function fixMobileNav(){
  const nav=document.getElementById('kyv-mobile-bottom-nav');
  if(!nav||nav.dataset.producerMode==='1')return false;
  nav.dataset.producerMode='1';
  const rubrica=nav.querySelector('a[href="clienti.html"]');
  if(rubrica){
    rubrica.href='ascolto.html';
    rubrica.setAttribute('aria-label','Ascolto');
    rubrica.classList.toggle('is-active',currentKey()==='ascolto');
    rubrica.innerHTML='<i data-lucide="headphones"></i><span>Ascolto</span>';
  }
  if(window.lucide)lucide.createIcons({root:nav});
  return true;
}
function watchNavigation(){
  const apply=()=>{mountSimpleSidebar();fixMobileNav();};
  apply();
  const observer=new MutationObserver(apply);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>{apply();observer.disconnect();},6000);
}

function collapseNode(node,{id,title,subtitle,icon='chevron-down',pastel='lavender'}={}){
  if(!node||document.getElementById(id))return null;
  const box=document.createElement('details');
  box.id=id;
  box.className=`kyv-collapse kyv-pastel-${pastel}`;
  box.innerHTML=`<summary><span><span class="block text-sm font-black text-white">${title}</span>${subtitle?`<span class="block text-xs text-kyv-text mt-1">${subtitle}</span>`:''}</span><i data-lucide="${icon}" class="kyv-collapse-chevron w-5 h-5 text-kyv-text shrink-0"></i></summary><div class="kyv-collapse-body"></div>`;
  node.parentNode.insertBefore(box,node);
  box.querySelector('.kyv-collapse-body').appendChild(node);
  return box;
}

function collapseOperationalPanels(){
  const pulse=document.getElementById('studio-pulse');
  if(!pulse||document.getElementById('kyv-dashboard-activity-collapse'))return;
  const parts=[...pulse.children];
  if(!parts.length)return;
  const holder=document.createElement('div');
  holder.id='kyv-dashboard-ops-collapses';
  holder.className='space-y-3 mb-6';
  pulse.parentNode.insertBefore(holder,pulse);

  if(parts[0]){
    holder.appendChild(parts[0]);
    const activity=collapseNode(parts[0],{
      id:'kyv-dashboard-activity-collapse',
      title:'Attività da chiudere',
      subtitle:'Follow-up, sessioni e cose da completare. Apri solo quando ti serve.',
      pastel:'mint'
    });
    if(activity)holder.appendChild(activity);
  }
  if(parts[1]){
    holder.appendChild(parts[1]);
    const ops=collapseNode(parts[1],{
      id:'kyv-dashboard-status-collapse',
      title:'Stato operativo',
      subtitle:'I segnali di controllo dello studio restano disponibili ma non occupano la Home.',
      pastel:'sky'
    });
    if(ops)holder.appendChild(ops);
  }
  pulse.remove();
}

function dashboardProducerMode(){
  if(page!=='index.html'&&page!=='')return;
  const header=document.querySelector('main section > header');
  if(!header||document.getElementById('kyv-producer-start'))return;
  const eyebrow=header.querySelector('.kyv-eyebrow'); if(eyebrow)eyebrow.textContent='Il tuo lavoro creativo';
  const title=header.querySelector('h2'); if(title)title.textContent='Oggi';
  const subtitle=header.querySelector('h2 + p'); if(subtitle)subtitle.textContent='Cattura quello che nasce, continua i progetti e pensa alla prossima azione.';

  const start=document.createElement('section');
  start.id='kyv-producer-start';
  start.className='kyv-pastel-lavender mb-5 rounded-2xl border border-indigo-500/25 p-5 sm:p-6';
  start.innerHTML=`<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p class="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Prima registra, poi completa</p><h3 class="text-xl sm:text-2xl font-black text-white mt-1">Hai iniziato qualcosa?</h3><p class="text-xs sm:text-sm text-kyv-text mt-2 max-w-2xl">Basta un titolo provvisorio o un appunto. Artista, file, crediti, fee e tutti gli altri dettagli possono arrivare dopo.</p></div><a href="acquisisci_audio.html" class="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shrink-0"><i data-lucide="circle-plus" class="w-5 h-5 mr-2"></i>Nuovo</a></div>`;
  header.insertAdjacentElement('afterend',start);

  const quick=document.querySelector('.kyv-quick-actions');
  if(quick){
    quick.innerHTML=`<a href="acquisisci_audio.html"><i data-lucide="circle-plus" class="w-4 h-4 mr-2 text-cyan-300"></i>Nuovo</a><a href="kyv_calendar.html"><i data-lucide="calendar-days" class="w-4 h-4 mr-2 text-blue-300"></i>Agenda</a><a href="progetti.html"><i data-lucide="music-2" class="w-4 h-4 mr-2 text-indigo-300"></i>Progetti</a><a href="ascolto.html"><i data-lucide="headphones" class="w-4 h-4 mr-2 text-violet-300"></i>Ascolto</a>`;
  }

  const pulse=document.getElementById('studio-pulse');
  const controlBox=document.createElement('details');
  controlBox.id='kyv-dashboard-control';
  controlBox.className='kyv-collapse kyv-pastel-peach mb-6';
  controlBox.innerHTML='<summary><span><span class="block text-sm font-black text-white">Controllo amministrativo</span><span class="block text-xs text-kyv-text mt-1">Fee, fatturato, incassi, uscite e grafici. Apri quando vuoi controllare il business.</span></span><i data-lucide="chevron-down" class="kyv-collapse-chevron w-5 h-5 text-kyv-text"></i></summary><div id="kyv-dashboard-control-body" class="kyv-collapse-body space-y-5"></div>';
  (pulse||quick||start).insertAdjacentElement('afterend',controlBox);
  const body=controlBox.querySelector('#kyv-dashboard-control-body');
  const candidates=[];
  const metrics=document.getElementById('val-fee')?.closest('.grid'); if(metrics)candidates.push(metrics);
  const types=document.getElementById('tipo-ft-cards')?.closest('.mb-6'); if(types)candidates.push(types);
  ['chartAndamento','chartTopArtisti'].forEach(id=>{const grid=document.getElementById(id)?.closest('div.grid');if(grid)candidates.push(grid);});
  [...new Set(candidates)].forEach(node=>body.appendChild(node));
  if(!body.children.length)controlBox.remove();

  collapseOperationalPanels();
  if(window.lucide)lucide.createIcons({root:document.body});
}

function boot(){
  ensurePastelStyles();
  loadActionBridge();
  loadProjectPhase2();
  loadProjectsPhase3();
  watchNavigation();
  dashboardProducerMode();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
