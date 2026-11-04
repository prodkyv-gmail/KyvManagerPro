// menu.js - Navigazione globale KYV Studio Manager Pro
// v2.9.8: sidebar semplificata con sole sezioni principali. Le funzioni avanzate restano accessibili da App Launcher, Panoramica e Scheda Progetto.

if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = 'manifest.json';
    document.head.appendChild(manifestLink);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('✅ Service Worker KYV registrato'))
            .catch(err => console.error('❌ Errore Service Worker:', err));
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

function showInstallButton() {
    const installBtn = document.getElementById('install-pwa-btn');
    if (installBtn) installBtn.classList.remove('hidden');
}

async function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('KYV Studio installata.');
    deferredPrompt = null;
    const installBtn = document.getElementById('install-pwa-btn');
    if (installBtn) installBtn.classList.add('hidden');
}

function toggleMobileMenu(force) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    if (!sidebar || !overlay) return;
    const open = typeof force === 'boolean' ? force : sidebar.classList.contains('-translate-x-full');
    sidebar.classList.toggle('-translate-x-full', !open);
    overlay.classList.toggle('hidden', !open);
    overlay.setAttribute('aria-hidden', String(!open));
    document.querySelectorAll('button[onclick="toggleMobileMenu()"]').forEach(button => {
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-controls', 'sidebar');
        if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', 'Apri o chiudi menu');
    });
    if (open) sidebar.querySelector('nav a')?.focus({ preventScroll: true });
}


/* Shared contextual help owns its focus rather than leaking keyboard input to the page. */
let kyvHelpFocusReturn = null;
function openHelpModal() {
    const modal = document.getElementById('kyv-help-modal');
    if (!modal || !modal.classList.contains('hidden')) return;
    kyvHelpFocusReturn = document.activeElement;
    modal.classList.remove('hidden');
    modal.querySelector('button[aria-label="Chiudi guida"]')?.focus();
}

function closeHelpModal() {
    const modal = document.getElementById('kyv-help-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    if (kyvHelpFocusReturn?.isConnected) kyvHelpFocusReturn.focus();
    kyvHelpFocusReturn = null;
}

function renderKyvMobileBottomNav(activePage = 'dashboard') {
    const old = document.getElementById('kyv-mobile-bottom-nav');
    if (old) old.remove();

    const items = [
        { page: 'dashboard', href: 'index.html', label: 'Home', icon: 'layout-dashboard' },
        { page: 'calendar', href: 'kyv_calendar.html', label: 'Agenda', icon: 'calendar-days' },
        { page: 'nuovo', href: 'acquisisci_audio.html', label: 'Nuovo', icon: 'folder-plus' },
        { page: 'progetti', href: 'progetti.html', label: 'Progetti', icon: 'music' },
        { page: 'ascolto', href: 'ascolto.html', label: 'Ascolto', icon: 'headphones' },
    ];

    const nav = document.createElement('nav');
    nav.id = 'kyv-mobile-bottom-nav';
    nav.className = 'kyv-mobile-bottom-nav md:hidden';
    nav.setAttribute('aria-label', 'Navigazione principale mobile');
    nav.innerHTML = items.map(item => `
        <a href="${item.href}" class="${activePage === item.page ? 'is-active' : ''}" aria-label="${item.label}" ${activePage === item.page ? 'aria-current="page"' : ''}>
            <i data-lucide="${item.icon}"></i>
            <span>${item.label}</span>
        </a>
    `).join('');
    document.body.appendChild(nav);
}

function getKyvHelpContent(activePage) {
    if (window.KYV_HELP && typeof window.KYV_HELP.getContent === 'function') {
        return window.KYV_HELP.getContent(activePage);
    }
    return {
        title: 'Manuale & Guida',
        content: `<div class="space-y-5">
            <div class="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6">
                <h4 class="text-xl font-black text-white mb-3">Guida contestuale</h4>
                <p class="text-kyv-text leading-relaxed">Il file <b class="text-white">kyv-help.js</b> non è ancora caricato. La navigazione funziona comunque, ma il popup dettagliato richiede questo file nella cartella principale.</p>
            </div>
            <a href="guida.html" class="inline-flex items-center px-4 py-2 rounded-lg border border-indigo-500/30 bg-indigo-600/10 text-indigo-300 font-bold">Apri manuale completo</a>
        </div>`
    };
}

function inferKyvPageFromPath() {
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const pages = {
        'index.html': 'dashboard',
        'scheda_progetto.html': 'scheda',
        'kyv_dropbox.html': 'dropbox',
        'kyv_drive.html': 'drive',
        'kyv_calendar.html': 'calendar',
        'login.html': 'login'
    };
    return pages[file] || file.replace(/\.html$/, '') || 'dashboard';
}

function mountKyvContextHelp(activePage = inferKyvPageFromPath()) {
    const selectedHelp = getKyvHelpContent(activePage);
    document.getElementById('kyv-help-modal')?.remove();
    document.getElementById('kyv-context-help-fab')?.remove();

    const modalHTML = `
        <div id="kyv-help-modal" class="fixed inset-0 bg-black/80 z-[100] hidden flex items-center justify-center p-4 md:p-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="kyv-help-title">
            <div class="bg-kyv-bg border border-kyv-border rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
                <div class="flex items-center justify-between p-5 md:p-6 border-b border-kyv-border bg-[#0f111a] shrink-0">
                    <h2 id="kyv-help-title" class="text-xl md:text-2xl font-black text-white flex items-center min-w-0">
                        <i data-lucide="book-open" class="w-6 h-6 md:w-7 md:h-7 mr-3 text-indigo-400 shrink-0"></i>
                        <span class="truncate">${selectedHelp.title}</span>
                    </h2>
                    <button onclick="closeHelpModal()" aria-label="Chiudi guida" class="text-kyv-text hover:text-white bg-kyv-card hover:bg-rose-500/20 p-2 rounded-lg transition-colors border border-kyv-border hover:border-rose-500/50">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar bg-kyv-bg">${selectedHelp.content}</div>
                <div class="p-4 border-t border-kyv-border bg-kyv-card flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shrink-0">
                    <a href="guida.html" class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-indigo-500/30 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 text-sm font-bold transition-colors">
                        <i data-lucide="book-open" class="w-4 h-4 mr-2"></i> Apri manuale completo
                    </a>
                    <button onclick="closeHelpModal()" class="px-6 py-2 bg-kyv-border hover:bg-kyv-text text-white rounded-lg transition-colors font-medium text-sm">Ho capito</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const fab = document.createElement('button');
    fab.id = 'kyv-context-help-fab';
    fab.type = 'button';
    fab.className = 'kyv-context-help-fab';
    fab.setAttribute('aria-label', `Apri guida contestuale: ${selectedHelp.title}`);
    fab.setAttribute('title', 'Guida di questa pagina');
    fab.textContent = '?';
    fab.addEventListener('click', openHelpModal);
    document.body.appendChild(fab);

    const modal = document.getElementById('kyv-help-modal');
    modal?.addEventListener('click', event => {
        if (event.target === modal) closeHelpModal();
    });
    if (window.lucide) lucide.createIcons({ root: modal });
}

function loadKyvSidebar(activePage = 'dashboard') {
    const container = document.getElementById('kyv-sidebar-container');
    if (!container) return;

    const activeAliases = {
        dashboard: ['dashboard', 'sessioni', 'scheda', 'protezione', 'report'],
        assistente: ['assistente'],
        archivio: ['archivio'],
        progetti: ['progetti'],
        clienti: ['clienti'],
        fatture: ['fatture', 'correlazione'],
        intelligence: ['intelligence'],
        analyst: ['analyst'],
        returns: ['returns'],
        liquidazioni: ['liquidazioni'],
        editor: ['editor'],
        fisco: ['fisco'],
        quote: ['quote', 'autori'],
        rendiconto: ['rendiconto'],
        calendar: ['calendar'],
        creative: ['creative'],
        audiofinder: ['audiofinder'],
        nuovo: ['nuovo'],
        integrazioni: ['integrazioni', 'dropbox', 'drive'],
        ascolto: ['ascolto'],
        importexport: ['importexport'],
        guida: ['guida'],
        diagnostica: ['diagnostica'],
        dataquality: ['data-quality'],
        spese: ['spese', 'documenti']
    };

    const isActive = (page) => (activeAliases[page] || [page]).includes(activePage)
        ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-sm shadow-indigo-500/5'
        : 'text-kyv-text hover:text-white hover:bg-kyv-border/50 border border-transparent';

    const navItem = (page, href, icon, label, accent = '') => `
        <li>
            <a href="${href}" ${((activeAliases[page] || [page]).includes(activePage)) ? 'aria-current="page"' : ''} class="flex items-center px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${isActive(page)}">
                <i data-lucide="${icon}" class="w-4 h-4 mr-3 ${accent}"></i>
                <span>${label}</span>
            </a>
        </li>`;

    const groupIsOpen = (pages) => pages.some(page => (activeAliases[page] || [page]).includes(activePage));

    const sidebarHTML = `
        <div id="mobile-sidebar-overlay" aria-hidden="true" class="fixed inset-0 bg-black/80 z-40 hidden md:hidden" onclick="toggleMobileMenu()"></div>

        <aside id="sidebar" aria-label="Menu principale KYV" class="w-64 bg-kyv-card border-r border-kyv-border flex flex-col flex-shrink-0 z-50 absolute md:relative h-full transition-transform duration-300 -translate-x-full md:translate-x-0">
            <div class="h-20 flex items-center px-5 border-b border-kyv-border justify-between shrink-0">
                <a href="index.html" class="flex items-center min-w-0">
                    <div class="kyv-brand-mark w-9 h-9 rounded-xl flex items-center justify-center mr-3 font-black text-white shrink-0">K</div>
                    <div class="min-w-0">
                        <h1 class="font-bold text-lg leading-tight tracking-wide text-white truncate">KYV Studio</h1>
                        <p class="text-[10px] text-indigo-300 font-semibold tracking-widest uppercase">Manager Pro ${window.KYV_CONFIG?.APP_VERSION || ''}</p>
                    </div>
                </a>
                <button class="md:hidden text-kyv-text" onclick="toggleMobileMenu()"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>

            <nav class="flex-1 overflow-y-auto py-4 custom-scrollbar px-3 space-y-3">
                <div>
                    <p class="px-3 text-[10px] font-black text-kyv-text uppercase tracking-wider mb-2">Ogni giorno</p>
                    <ul class="space-y-1">
                        ${navItem('dashboard', 'index.html', 'layout-dashboard', 'Oggi')}
                        ${navItem('calendar', 'kyv_calendar.html', 'calendar-days', 'Agenda', 'text-blue-300')}
                        ${navItem('nuovo', 'acquisisci_audio.html', 'folder-plus', 'Nuovo progetto', 'text-cyan-300')}
                        ${navItem('assistente', 'assistente.html', 'route', 'Percorso brano', 'text-violet-300')}
                        ${navItem('archivio', 'archivio_musicale.html', 'folder-search-2', 'Archivio musicale', 'text-cyan-300')}
                        ${navItem('progetti', 'progetti.html', 'music-2', 'Progetti', 'text-indigo-300')}
                        ${navItem('creative', 'kyv_scrivania_creativa.html', 'calendar-range', 'Scrivania creativa', 'text-cyan-300')}
                        ${navItem('audiofinder', 'kyv_audio_finder.html', 'search-check', 'Audio Finder', 'text-emerald-300')}
                        ${navItem('clienti', 'clienti.html', 'users', 'Contatti', 'text-sky-300')}
                        ${navItem('ascolto', 'ascolto.html', 'headphones', 'Ascolto', 'text-violet-300')}
                        ${navItem('integrazioni', 'integrazioni.html', 'grid-3x3', 'Tutte le app', 'text-emerald-300')}
                    </ul>
                </div>

                <details class="kyv-nav-group" ${groupIsOpen(['fatture', 'intelligence', 'analyst', 'returns', 'liquidazioni', 'spese', 'fisco', 'quote', 'rendiconto']) ? 'open' : ''}>
                    <summary>
                        <i data-lucide="landmark"></i>
                        <span>Amministrazione</span>
                        <i data-lucide="chevron-down" class="kyv-chevron w-4 h-4"></i>
                    </summary>
                    <ul class="space-y-1">
                        ${navItem('fatture', 'fatture.html', 'receipt', 'Fatture emesse', 'text-emerald-300')}
                        ${navItem('intelligence', 'kyv_intelligence.html', 'chart-no-axes-combined', 'KYV Intelligence')}
                        ${navItem('analyst', 'kyv_analyst.html', 'brain-circuit', 'KYV Analyst')}
                        ${navItem('returns', 'kyv_ritorni_progetti.html', 'chart-column', 'Ritorno dei progetti')}
                        ${navItem('liquidazioni', 'kyv_liquidazioni.html', 'landmark', 'Liquidazioni SIAE / IMAIE')}
                        ${navItem('spese', 'documenti.html?tab=spese', 'receipt-euro', 'Spese', 'text-amber-300')}
                        ${navItem('fisco', 'fisco.html', 'calculator', 'Piano Fiscale', 'text-amber-400')}
                        ${navItem('quote', 'quote.html', 'pie-chart', 'Quote per Opera', 'text-violet-300')}
                        ${navItem('rendiconto', 'rendiconto.html', 'bar-chart-2', 'Rendiconto SIAE', 'text-cyan-300')}
                    </ul>
                </details>

                <details class="kyv-nav-group" ${groupIsOpen(['integrazioni', 'editor', 'importexport', 'diagnostica', 'dataquality', 'guida']) ? 'open' : ''}>
                    <summary>
                        <i data-lucide="wrench"></i>
                        <span>Strumenti</span>
                        <i data-lucide="chevron-down" class="kyv-chevron w-4 h-4"></i>
                    </summary>
                    <ul class="space-y-1">
                        ${navItem('editor', 'editor.html', 'database', 'Studio Editor')}
                        ${navItem('importexport', 'importexport.html', 'arrow-down-up', 'Import / Export', 'text-purple-300')}
                        ${navItem('diagnostica', 'diagnostica.html', 'activity', 'Diagnostica', 'text-cyan-300')}
                        ${navItem('dataquality', 'data_quality.html', 'list-checks', 'Qualità dati', 'text-amber-300')}
                        ${navItem('guida', 'guida.html', 'book-open', 'Manuale', 'text-amber-300')}
                    </ul>
                </details>
            </nav>

            <div class="p-3 border-t border-kyv-border bg-kyv-bg/50 shrink-0 flex gap-2">
                <button id="install-pwa-btn" onclick="installPWA()" class="hidden flex items-center justify-center w-full px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl transition-colors group">
                    <i data-lucide="download" class="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"></i>
                    <span class="font-bold text-sm">Installa App</span>
                </button>
                <button id="kyv-logout-btn" onclick="window.KYV_AUTH && KYV_AUTH.logout()" aria-label="Esci" title="Esci" class="hidden items-center justify-center w-10 h-10 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-300 rounded-xl transition-colors group">
                    <i data-lucide="log-out" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                </button>
            </div>
        </aside>
    `;

    container.innerHTML = sidebarHTML;
    renderKyvMobileBottomNav(activePage);
    if (deferredPrompt) showInstallButton();

    window.KYV_ACTIVE_HELP_PAGE = activePage;
    mountKyvContextHelp(activePage);
    ensureKyvHelpLoaded();

    if (window.lucide) lucide.createIcons();
    if (window.KYV_AUTH && typeof KYV_AUTH.bindSidebar === 'function') KYV_AUTH.bindSidebar();
    document.dispatchEvent(new Event('kyv:sidebar-ready'));
}

document.addEventListener('keydown', event => {
    const help = document.getElementById('kyv-help-modal');
    const helpOpen = Boolean(help && !help.classList.contains('hidden'));
    if (helpOpen && event.key === 'Tab') {
        const buttons = [...help.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')]
            .filter(el => el.getClientRects().length > 0);
        if (buttons.length) {
            const first=buttons[0],last=buttons[buttons.length-1],current=document.activeElement;
            if (event.shiftKey && (current===first || !help.contains(current))) {
                event.preventDefault();last.focus();
            } else if (!event.shiftKey && (current===last || !help.contains(current))) {
                event.preventDefault();first.focus();
            }
        }
        return;
    }
    if (event.key !== 'Escape') return;
    if (helpOpen) {
        event.preventDefault();
        closeHelpModal();
        return;
    }
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
        toggleMobileMenu(false);
        document.querySelector('main button[onclick="toggleMobileMenu()"]')?.focus({ preventScroll: true });
    }
});

// Carica il manuale contestuale una sola volta anche nelle pagine che includono solo menu.js.
function ensureKyvHelpLoaded() {
    if (window.KYV_HELP?.getContent) return;
    if (document.querySelector('script[data-kyv-help-loader]')) return;
    const script = document.createElement('script');
    script.src = 'kyv-help.js';
    script.async = true;
    script.dataset.kyvHelpLoader = '1';
    script.onload = () => {
        mountKyvContextHelp(window.KYV_ACTIVE_HELP_PAGE || inferKyvPageFromPath());
    };
    script.onerror = () => {
        console.warn('[KYV] Guida contestuale non disponibile: apri guida.html');
    };
    document.head.appendChild(script);
}
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('kyv-context-help-fab')) {
        mountKyvContextHelp(window.KYV_ACTIVE_HELP_PAGE || inferKyvPageFromPath());
    }
    ensureKyvHelpLoaded();
});
