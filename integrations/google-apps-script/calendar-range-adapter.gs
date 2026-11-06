/**
 * KYV Calendar / Apps Script — optional read-only range adapter.
 *
 * Add this file to the EXISTING Apps Script project, preserving its doGet,
 * authentication / proxySecret checks, createEvent and legacy getEvents.
 *
 * In the existing authorized getEvents handler, BEFORE the legacy path:
 *
 *   if (e.parameter.startDate || e.parameter.endDate) {
 *     return jsonResponse_(kyvGetEventsPeriod_(e.parameter, calendar));
 *   }
 *
 * Replace jsonResponse_ with the existing JSON response helper and pass the
 * same CalendarApp calendar object already used by the existing handler.
 * Do not introduce a second doGet or publish a different Web App URL.
 */

/** YYYY-MM-DD only; never allow an invalid/rolled date to be silently accepted. */
function kyvParseCalendarDay_(value) {
  var s = String(value == null ? '' : value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Intervallo calendario: data non valida.');
  var p = s.split('-').map(Number);
  var d = new Date(p[0], p[1] - 1, p[2]);
  if (d.getFullYear() !== p[0] || d.getMonth() !== p[1] - 1 || d.getDate() !== p[2]) {
    throw new Error('Intervallo calendario: giorno inesistente.');
  }
  return d;
}

/**
 * Read the exact range [startDate, endDate) in the script time zone.
 * CalendarApp.getEvents expands recurring events in the requested period.
 * The response explicitly confirms the range only after a real filtered read.
 * Max 120 items returned; truncated=true prevents a false completeness claim.
 */
function kyvGetEventsPeriod_(params, calendar) {
  if (!params || !params.startDate || !params.endDate) {
    throw new Error('Intervallo calendario: servono startDate e endDate.');
  }
  var start = kyvParseCalendarDay_(params.startDate);
  var end = kyvParseCalendarDay_(params.endDate);
  var days = Math.round((Date.UTC(end.getFullYear(),end.getMonth(),end.getDate()) -
    Date.UTC(start.getFullYear(),start.getMonth(),start.getDate())) / 86400000);
  if (days < 1 || days > 45) throw new Error('Intervallo calendario consentito: da 1 a 45 giorni.');
  if (!calendar || typeof calendar.getEvents !== 'function') {
    throw new Error('Calendario non disponibile o autorizzazione mancante.');
  }

  var events = calendar.getEvents(start, end);
  if (!Array.isArray(events)) throw new Error('Risposta Calendar non valida.');
  var zone = Session.getScriptTimeZone();
  var results = events.slice(0, 120).map(function(ev) {
    var allDay = ev.isAllDayEvent();
    var startTime = allDay ? ev.getAllDayStartDate() : ev.getStartTime();
    return {
      title: String(ev.getTitle() || 'Senza titolo'),
      date: allDay ? Utilities.formatDate(startTime, zone, 'yyyy-MM-dd') : startTime.toISOString()
    };
  });
  return {
    events: results,
    range: {
      startDate: String(params.startDate),
      endDate: String(params.endDate)
    },
    truncated: events.length > 120
  };
}
