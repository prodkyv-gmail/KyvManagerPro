// kyv-responsive.js - miglioramenti UX responsive non invasivi
(function () {
    const MOBILE_CARD_MAX_COLUMNS = 6;
    const LARGE_TABLE_MIN_COLUMNS = 7;

    function isProbablyEditableTable(table) {
        return Boolean(
            table.closest('#editor-tbody') ||
            table.querySelector('[contenteditable="true"], .editable-cell') ||
            table.closest('[id*="preview"], [class*="preview"]') ||
            table.id && /editor|preview|import/i.test(table.id)
        );
    }

    function enhanceTable(table) {
        if (!table) return;
        const alreadyEnhanced = table.dataset.kyvEnhanced === '1';
        table.dataset.kyvEnhanced = '1';
        table.classList.add('kyv-responsive-table');

        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim().replace(/\s+/g, ' '));
        const columnCount = headers.length || (table.querySelector('tr') ? table.querySelector('tr').children.length : 0);

        Array.from(table.querySelectorAll('tbody tr')).forEach(row => {
            Array.from(row.children).forEach((cell, index) => {
                if (!cell.getAttribute('data-label')) cell.setAttribute('data-label', headers[index] || `Campo ${index + 1}`);
            });
        });

        const shouldCard = columnCount > 0 && columnCount <= MOBILE_CARD_MAX_COLUMNS && !isProbablyEditableTable(table);
        const shouldScroll = columnCount >= LARGE_TABLE_MIN_COLUMNS || isProbablyEditableTable(table);
        if (shouldCard) table.classList.add('kyv-card-mode');
        if (shouldScroll) table.classList.add('kyv-scroll-mode');

        const wrapper = table.parentElement;
        if (!alreadyEnhanced && wrapper && !wrapper.dataset.kyvTableHint && (wrapper.classList.contains('overflow-x-auto') || wrapper.classList.contains('overflow-auto') || shouldScroll)) {
            wrapper.dataset.kyvTableHint = '1';
            wrapper.classList.add('kyv-table-shell', 'kyv-scroll-fade');
            const hint = document.createElement('div');
            hint.className = 'kyv-table-hint';
            hint.innerHTML = '<span>↔</span><span>Scorri la tabella lateralmente</span>';
            wrapper.insertBefore(hint, table);
        }
    }

    function enhanceTables(root = document) {
        root.querySelectorAll('table').forEach(enhanceTable);
    }

    function markReadableContainers() {
        document.querySelectorAll('main > section').forEach(section => section.classList.add('kyv-readable-width'));
        document.querySelectorAll('.bg-kyv-card.p-5, .bg-kyv-card.p-6, .bg-kyv-card.rounded-xl').forEach(card => card.classList.add('kyv-metric-card'));
    }

    function observeDynamicTables() {
        const mo = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    if (node.matches && node.matches('table')) enhanceTable(node);
                    const table = node.closest ? node.closest('table') : null;
                    if (table) enhanceTable(table);
                    if (node.querySelectorAll) enhanceTables(node);
                });
            }
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
