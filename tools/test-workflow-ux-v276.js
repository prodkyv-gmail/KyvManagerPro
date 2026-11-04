// KYVManagerPro v2.76 — no duplicate bars, correct counters and preserved filters.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const project=read('progetti.html'),session=read('sessioni.html'),invoice=read('fatture.html'),editor=read('editor.html'),polish=read('kyv-layout-polish.js');
const css=read('kyv-operational-ui-v276.css'),guide=read('guida.html'),help=read('kyv-help.js'),sw=read('sw.js');
for(const [page,src] of [['sessioni',session],['fatture',invoice],['editor',editor]]){
 assert.ok(src.includes('href="kyv-operational-ui-v276.css"'),page+' must use the same toolbar CSS');
 assert.equal((src.match(/kyv-v276-toolbar/g)||[]).length,1,page+' must have one operational toolbar');
}
assert.match(css,/min-height:44px/);assert.match(css,/:focus-visible/);
assert.ok(polish.includes('body.kyv-safe-projects-polished .header{padding:calc(12px + env(safe-area-inset-top,0px)) 14px 12px!important}'),'Late project polish must not override compact mobile header');
assert.ok(!polish.includes('body.kyv-safe-projects-polished .header{padding:68px'),'Old conflicting header override removed');
assert.ok(project.includes('.header-top>div:first-child{padding-left:52px'),'Mobile title must reserve menu space');
assert.equal((session.match(/id="session-results-status"/g)||[]).length,1);
assert.ok(session.includes('aria-describedby="session-results-status"'));
assert.ok(session.includes('const timelineAll = rows.flatMap(')&&session.includes('const timelineItems = timelineAll.slice(0, 24)'),'Timeline cap cannot be mistaken for total');
assert.ok(session.includes('Le metriche Oggi/Prossime/Master/Uscite si riferiscono all’intero archivio caricato.'),'General metrics must be distinct from filtered rows');
assert.ok(session.includes("['metric-oggi','metric-prossime','metric-master','metric-uscite','timeline-count']"),'Failed load clears stale metrics');
assert.ok(session.includes("document.getElementById('followup-list').innerHTML = emptyState('Dati non disponibili'"),'Failed load cannot show stale follow-ups');
assert.equal((invoice.match(/id="kyv-invoice-filter-status"/g)||[]).length,1);
assert.ok(invoice.includes('aria-describedby="kyv-invoice-filter-status"'));
assert.ok(!invoice.includes("document.getElementById('correlazione-search').value = ''"),'Do not clear invoice search during reload/save');
assert.ok(invoice.includes('const shown=hNopag.length+hPag.length;')&&invoice.includes('const total=correlazioneFattureGlobal.length;'));
assert.ok(invoice.includes("searchTxt?'alle fatture filtrate dalla ricerca':'alle fatture caricate'"),'Filtered totals must be explained');
assert.ok(invoice.includes('Registro fatture non disponibile'),'Failed invoice load must be distinct from zero matches');
assert.ok(editor.includes('aria-label="Apri menu"'));
for(const label of ['Esporta CSV della tabella corrente','Aggiungi un record nella tabella corrente','Alterna vista compatta e larga'])assert.ok(editor.includes('aria-label="'+label+'"'),label);
assert.ok(editor.includes("btn.setAttribute('aria-pressed',String(compact))"),'Density toggle state must remain accessible');
assert.ok(editor.includes('id="editor-view-status"'),'Editor preserves existing record counts');
assert.ok(guide.includes('id="v276-workflow"')&&guide.includes('Manuale corrente · v'+read('VERSION').trim()));
const root={};vm.runInNewContext(help,{window:root});
for(const key of ['progetti','sessioni','fatture','editor'])assert.ok(root.KYV_HELP.getContent(key).content.includes('v2.76 · Comandi coerenti'),key+' contextual help');
assert.ok(read('MANUALE_OPERATIVO.md').includes('v2.76 — Coerenza operativa'));
assert.ok(read('docs/MANUALE_PRATICO_V273.md').includes('Aggiornamento v2.76'));
assert.equal(read('VERSION').trim(),'2.79');
assert.equal(require('../package.json').version,'2.79.0');
assert.ok(read('config.js').includes("APP_VERSION: '2.79'"));
assert.ok(sw.includes('kyv-studio-v2-79-integrated-modal-ux-20261104')&&sw.includes("'./kyv-operational-ui-v276.css'"));
assert.ok(require('../package.json').scripts.check.includes('check:workflow-ux-v276'));
for(const [name,page] of [['project',project],['session',session],['invoice',invoice],['editor',editor]]){
 for(const part of page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
   if(part[1].trim())new vm.Script(part[1],{filename:name+':inline'});
 }
}
console.log('OK v2.76: workflow UX, counters, search preservation, accessibility and guide');
