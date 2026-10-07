/* KYV Scheda Progetto 2.0 — vista producer-first senza nuove tabelle. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

const FOLLOWUP_DAYS=5;
let lastFingerprint='';
let observer=null;
let timer=null;

function text(value){return String(value??'').trim();}
function has(value){return text(value).length>0;}
function H(value){
  if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function currentView(){try{if(typeof state!=='undefined'&&state?.currentView)return state.currentView;}catch(_){}return null;}
function timestamp(value){const n=new Date(value||0).getTime();return Number.isFinite(n)?n:0;}
function formatDate(value){if(!value)return'—';if(window.KYV?.formatDate)return KYV.formatDate(value,'—');const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('it-IT');}
function daysSince(value){const n=timestamp(value);return n?Math.max(0,Math.floor((Date.now()-n)/86400000)):0;}
function audioDate(row){return row?.DATA_FILE||row?.Data_Caricamento||row?.Data_Consegna||row?.Data_Documento||row?.updated_at||row?.created_at||'';}
function audioId(row){return text(row?.ID_VERSIONE||row?.ID_FILE||row?.ID_CONSEGNA||row?.ID_DOCUMENTO);}
function audioName(row){return text(row?.NOME_FILE||row?.Nome_File||row?.Titolo_Documento||row?.TITOLO||row?.Titolo||row?.Progetto)||'Versione audio';}
function audioType(row){return text(row?.TIPO_VERSIONE||row?.Tipo_File||row?.ETICHETTA_VERSIONE||row?.Versione||row?.STATO_VERSIONE)||'Versione';}
function audioLink(row){return text(row?.LINK_FILE||row?.Link_Drive||row?.Link_Dropbox);}
function audioProvider(row){return text(row?.PROVIDER||row?._source||row?.Fonte||'audio');}
function versionKind(row){const raw=`${audioType(row)} ${audioName(row)}`.toLowerCase();if(/master|final|definitiv/.test(raw))return'Finale';if(/rev|mix|v\d|version/.test(raw))return'Revisione';return'Demo';}
function audioRows(matches){
  const raw=[...((matches?.audio)||[]),...((matches?.consegne)||[])],seen=new Set();
  return raw.filter((row,index)=>{const key=text(row?.ID_VERSIONE)?`v:${row.ID_VERSIONE}`:text(row?.ID_FILE)?`f:${row.ID_FILE}`:text(audioLink(row))||`row:${index}`;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>(timestamp(audioDate(b))||Number(audioId(b)))-(timestamp(audioDate(a))||Number(audioId(a))));
}
function pitchStatus(row){
  const raw=text(row?.Stato).toLowerCase();
  if(/interessat|confermat|approvat|accettat|scelt/.test(raw))return'interested';
  if(/revision|feedback|comment/.test(raw))return'revision';
  if(/chius|non interess|rifiut|declin|(^|\s|\/)(no|pass)(\s|$)/.test(raw))return'closed';
  const activity=row?.Data_Conferma||row?.Data_Invio||row?.updated_at||row?.created_at;
  return daysSince(activity)>=FOLLOWUP_DAYS?'due':'waiting';
}
function latestOpenPitch(invii){return [...(invii||[])].filter(row=>['waiting','due','revision'].includes(pitchStatus(row))).sort((a,b)=>timestamp(b.Data_Conferma||b.Data_Invio)-timestamp(a.Data_Conferma||a.Data_Invio))[0]||null;}
function nextAction(current){
  const p=current.p||{},matches=current.matches||{},versions=audioRows(matches),invii=matches.invii||[];
  const due=invii.find(row=>pitchStatus(row)==='due');
  if(due)return{title:`Sollecita ${text(due.Destinatario)||'il destinatario'}`,detail:`${daysSince(due.Data_Conferma||due.Data_Invio)} giorni senza aggiornamenti.`,target:'kyv-project-v2-pitch',tone:'due'};
  const explicit=text(p.SVILUPPO);
  if(explicit&&!/^(finita|completata|uscita|pubblicata|chiusa)$/i.test(explicit))return{title:explicit,detail:'Prossima azione indicata nel progetto.',target:'kyv-project-v2-versions',tone:'active'};
  if(!versions.length)return{title:'Aggiungi la prima versione',detail:'Collega una demo da Drive o Dropbox per iniziare la storia del brano.',target:'kyv-project-v2-versions',tone:'active'};
  if(!invii.length)return{title:'Registra il primo invio',detail:`La versione più recente è ${audioName(versions[0])}.`,target:'kyv-project-v2-pitch',tone:'active'};
  const open=latestOpenPitch(invii);if(open)return{title:`Attendi risposta da ${text(open.Destinatario)||'destinatario'}`,detail:'Il follow-up scatterà automaticamente dopo 5 giorni senza attività.',target:'kyv-project-v2-pitch',tone:'waiting'};
  if(!has(p.Data_Consegna_Master))return{title:'Conferma la versione finale',detail:'Indica il master o registra la data di consegna.',target:'kyv-project-v2-release',tone:'active'};
  if(!has(p.Codice_ISRC)||!has(p.Data_Pubblicazione))return{title:'Completa il Release Desk',detail:'Chiudi i dati mancanti prima della pubblicazione.',target:'kyv-project-v2-release',tone:'active'};
  return{title:'Progetto allineato',detail:'Nessuna urgenza operativa rilevata.',target:'kyv-project-v2-timeline',tone:'ready'};
}
function exactVersion(row,versions){
  const message=text(row?.Messaggio);const tagged=message.match(/Versione inviata:\s*(?:\[[^\]]+\]\s*)?([^\n]+)/i);if(tagged)return tagged[1].trim();
  if(row?.ID_FILE!==null&&row?.ID_FILE!==undefined){const match=versions.find(v=>String(v.ID_FILE||v?.METADATI?.id_legacy||'')===String(row.ID_FILE));if(match)return audioName(match);return`File #${row.ID_FILE}`;}
  return'';
}
function timeline(current){
  const p=current.p||{},matches=current.matches||{},versions=audioRows(matches),events=[];
  const add=(date,label,detail,icon='circle-dot')=>{if(timestamp(date))events.push({date,label,detail,icon,sort:timestamp(date)});};
  add(p.Data_Sessione,'Sessione',p.ARTISTA||p.TITOLO||'Avvio progetto','mic-2');
  add(p['Data Contratto'],'Accordo collegato',p.Label||p.MANAGEMENT||'Contratto progetto','file-signature');
  versions.forEach(v=>add(audioDate(v),versionKind(v)==='Finale'?'Versione finale':'Versione caricata',`${audioName(v)} · ${audioType(v)}`,'audio-waveform'));
  (matches.invii||[]).forEach(i=>{
    const version=exactVersion(i,versions);add(i.Data_Invio,'Versione inviata',[i.Destinatario,version].filter(Boolean).join(' · ')||'Invio audio','send');
    if(i.Data_Conferma)add(i.Data_Conferma,pitchStatus(i)==='waiting'?'Follow-up registrato':`Esito: ${text(i.Stato)||'aggiornato'}`,i.Conferma_Ricezione||i.Destinatario||'Invio aggiornato','message-square-text');
  });
  add(p.Data_Consegna_Master,'Master consegnato',p.STATO||p.TITOLO||'Master','badge-check');
  add(p.Data_Pubblicazione,'Release',p.Codice_ISRC||p.Label||p.TITOLO||'Pubblicazione','rocket');
  return events.sort((a,b)=>a.sort-b.sort).slice(-30);
}
function injectStyles(){
  if(document.getElementById('kyv-project-v2-style'))return;
  const style=document.createElement('style');style.id='kyv-project-v2-style';style.textContent=`
#kyv-project-v2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}#kyv-project-v2>.kyv-v2-section{min-width:0}.kyv-v2-section{background:rgba(21,25,35,.94);border:1px solid #232838;border-radius:1rem;padding:1rem;box-shadow:0 16px 48px rgba(0,0,0,.13)}.kyv-v2-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem}.kyv-v2-kicker{font-size:.58rem;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#94a3b8}.kyv-v2-title{font-size:1rem;font-weight:900;color:#fff;margin-top:.18rem}.kyv-v2-copy{font-size:.68rem;color:#94a3b8;line-height:1.45;margin-top:.25rem}.kyv-v2-count{display:inline-flex;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);border-radius:999px;padding:.3rem .5rem;font-size:.6rem;font-weight:900;color:#e2e8f0;white-space:nowrap}.kyv-v2-version{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.65rem;padding:.72rem 0;border-top:1px solid rgba(255,255,255,.065)}.kyv-v2-version:first-child{border-top:0}.kyv-v2-version h4{font-size:.75rem;font-weight:900;color:#fff;overflow-wrap:anywhere}.kyv-v2-version p{font-size:.62rem;color:#94a3b8;margin-top:.2rem}.kyv-v2-tags{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.42rem}.kyv-v2-tag{display:inline-flex;border-radius:999px;border:1px solid rgba(255,255,255,.09);padding:.22rem .42rem;font-size:.55rem;font-weight:850;color:#cbd5e1}.kyv-v2-tag.latest{color:#bbf7d0;border-color:rgba(34,197,94,.25);background:rgba(34,197,94,.08)}.kyv-v2-link{font-size:.6rem;font-weight:900;color:#bae6fd}.kyv-v2-empty{border:1px dashed rgba(255,255,255,.1);border-radius:.8rem;padding:1.1rem;text-align:center;color:#94a3b8;font-size:.68rem}.kyv-v2-timeline{position:relative;margin:.85rem 0 0 .32rem;padding-left:1rem;border-left:1px solid rgba(148,163,184,.18)}.kyv-v2-event{position:relative;padding:0 0 .8rem .1rem}.kyv-v2-event:before{content:'';position:absolute;left:-1.3rem;top:.2rem;width:.55rem;height:.55rem;border-radius:999px;background:#818cf8;box-shadow:0 0 0 3px #151923}.kyv-v2-event strong{display:block;color:#fff;font-size:.7rem}.kyv-v2-event span{display:block;color:#94a3b8;font-size:.6rem;margin-top:.16rem}.kyv-v2-next{margin-top:1rem;border:1px solid rgba(99,102,241,.34);background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(34,211,238,.07));border-radius:.9rem;padding:.85rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}.kyv-v2-next.due{border-color:rgba(249,115,22,.38);background:linear-gradient(135deg,rgba(249,115,22,.16),rgba(244,63,94,.06))}.kyv-v2-next.ready{border-color:rgba(34,197,94,.28);background:rgba(34,197,94,.08)}.kyv-v2-next strong{display:block;color:#fff;font-size:.9rem}.kyv-v2-next p{font-size:.65rem;color:#cbd5e1;margin-top:.18rem}.kyv-v2-next button{flex:none;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.07);color:#fff;border-radius:.65rem;padding:.48rem .62rem;font-size:.62rem;font-weight:900}.kyv-v2-secondary{grid-column:1/-1}.kyv-v2-secondary-label{font-size:.62rem;color:#94a3b8;font-weight:800}.kyv-v2-section #kyv-pitch-followup-project,.kyv-v2-section #kyv-release-desk{margin:0;border:0;background:transparent;padding:0;box-shadow:none}@media(max-width:980px){#kyv-project-v2{grid-template-columns:1fr}}@media(max-width:640px){.kyv-v2-next{align-items:flex-start;flex-direction:column}.kyv-v2-next button{width:100%}}
  `;document.head.appendChild(style);
}
function ensureMount(){
  let mount=document.getElementById('kyv-project-v2');if(mount)return mount;
  const hero=document.querySelector('#project-view > section');if(!hero)return null;
  mount=document.createElement('section');mount.id='kyv-project-v2';mount.className='hidden';hero.insertAdjacentElement('afterend',mount);return mount;
}
function renderHero(current,next){
  const p=current.p||{},hero=document.querySelector('#project-view > section');if(!hero)return;
  hero.classList.remove('p-5','sm:p-6');hero.classList.add('p-4','sm:p-5');
  const badges=document.getElementById('hero-badges');if(badges&&!document.getElementById('kyv-v2-status-badge'))badges.insertAdjacentHTML('afterbegin',`<span id="kyv-v2-status-badge" class="kyv-chip border-indigo-500/25 bg-indigo-500/10 text-indigo-100"><i data-lucide="activity" class="w-3 h-3"></i>${H(p.STATO||'Stato non indicato')}</span>`);
  let box=document.getElementById('kyv-v2-next');if(!box){box=document.createElement('div');box.id='kyv-v2-next';const actions=hero.querySelector('.flex.flex-wrap.items-start');if(actions)actions.insertAdjacentElement('beforebegin',box);else hero.appendChild(box);}
  box.className=`kyv-v2-next ${next.tone==='due'?'due':next.tone==='ready'?'ready':''}`;
  box.innerHTML=`<div><p class="kyv-v2-kicker">Prossima azione</p><strong>${H(next.title)}</strong><p>${H(next.detail)}</p></div><button type="button" data-v2-next>Vai al blocco</button>`;
  box.querySelector('[data-v2-next]')?.addEventListener('click',()=>document.getElementById(next.target)?.scrollIntoView({behavior:'smooth',block:'start'}));
}
function renderVersions(versions){
  const rows=versions.length?versions.map((row,index)=>{const link=audioLink(row);return `<article class="kyv-v2-version"><div><h4>${H(audioName(row))}</h4><p>${H([audioType(row),audioProvider(row),formatDate(audioDate(row))].filter(Boolean).join(' · '))}</p><div class="kyv-v2-tags">${index===0?'<span class="kyv-v2-tag latest">Ultima</span>':''}<span class="kyv-v2-tag">${H(versionKind(row))}</span>${has(row.STATO_VERSIONE)?`<span class="kyv-v2-tag">${H(row.STATO_VERSIONE)}</span>`:''}</div></div>${link?`<a class="kyv-v2-link" href="${H(link)}" target="_blank" rel="noopener">Apri</a>`:''}</article>`;}).join(''):'<div class="kyv-v2-empty">Nessuna versione collegata. Aggiungi una demo da Drive o Dropbox.</div>';
  return `<div class="kyv-v2-head"><div><p class="kyv-v2-kicker">AUDIO_VERSIONI</p><h3 class="kyv-v2-title">Versioni</h3><p class="kyv-v2-copy">Demo, revisioni e finale dalla più recente.</p></div><span class="kyv-v2-count">${versions.length}</span></div><div class="mt-3">${rows}</div><div class="flex gap-3 mt-3"><a class="kyv-v2-link" href="acquisisci_audio.html">Aggiungi versione</a><a class="kyv-v2-link" href="ascolto.html">Apri Ascolto</a></div>`;
}
function renderTimeline(events){
  return `<div class="kyv-v2-head"><div><p class="kyv-v2-kicker">Cronologia unica</p><h3 class="kyv-v2-title">Timeline</h3><p class="kyv-v2-copy">Dal primo file alla release, ricostruita dai dati disponibili.</p></div><span class="kyv-v2-count">${events.length}</span></div>${events.length?`<div class="kyv-v2-timeline">${events.map(e=>`<div class="kyv-v2-event"><strong>${H(e.label)}</strong><span>${H(formatDate(e.date))} · ${H(e.detail)}</span></div>`).join('')}</div>`:'<div class="kyv-v2-empty mt-3">Nessun evento datato disponibile.</div>'}`;
}
function fingerprint(current){
  const p=current?.p||{},m=current?.matches||{},versions=audioRows(m);
  return JSON.stringify([
    p.ID,p.STATO,p.SVILUPPO,p.Data_Sessione,p['Data Contratto'],p.Data_Consegna_Master,p.Data_Pubblicazione,p.Codice_ISRC,
    versions.map(row=>[audioId(row),audioName(row),audioType(row),audioDate(row),row.STATO_VERSIONE]),
    (m.invii||[]).map(i=>[i.ID_INVIO,i.Stato,i.Data_Invio,i.Data_Conferma,i.Destinatario,i.Messaggio])
  ]);
}
function render(){
  const current=currentView(),mount=ensureMount();if(!current||!mount)return false;
  const fp=fingerprint(current);if(fp===lastFingerprint&&mount.children.length)return true;lastFingerprint=fp;
  const versions=audioRows(current.matches),events=timeline(current),next=nextAction(current);renderHero(current,next);
  mount.innerHTML=`<section id="kyv-project-v2-versions" class="kyv-v2-section">${renderVersions(versions)}</section><section id="kyv-project-v2-pitch" class="kyv-v2-section"><div class="kyv-v2-empty">Carico Invii & Follow-up da INVII_AUDIO…</div></section><section id="kyv-project-v2-release" class="kyv-v2-section"><div class="kyv-v2-empty">Carico Release Desk…</div></section><section id="kyv-project-v2-timeline" class="kyv-v2-section">${renderTimeline(events)}</section><div class="kyv-v2-secondary"><span class="kyv-v2-secondary-label">Sotto trovi documenti, diritti, amministrazione e controlli avanzati.</span></div>`;
  mount.classList.remove('hidden');
  window.dispatchEvent(new CustomEvent('kyv:project-v2-ready',{detail:{projectId:current.p.ID}}));
  if(window.lucide)lucide.createIcons({root:document.getElementById('project-view')});return true;
}
function schedule(){clearTimeout(timer);timer=setTimeout(render,70);}
function boot(){injectStyles();render();const root=document.getElementById('project-view')||document.documentElement;observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true});window.addEventListener('kyv:pitch-updated',schedule);window.addEventListener('beforeunload',()=>observer?.disconnect(),{once:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
