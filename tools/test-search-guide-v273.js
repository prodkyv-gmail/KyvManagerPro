// v2.73: exact project search, visible reset, detailed manual and contextual help.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('progetti.html'),src=read('kyv-project-list-v250.js');
const help=read('kyv-help.js'),guide=read('guida.html'),config=read('config.js');
const pkg=require('../package.json'),sw=read('sw.js');
const fakeWindow={};
vm.runInNewContext(src,{window:fakeWindow});
const M=fakeWindow.KYV_PROJECT_V250;
assert.ok(M&&typeof M.filterRows==='function','Project search contract must be available');
const rows=[
 {ID:41,TITOLO:'Caffè lungo',ARTISTA:'Emma',STATO:'In lavorazione',SVILUPPO:'Inviare demo',NOTE:'Strofa pianoforte',updated_at:'2026-10-01'},
 {ID:141,TITOLO:'Altro pezzo',ARTISTA:'Joseph',STATO:'Pubblicata',SVILUPPO:'Finita',NOTE:'Test ID:41',updated_at:'2026-10-02'},
 {ID:42,TITOLO:'Perduto',ARTISTA:'Malika',STATO:'In attesa',SVILUPPO:'Feedback',NOTE:'Da controllare',updated_at:'2026-10-03'}
];
const ids=(query,other={})=>M.filterRows(rows,{mode:'TUTTI',query,...other}).map(p=>p.ID);
assert.deepEqual([...ids('#41')],[41],'#ID must search only exact ID');
assert.deepEqual([...ids('id:41')],[41],'id:ID alternate exact lookup');
assert.deepEqual([...ids('ID: 41')],[41],'Whitespace in ID lookup');
assert.ok(ids('141').includes(141),'Numeric search must include the matching ID');
assert.deepEqual([...ids('caffe emma')],[41],'Accent-insensitive multi-token search');
assert.deepEqual([...ids('pianoforte')],[41],'Note still searchable');
assert.deepEqual([...ids('#41',{mode:'USCITI'})],[],'Active mode still constrains exact ID');
assert.deepEqual([...ids('#41',{mode:'DA_FARE'})],[41],'Valid ID with active mode');
const wide=Array.from({length:61},(_,i)=>({ID:i+1,TITOLO:'Brano '+(i+1),updated_at:'2026-10-'+String(i%28+1).padStart(2,'0')}));
assert.equal(M.filterRows(wide,{mode:'RECENTI'}).length,40,'Recenti must show 40 by default');
assert.equal(M.filterRows(wide,{mode:'TUTTI'}).length,61,'Tutti must include all verified rows');
assert.equal(M.filterRows(wide,{mode:'RECENTI',query:'#61'}).length,1,'Exact lookup must bypass Recenti cap');
const inline=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(inline,{filename:'progetti.html:inline'});
assert.equal((html.match(/id="project-clear-filters"/g)||[]).length,1,'Exactly one reset control');
assert.equal((html.match(/id="project-filter-note"/g)||[]).length,1,'Exactly one active-filter summary');
assert.ok(html.includes('<div class="project-filter-status">'),'Filter summary stays outside advanced accordion');
assert.ok(html.indexOf('id="project-filter-note"')<html.indexOf('<details id="project-advanced-details"'),'Reset and summary must be visible before closed advanced filters');
assert.ok(html.includes("el('project-clear-filters').hidden=!hasFilters"),'Reset available only when criteria are active');
assert.ok(html.includes("state.filter='RECENTI';state.shown=50;search.value=''"),'Existing clear handler resets view and query');
assert.ok(html.includes("btn.setAttribute('aria-pressed',String(btn.dataset.filter===state.filter))"),'Main filter button state stays accessible');
assert.ok(html.includes('aria-describedby="project-filter-note"'),'Search input describes result filters');
assert.ok(html.includes("count.textContent=rows.length+"),'Filtered result counts preserved');
assert.ok(html.includes('M.filterRows(state.rows'),'Filter engine remains centralized');
assert.doesNotMatch(src,/\.(?:insert|update|upsert|delete)\(/,'Filter library may not write data');
const helpHost={};vm.runInNewContext(help,{window:helpHost});
const keys=['progetti','scheda','sessioni','audiofinder','fatture','rendiconto','editor','dashboard','integrazioni','analyst'];
for(const key of keys){
 const item=helpHost.KYV_HELP.getContent(key);
 assert.ok(item.content.includes('v2.73'),key+' contextual procedure absent');
 assert.ok(item.content.includes('guida.html#v273-')||item.content.includes('guida.html#guida-pratica-v273'),key+' must link to expanded guide');
}
const sections=['guida-pratica-v273','v273-search','v273-scheda','v273-sessioni','v273-contabilita','v273-editor','v273-problemi'];
for(const id of sections)assert.ok(guide.includes('id="'+id+'"'),'Missing detailed guide section '+id);
assert.ok(guide.includes('href="#guida-pratica-v273"'),'Latest manual chapter first in navigation');
assert.ok(guide.indexOf('id="guida-pratica-v273"')<guide.indexOf('id="novita-v245"'),'Latest guide appears ahead of historical content');
for(const phrase of ['#41','Azzera filtri','40 progetti','Conferma collegamento','Fatture non disponibili','Studio Editor','Ctrl+K','Cmd+K'])assert.ok(guide.includes(phrase),'Missing explanation: '+phrase);
assert.ok(read('docs/MANUALE_PRATICO_V273.md').length>5500,'Practical manual not sufficiently detailed');
assert.ok(read('MANUALE_OPERATIVO.md').includes('Manuale pratico dettagliato v2.73'),'Primary manual must include full instructions');
assert.ok(config.includes("APP_VERSION: '2.81'"));
assert.equal(read('VERSION').trim(),'2.81');
assert.equal(pkg.version,'2.81.0');
assert.ok(sw.includes('kyv-studio-v2-81-economy-audit-20261105'));
assert.ok(pkg.scripts.check.includes('check:search-guide-v273'));
console.log('OK: v2.73 search ID, clear filter visibility, guide chapter and detailed contextual help');