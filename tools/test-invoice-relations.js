const assert=require('node:assert/strict');const fs=require('fs');
const sheet=fs.readFileSync('scheda_progetto.html','utf8');
const invoices=fs.readFileSync('kyv-project-invoices.js','utf8');
const finance=fs.readFileSync('kyv-project-finance-summary.js','utf8');
const economy=fs.readFileSync('kyv-economy-v6.js','utf8');
const quality=fs.readFileSync('kyv-data-quality.js','utf8');
const relations=require('../kyv-project-relations.js');

assert.ok(sheet.includes("safeProjectRows('FATTURE',p.ID,'ID_FT',issues)"),'Scheda must link by FATTURE.ID_PROGETTO');
assert.ok(sheet.includes("q=>q.eq('ID_FT',p.IDFT)"),'Scheda must support PROGETTI.IDFT → FATTURE.ID_FT');
assert.ok(sheet.includes('KYV_PROJECT_RELATIONS.resolveProjectInvoices'),'Scheda must delegate relation precedence to the shared resolver');
assert.ok(sheet.includes("has(p.IDFT)?safeFilteredTable('FATTURE',q=>q.eq('ID_FT',p.IDFT),'ID_FT',500,issues)"),'Scheda must read the stable legacy invoice ID');
assert.ok(sheet.includes('function matchFatture(){ return state.fatture||[]; }'),'Scheda must consume the resolved set without reinterpreting it');
assert.doesNotMatch(sheet,/eq\('Numero',p\.FT\)/,'Scheda must never join project to invoice number');
assert.doesNotMatch(sheet,/fattureByNumero/,'Scheda must not load invoices by number');
assert.ok(sheet.includes('data-invoice-id="${H(f.ID_FT)}"'),'Invoice rows must expose stable ID_FT');

assert.ok(invoices.includes("select('ID,IDFT')"),'Producer invoice module must read IDFT only as legacy ID relation');
assert.equal((invoices.match(/KYV_PROJECT_RELATIONS\.resolveProjectInvoices/g)||[]).length,2,'Context and project list must use the same resolver');
assert.ok(invoices.includes("row.dataset.invoiceId"),'Invoice row opening must use ID_FT');
assert.doesNotMatch(invoices,/eq\('Numero',project\.FT\)/,'Producer invoice module must not query by invoice number');
assert.doesNotMatch(invoices,/legacy\.FT/,'Project lists must not match legacy FT to Numero');

assert.ok(finance.includes(".eq('ID_PROGETTO',pid)"),'Finance summary must use project ID relation');
assert.ok(finance.includes('text(projectRow.IDFT)'),'Finance summary must include the stable legacy invoice ID among candidate documents');
assert.ok(finance.includes('KYV_PROJECT_RELATIONS.resolveProjectInvoices'),'Finance summary must use the shared precedence rules');
assert.doesNotMatch(finance,/eq\('Numero',project\.data\.FT\)/,'Finance summary must not query invoice number');

assert.ok(economy.includes('KYV_PROJECT_RELATIONS.resolveProjectInvoices'), 'Economy must use the shared resolver');
const projectInvoices=(project,invoices,allocations=[])=>relations.resolveProjectInvoices({project,invoices,allocations});
const rows=[{ID_FT:86,ID_PROGETTO:86,Numero:7},{ID_FT:93,ID_PROGETTO:null,Numero:12},{ID_FT:94,ID_PROGETTO:2,Numero:7}];
assert.deepEqual(projectInvoices({ID:86,IDFT:93,FT:12},rows).map(row=>row.ID_FT),[86,93],'Distinct direct and legacy invoices both belong in summary');
assert.deepEqual(projectInvoices({ID:11,IDFT:93,FT:12},rows).map(row=>row.ID_FT),[93],'Valid legacy IDFT remains available');
assert.deepEqual(projectInvoices({ID:19,FT:7},rows),[],'FT-only projects must not match by invoice number');
const shared=projectInvoices({ID:11,IDFT:94},rows);
assert.equal(shared.length,1);
assert.equal(shared[0]._kyvRelation.kind,'idft-shared','A foreign IDFT remains visible only as a zero-value allocation warning');
assert.doesNotMatch(economy,/text\(p\.FT\)/,'Economy must not relate by FT number');

assert.ok(quality.includes("key:'invoice-number-only'"),'Data Quality must flag projects left with FT number only');
assert.ok(quality.includes("key:'invoice-id-conflict'"),'Data Quality must flag inconsistent stable invoice IDs');
assert.ok(quality.includes('FT/Numero non è una chiave stabile'), 'Data Quality must explain annual invoice number ambiguity');


const manualPage=fs.readFileSync('fatture.html','utf8');
const editor=fs.readFileSync('kyv-record-editor.js','utf8');
assert.match(finance,/function currentProject\(pid\)/,'The completion prompt must refer to the currently selected project');
assert.match(finance,/data-kyv-finance-new>Crea fattura collegata/,'Completed projects should offer a contextual invoice action');
assert.match(finance,/const register=pending\?'':'/,'The reminder must not duplicate the create action');
assert.match(finance,/Aggiungi quota a fattura esistente \/ Duplica riga/,'Invoice allocations must be accessible from project finance summary');
assert.match(finance,/fatture\.html\?ripartizione_progetto=/,'Invoice split editor must preserve project context');
assert.match(manualPage,/function renderManualInvoiceHelp/,'Invoice register must guide manual assignment');
assert.match(manualPage,/Ripartisci \/ Duplica riga/,'Invoice register must offer multi-project split entry');
assert.match(manualPage,/data-kyv-new-table="FATTURE"/,'The manual creation button must be retained');
assert.match(editor,/fieldsRoot\.querySelectorAll\('\.dyn-record-input'\)/,'The saved invoice must include the contextually preselected relation');
assert.match(invoices,/if\(!setField\('ID_PROGETTO',projectId\)\)throw/,'Contextual creation must fail closed when ID cannot be set');
assert.match(invoices,/projectInput\.disabled=true/,'The contextual relation must not be editable during creation');
const completedSource=finance.match(/function completedProject\(project\)\{[^\n]+\}/)?.[0];
const awaitingSource=finance.match(/function awaitingInvoice\(project,rows\)\{[^\n]+\}/)?.[0];
assert.ok(completedSource&&awaitingSource,'Completion logic must be independently testable');
const awaitingInvoice=new Function('text',completedSource+'\n'+awaitingSource+'\nreturn awaitingInvoice;')(value=>String(value??'').trim());
for(const status of ['Pubblicato','Chiusa','Completato','Finita'])
  assert.equal(awaitingInvoice({ID:19,STATO:status},[]),true,status+' must trigger a reminder');
for(const status of ['In corso','Da completare','Non completato',''])
  assert.equal(awaitingInvoice({ID:19,STATO:status},[]),false,status+' must not trigger a reminder');
assert.equal(awaitingInvoice({ID:19,STATO:'Completato'},[{ID_FT:86,ID_PROGETTO:19}]),false,'An existing invoice must suppress the reminder');
assert.equal(awaitingInvoice({ID:19,STATO:'Completato'},null),false,'A failed invoice read cannot be treated as missing invoice');
assert.equal(awaitingInvoice(null,[]),false,'Unloaded project cannot trigger a reminder');
assert.doesNotMatch(finance,/\.from\(['"](?:FATTURE|PROGETTI)['"]\)\s*\.(?:insert|update|upsert|delete)\(/,'Completion prompts must remain read-only');
assert.equal((finance.match(/new MutationObserver/g)||[]).length,1,'Do not add another MutationObserver');

assert.ok(invoices.includes(".from('FATTURE_RIPARTIZIONI')"),'Project invoice links read explicit allocations');
assert.ok(finance.includes(".from('FATTURE_RIPARTIZIONI')"),'Finance summary reads explicit allocations');
console.log('OK: project invoice relations use explicit allocations and stable IDs only; Numero is display-only.');
