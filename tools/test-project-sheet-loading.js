const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scheda_progetto.html'), 'utf8');

assert.match(source, /safeProjectRows\([\s\S]*?\.eq\('ID_PROGETTO', projectId\)/, 'Le relazioni devono essere filtrate per ID_PROGETTO');
assert.match(source, /q=>q\.in\('ID_FILE',audioIds\)/, 'Gli invii legacy devono essere recuperati tramite gli ID file collegati');
assert.match(source, /select\(column,\{count:'exact',head:true\}\)/, 'Le statistiche globali devono usare conteggi senza scaricare righe');
assert.match(source, /q=>q\.ilike\(column,/, 'Le relazioni legacy testuali devono essere filtrate lato server');
assert.doesNotMatch(source, /safeTable\('DROPBOX_AUDIO_FILES'/, 'Non deve restare il caricamento globale dell’archivio audio');
assert.doesNotMatch(source, /\.limit\(2000\)/, 'La scheda non deve più scaricare blocchi globali da 2000 righe');
assert.doesNotMatch(source, /eq\('Numero',p\.FT\)/, 'FT è un numero fattura annuale e non deve essere usato come chiave di relazione');
assert.match(source, /q=>q\.eq\('ID_FT',p\.IDFT\)/, 'Il fallback legacy ammesso deve usare IDFT → ID_FT');

console.log('Scheda Progetto: query filtrate e fallback legacy limitati OK.');
