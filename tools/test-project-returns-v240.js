/* v2.40 project return calculations and security contract regressions */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=n=>fs.readFileSync(n,'utf8'),w={};
vm.runInNewContext(read('kyv-invoice-line-amount.js'),{window:w});
vm.runInNewContext(read('kyv-project-returns-v240.js'),{window:w});
const api=w.KYV_PROJECT_RETURNS_V240;assert.ok(api?.analyze);
const p=[
 {ID:1,TITOLO:'Brano A',ARTISTA:'Artista A',STATO:'USCITA',Data_Sessione:'2026-01-01',IDFT:null,FEE:'1000'},
 {ID:2,TITOLO:'Brano B',ARTISTA:'Artista B',STATO:'BOZZA',Data_Sessione:null,IDFT:'12',FEE:'600'},
 {ID:3,TITOLO:'Brano C',ARTISTA:'Artista C',STATO:'BOZZA',Data_Sessione:'2026-01-03',IDFT:null,FEE:''}
];
const invoices=[
 {ID_FT:11,ID_PROGETTO:1,PrezzoUnitario:'1000.00',ImportoTotaleDocumento:'1600.00',Data:'2026-02-01',PAGATA:'SI'},
 {ID_FT:12,ID_PROGETTO:null,PrezzoUnitario:'600.00',ImportoTotaleDocumento:'1600.00',Data:'2026-03-01',PAGATA:'NO'},
 {ID_FT:13,ID_PROGETTO:null,PrezzoUnitario:'200.00',ImportoTotaleDocumento:'1600.00',Data:'2026-03-01',PAGATA:'NO'}
];
const rights=[{ID_LIQUIDAZIONE:9,Ente:'SIAE',ImportoNetto:500,DataAccredito:'2026-02-01'},
 {ID_LIQUIDAZIONE:10,Ente:'NUOVO IMAIE',ImportoNetto:100,DataAccredito:'2026-04-01'}];
const allocations=[
 {ID_ATTRIBUZIONE:30,ID_LIQUIDAZIONE:9,ID_PROGETTO:1,Importo:300},
 {ID_ATTRIBUZIONE:31,ID_LIQUIDAZIONE:9,ID_PROGETTO:2,Importo:200},
 {ID_ATTRIBUZIONE:32,ID_LIQUIDAZIONE:10,ID_PROGETTO:3,Importo:50}
];
const source={projects:p,invoices,rights,allocations,
 allocationReversals:[{ID_ATTRIBUZIONE:31}],
 payments:[{ID_INCASSO:6,ID_FT:12,Data:'2026-04-01',Importo:200},{ID_INCASSO:7,ID_FT:12,Data:'2026-05-01',Importo:400}],
 paymentReversals:[{ID_INCASSO:7}]
};
let x=api.analyze(source),s=x.stats;
assert.equal(s.projects,3);
assert.equal(s.invoiceLines,3);
assert.equal(s.invoiceTotal,1800,'Sum line amounts, not repeated document totals');
assert.equal(s.unallocatedInvoiceLines,1,'Unlinked invoice remains unallocated');
assert.equal(s.legacyPaidUndated,1000,'Historical paid without bank date stays undated');
assert.equal(s.datedInvoiceCash,200,'Reversed payment is excluded');
assert.equal(s.rightsAllocated,350,'Reversed rights assignment is excluded');
assert.equal(s.rightsNotAllocated,250,'Remaining rights cannot appear in any project');
assert.equal(s.withReturnDate,2,'Only projects with a session and verified cash date');
const a=x.projects.find(y=>y.ID===1),b=x.projects.find(y=>y.ID===2),c=x.projects.find(y=>y.ID===3);
assert.equal(a.billed,1000);assert.equal(a.rightsCash,300);assert.equal(a.returnDays,31);
assert.equal(b.billed,600);assert.equal(b.datedCash,200);assert.equal(b.returnDays,null,'Unknown start remains null');
assert.equal(c.billed,0);assert.equal(c.rightsCash,50);assert.equal(c.returnDays,88);
assert.equal(s.meanDaysToFirstCash,60);
assert.equal(s.noKnownEconomicBasis,0,'Three projects all have billings or attributed rights');
const multiple=api.analyze({projects:[...p,{ID:4,IDFT:'12'}],invoices:[invoices[1]]});
assert.equal(multiple.stats.ambiguousInvoiceLines,1);
assert.equal(multiple.stats.unallocatedInvoiceLines,1);
assert.equal(multiple.projects.find(y=>y.ID===2).billed,0,'Ambiguous legacy link must not double count');
const xml=api.analyze({projects:p,invoices:[{ID_FT:20,ID_PROGETTO:3,XML_SHA256:'a'.repeat(64),PrezzoUnitario:'100',PrezzoTotale:'800',ImportoTotaleDocumento:'900',Data:'2026-05-01'}]});
assert.equal(xml.stats.invoiceTotal,100,'XML managerial revenue must use PrezzoUnitario only');
const sql=read('docs/v240-rights-project-allocations.sql');
for(const snippet of ['ENABLE ROW LEVEL SECURITY','FOR UPDATE','kyv_guard_rights_allocation','owner_id=(select auth.uid())','ID_ATTRIBUZIONE" bigint NOT NULL UNIQUE','ON DELETE RESTRICT'])
 assert.ok(sql.includes(snippet),'SQL missing '+snippet);
assert.ok(sql.includes('v_assigned + NEW."Importo" > v_net'),'Over-allocation must be prevented by DB');
assert.doesNotMatch(sql,/grant update|grant delete|delete from public\."FATTURE"|update public\."FATTURE"/i,'No existing finance records may be edited');
const ui=read('kyv-project-returns-ui-v240.js'),page=read('kyv_ritorni_progetti.html'),sw=read('sw.js');
assert.ok(ui.includes('KYV_ATTRIBUZIONI_DIRITTI_STORNI')&&ui.includes('KYV_ATTRIBUZIONI_DIRITTI'));
assert.ok(ui.includes('window.confirm(')&&ui.includes('window.prompt('));
assert.ok(ui.includes("count:'exact'")&&ui.includes('rows('));
assert.ok(page.includes('Ritorno economico dei progetti')&&page.includes('kyv-project-returns-v240.js'));
assert.ok(read('kyv_intelligence.html').includes('kyv_ritorni_progetti.html'));
assert.ok(sw.includes(require('./release-contract').cacheName())&&sw.includes("'./kyv_ritorni_progetti.html'"));
console.log('OK: v2.40 project fees, royalty shares, partial/storno, unknown dates and safe allocation guards');
