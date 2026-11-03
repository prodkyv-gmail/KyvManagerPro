// KYVManagerPro v2.43 — mobile navigation and cash-status financial integrity.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('fatture.html'),menu=read('menu.js');
const sw=read('sw.js'),pkg=JSON.parse(read('package.json'));
for(const p of ['kyv_intelligence.html','kyv_analyst.html','kyv_ritorni_progetti.html','kyv_liquidazioni.html']){
 const page=read(p);
 for(const href of ['index.html','integrazioni.html'])assert.ok(page.includes('href="'+href+'"'),p+' must have '+href);
}
assert.ok(menu.includes('function toggleMobileMenu(force)'));
assert.ok(menu.includes("button.setAttribute('aria-expanded', String(open))"));
assert.ok(menu.includes("toggleMobileMenu(false)"));
assert.ok(menu.includes("event.key !== 'Escape'"));
assert.ok(menu.includes('Menu principale KYV'));
const sidebarClasses=new Set(['-translate-x-full']),overlayClasses=new Set(['hidden']);
function classList(set){return {contains:x=>set.has(x),toggle(x,force){if(force===undefined)force=!set.has(x);if(force)set.add(x);else set.delete(x);return force;}};}
const buttonAttrs=new Map();
const button={setAttribute:(k,v)=>buttonAttrs.set(k,v),hasAttribute:k=>buttonAttrs.has(k)};
let focused=0;
const sidebar={classList:classList(sidebarClasses),querySelector:()=>({focus:()=>{focused++}})};
const overlay={classList:classList(overlayClasses),setAttribute:(k,v)=>{overlay.ariaHidden=v}};
const doc={getElementById:id=>id==='sidebar'?sidebar:id==='mobile-sidebar-overlay'?overlay:null,
 querySelectorAll:()=>[button]};
const fn=menu.match(/function toggleMobileMenu\(force\) \{([\s\S]*?)\n\}/);
assert.ok(fn,'Standalone toggle function not found');
const ctx={document:doc};
vm.runInNewContext('function toggleMobileMenu(force) {'+fn[1]+'\n}; this.openMenu=toggleMobileMenu;',ctx);
ctx.openMenu(true);
assert.equal(sidebarClasses.has('-translate-x-full'),false);
assert.equal(overlayClasses.has('hidden'),false);
assert.equal(buttonAttrs.get('aria-expanded'),'true');
assert.equal(overlay.ariaHidden,'false');
assert.equal(focused,1);
ctx.openMenu(false);
assert.equal(sidebarClasses.has('-translate-x-full'),true);
assert.equal(overlayClasses.has('hidden'),true);
assert.equal(buttonAttrs.get('aria-expanded'),'false');
assert.equal(overlay.ariaHidden,'true');
assert.ok(html.includes('FATTURE INCASSATE'));
assert.ok(html.includes('Incassato complessivo (anche acconti)'));
assert.ok(html.includes('Di cui acconti su fatture ancora aperte'));
assert.ok(html.includes('Incassata (storico): data bancaria non documentata'));
assert.ok(html.includes("if(fatRes.error || projRes.error) throw (fatRes.error || projRes.error)"));
assert.ok(html.includes('Caricamento non riuscito'));
assert.ok(html.includes("correlazioneFattureGlobal = [];"),'Read errors must clear stale invoice list');
const functionMatch=html.match(/window\.applyCorrelazioneFilters = function\(\) \{([\s\S]*?)\n        \}\n        document\.addEventListener\('DOMContentLoaded'/);
assert.ok(functionMatch,'Fatture filtering/cash summary function must exist');
const states={
  1:{kind:'paid',total:100,received:100,remaining:0,legacyPaid:true},
  2:{kind:'partial',total:250,received:50,remaining:200},
  3:{kind:'open',total:80,received:0,remaining:80},
  4:{kind:'paid',total:40,received:40,remaining:0,legacyPaid:false}
};
const rows=[
 {ID_FT:1,Numero:'A1',Denominazione:'Cliente Alfa',PrezzoUnitario:100,PAGATA:'SI',Data:'2026-01-01'},
 {ID_FT:2,Numero:'B2',Denominazione:'Cliente Beta',PrezzoUnitario:250,PAGATA:'NO',Data:'2026-01-02'},
 {ID_FT:3,Numero:'C3',Denominazione:'Cliente Gamma',PrezzoUnitario:80,PAGATA:'NO',Data:'2026-01-03'},
 {ID_FT:4,Numero:'D4',Denominazione:'Cliente Delta',PrezzoUnitario:40,PAGATA:'NO',Data:'2026-01-04'}
];
const elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{value:'',innerText:'',innerHTML:''});return elements.get(id)};
const window={KYV_COLLECTIONS_V236:{paymentState:f=>states[f.ID_FT]}};
const H=v=>String(v??'');
const KYV={isPaid:v=>String(v).toUpperCase()==='SI'};
const fmtEuro={format:x=>'EUR '+Number(x).toFixed(2)};
const sandbox={window,document:{getElementById:el},correlazioneFattureGlobal:rows,
 correlazioneProjMapGlobal:{},fmtEuro,H,KYV,parseKyvNumber:Number,Date};
vm.runInNewContext('window.applyCorrelazioneFilters = function(){'+functionMatch[1]+'\n};',sandbox);
window.applyCorrelazioneFilters();
assert.equal(el('tot-pagate').innerText,'EUR 140.00','Fully received invoices only');
assert.equal(el('tot-incassato-complessivo').innerText,'EUR 190.00','Includes advance received while invoice is open');
assert.equal(el('tot-acconti-aperti').innerText,'EUR 50.00');
assert.equal(el('tot-da-pagare').innerText,'EUR 280.00','Only outstanding balances');
assert.match(el('tbody-ft-pag').innerHTML,/data-kyv-edit-id="1"/);
assert.match(el('tbody-ft-pag').innerHTML,/data-kyv-edit-id="4"/);
assert.doesNotMatch(el('tbody-ft-pag').innerHTML,/data-kyv-edit-id="2"/);
assert.match(el('tbody-ft-nopag').innerHTML,/data-kyv-edit-id="2"/);
assert.match(el('tbody-ft-nopag').innerHTML,/Incassata parzialmente/);
assert.match(el('tbody-ft-pag').innerHTML,/data bancaria non documentata/);
el('correlazione-search').value='Cliente Beta';
window.applyCorrelazioneFilters();
assert.equal(el('tot-pagate').innerText,'EUR 0.00');
assert.equal(el('tot-incassato-complessivo').innerText,'EUR 50.00');
assert.equal(el('tot-acconti-aperti').innerText,'EUR 50.00');
assert.equal(el('tot-da-pagare').innerText,'EUR 200.00');
assert.equal(pkg.version,'2.48.0');
assert.equal(read('VERSION').trim(),'2.48');
assert.match(read('config.js'),/APP_VERSION: '2\.48'/);
assert.ok(sw.includes('kyv-studio-v2-48-personal-audio-20261103'));
assert.ok(pkg.scripts.check.includes('check:cash-navigation-v243'));
assert.equal(pkg.scripts['check:cash-navigation-v243'],'node tools/test-cash-navigation-v243.js');
console.log('OK: v2.43 mobile sidebar accessibility; full receipts, partial advances and open invoice balances partitioned correctly');
