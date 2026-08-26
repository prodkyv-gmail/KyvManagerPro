// kyv-data-guard.js
// v2.12.0 - Protezioni comuni per backup, ripristino e creazioni INSERT-only.
(function(){
  const VERSION = '2.12.0';
  const LOG_KEY = 'kyv_data_guard_logs_v2';

  function now(){ return new Date().toISOString(); }
  function safeMsg(err){ return String(err?.message || err?.details || err || 'Errore sconosciuto'); }
  function toast(msg, type='info'){
    if(window.KYV && typeof KYV.showToast === 'function') return KYV.showToast(msg, type);
    if(window.KYV_TOAST && typeof KYV_TOAST.show === 'function') return KYV_TOAST.show(msg, type);
    console.log('[KYV_DATA_GUARD]', msg);
  }
  function log(level, action, details={}){
    const entry = { ts: now(), version: VERSION, level, action, details };
    try{
      const list = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      list.push(entry);
      localStorage.setItem(LOG_KEY, JSON.stringify(list.slice(-300)));
    }catch(e){}
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
    fn('[KYV_DATA_GUARD]', action, details);
    return entry;
  }
  function getLogs(){ try{ return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }catch(e){ return []; } }
  function clearLogs(){ localStorage.removeItem(LOG_KEY); }
  function downloadLogs(){
    const text = JSON.stringify({ app:'KyvManagerPro', type:'data_guard_logs', version:VERSION, exported_at:now(), logs:getLogs() }, null, 2);
    const name = `kyv-data-guard-logs-${now().replace(/[:.]/g,'-').slice(0,19)}.json`;
    if(window.KYV && typeof KYV.downloadTextFile === 'function') KYV.downloadTextFile(name, text, 'application/json;charset=utf-8');
    else{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], {type:'application/json;charset=utf-8'}));
      a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  }

  function schemaColumns(table){
    try{ return window.KYV_DB?.getColumns(table) || []; }catch(e){ return []; }
  }
  function columnNames(table){ return new Set(schemaColumns(table).map(c => c.id)); }
  function primaryKey(table){
    try{ return window.KYV_DB?.PRIMARY_KEYS?.[table] || schemaColumns(table).find(c => c.primary)?.id || null; }
    catch(e){ return null; }
  }
  function identityColumns(table){ return schemaColumns(table).filter(c => c.identity || c.primary).map(c => c.id); }
  function isNumericLike(v){ return v !== null && v !== undefined && String(v).trim() !== '' && Number.isFinite(Number(v)); }
  function normalizePrimary(v){ return String(v ?? '').trim(); }
  function sanitizePayload(table, row, options={}){
    const cols = columnNames(table);
    const identities = new Set(identityColumns(table));
    const keepIdentity = !!options.keepIdentity;
    const out = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      if(cols.size && !cols.has(key)) return;
      if(!keepIdentity && identities.has(key)) return;
      if(value === undefined) return;
      out[key] = value === '' ? null : value;
    });
    return out;
  }
  async function fetchAllRows(db, table, select='*', pageSize=1000){
    const rows = [];
    for(let from=0; ; from += pageSize){
      const to = from + pageSize - 1;
      const { data, error } = await db.from(table).select(select).range(from, to);
      if(error) throw error;
      rows.push(...(data || []));
      if(!data || data.length < pageSize) break;
    }
    return rows;
  }
  async function fetchExistingPrimaryValues(db, table, pk=null){
    pk = pk || primaryKey(table);
    if(!pk) return new Set();
    const rows = await fetchAllRows(db, table, pk);
    return new Set(rows.map(r => normalizePrimary(r?.[pk])).filter(Boolean));
  }
  async function nextNumericPrimary(db, table, pk=null){
    pk = pk || primaryKey(table);
    if(!pk) return null;
    let max = 0;
    try{
      const { data, error } = await db.from(table).select(pk).order(pk, { ascending:false }).limit(1);
      if(!error && Array.isArray(data) && data[0] && isNumericLike(data[0][pk])) max = Math.max(max, Number(data[0][pk]));
    }catch(e){ log('warn', 'next_primary_order_failed', { table, pk, error:safeMsg(e) }); }
    if(!max){
      const rows = await fetchAllRows(db, table, pk);
      rows.forEach(r => { if(isNumericLike(r?.[pk])) max = Math.max(max, Number(r[pk])); });
    }
    return max + 1;
  }
  function isDuplicateKeyError(err){
    const msg = safeMsg(err).toLowerCase();
    return msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('violates unique') || msg.includes('23505');
  }
  function isIdentityInsertError(err){
    const msg = safeMsg(err).toLowerCase();
    return msg.includes('generated always') || msg.includes('identity column') || (msg.includes('cannot insert') && msg.includes('id'));
  }
  function isMissingColumnError(err){
    const msg = safeMsg(err).toLowerCase();
    return msg.includes('column') || msg.includes('schema cache') || msg.includes('could not find') || msg.includes('invalid input');
  }

  async function safeInsertNewRecord(db, table, payload, options={}){
    if(!db) throw new Error('Supabase non disponibile.');
    const pk = options.primaryKey || primaryKey(table);
    const label = options.label || table;
    const retries = Number(options.retries || 20);
    const allowExplicitPrimary = options.allowExplicitPrimary !== false;
    const beforeIds = pk ? await fetchExistingPrimaryValues(db, table, pk) : new Set();
    const clean = sanitizePayload(table, payload, { keepIdentity:false });
    if(!Object.keys(clean).length) throw new Error(`Nessun campo valido da inserire in ${table}.`);

    let lastError = null;
    let canUseExplicitPrimary = !!(allowExplicitPrimary && pk);
    if(canUseExplicitPrimary){
      try{
        const start = await nextNumericPrimary(db, table, pk);
        if(start && Number.isFinite(Number(start))){
          for(let offset=0; offset<retries; offset++){
            const candidateId = Number(start) + offset;
            if(beforeIds.has(String(candidateId))) continue;
            const row = { [pk]: candidateId, ...clean };
            try{
              const { data, error } = await db.from(table).insert([row]).select('*').single();
              if(error) throw error;
              const returnedId = normalizePrimary(data?.[pk] ?? row[pk]);
              if(returnedId && beforeIds.has(returnedId)) throw new Error(`Blocco sicurezza: ${label} ha restituito un ${pk} già esistente (${returnedId}).`);
              log('info', 'safe_insert_success_explicit_pk', { table, pk, id: returnedId, label });
              return data || row;
            }catch(err){
              lastError = err;
              if(isDuplicateKeyError(err)) continue;
              if(isIdentityInsertError(err)){ canUseExplicitPrimary = false; break; }
              throw err;
            }
          }
        }
      }catch(err){
        lastError = err;
        if(!isIdentityInsertError(err) && !isDuplicateKeyError(err)) log('warn', 'explicit_pk_insert_failed', { table, pk, error:safeMsg(err) });
      }
    }

    try{
      const { data, error } = await db.from(table).insert([clean]).select('*').single();
      if(error) throw error;
      const returnedId = pk ? normalizePrimary(data?.[pk]) : '';
      if(returnedId && beforeIds.has(returnedId)) throw new Error(`Blocco sicurezza: ${label} ha restituito un ${pk} già esistente (${returnedId}).`);
      log('info', 'safe_insert_success_identity', { table, pk, id: returnedId || null, label });
      return data || clean;
    }catch(err){
      log('error', 'safe_insert_failed', { table, pk, label, error:safeMsg(err), previousError: lastError ? safeMsg(lastError) : null });
      throw err;
    }
  }

  function backupStamp(){ return now().replace(/[:.]/g, '-').slice(0, 19); }
  function buildBackupMeta(extra={}){
    return { app:'KyvManagerPro', guard_version:VERSION, created_at:now(), source:location.href, ...extra };
  }
  function validateBackupObject(json){
    if(!json || typeof json !== 'object') return { ok:false, errors:['File JSON non valido.'] };
    const tables = json.tables && typeof json.tables === 'object' ? json.tables : json;
    const errors = [];
    const validTables = [];
    Object.entries(tables || {}).forEach(([name, rows]) => {
      if(Array.isArray(rows)){ validTables.push(name); }
      else if(name !== 'meta' && name !== 'schema' && name !== 'errors') errors.push(`${name}: non è un array.`);
    });
    if(!validTables.length) errors.push('Nessuna tabella ripristinabile trovata.');
    return { ok: errors.length === 0, errors, validTables };
  }

  window.KYV_DATA_GUARD = {
    VERSION, LOG_KEY, log, getLogs, clearLogs, downloadLogs, toast,
    schemaColumns, columnNames, primaryKey, identityColumns, sanitizePayload,
    fetchAllRows, fetchExistingPrimaryValues, nextNumericPrimary,
    isDuplicateKeyError, isIdentityInsertError, isMissingColumnError,
    safeInsertNewRecord, buildBackupMeta, validateBackupObject, backupStamp
  };
})();
