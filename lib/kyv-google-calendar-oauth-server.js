// Server-only Google OAuth helpers. Do not import in browser.
'use strict';
const crypto = require('node:crypto');
const ORIGIN = 'https://kyvmanagerpro-kyvmanagerpro-db.vercel.app';
const SCOPE = 'openid email https://www.googleapis.com/auth/calendar.events.readonly';
const COOKIE_PATH = '/api/google-calendar';
function configurationStatus() {
  // Report only a diagnostic code: never return secret contents or their lengths.
  const keys = ['KYV_GOOGLE_OAUTH_CLIENT_ID', 'KYV_GOOGLE_OAUTH_CLIENT_SECRET',
    'KYV_GOOGLE_OAUTH_COOKIE_KEY', 'KYV_GOOGLE_CALENDAR_EMAIL'];
  const missing = keys.filter(key => !process.env[key]);
  if (missing.length) return {configured:false, reason:'missing_variables', missing};
  if (!/^[a-f0-9]{64}$/i.test(process.env.KYV_GOOGLE_OAUTH_COOKIE_KEY)) {
    return {configured:false, reason:'invalid_cookie_key'};
  }
  if (!/^[^\s@\\]+@[^\s@\\]+\.[^\s@\\]+$/.test(process.env.KYV_GOOGLE_CALENDAR_EMAIL)) {
    return {configured:false, reason:'invalid_calendar_email'};
  }
  return {configured:true};
}
function config() {
  const clientId = process.env.KYV_GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.KYV_GOOGLE_OAUTH_CLIENT_SECRET;
  const key = process.env.KYV_GOOGLE_OAUTH_COOKIE_KEY;
  const expectedEmail = process.env.KYV_GOOGLE_CALENDAR_EMAIL;
  if (!clientId || !clientSecret || !key || !/^[a-f0-9]{64}$/i.test(key) || !expectedEmail) return null;
  return {clientId,clientSecret,key:Buffer.from(key,'hex'),expectedEmail:expectedEmail.toLowerCase()};
}
function json(res,code,obj) {
  res.statusCode=code;
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}
function cookies(req) {
  const out={};
  String(req.headers.cookie||'').split(';').forEach(part=>{
    const i=part.indexOf('=');
    if(i>0) out[part.slice(0,i).trim()]=part.slice(i+1).trim();
  });
  return out;
}
function setCookie(res,name,value,maxAge) {
  const flags=[name+'='+value,'Path='+COOKIE_PATH,'HttpOnly','Secure','SameSite=Lax','Max-Age='+maxAge];
  const existing=res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie',[...(Array.isArray(existing)?existing:existing?[existing]:[]),flags.join('; ')]);
}
function encrypt(payload,key) {
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
  const buf=Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),buf]).toString('base64url');
}
function decrypt(value,key) {
  try {
    const buf=Buffer.from(value||'','base64url');
    if(buf.length<29) return null;
    const iv=buf.subarray(0,12),tag=buf.subarray(12,28),encrypted=buf.subarray(28);
    const cipher=crypto.createDecipheriv('aes-256-gcm',key,iv);
    cipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([cipher.update(encrypted),cipher.final()]).toString('utf8'));
  } catch (_) { return null; }
}
async function authenticate(req) {
  const auth=String(req.headers.authorization||'');
  if(!/^Bearer\s+\S+$/i.test(auth)) return null;
  const url=process.env.SUPABASE_URL||'https://vppqnolgxtegtxznmgqb.supabase.co';
  const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'sb_publishable_BTAf2Cy5EYKgyb_uXdRvaA_iEawerhl';
  const response=await fetch(url.replace(/\/$/,'')+'/auth/v1/user',{headers:{Authorization:auth,apikey:key},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return null;
  const user=await response.json();
  return user && user.id ? user : null;
}
async function exchange(params) {
  const resp=await fetch('https://oauth2.googleapis.com/token',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams(params),signal:AbortSignal.timeout(15000)
  });
  if(!resp.ok) throw Error('Google OAuth: impossibile ottenere il token ('+resp.status+').');
  return resp.json();
}
function parsePeriod(startDate,endDate) {
  const parse=s=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;
    const [y,m,d]=s.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));
    return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d?dt:null;
  };
  const start=parse(startDate),end=parse(endDate);
  if(!start||!end) return null;
  const days=(end-start)/86400000;
  return days>=1&&days<=45?{start,end,startDate,endDate}:null;
}
function getToken(req,cfg) {return decrypt(cookies(req).kyv_gc_token,cfg.key);}
function setToken(res,cfg,record) {setCookie(res,'kyv_gc_token',encrypt(record,cfg.key),60*60*24*30);}
function clearTokens(res) {setCookie(res,'kyv_gc_token','',0);setCookie(res,'kyv_gc_state','',0);}
function disableIfUnconfigured(res,cfg) {if(cfg)return false;json(res,503,{ok:false,error:'Google OAuth non configurato sul server. Apps Script resta disponibile.'});return true;}
function checkPostOrigin(req) {return req.headers.origin===ORIGIN;}
module.exports={ORIGIN,SCOPE,config,configurationStatus,json,cookies,setCookie,encrypt,decrypt,authenticate,exchange,parsePeriod,getToken,setToken,clearTokens,disableIfUnconfigured,checkPostOrigin};
