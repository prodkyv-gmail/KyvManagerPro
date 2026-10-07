/* KYV Interested → Release — handoff operativo dal pitch accettato al master/Release Desk, senza nuove tabelle. */
(function(){
'use strict';

if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

let observer=null;
let timer=null;

function text(value){return String(value??'').trim();}
function H(value){
  if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function schedule(){clearTimeout(timer);timer=setTimeout(run,70);}
function project(){try{return (typeof state!=='undefined'&&state?.currentView?.p)||{};}catch(_){return{};}}
function releaseDesk(){return document.getElementById('kyv-release-desk')||document.getElementById('kyv-project-v2-release');}
function pitchPanel(){return document.getElementById('kyv-pitch-followup-project');}

function injectStyles(){
  if(document.getElementById('kyv-interest-release-style'))return;
  const style=document.createElement('style');
  style.id='kyv-interest-release-style';
  style.textContent=`
.kyv-interest-release-bridge{margin-top:.65rem;padding:.62rem .68rem;border:1px solid rgba(34,197,94,.24);border-radius:.72rem;background:linear-gradient(135deg,rgba(34,197,94,.09),rgba(56,189,248,.045))}.kyv-interest-release-bridge strong{display:block;color:#dcfce7;font-size:.66rem}.kyv-interest-release-bridge p{color:#a7f3d0!important;font-size:.59rem!important;line-height:1.45;margin-top:.2rem!important}.kyv-interest-release-banner{margin-bottom:.75rem;padding:.68rem .72rem;border:1px solid rgba(34,197,94,.24);border-radius:.78rem;background:rgba(34,197,94,.07);display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem}.kyv-interest-release-banner strong{display:block;color:#dcfce7;font-size:.7rem}.kyv-interest-release-banner p{color:#a7f3d0;font-size:.61rem;line-height:1.45;margin-top:.18rem}.kyv-interest-release-focus{animation:kyv-interest-release-pulse 1.2s ease-out 1}@keyframes kyv-interest-release-pulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.34)}100%{box-shadow:0 0 0 14px rgba(34,197,94,0)}}@media(max-width:640px){.kyv-interest-release-banner{flex-direction:column}}
  `;
  document.head.appendChild(style);
}

function infoFromCard(card){
  const recipient=text(card.querySelector('h4')?.textContent)||'Destinatario';
  const versionLine=[...card.querySelectorAll('p')].find(node=>/^Versione:/i.test(text(node.textContent)));
  const version=text(versionLine?.textContent).replace(/^Versione:\s*/i,'')||'versione inviata';
  return{id:text(card.dataset.pitchId),recipient,version};
}
function interestedCards(){return [...document.querySelectorAll('.kyv-pitch-card')].filter(card=>card.querySelector('.kyv-pitch-confirmed'));}
function dueCard(){return [...document.querySelectorAll('.kyv-pitch-card')].find(card=>card.querySelector('.kyv-pitch-due'))||null;}
function hasMaster(){return Boolean(text(project()?.Data_Consegna_Master));}
function releaseScore(){return text(document.querySelector('#kyv-release-desk .kyv-release-score strong')?.textContent);}

function focusRelease(){
  const target=releaseDesk();if(!target)return;
  target.scrollIntoView({behavior:'smooth',block:'start'});
  target.classList.remove('kyv-interest-release-focus');
  requestAnimationFrame(()=>target.classList.add('kyv-interest-release-focus'));
  setTimeout(()=>target.classList.remove('kyv-interest-release-focus'),1400);
}

function ensureCardBridge(card,info){
  const fingerprint=[info.id,info.recipient,info.version,hasMaster()?'master':'nomaster'].join('|');
  let bridge=card.querySelector('[data-interest-release]');
  if(bridge?.dataset.fingerprint===fingerprint)return false;
  if(!bridge){bridge=document.createElement('div');bridge.dataset.interestRelease='1';bridge.className='kyv-interest-release-bridge';card.appendChild(bridge);}
  bridge.dataset.fingerprint=fingerprint;
  bridge.innerHTML=`<div class="flex flex-wrap items-center justify-between gap-2"><div><strong>Passaggio successivo · Release</strong><p>${H(info.version)} ha ricevuto interesse da ${H(info.recipient)}. ${hasMaster()?'Il master è già indicato: chiudi i dati release mancanti.':'Verifica la versione finale/master prima della pubblicazione.'}</p></div><button type="button" class="kyv-pitch-btn good" data-interest-release-open><i data-lucide="rocket" class="w-3 h-3"></i>Vai al Release Desk</button></div>`;
  bridge.querySelector('[data-interest-release-open]')?.addEventListener('click',focusRelease);
  return true;
}

function ensureReleaseBanner(info){
  const desk=document.getElementById('kyv-release-desk');if(!desk)return false;
  const fingerprint=[info.id,info.recipient,info.version,hasMaster()?'master':'nomaster',releaseScore()].join('|');
  let banner=desk.querySelector('[data-interest-release-banner]');
  if(banner?.dataset.fingerprint===fingerprint)return false;
  if(!banner){banner=document.createElement('div');banner.dataset.interestReleaseBanner='1';banner.className='kyv-interest-release-banner';desk.prepend(banner);}
  banner.dataset.fingerprint=fingerprint;
  banner.innerHTML=`<div><strong><i data-lucide="circle-check-big" class="w-3.5 h-3.5 inline mr-1"></i>Pitch interessato · ${H(info.recipient)}</strong><p>Versione di riferimento: ${H(info.version)}. ${hasMaster()?'Master indicato: completa i controlli rimasti.':'Prima conferma quale versione diventa finale/master, poi completa uscita e crediti.'}</p></div><button type="button" class="kyv-release-btn primary" data-interest-release-edit>${hasMaster()?'Completa release':'Apri dati release'}</button>`;
  banner.querySelector('[data-interest-release-edit]')?.addEventListener('click',()=>desk.querySelector('[data-release-edit]')?.click());
  return true;
}

function ensureHero(info){
  const box=document.getElementById('kyv-v2-next');if(!box)return false;
  const due=dueCard();
  if(due){
    if(!box.dataset.kyvInterestRelease)return false;
    const dueInfo=infoFromCard(due),fingerprint=`due|${dueInfo.id}|${dueInfo.recipient}`;
    if(box.dataset.kyvInterestRelease===fingerprint)return false;
    box.dataset.kyvInterestRelease=fingerprint;
    box.className='kyv-v2-next due';
    box.innerHTML=`<div><p class="kyv-v2-kicker">Prossima azione</p><strong>Sollecita ${H(dueInfo.recipient)}</strong><p>Il follow-up scaduto resta prioritario prima del passaggio release.</p></div><button type="button" data-interest-next>Vai agli invii</button>`;
    box.querySelector('[data-interest-next]')?.addEventListener('click',()=>pitchPanel()?.scrollIntoView({behavior:'smooth',block:'start'}));
    return true;
  }
  const master=hasMaster(),score=releaseScore();
  const fingerprint=['interest',info.id,info.recipient,info.version,master?'master':'nomaster',score].join('|');
  if(box.dataset.kyvInterestRelease===fingerprint)return false;
  box.dataset.kyvInterestRelease=fingerprint;
  box.className='kyv-v2-next';
  box.innerHTML=`<div><p class="kyv-v2-kicker">Prossima azione</p><strong>${master?'Completa il Release Desk':'Conferma la versione finale'}</strong><p>${H(info.recipient)} è interessato a ${H(info.version)}. ${master?`Stato release: ${H(score||'da completare')}.`:'Verifica il master e passa alla preparazione dell’uscita.'}</p></div><button type="button" data-interest-next>Vai al Release Desk</button>`;
  box.querySelector('[data-interest-next]')?.addEventListener('click',focusRelease);
  return true;
}

function cleanup(){
  document.querySelectorAll('[data-interest-release],[data-interest-release-banner]').forEach(node=>node.remove());
  const box=document.getElementById('kyv-v2-next');if(box)delete box.dataset.kyvInterestRelease;
}

function run(){
  injectStyles();
  const cards=interestedCards();
  if(!cards.length){cleanup();return;}
  document.querySelectorAll('.kyv-pitch-card [data-interest-release]').forEach(node=>{if(!node.closest('.kyv-pitch-card')?.querySelector('.kyv-pitch-confirmed'))node.remove();});
  let changed=false;
  cards.forEach(card=>{if(ensureCardBridge(card,infoFromCard(card)))changed=true;});
  const latest=infoFromCard(cards[0]);
  if(ensureReleaseBanner(latest))changed=true;
  if(ensureHero(latest))changed=true;
  if(changed&&window.lucide){
    const root=document.getElementById('project-view')||document.body;
    lucide.createIcons({root});
  }
}

function boot(){
  run();
  const root=document.getElementById('project-view')||document.documentElement;
  observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  window.addEventListener('kyv:pitch-updated',schedule);
  window.addEventListener('kyv:project-v2-ready',schedule);
  window.addEventListener('beforeunload',()=>observer?.disconnect(),{once:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
