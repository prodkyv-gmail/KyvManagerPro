// kyv-calendar-views.js - Viste Elenco / Settimana / Mese per l'Agenda.
// Usa gli stessi eventi già letti da "Aggiorna agenda" (evento "kyv:calendar-events").
// I titoli arrivano da Google Calendar: la griglia li scrive solo con textContent, mai con innerHTML.
(function (root) {
  'use strict';

  var STORAGE_KEY = 'kyv_calendar_view_v1';
  var VIEWS = ['day', 'week', 'month', 'year', 'list'];
  var DAY_MS = 86400000;
  var cachedEvents = [];
  var calendarLoaded = false;
  var calendarTruncated = false;

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
      var end = parseEventDate(ev && ev.endDate);
      out.push({
        id: String(ev && ev.id || ''),
        date: p.date, endDate: end ? end.date : null,
        allDay: !!(p.allDay || (ev && ev.allDay === true)),
        title: String((ev && ev.title) || 'Senza titolo'),
        description: String((ev && ev.description) || ''),
        location: String((ev && ev.location) || ''),
        key: dayKey(p.date)
      });
    });
    return out.sort(function (a, b) { return a.date - b.date; });
  }

  function groupByDay(events) {
    var map = {};
    events.forEach(function (ev) { (map[ev.key] = map[ev.key] || []).push(ev); });
    return map;
  }

  function shiftAnchor(anchor, view, dir) {
    if (view === 'day') return addDays(anchor, dir);
    if (view === 'week') return addDays(anchor, 7 * dir);
    if (view === 'year') return new Date(anchor.getFullYear() + dir, 0, 1);
    return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  }

  // Il servizio dovrà confermare esplicitamente questi estremi (fine esclusiva).
  function periodBounds(anchor, view) {
    var start = view === 'day' ? startOfDay(anchor) : view === 'week' ? weekStart(anchor) : new Date(anchor.getFullYear(), view === 'year' ? 0 : anchor.getMonth(), 1);
    var end = view === 'day' ? addDays(start, 1) : view === 'week' ? addDays(start, 7) : new Date(start.getFullYear(), start.getMonth() + (view === 'year' ? 12 : 1), 1);
    return { startDate: dayKey(start), endDate: dayKey(end) };
  }

  function confirmedRange(response, requested) {
    var range = response && response.range;
    return !!(range && range.startDate === requested.startDate && range.endDate === requested.endDate);
  }

  function rangeLabel(anchor, view) {
    if (view === 'day') return anchor.toLocaleDateString('it-IT', {weekday:'long',day:'numeric',month:'long',year:'numeric'});
    if (view === 'year') return String(anchor.getFullYear());
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
    rangeLabel: rangeLabel, dayKey: dayKey, periodBounds: periodBounds, confirmedRange: confirmedRange, VIEWS: VIEWS
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
    return 'day';
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
      '.kyv-cal-event-button{width:100%;text-align:left;cursor:pointer;font:inherit;transition:background .18s,border-color .18s}',
      '.kyv-cal-event-button:hover,.kyv-cal-event-button:focus-visible{background:rgba(139,131,255,.25);border-color:#a7a0ff;outline:2px solid transparent}',
      '.kyv-cal-day-jump{border:0;background:transparent;color:inherit;cursor:pointer;text-align:left;font:inherit;font-weight:800;border-radius:.35rem}',
      '.kyv-cal-day-jump:hover,.kyv-cal-day-jump:focus-visible{color:#c9c5ff;text-decoration:underline}',
      '.kyv-cal-detail-dialog{position:fixed;max-width:min(92vw,560px);width:100%;max-height:85dvh;overflow-y:auto;margin:auto;padding:0;border:1px solid #3a4155;border-radius:1rem;background:#171b25;color:#f5f7fb;box-shadow:0 20px 80px rgba(0,0,0,.6)}',
      '.kyv-cal-detail-dialog::backdrop{background:rgba(0,0,0,.72)}',
      '.kyv-cal-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.25rem;border-bottom:1px solid #303547}',
      '.kyv-cal-detail-title{font-size:20px;font-weight:800;overflow-wrap:anywhere;margin:0}',
      '.kyv-cal-detail-body{display:grid;gap:1rem;padding:1.25rem}',
      '.kyv-cal-detail-label{font-size:11px;color:#a4adbd;text-transform:uppercase;font-weight:800;letter-spacing:.06em}',
      '.kyv-cal-detail-value{font-size:14px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.kyv-cal-detail-close{border:1px solid #465069;border-radius:.6rem;padding:.5rem .75rem;background:#252b3a;color:#fff;cursor:pointer;font-weight:700}',
      '.kyv-cal-empty{font-size:12px;color:var(--kyv-muted,#969eae);opacity:.6}',
      '.kyv-cal-month{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.35rem}',
      '.kyv-cal-year{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:.75rem}',
      '.kyv-cal-year-month{background:var(--kyv-surface,#171b25);border:1px solid var(--kyv-border,rgba(255,255,255,.1));color:var(--kyv-text,#fff);border-radius:.8rem;padding:1rem;text-align:left;min-height:7rem;cursor:pointer}',
      '.kyv-cal-year-month strong{display:block;margin-bottom:.5rem;font-size:15px}.kyv-cal-year-month span{font-size:13px;color:var(--kyv-muted,#a4adbd)}',
      '.kyv-cal-year-month:hover{border-color:var(--kyv-primary,#8b83ff)}',
      '.kyv-cal-wd{font-size:11.5px;text-transform:uppercase;font-weight:800;text-align:center;color:var(--kyv-muted,#969eae);padding:.2rem 0}',
      '.kyv-cal-cell{padding:.4rem;min-height:5.6rem;text-align:left;cursor:pointer;color:inherit;font:inherit;display:flex;flex-direction:column;gap:.25rem}',
      '.kyv-cal-cell:hover{border-color:var(--kyv-primary,#8b83ff)}',
      '.kyv-cal-cell .kyv-cal-event-button{min-height:26px;font-size:11.5px}',
      '.kyv-cal-cell .kyv-cal-day-jump:focus-visible{outline:2px solid #a7a0ff}',
      '.kyv-cal-cell.is-out{opacity:.42}',
      '.kyv-cal-cell .kyv-cal-ev{padding:.2rem .35rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.kyv-cal-more{font-size:11.5px;color:var(--kyv-muted,#969eae)}',
      '.kyv-cal-count{display:none;font-size:11.5px;font-weight:800;color:#c9c5ff}',
      '@media(max-width:700px){.kyv-cal-week{grid-template-columns:1fr}.kyv-cal-daycol{min-height:0}',
      '.kyv-cal-cell{min-height:3.6rem;align-items:center}.kyv-cal-cell .kyv-cal-ev,.kyv-cal-cell .kyv-cal-more{display:none}.kyv-cal-count{display:block}',
      '.kyv-cal-label{min-width:0;flex:1}}',
      // Le media query del viewport non bastano: il menu laterale riduce la larghezza REALE del calendario.
      // Queste regole seguono la larghezza del pannello, senza osservatori JS o scroll orizzontale della pagina.
      '@container kyv-calendar (max-width:980px){.kyv-cal-week{grid-template-columns:repeat(2,minmax(0,1fr))}.kyv-cal-daycol{min-height:7rem}.kyv-cal-bar{align-items:stretch}.kyv-cal-nav{flex-wrap:wrap;justify-content:flex-start}.kyv-cal-label{min-width:8rem;flex:1}}',
      '@container kyv-calendar (max-width:650px){.kyv-cal-week{grid-template-columns:1fr}.kyv-cal-daycol{min-height:0}.kyv-cal-grid{padding:.65rem}.kyv-cal-month{gap:.2rem}.kyv-cal-cell{min-height:3.3rem;padding:.25rem .12rem;align-items:center}.kyv-cal-wd{font-size:10px}.kyv-cal-daynum{font-size:15px}.kyv-cal-cell .kyv-cal-ev,.kyv-cal-cell .kyv-cal-more{display:none}.kyv-cal-count{display:block}.kyv-cal-bar{padding:.7rem}.kyv-cal-group{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.kyv-cal-group .kyv-cal-btn{padding:.5rem .25rem}.kyv-cal-nav{width:100%}.kyv-cal-btn{min-height:40px}.kyv-cal-label{min-width:0;flex:1 1 7rem}.kyv-cal-note{overflow-wrap:anywhere}}',
      '@container kyv-calendar (max-width:380px){.kyv-cal-cell{min-height:2.9rem}.kyv-cal-daynum{font-size:13px}.kyv-cal-nav{gap:.2rem}.kyv-cal-btn{padding:.4rem .45rem}.kyv-cal-label{flex-basis:100%;order:-1;text-align:left}}'
    ].join('');
    doc.head.appendChild(s);
  }

  function init(doc) {
    var main = doc.querySelector('.kyv-calendar-main');
    var list = doc.getElementById('events-list');
    if (!main || !list || main.dataset.kyvViews === '1') return false;
    main.dataset.kyvViews = '1';
    injectStyle(doc);

    var state = { view: readView(), anchor: startOfDay(new Date()), events: cachedEvents, loaded: calendarLoaded, truncated: calendarTruncated, periodStatus: '', periodEvents: null, requestId: 0, yearPending:null };

    // One native, focus-managed detail dialog reused by every calendar view.
    // All Google-provided text is assigned with textContent, never interpreted as HTML.
    var details = el(doc,'dialog','kyv-cal-detail-dialog');
    var detailHead = el(doc,'div','kyv-cal-detail-head');
    var detailTitle = el(doc,'h3','kyv-cal-detail-title','Dettaglio evento');
    detailTitle.id='kyv-cal-detail-title';
    details.setAttribute('aria-labelledby',detailTitle.id);
    var detailClose = el(doc,'button','kyv-cal-detail-close','Chiudi');
    detailClose.type='button';
    detailHead.appendChild(detailTitle);detailHead.appendChild(detailClose);
    var detailBody=el(doc,'div','kyv-cal-detail-body');
    details.appendChild(detailHead);details.appendChild(detailBody);
    doc.body.appendChild(details);
    var detailOpener=null;
    detailClose.addEventListener('click',function(){details.close();});
    details.addEventListener('click',function(e){if(e.target===details)details.close();});
    details.addEventListener('close',function(){
      if(detailOpener && detailOpener.isConnected)detailOpener.focus();
      detailOpener=null;
    });
    function detailRow(title,value){
      var section=el(doc,'div','');
      section.appendChild(el(doc,'div','kyv-cal-detail-label',title));
      section.appendChild(el(doc,'div','kyv-cal-detail-value',value));
      detailBody.appendChild(section);
    }
    function showEventDetails(raw,opener){
      var ev=raw && raw.date instanceof Date ? raw : normalizeEvents([raw])[0];
      if(!ev || !details.showModal)return;
      detailTitle.textContent=ev.title;
      clear(detailBody);
      var dateFormat={weekday:'long',day:'numeric',month:'long',year:'numeric'};
      detailRow('Data',ev.date.toLocaleDateString('it-IT',dateFormat));
      if(ev.allDay){
        detailRow('Orario','Tutto il giorno');
      }else{
        detailRow('Inizio',ev.date.toLocaleString('it-IT',{dateStyle:'full',timeStyle:'short'}));
        detailRow('Fine',ev.endDate?ev.endDate.toLocaleString('it-IT',{dateStyle:'full',timeStyle:'short'}):'Orario finale non disponibile');
      }
      if(ev.allDay && ev.endDate && ev.endDate-ev.date>DAY_MS){
        detailRow('Ultimo giorno',addDays(ev.endDate,-1).toLocaleDateString('it-IT',dateFormat));
      }
      detailRow('Descrizione',ev.description || 'Nessuna descrizione disponibile');
      detailRow('Luogo',ev.location || 'Non indicato');
      detailOpener=opener || doc.activeElement;
      if(details.open)details.close();
      details.showModal();
      detailClose.focus();
    }
    function eventButton(ev,compact){
      var btn=el(doc,'button','kyv-cal-ev kyv-cal-event-button');
      btn.type='button';
      btn.setAttribute('aria-label','Dettagli evento: '+ev.title);
      btn.title='Apri dettagli: '+ev.title;
      if(compact){
        btn.textContent=(ev.allDay?'':timeLabel(ev)+' ')+ev.title;
      }else{
        btn.appendChild(el(doc,'b','',timeLabel(ev)));
        btn.appendChild(doc.createTextNode(ev.title));
      }
      btn.addEventListener('click',function(){showEventDetails(ev,btn);});
      return btn;
    }
    root.addEventListener('kyv:calendar-open-event',function(event){
      if(event && event.detail)showEventDetails(event.detail.event,event.detail.opener);
    });


    var bar = el(doc, 'div', 'kyv-cal-bar');
    var group = el(doc, 'div', 'kyv-cal-group');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Vista agenda');
    var buttons = {};
    [['day', 'Giorno'], ['week', 'Settimana'], ['month', 'Mese'], ['year', 'Anno'], ['list', 'Elenco']].forEach(function (pair) {
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
    var loadPeriod = el(doc, 'button', 'kyv-cal-btn', 'Carica periodo');
    loadPeriod.type = 'button';
    loadPeriod.setAttribute('aria-label', 'Richiedi gli appuntamenti del periodo visibile');
    var label = el(doc, 'span', 'kyv-cal-label');
    label.setAttribute('aria-live', 'polite');
    [prev, label, next, today, loadPeriod].forEach(function (n) { nav.appendChild(n); });
    bar.appendChild(group);
    bar.appendChild(nav);

    var grid = el(doc, 'div', 'kyv-cal-grid custom-scrollbar');
    grid.id = 'kyv-cal-grid';

    var header = main.firstElementChild;
    if (header) header.after(bar); else main.insertBefore(bar, main.firstChild);
    list.after(grid);

    function changePeriod(anchor) {
      state.anchor = anchor;
      state.periodEvents = null;
      state.periodStatus = '';
      state.yearPending = null;
      state.requestId++;
      render();
      if(state.view!=='list')loadVisiblePeriod();
    }

    prev.addEventListener('click', function () { changePeriod(shiftAnchor(state.anchor, state.view, -1)); });
    next.addEventListener('click', function () { changePeriod(shiftAnchor(state.anchor, state.view, 1)); });
    today.addEventListener('click', function () { changePeriod(startOfDay(new Date())); });

    function openWeekOf(date) {
      if(state.view==='week')changePeriod(startOfDay(date));
      else {state.anchor=startOfDay(date);setView('week');}
    }

    function loadVisiblePeriod() {
      if (state.view === 'list') return;
      var requested = periodBounds(state.anchor, state.view);
      var requestId = ++state.requestId;
      state.periodEvents = null;
      state.periodStatus = 'Caricamento del periodo in corso…';
      state.yearPending = null;
      render();
      if(state.view === 'year'){
        // Request at most 3 months simultaneously to avoid saturating Apps Script.
        var year=state.anchor.getFullYear();
        var pending={id:requestId,remaining:12,nextMonth:0,running:0,events:[],partial:false};
        pending.launch=function(){
          while(state.yearPending===pending && pending.running<3 && pending.nextMonth<12){
            var month=pending.nextMonth++,start=new Date(year,month,1),end=new Date(year,month+1,1);
            var range={startDate:dayKey(start),endDate:dayKey(end)};
            pending.running++;
            root.dispatchEvent(new CustomEvent('kyv:calendar-period-request',{
              detail:{requested:range,requestId:String(requestId)+':'+month}
            }));
          }
        };
        state.yearPending=pending;
        pending.launch();
      }else{
        root.dispatchEvent(new CustomEvent('kyv:calendar-period-request',{
          detail:{requested:requested,requestId:requestId}
        }));
      }
    }
    loadPeriod.addEventListener('click',loadVisiblePeriod);

    root.addEventListener('kyv:calendar-period-result', function (event) {
      var d = event && event.detail;
      if(!d)return;
      if(state.yearPending && typeof d.requestId === 'string' && d.requestId.indexOf(String(state.yearPending.id)+':')===0){
        var pending=state.yearPending;
        if(d.success && confirmedRange(d.response,d.requested)){
          pending.events.push.apply(pending.events,normalizeEvents(d.response.events));
          if(d.truncated)pending.partial=true;
        }else pending.partial=true;
        pending.remaining--;
        pending.running--;
        if(pending.remaining===0 && state.yearPending===pending){
          state.periodEvents=pending.events.sort(function(a,b){return a.date-b.date;});
          state.periodStatus=pending.partial
            ? 'Anno caricato parzialmente: uno o più mesi non sono completi. Ripeti il caricamento.'
            : 'Tutti i 12 mesi confermati da Google Calendar.';
          state.yearPending=null;
        }else if(state.yearPending===pending){
          pending.launch();
        }
        render();
        return;
      }
      if (d.requestId !== state.requestId) return;
      if (d.success && confirmedRange(d.response, d.requested)) {
        state.periodEvents = normalizeEvents(d.response.events);
        state.periodStatus = d.truncated
          ? 'Periodo confermato, ma risultato limitato a 120 eventi: potrebbero mancarne altri.'
          : 'Periodo confermato dal servizio Google Calendar.';
      } else {
        state.periodEvents = null;
        state.periodStatus = d.success
          ? 'Lo script Google in uso non conferma le date richieste. Aggiorna il deployment Apps Script per consultare gli eventi storici.'
          : 'Non è stato possibile caricare il periodo: '+String(d.error||'controlla la connessione Apps Script').slice(0,180);
      }
      render();
    });

    function renderWeek() {
      var byDay = groupByDay(state.periodEvents || (state.periodStatus ? [] : state.events)), start = weekStart(state.anchor), todayKey = dayKey(new Date());
      var wrap = el(doc, 'div', 'kyv-cal-week');
      for (var i = 0; i < 7; i++) {
        var d = addDays(start, i), key = dayKey(d);
        var col = el(doc, 'div', 'kyv-cal-daycol' + (key === todayKey ? ' is-today' : ''));
        var head = el(doc, 'div', 'kyv-cal-dayhead');
        head.appendChild(el(doc, 'span', '', d.toLocaleDateString('it-IT', { weekday: 'short' })));
        head.appendChild(el(doc, 'span', 'kyv-cal-daynum', String(d.getDate())));
        col.appendChild(head);
        var evs = byDay[key] || [];
        if (!evs.length) col.appendChild(el(doc, 'span', 'kyv-cal-empty', state.periodEvents ? 'Nessun evento nel periodo confermato' : 'Nessun evento tra quelli caricati'));
        evs.forEach(function (ev) { col.appendChild(eventButton(ev,false)); });
        wrap.appendChild(col);
      }
      grid.appendChild(wrap);
    }

    function renderDay() {
      var key=dayKey(state.anchor),byDay=groupByDay(state.periodEvents||(state.periodStatus?[]:state.events));
      var evs=byDay[key]||[],wrap=el(doc,'div','kyv-cal-week');
      var col=el(doc,'div','kyv-cal-daycol'+(key===dayKey(new Date())?' is-today':''));
      col.appendChild(el(doc,'h3','kyv-cal-daynum',state.anchor.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})));
      if(!evs.length)col.appendChild(el(doc,'span','kyv-cal-empty',state.periodEvents?'Nessun evento in questo giorno':'Carica il giorno per verificare tutti gli eventi'));
      evs.forEach(function(ev){col.appendChild(eventButton(ev,false));});
      wrap.appendChild(col);grid.appendChild(wrap);
    }
    function renderYear() {
      var evs=state.periodEvents||(state.periodStatus?[]:state.events);
      var year=state.anchor.getFullYear(),wrap=el(doc,'div','kyv-cal-year');
      for(var m=0;m<12;m++){
        (function(month){
          var selected=evs.filter(function(ev){return ev.date.getFullYear()===year&&ev.date.getMonth()===month;});
          var btn=el(doc,'button','kyv-cal-year-month');
          btn.type='button';
          btn.appendChild(el(doc,'strong','',new Date(year,month,1).toLocaleDateString('it-IT',{month:'long'})));
          btn.appendChild(el(doc,'span','',selected.length+' '+(selected.length===1?'evento':'eventi')+
            (state.periodEvents?'':' (dati parziali)')));
          btn.addEventListener('click',function(){state.anchor=new Date(year,month,1);setView('month');});
          wrap.appendChild(btn);
        })(m);
      }
      grid.appendChild(wrap);
    }

    function renderMonth() {
      var byDay = groupByDay(state.periodEvents || (state.periodStatus ? [] : state.events)), todayKey = dayKey(new Date());
      var wrap = el(doc, 'div', 'kyv-cal-month');
      ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].forEach(function (n) { wrap.appendChild(el(doc, 'div', 'kyv-cal-wd', n)); });
      monthMatrix(state.anchor).forEach(function (row) {
        row.forEach(function (cell) {
          var evs = byDay[cell.key] || [];
          var c = el(doc, 'div', 'kyv-cal-cell' + (cell.inMonth ? '' : ' is-out') + (cell.key === todayKey ? ' is-today' : ''));
          var jump=el(doc,'button','kyv-cal-day-jump kyv-cal-daynum',String(cell.date.getDate()));
          jump.type='button';
          jump.setAttribute('aria-label',cell.date.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})+', '+evs.length+(evs.length===1?' evento':' eventi')+', apri settimana');
          jump.addEventListener('click',function(){openWeekOf(cell.date);});
          c.appendChild(jump);
          evs.slice(0, 2).forEach(function (ev) { c.appendChild(eventButton(ev,true)); });
          if (evs.length > 2) {
            var more=el(doc,'button','kyv-cal-more kyv-cal-day-jump','+'+(evs.length-2)+' altri');
            more.type='button';more.addEventListener('click',function(){openWeekOf(cell.date);});
            c.appendChild(more);
          }
          if (evs.length) c.appendChild(el(doc, 'span', 'kyv-cal-count', String(evs.length)));
          c.addEventListener('click',function(e){if(e.target===c)openWeekOf(cell.date);});
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
      loadPeriod.disabled = state.periodStatus === 'Caricamento del periodo in corso…';
      if (state.periodStatus) {
        grid.appendChild(el(doc, 'p', 'kyv-cal-note', state.periodStatus));
      } else if (!state.loaded) {
        grid.appendChild(el(doc, 'p', 'kyv-cal-note', 'Agenda non aggiornata: premi “Aggiorna agenda” per leggere Google Calendar.'));
      } else {
        grid.appendChild(el(doc, 'p', 'kyv-cal-note',
          state.truncated
            ? 'Vista parziale: Google Calendar ha restituito almeno 120 eventi. I periodi non visibili potrebbero contenere appuntamenti.'
            : 'Vista basata sugli eventi ricevuti dall’ultimo aggiornamento. Un periodo vuoto non garantisce che non esistano appuntamenti su Google Calendar.'));
      }
      if (state.view === 'day') renderDay(); else if (state.view === 'week') renderWeek(); else if(state.view==='year')renderYear(); else renderMonth();
    }

    function setView(v) {
      if (VIEWS.indexOf(v) < 0) return;
      var changed=state.view!==v;
      if(changed){state.periodEvents=null;state.periodStatus='';state.yearPending=null;state.requestId++;}
      state.view=v;
      saveView(v);
      render();
      if(v!=='list' && (changed || !state.periodEvents))loadVisiblePeriod();
    }

    root.addEventListener('kyv:calendar-events', function (e) {
      state.events = cachedEvents;
      state.loaded = calendarLoaded;
      state.truncated = calendarTruncated;
      state.periodEvents = null;
      state.periodStatus = '';
      state.requestId++;
      state.yearPending=null;
      if (state.view !== 'list') {
        render();
        // A general list refresh must not invalidate the currently selected range.
        loadVisiblePeriod();
      }
    });

    root.addEventListener('kyv:calendar-created',function(){
      if(state.view!=='list')loadPeriod.click();
    });
    render();
    // Fetch the visible period on opening, including past days; never load all years at once.
    if(state.view!=='list')root.setTimeout(function(){loadVisiblePeriod();},0);
    return true;
  }

  if (typeof root.addEventListener === 'function') {
    root.addEventListener('kyv:calendar-events', function (e) {
      var detail = e && e.detail;
      // Un aggiornamento fallito invalida la fotografia precedente; non mostrare dati obsoleti.
      calendarLoaded = !!(detail && detail.success);
      calendarTruncated = calendarLoaded && !!detail.truncated;
      cachedEvents = calendarLoaded ? normalizeEvents(detail.events) : [];
    });
  }

  root.KYV_CALENDAR_VIEWS = { helpers: helpers, init: init };

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { init(root.document); });
    else init(root.document);
  }
})(typeof window !== 'undefined' ? window : globalThis);
