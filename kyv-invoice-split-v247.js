/* KYV v2.47: one fiscal invoice, many manually approved unit-fee rows. */
(function(root){
'use strict';
const $=id=>document.getElementById(id),t=v=>String(v??'').trim();
const H=v=>t(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parse=v=>{const n=root.KYV_INVOICE_LINE?.parse(v);if(n!==null&&n!==undefined)return n;const raw=t(v);if(!raw)return null;const value=Number(raw.replace(',','.'));return Number.isFinite(value)?value:null;};
const euro=n=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n||0);
let client=null,onSaved=null,projects=[],invoices=[],allocations=[],invoice=null,rows=[],prefill='',draft={},busy=false,token=0;
const row=()=>({projectId:'',amount:'',fee:'',description:''});
const money=v=>Math.round((parse(v)||0)*100)/100;
const amount=f=>money(f?.PrezzoUnitario);
const splits=id=>allocations.filter(x=>t(x.id_ft)===t(id));
const forProject=id=>allocations.filter(x=>t(x.id_progetto)===t(id));
function names(id){const r=splits(id);return r.length?r.map(a=>({id:a.id_progetto,amount:Number(a.prezzo_unitario),title:label(a.id_progetto)})):null;}
function label(id){const p=projects.find(x=>t(x.ID)===t(id));return p?((p.ARTISTA?p.ARTISTA+' · ':'')+(p.TITOLO||'Progetto')):'Progetto #'+id;}
function validate(items,max,available=projects){
 if(!items.length||items.length>100)throw Error('Inserisci da 1 a 100 righe');
 let cents=0;
 const packed=items.map((r,i)=>{
  if(!available.some(p=>t(p.ID)===t(r.projectId)))throw Error('Progetto non valido alla riga '+(i+1));
  const raw=parse(r.amount);if(raw===null||!Number.isFinite(raw)||raw<0||Math.abs(raw*100-Math.round(raw*100))>1e-5)throw Error('PrezzoUnitario non valido alla riga '+(i+1));
  const fee=parse(r.fee);if(r.fee!==''&&(fee===null||fee<0))throw Error('Fee non valida alla riga '+(i+1));
  cents+=Math.round(raw*100);
  return {id_progetto:Number(r.projectId),prezzo_unitario:Math.round(raw*100)/100,fee_riferimento:r.fee===''?null:money(r.fee),descrizione:t(r.description).slice(0,500)};
 });
 if(cents>Math.round(max*100))throw Error('Quote '+euro(cents/100)+' superiori a PrezzoUnitario '+euro(max));
 return {items:packed,remaining:Math.round(max*100-cents)/100};
}
function panel(){
 let el=$('kyv-split-modal');if(el)return el;
 el=document.createElement('div');el.id='kyv-split-modal';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML='<section class="split-shell"><header><div><small>Fatture emesse · v2.47</small><h2>Fattura multi-progetto</h2><p>Un solo documento fiscale, più quote unità/progetto.</p></div><button type="button" data-act="close">Chiudi ×</button></header><div id="split-error" role="alert"></div><div id="split-body"></div><footer><button type="button" data-act="add">+ Aggiungi riga</button><strong id="split-total"></strong><button type="button" data-act="save">Salva fattura e ripartizioni</button></footer></section>';
 document.body.appendChild(el);
 let css=document.createElement('style');
 css.textContent='#kyv-split-modal:not([hidden]){position:fixed;inset:0;z-index:120;background:#000d;display:flex;align-items:center;justify-content:center;padding:12px}.split-shell{width:min(1060px,100%);max-height:94vh;overflow:hidden;display:flex;flex-direction:column;color:#f8fafc;background:#161b28;border:1px solid #64748b;border-radius:14px}.split-shell header,.split-shell footer{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:14px;background:#10131b}.split-shell h2{font-size:20px;font-weight:850}.split-shell p,.split-shell small{color:#cbd5e1}.split-shell button{padding:9px 12px;background:#3730a3;color:white;border-radius:8px;border:1px solid #818cf8;font-weight:750}.split-shell button:disabled{opacity:.45}.split-shell input,.split-shell select{display:block;width:100%;min-width:0;background:#0f172a;color:white;padding:9px;border:1px solid #64748b;border-radius:7px}.split-shell label{font-size:12px;color:#cbd5e1;font-weight:700}.split-shell label>*{margin-top:5px}#split-body{padding:14px;overflow:auto}.split-doc{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}.split-row{display:grid;grid-template-columns:minmax(170px,2fr) minmax(105px,1fr) minmax(100px,1fr) minmax(130px,1.5fr) auto;gap:8px;align-items:end;padding:10px;margin:8px 0;border:1px solid #475569;border-radius:10px;background:#1e293b}.split-actions{display:flex;flex-direction:column;gap:4px}.split-actions button{font-size:11px;padding:6px}.split-error:not(:empty){background:#7f1d1d;color:#fecaca;padding:12px}#split-total{font-size:12px;color:#dbeafe}@media(max-width:810px){.split-doc{grid-template-columns:1fr 1fr}.split-row{grid-template-columns:1fr 1fr}.split-actions{grid-column:1/-1;flex-direction:row}}@media(max-width:480px){.split-doc{grid-template-columns:1fr}}';
 document.head.appendChild(css);
 el.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-act]');if(!b||busy)return;const act=b.dataset.act,i=Number(b.dataset.i);
  if(act==='close')close();if(act==='add'){rows.push(row());render();}
  if(act==='duplicate'&&rows[i]){rows.splice(i+1,0,{...row(),description:rows[i].description});render();}
  if(act==='remove'&&rows.length>1){rows.splice(i,1);render();}
  if(act==='fee'){const p=projects.find(x=>t(x.ID)===t(rows[i]?.projectId));const fee=parse(p?.FEE);if(fee===null||fee<0)return error('Fee del progetto non disponibile');rows[i].fee=String(fee);rows[i].amount=String(fee);render();}
  if(act==='save')save();
 });
 el.addEventListener('input',ev=>{const key=ev.target.dataset.field,i=Number(ev.target.dataset.i);if(key&&rows[i])rows[i][key]=ev.target.value;if(ev.target.id?.startsWith('split-')&&ev.target.tagName==='INPUT')draft[ev.target.id.slice(6)]=ev.target.value;totals();});
 el.addEventListener('change',ev=>{
  if(ev.target.id==='split-existing'){open(ev.target.value||null,prefill);return;}
  const key=ev.target.dataset.field,i=Number(ev.target.dataset.i);if(key&&rows[i])rows[i][key]=ev.target.value;if(ev.target.id?.startsWith('split-')&&ev.target.tagName==='INPUT')draft[ev.target.id.slice(6)]=ev.target.value;totals();
 });
 return el;
}
function error(msg){$('split-error').textContent=msg;}
function close(){if(busy)return;$('kyv-split-modal').hidden=true;invoice=null;rows=[];}
function field(key,label,value='',type='text'){
 return '<label>'+H(label)+'<input type="'+type+'" id="split-'+key+'" value="'+H(value)+'"></label>';
}
function doc(){
 if(invoice)return {numero:t(invoice.Numero_Originale||invoice.Numero),data:invoice.Data,cliente:invoice.Denominazione,prezzo_unitario:amount(invoice),descrizione:t(invoice.Descrizione),totale_fiscale:t(invoice.ImportoTotaleDocumento)};
 return {numero:t(draft.numero),data:t(draft.data),cliente:t(draft.cliente),prezzo_unitario:parse(draft.unitario),descrizione:t(draft.descrizione),totale_fiscale:t(draft.fiscale)};
}
function projectOptions(selected){
 return '<option value="">Seleziona progetto</option>'+projects.map(p=>'<option value="'+H(p.ID)+'"'+(t(p.ID)===t(selected)?' selected':'')+'>'+H(label(p.ID)+' (#'+p.ID+')')+'</option>').join('');
}
function render(){
 const d=doc(),existing=!!invoice;
 const options=!existing&&prefill?'<label>Oppure scegli fattura già registrata<select id="split-existing"><option value="">Crea nuova fattura</option>'+invoices.map(f=>'<option value="'+H(f.ID_FT)+'">'+H((f.Numero_Originale||f.Numero||f.ID_FT)+' · '+f.Denominazione)+'</option>').join('')+'</select></label>':'';
 const details=existing?'<div class="split-doc"><div><b>Fattura</b><p>'+H(d.numero)+' · '+H(d.data)+'</p></div><div><b>Cliente</b><p>'+H(d.cliente)+'</p></div><div><b>PrezzoUnitario gestionale</b><p>'+H(euro(d.prezzo_unitario))+'</p><small>Totale fiscale: '+H(d.totale_fiscale||'—')+'</small></div></div>':
 '<div class="split-doc">'+options+field('numero','Numero fattura',draft.numero)+field('data','Data fattura',draft.data, 'date')+field('cliente','Cliente',draft.cliente)+field('unitario','PrezzoUnitario (€), base gestionale',draft.unitario)+field('fiscale','Totale fiscale (opzionale)',draft.fiscale)+field('descrizione','Descrizione',draft.descrizione)+'</div>';
 $('split-body').innerHTML=details+'<p>Il tasto <b>Duplica riga</b> copia la descrizione ma lascia vuoti progetto e PrezzoUnitario. Non genera nuove fatture fiscali.</p><div id="split-lines">'+
 rows.map((r,i)=>'<div class="split-row">'+
 '<label>Progetto<select data-i="'+i+'" data-field="projectId">'+projectOptions(r.projectId)+'</select></label>'+
 '<label>PrezzoUnitario (€)<input inputmode="decimal" data-i="'+i+'" data-field="amount" value="'+H(r.amount)+'" placeholder="0,00"></label>'+
 '<label>Fee concordata (€)<input inputmode="decimal" data-i="'+i+'" data-field="fee" value="'+H(r.fee)+'" placeholder="Riferimento"></label>'+
 '<label>Descrizione<input data-i="'+i+'" data-field="description" value="'+H(r.description)+'"></label>'+
 '<div class="split-actions"><button type="button" data-act="duplicate" data-i="'+i+'">Duplica riga</button><button type="button" data-act="fee" data-i="'+i+'">Riporta fee</button><button type="button" data-act="remove" data-i="'+i+'"'+(rows.length===1?' disabled':'')+'>Elimina</button></div></div>').join('')+'</div>';
 totals();
}
function totals(){
 let total=rows.reduce((sum,r)=>sum+Math.round((parse(r.amount)||0)*100),0)/100;
 let limit=invoice?amount(invoice):parse($('split-unitario')?.value);
 $('split-total').textContent='Quote '+euro(total)+' / PrezzoUnitario '+euro(limit)+' · Residuo '+euro((limit||0)-total);
}
async function refresh(){
 if(!client)throw Error('Sessione non disponibile');
 const [ps,fs,as]=await Promise.all([
 client.from('PROGETTI').select('ID,TITOLO,ARTISTA,FEE').order('ID',{ascending:false}).limit(1500),
 client.from('FATTURE').select('ID_FT,Numero,Numero_Originale,Data,Denominazione,Descrizione,PrezzoUnitario,ImportoTotaleDocumento,ID_PROGETTO').order('ID_FT',{ascending:false}).limit(2500),
 client.from('FATTURE_RIPARTIZIONI').select('id,id_ft,id_progetto,prezzo_unitario,fee_riferimento,descrizione').order('id',{ascending:false}).limit(5000)
 ]);
 if(ps.error||fs.error||as.error)throw Error('Archivio ripartizioni non disponibile: '+(ps.error||fs.error||as.error).message);
 projects=(ps.data||[]).sort((a,b)=>labelLocal(a).localeCompare(labelLocal(b),'it'));
 invoices=fs.data||[];allocations=as.data||[];
}
function labelLocal(p){return (p.ARTISTA||'')+' '+(p.TITOLO||'');}
async function open(id=null,project=''){
 panel();const stamp=++token;prefill=t(project);draft={};$('kyv-split-modal').hidden=false;$('split-error').textContent='';$('split-body').textContent='Caricamento fatture…';
 try{
  await refresh();if(stamp!==token)return;
  invoice=id?invoices.find(f=>t(f.ID_FT)===t(id)):null;
  if(id&&!invoice)throw Error('Fattura non trovata o non autorizzata');
  const old=invoice?splits(invoice.ID_FT):[];
  rows=old.length?old.map(a=>({projectId:t(a.id_progetto),amount:t(a.prezzo_unitario),fee:t(a.fee_riferimento),description:t(a.descrizione)})):
   [{...row(),projectId:invoice?t(invoice.ID_PROGETTO):prefill,amount:invoice&&invoice.ID_PROGETTO?t(amount(invoice)):''}];
  // When opened from a project and linked to an existing invoice, add its own empty fee line.
  if(invoice&&prefill&&!rows.some(r=>t(r.projectId)===prefill))rows.push({...row(),projectId:prefill});
  render();
 }catch(e){error(e.message);}
}
async function save(){
 if(busy)return;
 try{
  const d=doc(),limit=parse(d.prezzo_unitario);
  if(limit===null||limit<0)throw Error('PrezzoUnitario non valido');
  if(!invoice&&(!d.numero||!d.cliente||! /^\d{4}-\d{2}-\d{2}$/.test(d.data)))throw Error('Numero, data e cliente obbligatori');
  const plan=validate(rows,limit);
  if(plan.remaining>0&&!confirm('Restano '+euro(plan.remaining)+' non attribuiti. Salvare comunque?'))return;
  if(!confirm('Confermi '+plan.items.length+' righe su un solo documento fiscale?'))return;
  busy=true;$('split-error').textContent='';
  const res=await client.rpc('kyv_v247_save_invoice',{p_invoice_id:invoice?.ID_FT??null,p_invoice:invoice?null:d,p_rows:plan.items});
  if(res.error)throw Error(res.error.message);
  await refresh();
  const id=res.data;busy=false;close();
  if(onSaved)await onSaved(id);
  root.dispatchEvent(new Event('kyv:invoice-updated'));
  alert('Fattura #'+id+' salvata con '+plan.items.length+' righe. Verifica le quote nei progetti.');
 }catch(e){error('Salvataggio non completato: '+e.message);}
 finally{busy=false;}
}
function boot(options){
 client=options?.client;onSaved=options?.onSaved;
 panel();
 $('kyv-split-new')?.addEventListener('click',()=>open(null));
 document.addEventListener('click',e=>{
  const button=e.target.closest('[data-split-invoice]');if(!button)return;
  e.stopPropagation();e.preventDefault();open(button.dataset.splitInvoice);
 },true);
 const project=new URLSearchParams(location.search).get('ripartizione_progetto');
 if(project)open(null,project);
}
root.KYV_INVOICE_SPLIT_V247=Object.freeze({boot,open,refresh,splits,forProject,names,validate});
})(typeof window!=='undefined'?window:globalThis);
