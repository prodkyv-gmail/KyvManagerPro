/* KYV Release Desk — uscita e crediti semplici, usando solo dati già presenti nella Scheda progetto. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

let lastFingerprint='';
let renderTimer=null;
let observer=null;

function text(value){return String(value??'').trim();}
function has(value){return text(value).length>0;}
function H(value){
  if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function view(){try{if(typeof state!=='undefined'&&state?.currentView)return state.currentView;}catch(_){}return null;}
function formatDate(value){
  if(!value)return'';
  if(window.KYV&&typeof KYV.formatDate==='function')return KYV.formatDate(value,'');
  const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('it-IT');
}
function audioDate(item){
  const values=[item?.DATA_FILE,item?.Data_Caricamento,item?.Data_Consegna,item?.Data_Documento,item?.updated_at,item?.created_at];
  for(const value of values){const n=new Date(value||0).getTime();if(Number.isFinite(n)&&n>0)return n;}
  return 0;
}
function audioRows(matches){
  const rows=[...((matches?.consegne)||[]),...((matches?.audio)||[])],seen=new Set();
  return rows.filter((row,index)=>{const key=String(row?.ID_VERSIONE||row?.ID_FILE||row?.ID_CONSEGNA||row?.ID_DOCUMENTO||row?.LINK_FILE||row?.Link_Dropbox||row?.Link_Drive||index);if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>audioDate(b)-audioDate(a));
}
function audioName(item){return text(item?.Nome_File||item?.NOME_FILE||item?.Titolo_Documento||item?.Titolo||item?.TITOLO||item?.Progetto)||'Versione audio';}
function audioType(item){return text(item?.Tipo_File||item?.TIPO_VERSIONE||item?.Versione||item?.ETICHETTA_VERSIONE);}
function item(key,label,state,value,fields,icon){return{key,label,state,value,fields,icon};}
function releaseItems(current){
  const p=current.p||{},matches=current.matches||{},audio=audioRows(matches),latest=audio[0]||null;
  const masterExplicit=has(p.Data_Consegna_Master)||audio.some(row=>/master|final/i.test(audioType(row)));
  const splitFields=[p.Quota_Musica_Kyv,p.Quota_Musica_Artista,p.Quota_Testo_Artista].filter(has).length;
  const labelReady=has(p.Label)||has(p.Produttore_Fonografico);
  return [
    item('identity','Titolo e artista',has(p.TITOLO)&&has(p.ARTISTA)?'ready':(has(p.TITOLO)||has(p.ARTISTA)?'partial':'missing'),[p.ARTISTA,p.TITOLO].filter(has).join(' · ')||'Da definire',['TITOLO','ARTISTA'],'disc-3'),
    item('master','Master',masterExplicit?'ready':(latest?'partial':'missing'),masterExplicit?(p.Data_Consegna_Master?`Consegnato ${formatDate(p.Data_Consegna_Master)}`:`${audioName(latest)} · master/final`):(latest?`${audioName(latest)} · da confermare come master`:'Nessun audio disponibile'),['Data_Consegna_Master'],'audio-waveform'),
    item('release-date','Data uscita',has(p.Data_Pubblicazione)?'ready':'missing',has(p.Data_Pubblicazione)?formatDate(p.Data_Pubblicazione):'Non definita',['Data_Pubblicazione'],'calendar-days'),
    item('authors','Autori',has(p.AUTORI)?'ready':'missing',has(p.AUTORI)?p.AUTORI:'Da completare',['AUTORI'],'users'),
    item('split','Split / quote',splitFields>0?'ready':'missing',splitFields>0?`${splitFields} quote registrate`:'Nessuna quota registrata',['Quota_Musica_Kyv','Quota_Musica_Artista','Quota_Testo_Artista'],'percent'),
    item('isrc','ISRC',has(p.Codice_ISRC)?'ready':'missing',has(p.Codice_ISRC)?p.Codice_ISRC:'Mancante',['Codice_ISRC'],'barcode'),
    item('label','Label / produttore fonografico',labelReady?'ready':'missing',text(p.Label)||text(p.Produttore_Fonografico)||'Da definire',['Label','Produttore_Fonografico'],'building-2'),
    item('credit','Credito KYV',has(p.Ruolo_IMAIE_Kyv)?'ready':'missing',has(p.Ruolo_IMAIE_Kyv)?p.Ruolo_IMAIE_Kyv:'Ruolo da confermare',['Ruolo_IMAIE_Kyv'],'badge-check')
  ];
}
function statusMeta(state){
  if(state==='ready')return{label:'Pronto',icon:'circle-check-big',cls:'ready'};
  if(state==='partial')return{label:'Da confermare',icon:'circle-dot-dashed',cls:'partial'};
  return{label:'Mancante',icon:'circle-alert',cls:'missing'};
}
function fingerprint(current){
  const p=current?.p||{},m=current?.matches||{};
  return JSON.stringify([p.ID,p.TITOLO,p.ARTISTA,p.AUTORI,p.Data_Consegna_Master,p.Data_Pubblicazione,p.Codice_ISRC,p.Label,p.Produttore_Fonografico,p.Quota_Musica_Kyv,p.Quota_Musica_Artista,p.Quota_Testo_Artista,p.Ruolo_IMAIE_Kyv,(m.audio||[]).length,(m.consegne||[]).length]);
}
function injectStyles(){
  if(document.getElementById('kyv-release-desk-style'))return;
  const style=document.createElement('style');style.id='kyv-release-desk-style';style.textContent=`
#kyv-release-desk{border:1px solid rgba(190,182,255,.22);border-radius:1rem;padding:1rem;background:linear-gradient(135deg,rgba(190,182,255,.09),rgba(15,17,26,.68));margin-bottom:1rem}.kyv-release-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.kyv-release-head h3{color:#fff;font-size:1rem;font-weight:900}.kyv-release-head p{color:#94a3b8;font-size:.68rem;line-height:1.45;margin-top:.22rem}.kyv-release-score{display:flex;align-items:center;gap:.45rem;flex:none;padding:.48rem .62rem;border:1px solid rgba(255,255,255,.09);border-radius:.8rem;background:rgba(255,255,255,.035)}.kyv-release-score strong{color:#fff;font-size:1rem}.kyv-release-score span{color:#94a3b8;font-size:.58rem;font-weight:850}.kyv-release-main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem;margin-top:.8rem}.kyv-release-main-card{border:1px solid rgba(255,255,255,.08);border-radius:.8rem;padding:.68rem;background:rgba(255,255,255,.025)}.kyv-release-main-card label{display:block;color:#94a3b8;font-size:.55rem;text-transform:uppercase;letter-spacing:.09em;font-weight:900}.kyv-release-main-card strong{display:block;color:#fff;font-size:.76rem;margin-top:.28rem;line-height:1.35}.kyv-release-missing{margin-top:.8rem;border-top:1px solid rgba(255,255,255,.08);padding-top:.75rem}.kyv-release-missing-title{font-size:.62rem;font-weight:900;color:#cbd5e1;text-transform:uppercase;letter-spacing:.08em}.kyv-release-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.45rem}.kyv-release-chip{display:inline-flex;align-items:center;gap:.28rem;padding:.32rem .47rem;border-radius:999px;border:1px solid rgba(255,255,255,.09);font-size:.59rem;font-weight:850}.kyv-release-chip.missing{color:#fecdd3;background:rgba(244,63,94,.07);border-color:rgba(244,63,94,.20)}.kyv-release-chip.partial{color:#fde68a;background:rgba(234,179,8,.07);border-color:rgba(234,179,8,.20)}.kyv-release-chip.ready{color:#bbf7d0;background:rgba(34,197,94,.07);border-color:rgba(34,197,94,.20)}.kyv-release-actions{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.8rem}.kyv-release-btn{display:inline-flex;align-items:center;justify-content:center;gap:.32rem;padding:.48rem .65rem;border-radius:.68rem;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.045);color:#e5e7eb;font-size:.65rem;font-weight:850}.kyv-release-btn.primary{border-color:rgba(190,182,255,.30);background:rgba(190,182,255,.11);color:#f5f3ff}.kyv-release-details{margin-top:.75rem;border:1px solid rgba(255,255,255,.08);border-radius:.8rem;overflow:hidden}.kyv-release-details summary{cursor:pointer;list-style:none;padding:.62rem .7rem;color:#cbd5e1;font-size:.63rem;font-weight:850;display:flex;align-items:center;justify-content:space-between}.kyv-release-details summary::-webkit-details-marker{display:none}.kyv-release-all{padding:.15rem .55rem .55rem}.kyv-release-row{display:grid;grid-template-columns:28px minmax(130px,.8fr) minmax(0,1.5fr) auto;align-items:center;gap:.5rem;padding:.55rem .35rem;border-top:1px solid rgba(255,255,255,.06)}.kyv-release-row:first-child{border-top:0}.kyv-release-row .ico{width:28px;height:28px;border-radius:.6rem;background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;color:#cbd5e1}.kyv-release-row b{font-size:.66rem;color:#fff}.kyv-release-row p{font-size:.61rem;color:#94a3b8;overflow-wrap:anywhere}.kyv-release-edit-help{grid-column:1/-1;border:1px solid rgba(190,182,255,.18);background:rgba(190,182,255,.07);border-radius:.75rem;padding:.65rem .7rem;color:#ddd6fe;font-size:.66rem;line-height:1.45;margin-bottom:.1rem}@media(max-width:760px){.kyv-release-head{flex-direction:column}.kyv-release-main{grid-template-columns:1fr}.kyv-release-row{grid-template-columns:28px minmax(0,1fr) auto}.kyv-release-row p{grid-column:2/-1}.kyv-release-score{width:100%;justify-content:center}}
`;document.head.appendChild(style);
}
function mainCard(label,item){return `<div class="kyv-release-main-card"><label>${H(label)}</label><strong>${H(item.value)}</strong></div>`;}
function renderRow(entry){const meta=statusMeta(entry.state);return `<div class="kyv-release-row"><span class="ico"><i data-lucide="${entry.icon}" class="w-3.5 h-3.5"></i></span><b>${H(entry.label)}</b><p>${H(entry.value)}</p><span class="kyv-release-chip ${meta.cls}"><i data-lucide="${meta.icon}" class="w-3 h-3"></i>${meta.label}</span></div>`;}
function editableFields(entries,all=false){const selected=all?entries:entries.filter(entry=>entry.state!=='ready');return [...new Set(selected.flatMap(entry=>entry.fields||[]))];}
function openCompactEdit(entries){
  if(typeof window.openQuickEdit!=='function')return;
  const fields=editableFields(entries,entries.every(entry=>entry.state==='ready'));
  window.openQuickEdit();
  requestAnimationFrame(()=>{
    const modal=document.getElementById('quick-edit-modal'),container=document.getElementById('quick-edit-fields'),title=document.getElementById('edit-title');
    if(!modal||!container)return;
    if(title)title.textContent='Uscita & crediti';
    container.querySelectorAll('[data-key]').forEach(input=>{const label=input.closest('label');if(label)label.classList.toggle('hidden',!fields.includes(input.dataset.key));});
    if(!container.querySelector('[data-kyv-release-help]')){const help=document.createElement('div');help.dataset.kyvReleaseHelp='1';help.className='kyv-release-edit-help';help.textContent=entries.every(entry=>entry.state==='ready')?'Qui modifichi solo i dati utili alla pubblicazione.':'Ti mostro solo ciò che manca o va confermato per l’uscita.';container.prepend(help);}
    const first=container.querySelector('label:not(.hidden) [data-key]');setTimeout(()=>first?.focus(),0);
    if(window.lucide)lucide.createIcons({root:modal});
  });
}
function render(){
  const current=view(),host=document.getElementById('tab-diritti');if(!current||!host)return false;
  const fp=fingerprint(current);if(fp===lastFingerprint&&document.getElementById('kyv-release-desk'))return true;lastFingerprint=fp;
  const entries=releaseItems(current),ready=entries.filter(x=>x.state==='ready').length,partial=entries.filter(x=>x.state==='partial'),missing=entries.filter(x=>x.state==='missing'),open=[...partial,...missing];
  const date=entries.find(x=>x.key==='release-date'),master=entries.find(x=>x.key==='master'),credits=entries.find(x=>x.key==='authors');
  const status=ready===entries.length?'Pronto per uscire':ready>=5?'Quasi pronto':'Da completare';
  let desk=document.getElementById('kyv-release-desk');if(!desk){desk=document.createElement('section');desk.id='kyv-release-desk';host.prepend(desk);}
  desk.innerHTML=`<div class="kyv-release-head"><div><p class="text-[9px] uppercase tracking-[.14em] font-black text-violet-200">Release Desk</p><h3 class="mt-1">Uscita & crediti</h3><p>${H(status)}. Vedi subito solo ciò che serve per portare il brano alla pubblicazione.</p></div><div class="kyv-release-score"><strong>${ready}/${entries.length}</strong><span>pronti</span></div></div><div class="kyv-release-main">${mainCard('Data uscita',date)}${mainCard('Master',master)}${mainCard('Autori',credits)}</div><div class="kyv-release-missing"><div class="kyv-release-missing-title">${open.length?'Da chiudere':'Tutto pronto'}</div><div class="kyv-release-chips">${open.length?open.map(entry=>{const meta=statusMeta(entry.state);return `<span class="kyv-release-chip ${meta.cls}"><i data-lucide="${meta.icon}" class="w-3 h-3"></i>${H(entry.label)}</span>`;}).join(''):'<span class="kyv-release-chip ready"><i data-lucide="circle-check-big" class="w-3 h-3"></i>Nessuna mancanza essenziale</span>'}</div></div><div class="kyv-release-actions"><button type="button" class="kyv-release-btn primary" data-release-edit><i data-lucide="pencil" class="w-3.5 h-3.5"></i>${open.length?'Completa mancanti':'Modifica dati uscita'}</button><a class="kyv-release-btn" href="ascolto.html?projectId=${encodeURIComponent(current.p.ID)}"><i data-lucide="headphones" class="w-3.5 h-3.5"></i>Ascolto</a></div><details class="kyv-release-details"><summary><span>Vedi tutti i controlli release</span><i data-lucide="chevron-down" class="w-3.5 h-3.5"></i></summary><div class="kyv-release-all">${entries.map(renderRow).join('')}</div></details>`;
  desk.querySelector('[data-release-edit]')?.addEventListener('click',()=>openCompactEdit(entries));
  if(window.lucide)lucide.createIcons({root:desk});return true;
}
function scheduleRender(){clearTimeout(renderTimer);renderTimer=setTimeout(render,60);}
function boot(){
  injectStyles();render();
  const root=document.getElementById('project-view')||document.documentElement;
  observer=new MutationObserver(scheduleRender);observer.observe(root,{childList:true,subtree:true,characterData:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
