// v2.81 financial reconciliation: unit amounts, active receipts, dated SIAE/IMAIE and safe UX.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const w={};
for(const path of ['kyv-invoice-line-amount.js','kyv-economy-audit-v281.js'])
 vm.runInNewContext(read(path),{window:w},{filename:path});
const audit=w.KYV_ECONOMY_AUDIT_V281;
assert.ok(audit?.analyze);
const raw={
 projects:[{ID:1,FEE:'1000',TITOLO:'Brano A'},{ID:2,FEE:'0',TITOLO:'Sessione esplorativa'},{ID:3,FEE:null}],
 invoices:[
  {ID_FT:10,PrezzoUnitario:'1.000,00',PrezzoTotale:'10.000',ImportoTotaleDocumento:'10.000',PAGATA:'NO'},
  {ID_FT:11,PrezzoUnitario:'500',PAGATA:'SI',XML_SHA256:'legacy'},
  {ID_FT:12,PrezzoUnitario:null,PAGATA:'NO'}
 ],
 invoiceSplits:[
  {id_ft:10,id_progetto:1,prezzo_unitario:'600'},
  {id_ft:10,id_progetto:2,prezzo_unitario:'300'},
  {id_ft:999,id_progetto:1,prezzo_unitario:'5'},
  {id_ft:10,id_progetto:999,prezzo_unitario:'0'}
 ],
 payments:[
  {ID_INCASSO:1,ID_FT:10,Data:'2026-03-01',Importo:'800'},
  {ID_INCASSO:2,ID_FT:10,Data:'2026-03-05',Importo:'400'},
  {ID_INCASSO:3,ID_FT:10,Data:'2026-03-06',Importo:'999'},
  {ID_INCASSO:4,ID_FT:12,Data:null,Importo:'30'},
  {ID_INCASSO:5,ID_FT:999,Data:'2026-03-04',Importo:'40'}
 ],
 paymentReversals:[{ID_INCASSO:3}],
 rights:[
  {ID_LIQUIDAZIONE:20,Ente:'SIAE',DataAccredito:'2026-04-01',ImportoNetto:'200'},
  {ID_LIQUIDAZIONE:21,Ente:'NUOVO IMAIE',DataAccredito:null,ImportoNetto:'100'},
  {ID_LIQUIDAZIONE:22,Ente:'NUOVO IMAIE',DataAccredito:'2026-05-01',ImportoNetto:'150'},
  {ID_LIQUIDAZIONE:23,Ente:'SIAE',DataAccredito:null,ImportoNetto:'300'}
 ],
 allocations:[
  {ID_ATTRIBUZIONE:1,ID_LIQUIDAZIONE:20,ID_PROGETTO:1,Importo:'120'},
  {ID_ATTRIBUZIONE:2,ID_LIQUIDAZIONE:20,ID_PROGETTO:1,Importo:'100'},
  {ID_ATTRIBUZIONE:3,ID_LIQUIDAZIONE:22,ID_PROGETTO:1,Importo:'50'},
  {ID_ATTRIBUZIONE:4,ID_LIQUIDAZIONE:22,ID_PROGETTO:999,Importo:'20'},
  {ID_ATTRIBUZIONE:5,ID_LIQUIDAZIONE:999,ID_PROGETTO:1,Importo:'30'},
  {ID_ATTRIBUZIONE:6,ID_LIQUIDAZIONE:20,ID_PROGETTO:1,Importo:'900'}
 ],
 allocationReversals:[{ID_ATTRIBUZIONE:6}]
};
const report={
 results:{stats:{invoiceTotal:1500,unallocatedInvoiceLines:1}},
 feePromisedNotBilled:[{ID:1}],projects:[{ID:1,fee:1000},{ID:2,fee:0},{ID:3,fee:0}]
};
const original=JSON.stringify(raw);
const a=audit.analyze(raw,report);
assert.equal(a.invoice.registered,1500,'Only unit rows; not XML repeated total');
assert.equal(a.invoice.lines,3);
assert.equal(a.invoice.missingUnit,1,'Missing/invalid unit must be flagged, not copied from XML');
assert.equal(a.invoice.splitMismatch,1);
assert.equal(a.invoice.splitUnknownInvoice,1);
assert.equal(a.invoice.splitUnknownProject,1);
assert.equal(a.invoice.unlinked,1);
assert.equal(a.cash.activePayments,3,'Reversed receipt and orphan excluded from valid invoice movements');
assert.equal(a.cash.overpayments,1,'Active payments 800+400 exceed 1000');
assert.equal(a.cash.dated,1000,'Receipt total capped at original invoice-line amount');
assert.equal(a.cash.legacyPaidUndated,1,'PAGATA without movement has no known bank date');
assert.equal(a.cash.withoutDate,1);
assert.equal(a.cash.undatedMovement,0,'Invalid invoice unit cannot create historical cash amount');
assert.equal(a.cash.unknownInvoice,1);
assert.equal(a.rights.SIAE,200);
assert.equal(a.rights.IMAIE,150,'Undated IMAIE 100 excluded from received');
assert.equal(a.rights.credited,350,'Undated SIAE 300 also excluded from received');
assert.equal(a.rights.attributed,250,'Only recorded dated rights, capped at net; reversed ignored');
assert.equal(a.rights.unallocated,100);
assert.equal(a.rights.undatedCount,2);
assert.equal(a.rights.undatedAmount,400);
assert.equal(a.rights.overallocated,1,'More allocated than liquidation net flagged, never auto-fixed');
assert.equal(a.rights.orphanAttributions,2);
assert.equal(a.fee.positiveUnbilled,1);
assert.equal(a.fee.zero,1,'Null fee must not be misclassified as zero');
assert.ok(a.issues.some(x=>x.type==='split-mismatch'));
assert.ok(a.issues.some(x=>x.type==='payment-excess'));
assert.ok(a.issues.some(x=>x.type==='rights-undated'));
assert.ok(a.issues.some(x=>x.type==='fee-advisory'));
assert.ok(a.issues.every(x=>x.url===null||['fatture.html','progetti.html','kyv_liquidazioni.html'].includes(x.url)));
assert.ok(a.caveats.join(' ').includes('ESTRATTO SIAE'));
assert.ok(a.caveats.join(' ').includes('utile netto'));
assert.equal(JSON.stringify(raw),original,'Audits must never mutate input data');
const b=audit.analyze({
 projects:[{ID:2,FEE:0}],invoices:[{ID_FT:101,PrezzoUnitario:100,PAGATA:'SI'}],
 rights:[{ID_LIQUIDAZIONE:201,Ente:'SIAE',ImportoNetto:'500',DataAccredito:null}]
},{results:{stats:{invoiceTotal:100}}});
assert.equal(b.rights.credited,0,'No right received without verified DataAccredito');
assert.equal(b.rights.unallocated,0,'Undated rights do not become unpaid credits');
assert.equal(b.cash.dated,0,'Legacy flag does not produce fabricated dated payments');
assert.equal(b.cash.legacyPaidUndated,1);
assert.equal(b.fee.zero,1);
const page=read('kyv_analyst.html'),ui=read('kyv-analyst-ui-v241.js'),engine=read('kyv-analyst-engine-v241.js'),sw=read('sw.js');
assert.equal((page.match(/id="analyst-economic-audit"/g)||[]).length,1,'Keep one collapsible audit in Analyst');
for(const key of ['analyst-audit-summary','analyst-audit-stats','analyst-audit-list','analyst-audit-limit','analyst-audit-caveats'])
 assert.ok(page.includes('id="'+key+'"'),key+' missing');
assert.ok(page.includes('kyv-economy-audit-v281.js'));
assert.ok(ui.includes('economyAudit=AUDIT.analyze(payload,report)'),'Reuse the same fully loaded, verified records');
assert.ok(ui.includes('const rightsQuestion=')&&ui.includes('rightsAuditAnswer()'),'Correct operational royalty question without changing legacy engine');
assert.ok(ui.includes('economyAudit?.rights.unallocated??stats.rightsNotAllocated'),'Show received-based rights in main KPI');
assert.ok(ui.includes('renderEconomicAudit();'));
assert.ok(ui.includes("x.id==='rights'&&economyAudit"),'Priority must use date-verified amounts');
assert.doesNotMatch(read('kyv-economy-audit-v281.js'),/\.from\(|\.insert\(|\.update\(|\.delete\(|fetch\(|localStorage|MutationObserver/,'Pure audit must not query or mutate database');
assert.doesNotMatch(ui,/\.insert\(|\.update\(|\.upsert\(|\.delete\(|localStorage/,'Analyst remains read-only');
assert.ok(engine.includes('KYV_PROJECT_RETURNS_V240.analyze(raw)'),'Legacy financial engine and source-of-truth unchanged');
assert.ok(read('kyv-siae-amount.js').includes('return n===null?null:(n===0?0:-n)'),'Original SIAE sign interpretation unchanged');
assert.ok(read('guida.html').includes('id="v281-economy"'));
assert.ok(read('kyv-help.js').includes('v2.81 · Coerenza economica e diritti'));
assert.ok(read('docs/V281_ECONOMY_AUDIT_QA.md').includes('Controllo KYV Analyst'));
assert.equal(read('VERSION').trim(),'2.81');
assert.equal(require('../package.json').version,'2.81.0');
assert.ok(read('config.js').includes("APP_VERSION: '2.81'"));
assert.ok(sw.includes("'./kyv-economy-audit-v281.js'"));
assert.ok(sw.includes('kyv-studio-v2-81-economy-audit-20261105'));
assert.ok(require('../package.json').scripts.check.includes('check:economy-audit-v281'));
console.log('OK v2.81: invoice unit sums, payments, reversals, dated SIAE/IMAIE credits, fee zero and read-only analyst');
