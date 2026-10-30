/* KYVManagerPro v2.40 — project cash return: verified dates, nonduplicated amounts.
 * No speculative matches by title/artist, invoice or royalty statement.
 */
(function(root){
'use strict';
const text=v=>String(v??'').trim(),id=v=>text(v);
const day=d=>/^\d{4}-\d{2}-\d{2}$/.test(text(d))&&!isNaN(Date.parse(d+'T12:00:00Z'))?text(d):null;
const money=v=>{
 if(typeof v==='number')return Number.isFinite(v)?v:0;
 let s=text(v).replace(/[^\d.,-]/g,'');if(!s)return 0;
 const c=s.lastIndexOf(','),p=s.lastIndexOf('.');
 if(c>p)s=s.replace(/\./g,'').replace(',','.');
 else if(p>c&&c>=0)s=s.replace(/,/g,'');
 const n=Number(s);return Number.isFinite(n)?n:0;
};
const cents=v=>Math.round(money(v)*100);
const amount=f=>root.KYV_INVOICE_LINE?.cents(f)??Math.max(0,cents(f.XML_SHA256?f.PrezzoTotale:f.PrezzoUnitario));
const paid=x=>/^(si|sì|yes|true|1|pagat|incassat)/i.test(text(x));
const difference=(start,end)=>Math.round((Date.parse(end+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000);
function analyze({projects=[],invoices=[],payments=[],paymentReversals=[],rights=[],allocations=[],allocationReversals=[]}={}){
 const result=new Map(projects.map(p=>[id(p.ID),{
   ID:p.ID,title:text(p.TITOLO)||'Senza titolo',artist:text(p.ARTISTA)||'—',
   state:text(p.STATO),start:day(p.Data_Sessione),release:day(p.Data_Pubblicazione),
   fee:money(p.FEE),billed:0,datedCash:0,rightsCash:0,undatedLegacy:0,
   firstBilled:null,firstCash:null,returnDays:null,invoiceCount:0,rightsCount:0
 }]));
 const refs=new Map();
 for(const p of projects){
  const legacy=text(p.IDFT);if(!/^\d+$/.test(legacy))continue;
  const key=String(Number(legacy));
  const matches=refs.get(key)||[];matches.push(id(p.ID));refs.set(key,matches);
 }
 let unallocatedInvoiceLines=0,ambiguousInvoiceLines=0,invoiceTotal=0,feeCash=0,unknownFeeCash=0;
 const reversePayments=new Set(paymentReversals.map(r=>id(r.ID_INCASSO)));
 const paymentByInvoice=new Map();
 for(const p of payments){
  const k=id(p.ID_FT),arr=paymentByInvoice.get(k)||[];arr.push(p);paymentByInvoice.set(k,arr);
 }
 const setFirst=(p,field,date)=>{if(date&&(!p[field]||date<p[field]))p[field]=date;};
 for(const f of invoices){
  const amountCents=amount(f);invoiceTotal+=amountCents;
  const direct=id(f.ID_PROGETTO),legacyMatches=refs.get(id(f.ID_FT))||[];
  let key=null;
  if(direct){if(result.has(direct))key=direct;}
  else if(legacyMatches.length===1)key=legacyMatches[0];
  if(!key){unallocatedInvoiceLines++;if(legacyMatches.length>1)ambiguousInvoiceLines++;continue;}
  const project=result.get(key);
  project.billed+=amountCents;project.invoiceCount++;
  setFirst(project,'firstBilled',day(f.Data));
  const movement=paymentByInvoice.get(id(f.ID_FT))||[];
  if(!movement.length){
   if(paid(f.PAGATA)){project.undatedLegacy+=amountCents;unknownFeeCash+=amountCents;}
   continue;
  }
  let actual=0;
  for(const p of movement){
   if(reversePayments.has(id(p.ID_INCASSO)))continue;
   const n=Math.max(0,cents(p.Importo));
   // For monetary data that exceed the line amount, avoid counted overpayment.
   const permitted=Math.max(0,amountCents-actual),accepted=Math.min(permitted,n);
   actual+=accepted;
   if(accepted&&day(p.Data)){
    project.datedCash+=accepted;feeCash+=accepted;
    setFirst(project,'firstCash',day(p.Data));
   }
  }
 }
 const reversals=new Set(allocationReversals.map(x=>id(x.ID_ATTRIBUZIONE)));
 const rightsById=new Map(rights.map(x=>[id(x.ID_LIQUIDAZIONE),x]));
 let unallocatedRights=0,allocatedRights=0,rightsCount=0,unknownProjects=0;
 const allocatedByPayment=new Map();
 for(const a of allocations){
  if(reversals.has(id(a.ID_ATTRIBUZIONE)))continue;
  const l=rightsById.get(id(a.ID_LIQUIDAZIONE)),p=result.get(id(a.ID_PROGETTO));
  if(!l||!p||!day(l.DataAccredito)||!['SIAE','NUOVO IMAIE'].includes(text(l.Ente))){unknownProjects++;continue;}
  const n=Math.max(0,cents(a.Importo)),limit=Math.max(0,cents(l.ImportoNetto));
  if(!n)continue;
  const already=allocatedByPayment.get(id(l.ID_LIQUIDAZIONE))||0;
  const accepted=Math.max(0,Math.min(n,limit-already));
  if(!accepted)continue;
  allocatedByPayment.set(id(l.ID_LIQUIDAZIONE),already+accepted);
  p.rightsCash+=accepted;p.rightsCount++;allocatedRights+=accepted;rightsCount++;
  setFirst(p,'firstCash',day(l.DataAccredito));
 }
 for(const l of rights){
  const total=Math.max(0,cents(l.ImportoNetto));
  unallocatedRights+=Math.max(0,total-(allocatedByPayment.get(id(l.ID_LIQUIDAZIONE))||0));
 }
 let withReturnDate=0,returnsDays=0,withAnyBill=0,noBasis=0;
 const list=Array.from(result.values());
 for(const p of list){
  if(p.billed>0)withAnyBill++;
  if(p.billed===0&&p.rightsCash===0&&p.undatedLegacy===0)noBasis++;
  if(p.start&&p.firstCash){
   const delta=difference(p.start,p.firstCash);
   if(delta>=0){p.returnDays=delta;returnsDays+=delta;withReturnDate++;}
  }
  p.billed/=100;p.datedCash/=100;p.rightsCash/=100;p.undatedLegacy/=100;
  p.totalDocumentedCash=p.datedCash+p.rightsCash;
 }
 list.sort((a,b)=>(b.billed+b.rightsCash)-(a.billed+a.rightsCash));
 return {
  projects:list,stats:{
   projects:list.length,invoiceLines:invoices.length,
   invoiceTotal:invoiceTotal/100,unallocatedInvoiceLines,ambiguousInvoiceLines,
   datedInvoiceCash:feeCash/100,legacyPaidUndated:unknownFeeCash/100,
   rightsAllocated:allocatedRights/100,rightsNotAllocated:unallocatedRights/100,
   rightsAttributions:rightsCount,unusableAttributions:unknownProjects,
   noKnownEconomicBasis:noBasis,withInvoice:withAnyBill,
   withReturnDate,meanDaysToFirstCash:withReturnDate?Math.round(returnsDays/withReturnDate):null
  }
 };
}
root.KYV_PROJECT_RETURNS_V240=Object.freeze({analyze,day,money});
})(typeof window!=='undefined'?window:globalThis);
