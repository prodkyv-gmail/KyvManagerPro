const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const config = read('config.js');
const page = read('kyv_calendar.html');
const src = read('kyv-calendar-views.js');

// Collegamenti
assert.match(config, /kyv-calendar-views\.js/, 'config.js deve caricare le viste calendario');
assert.ok(config.indexOf('kyv-agenda-phase5.js') < config.indexOf('kyv-calendar-views.js'), 'le viste vanno caricate dopo la fase 5 dell\'agenda');
assert.match(page, /dispatchEvent\(new CustomEvent\('kyv:calendar-events'/, 'la pagina deve passare gli eventi alle viste');
assert.doesNotMatch(src, /\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML/, 'i titoli arrivano da Google Calendar: vietato innerHTML nelle viste');

// Contratto sincronizzazione: successo distinto dall'errore, niente eventi vecchi dopo il fallimento.
assert.match(page, /success: true, truncated:/, 'la sincronizzazione riuscita deve dichiarare copertura e successo');
assert.match(page, /events: \[\], success: false/, 'la sincronizzazione fallita deve invalidare la cache');
assert.match(src, /calendarLoaded = !!\(detail && detail\.success\)/, 'la vista deve distinguere dati aggiornati e non aggiornati');
assert.match(src, /cachedEvents = calendarLoaded \? normalizeEvents\(detail\.events\) : \[\]/, 'i dati precedenti devono essere cancellati dopo un errore');
assert.match(src, /Vista parziale:/, 'la vista deve segnalare eventi limitati');
assert.match(src, /Un periodo vuoto non garantisce/, 'non indicare falsa assenza di appuntamenti');

// Il calendario deve adattarsi allo spazio della scheda, non solo al viewport:
assert.ok(page.includes('container-type:inline-size; container-name:kyv-calendar'), 'la vista deve dichiarare il proprio contenitore responsive');
assert.ok(src.includes('@container kyv-calendar (max-width:980px)'), 'layout medio del pannello');
assert.ok(src.includes('@container kyv-calendar (max-width:650px)'), 'layout compatto del pannello');
assert.ok(src.includes('@container kyv-calendar (max-width:380px)'), 'layout molto stretto del pannello');
assert.ok(src.includes('.kyv-cal-month{gap:.2rem}'), 'mese compatto senza scrollbar orizzontale');
assert.ok(page.includes('overflow-x:hidden'), 'contenuto calendario non deve oltrepassare la scheda');

// Logica pura (caricata in Node: nessun window, nessun DOM)
global.localStorage = undefined;
require(path.join(root, 'kyv-calendar-views.js'));
const h = globalThis.KYV_CALENDAR_VIEWS.helpers;

// Settimana italiana: parte dal lunedì
const ws = h.weekStart(new Date(2026, 10, 6)); // venerdì 6 nov 2026
assert.equal(h.dayKey(ws), '2026-11-02');
assert.equal(h.dayKey(h.weekStart(new Date(2026, 10, 8))), '2026-11-02', 'la domenica appartiene alla settimana che finisce quel giorno');
assert.equal(h.dayKey(h.weekStart(new Date(2026, 10, 9))), '2026-11-09');

// Matrice del mese: righe da 7 giorni, parte da lunedì, contiene tutto il mese
const m = h.monthMatrix(new Date(2026, 10, 1));
assert.ok(m.every(r => r.length === 7));
assert.equal(m[0][0].date.getDay(), 1);
assert.equal(m.flat().filter(c => c.inMonth).length, 30, 'novembre ha 30 giorni');
const feb = h.monthMatrix(new Date(2027, 1, 1)); // febbraio 2027 inizia di lunedì, 28 giorni
assert.equal(feb.length, 4);
assert.equal(h.monthMatrix(new Date(2026, 7, 1)).length, 6, 'agosto 2026 occupa 6 righe');

// Date: solo giorno = tutto il giorno, in data locale
const allDay = h.parseEventDate('2026-11-06');
assert.equal(allDay.allDay, true);
assert.equal(h.dayKey(allDay.date), '2026-11-06');
assert.equal(h.parseEventDate('non una data'), null);
assert.equal(h.parseEventDate(''), null);
assert.equal(h.parseEventDate('2026-11-06T09:30:00').allDay, false);

// Normalizzazione: scarta date non valide, ordina, titolo di riserva
const ev = h.normalizeEvents([
  { date: '2026-11-07T10:00:00', title: 'B' },
  { date: 'xx', title: 'scartato' },
  { date: '2026-11-06T09:00:00' },
  null
]);
assert.equal(ev.length, 2);
assert.equal(ev[0].title, 'Senza titolo');
assert.equal(ev[1].title, 'B');
assert.deepEqual(h.normalizeEvents(undefined), []);
const grouped = h.groupByDay(h.normalizeEvents([{ date: '2026-11-06T09:00:00', title: 'A' }, { date: '2026-11-06T18:00:00', title: 'B' }]));
assert.equal(grouped['2026-11-06'].length, 2);

// Navigazione avanti/indietro, anche a cavallo d'anno
assert.equal(h.dayKey(h.shiftAnchor(new Date(2026, 10, 6), 'week', 1)), '2026-11-13');
assert.equal(h.dayKey(h.shiftAnchor(new Date(2026, 10, 6), 'week', -1)), '2026-10-30');
assert.equal(h.dayKey(h.shiftAnchor(new Date(2026, 11, 15), 'month', 1)), '2027-01-01');
assert.equal(h.dayKey(h.shiftAnchor(new Date(2026, 0, 31), 'month', -1)), '2025-12-01');
assert.equal(h.dayKey(h.shiftAnchor(new Date(2026, 0, 31), 'month', 1)), '2026-02-01', 'il mese successivo a gennaio non deve saltare a marzo');

// Richiesta intervalli: la risposta senza conferma esplicita non deve essere trattata come completa.
const weekRange = h.periodBounds(new Date(2026,10,6), 'week');
assert.deepEqual(weekRange, {startDate:'2026-11-02', endDate:'2026-11-09'});
const monthRange = h.periodBounds(new Date(2026,11,1), 'month');
assert.deepEqual(monthRange, {startDate:'2026-12-01', endDate:'2027-01-01'});
assert.equal(h.confirmedRange({events:[]},weekRange),false,'il backend legacy non prova la copertura del periodo');
assert.equal(h.confirmedRange({range:{...weekRange},events:[]},weekRange),true);
assert.equal(h.confirmedRange({range:{startDate:'2026-11-01',endDate:'2026-11-09'},events:[]},weekRange),false);
assert.match(page, /calendarRequest\('getEvents', \{\s*startDate: requested\.startDate, endDate: requested\.endDate/, 'la richiesta periodo passa dal proxy esistente');
assert.match(src, /d\.requestId !== state\.requestId/, 'risposte obsolete non devono cambiare il periodo visibile');
assert.match(src, /Carica periodo/, 'il caricamento del periodo deve essere su richiesta');
assert.match(src, /dati parziali/, 'il calendario deve dichiarare la copertura non verificata');

// Etichette
assert.match(h.rangeLabel(new Date(2026, 10, 1), 'month'), /^Novembre 2026$/);
assert.match(h.rangeLabel(new Date(2026, 10, 6), 'week'), /2.*–.*8.*nov.*2026/);

// Integrazione Apps Script indipendente dal vecchio doGet: testata con calendario simulato.
const vm = require('node:vm');
const adapter = read('integrations/google-apps-script/calendar-range-adapter.gs');
const sandbox = {
  Date,
  Error,
  String,
  Number,
  Math,
  Array,
  Session: { getScriptTimeZone: () => 'Europe/Rome' },
  Utilities: { formatDate: (d, zone, fmt) => {
    assert.equal(zone, 'Europe/Rome');
    assert.equal(fmt, 'yyyy-MM-dd');
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  } }
};
vm.createContext(sandbox);
vm.runInContext(adapter, sandbox);
const allDayEvent = { isAllDayEvent: () => true, getAllDayStartDate: () => new Date(2026,10,6), getTitle: () => 'Giornata', getStartTime: () => new Date(2026,10,6) };
const timedEvent = { isAllDayEvent: () => false, getStartTime: () => new Date('2026-11-06T09:00:00Z'), getTitle: () => 'Sessione' };
let selectedRange;
const fakeCalendar = { getEvents: (start, end) => {
  selectedRange = [start, end];
  return [allDayEvent, timedEvent];
} };
const actual = sandbox.kyvGetEventsPeriod_({startDate:'2026-11-02',endDate:'2026-11-09'},fakeCalendar);
assert.equal(actual.range.startDate,'2026-11-02');
assert.equal(actual.range.endDate,'2026-11-09');
assert.equal(actual.events.length,2);
assert.equal(actual.events[0].date,'2026-11-06');
assert.equal(actual.events[1].date,'2026-11-06T09:00:00.000Z');
assert.equal(actual.truncated,false);
assert.equal(selectedRange[0].getDate(),2);
assert.equal(selectedRange[1].getDate(),9);
const many = { getEvents: () => Array.from({length:121}, () => timedEvent) };
const limited = sandbox.kyvGetEventsPeriod_({startDate:'2026-11-02',endDate:'2026-11-09'},many);
assert.equal(limited.events.length,120);
assert.equal(limited.truncated,true);
for(const date of ['2026-02-30','2026-13-01','nondates']){
  assert.throws(() => sandbox.kyvParseCalendarDay_(date), /data non valida|giorno inesistente/);
}
assert.throws(() => sandbox.kyvGetEventsPeriod_({startDate:'2026-11-09',endDate:'2026-11-02'},fakeCalendar), /1 a 45/);
assert.throws(() => sandbox.kyvGetEventsPeriod_({startDate:'2026-11-01',endDate:'2027-01-01'},fakeCalendar), /1 a 45/);
assert.throws(() => sandbox.kyvGetEventsPeriod_({startDate:'2026-11-02',endDate:'2026-11-09'},null), /non disponibile/);
assert.match(page, /response.truncated === true/, 'la pagina deve rispettare il flag truncated del backend');

console.log('Viste calendario: OK');
