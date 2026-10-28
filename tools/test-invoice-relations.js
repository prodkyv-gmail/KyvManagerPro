const assert=require('node:assert/strict');const fs=require('fs');
const sheet=fs.readFileSync('scheda_progetto.html','utf8');
const invoices=fs.readFileSync('kyv-project-invoices.js','utf8');
const finance=fs.readFileSync('kyv-project-finance-summary.js','utf8');
const economy=fs.readFileSync('kyv-economy-v6.js','utf8');
const quality=fs.readFileSync('kyv-data-quality.js','utf8');

assert.ok(sheet.includes("safeProjectRows('FATTURE',p.ID,'ID_FT')"),'Scheda must link by FATTURE.ID_PROGETTO');
assert.ok(sheet.includes("q=>q.eq('ID_FT',p.IDFT)"),'Scheda must support PROGETTI.IDFT → FATTURE.ID_FT');
assert.ok(sheet.includes("mergeRows([fattureByProject,fattureById],'ID_FT')"),'Scheda must union both stable ID relation directions');
assert.doesNotMatch(sheet,/eq\('Numero',p\.FT\)/,'Scheda must never join project to invoice number');
assert.doesNotMatch(sheet,/fattureByNumero/,'Scheda must not load invoices by number');
assert.ok(sheet.includes('data-invoice-id="${H(f.ID_FT)}"'),'Invoice rows must expose stable ID_FT');

assert.ok(invoices.includes("select('ID,IDFT')"),'Producer invoice module must read IDFT only as legacy ID relation');
assert.ok(invoices.includes("Promise.all([fetchDirectInvoices(projectId),fetchLegacyInvoices(projectId)])"),'Producer invoice module must union direct ID and IDFT links');
assert.ok(invoices.includes("text(row.ID_FT)===text(legacy.IDFT)"),'Project lists must use IDFT → ID_FT');
assert.ok(invoices.includes("row.dataset.invoiceId"),'Invoice row opening must use ID_FT');
assert.doesNotMatch(invoices,/eq\('Numero',project\.FT\)/,'Producer invoice module must not query by invoice number');
assert.doesNotMatch(invoices,/legacy\.FT/,'Project lists must not match legacy FT to Numero');

assert.ok(finance.includes(".eq('ID_PROGETTO',pid)"),'Finance summary must use project ID relation');
assert.ok(finance.includes(".eq('ID_FT',project.data.IDFT)"),'Finance summary must use legacy invoice ID relation');
assert.doesNotMatch(finance,/eq\('Numero',project\.data\.FT\)/,'Finance summary must not query invoice number');

assert.ok(economy.includes('const direct=invoices.filter'), 'Economy must include FATTURE.ID_PROGETTO relation');
assert.ok(economy.includes('const byInvoiceId=idft?invoices.filter'), 'Economy must include IDFT → ID_FT relation');
assert.doesNotMatch(economy,/text\(p\.FT\)/,'Economy must not relate by FT number');

assert.ok(quality.includes("key:'invoice-number-only'"),'Data Quality must flag projects left with FT number only');
assert.ok(quality.includes('FT/Numero non è una chiave stabile'), 'Data Quality must explain annual invoice number ambiguity');

console.log('OK: invoice/project relations use stable IDs only; Numero is display-only.');
