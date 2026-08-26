// kyv-system-diagnostics.js
// v2.12.0 - Diagnostica interna KyvManagerPro senza dipendenze nuove.
(function(){
  const VERSION = '2.12.0';
  const REPORT_KEY = 'kyv_system_last_report_v2';

  function now(){ return new Date().toISOString(); }
  function safeMsg(err){ return String(err?.message || err?.details || err || 'Errore sconosciuto'); }
  function esc(value){
    if(window.KYV_HELPERS?.safeHtml) return KYV_HELPERS.safeHtml(value);
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }
  function statusLabel(ok, warn=false){
    if(ok && !warn) return { label:'OK', cls:'text-emerald-200 border-emerald-500/30 bg-emerald-600/10', icon:'check-circle' };
    if(warn) return { label:'Attenzione', cls:'text-amber-200 border-amber-500/30 bg-amber-600/10', icon:'alert-triangle' };
    return { label:'Errore', cls:'text-rose-200 border-rose-500/30 bg-rose-600/10', icon:'x-circle' };
  }
  function renderCard(item){
    const s = statusLabel(item.ok, item.warn);
    const details = Array.isArray(item.details) ? item.details : (item.details ? [item.details] : []);
    return `<article class="rounded-2xl border border-kyv-border bg-kyv-card p-4 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] uppercase tracking-[.16em] font-black text-kyv-text">${esc(item.group || 'Sistema')}</p>
          <h3 class="text-white font-black text-base truncate">${esc(item.title)}</h3>
        </div>
        <span class="inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-black ${s.cls}"><i data-lucide="${s.icon}" class="w-3.5 h-3.5 mr-1.5"></i>${s.label}</span>
      </div>
      <p class="text-sm text-slate-300 leading-relaxed">${esc(item.message || '')}</p>
      ${details.length ? `<ul class="space-y-1 text-xs text-kyv-text leading-relaxed">${details.map(d => `<li class="flex gap-2"><span class="text-indigo-300">•</span><span>${esc(d)}</span></li>`).join('')}</ul>` : ''}
    </article>`;
  }

  function readJson(key, fallback){
    try{ return JSON.parse(localStorage.getItem(key) || '') || fallback; }catch(err){ return fallback; }
  }
  async function checkSupabase(){
    const item = { group:'Database', title:'Supabase', ok:false, message:'Controllo non eseguito.' };
    try{
      if(!window.supabase) throw new Error('Libreria Supabase JS non caricata.');
      if(!window.KYV_CONFIG?.SUPABASE_URL || !window.KYV_CONFIG?.SUPABASE_KEY) throw new Error('Config Supabase assente.');
      const db = window.KYV?.createSupabaseClient ? window.KYV.createSupabaseClient() : window.supabase.createClient(KYV_CONFIG.SUPABASE_URL, KYV_CONFIG.SUPABASE_KEY);
      const { error, count } = await db.from('PROGETTI').select('*', { count:'exact', head:true });
      if(error) throw error;
      item.ok = true;
      item.message = 'Connessione Supabase attiva.';
      item.details = [`PROGETTI raggiungibile${Number.isFinite(count) ? ` · ${count} record` : ''}.`];
    }catch(err){
      item.ok = false;
      item.message = 'Supabase non risponde correttamente.';
      item.details = [safeMsg(err)];
    }
    return item;
  }
  async function checkDrive(){
    const item = { group:'Drive', title:'Google Drive multi-account', ok:false, warn:false, message:'Controllo Drive non eseguito.' };
    try{
      if(!window.KYV_DRIVE) throw new Error('Modulo KYV_DRIVE non caricato.');
      const accounts = KYV_DRIVE.accountList();
      const configured = accounts.filter(a => a.url);
      const missing = accounts.filter(a => !a.url);
      const details = accounts.map(a => `${a.email || a.label}: ${a.url ? 'URL configurato' : 'URL da configurare'}`);
      if(!configured.length){
        item.ok = false; item.warn = false; item.message = 'Nessun Drive configurato.'; item.details = details; return item;
      }
      const ping = await KYV_DRIVE.ping('all');
      const okCount = ping.filter(p => p.ok).length;
      ping.forEach(p => details.push(`${p.account?.email || p.account?.label}: ${p.ok ? 'ping OK' : 'errore · ' + p.error}`));
      item.ok = okCount > 0;
      item.warn = okCount !== configured.length || missing.length > 0;
      item.message = okCount === configured.length ? 'Drive configurati e raggiungibili.' : 'Alcuni Drive richiedono attenzione.';
      item.details = details;
    }catch(err){
      item.ok = false; item.message = 'Errore durante diagnosi Drive.'; item.details = [safeMsg(err)];
    }
    return item;
  }
  async function checkProxy(){
    const item = { group:'API', title:'Proxy Vercel Drive', ok:false, message:'Controllo proxy non eseguito.' };
    try{
      const url = new URL((window.KYV_CONFIG?.GOOGLE_DRIVE_PROXY_URL || '/api/drive-proxy'), window.location.origin);
      url.searchParams.set('diagnostic', '1');
      const res = await fetch(url.toString(), { cache:'no-store' });
      let text = await res.text();
      let data = null;
      try{ data = JSON.parse(text); }catch(e){}
      item.ok = res.ok || res.status === 400;
      item.warn = res.status === 400;
      item.message = item.ok ? 'Endpoint proxy presente su Vercel.' : `Proxy non raggiungibile: HTTP ${res.status}.`;
      item.details = [data?.message || data?.error || text.slice(0, 140) || `HTTP ${res.status}`];
    }catch(err){
      item.ok = false; item.message = 'Proxy Vercel non raggiungibile.'; item.details = [safeMsg(err)];
    }
    return item;
  }
  async function checkServiceWorker(){
    const item = { group:'PWA', title:'Service Worker e cache', ok:false, message:'Controllo Service Worker non eseguito.' };
    try{
      if(!('serviceWorker' in navigator)) throw new Error('Service Worker non supportato da questo browser.');
      const regs = await navigator.serviceWorker.getRegistrations();
      let keys = [];
      if(window.caches?.keys) keys = await caches.keys();
      item.ok = regs.length > 0;
      item.warn = !navigator.serviceWorker.controller;
      item.message = regs.length ? 'Service Worker registrato.' : 'Nessun Service Worker registrato.';
      item.details = [`Registrazioni: ${regs.length}`, `Controller attivo: ${navigator.serviceWorker.controller ? 'sì' : 'no'}`, `Cache: ${keys.join(', ') || 'nessuna'}`];
    }catch(err){
      item.ok = false; item.message = 'Errore Service Worker/cache.'; item.details = [safeMsg(err)];
    }
    return item;
  }
  function checkDropbox(){
    const hasChooser = !!(window.Dropbox && typeof window.Dropbox.choose === 'function');
    return {
      group:'Integrazioni', title:'Dropbox Chooser', ok:hasChooser, warn:!hasChooser,
      message: hasChooser ? 'Dropbox Chooser disponibile.' : 'Dropbox Chooser non caricato in questa pagina. È normale fuori da Stazione Ascolto/Dropbox.',
      details: [hasChooser ? 'window.Dropbox.choose presente.' : 'Apri kyv_dropbox.html o ascolto.html per test operativo.']
    };
  }
  function checkLocalLogs(){
    const driveLogs = window.KYV_DRIVE?.getLogs?.() || readJson('kyv_drive_logs_v2', []);
    const guardLogs = window.KYV_DATA_GUARD?.getLogs?.() || readJson('kyv_data_guard_logs_v2', []);
    const errorCount = [...driveLogs, ...guardLogs].filter(l => String(l.level || '').toLowerCase() === 'error').length;
    return {
      group:'Log', title:'Log locali diagnostici', ok:errorCount === 0, warn:errorCount > 0,
      message: errorCount ? 'Sono presenti errori nei log locali.' : 'Nessun errore nei log locali recenti.',
      details: [`Drive log: ${driveLogs.length}`, `Data Guard log: ${guardLogs.length}`, `Errori: ${errorCount}`]
    };
  }
  function checkModules(){
    const modules = {
      KYV:'Core', KYV_AUTH:'Auth', KYV_DRIVE:'Drive bridge', KYV_TOAST:'Toast', KYV_HELPERS:'Helpers',
      KYV_DATA_GUARD:'Data guard', KYV_FIELD_MEMORY:'Field memory', KYV_TABLE_TOOLS:'Table tools', KYV_LINK_VIEWER:'Link viewer'
    };
    const missing = Object.entries(modules).filter(([key]) => !window[key]).map(([, label]) => label);
    return {
      group:'Moduli', title:'Script comuni', ok:missing.length === 0, warn:missing.length > 0,
      message: missing.length ? 'Alcuni moduli comuni non sono caricati in questa pagina.' : 'Moduli comuni caricati.',
      details: missing.length ? missing : Object.values(modules).map(label => `${label}: OK`)
    };
  }

  async function runAll(options={}){
    const started = now();
    const checks = [
      checkModules(),
      await checkSupabase(),
      await checkProxy(),
      await checkDrive(),
      await checkServiceWorker(),
      checkDropbox(),
      checkLocalLogs()
    ];
    const report = {
      app:'KyvManagerPro', version:VERSION, page:location.pathname, started_at:started, finished_at:now(),
      userAgent:navigator.userAgent, checks,
      config:{
        driveProxy: window.KYV_CONFIG?.GOOGLE_DRIVE_PROXY_URL || '',
        driveUseProxy: window.KYV_CONFIG?.GOOGLE_DRIVE_USE_PROXY !== false,
        accounts: window.KYV_DRIVE?.accountList?.().map(a => ({ id:a.id, email:a.email, label:a.label, configured:!!a.url })) || []
      }
    };
    try{ localStorage.setItem(REPORT_KEY, JSON.stringify(report)); }catch(err){}
    if(options.render !== false) render(report);
    return report;
  }

  function render(report){
    const root = document.getElementById('diagnostics-results');
    const summary = document.getElementById('diagnostics-summary');
    if(!root) return;
    const ok = report.checks.filter(c => c.ok && !c.warn).length;
    const warn = report.checks.filter(c => c.warn).length;
    const fail = report.checks.filter(c => !c.ok && !c.warn).length;
    if(summary){
      summary.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="rounded-2xl border border-emerald-500/20 bg-emerald-600/10 p-4"><p class="text-xs text-emerald-200 font-black uppercase">OK</p><p class="text-3xl font-black text-white">${ok}</p></div>
        <div class="rounded-2xl border border-amber-500/20 bg-amber-600/10 p-4"><p class="text-xs text-amber-200 font-black uppercase">Attenzione</p><p class="text-3xl font-black text-white">${warn}</p></div>
        <div class="rounded-2xl border border-rose-500/20 bg-rose-600/10 p-4"><p class="text-xs text-rose-200 font-black uppercase">Errori</p><p class="text-3xl font-black text-white">${fail}</p></div>
      </div>`;
    }
    root.innerHTML = `<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">${report.checks.map(renderCard).join('')}</div>`;
    if(window.lucide) lucide.createIcons();
  }
  function downloadReport(){
    const report = readJson(REPORT_KEY, null) || { app:'KyvManagerPro', version:VERSION, exported_at:now(), checks:[] };
    if(window.KYV_HELPERS?.downloadJson) KYV_HELPERS.downloadJson(`kyv-system-report-${now().slice(0,19).replace(/[:T]/g,'-')}.json`, report);
  }
  function clearAllLogs(){
    try{ window.KYV_DRIVE?.clearLogs?.(); }catch(err){}
    try{ window.KYV_DATA_GUARD?.clearLogs?.(); }catch(err){}
    try{ localStorage.removeItem(REPORT_KEY); }catch(err){}
    window.KYV_TOAST?.success?.('Log diagnostici puliti.');
    return runAll();
  }

  window.KYV_DIAGNOSTICS = { VERSION, runAll, render, downloadReport, clearAllLogs, checkSupabase, checkDrive, checkProxy, checkServiceWorker };
})();
