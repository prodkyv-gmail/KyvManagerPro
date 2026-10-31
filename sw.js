const CACHE_NAME = 'kyv-studio-v2-45-guide-sync-20261031';
const APP_SHELL = [
    './',
    './index.html',
    './progetti.html',
    './scheda_progetto.html',
    './data_quality.html',
    './ascolto.html',
    './kyv_calendar.html',
    './pipeline.html',
    './fatture.html',
    './integrazioni.html',
    './guida.html',
    './kyv-help.js',
    './kyv_intelligence.html',
    './kyv_liquidazioni.html',
    './kyv_ritorni_progetti.html',
    './kyv_analyst.html',
    './kyv_scrivania_creativa.html',
    './kyv_audio_finder.html',
    './kyv-audio-finder-v245.js',
    './kyv-audio-finder-ui-v245.js',
    './kyv-audio-finder-linked-v245.js',
    './kyv-drive-bridge.js',
    './kyv-creative-desk-v244.js',
    './kyv-creative-desk-ui-v244.js',
    './kyv-analyst-engine-v241.js',
    './kyv-creative-funnel-v242.js',
    './kyv-analyst-ui-v241.js',
    './kyv-project-returns-v240.js',
    './kyv-project-returns-ui-v240.js',
    './kyv-rights-liquidations-v239.js',
    './kyv-intelligence-engine-v238.js',
    './kyv-siae-amount.js',
    './kyv-editor-columns.js',
    './editor.html',
    './kyv-invoice-line-amount.js',
    './rendiconto.html',
    './manifest.json',
    './kyv-theme.css',
    './kyv-responsive.css',
    './config.js',
    './kyv-core.js',
    './kyv-auth.js',
    './kyv-data-quality.js',
    './kyv-record-editor.js',
    './kyv-aruba-import.js',
    './kyv-invoice-reconciliation-v236.js',
    './kyv-project-invoices.js',
    './kyv-project-finance-summary.js',
    './kyv-project-sheet-v2.js',
    './kyv-project-hub-v3.js',
    './kyv-project-timeline-v10.js',
    './kyv-pipeline-v4.js',
    './kyv-today-home-v5.js',
    './kyv-economy-v6.js',
    './kyv-rights-v7.js',
    './kyv-global-search-v8.js',
    './kyv-easy-ux-v9.js',
    './kyv-easy-secondary-v9.js',
    './kyv-siae-import-guard.js',
    './kyv-project-edit-safety.js',
    './kyv-pitch-followup.js',
    './kyv-release-desk.js',
    './kyv-release-closeout.js',
    './kyv-interest-to-release.js',
    './kyv-version-to-pitch.js',
    './kyv-workflow-nav.js',
    './kyv-producer-mode.js',
    './kyv-nav-order.js',
    './kyv-layout-polish.js',
    './kyv-sheet-controls.js',
    './kyv-sheet-responsive-menus.js',
    './kyv-sheet-dropdown-fix.js',
    './kyv-editor-nav-v2.js',
    './kyv-editor-relations.js',
    './kyv-editor-project-fields.js',
    './kyv-editor-invoice-fields.js',
    './kyv-editor-primary-fields.js',
    './kyv-listening-nav-v2.js',
    './menu.js',
    './kyv-hardening-overrides.js',
    './icon-192.png',
    './icon-512.png'
];

function hardenHtml(html, pathname = '') {
    let out = html.replaceAll('data-lucide="message-circle-clock"', 'data-lucide="message-square-text"');
    const path = pathname.toLowerCase();
    if (path.endsWith('/scheda_progetto.html') && !out.includes('kyv-hardening-overrides.js')) {
        out = out.replace('</head>', '    <script src="./kyv-hardening-overrides.js" defer></script>\n</head>');
    }
    return out;
}

async function htmlResponse(response, pathname = '') {
    if (!response || !response.ok) return response;
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(hardenHtml(await response.text(), pathname), {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

async function networkFirst(request, transform = null) {
    const cache = await caches.open(CACHE_NAME);
    try {
        let response = await fetch(request, { cache: 'no-store' });
        if (transform) response = await transform(response);
        if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
    } catch (_) {
        const cached = await caches.match(request);
        if (cached) return transform ? transform(cached) : cached;
        throw _;
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(APP_SHELL);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter(k => k.startsWith('kyv-studio-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
        );
        await clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    let url;
    try { url = new URL(request.url); } catch (_) { return; }

    if (url.origin !== self.location.origin || request.method !== 'GET') return;

    // Le funzioni Vercel non devono mai passare dalla cache PWA.
    if (url.pathname.startsWith('/api/')) return;

    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                return await networkFirst(request, response => htmlResponse(response, url.pathname));
            } catch (_) {
                const home = await caches.match('./index.html');
                if (home) return htmlResponse(home, '/index.html');
                return new Response(
                    '<!doctype html><meta charset="utf-8"><title>KYV offline</title><body style="font-family:sans-serif;background:#0f111a;color:#f8fafc;padding:2rem"><h1>KYV Manager è offline</h1><p>Questa pagina non è ancora disponibile nella cache. Riconnettiti una volta per salvarla.</p></body>',
                    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
            }
        })());
        return;
    }

    const path = url.pathname.toLowerCase();
    const networkFirstAsset = path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.json');

    if (networkFirstAsset) {
        event.respondWith(
            networkFirst(request).catch(() => new Response('Risorsa non disponibile offline', {
                status: 503,
                statusText: 'Offline',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            }))
        );
        return;
    }

    event.respondWith((async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
            const response = await fetch(request);
            if (response && response.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        } catch (_) {
            return new Response('Risorsa non disponibile offline', {
                status: 503,
                statusText: 'Offline',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }
    })());
});
