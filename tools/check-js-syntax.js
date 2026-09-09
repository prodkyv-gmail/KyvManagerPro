const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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
if(failed) process.exit(1);
console.log(`OK: sintassi valida per ${files.length} file JS.`);
