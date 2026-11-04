// KYV v2.64 — responsive tables: incremental DOM work, no duplicate renders or writes.
(function () {
    'use strict';
    const MOBILE_CARD_MAX_COLUMNS = 6;
    const LARGE_TABLE_MIN_COLUMNS = 7;
    const tableHeaders = new WeakMap();

    function isProbablyEditableTable(table) {
        return Boolean(
            table.closest('#editor-tbody') ||
            table.querySelector('[contenteditable="true"], .editable-cell') ||
            table.closest('[id*="preview"], [class*="preview"]') ||
            table.id && /editor|preview|import/i.test(table.id)
        );
    }

    function tableHeaderState(table) {
        const headers = Array.from(table.querySelectorAll('thead th'))
            .map(th => th.textContent.trim().replace(/\s+/g, ' '));
        const firstRow = table.querySelector('tr');
        const columnCount = headers.length || (firstRow ? firstRow.children.length : 0);
        return { headers, columnCount, signature: JSON.stringify(headers) };
    }

    function enhanceTable(table, newRows = null) {
        if (!table) return;
        const alreadyEnhanced = table.dataset.kyvEnhanced === '1';
        const { headers, columnCount, signature } = tableHeaderState(table);
        const previousSignature = tableHeaders.get(table);
        tableHeaders.set(table, signature);
        table.dataset.kyvEnhanced = '1';
        table.classList.add('kyv-responsive-table');

        // Revisit all rows only at first mount or when the actual table headings change.
        // On normal list pagination, work is proportional to just the rows inserted.
        const rows = !alreadyEnhanced || newRows === null || previousSignature !== signature
            ? table.querySelectorAll('tbody tr')
            : newRows;
        Array.from(rows).forEach(row => {
            Array.from(row.children).forEach((cell, index) => {
                if (!cell.getAttribute('data-label') || cell.dataset.kyvAutoLabel === '1') {
                    cell.setAttribute('data-label', headers[index] || `Campo ${index + 1}`);
                    cell.dataset.kyvAutoLabel = '1';
                }
            });
        });

        const shouldCard = columnCount > 0 && columnCount <= MOBILE_CARD_MAX_COLUMNS && !isProbablyEditableTable(table);
        const shouldScroll = columnCount >= LARGE_TABLE_MIN_COLUMNS || isProbablyEditableTable(table);
        table.classList.toggle('kyv-card-mode', shouldCard);
        table.classList.toggle('kyv-scroll-mode', shouldScroll);

        const wrapper = table.parentElement;
        if (!alreadyEnhanced && wrapper && !wrapper.dataset.kyvTableHint &&
                (wrapper.classList.contains('overflow-x-auto') ||
                 wrapper.classList.contains('overflow-auto') || shouldScroll)) {
            wrapper.dataset.kyvTableHint = '1';
            wrapper.classList.add('kyv-table-shell', 'kyv-scroll-fade');
            const hint = document.createElement('div');
            hint.className = 'kyv-table-hint';
            hint.innerHTML = '<span aria-hidden="true">↔</span><span>Scorri la tabella lateralmente</span>';
            wrapper.insertBefore(hint, table);
        }
    }

    function enhanceTables(root = document) {
        if (root.matches && root.matches('table')) enhanceTable(root);
        root.querySelectorAll('table').forEach(table => enhanceTable(table));
    }

    function markReadableContainers() {
        document.querySelectorAll('main > section').forEach(section => section.classList.add('kyv-readable-width'));
        document.querySelectorAll('.bg-kyv-card.p-5, .bg-kyv-card.p-6, .bg-kyv-card.rounded-xl')
            .forEach(card => card.classList.add('kyv-metric-card'));
    }

    function observeDynamicTables() {
        const mo = new MutationObserver(mutations => {
            const changed = new Map();
            const queue = (table, row = null) => {
                if (!table || table.tagName !== 'TABLE') return;
                if (!changed.has(table)) changed.set(table, row ? new Set([row]) : null);
                else if (row === null) changed.set(table, null);
                else changed.get(table)?.add(row);
            };
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    if (node.matches('table')) {
                        queue(node);
                        return;
                    }
                    if (node.matches('tr')) {
                        const table = node.closest('table');
                        if (node.closest('thead')) queue(table);
                        else queue(table, node);
                    } else if (node.matches('td,th')) {
                        const table = node.closest('table');
                        if (node.closest('thead')) queue(table);
                        else queue(table, node.closest('tr'));
                    } else if (node.matches('thead,tbody')) {
                        queue(node.closest('table'));
                    }
                    // A newly attached section may contain full tables and/or row batches.
                    if (node.querySelectorAll) {
                        node.querySelectorAll('table').forEach(table => queue(table));
                        node.querySelectorAll('tr').forEach(row => {
                            const table = row.closest('table');
                            if (row.closest('thead')) queue(table);
                            else queue(table, row);
                        });
                    }
                });
                // A row may be extended in place (cell added to an existing tr).
                const target = mutation.target;
                if (target?.nodeType === 1 && target.matches('tr')) {
                    const table = target.closest('table');
                    if (target.closest('thead')) queue(table);
                    else queue(table, target);
                }
            }
            changed.forEach((rows, table) => enhanceTable(table, rows));
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    function improveViewportMeta() {
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta && !meta.content.includes('viewport-fit=cover')) {
            meta.content = meta.content.replace(/\s/g, '') + ',viewport-fit=cover';
        }
    }

    function loadPageModules() {
        const page = (location.pathname.split('/').pop() || '').toLowerCase();
        if (page === 'importexport.html' && !document.querySelector('script[data-kyv-siae-import-guard]')) {
            const script = document.createElement('script');
            script.src = 'kyv-siae-import-guard.js';
            script.defer = true;
            script.dataset.kyvSiaeImportGuard = '1';
            document.head.appendChild(script);
        }
    }

    function init() {
        document.documentElement.classList.add('kyv-responsive-ready');
        improveViewportMeta();
        markReadableContainers();
        enhanceTables();
        observeDynamicTables();
        loadPageModules();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.KYV_RESPONSIVE = { enhanceTables };
})();
