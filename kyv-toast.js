// kyv-toast.js - Toast globale unico per KyvManagerPro
// v2.11.12: centralizza i messaggi UI per evitare copie diverse in ogni pagina.
(function(){
  const DEFAULT_DURATION = 3600;
  const palette = {
    info: 'border-indigo-500/30 text-indigo-100 bg-indigo-950/90',
    success: 'border-emerald-500/30 text-emerald-100 bg-emerald-950/90',
    warning: 'border-amber-500/30 text-amber-100 bg-amber-950/90',
    error: 'border-rose-500/30 text-rose-100 bg-rose-950/90'
  };

  function normalizeType(type, isError){
    if (typeof isError === 'boolean') return isError ? 'error' : 'success';
    if (type === true) return 'error';
    if (type === false) return 'success';
    const t = String(type || 'info').toLowerCase();
    if (['danger','errore','error'].includes(t)) return 'error';
    if (['ok','done','success','successo'].includes(t)) return 'success';
    if (['warn','warning','avviso'].includes(t)) return 'warning';
    return 'info';
  }

  function safeText(value){ return String(value ?? ''); }

  function show(message, type='info', options={}){
    const normalized = normalizeType(type, options.isError);
    const existing = document.getElementById('kyv-global-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'kyv-global-toast';
    toast.setAttribute('role', normalized === 'error' ? 'alert' : 'status');
    toast.className = `fixed bottom-5 right-5 z-[9999] max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur text-sm font-bold ${palette[normalized] || palette.info}`;
    toast.textContent = safeText(message);
    document.body.appendChild(toast);

    const duration = Number(options.durationMs || DEFAULT_DURATION);
    if (duration > 0) setTimeout(() => toast.remove(), duration);
    return toast;
  }

  function success(message, options={}){ return show(message, 'success', options); }
  function error(message, options={}){ return show(message, 'error', options); }
  function warning(message, options={}){ return show(message, 'warning', options); }
  function info(message, options={}){ return show(message, 'info', options); }

  window.KYV_TOAST = { show, success, error, warning, info, normalizeType };
  window.KYV = window.KYV || {};
  window.KYV.showToast = show;
})();
