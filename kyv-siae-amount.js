/* ESTRATTO SIAE: segno contabile SIAE, opposto al segno economico per noi.
   Non modificare mai l'IMPORTO originale nel DB, nei file o nella deduplica. */
(function(root){'use strict';
function raw(value){
 if(typeof value==='number')return Number.isFinite(value)?value:null;
 let s=String(value??'').trim().replace(/[−–]/g,'-').replace(/[\s€\u00a0]/g,'');
 if(!s)return null;
 const neg=/^\(.*\)$/.test(s)||s.startsWith('-')||s.endsWith('-');
 s=s.replace(/[^\d.,]/g,'');if(!s)return null;
 const c=s.lastIndexOf(','),d=s.lastIndexOf('.');
 if(c>=0&&d>=0)s=c>d?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
 else if(c>=0)s=s.replace(/\./g,'').replace(',','.');
 else if((s.match(/\./g)||[]).length>1||/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 const n=Number(s);return Number.isFinite(n)?(neg?-Math.abs(n):n):null;
}
function forUs(value){const n=raw(value);return n===null?null:-n;}
root.KYV_SIAE_AMOUNT=Object.freeze({raw,forUs});
})(typeof window!=='undefined'?window:globalThis);
