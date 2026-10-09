/* KYV Studio Editor — Progetti: campi tipizzati, suggerimenti reali e apertura riga.
   Nessuna modifica schema. Le tendine sono combobox custom: mostrano i valori già presenti
   in PROGETTI ma permettono anche di scriverne uno nuovo. Le date restano input date nativi. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='editor.html')return;

const RECURRENT_FIELDS=[
  'ARTISTA','AUTORI','Label','MANAGEMENT','STATO','SVILUPPO','Nome_Vero_Artista',
  'Produttore_Fonografico','Ruolo_IMAIE_Kyv','Esito_Ascolto','Priorita_Followup'
];
const RECURRENT_SET=new Set(RECURRENT_FIELDS);
const state={
  currentTable:'PROGETTI',
  client:null,
  values:null,
  valuesPromise:null,
  wrapped:false
};

function client(){
  if(state.client)return state.client;
  if(!window.KYV?.createSupabaseClient)return null;
  state.client=KYV.createSupabaseClient();
  return state.client;
}
function normalize(value){return String(value??'').trim();}
function uniqueSorted(values){
  const seen=new Set();
  return (values||[]).map(normalize).filter(Boolean).filter(value=>{
    const key=value.toLocaleLowerCase('it');
    if(seen.has(key))return false;
    seen.add(key);return true;
  }).sort((a,b)=>a.localeCompare(b,'it',{numeric:true,sensitivity:'base'}));
}
function safe(value){
  if(window.KYV?.safeHtml)return KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function ensureStyle(){
  if(document.getElementById('kyv-editor-project-fields-style'))return;
  const style=document.createElement('style');
  style.id='kyv-editor-project-fields-style';
  style.textContent=`
#editor-tbody tr.kyv-project-row-edit{cursor:pointer}
#editor-tbody tr.kyv-project-row-edit:hover{background:rgba(99,102,241,.08)!important}
#editor-tbody tr.kyv-project-row-edit:focus-visible{outline:2px solid #818cf8;outline-offset:-2px;background:rgba(99,102,241,.10)!important}
#editor-tbody tr.kyv-project-row-edit td.kyv-project-row-cell{cursor:pointer}
.kyv-project-combo-host{position:relative}
.kyv-project-combo-input-wrap{position:relative}
.kyv-project-combo-toggle{position:absolute;right:.35rem;top:50%;transform:translateY(-50%);width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:0;background:transparent;color:#94a3b8;border-radius:.45rem;font-size:15px;font-weight:900;cursor:pointer}
.kyv-project-combo-toggle:hover,.kyv-project-combo-toggle[aria-expanded="true"]{color:#fff;background:rgba(99,102,241,.14)}
.kyv-project-combo-input{padding-right:2.5rem!important}
.kyv-project-combo-menu{position:absolute;left:0;right:0;top:calc(100% + 5px);z-index:120;max-height:220px;overflow:auto;background:#0d1018;border:1px solid #343b50;border-radius:.7rem;padding:.3rem;box-shadow:0 16px 38px rgba(0,0,0,.48)}
.kyv-project-combo-menu[hidden]{display:none!important}
.kyv-project-combo-option{width:100%;display:block;text-align:left;border:0;background:transparent;color:#e5e7eb;border-radius:.5rem;padding:.48rem .58rem;font-size:.72rem;line-height:1.25;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kyv-project-combo-option:hover,.kyv-project-combo-option:focus{background:rgba(99,102,241,.15);outline:none;color:#fff}
.kyv-project-combo-empty{padding:.6rem;color:#64748b;font-size:.7rem;text-align:center}
.kyv-project-combo-note{display:block;margin-top:.3rem;color:#64748b;font-size:.62rem;line-height:1.25}
#dynamic-form-fields input[type="date"].dyn-input{color-scheme:dark;cursor:pointer}
@media(max-width:640px){.kyv-project-combo-option{font-size:11px;min-height:36px;display:flex;align-items:center}.kyv-project-combo-menu{max-height:190px}.kyv-project-combo-toggle{width:32px;height:32px}.kyv-project-combo-input{font-size:16px!important}}
`;
  document.head.appendChild(style);
}

async function loadValues(force=false){
  if(state.values&&!force)return state.values;
  if(state.valuesPromise&&!force)return state.valuesPromise;
  const db=client();
  if(!db)return {};
  state.valuesPromise=db.from('PROGETTI').select(RECURRENT_FIELDS.join(',')).limit(1000).then(({data,error})=>{
    if(error)throw error;
    const map={};
    RECURRENT_FIELDS.forEach(field=>map[field]=uniqueSorted((data||[]).map(row=>row[field])));
    state.values=map;
    state.valuesPromise=null;
    return map;
  }).catch(error=>{
    console.warn('[KYV editor project fields] suggerimenti non disponibili',error);
    state.valuesPromise=null;
    state.values={};
    return state.values;
  });
  return state.valuesPromise;
}

function renderOptions(menu,values,query,input){
  const q=normalize(query).toLocaleLowerCase('it');
  const filtered=(values||[]).filter(value=>value.toLocaleLowerCase('it').includes(q)).slice(0,100);
  if(!filtered.length){menu.innerHTML='<div class="kyv-project-combo-empty">Nessun valore già presente. Puoi comunque scriverne uno nuovo.</div>';return;}
  menu.innerHTML=filtered.map((value,index)=>`<button type="button" class="kyv-project-combo-option" data-kyv-option="${index}" title="${safe(value)}">${safe(value)}</button>`).join('');
  menu.querySelectorAll('[data-kyv-option]').forEach(button=>button.addEventListener('click',()=>{
    input.value=filtered[Number(button.dataset.kyvOption)]||'';
    menu.hidden=true;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
  }));
}

function enhanceCombo(input,values){
  if(!input||input.dataset.kyvProjectCombo==='1')return;
  input.dataset.kyvProjectCombo='1';
  input.removeAttribute('list');
  input.setAttribute('autocomplete','off');
  input.classList.add('kyv-project-combo-input');
  const host=input.parentElement;
  if(!host)return;
  host.classList.add('kyv-project-combo-host');
  const wrap=document.createElement('div');
  wrap.className='kyv-project-combo-input-wrap';
  input.before(wrap);wrap.appendChild(input);
  const toggle=document.createElement('button');
  toggle.type='button';toggle.className='kyv-project-combo-toggle';toggle.textContent='▾';toggle.setAttribute('aria-label','Mostra valori già presenti');toggle.setAttribute('aria-expanded','false');
  wrap.appendChild(toggle);
  const menu=document.createElement('div');menu.className='kyv-project-combo-menu';menu.hidden=true;host.appendChild(menu);
  const note=document.createElement('small');note.className='kyv-project-combo-note';note.textContent=`${values.length} valori già usati · scegli dall’elenco o scrivine uno nuovo`;
  host.appendChild(note);

  const setOpen=open=>{menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));};
  const refresh=()=>renderOptions(menu,values,input.value,input);
  input.addEventListener('focus',()=>{refresh();setOpen(true);});
  input.addEventListener('input',()=>{refresh();setOpen(true);});
  toggle.addEventListener('click',()=>{const open=menu.hidden;if(open)refresh();setOpen(open);if(open)input.focus();});
  input.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false);});
  document.addEventListener('pointerdown',event=>{if(!host.contains(event.target))setOpen(false);},{capture:true});
}

async function enhanceProjectModal(){
  if(state.currentTable!=='PROGETTI')return;
  const root=document.getElementById('dynamic-form-fields');
  if(!root)return;
  const values=await loadValues();
  if(state.currentTable!=='PROGETTI'||!root.isConnected)return;
  root.querySelectorAll('.dyn-input[data-key]').forEach(input=>{
    const key=input.dataset.key;
    const type=String(input.getAttribute('type')||'text').toLowerCase();
    if(type==='date'){
      input.title=input.title||'Scegli la data dal calendario';
      return;
    }
    if(!RECURRENT_SET.has(key))return;
    enhanceCombo(input,values[key]||[]);
  });
  // I datalist legacy dei campi ricorrenti non servono più: le combobox sopra sono visibili anche su Safari/iPhone.
  root.querySelectorAll('datalist[data-kyv-memory="1"]').forEach(node=>node.remove());
}

function decorateProjectRows(dataArray){
  if(state.currentTable!=='PROGETTI'||!Array.isArray(dataArray)||!dataArray.length)return;
  const tbody=document.getElementById('editor-tbody');
  if(!tbody)return;
  const rows=Array.from(tbody.querySelectorAll(':scope > tr'));
  dataArray.forEach((row,index)=>{
    const tr=rows[index];if(!tr)return;
    tr.classList.add('kyv-project-row-edit');
    tr.dataset.kyvProjectRowId=String(row.ID??'');
    tr.tabIndex=0;
    tr.setAttribute('aria-label',`Modifica progetto ${[row.ARTISTA,row.TITOLO].filter(Boolean).join(' — ')||'#'+row.ID}`);
    tr.querySelectorAll('td.editable-cell').forEach(cell=>{
      cell.removeAttribute('contenteditable');
      cell.classList.remove('editable-cell','cursor-text');
      cell.classList.add('kyv-project-row-cell');
    });
  });
}

function isInteractiveTarget(target){
  return Boolean(target.closest('button,a,input,select,textarea,[data-action],[contenteditable="true"],.kyv-inline-relation,.kyv-cell-editor,.kyv-sheet-menu'));
}
function openRow(tr){
  if(!tr||state.currentTable!=='PROGETTI')return;
  const rowId=tr.dataset.kyvProjectRowId;
  if(!rowId||typeof window.openDynamicModal!=='function')return;
  window.openDynamicModal(rowId);
}

function wrapFunctions(){
  if(state.wrapped)return true;
  if(typeof window.loadEditorTable!=='function'||typeof window.renderEditorTable!=='function'||typeof window.openDynamicModal!=='function')return false;
  const originalLoad=window.loadEditorTable;
  const originalRender=window.renderEditorTable;
  const originalModal=window.openDynamicModal;

  window.loadEditorTable=async function(tableName){
    state.currentTable=tableName||state.currentTable;
    if(state.currentTable==='PROGETTI')loadValues().catch(()=>{});
    return originalLoad.apply(this,arguments);
  };
  window.renderEditorTable=function(dataArray){
    const result=originalRender.apply(this,arguments);
    if(state.currentTable==='PROGETTI')decorateProjectRows(dataArray);
    return result;
  };
  window.openDynamicModal=function(){
    const result=originalModal.apply(this,arguments);
    if(state.currentTable==='PROGETTI')setTimeout(()=>enhanceProjectModal().catch(error=>console.warn('[KYV editor project fields] modal',error)),0);
    return result;
  };
  state.wrapped=true;
  return true;
}

function bindRows(){
  const tbody=document.getElementById('editor-tbody');
  if(!tbody||tbody.dataset.kyvProjectRowOpen==='1')return false;
  tbody.dataset.kyvProjectRowOpen='1';
  tbody.addEventListener('click',event=>{
    if(state.currentTable!=='PROGETTI'||isInteractiveTarget(event.target))return;
    const tr=event.target.closest('tr[data-kyv-project-row-id]');
    if(tr)openRow(tr);
  });
  tbody.addEventListener('keydown',event=>{
    if(state.currentTable!=='PROGETTI'||(event.key!=='Enter'&&event.key!==' '))return;
    if(isInteractiveTarget(event.target))return;
    const tr=event.target.closest('tr[data-kyv-project-row-id]');
    if(tr){event.preventDefault();openRow(tr);}
  });
  return true;
}

function boot(){
  ensureStyle();
  loadValues().catch(()=>{});
  let passes=0;
  const apply=()=>{wrapFunctions();bindRows();passes++;return state.wrapped&&document.getElementById('editor-tbody');};
  if(apply())return;
  const timer=setInterval(()=>{if(apply()||passes>=30)clearInterval(timer);},150);
  setTimeout(()=>clearInterval(timer),5000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
