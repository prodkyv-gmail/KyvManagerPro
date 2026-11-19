/* KYV Action Bridge — Prossima azione -> Oggi -> Agenda. */
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
let db=null;
let todayProjects=[];

function esc(value){
  if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function text(value){return String(value??'').trim();}
function isDone(project){return /uscita|pubblicat|completat|chius|finita/i.test(String(project?.STATO||''));}
function hasAction(project){return !!text(project?.SVILUPPO)&&!isDone(project);}
function projectLabel(project){return [text(project?.ARTISTA)||'Artista non indicato',text(project?.TITOLO)||'Senza titolo'].join(' · ');}
function localDate(){const d=new Date(),off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,10);}
function calendarHref(project,date=''){
  const q=new URLSearchParams();
  q.set('action',text(project?.SVILUPPO));
  q.set('project',text(project?.TITOLO));
  q.set('artist',text(project?.ARTISTA));
  q.set('projectId',text(project?.ID));
  q.set('date',date||localDate());
  return `kyv_calendar.html?${q.toString()}`;
}
function showToast(message,type='success'){
  if(window.KYV_TOAST?.show)return KYV_TOAST.show(message,type);
  if(window.KYV?.showToast)return KYV.showToast(message,type);
}
function getDb(){
  if(db)return db;
  db=window.KYV?.createSupabaseClient?.()||null;
  return db;
}
function sortProjects(rows){
  return [...rows].filter(hasAction).sort((a,b)=>{
    const ad=new Date(a.updated_at||a.Data_Sessione||a.created_at||0).getTime()||Number(a.ID||0);
    const bd=new Date(b.updated_at||b.Data_Sessione||b.created_at||0).getTime()||Number(b.ID||0);
    return bd-ad;
  });
}

async function loadTodayProjects(){
  const client=getDb();
  if(!client)return [];
  try{
    const {data,error}=await client.from('PROGETTI').select('*').limit(500);
    if(error)throw error;
    todayProjects=sortProjects(data||[]);
  }catch(error){
    console.warn('KYV Action Bridge: impossibile leggere le prossime azioni.',error);
    todayProjects=[];
  }
  return todayProjects;
}

async function completeAction(projectId,button){
  const project=todayProjects.find(p=>String(p.ID)===String(projectId));
  if(!project)return;
  if(!window.confirm(`Segnare come fatta questa azione?\n\n${text(project.SVILUPPO)}`))return;
  const client=getDb();
  if(!client)return;
  if(button){button.disabled=true;button.innerHTML='<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Salvo';if(window.lucide)lucide.createIcons({root:button});}
  try{
    const {error}=await client.from('PROGETTI').update({SVILUPPO:''}).eq('ID',project.ID);
    if(error)throw error;
    todayProjects=todayProjects.filter(p=>String(p.ID)!==String(project.ID));
    renderTodayPanel();
    if(document.querySelector('[data-activity-filter="project"].active'))renderLegacyProjectFilter();
    showToast('Azione completata.','success');
  }catch(error){
    if(button){button.disabled=false;button.textContent='Fatto';}
    showToast(error.message||'Impossibile completare l’azione.','error');
  }
}

function actionRow(project,{compact=false}={}){
  const id=esc(project.ID),href=`scheda_progetto.html?id=${encodeURIComponent(String(project.ID))}`,plan=calendarHref(project);
  if(compact){
    return `<div class="kyv-activity-row" data-kyv-project-action="${id}">
      <span class="w-10 h-10 rounded-xl border border-violet-500/25 bg-violet-500/10 text-violet-200 flex items-center justify-center"><i data-lucide="check-square-2" class="w-4 h-4"></i></span>
      <span class="min-w-0 flex-1"><span class="text-[9px] uppercase tracking-wider font-black text-kyv-text">Azione progetto</span><strong class="block text-sm text-white mt-1">${esc(project.SVILUPPO)}</strong><span class="block text-xs text-kyv-text mt-1">${esc(projectLabel(project))}</span><span class="flex flex-wrap gap-2 mt-2"><a href="${href}" class="text-[10px] font-black text-indigo-200 hover:text-white" onclick="event.stopPropagation()">Apri progetto</a><a href="${esc(plan)}" class="text-[10px] font-black text-sky-200 hover:text-white" onclick="event.stopPropagation()">Pianifica</a><button type="button" data-kyv-complete="${id}" class="text-[10px] font-black text-emerald-200 hover:text-white" onclick="event.stopPropagation()">Fatto</button></span></span>
    </div>`;
  }
  return `<article class="rounded-2xl border border-white/10 bg-white/[0.035] p-4" data-kyv-project-action="${id}">
    <div class="flex items-start gap-3">
      <span class="w-10 h-10 rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-200 flex items-center justify-center shrink-0"><i data-lucide="check-square-2" class="w-4 h-4"></i></span>
      <div class="min-w-0 flex-1"><p class="text-[10px] uppercase tracking-[.12em] font-black text-violet-200">Da fare</p><h4 class="text-sm sm:text-base font-black text-white mt-1">${esc(project.SVILUPPO)}</h4><p class="text-xs text-kyv-text mt-1">${esc(projectLabel(project))}</p></div>
    </div>
    <div class="flex flex-wrap gap-2 mt-4">
      <a href="${href}" class="inline-flex items-center px-3 py-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-[11px] font-black text-indigo-100"><i data-lucide="panel-top-open" class="w-3.5 h-3.5 mr-1.5"></i>Apri progetto</a>
      <a href="${esc(plan)}" class="inline-flex items-center px-3 py-2 rounded-lg border border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 text-[11px] font-black text-sky-100"><i data-lucide="calendar-plus" class="w-3.5 h-3.5 mr-1.5"></i>Pianifica</a>
      <button type="button" data-kyv-complete="${id}" class="inline-flex items-center px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-[11px] font-black text-emerald-100"><i data-lucide="check" class="w-3.5 h-3.5 mr-1.5"></i>Fatto</button>
    </div>
  </article>`;
}

function bindComplete(root){
  root?.querySelectorAll('[data-kyv-complete]').forEach(button=>{
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();completeAction(button.dataset.kyvComplete,button);});
  });
}

function renderTodayPanel(){
  const panel=document.getElementById('kyv-today-project-actions');
  if(!panel)return;
  const list=panel.querySelector('[data-kyv-action-list]');
  const count=panel.querySelector('[data-kyv-action-count]');
  if(count)count.textContent=`${todayProjects.length} ${todayProjects.length===1?'azione':'azioni'}`;
  if(!list)return;
  if(!todayProjects.length){
    list.innerHTML='<div class="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.07] p-5 text-center"><i data-lucide="circle-check-big" class="w-6 h-6 mx-auto text-emerald-300 mb-2"></i><p class="text-sm font-black text-emerald-100">Nessuna prossima azione aperta.</p><p class="text-xs text-kyv-text mt-1">Quando imposti una prossima azione in un progetto, comparirà qui.</p></div>';
  }else{
    list.innerHTML=todayProjects.slice(0,8).map(p=>actionRow(p)).join('');
  }
  bindComplete(list);
  if(window.lucide)lucide.createIcons({root:panel});
}

async function mountToday(){
  if((page!=='oggi.html')||document.getElementById('kyv-today-project-actions'))return;
  const anchor=document.querySelector('.kyv-quick-actions')||document.getElementById('kyv-producer-start');
  if(!anchor)return;
  const panel=document.createElement('section');
  panel.id='kyv-today-project-actions';
  panel.className='kyv-pastel-lavender rounded-2xl border border-violet-500/20 p-4 sm:p-5 mb-5';
  panel.innerHTML=`<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"><div><p class="text-[10px] uppercase tracking-[.16em] font-black text-violet-200">Il lavoro di oggi</p><h3 class="text-lg font-black text-white mt-1">Azioni progetto</h3><p class="text-xs text-kyv-text mt-1">Apri, pianifica o chiudi ciò che hai deciso nei tuoi brani.</p></div><div class="flex items-center gap-2"><span data-kyv-action-count class="kyv-chip">0 azioni</span><a href="progetti.html" class="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-[11px] font-black text-slate-200 hover:text-white">Progetti</a></div></div><div data-kyv-action-list class="grid grid-cols-1 xl:grid-cols-2 gap-3"><div class="text-xs text-kyv-text">Carico le prossime azioni…</div></div>`;
  anchor.insertAdjacentElement('afterend',panel);
  await loadTodayProjects();
  renderTodayPanel();
  mountLegacyFilter();
}

function renderLegacyProjectFilter(){
  const list=document.getElementById('activity-list');
  if(!list)return;
  if(!todayProjects.length)list.innerHTML='<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center text-sm text-emerald-100 font-bold">Nessuna azione progetto aperta.</div>';
  else list.innerHTML=todayProjects.slice(0,14).map(p=>actionRow(p,{compact:true})).join('');
  const count=document.getElementById('activity-count');if(count)count.textContent=`${todayProjects.length} attività`;
  bindComplete(list);
  if(window.lucide)lucide.createIcons({root:list});
}

function mountLegacyFilter(){
  if(page!=='oggi.html')return;
  const original=window.setActivityFilter;
  const anyFilter=document.querySelector('[data-activity-filter="followup"]');
  if(typeof original!=='function'||!anyFilter)return false;
  if(!document.querySelector('[data-activity-filter="project"]')){
    const button=document.createElement('button');
    button.className='activity-filter';button.dataset.activityFilter='project';button.textContent='Azioni progetto';
    button.addEventListener('click',()=>window.setActivityFilter('project'));
    anyFilter.parentElement?.insertBefore(button,anyFilter);
  }
  if(!window.__kyvOriginalSetActivityFilter){
    window.__kyvOriginalSetActivityFilter=original;
    window.setActivityFilter=function(type){
      document.querySelectorAll('[data-activity-filter]').forEach(button=>button.classList.toggle('active',button.dataset.activityFilter===type));
      if(type==='project'){renderLegacyProjectFilter();return;}
      return window.__kyvOriginalSetActivityFilter(type);
    };
  }
  return true;
}

function enhanceProjects(){
  if(page!=='progetti.html')return;
  const apply=()=>{
    document.querySelectorAll('#tbody-uscite [data-kyv-project-id]').forEach(row=>{
      if(row.querySelector('[data-kyv-plan-row]'))return;
      const action=text(row.querySelector('[data-label="Prossima azione"] .kyv-next-action')?.textContent);
      if(!action||/da decidere|nessuna/i.test(action))return;
      const project={ID:row.dataset.kyvProjectId,TITOLO:text(row.querySelector('.kyv-project-title')?.textContent),ARTISTA:text(row.querySelector('.kyv-project-artist')?.textContent),SVILUPPO:action};
      const actions=row.querySelector('[data-label="Azioni"] .flex');if(!actions)return;
      const link=document.createElement('a');link.dataset.kyvPlanRow='1';link.href=calendarHref(project);link.className='kyv-row-menu';link.title='Pianifica prossima azione';link.setAttribute('aria-label','Pianifica prossima azione');link.innerHTML='<i data-lucide="calendar-plus" class="w-4 h-4"></i>';link.addEventListener('click',e=>e.stopPropagation());actions.insertBefore(link,actions.firstChild);
    });
    if(window.lucide)lucide.createIcons({root:document.getElementById('tbody-uscite')||document.body});
  };
  apply();
  const body=document.getElementById('tbody-uscite');if(body)new MutationObserver(apply).observe(body,{childList:true,subtree:true});
}

function prefillCalendar(){
  if(page!=='kyv_calendar.html')return;
  const params=new URLSearchParams(location.search),action=text(params.get('action'));
  if(!action)return;
  const project=text(params.get('project')),artist=text(params.get('artist')),projectId=text(params.get('projectId')),date=text(params.get('date'))||localDate();
  const title=document.getElementById('ev-title'),dateInput=document.getElementById('ev-date');
  if(title&&!text(title.value))title.value=[action,[artist,project].filter(Boolean).join(' · ')].filter(Boolean).join(' — ');
  if(dateInput&&!text(dateInput.value))dateInput.value=date;
  const form=document.getElementById('form-new-event');
  if(form&&!document.getElementById('kyv-calendar-project-context')){
    const box=document.createElement('div');box.id='kyv-calendar-project-context';box.className='rounded-xl border border-violet-500/20 bg-violet-500/[0.08] p-3 mb-4';
    const label=document.createElement('p');label.className='text-[10px] uppercase tracking-wider font-black text-violet-200';label.textContent='Dal progetto';box.appendChild(label);
    const main=document.createElement('p');main.className='text-xs font-black text-white mt-1';main.textContent=[artist,project].filter(Boolean).join(' · ')||'Progetto';box.appendChild(main);
    const sub=document.createElement('p');sub.className='text-xs text-kyv-text mt-1';sub.textContent=action;box.appendChild(sub);
    if(projectId){const link=document.createElement('a');link.href=`scheda_progetto.html?id=${encodeURIComponent(projectId)}`;link.className='inline-flex mt-2 text-[10px] font-black text-indigo-200 hover:text-white';link.textContent='Apri progetto ↗';box.appendChild(link);}
    form.prepend(box);
  }
  const heading=form?.closest('.bg-kyv-card')?.querySelector('h3');if(heading)heading.childNodes.forEach(node=>{if(node.nodeType===Node.TEXT_NODE&&node.textContent.includes('Crea Sessione'))node.textContent=' Pianifica attività';});
}

function boot(){
  if(page==='oggi.html'){
    const start=()=>{if(document.querySelector('.kyv-quick-actions')||document.getElementById('kyv-producer-start')){mountToday();return true;}return false;};
    if(!start()){const observer=new MutationObserver(()=>{if(start())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),7000);}
    const legacyTimer=setInterval(()=>{if(mountLegacyFilter())clearInterval(legacyTimer);},350);setTimeout(()=>clearInterval(legacyTimer),8000);
  }else if(page==='progetti.html')enhanceProjects();
  else if(page==='kyv_calendar.html')prefillCalendar();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
