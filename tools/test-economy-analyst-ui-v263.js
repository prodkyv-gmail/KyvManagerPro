// v2.63 — Home, Economy and Analyst: UI-only simplification without data math changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const home=read('index.html'),economy=read('fatture.html'),analyst=read('kyv_analyst.html'),
 analystUi=read('kyv-analyst-ui-v241.js'),theme=read('kyv-theme.css'),
 homeUi=read('kyv-home-charts-ui-v250.js'),engine=read('kyv-analyst-engine-v241.js');
const homeMarkup=home.slice(home.indexOf('<body'),home.indexOf('<!-- SCRIPT DASHBOARD -->'));
const econMarkup=economy.slice(economy.indexOf('<body'),economy.indexOf('    <script>\n        if (typeof loadKyvSidebar'));
const analystMarkup=analyst.slice(analyst.indexOf('<body'),analyst.indexOf('</body>'));
for(const [name,markup] of [['Home',homeMarkup],['Economy',econMarkup],['Analyst',analystMarkup]]){
 const details=(markup.match(/<details\b/g)||[]).length,ends=(markup.match(/<\/details>/g)||[]).length;
 assert.equal(details,ends,name+' disclosure closures must balance');
 const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,name+' static IDs must be unique');
}
for(const x of ['home-billing-types-details','home-analytics-details','home-data-status',
 'val-fee','val-fatturato','val-da-incassare','val-incassato','val-uscite',
 'studio-pulse','activity-list','ops-radar','chartAndamento','chartStati','chartTopArtisti',
 'home-type-filter'])if(x!=='home-type-filter')assert.ok(home.includes('id="'+x+'"'),x);
assert.ok(home.includes('<details id="home-analytics-details" class="kyv-v263-disclosure'));
assert.ok(home.includes('<details id="home-billing-types-details" class="kyv-v263-disclosure'));
assert.ok(!home.includes('<details id="home-analytics-details" class="kyv-v263-disclosure mb-6" open'),
 'Advanced charts should not dominate Home by default');
assert.ok(home.includes('kyv_scrivania_creativa.html?tab=sessions'),
 'Quick action must link to current session workflow');
assert.ok(home.includes("for(const chart of [chartAndamentoInstance,chartStatiInstance,chartTopArtistiInstance])"),
 'Revealing Chart.js canvases must explicitly resize existing instances');
assert.ok(home.includes('requestAnimationFrame('));
assert.ok(home.includes('window.KYV_HOME_CHARTS_UI_V250.update(projects,invoices)'));
assert.ok(homeUi.includes("C.billing(data.invoices,selected)"),'Original billing filter unchanged');
assert.ok(homeUi.includes("C.statuses(data.projects,field)"),'Status graph remains independent');
assert.ok(homeUi.includes("C.artists(data.projects,select)"),'Artist graph counts projects');
assert.ok(home.includes("document.getElementById('home-data-status').textContent"));
assert.ok(home.includes("for(const id of ['val-fee','val-fatturato','val-incassato','val-uscite'])"));
assert.ok(home.includes('Riepilogo non disponibile. Nessun importo sostituito con zero.'));
assert.ok(home.includes('window.KYV_INVOICE_LINE.amount(f)'),
 'Billing unit pricing not replaced by fiscal XML amount');
assert.ok(home.includes("let isPagata = f.PAGATA"),
 'Home legacy flag is described explicitly; not represented as verified payments');
for(const id of ['kyv-economy-extras','kyv-aruba-open','kyv-split-new',
 'correlazione-search','kyv-invoice-open-details','kyv-invoice-paid-details',
 'kyv-invoice-cash-summary','tot-incassato-complessivo','tot-acconti-aperti',
 'tbody-ft-nopag','tbody-ft-pag','tot-da-pagare','tot-pagate'])
 assert.ok(economy.includes('id="'+id+'"'),'Economy control retained: '+id);
assert.ok(economy.includes('<details id="kyv-invoice-open-details" class="kyv-invoice-status-details" open>'));
assert.ok(economy.includes('<details id="kyv-invoice-paid-details" class="kyv-invoice-status-details">'));
assert.ok(economy.includes('class="kyv-economy-extras-links"'));
for(const link of ['kyv_liquidazioni.html','kyv_intelligence.html','kyv_analyst.html','correlazione.html'])
 assert.ok(economy.includes('href="'+link+'"'),'Secondary economy link preserved: '+link);
assert.ok(economy.includes('data-kyv-new-table="FATTURE"'));
assert.ok(economy.includes('KYV_COLLECTIONS_V236?.paymentState(f)'),
 'Reconciliation remains source of received/residual amounts');
assert.ok(economy.includes('sumIncassatoTutti += received;'));
assert.ok(economy.includes('sumAccontiAperti += isPagata ? 0 : received;'));
assert.ok(economy.includes('sumDaIncassare += outstanding;'));
assert.ok(economy.includes('sumPagate += isPagata ? received : 0;'));
assert.ok(economy.includes('data-split-invoice='),
 'Manual multi-project invoice allocation actions unchanged');
for(const id of ['analyst-creative-details','analyst-artist-limit','analyst-artist-chart',
 'analyst-artist-note','analyst-metrics','analyst-creative-desk','creative-funnel-metrics',
 'analyst-priorities','answer-panel','analyst-query','analyst-reload','analyst-status'])
 assert.ok(analyst.includes('id="'+id+'"'),'Analyst control retained: '+id);
assert.ok(analyst.includes('<details id="analyst-creative-details" class="kyv-v263-disclosure">'));
assert.ok(analyst.includes('Fatturato attribuito per artista'));
assert.ok(analyst.includes('Solo importi unitari fatturati assegnati esplicitamente'));
assert.ok(analystUi.includes("const entries=report.artistRanks.filter(x=>Number.isFinite(x.amount)&&x.amount>0)"));
assert.ok(analystUi.includes("const count=Number($('analyst-artist-limit').value)||5"));
assert.ok(analystUi.includes("report.linkedTotal"));
assert.ok(analystUi.includes("'kyv-analyst-artist-track'")===false); // native DOM bar; not duplicate charting backend
assert.ok(analystUi.includes("Math.round(r.amount/max*100)"));
assert.ok(analystUi.includes("$('analyst-artist-limit').addEventListener('change',renderArtistChart)"));
assert.ok(analystUi.includes("renderArtistChart();\n $('analyst-footnote')"));
assert.ok(engine.includes('const artistRanks='),'Ranking already computed by authoritative analyst engine');
assert.doesNotMatch(analystUi,/\.insert\(|\.update\(|\.upsert\(|\.delete\(|api\.openai|api\.anthropic/);
const extracted=analystUi.match(/function renderArtistChart\(\)\{([\s\S]*?)\n\}\nfunction renderSuggestions\(/);
assert.ok(extracted,'Chart renderer is pure presentation and extractable');
const nodes={
 'analyst-artist-limit':{value:'5'},'analyst-artist-note':{textContent:''},
 'analyst-artist-chart':{innerHTML:''}
};
const e=v=>nodes[v];
const mock={
 report:{artistRanks:[{artist:'Test & Co',amount:600,projects:2},
  {artist:'Secondo',amount:300,projects:1},
  {artist:'Senza incassi',amount:0,projects:1}],linkedTotal:900},
 $:e,
 euro:v=>'€ '+v,H:v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;'),
 Number,Math
};
vm.runInNewContext('function renderArtistChart(){'+extracted[1]+'\n}\nthis.draw=renderArtistChart;',mock);
mock.draw();
assert.ok(nodes['analyst-artist-chart'].innerHTML.includes('Test &amp; Co'));
assert.ok(nodes['analyst-artist-chart'].innerHTML.includes('width:100%'));
assert.ok(nodes['analyst-artist-chart'].innerHTML.includes('width:50%'));
assert.ok(!nodes['analyst-artist-chart'].innerHTML.includes('Senza incassi'),
 'No fake positive chart for zero/unknown billings');
assert.ok(nodes['analyst-artist-note'].textContent.includes('2 di 2'));
nodes['analyst-artist-limit'].value='10';mock.draw();
assert.ok(nodes['analyst-artist-chart'].innerHTML.includes('Secondo'));
for(const token of ['.kyv-v263-disclosure','.kyv-economy-extras',
 '.kyv-invoice-status-details','.kyv-analyst-artist-row','#home-data-status'])
 assert.ok(theme.includes(token),'Missing shared visual component '+token);
for(const path of ['kyv-invoice-line-amount.js','kyv-analyst-engine-v241.js',
 'kyv-home-charts-v250.js','kyv-invoice-reconciliation-v236.js'])
 assert.ok(fs.existsSync(path));
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'2.75.0');
assert.equal(read('VERSION').trim(),'2.75');
assert.ok(read('config.js').includes("APP_VERSION: '2.75'"));
assert.ok(read('sw.js').includes('kyv-studio-v2-75-mobile-projects-20261104'));
assert.equal(pkg.scripts['check:economy-analyst-ui-v263'],'node tools/test-economy-analyst-ui-v263.js');
assert.ok(pkg.scripts.check.includes('check:economy-analyst-ui-v263'));
assert.ok(read('guida.html').includes('v2.63')&&read('kyv-help.js').includes('v2.63'));
console.log('OK: v2.63 dashboard truthfulness, independent charts, ledger views and read-only artist analysis');
