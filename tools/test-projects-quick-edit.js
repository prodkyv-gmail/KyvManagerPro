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
console.log('OK: Progetti modifica rapida e nuovo progetto veloce (v2.83)');
