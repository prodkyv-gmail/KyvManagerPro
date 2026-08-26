/* kyv-field-memory.js - Suggerimenti intelligenti per campi ricorrenti.
   v2.11.13: campi a tendina/suggerimenti automatici più estesi.
   Obiettivo: quando un campo usa spesso gli stessi valori, mostra valori già presenti
   nella colonna Supabase corrispondente, senza bloccare scrittura libera e senza SQL. */
(function(){
  const cache = new Map();
  let supabaseClient = null;
  let observer = null;
  let scanTimer = null;

  function db(){
    if(supabaseClient) return supabaseClient;
    if(window.KYV && typeof KYV.createSupabaseClient === 'function') supabaseClient = KYV.createSupabaseClient();
    return supabaseClient;
  }
  function safeId(s){ return String(s||'').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase(); }
  function normalize(v){ return String(v ?? '').trim(); }
  function normKey(v){ return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,''); }
  function esc(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function uniqueSorted(values, max=300){
    const seen = new Set();
    return (values || [])
      .map(normalize)
      .filter(v => v && v.length < 180)
      .filter(v => { const k=v.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true; })
      .sort((a,b)=>a.localeCompare(b, 'it', {numeric:true, sensitivity:'base'}))
      .slice(0, max);
  }

  function selectColumnExpression(column){
    // PostgREST/Supabase richiede le virgolette per colonne con spazi o caratteri speciali.
    return /[^A-Za-z0-9_]/.test(column) ? `"${String(column).replace(/"/g, '""')}"` : column;
  }

  async function fetchColumnValues(table, column, limit=1000){
    const key = `${table}::${column}`;
    if(cache.has(key)) return cache.get(key);
    const client = db();
    if(!client) return [];
    try {
      const { data, error } = await client.from(table).select(selectColumnExpression(column)).limit(limit);
      if(error) throw error;
      const values = uniqueSorted((data || []).map(r => r[column]));
      cache.set(key, values);
      return values;
    } catch(err){
      console.warn('KYV_FIELD_MEMORY: impossibile leggere suggerimenti', table, column, err);
      cache.set(key, []);
      return [];
    }
  }

  async function fetchSourcesValues(sources, limit=1000){
    const values = [];
    for(const s of sources || []){
      if(!s || !s.table || !s.column) continue;
      values.push(...await fetchColumnValues(s.table, s.column, s.limit || limit));
    }
    return uniqueSorted(values, 400);
  }

  function getDatalist(id){
    let dl = document.getElementById(id);
    if(!dl){
      dl = document.createElement('datalist');
      dl.id = id;
      dl.dataset.kyvMemory = '1';
      document.body.appendChild(dl);
    }
    return dl;
  }

  async function attachInput(input, cfg={}){
    if(!input || input.dataset.kyvMemoryReady === '1') return;
    if(!isInputSuggestible(input)) return;
    const table = cfg.table || input.dataset.suggestTable;
    const column = cfg.column || input.dataset.suggestColumn || input.dataset.key || input.name || input.id;
    const sources = cfg.sources || (table && column ? [{table, column, limit:cfg.limit}] : []);
    if(!sources.length) return;
    input.dataset.kyvMemoryReady = '1';
    input.dataset.kyvMemorySources = sources.map(s=>`${s.table}.${s.column}`).join(', ');
    const dlId = input.getAttribute('list') || `kyv-datalist-${safeId(sources.map(s=>`${s.table}-${s.column}`).join('-'))}`;
    input.setAttribute('list', dlId);
    input.setAttribute('autocomplete', 'off');
    const dl = getDatalist(dlId);
    const values = await fetchSourcesValues(sources, cfg.limit || 1000);
    dl.innerHTML = values.map(v => `<option value="${esc(v)}"></option>`).join('');
    if(values.length) input.title = input.title || `Suggerimenti da: ${input.dataset.kyvMemorySources}`;
  }

  async function attach(configs=[]){
    for(const cfg of configs){
      document.querySelectorAll(cfg.selector || '').forEach(input => attachInput(input, cfg));
    }
  }

  async function expandSelect(select, cfg={}){
    if(!select || select.dataset.kyvMemorySelectReady === '1') return;
    if(!isSelectSuggestible(select)) return;
    const table = cfg.table || select.dataset.suggestTable;
    const column = cfg.column || select.dataset.suggestColumn || select.name || select.id;
    const sources = cfg.sources || (table && column ? [{table, column, limit:cfg.limit}] : []);
    if(!sources.length) return;
    select.dataset.kyvMemorySelectReady = '1';
    select.dataset.kyvMemorySources = sources.map(s=>`${s.table}.${s.column}`).join(', ');
    const values = await fetchSourcesValues(sources, cfg.limit || 1000);
    const existing = new Set(Array.from(select.options || []).map(o => String(o.value || o.textContent || '').trim().toLowerCase()));
    values.forEach(v => {
      const key = String(v).trim().toLowerCase();
      if(!existing.has(key)){
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        select.appendChild(opt);
        existing.add(key);
      }
    });
    if(window.KYV_SELECTS) window.KYV_SELECTS.refreshSelect(select);
  }

  async function expandSelects(configs=[]){
    for(const cfg of configs){
      document.querySelectorAll(cfg.selector || '').forEach(sel => expandSelect(sel, cfg));
    }
  }

  function shouldSuggestDynamicColumn(column){
    const k = String(column || '').toLowerCase();
    if(!k) return false;
    if(k === 'id' || k.startsWith('id_') || k.includes('created_at')) return false;
    if(k.includes('data') || k.includes('date')) return false;
    if(k.includes('link') || k.includes('url') || k.includes('hash')) return false;
    if(k.includes('codice') || k.includes('fiscale') || k.includes('cap') || k.includes('isrc') || k.includes('ipi')) return false;
    if(['fee','roy','importo','prezzo','totale','quota','pagamento','numero','progressivo'].some(x => k.includes(x))) return false;
    return ['artista','autore','autori','label','management','manager','stato','sviluppo','tipo','categoria','canale','contesto','fonte','destinatario','nome','cognome','denominazione','comune','provincia','ruolo','strumenti','produttore','titolo','descrizione','versione','tipologia','esito','priorita','note'].some(x => k.includes(x));
  }

  function isInputSuggestible(input){
    if(!input || input.disabled || input.readOnly) return false;
    if(input.tagName === 'TEXTAREA') return false; // datalist non è affidabile sui textarea
    const type = String(input.getAttribute('type') || 'text').toLowerCase();
    if(['hidden','date','datetime-local','time','month','week','file','checkbox','radio','range','color','password','number','url','email','tel','search'].includes(type)) return false;
    const id = String(input.id || input.name || '').toLowerCase();
    if(id.includes('search') || id.includes('filter') || id.includes('hash') || id.includes('link') || id.includes('url')) return false;
    return true;
  }

  function isSelectSuggestible(select){
    if(!select || select.disabled) return false;
    const id = String(select.id || select.name || '').toLowerCase();
    if(id.includes('filter') || id.includes('account') || id.includes('project') || id.includes('table')) return false;
    return true;
  }

  function attachDynamicInputs(root=document, table='PROGETTI'){
    root.querySelectorAll('input[data-key], textarea[data-key], select[data-key]').forEach(el => {
      const key = el.dataset.key;
      if(!shouldSuggestDynamicColumn(key)) return;
      if(el.tagName === 'SELECT') expandSelect(el, {table, column:key});
      else attachInput(el, {table, column:key});
    });
  }

  function attachProjectDynamicInputs(root=document){
    attachDynamicInputs(root, 'PROGETTI');
  }

  function pageName(){
    return String(location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function defaultTableForPage(){
    const p = pageName();
    if(['progetti.html','sessioni.html','protezione.html','scheda_progetto.html','assistente.html','index.html'].includes(p)) return 'PROGETTI';
    if(p === 'clienti.html') return 'CLIENTI';
    if(p === 'fatture.html' || p === 'correlazione.html') return 'FATTURE';
    if(p === 'documenti.html') return 'DOCUMENTI_PROGETTO';
    if(p === 'kyv_dropbox.html' || p === 'ascolto.html') return 'DROPBOX_AUDIO_FILES';
    return '';
  }

  function nearestLabelText(el){
    const direct = el.closest('label');
    if(direct){
      const clone = direct.cloneNode(true);
      clone.querySelectorAll('input,textarea,select,button,option,datalist').forEach(n=>n.remove());
      const txt = normalize(clone.textContent);
      if(txt) return txt;
    }
    if(el.id){
      const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if(lab) return normalize(lab.textContent);
    }
    const wrap = el.closest('[data-field-wrapper], .space-y-1, div, td');
    const span = wrap?.querySelector('label, [data-field-label], span, .mini-label');
    return normalize(span?.textContent || '');
  }

  function bestField(table, el){
    if(!table || !window.KYV_DB) return '';
    const candidates = [el.dataset.suggestColumn, el.dataset.key, el.name, el.id, nearestLabelText(el), el.placeholder]
      .map(v => String(v || '').replace(/^c-/, '').replace(/^(audio|send|doc|sheet|expense|followup)-/i, ''))
      .filter(Boolean);
    for(const c of candidates){
      const found = KYV_DB.findBestField(table, c);
      if(found && shouldSuggestDynamicColumn(found)) return found;
    }
    return '';
  }

  function attachInferred(root=document){
    const table = defaultTableForPage();
    if(!table) return;
    root.querySelectorAll('input, select').forEach(el => {
      if(el.dataset.kyvMemoryReady === '1' || el.dataset.kyvMemorySelectReady === '1') return;
      if(el.dataset.noFieldMemory === '1') return;
      if(el.tagName === 'SELECT' && !isSelectSuggestible(el)) return;
      if(el.tagName !== 'SELECT' && !isInputSuggestible(el)) return;
      const field = bestField(table, el);
      if(!field) return;
      if(el.tagName === 'SELECT') expandSelect(el, {table, column:field});
      else attachInput(el, {table, column:field});
    });
  }

  function initDefaults(){
    attach([
      { selector:'#c-nome', table:'CLIENTI', column:'Nome_Denominazione' },
      { selector:'#c-indirizzo', table:'CLIENTI', column:'Indirizzo' },
      { selector:'#audio-artist', sources:[{table:'DROPBOX_AUDIO_FILES', column:'Artista'}, {table:'PROGETTI', column:'ARTISTA'}] },
      { selector:'#audio-title', sources:[{table:'DROPBOX_AUDIO_FILES', column:'Titolo'}, {table:'PROGETTI', column:'TITOLO'}] },
      { selector:'#audio-file-name', table:'DROPBOX_AUDIO_FILES', column:'Nome_File' },
      { selector:'#audio-version', sources:[{table:'DROPBOX_AUDIO_FILES', column:'Versione'}, {table:'PROGETTI', column:'SVILUPPO'}] },
      { selector:'#send-recipient', sources:[{table:'INVII_AUDIO', column:'Destinatario'}, {table:'CLIENTI', column:'Nome_Denominazione'}, {table:'PROGETTI', column:'MANAGEMENT'}, {table:'PROGETTI', column:'Label'}] },
      { selector:'#confirm-note', table:'INVII_AUDIO', column:'Conferma_Ricezione' },
      { selector:'#expense-desc', table:'Spese Extra', column:'Descrizione' },
      { selector:'#sheet-recipient', sources:[{table:'DOCUMENTI_PROGETTO', column:'Fonte'}, {table:'CLIENTI', column:'Nome_Denominazione'}, {table:'PROGETTI', column:'MANAGEMENT'}, {table:'PROGETTI', column:'Label'}] }
    ]);
    expandSelects([
      { selector:'#c-tipo', table:'CLIENTI', column:'Tipologia' },
      { selector:'#followup-priority', table:'PROGETTI', column:'Priorita_Followup' },
      { selector:'#followup-outcome', table:'PROGETTI', column:'Esito_Ascolto' },
      { selector:'#expense-cat', table:'Spese Extra', column:'Categoria' },
      { selector:'#audio-type', table:'DROPBOX_AUDIO_FILES', column:'Tipo_File' },
      { selector:'#send-recipient-type', table:'INVII_AUDIO', column:'Tipo_Destinatario' },
      { selector:'#send-channel', table:'INVII_AUDIO', column:'Canale' },
      { selector:'#send-context', table:'INVII_AUDIO', column:'Contesto' },
      { selector:'#doc-type', table:'DOCUMENTI_PROGETTO', column:'Tipo_Documento' }
    ]);
    attachProjectDynamicInputs(document);
    attachInferred(document);
    startObserver();
  }

  function scheduleScan(root=document){
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      try {
        attachProjectDynamicInputs(root);
        attachInferred(root);
      } catch(err){ console.warn('KYV_FIELD_MEMORY scan non riuscita', err); }
    }, 220);
  }

  function startObserver(){
    if(observer) return;
    observer = new MutationObserver((mutations) => {
      let should = false;
      for(const m of mutations){
        if(m.target && m.target.closest && m.target.closest('datalist[data-kyv-memory="1"], .kyv-searchable-select')) continue;
        for(const n of m.addedNodes || []){
          if(n.nodeType !== 1) continue;
          if(n.matches?.('input,select,textarea,[data-key]') || n.querySelector?.('input,select,textarea,[data-key]')){ should = true; break; }
        }
        if(should) break;
      }
      if(should) scheduleScan(document);
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }

  function clearCache(){ cache.clear(); localStorage.removeItem('kyv_field_memory_cache_v1'); initDefaults(); }

  document.addEventListener('DOMContentLoaded', () => setTimeout(initDefaults, 300));
  window.KYV_FIELD_MEMORY = { attach, attachInput, expandSelect, expandSelects, attachDynamicInputs, attachProjectDynamicInputs, attachInferred, fetchColumnValues, fetchSourcesValues, refresh:initDefaults, clearCache };
})();
