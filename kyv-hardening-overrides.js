/* KYV runtime hardening overrides — non distruttivo, nessuna nuova tabella. */
(function () {
  'use strict';

  const FOLLOWUP_DAYS = 5;
  const STATUS_ONLY = /^(bozza|demo|registrazione|registrato|registrata|mix|mixaggio|master|mastering|completato|completata|finito|finita|uscita|pubblicato|pubblicata|chiuso|chiusa)$/i;

  function text(value) { return String(value ?? '').trim(); }
  function has(value) { return text(value).length > 0; }
  function timestamp(value) {
    const n = new Date(value || 0).getTime();
    return Number.isFinite(n) ? n : 0;
  }
  function daysSince(value) {
    const n = timestamp(value);
    return n ? Math.max(0, Math.floor((Date.now() - n) / 86400000)) : 0;
  }
  function view() {
    try { return typeof state !== 'undefined' ? state?.currentView || null : null; } catch (_) { return null; }
  }
  function audioRows(matches) {
    const rows = [...(matches?.audio || []), ...(matches?.consegne || [])];
    const seen = new Set();
    return rows.filter((row, index) => {
      const key = text(row?.ID_VERSIONE || row?.ID_FILE || row?.ID_CONSEGNA || row?.LINK_FILE || row?.Link_Drive || row?.Link_Dropbox || `row-${index}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function pitchState(row) {
    const raw = text(row?.Stato).toLowerCase();
    if (/interessat|confermat|approvat|accettat|scelt/.test(raw)) return 'interested';
    if (/revision|feedback|comment/.test(raw)) return 'revision';
    if (/chius|non interess|rifiut|declin|(^|\s|\/)(no|pass)(\s|$)/.test(raw)) return 'closed';
    const activity = row?.Data_Conferma || row?.Data_Invio || row?.updated_at || row?.created_at;
    return daysSince(activity) >= FOLLOWUP_DAYS ? 'due' : 'waiting';
  }
  function concreteAction(current) {
    const p = current?.p || {};
    const matches = current?.matches || {};
    const versions = audioRows(matches);
    const invii = matches.invii || [];
    const due = invii.find(row => pitchState(row) === 'due');
    if (due) return {
      title: `Sollecita ${text(due.Destinatario) || 'il destinatario'}`,
      detail: `${daysSince(due.Data_Conferma || due.Data_Invio)} giorni senza aggiornamenti.`,
      target: 'kyv-project-v2-pitch', tone: 'due'
    };

    const explicit = text(p.SVILUPPO);
    if (explicit && !STATUS_ONLY.test(explicit)) return {
      title: explicit,
      detail: 'Prossima azione indicata nel progetto.',
      target: 'kyv-project-v2-versions', tone: 'active'
    };

    if (!has(p.Data_Sessione)) return {
      title: 'Programma la prossima sessione',
      detail: 'Manca una data sessione: impostala per dare al progetto un prossimo passo concreto.',
      target: 'tab-timeline', tone: 'active'
    };
    if (!versions.length) return {
      title: 'Aggiungi la prima versione',
      detail: 'Collega una demo da Drive o Dropbox per iniziare la storia del brano.',
      target: 'kyv-project-v2-versions', tone: 'active'
    };
    if (!invii.length) return {
      title: 'Registra il primo invio',
      detail: 'La versione più recente è pronta per essere tracciata in Invii & Follow-up.',
      target: 'kyv-project-v2-pitch', tone: 'active'
    };
    const open = invii.find(row => ['waiting', 'revision'].includes(pitchState(row)));
    if (open) return {
      title: `Attendi risposta da ${text(open.Destinatario) || 'destinatario'}`,
      detail: 'Il follow-up scatta dopo 5 giorni senza attività.',
      target: 'kyv-project-v2-pitch', tone: 'waiting'
    };
    if (!has(p.Data_Consegna_Master)) return {
      title: 'Conferma la versione finale',
      detail: 'Indica il master o registra la data di consegna.',
      target: 'kyv-project-v2-release', tone: 'active'
    };
    if (!has(p.Codice_ISRC) || !has(p.Data_Pubblicazione)) return {
      title: 'Completa il Release Desk',
      detail: 'Chiudi i dati mancanti prima della pubblicazione.',
      target: 'kyv-project-v2-release', tone: 'active'
    };
    return {
      title: 'Progetto allineato',
      detail: 'Nessuna urgenza operativa rilevata.',
      target: 'kyv-project-v2-timeline', tone: 'ready'
    };
  }

  function fixIcons(root = document) {
    root.querySelectorAll?.('[data-lucide="message-circle-clock"]').forEach(el => el.setAttribute('data-lucide', 'message-square-text'));
  }

  function fixChecklist(current) {
    const panel = document.getElementById('tab-checklist');
    if (!panel) return;
    panel.querySelectorAll('p.font-bold').forEach(node => {
      if (text(node.textContent) === 'Data sessione compilata') {
        node.textContent = has(current?.p?.Data_Sessione) ? 'Data sessione: compilata' : 'Data sessione: da compilare';
      }
    });
  }

  function applyProjectAction() {
    const current = view();
    const box = document.getElementById('kyv-v2-next');
    if (!current || !box) return;
    const action = concreteAction(current);
    const strong = box.querySelector('strong');
    const paragraphs = box.querySelectorAll('p');
    if (strong && strong.textContent !== action.title) strong.textContent = action.title;
    if (paragraphs[1] && paragraphs[1].textContent !== action.detail) paragraphs[1].textContent = action.detail;
    box.classList.toggle('due', action.tone === 'due');
    box.classList.toggle('ready', action.tone === 'ready');
    const oldButton = box.querySelector('[data-v2-next]');
    if (oldButton && oldButton.dataset.hardeningTarget !== action.target) {
      const button = oldButton.cloneNode(true);
      button.dataset.hardeningTarget = action.target;
      oldButton.replaceWith(button);
      button.addEventListener('click', () => document.getElementById(action.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
    fixChecklist(current);
  }

  function apply() {
    fixIcons();
    applyProjectAction();
    if (window.lucide) {
      try { lucide.createIcons(); } catch (_) {}
    }
  }

  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(apply, 40);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('kyv:project-v2-ready', schedule);
  window.addEventListener('kyv:pitch-updated', schedule);
  window.KYV_HARDENING = { apply, concreteAction };
})();
