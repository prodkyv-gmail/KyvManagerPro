/* Studio Editor: visibilita colonne per tabella, senza modificare dati o query. */
(function(root){'use strict';
const STORAGE='kyv-editor-hidden-columns-v1';
function saved(){try{const o=JSON.parse(root.localStorage?.getItem(STORAGE)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(_){return {};}}
function keysOf(keys){return [...new Set((keys||[]).map(String).filter(Boolean))];}
function hidden(table,keys){const valid=new Set(keysOf(keys)),values=saved()[String(table)];return new Set(Array.isArray(values)?values.filter(x=>valid.has(x)):[]);}
function visible(table,keys){const list=keysOf(keys),masked=hidden(table,list),v=list.filter(k=>!masked.has(k));return v.length?v:list.slice(0,1);}
function set(table,key,show,keys){
 const list=keysOf(keys),name=String(key);if(!list.includes(name))return false;
 const masked=hidden(table,list);
 if(show)masked.delete(name);else masked.add(name);
 if(masked.size>=list.length)return false;
 const o=saved();o[String(table)]=[...masked];
 try{root.localStorage?.setItem(STORAGE,JSON.stringify(o));}catch(_){}
 return true;
}
function showAll(table){const o=saved();delete o[String(table)];try{root.localStorage?.setItem(STORAGE,JSON.stringify(o));}catch(_){}}
root.KYV_EDITOR_COLUMNS=Object.freeze({hidden,visible,set,showAll,storageKey:STORAGE});
})(typeof window!=='undefined'?window:globalThis);
