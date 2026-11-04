// KYV v2.61 — protect Safe Projects startup and ensure simplified project UI remains functional.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const safe=read('progetti.html'),sheet=read('scheda_progetto.html'),theme=read('kyv-theme.css'),
  engine=read('kyv-project-list-v250.js');
const ctx={window:{},Date,Map,Set,Intl,Object,Error,Number};
vm.runInNewContext(engine,ctx,{filename:'kyv-project-list-v250.js'});
const M=ctx.window.KYV_PROJECT_V250;
assert.ok(M&&typeof M.filterRows==='function'&&typeof M.distribution==='function');
const items=[
 {ID:7,TITOLO:'Caffè di notte',ARTISTA:'Émma',STATO:'In lavorazione',
  SVILUPPO:'Prossimo mix',created_at:'2026-09-01'},
 {ID:5,TITOLO:'Ultimo giorno',ARTISTA:'Giorgia',STATO:'Uscita',
  SVILUPPO:'Finita',created_at:'2026-08-01'},
 {ID:4,TITOLO:'Sessione estiva',ARTISTA:'Émma',STATO:'',
  SVILUPPO:'',created_at:'2026-07-01'}
];
assert.equal(M.filterRows(items,{mode:'TUTTI',query:'caffe',artist:'Emma'}).length,1,
 'Search remains accent independent, covers full given archive before rendering');
assert.equal(M.filterRows(items,{mode:'DA_FARE'}).length,1);
assert.equal(M.filterRows(items,{mode:'USCITI'}).length,1);
assert.equal(M.filterRows(items,{mode:'TUTTI',status:'__missing__'}).length,1,
 'Unknown status remains searchable');
assert.equal(M.coverage(items).total,3);
assert.equal(M.distribution(items,'STATO').reduce((n,x)=>n+x.count,0),3);
assert.match(safe,/window.KYV_SAFE_PROJECTS_PAGE = true/);
assert.ok(safe.includes('<script src="kyv-project-list-v250.js"></script>'));
assert.ok(!safe.includes('<script src="menu.js"'),'Do not load shared observer/sidebar into Safe Projects');
assert.ok(!safe.includes('href="kyv-theme.css"'),'Safe Projects styling stays isolated');
assert.ok(safe.includes("if(!data?.session){location.replace('login.html?next=progetti.html');return;}"),
 'Authentication still required before reading the database');
assert.ok(safe.includes("select('*',{count:'exact'})"),'Global paginated full-archive read unchanged');
assert.ok(safe.includes("if(first.count===null||first.count>limit)throw Error("),
 'Incomplete source count must not be represented as complete');
assert.ok(safe.includes("if(rows.length!==first.count||new Set(rows.map("));
assert.ok(!safe.includes("db.from('PROGETTI').insert("));
assert.ok(!safe.includes("db.from('PROGETTI').delete("));
for(const id of ['uscite-search','project-count','project-artist-filter','project-status-filter',
 'project-phase-filter','project-sort','project-clear-filters','project-view-toggle',
 'project-advanced-details','project-advanced-count','project-chart-details',
 'project-overview','project-overview-bars','project-overview-field','project-overview-more',
 'projects-table','tbody-uscite','project-load-more','project-quick-modal','project-quick-body',
 'new-project-choice-modal','project-quick-close'])
 assert.ok(safe.includes('id="'+id+'"'),id+' is still present');
assert.ok(safe.includes('<details id="project-advanced-details" class="proj-disclosure">'),
 'Filters use native disclosure, not a second filter implementation');
assert.ok(safe.includes('<details id="project-chart-details" class="proj-disclosure">'),
 'Independent overview chart uses native disclosure');
assert.ok(safe.includes("el('project-advanced-details').open=true"),
 'Clicking the overview opens changed filters for inspection');
assert.ok(safe.includes("activeAdvanced+' '"),'Active filters displayed in the header');
assert.ok(safe.includes("visibleRows()"),'UI continues calling existing filter engine');
assert.ok(safe.includes("M.distribution(state.rows,state.chartField)"),
 'Chart retains global archive scope independently from table filters');
for(const label of ['data-label="Progetto"','data-label="Stato"',
 'data-label="Prossima azione"','data-label="Ultima attività"','data-label="Azioni"'])
 assert.ok(safe.includes(label),'Mobile cards must describe data: '+label);
assert.match(safe,/@media\(max-width:820px\)\{[^}]*body\{overflow:auto\}/,
 'Keep safe mobile navigation shell');
assert.ok(safe.includes('.table-scroll tr.row{display:grid'));
assert.ok(safe.includes('.table-scroll .cell-secondary{display:block !important}'),
 'Compact mobile cards must not hide actual activity values');
assert.ok(safe.includes('function openQuick(id,trigger)'));
assert.ok(safe.includes('state.lastFocus=trigger||document.activeElement'));
assert.ok(safe.includes('if(focus?.isConnected)focus.focus()'));
assert.ok(safe.includes("event.key!=='Tab'")&&safe.includes('focusable[focusable.length-1]'),
 'Both modal dialogs trap keyboard focus');
assert.ok(safe.includes("if(current===quick)closeQuick();else closeNewProjectChoices();"),
 'Escape closes only the active modal');
assert.ok(safe.includes('aria-label="Apri riepilogo rapido di '));
assert.ok(safe.includes('href="scheda_progetto.html?id='));
assert.ok(safe.includes('href="kyv_audio_finder.html?project='));
assert.ok(safe.includes('href="fatture.html?ripartizione_progetto='));
assert.ok(safe.includes("Vista rapida in sola lettura. Nessun dato modificato"));
assert.ok(!safe.includes('document.write('));
for(const match of safe.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){
 const src=match[1].trim();if(src)new vm.Script(src,{filename:'progetti.html:inline'});
}
assert.ok(sheet.includes("const rows=matches.slice(0,q?80:12)"),
 'Picker displays 12 entries before search, 80 matched entries while searching');
assert.ok(sheet.includes("const matches=state.projects.filter("),
 'Project picker filters the entire loaded collection before slicing');
assert.ok(sheet.includes("title.textContent='Cambia progetto'"),
 'Picker label adapts after a successful selection');
assert.ok(sheet.includes("picker.removeAttribute('open')"),
 'Picker closes once the selected project becomes visible');
assert.ok(sheet.includes('onclick="openQuickEdit()"'),
 'Existing editor remains available unchanged');
assert.ok(sheet.includes('id="project-picker"')&&sheet.includes('id="project-search"'));
assert.ok(read('kyv-easy-ux-v9.js').includes("function restructureQuickEdit()"),
 'Easy/Complete mode continues to own original editor progressive fields');
for(const token of [
 'body.kyv-v260 #project-picker',
 'body.kyv-v260 #project-results',
 'body.kyv-v260 #kyv-song-desk',
 'body.kyv-v260.kyv-easy-mode #kyv-v2-next',
 'body.kyv-v260.kyv-easy-mode .kyv-project-progressive',
 'body.kyv-v260 #kyv-easy-wizard',
 'body.kyv-v260 #quick-edit-modal'
])assert.ok(theme.includes(token),'Shared theme must style the original component: '+token);
assert.ok(theme.includes('body.kyv-v260.kyv-easy-mode #kyv-v2-next,\nbody.kyv-v260.kyv-easy-mode .kyv-project-progressive {\n  display: none !important;'),
 'Redundant easy-mode shortcuts must be hidden, without destroying complete-mode content');
const sw=read('sw.js'),pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'2.79.0');
assert.equal(read('VERSION').trim(),'2.79');
assert.ok(sw.includes('kyv-studio-v2-79-integrated-modal-ux-20261104'));
assert.ok(pkg.scripts.check.includes('check:project-ux-v261'));
assert.equal(pkg.scripts['check:project-ux-v261'],'node tools/test-project-ux-v261.js');
assert.ok(read('guida.html').includes('v2.61'));
assert.ok(read('kyv-help.js').includes('v2.61'));
console.log('OK: v2.61 Safe Projects, full-index filtering, progressive graph, accessible dialogs, mobile cards and focused project mode');
