// kyv-calendar-views.js - Viste Elenco / Settimana / Mese per l'Agenda.
// Usa gli stessi eventi già letti da "Aggiorna agenda" (evento "kyv:calendar-events").
// I titoli arrivano da Google Calendar: la griglia li scrive solo con textContent, mai con innerHTML.
(function (root) {
  'use strict';

  var STORAGE_KEY = 'kyv_calendar_view_v1';
  var VIEWS = ['list', 'week', 'month'];
  var DAY_MS = 86400000;
  var cachedEvents = [];

  function pad(n) { return String(n).padStart(2, '0'); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  // La settimana italiana parte dal lunedì.
  function weekStart(d) { var s = startOfDay(d); return addDays(s, -((s.getDay() + 6) % 7)); }

  function monthMatrix(anchor) {
    var first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    var last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    var start = weekStart(first);
    var rows = Math.round((weekStart(last) - start) / DAY_MS / 7) + 1;
    var out = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < 7; c++) {
        var d = addDays(start, r * 7 + c);
        row.push({ date: d, key: dayKey(d), inMonth: d.getMonth() === anchor.getMonth() });
      }
      out.push(row);
    }
    return out;
  }

  // "2026-11-06" senza ora = evento di tutto il giorno, letto come data locale (non UTC).
  function parseEventDate(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : { date: value, allDay: false };
    var s = String(value == null ? '' : value).trim();
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return { date: new Date(+m[1], +m[2] - 1, +m[3]), allDay: true };
    var d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : { date: d, allDay: false };
  }

  function normalizeEvents(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (ev) {
      var p = parseEventDate(ev && ev.date);
      if (!p) return;
      out.push({ date: p.date, allDay: p.allDay, title: String((ev && ev.title) || 'Senza titolo'), key: dayKey(p.date) });
    });
    return out.sort(function (a, b) { return a.date - b.date; });
  }

  function groupByDay(events) {
    var map = {};
    events.forEach(function (ev) { (map[ev.key] = map[ev.key] || []).push(ev); });
    return map;
  }

  function shiftAnchor(anchor, view, dir) {
    if (view === 'week') return addDays(anchor, 7 * dir);
    return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  }

  function rangeLabel(anchor, view) {
    if (view === 'month') {
      var m = anchor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      return m.charAt(0).toUpperCase() + m.slice(1);
    }
    var a = weekStart(anchor), b = addDays(a, 6);
    var left = a.toLocaleDateString('it-IT', a.getMonth() === b.getMonth() ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
    var right = b.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    return left + ' – ' + right;
  }

  function timeLabel(ev) {
    return ev.allDay ? 'Tutto il giorno' : ev.date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  var helpers = {
    weekStart: weekStart, monthMatrix: monthMatrix, parseEventDate: parseEventDate,
    normalizeEvents: normalizeEvents, groupByDay: groupByDay, shiftAnchor: shiftAnchor,
    rangeLabel: rangeLabel, dayKey: dayKey, VIEWS: VIEWS
  };

  // ---------- Interfaccia (solo nel browser) ----------
  function el(doc, tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function readView() {
    try { var v = root.localStorage && root.localStorage.getItem(STORAGE_KEY); if (VIEWS.indexOf(v) >= 0) return v; } catch (e) { /* storage non disponibile */ }
    return 'list';
  }
  function saveView(v) { try { if (root.localStorage) root.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* ignora */ } }

  function injectStyle(doc) {
    if (doc.getElementById('kyv-calendar-views-style')) return;
    var s = doc.createElement('style');
    s.id = 'kyv-calendar-views-style';
    s.textContent = [
      '.kyv-cal-bar{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;justify-content:space-between;padding:.7rem 1rem;border-bottom:1px solid var(--kyv-border,rgba(255,255,255,.085))}',
      '.kyv-cal-group{display:inline-flex;gap:.25rem;padding:.2rem;border:1px solid var(--kyv-border,rgba(255,255,255,.085));border-radius:.7rem;background:rgba(255,255,255,.03)}',
      '.kyv-cal-btn{border:0;background:transparent;color:var(--kyv-muted,#969eae);font:600 12.5px/1 inherit;padding:.5rem .75rem;border-radius:.5rem;cursor:pointer;min-height:34px}',
      '.kyv-cal-btn:hover{color:var(--kyv-text,#f5f7fb)}',
      '.kyv-cal-btn[aria-pressed="true"]{background:var(--kyv-primary-strong,#6f65f4);color:#fff}',
      '.kyv-cal-nav{display:inline-flex;align-items:center;gap:.4rem}',
      '.kyv-cal-label{min-width:9.5rem;text-align:center;font-weight:800;font-size:14px;color:var(--kyv-text,#f5f7fb)}',
      '.kyv-cal-grid{flex:1;min-height:0;overflow:auto;padding:1rem}',
      '.kyv-cal-note{margin:0 0 .8rem;font-size:12.5px;color:var(--kyv-muted,#969eae)}',
      '.kyv-cal-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.5rem}',
      '.kyv-cal-daycol,.kyv-cal-cell{border:1px solid var(--kyv-border,rgba(255,255,255,.085));border-radius:.7rem;background:var(--kyv-surface,#171b25);min-width:0}',
      '.kyv-cal-daycol{padding:.55rem;display:flex;flex-direction:column;gap:.4rem;min-height:9rem}',
      '.is-today{border-color:var(--kyv-primary,#8b83ff)!important;box-shadow:0 0 0 1px var(--kyv-primary,#8b83ff) inset}',
      '.kyv-cal-dayhead{display:flex;align-items:baseline;gap:.4rem;color:var(--kyv-muted,#969eae);font-size:12px;text-transform:uppercase;font-weight:700}',
      '.kyv-cal-daynum{font-size:18px;font-weight:900;color:var(--kyv-text,#f5f7fb)}',
      '.kyv-cal-ev{display:block;padding:.35rem .45rem;border-radius:.5rem;background:rgba(139,131,255,.12);border:1px solid rgba(139,131,255,.22);font-size:12px;line-height:1.25;color:var(--kyv-text,#f5f7fb);overflow-wrap:anywhere}',
      '.kyv-cal-ev b{display:block;font-size:11.5px;color:#c9c5ff;font-weight:700}',
      '.kyv-cal-empty{font-size:12px;color:var(--kyv-muted,#969eae);opacity:.6}',
      '.kyv-cal-month{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.35rem}',
      '.kyv-cal-wd{font-size:11.5px;text-transform:uppercase;font-weight:800;text-align:center;color:var(--kyv-muted,#969eae);padding:.2rem 0}',
      '.kyv-cal-cell{padding:.4rem;min-height:5.6rem;text-align:left;cursor:pointer;color:inherit;font:inherit;display:flex;flex-direction:column;gap:.25rem}',
      '.kyv-cal-cell:hover{border-color:var(--kyv-primary,#8b83ff)}',
      '.kyv-cal-cell.is-out{opacity:.42}',
      '.kyv-cal-cell .kyv-cal-ev{padding:.2rem .35rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.kyv-cal-more{font-size:11.5px;color:var(--kyv-muted,#969eae)}',
      '.kyv-cal-count{display:none;font-size:11.5px;font-weight:800;color:#c9c5ff}',
      '@media(max-width:700px){.kyv-cal-week{grid-template-columns:1fr}.kyv-cal-daycol{min-height:0}',
      '.kyv-cal-cell{min-height:3.6rem;align-items:center}.kyv-cal-cell .kyv-cal-ev,.kyv-cal-cell .kyv-cal-more{display:none}.kyv-cal-count{display:block}',
      '.kyv-cal-label{min-width:0;flex:1}}'
    ].join('');
    doc.head.appendChild(s);
  }

  function init(doc) {
    var main = doc.querySelector('.kyv-calendar-main');
    var list = doc.getElementById('events-list');
    if (!main || !list || main.dataset.kyvViews === '1') return false;
    main.dataset.kyvViews = '1';
    injectStyle(doc);

    var state = { view: readView(), anchor: startOfDay(new Date()), events: cachedEvents };

    var bar = el(doc, 'div', 'kyv-cal-bar');
    var group = el(doc, 'div', 'kyv-cal-group');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Vista agenda');
    var buttons = {};
    [['list', 'Elenco'], ['week', 'Settimana'], ['month', 'Mese']].forEach(function (pair) {
      var b = el(doc, 'button', 'kyv-cal-btn', pair[1]);
      b.type = 'button';
      b.dataset.view = pair[0];
      b.addEventListener('click', function () { setView(pair[0]); });
      buttons[pair[0]] = b;
      group.appendChild(b);
    });
    var nav = el(doc, 'div', 'kyv-cal-nav');
    var prev = el(doc, 'button', 'kyv-cal-btn', '‹'); prev.type = 'button'; prev.setAttribute('aria-label', 'Periodo precedente');
    var today = el(doc, 'button', 'kyv-cal-btn', 'Oggi'); today.type = 'button';
    var next = el(doc, 'button', 'kyv-cal-btn', '›'); next.type = 'button'; next.setAttribute('aria-label', 'Periodo successivo');
    var label = el(doc, 'span', 'kyv-cal-label');
    label.setAttribute('aria-live', 'polite');
    [prev, label, next, today].forEach(function (n) { nav.appendChild(n); });
    bar.appendChild(group);
    bar.appendChild(nav);

    var grid = el(doc, 'div', 'kyv-cal-grid custom-scrollbar');
    grid.id = 'kyv-cal-grid';

    var header = main.firstElementChild;
    if (header) header.after(bar); else main.insertBefore(bar, main.firstChild);
    list.after(grid);

    prev.addEventListener('click', function () { state.anchor = shiftAnchor(state.anchor, state.view, -1); render(); });
    next.addEventListener('click', function () { state.anchor = shiftAnchor(state.anchor, state.view, 1); render(); });
    today.addEventListener('click', function () { state.anchor = startOfDay(new Date()); render(); });

    function openWeekOf(date) { state.anchor = date; setView('week'); }

    function renderWeek() {
      var byDay = groupByDay(state.events), start = weekStart(state.anchor), todayKey = dayKey(new Date());
      var wrap = el(doc, 'div', 'kyv-cal-week');
      for (var i = 0; i < 7; i++) {
        var d = addDays(start, i), key = dayKey(d);
        var col = el(doc, 'div', 'kyv-cal-daycol' + (key === todayKey ? ' is-today' : ''));
        var head = el(doc, 'div', 'kyv-cal-dayhead');
        head.appendChild(el(doc, 'span', '', d.toLocaleDateString('it-IT', { weekday: 'short' })));
        head.appendChild(el(doc, 'span', 'kyv-cal-daynum', String(d.getDate())));
        col.appendChild(head);
        var evs = byDay[key] || [];
        if (!evs.length) col.appendChild(el(doc, 'span', 'kyv-cal-empty', 'Nessun evento'));
        evs.forEach(function (ev) {
          var item = el(doc, 'div', 'kyv-cal-ev');
          item.appendChild(el(doc, 'b', '', timeLabel(ev)));
          item.appendChild(doc.createTextNode(ev.title));
          col.appendChild(item);
        });
        wrap.appendChild(col);
      }
      grid.appendChild(wrap);
    }

    function renderMonth() {
      var byDay = groupByDay(state.events), todayKey = dayKey(new Date());
      var wrap = el(doc, 'div', 'kyv-cal-month');
      ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].forEach(function (n) { wrap.appendChild(el(doc, 'div', 'kyv-cal-wd', n)); });
      monthMatrix(state.anchor).forEach(function (row) {
        row.forEach(function (cell) {
          var evs = byDay[cell.key] || [];
          var c = el(doc, 'button', 'kyv-cal-cell' + (cell.inMonth ? '' : ' is-out') + (cell.key === todayKey ? ' is-today' : ''));
          c.type = 'button';
          c.setAttribute('aria-label', cell.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + ', ' + evs.length + (evs.length === 1 ? ' evento' : ' eventi'));
          c.appendChild(el(doc, 'span', 'kyv-cal-daynum', String(cell.date.getDate())));
          evs.slice(0, 2).forEach(function (ev) {
            var item = el(doc, 'span', 'kyv-cal-ev', (ev.allDay ? '' : ev.date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) + ' ') + ev.title);
            item.title = ev.title;
            c.appendChild(item);
          });
          if (evs.length > 2) c.appendChild(el(doc, 'span', 'kyv-cal-more', '+' + (evs.length - 2) + ' altri'));
          if (evs.length) c.appendChild(el(doc, 'span', 'kyv-cal-count', String(evs.length)));
          c.addEventListener('click', function () { openWeekOf(cell.date); });
          wrap.appendChild(c);
        });
      });
      grid.appendChild(wrap);
    }

    function render() {
      var isList = state.view === 'list';
      Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute('aria-pressed', String(k === state.view)); });
      list.style.display = isList ? '' : 'none';
      grid.hidden = isList;
      nav.hidden = isList;
      clear(grid);
      if (isList) return;
      label.textContent = rangeLabel(state.anchor, state.view);
      if (!state.events.length) grid.appendChild(el(doc, 'p', 'kyv-cal-note', 'Nessun evento caricato: premi “Aggiorna agenda” per leggere Google Calendar.'));
      if (state.view === 'week') renderWeek(); else renderMonth();
    }

    function setView(v) {
      if (VIEWS.indexOf(v) < 0) return;
      state.view = v;
      saveView(v);
      render();
    }

    root.addEventListener('kyv:calendar-events', function (e) {
      state.events = cachedEvents;
      if (state.view !== 'list') render();
    });

    render();
    return true;
  }

  if (typeof root.addEventListener === 'function') {
    root.addEventListener('kyv:calendar-events', function (e) {
      cachedEvents = normalizeEvents(e && e.detail && e.detail.events);
    });
  }

  root.KYV_CALENDAR_VIEWS = { helpers: helpers, init: init };

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { init(root.document); });
    else init(root.document);
  }
})(typeof window !== 'undefined' ? window : globalThis);
