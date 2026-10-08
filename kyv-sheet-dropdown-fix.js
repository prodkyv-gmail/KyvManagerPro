// KYV Studio Editor dropdown fix — menu visibile e ricercabile, indipendente dal datalist nativo.
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='editor.html')return;

const text=value=>String(value??'').trim();
const H=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const collator=new Intl.Collator('it',{numeric:true,sensitivity:'base'});
let activeEditor=null;

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
  if(document.getElementById('kyv-sheet-dropdown-fix-style'))return;
  const style=document.createElement('style');
  style.id='kyv-sheet-dropdown-fix-style';
  style.textContent=`
    .kyv-cell-combo-wrap{display:grid;grid-template-columns:minmax(0,1fr) 30px;gap:4px;align-items:stretch}
    .kyv-cell-combo-toggle{border:1px solid #394154;background:#11151f;color:#cbd5e1;border-radius:8px;cursor:pointer;font-weight:900}
    .kyv-cell-combo-toggle:hover,.kyv-cell-combo-toggle[aria-expanded="true"]{background:rgba(99,102,241,.16);border-color:#6366f1;color:#fff}
    .kyv-cell-choice-list{margin-top:6px;max-height:220px;overflow:auto;border:1px solid #303748;border-radius:8px;background:#0f111a;padding:4px}
    .kyv-cell-choice-list[hidden]{display:none!important}
    .kyv-cell-choice{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;border:0;background:transparent;color:#e5e7eb;border-radius:6px;padding:6px 7px;cursor:pointer;font:inherit}
    .kyv-cell-choice:hover,.kyv-cell-choice:focus{background:rgba(99,102,241,.14);outline:none}
    .kyv-cell-choice-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .kyv-cell-choice-ref{color:#818cf8;font-size:.88em;font-weight:900;white-space:nowrap}
    .kyv-cell-choice-empty{padding:8px;color:#94a3b8;text-align:center;font-size:.92em}
    .kyv-cell-choice-more{padding:5px 7px;color:#64748b;font-size:.85em;border-top:1px solid #252b3a;margin-top:3px}
  `;
  document.head.appendChild(style);
}
function db(){return window.KYV?.createSupabaseClient?.()||null;}
function activeEditorTable(){return document.querySelector('#editor-tabs [data-action="load-table"].bg-indigo-600')?.dataset.table||'PROGETTI';}
function editorPk(table){return window.KYV_DB?.PRIMARY_KEYS?.[table]||({PROGETTI:'ID',CLIENTI:'ID_CLIENTE',FATTURE:'ID_FT','Spese Extra':'ID_SPESE',INVII_AUDIO:'ID_INVIO',DOCUMENTI_PROGETTO:'ID_DOCUMENTO',DROPBOX_AUDIO_FILES:'ID_FILE',AUDIO_VERSIONI:'ID_VERSIONE'}[table]||'id');}
function editorRowId(td){return td.closest('tr')?.querySelector('[data-action="edit-record"]')?.dataset.id||td.dataset.id||'';}
function editorColumn(td){
  if(td.dataset.col)return td.dataset.col;
  const row=td.closest('tr'),table=td.closest('table');if(!row||!table)return'';
  const index=[...row.cells].indexOf(td);return table.tHead?.rows?.[0]?.cells?.[index]?.dataset.sort||'';
}
function displayedOriginal(td,column){
  if(td.dataset.original!==undefined)return td.dataset.original;
  if(relationTargets[column])return td.dataset.id||'';
  return text(td.textContent).replace(/\s*✎\s*$/,'').trim();
}
function toast(message,type='success'){if(window.KYV_TOAST)KYV_TOAST.show(message,type);else window.KYV?.showToast?.(message,type);}
function closeEditor(){activeEditor?.remove();activeEditor=null;}
function reloadEditorTable(){const active=document.querySelector('#editor-tabs [data-action="load-table"].bg-indigo-600');if(active)setTimeout(()=>active.click(),20);}
function positionPopup(node,anchor){
  const r=anchor.getBoundingClientRect();
  const width=Math.min(360,Math.max(260,innerWidth-12));
  const left=Math.max(6,Math.min(innerWidth-width-6,r.left));
  const estimatedHeight=Math.min(420,innerHeight*.62);
  const top=(r.bottom+6+estimatedHeight<=innerHeight)?r.bottom+6:Math.max(6,r.top-estimatedHeight-6);
  node.style.left=`${left}px`;node.style.top=`${top}px`;
}
async function relationOptions(column){
  const cfg=relationTargets[column];if(!cfg||!db())return[];
  const {data,error}=await db().from(cfg.table).select(cfg.select).order(cfg.pk,{ascending:false}).limit(1000);
  if(error)throw error;
  return(data||[]).map(row=>({value:String(row[cfg.pk]),label:cfg.label(row)}));
}
async function recurringOptions(table,column){
  if(window.KYV_FIELD_MEMORY?.fetchColumnValues){
    const values=await KYV_FIELD_MEMORY.fetchColumnValues(table,column);
    return values.map(value=>({value:String(value),label:String(value)}));
  }
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
function renderChoices(list,options,query,isRelation,onPick){
  const q=text(query).toLocaleLowerCase('it');
  const filtered=options.filter(option=>`${option.label} ${option.value}`.toLocaleLowerCase('it').includes(q));
  const visible=filtered.slice(0,80);
  if(!visible.length){list.innerHTML='<div class="kyv-cell-choice-empty">Nessun valore trovato</div>';return;}
  list.innerHTML=visible.map((option,index)=>`<button type="button" class="kyv-cell-choice" data-choice-index="${index}"><span class="kyv-cell-choice-label">${H(option.label)}</span>${isRelation?`<span class="kyv-cell-choice-ref">#${H(option.value)}</span>`:''}</button>`).join('')+(filtered.length>visible.length?`<div class="kyv-cell-choice-more">Altri ${filtered.length-visible.length} risultati: scrivi per restringere la ricerca.</div>`:'');
  list.querySelectorAll('[data-choice-index]').forEach(button=>button.addEventListener('click',()=>onPick(visible[Number(button.dataset.choiceIndex)])));
}
async function openCustomEditor(td,column){
  if(activeEditor)return;
  const table=activeEditorTable(),pk=editorPk(table),rowId=editorRowId(td);if(!table||!pk||!rowId||!column)return;
  const isRelation=Boolean(relationTargets[column]),isRecurring=recurringFields.has(column);if(!isRelation&&!isRecurring)return;
  const original=displayedOriginal(td,column);
  let options=[];
  try{options=isRelation?await relationOptions(column):await recurringOptions(table,column);}catch(error){console.warn('[KYV Dropdown Fix] valori non disponibili',error);}

  const currentOption=isRelation?options.find(option=>option.value===String(original)):null;
  let selectedRelationValue=currentOption?.value||null;
  const editor=document.createElement('div');editor.className='kyv-cell-editor kyv-cell-editor-custom';
  editor.innerHTML=`<label>${H(column)}</label><div class="kyv-cell-combo-wrap"><input type="text" value="${H(currentOption?.label??original)}" autocomplete="off" aria-autocomplete="list" aria-expanded="${options.length?'true':'false'}"><button type="button" class="kyv-cell-combo-toggle" data-combo-toggle aria-label="Mostra valori" aria-expanded="${options.length?'true':'false'}">▾</button></div><div class="kyv-cell-choice-list" data-choice-list ${options.length?'':'hidden'}></div><small>${isRelation?'Scegli il record dall’elenco: il collegamento viene salvato usando il suo ID reale.':'Scegli un valore già usato oppure scrivine uno nuovo.'}</small><div class="kyv-cell-editor-actions"><button type="button" data-cancel>Annulla</button><button type="button" data-save>Salva</button></div>`;
  document.body.appendChild(editor);activeEditor=editor;positionPopup(editor,td);
  const input=editor.querySelector('input'),list=editor.querySelector('[data-choice-list]'),toggle=editor.querySelector('[data-combo-toggle]');
  const setExpanded=expanded=>{list.hidden=!expanded;toggle.setAttribute('aria-expanded',String(expanded));input.setAttribute('aria-expanded',String(expanded));};
  const pick=option=>{if(!option)return;if(isRelation){selectedRelationValue=option.value;input.value=option.label;}else input.value=option.value;setExpanded(false);input.focus();};
  const refreshChoices=()=>{renderChoices(list,options,input.value,isRelation,pick);if(options.length)setExpanded(true);};
  renderChoices(list,options,'',isRelation,pick);
  toggle.addEventListener('click',()=>{const open=list.hidden;if(open)renderChoices(list,options,input.value,isRelation,pick);setExpanded(open);if(open)input.focus();});
  input.addEventListener('focus',()=>{if(options.length){renderChoices(list,options,input.value,isRelation,pick);setExpanded(true);}});
  input.addEventListener('input',()=>{if(isRelation)selectedRelationValue=null;refreshChoices();});
  editor.querySelector('[data-cancel]').addEventListener('click',closeEditor);
  editor.querySelector('[data-save]').addEventListener('click',async()=>{
    const raw=text(input.value);let next=raw||null;
    if(isRelation&&raw){
      const found=selectedRelationValue?options.find(option=>option.value===selectedRelationValue):options.find(option=>option.value===raw||option.label===raw);
      if(!found){toast('Seleziona un riferimento esistente dall’elenco.','warning');setExpanded(true);input.focus();return;}
      next=/^\d+$/.test(found.value)?Number(found.value):found.value;
    }
    if(isRelation&&original&&!raw){const confirmed=window.confirm('Rimuovere il collegamento esistente da questo record?');if(!confirmed){input.focus();return;}}
    const saveButton=editor.querySelector('[data-save]');saveButton.disabled=true;saveButton.textContent='Salvataggio…';
    try{
      await safePatch({table,pk,rowId,column,original,next});
      if(isRecurring&&window.KYV_FIELD_MEMORY?.clearCache)window.KYV_FIELD_MEMORY.clearCache();
      closeEditor();toast('Campo aggiornato.','success');reloadEditorTable();
    }catch(error){console.warn('[KYV Dropdown Fix] salvataggio fermato',error);toast(error.message||'Aggiornamento non riuscito.','error');closeEditor();reloadEditorTable();}
  });
  input.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeEditor();}if(event.key==='Enter'){event.preventDefault();editor.querySelector('[data-save]').click();}});
  input.focus();input.select();
}
function relevantCell(target){const td=target.closest?.('#editor-table-element td.editable-cell');if(!td)return null;const column=editorColumn(td);if(!recurringFields.has(column)&&!relationTargets[column])return null;return{td,column};}
function boot(){
  injectStyle();
  document.addEventListener('dblclick',event=>{const match=relevantCell(event.target);if(!match)return;event.preventDefault();event.stopImmediatePropagation();openCustomEditor(match.td,match.column);},true);
  document.addEventListener('click',event=>{const button=event.target.closest?.('.kyv-ref-edit-button');if(!button)return;const td=button.closest('td');if(!td)return;const column=editorColumn(td);if(!relationTargets[column])return;event.preventDefault();event.stopImmediatePropagation();openCustomEditor(td,column);},true);
  document.addEventListener('pointerdown',event=>{if(activeEditor&&!activeEditor.contains(event.target)&&!event.target.closest?.('.kyv-ref-edit-button'))closeEditor();},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
