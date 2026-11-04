// Economia: regression suite for toolbar controls fitting without horizontal clipping.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('fatture.html','utf8');
const responsive=fs.readFileSync('kyv-responsive.css','utf8');
const reconciliation=fs.readFileSync('kyv-invoice-reconciliation-v236.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const header=html.split('<header class="kyv-economy-header')[1]?.split('</header>')[0]||'';
assert.ok(header,'The Economy page has an explicit scoped header');
assert.ok(header.includes('class="kyv-economy-header-layout"'),'Header uses an independent vertical layout');
assert.ok(header.includes('class="kyv-economy-toolbar"'),'Actions must have dedicated wrapping layout');
assert.ok(header.includes('role="group" aria-label="Comandi Economia"'),'Toolbar is labelled for accessibility');
assert.ok(header.includes('class="kyv-economy-search"'),'Search is a flexible, full-width-safe item');
for(const label of ['correlazione-search','kyv_liquidazioni.html','kyv_intelligence.html','correlazione.html','kyv-aruba-open','data-kyv-new-table="FATTURE"','fetchFattureCorrelate()']){
 assert.ok(header.includes(label),'Economy header action missing: '+label);
}
assert.ok(reconciliation.includes("anchor.after(trigger)"),'The reconciliation button is dynamically appended after Aruba');
assert.ok(header.includes('id="kyv-aruba-open"'),'Dynamic reconciliation button must be inserted inside wrapping toolbar');
assert.doesNotMatch(header,/xl:w-auto|xl:flex-row/,'Avoid a wide unwrappable row when the sidebar occupies desktop width');
assert.ok(responsive.includes('max-height: 104px !important'),'Known mobile global header cap is present');
const css=html.split('/* Economia: header e comandi adattabili')[1]?.split('</style>')[0]||'';
assert.ok(css,'Scoped Economy CSS must exist');
assert.match(css,/main header\.kyv-economy-header\s*\{[^}]*max-height:\s*none\s*!important;/s,'Header height must override global mobile clipping');
assert.match(css,/\.kyv-economy-toolbar\s*\{[^}]*flex-wrap:\s*wrap\s*!important;/s,'Desktop/tablet toolbar wraps');
assert.match(css,/\.kyv-economy-toolbar\s*\{[^}]*overflow:\s*visible\s*!important;/s,'Toolbar must not clip');
assert.match(css,/@media\s*\(max-width:\s*767px\)[\s\S]*?\.kyv-economy-toolbar\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,'Mobile toolbar has two accessible columns');
assert.match(css,/@media\s*\(max-width:\s*767px\)[\s\S]*?\.kyv-economy-search\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/,'Mobile search occupies an entire row');
assert.match(css,/\.kyv-economy-toolbar > button\s*\{[^}]*white-space:\s*normal\s*!important;/,'Long dynamic and static button labels can wrap');
assert.match(css,/\.kyv-economy-toolbar > button\[aria-label="Ricarica fatture"\]/,'Reload action is not forgotten');
assert.ok(sw.includes("kyv-studio-v2-62-creative-audio-20261104"),'Updated PWA cache is required');
console.log('OK: Economy toolbar keeps search, seven actions, and dynamic reconciliation button visible at narrow widths');
