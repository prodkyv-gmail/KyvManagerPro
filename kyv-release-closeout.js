/* KYV Release Closeout — prossima azione release e chiusura progetto, senza nuove tabelle. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='scheda_progetto.html')return;

let db=null;
let heroObserver=null;
let timer=null;
let busy=false;
let lastFingerprint='';

function text(v){return String(v??'').trim();}
function H(v){if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(v??'');return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function current(){try{return typeof state!=='undefined'&&state?.currentView?state.currentView:null;}catch(_){return null;}}
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function has(v){return text(v).length>0;}
function fmtDate(v){if(!v)return'';if(window.KYV?.formatDate)return KYV.formatDate(v,'');const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('it-IT');}
function audioType(row){return text(row?.Tipo_File||row?.TIPO_VERSIONE||row?.Versione||row?.ETICHETTA_VERSIONE);}
function audioRows(matches){const rows=[...((matches?.consegne)||[]),...((matches?.audio)||[])],seen=new Set();return rows.filter((row,index)=>{const key=text(row?.ID_VERSIONE||row?.ID_FILE||row?.ID_CONSEGNA||row?.ID_DOCUMENTO||row?.LINK_FILE||row?.Link_Drive||row?.Link_Dropbox||index);if(seen.has(key))return false;seen.add(key);return true;});}
function masterReady(view){const p=view?.p||{};return has(p.Data_Consegna_Master)||audioRows(view?.matches).some(row=>/master|final/i.test(audioType(row)));}
function splitReady(p){return [p.Quota_Musica_Kyv,p.Quota_Musica_Artista,p.Quota_Testo_Artista].some(has);}
function doneProject(p){return /pubblicat|chius|completat|finita/i.test(text(p?.STATO));}
function releasePassed(value){if(!value)return false;const raw=String(value).slice(0,10);const now=new Date();const local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);return raw<=local;}
function checks(view){const p=view?.p||{};return[
  {key:'identity',label:'Titolo e artista',ready:has(p.TITOLO)&&has(p.ARTISTA),fields:['TITOLO','ARTISTA']},
  {key:'master',label:'Master definitivo',ready:masterReady(view),fields:['Data_Consegna_Master']},
  {key:'isrc',label:'ISRC',ready:has(p.Codice_ISRC),fields:['Codice_ISRC']},
  {key:'date',label:'Data pubblicazione',ready:has(p.Data_Pubblicazione),fields:['Data_Pubblicazione']},
  {key:'label',label:'Label / produttore fonografico',ready:has(p.Label)||has(p.Produttore_Fonografico),fields:['Label','Produttore_Fonografico']},
  {key:'authors',label:'Autori',ready:has(p.AUTORI),fields:['AUTORI']},
  {key:'split',label:'Split / quote',ready:splitReady(p),fields:['Quota_Musica_Kyv','Quota_Musica_Artista','Quota_Testo_Artista']},
  {key:'credit',label:'Credito KYV',ready:has(p.Ruolo_IMAIE_Kyv),fields:['Ruolo_IMAIE_Kyv']}
];}
function fingerprint(view){const p=view?.p||{},rows=checks(view);return JSON.stringify([p.ID,p.STATO,p.SVILUPPO,p.Data_Pubblicazione,rows.map(r=>[r.key,r.ready])]);}

function injectStyles(){if(document.getElementById('kyv-release-closeout-style'))return;const s=document.createElement('style');s.id='kyv-release-closeout-style';s.textContent=`
#kyv-release-closeout{margin:.8rem 0 0;padding:.78rem .82rem;border:1px solid rgba(56,189,248,.20);border-radius:.82rem;background:linear-gradient(135deg,rgba(56,189,248,.075),rgba(99,102,241,.055))}.kyv-release-closeout-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.8rem;align-items:center}.kyv-release-closeout-kicker{font-size:.57rem;text-transform:uppercase;letter-spacing:.1em;font-weight:900;color:#93c5fd}.kyv-release-closeout-title{display:block;margin-top:.24rem;color:#fff;font-size:.78rem;font-weight:900}.kyv-release-closeout-copy{margin-top:.18rem;color:#94a3b8;font-size:.63rem;line-height:1.45}.kyv-release-closeout-path{display:flex;flex-wrap:wrap;gap:.28rem;margin-top:.5rem}.kyv-release-step{display:inline-flex;align-items:center;gap:.25rem;padding:.23rem .38rem;border:1px solid rgba(255,255,255,.08);border-radius:999px;font-size:.55rem;font-weight:850;color:#94a3b8;background:rgba(255,255,255,.025)}.kyv-release-step.ready{color:#a7f3d0;border-color:rgba(16,185,129,.18);background:rgba(16,185,129,.06)}.kyv-release-step.next{color:#fde68a;border-color:rgba(245,158,11,.22);background:rgba(245,158,11,.07)}.kyv-release-closeout-actions{display:flex;flex-direction:column;gap:.35rem;min-width:155px}.kyv-release-closeout-btn{display:inline-flex;align-items:center;justify-content:center;gap:.32rem;padding:.48rem .62rem;border-radius:.68rem;border:1px solid rgba(56,189,248,.24);background:rgba(56,189,248,.09);color:#e0f2fe;font-size:.64rem;font-weight:900}.kyv-release-closeout-btn:hover{background:rgba(56,189,248,.16);color:#fff}.kyv-release-closeout-btn.finish{border-color:rgba(34,197,94,.28);background:rgba(34,197,94,.10);color:#dcfce7}.kyv-release-closeout-btn.secondary{border-color:rgba(255,255,255,.09);background:rgba(255,255,255,.035);color:#cbd5e1}@media(max-width:680px){.kyv-release-closeout-grid{grid-template-columns:1fr}.kyv-release-closeout-actions{min-width:0;display:grid;grid-template-columns:1fr}}
`;document.head.appendChild(s);}

function openField(check){const edit=document.querySelector('#kyv-release-desk [data-release-edit]');if(edit)edit.click();else if(typeof window.openQuickEdit==='function')window.openQuickEdit();setTimeout(()=>{const modal=document.getElementById('quick-edit-modal');const candidates=(check?.fields||[]).map(field=>modal?.querySelector(`[data-key="${CSS.escape(field)}"]`)).filter(Boolean);const target=candidates.find(input=>!text(input.value))||candidates[0];target?.focus();target?.scrollIntoView({behavior:'smooth',block:'center'});},100);}
function goAdmin(){if(typeof window.setTab==='function')window.setTab('amministrazione');setTimeout(()=>document.getElementById('tab-admin')?.scrollIntoView({behavior:'smooth',block:'start'}),60);}
function guardSnapshot(query,key,value){return value===null||value===undefined?query.is(key,null):query.eq(key,value);}
async function closeProject(view,button){
  if(busy)return;const p=view?.p||{};if(!p.ID||!client())return;if(!window.confirm('Segnare questo progetto come pubblicato e chiuso? Le note di sviluppo resteranno invariate.'))return;
  busy=true;if(button){button.disabled=true;button.textContent='Chiusura…';}
  try{
    let query=client().from('PROGETTI').update({STATO:'Pubblicato'}).eq('ID',p.ID);
    query=guardSnapshot(query,'STATO',p.STATO);
    query=guardSnapshot(query,'SVILUPPO',p.SVILUPPO);
    const {data,error}=await query.select('ID,STATO,SVILUPPO').maybeSingle();if(error)throw error;
    if(!data)throw new Error('Il progetto è stato modificato da un’altra operazione. Aggiorna la scheda e riprova: nessun dato è stato sovrascritto.');
    if(text(data.SVILUPPO)!==text(p.SVILUPPO))throw new Error('Verifica integrità fallita: SVILUPPO è cambiato durante la chiusura.');
    if(window.KYV_TOAST)KYV_TOAST.show('Progetto segnato come pubblicato. Note di sviluppo preservate.','success');else if(window.KYV?.showToast)KYV.showToast('Progetto segnato come pubblicato. Note di sviluppo preservate.','success');
    lastFingerprint='';window.dispatchEvent(new CustomEvent('kyv:release-closed',{detail:{projectId:p.ID}}));if(typeof window.refreshAll==='function')await window.refreshAll();
  }catch(error){console.error('[KYV Release Closeout]',error);if(window.KYV_TOAST)KYV_TOAST.show(error.message||'Chiusura progetto non riuscita.','error');else if(window.KYV?.showToast)KYV.showToast(error.message||'Chiusura progetto non riuscita.','error');}
  finally{busy=false;if(button){button.disabled=false;button.textContent='Segna pubblicato e chiudi';}}
}
function render(){
  const view=current(),desk=document.getElementById('kyv-release-desk');if(!view||!desk)return false;
  const fp=fingerprint(view),existing=document.getElementById('kyv-release-closeout');if(existing&&fp===lastFingerprint)return true;lastFingerprint=fp;
  const p=view.p||{},rows=checks(view),next=rows.find(row=>!row.ready)||null,closed=doneProject(p),passed=releasePassed(p.Data_Pubblicazione);
  let box=existing;if(!box){box=document.createElement('section');box.id='kyv-release-closeout';const head=desk.querySelector('.kyv-release-head');head?.insertAdjacentElement('afterend',box);if(!box.parentElement)desk.prepend(box);}
  let title='',copy='',primary='';
  if(closed){title='Progetto pubblicato / chiuso';copy='Il ciclo release è concluso. Il passaggio operativo successivo è fattura e incasso.';primary='admin';}
  else if(next){title=`Prossima azione · ${next.label}`;copy='Completa questo dato prima di passare al controllo successivo della release.';primary='next';}
  else if(!passed){title=`Release pronta · uscita ${fmtDate(p.Data_Pubblicazione)}`;copy='Tutti i controlli release sono completi. Il progetto resta aperto fino alla data di pubblicazione.';primary='edit';}
  else{title='Release completa · pronta per la chiusura';copy='Master, ISRC, uscita e crediti sono completi. Puoi segnare il progetto come pubblicato e chiuso.';primary='close';}
  const steps=rows.map(row=>`<span class="kyv-release-step ${row.ready?'ready':row===next?'next':''}">${row.ready?'✓':'○'} ${H(row.label)}</span>`).join('');
  box.innerHTML=`<div class="kyv-release-closeout-grid"><div><div class="kyv-release-closeout-kicker">Percorso release</div><strong class="kyv-release-closeout-title">${H(title)}</strong><p class="kyv-release-closeout-copy">${H(copy)}</p><div class="kyv-release-closeout-path">${steps}</div></div><div class="kyv-release-closeout-actions"></div></div>`;
  const actions=box.querySelector('.kyv-release-closeout-actions');
  if(primary==='next')actions.innerHTML='<button type="button" class="kyv-release-closeout-btn" data-closeout-next>Completa adesso</button>';
  if(primary==='edit')actions.innerHTML='<button type="button" class="kyv-release-closeout-btn" data-closeout-edit>Modifica dati release</button>';
  if(primary==='close')actions.innerHTML='<button type="button" class="kyv-release-closeout-btn finish" data-closeout-finish>Segna pubblicato e chiudi</button>';
  if(primary==='admin')actions.innerHTML='<button type="button" class="kyv-release-closeout-btn finish" data-closeout-admin>Fattura & incasso</button>';
  if(!closed)actions.insertAdjacentHTML('beforeend','<a class="kyv-release-closeout-btn secondary" href="ascolto.html?projectId='+encodeURIComponent(p.ID)+'">Ascolto</a>');
  box.querySelector('[data-closeout-next]')?.addEventListener('click',()=>openField(next));
  box.querySelector('[data-closeout-edit]')?.addEventListener('click',()=>desk.querySelector('[data-release-edit]')?.click());
  box.querySelector('[data-closeout-finish]')?.addEventListener('click',event=>closeProject(view,event.currentTarget));
  box.querySelector('[data-closeout-admin]')?.addEventListener('click',goAdmin);
  return true;
}
function schedule(delay=70){clearTimeout(timer);timer=setTimeout(render,delay);}
function watchHero(){const target=document.getElementById('hero-badges')||document.getElementById('hero-title');if(!target||heroObserver)return false;heroObserver=new MutationObserver(()=>{lastFingerprint='';schedule(40);});heroObserver.observe(target,{childList:true,subtree:true,characterData:true});return true;}
function boot(){injectStyles();const retry=setInterval(()=>{watchHero();if(render())clearInterval(retry);},120);setTimeout(()=>clearInterval(retry),10000);window.addEventListener('kyv:project-v2-ready',()=>{lastFingerprint='';schedule(40);});window.addEventListener('kyv:pitch-updated',()=>schedule(60));window.addEventListener('beforeunload',()=>heroObserver?.disconnect(),{once:true});}
window.KYV_RELEASE_CLOSEOUT={refresh:()=>{lastFingerprint='';return render();}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
