'use strict';
const c=require('./_shared');
module.exports=async(req,res)=>{
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Cache-Control','no-store');
  const cfg=c.config();if(c.disableIfUnconfigured(res,cfg))return;
  if(req.method!=='GET')return c.json(res,405,{ok:false,error:'Metodo non consentito'});
  const previous=c.decrypt(c.cookies(req).kyv_gc_state,cfg.key);
  c.setCookie(res,'kyv_gc_state','',0);
  const supplied=String(req.query?.state||'');
  const crypto=require('node:crypto');
  const same=previous?.state&&supplied&&
    Buffer.byteLength(previous.state)===Buffer.byteLength(supplied)&&
    crypto.timingSafeEqual(Buffer.from(previous.state),Buffer.from(supplied));
  if(!same||!previous.userId||Date.now()-previous.issued>600000||Date.now()<previous.issued){
    return c.json(res,403,{ok:false,error:'Autorizzazione Google scaduta o non valida. Riprova dall’Agenda.'});
  }
  if(req.query?.error)return res.writeHead(303,{Location:'/kyv_calendar.html?google_calendar=denied'}).end();
  const code=String(req.query?.code||'');
  if(!code||code.length>4096)return c.json(res,400,{ok:false,error:'Codice Google non valido'});
  try{
    const token=await c.exchange({
      client_id:cfg.clientId,client_secret:cfg.clientSecret,
      code,grant_type:'authorization_code',
      redirect_uri:c.ORIGIN+'/api/google-calendar/callback'
    });
    if(!token.refresh_token||!token.access_token)throw Error('Google non ha restituito un refresh token');
    const profile=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{
      headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(15000)
    });
    if(!profile.ok)throw Error('Identità Google non verificabile');
    const identity=await profile.json();
    if(!identity.email_verified||String(identity.email||'').toLowerCase()!==cfg.expectedEmail)throw Error('Account Google differente da quello autorizzato');
    if(!String(token.scope||'').split(' ').includes('https://www.googleapis.com/auth/calendar.events.readonly'))throw Error('Permesso Calendar non concesso');
    c.setToken(res,cfg,{refreshToken:token.refresh_token,userId:previous.userId,email:identity.email});
    res.writeHead(303,{Location:'/kyv_calendar.html?google_calendar=connected'}).end();
  }catch(_){
    // Never log authorization codes, tokens or identity data.
    return c.json(res,502,{ok:false,error:'Autorizzazione Google non completata. Verifica account e configurazione OAuth; Apps Script è ancora disponibile.'});
  }
};
