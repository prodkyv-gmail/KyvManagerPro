const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const core=fs.readFileSync(path.join(root,'kyv-core.js'),'utf8');
const auth=fs.readFileSync(path.join(root,'kyv-auth.js'),'utf8');

assert.match(core,/if \(window\.KYV_SUPABASE_CLIENT\) return window\.KYV_SUPABASE_CLIENT;/,'Il client Supabase deve restare singleton.');
assert.match(core,/sessionSyncPromise/,'Le richieste concorrenti devono condividere il riallineamento sessione.');
assert.match(core,/auth\.getSession\(\)/,'Il Data API deve riallinearsi alla sessione corrente.');
assert.match(core,/autoRefreshToken:\s*true/,'Il refresh automatico del token deve restare attivo.');
assert.match(core,/persistSession:\s*true/,'La sessione deve restare persistente nel browser.');
assert.match(core,/info\.method === 'GET' && response\.status === 401/,'Il retry auth deve essere limitato alle letture GET in 401.');
assert.match(core,/PGRST303/,'Il caso transitorio JWT PGRST303 deve essere gestito esplicitamente.');
assert.match(core,/await new Promise\(resolve => setTimeout\(resolve, 160\)\)/,'Il retry deve aspettare brevemente il riallineamento JWT.');
assert.doesNotMatch(core,/response\.status === 401[\s\S]{0,500}(?:POST|PATCH|DELETE).*nativeFetch/,'Le scritture non devono essere ritentate automaticamente su 401.');
assert.match(auth,/window\.KYV_SUPABASE_CLIENT/,'Auth deve riusare il client condiviso.');
assert.doesNotMatch(auth,/supabase\.createClient/,'Auth non deve creare un secondo client Supabase.');

console.log('OK: caricamento Supabase protetto da race di refresh JWT e client condiviso.');
