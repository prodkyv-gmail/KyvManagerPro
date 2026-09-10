// kyv-project-hub-v227.js - Scheda Progetto evoluta v2.27
(function () {
    'use strict';

    const PAGE = 'scheda_progetto.html';
    const POLL_MS = 700;
    let client = null;
    let activeProjectId = null;
    let pollHandle = null;
    let busy = false;

    const esc = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const has = (value) => value !== null && value !== undefined && String(value).trim() !== '';
    const num = (value) => (window.KYV && KYV.parseNumber ? KYV.parseNumber(value) : Number.parseFloat(String(value || '0').replace(',', '.')) || 0);
    const euro = (value) => (window.KYV && KYV.formatEuro ? KYV.formatEuro(value) : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num(value)));
    const dateText = (value, fallback = '—') => {
        if (!has(value)) return fallback;
        if (window.KYV && KYV.formatDate) return KYV.formatDate(value, fallback);
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? String(value) : new Intl.DateTimeFormat('it-IT').format(d);
    };

    function currentPage() {
        return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    }

    function projectIdFromUrl() {
        return new URLSearchParams(location.search).get('id');
    }

    function getClient() {
        if (client) return client;
        if (window.KYV && typeof KYV.createSupabaseClient === 'function') {
            client = KYV.createSupabaseClient();
            return client;
        }
        throw new Error('Client Supabase KYV non disponibile.');
    }

    function injectStyles() {
        if (document.getElementById('kyv-v227-styles')) return;
        const style = document.createElement('style');
        style.id = 'kyv-v227-styles';
        style.textContent = `
            #kyv-v227-hub{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:1rem}
            #kyv-v227-hub .v227-card{background:rgba(21,25,35,.94);border:1px solid #232838;border-radius:1rem;padding:1.15rem;box-shadow:0 16px 48px rgba(0,0,0,.14)}
            #kyv-v227-hub .v227-soft{background:rgba(15,17,26,.75);border:1px solid rgba(35,40,56,.92);border-radius:.85rem;padding:.85rem}
            #kyv-v227-hub .v227-label{font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;font-weight:900}
            #kyv-v227-hub .v227-value{font-weight:900;color:white;margin-top:.2rem;line-height:1.2}
            #kyv-v227-hub .v227-chip{display:inline-flex;align-items:center;border:1px solid rgba(148,163,184,.16);background:rgba(148,163,184,.08);border-radius:999px;padding:.28rem .58rem;font-size:.68rem;font-weight:900;color:#cbd5e1}
            #kyv-v227-hub .v227-action{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;padding:.62rem .78rem;border-radius:.75rem;border:1px solid rgba(99,102,241,.24);background:rgba(99,102,241,.11);font-size:.72rem;font-weight:900;color:#e0e7ff;transition:.15s ease}
            #kyv-v227-hub .v227-action:hover{background:rgba(99,102,241,.2)}
            #kyv-v227-hub .v227-action.secondary{border-color:rgba(148,163,184,.15);background:rgba(148,163,184,.07);color:#e2e8f0}
            #kyv-v227-hub .v227-action.warn{border-color:rgba(245,158,11,.24);background:rgba(245,158,11,.09);color:#fde68a}
            #kyv-v227-hub .v227-timeline{position:relative;margin-left:.4rem;padding-left:1.15rem;border-left:1px solid rgba(148,163,184,.18)}
            #kyv-v227-hub .v227-event{position:relative;padding:0 0 .9rem .2rem}
            #kyv-v227-hub .v227-event:before{content:'';position:absolute;left:-1.48rem;top:.28rem;width:.55rem;height:.55rem;border-radius:999px;background:#818cf8;box-shadow:0 0 0 3px #151923}
            #kyv-v227-hub .v227-event.future:before{background:#f59e0b}
            #kyv-v227-hub .v227-event.done:before{background:#34d399}
            #kyv-v227-followup-editor input,#kyv-v227-followup-editor select,#kyv-v227-followup-editor textarea{width:100%;background:#0f111a;border:1px solid #232838;color:white;border-radius:.7rem;padding:.65rem .75rem;outline:none}
            #kyv-v227-followup-editor textarea{min-height:84px;resize:vertical}
            @media(max-width:1100px){#kyv-v227-hub{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function ensureMount() {
        if (document.getElementById('kyv-v227-hub')) return document.getElementById('kyv-v227-hub');
        const hero = document.querySelector('#project-view > section');
        if (!hero) return null;
        const wrap = document.createElement('section');
        wrap.id = 'kyv-v227-hub';
        wrap.className = 'hidden';
        hero.insertAdjacentElement('afterend', wrap);
        return wrap;
    }

    async function safeRows(table, column, value, orderColumn) {
        try {
            let q = getClient().from(table).select('*').eq(column, value);
            if (orderColumn) q = q.order(orderColumn, { ascending: true });
            const { data, error } = await q;
            if (error) throw error;
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn(`[KYV v2.27] ${table}:`, error.message || error);
            return [];
        }
    }

    async function loadProjectBundle(id) {
        const sb = getClient();
        const { data: project, error } = await sb.from('PROGETTI').select('*').eq('ID', id).maybeSingle();
        if (error) throw error;
        if (!project) throw new Error('Progetto non trovato.');

        const [fatture, spese, documenti, audio, invii] = await Promise.all([
            safeRows('FATTURE', 'ID_PROGETTO', id, 'Data'),
            safeRows('Spese Extra', 'ID_PROGETTO', id, 'Data'),
            safeRows('DOCUMENTI_PROGETTO', 'ID_PROGETTO', id, 'Data_Documento'),
            safeRows('DROPBOX_AUDIO_FILES', 'ID_PROGETTO', id, 'Data_Caricamento'),
            safeRows('INVII_AUDIO', 'ID_PROGETTO', id, 'Data_Invio')
        ]);

        return { project, fatture, spese, documenti, audio, invii };
    }

    function dayDelta(value) {
        if (!has(value)) return null;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        const a = new Date(); a.setHours(0, 0, 0, 0);
        const b = new Date(d); b.setHours(0, 0, 0, 0);
        return Math.round((b - a) / 86400000);
    }

    function paymentIsPaid(row) {
        if (window.KYV && KYV.isPaid) return KYV.isPaid(row.PAGATA) || KYV.isPaid(row.PAGAMENTO);
        const text = String(row.PAGATA || row.PAGAMENTO || '').toLowerCase();
        return ['si', 'sì', 'pagata', 'pagato', 'paid', 'true', '1'].includes(text);
    }

    function nextAction(bundle) {
        const p = bundle.project;
        const delta = dayDelta(p.Prossimo_Followup);
        if (delta !== null) {
            if (delta < 0) return { title: 'Follow-up scaduto', detail: `${Math.abs(delta)} giorni di ritardo · ${p.Note_Followup || p.Esito_Ascolto || 'contatta il referente'}`, tone: 'rose', icon: 'alarm-clock' };
            if (delta === 0) return { title: 'Follow-up oggi', detail: p.Note_Followup || p.Esito_Ascolto || 'Contatta il referente e aggiorna l’esito.', tone: 'amber', icon: 'phone-call' };
            if (delta <= 7) return { title: `Follow-up tra ${delta} giorni`, detail: p.Note_Followup || p.Esito_Ascolto || 'Prepara il prossimo contatto.', tone: 'amber', icon: 'calendar-clock' };
        }
        if (!has(p.Data_Sessione)) return { title: 'Definisci il prossimo step creativo', detail: 'Manca una data sessione: pianifica sessione o obiettivo operativo.', tone: 'indigo', icon: 'calendar-plus' };
        if (!has(p['Contratto link']) && (has(p.FEE) || has(p.ROY))) return { title: 'Completa accordi / contratto', detail: 'Sono presenti condizioni economiche ma non un link contratto.', tone: 'amber', icon: 'file-signature' };
        if (!has(p.Data_Consegna_Master)) return { title: 'Porta il progetto verso il master', detail: 'La consegna master non risulta ancora registrata.', tone: 'cyan', icon: 'send' };
        if (!bundle.fatture.length && has(p.FEE)) return { title: 'Verifica fatturazione', detail: 'Il progetto ha una fee ma non risultano fatture collegate.', tone: 'emerald', icon: 'receipt' };
        const unpaid = bundle.fatture.filter((f) => !paymentIsPaid(f));
        if (unpaid.length) return { title: 'Incasso da verificare', detail: `${unpaid.length} fattur${unpaid.length === 1 ? 'a' : 'e'} non risultano pagate.`, tone: 'amber', icon: 'wallet-cards' };
        if (has(p.Data_Pubblicazione) && !has(p.Codice_ISRC)) return { title: 'Completa dati release', detail: 'La pubblicazione è presente ma manca il codice ISRC.', tone: 'violet', icon: 'barcode' };
        if (delta !== null) return { title: `Prossimo follow-up: ${dateText(p.Prossimo_Followup)}`, detail: p.Note_Followup || 'Nessuna nota operativa.', tone: 'indigo', icon: 'calendar-check' };
        return { title: 'Nessuna urgenza bloccante', detail: 'Il progetto è allineato. Imposta un follow-up per non perderne il controllo.', tone: 'emerald', icon: 'circle-check-big' };
    }

    function buildTimeline(bundle) {
        const p = bundle.project;
        const events = [];
        const add = (date, label, detail, kind = 'done') => {
            if (!has(date)) return;
            const delta = dayDelta(date);
            events.push({ date, label, detail, kind: delta !== null && delta > 0 ? 'future' : kind, sort: new Date(date).getTime() || 0 });
        };
        add(p.Data_Sessione, 'Sessione', p.ARTISTA || p.TITOLO || 'Sessione progetto');
        add(p['Data Contratto'], 'Contratto', p.Label || p.MANAGEMENT || 'Accordo progetto');
        add(p.Data_Consegna_Master, 'Consegna master', p.STATO || 'Master');
        add(p.Prossimo_Followup, 'Follow-up', p.Note_Followup || p.Esito_Ascolto || p.Priorita_Followup || 'Follow-up progetto', 'future');
        add(p.Data_Pubblicazione, 'Pubblicazione', p.Codice_ISRC || p.Label || 'Release');
        bundle.fatture.forEach((f) => add(f.Data, `Fattura ${f.Numero || f.ID_FT || ''}`.trim(), paymentIsPaid(f) ? 'Pagata' : 'Da incassare'));
        bundle.documenti.forEach((d) => add(d.Data_Documento || d.created_at, d.Tipo_Documento || 'Documento', d.Titolo_Documento || d.Fonte || 'Documento progetto'));
        bundle.audio.forEach((a) => add(a.Data_Caricamento || a.created_at, 'Audio', a.Nome_File || a.Titolo || a.Tipo_File || 'Versione audio'));
        bundle.invii.forEach((i) => add(i.Data_Invio, 'Invio', [i.Destinatario, i.Stato].filter(Boolean).join(' · ') || 'Invio audio'));
        return events.sort((a, b) => a.sort - b.sort).slice(-14);
    }

    function quickHref(page, id, extra = '') {
        const join = page.includes('?') ? '&' : '?';
        return `${page}${join}project=${encodeURIComponent(id)}${extra}`;
    }

    function render(bundle) {
        const mount = ensureMount();
        if (!mount) return;
        const p = bundle.project;
        const action = nextAction(bundle);
        const timeline = buildTimeline(bundle);
        const invoiced = bundle.fatture.reduce((sum, f) => sum + num(f.ImportoTotaleDocumento || f.ImportoPagamento || f.PrezzoTotale || f.PrezzoUnitario), 0);
        const paid = bundle.fatture.filter(paymentIsPaid).reduce((sum, f) => sum + num(f.ImportoTotaleDocumento || f.ImportoPagamento || f.PrezzoTotale || f.PrezzoUnitario), 0);
        const costs = bundle.spese.reduce((sum, s) => sum + Math.abs(num(s.Importo)), 0);
        const outstanding = Math.max(0, invoiced - paid);
        const delta = dayDelta(p.Prossimo_Followup);
        const followupStatus = delta === null ? 'Non pianificato' : delta < 0 ? `${Math.abs(delta)}g in ritardo` : delta === 0 ? 'Oggi' : `Tra ${delta}g`;

        mount.innerHTML = `
            <div class="v227-card">
                <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div>
                        <p class="v227-label">Prossima azione</p>
                        <h3 class="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2"><i data-lucide="${esc(action.icon)}" class="w-5 h-5 text-${esc(action.tone)}-300"></i>${esc(action.title)}</h3>
                        <p class="text-sm text-kyv-text mt-2 max-w-3xl leading-relaxed">${esc(action.detail)}</p>
                    </div>
                    <span class="v227-chip">Priorità: ${esc(p.Priorita_Followup || 'non indicata')}</span>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    <div class="v227-soft"><p class="v227-label">Follow-up</p><p class="v227-value">${esc(followupStatus)}</p><p class="text-[11px] text-kyv-text mt-1">${esc(dateText(p.Prossimo_Followup, 'Nessuna data'))}</p></div>
                    <div class="v227-soft"><p class="v227-label">Fatturato</p><p class="v227-value">${esc(euro(invoiced))}</p><p class="text-[11px] text-kyv-text mt-1">${bundle.fatture.length} fatture</p></div>
                    <div class="v227-soft"><p class="v227-label">Da incassare</p><p class="v227-value ${outstanding > 0 ? 'text-amber-200' : 'text-emerald-200'}">${esc(euro(outstanding))}</p><p class="text-[11px] text-kyv-text mt-1">Incassato ${esc(euro(paid))}</p></div>
                    <div class="v227-soft"><p class="v227-label">Spese collegate</p><p class="v227-value">${esc(euro(costs))}</p><p class="text-[11px] text-kyv-text mt-1">${bundle.spese.length} movimenti</p></div>
                </div>

                <div class="flex flex-wrap gap-2 mt-4">
                    <button id="kyv-v227-edit-followup" class="v227-action"><i data-lucide="calendar-clock" class="w-4 h-4"></i>Pianifica follow-up</button>
                    <button id="kyv-v227-open-edit" class="v227-action secondary"><i data-lucide="pencil" class="w-4 h-4"></i>Modifica progetto</button>
                    <a class="v227-action secondary" href="${esc(quickHref('ascolto.html', p.ID))}"><i data-lucide="headphones" class="w-4 h-4"></i>Ascolto</a>
                    <a class="v227-action secondary" href="${esc(quickHref('kyv_dropbox.html', p.ID))}"><i data-lucide="audio-lines" class="w-4 h-4"></i>Audio</a>
                    <a class="v227-action secondary" href="${esc(quickHref('documenti.html?tab=documenti', p.ID))}"><i data-lucide="folder-lock" class="w-4 h-4"></i>Documento</a>
                    <a class="v227-action secondary" href="${esc(quickHref('documenti.html?tab=spese', p.ID))}"><i data-lucide="receipt-euro" class="w-4 h-4"></i>Spesa</a>
                    <a class="v227-action secondary" href="${esc(quickHref('fatture.html', p.ID))}"><i data-lucide="receipt" class="w-4 h-4"></i>Fatture</a>
                </div>

                <div id="kyv-v227-followup-editor" class="hidden mt-4 v227-soft">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label><span class="v227-label block mb-1">Prossimo follow-up</span><input id="v227-followup-date" type="date" value="${has(p.Prossimo_Followup) ? esc(String(p.Prossimo_Followup).slice(0, 10)) : ''}"></label>
                        <label><span class="v227-label block mb-1">Priorità</span><select id="v227-followup-priority"><option value="">—</option>${['Alta','Media','Bassa'].map(x => `<option ${String(p.Priorita_Followup || '').toLowerCase() === x.toLowerCase() ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
                        <label><span class="v227-label block mb-1">Esito ascolto</span><input id="v227-followup-outcome" value="${esc(p.Esito_Ascolto || '')}" placeholder="es. interessato, da risentire..."></label>
                    </div>
                    <label class="block mt-3"><span class="v227-label block mb-1">Nota operativa</span><textarea id="v227-followup-note" placeholder="Cosa devo fare al prossimo contatto?">${esc(p.Note_Followup || '')}</textarea></label>
                    <label class="flex items-center gap-2 mt-3 text-xs text-slate-300"><input id="v227-followup-last-contact" type="checkbox" class="w-auto"> Registra oggi come ultimo sollecito</label>
                    <div class="flex gap-2 mt-3"><button id="v227-followup-save" class="v227-action"><i data-lucide="save" class="w-4 h-4"></i>Salva follow-up</button><button id="v227-followup-cancel" class="v227-action secondary">Annulla</button></div>
                </div>
            </div>

            <div class="v227-card">
                <div class="flex items-center justify-between gap-3">
                    <div><p class="v227-label">Timeline unica</p><h3 class="text-lg font-black text-white mt-1">Viaggio del progetto</h3></div>
                    <span class="v227-chip">${timeline.length} eventi</span>
                </div>
                <div class="v227-timeline mt-4">
                    ${timeline.length ? timeline.map((e) => `<div class="v227-event ${esc(e.kind)}"><p class="text-xs font-black text-white">${esc(e.label)}</p><p class="text-[11px] text-kyv-text mt-0.5">${esc(dateText(e.date))} · ${esc(e.detail)}</p></div>`).join('') : '<p class="text-xs text-kyv-text">Nessun evento datato ancora disponibile.</p>'}
                </div>
                <div class="grid grid-cols-3 gap-2 mt-2">
                    <div class="v227-soft text-center"><p class="v227-label">Audio</p><p class="v227-value">${bundle.audio.length}</p></div>
                    <div class="v227-soft text-center"><p class="v227-label">Invii</p><p class="v227-value">${bundle.invii.length}</p></div>
                    <div class="v227-soft text-center"><p class="v227-label">Documenti</p><p class="v227-value">${bundle.documenti.length}</p></div>
                </div>
            </div>`;

        mount.classList.remove('hidden');
        bindActions(bundle);
        if (window.lucide) lucide.createIcons({ root: mount });
    }

    function bindActions(bundle) {
        const editor = document.getElementById('kyv-v227-followup-editor');
        document.getElementById('kyv-v227-edit-followup')?.addEventListener('click', () => editor?.classList.toggle('hidden'));
        document.getElementById('v227-followup-cancel')?.addEventListener('click', () => editor?.classList.add('hidden'));
        document.getElementById('kyv-v227-open-edit')?.addEventListener('click', () => {
            if (typeof window.openQuickEdit === 'function') window.openQuickEdit();
        });
        document.getElementById('v227-followup-save')?.addEventListener('click', () => saveFollowup(bundle.project.ID));
    }

    async function saveFollowup(id) {
        const button = document.getElementById('v227-followup-save');
        const date = document.getElementById('v227-followup-date')?.value || null;
        const priority = document.getElementById('v227-followup-priority')?.value || null;
        const outcome = document.getElementById('v227-followup-outcome')?.value?.trim() || null;
        const note = document.getElementById('v227-followup-note')?.value?.trim() || null;
        const markContact = document.getElementById('v227-followup-last-contact')?.checked;
        const payload = {
            Prossimo_Followup: date,
            Priorita_Followup: priority,
            Esito_Ascolto: outcome,
            Note_Followup: note
        };
        if (markContact) payload.Ultimo_Sollecito = new Date().toISOString().slice(0, 10);
        try {
            if (button) { button.disabled = true; button.textContent = 'Salvataggio…'; }
            const { error } = await getClient().from('PROGETTI').update(payload).eq('ID', id);
            if (error) throw error;
            if (window.KYV && KYV.showToast) KYV.showToast('Follow-up aggiornato.', 'success');
            await refresh(id);
        } catch (error) {
            console.error('[KYV v2.27] salvataggio follow-up', error);
            if (window.KYV && KYV.showToast) KYV.showToast(`Follow-up non salvato: ${error.message || error}`, 'error');
        } finally {
            if (button) { button.disabled = false; button.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i>Salva follow-up'; }
            if (window.lucide) lucide.createIcons();
        }
    }

    async function refresh(id) {
        if (!id || busy) return;
        busy = true;
        const mount = ensureMount();
        try {
            if (mount) {
                mount.classList.remove('hidden');
                mount.innerHTML = '<div class="v227-card text-kyv-text text-xs">Aggiornamento Centro progetto…</div>';
            }
            const bundle = await loadProjectBundle(id);
            render(bundle);
        } catch (error) {
            console.error('[KYV v2.27]', error);
            if (mount) mount.innerHTML = `<div class="v227-card"><p class="text-rose-200 text-sm font-bold">Centro progetto non disponibile.</p><p class="text-xs text-kyv-text mt-1">${esc(error.message || error)}</p></div>`;
        } finally {
            busy = false;
        }
    }

    function watchProject() {
        const id = projectIdFromUrl();
        if (id && id !== activeProjectId) {
            activeProjectId = id;
            refresh(id);
        }
        if (!id) {
            activeProjectId = null;
            document.getElementById('kyv-v227-hub')?.classList.add('hidden');
        }
    }

    function init() {
        if (currentPage() !== PAGE) return;
        injectStyles();
        ensureMount();
        watchProject();
        pollHandle = window.setInterval(watchProject, POLL_MS);
        window.addEventListener('beforeunload', () => pollHandle && clearInterval(pollHandle), { once: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
