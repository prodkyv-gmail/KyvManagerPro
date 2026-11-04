const fs=require('node:fs'),assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const pkg=JSON.parse(read('package.json'));
const expected=pkg.version.replace(/\.0$/,'');
const config=read('config.js'),menu=read('menu.js'),projects=read('progetti.html'),
  sw=read('sw.js'),version=read('VERSION').trim();
const configured=config.match(/APP_VERSION:\s*'(\d+\.\d+)'/);
assert.ok(configured,'APP_VERSION must exist in config.js');
assert.equal(configured[1],expected,'Published version must match package.json');
assert.equal(version,expected,'VERSION file must match displayed version');
assert.equal(expected,'2.79','Current tested functional release must stay aligned');
assert.ok(menu.includes('window.KYV_CONFIG?.APP_VERSION'),
  'Sidebar must use dynamic version from config, not stale literal copy');
assert.ok(projects.includes('<span>Manager Pro</span>'),
  'Safe-mode Progetti must not hardcode the displayed version');
assert.ok(config.includes("const brand=document.querySelector('#sidebar .brand span');"),
  'Safe-mode header needs an explicit version update');
assert.ok(config.includes("if(brand)brand.textContent='Manager Pro '+KYV_CONFIG.APP_VERSION;"),
  'Safe-mode Progetti version must come from config');
assert.ok(config.includes("document.addEventListener('DOMContentLoaded'"),
  'Safe-mode version update is delayed until DOM is loaded');
assert.doesNotMatch(menu,/Manager Pro 2\.\d/,'The normal menu must have no stale literal version');
assert.doesNotMatch(projects,/Manager Pro 2\.\d/,'Progetti must have no stale literal version');
assert.ok(sw.includes('kyv-studio-v2-79-integrated-modal-ux-20261104'),
  'The service worker cache must rotate to refresh installed PWA assets');
assert.ok(sw.includes("await self.skipWaiting()"),'New service worker should activate without waiting for all tabs to close');
assert.ok(sw.includes("await clients.claim()"),'Active service worker should control subsequent loads');
const scripts=pkg.scripts;
assert.equal(scripts['check:version-sync'],'node tools/test-version-sync.js');
assert.ok(scripts.check.includes('check:version-sync'),'Include version protection in full CI');
const html=read('index.html');
assert.ok(html.includes('src="config.js"'),'App homepage must load version config');
assert.ok(html.includes('src="menu.js"'),'App homepage must load shared navigation');
console.log('OK: KYV version display aligned across config, menu, project safe mode, package, VERSION and PWA cache');
