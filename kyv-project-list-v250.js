/* KYV v2.50 — independent project-list filters and evidence-based overview.
   Pure functions. No DB queries, document access, writes or inferred missing dates. */
(function(root){
'use strict';
const t=x=>String(x??'').trim();
const fold=x=>t(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it-IT').replace(/\s+/g,' ');
const done=p=>/USCITA|PUBBLICAT|COMPLETAT|FINITA|CHIUS/.test([p.STATO,p.SVILUPPO].map(t).join(' ').toUpperCase());
const waiting=p=>/ATTESA|WAIT|INVIAT|PITCH|FEEDBACK|RISPOST|APPROVA/.test([p.STATO,p.SVILUPPO].map(t).join(' ').toUpperCase());
const nextAction=p=>{const v=t(p.SVILUPPO);return !v||/^(FINITA|COMPLETATA|USCITA|PUBBLICATA|CHIUSA)$/i.test(v)?'':v;};
const dateNum=v=>{if(!v)return null;const n=new Date(v).getTime();return Number.isFinite(n)&&n>0?n:null;};
function recentDate(p){
 const dates=[p.updated_at,p.Data_Sessione,p.Data_Pubblicazione,p.created_at].map(dateNum).filter(x=>x!==null);
 return dates.length?Math.max(...dates):null;
}
function compare(a,b,sort='activity'){
 const name=x=>fold((x.ARTISTA||'')+' '+(x.TITOLO||''));
 if(sort==='artist')return name(a).localeCompare(name(b),'it')||Number(b.ID||0)-Number(a.ID||0);
 if(sort==='title')return fold(a.TITOLO).localeCompare(fold(b.TITOLO),'it')||Number(b.ID||0)-Number(a.ID||0);
 if(sort==='oldest')return (recentDate(a)??0)-(recentDate(b)??0)||Number(a.ID||0)-Number(b.ID||0);
 if(sort==='followup'){
  const due=x=>dateNum(x.Prossimo_Followup)??Number.POSITIVE_INFINITY;
  return due(a)-due(b)||Number(b.ID||0)-Number(a.ID||0);
 }
 return (recentDate(b)??0)-(recentDate(a)??0)||Number(b.ID||0)-Number(a.ID||0);
}
function filterRows(rows=[],opts={}){
 const {mode='RECENTI',query='',artist='',status='',phase='',sort='activity'}=opts;
 const q=fold(query),words=q.split(' ').filter(Boolean);
 const ra=fold(artist),rs=fold(status),rp=fold(phase);
 let list=(rows||[]).filter(p=>{
  if(mode==='DA_FARE'&&(!nextAction(p)||done(p)))return false;
  if(mode==='ATTESA'&&(!waiting(p)||done(p)))return false;
  if(mode==='USCITI'&&!done(p))return false;
  if(ra&&fold(p.ARTISTA)!==ra)return false;
  if(rs&&fold(p.STATO)!==rs)return false;
  if(rp&&fold(p.SVILUPPO)!==rp)return false;
  return words.every(w=>fold([p.TITOLO,p.ARTISTA,p.STATO,p.SVILUPPO,p.NOTE,p.Prossimo_Followup].join(' ')).includes(w));
 }).sort((a,b)=>compare(a,b,sort));
 if(mode==='RECENTI'&&!q&&!ra&&!rs&&!rp)list=list.slice(0,40);
 return list;
}
function distinct(rows,field){
 const values=new Map();
 for(const p of rows||[]){const raw=t(p[field]);if(!raw)continue;const k=fold(raw);if(!values.has(k))values.set(k,raw);}
 return [...values.values()].sort((a,b)=>a.localeCompare(b,'it'));
}
function distribution(rows=[],field='STATO'){
 if(!['STATO','SVILUPPO'].includes(field))throw Error('Campo per grafico non autorizzato');
 const counts=new Map();
 for(const p of rows){
  const raw=t(p[field]),key=fold(raw)||'__missing__';
  const entry=counts.get(key)||{key,label:raw||'Non indicato',count:0,missing:!raw,field};
  entry.count++;
  counts.set(key,entry);
 }
 return [...counts.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'it'));
}
function coverage(rows){
 const items=rows||[];
 return {total:items.length,title:items.filter(p=>!!t(p.TITOLO)).length,
  artist:items.filter(p=>!!t(p.ARTISTA)).length,status:items.filter(p=>!!t(p.STATO)).length,
  sessionDated:items.filter(p=>dateNum(p.Data_Sessione)!==null).length,
  releaseDated:items.filter(p=>dateNum(p.Data_Pubblicazione)!==null).length};
}
root.KYV_PROJECT_V250=Object.freeze({fold,done,waiting,nextAction,recentDate,compare,filterRows,distinct,distribution,coverage});
})(typeof window!=='undefined'?window:globalThis);
