const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');const read=p=>fs.readFileSync(p,'utf8'),w={};vm.runInNewContext(read('kyv-help.js'),{window:w});
for(const k of ['audiofinder','creative','analyst','intelligence','returns','liquidazioni']){const g=w.KYV_HELP.getContent(k);assert.ok(g.title.length>5&&g.content.length>140,k);}
for(const p of ['kyv_audio_finder.html','kyv_scrivania_creativa.html']){const s=read(p);assert.ok(s.includes('src="kyv-help.js"'));assert.ok(s.indexOf('src="kyv-help.js"')<s.indexOf('src="menu.js"'));}
for(const [p,k] of [['kyv_analyst.html','guida-analyst'],['kyv_intelligence.html','guida-intelligence'],['kyv_ritorni_progetti.html','guida-returns'],['kyv_liquidazioni.html','guida-liquidazioni']])assert.ok(read(p).includes('guida.html#'+k));
for(const k of ['novita-v245','guida-audio-finder','guida-creative','guida-analyst','guida-intelligence','guida-returns','guida-liquidazioni'])assert.ok(read('guida.html').includes('id="'+k+'"'));
assert.ok(read('MANUALE_OPERATIVO.md').includes('Aggiornamento 31 ottobre 2026'));
for(const s of ['guida.html','kyv-help.js'])assert.ok(read('sw.js').includes("'./"+s+"'"));
console.log('OK: KYV help/manual v2.45');
