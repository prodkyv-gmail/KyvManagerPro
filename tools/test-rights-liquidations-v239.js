const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const engine=fs.readFileSync('kyv-intelligence-engine-v238.js','utf8');
const w={};vm.runInNewContext(fs.readFileSync('kyv-siae-amount.js','utf8'),{window:w,Number,Map,Set,Date,Math,Error});vm.runInNewContext(engine,{window:w,Number,Map,Set,Date,Math,Error});
const rows={invoices:[{ID_FT:1,Data:'2026-03-03',PrezzoUnitario:'1000',PAGATA:'SI'}],rightsLiquidations:[
{Ente:'SIAE',DataAccredito:'2026-07-15',ImportoNetto:350.5},
{Ente:'NUOVO IMAIE',DataAccredito:'2026-08-11',ImportoNetto:180},
{Ente:'INVALID',DataAccredito:'2026-09-11',ImportoNetto:10000}
],siaes:[{DATA:'2026-07-15',IMPORTO:'-350,50'}]};
const result=w.KYV_INTELLIGENCE_ENGINE.compute(rows,'monthly');
assert.equal(result.totals.billed,1000);
assert.equal(result.totals.legacyUndated,1000);
assert.equal(result.totals.rightsCash,530.5);
assert.equal(result.totals.rightsCount,2);
assert.equal(result.totals.verifiedCash,0);
assert.equal(result.rows.find(x=>x.period==='2026-07').rightsCash,35050);
assert.equal(result.rows.find(x=>x.period==='2026-07').siaeProvisional,35050);
assert.equal(result.rows.find(x=>x.period==='2026-03').billed,100000);
const page=fs.readFileSync('kyv_liquidazioni.html','utf8');
const app=fs.readFileSync('kyv-rights-liquidations-v239.js','utf8');
const dash=fs.readFileSync('kyv_intelligence.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.ok(app.includes("window.confirm("));
assert.ok(app.includes("DataAccredito")&&app.includes("ImportoNetto"));
assert.ok(app.includes("KYV_LIQUIDAZIONI_DIRITTI"));
assert.ok(!app.includes(".delete(")&&!app.includes(".update("));
assert.ok(page.includes("NUOVO IMAIE")&&page.includes("SIAE"));
assert.ok(dash.includes("KYV_LIQUIDAZIONI_DIRITTI")&&dash.includes("rightsCash"));
assert.ok(dash.includes("kyv_liquidazioni.html"));
assert.ok(sw.includes("kyv-studio-v2-57-audio-audit-20261104"));
assert.ok(sw.includes("'./kyv_liquidazioni.html'"));
console.log('OK: rights bank transfers separately tracked, provisional SIAE not duplicated');
