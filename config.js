// config.js - Cabina di regia per tutte le chiavi pubbliche del progetto

const KYV_CONFIG = {
    APP_VERSION: '2.74',
    // Registrare qui l'Application (client) ID della propria app Microsoft Entra (SPA).
    // Solo Files.Read, redirect https://<dominio>/kyv_audio_finder.html; lasciare vuoto finché non configurata.
    MICROSOFT_CLIENT_ID: '',
    // Attivare dopo esecuzione e verifica della migrazione docs/v258-onedrive-provider.sql.
    ONEDRIVE_INDEX_ENABLED: false,

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
        // Pagina Progetti isolata: sincronizza soltanto il testo senza observer.
        document.addEventListener('DOMContentLoaded',()=>{
            const brand=document.querySelector('#sidebar .brand span');
            if(brand)brand.textContent='Manager Pro '+KYV_CONFIG.APP_VERSION;
        },{once:true});
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
    // Intelligence loads this helper with an explicit ordered script tag.
    // Other pages use dynamic feature loaders, so ensure it is enqueued first.
    if(page!=='kyv_intelligence.html'){
        const invoiceLines=document.createElement('script');
        invoiceLines.src='kyv-invoice-line-amount.js';
        invoiceLines.async=false;
        invoiceLines.dataset.kyvInvoiceLineAmounts='1';
        document.head.appendChild(invoiceLines);
    }

    if(page==='progetti.html'||page==='editor.html'){
        const sheetControls=document.createElement('script');
        sheetControls.src='kyv-sheet-controls.js';
        sheetControls.async=false;
        sheetControls.dataset.kyvSheetControls='1';
        document.head.appendChild(sheetControls);

        const responsiveMenus=document.createElement('script');
        responsiveMenus.src='kyv-sheet-responsive-menus.js';
        responsiveMenus.async=false;
        responsiveMenus.dataset.kyvSheetResponsiveMenus='1';
        document.head.appendChild(responsiveMenus);
    }

    if(page==='editor.html'){
        const editorNav=document.createElement('script');
        editorNav.src='kyv-editor-nav-v2.js';
        editorNav.async=false;
        editorNav.dataset.kyvEditorNavV2='1';
        document.head.appendChild(editorNav);

        const editorRelations=document.createElement('script');
        editorRelations.src='kyv-editor-relations.js';
        editorRelations.async=false;
        editorRelations.dataset.kyvEditorRelations='1';
        document.head.appendChild(editorRelations);

        const editorProjectFields=document.createElement('script');
        editorProjectFields.src='kyv-editor-project-fields.js';
        editorProjectFields.async=false;
        editorProjectFields.dataset.kyvEditorProjectFields='1';
        document.head.appendChild(editorProjectFields);

        const editorInvoiceFields=document.createElement('script');
        editorInvoiceFields.src='kyv-editor-invoice-fields.js';
        editorInvoiceFields.async=false;
        editorInvoiceFields.dataset.kyvEditorInvoiceFields='1';
        document.head.appendChild(editorInvoiceFields);

        const editorPrimaryFields=document.createElement('script');
        editorPrimaryFields.src='kyv-editor-primary-fields.js';
        editorPrimaryFields.async=false;
        editorPrimaryFields.dataset.kyvEditorPrimaryFields='1';
        document.head.appendChild(editorPrimaryFields);
    }

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

    const globalSearch=document.createElement('script');
    globalSearch.src='kyv-global-search-v8.js';
    globalSearch.async=false;
    globalSearch.dataset.kyvGlobalSearchV8='1';
    document.head.appendChild(globalSearch);

    const producer=document.createElement('script');
    producer.src='kyv-producer-mode.js';
    producer.async=false;
    document.head.appendChild(producer);

    const navOrder=document.createElement('script');
    navOrder.src='kyv-nav-order.js';
    navOrder.async=false;
    navOrder.dataset.kyvNavOrder='1';
    document.head.appendChild(navOrder);

    // v2.70: load the shared route contract *before* the workflow nav.
    // Missing this asset makes the v2.69 contextual links silently disappear.
    if(!document.querySelector('script[data-kyv-flow-routes-v269]')){
        const journeyRoutes=document.createElement('script');
        journeyRoutes.src='kyv-flow-routes-v269.js';
        journeyRoutes.async=false;
        journeyRoutes.dataset.kyvFlowRoutesV269='1';
        document.head.appendChild(journeyRoutes);
    }

    const workflowNav=document.createElement('script');
    workflowNav.src='kyv-workflow-nav.js';
    workflowNav.async=false;
    document.head.appendChild(workflowNav);

    if(page==='rendiconto.html'){
        const rights=document.createElement('script');
        rights.src='kyv-rights-v7.js';
        rights.async=false;
        rights.dataset.kyvRightsV7='1';
        document.head.appendChild(rights);
    }

    if(page==='fatture.html'){
        const economy=document.createElement('script');
        economy.src='kyv-economy-v6.js';
        economy.async=false;
        economy.dataset.kyvEconomyV6='1';
        document.head.appendChild(economy);
    }

    if(['pipeline.html','fatture.html','rendiconto.html'].includes(page)){
        const easySecondary=document.createElement('script');
        easySecondary.src='kyv-easy-secondary-v9.js';
        easySecondary.async=false;
        easySecondary.dataset.kyvEasySecondaryV9='1';
        document.head.appendChild(easySecondary);
    }

    if(page==='index.html'||page===''){
        const todayPriority=document.createElement('script');
        todayPriority.src='kyv-today-home-v5.js';
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

        const projectEditSafety=document.createElement('script');
        projectEditSafety.src='kyv-project-edit-safety.js';
        projectEditSafety.async=false;
        projectEditSafety.dataset.kyvProjectEditSafety='1';
        document.head.appendChild(projectEditSafety);

        const projectHubV3=document.createElement('script');
        projectHubV3.src='kyv-project-hub-v3.js';
        projectHubV3.async=false;
        projectHubV3.dataset.kyvProjectHubV3='1';
        document.head.appendChild(projectHubV3);

        const projectTimelineV10=document.createElement('script');
        projectTimelineV10.src='kyv-project-timeline-v10.js';
        projectTimelineV10.async=false;
        projectTimelineV10.dataset.kyvProjectTimelineV10='1';
        document.head.appendChild(projectTimelineV10);

        const easyUxV9=document.createElement('script');
        easyUxV9.src='kyv-easy-ux-v9.js';
        easyUxV9.async=false;
        easyUxV9.dataset.kyvEasyUxV9='1';
        document.head.appendChild(easyUxV9);
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
        const listeningNav=document.createElement('script');
        listeningNav.src='kyv-listening-nav-v2.js';
        listeningNav.async=false;
        listeningNav.dataset.kyvListeningNavV2='1';
        document.head.appendChild(listeningNav);

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
