/* KYV Project Returns v2.40: authenticated read + manual, audited allocations. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').trim();
const euro=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const n=v=>Math.round((Number(v)||0)*100);
const cap=10000,step=500;
let client=null,records=null,busy=false,selectedSource='all';
async function rows(table,fields,order){
 const first=await client.from(table).select(fields,{count:'exact'}).order(order,{ascending:false}).range(0,step-1);
 if(first.error)throw Error(table+': '+first.error.message);
 if(first.count===null||first.count>cap)throw Error('Lettura '+table+' incompleta o oltre '+cap+' righe.');
 const data=[...(first.data||[])];
 while(data.length<first.count){
  const q=await client.from(table).select(fields).order(order,{ascending:false}).range(data.length,Math.min(first.count-1,data.length+step-1));
  if(q.error||!q.data?.length)throw Error(table+': lettura incompleta. Modifiche bloccate.');
  data.push(...q.data);
 }
 if(data.length!==first.count)throw Error(table+': numero righe non verificabile.');
 return data;
}
async function readAll(){
 const [projects,invoices,payments,paymentReversals,rights,allocations,allocationReversals,invoiceSplits]=await Promise.all([
  rows('PROGETTI','ID,TITOLO,ARTISTA,STATO,SVILUPPO,FEE,Data_Sessione,Data_Pubblicazione,IDFT','ID'),
  rows('FATTURE','ID_FT,ID_PROGETTO,XML_SHA256,PrezzoUnitario,PrezzoTotale,Data,PAGATA','ID_FT'),
  rows('FATTURE_INCASSI','ID_INCASSO,ID_FT,Data,Importo','ID_INCASSO'),
  rows('FATTURE_INCASSI_STORNI','ID_STORNO,ID_INCASSO','ID_STORNO'),
  rows('KYV_LIQUIDAZIONI_DIRITTI','ID_LIQUIDAZIONE,Ente,ImportoNetto,DataAccredito,Riferimento','ID_LIQUIDAZIONE'),
  rows('KYV_ATTRIBUZIONI_DIRITTI','ID_ATTRIBUZIONE,ID_LIQUIDAZIONE,ID_PROGETTO,Importo,Note,created_at','ID_ATTRIBUZIONE'),
  rows('KYV_ATTRIBUZIONI_DIRITTI_STORNI','ID_STORNO,ID_ATTRIBUZIONE,Motivo,created_at','ID_STORNO')
 ]);
 records={projects,invoices,payments,paymentReversals,rights,allocations,allocationReversals,invoiceSplits};
}
function status(message,error=false){const el=$('returns-status');el.textContent=message;el.className='status'+(error?' error':'');}
async function load(){
 if(busy)return;busy=true;
 try{
  client=client||window.KYV?.createSupabaseClient?.();
  if(!client)throw Error('Accesso autenticato non disponibile');
  status('Caricamento di progetti, fatture e bonifici…');
  await readAll();render();status('Dati aggiornati. Nessuna attribuzione automatica eseguita.');
 }catch(e){records=null;status('Impossibile leggere tutti i dati: '+e.message,true);$('returns-content').hidden=true;}
 finally{busy=false;}
}
function liquidations(){
 const d=records;
 const reversal=new Set(d.allocationReversals.map(x=>text(x.ID_ATTRIBUZIONE)));
 const sums=new Map();
 for(const a of d.allocations){
  if(reversal.has(text(a.ID_ATTRIBUZIONE)))continue;
  const key=text(a.ID_LIQUIDAZIONE);
  sums.set(key,(sums.get(key)||0)+n(a.Importo));
 }
 return d.rights.map(l=>({...l,available:Math.max(0,n(l.ImportoNetto)-(sums.get(text(l.ID_LIQUIDAZIONE))||0))/100})); 
}
function render(){
 if(!records)return;
 $('returns-content').hidden=false;
 const d=records,analysis=window.KYV_PROJECT_RETURNS_V240.analyze(d);
 const stats=analysis.stats;
 const cards=[
  ['Compensi fatturati per voce',euro(stats.invoiceTotal),'Fatture, non royalties'],
  ['Diritti attribuiti ai progetti',euro(stats.rightsAllocated),'Solo bonifici ricevuti e attribuiti'],
  ['Diritti non ancora attribuiti',euro(stats.rightsNotAllocated),'Da collegare manualmente ai brani'],
  ['Progetti senza ritorno documentato',String(stats.noKnownEconomicBasis),'Non significa valore economico zero'],
  ['Voci senza progetto',String(stats.unallocatedInvoiceLines),'Nessun abbinamento inventato'],
  ['Tempo medio al primo accredito',stats.meanDaysToFirstCash===null?'Non calcolabile':stats.meanDaysToFirstCash+' giorni','Campione: '+stats.withReturnDate+' / '+stats.projects+' progetti']
 ];
 $('returns-stats').innerHTML=cards.map(([label,value,sub])=>'<article class="tile"><small>'+H(label)+'</small><strong>'+H(value)+'</strong><small>'+H(sub)+'</small></article>').join('');
 const liqs=liquidations();
 const oldLiq=$('alloc-liquidation').value,oldProject=$('alloc-project').value;
 $('alloc-liquidation').innerHTML='<option value="">Seleziona il bonifico</option>'+liqs.filter(x=>x.available>0).map(x=>'<option value="'+x.ID_LIQUIDAZIONE+'">'+H(x.Ente+' · '+x.DataAccredito+' · residuo '+euro(x.available))+'</option>').join('');
 if([...$('alloc-liquidation').options].some(o=>o.value===oldLiq))$('alloc-liquidation').value=oldLiq;
 $('alloc-project').innerHTML='<option value="">Seleziona il progetto</option>'+d.projects.slice().sort((a,b)=>text(a.TITOLO).localeCompare(text(b.TITOLO),'it')).map(x=>'<option value="'+x.ID+'">'+H((x.TITOLO||'Senza titolo')+' · '+(x.ARTISTA||'—')+' (#'+x.ID+')')+'</option>').join('');
 if([...$('alloc-project').options].some(o=>o.value===oldProject))$('alloc-project').value=oldProject;
 const reversal=new Set(d.allocationReversals.map(x=>text(x.ID_ATTRIBUZIONE)));
 const allocations=d.allocations.slice().reverse();
 $('alloc-history').innerHTML=allocations.slice(0,150).map(a=>{
  const liq=d.rights.find(l=>text(l.ID_LIQUIDAZIONE)===text(a.ID_LIQUIDAZIONE));
  const pr=d.projects.find(p=>text(p.ID)===text(a.ID_PROGETTO));
  const storno=d.allocationReversals.find(s=>text(s.ID_ATTRIBUZIONE)===text(a.ID_ATTRIBUZIONE));
  return '<tr><td>#'+H(a.ID_ATTRIBUZIONE)+'</td><td>'+H(liq?.Ente||'—')+'</td><td>'+H((pr?.TITOLO||'Progetto #'+a.ID_PROGETTO))+'</td><td>'+H(euro(a.Importo))+'</td><td>'+ (storno?'<span class="warning">Stornato: '+H(storno.Motivo)+'</span>':'<button type="button" data-reverse-allocation="'+H(a.ID_ATTRIBUZIONE)+'">Storna</button>')+'</td></tr>';
 }).join('')||'<tr><td colspan="5">Nessuna attribuzione registrata</td></tr>';
 $('returns-note').textContent=liqs.length?liqs.filter(x=>x.available>0).length+' liquidazioni con importo attribuibile.':'Non ci sono ancora bonifici SIAE/IMAIE registrati. Inseriscili dalla sezione Liquidazioni.';
 const needle=text($('project-search').value).toLowerCase();
 const only=$('project-filter').value;
 const filtered=analysis.projects.filter(p=>{
  const yes=!needle||(p.title+' '+p.artist+' '+p.ID).toLowerCase().includes(needle);
  return yes&&(only==='all'||only==='without'&&p.billed===0&&p.rightsCash===0||only==='returned'&&p.returnDays!==null||only==='undated'&&p.undatedLegacy>0);
 });
 $('project-count').textContent=filtered.length+' progetti visualizzati su '+analysis.projects.length;
 $('returns-project-rows').innerHTML=filtered.map(p=>{
  const times=p.returnDays===null?'—':p.returnDays+' giorni';
  const details=p.start?'Sessione '+p.start:'Sessione non datata';
  return '<tr><td><a href="scheda_progetto.html?id='+encodeURIComponent(p.ID)+'">'+H(p.title)+'</a><small>'+H(p.artist)+' · #'+H(p.ID)+'</small></td>'+
  '<td>'+H(euro(p.billed))+'</td><td>'+H(euro(p.datedCash))+'</td><td>'+H(euro(p.undatedLegacy))+'</td><td>'+H(euro(p.rightsCash))+'</td>'+
  '<td>'+H(times)+'<small>'+H(details)+'</small></td></tr>';
 }).join('')||'<tr><td colspan="6">Nessun progetto corrispondente</td></tr>';
 $('returns-issues').textContent=stats.ambiguousInvoiceLines+' voci con più riferimenti storici possibili; '+stats.unusableAttributions+' attribuzioni non riconoscibili. Nessun dato è stato modificato automaticamente.';
}
async function guarded(fn){
 if(busy||!records)return;busy=true;
 try{await fn();await readAll();render();status('Operazione registrata. Dati ricalcolati.');}
 catch(e){status('Operazione non completata: '+e.message,true);}
 finally{busy=false;}
}
async function saveAllocation(){
 const liq=text($('alloc-liquidation').value),proj=text($('alloc-project').value),raw=text($('alloc-amount').value);
 const euros=Number(raw),num=n(euros);
 const source=liquidations().find(l=>text(l.ID_LIQUIDAZIONE)===liq);
 if(!source||!records.projects.some(p=>text(p.ID)===proj))throw Error('Seleziona un bonifico con residuo e un progetto valido.');
 if(!/^\d+(?:\.\d{1,2})?$/.test(raw)||!Number.isFinite(euros)||num<=0||num>n(source.available))throw Error('Importo non valido o oltre il saldo attribuibile.');
 const note=text($('alloc-note').value);
 if(note.length>500)throw Error('Nota troppo lunga.');
 if(!window.confirm('Attribuire '+euro(euros)+' del bonifico '+source.Ente+' ricevuto il '+source.DataAccredito+' al progetto selezionato? Non viene creata alcuna nuova entrata bancaria.'))return;
 const res=await client.from('KYV_ATTRIBUZIONI_DIRITTI').insert({ID_LIQUIDAZIONE:Number(liq),ID_PROGETTO:Number(proj),Importo:num/100,Note:note||null}).select('ID_ATTRIBUZIONE');
 if(res.error||res.data?.length!==1)throw Error(res.error?.message||'Attribuzione non confermata.');
 $('alloc-amount').value='';$('alloc-note').value='';
}
async function reverseAllocation(id){
 const a=records.allocations.find(a=>text(a.ID_ATTRIBUZIONE)===text(id));
 if(!a||records.allocationReversals.some(s=>text(s.ID_ATTRIBUZIONE)===text(id)))throw Error('Attribuzione non disponibile oppure già stornata.');
 const prompt=window.prompt('Motivo dello storno (10–500 caratteri):','');
 if(prompt===null)return;
 const reason=text(prompt);
 if(reason.length<10||reason.length>500)throw Error('Motivo da 10 a 500 caratteri obbligatorio.');
 const existing=await client.from('KYV_ATTRIBUZIONI_DIRITTI_STORNI').select('ID_STORNO').eq('ID_ATTRIBUZIONE',Number(id)).limit(1);
 if(existing.error||existing.data?.length)throw Error(existing.error?.message||'Attribuzione già stornata.');
 if(!window.confirm('Stornare definitivamente l’attribuzione di '+euro(a.Importo)+'? Il bonifico originale rimane invariato. Motivo: '+reason))return;
 const x=await client.from('KYV_ATTRIBUZIONI_DIRITTI_STORNI').insert({ID_ATTRIBUZIONE:Number(id),Motivo:reason}).select('ID_STORNO');
 if(x.error||x.data?.length!==1)throw Error(x.error?.message||'Storno non registrato');
}
function boot(){
 $('returns-refresh').addEventListener('click',load);
 $('alloc-form').addEventListener('submit',e=>{e.preventDefault();guarded(saveAllocation);});
 $('alloc-history').addEventListener('click',e=>{
  const button=e.target.closest('button[data-reverse-allocation]');
  if(button)guarded(()=>reverseAllocation(button.dataset.reverseAllocation));
 });
 $('project-search').addEventListener('input',render);
 $('project-filter').addEventListener('change',render);
 load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
