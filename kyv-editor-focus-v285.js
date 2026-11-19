/* KYV Studio Editor · readable project view. Presentation only, zero database writes. */
(function(root){
'use strict';
const PROGETTI_COLUMNS=Object.freeze([
 'TITOLO','ARTISTA','STATO','Data_Sessione','Label','MANAGEMENT','Prossimo_Followup','FEE'
]);
const GROUPS=Object.freeze([
 {id:'identity',title:'Riepilogo',keys:['TITOLO','ARTISTA','STATO','SVILUPPO','NOTE','Nome_Vero_Artista']},
 {id:'people',title:'Persone e contatti',keys:['AUTORI','Label','MANAGEMENT','Produttore_Fonografico']},
 {id:'dates',title:'Date e attività',keys:['Data_Sessione','Data_Pubblicazione','Data_Consegna_Master','Prossimo_Followup','Ultimo_Sollecito','Esito_Ascolto','Priorita_Followup','Note_Followup']},
 {id:'economy',title:'Economia e contratti',keys:['FEE','ROY','IMPORTO','PAGAMENTO','FT','IDFT','Anticipo_Kill_Fee','Data Contratto','Datafattura','Contratto link']},
 {id:'technical',title:'Dati tecnici e collegamenti',keys:[]}
]);
function essentialKeys(table,available){
 const keys=Array.isArray(available)?available.map(String):[];
 if(table!=='PROGETTI')return keys;
 const found=PROGETTI_COLUMNS.filter(key=>keys.includes(key));
 return found.length?found:keys.slice(0,8);
}
function isFilled(value){return value!==null&&value!==undefined&&String(value).trim()!=='';}
function valueText(value){
 if(!isFilled(value))return '—';
 if(typeof value==='boolean')return value?'Sì':'No';
 const s=String(value);
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
 return m?m[3]+'/'+m[2]+'/'+m[1]:s;
}
function sections(record){
 if(!record||typeof record!=='object'||Array.isArray(record))return [];
 const keys=Object.keys(record),seen=new Set();
 const results=[];
 for(const group of GROUPS){
  const selected=group.id==='technical'?keys.filter(key=>!seen.has(key)):group.keys.filter(key=>keys.includes(key)&&!seen.has(key));
  selected.forEach(key=>seen.add(key));
  if(selected.length)results.push({id:group.id,title:group.title,keys:selected,filled:selected.filter(key=>isFilled(record[key])).length});
 }
 return results;
}
function modeFromStorage(raw){
 try{
  const o=JSON.parse(raw||'{}');
  return o&&o.PROGETTI==='all'?'all':'essential';
 }catch(_){return 'essential';}
}
root.KYV_EDITOR_FOCUS_V285=Object.freeze({PROGETTI_COLUMNS,essentialKeys,isFilled,valueText,sections,modeFromStorage});
})(typeof window!=='undefined'?window:globalThis);
