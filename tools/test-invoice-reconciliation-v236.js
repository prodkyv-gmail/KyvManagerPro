// KYVManagerPro v2.36 — regressioni riconciliazione e incassi.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('kyv-invoice-reconciliation-v236.js','utf8');
const html=fs.readFileSync('fatture.html','utf8');
const economy=fs.readFileSync('kyv-economy-v6.js','utf8');
const editor=fs.readFileSync('kyv-record-editor.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const window={KYV:{
  parseNumber(raw){let s=String(raw??'').trim();return Number(s.includes(',')?s.replace(/\./g,'').replace(',','.'):s)||0;},
  isPaid(v){return /^(si|sì|yes|true|pagat)/i.test(String(v??''));},
  formatEuro:n=>String(n)
}};
vm.runInNewContext(source,{window,console,Intl,Date,Number}, {filename:'kyv-invoice-reconciliation-v236.js'});
const api=window.KYV_COLLECTIONS_V236;
assert.ok(api?.boot&&api?.summarize&&api?.paymentState,'Public module must boot');
assert.ok(source.includes("FATTURE_INCASSI")&&source.includes("DataScadenzaPagamento"),'Explicit collections and dates');
assert.ok(source.includes("count:'exact'")&&source.includes("MAX_ROWS"),'Full paginated reads');
assert.ok(source.includes("if(res.data?.length!==1)"),'Relation update should check result count');
assert.ok(source.includes(".is('ID_PROGETTO',null)"),'Do not overwrite previously linked invoice');
assert.ok(source.includes("legacyProjectIds(invoice,state.projects).length"),'Legacy linked invoice must not be remapped blindly');
assert.ok(source.includes("const fresh=summarize(invoiceRes.data,freshPayments,reversalRes.data||[])"),'Always refresh amount before payment');
assert.ok(source.includes("if(amountCents>cents(fresh.remaining))"),'Overpayment guard');
assert.ok(source.includes("if(fresh.legacyPaid)"),'Do not add movements to legacy paid invoice');
assert.ok(source.includes("window.confirm("),'Manual confirmation before write');
assert.doesNotMatch(source,/new\s+MutationObserver\s*\(/,'Do not add new observers');
assert.ok(html.includes('kyv-invoice-reconciliation-v236.js'),'Invoice register loads reconciliation');
assert.ok(html.includes("KYV_COLLECTIONS_V236?.boot"),'Use authenticated client');
assert.ok(html.includes("KYV_COLLECTIONS_V236?.paymentState(f)"),'Register amounts must incorporate partial collections');
assert.ok(html.includes('data-kyv-new-table="FATTURE"'),'Manual new invoice preserved');
assert.ok(html.includes('kyv-aruba-import.js'),'Aruba importer preserved');
assert.ok(economy.includes('KYV_COLLECTIONS_V236?.paymentState(f)'),'Financial dashboard must use collected amount');
assert.ok(editor.includes("DataScadenzaPagamento"),'Manual due date editor preserved');
assert.ok(sw.includes("'./kyv-invoice-reconciliation-v236.js'"),'PWA includes module');

const row=(id,total,PAGATA='NO',date=null)=>({ID_FT:id,ImportoTotaleDocumento:total,PrezzoUnitario:total,PAGATA,DataScadenzaPagamento:date});
const partial=api.summarize(row(1,'1068,41'),[{ID_FT:1,Importo:'500.00',Data:'2026-10-01'}]);
assert.equal(partial.total,1068.41);assert.equal(partial.received,500);assert.equal(partial.remaining,568.41);
assert.equal(partial.kind,'partial');
assert.equal(api.summarize(row(1,'1068,41'),[{ID_FT:1,Importo:'1068.41'}]).kind,'paid');
assert.equal(api.summarize(row(1,'1068,41'),[]).kind,'open');
const historic=api.summarize(row(9,'4.000,00','SI'),[]);
assert.equal(historic.total,4000);assert.equal(historic.received,4000);assert.equal(historic.kind,'paid');
assert.equal(historic.legacyPaid,true);
assert.equal(api.summarize(row(9,'4.000,00','SI'),[{ID_FT:9,Importo:120}]).remaining,3880,'Payment ledger wins over legacy text only if movements exist');
assert.equal(api.summarize(row(7,'100.00'),[{ID_FT:7,Importo:110}]).overpaid,true,'Flag overpayment inconsistencies');
const projects=[{ID:31,IDFT:'12',STATO:'USCITA',FEE:'1500',TITOLO:'Song A'},{ID:32,IDFT:null,STATO:'BOZZA',FEE:'1500'},{ID:33,IDFT:null,STATO:'Pubblicato',FEE:'2000'}];
const invoices=[{ID_FT:12,ID_PROGETTO:null},{ID_FT:13,ID_PROGETTO:33}];
assert.deepEqual(Array.from(api.legacyProjectIds(invoices[0],projects)),['31'],'Legacy IDFT is associated by ID only');
assert.equal(api.projectLinked(invoices[0],projects),'31');
assert.equal(api.projectLinked(invoices[1],projects),'33');
assert.equal(api.potentialUnbilled(projects,invoices).length,0,'Legacy or direct invoice prevents false missing-payment flags');
assert.equal(api.closed({STATO:'NON PUBBLICATO',SVILUPPO:'demo'}),false);
assert.equal(api.closed({STATO:'USCITA'}),true);
console.log('OK: v2.36 safe reconciliation, historical payment preservation, installments and totals');
