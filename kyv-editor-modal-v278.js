/* v2.78 — Presentational group/filter helpers for the existing Studio Editor form.
   No API/database access. Every field is retained for the original diff-only save path. */
(function(root){'use strict';
 const groups=[
  {id:'principali',title:'Dati principali',hint:'Identità del record e informazioni da consultare più spesso'},
  {id:'collegamenti',title:'Collegamenti e riferimenti',hint:'Progetti, fatture, codici e altri riferimenti registrati'},
  {id:'date',title:'Date e scadenze',hint:'Date registrate, impegni e relative scadenze'},
  {id:'economia',title:'Importi e condizioni economiche',hint:'Valori economici originali, senza ricalcoli automatici'},
  {id:'altri',title:'Altri dettagli',hint:'Campi aggiuntivi dell’archivio'}
 ];
 function classify(key){
  const k=String(key).toLowerCase().replace(/[^a-z0-9]+/g,'_');
  if(/(^|_)(id_progetto|idft|progetto_collegato|id_ft|cliente_collegato|codice|isrc|iswc|ipi|riferimento|link|url)(_|$)/.test(k)||/(^id_)/.test(k)||/collegat/.test(k))return 'collegamenti';
  if(/(^|_)(data|date|scadenza|scadenze|anno|mese|inizio|fine|timestamp)(_|$)/.test(k)||/(^data)|(^date)|scaden|_data|_date/.test(k))return 'date';
  if(/fee|roy|prezzo|importo|budget|pagament|incassat|pagata|costo|totale|impon|netto|lordo|fatturato|valuta|ritenuta|contribut|iva_/.test(k))return 'economia';
  if(/^(titolo|artista|stato|sviluppo|numero|denominazione|descrizione|nome|cognome|email|mail|telefono|cellulare|tipo|oggetto|status|categoria|azienda|committente|etichetta|label)$/.test(k))return 'principali';
  return 'altri';
 }
 function groupFields(keys){
  const result=groups.map(g=>({...g,keys:[]}));
  (keys||[]).forEach(key=>result.find(g=>g.id===classify(key)).keys.push(key));
  return result.filter(g=>g.keys.length);
 }
 const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it').trim();
 function matchesField(key,label,query,changedOnly=false,touched){
  if(changedOnly&&!touched?.has(key))return false;
  const q=normalize(query);
  return !q||normalize(key+' '+(label||'')).includes(q);
 }
 root.KYV_EDITOR_MODAL_V278=Object.freeze({classify,groupFields,matchesField});
})(typeof window!=='undefined'?window:globalThis);
