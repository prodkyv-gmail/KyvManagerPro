/* KYV Intelligence v2.38 — read-only economic analysis.
 * Invoice DATE = billing period, not bank credit. Legacy PAGATA=SI has no cash date.
 * SIAE statement is a provisional source, never automatically counted as a bank transfer.
 */
(function(root){
'use strict';
const asText=x=>String(x??'').trim();
const parseAmount=x=>{
 if(typeof x==='number')return Number.isFinite(x)?x:null;
 let s=asText(x).replace(/[€\s]/g,'').replace(/[^\d,.-]/g,'');
 if(!s)return null;
 const c=s.lastIndexOf(','),d=s.lastIndexOf('.');
 if(c>d)s=s.replace(/\./g,'').replace(',','.');
 else if(d>c&&c>=0)s=s.replace(/,/g,'');
 const n=Number(s);return Number.isFinite(n)?n:null;
};
const cents=x=>Math.round((parseAmount(x)||0)*100);
const positiveDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(asText(x))?asText(x):null;
const periodOf=(date,mode)=>{
 const s=positiveDate(date);return s?(mode==='monthly'?s.slice(0,7):s.slice(0,4)):null;
};
const paid=x=>/^(si|sì|yes|true|1|pagat|incassat)/i.test(asText(x));
const amount=f=>root.KYV_INVOICE_LINE?.cents(f)??Math.max(0,cents(f.XML_SHA256?f.PrezzoTotale:f.PrezzoUnitario));
function summarizeInvoice(inv,payments,reversals){
 const group=(payments||[]).filter(p=>asText(p.ID_FT)===asText(inv.ID_FT));
 const reversed=new Set((reversals||[]).map(x=>asText(x.ID_INCASSO)));
 const active=group.filter(x=>!reversed.has(asText(x.ID_INCASSO)));
 const total=amount(inv),verified=active.reduce((a,p)=>a+Math.round(Number(p.Importo)*100),0);
 const legacy=!group.length&&paid(inv.PAGATA);
 return {total,received:legacy?total:Math.max(0,Math.min(total,verified)),historical:legacy,movements:active,anomaly:verified>total};
}
function compute({invoices=[],projects=[],payments=[],reversals=[],siaes=[],rightsLiquidations=[]}={},mode='annual'){
 if(!['monthly','annual'].includes(mode))throw Error('Periodo non valido');
 const map=new Map(),unknownCash=[];
 const bucket=k=>{if(!map.has(k))map.set(k,{period:k,billed:0,verifiedCash:0,legacyPaid:0,expenses:0,siaeProvisional:0,rightsCash:0,invoiceCount:0});return map.get(k)};
 let totalBilled=0,totalReceived=0,unlinked=0,legacyNoDate=0;
 for(const i of invoices){
   const a=summarizeInvoice(i,payments,reversals),key=periodOf(i.Data,mode);
   if(!asText(i.ID_PROGETTO))unlinked++;
   totalBilled+=a.total;totalReceived+=a.received;
   if(key){const b=bucket(key);b.billed+=a.total;b.invoiceCount++;}
   if(a.historical){legacyNoDate+=a.received;unknownCash.push(i.ID_FT);}
   else for(const p of a.movements){const dateKey=periodOf(p.Data,mode);if(dateKey)bucket(dateKey).verifiedCash+=Math.round(Number(p.Importo)*100);}
 }
 let rightsCash=0,rightsCount=0;
 for(const liq of rightsLiquidations){
   if(!['SIAE','NUOVO IMAIE'].includes(asText(liq.Ente)))continue;
   const key=periodOf(liq.DataAccredito,mode),v=parseAmount(liq.ImportoNetto);
   if(!key||v===null||v<=0)continue;
   const amountCents=Math.round(v*100);
   bucket(key).rightsCash+=amountCents;rightsCash+=amountCents;rightsCount++;
 }
 let siaeRows=0,siaeParseable=0;
 for(const v of siaes){
   siaeRows++;const val=parseAmount(v.IMPORTO),key=periodOf(v.DATA,mode);
   if(val!==null&&key){bucket(key).siaeProvisional+=Math.round(val*100);siaeParseable++;}
 }
 const withSession=projects.filter(p=>positiveDate(p.Data_Sessione)).length,
   withRelease=projects.filter(p=>positiveDate(p.Data_Pubblicazione)).length,
   withMaster=projects.filter(p=>positiveDate(p.Data_Consegna_Master)).length,
   withFee=projects.filter(p=>asText(p.FEE)).length;
 const linked=new Set(invoices.map(i=>asText(i.ID_PROGETTO)).filter(Boolean));
 const oldRefs=new Set(projects.filter(p=>asText(p.IDFT)).map(p=>asText(Number(p.IDFT))));
 const invoiceIds=new Set(invoices.map(i=>asText(i.ID_FT)));
 const notLinked=projects.filter(p=>!linked.has(asText(p.ID))&&(!asText(p.IDFT)||!invoiceIds.has(asText(Number(p.IDFT)))));
 const active=notLinked.filter(p=>!/uscita|pubblicat|completat|chius|finit/i.test(asText(p.STATO)+' '+asText(p.SVILUPPO)));
 const openWithNoFee=active.filter(p=>!asText(p.FEE)||cents(p.FEE)===0);
 const rows=[...map.values()].sort((a,b)=>a.period.localeCompare(b.period));
 return {rows,totals:{billed:totalBilled/100,received:totalReceived/100,legacyUndated:legacyNoDate/100,unlinked,invoiceCount:invoices.length,projectCount:projects.length,siaeRows,siaeParseable,verifiedCash:rows.reduce((s,b)=>s+b.verifiedCash,0)/100,rightsCash:rightsCash/100,rightsCount},
 coverage:{withSession,withRelease,withMaster,withFee,activeUnlinked:active.length,openWithNoFee:openWithNoFee.length},
 warnings:['Il fatturato è aggregato per data fattura.','Gli incassi storici PAGATA=SI non hanno una data bancaria verificata e non sono ripartiti nei mesi degli incassi.','Le voci ESTRATTO SIAE sono provvisorie e NON sono incluse negli incassi complessivi.','Le liquidazioni SIAE/IMAIE confermate sono registrate a parte, per data accredito; i movimenti ESTRATTO SIAE non sono conteggiati come bonifici.'],
 undatedInvoiceIds:unknownCash};
}
root.KYV_INTELLIGENCE_ENGINE=Object.freeze({parseAmount,periodOf,summarizeInvoice,compute});
})(typeof window!=='undefined'?window:globalThis);
