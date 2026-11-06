/**
 * KYVManagerPro Calendar + Drive, version 2.
 * Sostituisce il SOLO doGet esistente nel progetto Apps Script già collegato.
 * Mantiene: getEvents senza date (legacy), createEvent con time, getDriveFiles.
 * getEvents(startDate,endDate): solo eventi di oggi e futuri, storico disattivato.
 * createEvent(endTime,description,location): nessuna modifica.
 * Zona oraria progetto Apps Script: Europe/Rome.
 * NOTA: distribuire una NUOVA VERSIONE dell'attuale Web App, non una nuova URL.
 */
function kyvJson_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function kyvDate_(input) {
  var value=String(input||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Data non valida (AAAA-MM-GG).');
  var p=value.split('-').map(Number);
  var d=new Date(p[0],p[1]-1,p[2]);
  if(d.getFullYear()!==p[0]||d.getMonth()!==p[1]-1||d.getDate()!==p[2])throw Error('Data inesistente.');
  return d;
}
function kyvTime_(value) {
  var s=String(value||'');
  if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s))throw Error('Ora non valida: formato HH:MM.');
  return s;
}
function kyvDateTime_(date,time) {
  var day=kyvDate_(date);
  var clock=kyvTime_(time).split(':').map(Number);
  day.setHours(clock[0],clock[1],0,0);
  return day;
}
function kyvGetEvents_(params) {
  var cal=CalendarApp.getDefaultCalendar();
  if(!cal)throw Error('Calendario predefinito non disponibile.');

  // Storico DISATTIVATO: Google Calendar viene interrogato soltanto
  // da oggi in poi. I periodi richiesti restano invariati nella
  // risposta per compatibilita con le viste Giorno/Settimana/Mese/Anno.
  var today=new Date();
  today.setHours(0,0,0,0);
  var requestedStart,requestedEnd;
  if(params.startDate||params.endDate){
    if(!params.startDate||!params.endDate)throw Error('Servono startDate ed endDate.');
    requestedStart=kyvDate_(params.startDate);
    requestedEnd=kyvDate_(params.endDate);
    // Date.UTC evita i falsi intervalli non interi al cambio di ora legale.
    var days=(Date.UTC(requestedEnd.getFullYear(),requestedEnd.getMonth(),requestedEnd.getDate())
      -Date.UTC(requestedStart.getFullYear(),requestedStart.getMonth(),requestedStart.getDate()))/86400000;
    if(days<1||days>45)throw Error('Intervallo consentito: da 1 a 45 giorni.');
  }else{
    requestedStart=new Date(today.getTime());
    requestedEnd=new Date(today.getFullYear(),today.getMonth(),today.getDate()+14);
  }
  var historyDisabled=requestedStart.getTime()<today.getTime();
  var effectiveStart=historyDisabled?today:requestedStart;
  var zone=Session.getScriptTimeZone();
  var all=[];
  var max=501;
  if(requestedEnd.getTime()>effectiveStart.getTime()){
    all=cal.getEvents(effectiveStart,requestedEnd,{max:max});
  }
  var events=all.slice(0,max-1).map(function(ev){
    var begin=ev.getStartTime(),finish=ev.getEndTime(),allDay=ev.isAllDayEvent();
    return {
      id:ev.getId(),title:ev.getTitle(),
      date:allDay?Utilities.formatDate(begin,zone,'yyyy-MM-dd'):begin.toISOString(),
      endDate:allDay?Utilities.formatDate(finish,zone,'yyyy-MM-dd'):finish.toISOString(),
      allDay:allDay,description:ev.getDescription()||'',location:ev.getLocation()||''
    };
  });
  return {success:true,events:events,range:{
    startDate:Utilities.formatDate(requestedStart,zone,'yyyy-MM-dd'),
    endDate:Utilities.formatDate(requestedEnd,zone,'yyyy-MM-dd')
  },historyDisabled:historyDisabled,truncated:all.length>=max};
}
function kyvCreateEvent_(params) {
  var title=String(params.title||'Nuova Sessione Studio').trim();
  if(!title||title.length>250)throw Error('Titolo obbligatorio, massimo 250 caratteri.');
  var start=kyvDateTime_(params.date,params.time);
  var end;
  if(params.endTime){
    end=kyvDateTime_(params.endDate||params.date,params.endTime);
  }else{
    // Compatibilità con le sessioni create dalla versione precedente.
    end=new Date(start.getTime()+2*60*60*1000);
  }
  if(end.getTime()<=start.getTime()||end.getTime()-start.getTime()>7*86400000){
    throw Error('La fine deve essere dopo l’inizio (durata massima 7 giorni).');
  }
  var cal=CalendarApp.getDefaultCalendar();
  if(!cal)throw Error('Calendario predefinito non disponibile.');
  var description=String(params.description||'').slice(0,5000);
  var location=String(params.location||'').slice(0,500);
  var ev=cal.createEvent(title,start,end,{description:description,location:location});
  return {success:true,message:'Evento creato',eventId:ev.getId(),
    date:ev.getStartTime().toISOString(),endDate:ev.getEndTime().toISOString()};
}
function kyvDriveFiles_(params) {
  var pageToken=params.pageToken||null;
  var iterator=pageToken&&pageToken!=='null'
    ? DriveApp.continueFileIterator(pageToken)
    : DriveApp.searchFiles("mimeType = 'audio/mpeg' and trashed = false");
  var files=[],count=0;
  while(iterator.hasNext()&&count<20){
    var f=iterator.next();
    if(f.getSize()<=2097152)continue;
    var parents=f.getParents();
    files.push({
      name:f.getName(),url:f.getUrl(),
      size:(f.getSize()/1048576).toFixed(2)+' MB',
      folder:parents.hasNext()?parents.next().getName():'Il mio Drive',
      created:f.getDateCreated().toISOString(),
      updated:f.getLastUpdated().toISOString()
    });
    count++;
  }
  return {success:true,files:files,
    nextPageToken:iterator.hasNext()?iterator.getContinuationToken():null};
}
function doGet(e) {
  var params=e&&e.parameter||{};
  if(!params.action)return kyvJson_({error:'Usa KYVManagerPro per inviare i comandi.'});
  try{
    if(params.action==='getEvents')return kyvJson_(kyvGetEvents_(params));
    if(params.action==='createEvent')return kyvJson_(kyvCreateEvent_(params));
    if(params.action==='getDriveFiles')return kyvJson_(kyvDriveFiles_(params));
    return kyvJson_({error:'Azione non valida'});
  }catch(err){
    return kyvJson_({error:'Errore lato Google: '+String(err.message||err)});
  }
}
