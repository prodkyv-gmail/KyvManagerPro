// config.js - Cabina di regia per tutte le chiavi pubbliche del progetto

const KYV_CONFIG = {
    APP_VERSION: '2.28',

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
            // Il deployment precedente non è più disponibile: serve un nuovo /exec valido.
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

// Navigazione incrementale: preserva menu esistente, Pipeline e i vecchi flussi audio.
(function mountKyvNavigation(){
    const version = KYV_CONFIG.APP_VERSION;
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    let observer;

    function makeItem(href, label, icon, active, badge){
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = href;
        a.className = `flex items-center px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${active ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-sm shadow-indigo-500/5' : 'text-kyv-text hover:text-white hover:bg-kyv-border/50 border border-transparent'}`;
        a.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 mr-3 text-cyan-300"></i><span>${label}</span>${badge ? `<span class="ml-auto text-[9px] font-black text-indigo-300/80">${badge}</span>` : ''}`;
        li.appendChild(a);
        return li;
    }

    function syncUi(){
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return false;
        const brandVersion = sidebar.querySelector('h1 + p');
        if (brandVersion && brandVersion.textContent !== `Manager Pro ${version}`) brandVersion.textContent = `Manager Pro ${version}`;

        if (!sidebar.querySelector('a[href="acquisisci_audio.html"]')) {
            const archiveLink = sidebar.querySelector('a[href="archivio_musicale.html"]');
            const anchor = archiveLink?.closest('li');
            if(anchor){
                anchor.insertAdjacentElement('afterend', makeItem('acquisisci_audio.html','Acquisisci audio','link',currentPage==='acquisisci_audio.html','NUOVO'));
                if(window.lucide) lucide.createIcons();
            }
        }
        if (!sidebar.querySelector('a[href="pipeline.html"]')) {
            const projectsLink = sidebar.querySelector('a[href="progetti.html"]');
            const anchor = projectsLink?.closest('li');
            if(anchor){
                anchor.insertAdjacentElement('afterend', makeItem('pipeline.html','Pipeline','columns-3',currentPage==='pipeline.html','2.28'));
                if(window.lucide) lucide.createIcons();
            }
        }
        if(currentPage==='index.html' || currentPage===''){
            const quick = document.querySelector('.kyv-quick-actions');
            if(quick && !quick.querySelector('a[href="acquisisci_audio.html"]')){
                const a=document.createElement('a');a.href='acquisisci_audio.html';
                a.innerHTML='<i data-lucide="link" class="w-4 h-4 mr-2 text-cyan-300"></i>Acquisisci audio';
                quick.prepend(a);if(window.lucide) lucide.createIcons();
            }
            if(quick && !quick.querySelector('a[href="pipeline.html"]')){
                const a=document.createElement('a');a.href='pipeline.html';
                a.innerHTML='<i data-lucide="columns-3" class="w-4 h-4 mr-2 text-fuchsia-300"></i>Pipeline';
                quick.appendChild(a);if(window.lucide) lucide.createIcons();
            }
        }
        document.documentElement.dataset.kyvVersion=version;
        return Boolean(brandVersion && sidebar.querySelector('a[href="pipeline.html"]') && sidebar.querySelector('a[href="acquisisci_audio.html"]'));
    }

    document.addEventListener('DOMContentLoaded',()=>{if(syncUi() && observer)observer.disconnect();});
    observer=new MutationObserver(()=>{if(syncUi())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.setTimeout(()=>observer.disconnect(),5000);
})();

(function loadKyvFeatureModules(){
    const page=(window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if(page==='scheda_progetto.html'){
        const script=document.createElement('script');script.src='kyv-project-hub-v227.js';script.async=false;document.head.appendChild(script);
    }
})();
