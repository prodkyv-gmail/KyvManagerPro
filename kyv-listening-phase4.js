/* KYV Listening Phase 4 — Artista → Progetto → Versioni, senza scansioni cloud automatiche. */
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'').toLowerCase();
if(page!=='ascolto.html')return;

let db=null;
let projects=[];
let versions=[];
let selectedArtist='';
let selectedProject='';
let currentVersionKey='';
let legacyRadioOriginal=null;

function text(value){return String(value??'').trim();}
function H(value){
  if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function projectById(id){return projects.find(p=>String(p.ID)===String(id))||null;}
function projectLabel(p){return [text(p?.ARTISTA),text(p?.TITOLO)].filter(Boolean).join(' · ')||`Progetto ${text(p?.ID)}`;}
function artistLabel(p){return text(p?.ARTISTA)||'Senza artista';}
function dateScore(value){const n=new Date(value||0).getTime();return Number.isFinite(n)?n:0;}
function formatDate(value){
  if(!value)return'';
  if(window.KYV&&typeof KYV.formatDate==='function')return KYV.formatDate(value,'');
  const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('it-IT');
}
function sourceName(source){return source==='audio'?'Versione':source==='dropbox'?'Dropbox':source==='master'?'Master':'Audio';}
function extractDriveId(url){const raw=String(url||'');return raw.match(/\/d\/([^/?#]+)/)?.[1]||raw.match(/[?&]id=([^&#]+)/)?.[1]||'';}
function playableUrl(link,source){
  const raw=text(link);if(!raw)return'';
  if(/\.(mp3|wav|m4a|aac|ogg|oga|flac|aif|aiff)(?:[?#].*)?$/i.test(raw))return raw;
  try{
    const u=new URL(raw);
    if(/(^|\.)dropbox\.com$/i.test(u.hostname)){u.searchParams.delete('dl');u.searchParams.set('raw','1');return u.toString();}
    if(u.hostname.includes('drive.google.com')){const id=extractDriveId(raw);if(id)return`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;}
  }catch(_){}
  return source==='dropbox'?raw:'';
}
function versionFrom(row,source,index){
  const projectId=text(row.ID_PROGETTO||row.id_progetto||row.PROGETTO_ID||row.Progetto_ID);
  if(!projectId)return null;
  const p=projectById(projectId);
  const file=text(row.NOME_FILE||row.Nome_File||row.Nome_file||row.filename||row.name||row.Titolo_Documento);
  const title=text(row.TITOLO||row.Titolo||row.Titolo_Documento||row.Progetto||file)||'Versione audio';
  const type=text(row.TIPO_VERSIONE||row.Tipo_Versione||row.Tipo_File||row.Contesto)||sourceName(source);
  const version=text(row.ETICHETTA_VERSIONE||row.Versione||row.VERSIONE);
  const link=text(row.LINK_FILE||row.Link_Dropbox||row.Link_Drive||row.Link||row.url||row.webContentLink||row.webViewLink);
  const date=row.DATA_FILE||row.Data_Caricamento||row.Data_Consegna||row.Data_Documento||row.created_at||row.updated_at||row.created||row.updated||'';
  const artist=text(row.ARTISTA||row.Artista)||text(p?.ARTISTA);
  const key=`${source}:${text(row.ID_VERSIONE||row.ID_FILE||row.ID_CONSEGNA||row.ID_DOCUMENTO)||link||file||index}`;
  return {key,projectId,project:p,artist,title,file:file||title,type,version,link,playUrl:playableUrl(link,source),date,score:dateScore(date)||Number(row.ID_VERSIONE||row.ID_FILE||row.ID_CONSEGNA||0)||0,source};
}
function dedupe(items){
  const map=new Map();
  items.filter(Boolean).forEach(item=>{
    const key=[item.projectId,item.link||item.file||item.title,item.version].join('|').toLowerCase();
    const existing=map.get(key);
    if(!existing||item.score>existing.score)map.set(key,item);
  });
  return [...map.values()].sort((a,b)=>b.score-a.score||b.key.localeCompare(a.key));
}
async function safeRows(table,limit=2500){
  try{const result=await client().from(table).select('*').limit(limit);return result.error?[]:(result.data||[]);}catch(_){return[];}
}
async function loadData(){
  if(!client())throw new Error('Database non disponibile.');
  const [p,a,d,m]=await Promise.all([
    client().from('PROGETTI').select('*').limit(1000),
    safeRows('AUDIO_VERSIONI',4000),
    safeRows('DROPBOX_AUDIO_FILES',3000),
    safeRows('CONSEGNE_MASTER',2000)
  ]);
  if(p.error)throw p.error;
  projects=p.data||[];
  versions=dedupe([
    ...a.map((row,i)=>versionFrom(row,'audio',i)),
    ...d.map((row,i)=>versionFrom(row,'dropbox',i)),
    ...m.map((row,i)=>versionFrom(row,'master',i))
  ]);
  const first=versions[0];
  if(first){selectedProject=String(first.projectId);selectedArtist=artistLabel(projectById(first.projectId));currentVersionKey=first.key;}
}
function groupedProjects(){
  const map=new Map();
  versions.forEach(v=>{
    const p=projectById(v.projectId);if(!p)return;
    const id=String(p.ID);if(!map.has(id))map.set(id,{project:p,versions:[]});map.get(id).versions.push(v);
  });
  return [...map.values()].map(group=>{group.versions.sort((a,b)=>b.score-a.score);group.latest=group.versions[0];return group;}).sort((a,b)=>(b.latest?.score||0)-(a.latest?.score||0));
}
function artists(){
  const groups=groupedProjects(),map=new Map();
  groups.forEach(group=>{const name=artistLabel(group.project);if(!map.has(name))map.set(name,{name,projects:[],latest:0,versions:0});const entry=map.get(name);entry.projects.push(group);entry.versions+=group.versions.length;entry.latest=Math.max(entry.latest,group.latest?.score||0);});
  return [...map.values()].sort((a,b)=>b.latest-a.latest||a.name.localeCompare(b.name,'it'));
}
function searchQuery(){return text(document.getElementById('kyv-listen-search')?.value).toLowerCase();}
function matchesSearch(group,q){if(!q)return true;const blob=[group.project?.ARTISTA,group.project?.TITOLO,group.project?.STATO,...group.versions.flatMap(v=>[v.title,v.file,v.type,v.version])].join(' ').toLowerCase();return blob.includes(q);}
function currentProjectGroup(){return groupedProjects().find(g=>String(g.project.ID)===String(selectedProject))||null;}
function injectStyles(){
  if(document.getElementById('kyv-listening-phase4-style'))return;
  const style=document.createElement('style');style.id='kyv-listening-phase4-style';style.textContent=`
#kyv-listening-phase4{margin-bottom:1rem}.kyv-listen-grid{display:grid;grid-template-columns:230px 310px minmax(0,1fr);gap:.8rem}.kyv-listen-column{border:1px solid rgba(255,255,255,.09);border-radius:1rem;padding:.8rem;min-height:460px}.kyv-listen-list{display:flex;flex-direction:column;gap:.45rem;max-height:62vh;overflow:auto;padding-right:.15rem}.kyv-listen-choice{width:100%;text-align:left;padding:.72rem .75rem;border:1px solid rgba(255,255,255,.07);border-radius:.75rem;background:rgba(255,255,255,.025);transition:.15s}.kyv-listen-choice:hover{background:rgba(255,255,255,.065)}.kyv-listen-choice.active{border-color:rgba(190,182,255,.40);background:rgba(190,182,255,.12)}.kyv-listen-choice strong{display:block;color:#fff;font-size:.77rem}.kyv-listen-choice span{display:block;color:#94a3b8;font-size:.65rem;margin-top:.2rem}.kyv-listen-version{border:1px solid rgba(255,255,255,.08);border-radius:.85rem;padding:.8rem;background:rgba(255,255,255,.025)}.kyv-listen-version.latest{border-color:rgba(166,235,211,.24);background:rgba(166,235,211,.06)}.kyv-listen-version .meta{font-size:.65rem;color:#94a3b8}.kyv-listen-action{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;padding:.48rem .65rem;border-radius:.65rem;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.045);color:#e5e7eb;font-size:.67rem;font-weight:850}.kyv-listen-action:hover{background:rgba(255,255,255,.09)}#kyv-listen-player{width:100%;margin-top:.7rem}.kyv-listen-empty{padding:2rem .8rem;text-align:center;color:#94a3b8;font-size:.75rem}.kyv-listen-advanced{border:1px solid rgba(255,255,255,.08);border-radius:1rem;overflow:hidden}.kyv-listen-advanced>summary{cursor:pointer;list-style:none;padding:.9rem 1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem}.kyv-listen-advanced>summary::-webkit-details-marker{display:none}.kyv-listen-advanced-body{padding:.5rem}.kyv-listen-advanced #tab-radio{display:none!important}@media(max-width:1050px){.kyv-listen-grid{grid-template-columns:200px minmax(0,1fr)}.kyv-listen-column[data-kyv-column="versions"]{grid-column:1/-1}}@media(max-width:720px){.kyv-listen-grid{grid-template-columns:1fr}.kyv-listen-column{min-height:auto}.kyv-listen-column[data-kyv-column="versions"]{grid-column:auto}.kyv-listen-list{max-height:36vh}}
`;document.head.appendChild(style);
}
function installLegacyScanGuard(){
  const started=Date.now();
  const timer=setInterval(()=>{
    if(typeof window.loadRadioTracks==='function'&&!window.loadRadioTracks.__kyvPhase4Noop){
      legacyRadioOriginal=window.loadRadioTracks;
      const noop=async function(){window.loadRadioTracks=legacyRadioOriginal;return 0;};
      noop.__kyvPhase4Noop=true;window.loadRadioTracks=noop;clearInterval(timer);
    }else if(Date.now()-started>7000)clearInterval(timer);
  },0);
}
function buildShell(){
  const root=document.querySelector('main > section');if(!root||document.getElementById('kyv-listening-phase4'))return null;
  const legacy=document.createElement('details');legacy.id='kyv-listening-legacy';legacy.className='kyv-listen-advanced kyv-pastel-sky mt-4';legacy.innerHTML='<summary><span><span class="block text-sm font-black text-white">Strumenti avanzati</span><span class="block text-xs text-kyv-text mt-1">Drive, Dropbox diretto, file locali e vecchia stazione. Nessuna scansione parte automaticamente.</span></span><i data-lucide="chevron-down" class="w-4 h-4 text-kyv-text"></i></summary><div class="kyv-listen-advanced-body"></div>';
  const body=legacy.querySelector('.kyv-listen-advanced-body');[...root.children].forEach(node=>body.appendChild(node));
  const app=document.createElement('section');app.id='kyv-listening-phase4';app.innerHTML=`
    <header class="mb-5"><div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4"><div><p class="text-[10px] uppercase tracking-[.18em] font-black text-violet-200">Libreria di lavoro</p><h2 class="text-2xl sm:text-3xl font-black text-white mt-1">Ascolto</h2><p class="text-xs sm:text-sm text-kyv-text mt-2">Artista → Progetto → Versioni. Parti dall’ultima versione e torna alla scheda quando devi lavorarci.</p></div><div class="flex gap-2"><input id="kyv-listen-search" class="kyv-input min-w-[240px]" placeholder="Cerca artista, progetto o versione"><button id="kyv-listen-refresh" class="kyv-listen-action"><i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>Aggiorna</button></div></div></header>
    <div class="kyv-listen-grid">
      <aside class="kyv-listen-column kyv-pastel-lavender" data-kyv-column="artists"><div class="flex items-center justify-between mb-3"><h3 class="text-sm font-black text-white">Artisti</h3><span id="kyv-listen-artist-count" class="text-[10px] font-black text-kyv-text"></span></div><div id="kyv-listen-artists" class="kyv-listen-list"></div></aside>
      <aside class="kyv-listen-column kyv-pastel-mint" data-kyv-column="projects"><div class="flex items-center justify-between mb-3"><h3 class="text-sm font-black text-white">Progetti</h3><span id="kyv-listen-project-count" class="text-[10px] font-black text-kyv-text"></span></div><div id="kyv-listen-projects" class="kyv-listen-list"></div></aside>
      <section class="kyv-listen-column kyv-pastel-peach" data-kyv-column="versions"><div id="kyv-listen-project-head"></div><audio id="kyv-listen-player" controls preload="none"></audio><p id="kyv-listen-playing" class="text-[10px] text-kyv-text mt-1"></p><div id="kyv-listen-versions" class="space-y-2 mt-4"></div></section>
    </div>`;
  root.appendChild(app);root.appendChild(legacy);return app;
}
function renderArtists(){
  const q=searchQuery();let rows=artists().filter(a=>a.projects.some(g=>matchesSearch(g,q)));
  if(rows.length&&!rows.some(a=>a.name===selectedArtist))selectedArtist=rows[0].name;
  document.getElementById('kyv-listen-artist-count').textContent=`${rows.length}`;
  const host=document.getElementById('kyv-listen-artists');host.innerHTML=rows.length?rows.map(a=>`<button class="kyv-listen-choice ${a.name===selectedArtist?'active':''}" data-artist="${H(a.name)}"><strong>${H(a.name)}</strong><span>${a.projects.length} progetti · ${a.versions} versioni</span></button>`).join(''):'<div class="kyv-listen-empty">Nessun artista con versioni audio registrate.</div>';
  host.querySelectorAll('[data-artist]').forEach(btn=>btn.addEventListener('click',()=>{selectedArtist=btn.dataset.artist;const first=groupedProjects().find(g=>artistLabel(g.project)===selectedArtist&&matchesSearch(g,searchQuery()));selectedProject=first?String(first.project.ID):'';currentVersionKey=first?.latest?.key||'';renderAll();}));
}
function renderProjects(){
  const q=searchQuery();const rows=groupedProjects().filter(g=>artistLabel(g.project)===selectedArtist&&matchesSearch(g,q));
  if(rows.length&&!rows.some(g=>String(g.project.ID)===String(selectedProject))){selectedProject=String(rows[0].project.ID);currentVersionKey=rows[0].latest?.key||'';}
  document.getElementById('kyv-listen-project-count').textContent=`${rows.length}`;
  const host=document.getElementById('kyv-listen-projects');host.innerHTML=rows.length?rows.map(g=>`<button class="kyv-listen-choice ${String(g.project.ID)===String(selectedProject)?'active':''}" data-project="${H(g.project.ID)}"><strong>${H(g.project.TITOLO||'Senza titolo')}</strong><span>${g.versions.length} versioni · ${H(formatDate(g.latest?.date)||'senza data')}</span></button>`).join(''):'<div class="kyv-listen-empty">Nessun progetto per questo artista.</div>';
  host.querySelectorAll('[data-project]').forEach(btn=>btn.addEventListener('click',()=>{selectedProject=btn.dataset.project;const group=currentProjectGroup();currentVersionKey=group?.latest?.key||'';renderAll();}));
}
function playVersion(key){
  const group=currentProjectGroup(),v=group?.versions.find(item=>item.key===key);if(!v)return;
  currentVersionKey=v.key;const player=document.getElementById('kyv-listen-player');const status=document.getElementById('kyv-listen-playing');
  if(!v.playUrl){if(status)status.textContent='Questo link non consente ascolto diretto: usa “Apri file”.';return;}
  player.src=v.playUrl;player.load();player.play().catch(()=>{if(status)status.textContent='Streaming non disponibile per questo link. Usa “Apri file”.';});if(status)status.textContent=`In ascolto: ${v.file||v.title}`;renderVersions(false);
}
function renderVersions(refreshHead=true){
  const group=currentProjectGroup(),head=document.getElementById('kyv-listen-project-head'),host=document.getElementById('kyv-listen-versions');
  if(!group){head.innerHTML='<div class="kyv-listen-empty">Seleziona un progetto.</div>';host.innerHTML='';return;}
  if(refreshHead)head.innerHTML=`<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><p class="text-[10px] uppercase tracking-[.14em] font-black text-orange-200">${H(artistLabel(group.project))}</p><h3 class="text-xl font-black text-white mt-1">${H(group.project.TITOLO||'Senza titolo')}</h3><p class="text-xs text-kyv-text mt-1">${H(group.project.STATO||'Stato non indicato')} · ${group.versions.length} versioni</p></div><div class="flex flex-wrap gap-2"><a class="kyv-listen-action" href="scheda_progetto.html?id=${encodeURIComponent(group.project.ID)}"><i data-lucide="panel-top-open" class="w-3.5 h-3.5"></i>Scheda progetto</a><a class="kyv-listen-action" href="acquisisci_audio.html?mode=version&project=${encodeURIComponent(group.project.ID)}"><i data-lucide="plus" class="w-3.5 h-3.5"></i>Aggiungi versione</a></div></div>`;
  host.innerHTML=group.versions.map((v,index)=>`<article class="kyv-listen-version ${index===0?'latest':''} ${v.key===currentVersionKey?'ring-1 ring-violet-400/40':''}" data-version-key="${H(v.key)}"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><span class="text-[9px] uppercase tracking-wider font-black ${index===0?'text-emerald-200':'text-kyv-text'}">${index===0?'Ultima versione':`Versione ${index+1}`}</span><span class="text-[9px] uppercase tracking-wider font-black text-slate-400">${H(sourceName(v.source))}</span></div><h4 class="text-sm font-black text-white mt-1 break-words">${H(v.file||v.title)}</h4><p class="meta mt-1">${H([v.type,v.version,formatDate(v.date)].filter(Boolean).join(' · ')||'Audio')}</p></div><span class="text-[10px] font-black text-kyv-text">${group.versions.length-index}/${group.versions.length}</span></div><div class="flex flex-wrap gap-2 mt-3">${v.playUrl?`<button class="kyv-listen-action" data-play="${H(v.key)}"><i data-lucide="play" class="w-3.5 h-3.5"></i>Ascolta</button>`:''}${v.link?`<a class="kyv-listen-action" href="${H(v.link)}" target="_blank" rel="noopener"><i data-lucide="external-link" class="w-3.5 h-3.5"></i>Apri file</a>`:''}</div></article>`).join('');
  host.querySelectorAll('[data-play]').forEach(btn=>btn.addEventListener('click',()=>playVersion(btn.dataset.play)));
  if(window.lucide)lucide.createIcons({root:document.getElementById('kyv-listening-phase4')});
}
function renderAll(){renderArtists();renderProjects();renderVersions();if(window.lucide)lucide.createIcons({root:document.getElementById('kyv-listening-phase4')});}
async function refresh(){
  const app=document.getElementById('kyv-listening-phase4');if(app)app.classList.add('opacity-70');
  try{await loadData();renderAll();}catch(error){const host=document.getElementById('kyv-listen-versions');if(host)host.innerHTML=`<div class="kyv-listen-empty text-rose-200">${H(error.message||'Errore caricamento Ascolto')}</div>`;}finally{if(app)app.classList.remove('opacity-70');}
}
function boot(){
  injectStyles();const app=buildShell();if(!app)return;
  document.getElementById('kyv-listen-search')?.addEventListener('input',renderAll);
  document.getElementById('kyv-listen-refresh')?.addEventListener('click',refresh);
  refresh();
}

installLegacyScanGuard();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
