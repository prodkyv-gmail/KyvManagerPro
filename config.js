// config.js - Cabina di regia per tutte le chiavi pubbliche del progetto

const KYV_CONFIG = {
    APP_VERSION: '2.28',

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

// Mantiene visibile la versione corrente in tutta l'app e aggiunge la Pipeline alla navigazione.
(function mountKyvVersionAndPipelineNav(){
    const version = KYV_CONFIG.APP_VERSION;
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    let observer;

    function syncUi(){
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return false;

        const brandVersion = sidebar.querySelector('h1 + p');
        if (brandVersion) brandVersion.textContent = `Manager Pro ${version}`;

        if (!sidebar.querySelector('a[href="pipeline.html"]')) {
            const projectsLink = sidebar.querySelector('a[href="progetti.html"]');
            const projectsItem = projectsLink?.closest('li');
            if (projectsItem) {
                const active = currentPage === 'pipeline.html';
                const li = document.createElement('li');
                li.innerHTML = `<a href="pipeline.html" class="flex items-center px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${active ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-sm shadow-indigo-500/5' : 'text-kyv-text hover:text-white hover:bg-kyv-border/50 border border-transparent'}"><i data-lucide="columns-3" class="w-4 h-4 mr-3 text-fuchsia-300"></i><span>Pipeline</span><span class="ml-auto text-[9px] font-black text-indigo-300/80">2.28</span></a>`;
                projectsItem.insertAdjacentElement('afterend', li);
                if (window.lucide) lucide.createIcons({ root: li });
            }
        }

        document.documentElement.dataset.kyvVersion = version;
        return Boolean(brandVersion && sidebar.querySelector('a[href="pipeline.html"]'));
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (syncUi() && observer) observer.disconnect();
    });

    observer = new MutationObserver(() => {
        if (syncUi()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 5000);
})();

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
