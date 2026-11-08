// api/keepalive.js - Ping giornaliero a Supabase (cron Vercel) per evitare la pausa per inattivita'
// del piano gratuito. Fa una lettura reale di una riga e non restituisce alcun dato dell'archivio.

const DEFAULT_SUPABASE_URL = 'https://vppqnolgxtegtxznmgqb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_BTAf2Cy5EYKgyb_uXdRvaA_iEawerhl';
const PING_TABLE = 'PROGETTI';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Metodo non consentito' });
  }
  // Vercel invia "Authorization: Bearer <CRON_SECRET>" se la variabile CRON_SECRET e' impostata.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== 'Bearer ' + secret) {
    return res.status(401).json({ ok: false, error: 'Non autorizzato' });
  }

  const baseUrl = String(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
  const key = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(baseUrl + '/rest/v1/' + PING_TABLE + '?select=*&limit=1', {
      headers: { apikey: key, Accept: 'application/json' },
      signal: controller.signal
    });
    // Anche 200 con [] o 401/403 (RLS) dimostrano che il database ha risposto: solo i 5xx sono un errore.
    if (response.status >= 500) {
      return res.status(502).json({ ok: false, supabaseStatus: response.status });
    }
    return res.status(200).json({ ok: true, supabaseStatus: response.status, at: new Date().toISOString() });
  } catch (err) {
    return res.status(502).json({ ok: false, error: err && err.name === 'AbortError' ? 'Timeout Supabase' : 'Supabase non raggiungibile' });
  } finally {
    clearTimeout(timer);
  }
};
