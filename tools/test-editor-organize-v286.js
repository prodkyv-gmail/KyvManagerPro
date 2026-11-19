/* Studio Editor v2.86 – date-first navigation, filters, preferences and no-data-loss tests. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=x=>fs.readFileSync(x,'utf8');
const root={};
vm.runInNewContext(read('kyv-editor-organize-v286.js'),{window:root,Date});
const api=root.KYV_EDITOR_ORGANIZE_V286;
assert.ok(api);
assert.deepEqual(Array.from(api.PRIMARY),['PROGETTI','FATTURE','ESTRATTO SIAE','ESTRATTO_IMAIE']);
const columns={
 PROGETTI:['ID','Data_Sessione','Data_Pubblicazione','Prossimo_Followup'],
 FATTURE:['ID_FT','Data','PAGATA'],
 'ESTRATTO SIAE':['ID_ECSIAE','DATA','IMPORTO'],
 ESTRATTO_IMAIE:['id','created_at','DATA_PUBBL'],
 CLIENTI:['ID_CLIENTE','Nome_Denominazione'],
 'EXPORT SIAE':['Cod. Opera','Titolo'],
 'EXPORT SIAE VERTICALE':['ID_SIAVERT','Cod. Opera'],
 'PIANI_FISCALI':['id','Anno','Data_Aggiornamento'],
 'Spese Extra':['ID_SPESE','Data'],
 'CONSEGNE_MASTER':['ID_CONSEGNA','Data_Inserimento'],
 AUDIO_VERSIONI:['ID_VERSIONE','DATA_FILE','created_at'],
 DROPBOX_AUDIO_FILES:['ID_FILE','Data_Caricamento','created_at'],
 INVII_AUDIO:['ID_INVIO','Data_Invio','created_at'],
 DOCUMENTI_PROGETTO:['ID_DOCUMENTO','Data_Documento']
};
const pks={PROGETTI:'ID',FATTURE:'ID_FT','ESTRATTO SIAE':'ID_ECSIAE',ESTRATTO_IMAIE:'id',
 CLIENTI:'ID_CLIENTE','EXPORT SIAE':'Cod. Opera','EXPORT SIAE VERTICALE':'ID_SIAVERT',PIANI_FISCALI:'id',
 'Spese Extra':'ID_SPESE',CONSEGNE_MASTER:'ID_CONSEGNA',AUDIO_VERSIONI:'ID_VERSIONE',
 DROPBOX_AUDIO_FILES:'ID_FILE',INVII_AUDIO:'ID_INVIO',DOCUMENTI_PROGETTO:'ID_DOCUMENTO'};
const expected={
 PROGETTI:'Data_Sessione',FATTURE:'Data','ESTRATTO SIAE':'DATA',ESTRATTO_IMAIE:'created_at',
 CLIENTI:'ID_CLIENTE','EXPORT SIAE':'Cod. Opera','EXPORT SIAE VERTICALE':'ID_SIAVERT',
 PIANI_FISCALI:'Data_Aggiornamento','Spese Extra':'Data',CONSEGNE_MASTER:'Data_Inserimento',
 AUDIO_VERSIONI:'DATA_FILE',DROPBOX_AUDIO_FILES:'Data_Caricamento',INVII_AUDIO:'Data_Invio',
 DOCUMENTI_PROGETTO:'Data_Documento'
};
for(const [table,keys]of Object.entries(columns)){
 const sort=api.defaultSort(table,keys,pks[table]);
 assert.equal(sort.column,expected[table],table+' default date/fallback');
 assert.equal(sort.descending,true,'Newest-first for '+table);
 assert.equal(sort.isDate,!['CLIENTI','EXPORT SIAE','EXPORT SIAE VERTICALE'].includes(table),table+' date availability');
}
assert.equal(api.dateNumber('19/11/2026'),Date.UTC(2026,10,19));
assert.equal(api.dateNumber('2026-11-19'),Date.UTC(2026,10,19));
assert.equal(api.dateNumber('2026'),Date.UTC(2026,0,1));
assert.equal(api.dateNumber('not a date'),null);
assert.equal(api.statusPaid('Sì'),'paid');
assert.equal(api.statusPaid('PAGATA'),'paid');
assert.equal(api.statusPaid('Non pagata'),'unpaid');
assert.equal(api.statusPaid('Da incassare'),'unpaid');
assert.equal(api.statusPaid(''),'unknown','Empty payment status never claims incasso');
const today=new Date(2026,10,19,12);
const rows=[
 {ID:1,TITOLO:'Brano',ARTISTA:'Artista',Prossimo_Followup:'2026-11-18',Data_Sessione:'2026-11-10'},
 {ID:2,TITOLO:'',ARTISTA:'',Prossimo_Followup:'2026-12-19',Data_Sessione:'2026-01-01'},
 {ID:3,TITOLO:'Nuovo',ARTISTA:'Artista',Data_Sessione:null},
 {ID:4,TITOLO:'Recentissimo',ARTISTA:'Artista',Data_Sessione:'2026-11-20'}];
const ids=rows=>Array.from(rows,r=>r.ID);
assert.deepEqual(ids(api.filterRows(rows,{table:'PROGETTI',filter:'followup',dateColumn:'Data_Sessione',today})),[1]);
assert.deepEqual(ids(api.filterRows(rows,{table:'PROGETTI',filter:'missing',dateColumn:'Data_Sessione',today})),[2]);
assert.deepEqual(ids(api.filterRows(rows,{table:'PROGETTI',filter:'recent30',dateColumn:'Data_Sessione',today})),[1]);
assert.deepEqual(ids(api.filterRows(rows,{table:'PROGETTI',filter:'no_date',dateColumn:'Data_Sessione',today})),[3]);
assert.deepEqual(ids(api.filterRows(rows,{table:'PROGETTI',filter:'all',dateColumn:'Data_Sessione',today})),[1,2,3,4]);
assert.deepEqual(Array.from(api.rowFlags('PROGETTI',rows[0],today),v=>v.label),['Follow-up previsto']);
assert.deepEqual(Array.from(api.rowFlags('PROGETTI',rows[1],today),v=>v.label),['Dati da completare']);
const invoices=[{ID_FT:10,PAGATA:'no',Data:'2026-11-16'},{ID_FT:11,PAGATA:'Sì',Data:'2026-11-15'},{ID_FT:12,PAGATA:null,Data:'2026-11-14'}];
assert.deepEqual(Array.from(api.filterRows(invoices,{table:'FATTURE',filter:'unpaid'}),x=>x.ID_FT),[10]);
assert.deepEqual(Array.from(api.filterRows(invoices,{table:'FATTURE',filter:'payment_unknown'}),x=>x.ID_FT),[12]);
assert.deepEqual(Array.from(api.rowFlags('FATTURE',invoices[0],today),x=>x.label),['Da incassare']);
assert.deepEqual(Array.from(api.rowFlags('FATTURE',invoices[2],today),x=>x.label),['Incasso da verificare']);
const choices=api.availableFilters('PROGETTI','Data_Sessione');
assert.ok(choices.some(x=>x.value==='followup')&&choices.some(x=>x.value==='recent30'));
assert.deepEqual(Array.from(api.availableFilters('CLIENTI',null),x=>x.value),['all']);
assert.deepEqual(Array.from(api.availableFilters('FATTURE','Data'),x=>x.value),['all','recent30','recent365','no_date','unpaid','payment_unknown']);
assert.deepEqual(JSON.parse(JSON.stringify(api.safePreferences('{"PROGETTI":{"filter":"followup","pageSize":240},"FATTURE":{"filter":"evil","pageSize":999}}'))),
 {PROGETTI:{filter:'followup',pageSize:240},FATTURE:{filter:'all',pageSize:120}});
const html=read('editor.html'),css=read('kyv-editor-organize-v286.css'),sw=read('sw.js'),pkg=JSON.parse(read('package.json'));
const nav=html.split('id="editor-tabs"')[1].split('<!-- CONTENITORE RICERCA E AZIONI -->')[0];
const navOrder=['PROGETTI','FATTURE','ESTRATTO SIAE','ESTRATTO_IMAIE'];
let prev=-1;
for(const table of navOrder){const index=nav.indexOf('id="tab-'+table+'"');assert.ok(index>prev,table+' must be in primary order');prev=index;}
const extra=nav.split('id="editor-extra-tables-menu"')[1];
for(const table of ['CLIENTI','CONSEGNE_MASTER','Spese Extra','PIANI_FISCALI','EXPORT SIAE VERTICALE','EXPORT SIAE',
 'AUDIO_VERSIONI','DROPBOX_AUDIO_FILES','INVII_AUDIO','DOCUMENTI_PROGETTO'])
 assert.ok(extra.includes('id="tab-'+table+'"'),table+' remains available in other tables');
assert.equal((nav.match(/data-action="load-table"/g)||[]).length,14,'No archive navigation lost');
assert.match(html,/currentSortColumn=editorDefaultSort\.column/,'Date sorting applied to verified table data');
assert.match(html,/currentSortDesc=editorDefaultSort\.descending/,'Newest-first on every table open');
assert.match(html,/filterRows\(searched/,'Filter/search chain uses entire rows');
assert.match(html,/storeEditorPrefs\(currentEditorTable/,'Per-table preferences are persisted');
assert.match(html,/kyv-editor-signal-pill/,'Signals displayed without altering records');
assert.match(html,/currentEditorData\.forEach\(row => csv \+=/,'CSV still contains complete source archive');
assert.match(html,/if\(!kyvEmbeddedProject\)loadEditorTable\('PROGETTI'\)/,'Embedded project popup remains isolated');
assert.match(html,/KYV_EDITOR_ORGANIZE_V286\.dateNumber\(str\)/,'Italian date sorting is handled');
assert.match(css,/@media\(max-width:700px\)/,'Responsive filters and secondary navigation');
for(const path of ['kyv-editor-organize-v286.js','kyv-editor-organize-v286.css'])assert.ok(sw.includes("'./"+path+"'"));
assert.equal(pkg.scripts['check:editor-organize-v286'],'node tools/test-editor-organize-v286.js');
assert.doesNotMatch(read('kyv-editor-organize-v286.js'),/\.from\(|\.update\(|\.insert\(|\.delete\(|fetch\(|MutationObserver/,
 'Organize helper is pure, with no network or mutation');
console.log('OK Editor v2.86: priority tabs, date-desc, row filters/highlights, preferences, CSV and popup preserved.');
