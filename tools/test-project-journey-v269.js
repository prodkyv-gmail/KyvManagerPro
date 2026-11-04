// KYV v2.69 — deterministic journey routes, explicit-context navigation, full sessions coverage.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const routes=require('../kyv-flow-routes-v269.js');
const pages=[
 ['scheda_progetto.html','?id=41'],
 ['sessioni.html','?projectId=41'],
 ['kyv_audio_finder.html','?project=41'],
 ['fatture.html','?collegaProgetto=41']
];
for(const [page,query] of pages)assert.equal(routes.parse('/'+page,query),'41',page+' lost context');
const links=routes.hrefs('41');
assert.deepEqual({...links},{project:'scheda_progetto.html?id=41',
 session:'sessioni.html?projectId=41',audio:'kyv_audio_finder.html?project=41',
 invoice:'fatture.html?collegaProgetto=41'});
for(const [page,query] of pages)assert.equal(routes.fromLocation({pathname:'/app/'+page,search:query}),'41');
assert.equal(routes.parse('/fatture.html','?ripartizione_progetto=41'),'41','Existing explicit split entry remains recognized');
assert.equal(routes.parse('/kyv_calendar.html','?project=Brano&projectId=41'),'41');
assert.equal(routes.parse('/scheda_progetto.html','?id=abc&projectId=41'),'41');
for(const value of ['','abc','0','1x','1&tab=delete','-4','999999999999999999999999']){
 assert.equal(routes.hrefs(value),null,'Unsafe ID should not build actions: '+value);
}
assert.equal(routes.hrefs('00041').audio,'kyv_audio_finder.html?project=41','Normalize leading zeroes to canonical Supabase IDs');
assert.equal(routes.parse('/sessioni.html','?projectId=00041'),'41');
const nav=read('kyv-workflow-nav.js'),config=read('config.js');
assert.ok(nav.includes("'sessioni.html','kyv_audio_finder.html','fatture.html'"));
assert.ok(nav.includes("['session','calendar-clock','Sessioni']"));
assert.ok(nav.includes("['audio','file-audio','Audio']"));
assert.ok(nav.includes("['invoice','receipt','Fatture']"));
assert.ok(nav.includes("aria-current=\"page\""));
const routeAt=config.indexOf("journeyRoutes.src='kyv-flow-routes-v269.js'");
const navAt=config.indexOf("workflowNav.src='kyv-workflow-nav.js'");
assert.ok(routeAt>=0&&navAt>=0&&routeAt<navAt,'Route helper must exist and load before navigation');
assert.ok(nav.includes("window.KYV_FLOW_ROUTES_V269"));
const sessions=read('sessioni.html'),projects=read('progetti.html'),invoice=read('fatture.html'),finder=read('kyv-audio-finder-ui-v245.js'),sheet=read('scheda_progetto.html');
assert.ok(sheet.includes("new CustomEvent('kyv:project-selected'"),'Changing project updates contextual route');
assert.ok(sheet.includes("projectRoute.searchParams.set('id',String(p.ID))"),'Project ID is written to URL immediately');
assert.ok(nav.includes("document.addEventListener('kyv:project-selected',updateLinks)"),'Journey nav refreshes when sheet project changes');
assert.ok(sessions.includes('id="session-project-context"'));
assert.ok(sessions.includes("selectedJourneyProjectId()"));
assert.ok(sessions.includes('if(selectedProject&&String(row.ID)!==selectedProject)return false;'));
assert.ok(sessions.includes("KYV_EDITOR_READ_V267.readComplete(supabaseClient,'PROGETTI','ID')"));
assert.ok(!sessions.includes("from('PROGETTI').select('*').order('Data_Sessione'"),'No silent 1000 row cap in Sessions');
assert.ok(projects.includes("href=\"sessioni.html?projectId="),'Quick view has project-specific sessions');
assert.ok(invoice.includes("get('collegaProgetto')"),'Invoice context is passive and does not start split modal');
assert.ok(finder.includes("const project=params.get('project')"),'Audio Finder uses context for selector only');
assert.ok(finder.includes("$('link-project').value=project"),'Audio Finder still requires an explicit submit');
assert.doesNotMatch(read('kyv-flow-routes-v269.js'),/\.(?:insert|update|upsert|delete)\(/);
assert.ok(read('sw.js').includes("'./kyv-flow-routes-v269.js'"));
assert.ok(read('sw.js').includes("'./sessioni.html'"),'Sessioni shell is available offline when cached');
assert.ok(read('sw.js').includes("'./kyv-editor-read-v267.js'"));
assert.ok(read('sw.js').includes('kyv-studio-v2-74-recenti-order-20261104'));
assert.ok(read('config.js').includes("APP_VERSION: '2.74'"));
assert.equal(read('VERSION').trim(),'2.74');
assert.equal(require('../package.json').version,'2.74.0');
assert.ok(require('../package.json').scripts.check.includes('check:project-journey-v269'));
assert.ok(read('guida.html').includes('v2.69'));
assert.ok(read('kyv-help.js').includes('v2.69'));
assert.ok(read('kyv-help.js').includes("['progetti','scheda','sessioni','audiofinder','fatture']"),'Context help belongs to the journey pages');
console.log('OK: v2.69 contextual project routes and verified Session reads, no automatic writes');
