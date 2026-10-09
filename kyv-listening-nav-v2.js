/* KYV Listening Navigation v2 — Radio / Archivio / Importa.
   Solo UI: riusa switchSource e gli strumenti Dropbox/Drive/Locale già esistenti. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='ascolto.html')return;

let current='radio';
let wrapped=false;

function ensureStyle(){
  if(document.getElementById('kyv-listening-nav-v2-style'))return;
  const style=document.createElement('style');
  style.id='kyv-listening-nav-v2-style';
  style.textContent=`
#kyv-listening-nav-v2{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap}
.kyv-listening-nav-btn,.kyv-listening-provider-btn{border:1px solid #2b3243;background:#151923;color:#9ca3b5;border-radius:.8rem;font-size:.72rem;font-weight:900;transition:.15s ease}
.kyv-listening-nav-btn{min-height:40px;padding:.55rem 1rem}
.kyv-listening-nav-btn:hover,.kyv-listening-provider-btn:hover{color:#fff;border-color:#4b556d;background:#191e2a}
.kyv-listening-nav-btn.is-active{color:#fff;border-color:rgba(167,139,250,.58);background:linear-gradient(135deg,rgba(124,58,237,.82),rgba(99,102,241,.82));box-shadow:0 10px 24px rgba(99,102,241,.16)}
#kyv-listening-import-providers{display:none;align-items:center;gap:.4rem;margin-top:.55rem;padding:.45rem;border:1px solid rgba(148,163,184,.10);border-radius:.85rem;background:rgba(255,255,255,.025)}
#kyv-listening-import-providers.is-visible{display:flex}
.kyv-listening-provider-btn{padding:.48rem .72rem;min-height:34px}
.kyv-listening-provider-btn.is-active{color:#fff;border-color:rgba(96,165,250,.42);background:rgba(59,130,246,.13)}
#kyv-listening-nav-v2-wrap{display:flex;flex-direction:column;align-items:flex-end}
@media(max-width:900px){#kyv-listening-nav-v2-wrap{align-items:stretch;width:100%}#kyv-listening-nav-v2{width:100%}.kyv-listening-nav-btn{flex:1}.kyv-listening-provider-btn{flex:1}}
@media(max-width:560px){.kyv-listening-nav-btn{font-size:.68rem;padding:.5rem .65rem}.kyv-listening-provider-btn{font-size:.66rem;padding:.45rem .55rem}}
`;
  document.head.appendChild(style);
}

function modeForSource(source){
  if(source==='radio')return 'radio';
  if(source==='supabase')return 'archive';
  return 'import';
}
function sync(source){
  current=source||current;
  const mode=modeForSource(current);
  document.querySelectorAll('#kyv-listening-nav-v2 [data-kyv-mode]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.kyvMode===mode));
  const providers=document.getElementById('kyv-listening-import-providers');
  providers?.classList.toggle('is-visible',mode==='import');
  document.querySelectorAll('#kyv-listening-import-providers [data-kyv-source]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.kyvSource===current));
}

async function source(source){
  if(typeof window.switchSource!=='function')return;
  sync(source);
  const result=await window.switchSource(source);
  sync(source);
  return result;
}

function build(){
  const legacy=document.getElementById('tab-radio')?.parentElement;
  const header=legacy?.parentElement;
  if(!legacy||!header||document.getElementById('kyv-listening-nav-v2-wrap'))return false;
  legacy.style.display='none';

  const wrap=document.createElement('div');
  wrap.id='kyv-listening-nav-v2-wrap';
  const nav=document.createElement('div');
  nav.id='kyv-listening-nav-v2';
  nav.setAttribute('aria-label','Modalità ascolto');
  [['radio','Radio'],['archive','Archivio'],['import','Importa']].forEach(([mode,label])=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='kyv-listening-nav-btn';
    btn.dataset.kyvMode=mode;
    btn.textContent=label;
    btn.addEventListener('click',()=>{
      if(mode==='radio')source('radio');
      else if(mode==='archive')source('supabase');
      else source(['dropbox','drive','local'].includes(current)?current:'dropbox');
    });
    nav.appendChild(btn);
  });

  const providers=document.createElement('div');
  providers.id='kyv-listening-import-providers';
  providers.setAttribute('aria-label','Sorgente importazione');
  [['dropbox','Dropbox'],['drive','Drive'],['local','Locale']].forEach(([name,label])=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='kyv-listening-provider-btn';
    btn.dataset.kyvSource=name;
    btn.textContent=label;
    btn.addEventListener('click',()=>source(name));
    providers.appendChild(btn);
  });
  wrap.append(nav,providers);
  header.appendChild(wrap);

  const badge=document.querySelector('main header .inline-flex');
  if(badge)badge.textContent='Ascolto';
  const title=document.querySelector('main header h2');
  if(title)title.textContent='Ascolto';
  const subtitle=document.querySelector('main header p');
  if(subtitle)subtitle.textContent='Radio, archivio e importazione audio in una sola vista.';
  const playlist=document.querySelector('section.kyv-panel h3');
  sync(current);
  return true;
}

function wrapSource(){
  if(wrapped||typeof window.switchSource!=='function')return false;
  const original=window.switchSource;
  if(original.__kyvListeningNavWrapped){wrapped=true;return true;}
  const next=async function(name){
    sync(name);
    const result=await original.apply(this,arguments);
    sync(name);
    return result;
  };
  next.__kyvListeningNavWrapped=true;
  window.switchSource=next;
  wrapped=true;
  return true;
}

function simplifyCopy(){
  const radioTools=document.getElementById('radio-tools');
  const radioText=radioTools?.querySelector('p');
  if(radioText)radioText.textContent='La Radio unisce archivio e Drive; puoi aggiungere anche file Dropbox al volo.';
  const dropboxText=document.getElementById('dropbox-tools')?.querySelector('p');
  if(dropboxText)dropboxText.textContent='Scegli file Dropbox da ascoltare subito e, quando serve, salvali nell’Archivio.';
  const driveText=document.getElementById('drive-tools')?.querySelector('p');
  if(driveText)driveText.textContent='Cerca i file audio nei Drive configurati e portali nella playlist.';
  const localText=document.getElementById('local-tools')?.querySelector('p');
  if(localText)localText.textContent='Apri file dal dispositivo per un ascolto temporaneo, senza salvarli nel database.';
  const noteInfo=[...document.querySelectorAll('p')].find(p=>/DOCUMENTI_PROGETTO/.test(p.textContent||''));
  if(noteInfo)noteInfo.textContent='Le note vengono salvate sul progetto collegato.';
}

function boot(){
  ensureStyle();build();wrapSource();simplifyCopy();
  let pass=0;
  const timer=setInterval(()=>{
    build();wrapSource();simplifyCopy();pass++;
    if(pass>=24||(document.getElementById('kyv-listening-nav-v2-wrap')&&wrapped))clearInterval(timer);
  },200);
  setTimeout(()=>clearInterval(timer),6000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
