/* KYV Studio Editor v2.68: track user-touched fields; never re-submit unchanged values. */
(function(root,factory){
 const api=factory();
 if(root)root.KYV_EDITOR_CHANGES_V268=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function dateTimeInput(value,dbType){
  const raw=String(value??'').trim();
  if(!raw)return '';
  if(/^(?:timestamptz|timestampz)$/i.test(dbType)){
   const parsed=new Date(raw);
   if(Number.isNaN(parsed.getTime()))return raw.replace(' ','T').slice(0,16);
   return new Date(parsed.getTime()-parsed.getTimezoneOffset()*60000).toISOString().slice(0,16);
  }
  return raw.replace(' ','T').slice(0,16);
 }
 function comparable(value,kind,numeric,toDbNumber,dbType,fromDb){
  if(value===null||value===undefined)return '';
  const s=String(value).trim();
  if(!s)return '';
  if(kind==='date')return s.slice(0,10);
  if(kind==='datetime-local')return fromDb?dateTimeInput(s,dbType):s.replace(' ','T').slice(0,16);
  if(numeric){
   const parsed=toDbNumber(s);
   if(parsed!==null&&parsed!==undefined&&Number.isFinite(Number(parsed))&&/[0-9]/.test(s))return String(Number(parsed));
  }
  return s;
 }
 function collect(inputs,original,touched,{getType,isNumericType,isDateType,toDbNumber,toDbDate}){
  const payload={};
  const seen=new Set();
  for(const input of inputs){
   const key=input?.dataset?.key;
   if(!key||seen.has(key)||!touched.has(key))continue;
   seen.add(key);
   const type=getType(key),numeric=isNumericType(type);
   const next=String(input.value??'').trim();
   const old=Object.prototype.hasOwnProperty.call(original,key)?original[key]:null;
   const kind=String(input.type||'').toLowerCase();
   if(comparable(old,kind,numeric,toDbNumber,type,true)===comparable(next,kind,numeric,toDbNumber,type,false))continue;
   let value=next===''?null:next;
   if(value!==null&&numeric){
    value=toDbNumber(value);
    if(value===null||value===undefined||!Number.isFinite(Number(value))||!/[0-9]/.test(next))throw new Error('Numero non valido in '+key);
   } else if(value!==null&&isDateType(type)){
    if(kind==='datetime-local'&&/^(?:timestamptz|timestampz)$/i.test(type)){
     const parsed=new Date(value);
     if(Number.isNaN(parsed.getTime()))throw new Error('Data e ora non valide in '+key);
     value=parsed.toISOString();
    } else if(kind==='datetime-local'&&/^timestamp$/i.test(type)){
     if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value))throw new Error('Data e ora non valide in '+key);
    } else {
     value=toDbDate(value);
     if(value===null||value===undefined||value==='')throw new Error('Data non valida in '+key);
    }
   }
   payload[key]=value;
  }
  return{payload,count:Object.keys(payload).length};
 }
 return Object.freeze({collect,dateTimeInput});
});
