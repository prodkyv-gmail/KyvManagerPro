// kyv-auth.js - Protezione centralizzata per KyvManagerPro
// v2.25: usa lo stesso client Supabase dell'app e rende private tutte le pagine operative.
(function(){
    let client = null;
    let warned = false;
    const PUBLIC_PAGES = new Set(['login.html']);

    function currentPage(){
        return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    }

    function isSupabaseLoaded(){
        return !!(window.supabase && typeof window.supabase.createClient === 'function');
    }

    function getClient(options={}){
        if (client) return client;
        if (window.KYV_SUPABASE_CLIENT) {
            client = window.KYV_SUPABASE_CLIENT;
            return client;
        }

        if (!isSupabaseLoaded()) {
            if (options.log && !warned) {
                console.info('[KYV_AUTH] Supabase JS non ancora pronto.');
                warned = true;
            }
            return null;
        }

        if (window.KYV && typeof KYV.createSupabaseClient === 'function') {
            try {
                client = KYV.createSupabaseClient();
                return client;
            } catch (e) {
                if (options.log) console.warn('[KYV_AUTH] Supabase non disponibile', e);
                return null;
            }
        }

        if (!window.KYV_CONFIG) return null;
        try {
            client = window.supabase.createClient(
                window.KYV_CONFIG.SUPABASE_URL,
                window.KYV_CONFIG.SUPABASE_KEY,
                { auth: { storageKey: 'kyv-manager-auth-token' } }
            );
            window.KYV_SUPABASE_CLIENT = client;
            return client;
        } catch (e) {
            if (options.log) console.warn('[KYV_AUTH] Supabase non disponibile', e);
            return null;
        }
    }

    async function waitForClient(maxMs = 3000){
        const start = Date.now();
        while (Date.now() - start < maxMs) {
            const c = getClient();
            if (c) return c;
            await new Promise(resolve => setTimeout(resolve, 80));
        }
        return getClient({ log: true });
    }

    async function getSession(){
        const c = getClient();
        if (!c || !c.auth || !c.auth.getSession) return null;
        try {
            const { data } = await c.auth.getSession();
            return data && data.session ? data.session : null;
        } catch (e) {
            console.warn('[KYV_AUTH] sessione non leggibile', e);
            return null;
        }
    }

    async function bindSidebar(){
        const session = await getSession();
        const btn = document.getElementById('kyv-logout-btn');
        if (btn) {
            btn.classList.toggle('hidden', !session);
            btn.classList.toggle('flex', !!session);
        }
        document.documentElement.dataset.kyvAuth = session ? 'authenticated' : 'anonymous';
    }

    async function logout(){
        const c = await waitForClient();
        if (!c || !c.auth) return;
        await c.auth.signOut();
        if (window.KYV && KYV.showToast) KYV.showToast('Logout effettuato.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 250);
    }

    function authRequired(options={}){
        if (options.enabled === true) return true;
        if (options.enabled === false) return false;
        if (PUBLIC_PAGES.has(currentPage())) return false;
        if (document.body?.dataset?.authRequired === 'false') return false;
        return true;
    }

    function safeNextPage(){
        const page = currentPage();
        return /^[a-z0-9_.-]+\.html$/i.test(page) ? page : 'index.html';
    }

    async function requireAuth(options={}){
        if (!authRequired(options)) return getSession();

        const c = await waitForClient();
        if (!c || !c.auth) {
            console.warn('[KYV_AUTH] Protezione richiesta ma Supabase Auth non è disponibile.');
            window.location.replace(options.loginUrl || 'login.html');
            return null;
        }

        const session = await getSession();
        if (!session) {
            const redirectTo = encodeURIComponent(safeNextPage());
            window.location.replace(`${options.loginUrl || 'login.html'}?next=${redirectTo}`);
            return null;
        }
        return session;
    }

    async function bootstrap(){
        const session = await requireAuth();
        if (authRequired() && !session) return;
        await bindSidebar();
    }

    window.KYV_AUTH = { getClient, getSession, bindSidebar, logout, requireAuth, authRequired };
    document.addEventListener('DOMContentLoaded', bootstrap);
    window.addEventListener('load', bindSidebar, { once: true });
})();
