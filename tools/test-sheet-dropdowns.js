const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const responsive = read('kyv-sheet-responsive-menus.js');
const dropdown = read('kyv-sheet-dropdown-fix.js');
const sw = read('sw.js');

assert.ok(responsive.includes("if(page==='editor.html'"), 'Il fix delle tendine deve caricarsi solo nello Studio Editor');
assert.ok(responsive.includes("dropdownFix.src='kyv-sheet-dropdown-fix.js'"), 'Lo Studio Editor deve caricare il menu custom');
assert.ok(responsive.includes('font-size:8.5px!important'), 'Su smartphone i dati principali dei menu devono essere ridotti di 3 px');
assert.ok(responsive.includes('font-size:8px!important'), 'Su smartphone i pulsanti devono essere ridotti di 3 px');
assert.ok(responsive.includes('font-size:7.5px!important'), 'Su smartphone il testo secondario deve essere ridotto di 3 px');

assert.ok(dropdown.includes('kyv-cell-choice-list'), 'La tendina deve avere un elenco custom visibile');
assert.ok(dropdown.includes('function renderChoices'), 'La tendina deve renderizzare realmente i valori disponibili');
assert.ok(dropdown.includes('input.addEventListener(\'input\''), 'La lista deve filtrarsi mentre si scrive');
assert.ok(dropdown.includes('relationOptions(column)'), 'I REF devono caricare record reali');
assert.ok(dropdown.includes('recurringOptions(table,column)'), 'I campi ricorrenti devono caricare i valori già usati');
assert.ok(dropdown.includes('await safePatch({table,pk,rowId,column,original,next})'), 'Il salvataggio deve conservare la protezione concorrente');
assert.ok(dropdown.includes("if(String(live)!==String(original??''))throw new Error"), 'Un valore cambiato altrove deve bloccare il salvataggio');
assert.ok(dropdown.includes("window.confirm('Rimuovere il collegamento esistente da questo record?')"), 'La rimozione di un REF deve chiedere conferma');
assert.ok(dropdown.includes('stopImmediatePropagation()'), 'Il fix deve impedire che si apra anche il vecchio datalist nello stesso evento');
assert.doesNotMatch(dropdown, /<datalist/i, 'Il nuovo menu non deve dipendere dal datalist nativo');
assert.doesNotMatch(dropdown, /new MutationObserver/, 'Il fix delle tendine non deve aggiungere observer e possibili loop');

assert.match(sw, /kyv-studio-v2-32-dropdown-fix-20261008/, 'La cache PWA deve ruotare per distribuire il fix');
assert.ok(sw.includes("'./kyv-sheet-dropdown-fix.js'"), 'Il menu custom deve essere disponibile nella cache PWA');

console.log('OK: tendine Studio Editor visibili, responsive e protette.');
