/* KYV Project Hub v3 — centro operativo producer-first.
   Riassume lo stato già caricato dalla Scheda Progetto; nessuna query o scrittura aggiuntiva. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

const FOLLOWUP_DAYS=5;
let lastFingerprint='';
let bootTimer=null;

function text(v){return String(v??'').trim();}
function has(v){return text(v)!=='';}
function H(v){return window.KYV?.safeHtml?KYV.safeHtml(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function view(){try{return typeof state!=='undefined'?state?.currentView:null;}catch(_){return null;}}
function ts(v){const n=new Date(v||0).getTime();return Number.isFinite(n)?n:0;}
function date(v){return v?(window.KYV?.formatDate?KYV.formatDate(v,'—'):new Date(v).toLocaleDateString('it-IT')):'—';}
function money(v){const n=window.KYV?.parseNumber?KYV.parseNumber(v):Number(String(v??'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
function euro(v){return window.KYV?.formatEuro?KYV.formatEuro(v):new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(v||0);}
function paid(row){return window.KYV?.isPaid?KYV.isPaid(row?.PAGATA)||KYV.isPaid(row?.PAGAMENTO):/^(si|sì|yes|true|1|pagat|incassat)/i.test(text(row?.PAGATA||row?.PAGAMENTO));}
function amount(row){return money(row?.ImportoTotaleDocumento??row?.PrezzoTotale??row?.PrezzoUnitario??row?.ImportoPagamento??0);}
function daysSince(v){const n=ts(v);return n?Math.max(0,Math.floor((Date.now()-n)/86400000)):0;}
function pitchKey(row){
  const raw=text(row?.Stato).toLowerCase();
  if(/interessat|confermat|approvat|accettat|scelt/.test(raw))return'interested';
  if(/revision|feedback|comment/.test(raw))return'revision';
  if(/chius|non interess|rifiut|declin|(^|\s|\/)(no|pass)(\s|$)/.test(raw))return'closed';
  const activity=row?.Data_Conferma||row?.Data_Invio||row?.updated_at||row?.created_at;
  return daysSince(activity)>=FOLLOWUP_DAYS?'due':'waiting';
}
function versions(m){
  const rows=[...(m?.audio||[]),...(m?.consegne||[])],seen=new Set();
  return rows.filter((row,index)=>{const key=text(row.ID_VERSIONE)?'v:'+row.ID_VERSIONE:text(row.ID_FILE)?'f:'+row.ID_FILE:text(row.ID_CONSEGNA)?'c:'+row.ID_CONSEGNA:text(row.LINK_FILE||row.Link_Dropbox||row.Link_Drive)?'l:'+text(row.LINK_FILE||row.Link_Dropbox||row.Link_Drive):'r:'+index;if(seen.has(key))return false;seen.add(key);return true;});
}
function releaseState(p,m){
  const checks=[
    ['Master',has(p.Data_Consegna_Master)||versions(m).some(row=>/master|final|definitiv/i.test(text(row.TIPO_VERSIONE||row.Tipo_File||row.Versione||row.NOME_FILE||row.Nome_File)))],
    ['Data uscita',has(p.Data_Pubblicazione)],
    ['ISRC',has(p.Codice_ISRC)],
    ['Autori',has(p.AUTORI)],
    ['Label',has(p.Label)],
    ['Produttore',has(p.Produttore_Fonografico)],
    ['Quote',has(p.Quota_Musica_Kyv)||has(p.Quota_Musica_Artista)||has(p.Quota_Testo_Artista)],
    ['IMAIE',has(p.Ruolo_IMAIE_Kyv)]
  ];
  const ready=checks.filter(([,ok])=>ok).length;
  return{ready,total:checks.length,missing:checks.filter(([,ok])=>!ok).map(([label])=>label)};
}
function financeState(m){
  const rows=m?.fatture||[];
  const total=rows.reduce((s,r)=>s+amount(r),0),paidRows=rows.filter(paid),paidTotal=paidRows.reduce((s,r)=>s+amount(r),0);
  return{rows,total,paidCount:paidRows.length,paidTotal,openTotal:Math.max(0,total-paidTotal)};
}
function productionState(p,m){
  const rows=versions(m);
  const master=has(p.Data_Consegna_Master)||rows.some(row=>/master|final|definitiv/i.test(text(row.TIPO_VERSIONE||row.Tipo_File||row.Versione||row.NOME_FILE||row.Nome_File)));
  return{rows,master};
}
function pitchState(m){
  const rows=m?.invii||[],counts={due:0,waiting:0,revision:0,interested:0,closed:0};
  rows.forEach(row=>counts[pitchKey(row)]++);
  return{rows,counts};
}
function events(p,m){
  const out=[],add=(when,label,detail,icon)=>{if(ts(when))out.push({when,label,detail,icon,sort:ts(when)});};
  add(p.Data_Sessione,'Sessione',p.ARTISTA||p.TITOLO,'mic-2');
  add(p['Data Contratto'],'Contratto',p.Label||p.MANAGEMENT,'file-signature');
  versions(m).forEach(row=>add(row.DATA_FILE||row.Data_Caricamento||row.Data_Consegna||row.Data_Documento||row.created_at,'Versione',row.NOME_FILE||row.Nome_File||row.Titolo_Documento||row.TITOLO||row.Titolo,'audio-waveform'));
  (m?.invii||[]).forEach(row=>{add(row.Data_Invio,'Invio',row.Destinatario||row.Canale,'send');add(row.Data_Conferma,'Aggiornamento pitch',row.Stato||row.Conferma_Ricezione,'message-square-text');});
  add(p.Data_Consegna_Master,'Master consegnato',p.TITOLO,'badge-check');
  add(p.Data_Pubblicazione,'Release',p.Codice_ISRC||p.Label,'rocket');
  (m?.fatture||[]).forEach(row=>add(row.Data,'Fattura',row.Numero?'N° '+row.Numero:(row.Denominazione||'Fattura'),'receipt'));
  return out.sort((a,b)=>b.sort-a.sort).slice(0,3);
}
function nextAction(p,m,prod,pitch,release,finance){
  const due=(m?.invii||[]).find(row=>pitchKey(row)==='due');
  if(due)return{title:'Sollecita '+(text(due.Destinatario)||'il destinatario'),detail:daysSince(due.Data_Conferma||due.Data_Invio)+' giorni senza aggiornamenti.',target:'pitch',tone:'urgent'};
  const explicit=text(p.SVILUPPO);
  if(explicit&&!/^(finita|completata|uscita|pubblicata|chiusa)$/i.test(explicit))return{title:explicit,detail:'Prossima azione indicata nel progetto.',target:'production',tone:'active'};
  if(!prod.rows.length)return{title:'Aggiungi la prima versione',detail:'Collega una demo o una versione audio per avviare il flusso.',target:'production',tone:'active'};
  if(!pitch.rows.length)return{title:'Registra il primo invio',detail:'Il brano ha versioni disponibili ma nessun pitch registrato.',target:'pitch',tone:'active'};
  if(pitch.counts.interested&&!prod.master)return{title:'Conferma la versione finale',detail:'C’è interesse registrato: identifica il master prima di passare alla release.',target:'release',tone:'active'};
  if(release.ready<release.total)return{title:'Completa il Release Desk',detail:'Mancano: '+release.missing.slice(0,3).join(', ')+(release.missing.length>3?'…':''),target:'release',tone:'active'};
  if(!finance.rows.length&&has(p.Data_Pubblicazione))return{title:'Verifica la fatturazione',detail:'Il progetto risulta in release ma non ha fatture collegate.',target:'economy',tone:'active'};
  if(finance.openTotal>0)return{title:'Controlla l’incasso',detail:euro(finance.openTotal)+' ancora da incassare sulle fatture collegate.',target:'economy',tone:'urgent'};
  return{title:'Progetto allineato',detail:'Nessuna urgenza operativa rilevata.',target:'timeline',tone:'ready'};
}
function ensureStyle(){
  if(document.getElementById('kyv-project-hub-v3-style'))return;
  const style=document.createElement('style');style.id='kyv-project-hub-v3-style';style.textContent=`
#kyv-project-hub-v3{border:1px solid rgba(148,163,184,.14);background:linear-gradient(135deg,rgba(17,24,39,.96),rgba(15,17,26,.96));border-radius:1.15rem;padding:1rem;box-shadow:0 18px 48px rgba(0,0,0,.16)}
.kyv-hub3-top{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:.8rem}.kyv-hub3-next,.kyv-hub3-recent{border:1px solid rgba(148,163,184,.10);border-radius:.9rem;background:rgba(255,255,255,.025);padding:.9rem}
.kyv-hub3-kicker{font-size:.58rem;text-transform:uppercase;letter-spacing:.13em;font-weight:900;color:#94a3b8}.kyv-hub3-next h3{font-size:1rem;color:#fff;font-weight:900;margin-top:.25rem}.kyv-hub3-next p,.kyv-hub3-recent p{font-size:.68rem;color:#94a3b8;line-height:1.45;margin-top:.25rem}
.kyv-hub3-next.urgent{border-color:rgba(244,63,94,.24);background:rgba(244,63,94,.06)}.kyv-hub3-next.ready{border-color:rgba(16,185,129,.22);background:rgba(16,185,129,.05)}
.kyv-hub3-lanes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.65rem;margin-top:.7rem}.kyv-hub3-lane{appearance:none;text-align:left;border:1px solid rgba(148,163,184,.11);background:rgba(255,255,255,.025);border-radius:.9rem;padding:.82rem;transition:.15s;min-width:0}.kyv-hub3-lane:hover{border-color:rgba(99,102,241,.38);background:rgba(99,102,241,.07);transform:translateY(-1px)}
.kyv-hub3-lane-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem}.kyv-hub3-lane-name{font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;font-weight:900;color:#cbd5e1}.kyv-hub3-lane-status{display:inline-flex;align-items:center;border-radius:999px;padding:.22rem .42rem;font-size:.55rem;font-weight:900;border:1px solid rgba(148,163,184,.15);color:#cbd5e1}.kyv-hub3-lane strong{display:block;color:#fff;font-size:.94rem;font-weight:900;margin-top:.48rem;overflow-wrap:anywhere}.kyv-hub3-lane p{color:#94a3b8;font-size:.62rem;line-height:1.4;margin-top:.22rem}.kyv-hub3-lane.good .kyv-hub3-lane-status{color:#a7f3d0;border-color:rgba(16,185,129,.24);background:rgba(16,185,129,.07)}.kyv-hub3-lane.warn .kyv-hub3-lane-status{color:#fde68a;border-color:rgba(245,158,11,.24);background:rgba(245,158,11,.07)}.kyv-hub3-lane.bad .kyv-hub3-lane-status{color:#fecdd3;border-color:rgba(244,63,94,.24);background:rgba(244,63,94,.07)}
.kyv-hub3-event{display:flex;gap:.45rem;align-items:flex-start;margin-top:.42rem}.kyv-hub3-event:first-of-type{margin-top:.55rem}.kyv-hub3-event i{width:.85rem;height:.85rem;color:#a5b4fc;flex:none;margin-top:.05rem}.kyv-hub3-event span{font-size:.61rem;color:#cbd5e1;line-height:1.35}.kyv-hub3-open{margin-top:.55rem;border:0;background:transparent;color:#c7d2fe;font-size:.62rem;font-weight:900;padding:0;cursor:pointer}
@media(max-width:1050px){.kyv-hub3-lanes{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){#kyv-project-hub-v3{padding:.75rem}.kyv-hub3-top{grid-template-columns:1fr}.kyv-hub3-lanes{grid-template-columns:1fr}.kyv-hub3-lane{min-height:82px}}
`;document.head.appendChild(style);
}
function ensureMount(){
  const viewEl=document.getElementById('project-view'),tabs=document.getElementById('tabs');if(!viewEl||!tabs)return null;
  let hub=document.getElementById('kyv-project-hub-v3');
  if(!hub){hub=document.createElement('section');hub.id='kyv-project-hub-v3';tabs.insertAdjacentElement('beforebegin',hub);}
  return hub;
}
function fingerprint(current){
  const p=current?.p||{},m=current?.matches||{};
  return JSON.stringify([p.ID,p.SVILUPPO,p.Data_Consegna_Master,p.Data_Pubblicazione,p.Codice_ISRC,p.AUTORI,p.Label,p.Produttore_Fonografico,p.Quota_Musica_Kyv,p.Quota_Musica_Artista,p.Quota_Testo_Artista,p.Ruolo_IMAIE_Kyv,
    versions(m).map(v=>[v.ID_VERSIONE,v.ID_FILE,v.ID_CONSEGNA,v.NOME_FILE,v.Nome_File,v.DATA_FILE,v.Data_Caricamento]),
    (m.invii||[]).map(i=>[i.ID_INVIO,i.Stato,i.Destinatario,i.Data_Invio,i.Data_Conferma]),
    (m.fatture||[]).map(f=>[f.ID_FT,f.Numero,f.Data,f.PAGATA,f.ImportoTotaleDocumento,f.PrezzoTotale,f.PrezzoUnitario,f.ImportoPagamento])]);
}
function lane(tone,name,status,value,detail,target,icon){
  return `<button type="button" class="kyv-hub3-lane ${tone}" data-hub3-target="${target}"><div class="kyv-hub3-lane-head"><span class="kyv-hub3-lane-name"><i data-lucide="${icon}" class="w-3.5 h-3.5 inline mr-1"></i>${H(name)}</span><span class="kyv-hub3-lane-status">${H(status)}</span></div><strong>${H(value)}</strong><p>${H(detail)}</p></button>`;
}
function go(target){
  if(target==='economy'){window.setTab?.('amministrazione');setTimeout(()=>document.getElementById('kyv-project-finance-summary')?.scrollIntoView({behavior:'smooth',block:'center'})||document.getElementById('tab-admin')?.scrollIntoView({behavior:'smooth',block:'start'}),80);return;}
  if(target==='timeline'){document.getElementById('kyv-project-v2-timeline')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
  window.setTab?.('produzione');
  const id=target==='production'?'kyv-project-v2-versions':target==='pitch'?'kyv-pitch-followup-project':'kyv-release-desk';
  setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'center'}),80);
}
function render(){
  const current=view(),hub=ensureMount();if(!current||!current.p||!hub)return false;
  const fp=fingerprint(current);if(fp===lastFingerprint&&hub.children.length)return true;lastFingerprint=fp;
  const p=current.p,m=current.matches||{},prod=productionState(p,m),pitch=pitchState(m),release=releaseState(p,m),finance=financeState(m),recent=events(p,m),next=nextAction(p,m,prod,pitch,release,finance);
  const prodTone=!prod.rows.length?'bad':prod.master?'good':'warn';
  const prodStatus=!prod.rows.length?'Da avviare':prod.master?'Master':'In lavorazione';
  const pitchTone=pitch.counts.due?'bad':pitch.counts.interested?'good':pitch.rows.length?'warn':'bad';
  const pitchStatus=pitch.counts.due?pitch.counts.due+' follow-up':pitch.counts.interested?'Interesse':pitch.rows.length?'In attesa':'Nessun invio';
  const releaseTone=release.ready===release.total?'good':release.ready>=5?'warn':'bad';
  const financeTone=!finance.rows.length?'warn':finance.openTotal>0?'bad':'good';
  const financeStatus=!finance.rows.length?'Da fatturare':finance.openTotal>0?'Da incassare':'Incassato';
  hub.innerHTML=`
    <div class="kyv-hub3-top">
      <div class="kyv-hub3-next ${next.tone}"><span class="kyv-hub3-kicker">Prossima azione</span><h3>${H(next.title)}</h3><p>${H(next.detail)}</p><button type="button" class="kyv-hub3-open" data-hub3-target="${next.target}">Apri il punto operativo →</button></div>
      <div class="kyv-hub3-recent"><span class="kyv-hub3-kicker">Ultime attività</span>${recent.length?recent.map(e=>`<div class="kyv-hub3-event"><i data-lucide="${e.icon}"></i><span><strong class="text-white">${H(e.label)}</strong> · ${H(date(e.when))}${e.detail?' · '+H(e.detail):''}</span></div>`).join(''):'<p>Nessuna attività datata ancora disponibile.</p>'}</div>
    </div>
    <div class="kyv-hub3-lanes">
      ${lane(prodTone,'Produzione',prodStatus,prod.rows.length+' versioni',prod.master?'Master/finale individuato':'Ultima versione da portare avanti','production','audio-waveform')}
      ${lane(pitchTone,'Pitch',pitchStatus,pitch.rows.length+' invii',pitch.counts.due?'Serve un follow-up':pitch.counts.interested?'Almeno un interesse registrato':'Stato degli invii e risposte','pitch','send')}
      ${lane(releaseTone,'Release',release.ready+'/'+release.total+' pronti',release.missing.length?release.missing.slice(0,2).join(' · '):'Pronta','Dati uscita, crediti e diritti','release','rocket')}
      ${lane(financeTone,'Economia',financeStatus,finance.rows.length?euro(finance.total):'Nessuna fattura',finance.rows.length?(finance.openTotal>0?euro(finance.openTotal)+' aperti':finance.paidCount+'/'+finance.rows.length+' incassate'):'Verifica quando emettere la fattura','economy','badge-euro')}
    </div>`;
  hub.querySelectorAll('[data-hub3-target]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.hub3Target)));
  // This is the canonical next-action panel. Suppress the duplicated hero banner
  // only when the hub was really rendered, leaving the hero as fallback.
  const repeatedNext=document.getElementById('kyv-v2-next');
  if(repeatedNext){repeatedNext.hidden=true;repeatedNext.style.display='none';}
  window.dispatchEvent(new CustomEvent('kyv:project-hub-v3-ready',{detail:{projectId:p.ID}}));
  if(window.lucide)lucide.createIcons({root:hub});
  return true;
}
function schedule(delay=40){clearTimeout(bootTimer);bootTimer=setTimeout(render,delay);}
function boot(){
  ensureStyle();ensureMount();render();
  let attempts=0;const retry=setInterval(()=>{attempts++;if(render()||attempts>=24)clearInterval(retry);},250);
  setTimeout(()=>clearInterval(retry),6500);
  ['kyv:project-v2-ready','kyv:pitch-updated','kyv:invoice-updated'].forEach(name=>window.addEventListener(name,()=>{lastFingerprint='';schedule();}));
}
window.KYV_PROJECT_HUB_V3={refresh:()=>{lastFingerprint='';return render();}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();