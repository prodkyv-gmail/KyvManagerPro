// Ogni script esterno caricato da una pagina HTML deve essere ammesso da script-src in vercel.json,
// altrimenti il browser lo blocca in produzione senza errori visibili (Dropbox, Excel, PDF...).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const csp = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).headers
  .flatMap(h => h.headers).find(h => h.key === 'Content-Security-Policy').value;
const scriptSrc = (csp.match(/script-src([^;]*)/) || [])[1] || '';
const allowed = new Set(scriptSrc.split(/\s+/).filter(t => t.startsWith('https://')));
const missing = new Map();
for (const file of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of html.matchAll(/<script[^>]+src=["'](https:\/\/[^/"']+)/gi)) {
    if (!allowed.has(m[1])) missing.set(m[1], (missing.get(m[1]) || new Set()).add(file));
  }
}
assert.equal(missing.size, 0, 'Script esterni non ammessi da script-src: ' +
  [...missing].map(([host, files]) => host + ' (' + [...files].join(', ') + ')').join('; '));
console.log('CSP script-src: OK (' + allowed.size + ' origini ammesse)');
