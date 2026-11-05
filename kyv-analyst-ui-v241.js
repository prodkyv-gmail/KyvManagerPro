/* KYV Analyst v2.41 browser-only read-only UI. No API keys, no third-party model calls. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=window.KYV_ANALYST_V241,AUDIT=window.KYV_ECONOMY_AUDIT_V281;
const promptExamples=[
  'Quanti piazzamenti ho registrato e quali follow-up dei pitch sono scaduti?',
  'Quante sessioni creative con fee zero sono ancora in sviluppo o uscite?',
  'Quali progetti sono senza entrate documentate?',
  'Quali artisti concentrano i ricavi?',
  'Quali follow-up sono scaduti?',
  'Qual è il tempo medio al primo incasso?',
  'Quali royalties devo ancora attribuire?',
  'Quali dati mancano per analisi affidabili?',
  'Quali riconciliazioni economiche devo verificare?'
];
const euro=x=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(x)||0);
const now=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Rome'});
let report=null,working=false,creativeReport=null,economyAudit=null,readProgress=null;
async function allRows(c,table,fields,idKey){
 const reader=window.KYV_READ_GUARD_V282?.readComplete;
 if(!reader)throw Error('Lettura verificata v2.82 non disponibile');
 return reader(c,table,fields,idKey,{
  onProgress:({loaded,total})=>{
   if(!working||!readProgress)return;
   readProgress.set(table,{loaded,total});
   const complete=[...readProgress.values()].filter(x=>x.loaded===x.total).length;
   const records=[...readProgress.values()].reduce((sum,x)=>sum+x.loaded,0);
   $('analyst-status').textContent='Verifica archivi: '+complete+'/11 completati · '+records+' record letti. Nessun risultato parziale.';
  }
 });
}
function economyAuditAnswer(){
 const a=economyAudit;
 if(!a)return null;
 return {
  title:'Controlli di riconciliazione economica',
  summary:'Verifica documentale: '+a.invoice.lines+' voci fattura registrate, '+a.cash.activePayments+
   ' movimenti incasso attivi e '+a.rights.creditedCount+' liquidazioni SIAE/IMAIE con data di accredito. '+
   a.uniqueTypes+' tipi di segnalazione: non sono automaticamente insoluti, perdite o errori contabili.',
  items:a.issues.slice(0,15).map(x=>({label:x.label,detail:x.detail,url:x.url})),
  notes:a.caveats.concat(a.issues.length>15?['Sono mostrate le prime 15 segnalazioni: espandi Controllo di coerenza economica per le altre.']:[]),
  metrics:[{label:'Fatturato unitario',value:euro(a.invoice.registered)},
   {label:'Incassi con data registrata',value:euro(a.cash.dated)},
   {label:'SIAE netta accreditata',value:euro(a.rights.SIAE)},
   {label:'Nuovo IMAIE netto accreditato',value:euro(a.rights.IMAIE)},
   {label:'Diritti accreditati da attribuire',value:euro(a.rights.unallocated)}],
  asOf:report.asOf
 };
}
function rightsAuditAnswer(){
 const a=economyAudit;
 if(!a)return null;
 return {title:'Royalties e diritti collegati',
  summary:'Liquidazioni con DataAccredito registrata: SIAE '+euro(a.rights.SIAE)+' e Nuovo IMAIE '+euro(a.rights.IMAIE)+
    '. Quote nette ricevute ma non attribuite '+euro(a.rights.unallocated)+
    '. Le liquidazioni senza data di accredito non sono trattate come bonifici ricevuti.',
  items:report.projects.filter(p=>p.rightsCash>0).sort((x,y)=>y.rightsCash-x.rightsCash).slice(0,12)
   .map(p=>({label:p.title+' · '+p.artist,detail:'Diritti attribuiti '+euro(p.rightsCash),url:'scheda_progetto.html?id='+encodeURIComponent(p.ID)})),
  notes:[a.rights.undatedCount+' liquidazioni con importo e data mancante, non sommate agli accrediti.',
   'Gli estratti SIAE grezzi non dimostrano un accredito. Le quote di ogni liquidazione sono conteggiate al massimo fino al suo importo netto.',
   'Eventuali quote annullate o stornate non vengono conteggiate.'],
  metrics:[{label:'SIAE ricevuta con data',value:euro(a.rights.SIAE)},
   {label:'Nuovo IMAIE ricevuto con data',value:euro(a.rights.IMAIE)},
   {label:'Attribuito dai bonifici datati',value:euro(a.rights.attributed)},
   {label:'Da attribuire, con data',value:euro(a.rights.unallocated)}],asOf:report.asOf};
}
function renderEconomicAudit(){
 if(!economyAudit)return;
 const a=economyAudit;
 $('analyst-audit-summary').textContent=a.uniqueTypes+' tipi di verifica · '+
  a.invoice.splitMismatch+' ripartizioni incongruenti · '+a.cash.overpayments+
  ' possibili incassi eccedenti · '+a.rights.undatedCount+' liquidazioni senza data';
 const cells=[
  ['Fatturato gestionale',euro(a.invoice.registered),'Solo PrezzoUnitario; non totali documento duplicati'],
  ['Incassi con data registrata',euro(a.cash.dated),'Movimenti attivi con data, massimo importo unitario per voce'],
  ['Incassi legacy senza movimento',a.cash.legacyPaidUndated+' fatture','Stato PAGATA=SI; data bancaria non documentata'],
  ['SIAE netta accreditata',euro(a.rights.SIAE),'Solo liquidazioni con DataAccredito'],
  ['Nuovo IMAIE netto accreditato',euro(a.rights.IMAIE),'Solo liquidazioni con DataAccredito'],
  ['Diritti accreditati non attribuiti',euro(a.rights.unallocated),'Solo quote delle liquidazioni nette con data'],
  ['Fee positive senza fattura',a.fee.positiveUnbilled+' progetti','Da verificare: non sono automaticamente crediti'],
  ['Fee pari a zero',a.fee.zero+' progetti','Lavoro creativo possibile; non è un insoluto']
 ];
 $('analyst-audit-stats').innerHTML=cells.map(x=>'<div><small>'+H(x[0])+'</small><strong>'+H(x[1])+'</strong><span>'+H(x[2])+'</span></div>').join('');
 $('analyst-audit-list').innerHTML=a.issues.slice(0,30).map(x=>
  '<li><div><strong>'+H(x.label)+'</strong><span>'+H(x.detail)+'</span></div>'+
  (x.url?'<a href="'+H(x.url)+'">Verifica</a>':'')+'</li>').join('')||
  '<li><div><strong>Nessuno scostamento rilevato dalle regole</strong><span>Non sostituisce il controllo degli estratti bancari e della documentazione fiscale.</span></div></li>';
 $('analyst-audit-limit').textContent=a.issues.length>30?'Prime 30 segnalazioni su '+a.issues.length+'. Usa Rileggi e aggiorna i dati dopo la verifica delle schede originali.':'Le segnalazioni non modificano alcun record.';
 $('analyst-audit-caveats').innerHTML=a.caveats.map(x=>'<li>'+H(x)+'</li>').join('');
}
function showAnswer(question){
 if(!report)return;
 const q=String(question||'').toLowerCase();
 const auditQuestion=/(riconciliazion|coerenza economic|controlli economici|scostament)/.test(q);
 const rightsQuestion=/(royalt|diritti|siae|imaie|liquidaz)/.test(q);
 const creativeQuestion=/(piazzament|follow.up dei pitch|proposte registrate|sessioni registrate)/i.test(String(question));
 const response=creativeQuestion && creativeReport
 ? {title:'Sessioni e piazzamenti documentati',
    summary:'Hai registrato '+creativeReport.sessions+' sessioni e '+creativeReport.pitches+' proposte nel nuovo archivio. '+creativeReport.overdue.length+' follow-up di piazzamento hanno una data trascorsa. Questi numeri non includono sessioni storiche non registrate.',
    metrics:[{label:'Sessioni documentate',value:creativeReport.sessions},{label:'Piazzamenti',value:creativeReport.pitches},{label:'Follow-up da verificare',value:creativeReport.overdue.length},{label:'Brani collegati',value:creativeReport.projectsWithSession}],
    items:creativeReport.overdue.slice(0,15).map(p=>({label:p.destinatario,detail:'Follow-up '+p.prossimo_followup+' · stato '+p.stato,url:'scheda_progetto.html?id='+encodeURIComponent(p.id_progetto)})),
    notes:[creativeReport.caveat,creativeReport.feeCaveat,'Il motore non invia solleciti né cambia gli stati dei progetti.'],asOf:creativeReport.asOf}
 : auditQuestion&&economyAudit ? economyAuditAnswer()
 : rightsQuestion&&economyAudit ? rightsAuditAnswer()
 : E.answer(report,question);
 $('answer-title').textContent=response.title;
 $('answer-text').textContent=response.summary;
 $('answer-metrics').innerHTML=(response.metrics||[]).map(m=>'<div class="metric"><small>'+H(m.label)+'</small><strong>'+H(m.value)+'</strong></div>').join('');
 const items=response.items||[];
 $('answer-records').innerHTML=items.length?items.map(p=>'<li><div><strong>'+H(p.label)+'</strong><span>'+H(p.detail||'')+'</span></div>'+(p.url?'<a href="'+H(p.url)+'">Apri scheda</a>':'')+'</li>').join(''):'<li class="empty">Non ci sono elementi documentati da mostrare per questa risposta.</li>';
 $('answer-notes').innerHTML=(response.notes||[]).map(n=>'<li>'+H(n)+'</li>').join('');
 $('answer-meta').textContent='Situazione registrata al '+response.asOf+' · analisi basata solo sulle tabelle KYVManagerPro';
 $('answer-panel').hidden=false;
}
function renderArtistChart(){
 if(!report)return;
 const count=Number($('analyst-artist-limit').value)||5;
 const entries=report.artistRanks.filter(x=>Number.isFinite(x.amount)&&x.amount>0);
 const shown=entries.slice(0,count);
 const max=Math.max(1,...shown.map(x=>x.amount));
 $('analyst-artist-note').textContent=shown.length+' di '+entries.length+
  ' artisti con importi attribuiti · '+euro(report.linkedTotal)+
  ' fatturato attribuito complessivo. Lunghezza barre relativa all’artista con importo massimo.';
 $('analyst-artist-chart').innerHTML=shown.map((r,i)=>{
  const width=Math.max(1,Math.round(r.amount/max*100));
  return '<div class="kyv-analyst-artist-row"><div class="kyv-analyst-artist-label"><span>'+
   (i+1)+'. '+H(r.artist)+'</span><strong>'+H(euro(r.amount))+'</strong></div>'+
   '<div class="kyv-analyst-artist-track" aria-hidden="true"><span style="width:'+width+'%"></span></div>'+
   '<small>'+Number(r.projects).toLocaleString('it-IT')+' progetti con fatturato attribuito</small></div>';
 }).join('')||'<p class="empty">Nessun fatturato attribuito direttamente ai progetti: impossibile costruire una graduatoria attendibile.</p>';
}
function renderSuggestions(){
 if(!report)return;
 const stats=report.results.stats;
 const cards=[
 {title:'Follow-up da verificare',value:report.reasons.overdueFollowups,note:'Date di follow-up trascorse',q:'Quali follow-up sono scaduti?'},
 {title:'Senza entrate attribuite',value:report.reasons.noBasis,note:'Non significa progetti in perdita',q:'Quali progetti sono senza entrate documentate?'},
 {title:'Compensi non attribuiti',value:stats.unallocatedInvoiceLines,note:'Voci da collegare agli ID dei progetti',q:'Quali dati mancano per analisi affidabili?'},
 {title:'Royalties da attribuire',value:euro(economyAudit?.rights.unallocated??stats.rightsNotAllocated),note:'Solo liquidazioni SIAE/IMAIE con data accredito',q:'Quali royalties devo ancora attribuire?'},
 {title:'Tempo al primo accredito',value:stats.meanDaysToFirstCash===null?'Non disponibile':stats.meanDaysToFirstCash+' giorni',note:stats.withReturnDate+' progetti con entrambe le date',q:'Qual è il tempo medio al primo incasso?'},
 {title:'Copertura data sessione',value:report.reasons.noSession+' mancanti',note:'Su '+stats.projects+' progetti registrati',q:'Quali dati mancano per analisi affidabili?'}
 ];
 $('analyst-metrics').innerHTML=cards.map(c=>'<button class="metric pressable" type="button" data-ask="'+H(c.q)+'"><small>'+H(c.title)+'</small><strong>'+H(c.value)+'</strong><small>'+H(c.note)+'</small></button>').join('');
 const f=report.funnel;
 if(f){
  const v=[
   ['Progetti con fee zero',f.zeroFee,'Sessioni creative potenzialmente esplorative'],
   ['Fee zero · stato USCITA',f.zeroByStage.releaseLabeled,'Stato dichiarato, data pubblicazione mancante'],
   ['Fee zero · sviluppo/proposta',f.zeroByStage.developing+f.zeroByStage.pitched,'Non sono automaticamente progetti scartati'],
   ['Conversione sessioni→uscite',f.conversionReliable?f.conversion+'%':'Non calcolabile',f.datedSessions+' sessioni datate su '+f.total+' progetti']
  ];
  $('creative-funnel-metrics').innerHTML=v.map(x=>'<button type="button" class="metric pressable" data-ask="'+H(promptExamples[0])+'"><small>'+H(x[0])+'</small><strong>'+H(x[1])+'</strong><small>'+H(x[2])+'</small></button>').join('');
 }

 const priority=report.recommendations.map(x=>x.id==='rights'&&economyAudit
  ? {...x,count:economyAudit.rights.unallocated,why:'Solo liquidazioni con DataAccredito; importi senza data esclusi.'}:x)
  .filter(x=>x.count>0).slice(0,6);
 $('analyst-priorities').innerHTML=priority.length?priority.map(x=>'<li><div><strong>'+H(x.title)+'</strong><span>'+H(x.unit==='EUR'?euro(x.count):x.count)+' · '+H(x.why)+'</span><span>'+H(x.action)+'</span></div>'+(x.url?'<a href="'+H(x.url)+'">Verifica</a>':'')+'</li>').join(''):'<li>Nessuna criticità rilevata dalle regole disponibili.</li>';
 if(creativeReport){
  const c=creativeReport;
  const lines=[['Sessioni registrate',c.sessions,'Non include le vecchie schede senza sessioni'],
    ['Brani con sessione collegata',c.projectsWithSession,'Relazione verificata per ID'],
    ['Piazzamenti registrati',c.pitches,'Proposte distinte per destinatario'],
    ['Follow-up dei pitch scaduti',c.overdue.length,'Date da verificare prima di ricontattare'],
    ['Ore registrate',c.datedDurationSessions?(c.durationMin/60).toFixed(1).replace('.',','):'Non disponibili','Solo durate realmente inserite']];
  $('analyst-creative-desk').innerHTML=lines.map(v=>'<button class="metric pressable" type="button" data-ask="Quanti piazzamenti ho registrato e quali follow-up dei pitch sono scaduti?"><small>'+H(v[0])+'</small><strong>'+H(v[1])+'</strong><small>'+H(v[2])+'</small></button>').join('');
 }
 renderEconomicAudit();
 renderArtistChart();
 $('analyst-footnote').textContent='Lettura completa: '+stats.projects+' progetti · '+stats.invoiceLines+' voci fattura · '+report.source.rights.length+' liquidazioni. Nessun dato è stato modificato.';
}
async function refresh(){
 if(working)return;working=true;readProgress=new Map();$('analyst-status').textContent='Lettura e verifica degli archivi…';$('analyst-status').className='status';
 const reload=$('analyst-reload');reload.disabled=true;reload.textContent='Lettura in corso…';
 try{
  const c=window.KYV?.createSupabaseClient?.();
  if(!c)throw Error('Client autenticato non disponibile');
  const [projects,invoices,payments,paymentReversals,rights,allocations,allocationReversals,sessions,sessionLinks,pitches,invoiceSplits]=await Promise.all([
   allRows(c,'PROGETTI','ID,TITOLO,ARTISTA,STATO,SVILUPPO,FEE,Data_Sessione,Data_Pubblicazione,IDFT,Prossimo_Followup,Ultimo_Sollecito,Priorita_Followup','ID'),
   allRows(c,'FATTURE','ID_FT,ID_PROGETTO,XML_SHA256,PrezzoUnitario,PrezzoTotale,Data,PAGATA','ID_FT'),
   allRows(c,'FATTURE_INCASSI','ID_INCASSO,ID_FT,Data,Importo','ID_INCASSO'),
   allRows(c,'FATTURE_INCASSI_STORNI','ID_STORNO,ID_INCASSO','ID_STORNO'),
   allRows(c,'KYV_LIQUIDAZIONI_DIRITTI','ID_LIQUIDAZIONE,Ente,ImportoNetto,DataAccredito','ID_LIQUIDAZIONE'),
   allRows(c,'KYV_ATTRIBUZIONI_DIRITTI','ID_ATTRIBUZIONE,ID_LIQUIDAZIONE,ID_PROGETTO,Importo','ID_ATTRIBUZIONE'),
   allRows(c,'KYV_ATTRIBUZIONI_DIRITTI_STORNI','ID_STORNO,ID_ATTRIBUZIONE','ID_STORNO'),
   allRows(c,'KYV_SESSIONI','id,data_sessione,durata_minuti,esito,archiviata','id'),
   allRows(c,'KYV_SESSIONI_PROGETTI','id,id_sessione,id_progetto,annullato','id'),
   allRows(c,'KYV_PIAZZAMENTI','id,id_progetto,destinatario,stato,prossimo_followup,archiviata','id'),
   allRows(c,'FATTURE_RIPARTIZIONI','id,id_ft,id_progetto,prezzo_unitario','id')
  ]);
  const payload={projects,invoices,payments,paymentReversals,rights,allocations,allocationReversals,invoiceSplits};
  report=E.build(payload,now());
  economyAudit=AUDIT.analyze(payload,report);
  creativeReport=window.KYV_CREATIVE_DESK_V244.analyze({sessions,links:sessionLinks,pitches,projects},now());
  renderSuggestions();
  $('analyst-content').hidden=false;
  $('analyst-status').textContent='Analisi completata · motore a regole, accesso in sola lettura.';
  showAnswer($('analyst-query').value||'Quali dati mancano per analisi affidabili?');
 }catch(e){
  report=null;creativeReport=null;economyAudit=null;$('analyst-content').hidden=true;
  $('analyst-status').className='status error';
  $('analyst-status').textContent='Dati non completi o non disponibili. Nessuna conclusione mostrata: '+e.message;
 }finally{working=false;readProgress=null;reload.disabled=false;reload.textContent='Rileggi e aggiorna i dati';}
}
function init(){
 const release=$('kyv-analyst-app-version');if(release)release.textContent='v'+(window.KYV_CONFIG?.APP_VERSION||'');
 $('example-queries').innerHTML=promptExamples.map(q=>'<button type="button" data-ask="'+H(q)+'">'+H(q)+'</button>').join('');
 const ask=e=>{const b=e.target.closest('[data-ask]');if(!b)return;const q=b.dataset.ask;$('analyst-query').value=q;showAnswer(q);$('answer-panel').scrollIntoView({block:'start',behavior:'smooth'});};
 $('example-queries').addEventListener('click',ask);
 $('analyst-metrics').addEventListener('click',ask);
 $('analyst-creative-desk').addEventListener('click',ask);
 $('analyst-form').addEventListener('submit',e=>{e.preventDefault();if(!report)return;showAnswer($('analyst-query').value);});
 $('analyst-artist-limit').addEventListener('change',renderArtistChart);
 $('analyst-reload').addEventListener('click',refresh);
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
