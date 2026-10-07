/* KYV Version → Pitch — collega la versione esatta al form Invii & Follow-up senza nuove tabelle. */
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'').toLowerCase();
if(!['ascolto.html','scheda_progetto.html'].includes(page))return;

let observer=null;
let timer=null;
let consumedUrlPrefill=false;

function text(value){return String(value??'').trim();}
function schedule(fn,delay=60){clearTimeout(timer);timer=setTimeout(fn,delay);}
function pitchPanel(){return document.getElementById('kyv-pitch-followup-project');}
function pitchForm(){return pitchPanel()?.querySelector('[data-pitch-form]')||null;}
function pitchSelect(){return pitchForm()?.querySelector('[name="versionKey"]')||null;}
function recipientInput(){return pitchForm()?.querySelector('[name="recipient"]')||null;}

function clearPrefillNote(){document.getElementById('kyv-version-pitch-prefill')?.remove();}
function showPrefillNote(label){
  const form=pitchForm();if(!form)return;
  clearPrefillNote();
  const note=document.createElement('div');
  note.id='kyv-version-pitch-prefill';
  note.className='mt-2 rounded-lg border border-sky-400/20 bg-sky-400/[0.07] px-3 py-2 text-[10px] font-bold text-sky-100';
  note.textContent=`Versione selezionata: ${label||'versione audio'}`;
  const target=form.querySelector('[name="versionKey"]')?.closest('label');
  if(target)target.insertAdjacentElement('afterend',note);else form.prepend(note);
}

function openPitch(versionKey,versionLabel=''){
  const panel=pitchPanel(),form=pitchForm(),select=pitchSelect();
  if(!panel||!form||!select||!versionKey)return false;
  const option=[...select.options].find(item=>item.value===versionKey);
  if(!option)return false;
  select.value=versionKey;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  form.classList.add('open');
  showPrefillNote(versionLabel||text(option.textContent).replace(/^Ultima\s*·\s*/i,''));
  panel.scrollIntoView({behavior:'smooth',block:'start'});
  setTimeout(()=>recipientInput()?.focus(),220);
  return true;
}

function consumeUrlPrefill(){
  if(page!=='scheda_progetto.html'||consumedUrlPrefill)return false;
  const url=new URL(location.href),versionKey=text(url.searchParams.get('pitchVersion'));
  if(!versionKey)return false;
  if(!openPitch(versionKey))return false;
  consumedUrlPrefill=true;
  url.searchParams.delete('pitchVersion');
  url.searchParams.delete('pitchSource');
  history.replaceState(history.state,'',`${url.pathname}${url.search}${url.hash}`);
  return true;
}

function pitchKeyFromListening(key){
  const raw=text(key);
  if(raw.startsWith('audio:'))return`v:${raw.slice(6)}`;
  if(raw.startsWith('dropbox:'))return`f:${raw.slice(8)}`;
  return'';
}

function projectIdFromListenHead(){
  const href=document.querySelector('#kyv-listen-project-head a[href*="scheda_progetto.html"]')?.getAttribute('href')||'';
  if(!href)return'';
  try{return text(new URL(href,location.href).searchParams.get('id'));}catch(_){return'';}
}

function enhanceListenVersions(){
  if(page!=='ascolto.html')return;
  const host=document.getElementById('kyv-listen-versions'),projectId=projectIdFromListenHead();
  if(!host||!projectId)return;
  let changed=false;
  host.querySelectorAll('article[data-version-key]').forEach(card=>{
    if(card.querySelector('[data-kyv-send-version]'))return;
    const key=pitchKeyFromListening(card.dataset.versionKey);if(!key)return;
    let actions=[...card.querySelectorAll('div')].find(node=>node.classList.contains('mt-3')&&node.classList.contains('flex')&&node.classList.contains('flex-wrap'));
    if(!actions){actions=document.createElement('div');actions.className='flex flex-wrap gap-2 mt-3';card.appendChild(actions);}
    const link=document.createElement('a');
    link.dataset.kyvSendVersion='1';
    link.className='kyv-listen-action';
    link.href=`scheda_progetto.html?id=${encodeURIComponent(projectId)}&pitchVersion=${encodeURIComponent(key)}&pitchSource=ascolto#kyv-pitch-followup-project`;
    link.innerHTML='<i data-lucide="send" class="w-3.5 h-3.5"></i>Registra invio';
    actions.appendChild(link);changed=true;
  });
  if(changed&&window.lucide)lucide.createIcons({root:host});
}

function normalizedOptionLabel(option){return text(option?.textContent).replace(/^Ultima\s*·\s*/i,'');}
function enhanceProjectVersions(){
  if(page!=='scheda_progetto.html')return;
  const host=document.getElementById('kyv-project-v2-versions'),select=pitchSelect();
  if(!host||!select)return;
  const options=[...select.options].filter(option=>option.value);
  let changed=false;
  host.querySelectorAll('.kyv-v2-version').forEach(card=>{
    if(card.querySelector('[data-kyv-send-version]'))return;
    const name=text(card.querySelector('h4')?.textContent);if(!name)return;
    const matches=options.filter(option=>normalizedOptionLabel(option)===name);
    if(matches.length!==1)return;
    const button=document.createElement('button');
    button.type='button';
    button.dataset.kyvSendVersion='1';
    button.className='kyv-v2-link text-left';
    button.innerHTML='<i data-lucide="send" class="w-3 h-3 inline mr-1"></i>Invia';
    button.addEventListener('click',()=>openPitch(matches[0].value,name));
    const directLink=[...card.children].find(node=>node.matches?.('a.kyv-v2-link'));
    if(directLink){
      const wrap=document.createElement('div');wrap.className='flex flex-col items-end gap-2';
      card.insertBefore(wrap,directLink);wrap.appendChild(directLink);wrap.appendChild(button);
    }else card.appendChild(button);
    changed=true;
  });
  if(changed&&window.lucide)lucide.createIcons({root:host});
}

function run(){
  if(page==='ascolto.html')enhanceListenVersions();
  if(page==='scheda_progetto.html'){
    consumeUrlPrefill();
    enhanceProjectVersions();
  }
}

function boot(){
  run();
  const root=page==='ascolto.html'?(document.getElementById('kyv-listening-phase4')||document.documentElement):(document.getElementById('project-view')||document.documentElement);
  observer=new MutationObserver(()=>schedule(run));
  observer.observe(root,{childList:true,subtree:true});
  window.addEventListener('kyv:project-v2-ready',()=>schedule(run,0));
  window.addEventListener('kyv:pitch-updated',()=>schedule(run,0));
  window.setTimeout(()=>observer?.disconnect(),120000);
}

window.KYV_VERSION_TO_PITCH={open:openPitch,refresh:run};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
