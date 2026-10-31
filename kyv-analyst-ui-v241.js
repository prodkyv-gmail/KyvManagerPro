/* KYV Analyst v2.41 browser-only read-only UI. No API keys, no third-party model calls. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=window.KYV_ANALYST_V241;
const promptExamples=[
  'Quanti piazzamenti ho registrato e quali follow-up dei pitch sono scaduti?',
  'Quante sessioni creative con fee zero sono ancora in sviluppo o uscite?',
  'Quali progetti sono senza entrate documentate?',
  'Quali artisti concentrano i ricavi?',
  'Quali follow-up sono scaduti?',
  'Qual è il tempo medio al primo incasso?',
  'Quali royalties devo ancora attribuire?',
  'Quali dati mancano per analisi affidabili?'
];
const euro=x=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(x)||0);
const now=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Rome'});
let report=null,working=false,creativeReport=null;
async function allRows(c,table,fields,order){
 const batch=500,max=10000;
 const first=await c.from(table).select(fields,{count:'exact'}).order(order,{ascending:false}).range(0,batch-1);
 if(first.error)throw Error('Lettura '+table+': '+first.error.message);
 if(first.count===null||first.count>max)throw Error(table+': risultato troppo grande o non verificabile');
 const data=[...(first.data||[])];
 while(data.length<first.count){
  const next=await c.from(table).select(fields).order(order,{ascending:false}).range(data.length,Math.min(first.count-1,data.length+batch-1));
  if(next.error||!next.data?.length)throw Error(table+': lettura incompleta');
  data.push(...next.data);
 }
 if(data.length!==first.count)throw Error(table+': numero di record incompleto');
 return data;
}
function showAnswer(question){
 if(!report)return;
 const creativeQuestion=/(piazzament|follow.up dei pitch|proposte registrate|sessioni registrate)/i.test(String(question));
 const response=creativeQuestion && creativeReport
 ? {title:'Sessioni e piazzamenti documentati',
    summary:'Hai registrato '+creativeReport.sessions+' sessioni e '+creativeReport.pitches+' proposte nel nuovo archivio. '+creativeReport.overdue.length+' follow-up di piazzamento hanno una data trascorsa. Questi numeri non includono sessioni storiche non registrate.',
    metrics:[{label:'Sessioni documentate',value:creativeReport.sessions},{label:'Piazzamenti',value:creativeReport.pitches},{label:'Follow-up da verificare',value:creativeReport.overdue.length},{label:'Brani collegati',value:creativeReport.projectsWithSession}],
    items:creativeReport.overdue.slice(0,15).map(p=>({label:p.destinatario,detail:'Follow-up '+p.prossimo_followup+' · stato '+p.stato,url:'scheda_progetto.html?id='+encodeURIComponent(p.id_progetto)})),
    notes:[creativeReport.caveat,creativeReport.feeCaveat,'Il motore non invia solleciti né cambia gli stati dei progetti.'],asOf:creativeReport.asOf}
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
function renderSuggestions(){
 if(!report)return;
 const stats=report.results.stats;
 const cards=[
 {title:'Follow-up da verificare',value:report.reasons.overdueFollowups,note:'Date di follow-up trascorse',q:'Quali follow-up sono scaduti?'},
 {title:'Senza entrate attribuite',value:report.reasons.noBasis,note:'Non significa progetti in perdita',q:'Quali progetti sono senza entrate documentate?'},
 {title:'Compensi non attribuiti',value:stats.unallocatedInvoiceLines,note:'Voci da collegare agli ID dei progetti',q:'Quali dati mancano per analisi affidabili?'},
 {title:'Royalties da attribuire',value:euro(stats.rightsNotAllocated),note:'Solo bonifici ricevuti e registrati',q:'Quali royalties devo ancora attribuire?'},
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

 const priority=report.recommendations.filter(x=>x.count>0).slice(0,6);
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
 $('analyst-footnote').textContent='Lettura completa: '+stats.projects+' progetti · '+stats.invoiceLines+' voci fattura · '+report.source.rights.length+' liquidazioni. Nessun dato è stato modificato.';
}
async function refresh(){
 if(working)return;working=true;$('analyst-status').textContent='Lettura e verifica degli archivi…';$('analyst-status').className='status';
 try{
  const c=window.KYV?.createSupabaseClient?.();
  if(!c)throw Error('Client autenticato non disponibile');
  const [projects,invoices,payments,paymentReversals,rights,allocations,allocationReversals,sessions,sessionLinks,pitches]=await Promise.all([
   allRows(c,'PROGETTI','ID,TITOLO,ARTISTA,STATO,SVILUPPO,FEE,Data_Sessione,Data_Pubblicazione,IDFT,Prossimo_Followup,Ultimo_Sollecito,Priorita_Followup','ID'),
   allRows(c,'FATTURE','ID_FT,ID_PROGETTO,XML_SHA256,PrezzoUnitario,PrezzoTotale,Data,PAGATA','ID_FT'),
   allRows(c,'FATTURE_INCASSI','ID_INCASSO,ID_FT,Data,Importo','ID_INCASSO'),
   allRows(c,'FATTURE_INCASSI_STORNI','ID_STORNO,ID_INCASSO','ID_STORNO'),
   allRows(c,'KYV_LIQUIDAZIONI_DIRITTI','ID_LIQUIDAZIONE,Ente,ImportoNetto,DataAccredito','ID_LIQUIDAZIONE'),
   allRows(c,'KYV_ATTRIBUZIONI_DIRITTI','ID_ATTRIBUZIONE,ID_LIQUIDAZIONE,ID_PROGETTO,Importo','ID_ATTRIBUZIONE'),
   allRows(c,'KYV_ATTRIBUZIONI_DIRITTI_STORNI','ID_STORNO,ID_ATTRIBUZIONE','ID_STORNO'),
   allRows(c,'KYV_SESSIONI','id,data_sessione,durata_minuti,esito,archiviata','data_sessione'),
   allRows(c,'KYV_SESSIONI_PROGETTI','id,id_sessione,id_progetto,annullato','created_at'),
   allRows(c,'KYV_PIAZZAMENTI','id,id_progetto,destinatario,stato,prossimo_followup,archiviata','created_at')
  ]);
  const payload={projects,invoices,payments,paymentReversals,rights,allocations,allocationReversals};
  report=E.build(payload,now());
  creativeReport=window.KYV_CREATIVE_DESK_V244.analyze({sessions,links:sessionLinks,pitches,projects},now());
  renderSuggestions();
  $('analyst-content').hidden=false;
  $('analyst-status').textContent='Analisi completata · motore a regole, accesso in sola lettura.';
  showAnswer($('analyst-query').value||'Quali dati mancano per analisi affidabili?');
 }catch(e){
  report=null;creativeReport=null;$('analyst-content').hidden=true;
  $('analyst-status').className='status error';
  $('analyst-status').textContent='Dati non completi o non disponibili. Nessuna conclusione mostrata: '+e.message;
 }finally{working=false;}
}
function init(){
 const release=$('kyv-analyst-app-version');if(release)release.textContent='v'+(window.KYV_CONFIG?.APP_VERSION||'');
 $('example-queries').innerHTML=promptExamples.map(q=>'<button type="button" data-ask="'+H(q)+'">'+H(q)+'</button>').join('');
 const ask=e=>{const b=e.target.closest('[data-ask]');if(!b)return;const q=b.dataset.ask;$('analyst-query').value=q;showAnswer(q);$('answer-panel').scrollIntoView({block:'start',behavior:'smooth'});};
 $('example-queries').addEventListener('click',ask);
 $('analyst-metrics').addEventListener('click',ask);
 $('analyst-creative-desk').addEventListener('click',ask);
 $('analyst-form').addEventListener('submit',e=>{e.preventDefault();if(!report)return;showAnswer($('analyst-query').value);});
 $('analyst-reload').addEventListener('click',refresh);
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
