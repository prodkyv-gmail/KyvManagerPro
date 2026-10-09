/* KYV navigation order — Pipeline & opportunità subito dopo Ascolto.
   Solo DOM/navigation: nessuna query e nessun observer globale. */
(function(){
'use strict';
function apply(){
  const sidebar=document.getElementById('sidebar');
  const nav=sidebar?.querySelector('nav');
  if(!nav)return false;
  const ascolto=nav.querySelector('a[href="ascolto.html"]');
  const pipeline=nav.querySelector('a[href="pipeline.html"]');
  if(!ascolto||!pipeline)return false;
  const ascoltoLi=ascolto.closest('li');
  const pipelineLi=pipeline.closest('li');
  const targetList=ascoltoLi?.parentElement;
  if(!ascoltoLi||!pipelineLi||!targetList)return false;
  pipeline.querySelector('span')?.replaceChildren(document.createTextNode('Pipeline & opportunità'));
  if(pipelineLi.parentElement!==targetList||ascoltoLi.nextElementSibling!==pipelineLi){
    targetList.insertBefore(pipelineLi,ascoltoLi.nextElementSibling);
  }
  return true;
}
function boot(){
  let pass=0;
  const timer=setInterval(()=>{pass++;if(apply()||pass>=30)clearInterval(timer);},180);
  apply();
  setTimeout(()=>clearInterval(timer),6000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
