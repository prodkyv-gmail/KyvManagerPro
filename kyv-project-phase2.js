/* KYV Project Phase 2 — scheda progetto progressiva, non distruttiva. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

const groups={
  work:{title:'Lavorazione',subtitle:'Sessioni, collaboratori, file e materiali di lavoro.',pastel:'mint'},
  pitch:{title:'Pitch & invii',subtitle:'Invii, feedback, contatti, label e management.',pastel:'sky'},
  release:{title:'Uscita & crediti',subtitle:'Master, crediti, autori, split e dati di pubblicazione.',pastel:'lavender'},
  control:{title:'Controllo',subtitle:'Fee, fatture, pagamenti, royalty, SIAE e verifiche amministrative.',pastel:'peach'}
};
const essentialTerms=['audio','version','nota','prossima azione','follow-up','stato','titolo','artista'];
const workTerms=['session','collabor','partecip','material','file','document','demo','take','stem'];
const pitchTerms=['pitch','invio','feedback','label','management','a&r','contatto','mandato'];
const releaseTerms=['uscita','release','master','isrc','credit','autori','split','edizion','distribuz'];
const controlTerms=['fee','fattur','pagament','incass','royalt','siae','rendicont','econom','compenso','saldo'];

function norm(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}
function textOf(el){const head=el.querySelector('h2,h3,h4,h5,legend,.font-black,.font-bold,strong,label');return norm(head?.textContent||'');}
function hasAny(text,terms){return terms.some(term=>text.includes(term));}
function categoryFor(text){if(!text)return '';if(hasAny(text,essentialTerms))return 'essential';if(hasAny(text,controlTerms))return 'control';if(hasAny(text,releaseTerms))return 'release';if(hasAny(text,pitchTerms))return 'pitch';if(hasAny(text,workTerms))return 'work';return '';}
function safeCandidates(root){
  const all=[...root.querySelectorAll('.kyv-panel,.bg-kyv-card,section.rounded-xl,section.rounded-2xl,article.rounded-xl,article.rounded-2xl,div.rounded-xl,div.rounded-2xl')];
  return all.filter(el=>{
    if(el.closest('#sidebar,[role="dialog"],#kyv-project-focus'))return false;
    if(!el.querySelector('h2,h3,h4,h5,legend,.font-black,.font-bold,strong'))return false;
    const parent=el.parentElement?.closest('.kyv-panel,.bg-kyv-card,section.rounded-xl,section.rounded-2xl,article.rounded-xl,article.rounded-2xl,div.rounded-xl,div.rounded-2xl');
    return !parent || parent===root;
  });
}
function findByTerms(root,terms){return safeCandidates(root).find(el=>hasAny(textOf(el),terms))||null;}
function scrollToBlock(block){if(!block)return;block.hidden=false;block.scrollIntoView({behavior:'smooth',block:'start'});block.animate?.([{outline:'2px solid rgba(190,182,255,0)'},{outline:'2px solid rgba(190,182,255,.55)'},{outline:'2px solid rgba(190,182,255,0)'}],{duration:1100});}
function injectStyles(){
  if(document.getElementById('kyv-project-phase2-style'))return;
  const style=document.createElement('style');style.id='kyv-project-phase2-style';style.textContent=`#kyv-project-focus{position:relative;overflow:hidden}#kyv-project-focus .kyv-focus-actions{display:flex;flex-wrap:wrap;gap:.55rem}#kyv-project-focus .kyv-focus-actions button{min-height:40px;padding:.58rem .82rem;border:1px solid rgba(255,255,255,.12);border-radius:.75rem;background:rgba(255,255,255,.045);color:#eef2ff;font-size:.75rem;font-weight:800}#kyv-project-focus .kyv-focus-actions button:hover{background:rgba(255,255,255,.09)}.kyv-project-progressive{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;margin:0 0 1rem}.kyv-project-progressive details{border:1px solid rgba(255,255,255,.10);border-radius:1rem;overflow:hidden}.kyv-project-progressive summary{list-style:none;cursor:pointer;padding:.9rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}.kyv-project-progressive summary::-webkit-details-marker{display:none}.kyv-project-progressive .kyv-prog-title{font-size:.86rem;font-weight:850;color:#f8fafc}.kyv-project-progressive .kyv-prog-sub{font-size:.7rem;color:#aab1bf;margin-top:.15rem;display:block}.kyv-project-progressive .kyv-prog-count{font-size:.68rem;font-weight:850;color:#cbd5e1;padding:.25rem .45rem;border-radius:999px;background:rgba(255,255,255,.06)}.kyv-project-progressive .kyv-prog-body{padding:0 .75rem .75rem}.kyv-project-progressive .kyv-prog-body button{width:100%;text-align:left;padding:.65rem .7rem;border-radius:.7rem;color:#dbe3f0;font-size:.72rem;font-weight:750;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);margin-top:.35rem}.kyv-project-progressive .kyv-prog-body button:hover{background:rgba(255,255,255,.075)}@media(max-width:767px){.kyv-project-progressive{grid-template-columns:1fr}}`;document.head.appendChild(style);
}
function buildFocus(root){
  if(document.getElementById('kyv-project-focus'))return;
  const header=root.querySelector(':scope > header, header');
  const title=[...root.querySelectorAll('h1,h2')].map(x=>x.textContent.trim()).find(Boolean)||'Progetto';
  const hero=document.createElement('section');hero.id='kyv-project-focus';hero.className='kyv-pastel-lavender rounded-2xl border border-white/10 p-5 sm:p-6 mb-4';hero.innerHTML=`<div class="flex flex-col gap-4"><div><p class="text-[10px] uppercase tracking-[.18em] font-black text-cyan-200">Focus progetto</p><h2 class="text-xl sm:text-2xl font-black text-white mt-1">${title}</h2><p class="text-xs sm:text-sm text-kyv-text mt-2">Prima ascolta, annota e decidi la prossima azione. Tutto il resto resta disponibile quando serve.</p></div><div class="kyv-focus-actions"></div></div>`;
  const actions=hero.querySelector('.kyv-focus-actions');
  [['Audio / versioni',['audio','version']],['Note',['nota']],['Prossima azione',['prossima azione','follow-up']]].forEach(([label,terms])=>{const block=findByTerms(root,terms);const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=!block;if(block)button.addEventListener('click',()=>scrollToBlock(block));actions.appendChild(button);});
  if(header)header.insertAdjacentElement('afterend',hero);else root.prepend(hero);
}
function buildProgressive(root,categorized){
  if(document.getElementById('kyv-project-progressive'))return;
  const focus=document.getElementById('kyv-project-focus');const nav=document.createElement('section');nav.id='kyv-project-progressive';nav.className='kyv-project-progressive';
  Object.entries(groups).forEach(([key,meta])=>{const entries=categorized[key]||[];if(!entries.length)return;entries.forEach(el=>{el.hidden=true;el.dataset.kyvPhase2Category=key;});const box=document.createElement('details');box.className=`kyv-pastel-${meta.pastel}`;box.innerHTML=`<summary><span><span class="kyv-prog-title">${meta.title}</span><span class="kyv-prog-sub">${meta.subtitle}</span></span><span class="kyv-prog-count">${entries.length}</span></summary><div class="kyv-prog-body"></div>`;const body=box.querySelector('.kyv-prog-body');entries.forEach((el,index)=>{const button=document.createElement('button');button.type='button';button.textContent=textOf(el)||`${meta.title} ${index+1}`;button.addEventListener('click',()=>scrollToBlock(el));body.appendChild(button);});box.addEventListener('toggle',()=>{entries.forEach(el=>el.hidden=!box.open);if(box.open&&entries[0])setTimeout(()=>entries[0].scrollIntoView({behavior:'smooth',block:'start'}),120);});nav.appendChild(box);});
  if(nav.children.length)(focus||root.firstElementChild).insertAdjacentElement('afterend',nav);
}
function categorize(root){const out={essential:[],work:[],pitch:[],release:[],control:[]};safeCandidates(root).forEach(el=>{const cat=categoryFor(textOf(el));if(cat)out[cat].push(el);});return out;}
function enhance(){injectStyles();const root=document.querySelector('main > section, main .kyv-page-surface, main');if(!root||root.dataset.kyvPhase2==='1')return false;const categorized=categorize(root);const recognized=Object.values(categorized).reduce((n,a)=>n+a.length,0);if(!recognized)return false;root.dataset.kyvPhase2='1';buildFocus(root);buildProgressive(root,categorized);if(window.lucide)lucide.createIcons({root});return true;}
function boot(){if(enhance())return;const observer=new MutationObserver(()=>{if(enhance())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>{enhance();observer.disconnect();},8000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
