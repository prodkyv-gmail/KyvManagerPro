// kyv-table-tools.js - Tabelle compatte, colonne ridimensionabili e LINK cliccabili
// v2.12.0
(function () {
    const URL_RE = /https?:\/\/[^\s<>'"`]+/ig;
    let observer = null;
    let refreshTimer = null;

    function injectStyle() {
        if (document.getElementById('kyv-table-tools-style')) return;
        const style = document.createElement('style');
        style.id = 'kyv-table-tools-style';
        style.textContent = `
            table.kyv-compact-data-table { table-layout: auto; }
            table.kyv-compact-data-table th,
            table.kyv-compact-data-table td {
                max-width: 4cm;
                min-width: .85cm;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                vertical-align: top;
                position: relative;
            }
            table.kyv-compact-data-table th.kyv-manual-resized,
            table.kyv-compact-data-table td.kyv-manual-resized {
                max-width: none !important;
            }
            table.kyv-compact-data-table td.kyv-cell-expanded {
                max-width: none !important;
                min-width: 4cm;
                white-space: normal;
                overflow: visible;
                z-index: 3;
                background: rgba(15, 17, 26, .98);
                box-shadow: 0 18px 50px rgba(0,0,0,.35);
                border-radius: .45rem;
            }
            table.kyv-compact-data-table .kyv-col-resizer {
                position: absolute;
                top: 0;
                right: 0;
                width: 8px;
                height: 100%;
                cursor: col-resize;
                user-select: none;
                touch-action: none;
                opacity: .25;
                border-right: 2px solid rgba(148, 163, 184, .35);
            }
            table.kyv-compact-data-table th.kyv-sortable-header { cursor: pointer; }
            table.kyv-compact-data-table th.kyv-sort-asc::after { content: ' ▲'; color: #93c5fd; font-size: 10px; }
            table.kyv-compact-data-table th.kyv-sort-desc::after { content: ' ▼'; color: #93c5fd; font-size: 10px; }
            .kyv-table-filter-wrap { display:flex; align-items:center; justify-content:flex-end; gap:.5rem; margin:.35rem 0 .55rem; }
            .kyv-table-filter-input { width:min(100%, 260px); background:#0f111a; border:1px solid rgba(148,163,184,.22); color:#fff; padding:.45rem .7rem; border-radius:.65rem; font-size:12px; outline:none; }
            .kyv-table-filter-input:focus { border-color:rgba(129,140,248,.75); box-shadow:0 0 0 2px rgba(129,140,248,.16); }
            table.kyv-compact-data-table .kyv-col-resizer:hover,
            body.kyv-resizing-column table.kyv-compact-data-table .kyv-col-resizer {
                opacity: .8;
                border-right-color: rgba(129, 140, 248, .95);
            }
            .kyv-link-chip {
                display: inline-flex;
                align-items: center;
                gap: .35rem;
                max-width: 3.6cm;
                padding: .18rem .45rem;
                border-radius: 999px;
                border: 1px solid rgba(96, 165, 250, .35);
                background: rgba(37, 99, 235, .12);
                color: #bfdbfe;
                font-size: 11px;
                font-weight: 800;
                line-height: 1.15;
                cursor: pointer;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                vertical-align: middle;
            }
            .kyv-link-chip:hover { color: #fff; border-color: rgba(96, 165, 250, .75); background: rgba(37,99,235,.24); }
            .kyv-link-url-muted { color: #64748b; font-size: 10px; margin-left: .35rem; }
            .kyv-link-input-action {
                margin-top: .35rem;
                display: inline-flex;
                align-items: center;
                gap: .35rem;
                padding: .3rem .55rem;
                border-radius: .7rem;
                border: 1px solid rgba(96,165,250,.35);
                background: rgba(37,99,235,.12);
                color: #bfdbfe;
                font-size: 11px;
                font-weight: 900;
                cursor: pointer;
            }
            .kyv-link-input-action:hover { color: #fff; border-color: rgba(96,165,250,.75); }
            .kyv-link-input-action.hidden { display: none; }
            .kyv-link-viewer.hidden { display: none; }
            .kyv-link-viewer { position: fixed; inset: 0; z-index: 100000; }
            .kyv-link-viewer__backdrop { position:absolute; inset:0; background: rgba(0,0,0,.72); backdrop-filter: blur(8px); }
            .kyv-link-viewer__panel { position:absolute; inset: 3vh 3vw; display:flex; flex-direction:column; background:#0f111a; border:1px solid rgba(148,163,184,.25); border-radius: 1.25rem; box-shadow: 0 32px 90px rgba(0,0,0,.55); overflow:hidden; }
            .kyv-link-viewer__header { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding: .9rem 1rem; border-bottom:1px solid rgba(148,163,184,.18); background:rgba(21,25,35,.98); }
            .kyv-link-viewer__eyebrow { margin:0 0 .15rem; color:#93c5fd; font-size:10px; text-transform:uppercase; letter-spacing:.18em; font-weight:900; }
            .kyv-link-viewer__title { margin:0; color:#fff; font-size:1rem; font-weight:900; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:60vw; }
            .kyv-link-viewer__actions { display:flex; flex-wrap:wrap; gap:.45rem; justify-content:flex-end; }
            .kyv-link-viewer__btn { display:inline-flex; align-items:center; justify-content:center; padding:.5rem .7rem; border-radius:.75rem; border:1px solid rgba(148,163,184,.24); background:rgba(15,17,26,.92); color:#e5e7eb; font-size:12px; font-weight:900; text-decoration:none; cursor:pointer; }
            .kyv-link-viewer__btn:hover { border-color:rgba(129,140,248,.75); color:#fff; }
            .kyv-link-viewer__btn--close { background: rgba(220,38,38,.14); border-color: rgba(248,113,113,.3); }
            .kyv-link-viewer__body { flex:1; min-height:0; background:#111827; position:relative; }
            .kyv-link-viewer__iframe { width:100%; height:100%; border:0; background:#111827; }
            .kyv-link-viewer__image-wrap { width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:auto; padding:1rem; }
            .kyv-link-viewer__image-wrap img { max-width:100%; max-height:100%; object-fit:contain; border-radius:.75rem; }
            .kyv-link-viewer__fallback { position:absolute; left:1rem; bottom:1rem; right:1rem; border:1px solid rgba(148,163,184,.22); background:rgba(15,17,26,.88); color:#cbd5e1; border-radius:.8rem; padding:.65rem .8rem; font-size:12px; pointer-events:none; }
            @media (max-width: 760px) {
                .kyv-link-viewer__panel { inset: 1.5vh 1.5vw; border-radius: .9rem; }
                .kyv-link-viewer__header { align-items:flex-start; flex-direction:column; }
                .kyv-link-viewer__title { max-width: 90vw; }
                .kyv-link-viewer__actions { width:100%; justify-content:stretch; }
                .kyv-link-viewer__btn { flex:1; }
            }
        `;
        document.head.appendChild(style);
    }

    function isIgnorableTable(table) {
        if (!table || table.dataset.kyvNoCompact === '1') return true;
        if (table.closest('#kyv-help-modal, #kyv-link-viewer-modal')) return true;
        return false;
    }

    function headerForCell(cell) {
        const table = cell.closest('table');
        const row = cell.closest('tr');
        if (!table || !row) return '';
        const index = Array.from(row.children).indexOf(cell);
        const headerRow = table.tHead?.rows?.[0] || table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow) return '';
        const header = headerRow.children[index];
        return header ? header.textContent.trim() : '';
    }

    function isLinkHeader(text) {
        return /\b(link|url|drive|dropbox|documento|file|allegato|pdf|excel|audio|contratto|scheda)\b/i.test(String(text || ''));
    }

    function shortLabel(url, header) {
        const h = String(header || '').trim();
        const lower = url.toLowerCase();
        if (window.KYV_LINK_VIEWER?.isAudioUrl?.(url)) return 'Apri ascolto';
        if (lower.includes('.pdf')) return 'Apri PDF';
        if (/\.(xlsx?|csv|ods)(\?|#|$)/i.test(lower)) return 'Apri Excel';
        if (/\.(docx?|pptx?|odt|rtf)(\?|#|$)/i.test(lower)) return 'Apri documento';
        if (h && isLinkHeader(h)) return `Apri ${h.replace(/[_:-]+/g, ' ').slice(0, 18)}`;
        return 'Apri link';
    }

    function linkifyCell(cell) {
        if (!cell || cell.dataset.kyvLinkified === '1') return;
        if (cell.querySelector('input, textarea, select, button, [contenteditable="true"]')) return;
        const header = headerForCell(cell);
        const text = cell.textContent || '';
        const urls = [...new Set((text.match(URL_RE) || []).map(u => window.KYV_LINK_VIEWER?.extractFirstUrl?.(u) || u))];
        if (!urls.length) return;
        if (!isLinkHeader(header) && urls.length === 1 && text.trim() !== urls[0]) return;

        cell.dataset.kyvLinkified = '1';
        cell.title = text.trim();
        const frag = document.createDocumentFragment();
        urls.forEach((url, idx) => {
            if (idx > 0) frag.appendChild(document.createTextNode(' '));
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'kyv-link-chip';
            btn.dataset.kyvOpenLink = url;
            btn.dataset.kyvLinkTitle = header || url;
            btn.title = url;
            btn.textContent = shortLabel(url, header);
            frag.appendChild(btn);
        });
        if (urls.length === 1) {
            const muted = document.createElement('span');
            muted.className = 'kyv-link-url-muted';
            muted.textContent = compactUrl(urls[0]);
            frag.appendChild(muted);
        }
        cell.replaceChildren(frag);
    }

    function compactUrl(url) {
        try {
            const parsed = new URL(url);
            const host = parsed.hostname.replace(/^www\./, '');
            const file = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || 'link');
            return `${host}/${file}`.slice(0, 48);
        } catch (err) { return String(url || '').slice(0, 48); }
    }

    function applyCompactTitles(table) {
        table.querySelectorAll('td, th').forEach(cell => {
            if (!cell.title && cell.textContent && cell.textContent.trim().length > 18) cell.title = cell.textContent.trim();
        });
    }

    function setColumnWidth(table, index, px) {
        const width = `${Math.max(34, px)}px`;
        table.querySelectorAll('tr').forEach(row => {
            const cell = row.children[index];
            if (!cell) return;
            cell.style.width = width;
            cell.style.maxWidth = 'none';
            cell.classList.add('kyv-manual-resized');
        });
    }

    function addColumnResizers(table) {
        const headerRow = table.tHead?.rows?.[0] || table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow) return;
        Array.from(headerRow.children).forEach((th, index) => {
            if (th.querySelector(':scope > .kyv-col-resizer')) return;
            const handle = document.createElement('span');
            handle.className = 'kyv-col-resizer';
            handle.title = 'Trascina per allargare/restringere la colonna. Doppio click su una cella per leggere tutto.';
            handle.addEventListener('mousedown', event => startResize(event, table, th, index));
            handle.addEventListener('touchstart', event => startResize(event, table, th, index), { passive: false });
            th.appendChild(handle);
        });
    }

    function startResize(event, table, th, index) {
        event.preventDefault();
        event.stopPropagation();
        const point = event.touches ? event.touches[0] : event;
        const startX = point.clientX;
        const startWidth = th.getBoundingClientRect().width;
        document.body.classList.add('kyv-resizing-column');

        function move(ev) {
            const p = ev.touches ? ev.touches[0] : ev;
            setColumnWidth(table, index, startWidth + (p.clientX - startX));
        }
        function up() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', up);
            document.body.classList.remove('kyv-resizing-column');
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('touchend', up);
    }


    function fieldLabel(el) {
        const escapedId = el.id && window.CSS && CSS.escape ? CSS.escape(el.id) : String(el.id || '').replace(/"/g, '\"');
        const id = el.id ? document.querySelector(`label[for="${escapedId}"]`) : null;
        const local = el.closest('label') || id || el.parentElement?.querySelector?.('label');
        return [el.name, el.id, el.placeholder, el.dataset?.key, local?.textContent].filter(Boolean).join(' ');
    }

    function enhanceLinkInputs(root = document) {
        const scope = root instanceof Element || root instanceof Document ? root : document;
        scope.querySelectorAll?.('input, textarea').forEach(el => {
            if (el.type === 'hidden' || el.dataset.kyvLinkInputBound === '1') return;
            const meta = fieldLabel(el);
            if (!isLinkHeader(meta) && !URL_RE.test(el.value || '')) { URL_RE.lastIndex = 0; return; }
            URL_RE.lastIndex = 0;
            el.dataset.kyvLinkInputBound = '1';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'kyv-link-input-action hidden';
            btn.textContent = 'Apri link';
            btn.addEventListener('click', () => {
                const url = window.KYV_LINK_VIEWER?.extractFirstUrl?.(el.value) || '';
                if (!url) return window.KYV?.showToast?.('Nessun link valido in questo campo.', 'warning');
                window.KYV_LINK_VIEWER.open(url, { title: meta || 'Link' });
            });
            el.insertAdjacentElement('afterend', btn);
            const sync = () => {
                const url = window.KYV_LINK_VIEWER?.extractFirstUrl?.(el.value) || '';
                btn.classList.toggle('hidden', !url);
            };
            el.addEventListener('input', sync);
            el.addEventListener('change', sync);
            sync();
        });
    }



    function cellSortValue(cell) {
        const text = (cell?.textContent || '').trim();
        const n = window.KYV_HELPERS?.parseNumber ? KYV_HELPERS.parseNumber(text) : Number(text.replace(',', '.'));
        if (text && Number.isFinite(n) && /[0-9]/.test(text)) return { type:'number', value:n };
        const d = Date.parse(text);
        if (text && !Number.isNaN(d) && /\d{4}|\d{1,2}[\/.-]\d{1,2}/.test(text)) return { type:'date', value:d };
        return { type:'text', value:text.toLowerCase() };
    }

    function sortTableByColumn(table, index, th) {
        const tbody = table.tBodies?.[0];
        if (!tbody) return;
        const current = th.dataset.kyvSort === 'asc' ? 'desc' : 'asc';
        const rows = Array.from(tbody.rows);
        rows.sort((a,b) => {
            const av = cellSortValue(a.children[index]);
            const bv = cellSortValue(b.children[index]);
            let cmp = 0;
            if (av.type === bv.type && av.type !== 'text') cmp = av.value - bv.value;
            else cmp = String(av.value).localeCompare(String(bv.value), 'it', { numeric:true, sensitivity:'base' });
            return current === 'asc' ? cmp : -cmp;
        });
        rows.forEach(row => tbody.appendChild(row));
        const headerRow = th.parentElement;
        headerRow?.querySelectorAll?.('th').forEach(h => { h.dataset.kyvSort = ''; h.classList.remove('kyv-sort-asc','kyv-sort-desc'); });
        th.dataset.kyvSort = current;
        th.classList.add(current === 'asc' ? 'kyv-sort-asc' : 'kyv-sort-desc');
    }

    function addSortableHeaders(table) {
        if (table.dataset.kyvNativeSort === '1') return;
        const headerRow = table.tHead?.rows?.[0] || table.querySelector('thead tr') || table.querySelector('tr');
        if (!headerRow || !table.tBodies?.[0]) return;
        Array.from(headerRow.children).forEach((th, index) => {
            if (th.dataset.kyvSortBound === '1') return;
            th.dataset.kyvSortBound = '1';
            th.classList.add('kyv-sortable-header');
            th.title = `${th.title || th.textContent.trim()} · clicca per ordinare, trascina il bordo per ridimensionare`;
            th.addEventListener('click', (event) => {
                if (event.target.closest('.kyv-col-resizer, button, a, input, select')) return;
                sortTableByColumn(table, index, th);
            });
        });
    }

    function addTableFilter(table) {
        if (table.dataset.kyvNativeFilter === '1') return;
        if (table.dataset.kyvFilterBound === '1') return;
        const tbody = table.tBodies?.[0];
        if (!tbody || tbody.rows.length < 8) return;
        table.dataset.kyvFilterBound = '1';
        const wrap = document.createElement('div');
        wrap.className = 'kyv-table-filter-wrap';
        wrap.innerHTML = '<input class="kyv-table-filter-input" type="search" placeholder="Cerca in questa tabella...">';
        table.insertAdjacentElement('beforebegin', wrap);
        const input = wrap.querySelector('input');
        input.addEventListener('input', () => {
            const q = String(input.value || '').trim().toLowerCase();
            Array.from(tbody.rows).forEach(row => {
                row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    }

    function enhanceTable(table) {
        if (isIgnorableTable(table)) return;
        table.classList.add('kyv-compact-data-table');
        if (table.dataset.kyvTableToolsBound !== '1') {
            table.dataset.kyvTableToolsBound = '1';
            table.addEventListener('dblclick', (event) => {
                if (event.target.closest('button, a, input, textarea, select, .kyv-col-resizer')) return;
                const td = event.target.closest('td');
                if (!td || !table.contains(td)) return;
                td.classList.toggle('kyv-cell-expanded');
            });
        }
        addColumnResizers(table);
        addSortableHeaders(table);
        addTableFilter(table);
        applyCompactTitles(table);
        table.querySelectorAll('td').forEach(linkifyCell);
    }

    function enhance(root = document) {
        injectStyle();
        const scope = root instanceof Element || root instanceof Document ? root : document;
        if (scope.matches?.('table')) enhanceTable(scope);
        scope.querySelectorAll?.('table').forEach(enhanceTable);
        enhanceLinkInputs(scope);
    }

    function scheduleEnhance(root = document) {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => enhance(root), 80);
    }

    document.addEventListener('click', (event) => {
        const openBtn = event.target.closest('[data-kyv-open-link]');
        if (openBtn) {
            event.preventDefault();
            event.stopPropagation();
            window.KYV_LINK_VIEWER?.open(openBtn.dataset.kyvOpenLink, { title: openBtn.dataset.kyvLinkTitle || openBtn.title });
            return;
        }
        const anchor = event.target.closest('a[href]');
        if (!anchor || !anchor.closest('table')) return;
        const url = anchor.href;
        const cell = anchor.closest('td, th');
        const header = cell ? headerForCell(cell) : '';
        if (!window.KYV_LINK_VIEWER?.isPreviewableUrl?.(url)) return;
        if (!isLinkHeader(header) && !/\.(pdf|xlsx?|csv|docx?|pptx?|mp3|wav|m4a|flac|png|jpe?g|webp)(\?|#|$)/i.test(url)) return;
        event.preventDefault();
        window.KYV_LINK_VIEWER.open(url, { title: anchor.textContent.trim() || header || url });
    }, true);

    function observe() {
        if (observer) return;
        observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    scheduleEnhance(document);
                    return;
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { enhance(); observe(); });
    } else {
        enhance(); observe();
    }

    window.KYV_TABLE_TOOLS = { enhance, refresh: scheduleEnhance, enhanceLinkInputs, sortTableByColumn, addTableFilter };
})();
