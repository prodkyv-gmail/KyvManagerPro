'use strict';
const c=require('../../lib/kyv-google-calendar-oauth-server');
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
  // Never display Google authorization codes or tokens in the response or redirects.
  function finish(status){
    const allowed=new Set(['connected','missing_calendar_scope','missing_refresh_token','wrong_account','google_identity','token_exchange','unexpected_error']);
    const code=allowed.has(status)?status:'unexpected_error';
    return res.writeHead(303,{
      Location:'/kyv_calendar.html?google_calendar='+encodeURIComponent(code),
      'Referrer-Policy':'no-referrer',
      'Cache-Control':'no-store'
    }).end();
  }
  let token;
  try {
    token=await c.exchange({
      client_id:cfg.clientId,client_secret:cfg.clientSecret,
      code,grant_type:'authorization_code',
      redirect_uri:c.ORIGIN+'/api/google-calendar/callback'
    });
  } catch (_) { return finish('token_exchange'); }
  if(!token || !token.access_token) return finish('token_exchange');
  // If a user omits Calendar access on the Google consent screen, fail explicitly.
  // The callback scope is a useful hint; the authoritative check uses token.scope.
  const granted=String(token.scope||'').split(/\\s+/).filter(Boolean);
  if(!granted.includes('https://www.googleapis.com/auth/calendar.events.readonly')){
    return finish('missing_calendar_scope');
  }
  if(!token.refresh_token)return finish('missing_refresh_token');
  try {
    const profile=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{
      headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(15000)
    });
    if(!profile.ok)return finish('google_identity');
    const identity=await profile.json();
    if(!identity.email_verified||String(identity.email||'').toLowerCase()!==cfg.expectedEmail){
      return finish('wrong_account');
    }
    c.setToken(res,cfg,{refreshToken:token.refresh_token,userId:previous.userId,email:identity.email});
    return finish('connected');
  } catch (_) { return finish('google_identity'); }
};
