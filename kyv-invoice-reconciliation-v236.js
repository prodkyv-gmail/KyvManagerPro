/* KYVManagerPro v2.36 — riconciliazione fatture e registro incassi.
   Legacy PAGATA has precedence only until the first registered payment movement.
   No automatic project matching, date inference, or retroactive changes. */
(function(){
'use strict';
const MAX_ROWS=10000,PAGE_SIZE=500;
const state={client:null,ready:false,busy:false,expanded:false,invoices:[],projects:[],payments:[],reversals:[],onChanged:null,loaded:false,error:null};
const t=v=>String(v??'').trim();
const H=v=>window.KYV?.safeHtml?window.KYV.safeHtml(v):t(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>window.KYV?.parseNumber?window.KYV.parseNumber(v):Number(t(v).replace(/\./g,'').replace(',','.'))||0;
const euro=v=>window.KYV?.formatEuro?window.KYV.formatEuro(v):new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
const isPaid=v=>window.KYV?.isPaid?window.KYV.isPaid(v):/^(si|sì|yes|true|1|pagat|incassat)/i.test(t(v));
const cents=v=>Math.round((Number(v)||0)*100);
const dateOK=v=>/^\d{4}-\d{2}-\d{2}$/.test(t(v))&&!Number.isNaN(new Date(t(v)+'T12:00:00Z').getTime());
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Rome'});
const invoiceAmount=inv=>Math.max(0,cents(money(inv?.ImportoTotaleDocumento??inv?.PrezzoTotale??inv?.PrezzoUnitario??inv?.ImportoPagamento??0)));
function summarize(invoice,payments,reversals=[]){
  const total=invoiceAmount(invoice),movements=(payments||[]).filter(x=>t(x.ID_FT)===t(invoice.ID_FT));
  const reversed=new Set((reversals||[]).map(x=>t(x.ID_INCASSO)));
  const active=movements.filter(p=>!reversed.has(t(p.ID_INCASSO)));
  const recorded=active.reduce((s,p)=>s+cents(Number(p.Importo)),0);
  // Even if every movement was reversed, never fall back to a stale legacy PAGATA='SI'.
  const legacyPaid=!movements.length&&isPaid(invoice.PAGATA);
  const received=legacyPaid?total:Math.min(total,Math.max(0,recorded));
  const remaining=Math.max(0,total-received);
  const kind=remaining===0?'paid':received>0?'partial':'open';
  return {total:total/100,received:received/100,remaining:remaining/100,kind,
    movementCount:movements.length,activeMovementCount:active.length,reversedMovementCount:movements.length-active.length,legacyPaid,overpaid:recorded>total,date:invoice.DataScadenzaPagamento||null,
    overdue:remaining>0&&dateOK(invoice.DataScadenzaPagamento)&&invoice.DataScadenzaPagamento<today()};
}
function paymentState(invoice){
  return state.loaded? summarize(invoice,state.payments,state.reversals):null;
}
function legacyProjectIds(invoice,projects){
  return (projects||[]).filter(p=>/^\d+$/.test(t(p.IDFT))&&t(Number(p.IDFT))===t(Number(invoice.ID_FT))).map(p=>t(p.ID));
}
function projectLinked(invoice,projects){
  if(t(invoice.ID_PROGETTO))return t(invoice.ID_PROGETTO);
  const ids=legacyProjectIds(invoice,projects);
  return ids.length===1?ids[0]:null;
}
function closed(p){
  const status=t(p.STATO)+' '+t(p.SVILUPPO);
  return /\b(?:uscita|pubblicat[oa]|completat[oa]|chius[oa]|finit[oa])\b/i.test(status)
    && !/\b(?:non\s+completat[oa]|non\s+pubblicat[oa]|non\s+uscita)\b/i.test(status);
}
function potentialUnbilled(projects,invoices){
  const used=new Set((invoices||[]).map(f=>projectLinked(f,projects)).filter(Boolean));
  return (projects||[]).filter(p=>closed(p)&&money(p.FEE)>0&&!used.has(t(p.ID)));
}
async function allRows(table,columns,orderBy){
  const first=await state.client.from(table).select(columns,{count:'exact'}).order(orderBy,{ascending:false}).range(0,PAGE_SIZE-1);
  if(first.error)throw Error('Lettura '+table+': '+first.error.message);
  if(first.count===null||first.count>MAX_ROWS)throw Error('Impossibile verificare integralmente '+table+' (limite '+MAX_ROWS+').');
  const data=[...(first.data||[])];
  while(data.length<first.count){
    const start=data.length,more=await state.client.from(table).select(columns).order(orderBy,{ascending:false}).range(start,Math.min(first.count-1,start+PAGE_SIZE-1));
    if(more.error||!(more.data||[]).length)throw Error('Lettura '+table+' incompleta: modifiche bloccate.');
    data.push(...more.data);
  }
  if(data.length!==first.count)throw Error('Lettura '+table+' incompleta: modifiche bloccate.');
  return data;
}
async function readAll(){
  const [invoices,projects,payments,reversals]=await Promise.all([
    allRows('FATTURE','ID_FT,Numero,Numero_Originale,Data,Denominazione,Descrizione,ImportoTotaleDocumento,PrezzoTotale,PrezzoUnitario,ImportoPagamento,PAGATA,ID_PROGETTO,DataScadenzaPagamento','ID_FT'),
    allRows('PROGETTI','ID,TITOLO,ARTISTA,STATO,SVILUPPO,FEE,IDFT','ID'),
    allRows('FATTURE_INCASSI','ID_INCASSO,ID_FT,Data,Importo,Note','ID_INCASSO'),
    allRows('FATTURE_INCASSI_STORNI','ID_STORNO,ID_INCASSO,Data,Motivo,created_at','ID_STORNO')
  ]);
  state.invoices=invoices;state.projects=projects;state.payments=payments;state.reversals=reversals;
  state.loaded=true;state.error=null;
}
function notice(message,isError=false){const el=document.getElementById('kyv-recon-notice');if(el){el.textContent=message;el.hidden=!message;el.dataset.error=isError?'1':'0';}}
function optionProjects(selected){
  const list=['<option value="">Nessun progetto</option>'];
  state.projects.forEach(p=>{list.push('<option value="'+H(p.ID)+'" '+(t(p.ID)===t(selected)?'selected':'')+'>'+H((p.TITOLO||'Progetto')+' · '+(p.ARTISTA||'')+' (#'+p.ID+')')+'</option>');});
  return list.join('');
}
function invoiceTitle(f){return (t(f.Numero_Originale)||('N° '+t(f.Numero)||'#'+t(f.ID_FT)))+' · '+t(f.Denominazione||'Cliente');}
function render(){
  const root=document.getElementById('kyv-recon-panel');
  if(!root)return;
  const openBtn=document.getElementById('kyv-recon-open');
  if(!state.loaded){root.innerHTML='<p class="kyv-recon-help">'+H(state.error||'Caricamento dati…')+'</p>';if(openBtn)openBtn.textContent='Riconciliazione e incassi';return;}
  const unlinked=state.invoices.filter(f=>!t(f.ID_PROGETTO));
  const noLinks=unlinked.filter(f=>legacyProjectIds(f,state.projects).length===0);
  const legacy=unlinked.filter(f=>legacyProjectIds(f,state.projects).length>0);
  const review=potentialUnbilled(state.projects,state.invoices);
  const open=state.invoices.filter(f=>summarize(f,state.payments,state.reversals).remaining>0);
  const overdue=open.filter(f=>summarize(f,state.payments,state.reversals).overdue);
  const overdueLabel=overdue.length?' · '+overdue.length+' scadute':'';
  if(openBtn)openBtn.textContent='Riconciliazione e incassi · '+unlinked.length+' senza link · '+open.length+' aperte'+overdueLabel;
  const head='<div class="kyv-recon-head"><div><h3>Riconciliazione e incassi</h3><p>Associazioni manuali · nessuna fattura attribuita automaticamente · le scadenze non vengono inventate.</p></div><button type="button" data-recon-reload>Ricarica dati</button></div>';
  const cards='<div class="kyv-recon-stats">'+[
    [unlinked.length,'Senza collegamento diretto'],[legacy.length,'Con riferimento storico da verificare'],
    [review.length,'Progetti usciti/chiusi con fee senza fattura riconciliata'],[open.length,'Fatture con saldo aperto'],[overdue.length,'Di cui scadute']
  ].map(([v,label])=>'<div><strong>'+v+'</strong><span>'+H(label)+'</span></div>').join('')+'</div>';
  const linkRows=noLinks.slice(0,80).map(f=>'<div class="kyv-recon-row"><div><strong>'+H(invoiceTitle(f))+'</strong><small>'+H(euro(invoiceAmount(f)/100))+' · fattura #'+H(f.ID_FT)+'</small></div><label>Progetto<select data-recon-link-select="'+H(f.ID_FT)+'">'+optionProjects('')+'</select></label><button type="button" data-recon-save-link="'+H(f.ID_FT)+'">Collega</button></div>').join('');
  const legacyRows=legacy.slice(0,20).map(f=>'<div class="kyv-recon-row"><span>'+H(invoiceTitle(f))+' · riferimento storico: '+H(legacyProjectIds(f,state.projects).join(', '))+'</span><a href="fatture.html#invoice-'+H(f.ID_FT)+'">Verifica nell’editor</a></div>').join('');
  const reviewRows=review.slice(0,40).map(p=>'<div class="kyv-recon-row"><div><strong>'+H((p.TITOLO||'Progetto')+' · '+(p.ARTISTA||'Artista'))+'</strong><small>Fee indicata '+H(euro(money(p.FEE)))+' · stato '+H(p.STATO||'—')+'</small></div><a href="scheda_progetto.html?id='+encodeURIComponent(p.ID)+'">Apri progetto</a></div>').join('');
  const payRows=open.slice(0,90).map(f=>{
    const s=summarize(f,state.payments,state.reversals);
    return '<div class="kyv-recon-row kyv-recon-payment"><div><strong>'+H(invoiceTitle(f))+'</strong><small>Totale '+H(euro(s.total))+' · già incassato '+H(euro(s.received))+' · <b>residuo '+H(euro(s.remaining))+'</b></small>'+
      (s.kind==='partial'?'<small class="kyv-recon-warning">Incassata parzialmente</small>':'')+
      (s.overdue?'<small class="kyv-recon-warning">Scaduta il '+H(s.date)+'</small>':'')+'</div>'+
      '<label>Scadenza<input type="date" data-recon-due="'+H(f.ID_FT)+'" value="'+H(f.DataScadenzaPagamento||'')+'"></label>'+
      '<button type="button" data-recon-save-due="'+H(f.ID_FT)+'">Salva scadenza</button>'+
      '<label>Nuovo incasso €<input type="number" min="0.01" step="0.01" max="'+s.remaining.toFixed(2)+'" placeholder="Importo" data-recon-pay-amount="'+H(f.ID_FT)+'"></label>'+
      '<label>Data incasso<input type="date" data-recon-pay-date="'+H(f.ID_FT)+'" value="'+today()+'"></label>'+
      '<button type="button" data-recon-save-pay="'+H(f.ID_FT)+'">Registra incasso</button></div>';
  }).join('');
  const reversedIds=new Set(state.reversals.map(x=>t(x.ID_INCASSO)));
  const history=state.payments.slice().sort((a,b)=>Number(b.ID_INCASSO)-Number(a.ID_INCASSO)).slice(0,150).map(p=>{
    const f=state.invoices.find(f=>t(f.ID_FT)===t(p.ID_FT));
    const reversal=state.reversals.find(x=>t(x.ID_INCASSO)===t(p.ID_INCASSO));
    return '<div class="kyv-recon-row"><div><strong>'+H(f?invoiceTitle(f):'Fattura #'+p.ID_FT)+' · '+H(euro(Number(p.Importo)))+'</strong>'+
      '<small>Movimento #'+H(p.ID_INCASSO)+' · '+H(p.Data)+'</small>'+
      (reversal?'<small class="kyv-recon-warning">Stornato il '+H(reversal.Data)+' · '+H(reversal.Motivo)+'</small>':'<small>Incasso registrato</small>')+
      '</div>'+(reversal?'':'<button type="button" data-recon-reverse="'+H(p.ID_INCASSO)+'">Storna incasso</button>')+'</div>';
  }).join('');
  const sections=[
    ['Senza progetto diretto',noLinks.length,linkRows||'<p class="kyv-recon-help">Nessuna fattura senza associazione o riferimento storico.</p>','Seleziona un progetto e premi Collega: non sono effettuati abbinamenti in base al solo numero di fattura.'],
    ['Riferimenti storici da verificare',legacy.length,legacyRows||'<p class="kyv-recon-help">Nessun riferimento storico pendente.</p>','Non modificati automaticamente: usa l’editor per i casi con relazione IDFT.'],
    ['Progetti con fee da verificare',review.length,reviewRows||'<p class="kyv-recon-help">Nessuna corrispondenza da controllare.</p>','Elenco di controllo, non un’affermazione che una fattura sia dovuta.'],
    ['Scadenze e nuovi incassi',open.length,payRows||'<p class="kyv-recon-help">Non risultano fatture con saldo aperto. Le fatture storiche già pagate sono preservate.</p>','Per correggere un movimento, stornalo dallo storico e registra quello corretto.'],
    ['Storico incassi e storni',state.payments.length,history||'<p class="kyv-recon-help">Nessun movimento registrato.</p>','Lo storno è integrale e definitivo; motivazione obbligatoria, il movimento originale resta visibile.']
  ];
  root.innerHTML=head+cards+'<div id="kyv-recon-notice" hidden role="status"></div>'+
    sections.map(([title,count,rows,help],i)=>'<details class="kyv-recon-section" '+(i===0?'open':'')+'><summary>'+H(title)+' <span>('+count+')</span></summary><p class="kyv-recon-help">'+H(help)+'</p><div class="kyv-recon-list">'+rows+'</div></details>').join('');
}
async function refresh(){
  if(state.busy)return;state.busy=true;
  try{await readAll();render();window.applyCorrelazioneFilters?.();window.KYV_ECONOMY_V6?.refresh?.();}
  catch(e){state.loaded=false;state.error='Lettura non riuscita: '+e.message;render();}
  finally{state.busy=false;}
}
async function guarded(fn){
  if(state.busy||!state.loaded)return;
  state.busy=true;
  try{await fn();await readAll();render();window.applyCorrelazioneFilters?.();window.KYV_ECONOMY_V6?.refresh?.();if(state.onChanged)await state.onChanged();}
  catch(e){notice('Operazione non completata: '+e.message,true);}
  finally{state.busy=false;}
}
function invoiceById(id){return state.invoices.find(x=>t(x.ID_FT)===t(id));}
async function linkInvoice(id,projectId){
  const invoice=invoiceById(id);
  if(!invoice||t(invoice.ID_PROGETTO))throw Error('La fattura risulta già collegata: aggiorna prima i dati.');
  if(legacyProjectIds(invoice,state.projects).length)throw Error('È presente un riferimento storico: verifica tramite editor.');
  if(!state.projects.some(p=>t(p.ID)===t(projectId)))throw Error('Seleziona un progetto valido.');
  if(!window.confirm('Collegare la fattura '+invoiceTitle(invoice)+' al progetto selezionato?'))return;
  const res=await state.client.from('FATTURE').update({ID_PROGETTO:Number(projectId)})
    .eq('ID_FT',id).is('ID_PROGETTO',null).select('ID_FT');
  if(res.error)throw Error(res.error.message);
  if(res.data?.length!==1)throw Error('Collegamento non eseguito: fattura modificata o permessi insufficienti.');
}
async function saveDue(id,date){
  const f=invoiceById(id);if(!f)throw Error('Fattura non disponibile.');
  if(date&&!dateOK(date))throw Error('Data di scadenza non valida.');
  if(!window.confirm(date?'Impostare la scadenza della fattura al '+date+'?':'Rimuovere la scadenza registrata?'))return;
  const res=await state.client.from('FATTURE').update({DataScadenzaPagamento:date||null})
    .eq('ID_FT',id).select('ID_FT');
  if(res.error||res.data?.length!==1)throw Error(res.error?.message||'Scadenza non salvata.');
}
async function savePayment(id,value,date){
  const f=invoiceById(id);if(!f)throw Error('Fattura non disponibile.');
  if(!dateOK(date))throw Error('Inserisci una data valida.');
  const str=t(value),amount=Number(str),amountCents=cents(amount);
  if(!/^\d+(?:\.\d{1,2})?$/.test(str)||!Number.isFinite(amount)||amountCents<=0)throw Error('Importo non valido: usa euro e massimo due decimali.');
  // Read fresh ledger before every financial write; never use a stale amount from the rendered page.
  const [invoiceRes,ledgerRes]=await Promise.all([
    state.client.from('FATTURE').select('ID_FT,ImportoTotaleDocumento,PrezzoTotale,PrezzoUnitario,ImportoPagamento,PAGATA').eq('ID_FT',id).single(),
    state.client.from('FATTURE_INCASSI').select('ID_INCASSO,ID_FT,Importo').eq('ID_FT',id).limit(10000)
  ]);
  if(invoiceRes.error||ledgerRes.error)throw Error(invoiceRes.error?.message||ledgerRes.error?.message||'Verifica incassi non riuscita.');
  const freshPayments=ledgerRes.data||[];
  const paymentIds=freshPayments.map(p=>p.ID_INCASSO);
  const reversalRes=paymentIds.length?await state.client.from('FATTURE_INCASSI_STORNI').select('ID_INCASSO').in('ID_INCASSO',paymentIds).limit(10000):{data:[],error:null};
  if(reversalRes.error)throw Error('Verifica storni non riuscita: '+reversalRes.error.message);
  const fresh=summarize(invoiceRes.data,freshPayments,reversalRes.data||[]);
  if(amountCents>cents(fresh.remaining))throw Error('Importo superiore al residuo '+euro(fresh.remaining)+'.');
  if(fresh.legacyPaid)throw Error('Fattura già indicata come pagata nello storico. Verifica prima lo stato manualmente.');
  if(!window.confirm('Registrare un incasso di '+euro(amount)+' del '+date+' per '+invoiceTitle(f)+'? La registrazione non può essere modificata direttamente.'))return;
  const res=await state.client.from('FATTURE_INCASSI').insert({ID_FT:Number(id),Data:date,Importo:amountCents/100}).select('ID_INCASSO');
  if(res.error||res.data?.length!==1)throw Error(res.error?.message||'Incasso non registrato.');
}
async function reversePayment(id){
  const movement=state.payments.find(p=>t(p.ID_INCASSO)===t(id));
  if(!movement)throw Error('Movimento non presente nello storico.');
  const reason=t(window.prompt('Motivo dello storno (da 10 a 500 caratteri):',''));
  if(reason.length<10||reason.length>500)throw Error('Inserisci un motivo da 10 a 500 caratteri.');
  // Fresh DB check; unique index prevents double reversal even between concurrent browsers.
  const [pay,existing]=await Promise.all([
    state.client.from('FATTURE_INCASSI').select('ID_INCASSO,ID_FT,Importo').eq('ID_INCASSO',id).single(),
    state.client.from('FATTURE_INCASSI_STORNI').select('ID_STORNO').eq('ID_INCASSO',id).limit(1)
  ]);
  if(pay.error||existing.error||!pay.data)throw Error(pay.error?.message||existing.error?.message||'Verifica storno non riuscita.');
  if(existing.data?.length)throw Error('Questo movimento è già stato stornato.');
  const inv=invoiceById(pay.data.ID_FT);
  if(!inv)throw Error('La fattura collegata non è visibile.');
  if(!window.confirm('STORNO DEFINITIVO: annullare l’incasso di '+euro(Number(pay.data.Importo))+' per '+invoiceTitle(inv)+'? Il movimento originale resterà nello storico. Motivo: '+reason))return;
  const insert=await state.client.from('FATTURE_INCASSI_STORNI').insert({ID_INCASSO:Number(id),Data:today(),Motivo:reason}).select('ID_STORNO');
  if(insert.error||insert.data?.length!==1)throw Error(insert.error?.message||'Storno non salvato.');
}
function bind(){
  const root=document.getElementById('kyv-recon-panel');
  root.addEventListener('click',event=>{
    const el=event.target.closest('button');if(!el)return;
    const id=el.dataset.reconSaveLink||el.dataset.reconSaveDue||el.dataset.reconSavePay||el.dataset.reconReverse;
    if(el.hasAttribute('data-recon-reload')){refresh();return;}
    if(!id)return;
    const find=(prefix)=>root.querySelector('['+prefix+'="'+id+'"]');
    if(el.dataset.reconSaveLink)guarded(()=>linkInvoice(id,find('data-recon-link-select')?.value));
    if(el.dataset.reconSaveDue)guarded(()=>saveDue(id,find('data-recon-due')?.value));
    if(el.dataset.reconSavePay)guarded(()=>savePayment(id,find('data-recon-pay-amount')?.value,find('data-recon-pay-date')?.value));
    if(el.dataset.reconReverse)guarded(()=>reversePayment(id));
  });
}
function boot(opts){
  if(state.ready)return;
  const manual=document.getElementById('kyv-manual-invoice-link'),parent=manual?.parentElement,anchor=document.getElementById('kyv-aruba-open');
  if(!opts?.client||!manual||!parent||!anchor)return;
  state.ready=true;state.client=opts.client;state.onChanged=opts.onChanged;
  const trigger=document.createElement('button');trigger.id='kyv-recon-open';trigger.type='button';trigger.textContent='Riconciliazione e incassi';
  trigger.className='kyv-primary-action whitespace-nowrap';anchor.after(trigger);
  const root=document.createElement('section');root.id='kyv-recon-panel';root.hidden=true;manual.after(root);
  const style=document.createElement('style');style.textContent=
    '#kyv-recon-panel{padding:18px;border-radius:15px;border:1px solid #334155;background:#151923;color:#f8fafc}'+
    '#kyv-recon-panel[hidden],#kyv-recon-notice[hidden]{display:none!important}'+
    '.kyv-recon-head{display:flex;align-items:start;justify-content:space-between;gap:12px;flex-wrap:wrap}'+
    '.kyv-recon-head h3{font-weight:900;font-size:20px}.kyv-recon-head p,.kyv-recon-help{color:#cbd5e1;font-size:13px;margin:8px 0}'+
    '#kyv-recon-panel button{background:#312e81;border:1px solid #818cf8;padding:8px 12px;border-radius:8px;color:white;font-weight:700}'+
    '#kyv-recon-panel select,#kyv-recon-panel input{background:#0f172a;border:1px solid #64748b;color:white;border-radius:7px;padding:7px;font-size:14px;max-width:240px}'+
    '#kyv-recon-panel label{display:flex;flex-direction:column;gap:5px;color:#cbd5e1;font-size:12px}'+
    '.kyv-recon-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:16px 0}'+
    '.kyv-recon-stats>div{background:#0f172a;border:1px solid #334155;border-radius:9px;padding:11px}'+
    '.kyv-recon-stats strong{display:block;font-size:22px;color:#c7d2fe}.kyv-recon-stats span{display:block;color:#cbd5e1;font-size:11px}'+
    '.kyv-recon-section{border-top:1px solid #334155;margin-top:12px;padding:12px 0}'+
    '.kyv-recon-section summary{cursor:pointer;font-size:15px;font-weight:850}'+
    '.kyv-recon-section summary span{color:#a5b4fc}'+
    '.kyv-recon-list{max-height:460px;overflow:auto}'+
    '.kyv-recon-row{border-bottom:1px solid #334155;padding:11px 0;display:flex;align-items:center;gap:13px;flex-wrap:wrap}'+
    '.kyv-recon-row>div:first-child{flex:1;min-width:180px}.kyv-recon-row strong{font-size:13px}.kyv-recon-row small{display:block;color:#cbd5e1;margin:4px 0}'+
    '.kyv-recon-row a{color:#c7d2fe;text-decoration:underline}.kyv-recon-warning{color:#fca5a5!important}'+
    '#kyv-recon-notice{padding:10px;background:#064e3b;border-radius:7px;font-size:13px}'+
    '#kyv-recon-notice[data-error="1"]{background:#7f1d1d}';
  document.head.appendChild(style);
  bind();
  trigger.addEventListener('click',()=>{root.hidden=!root.hidden;if(!root.hidden)root.scrollIntoView({behavior:'smooth',block:'start'});});
  refresh();
}
window.KYV_COLLECTIONS_V236=Object.freeze({boot,refresh,paymentState,summarize,legacyProjectIds,projectLinked,closed,potentialUnbilled});
})();
