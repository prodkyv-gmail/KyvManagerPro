/* KYV Calendar safety guard — evita freeze e sync automatiche pesanti. */
(function () {
  'use strict';

  const page = (location.pathname.split('/').pop() || '').toLowerCase();
  if (page !== 'kyv_calendar.html') return;

  const MAX_EVENTS = 120;
  const NativeMutationObserver = window.MutationObserver;

  // Agenda Phase 5 deve reagire solo quando cambia la lista degli eventi,
  // non alle mutazioni interne generate da badge e icone Lucide.
  if (NativeMutationObserver && !window.__KYV_CALENDAR_MO_GUARD__) {
    window.__KYV_CALENDAR_MO_GUARD__ = true;
    window.MutationObserver = new Proxy(NativeMutationObserver, {
      construct(Target, args) {
        const observer = new Target(...args);
        const nativeObserve = observer.observe.bind(observer);
        observer.observe = (target, options = {}) => {
          if (target && target.id === 'events-list' && options.subtree) {
            return nativeObserve(target, { ...options, subtree: false });
          }
          return nativeObserve(target, options);
        };
        return observer;
      }
    });
  }

  function installCalendarGuard() {
    const btn = document.getElementById('btn-sync');
    const list = document.getElementById('events-list');
    const lastSync = document.getElementById('last-sync');

    // kyv_calendar.html avvia DOM.btnSync.click() dopo 300 ms.
    // Ignoriamo soltanto quel primo click programmatico; i click reali dell'utente
    // continuano a generare normalmente l'evento click del bottone.
    if (btn && btn.dataset.kyvCalendarSafe !== '1') {
      btn.dataset.kyvCalendarSafe = '1';
      const nativeClick = btn.click.bind(btn);
      let suppressFirstProgrammaticClick = true;
      btn.click = function () {
        if (suppressFirstProgrammaticClick) {
          suppressFirstProgrammaticClick = false;
          return;
        }
        return nativeClick();
      };
      setTimeout(() => { suppressFirstProgrammaticClick = false; }, 1500);
    }

    if (list && /Sincronizzazione in corso/i.test(list.textContent || '')) {
      list.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-kyv-text opacity-70 text-center p-8"><p class="text-sm font-bold text-white">Agenda pronta</p><p class="text-xs mt-2">Premi “Aggiorna agenda” per caricare gli appuntamenti di Google Calendar.</p></div>';
    }
    if (lastSync && /In attesa/i.test(lastSync.textContent || '')) lastSync.textContent = 'Pronto';

    // Limita il lavoro sincrono di rendering se Google restituisce uno storico molto grande.
    const bridge = window.KYV_DRIVE;
    if (bridge && typeof bridge.fetchJson === 'function' && !bridge.__kyvCalendarSafeWrapped) {
      const originalFetchJson = bridge.fetchJson.bind(bridge);
      bridge.fetchJson = async function (account, action, params) {
        const data = await originalFetchJson(account, action, params);
        if (action === 'getEvents' && data && Array.isArray(data.events) && data.events.length > MAX_EVENTS) {
          return {
            ...data,
            events: data.events.slice(0, MAX_EVENTS),
            totalEvents: data.events.length,
            truncated: true
          };
        }
        return data;
      };
      bridge.__kyvCalendarSafeWrapped = true;
    }
  }

  // Il listener inline della pagina viene registrato durante il parsing e programma
  // il click automatico con setTimeout(300). Installando la guard nello stesso
  // DOMContentLoaded arriviamo comunque prima di quel timeout.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installCalendarGuard, { once: true });
  } else {
    installCalendarGuard();
  }
})();
