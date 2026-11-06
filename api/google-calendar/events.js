'use strict';
const c=require('./_shared');
module.exports=async(req,res)=>{
  if(req.method!=='GET')return c.json(res,405,{ok:false,error:'Metodo non consentito'});
  const cfg=c.config();if(c.disableIfUnconfigured(res,cfg))return;
  let user;try{user=await c.authenticate(req);}catch(_){return c.json(res,503,{ok:false,error:'Autenticazione non disponibile'});}
  if(!user)return c.json(res,401,{ok:false,error:'Accedi a KYVManagerPro'});
  const record=c.getToken(req,cfg);
  if(!record||record.userId!==user.id||String(record.email).toLowerCase()!==cfg.expectedEmail){
    return c.json(res,401,{ok:false,error:'Collega Google Calendar da questo dispositivo'});
  }
  const period=c.parsePeriod(req.query?.startDate,req.query?.endDate);
  if(!period)return c.json(res,400,{ok:false,error:'Intervallo richiesto non valido (1–45 giorni)'});
  try{
    const token=await c.exchange({client_id:cfg.clientId,client_secret:cfg.clientSecret,
      refresh_token:record.refreshToken,grant_type:'refresh_token'});
    if(!token.access_token)return c.json(res,502,{ok:false,error:'Sessione Google non rinnovabile. Ricollega il calendario.'});
    const events=[];let pageToken='',truncated=false;
    for(let page=0;page<10;page++){
      const url=new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.set('timeMin',period.start.toISOString());
      url.searchParams.set('timeMax',period.end.toISOString());
      url.searchParams.set('singleEvents','true');
      url.searchParams.set('orderBy','startTime');
      url.searchParams.set('maxResults','250');
      if(pageToken)url.searchParams.set('pageToken',pageToken);
      const response=await fetch(url,{headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(15000)});
      if(!response.ok) return c.json(res,502,{ok:false,error:'Google Calendar API non disponibile ('+response.status+')'});
      const data=await response.json();
      if(!Array.isArray(data.items))throw Error('Malformed Google Calendar response');
      data.items.forEach(ev=>{
        if(events.length<120){
          const date=ev.start?.date||ev.start?.dateTime;
          if(date)events.push({date,title:String(ev.summary||'Senza titolo')});
        }else truncated=true;
      });
      pageToken=String(data.nextPageToken||'');
      if(!pageToken)break;
      if(page===9)truncated=true;
    }
    return c.json(res,200,{ok:true,events,range:{startDate:period.startDate,endDate:period.endDate},truncated});
  }catch(_){
    return c.json(res,502,{ok:false,error:'Impossibile leggere Google Calendar. Verifica la connessione e riprova.'});
  }
};
