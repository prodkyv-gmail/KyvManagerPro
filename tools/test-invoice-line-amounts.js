// Regression: historical invoice line items are distinct project fees,
// NOT repeated document totals. XML Aruba retains total fiscal and multi-line details separately from the unitary value.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};
const file=name=>fs.readFileSync(name,'utf8');
vm.runInNewContext(file('kyv-invoice-line-amount.js'),{window,Number,Object});
const api=window.KYV_INVOICE_LINE;
assert.ok(api?.amount&&api?.cents&&api?.info);
const old={ID_FT:86,Numero:13,Data:'2025-12-04',ImportoTotaleDocumento:'16662,00',PrezzoUnitario:'2800,00',PrezzoTotale:'0,00'};
assert.equal(api.amount(old),2800);
assert.equal(api.info(old).source,'PrezzoUnitario');
assert.equal(api.info(old).documentTotal,16662);
assert.equal(api.amount({...old,PrezzoUnitario:'0'}),0);
assert.equal(api.info({...old,PrezzoUnitario:null}).valid,false);
assert.equal(api.amount({...old,PrezzoUnitario:null}),0,'No fallback to duplicated document total');
assert.equal(api.amount({...old,PrezzoUnitario:'-3'}),0);
const eight=[2800,1600,1200,2500,960,3000,3000,1600].map((n,i)=>({...old,ID_FT:86+i,PrezzoUnitario:String(n)}));
assert.equal(eight.reduce((sum,row)=>sum+api.amount(row),0),16660,'Same invoice eight lines, sum item compensation');
assert.notEqual(eight.reduce((sum,row)=>sum+api.amount(row),0),16662*8,'Never sum document total eight times');
const xml={ID_FT:999,Numero_Originale:'FPR 14/26',Data:'2026-10-26',XML_SHA256:'a'.repeat(64),PrezzoUnitario:'1000.00',PrezzoTotale:'3500.00',ImportoTotaleDocumento:'3502.00',PAGATA:'NO'};
assert.equal(api.amount(xml),1000,'XML must also use PrezzoUnitario, never PrezzoTotale or fiscal total');
assert.equal(api.info(xml).source,'PrezzoUnitario');
assert.equal(api.info({...xml,PrezzoTotale:null}).valid,true,'PrezzoTotale does not govern managerial revenue');
assert.equal(api.parse('1.068,41'),1068.41);
assert.equal(api.parse('1,068.41'),1068.41);
// verify the arithmetic engine and reversal ledger agree with canonical row amounts
vm.runInNewContext(file('kyv-intelligence-engine-v238.js'),{window,Number,Date,Intl,Map,Set,Math,Error});
const eng=window.KYV_INTELLIGENCE_ENGINE;
let calc=eng.compute({invoices:eight,projects:[],payments:[],reversals:[],siaes:[]},'annual');
assert.equal(calc.totals.billed,16660);
assert.equal(calc.rows.find(x=>x.period==='2025').billed,1666000);
calc=eng.compute({invoices:[xml],projects:[],payments:[],reversals:[],siaes:[]},'annual');
assert.equal(calc.totals.billed,1000);
// Payment state per line: no duplicated document cash total.
const reconciliationWindow={KYV_INVOICE_LINE:api,KYV:{parseNumber:api.parse,isPaid:v=>/^si$/i.test(v),formatEuro:v=>String(v)}};
vm.runInNewContext(file('kyv-invoice-reconciliation-v236.js'),{window:reconciliationWindow,Date,Intl,Number,Math,Set,Map});
const summary=reconciliationWindow.KYV_COLLECTIONS_V236.summarize({...old,PAGATA:'SI'},[],[]);
assert.equal(summary.total,2800);
assert.equal(summary.received,2800);
assert.equal(reconciliationWindow.KYV_COLLECTIONS_V236.summarize(xml,[],[]).remaining,1000);
for(const path of ['kyv-economy-v6.js','kyv-project-invoices.js','kyv-project-finance-summary.js','fatture.html']){
 assert.ok(file(path).includes('KYV_INVOICE_LINE'),path+' must use central line amount');
}
const intelligent=file('kyv_intelligence.html');
assert.ok(intelligent.includes('kyv-invoice-line-amount.js'));
assert.ok(intelligent.includes('ID_PROGETTO,XML_SHA256'));
assert.ok(intelligent.includes('voci fattura'));
assert.ok(file('config.js').includes("invoiceLines.src='kyv-invoice-line-amount.js'"));
assert.ok(file('sw.js').includes("'./kyv-invoice-line-amount.js'"));
console.log('OK: project/line revenue, XML unitary amounts, historical no-duplication and payment safety');
