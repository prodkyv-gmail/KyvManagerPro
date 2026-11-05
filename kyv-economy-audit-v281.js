/* KYVManagerPro v2.81 — Read-only reconciliation quality checks for KYV Analyst.
   No data writes, speculative joins, cost estimates, or raw SIAE-statement cash assumptions. */
(function(root){'use strict';
 const t=x=>String(x??'').trim();
 const invoiceLine=root.KYV_INVOICE_LINE;
 const sum=(a,b)=>a+b;
 const cents=x=>{const n=invoiceLine?.parse(x);return n===null||!Number.isFinite(n)?null:Math.round(n*100)};
 const positive=x=>Math.max(0,cents(x)||0);
 const date=x=>/^\d{4}-\d{2}-\d{2}$/.test(t(x))&&!Number.isNaN(Date.parse(t(x)+'T12:00:00Z'));
 const euro=x=>(Number(x)||0)/100;
 const sortIssues=(a,b)=>a.severity-b.severity||a.label.localeCompare(b.label,'it');
 const issue=(type,label,detail,url=null,severity=2)=>({type,label,detail,url,severity});
 function analyze(raw={},report={}){
  if(!invoiceLine?.cents||!invoiceLine?.parse)throw Error('Importi unitari non disponibili');
  const projects=raw.projects||[],invoices=raw.invoices||[],payments=raw.payments||[],reversals=raw.paymentReversals||[];
  const rights=raw.rights||[],allocations=raw.allocations||[],allocationReversals=raw.allocationReversals||[],invoiceSplits=raw.invoiceSplits||[];
  const ids=new Set(projects.map(p=>t(p.ID))),byInvoice=new Map(invoices.map(f=>[t(f.ID_FT),f]));
  const invoiceIds=new Set(byInvoice.keys()),splitByInvoice=new Map();
  for(const s of invoiceSplits){const key=t(s.id_ft);const arr=splitByInvoice.get(key)||[];arr.push(s);splitByInvoice.set(key,arr);}
  let splitMismatch=0,splitUnknownProject=0,splitUnknownInvoice=0,invoiceMissingUnit=0,overpayments=0,paymentMissingDate=0,paymentUnknownInvoice=0;
  let datedInvoiceCashCents=0,undatedInvoiceMovementsCents=0,activePaymentCount=0,legacyPaidUndatedCount=0;
  const notices=[];
  for(const f of invoices){
   const key=t(f.ID_FT),line=invoiceLine.info(f);
   if(!line.valid)invoiceMissingUnit++;
   const shares=splitByInvoice.get(key)||[];
   if(shares.length){
    const stated=shares.reduce((s,x)=>s+positive(x.prezzo_unitario),0);
    if(Math.abs(stated-invoiceLine.cents(f))>1){
     splitMismatch++;
     notices.push(issue('split-mismatch','Ripartizione fattura #'+key,'Importi delle quote '+euro(stated).toFixed(2)+' €; valore unitario della voce '+euro(invoiceLine.cents(f)).toFixed(2)+' €. Verifica la ripartizione, senza correggere automaticamente.','fatture.html',1));
    }
   }
  }
  for(const s of invoiceSplits){
   if(!invoiceIds.has(t(s.id_ft)))splitUnknownInvoice++;
   if(!ids.has(t(s.id_progetto)))splitUnknownProject++;
  }
  const reversed=new Set(reversals.map(x=>t(x.ID_INCASSO)));
  const movements=new Map();
  for(const p of payments){
   if(reversed.has(t(p.ID_INCASSO)))continue;
   const invoiceId=t(p.ID_FT);
   if(!invoiceIds.has(invoiceId)){paymentUnknownInvoice++;continue;}
   const arr=movements.get(invoiceId)||[];arr.push(p);movements.set(invoiceId,arr);
  }
  for(const f of invoices){
   const invoiceId=t(f.ID_FT),all=movements.get(invoiceId)||[];
   const line=invoiceLine.cents(f),rawTotal=all.reduce((s,p)=>s+positive(p.Importo),0);
   if(rawTotal>line+1){
    overpayments++;
    notices.push(issue('payment-excess','Incassi oltre la voce #'+invoiceId,'Somma dei movimenti attivi '+euro(rawTotal).toFixed(2)+' € rispetto all’importo unitario '+euro(line).toFixed(2)+' €. Verifica eventuali duplicazioni o acconti.','fatture.html',1));
   }
   // Cash cannot exceed the source line amount. No date is fabricated.
   let remaining=line;
   for(const p of all){
    const amount=Math.min(remaining,positive(p.Importo));remaining-=amount;
    activePaymentCount++;
    if(date(p.Data))datedInvoiceCashCents+=amount;
    else {paymentMissingDate++;undatedInvoiceMovementsCents+=amount;}
   }
   if(!all.length&&!payments.some(x=>t(x.ID_FT)===invoiceId)&&/^(si|sì|yes|true|1|pagat|incassat)/i.test(t(f.PAGATA)))legacyPaidUndatedCount++;
  }
  const rightById=new Map(rights.map(x=>[t(x.ID_LIQUIDAZIONE),x]));
  const reversedAllocations=new Set(allocationReversals.map(x=>t(x.ID_ATTRIBUZIONE)));
  const rightsCents={SIAE:0,IMAIE:0},attributedByRight=new Map(),totalByRight=new Map();
  let rightsMissingDate=0,rightsWithoutDateCents=0,rightsUnknownProject=0,rightsUnknownPayment=0,rightsOverallocated=0,rightsCreditedCount=0;
  const credited=new Set();
  for(const right of rights){
   const id=t(right.ID_LIQUIDAZIONE),type=t(right.Ente).toUpperCase(),n=positive(right.ImportoNetto);
   if(!['SIAE','NUOVO IMAIE'].includes(type))continue;
   if(!date(right.DataAccredito)){
    if(n>0){rightsMissingDate++;rightsWithoutDateCents+=n;}
    continue;
   }
   credited.add(id);totalByRight.set(id,n);
   rightsCents[type==='SIAE'?'SIAE':'IMAIE']+=n;
   rightsCreditedCount++;
  }
  for(const a of allocations){
   if(reversedAllocations.has(t(a.ID_ATTRIBUZIONE)))continue;
   const key=t(a.ID_LIQUIDAZIONE),right=rightById.get(key);
   if(!right){rightsUnknownPayment++;continue;}
   if(!ids.has(t(a.ID_PROGETTO))){rightsUnknownProject++;continue;}
   // Only dated SIAE / NUOVO IMAIE liquidation records may support actual received money.
   if(!credited.has(key))continue;
   attributedByRight.set(key,(attributedByRight.get(key)||0)+positive(a.Importo));
  }
  let creditedUnallocated=0,creditedAttributed=0;
  for(const [key,total] of totalByRight){
   const allocated=attributedByRight.get(key)||0;
   if(allocated>total+1){
    rightsOverallocated++;
    notices.push(issue('rights-excess','Quote diritti oltre liquidazione #'+key,'Quote attive maggiori del netto accreditato: controlla gli storni e gli importi.','kyv_liquidazioni.html',1));
   }
   creditedAttributed+=Math.min(total,allocated);
   creditedUnallocated+=Math.max(0,total-allocated);
  }
  const stats=report?.results?.stats||{};
  if(splitUnknownInvoice)notices.push(issue('orphan-split','Ripartizioni senza fattura',splitUnknownInvoice+' quote riferite a voci fattura non presenti nella lettura.','fatture.html',1));
  if(splitUnknownProject)notices.push(issue('orphan-split-project','Ripartizioni verso progetti non disponibili',splitUnknownProject+' quote con ID progetto non trovato.','fatture.html',1));
  if(paymentMissingDate)notices.push(issue('payment-undated','Movimenti incasso senza data',paymentMissingDate+' movimenti attivi senza data bancaria verificabile; non utilizzabili per l’andamento mensile.','fatture.html',2));
  if(paymentUnknownInvoice)notices.push(issue('payment-orphan','Incassi senza fattura',paymentUnknownInvoice+' movimenti attivi con ID fattura non disponibile.','fatture.html',1));
  if(rightsMissingDate)notices.push(issue('rights-undated','Liquidazioni senza data accredito',rightsMissingDate+' liquidazioni SIAE/IMAIE con importo ma senza data: NON conteggiate come bonifici ricevuti.','kyv_liquidazioni.html',2));
  if(rightsUnknownPayment||rightsUnknownProject)notices.push(issue('rights-orphan','Attribuzioni diritti da verificare',(rightsUnknownPayment+rightsUnknownProject)+' attribuzioni attive senza liquidazione o progetto valido.','kyv_liquidazioni.html',1));
  if(invoiceMissingUnit)notices.push(issue('invoice-unit-missing','Voci fattura senza importo unitario',invoiceMissingUnit+' voci senza PrezzoUnitario valido. Non utilizzare il totale documento ripetuto come sostituto.','fatture.html',2));
  if(Number(stats.unallocatedInvoiceLines)>0)notices.push(issue('invoice-unlinked','Voci fattura non attribuite',stats.unallocatedInvoiceLines+' voci non assegnabili univocamente a un progetto.','fatture.html',2));
  const unbilled=Array.isArray(report.feePromisedNotBilled)?report.feePromisedNotBilled.length:0;
  if(unbilled)notices.push(issue('fee-advisory','Fee positive senza fattura',unbilled+' progetti con fee registrata ma non attribuita a una fattura: verificare l’accordo, NON sono automaticamente crediti esigibili.','progetti.html',3));
  notices.sort(sortIssues);
  return Object.freeze({
   invoice:{lines:invoices.length,registered:typeof stats.invoiceTotal==='number'?stats.invoiceTotal:invoices.reduce((s,x)=>s+invoiceLine.cents(x),0)/100,
    unlinked:Number(stats.unallocatedInvoiceLines)||0,splitMismatch,splitUnknownProject,splitUnknownInvoice,missingUnit:invoiceMissingUnit},
   cash:{dated:euro(datedInvoiceCashCents),undatedMovement:euro(undatedInvoiceMovementsCents),
    activePayments:activePaymentCount,withoutDate:paymentMissingDate,overpayments,unknownInvoice:paymentUnknownInvoice,
    legacyPaidUndated:legacyPaidUndatedCount},
   rights:{SIAE:euro(rightsCents.SIAE),IMAIE:euro(rightsCents.IMAIE),credited:euro(rightsCents.SIAE+rightsCents.IMAIE),
    attributed:euro(creditedAttributed),unallocated:euro(creditedUnallocated),creditedCount:rightsCreditedCount,
    undatedCount:rightsMissingDate,undatedAmount:euro(rightsWithoutDateCents),overallocated:rightsOverallocated,
    orphanAttributions:rightsUnknownPayment+rightsUnknownProject},
   fee:{positiveUnbilled:unbilled,zero:projects.filter(x=>invoiceLine.parse(x.FEE)===0).length},
   issues:notices,uniqueTypes:new Set(notices.map(x=>x.type)).size,
   caveats:['Non sommare fatturato, incassi e diritti: i primi sono competenza, gli altri movimenti di denaro distinti.',
    'Le righe dell’ESTRATTO SIAE non sono bonifici: qui vengono considerate solo liquidazioni con DataAccredito.',
    'PAGATA=SI senza movimento non documenta la data bancaria e non alimenta le serie mensili.',
    'FEE=0 è un possibile progetto creativo non piazzato, non un insoluto.',
    'Senza costi attribuiti ai singoli progetti, un utile netto o margine per brano non è calcolabile.']
  });
 }
 root.KYV_ECONOMY_AUDIT_V281=Object.freeze({analyze});
})(typeof window!=='undefined'?window:globalThis);
