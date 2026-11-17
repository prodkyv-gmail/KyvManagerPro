const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const calendar = read('kyv_calendar.html');
const menu = read('menu.js');
const dashboard = read('index.html');
const config = read('config.js');
const bridge = read('kyv-drive-bridge.js');
const dropbox = read('kyv_dropbox.html');
const projects = read('progetti.html');
const projectSheetPage = read('scheda_progetto.html');
const audioProjects = read('kyv-audio-project.js');
const projectInvoices = read('kyv-project-invoices.js');
const financeSummary = read('kyv-project-finance-summary.js');
const economyInvoices = read('kyv-economy-v6.js');
const qualityInvoices = read('kyv-data-quality.js');
const layoutPolish = read('kyv-layout-polish.js');
const releaseCloseout = read('kyv-release-closeout.js');
const projectEditSafety = read('kyv-project-edit-safety.js');
const recordEditor = read('kyv-record-editor.js');
const proxy = read('api/drive-proxy.js');
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html'));
const htmlBundle = htmlFiles.map(read).join('\n');

assert(calendar.includes('@supabase/supabase-js@2.49.4') && calendar.indexOf('@supabase/supabase-js@2.49.4') < calendar.indexOf('kyv-auth.js'), 'Calendar deve caricare Supabase prima di kyv-auth');
assert(!htmlBundle.includes('@supabase/supabase-js@2"'), 'Supabase JS deve usare una versione esatta');
assert(!htmlBundle.includes('lucide@latest'), 'Lucide deve usare una versione esatta');
assert(!htmlBundle.includes('npm/chart.js"'), 'Chart.js deve usare una versione esatta');
assert(htmlBundle.includes('@supabase/supabase-js@2.49.4'), 'Versione Supabase JS attesa non trovata');
assert(htmlBundle.includes('lucide@0.468.0'), 'Versione Lucide attesa non trovata');
assert(htmlBundle.includes('chart.js@4.4.7'), 'Versione Chart.js attesa non trovata');
assert(calendar.includes("loadKyvSidebar('calendar')"), 'Calendar deve evidenziare Agenda nel menu');
assert(calendar.includes('KYV_DRIVE.fetchJson'), 'Calendar deve usare il proxy condiviso');
assert(!calendar.includes('fetch(`${url}?action=getEvents`)'), 'Calendar non deve chiamare Apps Script direttamente');
assert(menu.match(/kyv_calendar\.html/g)?.length >= 2, 'Agenda deve comparire nel menu desktop e mobile');
assert(dashboard.includes('href="kyv_calendar.html"'), 'Oggi deve offrire accesso rapido ad Agenda');
assert(config.includes("email: 'prodkyv@gmail.com'"), 'Deve essere dichiarato l’account Google richiesto');
assert(config.includes("DROPBOX_APP_KEY: 'kpapjm7sybfs8ze'"), 'La chiave pubblica Dropbox deve essere centralizzata');
assert(
  bridge.includes("if(!isLocalDev()) throw improveDriveError(account, proxyErr)") &&
  bridge.includes("fallback:proxy-to-jsonp"),
  'In produzione il proxy deve essere autorevole e il fallback JSONP limitato allo sviluppo locale'
);
assert(bridge.includes('Authorization:`Bearer ${token}`'), 'Il bridge deve inviare la sessione al proxy');
assert(proxy.includes('/auth/v1/user') && proxy.includes('Sessione richiesta o scaduta'), 'Il proxy deve verificare la sessione Supabase');
assert(proxy.includes('DEFAULT_ALLOWED_TARGETS') && proxy.includes('KYV_APPS_SCRIPT_PROXY_SECRET'), 'Il proxy deve limitare i target e supportare un segreto solo server-side');
assert(!proxy.includes("Access-Control-Allow-Origin', '*'"), 'Il proxy non deve esporre CORS wildcard');
assert(dropbox.includes('ensureDropboxChooser'), 'Dropbox deve caricare il Chooser con diagnostica');
assert(dropbox.includes('Puoi comunque incollare il link Dropbox'), 'Dropbox deve mantenere il fallback manuale');
assert(projects.includes('acquisisci_audio.html') && projects.includes('openNewProjectChoices'), 'La creazione progetto deve restare accessibile');
assert(projectSheetPage.includes("q=>q.eq('ID_PROGETTO', projectId)"), 'La Scheda Progetto deve filtrare le relazioni per ID_PROGETTO');
assert(projectSheetPage.includes("q=>q.in('ID_FILE',audioIds)"), 'La Scheda Progetto deve recuperare gli invii tramite i file audio collegati');
assert(!projectSheetPage.includes("safeTable('DROPBOX_AUDIO_FILES'"), 'La Scheda Progetto non deve caricare globalmente gli archivi correlati');
assert(audioProjects.includes('insertProjectSafely') && audioProjects.includes('Crea progetto e collega'), 'La creazione progetto contestuale deve restare disponibile');

assert(config.includes("invoices.src='kyv-project-invoices.js'"), 'Le fatture progetto devono essere caricate nelle viste producer collegate');
assert(config.includes("projectRelations.src='kyv-project-relations.js'"), 'Il contratto relazioni deve essere caricato prima dei consumer');
assert(projectInvoices.includes("from('FATTURE').select") && projectInvoices.includes(".eq('ID_PROGETTO',projectId)"), 'Le fatture progetto devono usare ID_PROGETTO come collegamento principale');
assert(projectInvoices.includes("select('ID,IDFT')"), 'Il fallback legacy deve usare soltanto IDFT → FATTURE.ID_FT');
assert.equal((projectInvoices.match(/KYV_PROJECT_RELATIONS\.resolveProjectInvoices/g)||[]).length,2, 'Contesto e lista progetti devono usare lo stesso resolver');
assert(projectSheetPage.includes('KYV_PROJECT_RELATIONS.resolveProjectInvoices'), 'La Scheda combina le relazioni tramite il contratto condiviso');
assert(!projectInvoices.includes(".eq('Numero',project.FT)"), 'Il numero fattura FT non deve mai essere usato per collegare un progetto');
assert(projectInvoices.includes("tab=amministrazione") && projectInvoices.includes("newInvoice=1"), 'Le viste collegate devono aprire direttamente Amministrazione e la creazione fattura contestuale');
assert(projectInvoices.includes('Registra fattura') && projectInvoices.includes('Da incassare') && projectInvoices.includes('Incassata'), 'Lo stato fattura deve essere visibile nel flusso producer');
assert(recordEditor.includes("FATTURE:") && recordEditor.includes("'ID_PROGETTO'"), 'L’editor condiviso deve continuare a collegare la fattura al progetto senza nuove tabelle');
assert(!projectInvoices.match(/\.from\(['"][^'"]+['"]\)\s*\.insert/), 'Il modulo fatture progetto deve delegare la scrittura all’editor condiviso');

assert(config.includes("financeSummary.src='kyv-project-finance-summary.js'"), 'La Scheda progetto deve caricare il riepilogo fattura/pagamento');
assert(financeSummary.includes('Fattura') && financeSummary.includes('Pagamento') && financeSummary.includes('Residuo da incassare'), 'Il riepilogo economico deve rendere visibili fattura e stato incasso nella parte alta della Scheda');
assert(financeSummary.includes('KYV_INVOICE_LINE?.amount') && financeSummary.includes('PrezzoUnitario'), 'Il riepilogo deve utilizzare il prezzo unitario, non il totale fiscale');
assert(financeSummary.includes(".eq('ID_PROGETTO',pid)") && financeSummary.includes("select('ID,IDFT')"), 'Il riepilogo economico deve usare ID_PROGETTO e IDFT/ID_FT');
assert(!financeSummary.includes(".eq('Numero',project.data.FT)"), 'Il riepilogo economico non deve collegare per numero fattura');
assert(financeSummary.includes('KYV_PROJECT_RELATIONS.resolveProjectInvoices'), 'Riepilogo deve preferire quote esplicite tramite il resolver condiviso');
assert(economyInvoices.includes('KYV_PROJECT_RELATIONS.resolveProjectInvoices'), 'Economia deve includere fatture collegate con lo stesso resolver');
assert(qualityInvoices.includes("key:'invoice-id-conflict'"), 'Data Quality deve rilevare conflitti ID_PROGETTO/IDFT');
for(const source of [projectSheetPage,projectInvoices,financeSummary,economyInvoices]) assert(!/\.eq\(['"]Numero['"]\s*,[^)]*\b(?:p|project)(?:\.data)?\.FT\b/.test(source),'Vietato collegare fatture tramite Numero = FT');
assert(config.includes("layoutPolish.src='kyv-layout-polish.js'"), 'Le viste producer devono caricare il modulo di leggibilità/scroll');
assert(layoutPolish.includes('#kyv-listen-versions') && layoutPolish.includes('#kyv-agenda-actions') && layoutPolish.includes('#tab-admin table'), 'Il layout polish deve coprire Ascolto, Agenda e tabelle amministrative');
assert(layoutPolish.includes('overflow-y:auto') && layoutPolish.includes('overflow-x:auto'), 'I contenitori dati estesi devono avere scroll verticale/orizzontale esplicito dove serve');
assert(!layoutPolish.includes('new MutationObserver'), 'Il layout polish non deve introdurre observer globali');

assert(config.includes("releaseCloseout.src='kyv-release-closeout.js'"), 'La Scheda progetto deve caricare il percorso di chiusura release');
assert(releaseCloseout.includes('Master definitivo') && releaseCloseout.includes('ISRC') && releaseCloseout.includes('Data pubblicazione'), 'Il closeout deve guidare master, ISRC e data pubblicazione');
assert(releaseCloseout.includes('Label / produttore fonografico') && releaseCloseout.includes('Split / quote') && releaseCloseout.includes('Credito KYV'), 'Il closeout deve verificare label/produzione fonografica e crediti');
assert(releaseCloseout.includes("update({STATO:'Pubblicato'})"), 'La chiusura deve aggiornare soltanto lo stato del progetto');
assert(!releaseCloseout.includes("SVILUPPO:'Pubblicata'"), 'La chiusura release non deve sovrascrivere SVILUPPO');
assert(releaseCloseout.includes('Fattura & incasso'), 'Dopo la chiusura il flusso deve portare ad amministrazione/fattura');
assert(!releaseCloseout.includes('observer.observe(root,{childList:true,subtree:true,characterData:true})'), 'Il closeout release non deve usare un observer globale che possa autoalimentarsi');
assert(config.includes("projectEditSafety.src='kyv-project-edit-safety.js'"), 'La Scheda progetto deve caricare il guard di salvataggio non distruttivo');
assert(projectEditSafety.includes('stopImmediatePropagation') && projectEditSafety.includes('Nessuna modifica da salvare'), 'Il guard deve sostituire il submit legacy con un salvataggio patch-only');

console.log('Controlli integrazioni: OK');
