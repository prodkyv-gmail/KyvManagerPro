// v2.83 — Progetti "gestionale": modifica e creazione rapide nei popup, senza perdere dati.
const assert=require('node:assert/strict'),fs=require('node:fs');
const page=fs.readFileSync('progetti.html','utf8');
// Modifica: solo i campi cambiati, con verifica identità e senza upsert/delete.
assert.ok(page.includes("EDIT_FIELDS=[['TITOLO','Titolo','text',true]"),'Campi di modifica rapida definiti');
assert.ok(page.includes("if(next!==before)payload[key]=next;"),'Si salvano solo i campi cambiati');
assert.ok(page.includes("'TITOLO' in payload&&!payload.TITOLO"),'Il titolo non può essere svuotato');
assert.ok(page.includes(".update(payload).eq('ID',p.ID).select('*').single()"),'Update su un solo ID');
assert.ok(page.includes("String(data?.ID)!==String(p.ID)"),'Verifica identità dopo il salvataggio');
assert.ok(page.includes("il modulo resta aperto"),'In caso di errore il modulo resta aperto');
// Creazione rapida: titolo obbligatorio, avviso duplicati, stato IDEA come in Cattura rapida.
assert.ok(page.includes("insert([{TITOLO:title,ARTISTA:artist||null,STATO:'IDEA'}])"),'Creazione come Cattura rapida');
assert.ok(page.includes("duplicateWarned!==key"),'Avviso prima di creare un duplicato');
assert.ok(page.includes("state.rows.some(x=>String(x.ID)===String(data.ID))"),'Nessun ID già esistente');
for(const id of ['new-project-quick-form','new-project-title','new-project-artist','new-project-save','new-project-msg'])
  assert.ok(page.includes('id="'+id+'"'),id);
assert.ok(page.includes('data-quick-edit'),'Pulsante Modifica nel popup');
// Cancellazione: mai dalla lista (collegata ad audio, fatture, sessioni).
assert.ok(!/from\('PROGETTI'\)\.(delete|upsert)\(/.test(page),'Nessuna cancellazione/upsert da Progetti');
// Accessibilità minima dei campi
assert.ok(page.includes('font-size:16px')&&page.includes('.pform input'),'Campi 16px: niente zoom su iPhone');
// v2.84 — Archivia: solo update di Archiviato_Il, mai cancellazione; migrazione additiva registrata nel repository.
assert.ok(page.includes("update({Archiviato_Il:archive?new Date().toISOString():null}).eq('ID',p.ID).select('*').single()"),'Archivia = update di una colonna su un solo ID');
assert.ok(page.includes("Object.prototype.hasOwnProperty.call(rows[0],'Archiviato_Il')"),'La pagina funziona anche prima della migrazione');
assert.ok(page.includes("Non viene cancellato nulla"),'Conferma esplicita e rassicurante');
assert.ok(page.includes('data-filter="ARCHIVIATI"')&&page.includes('id="project-archived-chip"'),'Vista Archiviati');
assert.ok(page.includes("const pool=archivedView?state.rows.filter(isArchived):live();"),'Gli archiviati restano fuori dalle liste normali');
const sql=fs.readFileSync('docs/v284-progetti-archivio.sql','utf8');
assert.ok(/add column if not exists "Archiviato_Il" timestamptz null/.test(sql),'Migrazione additiva e nullable');
assert.ok(!/drop table|delete from|truncate/i.test(sql.replace(/^--.*$/gm,'')),'La migrazione non cancella dati');
// La modifica completa non apre una seconda scheda: usa l'Editor originale con ID.
const studioEditor=fs.readFileSync('editor.html','utf8');
assert.ok(page.includes("const editProjectHref=id=>'editor.html?table=PROGETTI&editId='"),
 'Route di modifica completa per record richiesto');
assert.ok(page.includes('location.href=editProjectHref(row.dataset.id);'),
 'Clic sulla riga apre Modifica (PROGETTI) di Studio Editor');
assert.ok(page.includes("'<a class=\"quick-edit\" href=\"'+H(editProjectHref(p.ID))+'\">Modifica</a>'"),
 'Il riepilogo offre la stessa modifica canonica');
assert.ok(page.includes('data-quick-id'),'Riepilogo rapido resta accessibile su richiesta');
assert.ok(studioEditor.includes("params.get('table') !== 'PROGETTI'"),
 'Solo PROGETTI può usare il link diretto');
assert.ok(studioEditor.includes(".select('*').eq('ID',rawId).maybeSingle()"),
 'Caricamento completo del record singolo per ID');
assert.ok(studioEditor.includes("window.openDynamicModal(data.ID,'PROGETTI',data)"),
 'Studio Editor apre il suo modulo Modifica (PROGETTI) con dati reali');

console.log('OK: Progetti modifica rapida e nuovo progetto veloce (v2.83/v2.84 archivia)');
