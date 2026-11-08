// Cron giornaliero Vercel che tiene sveglio Supabase (piano gratuito: pausa dopo 7 giorni di inattivita').
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

// Configurazione: un solo cron, una volta al giorno (limite piano Hobby), su una funzione esistente
assert.equal(vercel.crons.length, 1);
const cron = vercel.crons[0];
assert.equal(cron.path, '/api/keepalive');
const f = cron.schedule.split(' ');
assert.equal(f.length, 5);
assert.ok(/^\d+$/.test(f[0]) && /^\d+$/.test(f[1]) && f.slice(2).every(x => x === '*'), 'Hobby: una sola esecuzione al giorno');
assert.ok(fs.existsSync(path.join(root, 'api/keepalive.js')));

// Comportamento della funzione con fetch simulato
const handler = require(path.join(root, 'api/keepalive.js'));
const mkRes = () => ({ headers: {}, code: 0, body: null,
  setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } });
const run = async (req, fakeFetch) => { global.fetch = fakeFetch; const r = mkRes(); await handler(req, r); return r; };

(async () => {
  delete process.env.CRON_SECRET;
  let called;
  let r = await run({ method: 'GET', headers: {} }, async (url, opts) => { called = { url, opts }; return { status: 200 }; });
  assert.equal(r.code, 200); assert.equal(r.body.ok, true);
  assert.match(called.url, /^https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\/PROGETTI\?select=\*&limit=1$/);
  assert.ok(called.opts.headers.apikey.startsWith('sb_publishable_'));
  assert.equal('Authorization' in called.opts.headers, false, 'la chiave pubblicabile non va inviata come Bearer');
  assert.equal(JSON.stringify(r.body).includes('['), false, 'nessun dato dell\'archivio nella risposta');

  r = await run({ method: 'GET', headers: {} }, async () => ({ status: 401 })); // RLS: il database ha comunque risposto
  assert.equal(r.code, 200);
  r = await run({ method: 'GET', headers: {} }, async () => ({ status: 503 }));
  assert.equal(r.code, 502);
  r = await run({ method: 'GET', headers: {} }, async () => { throw new Error('rete'); });
  assert.equal(r.code, 502);
  r = await run({ method: 'POST', headers: {} }, async () => ({ status: 200 }));
  assert.equal(r.code, 405);

  process.env.CRON_SECRET = 'segreto-di-prova';
  r = await run({ method: 'GET', headers: {} }, async () => ({ status: 200 }));
  assert.equal(r.code, 401);
  r = await run({ method: 'GET', headers: { authorization: 'Bearer segreto-di-prova' } }, async () => ({ status: 200 }));
  assert.equal(r.code, 200);
  console.log('Keepalive Supabase: OK');
})().catch(e => { console.error(e); process.exit(1); });
