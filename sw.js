const CACHE_NAME = 'kyv-studio-v2-31-hardening-20261007';
const APP_SHELL = [
    './',
    './index.html',
    './progetti.html',
    './scheda_progetto.html',
    './ascolto.html',
    './manifest.json',
    './kyv-theme.css',
    './kyv-responsive.css',
    './config.js',
    './kyv-core.js',
    './kyv-auth.js',
    './menu.js',
    './icon-192.png',
    './icon-512.png'
];

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
                const fresh = await fetch(request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, fresh.clone()).catch(() => {});
                return fresh;
            } catch (_) {
                return (await caches.match(request)) || (await caches.match('./index.html')) || new Response(
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
