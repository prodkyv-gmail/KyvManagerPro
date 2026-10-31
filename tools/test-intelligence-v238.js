const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync('kyv-intelligence-engine-v238.js','utf8'),window={};
vm.runInNewContext(fs.readFileSync('kyv-siae-amount.js','utf8'),{window});
vm.runInNewContext(s,{window});
const a=window.KYV_INTELLIGENCE_ENGINE;
const f=(id,date,total,PAGATA='NO',project=null)=>({ID_FT:id,Data:date,ImportoTotaleDocumento:total,PrezzoUnitario:total,PAGATA,ID_PROGETTO:project});
const rows={
 invoices:[f(1,'2024-12-10','1.200,00','SI'),f(2,'2025-01-10','500,00','NO',7),f(3,'2026-01-03','200.50','NO')],
 projects:[{ID:7,STATO:'USCITA',FEE:'500',Data_Sessione:null},{ID:8,STATO:'BOZZA',FEE:'',Data_Sessione:'2026-01-01'}],
 payments:[{ID_INCASSO:10,ID_FT:2,Importo:200,Data:'2025-03-20'},{ID_INCASSO:11,ID_FT:3,Importo:200.5,Data:'2026-02-01'}],
 reversals:[{ID_STORNO:12,ID_INCASSO:11,Data:'2026-03-01'}],
 siaes:[{DATA:'2025-09-30',IMPORTO:'-500,12',OPERAZIONE:'RIPARTIZIONE'},{DATA:'2025-09-30',IMPORTO:'100,00',OPERAZIONE:'ADDEBITO'}]
};
let result=a.compute(rows,'annual');
assert.equal(result.totals.billed,1900.5);
assert.equal(result.totals.received,1400);
assert.equal(result.totals.legacyUndated,1200);
assert.equal(result.totals.verifiedCash,200);
assert.equal(result.totals.unlinked,2);
assert.equal(result.rows.find(x=>x.period==='2025').verifiedCash,20000);
assert.equal(result.rows.find(x=>x.period==='2025').siaeProvisional,40012);
assert.equal(result.rows.find(x=>x.period==='2024').verifiedCash,0,'Legacy paid invoice has no verified bank date');
assert.equal(result.rows.find(x=>x.period==='2026').verifiedCash,0,'Reversed payment must not appear as paid');
assert.equal(result.coverage.withSession,1);
assert.equal(result.coverage.openWithNoFee,1);
result=a.compute(rows,'monthly');
assert.equal(result.rows.find(x=>x.period==='2025-01').billed,50000);
assert.equal(result.rows.find(x=>x.period==='2025-03').verifiedCash,20000);
assert.equal(result.rows.find(x=>x.period==='2025-09').siaeProvisional,40012);
assert.equal(a.parseAmount('1.068,41'),1068.41);
assert.equal(a.parseAmount('2,500.00'),2500);
assert.equal(a.parseAmount(''),null);
assert.throws(()=>a.compute(rows,'untrusted'));
const html=fs.readFileSync('kyv_intelligence.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
assert.ok(html.includes('kyv-intelligence-engine-v238.js')&&html.includes('ESTRATTO SIAE'));
assert.ok(html.includes('FATTURE_INCASSI_STORNI'));
assert.ok(html.includes('allRows(')&&html.includes("count:'exact'"));
assert.ok(html.includes("SIAE")&&html.includes("IMAIE"));
assert.ok(sw.includes("kyv-studio-v2-43-mobile-nav-cash-summary-20261031"));
assert.ok(sw.includes("'./kyv_intelligence.html'"));
assert.equal(packageJson.scripts['check:intelligence-v238'],'node tools/test-intelligence-v238.js');
console.log('OK: KYV Intelligence v2.38 month/year, cash provenance, SIAE separation and data coverage');
