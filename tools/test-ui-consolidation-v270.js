// KYV v2.70 — route dependency and one-action UI consolidation.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const config=read('config.js'),nav=read('kyv-workflow-nav.js'),invoices=read('kyv-project-invoices.js'),
  hub=read('kyv-project-hub-v3.js'),sheet=read('kyv-project-sheet-v2.js'),
  routes=read('kyv-flow-routes-v269.js'),sw=read('sw.js'),guide=read('guida.html'),help=read('kyv-help.js');
const routeIndex=config.indexOf("journeyRoutes.src='kyv-flow-routes-v269.js'");
const navIndex=config.indexOf("workflowNav.src='kyv-workflow-nav.js'");
assert.ok(routeIndex>=0&&navIndex>routeIndex,'Route dependency must actually be loaded before workflow nav');
assert.ok(config.includes("journeyRoutes.async=false"),'Ordered async=false script required');
assert.ok(config.includes("script[data-kyv-flow-routes-v269]"),'Do not mount route script twice');
assert.ok(nav.includes("window.KYV_FLOW_ROUTES_V269?.hrefs(projectId())"),'Same centralized URL contract');
assert.ok(invoices.includes("nav.querySelector('[data-kyv-workflow=\"invoice\"]')"),'Reuse canonical invoice link');
assert.ok(invoices.includes("mainInvoiceLink.appendChild(state)"),'Invoice state belongs inside existing link');
assert.ok(invoices.includes("chip?.remove()"),'No duplicate invoice action in the project journey');
assert.ok(invoices.includes("if(mainInvoiceLink){"),'Keep compatibility fallback on other pages');
assert.ok(invoices.includes("if(id)refreshContext(id)"),'Same-title project switches update invoice status');
assert.ok(invoices.includes("info=rows===null"),'Do not hide failed invoice reads as zero invoices');
assert.ok(invoices.includes("aria-label','Fatture · "), 'Accessible combined invoice action');
assert.ok(hub.includes("repeatedNext.style.display='none'"),'Primary hub hides duplicate next-action banner');
assert.ok(sheet.includes("const hasPrimaryNext=Boolean(document.querySelector('#kyv-project-hub-v3 .kyv-hub3-next'))"),'Hero remains fallback');
assert.ok(sheet.includes("box.style.display=hasPrimaryNext?'none':''"),'Fallback returns if hub is absent');
assert.doesNotMatch(routes,/\.(insert|update|upsert|delete)\(/,'Journey helper must not write data');
assert.ok(sw.includes("'./kyv-flow-routes-v269.js'"),'PWA caches route helper');
assert.ok(sw.includes(require('./release-contract').cacheName()),'PWA version bumped');
assert.ok(config.includes("APP_VERSION: '"+require('./release-contract').version()+"'"));
assert.equal(read('VERSION').trim(),require('./release-contract').version());
assert.equal(require('../package.json').version,(require('./release-contract').version()+'.0'));
assert.ok(require('../package.json').scripts.check.includes('check:ui-consolidation-v270'));
assert.ok(guide.includes('v2.70')&&help.includes('v2.70'),'Help and guide synchronized');
// Small DOM-free runtime simulation of the real invoice status renderer: no duplicate link.
const start=invoices.indexOf('function mountContextChip(projectId,rows){');
const stop=invoices.indexOf('\nasync function refreshContext',start);
assert.ok(start>=0&&stop>start,'Invoice renderer was found');
const link={dataset:{},children:[],href:'fatture.html?collegaProgetto=41',
  title:'',tagName:'A',appendChild(node){this.children.push(node);},
  querySelector(q){return q==='[data-kyv-invoice-state]'?this.children.find(x=>x.dataset?.kyvInvoiceState==='1')||null:null;},
  setAttribute(k,v){this[k]=v;}};
let duplicateAppend=0;
const simulatedNav={querySelector:q=>q==='[data-kyv-workflow="invoice"]'?link:null,
  appendChild(){duplicateAppend++;}};
const doc={getElementById:id=>id==='kyv-workflow-nav'?simulatedNav:null,
  createElement:tag=>({tagName:tag.toUpperCase(),dataset:{},textContent:'',className:''})};
const sandbox={document:doc,summary:rows=>rows.length
  ?{kind:'open',short:'Da incassare',detail:'F-5 · €100 · da incassare'}
  :{kind:'none',short:'Nessuna fattura',detail:'Nessuna fattura collegata'},
  contextHref:()=>'',toneClass:()=>''};
const mounted=vm.runInNewContext(invoices.slice(start,stop)+'\nmountContextChip',sandbox);
assert.equal(mounted('41',[{ID_FT:5}]),true);
assert.equal(link.children.length,1,'One informational state inside canonical link');
assert.equal(link.href,'fatture.html?collegaProgetto=41','No implicit invoice edit/create navigation');
assert.equal(link.querySelector('[data-kyv-invoice-state]').textContent,'Da incassare');
assert.equal(mounted('41',null),true);
assert.equal(link.querySelector('[data-kyv-invoice-state]').textContent,'Non disponibili','Read failure is not interpreted as no invoices');
assert.equal(link.children.length,1,'Repeat render must not duplicate badge');
assert.equal(mounted('41',[]),true);
assert.equal(link.querySelector('[data-kyv-invoice-state]').textContent,'Nessuna fattura');
assert.equal(duplicateAppend,0,'No second invoice action may be appended');
console.log('OK: v2.70 route helper, one invoice action, one next-action panel, safe fallbacks');
