// v2.41: read-only analyst, explicit sample sizes and cautious financial conclusions.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=x=>fs.readFileSync(x,'utf8');
const w={};
for(const file of ['kyv-invoice-line-amount.js','kyv-project-returns-v240.js','kyv-analyst-engine-v241.js'])
 vm.runInNewContext(read(file),{window:w,Intl,Number,Map,Set,Date,Math,Error},{filename:file});
const e=w.KYV_ANALYST_V241;
assert.ok(e?.build&&e?.answer);
const source={
 projects:[
  {ID:1,TITOLO:'Brano A',ARTISTA:'Artista A',FEE:'1200,00',Data_Sessione:'2026-01-01',Prossimo_Followup:'2026-10-20',STATO:'USCITA'},
  {ID:2,TITOLO:'Brano B',ARTISTA:'Artista B',FEE:'1500,00',Data_Sessione:null,STATO:'BOZZA'},
  {ID:3,TITOLO:'Brano C',ARTISTA:'Artista C',FEE:'0,00',Data_Sessione:'2026-01-03',STATO:'BOZZA'},
  {ID:4,TITOLO:'Brano D',ARTISTA:'Artista D',FEE:'1800,00',Data_Sessione:'2026-03-01',STATO:'IN SVILUPPO'}
 ],
 invoices:[
  {ID_FT:11,ID_PROGETTO:1,Data:'2026-03-01',PrezzoUnitario:'1200,00',ImportoTotaleDocumento:'2000,00',PAGATA:'SI'},
  {ID_FT:12,ID_PROGETTO:null,Data:'2026-03-01',PrezzoUnitario:'800,00',ImportoTotaleDocumento:'2000,00',PAGATA:'NO'}
 ],
 payments:[],paymentReversals:[],
 rights:[{ID_LIQUIDAZIONE:20,Ente:'SIAE',DataAccredito:'2026-07-01',ImportoNetto:500}],
 allocations:[{ID_ATTRIBUZIONE:50,ID_LIQUIDAZIONE:20,ID_PROGETTO:3,Importo:100}],
 allocationReversals:[]
};
const a=e.build(source,'2026-10-30');
assert.equal(a.results.stats.invoiceTotal,2000,'Never duplicate invoice document amount');
assert.equal(a.results.stats.unallocatedInvoiceLines,1);
assert.equal(a.results.stats.rightsAllocated,100);
assert.equal(a.results.stats.rightsNotAllocated,400);
assert.equal(a.reasons.overdueFollowups,1);
assert.equal(a.reasons.noSession,1);
assert.equal(a.reasons.zeroFee,1,'Fee=0 is counted as data, not a liability');
assert.equal(a.reasons.noBasis,2,'Missing documented income is not inferred as loss');
assert.equal(a.reasons.feePromisedNotBilled,2,'Positive fee not linked to an invoice');
assert.equal(a.reasons.oldUnbilled,1,'90-day rule requires real session date');
assert.equal(a.results.stats.withReturnDate,1,'Only project with dated receipt and session');
assert.equal(a.artistRanks[0].artist,'Artista A');
assert.equal(a.artistRanks[0].amount,1200);
assert.equal(a.topShare,100,'Artist concentration denominator is linked invoice lines only');
const questions=[
 ['Quali progetti sono senza entrate documentate?','Progetti da verificare economicamente'],
 ['Quali artisti concentrano i ricavi?','Concentrazione del fatturato per artista'],
 ['Quali follow-up sono scaduti?','Follow-up da verificare'],
 ['Qual è il tempo medio al primo incasso?','Tempo dalla sessione al primo accredito'],
 ['Quali royalties devo ancora attribuire?','Royalties e diritti collegati'],
 ['Quali dati mancano per analisi affidabili?','Qualità dei dati economici'],
 ['Quali sono i brani con maggiore fatturato?','I progetti con maggior fatturato per voce']
];
for(const [question,title] of questions){const r=e.answer(a,question);assert.equal(r.title,title);assert.equal(r.asOf,'2026-10-30');}
const fr=e.answer(a,'Quali follow-up sono scaduti?');
assert.equal(fr.items.length,1);
assert.ok(fr.items[0].url.includes('id=1'));
assert.ok(fr.notes.join(' ').includes('nessun messaggio')||fr.notes.join(' ').includes('Nessun messaggio'));
const remaining=e.answer(a,'Quali royalties devo ancora attribuire?');
assert.match(remaining.metrics[1].value,/400/,'Unattributed royalties must be visible');
assert.equal(e.answer(a,'Come va la luna?').title,'Domanda non riconosciuta dalle regole');
assert.throws(()=>e.build(source,'bad date'));
const page=read('kyv_analyst.html'),ui=read('kyv-analyst-ui-v241.js'),sw=read('sw.js');
for(const x of ['KYV Analyst','kyv-analyst-engine-v241.js','kyv-analyst-ui-v241.js','analyst-status']) assert.ok(page.includes(x));
for(const x of ['FATTURE_INCASSI_STORNI','KYV_ATTRIBUZIONI_DIRITTI_STORNI','Prossimo_Followup',"count:'exact'"])assert.ok(ui.includes(x));
assert.doesNotMatch(ui,/\.insert\(|\.update\(|\.upsert\(|\.delete\(|fetch\(['"]https:|api\.openai|api\.anthropic|localStorage/,'Analyst must remain read-only and local');
assert.ok(sw.includes('kyv-studio-v2-69-project-journey-20261104'));
for(const x of ["'./kyv_analyst.html'","'./kyv-analyst-engine-v241.js'","'./kyv-analyst-ui-v241.js'"])assert.ok(sw.includes(x));
assert.ok(read('kyv_intelligence.html').includes('kyv_analyst.html'));
assert.ok(read('kyv_ritorni_progetti.html').includes('kyv_analyst.html'));
const pkg=JSON.parse(read('package.json'));
assert.ok(pkg.scripts.check.includes('check:analyst-v241'));
assert.equal(pkg.scripts['check:analyst-v241'],'node tools/test-analyst-v241.js');
console.log('OK: KYV Analyst v2.41; no remote AI, no writes, exact evidence and unknowns');
