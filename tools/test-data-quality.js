const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audit, normalize } = require('../kyv-data-quality.js');

const page = fs.readFileSync(path.join(__dirname, '..', 'data_quality.html'), 'utf8');
const editor = fs.readFileSync(path.join(__dirname, '..', 'kyv-record-editor.js'), 'utf8');

assert.match(page, /readRows\(qualityDb, 'PROGETTI'/);
assert.match(page, /readRows\(qualityDb, 'AUDIO_VERSIONI'/);
assert.match(page, /readRows\(qualityDb, 'DROPBOX_AUDIO_FILES'/);
assert.match(page, /readRows\(qualityDb, 'DOCUMENTI_PROGETTO'/);
assert.match(page, /readRows\(qualityDb, 'FATTURE'/);
assert.match(page, /readRows\(qualityDb, 'INVII_AUDIO'/);
assert.match(page, /\.limit\(limits\[table\]\)/, 'Ogni lettura deve essere limitata');
assert.match(page, /kyv-record-editor\.js/, 'Data Quality deve usare l’editor condiviso per le correzioni');
assert.match(page, /data-quality-edit/, 'Le anomalie correggibili devono esporre un’azione esplicita');
assert.match(page, /fields:\[item\.editField\]/, 'L’editor deve aprire solo il campo segnalato');
assert.doesNotMatch(page, /\.from\([^)]*\)\s*\.(?:insert|update|upsert|delete)\b/, 'Data Quality non deve scrivere direttamente: le modifiche passano dall’editor condiviso');
assert.match(editor, /open\(tableName, rowId = null, openOptions = \{\}\)/, 'L’editor deve supportare aperture focalizzate');
assert.match(editor, /requestedFields/, 'L’editor deve limitare i campi quando richiesto');

assert.equal(normalize('  Èstate d’Amore  '), 'estate d amore');

const result = audit({
    projects: [
        { ID:1, TITOLO:'Stessa Canzone', ARTISTA:'Artista', PAGAMENTO:'NO' },
        { ID:2, TITOLO:' stessa-canzone ', ARTISTA:'ARTISTA' },
        { ID:3, TITOLO:'', ARTISTA:'Altro' },
        { ID:4, TITOLO:'Solo', ARTISTA:'', Nome_Vero_Artista:'Nome vero', IDFT:'999' }
    ],
    audioVersions: [
        { ID_VERSIONE:10, ID_PROGETTO:1, NOME_FILE:'demo.wav', CONTENT_HASH:'' },
        { ID_VERSIONE:11, ID_PROGETTO:1, NOME_FILE:'master.wav', CONTENT_HASH:'abc' }
    ],
    dropboxAudio: [{ ID_FILE:20, ID_PROGETTO:4, Nome_File:'rough.mp3', Hash_SHA256:null }],
    documents: [{ ID_DOCUMENTO:30, ID_PROGETTO:1, Titolo_Documento:'Nota', Link_Drive:null }],
    invoices: [
        { ID_FT:50, Numero:1, Denominazione:'Cliente', ID_PROGETTO:1, PAGATA:'SI' },
        { ID_FT:51, Numero:2, Denominazione:'Orfana', ID_PROGETTO:999, PAGATA:'NO' }
    ],
    sends: [{ ID_INVIO:60, ID_PROGETTO:999, Destinatario:'A&R' }]
});

const byKey = Object.fromEntries(result.groups.map(group => [group.key, group]));
assert.equal(byKey['missing-title'].items.length, 1);
assert.equal(byKey['missing-title'].items[0].editField, 'TITOLO');
assert.equal(byKey['missing-artist'].items.length, 1);
assert.equal(byKey['missing-artist'].items[0].editField, 'ARTISTA');
assert.deepEqual(byKey['duplicate-project'].items[0].projectIds, ['1', '2']);
assert.equal(byKey['duplicate-project'].items[0].action, 'compare-projects');
assert.equal(byKey['missing-audio-hash'].items.length, 2);
assert.equal(byKey['missing-audio-hash'].items[0].editTable, 'AUDIO_VERSIONI');
assert.equal(byKey['missing-document-link'].items.length, 1);
assert.equal(byKey['missing-document-link'].items[0].editField, 'Link_Drive');
assert.equal(byKey['invalid-audio-hash'].items.length, 1);
assert.equal(byKey['orphan-relations'].items.length, 3);
assert.equal(byKey['payment-mismatch'].items.length, 1);
assert.equal(result.totalIssues, 11);
assert.equal(result.stats.audio, 3);
assert.equal(result.stats.invoices, 2);
assert.equal(result.stats.relationIssues, 3);
assert.equal(result.stats.paymentIssues, 1);

console.log('OK: regole Data Quality e correzione assistita verificate.');
