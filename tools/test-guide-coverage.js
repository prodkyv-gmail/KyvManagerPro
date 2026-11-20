// Guide synchronization contract — new features must carry contextual and complete manual help.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const pkg=JSON.parse(read('package.json'));
const version=pkg.version.replace(/\.0$/,'');
const guide=read('guida.html'),helpSource=read('kyv-help.js'),menu=read('menu.js'),sw=read('sw.js');
const window={};
vm.runInNewContext(helpSource,{window});
assert.equal(typeof window.KYV_HELP?.getContent,'function','Contextual guide must provide a lookup API');
const pages=[
 {path:'kyv_scrivania_creativa.html',key:'creative',anchor:'guida-creativa',need:['Registra sessione','Collega brano','Piazzamenti','follow-up']},
 {path:'kyv_audio_finder.html',key:'audiofinder',anchor:'guida-audiofinder',need:['Google Drive','Dropbox','Salva metadati','Conferma collegamento','OneDrive']},
 {path:'kyv_analyst.html',key:'analyst',anchor:'guida-analyst',need:['Sessioni e piazzamenti','fee zero']},
 {path:'fatture.html',key:'fatture',anchor:'guida-economia',need:['Fatture incassate','acconti','PAGATA']},
 {path:'progetti.html',key:'progetti',anchor:'guida-creativa',need:['Scrivania creativa','Audio Finder']},
 {path:'scheda_progetto.html',key:'scheda',anchor:'guida-audiofinder',need:['Audio Finder','collegamenti']},
 {path:'integrazioni.html',key:'integrazioni',anchor:'novita-v245',need:['Scrivania creativa','Audio Finder']},
 {path:'kyv_drive.html',key:'drive',anchor:'guida-audiofinder',need:['Drive','Audio Finder']},
 {path:'kyv_dropbox.html',key:'dropbox',anchor:'guida-audiofinder',need:['Dropbox','Audio Finder']}
];
// Current 20 November workflows (historical help remains, but current instructions take precedence).
const currentPages=[
 {path:'index.html',key:'home',anchor:'guida-cattura-note',need:['+ Note','Taccuino KYV','Detta testo','Salva nota']},
 {path:'kyv_notes.html',key:'notes',anchor:'v287-notes',need:['Nuova nota','matita','Descrizione','Elimina']},
 {path:'kyv_calendar.html',key:'calendar',anchor:'guida-agenda-locale',need:['Archivio locale','Importa selezionati','500','Google Calendar','Google Apps Script']},
 {path:'acquisisci_audio.html',key:'nuovo',anchor:'guida-add-progetto-locale',need:['Archivio locale','50 MB','Controlla duplicati','Drive','Dropbox']},
 {path:'editor.html',key:'editor',anchor:'guida-editor-v286',need:['Altre tabelle','data decrescente','60','Azzera filtri','IMAIE']}
];
for(const entry of currentPages){
 const content=window.KYV_HELP.getContent(entry.key);
 assert.ok(content?.title?.startsWith('Guida'),entry.key+' must have its own dedicated guide');
 for(const phrase of entry.need)
  assert.ok(content.content.includes(phrase),entry.key+' guide missing current instruction: '+phrase);
 assert.ok(guide.includes('id="'+entry.anchor+'"'),entry.anchor+' current manual anchor missing');
 assert.ok(fs.existsSync(entry.path),entry.path+' page missing');
}
for(const anchor of ['guida-aggiornamenti-20261120','guida-cattura-note','guida-agenda-locale',
 'guida-add-progetto-locale','guida-editor-v286','v287-notes']){
 assert.ok(guide.includes('href="#'+anchor+'"'),'Current manual index must link '+anchor);
}
assert.ok(guide.indexOf('id="guida-aggiornamenti-20261120"')<
 guide.indexOf('id="v282-stability"'),'20 November instructions must appear before older history');
const notebook=read('kyv_notes.html'),quick=read('kyv-notes-quick.js'),home=read('index.html');
assert.ok(home.indexOf('<strong>+ Note</strong>')<home.indexOf('<strong>Agenda</strong>'),'Home + Note before Agenda');
assert.ok(notebook.includes('src="kyv-notes-simple.js"')&&!notebook.includes('src="kyv-notes-advanced.js"'),
 'Notebook current UI must be a simple list, without pen/timeline panels');
assert.ok(notebook.includes('id="notes-search"')&&notebook.includes('id="notes-list"')&&notebook.includes('id="notes-dialog"'));
assert.ok(quick.includes('id="kyv-notes-quick-dictate"')&&quick.includes('id="kyv-notes-quick-record"'),
 'Unchanged quick capture still supports dictation and recording');
const calendar=read('kyv_calendar.html');
for(const id of ['kyv-agenda-local-import','kyv-agenda-local-file','kyv-agenda-local-preview','kyv-agenda-local-save'])
 assert.ok(calendar.includes('id="'+id+'"'),'Agenda local import control '+id+' missing');
const intake=read('acquisisci_audio.html');
for(const id of ['kyv-local-audio-choose','kyv-local-audio-project','kyv-local-audio-check','kyv-local-audio-import'])
 assert.ok(intake.includes('id="'+id+'"'),'ADD Progetto local audio control '+id+' missing');
const editor=read('editor.html');
const ordered=['data-table="PROGETTI"','data-table="FATTURE"','data-table="ESTRATTO SIAE"',
 'data-table="ESTRATTO_IMAIE"'];
for(let i=1;i<ordered.length;i++)
 assert.ok(editor.indexOf(ordered[i-1])<editor.indexOf(ordered[i]),'Editor main tab order incorrect');
for(const id of ['editor-extra-table-select','editor-fast-filter','editor-page-size','editor-reset-filters'])
 assert.ok(editor.includes('id="'+id+'"'),'Editor presentational control missing '+id);
const manuals=['README.md','MANUALE_OPERATIVO.md','docs/MANUALE_PRATICO_V273.md'];
for(const path of manuals){
 const txt=read(path);
 for(const phrase of ['Aggiornamento operativo attuale · 20 novembre 2026','Cattura veloce',
  'Archivio locale','Taccuino KYV','Studio Editor','Agenda','50 MB','500 appuntamenti'])
  assert.ok(txt.includes(phrase),path+' missing current instruction '+phrase);
}
const qa=read('docs/QA_GUIDE_SYNC_20261120.md');
assert.ok(qa.includes('Taccuino')&&qa.includes('Agenda')&&qa.includes('Studio Editor'),
 'Guide release needs a manual test checklist');
const guidePolicy=read('docs/GUIDE_SYNC_POLICY.md');
for(const key of ['home','notes','calendar','nuovo','editor'])assert.ok(guidePolicy.includes('`'+key+'`'),
 'Guide policy must register '+key);
assert.match(guide,/<title>KYV Studio — Manuale operativo aggiornato<\/title>/);
assert.ok(guide.includes("id=\"guide-app-version\""),'Manual version must be dynamic');
assert.ok(guide.includes('id="guide-badge-version"'));
assert.ok(guide.includes('window.KYV_CONFIG?.APP_VERSION'), 'Manual must show current app version');
assert.ok(guide.includes('<script src="config.js"></script>'));
for(const {path,key,anchor,need} of pages){
 const entry=window.KYV_HELP.getContent(key);
 assert.ok(entry.title&&entry.title.startsWith('Guida:'),'Dedicated help missing for '+key);
 assert.ok(typeof entry.content==='string'&&entry.content.length>350,'Short/generic help for '+key);
 for(const token of need)assert.ok(entry.content.includes(token),'Help '+key+' missing '+token);
 assert.ok(fs.existsSync(path),path+' must exist');
 assert.ok(guide.includes('id="'+anchor+'"'),'Missing manual anchor '+anchor);
 assert.ok(guide.includes('href="#'+anchor+'"')||guide.includes('href="guida.html#'+anchor+'"')||guide.includes('id="'+anchor+'"'));
}
for(const [page,anchor] of [['kyv_scrivania_creativa.html','guida-creativa'],['kyv_audio_finder.html','guida-audiofinder'],['kyv_analyst.html','guida-analyst']]){
 const html=read(page);
 assert.ok(html.includes('href="guida.html#'+anchor+'"'),'Page '+page+' needs direct manual link');
}
assert.ok(menu.includes('function ensureKyvHelpLoaded()'),'Contextual loader must be installed globally');
assert.ok(menu.includes("script.src = 'kyv-help.js';"));
assert.ok(menu.includes('window.KYV_ACTIVE_HELP_PAGE = activePage'),'Help must use the actual active page');
assert.ok(menu.includes('script.onload = () => {'),'Help must remount after loading');
assert.ok(sw.includes("'./guida.html'")&&sw.includes("'./kyv-help.js'"),'PWA must cache manual and contextual guide');
assert.ok(sw.includes(require('./release-contract').cacheName()),'Refresh guide offline cache');
assert.ok(pkg.scripts.check.includes('check:guide-coverage'),'Guide verification must gate full CI');
assert.equal(pkg.scripts['check:guide-coverage'],'node tools/test-guide-coverage.js');
const policy=read('docs/GUIDE_SYNC_POLICY.md');
assert.ok(policy.includes('nella stessa PR')&&policy.includes('test-guide-coverage.js'));
assert.equal(version ,require('./release-contract').version(),'Guide must match current functional release');
console.log('OK: current manual, nine contextual page guides, navigation, in-app entry points and offline/PWA help are synchronized');
