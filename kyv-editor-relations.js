/* KYV Studio Editor Relations — selettori reali Progetto <-> Fattura.
   Riusa le tabelle esistenti, nessuna modifica schema. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='editor.html')return;

const PK={
  PROGETTI:'ID',
  FATTURE:'ID_FT'
};
const state={
  client:null,
  currentTable:'PROGETTI',
  projects:null,
  invoices:null,
  projectsPromise:null,
  invoicesPromise:null,
  renderToken:0,
  wrapped:false
};

function safe(value){
  if(window.KYV?.safeHtml)return KYV.safeHtml(value??'');
  return String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[char]));
}

function showToast(message,type='success'){
  if(window.KYV_TOAST?.show)return KYV_TOAST.show(message,type);
  if(window.KYV?.showToast)return KYV.showToast(message,type);
}

function ensureStyle(){
  if(document.getElementById('kyv-editor-relations-style'))return;
  const style=document.createElement('style');
  style.id='kyv-editor-relations-style';
  style.textContent=`
.kyv-inline-relation{display:flex;align-items:center;gap:.35rem;min-width:210px}
.kyv-inline-relation-select{min-width:170px;max-width:300px;background:#0f111a;border:1px solid #343b50;color:#eef2ff;border-radius:.55rem;padding:.38rem .55rem;font-size:.68rem;outline:none}
.kyv-inline-relation-select:focus{border-color:#818cf8;box-shadow:0 0 0 2px rgba(99,102,241,.18)}
.kyv-inline-relation-open{flex:0 0 auto;width:28px;height:28px;border:1px solid #343b50;border-radius:.5rem;color:#a5b4fc;background:#151923;font-weight:900;line-height:1;display:inline-flex;align-items:center;justify-content:center}
.kyv-inline-relation-open:hover{border-color:#6366f1;color:#fff;background:rgba(99,102,241,.18)}
#dynamic-form-fields select.kyv-editor-relation-select{appearance:auto;min-height:38px}
`;
  document.head.appendChild(style);
}

function client(){
  if(state.client)return state.client;
  if(!window.KYV?.createSupabaseClient)throw new Error('Client dati non disponibile');
  state.client=KYV.createSupabaseClient();
  return state.client;
}

async function loadProjects(force=false){
  if(state.projects&&!force)return state.projects;
  if(state.projectsPromise&&!force)return state.projectsPromise;
  state.projectsPromise=client().from('PROGETTI')
    .select('ID,TITOLO,ARTISTA')
    .order('ID',{ascending:false})
    .limit(1500)
    .then(({data,error})=>{
      if(error)throw error;
      state.projects=data||[];
      state.projectsPromise=null;
      return state.projects;
    }).catch(error=>{
      state.projectsPromise=null;
      throw error;
    });
  return state.projectsPromise;
}

async function loadInvoices(force=false){
  if(state.invoices&&!force)return state.invoices;
  if(state.invoicesPromise&&!force)return state.invoicesPromise;
  state.invoicesPromise=client().from('FATTURE')
    .select('ID_FT,Numero,Denominazione,Data')
    .order('ID_FT',{ascending:false})
    .limit(1500)
    .then(({data,error})=>{
      if(error)throw error;
      state.invoices=data||[];
      state.invoicesPromise=null;
      return state.invoices;
    }).catch(error=>{
      state.invoicesPromise=null;
      throw error;
    });
  return state.invoicesPromise;
}

/* Colonne davvero mostrate: la tabella può nasconderne alcune («Colonne 33/40»), quindi la posizione
   nella riga di dati NON coincide con la posizione della cella. Si legge l'intestazione, non l'indice dei dati. */
function shownKeys(dataArray){
  const head=document.getElementById('editor-thead');
  const fromHead=head?Array.from(head.querySelectorAll('th[data-sort]')).map(th=>th.dataset.sort):[];
  return fromHead.length?fromHead:Object.keys((dataArray&&dataArray[0])||{});
}
function relationColumnsFor(keys){
  return keys.map((key,index)=>({key,index,spec:relationSpec(key)})).filter(entry=>entry.spec);
}

function relationSpec(key){
  if(key==='ID_PROGETTO'||key==='Progetto_Collegato')return {
    kind:'project',
    targetTable:'PROGETTI',
    blank:'Nessun progetto collegato',
    load:loadProjects,
    value:item=>item.ID,
    label:item=>{
      const identity=[item.ARTISTA,item.TITOLO].filter(Boolean).join(' — ');
      return `#${item.ID}${identity?` · ${identity}`:''}`;
    }
  };
  if(String(key).toUpperCase()==='IDFT'||String(key).toUpperCase()==='ID_FT')return {
    kind:'invoice',
    targetTable:'FATTURE',
    blank:'Nessuna fattura collegata',
    load:loadInvoices,
    value:item=>item.ID_FT,
    label:item=>{
      const pieces=[];
      if(item.Numero)pieces.push(`N° ${item.Numero}`);
      if(item.Denominazione)pieces.push(item.Denominazione);
      if(item.Data)pieces.push(String(item.Data).slice(0,10));
      return `#${item.ID_FT}${pieces.length?` · ${pieces.join(' — ')}`:''}`;
    }
  };
  return null;
}

function normalizedRelationValue(table,key,raw){
  if(raw===null||raw===undefined||String(raw).trim()==='')return null;
  const value=String(raw).trim();
  const type=window.KYV_DB?.getType?.(table,key)||'';
  if(window.KYV_DB?.isNumericType?.(type)&&window.KYV?.toDbNumber)return KYV.toDbNumber(value);
  if(/^\d+$/.test(value))return Number(value);
  return value;
}

function sameValue(a,b){
  const left=a===null||a===undefined||a===''?'':String(a);
  const right=b===null||b===undefined||b===''?'':String(b);
  return left===right;
}

async function saveInlineRelation({table,field,rowId,oldValue,newRaw,select}){
  const pk=PK[table]||window.KYV_DB?.PRIMARY_KEYS?.[table]||'id';
  const nextValue=normalizedRelationValue(table,field,newRaw);
  if(sameValue(oldValue,nextValue))return;

  const label=field==='IDFT'||field==='ID_FT'?'fattura':'progetto';
  const ok=window.confirm(`Vuoi cambiare il ${label} collegato a questo record?`);
  if(!ok){select.value=oldValue??'';return;}

  select.disabled=true;
  try{
    let query=client().from(table).update({[field]:nextValue}).eq(pk,rowId);
    query=(oldValue===null||oldValue===undefined||oldValue==='')
      ?query.is(field,null)
      :query.eq(field,oldValue);
    const {data,error}=await query.select(pk).maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Il record è cambiato nel frattempo. Ricarica la tabella prima di riprovare.');
    showToast('Relazione aggiornata.','success');
    if(typeof window.loadEditorTable==='function')await window.loadEditorTable(table);
  }catch(error){
    console.error('[KYV editor relations]',error);
    select.value=oldValue??'';
    showToast(error.message||'Relazione non aggiornata.','error');
  }finally{
    select.disabled=false;
  }
}

function fillSelect(select,spec,items,currentValue){
  const options=[];
  options.push(`<option value="">${safe(spec.blank)}</option>`);
  const present=items.some(item=>sameValue(spec.value(item),currentValue));
  if(currentValue!==null&&currentValue!==undefined&&currentValue!==''&&!present){
    options.push(`<option value="${safe(currentValue)}" selected>Collegamento esistente #${safe(currentValue)}</option>`);
  }
  for(const item of items){
    const value=spec.value(item);
    const selected=sameValue(value,currentValue)?' selected':'';
    options.push(`<option value="${safe(value)}"${selected}>${safe(spec.label(item))}</option>`);
  }
  select.innerHTML=options.join('');
  select.value=currentValue??'';
}

async function decorateInlineRelations(dataArray,table,token){
  if(!Array.isArray(dataArray)||!dataArray.length)return;
  const relationColumns=relationColumnsFor(shownKeys(dataArray));
  if(!relationColumns.length)return;

  const uniqueLoads=[...new Set(relationColumns.map(entry=>entry.spec.kind))];
  try{
    await Promise.all(uniqueLoads.map(kind=>kind==='project'?loadProjects():loadInvoices()));
  }catch(error){
    console.warn('[KYV editor relations] liste relazione non disponibili',error);
    return;
  }
  if(token!==state.renderToken||table!==state.currentTable)return;

  const tbody=document.getElementById('editor-tbody');
  if(!tbody)return;
  const rows=Array.from(tbody.querySelectorAll(':scope > tr'));
  const pk=PK[table]||window.KYV_DB?.PRIMARY_KEYS?.[table]||'id';

  dataArray.forEach((row,rowIndex)=>{
    const tr=rows[rowIndex];
    if(!tr)return;
    relationColumns.forEach(({key,index,spec})=>{
      const cell=tr.children[index];
      if(!cell)return;
      // Rete di sicurezza: una cella modificabile di un'altra colonna non va mai sostituita.
      if(cell.dataset&&cell.dataset.col&&cell.dataset.col!==key)return;
      const currentValue=row[key];
      const items=spec.kind==='project'?(state.projects||[]):(state.invoices||[]);
      cell.removeAttribute('contenteditable');
      cell.classList.remove('editable-cell','cursor-text');
      cell.classList.add('kyv-relation-cell');
      cell.innerHTML='';

      const wrap=document.createElement('div');
      wrap.className='kyv-inline-relation';
      const select=document.createElement('select');
      select.className='kyv-inline-relation-select';
      select.dataset.kyvSearch='off';
      select.setAttribute('aria-label',key==='IDFT'||key==='ID_FT'?'Fattura collegata':'Progetto collegato');
      fillSelect(select,spec,items,currentValue);
      select.addEventListener('change',()=>saveInlineRelation({
        table,field:key,rowId:row[pk],oldValue:currentValue,newRaw:select.value,select
      }));
      wrap.appendChild(select);

      if(currentValue!==null&&currentValue!==undefined&&currentValue!==''){
        const open=document.createElement('button');
        open.type='button';
        open.className='kyv-inline-relation-open';
        open.dataset.action='open-ref';
        open.dataset.table=spec.targetTable;
        open.dataset.id=String(currentValue);
        open.title='Apri record collegato';
        open.setAttribute('aria-label','Apri record collegato');
        open.textContent='↗';
        wrap.appendChild(open);
      }
      cell.appendChild(wrap);
    });
  });
}

async function enhanceModalRelations(){
  const root=document.getElementById('dynamic-form-fields');
  if(!root)return;
  const inputs=Array.from(root.querySelectorAll('.dyn-input[data-key]'));
  const relationInputs=inputs.filter(input=>relationSpec(input.dataset.key));
  if(!relationInputs.length)return;

  try{
    const needProjects=relationInputs.some(input=>relationSpec(input.dataset.key)?.kind==='project');
    const needInvoices=relationInputs.some(input=>relationSpec(input.dataset.key)?.kind==='invoice');
    await Promise.all([
      needProjects?loadProjects():Promise.resolve(),
      needInvoices?loadInvoices():Promise.resolve()
    ]);
  }catch(error){
    console.warn('[KYV editor relations] impossibile caricare i menu relazione',error);
    return;
  }

  for(const input of relationInputs){
    if(!input.isConnected)continue;
    const key=input.dataset.key;
    const spec=relationSpec(key);
    if(!spec)continue;
    const select=document.createElement('select');
    select.disabled=input.disabled;
    select.className=`kyv-input dyn-input kyv-editor-relation-select${spec.kind==='invoice'?' auto-fill-invoice':''}`;
    select.dataset.key=key;
    select.dataset.kyvSearchable='true';
    select.dataset.kyvSort='alpha';
    const currentValue=input.value;
    const items=spec.kind==='project'?(state.projects||[]):(state.invoices||[]);
    fillSelect(select,spec,items,currentValue);
    input.replaceWith(select);
    if(window.KYV_SELECTS?.refreshSelect)KYV_SELECTS.refreshSelect(select,{forceSnapshot:true});
  }

  root.querySelectorAll('#projects-list,#invoices-list').forEach(node=>node.remove());
}

function wrapFunctions(){
  if(state.wrapped)return true;
  if(typeof window.loadEditorTable!=='function'||typeof window.renderEditorTable!=='function'||typeof window.openDynamicModal!=='function')return false;

  const originalLoad=window.loadEditorTable;
  const originalRender=window.renderEditorTable;
  const originalModal=window.openDynamicModal;

  window.loadEditorTable=async function(tableName){
    state.currentTable=tableName||state.currentTable;
    if(tableName==='PROGETTI')loadInvoices().catch(()=>{});
    if(tableName==='FATTURE')loadProjects().catch(()=>{});
    return originalLoad.apply(this,arguments);
  };
  window.loadEditorTable.__kyvRelationsWrapped=true;

  window.renderEditorTable=function(dataArray){
    const table=state.currentTable;
    const token=++state.renderToken;
    const result=originalRender.apply(this,arguments);
    decorateInlineRelations(dataArray,table,token).catch(error=>console.warn('[KYV editor relations] render',error));
    return result;
  };
  window.renderEditorTable.__kyvRelationsWrapped=true;

  window.openDynamicModal=function(){
    const result=originalModal.apply(this,arguments);
    enhanceModalRelations().catch(error=>console.warn('[KYV editor relations] modal',error));
    return result;
  };
  window.openDynamicModal.__kyvRelationsWrapped=true;

  state.wrapped=true;
  return true;
}

window.KYV_EDITOR_RELATIONS=Object.freeze({relationColumnsFor});

function boot(){
  ensureStyle();
  let passes=0;
  const tryWrap=()=>{
    if(wrapFunctions()){
      loadProjects().catch(()=>{});
      loadInvoices().catch(()=>{});
      return true;
    }
    return false;
  };
  if(tryWrap())return;
  const timer=setInterval(()=>{
    passes+=1;
    if(tryWrap()||passes>=30)clearInterval(timer);
  },150);
  setTimeout(()=>clearInterval(timer),5000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
