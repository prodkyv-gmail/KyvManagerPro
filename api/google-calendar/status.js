'use strict';
const c=require('../../lib/kyv-google-calendar-oauth-server');
module.exports=async(req,res)=>{
  if(req.method!=='GET')return c.json(res,405,{ok:false,error:'Metodo non consentito'});
  let user;try{user=await c.authenticate(req);}catch(_){return c.json(res,503,{ok:false,error:'Autenticazione non disponibile'});}
  if(!user)return c.json(res,401,{ok:false,error:'Accedi a KYVManagerPro'});
  const configStatus=c.configurationStatus();
  if(!configStatus.configured)return c.json(res,200,{ok:true,...configStatus,connected:false});
  const cfg=c.config();
  const record=c.getToken(req,cfg);
  const connected=!!(record&&record.userId===user.id&&record.refreshToken&&record.email.toLowerCase()===cfg.expectedEmail);
  return c.json(res,200,{ok:true,configured:true,connected,email:connected?record.email:null});
};
