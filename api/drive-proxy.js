// api/drive-proxy.js - Proxy serverless Vercel per Google Apps Script Drive
// Evita i blocchi CORS del browser chiamando Apps Script dal server Vercel.

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function cleanCallbackJsonp(text) {
  const raw = String(text || '').trim();
  const m = raw.match(/^[\w.$]+\((.*)\);?$/s);
  return m ? m[1] : raw;
}

function isAllowedTarget(target) {
  try {
    const u = new URL(target);
    return u.protocol === 'https:' &&
      u.hostname === 'script.google.com' &&
      /^\/macros\/s\/[^/]+\/exec$/.test(u.pathname);
  } catch (err) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'GET') return sendJson(res, 405, { ok:false, error:'Metodo non supportato. Usa GET.' });

  const query = req.query || {};
  const target = String(query.target || query.url || '').trim();

  if (!target) return sendJson(res, 400, { ok:false, error:'Parametro target mancante.' });
  if (!isAllowedTarget(target)) {
    return sendJson(res, 400, { ok:false, error:'Target non consentito. Usa solo URL Apps Script /exec su script.google.com.' });
  }

  const upstream = new URL(target);
  const passthroughKeys = Object.keys(query).filter(k => !['target','url','callback','jsonp','_'].includes(k));
  for (const key of passthroughKeys) {
    const value = query[key];
    if (Array.isArray(value)) value.forEach(v => upstream.searchParams.append(key, String(v)));
    else if (value !== undefined && value !== null && String(value) !== '') upstream.searchParams.set(key, String(value));
  }
  upstream.searchParams.set('_proxy', 'kyv-v2-11-6');

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
      return sendJson(res, response.status || 502, {
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
      return sendJson(res, 502, {
        ok:false,
        error:'Risposta Apps Script non JSON. Probabile pagina di autorizzazione/login o codice non aggiornato.',
        finalUrl: response.url,
        sample
      });
    }

    return sendJson(res, 200, data || { ok:true });
  } catch (err) {
    clearTimeout(timer);
    return sendJson(res, 504, {
      ok:false,
      error:`Proxy Drive: ${err && err.name === 'AbortError' ? 'timeout chiamando Apps Script' : (err.message || String(err))}`
    });
  }
};
