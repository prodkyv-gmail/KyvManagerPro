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
assert.ok(sw.includes('kyv-studio-v2-57-audio-audit-20261104'),'Refresh guide offline cache');
assert.ok(pkg.scripts.check.includes('check:guide-coverage'),'Guide verification must gate full CI');
assert.equal(pkg.scripts['check:guide-coverage'],'node tools/test-guide-coverage.js');
const policy=read('docs/GUIDE_SYNC_POLICY.md');
assert.ok(policy.includes('nella stessa PR')&&policy.includes('test-guide-coverage.js'));
assert.equal(version ,'2.57','Guide must match current functional release');
console.log('OK: current manual, nine contextual page guides, navigation, in-app entry points and offline/PWA help are synchronized');
