const assert=require('node:assert/strict');const fs=require('fs');
const sheet=fs.readFileSync('scheda_progetto.html','utf8');
const invoices=fs.readFileSync('kyv-project-invoices.js','utf8');
const finance=fs.readFileSync('kyv-project-finance-summary.js','utf8');
const economy=fs.readFileSync('kyv-economy-v6.js','utf8');
const quality=fs.readFileSync('kyv-data-quality.js','utf8');

assert.ok(sheet.includes("safeProjectRows('FATTURE',p.ID,'ID_FT')"),'Scheda must link by FATTURE.ID_PROGETTO');
assert.ok(sheet.includes("q=>q.eq('ID_FT',p.IDFT)"),'Scheda must support PROGETTI.IDFT → FATTURE.ID_FT');
assert.ok(sheet.includes('const fatture=fattureByProject.length?fattureByProject:'),'Scheda must prefer direct invoices');
assert.ok(sheet.includes('!fattureByProject.length && has(p.IDFT)'),'Scheda must fetch legacy only when direct is missing');
assert.ok(sheet.includes('return direct.length?direct:'),'Scheda matches must prefer direct invoices');
assert.doesNotMatch(sheet,/eq\('Numero',p\.FT\)/,'Scheda must never join project to invoice number');
assert.doesNotMatch(sheet,/fattureByNumero/,'Scheda must not load invoices by number');
assert.ok(sheet.includes('data-invoice-id="${H(f.ID_FT)}"'),'Invoice rows must expose stable ID_FT');

assert.ok(invoices.includes("select('ID,IDFT')"),'Producer invoice module must read IDFT only as legacy ID relation');
assert.ok(invoices.includes('if(direct.length)return uniqueInvoices(direct);'),'Producer context must prefer direct invoices');
assert.ok(invoices.includes('direct.length?direct:byInvoiceId.filter'),'Producer list must prefer direct invoices');
assert.ok(invoices.includes('legacy.filter(row=>!text(row.ID_PROGETTO)'),'Producer legacy cannot override another project ID');
assert.ok(invoices.includes("text(row.ID_FT)===text(legacy.IDFT)"),'Project lists must use IDFT → ID_FT');
assert.ok(invoices.includes("row.dataset.invoiceId"),'Invoice row opening must use ID_FT');
assert.doesNotMatch(invoices,/eq\('Numero',project\.FT\)/,'Producer invoice module must not query by invoice number');
assert.doesNotMatch(invoices,/legacy\.FT/,'Project lists must not match legacy FT to Numero');

assert.ok(finance.includes(".eq('ID_PROGETTO',pid)"),'Finance summary must use project ID relation');
assert.ok(finance.includes(".eq('ID_FT',project.data.IDFT)"),'Finance summary must use legacy invoice ID relation');
assert.ok(finance.includes('if((direct.data||[]).length)return unique(direct.data);'),'Finance summary must prefer direct invoices');
assert.ok(finance.includes('legacy.data||[]).filter(row=>!text(row.ID_PROGETTO)'),'Finance fallback must reject cross-project links');
assert.doesNotMatch(finance,/eq\('Numero',project\.data\.FT\)/,'Finance summary must not query invoice number');

assert.ok(economy.includes('const direct=invoices.filter'), 'Economy must include FATTURE.ID_PROGETTO relation');
assert.ok(economy.includes('const byInvoiceId=idft?invoices.filter'), 'Economy must include IDFT → ID_FT relation');
assert.ok(economy.includes('return direct.length?direct:'),'Economy must prefer direct invoice IDs');
const fn=economy.match(/function projectInvoices\(p,invoices\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(fn,'Economy invoice resolver must be testable');
const projectInvoices=new Function('text',fn+'\nreturn projectInvoices;')(value=>String(value??'').trim());
const rows=[{ID_FT:86,ID_PROGETTO:86,Numero:7},{ID_FT:93,ID_PROGETTO:null,Numero:12},{ID_FT:94,ID_PROGETTO:2,Numero:7}];
assert.deepEqual(projectInvoices({ID:86,IDFT:93,FT:12},rows).map(row=>row.ID_FT),[86],'Direct project ID 86 wins over legacy 93');
assert.deepEqual(projectInvoices({ID:11,IDFT:93,FT:12},rows).map(row=>row.ID_FT),[93],'Valid legacy IDFT remains available');
assert.deepEqual(projectInvoices({ID:19,FT:7},rows),[],'FT-only projects must not match by invoice number');
assert.deepEqual(projectInvoices({ID:11,IDFT:94},rows),[],'An invoice owned by project 2 cannot be claimed by legacy IDFT');
assert.doesNotMatch(economy,/text\(p\.FT\)/,'Economy must not relate by FT number');

assert.ok(quality.includes("key:'invoice-number-only'"),'Data Quality must flag projects left with FT number only');
assert.ok(quality.includes("key:'invoice-id-conflict'"),'Data Quality must flag inconsistent stable invoice IDs');
assert.ok(quality.includes('FT/Numero non è una chiave stabile'), 'Data Quality must explain annual invoice number ambiguity');

console.log('OK: invoice/project relations use stable IDs only; Numero is display-only.');
