// config.js - Cabina di regia per tutte le chiavi pubbliche del progetto

const KYV_CONFIG = {
    // Chiavi Supabase
    SUPABASE_URL: 'https://vppqnolgxtegtxznmgqb.supabase.co',
    SUPABASE_KEY: 'sb_publishable_BTAf2Cy5EYKgyb_uXdRvaA_iEawerhl',
    
    // URL Google Apps Script storico (fallback, usato anche da Calendar)
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwcYC4WNK3_fHPp6yvbJiqJUp_MWGKuL0fy6GNz0iAX5H7oGWjnvR2Vqj5wPdtxTpfoWw/exec',

    // Google Drive multi-account.
    // IMPORTANTE: il modulo Drive usa prima il proxy Vercel /api/drive-proxy,
    // poi JSONP come fallback, così evita i blocchi CORS del browser.
    GOOGLE_DRIVE_ALLOW_CORS_FALLBACK: false,
    GOOGLE_DRIVE_USE_PROXY: true,
    GOOGLE_DRIVE_PROXY_URL: '/api/drive-proxy',

    // Google Drive multi-account.
    // Per leggere due Drive separati senza blocchi servono due deployment Apps Script
    // oppure un unico Apps Script già autorizzato a leggere entrambi i Drive/cartelle condivise.
    GOOGLE_DRIVE_ACCOUNTS: [
        {
            id: 'info',
            label: 'Drive info@kyvprod.net',
            email: 'info@kyvprod.net',
            // Il vecchio URL restituiva 404: reinserire qui il nuovo /exec quando viene rigenerato.
            url: ''
        },
        {
            id: 'prodkyv',
            label: 'Drive prodkyv@gmail.com',
            email: 'prodkyv@gmail.com',
            url: 'https://script.google.com/macros/s/AKfycbw4S8LZ-LLDewzv3uAEJkLaEjGTfFD1XRJppV0Oy1pOkmK_3exDpp0j_Bw6jmSGjeU0UA/exec'
        }
    ]
};

// Esponi la config anche ai moduli utility.
window.KYV_CONFIG = KYV_CONFIG;

// Moduli funzionali caricati solo dove servono.
(function loadKyvFeatureModules(){
    const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page === 'scheda_progetto.html') {
        const script = document.createElement('script');
        script.src = 'kyv-project-hub-v227.js';
        script.async = false;
        document.head.appendChild(script);
    }
})();
