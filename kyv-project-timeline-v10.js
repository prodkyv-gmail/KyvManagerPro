/* KYV Project Timeline v10 — compact in Easy, complete in technical view.
   Reuses state.currentView only: no extra queries and no writes. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

let lastFingerprint='';
const text=v=>String(v??'').trim();
const H=v=>window.KYV?.safeHtml?KYV.safeHtml(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ts=v=>{const n=new Date(v||0).getTime();return Number.isFinite(n)?n:0;};
const fmt=v=>v?(window.KYV?.formatDate?KYV.formatDate(v,'—'):new Date(v).toLocaleDateString('it-IT')):'—';
const paid=v=>window.KYV?.isPaid?KYV.isPaid(v):/^(si|sì|yes|true|1|pagat|incassat)/i.test(text(v));
function view(){try{return typeof state!=='undefined'?state?.currentView:null;}catch(_){return null;}}
function dateOf(row,...keys){for(const key of keys){if(row&&text(row[key]))return row[key];}return'';}
function labelOf(row,...keys){for(const key of keys){if(row&&text(row[key]))return text(row[key]);}return'';}
function event(kind,date,title,detail,icon,tone='neutral',meta={}){const stamp=ts(date);if(!stamp)return null;return{kind,date,title,detail:text(detail),icon,tone,stamp,meta};}
function dedupe(events){
 const seen=new Set();
 return events.filter(Boolean).filter(e=>{const k=[e.kind,e.stamp,text(e.title).toLowerCase(),text(e.detail).toLowerCase()].join('|');if(seen.has(k))return false;seen.add(k);return true;});
}
function buildEvents(current){
 const p=current?.p||{},m=current?.matches||{},events=[];
 events.push(event('session',p.Data_Sessione,'Sessione',text(p.ARTISTA)||text(p.TITOLO),'mic-2','cyan'));
 events.push(event('contract',p['Data Contratto'],'Contratto',text(p.Label)||text(p.MANAGEMENT),'file-signature','sky'));

 const versionRows=[...(m.audio||[]),...(m.consegne||[])];
 const seenVersion=new Set();
 versionRows.forEach((r,i)=>{
   const key=text(r.ID_VERSIONE)||text(r.ID_FILE)||text(r.ID_CONSEGNA)||text(r.Link_Dropbox)||text(r.Link_Drive)||('row'+i);
   if(seenVersion.has(key))return;seenVersion.add(key);
   const d=dateOf(r,'DATA_FILE','Data_Caricamento','Data_Inserimento','Data_Consegna','created_at','Data_Documento');
   const name=labelOf(r,'NOME_FILE','Nome_File','TITOLO','Titolo','Progetto','Titolo_Documento')||'Versione audio';
   const type=labelOf(r,'TIPO_VERSIONE','Tipo_File','Versione','ETICHETTA_VERSIONE');
   const isMaster=/master|final|definitiv/i.test([name,type].join(' '));
   events.push(event('version',d,isMaster?'Versione finale':'Nuova versione',name+(type?' · '+type:''),'audio-waveform',isMaster?'emerald':'blue',{id:key}));
 });
 (m.invii||[]).forEach(r=>{
   const who=text(r.Destinatario)||'Destinatario';
   events.push(event('send',r.Data_Invio,'Invio a '+who,[r.Canale,r.Contesto].filter(Boolean).join(' · '),'send','cyan',{id:r.ID_INVIO}));
   if(text(r.Data_Conferma))events.push(event('feedback',r.Data_Conferma,'Aggiornamento pitch',text(r.Stato)||text(r.Conferma_Ricezione)||who,'message-square-text',/interess|confermat|approvat|scelt/i.test(text(r.Stato))?'emerald':'amber',{id:r.ID_INVIO}));
 });
 (m.docs||[]).forEach(r=>{
   const d=dateOf(r,'Data_Documento','created_at');
   if(!d)return;
   const type=text(r.Tipo_Documento),title=text(r.Titolo_Documento)||type||'Documento';
   if(/contratt|accord|licenz|release|split/i.test(type+' '+title))events.push(event('document',d,title,text(r.Fonte),'file-check-2','violet',{id:r.ID_DOCUMENTO}));
 });
 events.push(event('master',p.Data_Consegna_Master,'Master consegnato',text(p.TITOLO),'badge-check','emerald'));
 (m.fatture||[]).forEach(r=>{
   const title='Fattura '+(text(r.Numero)||'#'+text(r.ID_FT));
   const detail=[text(r.Denominazione),paid(r.PAGATA)?'incassata':'stato incasso da verificare'].filter(Boolean).join(' · ');
   events.push(event('invoice',r.Data,title,detail,'receipt',paid(r.PAGATA)?'emerald':'amber',{id:r.ID_FT}));
 });
 events.push(event('release',p.Data_Pubblicazione,'Pubblicazione',[text(p.Label),text(p.Codice_ISRC)].filter(Boolean).join(' · '),'rocket','violet'));
 return dedupe(events).sort((a,b)=>a.stamp-b.stamp);
}
function relative(stamp){
 const today=new Date();today.setHours(0,0,0,0);
 const d=new Date(stamp);d.setHours(0,0,0,0);
 const delta=Math.round((d-today)/86400000);
 if(delta===0)return'Oggi';if(delta===1)return'Domani';if(delta===-1)return'Ieri';
 if(delta>1)return'Tra '+delta+'g';return Math.abs(delta)+'g fa';
}
function compactEvents(all){
 const now=Date.now(),past=all.filter(e=>e.stamp<=now),future=all.filter(e=>e.stamp>now);
 const pick=[...past.slice(-4),...future.slice(0,1)];
 if(!pick.length)return all.slice(0,5);
 return pick.sort((a,b)=>a.stamp-b.stamp).slice(-5);
}
function toneClass(tone){return({cyan:'cyan',blue:'blue',sky:'sky',emerald:'emerald',amber:'amber',violet:'violet'})[tone]||'slate';}
function ensureStyle(){
 if(document.getElementById('kyv-project-timeline-v10-style'))return;
 const s=document.createElement('style');s.id='kyv-project-timeline-v10-style';s.textContent=`
#kyv-project-timeline-v10{border:1px solid rgba(148,163,184,.11);background:rgba(21,25,35,.76);border-radius:1rem;padding:.9rem}.kyv-tl10-head{display:flex;align-items:center;justify-content:space-between;gap:.8rem}.kyv-tl10-head h3{font-size:.76rem;font-weight:900;color:#fff}.kyv-tl10-head p{font-size:.58rem;color:#64748b;margin-top:.15rem}.kyv-tl10-list{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.5rem;margin-top:.7rem}.kyv-tl10-card{border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.02);border-radius:.8rem;padding:.65rem;min-width:0}.kyv-tl10-card .icon{width:27px;height:27px;border-radius:.55rem;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,.09);color:#c7d2fe}.kyv-tl10-card strong{display:block;color:#fff;font-size:.64rem;margin-top:.45rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kyv-tl10-card span{display:block;color:#94a3b8;font-size:.55rem;margin-top:.14rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kyv-tl10-card em{display:block;color:#64748b;font-style:normal;font-size:.52rem;margin-top:.35rem}.kyv-tl10-open{border:0;background:transparent;color:#c7d2fe;font-size:.6rem;font-weight:900;cursor:pointer}
.kyv-tl10-full{position:relative;padding-left:1.15rem}.kyv-tl10-full:before{content:'';position:absolute;left:.34rem;top:.3rem;bottom:.3rem;width:1px;background:rgba(148,163,184,.16)}.kyv-tl10-event{position:relative;display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:.65rem;align-items:start;padding:.55rem 0}.kyv-tl10-event:before{content:'';position:absolute;left:-.93rem;top:1rem;width:.5rem;height:.5rem;border-radius:999px;background:#6366f1;box-shadow:0 0 0 4px #151923}.kyv-tl10-event-icon{width:24px;height:24px;border-radius:.5rem;background:rgba(99,102,241,.08);display:flex;align-items:center;justify-content:center;color:#c7d2fe}.kyv-tl10-event strong{display:block;color:#fff;font-size:.7rem}.kyv-tl10-event p{font-size:.59rem;color:#94a3b8;margin-top:.12rem;line-height:1.4}.kyv-tl10-event time{font-size:.56rem;color:#94a3b8;white-space:nowrap}.kyv-tl10-empty{padding:1rem;text-align:center;color:#64748b;font-size:.65rem;border:1px dashed rgba(148,163,184,.14);border-radius:.8rem}
@media(max-width:1000px){.kyv-tl10-list{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:640px){.kyv-tl10-list{grid-template-columns:1fr 1fr}.kyv-tl10-event{grid-template-columns:24px minmax(0,1fr)}.kyv-tl10-event time{grid-column:2}}
`;document.head.appendChild(s);
}
function ensureCompactMount(){
 const hub=document.getElementById('kyv-project-hub-v3'),viewEl=document.getElementById('project-view');if(!hub||!viewEl)return null;
 let el=document.getElementById('kyv-project-timeline-v10');if(!el){el=document.createElement('section');el.id='kyv-project-timeline-v10';hub.insertAdjacentElement('afterend',el);}return el;
}
function renderCompact(all){
 const el=ensureCompactMount();if(!el)return;
 const rows=compactEvents(all);
 el.innerHTML=`<div class="kyv-tl10-head"><div><h3>Storia progetto</h3><p>Solo gli eventi che cambiano davvero il percorso del brano.</p></div><button type="button" class="kyv-tl10-open">Apri cronologia completa →</button></div>${rows.length?'<div class="kyv-tl10-list">'+rows.map(e=>`<div class="kyv-tl10-card"><span class="icon"><i data-lucide="${H(e.icon)}" class="w-3.5 h-3.5"></i></span><strong>${H(e.title)}</strong><span>${H(e.detail||fmt(e.date))}</span><em>${H(fmt(e.date))} · ${H(relative(e.stamp))}</em></div>`).join('')+'</div>':'<div class="kyv-tl10-empty mt-3">La storia si costruirà automaticamente quando inserisci sessioni, versioni, invii, master, fatture o release.</div>'}`;
 el.querySelector('.kyv-tl10-open')?.addEventListener('click',()=>{window.KYV_EASY_UX_V9?.setMode?.('complete');setTimeout(()=>{window.setTab?.('produzione');setTimeout(()=>document.getElementById('tab-timeline')?.scrollIntoView({behavior:'smooth',block:'start'}),80);},30);});
 if(window.lucide)lucide.createIcons({root:el});
}
function renderFull(all){
 const target=document.getElementById('tab-timeline');if(!target)return;
 target.innerHTML=`<div class="kyv-card p-5"><div class="flex items-start justify-between gap-3"><div><h3 class="font-black text-white text-lg flex items-center"><i data-lucide="history" class="w-5 h-5 mr-2 text-cyan-300"></i>Cronologia progetto</h3><p class="text-xs text-kyv-text mt-1">Eventi reali ricostruiti dai dati già presenti. Lo stato “incassata” su una fattura non genera una data di incasso se quella data non esiste.</p></div><span class="kyv-chip">${all.length} eventi</span></div><div class="mt-5 kyv-tl10-full">${all.length?all.map(e=>`<article class="kyv-tl10-event"><span class="kyv-tl10-event-icon"><i data-lucide="${H(e.icon)}" class="w-3.5 h-3.5"></i></span><div><strong>${H(e.title)}</strong>${e.detail?'<p>'+H(e.detail)+'</p>':''}</div><time>${H(fmt(e.date))}<br>${H(relative(e.stamp))}</time></article>`).join(''):'<div class="kyv-tl10-empty">Nessun evento datato disponibile.</div>'}</div></div>`;
 if(window.lucide)lucide.createIcons({root:target});
}
function fingerprint(current,events){return JSON.stringify([current?.p?.ID,events.map(e=>[e.kind,e.stamp,e.title,e.detail])]);}
function render(){
 const current=view();if(!current?.p)return false;
 const events=buildEvents(current),fp=fingerprint(current,events);if(fp===lastFingerprint&&document.getElementById('kyv-project-timeline-v10'))return true;lastFingerprint=fp;
 ensureStyle();renderCompact(events);renderFull(events);
 window.dispatchEvent(new CustomEvent('kyv:project-timeline-v10-ready',{detail:{projectId:current.p.ID,count:events.length}}));
 return true;
}
function boot(){
 ensureStyle();render();
 let n=0;const t=setInterval(()=>{n++;if(render()||n>=28)clearInterval(t);},180);setTimeout(()=>clearInterval(t),5500);
 ['kyv:project-v2-ready','kyv:project-hub-v3-ready','kyv:pitch-updated','kyv:invoice-updated'].forEach(name=>window.addEventListener(name,()=>{lastFingerprint='';setTimeout(render,35);}));
}
window.KYV_PROJECT_TIMELINE_V10={refresh:()=>{lastFingerprint='';return render();},events:()=>buildEvents(view())};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();