/* KYV Studio Editor — tabelle operative principali: campi tipizzati, valori ricorrenti e apertura riga.
   Nessuna modifica schema. Riusa il popup e il salvataggio esistenti. */
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='editor.html')return;

const CONFIG={
  CLIENTI:{pk:'ID_CLIENTE', recurrent:['Tipologia'], date:[], email:['Email'], tel:['Telefono'], url:[]},
  DOCUMENTI_PROGETTO:{pk:'ID_DOCUMENTO', recurrent:['Tipo_Documento','Fonte'], date:['Data_Documento'], email:[], tel:[], url:['Link_Drive']},
  INVII_AUDIO:{pk:'ID_INVIO', recurrent:['Destinatario','Tipo_Destinatario','Canale','Conferma_Ricezione','Stato'], date:['Data_Invio','Data_Conferma'], email:[], tel:[], url:['Link_Prova_Drive']},
  CONSEGNE_MASTER:{pk:'ID_CONSEGNA', recurrent:['Progetto','Cliente'], date:['Data_Inserimento'], email:[], tel:[], url:['Link_Dropbox']}
};
const state={currentTable:'PROGETTI',client:null,values:new Map(),wrapped:false};

function client(){
  if(state.client)return state.client;
  if(!window.KYV?.createSupabaseClient)return null;
  state.client=KYV.createSupabaseClient(); return state.client;
}
function norm(v){return String(v??'').trim();}
function uniq(values){const seen=new Set();return values.map(norm).filter(Boolean).filter(v=>{const k=v.toLocaleLowerCase('it');if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>a.localeCompare(b,'it',{numeric:true,sensitivity:'base'}));}
function safe(v){return window.KYV?.safeHtml?KYV.safeHtml(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function ensureStyle(){
  if(document.getElementById('kyv-editor-primary-fields-style'))return;
  const s=document.createElement('style');s.id='kyv-editor-primary-fields-style';s.textContent=`
#editor-tbody tr.kyv-primary-row-edit{cursor:pointer}
#editor-tbody tr.kyv-primary-row-edit:hover{background:rgba(99,102,241,.08)!important}
.kyv-primary-combo-host{position:relative}.kyv-primary-combo-wrap{position:relative}
.kyv-primary-combo-toggle{position:absolute;right:.35rem;top:50%;transform:translateY(-50%);width:28px;height:28px;border:0;border-radius:.45rem;background:transparent;color:#94a3b8;font-weight:900;cursor:pointer}
.kyv-primary-combo-toggle:hover{background:rgba(99,102,241,.14);color:#fff}
.kyv-primary-combo-input{padding-right:2.5rem!important}.kyv-primary-combo-menu{position:absolute;left:0;right:0;top:calc(100% + 5px);z-index:130;max-height:220px;overflow:auto;background:#0d1018;border:1px solid #343b50;border-radius:.7rem;padding:.3rem;box-shadow:0 16px 38px rgba(0,0,0,.48)}
.kyv-primary-combo-menu[hidden]{display:none!important}.kyv-primary-combo-option{width:100%;display:block;text-align:left;border:0;background:transparent;color:#e5e7eb;border-radius:.5rem;padding:.48rem .58rem;font-size:.72rem;cursor:pointer}
.kyv-primary-combo-option:hover{background:rgba(99,102,241,.15);color:#fff}.kyv-primary-combo-note{display:block;margin-top:.3rem;color:#64748b;font-size:.62rem}
@media(max-width:640px){.kyv-primary-combo-option{font-size:11px;min-height:36px}.kyv-primary-combo-input{font-size:16px!important}}
`;document.head.appendChild(s);
}
async function valuesFor(table,fields,force=false){
  const cacheKey=table+'::'+fields.join(',');
  if(state.values.has(cacheKey)&&!force)return state.values.get(cacheKey);
  const db=client();if(!db)return {};
  const {data,error}=await db.from(table).select(fields.join(',')).limit(1000);
  if(error)throw error;
  const map={};fields.forEach(f=>map[f]=uniq((data||[]).map(r=>r[f])));
  state.values.set(cacheKey,map);return map;
}
function enhanceCombo(input,values){
  if(!input||input.dataset.kyvPrimaryCombo==='1')return;
  input.dataset.kyvPrimaryCombo='1';input.removeAttribute('list');input.autocomplete='off';input.classList.add('kyv-primary-combo-input');
  const host=input.parentElement;if(!host)return;host.classList.add('kyv-primary-combo-host');
  const wrap=document.createElement('div');wrap.className='kyv-primary-combo-wrap';input.before(wrap);wrap.appendChild(input);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='kyv-primary-combo-toggle';toggle.textContent='▾';wrap.appendChild(toggle);
  const menu=document.createElement('div');menu.className='kyv-primary-combo-menu';menu.hidden=true;host.appendChild(menu);
  const note=document.createElement('small');note.className='kyv-primary-combo-note';note.textContent=values.length+' valori già usati · scegli o scrivine uno nuovo';host.appendChild(note);
  const draw=(q='')=>{const qq=norm(q).toLocaleLowerCase('it');const rows=values.filter(v=>v.toLocaleLowerCase('it').includes(qq)).slice(0,100);menu.innerHTML=rows.length?rows.map((v,i)=>`<button type="button" class="kyv-primary-combo-option" data-i="${i}">${safe(v)}</button>`).join(''):'<div class="kyv-primary-combo-note" style="padding:.6rem">Nessun valore già presente.</div>';menu.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{input.value=rows[Number(b.dataset.i)]||'';menu.hidden=true;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();});};
  input.addEventListener('focus',()=>{draw('');menu.hidden=false;});input.addEventListener('input',()=>{draw(input.value);menu.hidden=false;});
  toggle.onclick=()=>{const open=menu.hidden;if(open)draw('');menu.hidden=!open;if(open)input.focus({preventScroll:true});};
  document.addEventListener('pointerdown',e=>{if(!host.contains(e.target))menu.hidden=true;},{capture:true});
}
async function enhanceModal(){
  const cfg=CONFIG[state.currentTable];if(!cfg)return;
  const root=document.getElementById('dynamic-form-fields');if(!root)return;
  const vals=await valuesFor(state.currentTable,cfg.recurrent);
  if(!root.isConnected||!CONFIG[state.currentTable])return;
  root.querySelectorAll('.dyn-input[data-key]').forEach(input=>{
    const key=input.dataset.key;
    if(cfg.date.includes(key)&&input.tagName==='INPUT'){
      input.type=key.startsWith('Data_')&&state.currentTable==='INVII_AUDIO'?'datetime-local':'date';
      if(input.type==='datetime-local'&&input.value)input.value=String(input.value).slice(0,16);
      input.title='Scegli data e ora'; return;
    }
    if(cfg.email.includes(key)&&input.tagName==='INPUT'){input.type='email';input.inputMode='email';return;}
    if(cfg.tel.includes(key)&&input.tagName==='INPUT'){input.type='tel';input.inputMode='tel';return;}
    if(cfg.url.includes(key)&&input.tagName==='INPUT'){input.type='url';input.inputMode='url';return;}
    if(cfg.recurrent.includes(key)&&input.tagName==='INPUT')enhanceCombo(input,vals[key]||[]);
  });
}
function decorateRows(data){
  const cfg=CONFIG[state.currentTable];if(!cfg||!Array.isArray(data))return;
  const rows=Array.from(document.querySelectorAll('#editor-tbody > tr'));
  data.forEach((row,i)=>{const tr=rows[i];if(!tr)return;tr.classList.add('kyv-primary-row-edit');tr.dataset.kyvPrimaryRowId=String(row[cfg.pk]??'');tr.tabIndex=0;tr.querySelectorAll('td.editable-cell').forEach(c=>{c.removeAttribute('contenteditable');c.classList.remove('editable-cell','cursor-text');});});
}
function interactive(target){return Boolean(target.closest('button,a,input,select,textarea,[data-action],[contenteditable="true"],.kyv-inline-relation,.kyv-cell-editor,.kyv-sheet-menu'));}
function bindRows(){
  const tbody=document.getElementById('editor-tbody');if(!tbody||tbody.dataset.kyvPrimaryOpen==='1')return false;tbody.dataset.kyvPrimaryOpen='1';
  const open=e=>{const cfg=CONFIG[state.currentTable];if(!cfg||interactive(e.target))return;const tr=e.target.closest('tr[data-kyv-primary-row-id]');if(tr&&typeof window.openDynamicModal==='function')window.openDynamicModal(tr.dataset.kyvPrimaryRowId);};
  tbody.addEventListener('click',open);tbody.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&CONFIG[state.currentTable]&&!interactive(e.target)){e.preventDefault();open(e);}});
  return true;
}
function wrap(){
  if(state.wrapped)return true;
  if(typeof window.loadEditorTable!=='function'||typeof window.renderEditorTable!=='function'||typeof window.openDynamicModal!=='function')return false;
  const load=window.loadEditorTable,render=window.renderEditorTable,modal=window.openDynamicModal;
  window.loadEditorTable=async function(table){state.currentTable=table||state.currentTable;const cfg=CONFIG[state.currentTable];if(cfg)valuesFor(state.currentTable,cfg.recurrent,true).catch(()=>{});return load.apply(this,arguments);};
  window.renderEditorTable=function(data){const r=render.apply(this,arguments);if(CONFIG[state.currentTable])decorateRows(data);return r;};
  window.openDynamicModal=function(){const r=modal.apply(this,arguments);if(CONFIG[state.currentTable])setTimeout(()=>enhanceModal().catch(err=>console.warn('[KYV primary editor]',err)),0);return r;};
  state.wrapped=true;return true;
}
function boot(){ensureStyle();let n=0;const apply=()=>{wrap();bindRows();n++;return state.wrapped&&document.getElementById('editor-tbody');};if(apply())return;const t=setInterval(()=>{if(apply()||n>=30)clearInterval(t);},150);setTimeout(()=>clearInterval(t),5000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();