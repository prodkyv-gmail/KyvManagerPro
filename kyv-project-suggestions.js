/* Shared lightweight autocomplete values for ADD Progetto; does not change project records. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KYV_PROJECT_SUGGESTIONS=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const fields=Object.freeze({ARTISTA:'quick-artist-options',AUTORI:'quick-authors-options',
    Label:'quick-label-options',MANAGEMENT:'quick-management-options'});
  const cleaned=value=>String(value??'').trim().replace(/\s+/g,' ');
  const key=value=>cleaned(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('it');
  function unique(values){
    const seen=new Set(),result=[];
    for(const raw of values||[]){
      const value=cleaned(raw),fingerprint=key(value);
      if(!fingerprint||seen.has(fingerprint))continue;
      seen.add(fingerprint);result.push(value);
    }
    return result.sort((a,b)=>a.localeCompare(b,'it',{sensitivity:'base',numeric:true}));
  }
  function suggestions(rows){
    const result={};
    for(const field of Object.keys(fields))
      result[field]=unique((rows||[]).map(row=>row?.[field]));
    return result;
  }
  // Each datalist contains unique labels but the input remains free text.
  return Object.freeze({fields,key,unique,suggestions});
});
