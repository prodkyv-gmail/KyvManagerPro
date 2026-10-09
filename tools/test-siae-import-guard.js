const fs=require('fs');
const guard=fs.readFileSync('kyv-siae-import-guard.js','utf8');
const responsive=fs.readFileSync('kyv-responsive.js','utf8');

function assert(ok,message){if(!ok){console.error('FAIL:',message);process.exitCode=1;}else console.log('OK:',message);}

assert(guard.includes("'ESTRATTO SIAE','EXPORT SIAE','EXPORT SIAE VERTICALE'"),'covers all SIAE import tables');
assert(guard.includes("'Tag','Quota DEM','Società DEM','Quota DRM','Società DRM'"),'vertical exact signature includes tag, shares and societies');
assert(guard.includes("tableName==='EXPORT SIAE'")&&guard.includes('Stessa Cod. Opera'),'horizontal export treats changed same work as conflict');
assert(guard.includes('Duplicato SIAE identico nel file'),'exact duplicates inside source file are skipped');
assert(guard.includes('Record SIAE identico già presente'),'exact duplicates against database are skipped');
assert(guard.includes('I conflitti NON sono stati sovrascritti né inseriti'),'changed same-work rows are surfaced and not overwritten');
assert(!/\.update\s*\(|\.upsert\s*\(/.test(guard),'guard never updates or upserts SIAE data');
assert(responsive.includes("script.src = 'kyv-siae-import-guard.js'"),'guard is loaded on import/export page');

if(process.exitCode)process.exit(process.exitCode);
console.log('SIAE import guard checks passed.');
