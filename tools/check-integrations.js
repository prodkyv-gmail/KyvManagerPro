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
const audioProjects = read('kyv-audio-project.js');

assert(calendar.includes('@supabase/supabase-js@2') && calendar.indexOf('@supabase/supabase-js@2') < calendar.indexOf('kyv-auth.js'), 'Calendar deve caricare Supabase prima di kyv-auth');
assert(calendar.includes("loadKyvSidebar('calendar')"), 'Calendar deve evidenziare Agenda nel menu');
assert(calendar.includes('KYV_DRIVE.fetchJson'), 'Calendar deve usare il proxy condiviso');
assert(!calendar.includes('fetch(`${url}?action=getEvents`)'), 'Calendar non deve chiamare Apps Script direttamente');
assert(menu.match(/kyv_calendar\.html/g)?.length >= 2, 'Agenda deve comparire nel menu desktop e mobile');
assert(dashboard.includes('href="kyv_calendar.html"'), 'Oggi deve offrire accesso rapido ad Agenda');
assert(config.includes("email: 'prodkyv@gmail.com'"), 'Deve essere dichiarato l’account Google richiesto');
assert(config.includes("DROPBOX_APP_KEY: 'kpapjm7sybfs8ze'"), 'La chiave pubblica Dropbox deve essere centralizzata');
assert(bridge.includes('isPermanentProxyError'), 'Il proxy deve evitare fallback inutili su errori permanenti');
assert(dropbox.includes('ensureDropboxChooser'), 'Dropbox deve caricare il Chooser con diagnostica');
assert(dropbox.includes('Puoi comunque incollare il link Dropbox'), 'Dropbox deve mantenere il fallback manuale');
assert(projects.includes('Nuovo progetto'), 'La creazione progetto deve restare accessibile');
assert(audioProjects.includes('insertProjectSafely') && audioProjects.includes('Crea progetto e collega'), 'La creazione progetto contestuale deve restare disponibile');

console.log('Controlli integrazioni: OK');
