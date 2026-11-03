/* KYV v2.50 — independent, evidence-based homepage charts, no new DB queries. */
(function(root){
'use strict';
const t=x=>String(x??'').trim();
const fold=x=>t(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('it-IT').replace(/\s+/g,' ');
function unit(row){
 const helper=root.KYV_INVOICE_LINE?.info(row);
 if(helper)return {value:helper.amount,valid:helper.valid};
 const raw=t(row?.PrezzoUnitario);if(!raw)return {value:0,valid:false};
 let s=raw.replace(/[€\s]/g,'').replace(/[^\d,.-]/g,'');
 const comma=s.lastIndexOf(','),dot=s.lastIndexOf('.');
 if(comma>dot)s=s.replace(/\./g,'').replace(',','.');
 else if(dot>comma&&comma>=0)s=s.replace(/,/g,'');
 const n=Number(s);
 return Number.isFinite(n)&&n>=0?{value:Math.round(n*100)/100,valid:true}:{value:0,valid:false};
}
const year=v=>{const s=t(v);const m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:$|[T\s])/);if(!m)return null;const y=Number(m[1]),month=Number(m[2]),day=Number(m[3]);const date=new Date(Date.UTC(y,month-1,day));return date.getUTCFullYear()===y&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?y:null;};
const invoiceType=f=>fold(f['TIPO FT']||f.TipoFT||f['Tipo FT']||f.TIPO_FT)||'NON INDICATO';
function billing(fatture=[],onlyType='all'){
 const perYear=new Map(),allTypes=new Set(),years=new Set();
 let missingDate=0,missingPrice=0,datedCount=0;
 for(const f of fatture){
  const x=unit(f);if(!x.valid){missingPrice++;continue;}
  const y=year(f.Data||f.DATA_EMISSIONE);
  const type=invoiceType(f);allTypes.add(type);
  if(y===null){missingDate++;continue;}
  years.add(y);datedCount++;
  if(onlyType!=='all'&&type!==onlyType)continue;
  const row=perYear.get(y)||new Map();
  row.set(type,Math.round(((row.get(type)||0)+x.value)*100)/100);
  perYear.set(y,row);
 }
 const yearsOrdered=[...years].sort((a,b)=>a-b);
 const types=[...allTypes].sort((a,b)=>a.localeCompare(b,'it'));
 const displayed=onlyType==='all'?types:types.filter(x=>x===onlyType);
 return {years:yearsOrdered,types,displayed,missingDate,missingPrice,datedCount,
  series:displayed.map(type=>({type,data:yearsOrdered.map(y=>perYear.get(y)?.get(type)||0)})),
  source:'PrezzoUnitario',axis:'Anno di emissione',unit:'EUR'};
}
function statuses(projects=[],field='STATO'){
 if(!['STATO','SVILUPPO'].includes(field))throw Error('Invalid status chart field');
 const m=new Map();
 for(const p of projects){
  const label=fold(p[field])||'NON INDICATO';
  m.set(label,(m.get(label)||0)+1);
 }
 return [...m.entries()].map(([name,count])=>({name,count}))
  .sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'it'));
}
function artists(projects=[],limit=10){
 const m=new Map();let unknown=0;
 for(const p of projects){
  const name=fold(p.ARTISTA);if(!name){unknown++;continue;}
  m.set(name,(m.get(name)||0)+1);
 }
 const ordered=[...m.entries()].map(([artist,count])=>({artist,count}))
   .sort((a,b)=>b.count-a.count||a.artist.localeCompare(b.artist,'it'));
 const n=limit==='all'?ordered.length:Math.min(50,Math.max(1,Number(limit)||10));
 return {rows:ordered.slice(0,n),unique:ordered.length,missingArtist:unknown,total:projects.length};
}
root.KYV_HOME_CHARTS_V250=Object.freeze({year,unit,invoiceType,billing,statuses,artists});
})(typeof window!=='undefined'?window:globalThis);
