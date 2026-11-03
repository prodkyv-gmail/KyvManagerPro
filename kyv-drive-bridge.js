/* kyv-drive-bridge.js - Gestione Google Drive/Calendar multi-account per KyvManagerPro
   v2.13.0 - Proxy Vercel autorevole in produzione + errori diagnostici leggibili.
*/
(function(){
  const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJAwkYrKZk-qVkyvHEfc3T53LpS4rQMSAjJAvRHklnBmzXx5x-D2EWsbVXsNnnYL7Xrg/exec';
  const DEFAULT_EMAILS = [
    { id:'info', label:'Drive info@kyvprod.net', email:'info@kyvprod.net' },
    { id:'prodkyv', label:'Drive prodkyv@gmail.com', email:'prodkyv@gmail.com' }
  ];

  function cfg(){ return window.KYV_CONFIG || {}; }
  function cleanUrl(url){ return String(url || '').trim(); }
  function escapeHtml(v){
    if(window.KYV && typeof KYV.safeHtml === 'function') return KYV.safeHtml(v ?? '');
    return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  }
  function normalizeId(v){ return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function accountName(account){ return account?.email || account?.label || account?.id || 'Drive'; }

  const LOG_KEY = 'kyv_drive_logs_v2';
  const LOG_LIMIT = 180;
  function logDrive(level, event, payload={}){
    const entry = {
      time: new Date().toISOString(), level: level || 'info', event: event || 'event',
      account: payload.account ? accountName(payload.account) : (payload.accountName || ''),
      action: payload.action || '', transport: payload.transport || '',
      message: payload.message || '', detail: payload.detail || ''
    };
    try {
      const current = JSON.parse(localStorage.getItem(LOG_KEY) || '[]') || [];
      current.push(entry);
      localStorage.setItem(LOG_KEY, JSON.stringify(current.slice(-LOG_LIMIT)));
    } catch(err) {}
    const method = level === 'error' ? 'error' : (level === 'warn' ? 'warn' : 'info');
    try { console[method]('[KYV_DRIVE]', entry); } catch(err) {}
    return entry;
  }
  function getLogs(){ try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]') || []; } catch(err){ return []; } }
  function clearLogs(){ try { localStorage.removeItem(LOG_KEY); return true; } catch(err){ return false; } }
  function downloadLogs(){
    const logs = getLogs();
    const filename = `kyv-drive-log-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    if(window.KYV_HELPERS && KYV_HELPERS.downloadJson) KYV_HELPERS.downloadJson(filename, logs);
    else if(window.KYV && KYV.downloadTextFile) KYV.downloadTextFile(filename, JSON.stringify(logs,null,2), 'application/json;charset=utf-8');
    return logs;
  }

  const OVERRIDE_KEY = 'kyv_drive_account_urls_v2';
  function readOverrides(){ try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || '{}') || {}; } catch(err){ return {}; } }
  function writeOverrides(data){ try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(data || {})); return true; } catch(err){ return false; } }
  function saveAccountUrl(accountId, url){
    const id = String(accountId || '').trim();
    if(!id) throw new Error('Account Drive non valido.');
    const clean = cleanUrl(url);
    if(clean && !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:[?#].*)?$/i.test(clean)){
      throw new Error('URL non valido: incolla il link Apps Script Web App che finisce con /exec.');
    }
    const data = readOverrides();
    if(clean) data[id] = clean; else delete data[id];
    writeOverrides(data);
    return accountList();
  }
  function clearAccountUrl(accountId){ return saveAccountUrl(accountId, ''); }

  function accountList(){
    const c = cfg();
    const explicit = Array.isArray(c.GOOGLE_DRIVE_ACCOUNTS) ? c.GOOGLE_DRIVE_ACCOUNTS : [];
    let accounts = explicit.map((a, idx) => ({
      id: a.id || normalizeId(a.email || a.label || `drive-${idx+1}`),
      label: a.label || a.email || `Drive ${idx+1}`, email: a.email || '',
      url: cleanUrl(a.url || a.scriptUrl || a.GOOGLE_SCRIPT_URL || '')
    }));

    if(!accounts.length){
      accounts = [
        { ...DEFAULT_EMAILS[0], url: cleanUrl(c.GOOGLE_SCRIPT_URL_INFO || c.GOOGLE_SCRIPT_URL_KYVPROD || '') },
        { ...DEFAULT_EMAILS[1], url: cleanUrl(c.GOOGLE_SCRIPT_URL_PRODKYV || c.GOOGLE_SCRIPT_URL_GMAIL || c.GOOGLE_SCRIPT_URL_2 || '') }
      ];
    }

    const overrides = readOverrides();
    accounts = accounts.map(a => ({ ...a, url: cleanUrl(overrides[a.id] || a.url) }));
    return accounts.map((a, idx) => ({
      id: a.id || DEFAULT_EMAILS[idx]?.id || `drive-${idx+1}`,
      label: a.label || a.email || DEFAULT_EMAILS[idx]?.label || `Drive ${idx+1}`,
      email: a.email || DEFAULT_EMAILS[idx]?.email || '', url: cleanUrl(a.url)
    }));
  }

  function activeAccounts(accountId){
    const accounts = accountList();
    if(!accountId || accountId === 'all') return accounts.filter(a => a.url);
    const found = accounts.find(a => a.id === accountId || a.email === accountId);
    return found && found.url ? [found] : [];
  }
  function missingAccounts(){ return accountList().filter(a => !a.url); }
  function optionHtml(selected='all', includeAll=true){
    const accounts = accountList();
    const all = includeAll ? `<option value="all" ${selected==='all'?'selected':''}>Tutti i Drive configurati</option>` : '';
    return all + accounts.map(a => `<option value="${escapeHtml(a.id)}" ${selected===a.id?'selected':''} ${a.url?'':'disabled'}>${escapeHtml(a.label)}${a.url?'':' · URL da configurare'}</option>`).join('');
  }

  function buildUrl(account, action, params={}){
    if(!account || !account.url) throw new Error('Account Drive non configurato.');
    const u = new URL(account.url);
    u.searchParams.set('action', action); u.searchParams.set('account', account.id || '');
    u.searchParams.set('driveAccount', account.email || account.id || ''); u.searchParams.set('_', Date.now().toString());
    Object.entries(params || {}).forEach(([k,v]) => { if(v !== undefined && v !== null && String(v) !== '') u.searchParams.set(k, v); });
    return u.toString();
  }

  function isLikelyNetworkCorsError(err){
    const msg = String(err?.message || err || '').toLowerCase();
    return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed') || msg.includes('cors') || err instanceof TypeError;
  }

  async function fetchWithTimeout(url, timeoutMs=22000, options={}){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try{
      return await fetch(url, { method:'GET', mode:'cors', credentials:'omit', cache:'no-store', redirect:'follow', signal: controller.signal, ...options, headers: options.headers || undefined });
    }finally{ clearTimeout(timer); }
  }

  async function fetchJsonCors(account, action, params={}){
    const url = buildUrl(account, action, params); logDrive('info', 'request:start', {account, action, transport:'cors'});
    const res = await fetchWithTimeout(url);
    if(!res.ok) throw new Error(`${accountName(account)}: errore HTTP ${res.status}. Verifica Deploy Apps Script e permessi.`);
    const txt = await res.text(); let data;
    try { data = JSON.parse(txt); } catch(e){
      const sample = txt.slice(0,160).replace(/\s+/g,' ');
      throw new Error(`${accountName(account)}: risposta non JSON${sample ? ` (${sample})` : ''}. Verifica che l'URL sia /exec e che lo script restituisca JSON.`);
    }
    if(data && data.error){ logDrive('error', 'request:error', {account, action, transport:'cors', message:data.error}); throw new Error(`${accountName(account)}: ${data.error}`); }
    logDrive('info', 'request:success', {account, action, transport:'cors'}); return data || {};
  }

  function proxyEndpoint(){
    const endpoint = cfg().GOOGLE_DRIVE_PROXY_URL || '/api/drive-proxy';
    try { return new URL(endpoint, window.location.origin).toString(); } catch(err){ return endpoint; }
  }

  function buildProxyUrl(account, action, params={}){
    if(!account || !account.url) throw new Error('Account Drive non configurato.');
    const u = new URL(proxyEndpoint(), window.location.origin);
    u.searchParams.set('target', account.url); u.searchParams.set('action', action);
    u.searchParams.set('account', account.id || ''); u.searchParams.set('driveAccount', account.email || account.id || '');
    u.searchParams.set('_', Date.now().toString());
    Object.entries(params || {}).forEach(([k,v]) => { if(v !== undefined && v !== null && String(v) !== '') u.searchParams.set(k, v); });
    return u.toString();
  }

  async function fetchJsonProxy(account, action, params={}){
    const url = buildProxyUrl(account, action, params); logDrive('info', 'request:start', {account, action, transport:'proxy'});
    const session = window.KYV_AUTH?.getSession ? await window.KYV_AUTH.getSession() : null;
    const token = session?.access_token;
    if(!token) throw new Error('Sessione Kyv richiesta o scaduta. Accedi di nuovo.');
    const res = await fetchWithTimeout(url, 34000, { credentials:'same-origin', headers:{ Authorization:`Bearer ${token}` } });
    const txt = await res.text(); let data;
    try { data = JSON.parse(txt); } catch(e){
      const sample = txt.slice(0,180).replace(/\s+/g,' ');
      throw new Error(`${accountName(account)}: proxy Vercel non ha restituito JSON${sample ? ` (${sample})` : ''}.`);
    }
    if(!res.ok || (data && data.error)){
      const detail = data && (data.error || data.message) ? (data.error || data.message) : `errore HTTP ${res.status}`;
      const sample = data && data.sample ? ` Dettaglio: ${String(data.sample).slice(0,180)}` : '';
      logDrive('error', 'request:error', {account, action, transport:'proxy', message:detail});
      throw new Error(`${accountName(account)}: ${detail}${sample}`);
    }
    logDrive('info', 'request:success', {account, action, transport:'proxy'}); return data || {};
  }

  function fetchJsonp(account, action, params={}, timeoutMs=26000){
    logDrive('info', 'request:start', {account, action, transport:'jsonp'});
    return new Promise((resolve, reject) => {
      const callbackName = `kyvDriveJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      let script; let done = false;
      const cleanup = () => { done = true; try { delete window[callbackName]; } catch(e){ window[callbackName] = undefined; } if(script && script.parentNode) script.parentNode.removeChild(script); clearTimeout(timer); };
      const timer = setTimeout(() => { cleanup(); logDrive('error', 'request:error', {account, action, transport:'jsonp', message:'timeout JSONP'}); reject(new Error(`${accountName(account)}: timeout JSONP.`)); }, timeoutMs);
      window[callbackName] = (data) => { if(done) return; cleanup(); if(data && data.error) reject(new Error(`${accountName(account)}: ${data.error}`)); else resolve(data || {}); };
      try{
        const url = buildUrl(account, action, { ...params, callback: callbackName, jsonp:'1' });
        script = document.createElement('script'); script.async = true; script.src = url;
        script.onerror = () => { if(done) return; cleanup(); reject(new Error(`${accountName(account)}: JSONP non caricato.`)); };
        document.head.appendChild(script);
      }catch(err){ cleanup(); reject(err); }
    });
  }

  function isGoogleAppsScript(account){ return /https:\/\/script\.google\.com\/macros\/s\//i.test(String(account?.url || '')); }
  function isLocalDev(){ return location.protocol === 'file:' || ['localhost','127.0.0.1'].includes(location.hostname); }

  function improveDriveError(account, err){
    const msg = String(err?.message || err || 'Errore Google');
    const name = accountName(account);
    if(/HTTP\s*404|\b404\b|deployment eliminato|URL Apps Script non valido/i.test(msg)) return new Error(`${name}: deployment Apps Script non valido o non più disponibile (404).`);
    if(/risposta apps script non json|pagina di autorizzazione|login/i.test(msg)) return new Error(`${name}: Apps Script non sta restituendo JSON. Controlla Web App: Execute as Me, accesso Anyone e funzione doGet.`);
    if(/connettore google non autorizzato/i.test(msg)) return new Error(`${name}: il nuovo URL Apps Script non è ancora autorizzato nel proxy Vercel. Aggiorna api/drive-proxy.js e ridistribuisci.`);
    return new Error(msg.startsWith(`${name}:`) ? msg : `${name}: ${msg}`);
  }

  async function fetchJson(account, action, params={}){
    if(isGoogleAppsScript(account)){
      if(cfg().GOOGLE_DRIVE_USE_PROXY !== false){
        try{ return await fetchJsonProxy(account, action, params); }
        catch(proxyErr){
          // In produzione il proxy è la fonte autorevole: non nascondere il vero errore con un successivo timeout JSONP.
          if(!isLocalDev()) throw improveDriveError(account, proxyErr);
          logDrive('warn', 'fallback:proxy-to-jsonp', {account, action, transport:'proxy', message:proxyErr.message || String(proxyErr)});
        }
      }
      try{ return await fetchJsonp(account, action, params); }
      catch(jsonpErr){
        if(cfg().GOOGLE_DRIVE_ALLOW_CORS_FALLBACK === true){
          try{ return await fetchJsonCors(account, action, params); } catch(corsErr){ throw improveDriveError(account, corsErr); }
        }
        throw improveDriveError(account, jsonpErr);
      }
    }

    try{ return await fetchJsonCors(account, action, params); }
    catch(corsErr){
      if(!isLikelyNetworkCorsError(corsErr)) throw improveDriveError(account, corsErr);
      try{ return await fetchJsonp(account, action, params); } catch(jsonpErr){ throw improveDriveError(account, jsonpErr); }
    }
  }

  function extractDriveId(url){
    const raw = String(url || ''); let m = raw.match(/\/d\/([^/]+)/); if(m) return m[1];
    m = raw.match(/[?&]id=([^&]+)/); if(m) return decodeURIComponent(m[1]);
    m = raw.match(/file\/d\/([^/]+)/); if(m) return m[1]; return '';
  }
  function playbackUrl(file){
    const direct = file.playUrl || file.downloadUrl || file.webContentLink || file.directUrl || ''; if(direct) return String(direct);
    const view = file.url || file.webViewLink || file.link || ''; const id = file.id || file.fileId || extractDriveId(view);
    if(id) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`; return view;
  }
  function isAudioFile(file){
    const blob = `${file.name || ''} ${file.filename || ''} ${file.mimeType || ''} ${file.type || ''}`.toLowerCase();
    return /audio\//.test(blob) || /\.(mp3|wav|m4a|aif|aiff|flac|aac|ogg)$/i.test(blob);
  }
  function normalizeFile(file, account){
    const name = file.name || file.filename || file.title || 'File Drive';
    return { ...file, id: file.id || file.fileId || extractDriveId(file.url || file.webViewLink || file.link || ''), name,
      filename: file.filename || name, url: file.url || file.webViewLink || file.link || file.webContentLink || '', playUrl: playbackUrl(file),
      folder: file.folder || file.path || file.parentsName || 'Drive', size: file.size || file.sizeText || '', created: file.created || file.createdTime || file.dateCreated || '',
      updated: file.updated || file.modifiedTime || file.dateModified || '', driveAccount: account.id, driveEmail: account.email, driveLabel: account.label, source: 'drive' };
  }

  async function listFiles({ accountId='all', action='getDriveFiles', pages=10, audioOnly=false, onPage=null } = {}){
    const accounts = activeAccounts(accountId);
    if(!accounts.length){ const miss = missingAccounts(); throw new Error(miss.length ? `Nessun URL Apps Script configurato per ${miss.map(a=>a.email||a.label).join(', ')}.` : 'Nessun Drive configurato.'); }
    const files = []; const errors = []; const limitedAccounts = [];
    for(const account of accounts){
      let pageToken = ''; let page = 0;
      try {
        do {
          const data = await fetchJson(account, action, pageToken ? { pageToken } : {});
          const batch = (data.files || data.items || []).map(f => normalizeFile(f, account)).filter(f => !audioOnly || isAudioFile(f));
          files.push(...batch); if(typeof onPage === 'function') onPage({account, page, files:batch, total:files.length, data});
          pageToken = data.nextPageToken || data.next || ''; page++;
        } while(pageToken && page < pages);
        if(pageToken)limitedAccounts.push(account.label||account.email||account.id);
      } catch(err){ errors.push(err.message || String(err)); }
    }
    files.sort((a,b)=>`${a.name || ''}`.toLowerCase().localeCompare(`${b.name || ''}`.toLowerCase(), 'it', {numeric:true, sensitivity:'base'}));
    return { files, errors, accounts, truncated:limitedAccounts.length>0, limitedAccounts };
  }

  async function ping(accountId='all'){
    const accounts = activeAccounts(accountId); const out = [];
    for(const account of accounts){
      try{ const data = await fetchJson(account, 'ping'); out.push({account, ok:true, data}); }
      catch(err){ out.push({account, ok:false, error: err.message || String(err)}); }
    }
    return out;
  }

  window.KYV_DRIVE = {
    accountList, activeAccounts, missingAccounts, optionHtml, buildUrl,
    readOverrides, saveAccountUrl, clearAccountUrl,
    fetchJson, fetchJsonCors, fetchJsonp, fetchJsonProxy, buildProxyUrl, listFiles, ping,
    getLogs, clearLogs, downloadLogs, logDrive,
    isAudioFile, normalizeFile, playbackUrl, extractDriveId, DEFAULT_SCRIPT_URL
  };
})();
