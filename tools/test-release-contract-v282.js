/* v2.82: central release contract, no synchronized old hardcoded cache assertions. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const c=require('./release-contract'),v=c.current(),sw=read('sw.js');
assert.equal(v.version,'2.82');
assert.equal(v.cacheName,c.cacheName());
assert.equal(v.version,c.version());
assert.ok(v.cacheName.startsWith('kyv-studio-v2-82-'));
assert.ok(sw.includes("const CACHE_NAME = '"+v.cacheName+"'"));
for(const file of ['kyv-read-guard-v282.js','kyv-economy-audit-v281.js','kyv_analyst.html','kyv-economy-v6.js','kyv-help.js','guida.html'])
 assert.ok(sw.includes("'./"+file+"'"),'Offline PWA file missing: '+file);
assert.ok(read('config.js').includes("APP_VERSION: '"+v.version+"'"));
assert.equal(JSON.parse(read('package.json')).version,v.version+'.0');
assert.equal(read('VERSION').trim(),v.version);
const priorCache='kyv-studio-'+'v2-81-economy-audit-20261105';
const paths=fs.readdirSync('tools').filter(x=>x.startsWith('test-')&&x.endsWith('.js'));
for(const file of paths){
 const source=read('tools/'+file);
 assert.ok(!source.includes("'"+priorCache+"'"),file+': stale current-cache assertion; use release-contract');
}
const scripts=require('../package.json').scripts;
assert.ok(scripts.check.includes('check:read-guard-v282'));
assert.ok(scripts.check.includes('check:release-contract-v282'));
console.log('OK v2.82 release contract: version/cache synchronized; no stale 2.81 cache assertions');
