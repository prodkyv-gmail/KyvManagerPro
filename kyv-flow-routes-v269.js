/* KYV v2.69 — pure, explicit project-context route contract. No reads or writes. */
(function(root,factory){
 const api=factory();
 if(root)root.KYV_FLOW_ROUTES_V269=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const byPage=Object.freeze({
  'scheda_progetto.html':['id','projectId'],
  'sessioni.html':['projectId','id'],
  'kyv_audio_finder.html':['project','projectId'],
  'fatture.html':['collegaProgetto','ripartizione_progetto','projectId'],
  'ascolto.html':['projectId','id'],
  'kyv_calendar.html':['projectId','id'],
  'index.html':['projectId','id'],
   'oggi.html':['projectId','id']
 });
 function validId(value){
  const id=String(value??'').trim();
  if(!/^\d{1,20}$/.test(id)||!/[1-9]/.test(id))return '';
  return id.replace(/^0+/,'');
 }
 function parse(path,search){
  const page=String(path||'').split('/').pop().toLowerCase()||'index.html';
  const query=new URLSearchParams(String(search||'').replace(/^\?/,''));
  const fields=byPage[page]||['projectId','id'];
  for(const key of fields){const id=validId(query.get(key));if(id)return id;}
  return '';
 }
 function hrefs(projectId){
  const id=validId(projectId);
  if(!id)return null;
  const value=encodeURIComponent(id);
  return Object.freeze({
   project:'scheda_progetto.html?id='+value,
   session:'sessioni.html?projectId='+value,
   audio:'kyv_audio_finder.html?project='+value,
   invoice:'fatture.html?collegaProgetto='+value
  });
 }
 function fromLocation(loc){return parse(loc?.pathname,loc?.search);}
 return Object.freeze({validId,parse,hrefs,fromLocation});
});
