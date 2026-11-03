// kyv-audio-project.js
// v2.23 - Archivio audio unificato e salvataggio atomico progetto + versione.
(function(){
  const AUDIO_EXT_RE = /\.(mp3|wav|m4a|aif|aiff|flac|aac|ogg|opus)(?:[?#].*)?$/i;
  let v23RpcState = 'unknown';
  let compatibilityWarningShown = false;

  function esc(v){
    if(window.KYV && typeof KYV.safeHtml === 'function') return KYV.safeHtml(v ?? '');
    return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  }
  function norm(v){
    if(window.KYV && typeof KYV.normalize === 'function') return KYV.normalize(v ?? '');
    return String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  }
  function toast(msg, type='info'){
    if(window.KYV && typeof KYV.showToast === 'function') return KYV.showToast(msg, type);
    alert(msg);
  }
  function today(){ return new Date().toISOString().slice(0,10); }
  function isUrl(v){ return /^https?:\/\//i.test(String(v || '').trim()); }
  function linkFromItem(item){
    return String(item?.link || item?.Link_Dropbox || item?.playUrl || item?.webContentLink || item?.webViewLink || item?.url || item?.Link || '').trim();
  }
  function rawNameFromItem(item){
    return item?.title || item?.Titolo || item?.TITOLO || item?.name || item?.filename || item?.fileName || item?.Nome_File || item?.NomeFile || item?.Progetto || item?.progetto || 'Nuovo brano';
  }
  function stripQueryAndPath(value){
    let raw = String(value || '').trim();
    try{
      if(isUrl(raw)){
        const u = new URL(raw);
        const last = decodeURIComponent((u.pathname.split('/').filter(Boolean).pop() || raw));
        raw = last || raw;
      }
    }catch(e){}
    return raw.split('?')[0].split('#')[0].split('/').pop();
  }
  function cleanTitle(value){
    let title = stripQueryAndPath(value);
    title = String(title || '').replace(/\.[a-z0-9]{2,5}$/i, '');
    title = title.replace(/[_]+/g, ' ').replace(/\s+-\s+/g, ' - ').replace(/\s+/g, ' ').trim();
    title = title.replace(/\b(master|mix|demo|provino|topline|bounce|rough|final|stems|sessione|radio|ascolto)\b/ig, ' ');
    title = title.replace(/\b(v\s*\d{1,3}|ver\s*\d{1,3}|versione\s*\d{1,3})\b/ig, ' ');
    title = title.replace(/\s+/g, ' ').replace(/[\s_\-–—]+$/g, '').trim();
    return title || 'Nuovo brano';
  }
  function artistFromItem(item){ return String(item?.artist || item?.Artista || item?.ARTISTA || '').trim(); }
  function fileNameFromItem(item){ return String(item?.fileName || item?.Nome_File || item?.name || item?.filename || rawNameFromItem(item) || '').trim(); }
  function sourceFromItem(item){ return String(item?.source || item?.driveLabel || item?.driveEmail || item?.Tipo_File || item?.type || '').trim(); }
  function sourceKind(item){
    const verified=String(item?.provider||'').toLowerCase();
    if(['local','drive','dropbox'].includes(verified)) return verified;
    const blob = `${sourceFromItem(item)} ${linkFromItem(item)} ${item?.webViewLink || ''} ${item?.webContentLink || ''}`.toLowerCase();
    if(blob.includes('dropbox')) return 'dropbox';
    if(blob.includes('drive.google') || blob.includes('google') || /\bdrive\b/.test(blob) || item?.driveEmail || item?.driveLabel || item?.webViewLink || item?.webContentLink) return 'drive';
    return 'other';
  }
  function providerIdentity(item){
    const kind=sourceKind(item);
    const id=String(item?.id||item?.fileId||item?.providerId||'').trim();
    return id ? `${kind==='dropbox'?'Dropbox':kind==='drive'?'Drive':'File'}:${id}` : '';
  }
  function providerId(item){
    return String(item?.id || item?.fileId || item?.providerId || '').trim();
  }
  function providerRevision(item){
    return String(item?.rev || item?.revision || item?.versionId || item?.modifiedTime || item?.updated || item?.date || '').trim();
  }
  function contentHash(item){
    return String(item?.Hash_SHA256 || item?.content_hash || item?.contentHash || item?.hash || '').trim();
  }
  function inferVersion(item){
    const raw = `${item?.Versione || item?.version || ''} ${fileNameFromItem(item)}`.replace(/[_-]+/g,' ');
    const numbered = raw.match(/\b(?:v|ver(?:sione)?)\s*[-_.]?\s*(\d{1,3})\b/i);
    if(numbered) return `v${numbered[1]}`;
    const named = raw.match(/\b(finale?|final|rough|bozza|definitiv[oa]|radio edit|instrumental|acapella)\b/i);
    return named ? named[1].replace(/^final$/i,'Finale') : '';
  }
  function inferType(item){
    const explicit = String(item?.Tipo_File || item?.type || '').trim();
    if(explicit && !/^audio(\/|$)/i.test(explicit)) return explicit;
    const raw = `${fileNameFromItem(item)} ${rawNameFromItem(item)}`.toLowerCase().replace(/[_-]+/g,' ');
    if(/\bstems?\b/.test(raw)) return 'Stems';
    if(/\bmaster\b/.test(raw)) return 'Master';
    if(/\bmix\b/.test(raw)) return 'Mix';
    if(/\b(voce|vocal|vox|topline|acapella)\b/.test(raw)) return 'Voce';
    if(/\b(demo|provino|rough|bozza)\b/.test(raw)) return 'Demo';
    if(/\b(instrumental|strumentale|base|beat)\b/.test(raw)) return 'Produzione';
    return 'Versione audio';
  }
  function isAudioItem(item){
    const pieces=[rawNameFromItem(item),fileNameFromItem(item),item?.type,item?.Tipo_File,item?.mimeType,linkFromItem(item)];
    const blob=pieces.join(' ');
    return pieces.some(v=>AUDIO_EXT_RE.test(String(v||'').trim()))||
      /(?:^|\s)audio(?:\/(?:mpeg|wav|x-wav|flac|mp4|aiff?|ogg|aac|unknown))?/i.test(blob)||
      /demo ascolto|master|mix|provino|topline/i.test(blob);
  }

  function projectLabel(p){
    return [p?.ARTISTA || p?.Artista, p?.TITOLO || p?.Titolo].filter(Boolean).join(' - ') || p?.TITOLO || p?.Titolo || p?.ARTISTA || p?.Artista || (p?.ID ? `Progetto #${p.ID}` : 'Progetto');
  }
  function projectBlob(p){
    if(!p) return '';
    return Object.entries(p)
      .filter(([k,v]) => v !== null && v !== undefined && typeof v !== 'object')
      .map(([k,v]) => `${k} ${v}`)
      .join(' ');
  }
  function matchProjectForTitle(title, projects){
    const t = norm(cleanTitle(title));
    if(!t || t.length < 3) return null;
    const loose = t.length >= 7 ? t : '';
    for(const p of (projects || [])){
      const blob = norm(projectBlob(p));
      const pTitle = norm(p?.TITOLO || p?.Titolo || '');
      if(blob && blob.includes(t)) return p;
      if(loose && pTitle && (loose.includes(pTitle) || pTitle.includes(loose))) return p;
    }
    return null;
  }
  function matchProjectForItem(item, projects){
    const linkedId = item?.idProgetto || item?.ID_PROGETTO || item?.projectId || '';
    if(linkedId){
      const linked = (projects || []).find(p => String(p?.ID) === String(linkedId));
      if(linked) return linked;
    }
    return matchProjectForTitle(rawNameFromItem(item), projects) || matchProjectForTitle(item?.title || item?.Titolo || item?.name || item?.fileName || '', projects);
  }
  function hasProjectForItem(item, projects){ return !!matchProjectForItem(item, projects); }

  async function copyText(text){
    const value = String(text || '');
    try{ await navigator.clipboard.writeText(value); }
    catch(e){
      const ta = document.createElement('textarea');
      ta.value = value; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast('Link copiato.', 'success');
  }

  function openModal(defaults){
    return new Promise((resolve) => {
      const old = document.getElementById('kyv-audio-project-modal');
      if(old) old.remove();
      const wrap = document.createElement('div');
      wrap.id = 'kyv-audio-project-modal';
      wrap.className = 'fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
      wrap.innerHTML = `
        <div class="w-full max-w-xl rounded-3xl border border-violet-500/25 bg-[#151923] shadow-2xl overflow-hidden">
          <div class="p-5 border-b border-[#232838] bg-violet-600/10 flex items-start justify-between gap-3">
            <div>
              <p class="text-[10px] uppercase tracking-[0.18em] text-violet-200 font-black">Crea progetto da audio</p>
              <h3 class="text-xl font-black text-white mt-1">Nuovo progetto rapido</h3>
              <p class="text-xs text-slate-400 mt-1">Il titolo non risulta presente in PROGETTI. Controlla i dati e crea la scheda.</p>
            </div>
            <button type="button" data-close class="w-10 h-10 rounded-xl border border-[#232838] text-slate-300 hover:text-white hover:border-violet-400/50">×</button>
          </div>
          <form class="p-5 space-y-4">
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Titolo progetto</label>
              <input name="title" class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400" required value="${esc(defaults.title)}">
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Artista</label>
              <input name="artist" class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.artist)}" placeholder="Artista, se noto">
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Link file</label>
              <input name="link" class="w-full bg-[#0f111a] border border-[#232838] text-violet-200 px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.link)}" placeholder="Link audio / Drive / Dropbox">
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Note automatiche</label>
              <textarea name="note" rows="4" class="w-full bg-[#0f111a] border border-[#232838] text-slate-200 px-4 py-3 rounded-xl outline-none focus:border-violet-400">${esc(defaults.note)}</textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button type="button" data-close class="px-4 py-3 rounded-xl border border-[#232838] text-slate-200 font-black text-xs hover:border-violet-400/50">Annulla</button>
              <button type="submit" class="px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs">Crea progetto</button>
            </div>
          </form>
        </div>`;
      document.body.appendChild(wrap);
      const form = wrap.querySelector('form');
      const cleanup = (value) => { wrap.remove(); resolve(value); };
      wrap.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => cleanup(null)));
      wrap.addEventListener('click', (e) => { if(e.target === wrap) cleanup(null); });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        cleanup({
          title: String(fd.get('title') || '').trim(),
          artist: String(fd.get('artist') || '').trim(),
          link: String(fd.get('link') || '').trim(),
          note: String(fd.get('note') || '').trim()
        });
      });
      setTimeout(() => form.elements.title?.focus(), 30);
    });
  }

  function openWorkflowModal(defaults, projects, suggestedProject){
    return new Promise((resolve) => {
      document.getElementById('kyv-audio-project-modal')?.remove();
      const wrap=document.createElement('div');
      wrap.id='kyv-audio-project-modal';
      wrap.className='fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4';
      const options=(projects||[]).slice().sort((a,b)=>projectLabel(a).localeCompare(projectLabel(b),'it')).map(p=>`<option value="${esc(p.ID)}">${esc(projectLabel(p))} · #${esc(p.ID)}</option>`).join('');
      const typeOptions=['Demo','Produzione','Voce','Mix','Master','Stems','Versione audio'].map(v=>`<option ${v===defaults.fileType?'selected':''}>${v}</option>`).join('');
      wrap.innerHTML=`<div class="w-full max-w-3xl max-h-[94vh] rounded-3xl border border-violet-500/25 bg-[#151923] shadow-2xl overflow-hidden flex flex-col">
        <div class="p-5 border-b border-[#232838] bg-violet-600/10 flex items-start justify-between gap-3"><div><p class="text-[10px] uppercase tracking-[0.18em] text-violet-200 font-black">File → progetto → amministrazione</p><h3 class="text-xl font-black text-white mt-1">Avvia o collega questo brano</h3><p class="text-xs text-slate-400 mt-1">Registra questa versione nel progetto giusto. La data sessione resta vuota finché non la confermi.</p></div><button type="button" data-close class="w-10 h-10 rounded-xl border border-[#232838] text-slate-300 hover:text-white">×</button></div>
        <form class="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          <div class="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4"><label class="block text-[10px] uppercase tracking-widest text-violet-200 font-black mb-1">Dove collegare il file</label><select name="projectId" class="w-full bg-[#0f111a] border border-[#343a4c] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400"><option value="" selected>Seleziona tu la destinazione…</option><option value="__new__">Crea un nuovo progetto (solo su tua conferma)</option>${options}</select><p class="text-[11px] text-slate-400 mt-2">Se il brano esiste già, selezionalo: verrà aggiunta una versione, non un duplicato.</p></div>
          <div data-new-fields class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Titolo progetto</span><input name="title" required class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.title)}"></label>
            <label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Artista</span><input name="artist" class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.artist)}" placeholder="Artista, se noto"></label>
            <label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Manager / referente</span><input name="management" class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.management)}" placeholder="Chi ha avviato il lavoro"></label>
            <label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Label</span><input name="label" class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.label)}" placeholder="Se già definita"></label>
            <label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Data reale della sessione</span><input name="sessionDate" type="date" class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.sessionDate)}" style="color-scheme:dark"></label>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Fase del file</span><select name="fileType" class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400">${typeOptions}</select></label><label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Versione</span><input name="version" class="w-full bg-[#0f111a] border border-[#232838] text-white px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.version)}" placeholder="Es. v3, rough, finale"></label></div>
          <label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Link file</span><input name="link" class="w-full bg-[#0f111a] border border-[#232838] text-violet-200 px-4 py-3 rounded-xl outline-none focus:border-violet-400" value="${esc(defaults.link)}" placeholder="Link audio Drive o Dropbox"></label>
          <label><span class="block text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Note</span><textarea name="note" rows="3" class="w-full bg-[#0f111a] border border-[#232838] text-slate-200 px-4 py-3 rounded-xl outline-none focus:border-violet-400">${esc(defaults.note)}</textarea></label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2"><button type="button" data-close class="px-4 py-3 rounded-xl border border-[#232838] text-slate-200 font-black text-xs">Annulla</button><button type="submit" data-submit class="px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs">Collega versione</button></div>
        </form></div>`;
      document.body.appendChild(wrap);
      const form=wrap.querySelector('form'); const select=form.elements.projectId;
      const sync=()=>{
         const linking=!!select.value&&select.value!=='__new__',creating=select.value==='__new__';
         wrap.querySelector('[data-new-fields]').classList.toggle('opacity-50',!creating);
         form.elements.title.required=creating;
         wrap.querySelector('[data-submit]').disabled=!select.value;
         wrap.querySelector('[data-submit]').textContent=linking?'Collega versione':creating?'Crea progetto e collega':'Scegli prima la destinazione';
       };
      select.addEventListener('change',sync); sync();
      const done=value=>{wrap.remove();resolve(value)};
      wrap.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>done(null))); wrap.addEventListener('click',e=>{if(e.target===wrap)done(null)});
      form.addEventListener('submit',e=>{e.preventDefault();if(!select.value)return;const fd=new FormData(form);done({projectId:select.value==='__new__'?'':String(fd.get('projectId')||'').trim(),title:String(fd.get('title')||'').trim(),artist:String(fd.get('artist')||'').trim(),management:String(fd.get('management')||'').trim(),label:String(fd.get('label')||'').trim(),sessionDate:String(fd.get('sessionDate')||'').trim(),fileType:String(fd.get('fileType')||'').trim(),version:String(fd.get('version')||'').trim(),link:String(fd.get('link')||'').trim(),note:String(fd.get('note')||'').trim()})});
      setTimeout(()=> (suggestedProject?select:form.elements.title)?.focus(),30);
    });
  }

  function buildDefaults(item){
    let title = cleanTitle(rawNameFromItem(item));
    let artist = artistFromItem(item);
    if(!artist && /\s[-–—]\s/.test(title)){
      const parts = title.split(/\s[-–—]\s/).map(x => x.trim()).filter(Boolean);
      if(parts.length >= 2){ artist = parts.shift(); title = parts.join(' - '); }
    }
    const link = linkFromItem(item);
    const fileName = fileNameFromItem(item);
    const source = sourceFromItem(item) || 'box audio';
    const noteLines = [
      `Creato automaticamente da ${source} il ${today()}.`,
      fileName ? `File: ${fileName}` : '',
      link ? `Link: ${link}` : '',
      item?.note || item?.Note ? `Nota origine: ${item.note || item.Note}` : ''
    ].filter(Boolean);
    return { title, artist, link, note: noteLines.join('\n'), management:String(item?.MANAGEMENT||item?.management||'').trim(), label:String(item?.Label||item?.label||'').trim(), sessionDate:String(item?.Data_Sessione||item?.sessionDate||'').slice(0,10), fileType:inferType(item), version:inferVersion(item) };
  }

  function insertAttempts(values){
    const base = {
      TITOLO: values.title || 'Nuovo brano',
      ARTISTA: values.artist || null,
      STATO: 'In produzione',
      SVILUPPO: 'WIP',
      NOTE: values.note || null,
      MANAGEMENT: values.management || null,
      Label: values.label || null,
      Data_Sessione: values.sessionDate || null
    };
    return [
      base,
      { TITOLO: base.TITOLO, ARTISTA: base.ARTISTA, STATO: base.STATO, SVILUPPO: base.SVILUPPO, NOTE: base.NOTE, MANAGEMENT:base.MANAGEMENT, Label:base.Label, Data_Sessione:base.Data_Sessione },
      { TITOLO: base.TITOLO, ARTISTA: base.ARTISTA, STATO: base.STATO, SVILUPPO: base.SVILUPPO, NOTE: base.NOTE },
      { TITOLO: base.TITOLO, ARTISTA: base.ARTISTA, STATO: base.STATO, NOTE: base.NOTE },
      { TITOLO: base.TITOLO, ARTISTA: base.ARTISTA },
      { TITOLO: base.TITOLO }
    ].map(cleanProjectPayload);
  }

  function projectColumns(){
    const fallback=['ID','TITOLO','ARTISTA','STATO','SVILUPPO','NOTE','LINK','MANAGEMENT','Label','Data_Sessione'];
    try{ const cols=(window.KYV_DB?.getColumns('PROGETTI')||[]).map(c=>c.id); return new Set(cols.length?cols:fallback); }
    catch(e){ return new Set(fallback); }
  }
  function cleanProjectPayload(payload){
    const cols = projectColumns();
    const out = {};
    Object.entries(payload || {}).forEach(([k,v]) => {
      if(k === 'ID') return; // ID gestito solo dalla funzione sicura sotto.
      if(cols.has(k) && v !== undefined && v !== '') out[k] = v;
    });
    return out;
  }
  function isMissingColumnError(err){
    const msg = String(err?.message || err?.details || '').toLowerCase();
    return msg.includes('column') || msg.includes('schema cache') || msg.includes('could not find') || msg.includes('invalid input');
  }
  function isExplicitIdentityError(err){
    const msg = String(err?.message || err?.details || '').toLowerCase();
    return msg.includes('generated always') || msg.includes('identity column') || msg.includes('cannot insert') && msg.includes('id');
  }
  function isDuplicateIdError(err){
    const msg = String(err?.message || err?.details || '').toLowerCase();
    return msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('violates unique') || msg.includes('23505');
  }
  async function nextProjectId(db, projects){
    let maxId = 0;
    (projects || []).forEach(p => { const n = Number(p?.ID); if(Number.isFinite(n)) maxId = Math.max(maxId, n); });
    try{
      const { data, error } = await db.from('PROGETTI').select('ID').order('ID', { ascending:false }).limit(1);
      if(!error && Array.isArray(data) && data[0]){
        const n = Number(data[0].ID);
        if(Number.isFinite(n)) maxId = Math.max(maxId, n);
      }
    }catch(e){ console.warn('Calcolo prossimo ID non disponibile, uso lista locale.', e); }
    return maxId + 1;
  }
  async function insertProjectSafely(db, values, projects){
    const existingIds = new Set((projects || []).map(p => String(p?.ID)).filter(Boolean));
    const attempts = insertAttempts(values).filter(p => Object.keys(p).length);

    // v2.11.14: usa il guard comune quando disponibile.
    // Il guard fa solo INSERT, controlla gli ID già presenti prima dell'inserimento,
    // assegna un ID nuovo quando possibile e blocca l'operazione se il DB restituisce un ID esistente.
    if(window.KYV_DATA_GUARD && typeof KYV_DATA_GUARD.safeInsertNewRecord === 'function'){
      let lastGuardError = null;
      for(const payload of attempts){
        try{
          return await KYV_DATA_GUARD.safeInsertNewRecord(db, 'PROGETTI', payload, {
            label: 'progetto da audio',
            primaryKey: 'ID',
            allowExplicitPrimary: true,
            retries: 40
          });
        }catch(err){
          lastGuardError = err;
          if(!isMissingColumnError(err)) throw err;
        }
      }
      throw lastGuardError || new Error('Creazione progetto non riuscita.');
    }

    let nextId = await nextProjectId(db, projects);
    let canUseExplicitId = true;
    let lastError = null;

    for(const payload of attempts){
      // Prima scelta: inserimento con nuovo ID esplicito max(ID)+1.
      // Serve nei database dove la sequenza ID non è allineata: evita ID duplicati e quindi l'apparente sovrascrittura.
      if(canUseExplicitId && projectColumns().has('ID')){
        for(let offset = 0; offset < 10; offset++){
          const row = { ID: nextId + offset, ...payload };
          try{
            const { data, error } = await db.from('PROGETTI').insert([row]).select('*').single();
            if(error) throw error;
            if(data?.ID && existingIds.has(String(data.ID))){
              throw new Error(`Il database ha restituito un ID già esistente (${data.ID}). Creazione annullata per sicurezza.`);
            }
            return data || row;
          }catch(err){
            lastError = err;
            if(isDuplicateIdError(err)){ nextId = nextId + offset + 1; continue; }
            if(isExplicitIdentityError(err)){ canUseExplicitId = false; break; }
            if(isMissingColumnError(err)) break;
            throw err;
          }
        }
      }

      // Fallback: se il DB non consente ID esplicito, usa l'identity ufficiale. È sempre INSERT, mai UPDATE/UPSERT.
      try{
        const { data, error } = await db.from('PROGETTI').insert([payload]).select('*').single();
        if(error) throw error;
        if(data?.ID && existingIds.has(String(data.ID))){
          throw new Error(`Il database ha restituito un ID già esistente (${data.ID}). Creazione annullata per sicurezza.`);
        }
        return data || payload;
      }catch(err){
        lastError = err;
        if(isMissingColumnError(err)) continue;
        throw err;
      }
    }
    throw lastError || new Error('Errore creazione progetto.');
  }

  async function fetchProjects(db){
    const { data, error } = await db.from('PROGETTI').select('*').limit(2000);
    if(error) throw error;
    return data || [];
  }

  async function archiveDropbox(db, item, project, values){
    const link=values.link||linkFromItem(item);
    if(!link) throw new Error('Link Dropbox mancante.');
    const identity=providerIdentity(item); const originNote=[identity?`Origine ID: ${identity}`:'',item?.rev?`Revisione Dropbox: ${item.rev}`:'',values.note||item?.Note||item?.note||''].filter(Boolean).join('\n');
    const payload={ID_PROGETTO:Number(project.ID),Progetto:projectLabel(project),Artista:project.ARTISTA||values.artist||artistFromItem(item)||null,Titolo:project.TITOLO||values.title||cleanTitle(rawNameFromItem(item)),Tipo_File:values.fileType||inferType(item),Versione:values.version||inferVersion(item)||null,Nome_File:fileNameFromItem(item)||null,Link_Dropbox:link,Hash_SHA256:item?.Hash_SHA256||item?.content_hash||item?.hash||null,Data_Caricamento:String(item?.Data_Caricamento||item?.date||today()).slice(0,10),Note:originNote||null};
    if(item?.ID_FILE){const {data,error}=await db.from('DROPBOX_AUDIO_FILES').update(payload).eq('ID_FILE',item.ID_FILE).select('*').single();if(error)throw error;return data;}
    const {data:found,error:findError}=await db.from('DROPBOX_AUDIO_FILES').select('*').eq('Link_Dropbox',link).limit(1);if(findError)throw findError;
    if(found&&found[0]){const {data,error}=await db.from('DROPBOX_AUDIO_FILES').update(payload).eq('ID_FILE',found[0].ID_FILE).select('*').single();if(error)throw error;return data;}
    const {data,error}=await db.from('DROPBOX_AUDIO_FILES').insert([payload]).select('*').single();if(error)throw error;return data;
  }

  async function archiveDrive(db, item, project, values){
    const link=values.link||linkFromItem(item);
    if(!link) throw new Error('Link Google Drive mancante.');
    const {data:found,error:findError}=await db.from('DOCUMENTI_PROGETTO').select('*').eq('ID_PROGETTO',project.ID).eq('Link_Drive',link).limit(1);if(findError)throw findError;
    if(found&&found[0])return found[0];
    const identity=providerIdentity(item); const note=[identity?`Origine ID: ${identity}`:'',`Tipo: ${values.fileType||inferType(item)}`,values.version?`Versione: ${values.version}`:'',values.note||''].filter(Boolean).join('\n');
    const payload={ID_PROGETTO:Number(project.ID),Tipo_Documento:'AUDIO_DRIVE',Titolo_Documento:fileNameFromItem(item)||values.title,Fonte:`Google Drive${sourceFromItem(item)?` · ${sourceFromItem(item)}`:''}`,Link_Drive:link,Data_Documento:String(item?.modifiedTime||item?.date||today()).slice(0,10),Note:note||null};
    const {data,error}=await db.from('DOCUMENTI_PROGETTO').insert([payload]).select('*').single();if(error)throw error;return data;
  }

  async function archiveVersion(db,item,project,values){
    const kind=sourceKind(item);
    if(kind==='local')throw new Error('L’archiviazione locale richiede il salvataggio atomico v2.23; non viene creato un falso link Drive.');
    return kind==='dropbox' ? archiveDropbox(db,item,project,values) : archiveDrive(db,item,project,values);
  }

  function isMissingV23Rpc(err){
    const code=String(err?.code||'').toUpperCase();
    const msg=String(err?.message||err?.details||err?.hint||'').toLowerCase();
    return code==='PGRST202' || code==='42883' ||
      (msg.includes('kyv_salva_audio_v23') && (msg.includes('schema cache') || msg.includes('not find') || msg.includes('does not exist')));
  }

  function projectPayload(values){
    return {
      title:values.title||'Nuovo brano',
      artist:values.artist||null,
      management:values.management||null,
      label:values.label||null,
      session_date:values.sessionDate||null,
      note:values.note||null
    };
  }

  function audioPayload(item,values){
    const kind=sourceKind(item);
    const provider=kind==='other'?'altro':kind;
    return {
      provider,
      provider_id:providerId(item)||null,
      provider_revision:providerRevision(item)||null,
      file_name:fileNameFromItem(item)||values.title||'File audio',
      title:values.title||cleanTitle(rawNameFromItem(item)),
      artist:values.artist||artistFromItem(item)||null,
      file_type:values.fileType||inferType(item),
      version:values.version||inferVersion(item)||null,
      status:'Archiviata',
      link:values.link||linkFromItem(item)||null,
      content_hash:contentHash(item)||null,
      source_label:sourceFromItem(item)||(provider==='drive'?'Google Drive':provider==='dropbox'?'Dropbox':'Archivio audio'),
      file_date:item?.modifiedTime||item?.updated||item?.Data_Caricamento||item?.date||null,
      note:values.note||item?.Note||item?.note||null,
      metadata:{
        source:item?.source||null,
        driveLabel:item?.driveLabel||null,
        driveEmail:item?.driveEmail||null,
        folder:item?.folder||item?.path||null,
        mimeType:item?.mimeType||item?.type||null,
        size:item?.size||item?.bytes||null
      }
    };
  }

  async function saveTransactional(db,item,values,projectId){
    if(v23RpcState==='unavailable') return null;
    const {data,error}=await db.rpc('kyv_salva_audio_v23',{
      p_project_id:projectId?Number(projectId):null,
      p_project_data:projectPayload(values),
      p_audio_data:audioPayload(item,values)
    });
    if(error){
      if(isMissingV23Rpc(error)){
        v23RpcState='unavailable';
        if(!compatibilityWarningShown){
          compatibilityWarningShown=true;
          toast('Migrazione v2.23 non installata: archivio audio in modalità compatibilità.','warning');
        }
        return null;
      }
      const failure=new Error(error.message||'Salvataggio atomico non riuscito.');
      failure.code=error.code;
      failure.details=error.details;
      throw failure;
    }
    const result=Array.isArray(data)?data[0]:data;
    if(!result?.project?.ID) throw new Error('Supabase non ha restituito il progetto salvato. Operazione da verificare.');
    v23RpcState='available';
    return result;
  }

  function attachImport(project,result,source,mode){
    project._kyvImport={
      archived:true,
      record:result?.version||result,
      source,
      duplicate:!!result?.duplicate,
      reliabilityMode:mode
    };
    return project;
  }

  async function linkToProject(item, projectId, options={}){
    if(!isAudioItem(item)) throw new Error('Il file selezionato non sembra un file audio.');
    const db=options.db||(window.KYV&&KYV.createSupabaseClient?KYV.createSupabaseClient():null); if(!db)throw new Error('Supabase non disponibile.');
    const projects=Array.isArray(options.projects)&&options.projects.length?options.projects:await fetchProjects(db);
    const project=projects.find(p=>String(p.ID)===String(projectId)); if(!project)throw new Error('Progetto non trovato.');
    const values={...buildDefaults(item),fileType:options.fileType||inferType(item),version:options.version||inferVersion(item),note:options.note||buildDefaults(item).note};
    const saved=await saveTransactional(db,item,values,project.ID);
    if(saved){
      const linked=attachImport(saved.project,saved,sourceKind(item),'atomic-v2.23');
      toast(saved.duplicate?`Versione già presente e verificata: ${projectLabel(linked)}.`:`Versione collegata: ${projectLabel(linked)}.`,'success');
      return linked;
    }
    const archived=await archiveVersion(db,item,project,values);
    attachImport(project,archived,sourceKind(item),'legacy-compatibility');
    toast(`Versione collegata in modalità compatibilità: ${projectLabel(project)}.`,'success');
    return project;
  }

  async function createFromItem(item, options={}){
    if(!isAudioItem(item)){
      const link = linkFromItem(item);
      if(link) await copyText(link);
      else toast('Questo file non sembra audio e non ha un link copiabile.', 'warning');
      return null;
    }
    const db = options.db || (window.KYV && KYV.createSupabaseClient ? KYV.createSupabaseClient() : null);
    if(!db) throw new Error('Supabase non disponibile.');
    const currentProjects = Array.isArray(options.projects) && options.projects.length ? options.projects : await fetchProjects(db);
    const existing = matchProjectForItem(item, currentProjects);
    if(existing){
      toast(`Esiste già un progetto compatibile: ${projectLabel(existing)}`, 'warning');
      return existing;
    }
    const values = await openModal(buildDefaults(item));
    if(!values || !values.title) return null;
    const existingAfterEdit = matchProjectForTitle(values.title, currentProjects);
    if(existingAfterEdit && !confirm(`Il titolo sembra già presente in: ${projectLabel(existingAfterEdit)}. Vuoi creare comunque un nuovo progetto?`)) return existingAfterEdit;

    const created = await insertProjectSafely(db, values, currentProjects);
    toast(`Nuovo progetto creato${created?.ID ? ` con ID ${created.ID}` : ''}.`, 'success');
    return created;
  }

  function buttonHtml(item, projects, createCall, copyCall){
    const link = linkFromItem(item);
    if(!isAudioItem(item)){
      return link && copyCall ? `<button onclick="${copyCall}" class="px-3 py-2 rounded-lg bg-kyv-card border border-kyv-border text-xs font-bold text-kyv-text hover:text-white"><i data-lucide="copy" class="w-3.5 h-3.5 inline mr-1"></i>Copia link</button>` : '';
    }
    const match = matchProjectForItem(item, projects || []);
    if(match){
      return `<span class="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs font-bold" title="${esc(projectLabel(match))}"><i data-lucide="check-circle" class="w-3.5 h-3.5 inline mr-1"></i>Già in progetti</span>`;
    }
    return `<button onclick="${createCall}" class="px-3 py-2 rounded-lg bg-violet-600/15 border border-violet-500/30 text-violet-100 text-xs font-black hover:bg-violet-600/25"><i data-lucide="folder-plus" class="w-3.5 h-3.5 inline mr-1"></i>Nuovo progetto</button>`;
  }

  async function workflowFromItem(item, options={}){
    if(!isAudioItem(item)){
      const link=linkFromItem(item); if(link) await copyText(link); else toast('Questo file non sembra audio e non ha un link copiabile.','warning'); return null;
    }
    const db=options.db||(window.KYV&&KYV.createSupabaseClient?KYV.createSupabaseClient():null); if(!db)throw new Error('Supabase non disponibile.');
    const currentProjects=Array.isArray(options.projects)&&options.projects.length?options.projects:await fetchProjects(db);
    const suggested=matchProjectForItem(item,currentProjects);
    const values=await openWorkflowModal(buildDefaults(item),currentProjects,suggested); if(!values)return null;
    let project=values.projectId?currentProjects.find(p=>String(p.ID)===String(values.projectId)):null;
    if(!project){
      if(!values.title)return null;
      const similar=matchProjectForTitle(values.title,currentProjects);
      if(similar&&!confirm(`Il titolo sembra già presente in: ${projectLabel(similar)}. Vuoi creare comunque un nuovo progetto?`))project=similar;
    }

    const actionLabel=project?'collegare questa versione al progetto #'+project.ID:
      'creare un nuovo progetto per «'+values.title+'» e collegare questa versione';
    if(!confirm('Confermi di voler '+actionLabel+'? Hai verificato che il file sia una tua produzione.'))return null;
    const saved=await saveTransactional(db,item,values,project?.ID||null);
    if(saved){
      const linked=attachImport(saved.project,saved,sourceKind(item),'atomic-v2.23');
      const action=saved.duplicate?'Versione già presente e verificata':saved.createdProject?'Progetto creato e versione collegata':'Versione collegata';
      toast(`${action}: ${projectLabel(linked)}.`,'success');
      return linked;
    }

    // Senza la funzione v2.23 non creiamo prima il progetto e poi la versione:
    // quel vecchio ordine poteva lasciare schede orfane quando il secondo INSERT falliva.
    if(!project){
      throw new Error('Per creare insieme progetto e versione audio devi prima eseguire SUPABASE_MIGRATION_V2_23_AUDIO_VERSIONI.sql. Nessun dato è stato inserito.');
    }
    const archived=await archiveVersion(db,item,project,values);
    attachImport(project,archived,sourceKind(item),'legacy-compatibility');
    toast(`Versione collegata in modalità compatibilità: ${projectLabel(project)}.`,'success');
    return project;
  }

  function workflowButtonHtml(item,projects,createCall,copyCall){
    const link=linkFromItem(item);
    if(!isAudioItem(item))return link&&copyCall?`<button onclick="${copyCall}" class="px-3 py-2 rounded-lg bg-kyv-card border border-kyv-border text-xs font-bold text-kyv-text hover:text-white"><i data-lucide="copy" class="w-3.5 h-3.5 inline mr-1"></i>Copia link</button>`:'';
    const match=matchProjectForItem(item,projects||[]);
    if(match)return `<button onclick="${createCall}" class="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs font-black hover:bg-emerald-500/20" title="Collega a ${esc(projectLabel(match))}"><i data-lucide="git-branch-plus" class="w-3.5 h-3.5 inline mr-1"></i>Collega versione</button>`;
    return `<button onclick="${createCall}" class="px-3 py-2 rounded-lg bg-violet-600/15 border border-violet-500/30 text-violet-100 text-xs font-black hover:bg-violet-600/25"><i data-lucide="folder-plus" class="w-3.5 h-3.5 inline mr-1"></i>Avvia da file</button>`;
  }

  window.KYV_AUDIO_PROJECT = {
    isAudioItem, cleanTitle, linkFromItem, rawNameFromItem, inferType, inferVersion, sourceKind, providerIdentity, providerId, providerRevision,
    matchProjectForTitle, matchProjectForItem, hasProjectForItem,
    createFromItem:workflowFromItem, linkToProject, buttonHtml:workflowButtonHtml, copyText, fetchProjects, projectLabel
  };
})();
