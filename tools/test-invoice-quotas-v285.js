// v2.85 — fatture condivise tra più progetti: nessun progetto resta nascosto o «da fatturare» per errore.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const scheda=read('scheda_progetto.html'),invoices=read('kyv-project-invoices.js'),summary=read('kyv-project-finance-summary.js'),split=read('kyv-invoice-split-v247.js'),fatture=read('fatture.html'),economy=read('kyv-economy-v6.js');

// 1) Economia: caso reale fattura 18 (1.875 €) intestata al progetto 15, citata via IDFT anche dal progetto 20.
const host={};
vm.runInNewContext(economy,{window:host,location:{pathname:'/fatture.html'},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){return 0;},clearTimeout(){}});
const compute=host.KYV_ECONOMY_V6.compute;
assert.equal(typeof compute,'function','compute deve essere raggiungibile dai test');
const projects=[
 {ID:15,TITOLO:'Lacrime sul viso',FEE:'625,00',IDFT:'18',STATO:'USCITA'},
 {ID:20,TITOLO:'Sotto casa tua',FEE:'625,00',IDFT:'18',STATO:'USCITA'},
 {ID:99,TITOLO:'Senza fattura',FEE:'500,00',STATO:'USCITA'}
];
const invoicesRows=[{ID_FT:18,Data:'2022-09-05',ID_PROGETTO:15,PrezzoUnitario:'1875,00',PAGATA:'SI'}];
const r=compute(projects,invoicesRows,[],'all',[]);
assert.deepEqual(r.candidates.map(p=>p.ID),[99],'il progetto 20 cita la fattura 18: non è «da fatturare»; il 99 sì');
assert.equal(r.fatturato,1875,'la fattura condivisa resta contata una sola volta');
// Con le quote esplicite il calcolo resta quello delle quote.
const quoted=compute(projects,invoicesRows,[],'all',[{id_ft:18,id_progetto:15,prezzo_unitario:'1250'},{id_ft:18,id_progetto:20,prezzo_unitario:'625'}]);
assert.deepEqual(quoted.candidates.map(p=>p.ID),[99]);

// 2) Scheda progetto: la fattura citata da IDFT e intestata ad altri non sparisce; la descrizione della quota ha la precedenza.
assert.ok(scheda.includes('_idftShared')&&scheda.includes('Quota da ripartire'),'la Scheda mostra le fatture condivise da ripartire');
assert.ok(scheda.includes('ripartizione_fattura='),'dalla Scheda si apre la ripartizione della fattura');
assert.ok(scheda.includes('quotaText')&&scheda.includes("a.descrizione"),'la descrizione della quota di questo progetto è mostrata');
assert.ok(scheda.includes('function matchFatture(p){ return (state.fatture||[]).filter(f=>f._v247Shared||f._idftShared'),'le quote dei progetti non titolari restano visibili (prima venivano scartate da matchFatture)');
// 3) Moduli collegati.
assert.ok(invoices.includes('idftShare')&&invoices.includes("select('id_ft,prezzo_unitario,descrizione')"),'kyv-project-invoices: quota con descrizione e fattura condivisa');
assert.ok(invoices.includes("short:'Quota da ripartire'"),'kyv-project-invoices: stato esplicito');
assert.ok(summary.includes('_idft_shared')&&summary.includes('data-kyv-finance-split')&&summary.includes('ripartizione_progetto='),'riepilogo progetto: fattura condivisa e «Fattura su più progetti»');
// 4) Split: parte dai progetti citati da IDFT, apre da ?ripartizione_fattura, niente finestre del browser.
assert.ok(split.includes("IDFT")&&split.includes('citedIds'),'lo split propone i progetti che citano la fattura');
assert.ok(split.includes('ripartizione_fattura'),'lo split si apre da ?ripartizione_fattura');
assert.doesNotMatch(split,/\b(?:confirm|alert)\(/,'lo split non usa confirm()/alert() del browser');
// 5) Fatture: badge «Condivisa da N progetti».
assert.ok(fatture.includes('correlazioneIdftMapGlobal')&&fatture.includes('Condivisa da')&&fatture.includes('data-split-invoice'),'Fatture mostra le fatture condivise con il pulsante Ripartisci');
console.log('OK: fatture condivise tra più progetti — v2.85.');
