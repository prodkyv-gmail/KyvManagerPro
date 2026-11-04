/* KYV Studio Editor v2.68: track user-touched fields; never re-submit unchanged values. */
(function(root,factory){
 const api=factory();
 if(root)root.KYV_EDITOR_CHANGES_V268=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function comparable(value,kind,numeric,toDbNumber){
  if(value===null||value===undefined)return '';
  const s=String(value).trim();
  if(!s)return '';
  if(kind==='date')return s.slice(0,10);
  if(kind==='datetime-local')return s.replace(' ','T').slice(0,16);
  if(numeric){
   const parsed=toDbNumber(s);
   if(typeof parsed==='number'&&Number.isFinite(parsed))return String(parsed);
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
   if(comparable(old,kind,numeric,toDbNumber)===comparable(next,kind,numeric,toDbNumber))continue;
   let value=next===''?null:next;
   if(value!==null&&numeric){
    value=toDbNumber(value);
    if(typeof value!=='number'||!Number.isFinite(value))throw new Error('Numero non valido in '+key);
   } else if(value!==null&&isDateType(type)){
    value=toDbDate(value);
    if(value===null||value===undefined||value==='')throw new Error('Data non valida in '+key);
   }
   payload[key]=value;
  }
  return{payload,count:Object.keys(payload).length};
 }
 return Object.freeze({collect});
});
