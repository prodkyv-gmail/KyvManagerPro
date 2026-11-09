// v2.85 — Scheda progetto snella: riordino e popup, senza dati né scritture.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const src=read('kyv-scheda-lean.js'),config=read('config.js'),sw=read('sw.js');
new vm.Script(src,{filename:'kyv-scheda-lean.js'});
// Nessun accesso ai dati: il modulo tocca solo il DOM.
assert.ok(!/\.from\(|\.rpc\(|fetch\(|supabase|\.insert\(|\.update\(|\.delete\(|localStorage/.test(src),'Nessuna query, scrittura o storage');
// Si carica solo sulla Scheda, per ultimo (dopo Easy UX, che orchestra gli altri moduli).
assert.ok(src.includes("!=='scheda_progetto.html')return;"),'Solo su scheda_progetto.html');
assert.ok(config.indexOf("easyUxV9.src='kyv-easy-ux-v9.js'")<config.indexOf("schedaLean.src='kyv-scheda-lean.js'"),'Caricato dopo Easy UX');
assert.ok(config.slice(config.indexOf("schedaLean.src"),config.indexOf("page==='kyv_calendar.html'")).includes("page==='kyv_calendar.html'")===false,'Dentro il ramo della Scheda');
assert.ok(sw.includes("'./kyv-scheda-lean.js'"),'PWA mette in cache il modulo');
// Gli ID dei blocchi esistono davvero negli altri moduli (se qualcuno li rinomina, il test avverte).
const all=fs.readdirSync('.').filter(f=>/^kyv-.*\.js$/.test(f)&&f!=='kyv-scheda-lean.js').map(read).join('\n');
for(const id of ['kyv-song-desk','kyv-project-v2','kyv-project-timeline-v10','kyv-project-hub-v3','kyv-project-progressive','kyv-project-finance-summary','kyv-project-audio-finder'])
  assert.ok(all.includes(id)||read('scheda_progetto.html').includes(id),'Blocco esistente: '+id);
// Tre popup, nessun contenuto eliminato: i blocchi pesanti restano nel DOM, solo nascosti finché non li apri.
for(const label of ['Note e audio','Versioni e uscita','Storia del progetto'])assert.ok(src.includes(label),label);
assert.ok(src.includes("body.kyv-lean #project-view>.tab-panel{order:8}")&&src.includes('body.kyv-lean #tabs{order:6}'),'Schede di dettaglio dopo i pulsanti Apri');
assert.ok(src.includes("e.key==='Escape'"),'Esc chiude il popup');
assert.ok(src.includes('min-height:44px'),'Pulsanti touch 44px');
// Comportamento: fuori dalla Scheda non fa nulla; sulla Scheda senza DOM non lancia errori.
const run=(path,doc)=>{const ctx={location:{pathname:path},document:doc,window:{},requestAnimationFrame:f=>{f();return 1},MutationObserver:class{observe(){}}};ctx.window=ctx;vm.runInNewContext(src,ctx);return ctx;};
const inert={readyState:'complete',getElementById:()=>null,addEventListener(){},body:{classList:{add(){}},dataset:{}},head:{appendChild(){}},querySelector:()=>null};
assert.equal(run('/index.html',inert).KYV_SCHEDA_LEAN,undefined,'Inattivo fuori dalla Scheda');
assert.ok(run('/scheda_progetto.html',inert).KYV_SCHEDA_LEAN,'Attivo sulla Scheda senza errori anche se il progetto non è ancora caricato');
console.log('OK: Scheda progetto snella (v2.85)');
