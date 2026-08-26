(function(){
  'use strict';

  /*
    KyvManagerPro v2.11.4
    Select ricercabili con snapshot sicuro: quando una pagina riscrive le option, il componente ricattura i dati prima di filtrare.
    Fix principale: la v2.10.8 poteva entrare in refresh continuo perché il MutationObserver
    intercettava anche le option riscritte dal componente stesso.
  */

  const collator = new Intl.Collator('it', { sensitivity:'base', numeric:true, ignorePunctuation:true });
  const SEARCHABLE_IDS = new Set([
    'audio-project', 'dropbox-target-project', 'project-filter', 'expense-project', 'sheet-project',
    'target-table', 'doc-type'
  ]);
  const SEARCHABLE_NAME_PARTS = ['progetto', 'project', 'opera', 'autore', 'cliente', 'artist', 'table', 'tabella'];
  const NO_ALPHA_IDS = new Set(['fisco-anno']);
  const ENHANCED_CLASS = 'kyv-select-searchable';

  let observer = null;
  let refreshTimer = null;

  function normalize(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function safeCssEscape(value){
    if(window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/"/g, '\\"');
  }

  function optionText(opt){
    return String(opt?.textContent || opt?.label || '').replace(/\s+/g, ' ').trim();
  }

  function optionData(opt){
    const dataset = {};
    if(opt?.dataset){
      for(const key of Object.keys(opt.dataset)) dataset[key] = opt.dataset[key];
    }
    return {
      value: opt?.value ?? '',
      text: optionText(opt),
      disabled: !!opt?.disabled,
      selected: !!opt?.selected,
      dataset
    };
  }

  function isPlaceholder(item){
    return item.value === '' || /^\s*(tutti|nessun|seleziona|scegli|non filtrare|tutte|nessuna)/i.test(item.text || '');
  }

  function labelText(select){
    let label = '';
    if(select.id){
      const el = document.querySelector(`label[for="${safeCssEscape(select.id)}"]`);
      if(el) label = el.textContent || '';
    }
    if(!label){
      const parent = select.closest('label');
      if(parent) label = parent.textContent || '';
    }
    if(!label){
      const prev = select.previousElementSibling;
      if(prev && /label|span|p|div/i.test(prev.tagName)) label = prev.textContent || '';
    }
    return String(label || '').replace(/\s+/g, ' ').trim();
  }

  function shouldEnhance(select){
    if(!select || select.tagName !== 'SELECT') return false;
    if(select.dataset.kyvSearch === 'off' || select.dataset.kyvSearchable === 'false') return false;
    if(select.dataset.kyvSearchable === 'true') return true;
    const id = select.id || '';
    const name = select.name || '';
    const label = labelText(select);
    const blob = normalize([id, name, label, select.getAttribute('aria-label') || ''].join(' '));
    if(SEARCHABLE_IDS.has(id)) return true;
    if(SEARCHABLE_NAME_PARTS.some(part => blob.includes(part))) return true;
    return select.options && select.options.length >= 12;
  }

  function preferredPlaceholder(select){
    const id = select.id || '';
    if(id === 'audio-project' || id === 'expense-project') return 'Cerca progetto per artista o titolo...';
    if(id === 'dropbox-target-project') return 'Cerca progetto da collegare...';
    if(id === 'project-filter') return 'Cerca progetto da filtrare...';
    if(id === 'sheet-project') return 'Cerca progetto per scheda...';
    if(id === 'target-table') return 'Cerca tabella...';
    if(id === 'doc-type') return 'Cerca tipo documento...';
    const label = labelText(select);
    return label ? `Cerca ${label.toLowerCase()}...` : 'Cerca nel menu...';
  }

  function sortMode(select){
    if(!select) return 'alpha';
    if(select.dataset.kyvSort) return select.dataset.kyvSort;
    if(NO_ALPHA_IDS.has(select.id)) return 'none';
    if(/anno|year/i.test(select.id || '') || /anno|year/i.test(labelText(select))) return 'number-desc';
    return 'alpha';
  }

  function sortItems(items, mode){
    const placeholders = items.filter(isPlaceholder);
    const rest = items.filter(x => !isPlaceholder(x));
    if(mode === 'number-desc') rest.sort((a,b) => (parseFloat(b.text)||0) - (parseFloat(a.text)||0));
    else if(mode === 'number-asc') rest.sort((a,b) => (parseFloat(a.text)||0) - (parseFloat(b.text)||0));
    else if(mode !== 'none') rest.sort((a,b) => collator.compare(a.text, b.text));
    return [...placeholders, ...rest];
  }

  function captureOptions(select){
    const items = Array.from(select.options || []).map(optionData);
    select._kyvOptionSnapshot = items;
    select._kyvOptionSnapshotKey = items.map(x => `${x.value}::${x.text}`).join('|');
    return items;
  }

  function getItems(select){
    if(!select._kyvOptionSnapshot) return captureOptions(select);
    return select._kyvOptionSnapshot;
  }

  function ensureWrap(select){
    if(select.dataset.kyvSearchReady === 'true') return select._kyvSearchBox || null;
    const parent = select.parentNode;
    if(!parent) return null;

    const wrap = document.createElement('div');
    wrap.className = 'kyv-select-search-wrap';

    const input = document.createElement('input');
    input.type = 'search';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.className = 'kyv-select-search-input';
    input.placeholder = preferredPlaceholder(select);
    input.setAttribute('aria-label', input.placeholder);

    input.addEventListener('input', () => renderOptions(select, input.value));
    input.addEventListener('keydown', (ev) => {
      if(ev.key === 'Escape'){
        input.value = '';
        renderOptions(select, '');
        select.focus();
      }
      if(ev.key === 'ArrowDown') select.focus();
    });

    parent.insertBefore(wrap, select);
    wrap.appendChild(input);
    select.dataset.kyvSearchReady = 'true';
    select._kyvSearchBox = input;
    select.classList.add(ENHANCED_CLASS);
    return input;
  }

  function markRendering(select){
    select._kyvRenderingBySearch = true;
    select.dataset.kyvRendering = 'true';
    clearTimeout(select._kyvRenderTimer);
    select._kyvRenderTimer = setTimeout(() => {
      select._kyvRenderingBySearch = false;
      if(select.dataset.kyvRendering === 'true') delete select.dataset.kyvRendering;
    }, 150);
  }

  function renderOptions(select, query){
    if(!select || select.tagName !== 'SELECT') return;
    const currentValue = select.value;
    const mode = sortMode(select);
    const q = normalize(query);
    let items = sortItems([...getItems(select)], mode);

    if(q){
      const placeholders = items.filter(isPlaceholder);
      const matches = items.filter(x => !isPlaceholder(x) && normalize(`${x.text} ${x.value}`).includes(q));
      items = [...placeholders, ...matches];
    }

    markRendering(select);
    select.replaceChildren();
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.text;
      opt.disabled = item.disabled;
      for(const [key, value] of Object.entries(item.dataset || {})) opt.dataset[key] = value;
      select.appendChild(opt);
    });

    if(items.some(x => String(x.value) === String(currentValue))) select.value = currentValue;
  }

  function currentOptionsKey(select){
    return Array.from(select.options || []).map(o => `${o.value ?? ''}::${optionText(o)}`).join('|');
  }

  function refreshSelect(select, options={}){
    if(!select || select.tagName !== 'SELECT') return;
    if(!shouldEnhance(select)) return;
    ensureWrap(select);

    // Se la pagina ha appena caricato nuovi option via innerHTML, non riusare il vecchio snapshot.
    // Questo era il motivo per cui alcuni menu progetto risultavano vuoti/non aggiornati.
    const liveKey = currentOptionsKey(select);
    const knownKey = select._kyvOptionSnapshotKey || '';
    const optionsChangedExternally = !!liveKey && liveKey !== knownKey && !select._kyvRenderingBySearch;
    if(options.forceSnapshot || !select._kyvOptionSnapshot || optionsChangedExternally) captureOptions(select);

    renderOptions(select, select._kyvSearchBox ? select._kyvSearchBox.value : '');
  }

  function refreshAll(root=document, options={}){
    Array.from(root.querySelectorAll('select')).forEach(select => refreshSelect(select, options));
  }

  function scheduleRefresh(root=document, options={}){
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refreshAll(root, options), 120);
  }

  function isOwnRenderMutation(target){
    const el = target && target.nodeType === 1 ? target : target?.parentElement;
    const select = el?.tagName === 'SELECT' ? el : el?.closest?.('select');
    return !!(select && select._kyvRenderingBySearch);
  }

  function init(){
    refreshAll(document, { forceSnapshot:true });

    observer = new MutationObserver(mutations => {
      let needsGeneralRefresh = false;
      for(const m of mutations){
        if(isOwnRenderMutation(m.target)) continue;

        if(m.target && m.target.tagName === 'SELECT'){
          const select = m.target;
          if(select.dataset.kyvSearchReady === 'true'){
            clearTimeout(select._kyvExternalRefreshTimer);
            select._kyvExternalRefreshTimer = setTimeout(() => refreshSelect(select, { forceSnapshot:true }), 120);
          } else {
            needsGeneralRefresh = true;
          }
          continue;
        }

        for(const node of Array.from(m.addedNodes || [])){
          if(node.nodeType !== 1) continue;
          if(node.tagName === 'SELECT' || node.querySelector?.('select')){
            needsGeneralRefresh = true;
            break;
          }
        }
      }
      if(needsGeneralRefresh) scheduleRefresh(document, { forceSnapshot:true });
    });

    if(document.body) observer.observe(document.body, { childList:true, subtree:true });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  window.KYV_SELECTS = { refreshAll, refreshSelect, sortItems, captureOptions };
})();
