const CACHE_NAME = 'kyv-studio-v2-26-centro-operativo';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('[Service Worker] Installato e pronto', CACHE_NAME);
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        try {
            const keys = await caches.keys();
            await Promise.all(keys
                .filter(k => k.startsWith('kyv-studio-') && k !== CACHE_NAME)
                .map(k => caches.delete(k))
            );
        } catch (err) {
            console.warn('[Service Worker] Pulizia cache non riuscita', err);
        }
        await clients.claim();
    })());
    console.log('[Service Worker] Attivato', CACHE_NAME);
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    let url;
    try { url = new URL(request.url); } catch (err) { return; }

    // Non intercettare richieste esterne: Google Apps Script, Dropbox, Drive, Supabase, ecc.
    // Il browser deve gestirle direttamente, altrimenti un errore CORS diventa un blocco del service worker.
    if (url.origin !== self.location.origin) return;
    if (request.method !== 'GET') return;

    event.respondWith((async () => {
        try {
            return await fetch(request);
        } catch (err) {
            const cached = await caches.match(request);
            if (cached) return cached;
            return new Response('Risorsa non disponibile offline', {
                status: 504,
                statusText: 'Network unavailable',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }
    })());
});
