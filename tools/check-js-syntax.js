const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const files = [];
function walk(dir){
  for(const entry of fs.readdirSync(dir, { withFileTypes: true })){
    if(entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if(entry.isDirectory()) walk(full);
    else if(entry.isFile() && entry.name.endsWith('.js')) files.push(full);
  }
}
walk(root);
let failed = false;
for(const file of files){
  const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if(res.status !== 0){
    failed = true;
    console.error(`\n[JS SYNTAX ERROR] ${path.relative(root, file)}`);
    if(res.stderr) console.error(res.stderr.trim());
    if(res.stdout) console.error(res.stdout.trim());
  }
}
for(const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))){
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((match, index) => {
    const attrs = match[1] || '';
    if(/\bsrc\s*=/i.test(attrs) || /\btype=["'](?:application\/ld\+json|importmap)["']/i.test(attrs)) return;
    try { new vm.Script(match[2], { filename: `${file}#inline-${index + 1}` }); }
    catch(err){ failed = true; console.error(`\n[INLINE JS SYNTAX ERROR] ${file} script ${index + 1}`); console.error(err.message); }
  });
}
if(failed) process.exit(1);
console.log(`OK: sintassi valida per ${files.length} file JS e gli script inline HTML.`);
