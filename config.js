// config.js - Cabina di regia per tutte le chiavi pubbliche del progetto

const KYV_CONFIG = {
    APP_VERSION: '2.30',

    // Chiavi Supabase pubblicabili (nessun service_role nel browser).
    SUPABASE_URL: 'https://vppqnolgxtegtxznmgqb.supabase.co',
    SUPABASE_KEY: 'sb_publishable_BTAf2Cy5EYKgyb_uXdRvaA_iEawerhl',

    // URL Google Apps Script storico, usato dal Calendar; non è il deployment Drive.
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwcYC4WNK3_fHPp6yvbJiqJUp_MWGKuL0fy6GNz0iAX5H7oGWjnvR2Vqj5wPdtxTpfoWw/exec',
    GOOGLE_CALENDAR_ACCOUNT: {
        id: 'calendar-prodkyv',
        label: 'Calendar prodkyv@gmail.com',
        email: 'prodkyv@gmail.com',
        url: 'https://script.google.com/macros/s/AKfycbwcYC4WNK3_fHPp6yvbJiqJUp_MWGKuL0fy6GNz0iAX5H7oGWjnvR2Vqj5wPdtxTpfoWw/exec'
    },
    // Chiave pubblica Dropbox Chooser; il dominio va autorizzato in console Dropbox.
    DROPBOX_APP_KEY: 'kpapjm7sybfs8ze',
    GOOGLE_DRIVE_ALLOW_CORS_FALLBACK: false,
    GOOGLE_DRIVE_USE_PROXY: true,
    GOOGLE_DRIVE_PROXY_URL: '/api/drive-proxy',
    GOOGLE_DRIVE_ACCOUNTS: [
        {
            id: 'info',
            label: 'Drive info@kyvprod.net',
            email: 'info@kyvprod.net',
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

window.KYV_CONFIG = KYV_CONFIG;

// Sincronizza solo la versione visuale: la struttura del menu è gestita da Producer Mode.
(function syncKyvVersion(){
    let observer;
    function sync(){
        const brand=document.querySelector('#sidebar h1 + p');
        if(!brand)return false;
        brand.textContent=`Manager Pro ${KYV_CONFIG.APP_VERSION}`;
        document.documentElement.dataset.kyvVersion=KYV_CONFIG.APP_VERSION;
        return true;
    }
    document.addEventListener('DOMContentLoaded',()=>{if(sync()&&observer)observer.disconnect();});
    observer=new MutationObserver(()=>{if(sync())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.setTimeout(()=>observer.disconnect(),6000);
})();

(function loadKyvFeatureModules(){
    const page=(window.location.pathname.split('/').pop()||'index.html').toLowerCase();

    // Interfaccia semplificata Produttore: Oggi / Agenda / Nuovo / Progetti / Ascolto.
    const producer=document.createElement('script');
    producer.src='kyv-producer-mode.js';
    producer.async=false;
    document.head.appendChild(producer);

    if(page==='scheda_progetto.html'){
        const script=document.createElement('script');
        script.src='kyv-project-hub-v227.js';
        script.async=false;
        document.head.appendChild(script);
    }
    if(page==='ascolto.html'){
        // Vista producer-first: viene caricata prima della vecchia stazione per evitare
        // scansioni Drive automatiche all'apertura. Gli strumenti cloud restano manuali.
        const phase4=document.createElement('script');
        phase4.src='kyv-listening-phase4.js';
        phase4.async=false;
        document.head.appendChild(phase4);

        const core=document.createElement('script');
        core.src='kyv-link-audit-core.js';
        core.async=false;
        document.head.appendChild(core);
        const audit=document.createElement('script');
        audit.src='kyv-listen-link-audit.js';
        audit.async=false;
        document.head.appendChild(audit);
    }
})();
