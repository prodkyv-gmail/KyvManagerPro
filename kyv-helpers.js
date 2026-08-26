// kyv-helpers.js - Helper comuni leggeri per KyvManagerPro
// v2.12.0: aggiunge formattazione data/valuta, badge e download testo per uso condiviso.
(function(){
  function parseNumber(value){
    if (window.KYV && typeof KYV.parseNumber === 'function') return KYV.parseNumber(value);
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    let raw = String(value).trim().replace(/€/g,'').replace(/%/g,'').replace(/\s/g,'').replace(/[^0-9,.-]/g,'');
    if (!raw) return 0;
    const lastComma = raw.lastIndexOf(',');
    const lastDot = raw.lastIndexOf('.');
    if (lastComma > lastDot) raw = raw.replace(/\./g,'').replace(',', '.');
    else if (lastDot > lastComma && lastComma !== -1) raw = raw.replace(/,/g, '');
    else if ((raw.match(/,/g) || []).length === 1 && lastComma !== -1) raw = raw.replace(',', '.');
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function safeHtml(value){
    if (window.KYV && typeof KYV.safeHtml === 'function') return KYV.safeHtml(value);
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  }

  function normalize(value){
    if (window.KYV && typeof KYV.normalize === 'function') return KYV.normalize(value);
    return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  }



  function formatCurrency(value, currency='EUR'){
    const n = parseNumber(value);
    try { return new Intl.NumberFormat('it-IT', { style:'currency', currency }).format(n); }
    catch(err){ return `${n.toFixed(2)} ${currency}`; }
  }

  function formatDate(value){
    if(!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if(Number.isNaN(d.getTime())) return String(value);
    try { return new Intl.DateTimeFormat('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' }).format(d); }
    catch(err){ return String(value); }
  }

  function downloadText(filename, text, mime='text/plain;charset=utf-8'){
    if (window.KYV && typeof KYV.downloadTextFile === 'function') return KYV.downloadTextFile(filename, text, mime);
    const blob = new Blob([String(text ?? '')], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function renderBadge(label, type='info'){
    const palette = {
      info:'border-indigo-500/30 bg-indigo-600/10 text-indigo-200',
      success:'border-emerald-500/30 bg-emerald-600/10 text-emerald-200',
      warning:'border-amber-500/30 bg-amber-600/10 text-amber-200',
      error:'border-rose-500/30 bg-rose-600/10 text-rose-200',
      neutral:'border-slate-500/30 bg-slate-600/10 text-slate-200'
    };
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-black ${palette[type] || palette.info}">${safeHtml(label)}</span>`;
  }

  async function copyText(text, successMessage='Copiato negli appunti.'){
    const value = String(text ?? '');
    try{
      await navigator.clipboard.writeText(value);
      if (window.KYV_TOAST) KYV_TOAST.success(successMessage);
      else if (window.KYV && KYV.showToast) KYV.showToast(successMessage, 'success');
      return true;
    }catch(err){
      if (window.KYV_TOAST) KYV_TOAST.warning('Copia non riuscita dal browser.');
      else if (window.KYV && KYV.showToast) KYV.showToast('Copia non riuscita dal browser.', 'warning');
      return false;
    }
  }

  function downloadJson(filename, data){
    const text = JSON.stringify(data, null, 2);
    if (window.KYV && typeof KYV.downloadTextFile === 'function') return KYV.downloadTextFile(filename, text, 'application/json;charset=utf-8');
    const blob = new Blob([text], {type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.KYV_HELPERS = { parseNumber, parseKyvNumber: parseNumber, safeHtml, normalize, formatCurrency, formatDate, renderBadge, copyText, downloadText, downloadJson };
  window.parseKyvNumber = window.parseKyvNumber || parseNumber;
  window.KYV = window.KYV || {};
  window.KYV.parseKyvNumber = parseNumber;
  window.KYV.copyText = copyText;
  window.KYV.formatCurrency = formatCurrency;
  window.KYV.formatDate = formatDate;
  window.KYV.downloadText = downloadText;
})();
