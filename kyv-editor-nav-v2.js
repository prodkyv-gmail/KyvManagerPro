/* KYV Studio Editor Navigation v2 — 5 tabelle principali + Altre tabelle.
   Solo UI: riusa loadEditorTable esistente, nessuna query o scrittura aggiuntiva. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='editor.html')return;

const PRIMARY=[
  ['PROGETTI','Progetti'],
  ['CLIENTI','Clienti'],
  ['FATTURE','Fatture'],
  ['AUDIO_VERSIONI','Audio'],
  ['DOCUMENTI_PROGETTO','Documenti']
];
const OTHER=[
  ['CONSEGNE_MASTER','Consegne master'],
  ['DROPBOX_AUDIO_FILES','Audio Dropbox'],
  ['INVII_AUDIO','Invii audio'],
  ['Spese Extra','Spese extra'],
  ['PIANI_FISCALI','Piani fiscali'],
  ['EXPORT SIAE VERTICALE','SIAE verticale'],
  ['EXPORT SIAE','SIAE orizzontale'],
  ['ESTRATTO SIAE','Estratto SIAE'],
  ['ESTRATTO_IMAIE','IMAIE']
];
const primarySet=new Set(PRIMARY.map(([table])=>table));
const otherSet=new Set(OTHER.map(([table])=>table));
let current='PROGETTI';
let wrapped=false;

function ensureStyle(){
  if(document.getElementById('kyv-editor-nav-v2-style'))return;
  const style=document.createElement('style');
  style.id='kyv-editor-nav-v2-style';
  style.textContent=`
#kyv-editor-nav-v2{display:flex;align-items:center;gap:.45rem;min-width:0;flex-wrap:wrap}
.kyv-editor-nav-btn,.kyv-editor-more{height:38px;border-radius:.7rem;border:1px solid #2a3143;background:#151923;color:#9ca3b5;padding:0 .9rem;font-size:.72rem;font-weight:800;white-space:nowrap;transition:.15s ease}
.kyv-editor-nav-btn:hover,.kyv-editor-more:hover{border-color:#4a536b;color:#fff;background:#191e2a}
.kyv-editor-nav-btn.is-active{color:#fff;border-color:rgba(129,140,248,.7);background:linear-gradient(135deg,rgba(99,102,241,.9),rgba(124,58,237,.86));box-shadow:0 8px 20px rgba(99,102,241,.18)}
.kyv-editor-more{min-width:150px;outline:none;cursor:pointer;color:#cbd5e1}
.kyv-editor-more[data-kyv-active="1"]{border-color:rgba(129,140,248,.55);background:rgba(99,102,241,.13);color:#e0e7ff}
#kyv-editor-nav-v2-wrap{display:flex;align-items:center;gap:.55rem;flex:1 1 auto;min-width:0}
#kyv-editor-nav-v2-label{display:none;color:#697386;font-size:.62rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em}
@media(max-width:900px){#kyv-editor-nav-v2{flex-wrap:nowrap;overflow-x:auto;padding-bottom:.2rem;scrollbar-width:thin}#kyv-editor-nav-v2>*{flex:0 0 auto}.kyv-editor-nav-btn,.kyv-editor-more{height:36px;padding:0 .72rem;font-size:.68rem}}
@media(max-width:640px){#kyv-editor-nav-v2-wrap{width:100%;display:block}#kyv-editor-nav-v2-label{display:block;margin-bottom:.45rem}.kyv-editor-nav-btn{height:35px}.kyv-editor-more{min-width:142px;font-size:16px}}
`;
  document.head.appendChild(style);
}

function sync(table){
  current=table||current;
  document.querySelectorAll('#kyv-editor-nav-v2 [data-kyv-table]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.kyvTable===current));
  const select=document.getElementById('kyv-editor-more');
  if(select){
    select.value=otherSet.has(current)?current:'';
    select.dataset.kyvActive=otherSet.has(current)?'1':'0';
  }
}

async function openTable(table){
  if(!table||typeof window.loadEditorTable!=='function')return;
  sync(table);
  try{await window.loadEditorTable(table);}finally{sync(table);}
}

function build(){
  const legacy=document.getElementById('editor-tabs');
  if(!legacy||document.getElementById('kyv-editor-nav-v2-wrap'))return false;
  const legacyWrap=legacy.parentElement;
  const controls=legacyWrap?.parentElement;
  if(!legacyWrap||!controls)return false;
  legacyWrap.style.display='none';

  const wrap=document.createElement('div');
  wrap.id='kyv-editor-nav-v2-wrap';
  wrap.innerHTML='<span id="kyv-editor-nav-v2-label">Tabelle</span>';
  const nav=document.createElement('div');
  nav.id='kyv-editor-nav-v2';
  nav.setAttribute('aria-label','Tabelle principali Studio Editor');

  PRIMARY.forEach(([table,label])=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='kyv-editor-nav-btn';
    btn.dataset.kyvTable=table;
    btn.textContent=label;
    btn.addEventListener('click',()=>openTable(table));
    nav.appendChild(btn);
  });

  const select=document.createElement('select');
  select.id='kyv-editor-more';
  select.className='kyv-editor-more';
  select.setAttribute('aria-label','Altre tabelle');
  select.innerHTML='<option value="">Altre tabelle</option>'+OTHER.map(([table,label])=>`<option value="${table.replace(/"/g,'&quot;')}">${label}</option>`).join('');
  select.addEventListener('change',()=>{if(select.value)openTable(select.value);});
  nav.appendChild(select);
  wrap.appendChild(nav);
  controls.insertBefore(wrap,legacyWrap);

  const subtitle=document.querySelector('main header p');
  if(subtitle)subtitle.textContent='Modifica i dati principali. Le tabelle meno usate restano disponibili in “Altre tabelle”.';
  sync(current);
  return true;
}

function wrapLoader(){
  if(wrapped||typeof window.loadEditorTable!=='function')return false;
  const original=window.loadEditorTable;
  if(original.__kyvEditorNavWrapped){wrapped=true;return true;}
  const next=async function(tableName){
    sync(tableName);
    const result=await original.apply(this,arguments);
    sync(tableName);
    return result;
  };
  next.__kyvEditorNavWrapped=true;
  window.loadEditorTable=next;
  wrapped=true;
  return true;
}

function boot(){
  ensureStyle();
  build();
  wrapLoader();
  let pass=0;
  const timer=setInterval(()=>{
    build();wrapLoader();pass++;
    if(pass>=24||(document.getElementById('kyv-editor-nav-v2-wrap')&&wrapped))clearInterval(timer);
  },200);
  setTimeout(()=>clearInterval(timer),6000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
