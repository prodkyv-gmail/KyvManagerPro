/* KYV Agenda · private local-file calendar import. Parse/preview in the browser; no auto-write. */
(function(root){
'use strict';
const MAX_FILE_BYTES=2*1024*1024,MAX_EVENTS=500;
function dateISO(value){
 const s=String(value||'').trim();
 let y,m,d;
 if(/^\d{4}-\d{2}-\d{2}$/.test(s)){[y,m,d]=s.split('-').map(Number);}
 else if(/^\d{8}$/.test(s)){y=+s.slice(0,4);m=+s.slice(4,6);d=+s.slice(6,8);}
 else{const it=/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/.exec(s);if(!it)return null;d=+it[1];m=+it[2];y=+it[3];}
 if(y<1900||y>2200||m<1||m>12||d<1||d>31)return null;
 const check=new Date(Date.UTC(y,m-1,d));
 if(check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d)return null;
 return [y,String(m).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
}
function nextDate(day,delta){
 const t=Date.parse(day+'T12:00:00Z');return new Date(t+delta*86400000).toISOString().slice(0,10);
}
function unescapeIcs(value){
 return String(value||'').replace(/\\[nN]/g,'\n').replace(/\\([;,\\])/g,'$1').trim();
}
function icsDate(value,params=''){
 const text=String(value||'').trim();
 const dateOnly=/^\d{8}$/.test(text)||/VALUE=DATE/i.test(params);
 if(dateOnly)return{day:dateISO(text.slice(0,8)),time:'',allDay:true};
 const match=/^(\d{8})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(text);
 if(!match)return null;
 const day=dateISO(match[1]);
 if(!day||+match[2]>23||+match[3]>59||+(match[4]||0)>59)return null;
 // UTC instants are converted to the browser's local civil time; floating/TZID
 // times are preserved as written and clearly identified in preview.
 if(match[5]){
  const stamp=Date.UTC(+match[1].slice(0,4),+match[1].slice(4,6)-1,+match[1].slice(6,8),+match[2],+match[3],+(match[4]||0));
  const d=new Date(stamp);
  return{day:[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),
   time:[d.getHours(),d.getMinutes()].map(x=>String(x).padStart(2,'0')).join(':'),allDay:false};
 }
 return{day,time:match[2]+':'+match[3],allDay:false,tzid:/TZID=([^;:]+)/i.exec(params)?.[1]||''};
}
function parseIcs(text){
 const lines=String(text).replace(/\r\n?/g,'\n').split('\n');
 const unfolded=[];
 for(const line of lines){if(/^[ \t]/.test(line)&&unfolded.length)unfolded[unfolded.length-1]+=line.slice(1);else unfolded.push(line);}
 let current=null;const records=[];let ignored=0;
 for(const line of unfolded){
  if(line.trim().toUpperCase()==='BEGIN:VEVENT'){current={};continue;}
  if(line.trim().toUpperCase()==='END:VEVENT'){
   if(current){
    const start=icsDate(current.DTSTART?.value,current.DTSTART?.params);
    let end=icsDate(current.DTEND?.value,current.DTEND?.params);
    if(start&&String(current.SUMMARY?.value||'').trim()){
     if(!end)end=start.allDay?{day:nextDate(start.day,1),time:'',allDay:true}:null;
     if(end){
      let endDate=end.day;
      if(start.allDay&&end.allDay&&endDate>start.day)endDate=nextDate(endDate,-1);
      if(endDate<start.day)endDate=start.day;
      records.push({
       title:unescapeIcs(current.SUMMARY.value).slice(0,250),
       date:start.day,endDate,allDay:start.allDay,
       time:start.allDay?'':start.time,endTime:start.allDay?'':end.time,
       description:unescapeIcs(current.DESCRIPTION?.value||'').slice(0,5000),
       location:unescapeIcs(current.LOCATION?.value||'').slice(0,500),
       externalId:unescapeIcs(current.UID?.value||'').slice(0,220),
       timezone:start.tzid||''
      });
     }else ignored++;
    }else ignored++;
   }
   current=null;continue;
  }
  if(!current)continue;
  const divider=line.indexOf(':');
  if(divider<1)continue;
  const head=line.slice(0,divider),key=head.split(';')[0].toUpperCase();
  if(['DTSTART','DTEND','SUMMARY','DESCRIPTION','LOCATION','UID'].includes(key)){
   current[key]={value:line.slice(divider+1),params:head.slice(key.length)};
  }
 }
 if(records.length>MAX_EVENTS)throw Error('Il calendario contiene più di 500 eventi: esporta un intervallo più piccolo.');
 return {records,ignored};
}
function csvGrid(text){
 let rows=[],row=[],item='',quoted=false;const s=String(text).replace(/^\ufeff/,'');
 const first=s.split(/\r?\n/)[0]||'',separator=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c==='"'){if(quoted&&s[i+1]==='"'){item+='"';i++;}else quoted=!quoted;}
  else if(c===separator&&!quoted){row.push(item);item='';}
  else if((c==='\n'||c==='\r')&&!quoted){
   if(c==='\r'&&s[i+1]==='\n')i++;
   row.push(item);if(row.some(v=>v.trim()))rows.push(row);row=[];item='';
  }else item+=c;
 }
 if(quoted)throw Error('CSV non valido: virgolette non chiuse.');
 row.push(item);if(row.some(v=>v.trim()))rows.push(row);
 return rows;
}
function normalizeKey(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function parseCsv(text){
 const rows=csvGrid(text);if(rows.length<2)throw Error('CSV vuoto o senza righe da importare.');
 const headers=rows[0].map(normalizeKey);
 function at(row,...keys){const index=headers.findIndex(h=>keys.includes(h));return index>=0?String(row[index]??'').trim():'';}
 if(!headers.some(h=>['title','titolo','evento','oggetto','summary'].includes(h))||
    !headers.some(h=>['date','data','datainizio','start','startdate','eventdate'].includes(h)))
  throw Error('CSV: sono necessarie le colonne Titolo e Data (o title e date).');
 if(rows.length-1>MAX_EVENTS)throw Error('CSV oltre 500 righe: dividi il file.');
 const records=[];let ignored=0;
 for(const row of rows.slice(1)){
  const title=at(row,'title','titolo','evento','oggetto','summary');
  const date=dateISO(at(row,'date','data','datainizio','start','startdate','eventdate'));
  if(!title||!date){ignored++;continue;}
  const endDate=dateISO(at(row,'enddate','datafine','fine'))||date;
  const time=at(row,'time','ora','orainizio','starttime');
  const endTime=at(row,'endtime','orafine','fineora');
  const rawAllDay=at(row,'allday','tuttogiorno','giornointero').toLowerCase();
  const allDay=rawAllDay?['1','yes','si','sì','true'].includes(rawAllDay):!time;
  if(!allDay&&(!/^\d{1,2}:\d{2}$/.test(time)||!/^\d{1,2}:\d{2}$/.test(endTime))){ignored++;continue;}
  records.push({
   title:title.slice(0,250),date,endDate:dateISO(endDate)||date,allDay,
   time:allDay?'':time.padStart(5,'0'),endTime:allDay?'':endTime.padStart(5,'0'),
   description:at(row,'description','descrizione','note','dettagli').slice(0,5000),
   location:at(row,'location','luogo','indirizzo').slice(0,500),
   externalId:at(row,'uid','id','externalid').slice(0,220),timezone:''
  });
 }
 return {records,ignored};
}
async function readFile(file){
 if(!file||file.size<=0||file.size>MAX_FILE_BYTES)throw Error('Seleziona un file .ics o .csv di massimo 2 MB.');
 const ext=/\.([a-z]+)$/i.exec(file.name)?.[1]?.toLowerCase();
 if(!['ics','csv'].includes(ext))throw Error('Formato non supportato: scegli un calendario .ics oppure un elenco .csv.');
 const text=await file.text();
 if(text.includes('\0'))throw Error('File non testuale.');
 return {...(ext==='ics'?parseIcs(text):parseCsv(text)),name:file.name,format:ext};
}
function key(record){
 // Stable and source-independent across repeat imports. Avoid future edits colliding
 // just because the imported file's name changed.
 const basis=[record.externalId||'',record.date,record.time,record.endDate,record.title].join('|').toLocaleLowerCase('it');
 let hash=2166136261;
 for(let i=0;i<basis.length;i++){hash^=basis.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return 'local-'+(hash>>>0).toString(16).padStart(8,'0')+'-'+basis.length;
}
root.KYV_AGENDA_LOCAL=Object.freeze({MAX_FILE_BYTES,MAX_EVENTS,dateISO,icsDate,parseIcs,parseCsv,readFile,key});
})(typeof window!=='undefined'?window:globalThis);
