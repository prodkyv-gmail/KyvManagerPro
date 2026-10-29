/* KYV invoice row amounts — one row = one billable item or project.
   Legacy: PrezzoUnitario is the project's fee; never sum ImportoTotaleDocumento per row.
   Imported Aruba XML: currently stored as ONE aggregated row (XML_SHA256), so
   PrezzoTotale is the sum of DettaglioLinee, unlike its first-line PrezzoUnitario.
   Amounts here are managerial, not necessarily fiscal/tax inclusive.
*/
(function(root){
'use strict';
const t=v=>String(v??'').trim();
function parse(v){
 if(typeof v==='number')return Number.isFinite(v)?v:null;
 let x=t(v).replace(/[€\s]/g,'').replace(/[^\d.,-]/g,'');
 if(!x||x==='-'||x==='.')return null;
 const c=x.lastIndexOf(','),d=x.lastIndexOf('.');
 if(c>d)x=x.replace(/\./g,'').replace(',','.');
 else if(d>c&&c>=0)x=x.replace(/,/g,'');
 const val=Number(x);
 return Number.isFinite(val)?val:null;
}
function info(row){
 const xml=!!t(row?.XML_SHA256);
 const source=xml?'PrezzoTotale':'PrezzoUnitario';
 const value=parse(row?.[source]);
 // No fallback to document totals: that would duplicate the same invoice across projects.
 // Flag absent or negative row values, instead of making undocumented assumptions.
 return Object.freeze({amount:value===null?0:Math.max(0,Math.round(value*100)/100),
   valid:value!==null&&value>=0,source,xml,documentTotal:parse(row?.ImportoTotaleDocumento)});
}
const amount=row=>info(row).amount;
const cents=row=>Math.round(amount(row)*100);
root.KYV_INVOICE_LINE=Object.freeze({parse,info,amount,cents});
})(typeof window!=='undefined'?window:globalThis);
