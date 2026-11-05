/* v2.82 — Shared release metadata for regression tests: no history-specific hardcoded versions. */
'use strict';
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
function current(){
 const pkg=JSON.parse(read('package.json')),version=read('VERSION').trim(),
  config=read('config.js'),sw=read('sw.js');
 const app=config.match(/APP_VERSION:\s*'(\d+\.\d+)'/);
 const cache=sw.match(/const CACHE_NAME\s*=\s*'([^']+)'/);
 if(!app||!cache)throw Error('Version or PWA cache missing from current release');
 if(pkg.version!==version+'.0'||app[1]!==version)throw Error('VERSION, config and package.json out of sync');
 if(!cache[1].startsWith('kyv-studio-v'+version.replace('.','-')+'-'))
  throw Error('PWA cache must contain current version '+version);
 return Object.freeze({version,cacheName:cache[1]});
}
module.exports={current,version:()=>current().version,cacheName:()=>current().cacheName};
