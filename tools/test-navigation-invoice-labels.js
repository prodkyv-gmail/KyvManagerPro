// v2.42.2: navigation, App Launcher auth bootstrap and semantic invoice labels.
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const producer=read('kyv-producer-mode.js'),menu=read('menu.js'),launcher=read('integrazioni.html'),
  invoices=read('fatture.html'),economy=read('kyv-economy-v6.js'),editor=read('editor.html'),
  record=read('kyv-record-editor.js'),collections=read('kyv-invoice-reconciliation-v236.js'),
  sw=read('sw.js'),pkg=JSON.parse(read('package.json'));
assert.ok(producer.includes("details('Amministrazione'"),'Producer Mode must call the group Amministrazione');
assert.ok(menu.includes('<span>Amministrazione</span>'),'Legacy sidebar group must have same name');
for(const [href,label] of [['fatture.html','Fatture emesse'],['kyv_intelligence.html','KYV Intelligence'],['kyv_analyst.html','KYV Analyst'],['kyv_ritorni_progetti.html','Ritorno dei progetti'],['kyv_liquidazioni.html','Liquidazioni SIAE / IMAIE']]){
 assert.ok(producer.includes("'"+href+"','"+label+"'"),'Producer sidebar missing '+href);
 assert.ok(menu.includes("'"+href+"'"),'Legacy sidebar missing '+href);
 assert.ok(fs.existsSync(href),'Navigation target missing: '+href);
}
const primary=producer.split('const primary=[')[1].split('];')[0];
assert.ok(primary.includes("['integrazioni.html','Tutte le app'"),'Producer mode needs visible launcher link');
const basic=menu.split('<nav class="flex-1 overflow-y-auto')[1].split('<details class="kyv-nav-group"')[0];
assert.ok(basic.includes("navItem('integrazioni', 'integrazioni.html'"),'Legacy sidebar needs visible launcher link');
const head=launcher.split('</head>')[0];
const order=['supabase/supabase-js@2.49.4','src="config.js"','src="kyv-core.js"','src="kyv-auth.js"','src="menu.js"'];
let last=-1;
for(const token of order){const index=head.indexOf(token);assert.ok(index>=0,'Launcher needs '+token);assert.ok(index>last,'Scripts must be in auth order: '+token);last=index;}
assert.ok(launcher.includes("loadKyvSidebar('integrazioni')"),'Launcher should initialize');
for(const href of ['fatture.html','kyv_intelligence.html','kyv_analyst.html'])assert.ok(launcher.includes('href="'+href+'"'),'Launcher card missing '+href);
assert.ok(invoices.includes('FATTURE INCASSATE'));
assert.ok(invoices.includes('FATTURE DA INCASSARE'));
assert.ok(!invoices.includes('FATTURE PAGATE'));
assert.ok(economy.includes('fatture incassate'));
assert.ok(economy.includes("v.kind==='paid'"),'Ledger state has priority over historical status');
assert.ok(collections.includes('indicate come incassate'));
assert.ok(record.includes("if (key === 'PAGATA') return 'Incassata dal cliente';"));
assert.ok(record.includes("key === 'PAGATA' || key === 'PAGAMENTO'"),'Stored schema unchanged');
assert.ok(editor.includes("tableName === 'FATTURE' && key === 'PAGATA' ? 'Incassata dal cliente' : key"),'Invoice field labels follow the current or related modal table');
assert.ok(editor.includes('data-col='),'Studio Editor retains original column keys');
assert.ok(editor.includes('data-sort='),'Sorting retains original column keys');
assert.ok(read('kyv_ritorni_progetti.html').includes('Incassato storico senza data'),'Bank dates still acknowledged as unknown');
assert.ok(sw.includes('kyv-studio-v2-69-project-journey-20261104'));
assert.ok(sw.includes("'./integrazioni.html'"),'Offline PWA shell must include launcher');
assert.equal(pkg.scripts['check:navigation-invoices'],'node tools/test-navigation-invoice-labels.js');
assert.ok(pkg.scripts.check.includes('check:navigation-invoices'));
console.log('OK: Administration visible, App Launcher auth bootstrapped, paid means incassata without changing financial schema');
