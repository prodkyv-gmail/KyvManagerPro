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

// Rimozione OAuth: la UI non deve caricare il connettore né sopprimere Apps Script.
assert.doesNotMatch(page, /kyv-google-calendar-oauth\.js|KYV_GOOGLE_CALENDAR_API|Google Calendar API \(OAuth 2\.0\)/);
assert.match(page, /Connessione Google Apps Script/);
assert.match(page, /calendarRequest\('getEvents'/);
assert.match(page, /calendarRequest\('createEvent'/);
assert.match(page, /window\.KYV_DRIVE\.fetchJson/);
for(const deleted of [
  'kyv-google-calendar-oauth.js',
  'lib/kyv-google-calendar-oauth-server.js',
  'api/google-calendar/start.js',
  'api/google-calendar/callback.js',
  'api/google-calendar/status.js',
  'api/google-calendar/events.js',
  'api/google-calendar/disconnect.js',
  'tools/test-google-calendar-oauth.js'
]) assert.equal(fs.existsSync(path.join(root,deleted)),false,'OAuth remove: '+deleted);
const packageText=read('package.json');
assert.doesNotMatch(packageText,/check:google-oauth|test-google-calendar-oauth\.js/);

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


// V285: gli estremi del giorno, dell'anno e la navigazione storica.
assert.equal(h.dayKey(h.shiftAnchor(new Date(2026,10,6),'day',-1)),'2026-11-05');
assert.equal(h.dayKey(h.shiftAnchor(new Date(2026,10,6),'year',-1)),'2025-01-01');
assert.deepEqual(h.periodBounds(new Date(2026,10,6),'day'),{startDate:'2026-11-06',endDate:'2026-11-07'});
assert.deepEqual(h.periodBounds(new Date(2026,10,6),'year'),{startDate:'2026-01-01',endDate:'2027-01-01'});
assert.deepEqual(h.VIEWS,['day','week','month','year','list']);
assert.match(src,/state.yearPending/);
assert.match(src,/remaining:months.length/);
assert.match(page,/id="ev-end-time"/);
assert.match(page,/id="ev-description"/);
assert.match(page,/endTime,\s*description,\s*location/);

// Lo script completo mantiene Drive e la creazione preesistente, con orari configurabili.
const full=read('integrations/google-apps-script/kyv-calendar-drive-v2.gs');
assert.match(full,/function doGet\(e\)/);
assert.match(full,/function kyvDriveFiles_\(params\)/);
assert.match(full,/DriveApp\.continueFileIterator/);
assert.match(full,/CalendarApp\.getDefaultCalendar/);
assert.match(full,/params.endTime/);
const vm2=require('node:vm');
let created=null,range=null;
const fake={
 getEvents:(from,to)=>{range=[from,to];return [{
   getId:()=> 'e1',getTitle:()=> 'Prova',getStartTime:()=>new Date('2020-01-06T11:00:00Z'),
   getEndTime:()=>new Date('2020-01-06T12:00:00Z'),isAllDayEvent:()=>false,
   getDescription:()=>'',getLocation:()=>''}];},
 createEvent:(title,from,to,opts)=>{created={title,from,to,opts};return {getId:()=> 'new',getStartTime:()=>from,getEndTime:()=>to};}
};
const ctx={
 Date,Error,String,Number,Math,Array,JSON,CalendarApp:{getDefaultCalendar:()=>fake},
 Session:{getScriptTimeZone:()=> 'Europe/Rome'},
 Utilities:{formatDate:(date)=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')},
 ContentService:{MimeType:{JSON:'JSON'},createTextOutput:x=>({setMimeType:()=>JSON.parse(x)})}
};
vm2.createContext(ctx);
vm2.runInContext(full,ctx);
const history=ctx.doGet({parameter:{action:'getEvents',startDate:'2020-01-01',endDate:'2020-02-01'}});
assert.equal(history.success,true);
assert.equal(history.events.length,0,'nessun evento storico deve essere letto');
assert.equal(history.historyDisabled,true);
assert.equal(history.range.startDate,'2020-01-01');
assert.equal(range,null,'un periodo completamente passato non deve interrogare Google Calendar');
const futureYear=new Date().getFullYear()+2;
const future=ctx.doGet({parameter:{action:'getEvents',startDate:futureYear+'-05-01',endDate:futureYear+'-05-15'}});
assert.equal(future.historyDisabled,false);
assert.equal(future.events.length,1);
assert.equal(range[0].getFullYear(),futureYear);
const partialStart=new Date();
partialStart.setHours(0,0,0,0);
partialStart.setDate(partialStart.getDate()-2);
const partialEnd=new Date();
partialEnd.setHours(0,0,0,0);
partialEnd.setDate(partialEnd.getDate()+2);
function key(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
const mixed=ctx.doGet({parameter:{action:'getEvents',startDate:key(partialStart),endDate:key(partialEnd)}});
assert.equal(mixed.historyDisabled,true,'i periodi che attraversano oggi omettono lo storico');
assert.equal(mixed.range.startDate,key(partialStart),'il range conferma la richiesta originale');
assert.ok(range[0]>=new Date(new Date().setHours(0,0,0,0)),'la query effettiva inizia da oggi');
assert.equal(ctx.doGet({parameter:{action:'getEvents',startDate:'2026-02-30',endDate:'2026-03-02'}}).error.includes('inesistente'),true);
const made=ctx.doGet({parameter:{action:'createEvent',title:'Sessione',date:'2026-11-06',time:'09:00',endTime:'11:30',description:'Note'}});
assert.equal(made.success,true);
assert.equal(created.opts.description,'Note');
assert.equal((created.to-created.from)/60000,150);
const old=ctx.doGet({parameter:{action:'createEvent',title:'Legacy',date:'2026-11-06',time:'09:00'}});
assert.equal(old.success,true);
assert.equal((created.to-created.from)/60000,120);
assert.ok(ctx.doGet({parameter:{action:'createEvent',date:'2026-11-06',time:'12:00',endTime:'11:00'}}).error);


 // v287: regressioni storico: selezione di un giorno passato carica automaticamente il periodo.
 assert.match(src,/function loadVisiblePeriod\(\)/);
 assert.match(src,/if\(state\.view!=='list'\)loadVisiblePeriod\(\)/);
 assert.match(src,/if\(state\.view!=='list'\)root\.setTimeout\(function\(\)\{loadVisiblePeriod\(\);\},0\)/);
 assert.match(src,/pending\.running<3/,'anno non deve inviare 12 richieste insieme');
 assert.match(src,/Apps Script collegato in modalità compatibilità/);
 assert.match(page,/today\.getDate\(\)\)/);
 assert.doesNotMatch(page,/today\.getDate\(\)-30/);
 assert.match(page,/today\.getDate\(\)\+15/);
 assert.match(page,/data\.range\?\.startDate === wanted\.startDate/);
 assert.match(page,/data-kyv-calendar-index/);
 assert.match(page,/kyv:calendar-open-event/);
 assert.match(page,/listEventsCache = \[\]/);

 // La descrizione, il luogo e l'orario finale devono arrivare al popup senza innerHTML.
 const detailed=h.normalizeEvents([{
   id:'test-id',title:'Prova dettagli',date:'2026-11-06T09:00:00Z',
   endDate:'2026-11-06T11:30:00Z',description:'Testo con <b>markup</b>',
   location:'Studio Milano'
 }])[0];
 assert.equal(detailed.id,'test-id');
 assert.equal(detailed.description,'Testo con <b>markup</b>');
 assert.equal(detailed.location,'Studio Milano');
 assert.equal(detailed.endDate.toISOString(),'2026-11-06T11:30:00.000Z');
 assert.match(src,/el\(doc,'dialog'/);
 assert.match(src,/details\.showModal\(\)/);
 assert.match(src,/detailTitle\.textContent=ev\.title/);
 assert.match(src,/detailRow\('Descrizione',ev\.description/);
 assert.match(src,/detailRow\('Luogo',ev\.location/);
 assert.match(src,/eventButton\(ev,false\)/);
 assert.match(src,/eventButton\(ev,true\)/);
 assert.match(src,/kyv:calendar-open-event/);
 assert.match(src,/kyv-cal-day-jump/);


// v288: gli eventi passati non sono più richiesti dal calendario Apps Script.
assert.match(src,/Storico Google Calendar disattivato/);
assert.match(src,/new Date\(requested\.endDate\+'T00:00:00'\)<=today/);
assert.match(src,/pending\.historyDisabled/);
assert.match(page,/Storico è disattivato|storico è disattivato/i);


// v289 - legacy Apps Script: events without range must not trigger a false red "not connected".
assert.match(page,/const legacyMode = !confirmedRange/);
assert.match(page,/if\(data\.range && !confirmedRange\)/,'mismatched explicit range still rejected');
assert.match(page,/Eventi disponibili · intervallo non verificato/);
assert.doesNotMatch(page,/Lo script Google attivo non conferma l’intervallo storico/);
assert.match(page,/listEventsCache = events/);
assert.match(src,/eventsInRange\(d\.response\.events,d\.requested\)/);
assert.match(src,/pending\.legacy=true/);
assert.match(src,/pending\.nextIndex=pending\.months\.length/);
assert.match(src,/modalità compatibilità/);
const period={startDate:'2026-11-06',endDate:'2026-11-09'};
const selected=h.eventsInRange([
 {title:'Yesterday',date:'2026-11-05T11:00:00'},
 {title:'Today',date:'2026-11-06T11:00:00'},
 {title:'Tomorrow',date:'2026-11-07T12:00:00'},
 {title:'End-exclusive',date:'2026-11-09T11:00:00'},
 {title:'All-day',date:'2026-11-08'}
],period);
assert.deepEqual(selected.map(x=>x.title),['Today','Tomorrow','All-day']);
assert.deepEqual(h.eventsInRange([],period),[]);
assert.deepEqual(h.eventsInRange([{date:'2026-11-08'}],null),[]);


const agendaUi=read('kyv-agenda-phase5.js');
assert.match(agendaUi,/panel=document\.createElement\('details'\)/,'Organization starts closed');
assert.match(agendaUi,/kyv-agenda-planning-collapse/,'Planning form uses native disclosure');
assert.match(agendaUi,/layout\.insertAdjacentElement\('afterend',panel\)/,'Organization goes below Calendar');
assert.match(page,/\.kyv-calendar-main\s*\{\s*order:-1;/,'Calendar stays at top');
assert.match(page,/\.kyv-calendar-layout\s*\{\s*display:flex;\s*flex-direction:column/,'Calendar gets full width');
assert.doesNotMatch(agendaUi,/details\.open\s*=\s*true/,'Planning and organization start closed');

console.log('Viste calendario: OK');
