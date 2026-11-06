'use strict';
const c=require('./_shared');
module.exports=async(req,res)=>{
  if(req.method!=='POST')return c.json(res,405,{ok:false,error:'Metodo non consentito'});
  if(!c.checkPostOrigin(req))return c.json(res,403,{ok:false,error:'Origine non consentita'});
  let user;try{user=await c.authenticate(req);}catch(_){return c.json(res,503,{ok:false,error:'Autenticazione non disponibile'});}
  if(!user)return c.json(res,401,{ok:false,error:'Accedi a KYVManagerPro'});
  const cfg=c.config();
  if(cfg){const record=c.getToken(req,cfg);if(record&&record.userId!==user.id)return c.json(res,403,{ok:false,error:'Connessione non appartenente alla sessione'});}
  c.clearTokens(res);
  return c.json(res,200,{ok:true,connected:false});
};
