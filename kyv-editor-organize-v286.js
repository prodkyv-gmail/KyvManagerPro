/* KYV Studio Editor v2.86: date-first order, non-destructive filters and signals. */
(function(root){
'use strict';
const PRIMARY=Object.freeze(['PROGETTI','FATTURE','ESTRATTO SIAE','ESTRATTO_IMAIE']);
const DATE_KEYS=Object.freeze({
 'PROGETTI':['Data_Sessione','Data_Pubblicazione','Data_Consegna_Master','Datafattura','Data Contratto'],
 'FATTURE':['Data'],
 'ESTRATTO SIAE':['DATA'],
 'ESTRATTO_IMAIE':['created_at','DATA_PUBBL'],
 'Spese Extra':['Data'],
 'PIANI_FISCALI':['Data_Aggiornamento','Anno'],
 'CLIENTI':['created_at','Data_Inserimento'],
 'CONSEGNE_MASTER':['Data_Inserimento'],
 'EXPORT SIAE VERTICALE':['DATA','Data','created_at'],
 'EXPORT SIAE':['DATA','Data','created_at'],
 'AUDIO_VERSIONI':['DATA_FILE','created_at','updated_at'],
 'DROPBOX_AUDIO_FILES':['Data_Caricamento','created_at','Data_Consegna'],
 'INVII_AUDIO':['Data_Invio','created_at','Data_Conferma'],
 'DOCUMENTI_PROGETTO':['Data_Documento','created_at']
});
const FILTERS=Object.freeze([
 {value:'all',label:'Tutti i record'},
 {value:'recent30',label:'Ultimi 30 giorni'},
 {value:'recent365',label:'Ultimi 12 mesi'},
 {value:'no_date',label:'Senza data'},
 {value:'followup',label:'Follow-up da gestire'},
 {value:'missing',label:'Dati principali mancanti'},
 {value:'unpaid',label:'Da incassare'},
 {value:'payment_unknown',label:'Incasso da verificare'}
]);
function availableFilters(table,dateColumn){
 const names=['all'];
 if(dateColumn)names.push('recent30','recent365','no_date');
 if(table==='PROGETTI')names.push('followup','missing');
 if(table==='FATTURE')names.push('unpaid','payment_unknown');
 return FILTERS.filter(filter=>names.includes(filter.value));
}
function defaultSort(table,columns,primaryKey){
 const keys=new Set((columns||[]).map(String));
 const from=(DATE_KEYS[table]||[]).find(key=>keys.has(key));
 if(from)return{column:from,descending:true,isDate:true};
 const standard=['created_at','updated_at','Data','DATA','Data_Inserimento','Data_Aggiornamento','Anno','date','timestamp'];
 const found=standard.find(key=>keys.has(key));
 if(found)return{column:found,descending:true,isDate:true};
 const fallback=keys.has(primaryKey)?primaryKey:[...keys][0]||null;
 return{column:fallback,descending:true,isDate:false};
}
function dateNumber(value){
 if(value===null||value===undefined||value==='')return null;
 if(value instanceof Date){const n=value.getTime();return Number.isFinite(n)?n:null;}
 if(typeof value==='number'){if(value>=1900&&value<=2200)return Date.UTC(value,0,1);return null;}
 const str=String(value).trim();
 const year=/^\d{4}$/.test(str)?Number(str):null;
 if(year!==null&&year>=1900&&year<=2200)return Date.UTC(year,0,1);
 const iso=/^(\d{4})-(\d\d)-(\d\d)(?:[T\s].*)?$/.exec(str);
 if(iso){const y=+iso[1],m=+iso[2],d=+iso[3];if(m<1||m>12||d<1||d>31)return null;
   const stamp=Date.parse(str);return Number.isFinite(stamp)?stamp:null;}
 const it=/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/.exec(str);
 if(it){const stamp=Date.UTC(+it[3],+it[2]-1,+it[1]);const x=new Date(stamp);
   return x.getUTCFullYear()===+it[3]&&x.getUTCMonth()===+it[2]-1&&x.getUTCDate()===+it[1]?stamp:null;}
 return null;
}
function calendarToday(today){
 const date=today instanceof Date?today:new Date();
 return Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
}
function statusPaid(value){
 const valueText=String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
 if(['si','sì','true','1','yes','pagata','pagato','incassata','incassato','ricevuta'].includes(valueText))return 'paid';
 if(['no','false','0','non pagata','non pagato','non incassata','non incassato','da incassare','in attesa','aperta'].includes(valueText))return 'unpaid';
 return 'unknown';
}
function missingCore(table,row){
 if(table==='PROGETTI')return !String(row.TITOLO??'').trim()||!String(row.ARTISTA??'').trim();
 if(table==='FATTURE')return !String(row.Numero??'').trim()||!String(row.Data??'').trim();
 return false;
}
function followupDue(row,today){
 const d=dateNumber(row.Prossimo_Followup);return d!==null&&d<=calendarToday(today)+86400000-1;
}
function filterRows(rows,{table,filter='all',dateColumn=null,today=new Date()}={}){
 const list=Array.isArray(rows)?rows:[];
 if(filter==='all')return list;
 const end=calendarToday(today)+86400000-1;
 const days=filter==='recent30'?30:365;
 const earliest=end-days*86400000;
 return list.filter(row=>{
  const date=dateColumn?dateNumber(row[dateColumn]):null;
  if(filter==='recent30'||filter==='recent365')return date!==null&&date>=earliest&&date<=end;
  if(filter==='no_date')return date===null;
  if(filter==='followup')return table==='PROGETTI'&&followupDue(row,today);
  if(filter==='missing')return table==='PROGETTI'&&missingCore(table,row);
  if(filter==='unpaid')return table==='FATTURE'&&statusPaid(row.PAGATA)==='unpaid';
  if(filter==='payment_unknown')return table==='FATTURE'&&statusPaid(row.PAGATA)==='unknown';
  return true;
 });
}
function rowFlags(table,row,today){
 const flags=[];
 if(table==='PROGETTI'){
   if(followupDue(row,today))flags.push({kind:'attention',label:'Follow-up previsto'});
   if(missingCore(table,row))flags.push({kind:'missing',label:'Dati da completare'});
 }
 if(table==='FATTURE'){
   const payment=statusPaid(row.PAGATA);
   if(payment==='unpaid')flags.push({kind:'attention',label:'Da incassare'});
   if(payment==='unknown')flags.push({kind:'missing',label:'Incasso da verificare'});
 }
 return flags;
}
function safePreferences(raw){
 try{
  const json=JSON.parse(raw||'{}');
  if(!json||typeof json!=='object'||Array.isArray(json))return{};
  const result={};
  for(const [table,settings]of Object.entries(json)){
   if(!settings||typeof settings!=='object'||Array.isArray(settings))continue;
   const filter=FILTERS.some(x=>x.value===settings.filter)?settings.filter:'all';
   const pageSize=[60,120,240].includes(settings.pageSize)?settings.pageSize:120;
   result[table]={filter,pageSize};
  }
  return result;
 }catch(_){return{};}
}
root.KYV_EDITOR_ORGANIZE_V286=Object.freeze({
 PRIMARY,DATE_KEYS,FILTERS,availableFilters,defaultSort,dateNumber,calendarToday,
 statusPaid,missingCore,followupDue,filterRows,rowFlags,safePreferences
});
})(typeof window!=='undefined'?window:globalThis);
