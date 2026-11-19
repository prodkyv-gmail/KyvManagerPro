// KYV v2.64 — navigation, mobile dialogs and incremental responsive table processing.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const producer=read('kyv-producer-mode.js'),order=read('kyv-nav-order.js'),
 menu=read('menu.js'),responsive=read('kyv-responsive.js'),
 theme=read('kyv-theme.css'),home=read('oggi.html'),launch=read('index.html');
for(const f of ['kyv-producer-mode.js','kyv-nav-order.js','menu.js','kyv-responsive.js'])
 new vm.Script(read(f),{filename:f});
const primary=producer.split('const primary=[')[1].split('];')[0];
const control=producer.split('const control=[')[1].split('];')[0];
const tools=producer.split('const tools=[')[1].split('];')[0];
const links=[...control.matchAll(/\['([^']+)','([^']+)'/g)].map(x=>x[1]);
assert.ok(links.includes('ascolto.html')&&links.includes('pipeline.html'),
 'Ascolto and Pipeline must remain in Administration, without DOM reordering');
assert.ok(control.includes("'Pipeline & opportunità'"));
assert.ok(!tools.includes("'pipeline.html'"),'Pipeline must have one menu owner');
assert.ok(!order.includes('setInterval('),'Retired nav ordering script must never poll');
assert.ok(!order.includes('insertBefore('),'No post-render navigation movement');
assert.ok(producer.includes('if(apply())return;'),'Stop watching when the actual menu exists');
assert.ok(producer.includes('if(apply())observer.disconnect()'));
assert.ok(!producer.includes('new MutationObserver(apply)'));
assert.ok(producer.includes("id:'kyv-dashboard-activity-collapse'"),
 'Operational list starts closed in native disclosure');
assert.ok(producer.includes('collapseNode(parts[0]'), 'Keep the original operational list inside disclosure');
assert.ok(!producer.includes("['chartAndamento','chartTopArtisti'].forEach"),
 'Do not move Chart.js canvases out of v2.63 native disclosures');
assert.ok(!producer.includes("const types=document.getElementById('tipo-ft-cards')"),
 'Do not move the v2.63 billed-type disclosure a second time');
assert.ok(producer.includes('if(metrics)candidates.push(metrics);'),
 'Historical financial KPIs remain consultable in one admin accordion');
const quick=producer.match(/quick\.innerHTML=\`([\s\S]*?)\`;/);
assert.ok(quick);
assert.ok(!quick[1].includes('acquisisci_audio.html'),
 'Home producer New CTA should not be duplicated in its quick-action strip');
assert.ok(producer.includes('href="acquisisci_audio.html"'),
 'New capture CTA must still be directly accessible');
assert.ok(!menu.includes('function renderKyvMobileBottomNav('),'Mobile dock renderer retired');
assert.ok(!producer.includes('function fixMobileNav('),'Legacy mobile dock focus handler retired');
assert.ok(menu.includes("getElementById('kyv-mobile-bottom-nav')?.remove()"),'Remove stale dock markup');
assert.ok(launch.includes('openKyvHomeGroup(\'admin\')')&&launch.includes('openKyvHomeGroup(\'tools\')'),
 'Home group controls open the side menu instead of a bottom dock');
// Open and close the real contextual help functions against a controlled DOM stub.
const helpSource=menu.slice(menu.indexOf('let kyvHelpFocusReturn = null;'),
 menu.indexOf('function getKyvHelpContent('));
assert.ok(helpSource.includes('function openHelpModal()'));
assert.ok(helpSource.includes('function closeHelpModal()'));
const classes=new Set(['hidden']);let openerFocus=0,closeFocus=0;
const opener={isConnected:true,focus(){openerFocus++}};
const close={focus(){closeFocus++}};
const modal={classList:{contains:x=>classes.has(x),remove:x=>classes.delete(x),add:x=>classes.add(x)},
 querySelector:q=>q==='button[aria-label="Chiudi guida"]'?close:null};
const stub={document:{activeElement:opener,getElementById:id=>id==='kyv-help-modal'?modal:null}};
vm.runInNewContext(helpSource+'\nthis.openHelpModal=openHelpModal;this.closeHelpModal=closeHelpModal;',stub);
stub.openHelpModal();
assert.equal(classes.has('hidden'),false);
assert.equal(closeFocus,1,'Focus should enter the dialog');
stub.closeHelpModal();
assert.equal(classes.has('hidden'),true);
assert.equal(openerFocus,1,'Focus must return to the invoking control');
assert.ok(menu.includes("if (helpOpen && event.key === 'Tab')"));
assert.ok(menu.includes("if (event.key !== 'Escape') return;"));
assert.match(menu,/if \(helpOpen\) \{\r?\n        event\.preventDefault\(\);\r?\n        closeHelpModal\(\);/);
assert.ok(menu.includes("const first=buttons[0],last=buttons[buttons.length-1]"));
assert.ok(menu.includes("toggleMobileMenu(false)"),'Existing Escape sidebar close kept');
// Exercise actual responsive enhancer, including row-only mutations, with lightweight DOM.
function classList(initial=[]){const set=new Set(initial);return{
 add:(...v)=>v.forEach(x=>set.add(x)),contains:x=>set.has(x),
 toggle:(name,force)=>{if(force)set.add(name);else set.delete(name);}
};}
function cell(existing=null){const attrs=existing?{'data-label':existing}:{},node={
 dataset:{},sets:0,getAttribute:k=>attrs[k]??null,
 setAttribute(k,v){attrs[k]=v;this.sets++;}
};return node;}
const header={textContent:'Denominazione'};
let rows=[],fullScans=0,callback=null;
const table={nodeType:1,tagName:'TABLE',id:'fatture',
 dataset:{},classList:classList(),parentElement:{dataset:{},classList:classList()},
 closest:()=>null,querySelector(sel){
 if(sel==='tr')return rows[0]||null;return null;
},querySelectorAll(sel){
 if(sel==='thead th')return [header];
 if(sel==='tbody tr'){fullScans++;return rows;}
 return [];
}};
function row(c){
 return {nodeType:1,tagName:'TR',children:[c],
 matches:sel=>sel==='tr',
 closest:sel=>sel==='table'?table:null,
 querySelectorAll:()=>[]};
}
const c1=cell(),r1=row(c1);
const c2=cell('Etichetta esplicita'),r2=row(c2);
rows=[r1,r2];
const observerStub={observe(){}};
const document={
 readyState:'loading',
 documentElement:{classList:classList()},
 body:{},
 addEventListener(event,fn){if(event==='DOMContentLoaded')this.onReady=fn;},
 querySelectorAll(sel){return sel==='table'?[table]:[];},
 querySelector:()=>null
};
const context={
 window:{},document,location:{pathname:'/fatture.html'},
 MutationObserver:function(fn){callback=fn;return observerStub;},
 WeakMap,Array,Set,Number
};
vm.runInNewContext(responsive,context);
document.onReady();
assert.equal(c1.getAttribute('data-label'),'Denominazione');
assert.equal(c2.getAttribute('data-label'),'Etichetta esplicita');
assert.ok(table.classList.contains('kyv-card-mode'));
assert.equal(fullScans,1);
const c3=cell(),r3=row(c3);
rows.push(r3);
const tbody={nodeType:1,matches:()=>false};
callback([{addedNodes:[r3],target:tbody}]);
assert.equal(fullScans,1,'Adding one row must not reprocess the whole table');
assert.equal(c3.getAttribute('data-label'),'Denominazione');
assert.equal(c1.sets,1,'Previously labelled rows must not be reprocessed');
header.textContent='Cliente';
const th={nodeType:1,matches:sel=>sel==='td,th',closest:sel=>sel==='table'?table:sel==='thead'?{}:null,querySelectorAll:()=>[]};
callback([{addedNodes:[th],target:tbody}]);
assert.equal(fullScans,2,'Heading change should deliberately refresh every data label');
assert.equal(c1.getAttribute('data-label'),'Cliente');
assert.equal(c3.getAttribute('data-label'),'Cliente');
assert.equal(c2.getAttribute('data-label'),'Etichetta esplicita','Custom labels are not overwritten');
assert.ok(responsive.includes('const changed = new Map()'));
assert.ok(responsive.includes('changed.forEach((rows, table) => enhanceTable(table, rows))'));
assert.ok(responsive.includes("node.querySelectorAll('tr')"));
assert.doesNotMatch(responsive,/if \(table\) enhanceTable\(table\);\r?\n                    if \(node\.querySelectorAll\) enhanceTables\(node\)/,
 'Removed full-table scan on each DOM mutation');
assert.ok(responsive.includes("window.KYV_RESPONSIVE = { enhanceTables };"));
for(const token of [
 '#kyv-mobile-bottom-nav { display: none !important; }',
 'body.kyv-v260 #kyv-help-modal [aria-label="Chiudi guida"]',
 'body.kyv-v260 .kyv-table-hint',
 'body.kyv-v260 #kyv-dashboard-ops-collapses .kyv-collapse-body > .kyv-panel'
])assert.ok(theme.includes(token),'Missing shared style: '+token);
assert.ok(home.includes('id="home-analytics-details"'));
assert.ok(home.includes('id="home-billing-types-details"'));
assert.ok(home.includes('id="activity-list"'));
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,(require('./release-contract').version()+'.0'));
assert.equal(read('VERSION').trim(),require('./release-contract').version());
assert.ok(read('config.js').includes("APP_VERSION: '"+require('./release-contract').version()+"'"));
assert.ok(read('sw.js').includes(require('./release-contract').cacheName()));
assert.equal(pkg.scripts['check:mobile-ux-v264'],'node tools/test-mobile-ux-v264.js');
assert.ok(pkg.scripts.check.includes('check:mobile-ux-v264'));
assert.ok(read('guida.html').includes('v2.64'));
assert.ok(read('kyv-help.js').includes('v2.64'));
console.log('OK: v2.64 one-source nav, visible daily tasks, modal keyboard focus, incremental table rows and responsive UI');
