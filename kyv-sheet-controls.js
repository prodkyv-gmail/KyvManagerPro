// KYV Sheet Controls — filtri/ordinamento intestazioni + suggerimenti sicuri nelle celle.
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'').toLowerCase();
if(!['progetti.html','editor.html'].includes(page))return;

const H=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=value=>String(value??'').trim();
const collator=new Intl.Collator('it',{numeric:true,sensitivity:'base'});
let activeMenu=null;
let activeEditor=null;

const editorColumnFilters=new Map();
const projectColumnFilters=new Map();
const projectSort={index:3,direction:'desc'};

const recurringFields=new Set([
  'ARTISTA','STATO','SVILUPPO','Label','MANAGEMENT','AUTORI','Produttore_Fonografico','Ruolo_IMAIE_Kyv',
  'Denominazione','TIPO FT','Tipo_Documento','Tipo_File','Canale','Contesto','Tipo_Destinatario','Categoria','Tipologia'
]);
const relationTargets={
  ID_PROGETTO:{table:'PROGETTI',pk:'ID',select:'ID,TITOLO,ARTISTA',label:row=>[row.ARTISTA,row.TITOLO].filter(Boolean).join(' · ')||`Progetto #${row.ID}`},
  Progetto_Collegato:{table:'PROGETTI',pk:'ID',select:'ID,TITOLO,ARTISTA',label:row=>[row.ARTISTA,row.TITOLO].filter(Boolean).join(' · ')||`Progetto #${row.ID}`},
  IDFT:{table:'FATTURE',pk:'ID_FT',select:'ID_FT,Numero,Denominazione',label:row=>[row.Numero,row.Denominazione].filter(Boolean).join(' · ')||`Fattura #${row.ID_FT}`}
};

function injectStyle(){
  if(document.getElementById('kyv-sheet-controls-style'))return;
  const style=document.createElement('style');
  style.id='kyv-sheet-controls-style';
  style.textContent=`
    th.kyv-sheet-head{position:relative!important;padding-right:34px!important;user-select:none}
    .kyv-sheet-filter-trigger{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:22px;height:22px;border:1px solid rgba(148,163,184,.18);border-radius:6px;background:rgba(15,17,26,.58);color:#94a3b8;display:inline-flex;align-items:center;justify-content:center;font-size:10px;cursor:pointer;z-index:2}
    .kyv-sheet-filter-trigger:hover,.kyv-sheet-filter-trigger.active{color:#fff;border-color:rgba(129,140,248,.6);background:rgba(99,102,241,.16)}
    .kyv-sheet-sortable{cursor:pointer}.kyv-sheet-sortable[data-kyv-sort-dir="asc"] .kyv-sheet-label::after{content:' ▲';color:#93c5fd}.kyv-sheet-sortable[data-kyv-sort-dir="desc"] .kyv-sheet-label::after{content:' ▼';color:#93c5fd}
    .kyv-sheet-menu{position:fixed;z-index:100000;width:290px;max-width:calc(100vw - 16px);background:#151923;border:1px solid #303748;border-radius:12px;box-shadow:0 26px 80px rgba(0,0,0,.56);padding:10px;color:#fff;font:12px Inter,system-ui,sans-serif;text-transform:none;letter-spacing:0}
    .kyv-sheet-menu-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 2px 8px}.kyv-sheet-menu-head strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kyv-sheet-menu-head button{border:0!important;background:transparent!important;color:#94a3b8!important;font-size:20px!important;padding:0 4px!important}
    .kyv-sheet-sort-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}.kyv-sheet-menu button{border:1px solid #303748;background:#11151f;color:#e5e7eb;border-radius:8px;padding:7px 8px;cursor:pointer;font-weight:800}.kyv-sheet-menu button:hover{background:#202536}
    .kyv-sheet-menu-search{width:100%;margin-top:8px;background:#0f111a;border:1px solid #303748;color:#fff;border-radius:8px;padding:8px;outline:none}.kyv-sheet-menu-search:focus{border-color:#6366f1}
    .kyv-sheet-values{max-height:210px;overflow:auto;margin:8px 0;border:1px solid #252b3a;border-radius:8px;padding:5px}.kyv-sheet-values label{display:block;padding:5px 6px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.kyv-sheet-values label:hover{background:rgba(99,102,241,.08)}
    .kyv-sheet-menu-foot{display:flex;justify-content:space-between;gap:8px}.kyv-sheet-menu-foot button:last-child{border-color:rgba(99,102,241,.45);background:rgba(99,102,241,.12)}
    .kyv-ref-edit-button{margin-left:5px;border:1px solid rgba(129,140,248,.28);background:rgba(99,102,241,.10);color:#c7d2fe;border-radius:6px;padding:2px 5px;font-size:9px;font-weight:900;cursor:pointer;vertical-align:middle}.kyv-ref-edit-button:hover{background:rgba(99,102,241,.2);color:#fff}
    .kyv-cell-editor{position:fixed;z-index:100001;width:min(390px,calc(100vw - 20px));background:#151923;border:1px solid #303748;border-radius:12px;box-shadow:0 24px 70px rgba(0,0,0,.55);padding:10px}.kyv-cell-editor label{display:block;color:#cbd5e1;font-size:11px;font-weight:900;margin-bottom:6px}.kyv-cell-editor input{width:100%;background:#0f111a;border:1px solid #394154;color:#fff;border-radius:8px;padding:9px;outline:none}.kyv-cell-editor input:focus{border-color:#6366f1}.kyv-cell-editor small{display:block;color:#94a3b8;margin-top:6px;line-height:1.35}.kyv-cell-editor-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:10px}.kyv-cell-editor-actions button{border:1px solid #303748;background:#11151f;color:#e5e7eb;border-radius:8px;padding:7px 10px;font-size:11px;font-weight:900;cursor:pointer}.kyv-cell-editor-actions button[data-save]{border-color:rgba(99,102,241,.5);background:rgba(99,102,241,.14)}
  `;
  document.head.appendChild(style);
}

function comparable(value){
  const raw=text(value);
  if(!raw)return{empty:true,type:'text',value:''};
  const normalizedNumber=Number(raw.replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));
  if(Number.isFinite(normalizedNumber)&&/[0-9]/.test(raw)&&!/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(raw))return{empty:false,type:'number',value:normalizedNumber};
  const date=Date.parse(raw);
  if(!Number.isNaN(date)&&(/\d{4}-\d{1,2}-\d{1,2}/.test(raw)||/^\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}$/.test(raw)))return{empty:false,type:'date',value:date};
  return{empty:false,type:'text',value:raw.toLocaleLowerCase('it')};
}
function compareValues(a,b){
  if(a.empty!==b.empty)return a.empty?1:-1;
  if(a.type===b.type&&(a.type==='number'||a.type==='date'))return a.value-b.value;
  return collator.compare(String(a.value),String(b.value));
}
function cellText(row,index){return text(row?.children?.[index]?.textContent).replace(/\s*✎\s*$/,'').trim();}
function tableValues(table,index){return [...(table.tBodies?.[0]?.rows||[])].map(row=>cellText(row,index));}
function closeHeaderMenu(){activeMenu?.remove();activeMenu=null;}
function closeCellEditor(){activeEditor?.remove();activeEditor=null;}

function positionPopup(node,anchor,width=290){
  const r=anchor.getBoundingClientRect();
  const left=Math.max(8,Math.min(innerWidth-width-8,r.left));
  const estimatedHeight=350;
  const top=(r.bottom+6+estimatedHeight<=innerHeight)?r.bottom+6:Math.max(8,r.top-estimatedHeight-6);
  node.style.left=`${left}px`;node.style.top=`${top}px`;
}

function openHeaderMenu({table,th,index,key,filters,onSort,onFilter}){
  closeHeaderMenu();closeCellEditor();
  const values=tableValues(table,index),unique=[...new Set(values)].filter(Boolean).sort(collator.compare);
  const selected=new Set(filters.get(key)||[]);
  const menu=document.createElement('div');menu.className='kyv-sheet-menu';
  menu.innerHTML=`<div class="kyv-sheet-menu-head"><strong>${H(th.dataset.kyvSheetLabel||th.textContent.trim())}</strong><button type="button" data-close aria-label="Chiudi">×</button></div><div class="kyv-sheet-sort-actions"><button type="button" data-sort="asc">↑ Crescente</button><button type="button" data-sort="desc">↓ Decrescente</button></div><input class="kyv-sheet-menu-search" type="search" placeholder="Cerca valori…"><div class="kyv-sheet-values"><label><input type="checkbox" value="__EMPTY__" ${selected.has('__EMPTY__')?'checked':''}> (vuoti)</label>${unique.map(v=>`<label><input type="checkbox" value="${H(v)}" ${selected.has(v)?'checked':''}> ${H(v)}</label>`).join('')}</div><div class="kyv-sheet-menu-foot"><button type="button" data-clear>Rimuovi filtro</button><button type="button" data-apply>Applica filtro</button></div>`;
  document.body.appendChild(menu);activeMenu=menu;positionPopup(menu,th);
  menu.querySelector('[data-close]').addEventListener('click',closeHeaderMenu);
  menu.querySelectorAll('[data-sort]').forEach(btn=>btn.addEventListener('click',()=>{onSort(btn.dataset.sort);closeHeaderMenu();}));
  menu.querySelector('[data-clear]').addEventListener('click',()=>{filters.delete(key);onFilter();closeHeaderMenu();});
  menu.querySelector('[data-apply]').addEventListener('click',()=>{const chosen=[...menu.querySelectorAll('.kyv-sheet-values input:checked')].map(i=>i.value);if(chosen.length)filters.set(key,chosen);else filters.delete(key);onFilter();closeHeaderMenu();});
  const search=menu.querySelector('.kyv-sheet-menu-search');
  search.addEventListener('input',()=>{const q=search.value.toLocaleLowerCase('it');menu.querySelectorAll('.kyv-sheet-values label').forEach(label=>{label.hidden=!label.textContent.toLocaleLowerCase('it').includes(q);});});
  search.focus();
}

function rowPassesFilters(row,headers,filters){
  for(const [key,selected] of filters){
    const index=headers.findIndex(th=>(th.dataset.kyvSheetKey||th.dataset.sort||th.textContent.trim())===key);
    if(index<0)continue;
    const value=cellText(row,index);
    if(!(selected.includes(value)||(!value&&selected.includes('__EMPTY__'))))return false;
  }
  return true;
}
function applyFilters(table,filters){
  const headers=[...(table.tHead?.rows?.[0]?.cells||[])];
  [...(table.tBodies?.[0]?.rows||[])].forEach(row=>{row.hidden=!rowPassesFilters(row,headers,filters);});
}
function sortDomTable(table,index,direction){
  const tbody=table.tBodies?.[0];if(!tbody)return;
  const rows=[...tbody.rows];
  rows.sort((a,b)=>compareValues(comparable(cellText(a,index)),comparable(cellText(b,index)))*(direction==='asc'?1:-1));
  const fragment=document.createDocumentFragment();rows.forEach(row=>fragment.appendChild(row));tbody.appendChild(fragment);
}
function markSort(table,index,direction){
  [...(table.tHead?.rows?.[0]?.cells||[])].forEach((th,i)=>{if(i===index)th.dataset.kyvSortDir=direction;else delete th.dataset.kyvSortDir;});
}

function decorateProjectTable(){
  const table=document.querySelector('.table-wrap table');if(!table)return;
  const headers=[...(table.tHead?.rows?.[0]?.cells||[])];
  headers.forEach((th,index)=>{
    if(index===headers.length-1&&/apri|azioni/i.test(th.textContent))return;
    const key=th.dataset.kyvSheetKey||`col-${index}`;th.dataset.kyvSheetKey=key;th.dataset.kyvSheetLabel=text(th.textContent);th.classList.add('kyv-sheet-head','kyv-sheet-sortable');
    if(!th.querySelector('.kyv-sheet-label')){
      const nodes=[...th.childNodes].filter(n=>!(n.nodeType===1&&n.classList?.contains('kyv-sheet-filter-trigger')));
      const label=document.createElement('span');label.className='kyv-sheet-label';label.textContent=nodes.map(n=>n.textContent).join('').trim();nodes.forEach(n=>n.remove());th.prepend(label);
    }
    if(!th.querySelector('.kyv-sheet-filter-trigger')){
      const trigger=document.createElement('button');trigger.type='button';trigger.className='kyv-sheet-filter-trigger';trigger.textContent='▾';trigger.title='Ordina o filtra questa colonna';
      trigger.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openHeaderMenu({table,th,index,key,filters:projectColumnFilters,onSort:direction=>{projectSort.index=index;projectSort.direction=direction;sortDomTable(table,index,direction);markSort(table,index,direction);applyFilters(table,projectColumnFilters);},onFilter:()=>{applyFilters(table,projectColumnFilters);decorateProjectTable();}});});
      th.appendChild(trigger);
    }
    if(th.dataset.kyvSheetSortBound!=='1'){
      th.dataset.kyvSheetSortBound='1';th.addEventListener('click',event=>{if(event.target.closest('.kyv-sheet-filter-trigger,.kyv-col-resizer,button,a,input,select'))return;const next=th.dataset.kyvSortDir==='asc'?'desc':'asc';projectSort.index=index;projectSort.direction=next;sortDomTable(table,index,next);markSort(table,index,next);applyFilters(table,projectColumnFilters);});
    }
    th.querySelector('.kyv-sheet-filter-trigger')?.classList.toggle('active',projectColumnFilters.has(key));
  });
}
function reapplyProjectState(){
  const table=document.querySelector('.table-wrap table');if(!table)return;decorateProjectTable();
  if(projectSort.index<(table.tHead?.rows?.[0]?.cells?.length||0)){sortDomTable(table,projectSort.index,projectSort.direction);markSort(table,projectSort.index,projectSort.direction);}
  applyFilters(table,projectColumnFilters);
}
function setupProjects(){
  decorateProjectTable();
  document.getElementById('uscite-search')?.addEventListener('input',()=>setTimeout(reapplyProjectState,0));
  document.getElementById('filters')?.addEventListener('click',()=>setTimeout(reapplyProjectState,0));
  document.getElementById('reload')?.addEventListener('click',()=>{setTimeout(reapplyProjectState,250);setTimeout(reapplyProjectState,900);});
  [100,500,1400].forEach(delay=>setTimeout(reapplyProjectState,delay));
}

function activeEditorTable(){return document.querySelector('#editor-tabs [data-action="load-table"].bg-indigo-600')?.dataset.table||'PROGETTI';}
function editorPk(table){return window.KYV_DB?.PRIMARY_KEYS?.[table]||({PROGETTI:'ID',CLIENTI:'ID_CLIENTE',FATTURE:'ID_FT','Spese Extra':'ID_SPESE',INVII_AUDIO:'ID_INVIO',DOCUMENTI_PROGETTO:'ID_DOCUMENTO',DROPBOX_AUDIO_FILES:'ID_FILE',AUDIO_VERSIONI:'ID_VERSIONE'}[table]||'id');}
function db(){return window.KYV?.createSupabaseClient?.()||null;}
async function relationOptions(column){
  const cfg=relationTargets[column];if(!cfg||!db())return[];
  const {data,error}=await db().from(cfg.table).select(cfg.select).order(cfg.pk,{ascending:false}).limit(1000);
  if(error)throw error;
  return(data||[]).map(row=>({value:String(row[cfg.pk]),label:cfg.label(row)}));
}
async function recurringOptions(table,column){
  if(window.KYV_FIELD_MEMORY?.fetchColumnValues)return(await KYV_FIELD_MEMORY.fetchColumnValues(table,column)).map(value=>({value:String(value),label:String(value)}));
  if(!db())return[];
  const {data,error}=await db().from(table).select('*').limit(1000);if(error)throw error;
  return[...new Set((data||[]).map(row=>text(row[column])).filter(Boolean))].sort(collator.compare).map(value=>({value,label:value}));
}
async function safePatch({table,pk,rowId,column,original,next}){
  const client=db();if(!client)throw new Error('Database non disponibile.');
  const {data:current,error:readError}=await client.from(table).select('*').eq(pk,rowId).maybeSingle();
  if(readError)throw readError;if(!current)throw new Error('Record non trovato.');
  const live=current[column]===null||current[column]===undefined?'':String(current[column]);
  if(String(live)!==String(original??''))throw new Error('Il campo è cambiato da un’altra operazione. Ricarico la tabella senza sovrascrivere il dato.');
  let query=client.from(table).update({[column]:next}).eq(pk,rowId);
  query=(current[column]===null||current[column]===undefined)?query.is(column,null):query.eq(column,current[column]);
  const {data,error}=await query.select(pk).maybeSingle();if(error)throw error;if(!data)throw new Error('Conflitto di aggiornamento: nessun dato è stato sovrascritto.');
}
function editorRowId(td){return td.closest('tr')?.querySelector('[data-action="edit-record"]')?.dataset.id||td.dataset.id||'';}
function editorColumn(td){
  if(td.dataset.col)return td.dataset.col;
  const row=td.closest('tr'),table=td.closest('table');if(!row||!table)return'';
  const index=[...row.cells].indexOf(td);return table.tHead?.rows?.[0]?.cells?.[index]?.dataset.sort||'';
}
function displayedOriginal(td,column){if(td.dataset.original!==undefined)return td.dataset.original;if(relationTargets[column])return td.dataset.id||'';return text(td.textContent).replace(/\s*✎\s*$/,'').trim();}
function reloadEditorTable(){const active=document.querySelector('#editor-tabs [data-action="load-table"].bg-indigo-600');if(active)setTimeout(()=>active.click(),20);}
function toast(message,type='success'){if(window.KYV_TOAST)KYV_TOAST.show(message,type);else window.KYV?.showToast?.(message,type);}

async function openSmartCellEditor(td,column){
  if(activeEditor)return;
  const table=activeEditorTable(),pk=editorPk(table),rowId=editorRowId(td);if(!table||!pk||!rowId||!column)return;
  const isRelation=Boolean(relationTargets[column]),isRecurring=recurringFields.has(column);if(!isRelation&&!isRecurring)return;
  const original=displayedOriginal(td,column);
  let options=[];
  try{options=isRelation?await relationOptions(column):await recurringOptions(table,column);}catch(error){console.warn('[KYV Sheet Controls] suggerimenti non disponibili',error);}
  const editor=document.createElement('div');editor.className='kyv-cell-editor';
  const listId=`kyv-cell-list-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  editor.innerHTML=`<label>${H(column)}</label><input type="text" value="${H(original)}" ${options.length?`list="${listId}"`:''} autocomplete="off"><small>${isRelation?'Scegli un record esistente: gli ID non validi non vengono salvati.':'Puoi scegliere un valore già usato oppure scriverne uno nuovo.'}</small>${options.length?`<datalist id="${listId}">${options.map(option=>`<option value="${H(option.value)}">${H(option.label)}</option>`).join('')}</datalist>`:''}<div class="kyv-cell-editor-actions"><button type="button" data-cancel>Annulla</button><button type="button" data-save>Salva</button></div>`;
  document.body.appendChild(editor);activeEditor=editor;positionPopup(editor,td,390);
  const input=editor.querySelector('input');input.focus();input.select();
  const cancel=()=>closeCellEditor();editor.querySelector('[data-cancel]').addEventListener('click',cancel);
  editor.querySelector('[data-save]').addEventListener('click',async()=>{
    let raw=text(input.value),next=raw||null;
    if(isRelation&&raw){const found=options.find(option=>option.value===raw);if(!found){toast('Seleziona un riferimento esistente dall’elenco.','warning');input.focus();return;}if(/^\d+$/.test(raw))next=Number(raw);}
    const saveButton=editor.querySelector('[data-save]');saveButton.disabled=true;saveButton.textContent='Salvataggio…';
    try{
      await safePatch({table,pk,rowId,column,original,next});
      if(isRecurring&&window.KYV_FIELD_MEMORY?.clearCache)window.KYV_FIELD_MEMORY.clearCache();
      closeCellEditor();toast('Campo aggiornato.','success');reloadEditorTable();
    }catch(error){console.warn('[KYV Sheet Controls] salvataggio fermato',error);toast(error.message||'Aggiornamento non riuscito.','error');closeCellEditor();reloadEditorTable();}
  });
  input.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();cancel();}if(event.key==='Enter'){event.preventDefault();editor.querySelector('[data-save]').click();}});
}

function decorateEditorTable(){
  const table=document.getElementById('editor-table-element');if(!table)return;
  const headers=[...(table.tHead?.rows?.[0]?.cells||[])];
  headers.forEach((th,index)=>{
    const key=th.dataset.sort;if(!key)return;
    th.classList.add('kyv-sheet-head');th.dataset.kyvSheetKey=key;th.dataset.kyvSheetLabel=key;
    if(!th.querySelector('.kyv-sheet-filter-trigger')){
      const trigger=document.createElement('button');trigger.type='button';trigger.className='kyv-sheet-filter-trigger';trigger.textContent='▾';trigger.title='Filtra questa colonna';
      trigger.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openHeaderMenu({table,th,index,key,filters:editorColumnFilters,onSort:direction=>{const current=th.dataset.kyvSort==='asc'?'asc':th.dataset.kyvSort==='desc'?'desc':'';if(typeof window.KYV_TABLE_TOOLS?.sortTableByColumn==='function'){if(current===direction){}KYV_TABLE_TOOLS.sortTableByColumn(table,index,th);}else sortDomTable(table,index,direction);markSort(table,index,direction);applyFilters(table,editorColumnFilters);},onFilter:()=>{applyFilters(table,editorColumnFilters);decorateEditorTable();}});});
      th.appendChild(trigger);
    }
    th.querySelector('.kyv-sheet-filter-trigger')?.classList.toggle('active',editorColumnFilters.has(key));
  });
  [...(table.tBodies?.[0]?.rows||[])].forEach(row=>{
    [...row.cells].forEach(td=>{
      const column=editorColumn(td);if(!relationTargets[column]||td.querySelector('.kyv-ref-edit-button'))return;
      const rowId=editorRowId(td);if(!rowId)return;
      const button=document.createElement('button');button.type='button';button.className='kyv-ref-edit-button';button.dataset.action='kyv-smart-ref-edit';button.textContent='✎';button.title='Cambia riferimento in sicurezza';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openSmartCellEditor(td,column);});td.appendChild(button);
    });
  });
  applyFilters(table,editorColumnFilters);
}
function setupEditor(){
  const table=document.getElementById('editor-table-element');if(!table)return;
  table.addEventListener('dblclick',event=>{const td=event.target.closest('td.editable-cell');if(!td)return;const column=editorColumn(td);if(!recurringFields.has(column)&&!relationTargets[column])return;event.preventDefault();event.stopPropagation();openSmartCellEditor(td,column);});
  let scheduled=false;
  const observer=new MutationObserver(mutations=>{
    if(!mutations.some(m=>m.addedNodes?.length||m.removedNodes?.length))return;
    if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;decorateEditorTable();},60);
  });
  observer.observe(table,{childList:true,subtree:true});
  document.getElementById('editor-tabs')?.addEventListener('click',()=>{editorColumnFilters.clear();setTimeout(decorateEditorTable,120);});
  decorateEditorTable();
  window.addEventListener('beforeunload',()=>observer.disconnect(),{once:true});
}

function boot(){injectStyle();if(page==='progetti.html')setupProjects();else setupEditor();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
