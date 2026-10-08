// config.js - Cabina di regia per tutte le chiavi pubbliche del progetto

const KYV_CONFIG = {
    APP_VERSION: '2.32',

    // Chiavi Supabase pubblicabili (nessun service_role nel browser).
    SUPABASE_URL: 'https://vppqnolgxtegtxznmgqb.supabase.co',
    SUPABASE_KEY: 'sb_publishable_BTAf2Cy5EYKgyb_uXdRvaA_iEawerhl',

    // Google Calendar: deployment Web App pubblico /exec.
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxJAwkYrKZk-qVkyvHEfc3T53LpS4rQMSAjJAvRHklnBmzXx5x-D2EWsbVXsNnnYL7Xrg/exec',
    GOOGLE_CALENDAR_ACCOUNT: {
        id: 'calendar-prodkyv',
        label: 'Calendar prodkyv@gmail.com',
        email: 'prodkyv@gmail.com',
        url: 'https://script.google.com/macros/s/AKfycbxJAwkYrKZk-qVkyvHEfc3T53LpS4rQMSAjJAvRHklnBmzXx5x-D2EWsbVXsNnnYL7Xrg/exec'
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
    // La pagina Progetti safe è intenzionalmente isolata da observer globali.
    if(window.KYV_SAFE_PROJECTS_PAGE){
        document.documentElement.dataset.kyvVersion=KYV_CONFIG.APP_VERSION;
        return;
    }
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
    const producerViews=['progetti.html','scheda_progetto.html','ascolto.html','kyv_calendar.html','index.html',''];

    if(producerViews.includes(page)){
        const invoices=document.createElement('script');
        invoices.src='kyv-project-invoices.js';
        invoices.async=false;
        invoices.dataset.kyvProjectInvoices='1';
        document.head.appendChild(invoices);

        const layoutPolish=document.createElement('script');
        layoutPolish.src='kyv-layout-polish.js';
        layoutPolish.async=false;
        layoutPolish.dataset.kyvLayoutPolish='1';
        document.head.appendChild(layoutPolish);
    }

    if(window.KYV_SAFE_PROJECTS_PAGE&&page==='progetti.html')return;

    if(page==='progetti.html'&&!document.querySelector('script[data-kyv-projects-phase3]')){
        const projects=document.createElement('script');
        projects.src='kyv-projects-phase3.js';
        projects.async=false;
        projects.dataset.kyvProjectsPhase3='1';
        document.head.appendChild(projects);
    }

    const producer=document.createElement('script');
    producer.src='kyv-producer-mode.js';
    producer.async=false;
    document.head.appendChild(producer);

    const workflowNav=document.createElement('script');
    workflowNav.src='kyv-workflow-nav.js';
    workflowNav.async=false;
    document.head.appendChild(workflowNav);

    if(page==='index.html'||page===''){
        const todayPriority=document.createElement('script');
        todayPriority.src='kyv-today-priority.js';
        todayPriority.async=false;
        document.head.appendChild(todayPriority);
    }

    if(page==='scheda_progetto.html'){
        const script=document.createElement('script');
        script.src='kyv-project-sheet-v2.js';
        script.async=false;
        document.head.appendChild(script);

        const pitch=document.createElement('script');
        pitch.src='kyv-pitch-followup.js';
        pitch.async=false;
        document.head.appendChild(pitch);

        const releaseDesk=document.createElement('script');
        releaseDesk.src='kyv-release-desk.js';
        releaseDesk.async=false;
        document.head.appendChild(releaseDesk);

        const releaseCloseout=document.createElement('script');
        releaseCloseout.src='kyv-release-closeout.js';
        releaseCloseout.async=false;
        releaseCloseout.dataset.kyvReleaseCloseout='1';
        document.head.appendChild(releaseCloseout);

        const versionToPitch=document.createElement('script');
        versionToPitch.src='kyv-version-to-pitch.js';
        versionToPitch.async=false;
        document.head.appendChild(versionToPitch);

        const interestToRelease=document.createElement('script');
        interestToRelease.src='kyv-interest-to-release.js';
        interestToRelease.async=false;
        document.head.appendChild(interestToRelease);

        const financeSummary=document.createElement('script');
        financeSummary.src='kyv-project-finance-summary.js';
        financeSummary.async=false;
        financeSummary.dataset.kyvProjectFinanceSummary='1';
        document.head.appendChild(financeSummary);
    }

    if(page==='kyv_calendar.html'){
        const phase5=document.createElement('script');
        phase5.src='kyv-agenda-phase5.js';
        phase5.async=false;
        document.head.appendChild(phase5);

        const pitch=document.createElement('script');
        pitch.src='kyv-pitch-followup.js';
        pitch.async=false;
        document.head.appendChild(pitch);
    }

    if(page==='ascolto.html'){
        const phase4=document.createElement('script');
        phase4.src='kyv-listening-phase4.js';
        phase4.async=false;
        document.head.appendChild(phase4);

        const versionToPitch=document.createElement('script');
        versionToPitch.src='kyv-version-to-pitch.js';
        versionToPitch.async=false;
        document.head.appendChild(versionToPitch);

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