/* KYV Project Edit Safety — intercetta il quick edit legacy e salva solo i campi realmente cambiati. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

let snapshot=null;
let saving=false;
let db=null;
const relationFields=new Set(['IDFT']);

function text(v){return String(v??'').trim();}
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function projectId(){
  const badge=text(document.getElementById('hero-badges')?.textContent).match(/\bID\s+(\d+)\b/i)?.[1];
  return badge||text(new URLSearchParams(location.search).get('id'));
}
function compare(key,value){
  if(value===null||value===undefined||value==='')return'';
  if(String(key).toLowerCase().includes('data'))return String(value).slice(0,10);
  return String(value).trim();
}
function normalize(key,value){
  const raw=text(value);if(!raw)return null;
  if(/^ID/.test(key)&&/^\d+$/.test(raw))return Number(raw);
  return raw;
}
function toast(message,type='success'){
  if(window.KYV_TOAST)KYV_TOAST.show(message,type);
  else if(window.KYV?.showToast)KYV.showToast(message,type);
}
function captureSnapshot(){
  const form=document.getElementById('quick-edit-form');if(!form)return;
  const values={};form.querySelectorAll('#quick-edit-fields [data-key]').forEach(input=>{values[input.dataset.key]=input.value;});
  snapshot={projectId:projectId(),values};
}
async function safeSubmit(event){
  const form=document.getElementById('quick-edit-form');
  if(!form||event.target!==form)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(saving)return;
  if(!snapshot){toast('Riapri la modifica prima di salvare.','warning');return;}
  const pid=projectId();
  if(!pid||pid!==snapshot.projectId){toast('Il progetto aperto è cambiato: salvataggio annullato per proteggere i dati.','error');return;}
  const payload={};
  form.querySelectorAll('#quick-edit-fields [data-key]').forEach(input=>{
    const key=input.dataset.key,next=normalize(key,input.value);
    if(compare(key,snapshot.values[key])===compare(key,next))return;
    payload[key]=next;
  });
  const keys=Object.keys(payload);
  if(!keys.length){toast('Nessuna modifica da salvare.','warning');return;}
  const relationChanges=keys.filter(key=>relationFields.has(key));
  if(relationChanges.length&&!window.confirm(`Stai modificando un collegamento del progetto (${relationChanges.join(', ')}). Confermi?`))return;
  if(!client()){toast('Client dati non disponibile.','error');return;}

  const button=document.getElementById('quick-edit-save');
  saving=true;if(button){button.disabled=true;button.innerHTML='<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i>Salvo…';if(window.lucide)lucide.createIcons({root:button});}
  try{
    const {data,error}=await client().from('PROGETTI').update(payload).eq('ID',pid).select('ID').single();
    if(error)throw error;if(String(data?.ID)!==String(pid))throw new Error('Verifica identità progetto fallita.');
    snapshot=null;
    if(typeof window.closeQuickEdit==='function')window.closeQuickEdit();
    toast('Scheda progetto aggiornata senza sovrascrivere i campi invariati.','success');
    window.dispatchEvent(new CustomEvent('kyv:project-updated',{detail:{projectId:pid,fields:keys}}));
    if(typeof window.refreshAll==='function')await window.refreshAll();
  }catch(error){console.error('[KYV Project Edit Safety]',error);toast(`Salvataggio non riuscito: ${error.message||'controlla i dati inseriti'}`,'error');}
  finally{saving=false;if(button){button.disabled=false;button.innerHTML='<i data-lucide="save" class="w-4 h-4 mr-2"></i>Salva modifiche';if(window.lucide)lucide.createIcons({root:button.parentElement});}}
}
function install(){
  const form=document.getElementById('quick-edit-form');if(!form||form.dataset.kyvSafeSubmit==='1')return false;
  form.dataset.kyvSafeSubmit='1';
  form.addEventListener('submit',safeSubmit,true);
  const original=window.openQuickEdit;
  if(typeof original==='function'&&!original.__kyvSafeWrapped){
    const wrapped=function(){const result=original.apply(this,arguments);requestAnimationFrame(captureSnapshot);return result;};
    wrapped.__kyvSafeWrapped=true;window.openQuickEdit=wrapped;
  }
  const originalClose=window.closeQuickEdit;
  if(typeof originalClose==='function'&&!originalClose.__kyvSafeWrapped){
    const wrappedClose=function(){snapshot=null;return originalClose.apply(this,arguments);};
    wrappedClose.__kyvSafeWrapped=true;window.closeQuickEdit=wrappedClose;
  }
  return true;
}
function boot(){
  if(install())return;
  const timer=setInterval(()=>{if(install())clearInterval(timer);},100);
  setTimeout(()=>clearInterval(timer),6000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
