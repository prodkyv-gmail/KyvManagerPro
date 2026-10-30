/* KYV Analyst v2.41 — transparent, deterministic read-only financial assistant.
   Does not call an AI provider or send financial data to third parties.
   All calculations derive from project-return v2.40 and explicit project records.
*/
(function(root){
'use strict';
const str=x=>String(x??'').trim();
const num=x=>{if(typeof x==='number')return Number.isFinite(x)?x:null;let s=str(x).replace(/[€\s]/g,'').replace(/[^\d.,-]/g,'');if(!s)return null;const c=s.lastIndexOf(','),p=s.lastIndexOf('.');if(c>p)s=s.replace(/\./g,'').replace(',','.');else if(p>c&&c>=0)s=s.replace(/,/g,'');const n=Number(s);return Number.isFinite(n)?n:null;};
const day=x=>/^\d{4}-\d{2}-\d{2}$/.test(str(x))&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))?str(x):null;
const days=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);
const cents=x=>Math.round((num(x)||0)*100);
const euros=x=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(x)||0);
const projectUrl=id=>id?'scheda_progetto.html?id='+encodeURIComponent(id):null;
const item=(p,why)=>({label:p.title+' · '+p.artist,detail:why,url:projectUrl(p.ID),id:String(p.ID)});
function build(raw={},now='2026-10-30'){
 if(!day(now))throw Error('Data del report non valida');
 if(!root.KYV_PROJECT_RETURNS_V240?.analyze)throw Error('Analisi dei progetti non disponibile');
 const results=root.KYV_PROJECT_RETURNS_V240.analyze(raw),pRaw=raw.projects||[];
 const byId=new Map(pRaw.map(p=>[str(p.ID),p]));
 const projects=results.projects.map(p=>({...p,raw:byId.get(str(p.ID))||{}}));
 let missingSession=0,missingRelease=0,missingFee=0,zeroFee=0,feePromisedNotBilled=[];
 let overdueFollowups=[],futureFollowups=[],undatedPayments=[],oldUnbilled=[];
 for(const p of projects){
  const q=p.raw,fee=num(q.FEE),followup=day(q.Prossimo_Followup);
  if(!p.start)missingSession++;
  if(!p.release)missingRelease++;
  if(fee===null)missingFee++;
  if(fee===0)zeroFee++;
  if(followup&&followup<now)overdueFollowups.push({...p,followup,late:days(followup,now)});
  else if(followup&&days(now,followup)<=7&&followup>=now)futureFollowups.push({...p,followup});
  if(p.undatedLegacy>0)undatedPayments.push(p);
  if(fee!==null&&fee>0&&p.billed===0){
    feePromisedNotBilled.push(p);
    if(p.start&&days(p.start,now)>90)oldUnbilled.push({...p,age:days(p.start,now)});
  }
 }
 overdueFollowups.sort((a,b)=>a.followup.localeCompare(b.followup));
 futureFollowups.sort((a,b)=>a.followup.localeCompare(b.followup));
 oldUnbilled.sort((a,b)=>b.age-a.age);
 // Concentration uses invoiced line amounts, not invoice document totals or SIAE.
 const artistMap=new Map();
 for(const p of projects){
  if(!p.billed)continue;
  const name=str(p.artist)||'—';
  const r=artistMap.get(name)||{name,amountCents:0,projects:0};
  r.amountCents+=cents(p.billed);r.projects++;artistMap.set(name,r);
 }
 const artistRanks=Array.from(artistMap.values()).sort((a,b)=>b.amountCents-a.amountCents).map(r=>({artist:r.name,amount:r.amountCents/100,projects:r.projects}));
 const linkedTotal=artistRanks.reduce((a,b)=>a+cents(b.amount),0);
 const topShare=linkedTotal>0?Math.round(artistRanks.slice(0,3).reduce((s,x)=>s+cents(x.amount),0)*100/linkedTotal):null;
 const byBilled=projects.filter(p=>p.billed>0).sort((a,b)=>b.billed-a.billed);
 const byReceived=projects.filter(p=>p.totalDocumentedCash>0).sort((a,b)=>b.totalDocumentedCash-a.totalDocumentedCash);
 const returnSample=projects.filter(p=>p.returnDays!==null).sort((a,b)=>a.returnDays-b.returnDays);
 const reasons={
  noBasis:results.stats.noKnownEconomicBasis,
  noSession:missingSession,noRelease:missingRelease,missingFee,zeroFee,
  unlinkedInvoiceLines:results.stats.unallocatedInvoiceLines,
  ambiguousInvoiceLines:results.stats.ambiguousInvoiceLines,
  undatedPayments:undatedPayments.length,
  rightsUnallocated:results.stats.rightsNotAllocated,
  feePromisedNotBilled:feePromisedNotBilled.length,
  oldUnbilled:oldUnbilled.length,
  overdueFollowups:overdueFollowups.length
 };
 const recommendations=[
  {id:'followups',priority:overdueFollowups.length?1:9,title:'Follow-up con data superata',count:overdueFollowups.length,why:'Scadenze esplicite già trascorse: controllare l’esito prima di sollecitare.',action:'Apri le schede e aggiorna il prossimo contatto.',url:overdueFollowups.length?projectUrl(overdueFollowups[0].ID):null},
  {id:'fees',priority:oldUnbilled.length?2:9,title:'Fee positive senza fattura, sessione oltre 90 giorni',count:oldUnbilled.length,why:'Segnalazione di controllo, non credito certo. Verifica contratto e fase del lavoro.',action:'Controlla accordi e documentazione della consegna.',url:oldUnbilled.length?projectUrl(oldUnbilled[0].ID):null},
  {id:'invoice-links',priority:results.stats.unallocatedInvoiceLines?3:9,title:'Voci fattura non attribuite',count:results.stats.unallocatedInvoiceLines,why:'Mancano collegamenti univoci agli ID dei progetti.',action:'Verifica gli abbinamenti in Economia → Riconciliazione.',url:'fatture.html'},
  {id:'rights',priority:results.stats.rightsNotAllocated>0?4:9,title:'Diritti ricevuti ancora da attribuire',count:results.stats.rightsNotAllocated,unit:'EUR',why:'Liquidazioni ricevute non ancora ripartite fra i brani.',action:'Apri Ritorno dei progetti e distribuisci le quote con il rendiconto.',url:'kyv_ritorni_progetti.html'},
  {id:'start-dates',priority:missingSession?5:9,title:'Progetti senza data prima sessione',count:missingSession,why:'Impediscono di misurare con affidabilità il tempo al primo accredito.',action:'Integra soltanto le date che conosci con certezza.',url:'progetti.html'},
  {id:'cash-dates',priority:undatedPayments.length?6:9,title:'Pagamenti storici senza data bancaria',count:undatedPayments.length,why:'Lo stato PAGATA=SI non permette di ricostruire quando arrivò il bonifico.',action:'Verifica i movimenti bancari prima di completare le date.',url:'fatture.html'}
 ].sort((a,b)=>a.priority-b.priority||b.count-a.count);
 return Object.freeze({asOf:now,source:raw,results,projects,artistRanks,topShare,linkedTotal:linkedTotal/100,
  byBilled,byReceived,returnSample,overdueFollowups,futureFollowups,oldUnbilled,feePromisedNotBilled,
  undatedPayments,reasons,recommendations,
  gaps:['Il valore fatturato deriva dalle voci e non dai totali-documento ripetuti.',
   'PAGATA=SI senza movimento datato non dimostra in quale mese è arrivato il denaro.',
   'Il valore SIAE degli estratti grezzi non coincide automaticamente con bonifici ricevuti.',
   'L’assenza di fee o ricavi attribuiti non dimostra che il brano non renderà.']});
}
function answer(report,query){
 const q=str(query).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const r=report,stats=r.results.stats;
 const A=(title,summary,items=[],notes=[],metrics=[])=>({title,summary,items,notes,metrics,asOf:r.asOf});
 if(!q)return A('Come posso aiutarti?','Scegli una domanda suggerita oppure chiedi di ricavi, progetti, scadenze o qualità dei dati.',[],[],[]);
 if(/(segu|sollecit|contatt|scadenz|follow.?up)/.test(q)){
  return A('Follow-up da verificare',
   r.overdueFollowups.length+' progetti hanno una data di follow-up precedente al '+r.asOf+'. Non significa che il contatto non sia già avvenuto.',
   r.overdueFollowups.slice(0,15).map(p=>item(p,'Data follow-up '+p.followup+' · '+p.late+' giorni trascorsi')),
   ['Dati da PROGETTI.Prossimo_Followup. Nessun messaggio o sollecito è inviato automaticamente.'],
   [{label:'Follow-up scaduti',value:r.overdueFollowups.length},{label:'Entro 7 giorni',value:r.futureFollowups.length}]);
 }
 if(/(concentraz|artisti|clienti|dipendenz|top artist|piu ricavi per artista)/.test(q)){
  const items=r.artistRanks.slice(0,12).map(x=>({label:x.artist,detail:euros(x.amount)+' · '+x.projects+' progetti con fatturato attribuito',url:null}));
  return A('Concentrazione del fatturato per artista',
   'La quota dei primi tre artisti sul fatturato attribuito è '+(r.topShare===null?'non calcolabile':r.topShare+'%')+'. Sono escluse le voci non associate a un progetto.',
   items,['Non sono necessariamente clienti o committenti: la misura raggruppa il campo ARTISTA dei progetti.','Le royalties non sono fatturato e restano fuori da questa graduatoria.'],
   [{label:'Fatturato attribuito',value:euros(r.linkedTotal)},{label:'Artisti con fatturato',value:r.artistRanks.length}]);
 }
 if(/(tempo|ritorn|quanto ci mette|primo incasso|mesi|giorni|veloc)/.test(q)){
  const m=stats.meanDaysToFirstCash;
  return A('Tempo dalla sessione al primo accredito',
   m===null?'Non esistono dati sufficienti per una media affidabile.':'Media osservata: '+m+' giorni, calcolata su '+stats.withReturnDate+' progetti che hanno entrambe le date.',
   r.returnSample.slice(0,12).map(p=>item(p,'Sessione '+p.start+' · primo accredito '+p.firstCash+' · '+p.returnDays+' giorni')),
   ['Campione limitato ai progetti con data sessione e primo accredito esplicito.','I PAGATA=SI storici senza data non sono usati per calcolare tempi.'],
   [{label:'Progetti misurabili',value:stats.withReturnDate},{label:'Progetti totali',value:stats.projects}]);
 }
 if(/(royalt|diritti|siae|imaie|liquidaz)/.test(q)){
  return A('Royalties e diritti collegati',
   'I bonifici ricevuti e attribuiti ai progetti ammontano a '+euros(stats.rightsAllocated)+'. Restano '+euros(stats.rightsNotAllocated)+' di liquidazioni senza attribuzione.',
   r.projects.filter(p=>p.rightsCash>0).sort((a,b)=>b.rightsCash-a.rightsCash).slice(0,12).map(p=>item(p,'Diritti ricevuti attribuiti '+euros(p.rightsCash))),
   ['Sono escluse le righe dell’estratto SIAE non riconciliate con un bonifico.','Le quote vengono inserite manualmente da Ritorno dei progetti.'],
   [{label:'Diritti attribuiti',value:euros(stats.rightsAllocated)},{label:'Da attribuire',value:euros(stats.rightsNotAllocated)}]);
 }
 if(/(senza|fermi|fermo|fattur|fee|economica|in sospeso|non fatturat)/.test(q) && /(senza|fermi|fermo|non|sospeso|base|fee|progett)/.test(q)){
  return A('Progetti da verificare economicamente',
   r.reasons.noBasis+' progetti non hanno fatturato né diritti già attribuiti. Di questi, '+r.reasons.feePromisedNotBilled+' riportano una fee positiva ma nessuna fattura attribuita.',
   r.oldUnbilled.slice(0,10).map(p=>item(p,'Fee dichiarata '+euros(num(p.raw.FEE))+' · sessione '+p.start+' · '+p.age+' giorni')),
   ['FEE=0 o vuoto non equivale a progetto in perdita.','I progetti che non hanno date o collegamenti potrebbero non comparire nell’elenco prioritario.'],
   [{label:'Senza entrate attribuite',value:r.reasons.noBasis},{label:'Fee positiva senza fattura',value:r.reasons.feePromisedNotBilled}]);
 }
 if(/(mancan|completezz|qualita|affidabil|error|incoeren|verific)/.test(q)){
  return A('Qualità dei dati economici',
   'Le principali lacune sono date di sessione, collegamenti fatture-progetti e accrediti privi di data registrata.',
   r.recommendations.filter(x=>x.count>0).map(x=>({label:x.title,detail:(x.unit==='EUR'?euros(x.count):x.count)+' · '+x.why,url:x.url})),
   r.gaps,
   [{label:'Progetti senza data sessione',value:r.reasons.noSession},{label:'Voci non riconciliate',value:r.reasons.unlinkedInvoiceLines},{label:'Pagamenti senza data bancaria',value:r.reasons.undatedPayments}]);
 }
 if(/(fattur|ricav|guadagn|incass|reddit|piu|miglior|ranking|classific)/.test(q)){
  return A('I progetti con maggior fatturato per voce',
   'Il fatturato gestionale delle voci registrate è '+euros(stats.invoiceTotal)+'. I primi progetti sono ordinati per compensi fatturati attribuiti, non per utile netto.',
   r.byBilled.slice(0,12).map(p=>item(p,'Fatturato '+euros(p.billed)+' · incassi datati '+euros(p.datedCash)+' · diritti '+euros(p.rightsCash))),
   ['La graduatoria non stima costi né ore lavorate.','Incassi, fatturato e royalties sono categorie distinte.'],
   [{label:'Fatturato per voce',value:euros(stats.invoiceTotal)},{label:'Voci senza progetto',value:stats.unallocatedInvoiceLines}]);
 }
 return A('Domanda non riconosciuta dalle regole',
 'Questa prima versione non usa un modello linguistico. Prova a chiedere: “quali progetti non hanno fatturato?”, “quali artisti concentrano i ricavi?”, “follow-up scaduti”, “quanto tempo al primo incasso?” oppure “quali dati mancano?”.',
 [],['Nessuna deduzione inventata: il motore risponde solo agli argomenti supportati.'],[]);
}
root.KYV_ANALYST_V241=Object.freeze({build,answer});
})(typeof window!=='undefined'?window:globalThis);
