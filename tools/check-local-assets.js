const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const attrs = [
  /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
  /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi,
  /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi
];
function isLocal(ref){
  if(!ref || ref.startsWith('#') || ref.startsWith('data:') || ref.startsWith('mailto:') || ref.startsWith('tel:')) return false;
  if(/^https?:\/\//i.test(ref) || ref.startsWith('//')) return false;
  if(ref.startsWith('/api/')) return false;
  return true;
}
let missing = [];
for(const file of htmlFiles){
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  for(const rx of attrs){
    let m;
    while((m = rx.exec(text))){
      const ref = m[1].split('?')[0].split('#')[0];
      if(!isLocal(ref)) continue;
      const target = path.resolve(root, ref);
      if(!target.startsWith(root) || !fs.existsSync(target)) missing.push(`${file} -> ${ref}`);
    }
  }
}
if(missing.length){
  console.error('Asset locali mancanti:');
  for(const item of missing) console.error(' - ' + item);
  process.exit(1);
}
console.log(`OK: asset locali referenziati da ${htmlFiles.length} pagine presenti.`);
