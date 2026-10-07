const CACHE_NAME = 'kyv-studio-v2-31-calendar-freeze-phase5-20261007';
const APP_SHELL = [
    './',
    './index.html',
    './progetti.html',
    './scheda_progetto.html',
    './ascolto.html',
    './kyv_calendar.html',
    './manifest.json',
    './kyv-theme.css',
    './kyv-responsive.css',
    './config.js',
    './kyv-core.js',
    './kyv-auth.js',
    './menu.js',
    './kyv-hardening-overrides.js',
    './kyv-calendar-safety.js',
    './icon-192.png',
    './icon-512.png'
];

function hardenHtml(html, pathname = '') {
    let out = html.replaceAll('data-lucide="message-circle-clock"', 'data-lucide="message-square-text"');
    const path = pathname.toLowerCase();
    if (path.endsWith('/scheda_progetto.html') && !out.includes('kyv-hardening-overrides.js')) {
        out = out.replace('</head>', '    <script src="./kyv-hardening-overrides.js" defer></script>\n</head>');
    }
    if (path.endsWith('/kyv_calendar.html') && !out.includes('kyv-calendar-safety.js')) {
        // Non defer: deve installare il guard MutationObserver prima dei moduli deferred dell'Agenda.
        out = out.replace('</head>', '    <script src="./kyv-calendar-safety.js"></script>\n</head>');
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

    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const fresh = await htmlResponse(await fetch(request), url.pathname);
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, fresh.clone()).catch(() => {});
                return fresh;
            } catch (_) {
                const cached = await caches.match(request);
                if (cached) return htmlResponse(cached, url.pathname);
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

    event.respondWith((async () => {
        const cached = await caches.match(request);
        const network = fetch(request).then(async response => {
            if (response && response.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        });
        return cached || network.catch(() => new Response('Risorsa non disponibile offline', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }));
    })());
});
