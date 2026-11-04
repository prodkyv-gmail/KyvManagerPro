// KYVManagerPro v2.59 — consolidated music desk: documented relationships and finance only.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),w={};
for(const file of ['kyv-invoice-line-amount.js','kyv-music-hub-v259.js'])
 vm.runInNewContext(read(file),{window:w,Map,Set,Date,Math,Number,Object,Error,Intl},{filename:file});
const H=w.KYV_MUSIC_HUB_V259;
assert.ok(H?.build&&H?.filter);
const samples={
 projects:[
  {ID:1,TITOLO:'È l’estate',ARTISTA:'Emma',STATO:'In ascolto',FEE:'0,00',SVILUPPO:'Demo'},
  {ID:2,TITOLO:'Cuore',ARTISTA:'Sissi',STATO:'Uscito',FEE:'1.000,00',Data_Pubblicazione:'2026-05-10'},
  {ID:3,TITOLO:'Notte',ARTISTA:'Emma',STATO:'In lavorazione',FEE:null},
  {ID:4,TITOLO:'Storico',ARTISTA:'Giorgia',STATO:'Archiviato',FEE:'500'}
 ],
 sessions:[
  {id:'s1',titolo:'Sessione Emma',data_sessione:'2026-09-01'},
  {id:'s2',titolo:'Sessione archiviata',archiviata:true},
  {id:'s3',titolo:'Sessione senza progetto',data_sessione:'2026-10-11'}
 ],
 links:[
  {id:'l1',id_sessione:'s1',id_progetto:1,annullato:false},
  {id:'l2',id_sessione:'s1',id_progetto:1,annullato:false},
  {id:'l3',id_sessione:'s2',id_progetto:2,annullato:false},
  {id:'l4',id_sessione:'s3',id_progetto:1,annullato:true}
 ],
 pitches:[
  {id:'p1',id_progetto:1,destinatario:'Carosello',stato:'in_ascolto',
    prossimo_followup:'2026-10-30'},
  {id:'p2',id_progetto:1,destinatario:'Label',stato:'confermato',prossimo_followup:'2026-10-10'},
  {id:'p3',id_progetto:2,destinatario:'Contatto',stato:'inviato',archiviata:true}
 ],
 audioFiles:[
  {id:'f1',nome_file:'Estate demo.wav',provider:'local',account_label:'Mac',
    external_key:'key1'},
  {id:'f2',nome_file:'Reference.wav',provider:'drive',account_label:'Drive',
    external_key:'key2'},
  {id:'f3',nome_file:'Master.wav',provider:'dropbox',account_label:'Dropbox',
    external_key:'key3'},
  {id:'f4',nome_file:'Da verificare.wav',provider:'local',account_label:'Mac',
    external_key:'key4'}
 ],
 audioDecisions:[
  {provider:'local',account_label:'Mac',external_key:'key1',decision:'mio'},
  {provider:'drive',account_label:'Drive',external_key:'key2',decision:'reference'},
  {provider:'dropbox',account_label:'Dropbox',external_key:'key3',decision:'mio'},
  {provider:'local',account_label:'Mac',external_key:'key4',decision:'da_verificare'}
 ],
 audioLinks:[
  {id_audio:'f1',id_progetto:1,confermata:true,annullata:false},
  {id_audio:'f1',id_progetto:1,confermata:true,annullata:false},
  {id_audio:'f2',id_progetto:1,confermata:true,annullata:false},
  {id_audio:'f3',id_progetto:2,confermata:false,annullata:false},
  {id_audio:'f4',id_progetto:1,confermata:true,annullata:false},
  {id_audio:'f3',id_progetto:2,confermata:true,annullata:true},
  {id_audio:'f3',id_sessione:'s1',confermata:true,annullata:false}
 ],
 finance:{
  ready:true,
  invoices:[
   {ID_FT:1,Numero:'14',ID_PROGETTO:1,PrezzoUnitario:'1.200,00',PAGATA:'NO'},
   {ID_FT:2,Numero:'15',ID_PROGETTO:1,PrezzoUnitario:'3.000,00',PAGATA:'NO'},
   {ID_FT:3,Numero:'16',ID_PROGETTO:2,PrezzoUnitario:'500,00',PAGATA:'SI'},
   {ID_FT:4,Numero:'17',ID_PROGETTO:2,PrezzoUnitario:'',PAGATA:'NO'},
   {ID_FT:5,Numero:'18',ID_PROGETTO:null,PrezzoUnitario:'900,00',PAGATA:'NO'},
   {ID_FT:5,Numero:'18',ID_PROGETTO:null,PrezzoUnitario:'900,00',PAGATA:'NO'}
  ],
  allocations:[
   {id_ft:2,id_progetto:1,prezzo_unitario:'800'},
   {id_ft:2,id_progetto:2,prezzo_unitario:'1.500,00'},
   {id_ft:2,id_progetto:2,prezzo_unitario:'300,00'}
  ],
  payments:[
   {ID_INCASSO:1,ID_FT:1,Importo:'500,00'},
   {ID_INCASSO:2,ID_FT:1,Importo:'250,00'},
   {ID_INCASSO:3,ID_FT:2,Importo:'1000'},
   {ID_INCASSO:4,ID_FT:3,Importo:'500'}
  ],
  reversals:[{ID_STORNO:1,ID_INCASSO:2}]
 }
};
const output=H.build(samples,'2026-11-04',w.KYV_INVOICE_LINE),summary=output.summary;
const byId=id=>output.entries.find(x=>x.id===String(id));
assert.equal(summary.projects,4);
assert.equal(summary.projectsWithSession,1,'No inferred historical sessions');
assert.equal(summary.activeSessions,2);
assert.equal(summary.projectsWithPitch,1);
assert.equal(summary.overduePitches,1,'Confirmed pitches are excluded from overdue');
assert.equal(summary.projectsWithApprovedAudio,1,'Only confirmed and personally approved direct project links');
assert.equal(byId(1).sessionCount,1,'Duplicate relation does not double count');
assert.equal(byId(2).sessionCount,0,'Archived sessions ignored');
assert.equal(byId(1).pitchCount,2);
assert.equal(byId(1).overdue,1);
assert.equal(byId(1).audioCount,1);
assert.equal(byId(2).audioCount,0,'Unconfirmed, undone and session-only links excluded');
assert.equal(byId(1).fee,0,'Zero fee remains zero, not an outstanding receivable');
assert.equal(byId(3).fee,null,'Unknown fee stays unknown');
assert.equal(byId(1).invoiceCount,2);
assert.equal(byId(1).billedCents,200000,'Direct unit price plus only explicit split share');
assert.equal(byId(2).invoiceCount,3,'Split invoices and direct invoices counted once per project');
assert.equal(byId(2).billedCents,230000);
assert.equal(byId(2).billedIncomplete,true,'Blank unit price must not become zero');
assert.equal(byId(1).documentedReceiptsCents,50000,'Reversals excluded from direct receipt');
assert.equal(byId(2).documentedReceiptsCents,50000,'Direct documented receipt only');
assert.equal(byId(2).legacyPaidFlags,0,'Flag is not a cash movement');
assert.equal(byId(2).splitInvoiceCount,1,'Split invoice receipt must stay unassigned');
assert.equal(summary.invoicesLinked,4,'Each unique invoice is globally counted once if assigned');
assert.equal(summary.receiptsCents,100000);
assert.equal(summary.splitReceiptsNotAllocated,100000,'Do not invent allocation of cash on split invoices');
assert.equal(summary.billedCents,430000,'Only explicit assigned amounts, not document totals');
assert.equal(H.filter(output,{query:'estate'}).length,1,'Accent-insensitive music title');
assert.equal(H.filter(output,{query:'Carosello'}).length,1,'Search reaches pitch recipients');
assert.equal(H.filter(output,{query:'sessione Emma'}).length,1,'Search reaches recorded session titles');
assert.equal(H.filter(output,{artist:'Emma'}).length,2);
assert.equal(H.filter(output,{status:'Uscito'}).length,1);
assert.equal(H.filter(output,{mode:'overdue'}).length,1);
assert.equal(H.filter(output,{mode:'noaudio'}).length,3);
assert.equal(H.filter(output,{mode:'in_ascolto'}).length,1);
assert.equal(H.filter(output,{mode:'invoices'}).length,2);
assert.throws(()=>H.filter(output,{mode:'remove-all'}),/Filtro/);
assert.throws(()=>H.build(samples,'non una data',w.KYV_INVOICE_LINE),/Data/);
const without=H.build({...samples,finance:null},'2026-11-04',w.KYV_INVOICE_LINE);
assert.equal(without.summary.financeAvailable,false);
assert.equal(without.entries.find(x=>x.id==='1').hasEconomicData,false);
assert.equal(without.entries.find(x=>x.id==='1').invoiceCount,0,
 'Invoice count only meaningful when economic data actually loaded');
const legacy=H.build({...samples,finance:{ready:true,invoices:[
 {ID_FT:9,ID_PROGETTO:1,PrezzoUnitario:'100',PAGATA:'SI'}
 ],allocations:[],payments:[],reversals:[]}},'2026-11-04',w.KYV_INVOICE_LINE);
assert.equal(legacy.entries.find(x=>x.id==='1').documentedReceiptsCents,0,
 'Legacy PAGATA does not constitute a documented payment');
assert.equal(legacy.entries.find(x=>x.id==='1').legacyPaidFlags,1);
const over=H.build({...samples,finance:{ready:true,
 invoices:[{ID_FT:10,ID_PROGETTO:1,PrezzoUnitario:'100'}],
 allocations:[{id_ft:10,id_progetto:1,prezzo_unitario:'140'}],
 payments:[],reversals:[]}},'2026-11-04',w.KYV_INVOICE_LINE);
assert.equal(over.entries.find(x=>x.id==='1').billedCents,0,'Do not overstate an invoice split beyond its unit price');
assert.equal(over.entries.find(x=>x.id==='1').billedIncomplete,true,'Excess split needs manual review');
assert.equal(over.summary.invalidAllocations,1);
const html=read('kyv_scrivania_creativa.html'),ui=read('kyv-creative-desk-ui-v244.js'),
  sw=read('sw.js'),pkg=JSON.parse(read('package.json'));
for(const id of ['desk-hub','tab-hub','hub-stats','hub-finance-note','hub-pitch-chart',
 'hub-search','hub-artist','hub-status','hub-mode','hub-rows','hub-more',
 'hub-project-modal','hub-project-body','hub-close'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('src="kyv-music-hub-v259.js"'));
assert.ok(html.includes('src="kyv-invoice-line-amount.js"'));
for(const table of ['FATTURE','FATTURE_RIPARTIZIONI','FATTURE_INCASSI',
 'FATTURE_INCASSI_STORNI','KYV_AUDIO_DECISIONI'])
 assert.ok(ui.includes("read('"+table+"'"),table+' must be read from the authenticated database');
assert.ok(ui.includes('Promise.allSettled(['),'Economy must fail independently from core creative desk');
assert.ok(ui.includes('function hubDetail(id)')&&ui.includes('dialog.showModal()'));
assert.ok(ui.includes("showTab(q==='pitches'?'pitches':q==='sessions'?'sessions':'hub')"));
assert.ok(!read('kyv-music-hub-v259.js').includes('.from('),'Hub is read-only pure projection');
assert.ok(sw.includes("'./kyv-music-hub-v259.js'"));
assert.equal(pkg.version,'2.67.0');
assert.equal(read('VERSION').trim(),'2.67');
assert.ok(read('guida.html').includes('v2.59'));
assert.ok(read('kyv-help.js').includes('v2.59'));
console.log('OK: v2.59 unified creative/project/audio/finance desk, no inferred income or ownership');
