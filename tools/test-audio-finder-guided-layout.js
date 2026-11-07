// Audio Finder guidato: tre passi (Aggiungi, Conferma, I miei brani) e strumenti avanzati in fondo.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const page = fs.readFileSync(path.join(__dirname, '..', 'kyv_audio_finder.html'), 'utf8');
const at = marker => { const i = page.indexOf(marker); assert.ok(i >= 0, 'Manca: ' + marker); return i; };

// Ordine in pagina
const order = [
  'class="finder-intro"',
  'id="finder-status"',
  'id="finder-step-add"',
  'id="finder-sources-details"',
  'id="finder-step-confirm"',
  'id="finder-preview"',
  'id="finder-explorer"',
  'id="finder-tools"',
  'id="finder-audit-details"',
  'id="finder-batch-details"',
  'id="finder-review-details"',
  'id="finder-version-groups-details"',
  'id="finder-advanced"'
].map(at);
assert.deepEqual(order, [...order].sort((a, b) => a - b), 'Ordine dei blocchi non guidato');

// Percorso a tre passi con collegamenti validi
const jStart = at('<nav class="finder-journey"');
const journey = page.slice(jStart, page.indexOf('</nav>', jStart));
for (const label of ['1 · Aggiungi', '2 · Conferma', '3 · I miei brani']) assert.ok(journey.includes(label), label);
assert.ok(journey.includes('data-finder-jump="finder-sources-details"'));
for (const target of ['finder-sources-details', 'finder-step-confirm', 'finder-explorer'])
  assert.ok(journey.includes('href="#' + target + '"'), 'Collegamento verso ' + target);
for (const jump of ['finder-audit-details', 'finder-version-groups-details'])
  assert.ok(page.includes('data-finder-jump="' + jump + '"'), 'Scorciatoia avanzata ' + jump);

// Sorgenti: il dispositivo (unica via per smartphone) viene prima dei cloud; i file prima della cartella
const sources = page.slice(at('id="finder-sources"'), at('id="finder-step-confirm"'));
const pos = t => { const i = sources.indexOf(t); assert.ok(i >= 0, t); return i; };
assert.ok(pos('Questo dispositivo') < pos('<h2>Dropbox</h2>') && pos('<h2>Dropbox</h2>') < pos('<h2>Google Drive</h2>') && pos('<h2>Google Drive</h2>') < pos('<h2>OneDrive online</h2>'));
assert.ok(pos('id="finder-files"') < pos('id="finder-folder"'), 'Prima i file, poi la cartella (solo computer)');
assert.ok(page.includes('id="finder-sources-details" class="kyv-v260-disclosure finder-workflow-details" open'), 'Il passo 1 è aperto');

// Niente sigle di versione nei titoli visibili
assert.equal((page.match(/<h[23][^>]*>[^<]*· v2\.\d+/g) || []).length, 0, 'Titoli senza numero di versione');

// Smartphone: bersagli da 44px e campi a 16px (iOS non zooma al tocco), margine sicuro sotto
const mobile = page.slice(page.indexOf('.finder-head{padding:12px 14px}'));
assert.ok(mobile.includes('.finder-main button,.finder-main .explorer-small-btn,.explorer-item-actions a,.audit-entry-actions a{min-height:44px}'), 'Bersagli da 44px');
assert.ok(/\.finder-main select,[^{]*\{font-size:16px\}/.test(mobile), 'Campi a 16px su smartphone');
assert.ok(page.includes('env(safe-area-inset-bottom'), 'Spazio sicuro iPhone');
console.log('Audio Finder guidato: OK');
