const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=n=>fs.readFileSync(n,'utf8'),window={};
for(const path of ['kyv-invoice-line-amount.js','kyv-project-returns-v240.js','kyv-creative-funnel-v242.js','kyv-analyst-engine-v241.js'])
 vm.runInNewContext(read(path),{window,Number,Map,Set,Date,Intl,Math,Error},{filename:path});
const c=window.KYV_CREATIVE_FUNNEL_V242;
const projects=[
 {ID:1,TITOLO:'Brano uscito indicato',ARTISTA:'A',FEE:'0,00',STATO:'USCITA',SVILUPPO:'FINITA'},
 {ID:2,TITOLO:'Bozza',ARTISTA:'B',FEE:'0,00',STATO:'BOZZA',Data_Sessione:'2026-03-01'},
 {ID:3,TITOLO:'Provino',ARTISTA:'C',FEE:'0,00',STATO:'PROVINATA DA MEW'},
 {ID:4,TITOLO:'Uscita datata',ARTISTA:'D',FEE:'0,00',STATO:'USCITA',Data_Pubblicazione:'2026-06-15',Data_Sessione:'2026-01-01'},
 {ID:5,TITOLO:'Altro',ARTISTA:'E',FEE:'0,00',STATO:'ACUSTICA'},
 {ID:6,TITOLO:'Con fee positiva',ARTISTA:'A',FEE:'1500,00',STATO:'USCITA'},
 {ID:7,TITOLO:'Fee non compilata',ARTISTA:'F',FEE:null,STATO:'DEMO'}
];
const f=c.analyze(projects);
assert.equal(f.total,7);
assert.equal(f.zeroFee,5);
assert.equal(f.positiveFee,1);
assert.equal(f.missingFee,1);
assert.equal(f.zeroByStage.releaseLabeled,1);
assert.equal(f.zeroByStage.publicationDated,1);
assert.equal(f.zeroByStage.developing,1);
assert.equal(f.zeroByStage.pitched,1);
assert.equal(f.zeroByStage.notClassified,1);
assert.equal(f.datedSessions,2);
assert.equal(f.datedReleases,1);
assert.equal(f.conversionReliable,false);
assert.equal(f.conversion,null,'No fictional conversion with 2 dated sessions');
assert.equal(c.stage(projects[0]).releasedLabel,true);
assert.equal(c.stage(projects[0]).explicitRelease,false,'USCITA is not a bank/publication date');
assert.equal(c.stage(projects[2]).key,'proposta_o_ascolto');
assert.equal(c.money('1.250,00'),1250);
assert.equal(c.money(null),null);
assert.equal(f.examples('proposta_o_ascolto').length,1);
const a=window.KYV_ANALYST_V241.build({projects,invoices:[],payments:[],paymentReversals:[],rights:[],allocations:[],allocationReversals:[]},'2026-10-30');
assert.equal(a.reasons.zeroFee,5);
assert.equal(a.reasons.feePromisedNotBilled,1,'Zero fees do not create fee-payment reminders');
assert.equal(a.funnel.zeroFee,5);
assert.equal(a.results.stats.invoiceTotal,0);
const q=window.KYV_ANALYST_V241.answer(a,'Quante sessioni con fee zero sono uscite o restano in bozza?');
assert.equal(q.title,'Sessioni creative e progetti con fee zero');
assert.match(q.summary,/5 progetti/);
assert.equal(q.metrics[0].value,5);
assert.equal(q.metrics[3].value,'Non calcolabile');
assert.ok(q.notes.some(x=>x.includes('non è un insoluto')),'Normal creative exploration explained');
assert.ok(q.items.some(x=>x.label.includes('Brano uscito indicato')));
const other=window.KYV_ANALYST_V241.answer(a,'Quali progetti sono senza entrate documentate?');
assert.ok(other.notes.some(x=>x.includes('FEE=0')));
assert.equal(window.KYV_ANALYST_V241.answer(a,'Quali royalties devo attribuire?').title,'Royalties e diritti collegati');
const page=read('kyv_analyst.html'),ui=read('kyv-analyst-ui-v241.js'),returns=read('kyv_ritorni_progetti.html'),sw=read('sw.js'),pkg=JSON.parse(read('package.json'));
assert.ok(page.includes('kyv-creative-funnel-v242.js'));
assert.ok(page.includes('creative-funnel-metrics'));
assert.ok(ui.includes('report.funnel')&&ui.includes('creative-funnel-metrics'));
assert.ok(ui.includes('Quante sessioni creative con fee zero'));
assert.ok(returns.includes('Una sessione con FEE=0'));
assert.ok(sw.includes('kyv-studio-v2-59-unified-music-20261104'));
assert.ok(sw.includes("'./kyv-creative-funnel-v242.js'"));
assert.equal(pkg.scripts['check:creative-funnel-v242'],'node tools/test-creative-funnel-v242.js');
assert.ok(pkg.scripts.check.includes('check:creative-funnel-v242'));
assert.doesNotMatch(ui,/\.insert\(|\.upsert\(|\.update\(|\.delete\(/,'Analyst stays read-only');
console.log('OK: KYV Analyst v2.42 normal exploratory sessions, no fake conversion, no fabricated fees or lost hours');
