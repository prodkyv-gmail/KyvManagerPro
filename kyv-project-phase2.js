/* KYV Project Phase 2 — scrivania del brano e vista progressiva, non distruttiva. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

const groups={
  work:{title:'Lavorazione',subtitle:'Sessioni, collaboratori, file e materiali di lavoro.',pastel:'mint',tab:'produzione'},
  pitch:{title:'Pitch & invii',subtitle:'Invii, feedback, contatti, label e management.',pastel:'sky',tab:'produzione'},
  release:{title:'Uscita & crediti',subtitle:'Master, crediti, autori, split e dati di pubblicazione.',pastel:'lavender',tab:'diritti'},
  control:{title:'Controllo',subtitle:'Fee, fatture, pagamenti, royalty, SIAE e verifiche amministrative.',pastel:'peach',tab:'checklist'}
};

function h(value){
  if(window.KYV&&typeof window.KYV.safeHtml==='function')return window.KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function has(value){return String(value??'').trim().length>0;}
function currentView(){
  try{
    if(typeof state!=='undefined'&&state&&state.currentView)return state.currentView;
  }catch(_){}
  return null;
}
function audioDate(item){
  if(!item)return null;
  const candidates=[item.DATA_FILE,item.Data_Caricamento,item.Data_Documento,item.Data_Consegna,item.created_at,item.updated_at];
  for(const value of candidates){
    if(!value)continue;
    const time=new Date(value).getTime();
    if(Number.isFinite(time))return {value,time};
  }
  return null;
}
function formatDate(value){
  if(!value)return '';
  if(window.KYV&&typeof window.KYV.formatDate==='function')return window.KYV.formatDate(value,'');
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'':date.toLocaleDateString('it-IT');
}
function latestAudio(matches){
  const items=[...((matches&&matches.consegne)||[]),...((matches&&matches.audio)||[])];
  const unique=[];
  const seen=new Set();
  items.forEach((item,index)=>{
    const key=String(item.ID_VERSIONE||item.ID_FILE||item.ID_CONSEGNA||item.ID_DOCUMENTO||item.LINK_FILE||item.Link_Drive||item.Link_Dropbox||`row-${index}`);
    if(seen.has(key))return;
    seen.add(key);
    unique.push(item);
  });
  return unique.sort((a,b)=>{
    const ad=audioDate(a)?.time||0, bd=audioDate(b)?.time||0;
    if(ad!==bd)return bd-ad;
    const ai=Number(a.ID_VERSIONE||a.ID_FILE||a.ID_CONSEGNA||a.ID_DOCUMENTO||0);
    const bi=Number(b.ID_VERSIONE||b.ID_FILE||b.ID_CONSEGNA||b.ID_DOCUMENTO||0);
    return bi-ai;
  })[0]||null;
}
function audioMeta(item){
  if(!item)return null;
  const drive=item._source==='drive'||String(item.PROVIDER||'').toLowerCase()==='drive';
  const source=drive?'Drive':(item._source==='audio'||String(item.PROVIDER||'').toLowerCase()==='dropbox'?'Dropbox':'Storico');
  const name=item.Nome_File||item.NOME_FILE||item.Titolo_Documento||item.Titolo||item.TITOLO||item.Progetto||'File audio';
  const detail=[item.Tipo_File||item.TIPO_VERSIONE,item.Versione||item.ETICHETTA_VERSIONE].filter(Boolean).join(' · ')||'Versione audio';
  const link=drive?(item.Link_Drive||item.LINK_FILE):(item.Link_Dropbox||item.LINK_FILE||item.Link_Drive);
  const date=audioDate(item)?.value||null;
  return {source,name,detail,link:has(link)&&/^https:\/\//i.test(String(link))?String(link):'',date};
}
function injectStyles(){
  if(document.getElementById('kyv-project-phase2-style'))return;
  const style=document.createElement('style');
  style.id='kyv-project-phase2-style';
  style.textContent=`
#kyv-song-desk{position:relative;overflow:hidden}
#kyv-song-desk .kyv-desk-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}
#kyv-song-desk .kyv-desk-grid{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:.75rem}
#kyv-song-desk .kyv-desk-card{min-height:180px;border:1px solid rgba(255,255,255,.10);border-radius:1rem;padding:1rem;display:flex;flex-direction:column}
#kyv-song-desk .kyv-desk-card h3{font-size:.78rem;font-weight:900;color:#f8fafc;display:flex;align-items:center;gap:.45rem}
#kyv-song-desk .kyv-desk-main{font-size:.95rem;font-weight:900;color:#fff;line-height:1.35;margin-top:.8rem;overflow-wrap:anywhere}
#kyv-song-desk .kyv-desk-copy{font-size:.72rem;color:#aab1bf;line-height:1.5;margin-top:.45rem;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
#kyv-song-desk .kyv-desk-actions{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:auto;padding-top:.9rem}
#kyv-song-desk .kyv-desk-button{min-height:36px;padding:.48rem .68rem;border:1px solid rgba(255,255,255,.11);border-radius:.7rem;background:rgba(255,255,255,.045);color:#eef2ff;font-size:.68rem;font-weight:850;display:inline-flex;align-items:center;justify-content:center;gap:.35rem}
#kyv-song-desk .kyv-desk-button:hover{background:rgba(255,255,255,.09)}
#kyv-song-desk .kyv-desk-label{font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;font-weight:900;color:#aab1bf}
#kyv-song-desk .kyv-desk-status{font-size:.66rem;font-weight:900;color:#dbeafe;border:1px solid rgba(169,218,255,.20);background:rgba(169,218,255,.08);padding:.35rem .55rem;border-radius:999px;white-space:nowrap}
.kyv-project-progressive{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem}
.kyv-project-progressive details{border:1px solid rgba(255,255,255,.10);border-radius:.9rem;overflow:hidden}
.kyv-project-progressive summary{list-style:none;cursor:pointer;padding:.78rem .85rem;display:flex;align-items:center;justify-content:space-between;gap:.7rem}
.kyv-project-progressive summary::-webkit-details-marker{display:none}
.kyv-project-progressive .kyv-prog-title{font-size:.76rem;font-weight:900;color:#f8fafc}
.kyv-project-progressive .kyv-prog-sub{font-size:.64rem;color:#aab1bf;margin-top:.12rem;display:block;line-height:1.35}
.kyv-project-progressive .kyv-prog-count{font-size:.62rem;font-weight:900;color:#cbd5e1;padding:.22rem .4rem;border-radius:999px;background:rgba(255,255,255,.06)}
.kyv-project-progressive .kyv-prog-body{padding:0 .75rem .75rem}
.kyv-project-progressive .kyv-prog-body button{width:100%;padding:.55rem .65rem;border-radius:.65rem;color:#e2e8f0;font-size:.68rem;font-weight:850;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}
@media(max-width:1100px){#kyv-song-desk .kyv-desk-grid{grid-template-columns:1fr 1fr}.kyv-project-progressive{grid-template-columns:1fr 1fr}}
@media(max-width:767px){#kyv-song-desk .kyv-desk-grid,.kyv-project-progressive{grid-template-columns:1fr}#kyv-song-desk .kyv-desk-head{flex-direction:column}#kyv-song-desk .kyv-desk-card{min-height:160px}}
`;
  document.head.appendChild(style);
}
function openQuickField(key){
  if(typeof window.openQuickEdit!=='function')return;
  window.openQuickEdit();
  setTimeout(()=>{
    const input=[...document.querySelectorAll('#quick-edit-fields [data-key]')].find(el=>el.dataset.key===key);
    if(!input)return;
    input.focus();
    input.scrollIntoView({behavior:'smooth',block:'center'});
    input.animate?.([{outline:'2px solid rgba(34,211,238,0)'},{outline:'2px solid rgba(34,211,238,.75)'},{outline:'2px solid rgba(34,211,238,0)'}],{duration:950});
  },80);
}
function openSection(tab,targetId){
  if(typeof window.setTab==='function')window.setTab(tab);
  setTimeout(()=>{
    const target=document.getElementById(targetId);
    if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
  },80);
}
function progressiveCounts(view){
  const matches=view?.matches||{}, prot=view?.prot||{};
  return {
    work:(matches.audio||[]).length,
    pitch:(matches.invii||[]).length,
    release:(matches.docs||[]).length,
    control:(prot.missing||[]).length
  };
}
function buildProgressive(view){
  const counts=progressiveCounts(view);
  const nav=document.createElement('section');
  nav.id='kyv-project-progressive';
  nav.className='kyv-project-progressive';
  Object.entries(groups).forEach(([key,meta])=>{
    const box=document.createElement('details');
    box.className=`kyv-pastel-${meta.pastel}`;
    box.innerHTML=`<summary><span><span class="kyv-prog-title">${h(meta.title)}</span><span class="kyv-prog-sub">${h(meta.subtitle)}</span></span><span class="kyv-prog-count">${counts[key]}</span></summary><div class="kyv-prog-body"><button type="button" data-kyv-open="${key}">Apri sezione</button></div>`;
    box.querySelector('button').addEventListener('click',()=>{
      const target=key==='pitch'?'tab-audio':key==='work'?'tab-timeline':key==='release'?'tab-diritti':'tab-checklist';
      openSection(meta.tab,target);
    });
    nav.appendChild(box);
  });
  return nav;
}
function wireDesk(desk){
  desk.querySelector('[data-kyv-action="versions"]')?.addEventListener('click',()=>openSection('produzione','tab-audio'));
  desk.querySelector('[data-kyv-action="notes"]')?.addEventListener('click',()=>openQuickField('NOTE'));
  desk.querySelector('[data-kyv-action="next"]')?.addEventListener('click',()=>openQuickField('SVILUPPO'));
}
function renderDesk(){
  const view=currentView();
  const projectView=document.getElementById('project-view');
  if(!view||!projectView)return false;
  const {p,matches,prot}=view;
  const latest=audioMeta(latestAudio(matches));
  const note=has(p.NOTE)?String(p.NOTE).trim():'Nessuna nota ancora.';
  const explicitNext=has(p.SVILUPPO)?String(p.SVILUPPO).trim():'';
  const suggested=prot?.missing?.[0]?.fix||'Nessuna azione prioritaria suggerita.';
  const next=explicitNext||suggested;
  const nextLabel=explicitNext?'Impostata':'Suggerita dal controllo';
  let desk=document.getElementById('kyv-song-desk');
  if(!desk){
    desk=document.createElement('section');
    desk.id='kyv-song-desk';
    const hero=projectView.querySelector(':scope > section.kyv-card');
    if(hero)hero.insertAdjacentElement('afterend',desk);else projectView.prepend(desk);
  }
  desk.className='kyv-pastel-lavender rounded-2xl border border-white/10 p-4 sm:p-5';
  desk.innerHTML=`
    <div class="kyv-desk-head">
      <div>
        <p class="kyv-desk-label">Focus progetto · Scrivania del brano</p>
        <h2 class="text-lg sm:text-xl font-black text-white mt-1">Ascolta, annota, decidi.</h2>
        <p class="text-xs text-kyv-text mt-1">Le tre cose da vedere prima di tutto; il resto del progetto rimane sotto.</p>
      </div>
      <span class="kyv-desk-status">${h(p.STATO||'Stato non indicato')}</span>
    </div>
    <div class="kyv-desk-grid">
      <article class="kyv-desk-card kyv-pastel-sky" data-kyv-desk="audio">
        <h3><i data-lucide="audio-lines" class="w-4 h-4 text-blue-200"></i>Ultimo audio</h3>
        <p class="kyv-desk-main">${h(latest?latest.name:'Nessuna versione audio collegata')}</p>
        <p class="kyv-desk-copy">${latest?h([latest.source,latest.detail,latest.date?formatDate(latest.date):null].filter(Boolean).join(' · ')):'Apri Produzione per collegare o controllare Drive e Dropbox.'}</p>
        <div class="kyv-desk-actions">
          ${latest&&latest.link?`<a class="kyv-desk-button" href="${h(latest.link)}" target="_blank" rel="noopener"><i data-lucide="play" class="w-3.5 h-3.5"></i>Apri file</a>`:''}
          <button class="kyv-desk-button" type="button" data-kyv-action="versions"><i data-lucide="list-music" class="w-3.5 h-3.5"></i>Audio / versioni</button>
        </div>
      </article>
      <article class="kyv-desk-card kyv-pastel-mint" data-kyv-desk="notes">
        <h3><i data-lucide="notebook-pen" class="w-4 h-4 text-emerald-200"></i>Note rapide</h3>
        <p class="kyv-desk-main">${h(has(p.NOTE)?'Note del progetto':'Ancora vuoto')}</p>
        <p class="kyv-desk-copy">${h(note)}</p>
        <div class="kyv-desk-actions"><button class="kyv-desk-button" type="button" data-kyv-action="notes"><i data-lucide="pencil" class="w-3.5 h-3.5"></i>Modifica note</button></div>
      </article>
      <article class="kyv-desk-card kyv-pastel-peach" data-kyv-desk="next">
        <h3><i data-lucide="move-right" class="w-4 h-4 text-orange-200"></i>Prossima azione</h3>
        <p class="kyv-desk-label mt-3">${h(nextLabel)}</p>
        <p class="kyv-desk-main">${h(next)}</p>
        <div class="kyv-desk-actions"><button class="kyv-desk-button" type="button" data-kyv-action="next"><i data-lucide="square-pen" class="w-3.5 h-3.5"></i>Modifica azione</button></div>
      </article>
    </div>`;
  wireDesk(desk);
  document.getElementById('kyv-project-progressive')?.remove();
  desk.insertAdjacentElement('afterend',buildProgressive(view));
  if(window.lucide)lucide.createIcons({root:projectView});
  return true;
}
function setupWatchers(){
  const summary=document.getElementById('tab-sintesi');
  const title=document.getElementById('hero-title');
  const refresh=()=>setTimeout(renderDesk,0);
  if(summary)new MutationObserver(refresh).observe(summary,{childList:true});
  if(title)new MutationObserver(refresh).observe(title,{childList:true,subtree:true,characterData:true});
  refresh();
}
function boot(){
  injectStyles();
  const start=()=>{
    if(!document.getElementById('project-view'))return false;
    setupWatchers();
    return true;
  };
  if(start())return;
  const observer=new MutationObserver(()=>{if(start())observer.disconnect();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),8000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
