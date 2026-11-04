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
assert.ok(responsive.includes('font-size:10px!important'), 'Su smartphone i valori delle liste devono restare compatti ma leggibili');
assert.ok(responsive.includes('font-size:9.5px!important'), 'Su smartphone i pulsanti secondari devono restare compatti');
assert.ok(responsive.includes('font-size:9px!important'), 'Su smartphone il testo secondario deve restare leggibile');
assert.ok(responsive.includes('font-size:16px!important'), 'Gli input smartphone devono usare 16 px per evitare lo zoom automatico Safari/iOS');
assert.ok(responsive.includes('min-height:36px!important'), 'Le righe selezionabili mobile devono mantenere un target touch adeguato');

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

assert.match(sw, /kyv-studio-v2-61-project-clarity-20261104/, 'La cache PWA deve includere il fix delle tendine e l’UX Progetti corrente');
assert.ok(sw.includes("'./kyv-sheet-dropdown-fix.js'"), 'Il menu custom deve essere disponibile nella cache PWA');

console.log('OK: tendine Studio Editor visibili, responsive e protette.');