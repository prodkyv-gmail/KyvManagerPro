/* KYVManagerPro — Importazione fatture elettroniche Aruba XML (FatturaPA). 
 * File letti soltanto nel browser; il file XML originale non viene caricato su Supabase.
 * Import esplicito, nessuna associazione automatica ai progetti e nessun nuovo MutationObserver.
 */
(function(){
'use strict';
const MAX_FILES=50, MAX_BYTES=5*1024*1024, READ_LIMIT=5000;
const state={client:null,existing:[],projects:[],items:[],busy:false,ready:false,onImported:null};
const text=v=>String(v??'').trim();
const esc=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const clean=v=>text(v).normalize('NFKC').toLocaleLowerCase('it-IT').replace(/\s+/g,' ');
const normMoney=v=>{const raw=text(v).replace(/\s/g,'').replace('€','');if(!raw)return NaN;const n=Number(raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw);return Number.isFinite(n)?n:NaN;};
const euro=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(normMoney(v));
const year=v=>/^\d{4}-\d\d-\d\d$/.test(text(v))?text(v).slice(0,4):'';
const normalizedNumber=v=>{const n=text(v).match(/(?:^|[^0-9])(\d+)(?:\/(?:\d{2}|\d{4}))?$/);return n?Number(n[1]):null;};
const children=n=>n?Array.from(n.children||[]):[];
const child=(n,k)=>children(n).find(e=>e.localName===k)||null;
const path=(n,...keys)=>keys.reduce((node,key)=>child(node,key),n);
const val=(n,...keys)=>text(path(n,...keys)?.textContent);
const descendants=(n,key)=>n?Array.from(n.getElementsByTagName('*')).filter(e=>e.localName===key):[];
function fullName(n){return val(n,'Denominazione')||[val(n,'Nome'),val(n,'Cognome')].filter(Boolean).join(' ');}
function sameMoney(a,b){const x=normMoney(a),y=normMoney(b);return Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<0.011;}
function customerMatches(a,b){const iva=clean(a.IdCodice5),existingIva=clean(b.IdCodice5);if(iva&&existingIva)return iva===existingIva;return !!clean(a.Denominazione)&&clean(a.Denominazione)===clean(b.Denominazione);}
function invoiceKey(row){return [year(row.Data),clean(row.Numero_Originale),clean(row.TipoDocumento||'TD01')].join('|');}
function parseInvoiceDocument(doc){
  const root=doc?.documentElement;
  if(!root||root.localName!=='FatturaElettronica'||descendants(doc,'parsererror').length)throw Error('XML FatturaPA non valido.');
  const header=child(root,'FatturaElettronicaHeader'),bodies=children(root).filter(el=>el.localName==='FatturaElettronicaBody');
  if(!header||bodies.length!==1)throw Error('È supportata una fattura per file: separa gli eventuali corpi multipli.');
  const body=bodies[0],general=path(body,'DatiGenerali','DatiGeneraliDocumento');
  const buyer=path(header,'CessionarioCommittente','DatiAnagrafici');
  const seller=path(header,'CedentePrestatore','DatiAnagrafici');
  if(!general||!buyer||!seller)throw Error('Mancano i dati fiscali obbligatori dell’emittente, destinatario o documento.');
  const numero=val(general,'Numero'),data=val(general,'Data'),tipo=val(general,'TipoDocumento');
  if(!numero||!year(data)||!tipo||!/^TD\d\d$/.test(tipo))throw Error('Numero, data o tipo documento non validi.');
  const total=val(general,'ImportoTotaleDocumento');
  if(!Number.isFinite(normMoney(total))||normMoney(total)<0)throw Error('Importo totale assente o non valido: verifica il documento in Aruba.');
  const buyerName=fullName(path(buyer,'Anagrafica')),sellerName=fullName(path(seller,'Anagrafica'));
  const sellerVat=val(seller,'IdFiscaleIVA','IdCodice');
  const buyerVat=val(buyer,'IdFiscaleIVA','IdCodice');
  if(!sellerVat&&!val(seller,'CodiceFiscale'))throw Error('Identificativo dell’emittente non disponibile.');
  const lines=children(path(body,'DatiBeniServizi')).filter(x=>x.localName==='DettaglioLinee');
  const summary=lines.map(x=>val(x,'Descrizione')).filter(Boolean).join(' | ')||val(general,'Causale');
  // The managerial unit amount is the sum of the explicitly declared fee-line unit prices.
  // Exclude bollo/tax items; never substitute ImportoTotaleDocumento.
  const feeLines=lines.filter(x=>!/\b(?:bollo|imposta di bollo|ritenuta|marca da bollo)\b/i.test(val(x,'Descrizione')));
  const unitPrices=feeLines.map(x=>normMoney(val(x,'PrezzoUnitario')));
  const unitAmount=feeLines.length&&unitPrices.every(Number.isFinite)
    ?unitPrices.reduce((sum,n)=>sum+n,0).toFixed(2):null;
  const payments=children(body).filter(x=>x.localName==='DatiPagamento').flatMap(x=>children(x).filter(y=>y.localName==='DettaglioPagamento'));
  const prices=lines.map(x=>normMoney(val(x,'PrezzoTotale'))).filter(Number.isFinite);
  const docTotal=normMoney(total).toFixed(2);
  return {
    sellerName:sellerName||'Emittente non specificato',sellerVat:sellerVat||val(seller,'CodiceFiscale'),
    Numero_Originale:numero,Numero:normalizedNumber(numero),Data:data,TipoDocumento:tipo,
    Denominazione:buyerName||buyerVat||'Cliente non specificato',IdCodice5:buyerVat,
    CodiceFiscale6:val(buyer,'CodiceFiscale'),CodiceDestinatario:val(header,'DatiTrasmissione','CodiceDestinatario'),
    ProgressivoInvio:val(header,'DatiTrasmissione','ProgressivoInvio'),
    Descrizione:summary,ImportoTotaleDocumento:docTotal,
    PrezzoUnitario:unitAmount,
    PrezzoTotale:prices.length?prices.reduce((sum,n)=>sum+n,0).toFixed(2):null,
    ImportoPagamento:payments.length===1?val(payments[0],'ImportoPagamento'):null,
    PAGATA:'NO'
  };
}
function classify(row,existing){
  for(const x of existing){
    if(row.XML_SHA256&&clean(row.XML_SHA256)===clean(x.XML_SHA256))return {kind:'duplicate',reason:'XML già importato · ID '+x.ID_FT};
  }
  for(const x of existing){
    if(row.Numero_Originale&&clean(x.Numero_Originale)===clean(row.Numero_Originale)
       &&year(x.Data)===year(row.Data)){
      if(x.TipoDocumento&&clean(x.TipoDocumento)!==clean(row.TipoDocumento))return{kind:'review',reason:'Stesso numero/anno con tipo documento diverso · ID '+x.ID_FT};
      const consistent=customerMatches(row,x)&&sameMoney(row.ImportoTotaleDocumento,x.ImportoTotaleDocumento);
      return {kind:consistent?'duplicate':'review',reason:(consistent?'Numero originale già presente':'Numero originale coincidente, ma dati differenti')+' · ID '+x.ID_FT};
    }
  }
  if(row.Numero===null)return{kind:'ok',reason:'Numero alfanumerico conservato in forma originale'};
  for(const x of existing){
    if(Number(x.Numero)!==Number(row.Numero)||year(x.Data)!==year(row.Data))continue;
    if(x.Numero_Originale)return{kind:'review',reason:'Stesso numero numerico/anno con numerazione originale differente · ID '+x.ID_FT};
    if(x.TipoDocumento&&clean(x.TipoDocumento)!==clean(row.TipoDocumento))return{kind:'review',reason:'Stesso numero/anno ma tipo documento diverso · ID '+x.ID_FT};
    const consistent=customerMatches(row,x)&&sameMoney(row.ImportoTotaleDocumento,x.ImportoTotaleDocumento);
    return{kind:consistent?'duplicate':'review',reason:(consistent?'Possibile importazione storica già presente':'Numero/anno già presenti nello storico; verifica manuale')+' · ID '+x.ID_FT};
  }
  return{kind:'ok',reason:'Nuova fattura'};
}
function reassess(){
  const earlier=[];
  state.items.forEach(item=>{
    if(item.error){item.kind='error';item.reason=item.error;item.selected=false;return;}
    if(item.kind==='imported'){earlier.push({...item.row,ID_FT:'importata'});return;}
    const result=classify(item.row,state.existing.concat(earlier));
    item.kind=result.kind;item.reason=result.reason;
    item.selected=item.kind==='ok'&&item.selected!==false;
    earlier.push({...item.row,ID_FT:'nel lotto'});
  });
}
function show(msg,kind='info'){const el=document.getElementById('kyv-aruba-notice');if(!el)return;el.textContent=msg;el.dataset.kind=kind;el.hidden=!msg;}
function showPanel(){const panel=document.getElementById('kyv-aruba-panel');if(!panel)return;panel.hidden=!panel.hidden;if(!panel.hidden)panel.scrollIntoView({behavior:'smooth',block:'start'});}
function render(){
  const host=document.getElementById('kyv-aruba-preview');if(!host)return;
  if(!state.items.length){host.innerHTML='<p class="text-sm text-slate-300">Seleziona i file XML esportati da Aruba. Prima del salvataggio vedrai tutti i dati e gli eventuali duplicati.</p>';return;}
  const rows=state.items.map((it,i)=>{
    const r=it.row||{},kind=it.kind,label={ok:'Importabile',duplicate:'Duplicato',review:'Da verificare',error:'File non valido',imported:'Importata'}[kind]||kind;
    const options=['<option value="">Nessun progetto (collegabile in seguito)</option>'].concat(state.projects.map(p=>'<option value="'+esc(p.ID)+'" '+(text(it.projectId)===text(p.ID)?'selected':'')+'>'+esc((p.TITOLO||'Progetto')+' · '+(p.ARTISTA||'')+' (#'+p.ID+')')+'</option>')).join('');
    return '<tr><td><input type="checkbox" data-aruba-check="'+i+'" '+(it.selected?'checked':'')+' '+(kind==='ok'&&!state.busy?'':'disabled')+' aria-label="Importa '+esc(it.fileName)+'"></td>'+
      '<td><strong>'+esc(it.fileName)+'</strong><small>'+esc(r.sellerName||'')+'</small></td>'+
      '<td><strong>'+esc(r.Numero_Originale||'—')+'</strong><small>'+esc(r.Data||'')+'</small></td>'+
      '<td>'+esc(r.Denominazione||'—')+'</td><td>'+esc(r.ImportoTotaleDocumento?euro(r.ImportoTotaleDocumento):'—')+'</td>'+
      '<td><span class="kyv-aruba-status '+esc(kind)+'">'+esc(label)+'</span><small>'+esc(it.reason)+'</small></td>'+
      '<td><select data-aruba-project="'+i+'" '+(kind==='ok'&&!state.busy?'':'disabled')+'>'+options+'</select></td></tr>';
  }).join('');
  host.innerHTML='<div class="kyv-aruba-overflow"><table><thead><tr><th>Importa</th><th>File / emittente</th><th>Numero / data</th><th>Cliente</th><th>Totale</th><th>Controllo</th><th>Progetto (opzionale)</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const count=state.items.filter(it=>it.kind==='ok'&&it.selected).length;
  const confirm=document.getElementById('kyv-aruba-confirm');
  confirm.disabled=state.busy||count===0;
  confirm.textContent=state.busy?'Importazione…':'Importa '+count+' fattur'+(count===1?'a':'e')+' selezionat'+(count===1?'a':'e');
  document.getElementById('kyv-aruba-count').textContent=state.items.length+' file · '+state.items.filter(it=>it.kind==='duplicate').length+' duplicati · '+state.items.filter(it=>it.kind==='review').length+' da verificare';
}
async function loadExisting(){
  const cols='ID_FT,Numero,Numero_Originale,XML_SHA256,Data,TipoDocumento,Denominazione,IdCodice5,ImportoTotaleDocumento';
  const pageSize=500;
  const first=await state.client.from('FATTURE').select(cols,{count:'exact'}).order('ID_FT',{ascending:false}).range(0,pageSize-1);
  if(first.error)throw Error('Impossibile verificare i duplicati: '+first.error.message);
  if(first.count===null||first.count>READ_LIMIT)throw Error('Archivio troppo grande per una verifica completa: importazione bloccata.');
  const rows=[...(first.data||[])];
  while(rows.length<first.count){
    const offset=rows.length;
    const next=await state.client.from('FATTURE').select(cols).order('ID_FT',{ascending:false}).range(offset,Math.min(offset+pageSize-1,first.count-1));
    if(next.error||!(next.data||[]).length)throw Error('Lettura archivio incompleta: importazione bloccata.');
    rows.push(...next.data);
  }
  if(rows.length!==first.count)throw Error('Lettura archivio incompleta: importazione bloccata.');
  state.existing=rows;
}
async function loadProjects(){
  const res=await state.client.from('PROGETTI').select('ID,TITOLO,ARTISTA').order('ID',{ascending:false}).limit(1000);
  if(res.error)throw Error('Impossibile leggere i progetti: '+res.error.message);
  state.projects=res.data||[];
}
async function readFile(file){
  if(!/\.xml$/i.test(file.name))throw Error('È richiesto un file .xml.');
  if(!file.size||file.size>MAX_BYTES)throw Error('File XML vuoto o superiore a 5 MB.');
  const bytes=await file.arrayBuffer(),string=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(/<!DOCTYPE|<!ENTITY/i.test(string))throw Error('XML con entità o DOCTYPE non accettati per sicurezza.');
  if(!window.crypto?.subtle)throw Error('SHA-256 non disponibile: è necessaria una connessione HTTPS.');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
  const doc=new DOMParser().parseFromString(string,'application/xml');
  const row=parseInvoiceDocument(doc);row.XML_SHA256=hash;
  return row;
}
async function loadFiles(fileList){
  if(state.busy)return;const files=Array.from(fileList||[]);
  if(!files.length)return;
  if(files.length>MAX_FILES){show('Seleziona massimo 50 file per lotto.','error');return;}
  state.busy=true;state.items=[];render();show('Lettura XML e controllo duplicati in corso…');
  try{
    await Promise.all([loadExisting(),loadProjects()]);
    for(const f of files){
      try{state.items.push({fileName:f.name,row:await readFile(f),selected:true,projectId:'',kind:'ok',reason:''});}
      catch(error){state.items.push({fileName:f.name,row:null,selected:false,kind:'error',reason:error.message,error:error.message});}
    }
    reassess();
    show('Anteprima pronta. Le righe duplicate o da verificare non possono essere importate; nessun file XML originale viene caricato nel database.','info');
  }catch(error){state.items=[];show(error.message,'error');}
  finally{state.busy=false;render();}
}
function explainInsertError(error){
  const code=text(error?.code);
  const raw=text(error?.message);
  const details=text(error?.details);
  const cause=(raw+' '+details+' '+text(error?.hint));
  // PostgreSQL 23505 riguarda qualsiasi vincolo UNIQUE, non soltanto l'hash XML.
  if(code==='23505'||/duplicate key|unique constraint/i.test(raw)){
    if(/FATTURE1_pkey|FATTURE_pkey|\bID_FT\b/i.test(cause)){
      return 'Conflitto con ID interno fattura (ID_FT): il contatore automatico del database potrebbe non essere sincronizzato con i dati storici. Il file XML non è stato importato. Serve riallineare la sequenza; non creare o cancellare fatture per aggirare l’errore.';
    }
    if(/fatture_owner_xml_sha256_unique|XML_SHA256/i.test(cause)){
      return 'Impronta XML già presente nel database: rileggi il registro e controlla la fattura prima di tentare nuovamente.';
    }
    return 'Vincolo di unicità del database (23505), non necessariamente XML duplicato: '+(raw||'verifica i vincoli della tabella FATTURE')+'.';
  }
  if(code==='23502'&&/ID_FT/i.test(cause)){
    return 'Identificativo interno ID_FT non assegnato dal database: verifica la sequenza delle fatture. Nessun XML importato.';
  }
  if(code==='42501'||/row-level security|permission denied/i.test(cause)){
    return 'Autorizzazione insufficiente per inserire in FATTURE: verifica la sessione e le policy di accesso. '+(raw?'Dettaglio: '+raw:'');
  }
  return 'Salvataggio fallito'+(code?' (codice '+code+')':'')+': '+(raw||'errore non specificato');
}
function payload(row,projectId){
  const fields=['Numero_Originale','XML_SHA256','Numero','Data','TipoDocumento','Denominazione','IdCodice5','CodiceFiscale6','CodiceDestinatario','ProgressivoInvio','Descrizione','ImportoTotaleDocumento','PrezzoUnitario','PrezzoTotale','ImportoPagamento','PAGATA'];
  const data={};fields.forEach(key=>{if(row[key]!==undefined&&row[key]!==null&&row[key]!=='')data[key]=row[key];});
  if(projectId)data.ID_PROGETTO=Number(projectId);
  return data;
}
async function importSelected(){
  if(state.busy)return;
  const items=state.items.filter(it=>it.selected&&it.kind==='ok');
  if(!items.length)return;
  if(!window.confirm('Importare '+items.length+' fattur'+(items.length===1?'a':'e')+' nel registro? I duplicati non saranno importati. Le fatture resteranno segnate come NON pagate finché non ne verifichi l’incasso.'))return;
  state.busy=true;show('Verifica finale e salvataggio fatture…');
  let saved=0,stopped=false;
  try{
    await loadExisting();reassess();
    for(const item of items){
      if(item.kind!=='ok'||!item.selected)continue;
      const result=classify(item.row,state.existing);
      if(result.kind!=='ok'){item.kind=result.kind;item.reason=result.reason;item.selected=false;continue;}
      if(item.projectId&&!state.projects.some(p=>text(p.ID)===text(item.projectId))){item.kind='review';item.reason='Progetto selezionato non valido; modifica manualmente.';item.selected=false;continue;}
      const res=await state.client.from('FATTURE').insert([payload(item.row,item.projectId)]).select('ID_FT').single();
      if(res.error){
        item.kind='review';item.reason=explainInsertError(res.error);item.selected=false;
        stopped=true;break;
      }
      item.kind='imported';item.reason='Importata con ID '+res.data.ID_FT;item.selected=false;saved++;
      state.existing.push({...item.row,ID_FT:res.data.ID_FT});
    }
    if(!stopped)reassess();
    show(saved+' fattur'+(saved===1?'a importata':'e importate')+'. '+(stopped?'Salvataggio interrotto al primo errore. Leggi il motivo esatto nella colonna Controllo e verifica prima di ritentare.':'Duplicati e casi dubbi esclusi.'),stopped?'error':'success');
    if(saved&&state.onImported)await state.onImported();
  }catch(error){show('Importazione interrotta: '+error.message,'error');}
  finally{state.busy=false;render();}
}
function boot(opts){
  if(state.ready)return;state.ready=true;
  state.client=opts?.client;state.onImported=opts?.onImported;
  const button=document.getElementById('kyv-aruba-open');
  const anchor=document.getElementById('kyv-manual-invoice-link');
  if(!state.client||!button||!anchor){state.ready=false;return;}
  const panel=document.createElement('section');panel.id='kyv-aruba-panel';panel.hidden=true;
  panel.innerHTML='<div class="kyv-aruba-heading"><div><h3>Importazione XML Aruba</h3><p>Fattura elettronica FatturaPA · importazione locale con controllo duplicati. Nessuna emissione allo SdI.</p></div><button type="button" id="kyv-aruba-close">Chiudi</button></div>'+
  '<label class="kyv-aruba-choose">Scegli i file XML (massimo 50, 5 MB ciascuno)<input id="kyv-aruba-files" type="file" accept=".xml,application/xml,text/xml" multiple></label>'+
  '<div id="kyv-aruba-notice" hidden></div><div class="kyv-aruba-foot"><span id="kyv-aruba-count"></span><label><input id="kyv-aruba-attest" type="checkbox"> Confermo che si tratta di fatture da me emesse</label></div>'+
  '<div id="kyv-aruba-preview"></div><div class="kyv-aruba-foot"><span>Le fatture saranno registrate come non pagate. L’assegnazione al progetto è facoltativa.</span><button type="button" id="kyv-aruba-confirm" disabled>Importa 0 fatture selezionate</button></div>';
  anchor.insertAdjacentElement('beforebegin',panel);
  const style=document.createElement('style');style.id='kyv-aruba-style';style.textContent=
    '#kyv-aruba-panel{border:1px solid #6366f166;background:#151923;padding:1.15rem;border-radius:1rem;color:#f8fafc}'+
    '#kyv-aruba-panel[hidden],#kyv-aruba-notice[hidden]{display:none!important}'+
    '.kyv-aruba-heading,.kyv-aruba-foot{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap}'+
    '.kyv-aruba-heading h3{font-size:1.2rem;font-weight:900}.kyv-aruba-heading p,.kyv-aruba-foot{font-size:.82rem;color:#cbd5e1}'+
    '#kyv-aruba-panel button{border:1px solid #818cf8aa;background:#312e81;color:#fff;padding:.55rem .85rem;border-radius:.7rem;font-size:.85rem;font-weight:800}'+
    '#kyv-aruba-panel button:disabled{opacity:.42;cursor:not-allowed}'+
    '.kyv-aruba-choose{display:block;background:#202637;padding:.9rem;margin:1rem 0;border-radius:.7rem;color:#fff;font-weight:700}'+
    '.kyv-aruba-choose input{display:block;margin:.55rem 0 0;font-size:.85rem;max-width:100%}'+
    '#kyv-aruba-notice{margin:.7rem 0;padding:.75rem;border-radius:.6rem;background:#1e3a8a44;color:#dbeafe;font-size:.8rem}'+
    '#kyv-aruba-notice[data-kind=error]{background:#7f1d1d88;color:#fecaca}'+
    '#kyv-aruba-notice[data-kind=success]{background:#064e3b88;color:#a7f3d0}'+
    '#kyv-aruba-preview{margin:1rem 0}.kyv-aruba-overflow{max-width:100%;overflow:auto}'+
    '#kyv-aruba-panel table{width:100%;min-width:900px;font-size:.76rem;text-align:left}'+
    '#kyv-aruba-panel td,#kyv-aruba-panel th{padding:.62rem;border-bottom:1px solid #334155;vertical-align:top}'+
    '#kyv-aruba-panel small{display:block;color:#94a3b8;margin-top:.25rem;max-width:260px;overflow-wrap:anywhere}'+
    '#kyv-aruba-panel select{max-width:235px;width:100%;border:1px solid #475569;border-radius:.5rem;padding:.4rem;background:#0f172a;color:#fff}'+
    '.kyv-aruba-status{border-radius:.4rem;padding:.2rem .4rem;font-weight:800;white-space:nowrap}'+
    '.kyv-aruba-status.ok,.kyv-aruba-status.imported{color:#a7f3d0;background:#064e3b}'+
    '.kyv-aruba-status.duplicate,.kyv-aruba-status.error{color:#fecaca;background:#7f1d1d}'+
    '.kyv-aruba-status.review{color:#fde68a;background:#78350f}';
  document.head.appendChild(style);
  button.addEventListener('click',showPanel);
  panel.querySelector('#kyv-aruba-close').addEventListener('click',showPanel);
  panel.querySelector('#kyv-aruba-files').addEventListener('change',e=>loadFiles(e.target.files));
  panel.querySelector('#kyv-aruba-confirm').addEventListener('click',()=>{
    if(!panel.querySelector('#kyv-aruba-attest').checked){show('Conferma che si tratta di fatture emesse da te prima di importare.','error');return;}
    importSelected();
  });
  panel.querySelector('#kyv-aruba-preview').addEventListener('change',e=>{
    if(e.target.matches('[data-aruba-check]')){const it=state.items[Number(e.target.dataset.arubaCheck)];if(it&&it.kind==='ok')it.selected=e.target.checked;render();}
    if(e.target.matches('[data-aruba-project]')){const it=state.items[Number(e.target.dataset.arubaProject)];if(it&&it.kind==='ok')it.projectId=e.target.value;}
  });
  render();
}
window.KYV_ARUBA_IMPORT=Object.freeze({boot,parseInvoiceDocument,classify,normalizedNumber,payload,explainInsertError});
})();
