/* KYV v2.50 — self-contained homepage Chart.js presentation, no DB writes. */
(function(root){
'use strict';
const C=root.KYV_HOME_CHARTS_V250;
const palette=['#818cf8','#38bdf8','#34d399','#fbbf24','#fb7185','#a78bfa','#2dd4bf','#f472b6'];
let data={projects:[],invoices:[]},ready=false;
const $=id=>document.getElementById(id);
const chart=id=>typeof root.Chart?.getChart==='function'?root.Chart.getChart(id):null;
function control(id,title,options){
 let el=$(id);
 if(el)return el;
 const canvas=id==='home-type-filter'?'chartAndamento':id==='home-status-filter'?'chartStati':'chartTopArtisti';
 const card=$(canvas)?.closest('.bg-kyv-card');
 if(!card)return null;
 const label=document.createElement('label');
 label.className='flex items-center gap-2 text-[11px] text-kyv-text mt-1 mb-2';
 label.textContent=title+' ';
 el=document.createElement('select');el.id=id;
 el.className='bg-[#101722] border border-slate-600 text-slate-100 rounded-lg px-2 py-1 text-[11px]';
 label.appendChild(el);
 const parent=card.querySelector('.flex-1.relative')||$(canvas).parentElement;
 card.insertBefore(label,parent);
 for(const [value,description] of options)el.add(new Option(description,value));
 return el;
}
function note(id,canvasId){
 let p=$(id);if(p)return p;
 const cv=$(canvasId);if(!cv)return null;
 p=document.createElement('p');p.id=id;
 p.className='text-[10px] text-kyv-text mb-2 leading-relaxed';
 const card=cv.closest('.bg-kyv-card'),parent=card.querySelector('.flex-1.relative')||cv.parentElement;
 card.insertBefore(p,parent);return p;
}
function renderBilling(){
 const selected=$('home-type-filter')?.value||'all';
 const result=C.billing(data.invoices,selected);
 const selector=$('home-type-filter');
 const old=selector?.value||'all';
 if(selector){
  selector.replaceChildren(new Option('Tutte le tipologie','all'),...result.types.map(x=>new Option(x,x)));
  selector.value=result.types.includes(old)?old:'all';
 }
 const actual=C.billing(data.invoices,selector?.value||'all');
 const n=note('home-billing-note','chartAndamento');
 if(n)n.textContent=actual.datedCount+' fatture con importo unitario e data · '+
   actual.missingDate+' senza data · '+actual.missingPrice+' senza PrezzoUnitario valido. È fatturato emesso, non incasso.';
 const ch=chart('chartAndamento');if(!ch)return;
 ch.data.labels=actual.years.map(String);
 ch.data.datasets=actual.series.map((s,i)=>({label:s.type,data:s.data,
   backgroundColor:palette[i%palette.length],borderRadius:4}));
 ch.update();
}
function renderStatuses(){
 const field=$('home-status-filter')?.value||'STATO';
 const all=C.statuses(data.projects,field);
 const missing=all.find(x=>x.name==='NON INDICATO')?.count||0;
 const nonMissing=all.filter(x=>x.name!=='NON INDICATO');
 const display=nonMissing.slice(0,8);
 const remaining=nonMissing.slice(8).reduce((sum,x)=>sum+x.count,0);
 if(remaining)display.push({name:'ALTRI STATI / FASI',count:remaining});
 if(missing)display.push({name:'NON INDICATO',count:missing});
 const n=note('home-status-note','chartStati');
 if(n)n.textContent=data.projects.length+' progetti · '+missing+' senza '+(field==='STATO'?'stato':'fase')+
  ' registrato. Altre categorie aggregate solo per leggibilità.';
 const ch=chart('chartStati');if(!ch)return;
 ch.data.labels=display.map(x=>x.name);
 ch.data.datasets[0].data=display.map(x=>x.count);
 ch.data.datasets[0].backgroundColor=display.map((x,i)=>x.name==='NON INDICATO'?'#64748b':palette[i%palette.length]);
 ch.update();
}
function renderArtists(){
 const select=$('home-artist-limit')?.value||'10';
 const results=C.artists(data.projects,select);
 const n=note('home-artist-note','chartTopArtisti');
 if(n)n.textContent=results.total+' progetti · '+results.unique+' artisti compilati · '+
   results.missingArtist+' progetti senza artista. Conteggio di progetti, non fatturato.';
 const ch=chart('chartTopArtisti');if(!ch)return;
 ch.data.labels=results.rows.map(x=>x.artist);
 ch.data.datasets=[{label:'Progetti',data:results.rows.map(x=>x.count),backgroundColor:'#818cf8',borderRadius:4}];
 ch.update();
}
function setup(){
 if(ready)return;
 const types=control('home-type-filter','Tipologia:',[['all','Tutte le tipologie']]);
 const statuses=control('home-status-filter','Grafico:',[['STATO','Stato registrato'],['SVILUPPO','Fase registrata']]);
 const artists=control('home-artist-limit','Artisti:',[['10','Primi 10'],['20','Primi 20'],['all','Tutti']]);
 if(!types||!statuses||!artists)return;
 const title=(id,text)=>{const c=$(id)?.closest('.bg-kyv-card');const h=c?.querySelector('h3');if(h)h.textContent=text;};
 title('chartAndamento','Fatturato emesso per anno · PrezzoUnitario');
 title('chartStati','Progetti per stato o fase');
 title('chartTopArtisti','Artisti · numero di progetti');
 types.addEventListener('change',renderBilling);
 statuses.addEventListener('change',renderStatuses);
 artists.addEventListener('change',renderArtists);
 ready=true;
}
function update(projects,invoices){
 data={projects:Array.isArray(projects)?projects:[],invoices:Array.isArray(invoices)?invoices:[]};
 setup();
 renderBilling();renderStatuses();renderArtists();
}
root.KYV_HOME_CHARTS_UI_V250=Object.freeze({update});
})(typeof window!=='undefined'?window:globalThis);
