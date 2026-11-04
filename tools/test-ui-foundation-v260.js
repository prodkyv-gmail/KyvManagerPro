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
assert.equal(primary.filter(x=>x.href==='integrazioni.html').length,1);
assert.equal(all.filter(x=>x.href==='integrazioni.html').length,1,'App launcher must not appear twice');
assert.equal(all.filter(x=>x.href==='fatture.html').length,1,'Invoice management has one sidebar destination');
assert.equal(all.filter(x=>x.href==='kyv_analyst.html').length,1,'Analyst has one sidebar destination');
assert.ok(primary.some(x=>x.href==='kyv_scrivania_creativa.html'));
const daily=menu.split('Ogni giorno</p>')[1]?.split('</ul>')[0];
const legacyTools=menu.split('<span>Strumenti</span>')[1]?.split('</ul>')[0];
assert.ok(daily&&legacyTools);
assert.equal((daily.match(/navItem\('integrazioni'/g)||[]).length,1);
assert.equal((legacyTools.match(/navItem\('integrazioni'/g)||[]).length,0);
assert.equal((daily.match(/navItem\('fatture'/g)||[]).length,0);
assert.ok(menu.includes("navItem('fatture', 'fatture.html'"),'Invoices remain accessible in Administration');
assert.ok(menu.includes("page: 'ascolto', href: 'ascolto.html', label: 'Ascolto'"));
assert.ok(!menu.includes("page: 'clienti', href: 'clienti.html', label: 'Rubrica'"),'No temporary Rubrica link');
assert.ok(!producer.includes("rubrica.href='ascolto.html'"),'No post-render navigation rewrite');
assert.ok(producer.includes("link.setAttribute('aria-current','page')"),'Mobile aria-current state');
assert.ok(menu.includes('aria-current="page"'),'Legacy active links should have aria-current');
const mobile=menu.match(/function renderKyvMobileBottomNav\(activePage = 'dashboard'\) \{([\s\S]*?)\n\}/);
assert.ok(mobile,'Mobile nav renderer remains available');
let appended=null;
const fakeDoc={
 getElementById:()=>null,createElement:()=>({innerHTML:'',setAttribute(){}}),
 body:{appendChild:x=>{appended=x;}}
};
vm.runInNewContext('function renderKyvMobileBottomNav(activePage = \'dashboard\'){'+mobile[1]+
 '\n};renderKyvMobileBottomNav(\'ascolto\');',{document:fakeDoc});
assert.ok(appended?.innerHTML.includes('href="ascolto.html"'));
assert.ok(appended.innerHTML.includes('class="is-active" aria-label="Ascolto"'));
assert.ok(!appended.innerHTML.includes('href="clienti.html"'));
assert.equal((appended.innerHTML.match(/<a href=/g)||[]).length,5,'Exactly five mobile destinations');
const scopedPages=[
 'index.html','kyv_scrivania_creativa.html','kyv_audio_finder.html',
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
assert.equal(pkg.version,'2.77.0');
assert.equal(read('VERSION').trim(),'2.77');
assert.ok(read('config.js').includes("APP_VERSION: '2.77'"));
assert.ok(sw.includes('kyv-studio-v2-77-editor-views-20261104'));
assert.ok(pkg.scripts.check.includes('check:ui-foundation-v260'));
assert.equal(pkg.scripts['check:ui-foundation-v260'],'node tools/test-ui-foundation-v260.js');
assert.ok(read('guida.html').includes('v2.60'));
assert.ok(read('kyv-help.js').includes('v2.60'));
console.log('OK: v2.60 shared responsive UI, deduplicated navigation and preserved audio/creative controls');
