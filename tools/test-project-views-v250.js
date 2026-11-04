// KYV v2.50: global project filters, safe popup and independent factual charts.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const root={};
const ctx={window:root,Date,Map,Set,Intl,Object,Error,Number};
vm.runInNewContext(read('kyv-project-list-v250.js'),ctx,{filename:'kyv-project-list-v250.js'});
vm.runInNewContext(read('kyv-invoice-line-amount.js'),ctx,{filename:'kyv-invoice-line-amount.js'});
vm.runInNewContext(read('kyv-home-charts-v250.js'),ctx,{filename:'kyv-home-charts-v250.js'});
const P=root.KYV_PROJECT_V250,C=root.KYV_HOME_CHARTS_V250;
const projects=[
 {ID:1,TITOLO:'Caffè Dolce',ARTISTA:'Émma',STATO:'In lavorazione',SVILUPPO:'Mix',Data_Sessione:'2026-10-01',created_at:'2026-09-01'},
 {ID:2,TITOLO:'Sera Lunga',ARTISTA:'Giorgia',STATO:'Uscita',SVILUPPO:'Finita',Data_Pubblicazione:'2026-10-10'},
 {ID:3,TITOLO:'Caffè e notte',ARTISTA:'Émma',STATO:'In lavorazione',SVILUPPO:'Demo',Prossimo_Followup:'2026-11-05'},
 {ID:4,TITOLO:'Senza nome',ARTISTA:'',STATO:'',SVILUPPO:'',NOTE:'reference'}
];
assert.equal(P.filterRows(projects,{mode:'TUTTI',query:'caffe',artist:'Emma'}).length,2,'Search accent-insensitive across all');
assert.equal(P.filterRows(projects,{mode:'TUTTI',artist:'Emma',status:'In lavorazione',phase:'Mix'}).length,1,'Independent AND filters');
assert.equal(P.filterRows(projects,{mode:'USCITI'}).length,1,'Preserve safe done categorization');
assert.equal(P.filterRows(projects,{mode:'TUTTI',status:'__missing__'}).length,1,'Explicit status missing filter');
assert.equal(P.filterRows(projects,{mode:'TUTTI',phase:'__missing__'}).length,1,'Explicit phase missing filter');
assert.equal(P.filterRows(projects,{mode:'TUTTI',query:'reference'}).length,1);
assert.equal(P.filterRows(projects,{mode:'TUTTI',sort:'title'})[0].ID,1);
const many=Array.from({length:81},(_,i)=>({ID:i+100,TITOLO:i===79?'Unico Titolo':'Brano '+i,ARTISTA:'KYV',STATO:'Bozza'}));
assert.equal(P.filterRows(many,{mode:'RECENTI'}).length,40);
assert.equal(P.filterRows(many,{mode:'RECENTI',query:'Unico Titolo'}).length,1,'Search must include rows beyond Recenti');
assert.equal(P.filterRows(many,{mode:'RECENTI',artist:'KYV'}).length,81,'Secondary filters query full dataset');
const dist=P.distribution(projects,'STATO');
assert.equal(dist.reduce((sum,x)=>sum+x.count,0),projects.length);
assert.equal(dist.find(x=>x.key==='__missing__').count,1);
assert.throws(()=>P.distribution(projects,'FEE'),/non autorizzato/);
const coverage=P.coverage(projects);
assert.equal(coverage.total,4);assert.equal(coverage.artist,3);
assert.equal(coverage.status,3);assert.equal(coverage.sessionDated,1);
assert.equal(coverage.releaseDated,1);
assert.equal(P.recentDate(projects[3]),null,'Do not invent dates for undated projects');
const invoices=[
 {ID_FT:1,Data:'2026-01-09',PrezzoUnitario:'1.200,00',ImportoTotaleDocumento:'9200,00','TIPO FT':'FEE',PAGATA:'NO'},
 {ID_FT:2,Data:'2026-02-09',PrezzoUnitario:'500,00',ImportoTotaleDocumento:'9000','TIPO FT':'FEE',PAGATA:'SI'},
 {ID_FT:3,Data:'',PrezzoUnitario:'400,00',ImportoTotaleDocumento:'8900','TIPO FT':'PRODUZIONE',PAGATA:'SI'},
 {ID_FT:4,Data:'2025-05-09',PrezzoUnitario:'',ImportoTotaleDocumento:'9500','TIPO FT':'FEE',PAGATA:'NO'}
];
assert.equal(C.unit(invoices[0]).value,1200);
assert.equal(C.unit(invoices[3]).valid,false,'Do not use fiscal total when unit amount is missing');
const year=C.billing(invoices);
assert.equal(year.source,'PrezzoUnitario');
assert.equal(year.missingDate,1);assert.equal(year.missingPrice,1);
assert.equal(year.series.find(s=>s.type==='FEE').data.reduce((a,b)=>a+b,0),1700,'All invoices regardless of PAGATA');
assert.equal(C.billing(invoices,'PRODUZIONE').series.length,1);
assert.equal(C.year('2026-02-31'),null,'Invalid date must not be plotted');
assert.equal(C.statuses(projects).reduce((s,x)=>s+x.count,0),projects.length);
assert.equal(C.artists(projects,10).missingArtist,1);
assert.equal(C.artists(projects,10).rows.find(x=>x.artist==='EMMA').count,2);
const page=read('progetti.html'),home=read('index.html'),ui=read('kyv-home-charts-ui-v250.js'),sw=read('sw.js');
for(const id of ['project-quick-modal','project-artist-filter','project-status-filter','project-phase-filter','project-sort','project-overview-field','project-overview-bars','project-load-more','project-view-toggle'])assert.ok(page.includes(id),id);
assert.ok(page.includes("count:'exact'")&&page.includes('.range('),'No hidden page-only search or silent 500 cap');
assert.ok(page.includes("M.filterRows(state.rows"),'Search all loaded projects');
assert.ok(page.includes("renderOverview();"),'Chart independent from list filters');
assert.ok(page.includes("if(event.key==='Escape'"),'Popup keyboard close');
assert.doesNotMatch(page,/\.from\(['"]PROGETTI['"]\)\.(?:insert|update|upsert|delete)\(/,'Projects overview must remain read-only');
const script=page.slice(page.lastIndexOf('<script>')+8,page.lastIndexOf('</script>'));
assert.ok(script.length>5000);new vm.Script(script,{filename:'progetti:inline'});
for(const t of ['kyv-home-charts-v250.js','kyv-home-charts-ui-v250.js','kyv-invoice-line-amount.js','KYV_HOME_CHARTS_UI_V250.update'])assert.ok(home.includes(t),t);
assert.ok(ui.includes("C.billing(data.invoices")&&ui.includes("C.statuses(data.projects")&&ui.includes("C.artists(data.projects"));
assert.ok(ui.includes("addEventListener('change',renderBilling)"));
assert.doesNotMatch(ui,/\.(?:from|insert|delete|upsert)\(/,'Chart renderer cannot query or modify database');
assert.ok(home.includes('Incassato (flag)')&&home.includes('Da incassare (flag)'), 'Legacy PAGATA summary must identify estimates');
assert.ok(sw.includes("'./kyv-project-list-v250.js'")&&sw.includes("'./kyv-home-charts-v250.js'")&&sw.includes("'./kyv-home-charts-ui-v250.js'"));
assert.equal(JSON.parse(read('package.json')).version,'2.74.0');
assert.equal(read('VERSION').trim() ,'2.74');
assert.ok(read('guida.html').includes('v2.50'));
assert.ok(read('kyv-help.js').includes('v2.50'));
console.log('OK: v2.50 full-history filters, read-only popup, independent accurate project and unitary-billing charts');
