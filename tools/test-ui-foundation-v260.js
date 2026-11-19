/* KYV UI v2.60 — navigation deduplication, visual system and safe progressive disclosure. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const menu=read('menu.js'),producer=read('kyv-producer-mode.js'),css=read('kyv-theme.css'),
 desk=read('kyv_scrivania_creativa.html'),finder=read('kyv_audio_finder.html');
const navGroup=name=>{
 const start='const '+name+'=[';
 assert.ok(producer.includes(start),'Producer nav missing '+name);
 return producer.split(start)[1].split('];')[0];
};
const entries=text=>[...text.matchAll(/\['([^']+)','([^']+)','([^']+)','([^']+)'\]/g)]
 .map(x=>({href:x[1],label:x[2],key:x[4]}));
const primary=entries(navGroup('primary')),control=entries(navGroup('control')),
 tools=entries(navGroup('tools'));
const all=[...primary,...control,...tools];
assert.equal(control.filter(x=>x.href==='integrazioni.html').length,1);
assert.equal(all.filter(x=>x.href==='integrazioni.html').length,1,'App launcher must not appear twice');
assert.equal(all.filter(x=>x.href==='fatture.html').length,1,'Invoice management has one sidebar destination');
assert.equal(all.filter(x=>x.href==='kyv_analyst.html').length,1,'Analyst has one sidebar destination');
assert.ok(control.some(x=>x.href==='kyv_scrivania_creativa.html'));
const daily=menu.split('Produttore</p>')[1]?.split('</ul>')[0];
const legacyTools=menu.split('<span>Strumenti</span>')[1]?.split('</ul>')[0];
assert.ok(daily&&legacyTools);
assert.equal((daily.match(/navItem\('integrazioni'/g)||[]).length,0);
assert.equal((legacyTools.match(/navItem\('integrazioni'/g)||[]).length,0);
assert.equal((daily.match(/navItem\('fatture'/g)||[]).length,0);
const admin=menu.split('<span>Amministrazione</span>')[1]?.split('</ul>')[0];
assert.ok(admin,'Fallback Administration nav is present');
for(const key of ['dashboard','progetti','audiofinder','creative','pipeline','ascolto','integrazioni']){
 assert.equal(control.filter(x=>x.key===key).length,1,key+' belongs to Administration exactly once');
 assert.ok(admin.includes("navItem('"+key+"'"),key+' fallback in Administration');
 assert.ok(!primary.some(x=>x.key===key),key+' not in Producer');
}
assert.ok(primary.some(x=>x.href==='editor.html'),'Studio Editor must be in Producer');
assert.ok(daily.includes("navItem('editor'"),'Fallback Studio Editor must be in daily Producer section');
assert.ok(!legacyTools.includes("navItem('editor'"),'Editor not duplicated under tools');
assert.equal(new Set(all.map(x=>x.href)).size,all.length,'No duplicate Producer Mode sidebar destinations');
assert.ok(menu.includes("navItem('fatture', 'fatture.html'"),'Invoices remain accessible in Administration');
assert.ok(admin.includes("navItem('ascolto'"),'Ascolto remains in Administration');
assert.ok(!menu.includes("page: 'clienti', href: 'clienti.html', label: 'Rubrica'"),'No temporary Rubrica link');
assert.ok(!producer.includes("rubrica.href='ascolto.html'"),'No post-render navigation rewrite');
assert.ok(!producer.includes('function fixMobileNav('),'Retired mobile dock synchronization');
assert.ok(menu.includes('aria-current="page"'),'Legacy active links should have aria-current');
// The fixed 5-button dock is deliberately removed on ALL pages.
assert.ok(!menu.includes('function renderKyvMobileBottomNav('));
assert.ok(!menu.includes('renderKyvMobileBottomNav(activePage)'));
assert.ok(!menu.includes("document.body.appendChild(nav)"));
assert.ok(menu.includes("getElementById('kyv-mobile-bottom-nav')?.remove()"),'Stale mobile dock is removed');
assert.ok(css.includes('#kyv-mobile-bottom-nav { display: none !important; }'));
const launch=read('index.html'),today=read('oggi.html');
for(const name of ['Agenda','Nuovo','Studio Editor','Amministrazione','Strumenti'])
 assert.ok(launch.includes('<strong>'+name+'</strong>'),'Missing launch destination: '+name);
for(const route of ['kyv_calendar.html','acquisisci_audio.html','editor.html'])
 assert.ok(launch.includes('href="'+route+'"'),'Launch route missing '+route);
assert.ok(launch.includes("openKyvHomeGroup('admin')")&&launch.includes("openKyvHomeGroup('tools')"),'Group buttons must work');
assert.ok(today.includes('id="home-analytics-details"')&&today.includes('id="activity-list"'),'Historical Oggi remains intact');
assert.equal((launch.match(/class="kyv-launch-item"/g)||[]).length,5,'Home should have exactly five large action buttons');
const actionBridge=read('kyv-action-bridge.js'),workflow=read('kyv-workflow-nav.js'),
 route=read('kyv-flow-routes-v269.js'),polish=read('kyv-layout-polish.js');
assert.ok(actionBridge.includes("if(page==='oggi.html')"),'Oggi action bridge must run on dedicated page');
assert.ok(actionBridge.includes("if(page!=='oggi.html')return;"),'Legacy Oggi task filters must keep working');
assert.ok(workflow.includes('oggi.html?projectId='),'Project context Today link must open Oggi, not landing');
assert.ok(!workflow.includes('index.html?projectId='),'Do not pollute five-button landing with a project context');
assert.ok(route.includes("'oggi.html':['projectId','id']"),'Oggi must receive project context');
assert.ok(polish.includes("if(page!=='oggi.html')return;"),'Old Oggi visual ordering remains isolated');
assert.ok(read('kyv-today-home-v5.js').includes("if(page!=='oggi.html')return;"),'Cabina operativa runs on Oggi');
assert.ok(read('config.js').includes("if(page==='oggi.html')"),'Today data widgets are not loaded on launchpad');
assert.ok(read('sw.js').includes("'./oggi.html'"),'Offline PWA keeps old Oggi');
assert.ok(!launch.includes('id="home-analytics-details"'),'Five-button landing has no heavy financial dashboard');

assert.ok(control.some(x=>x.href==='oggi.html'),'Old Oggi is accessible inside Administration');
assert.ok(menu.includes('id="kyv-nav-admin"')&&menu.includes('id="kyv-nav-tools"'),'Fallback group IDs support home buttons');
assert.ok(producer.includes('id="${id}"'),'Producer Mode group IDs support home buttons');
const scopedPages=[
 'index.html','oggi.html','kyv_scrivania_creativa.html','kyv_audio_finder.html',
 'fatture.html','integrazioni.html','kyv_analyst.html','kyv_intelligence.html',
 'ascolto.html','kyv_calendar.html','rendiconto.html',
 'kyv_ritorni_progetti.html','kyv_liquidazioni.html','scheda_progetto.html'
];
for(const path of scopedPages){
 const html=read(path);
 assert.ok(/<body\b[^>]*class="[^"]*\bkyv-v260\b[^"]*"/i.test(html),
  path+' must opt in to the shared system');
 assert.ok(html.includes('href="kyv-theme.css"'),path+' uses the same shared stylesheet');
}
const safe=read('progetti.html');
assert.ok(safe.includes('window.KYV_SAFE_PROJECTS_PAGE = true'));
assert.ok(!/<body\b[^>]*kyv-v260/.test(safe),
 'Isolated Safe Projects page must not receive generic styling prematurely');
for(const token of [
 '--kyv-ui-radius:','--kyv-ui-control-height:','body.kyv-v260',
 '.desk-panel,.desk-stat,.finder-card','.hub-project','.kyv-v260-disclosure',
 '@media (max-width: 767px)','prefers-reduced-motion','focus-visible'
])assert.ok(css.includes(token),'Missing visual foundation: '+token);
assert.ok(!css.includes('min(100vw - 14px,840px)'),'Valid responsive CSS expression');
assert.ok(css.includes('min(calc(100vw - 14px),840px)'));
assert.ok(desk.includes('id="tab-hub"')&&desk.includes('id="session-form"')&&desk.includes('id="pitch-form"'),
 'Existing creative workflows are preserved');
assert.ok(desk.includes('aria-label="Azioni contestuali"'));
assert.ok(!desk.includes('<a href="index.html">Home</a>'),'Shared sidebar replaces redundant local links');
assert.ok(finder.includes('id="finder-batch-details"'));
assert.ok(finder.includes('id="finder-dropbox-oauth"'));
for(const key of [
 'id="batch-scan"','id="batch-drive"','id="batch-dropbox"',
 'id="finder-dropbox-connect"','id="finder-dropbox-choose"','id="finder-save"',
 'id="finder-sources"','id="finder-explorer"','id="finder-preview"'
])assert.ok(finder.includes(key),'Existing Audio Finder control must survive: '+key);
assert.equal((finder.match(/id="finder-batch-details"/g)||[]).length,1);
assert.equal((finder.match(/id="finder-dropbox-oauth"/g)||[]).length,1);
assert.ok(finder.includes('Scansione combinata di Drive e Dropbox'));
assert.ok(finder.includes('Funzione avanzata · avvio solo manuale'));
assert.ok(finder.includes('class="finder-links" aria-label="Azioni contestuali"'));
assert.ok(!finder.includes('<a href="integrazioni.html">Tutte le app</a>'));
assert.ok(!read('kyv-theme.css').includes('.from(\'PROGETTI\')'),
 'Theme must not contain database or workflow mutations');
const pkg=JSON.parse(read('package.json')),sw=read('sw.js');
assert.equal(pkg.version,(require('./release-contract').version()+'.0'));
assert.equal(read('VERSION').trim(),require('./release-contract').version());
assert.ok(read('config.js').includes("APP_VERSION: '"+require('./release-contract').version()+"'"));
assert.ok(sw.includes(require('./release-contract').cacheName()));
assert.ok(pkg.scripts.check.includes('check:ui-foundation-v260'));
assert.equal(pkg.scripts['check:ui-foundation-v260'],'node tools/test-ui-foundation-v260.js');
assert.ok(read('guida.html').includes('v2.60'));
assert.ok(read('kyv-help.js').includes('v2.60'));
console.log('OK: v2.60 shared responsive UI, deduplicated navigation and preserved audio/creative controls');
