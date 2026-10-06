/* KYV Action Bridge — collega la prossima azione dei progetti a Oggi e Agenda senza duplicare dati. */
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const relevant=new Set(['','index.html','progetti.html','kyv_calendar.html']);
if(!relevant.has(page))return;

function text(value){return String(value??'').trim();}
function H(value){return text(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function upper(value){return text(value).toUpperCase();}
function done(row){return /USCITA|PUBBLICAT|COMPLETAT|FINITA|CHIUS/.test(`${upper(row?.STATO)} ${upper(row?.SVILUPPO)}`);}
function nextAction(row){
  const value=text(row?.SVILUPPO);
  if(!value||done(row))return'';
  return value;
}
function projectLabel(row){return [text(row?.ARTISTA),text(row?.TITOLO)].filter(Boolean).join(' · ')||`Progetto ${text(row?.ID)}`;}
function localDate(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);}
function calendarHref(row,action){
  const qs=new URLSearchParams({projectAction:'1',project:text(row?.ID),action:text(action),title:text(row?.TITOLO),artist:text(row?.ARTISTA),date:localDate()});
  return `kyv_calendar.html?${qs.toString()}`;
}
function createIcon(name,classes='w-3.5 h-3.5'){return `<i data-lucide="${name}" class="${classes}"></i>`;}

function mountProjectPlanLinks(){
  if(page!=='progetti.html')return;
  const root=document.getElementById('tbody-uscite');if(!root)return;
  const apply=()=>{
    root.querySelectorAll('[data-kyv-project-id]').forEach(row=>{
      if(row.querySelector('[data-kyv-action-plan]'))return;
      const cell=row.querySelector('[data-label="Prossima azione"]');
      const action=text(cell?.querySelector('.kyv-next-action')?.textContent);
      if(!cell||!action||/^DA DECIDERE$|^NESSUNA:/i.test(action))return;
      const title=text(row.querySelector('.kyv-project-title')?.textContent);
      const artist=text(row.querySelector('.kyv-project-artist')?.textContent).replace(/^Artista non indicato$/i,'');
      const projectId=text(row.dataset.kyvProjectId);
      const href=calendarHref({ID:projectId,TITOLO:title,ARTISTA:artist},action);
      const link=document.createElement('a');
      link.href=href;link.dataset.kyvActionPlan='1';
      link.className='inline-flex items-center gap-1.5 mt-2 text-[10px] font-black text-cyan-200 hover:text-white rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2 py-1.5';
      link.innerHTML=`${createIcon('calendar-plus')}Pianifica`;
      link.addEventListener('click',event=>event.stopPropagation());
      cell.appendChild(link);
    });
    if(window.lucide)lucide.createIcons({root});
  };
  apply();
  new MutationObserver(apply).observe(root,{childList:true,subtree:true});
}

function dashboardActionRows(projects){
  return (projects||[]).map(row=>({row,action:nextAction(row)})).filter(item=>item.action&&text(item.row?.ID)).map(({row,action})=>({
    type:'azioni',
    priority:76,
    badge:'Da fare',
    title:action,
    subtitle:projectLabel(row),
    meta:'Prossima azione del progetto · clicca per pianificarla in Agenda',
    href:calendarHref(row,action)
  }));
}
function ensureActionFilter(){
  if(page!=='index.html'&&page!=='')return;
  if(document.querySelector('[data-activity-filter="azioni"]'))return;
  const host=document.querySelector('[data-activity-filter="followup"]')?.parentElement;if(!host)return;
  const btn=document.createElement('button');
  btn.className='activity-filter';btn.dataset.activityFilter='azioni';btn.textContent='Azioni progetto';
  btn.addEventListener('click',()=>window.setActivityFilter?.('azioni'));
  const followup=host.querySelector('[data-activity-filter="followup"]');
  followup?.insertAdjacentElement('afterend',btn);
}
function decorateDashboardActionRows(){
  const list=document.getElementById('activity-list');if(!list)return;
  list.querySelectorAll('a[href*="projectAction=1"]').forEach(anchor=>{
    const label=anchor.querySelector('.text-kyv-text.uppercase')||anchor.querySelector('span span span');
    if(label)label.textContent='Azione progetto';
    const icon=anchor.querySelector('i[data-lucide]');if(icon)icon.setAttribute('data-lucide','list-checks');
  });
  if(window.lucide)lucide.createIcons({root:list});
}
function patchDashboard(){
  if(page!=='index.html'&&page!=='')return;
  ensureActionFilter();
  const original=window.renderStudioPulse;
  if(typeof original!=='function'||original.__kyvActionBridge)return;
  const wrapped=function(projData){
    const result=original.apply(this,arguments);
    try{
      const additions=dashboardActionRows(projData);
      if(typeof dashboardActivities!=='undefined'&&Array.isArray(dashboardActivities)){
        dashboardActivities=dashboardActivities.filter(item=>item.type!=='azioni').concat(additions).sort((a,b)=>(b.priority||0)-(a.priority||0)||String(a.title||'').localeCompare(String(b.title||''),'it'));
        if(typeof renderDashboardActivities==='function')renderDashboardActivities();
        decorateDashboardActionRows();
      }
    }catch(error){console.warn('KYV Action Bridge: azioni Oggi non disponibili.',error);}
    return result;
  };
  wrapped.__kyvActionBridge=true;
  window.renderStudioPulse=wrapped;
  const nativeFilter=window.setActivityFilter;
  if(typeof nativeFilter==='function'&&!nativeFilter.__kyvActionBridge){
    const filterWrapped=function(type){const result=nativeFilter.apply(this,arguments);queueMicrotask(decorateDashboardActionRows);return result;};
    filterWrapped.__kyvActionBridge=true;window.setActivityFilter=filterWrapped;
  }
}

function prefillCalendar(){
  if(page!=='kyv_calendar.html')return;
  const params=new URLSearchParams(location.search);if(params.get('projectAction')!=='1')return;
  const action=text(params.get('action')),title=text(params.get('title')),artist=text(params.get('artist')),project=text(params.get('project'));
  const titleInput=document.getElementById('ev-title'),dateInput=document.getElementById('ev-date'),form=document.getElementById('form-new-event');
  if(!form||!titleInput||!dateInput)return;
  titleInput.value=[action,[artist,title].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');
  dateInput.value=params.get('date')||localDate();
  if(!document.getElementById('kyv-project-action-context')){
    const box=document.createElement('div');box.id='kyv-project-action-context';
    box.className='mb-4 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3 text-xs text-cyan-100';
    const back=project?`<a href="scheda_progetto.html?id=${encodeURIComponent(project)}" class="inline-flex mt-2 font-black text-white hover:text-cyan-100">Torna al progetto →</a>`:'';
    box.innerHTML=`<div class="flex items-start gap-2">${createIcon('route','w-4 h-4 mt-0.5 shrink-0')}<div><p class="font-black">Azione dal progetto</p><p class="mt-1 text-cyan-100/75">${H(projectLabel({ID:project,TITOLO:title,ARTISTA:artist}))}. Data già impostata a oggi; scegli l’orario o modifica la data prima di creare l’evento.</p>${back}</div></div>`;
    form.parentElement?.insertBefore(box,form);
  }
  titleInput.focus();
  if(window.lucide)lucide.createIcons({root:form.parentElement||document.body});
}

function boot(){
  mountProjectPlanLinks();
  patchDashboard();
  prefillCalendar();
  if((page==='index.html'||page==='')&&!window.renderStudioPulse?.__kyvActionBridge){let attempts=0;const timer=setInterval(()=>{attempts+=1;patchDashboard();if(window.renderStudioPulse?.__kyvActionBridge||attempts>40)clearInterval(timer);},100);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
