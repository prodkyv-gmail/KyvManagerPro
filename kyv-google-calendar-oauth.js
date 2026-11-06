// Google Calendar API read-only, opt-in; Apps Script remains default/fallback.
(function(root){
  'use strict';
  if(!root.document || !/kyv_calendar\.html$/i.test(root.location.pathname)) return;
  const api='/api/google-calendar/';
  const state={connected:false,configured:false};
  root.KYV_GOOGLE_CALENDAR_API=state;
  function node(tag,cls,text){
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!=null)n.textContent=text;
    return n;
  }
  async function request(path,options={}){
    const session=await root.KYV_AUTH?.getSession?.();
    if(!session?.access_token)throw Error('Accedi prima a KYVManagerPro.');
    const response=await fetch(api+path,{
      ...options,headers:{Authorization:'Bearer '+session.access_token,...(options.headers||{})},
      credentials:'same-origin',cache:'no-store'
    });
    const data=await response.json();
    if(!response.ok||!data.ok)throw Error(data.error||'Connessione Google non disponibile');
    return data;
  }
  function init(){
    const sidebar=document.querySelector('.kyv-calendar-sidebar');
    if(!sidebar||document.getElementById('kyv-google-api-box'))return;
    const card=node('div','kyv-calendar-card bg-kyv-card border border-kyv-border rounded-2xl p-4 sm:p-6');
    card.id='kyv-google-api-box';
    const title=node('h3','text-sm font-bold text-white mb-2','Google Calendar API (OAuth 2.0)');
    const info=node('p','text-xs text-kyv-text mb-3','Connessione opzionale in sola lettura. Le sessioni continuano a essere create con Apps Script.');
    const message=node('p','text-xs text-kyv-text mb-3','Verifica configurazione...');
    message.setAttribute('role','status');
    const connect=node('button','w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold','Collega Google Calendar');
    connect.type='button';connect.hidden=true;
    const disconnect=node('button','w-full py-2.5 border border-kyv-border text-white rounded-xl text-xs font-bold','Disconnetti su questo dispositivo');
    disconnect.type='button';disconnect.hidden=true;
    card.append(title,info,message,connect,disconnect);
    sidebar.appendChild(card);
    function update(){
      connect.hidden=!state.configured||state.connected;
      disconnect.hidden=!state.connected;
      message.textContent=!state.configured
        ? 'OAuth non ancora configurato su Vercel. Apps Script resta attivo.'
        : state.connected
          ? 'Google Calendar API collegata su questo dispositivo. Usa Carica periodo in Settimana o Mese.'
          : 'Google Calendar API pronta: puoi collegare il tuo account.';
    }
    connect.addEventListener('click',async()=>{
      connect.disabled=true;
      try {
        const data=await request('start',{method:'POST'});
        if(!data.authorizationUrl||!data.authorizationUrl.startsWith('https://accounts.google.com/'))throw Error('Risposta OAuth non valida');
        root.location.assign(data.authorizationUrl);
      }catch(e){message.textContent=e.message;connect.disabled=false;}
    });
    disconnect.addEventListener('click',async()=>{
      disconnect.disabled=true;
      try{
        await request('disconnect',{method:'POST'});
        state.connected=false;update();
      }catch(e){message.textContent=e.message;}
      finally{disconnect.disabled=false;}
    });
    root.addEventListener('kyv:calendar-period-request',async event=>{
      if(!state.connected)return; // the original Apps Script handler is disabled only when connected
      const {requested,requestId}=event.detail||{};
      if(!requested)return;
      try{
        const url='events?'+new URLSearchParams(requested);
        const data=await request(url);
        root.dispatchEvent(new CustomEvent('kyv:calendar-period-result',{
          detail:{requested,requestId,response:data,success:true,truncated:!!data.truncated}
        }));
      }catch(e){
        root.dispatchEvent(new CustomEvent('kyv:calendar-period-result',{
          detail:{requested,requestId,success:false,error:e.message}
        }));
      }
    });
    request('status').then(data=>{
      state.configured=!!data.configured;state.connected=!!data.connected;update();
    }).catch(e=>{message.textContent='Stato OAuth non verificabile: '+e.message;});
    if(new URLSearchParams(root.location.search).has('google_calendar')){
      root.history.replaceState({},'',root.location.pathname);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})(window);
