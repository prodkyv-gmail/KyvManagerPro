// GOOGLE_APPS_SCRIPT_DRIVE_TEMPLATE.gs - v2.11.7 CLEAN
// Script pulito per ricreare da zero il collegamento Google Drive di KyvManagerPro.
// Usa SOLO DriveApp + ContentService: non serve abilitare il servizio avanzato Drive API.
//
// Procedura:
// 1) Apri script.google.com con l'account Drive corretto, es. prodkyv@gmail.com.
// 2) Nuovo progetto Apps Script.
// 3) Incolla tutto questo file in Code.gs.
// 4) Salva.
// 5) Esegui una volta testDrive dal menu Run/Esegui e autorizza.
// 6) Deploy > New deployment > Web app.
// 7) Execute as: Me / Esegui come me.
// 8) Who has access: Anyone / Chiunque.
// 9) Copia l'URL che finisce con /exec e incollalo in KyvManagerPro > Google Drive.

var KYV_SCRIPT_VERSION = '2.11.7-clean';
var KYV_AUDIO_EXT_RE = /\.(mp3|wav|m4a|aif|aiff|flac|aac|ogg|opus|wma)$/i;
var KYV_AUDIO_MIME_RE = /^audio\//i;
var KYV_DEFAULT_LIMIT = 150;

function doGet(e) {
  try {
    e = e || { parameter: {} };
    var action = String((e.parameter && e.parameter.action) || 'ping');

    if (action === 'ping') return output_({
      ok: true,
      service: 'KYV Drive script',
      version: KYV_SCRIPT_VERSION,
      method: 'DriveApp',
      email: safeEmail_(),
      time: new Date().toISOString()
    }, e);

    if (action === 'getDriveFiles') return getDriveFiles_(e);

    return output_({
      ok: true,
      message: 'KYV Drive script online',
      action: action,
      version: KYV_SCRIPT_VERSION,
      email: safeEmail_()
    }, e);
  } catch (err) {
    return output_({
      ok: false,
      version: KYV_SCRIPT_VERSION,
      error: String(err && err.stack ? err.stack : (err && err.message ? err.message : err))
    }, e);
  }
}

// Eseguila una volta manualmente dall'editor Apps Script per forzare autorizzazione Drive.
function testDrive() {
  var data = listAudioFiles_('', 5);
  Logger.log(JSON.stringify({
    ok: true,
    version: KYV_SCRIPT_VERSION,
    email: safeEmail_(),
    count: data.files.length,
    sample: data.files
  }, null, 2));
  return data.files.length;
}

function getDriveFiles_(e) {
  var q = String((e.parameter && e.parameter.q) || '').toLowerCase().trim();
  var limit = Number((e.parameter && e.parameter.limit) || KYV_DEFAULT_LIMIT);
  if (!limit || limit < 1) limit = KYV_DEFAULT_LIMIT;
  if (limit > 500) limit = 500;

  var data = listAudioFiles_(q, limit);
  return output_({
    ok: true,
    service: 'KYV Drive script',
    version: KYV_SCRIPT_VERSION,
    method: 'DriveApp',
    email: safeEmail_(),
    files: data.files,
    nextPageToken: '',
    scanned: data.scanned,
    limit: limit,
    query: q
  }, e);
}

function listAudioFiles_(query, limit) {
  // DriveApp non ha paginazione esportabile verso il browser. Manteniamo un limite alto ma sicuro.
  var iterator;
  try {
    // Cerca tutto ciò che non è nel cestino. È più stabile tra account diversi rispetto a query mimeType complesse.
    iterator = DriveApp.searchFiles('trashed = false');
  } catch (err) {
    // Fallback estremo: lista radice, utile solo per diagnosi.
    iterator = DriveApp.getFiles();
  }

  var files = [];
  var scanned = 0;

  while (iterator.hasNext() && files.length < limit && scanned < 3000) {
    scanned++;
    var file = iterator.next();
    var name = safeString_(file.getName());
    var mime = safeString_(file.getMimeType());
    var blob = (name + ' ' + mime).toLowerCase();
    var isAudio = KYV_AUDIO_MIME_RE.test(mime) || KYV_AUDIO_EXT_RE.test(name);

    if (!query && !isAudio) continue;
    if (query && blob.indexOf(query) === -1) continue;

    files.push(normalizeFile_(file));
  }

  files.sort(function(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''), 'it', { numeric: true, sensitivity: 'base' });
  });

  return { files: files, scanned: scanned };
}

function normalizeFile_(file) {
  var id = file.getId();
  var name = safeString_(file.getName()) || 'File Drive';
  var mime = safeString_(file.getMimeType());
  var viewUrl = file.getUrl();
  var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id);

  return {
    id: id,
    name: name,
    filename: name,
    title: name,
    mimeType: mime,
    type: mime,
    size: formatSize_(safeNumber_(function(){ return file.getSize(); })),
    created: safeDate_(function(){ return file.getDateCreated(); }),
    updated: safeDate_(function(){ return file.getLastUpdated(); }),
    url: viewUrl,
    webViewLink: viewUrl,
    webContentLink: downloadUrl,
    playUrl: downloadUrl,
    folder: folderName_(file)
  };
}

function folderName_(file) {
  try {
    var parents = file.getParents();
    if (parents && parents.hasNext()) return safeString_(parents.next().getName()) || 'Drive';
  } catch (err) {}
  return 'Drive';
}

function safeEmail_() {
  try { return Session.getEffectiveUser().getEmail() || ''; }
  catch (err) { return ''; }
}

function safeString_(v) {
  return v === null || v === undefined ? '' : String(v);
}

function safeNumber_(fn) {
  try { return Number(fn() || 0); }
  catch (err) { return 0; }
}

function safeDate_(fn) {
  try {
    var d = fn();
    return d && d.toISOString ? d.toISOString() : '';
  } catch (err) { return ''; }
}

function formatSize_(bytes) {
  if (!bytes) return '';
  var units = ['B', 'KB', 'MB', 'GB', 'TB'];
  var n = bytes;
  var i = 0;
  while (n >= 1024 && i < units.length - 1) { n = n / 1024; i++; }
  return (Math.round(n * 10) / 10) + ' ' + units[i];
}

function output_(obj, e) {
  var callback = String((e && e.parameter && e.parameter.callback) || '').trim();
  if (callback) {
    var safeCallback = callback.replace(/[^a-zA-Z0-9_.$]/g, '');
    return ContentService
      .createTextOutput(safeCallback + '(' + JSON.stringify(obj) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
