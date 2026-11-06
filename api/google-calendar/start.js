'use strict';
const c=require('../../lib/kyv-google-calendar-oauth-server');
module.exports=async(req,res)=>{
  if(req.method!=='POST')return c.json(res,405,{ok:false,error:'Metodo non consentito'});
  const cfg=c.config();if(c.disableIfUnconfigured(res,cfg))return;
  if(!c.checkPostOrigin(req))return c.json(res,403,{ok:false,error:'Origine non consentita'});
  let user;try{user=await c.authenticate(req);}catch(_){return c.json(res,503,{ok:false,error:'Autenticazione non disponibile'});}
  if(!user)return c.json(res,401,{ok:false,error:'Accedi a KYVManagerPro'});
  const state=require('node:crypto').randomBytes(32).toString('base64url');
  c.setCookie(res,'kyv_gc_state',c.encrypt({state,userId:user.id,issued:Date.now()},cfg.key),600);
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const params={
    client_id:cfg.clientId,redirect_uri:c.ORIGIN+'/api/google-calendar/callback',
    response_type:'code',scope:c.SCOPE,access_type:'offline',prompt:'consent',
    state,login_hint:cfg.expectedEmail
  };
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  return c.json(res,200,{ok:true,authorizationUrl:url.toString()});
};
