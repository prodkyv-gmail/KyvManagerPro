// kyv-pipeline-v228.js - Pipeline & Opportunità v2.28
(function () {
    'use strict';

    const STAGES = [
        { key: 'idea', label: 'Idea', icon: 'lightbulb', hint: 'Bozze e demo ancora da attivare' },
        { key: 'sessione', label: 'Sessione', icon: 'mic-2', hint: 'Brani con sessione avviata' },
        { key: 'inviato', label: 'Inviato', icon: 'send', hint: 'Pitch e proposte inviate' },
        { key: 'ascolto', label: 'In ascolto', icon: 'headphones', hint: 'Follow-up e feedback aperti' },
        { key: 'interessamento', label: 'Interessamento', icon: 'sparkles', hint: 'Provini, interesse e opzioni' },
        { key: 'contratto', label: 'Contratto', icon: 'file-signature', hint: 'Accordi e contratti presenti' },
        { key: 'produzione', label: 'Produzione', icon: 'sliders-horizontal', hint: 'Lavori attivi / WIP' },
        { key: 'master', label: 'Master', icon: 'audio-waveform', hint: 'Master consegnato o in chiusura' },
        { key: 'uscito', label: 'Uscito', icon: 'rocket', hint: 'Pubblicazioni concluse' }
    ];

    const state = {
        rows: [],
        filtered: [],
        stageFilter: 'all',
        search: '',
        artist: '',
        partner: '',
        priority: 'all'
    };

    const H = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
    const N = (value) => String(value ?? '').trim().toLowerCase();
    const has = (value) => value !== null && value !== undefined && String(value).trim() !== '';

    function localDate(value) {
        if (!has(value)) return null;
        const raw = String(value).slice(0, 10);
        const d = new Date(`${raw}T12:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function dayDelta(value) {
        const d = localDate(value);
        if (!d) return null;
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        return Math.round((d.getTime() - today.getTime()) / 86400000);
    }

    function formatDate(value) {
        if (!has(value)) return '—';
        if (window.KYV && typeof KYV.formatDate === 'function') return KYV.formatDate(value, '—');
        const d = localDate(value);
        return d ? new Intl.DateTimeFormat('it-IT').format(d) : String(value);
    }

    function stageFor(row) {
        const stato = N(row.STATO);
        const sviluppo = N(row.SVILUPPO);
        const combined = `${stato} ${sviluppo}`;

        if (has(row.Data_Pubblicazione) || /\b(uscita|uscito|pubblicat|release)\b/.test(combined)) return 'uscito';
        if (has(row.Data_Consegna_Master) || /\bmaster\b/.test(combined)) return 'master';
        if (sviluppo === 'wip' || /in produzione|produzione|recording|mix|finalizz/.test(combined)) return 'produzione';
        if (has(row['Data Contratto']) || has(row['Contratto link']) || /contratto|firmat|accordo chiuso/.test(combined)) return 'contratto';
        if (/provinat|interess|opzion|selezionat|scelt|tenut|presa da|in forse/.test(combined)) return 'interessamento';
        if (has(row.Prossimo_Followup) || has(row.Esito_Ascolto) || /ascolt|feedback|riscontro|attesa risposta/.test(combined)) return 'ascolto';
        if (/mandat|inviat|propost|pitch|presentat/.test(combined)) return 'inviato';
        if (has(row.Data_Sessione) || /sessione|session|acustica/.test(combined)) return 'sessione';
        return 'idea';
    }

    function priorityRank(row) {
        const priority = N(row.Priorita_Followup);
        const delta = dayDelta(row.Prossimo_Followup);
        if (delta !== null && delta < 0) return 0;
        if (priority.includes('alta') || priority.includes('urgent')) return 1;
        if (delta === 0) return 2;
        if (priority.includes('media')) return 3;
        if (delta !== null && delta <= 7) return 4;
        if (priority.includes('bassa')) return 6;
        return 5;
    }

    function urgency(row) {
        const delta = dayDelta(row.Prossimo_Followup);
        const p = N(row.Priorita_Followup);
        if (delta !== null && delta < 0) return { label: `${Math.abs(delta)}g in ritardo`, cls: 'border-rose-500/30 bg-rose-500/10 text-rose-200' };
        if (delta === 0) return { label: 'Follow-up oggi', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-200' };
        if (p.includes('alta') || p.includes('urgent')) return { label: 'Priorità alta', cls: 'border-orange-500/30 bg-orange-500/10 text-orange-200' };
        if (delta !== null && delta <= 7) return { label: `Follow-up tra ${delta}g`, cls: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' };
        if (p.includes('media')) return { label: 'Priorità media', cls: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200' };
        if (p.includes('bassa')) return { label: 'Priorità bassa', cls: 'border-slate-500/30 bg-slate-500/10 text-slate-300' };
        return null;
    }

    function optionValues(rows, selector) {
        return [...new Set(rows.map(selector).filter(has).map(v => String(v).trim()))]
            .sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
    }

    function fillFilters() {
        const artists = optionValues(state.rows, r => r.ARTISTA);
        const partners = optionValues(state.rows, r => r.Label || r.MANAGEMENT);
        const artist = document.getElementById('pipeline-artist');
        const partner = document.getElementById('pipeline-partner');
        if (artist) artist.innerHTML = '<option value="">Tutti gli artisti</option>' + artists.map(v => `<option value="${H(v)}">${H(v)}</option>`).join('');
        if (partner) partner.innerHTML = '<option value="">Label / management</option>' + partners.map(v => `<option value="${H(v)}">${H(v)}</option>`).join('');
    }

    function passesPriority(row) {
        const mode = state.priority;
        if (mode === 'all') return true;
        const p = N(row.Priorita_Followup);
        const delta = dayDelta(row.Prossimo_Followup);
        if (mode === 'alta') return p.includes('alta') || p.includes('urgent');
        if (mode === 'media') return p.includes('media');
        if (mode === 'bassa') return p.includes('bassa');
        if (mode === 'scaduti') return delta !== null && delta < 0;
        if (mode === 'oggi') return delta === 0;
        if (mode === '7g') return delta !== null && delta >= 0 && delta <= 7;
        if (mode === 'followup') return has(row.Prossimo_Followup) || has(row.Esito_Ascolto) || has(row.Note_Followup);
        return true;
    }

    function applyFilters() {
        const q = N(state.search);
        state.filtered = state.rows.filter(row => {
            const stage = stageFor(row);
            if (state.stageFilter !== 'all' && stage !== state.stageFilter) return false;
            if (state.artist && String(row.ARTISTA || '') !== state.artist) return false;
            if (state.partner && String(row.Label || row.MANAGEMENT || '') !== state.partner) return false;
            if (!passesPriority(row)) return false;
            if (q) {
                const haystack = N([row.TITOLO, row.ARTISTA, row.AUTORI, row.STATO, row.SVILUPPO, row.Label, row.MANAGEMENT, row.Esito_Ascolto, row.Note_Followup].join(' '));
                if (!haystack.includes(q)) return false;
            }
            return true;
        }).sort((a, b) => priorityRank(a) - priorityRank(b) || (dayDelta(a.Prossimo_Followup) ?? 9999) - (dayDelta(b.Prossimo_Followup) ?? 9999) || Number(b.ID || 0) - Number(a.ID || 0));
        render();
    }

    function card(row) {
        const urgent = urgency(row);
        const partner = row.Label || row.MANAGEMENT || '';
        const status = [row.STATO, row.SVILUPPO].filter(has).join(' · ');
        const follow = has(row.Prossimo_Followup) ? `Follow-up ${formatDate(row.Prossimo_Followup)}` : '';
        const listening = has(row.Esito_Ascolto) ? row.Esito_Ascolto : '';
        return `<article class="pipeline-card" data-project-id="${H(row.ID)}">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <h4 class="font-black text-white text-sm leading-tight break-words">${H(row.TITOLO || 'Senza titolo')}</h4>
                    <p class="text-xs font-bold text-cyan-200 mt-1 break-words">${H(row.ARTISTA || 'Artista non indicato')}</p>
                </div>
                <span class="kyv-chip shrink-0">#${H(row.ID)}</span>
            </div>
            ${status ? `<p class="text-[11px] text-slate-400 mt-3 line-clamp-2">${H(status)}</p>` : ''}
            <div class="flex flex-wrap gap-1.5 mt-3">
                ${urgent ? `<span class="pipeline-pill ${urgent.cls}">${H(urgent.label)}</span>` : ''}
                ${partner ? `<span class="pipeline-pill border-slate-500/20 bg-slate-500/10 text-slate-300">${H(partner)}</span>` : ''}
            </div>
            ${(follow || listening) ? `<div class="mt-3 p-2.5 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-[11px] leading-relaxed"><p class="text-indigo-100 font-bold">${H(follow || 'Ascolto aperto')}</p>${listening ? `<p class="text-slate-400 mt-1">${H(listening)}</p>` : ''}</div>` : ''}
            <div class="mt-3 flex items-center gap-2">
                <a href="scheda_progetto.html?id=${encodeURIComponent(row.ID)}" class="pipeline-open"><i data-lucide="external-link" class="w-3.5 h-3.5"></i>Apri scheda</a>
            </div>
        </article>`;
    }

    function renderSummary() {
        const total = state.filtered.length;
        const overdue = state.filtered.filter(r => { const d = dayDelta(r.Prossimo_Followup); return d !== null && d < 0; }).length;
        const week = state.filtered.filter(r => { const d = dayDelta(r.Prossimo_Followup); return d !== null && d >= 0 && d <= 7; }).length;
        const active = state.filtered.filter(r => stageFor(r) !== 'uscito').length;
        const el = document.getElementById('pipeline-summary');
        if (!el) return;
        el.innerHTML = [
            ['Progetti visibili', total, 'layers-3'],
            ['Attivi', active, 'activity'],
            ['Follow-up 7 giorni', week, 'calendar-clock'],
            ['Scaduti', overdue, 'triangle-alert']
        ].map(([label, value, icon]) => `<div class="pipeline-metric"><i data-lucide="${icon}" class="w-4 h-4 text-indigo-300"></i><div><strong>${value}</strong><span>${label}</span></div></div>`).join('');
    }

    function renderStageTabs() {
        const el = document.getElementById('pipeline-stage-tabs');
        if (!el) return;
        const counts = Object.fromEntries(STAGES.map(s => [s.key, state.filtered.filter(r => stageFor(r) === s.key).length]));
        el.innerHTML = `<button class="pipeline-stage-filter ${state.stageFilter === 'all' ? 'active' : ''}" data-stage="all">Tutte <span>${state.filtered.length}</span></button>` + STAGES.map(s => `<button class="pipeline-stage-filter ${state.stageFilter === s.key ? 'active' : ''}" data-stage="${s.key}">${H(s.label)} <span>${counts[s.key] || 0}</span></button>`).join('');
        el.querySelectorAll('[data-stage]').forEach(btn => btn.addEventListener('click', () => {
            state.stageFilter = btn.dataset.stage;
            applyFilters();
        }));
    }

    function renderBoard() {
        const board = document.getElementById('pipeline-board');
        if (!board) return;
        const rowsForBoard = state.stageFilter === 'all' ? state.filtered : state.filtered.filter(r => stageFor(r) === state.stageFilter);
        const stages = state.stageFilter === 'all' ? STAGES : STAGES.filter(s => s.key === state.stageFilter);
        board.innerHTML = stages.map(stage => {
            const rows = rowsForBoard.filter(r => stageFor(r) === stage.key);
            return `<section class="pipeline-column" data-stage="${stage.key}">
                <header class="pipeline-column-head">
                    <div><h3><i data-lucide="${stage.icon}" class="w-4 h-4"></i>${H(stage.label)}</h3><p>${H(stage.hint)}</p></div>
                    <span>${rows.length}</span>
                </header>
                <div class="pipeline-column-body">${rows.length ? rows.map(card).join('') : '<div class="pipeline-empty">Nessun progetto in questa fase.</div>'}</div>
            </section>`;
        }).join('');
    }

    function render() {
        renderSummary();
        renderStageTabs();
        renderBoard();
        const count = document.getElementById('pipeline-count');
        if (count) count.textContent = `${state.filtered.length} progetti`;
        if (window.lucide) lucide.createIcons();
    }

    async function load() {
        const board = document.getElementById('pipeline-board');
        if (board) board.innerHTML = '<div class="pipeline-loading"><i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i>Caricamento pipeline…</div>';
        try {
            const client = window.KYV && typeof KYV.createSupabaseClient === 'function' ? KYV.createSupabaseClient() : null;
            if (!client) throw new Error('Client Supabase non disponibile');
            const { data, error } = await client.from('PROGETTI').select('*').order('ID', { ascending: false }).limit(1000);
            if (error) throw error;
            state.rows = data || [];
            fillFilters();
            applyFilters();
        } catch (err) {
            console.error('[KYV Pipeline]', err);
            if (board) board.innerHTML = `<div class="pipeline-error"><i data-lucide="circle-alert" class="w-7 h-7"></i><strong>Pipeline non disponibile</strong><span>${H(err.message || 'Errore caricamento')}</span></div>`;
            if (window.lucide) lucide.createIcons();
        }
    }

    function bindFilters() {
        document.getElementById('pipeline-search')?.addEventListener('input', e => { state.search = e.target.value; applyFilters(); });
        document.getElementById('pipeline-artist')?.addEventListener('change', e => { state.artist = e.target.value; applyFilters(); });
        document.getElementById('pipeline-partner')?.addEventListener('change', e => { state.partner = e.target.value; applyFilters(); });
        document.getElementById('pipeline-priority')?.addEventListener('change', e => { state.priority = e.target.value; applyFilters(); });
        document.getElementById('pipeline-reset')?.addEventListener('click', () => {
            state.search = ''; state.artist = ''; state.partner = ''; state.priority = 'all'; state.stageFilter = 'all';
            ['pipeline-search', 'pipeline-artist', 'pipeline-partner'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
            const p = document.getElementById('pipeline-priority'); if (p) p.value = 'all';
            applyFilters();
        });
        document.getElementById('pipeline-refresh')?.addEventListener('click', load);
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindFilters();
        load();
    });
})();
