// api/drive-proxy.js - Proxy serverless Vercel per Google Apps Script Drive
// Evita i blocchi CORS del browser chiamando Apps Script dal server Vercel.

const DEFAULT_SUPABASE_URL = 'https://vppqnolgxtegtxznmgqb.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_BTAf2Cy5EYKgyb_uXdRvaA_iEawerhl';
const DEFAULT_ALLOWED_TARGETS = new Set([
  'https://script.google.com/macros/s/AKfycbw4S8LZ-LLDewzv3uAEJkLaEjGTfFD1XRJppV0Oy1pOkmK_3exDpp0j_Bw6jmSGjeU0UA/exec',
  'https://script.google.com/macros/s/AKfycbwcYC4WNK3_fHPp6yvbJiqJUp_MWGKuL0fy6GNz0iAX5H7oGWjnvR2Vqj5wPdtxTpfoWw/exec'
]);

function setCors(req, res) {
  const origin = String(req.headers.origin || '').trim();
  const host = String(req.headers.host || '').trim();
  if (origin) {
    try {
      if (new URL(origin).host === host) res.setHeader('Access-Control-Allow-Origin', origin);
    } catch (err) {}
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

function sendJson(req, res, status, payload) {
  setCors(req, res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function cleanCallbackJsonp(text) {
  const raw = String(text || '').trim();
  const m = raw.match(/^[\w.$]+\((.*)\);?$/s);
  return m ? m[1] : raw;
}

function allowedTargets() {
  const configured = [process.env.KYV_GOOGLE_DRIVE_URL, process.env.KYV_GOOGLE_CALENDAR_URL]
    .filter(Boolean)
    .map(value => String(value).trim());
  return configured.length ? new Set(configured) : DEFAULT_ALLOWED_TARGETS;
}

function isAllowedTarget(target) {
  try {
    const u = new URL(target);
    return u.protocol === 'https:' &&
      u.hostname === 'script.google.com' &&
      /^\/macros\/s\/[^/]+\/exec$/.test(u.pathname) &&
      allowedTargets().has(u.toString());
  } catch (err) {
    return false;
  }
}

async function authenticate(req) {
  const authorization = String(req.headers.authorization || '').trim();
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null;

  const supabaseUrl = String(process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
  const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY);
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    cache: 'no-store',
    headers: { Authorization: authorization, apikey: publishableKey }
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user && user.id ? user : null;
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'GET') return sendJson(req, res, 405, { ok:false, error:'Metodo non supportato. Usa GET.' });

  let user;
  try { user = await authenticate(req); }
  catch (err) { return sendJson(req, res, 503, { ok:false, error:'Verifica sessione temporaneamente non disponibile.' }); }
  if (!user) return sendJson(req, res, 401, { ok:false, error:'Sessione richiesta o scaduta. Accedi di nuovo a KyvManagerPro.' });

  const query = req.query || {};
  const target = String(query.target || query.url || '').trim();

  if (!target) return sendJson(req, res, 400, { ok:false, error:'Parametro target mancante.' });
  if (!isAllowedTarget(target)) {
    return sendJson(req, res, 400, { ok:false, error:'Connettore Google non autorizzato.' });
  }

  const upstream = new URL(target);
  const passthroughKeys = Object.keys(query).filter(k => !['target','url','callback','jsonp','_'].includes(k));
  for (const key of passthroughKeys) {
    const value = query[key];
    if (Array.isArray(value)) value.forEach(v => upstream.searchParams.append(key, String(v)));
    else if (value !== undefined && value !== null && String(value) !== '') upstream.searchParams.set(key, String(value));
  }
  upstream.searchParams.set('_proxy', 'kyv-v2-11-6');
  if (process.env.KYV_APPS_SCRIPT_PROXY_SECRET) {
    upstream.searchParams.set('proxySecret', process.env.KYV_APPS_SCRIPT_PROXY_SECRET);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(upstream.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Accept': 'application/json,text/plain,*/*' }
    });
    clearTimeout(timer);

    const text = await response.text();
    const sample = text.slice(0, 500).replace(/\s+/g, ' ').trim();

    if (!response.ok) {
      return sendJson(req, res, response.status || 502, {
        ok:false,
        error:`Apps Script ha risposto HTTP ${response.status}. Verifica Deploy Web App, Execute as Me, Who has access: Anyone.`,
        status: response.status,
        finalUrl: response.url,
        sample
      });
    }

    let data;
    try {
      data = JSON.parse(cleanCallbackJsonp(text));
    } catch (err) {
      return sendJson(req, res, 502, {
        ok:false,
        error:'Risposta Apps Script non JSON. Probabile pagina di autorizzazione/login o codice non aggiornato.',
        finalUrl: response.url,
        sample
      });
    }

    return sendJson(req, res, 200, data || { ok:true });
  } catch (err) {
    clearTimeout(timer);
    return sendJson(req, res, 504, {
      ok:false,
      error:`Proxy Drive: ${err && err.name === 'AbortError' ? 'timeout chiamando Apps Script' : (err.message || String(err))}`
    });
  }
};

