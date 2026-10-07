const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audit, normalize } = require('../kyv-data-quality.js');

const page = fs.readFileSync(path.join(__dirname, '..', 'data_quality.html'), 'utf8');
assert.match(page, /readRows\(db, 'PROGETTI'/);
assert.match(page, /readRows\(db, 'AUDIO_VERSIONI'/);
assert.match(page, /readRows\(db, 'DROPBOX_AUDIO_FILES'/);
assert.match(page, /readRows\(db, 'DOCUMENTI_PROGETTO'/);
assert.match(page, /\.limit\(limits\[table\]\)/, 'Ogni lettura deve essere limitata');
assert.doesNotMatch(page, /\.from\([^)]*\)\s*\.(?:insert|update|upsert|delete)\b/, 'Data Quality deve restare in sola lettura');

assert.equal(normalize('  Èstate d’Amore  '), 'estate d amore');

const result = audit({
    projects: [
        { ID:1, TITOLO:'Stessa Canzone', ARTISTA:'Artista' },
        { ID:2, TITOLO:' stessa-canzone ', ARTISTA:'ARTISTA' },
        { ID:3, TITOLO:'', ARTISTA:'Altro' },
        { ID:4, TITOLO:'Solo', ARTISTA:'', Nome_Vero_Artista:'Nome vero' }
    ],
    audioVersions: [
        { ID_VERSIONE:10, ID_PROGETTO:1, NOME_FILE:'demo.wav', CONTENT_HASH:'' },
        { ID_VERSIONE:11, ID_PROGETTO:1, NOME_FILE:'master.wav', CONTENT_HASH:'abc' }
    ],
    dropboxAudio: [{ ID_FILE:20, ID_PROGETTO:4, Nome_File:'rough.mp3', Hash_SHA256:null }],
    documents: [{ ID_DOCUMENTO:30, ID_PROGETTO:1, Titolo_Documento:'Nota', Link_Drive:null }]
});

const byKey = Object.fromEntries(result.groups.map(group => [group.key, group]));
assert.equal(byKey['missing-title'].items.length, 1);
assert.equal(byKey['missing-artist'].items.length, 1);
assert.deepEqual(byKey['duplicate-project'].items[0].projectIds, ['1', '2']);
assert.equal(byKey['missing-audio-hash'].items.length, 2);
assert.equal(byKey['missing-document-link'].items.length, 1);
assert.equal(result.totalIssues, 6);
assert.equal(result.stats.audio, 3);

console.log('OK: regole Data Quality verificate.');
