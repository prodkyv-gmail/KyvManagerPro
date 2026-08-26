// kyv-auth.js - Protezione leggera/passiva per KyvManagerPro
// Non blocca le pagine: mostra stato sessione e abilita logout se Supabase Auth è disponibile.
(function(){
    let client = null;
    let warned = false;

    function isSupabaseLoaded(){
        return !!(window.supabase && typeof window.supabase.createClient === 'function');
    }

    function getClient(options={}){
        if (client) return client;
        if (window.KYV_SUPABASE_CLIENT) { client = window.KYV_SUPABASE_CLIENT; return client; }

        // Se la CDN Supabase non è ancora pronta, non stampare errori in console.
        // Alcune pagine caricano script esterni in ritardo: ritenteremo dopo window.load.
        if (!isSupabaseLoaded()) {
            if (options.log && !warned) { console.info('[KYV_AUTH] Supabase JS non ancora pronto, ritento dopo il caricamento pagina.'); warned = true; }
            return null;
        }

        if (window.KYV && typeof KYV.createSupabaseClient === 'function') {
            try { client = KYV.createSupabaseClient(); return client; }
            catch(e){ if(options.log) console.warn('[KYV_AUTH] Supabase non disponibile', e); return null; }
        }
        if (!window.KYV_CONFIG) return null;
        try {
            client = window.supabase.createClient(window.KYV_CONFIG.SUPABASE_URL, window.KYV_CONFIG.SUPABASE_KEY, { auth:{ storageKey:'kyv-manager-auth-token' } });
            window.KYV_SUPABASE_CLIENT = client;
            return client;
        } catch(e){ if(options.log) console.warn('[KYV_AUTH] Supabase non disponibile', e); return null; }
    }

    async function getSession(){
        const c = getClient();
        if (!c || !c.auth || !c.auth.getSession) return null;
        try { const { data } = await c.auth.getSession(); return data && data.session ? data.session : null; }
        catch(e){ console.warn('[KYV_AUTH] sessione non leggibile', e); return null; }
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
        const c = getClient({log:true});
        if (!c || !c.auth) return;
        await c.auth.signOut();
        if (window.KYV && KYV.showToast) KYV.showToast('Logout effettuato.', 'success');
        setTimeout(()=>{ window.location.href = 'login.html'; }, 400);
    }

    async function requireAuth(options={}){
        const session = await getSession();
        const enabled = !!options.enabled || document.body?.dataset?.authRequired === 'true';
        if (enabled && !session) window.location.href = options.loginUrl || 'login.html';
        return session;
    }

    window.KYV_AUTH = { getSession, bindSidebar, logout, requireAuth };
    document.addEventListener('DOMContentLoaded', bindSidebar);
    window.addEventListener('load', bindSidebar, { once:true });
})();
