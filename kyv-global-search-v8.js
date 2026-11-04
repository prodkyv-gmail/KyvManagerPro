/* KYV Global Search v8 — command palette on-demand, read-only. */
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
if(page==='login.html')return;

let db=null,index=null,loading=null,active=0,results=[],searchFocusReturn=null,previousOverflow=null;
let indexRevision=0;
// Recenti soltanto nella memoria della pagina: mai titoli privati in localStorage fra account.
let recentItems=[];
const text=v=>String(v??'').trim();
const H=v=>window.KYV?.safeHtml?KYV.safeHtml(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>text(v).toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function score(hay,q){
 if(!q)return 0;const h=norm(hay),n=norm(q);if(h===n)return 100;if(h.startsWith(n))return 80;if(h.includes(' '+n))return 65;if(h.includes(n))return 50;return -1;
}
function projectHref(id,anchor=''){return id?'scheda_progetto.html?id='+encodeURIComponent(id)+(anchor||''):'progetti.html';}
function entity(type,title,subtitle,searchText,href,icon,meta={}){return{type,title:text(title)||'Senza titolo',subtitle:text(subtitle),searchText:[title,subtitle,searchText,Object.values(meta).join(' ')].join(' '),href,icon,meta};}
function buildIndex(raw){
 const items=[];
 (raw.projects||[]).forEach(r=>items.push(entity('Progetto',r.TITOLO,r.ARTISTA,[r.AUTORI,r.STATO,r.SVILUPPO,r.Label,r.MANAGEMENT,r.Nome_Vero_Artista,r.Codice_ISRC].join(' '),projectHref(r.ID),'music-2',{id:r.ID})));
 (raw.invoices||[]).forEach(r=>items.push(entity('Fattura','Fattura '+(text(r.Numero)||'#'+text(r.ID_FT)),r.Denominazione,[r.Descrizione,r.Data,r.PAGATA,r.ImportoTotaleDocumento,r.PrezzoTotale,r.ImportoPagamento].join(' '),r.ID_PROGETTO?projectHref(r.ID_PROGETTO,'&tab=amministrazione'):'fatture.html','receipt',{id:r.ID_FT,projectId:r.ID_PROGETTO})));
 (raw.sends||[]).forEach(r=>items.push(entity('Invio',r.Destinatario||('Invio #'+r.ID_INVIO),r.Stato,[r.Canale,r.Contesto,r.Messaggio,r.Data_Invio,r.Data_Conferma].join(' '),projectHref(r.ID_PROGETTO,'&tab=produzione#kyv-pitch-followup-project'),'send',{id:r.ID_INVIO,projectId:r.ID_PROGETTO})));
 (raw.docs||[]).forEach(r=>items.push(entity('Documento',r.Titolo_Documento||r.Tipo_Documento,r.Fonte,[r.Tipo_Documento,r.Note,r.Data_Documento,r.Link_Drive].join(' '),projectHref(r.ID_PROGETTO,'&tab=produzione'),'file-text',{id:r.ID_DOCUMENTO,projectId:r.ID_PROGETTO})));
 (raw.versions||[]).forEach(r=>items.push(entity('Versione',r.NOME_FILE||r.TITOLO,r.ARTISTA,[r.TIPO_VERSIONE,r.ETICHETTA_VERSIONE,r.STATO_VERSIONE,r.NOTE].join(' '),projectHref(r.ID_PROGETTO,'&tab=produzione#kyv-project-v2-versions'),'audio-waveform',{id:r.ID_VERSIONE,projectId:r.ID_PROGETTO})));
 (raw.siae||[]).forEach(r=>items.push(entity('SIAE',r.Titolo,r['Codice ISWC']||('Opera '+text(r['Cod. Opera'])),[r['Cod. Opera'],r['Codice ISWC'],r['Cognome / Denominazione'],r.Nome,r.Qualifica,r.Tag].join(' '),'rendiconto.html','copyright',{id:r['Cod. Opera']})));
 (raw.imaie||[]).forEach(r=>items.push(entity('IMAIE',r.TITOLO_OPERA,r.INTERPRETE,[r.COD_OPERA,r.CATALOGO,r.PRODUTTORE,r.ETICHETTA,r.CATEGORIA].join(' '),'rendiconto.html','radio',{id:r.id})));
 return items;
}
/* Read *all* records visible to the authenticated client. Historical .limit(N)
   could silently omit matches while the UI claimed to search the entire archive.
   A source whose count cannot be verified is an error, never an empty archive. */
const SEARCH_PAGE_SIZE=500,SEARCH_MAX_ROWS=30000;
async function readCompleteSource(makeQuery,fields,label,sortColumn){
 const collected=[];
 let expected=null;
 for(let offset=0;offset<=SEARCH_MAX_ROWS;offset+=SEARCH_PAGE_SIZE){
  let q=makeQuery().select(fields,offset===0?{count:'exact'}:{});
  if(sortColumn)q=q.order(sortColumn,{ascending:true});
  const {data,error,count}=await q.range(offset,offset+SEARCH_PAGE_SIZE-1);
  if(error)throw new Error(label+': '+(error.message||'lettura non riuscita'));
  if(!Array.isArray(data))throw new Error(label+': lettura senza righe verificabili');
  if(offset===0){
   if(!Number.isSafeInteger(count)||count<0)throw new Error(label+': totale archivio non verificabile');
   expected=count;
   if(expected>SEARCH_MAX_ROWS)throw new Error(label+': '+expected+' record, limite di sicurezza '+SEARCH_MAX_ROWS+'. Usa la ricerca specifica dell’archivio.');
  }
  collected.push(...data);
  if(collected.length>=expected)break;
  if(data.length===0)throw new Error(label+': lettura incompleta ('+collected.length+'/'+expected+')');
 }
 if(collected.length!==expected)throw new Error(label+': lettura incompleta ('+collected.length+'/'+expected+')');
 return collected;
}
async function fetchIndex(){
 if(index)return index;if(loading)return loading;
 const c=client();if(!c)throw new Error('Client database non disponibile');
 const revision=indexRevision;
 const pending=(async()=>{
  const [projects,invoices,sends,docs,versions,siae,imaie]=await Promise.all([
   readCompleteSource(()=>c.from('PROGETTI'),'ID,TITOLO,ARTISTA,AUTORI,STATO,SVILUPPO,Label,MANAGEMENT,Nome_Vero_Artista,Codice_ISRC','Progetti','ID'),
   readCompleteSource(()=>c.from('FATTURE'),'ID_FT,Numero,Data,Denominazione,Descrizione,ImportoTotaleDocumento,PrezzoTotale,ImportoPagamento,PAGATA,ID_PROGETTO','Fatture','ID_FT'),
   readCompleteSource(()=>c.from('INVII_AUDIO'),'ID_INVIO,ID_PROGETTO,Destinatario,Stato,Canale,Contesto,Messaggio,Data_Invio,Data_Conferma','Invii','ID_INVIO'),
   readCompleteSource(()=>c.from('DOCUMENTI_PROGETTO'),'ID_DOCUMENTO,ID_PROGETTO,Tipo_Documento,Titolo_Documento,Fonte,Link_Drive,Data_Documento,Note','Documenti','ID_DOCUMENTO'),
   readCompleteSource(()=>c.from('AUDIO_VERSIONI'),'ID_VERSIONE,ID_PROGETTO,NOME_FILE,TITOLO,ARTISTA,TIPO_VERSIONE,ETICHETTA_VERSIONE,STATO_VERSIONE,NOTE','Versioni','ID_VERSIONE'),
   readCompleteSource(()=>c.from('EXPORT SIAE'),'"Cod. Opera","Titolo","Codice ISWC","Cognome / Denominazione","Nome","Qualifica","Tag"','SIAE','Titolo'),
   readCompleteSource(()=>c.from('ESTRATTO_IMAIE'),'id,TITOLO_OPERA,CATALOGO,PRODUTTORE,ETICHETTA,INTERPRETE,CATEGORIA,COD_OPERA','IMAIE','id')
  ]);
  const complete=buildIndex({projects,invoices,sends,docs,versions,siae,imaie});
  // Una lettura iniziata prima di un salvataggio/refresh non può sostituire l'indice nuovo.
  if(revision!==indexRevision)return null;
  index=complete;
  return complete;
 })();
 loading=pending;
 try{return await pending;}finally{if(loading===pending)loading=null;}
}

function invalidateIndex(){indexRevision+=1;index=null;loading=null;}
function recents(){return recentItems.slice(0,6);}
function remember(item){
 recentItems=recentItems.filter(x=>x.href!==item.href||x.title!==item.title);
 recentItems.unshift({type:item.type,title:item.title,subtitle:item.subtitle,href:item.href,icon:item.icon});
 recentItems=recentItems.slice(0,6);
}
function ensureStyle(){
 if(document.getElementById('kyv-global-search-style'))return;
 const s=document.createElement('style');s.id='kyv-global-search-style';s.textContent=`
#kyv-global-search{position:fixed;inset:0;z-index:9999;background:rgba(2,6,23,.72);backdrop-filter:blur(8px);display:none;align-items:flex-start;justify-content:center;padding:9vh 1rem 1rem}#kyv-global-search.open{display:flex}.kyv-gs-dialog{width:min(760px,100%);background:#0f111a;border:1px solid #30364a;border-radius:1rem;box-shadow:0 28px 90px rgba(0,0,0,.55);overflow:hidden}.kyv-gs-head{display:flex;align-items:center;gap:.65rem;padding:.8rem;border-bottom:1px solid #232838}.kyv-gs-head i{color:#a5b4fc}.kyv-gs-input{flex:1;background:transparent;border:0;outline:0;color:#fff;font-size:16px;padding:.35rem}.kyv-gs-key{font-size:.58rem;color:#94a3b8;border:1px solid #343b50;border-radius:.4rem;padding:.22rem .38rem}.kyv-gs-body{max-height:min(62vh,620px);overflow:auto;padding:.45rem}.kyv-gs-group{padding:.45rem .45rem .2rem;color:#64748b;font-size:.55rem;text-transform:uppercase;letter-spacing:.11em;font-weight:900}.kyv-gs-result{width:100%;display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:.65rem;align-items:center;text-align:left;border:1px solid transparent;background:transparent;color:#fff;border-radius:.72rem;padding:.58rem .62rem;cursor:pointer}.kyv-gs-result:hover,.kyv-gs-result.active{background:rgba(99,102,241,.10);border-color:rgba(99,102,241,.22)}.kyv-gs-icon{width:32px;height:32px;border-radius:.6rem;background:rgba(99,102,241,.09);display:flex;align-items:center;justify-content:center;color:#c7d2fe}.kyv-gs-main{min-width:0}.kyv-gs-main strong{display:block;font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kyv-gs-main span{display:block;font-size:.6rem;color:#94a3b8;margin-top:.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kyv-gs-type{font-size:.55rem;color:#94a3b8;border:1px solid rgba(148,163,184,.15);padding:.2rem .38rem;border-radius:999px}.kyv-gs-empty{padding:1.2rem;text-align:center;color:#94a3b8;font-size:.7rem}.kyv-gs-foot{display:flex;justify-content:space-between;gap:.7rem;padding:.55rem .75rem;border-top:1px solid #232838;color:#64748b;font-size:.55rem}.kyv-global-search-button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.55rem .7rem;border:1px solid rgba(148,163,184,.14);border-radius:.7rem;background:rgba(255,255,255,.025);color:#cbd5e1;font-size:.68rem;font-weight:800}.kyv-global-search-button:hover{background:rgba(99,102,241,.08);color:#fff}.kyv-gs-result:focus-visible,#kyv-gs-input:focus-visible,#kyv-gs-retry:focus-visible{outline:3px solid #b9b4ff;outline-offset:-3px}.kyv-gs-refresh{padding:.32rem .55rem;border:1px solid #49516b;border-radius:.5rem;background:#20263a;color:#e0e7ff;cursor:pointer;min-height:38px;font-size:.66rem;font-weight:800}.kyv-gs-refresh:focus-visible{outline:3px solid #b9b4ff;outline-offset:2px}.kyv-gs-retry{display:inline-flex;margin:12px auto 2px;padding:11px 18px;border:1px solid #8584dd;border-radius:10px;background:#232d4a;color:#f6f6ff;min-height:44px;font-weight:800}.kyv-gs-coverage{font-size:12px;color:#cad6eb;margin:6px 12px;line-height:1.45}.kyv-gs-dialog{max-height:92dvh}
@media(max-width:640px){#kyv-global-search{padding-top:3vh}.kyv-gs-dialog{border-radius:.8rem}.kyv-gs-body{max-height:72vh}.kyv-gs-type{display:none}.kyv-gs-foot span:last-child{display:none}}
`;document.head.appendChild(s);
}
function ensureModal(){
 let root=document.getElementById('kyv-global-search');if(root)return root;
 root=document.createElement('div');root.id='kyv-global-search';root.innerHTML=`<div class="kyv-gs-dialog" role="dialog" aria-modal="true" aria-label="Ricerca globale"><div class="kyv-gs-head"><i data-lucide="search" class="w-5 h-5"></i><input id="kyv-gs-input" class="kyv-gs-input" autocomplete="off" spellcheck="false" aria-label="Cerca in tutti gli archivi KYV" placeholder="Cerca artista, progetto, fattura, invio, documento, opera…"><button type="button" id="kyv-gs-refresh" class="kyv-gs-refresh" aria-label="Aggiorna indice di ricerca">Aggiorna</button><span class="kyv-gs-key">Esc</span></div><div id="kyv-gs-body" class="kyv-gs-body" role="status" aria-live="polite"></div><div class="kyv-gs-foot"><span>↑↓ naviga · Enter apri</span><span>Indice caricato solo all’apertura</span></div></div>`;document.body.appendChild(root);
 root.addEventListener('mousedown',e=>{if(e.target===root)close();});
 root.querySelector('#kyv-gs-input').addEventListener('input',e=>run(e.target.value));
 root.querySelector('#kyv-gs-refresh').addEventListener('click',refreshIndex);
 if(window.lucide)lucide.createIcons({root});return root;
}
function display(items,label){
 const body=document.getElementById('kyv-gs-body');if(!body)return;
 results=items;active=Math.min(active,Math.max(0,items.length-1));
 const input=document.getElementById('kyv-gs-input');
 if(input){
  if(items.length)input.setAttribute('aria-activedescendant','kyv-gs-option-'+active);
  else input.removeAttribute('aria-activedescendant');
 }
 if(!items.length){body.innerHTML='<div class="kyv-gs-empty">Nessun risultato.</div>';return;}
 const chunks=[];let previousType='';
 items.forEach((r,i)=>{if(r.type!==previousType){chunks.push('<div class="kyv-gs-group">'+H(r.type)+'</div>');previousType=r.type;}chunks.push(`<button type="button" class="kyv-gs-result ${i===active?'active':''}" data-i="${i}" id="kyv-gs-option-${i}"><span class="kyv-gs-icon"><i data-lucide="${H(r.icon||'search')}" class="w-4 h-4"></i></span><span class="kyv-gs-main"><strong>${H(r.title)}</strong><span>${H(r.subtitle||'')}</span></span><span class="kyv-gs-type">${H(r.type)}</span></button>`);});
 body.innerHTML=(label?'<div class="kyv-gs-group">'+H(label)+'</div>':'')+chunks.join('');
 body.querySelectorAll('[data-i]').forEach(btn=>btn.addEventListener('click',()=>openResult(Number(btn.dataset.i))));
 if(window.lucide)lucide.createIcons({root:body});
}
function run(query){
 const q=norm(query);active=0;
 if(!q){const rs=recents();display(rs,rs.length?'Recenti':'Inizia a scrivere');if(!rs.length)document.getElementById('kyv-gs-body').innerHTML='<div class="kyv-gs-empty">Scrivi almeno 2 caratteri per cercare in KYV Manager.</div>';return;}
 if(q.length<2){display([]);document.getElementById('kyv-gs-body').innerHTML='<div class="kyv-gs-empty">Scrivi almeno 2 caratteri.</div>';return;}
 if(!index){
  // Digitare durante una lettura o dopo un errore non deve produrre un falso «0 risultati verificati».
  results=[];
  const body=document.getElementById('kyv-gs-body');
  if(body&&!document.getElementById('kyv-gs-retry'))body.innerHTML='<div class="kyv-gs-empty">Verifica degli archivi in corso…</div>';
  return;
 }
 const found=index.map(r=>({r,s:Math.max(score(r.title,q)*1.25,score(r.subtitle,q)*1.1,score(r.searchText,q))})).filter(x=>x.s>=0);
 const types=['Progetto','Versione','Invio','Documento','Fattura','SIAE','IMAIE'];
 const ranked=found.sort((a,b)=>b.s-a.s||a.r.type.localeCompare(b.r.type,'it')||a.r.title.localeCompare(b.r.title,'it'))
  .slice(0,30).sort((a,b)=>types.indexOf(a.r.type)-types.indexOf(b.r.type)||b.s-a.s).map(x=>x.r);
 display(ranked,'Mostrati '+ranked.length+' di '+found.length+' risultati · indice verificato');
}
function openResult(i){const r=results[i];if(!r)return;remember(r);location.href=r.href;}
function showSearchError(error){
 const body=document.getElementById('kyv-gs-body');
 if(!body)return;
 results=[];active=0;
 const input=document.getElementById('kyv-gs-input');input?.removeAttribute('aria-activedescendant');
 body.innerHTML='<div class="kyv-gs-empty">Ricerca non disponibile: '+H(error?.message||'lettura incompleta')+
  '. Nessun risultato parziale è stato presentato come archivio completo.</div>'+
  '<div class="kyv-gs-empty"><button type="button" class="kyv-gs-retry" id="kyv-gs-retry">Riprova la ricerca</button></div>';
 body.querySelector('#kyv-gs-retry')?.addEventListener('click',loadSearchIndex);
}
async function loadSearchIndex(){
 const revision=indexRevision;
 const root=document.getElementById('kyv-global-search');
 if(!root?.classList.contains('open'))return;
 const body=document.getElementById('kyv-gs-body');
 body.innerHTML='<div class="kyv-gs-empty">Lettura e verifica degli archivi…</div>';
 try{
  await fetchIndex();
  if(revision!==indexRevision)return;
  if(root.classList.contains('open'))run(root.querySelector('#kyv-gs-input').value);
 }catch(error){
  console.error('[KYV Global Search]',error);
  if(revision===indexRevision&&root.classList.contains('open'))showSearchError(error);
 }
}
function refreshIndex(){
 invalidateIndex();
 if(document.getElementById('kyv-global-search')?.classList.contains('open'))return loadSearchIndex();
}
async function open(){
 ensureStyle();const root=ensureModal();
 if(root.classList.contains('open')){root.querySelector('#kyv-gs-input')?.focus();return;}
 searchFocusReturn=document.activeElement;
 previousOverflow=document.body.style.overflow;
 root.classList.add('open');document.body.style.overflow='hidden';
 const input=root.querySelector('#kyv-gs-input');
 input.value='';input.focus();
 display(recents(),'Recenti');
 if(!index)await loadSearchIndex();
}
function close(){
 const root=document.getElementById('kyv-global-search');
 if(!root?.classList.contains('open'))return;
 root.classList.remove('open');
 document.body.style.overflow=previousOverflow||'';
 if(searchFocusReturn?.isConnected)searchFocusReturn.focus();
 searchFocusReturn=null;previousOverflow=null;
}
function keydown(e){
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();return;}
 const root=document.getElementById('kyv-global-search');if(!root?.classList.contains('open'))return;
 if(e.key==='Escape'){e.preventDefault();close();return;}
 if(e.key==='Tab'){
  const nodes=[...root.querySelectorAll('#kyv-gs-input,button:not([disabled])')].filter(node=>node.getClientRects().length);
  if(!nodes.length)return;
  const first=nodes[0],last=nodes[nodes.length-1];
  if(e.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){
   e.preventDefault();last.focus();
  }else if(!e.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){
   e.preventDefault();first.focus();
  }
  return;
 }
 if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(Math.max(0,results.length-1),active+1);display(results);document.querySelector('.kyv-gs-result.active')?.scrollIntoView({block:'nearest'});return;}
 if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(0,active-1);display(results);document.querySelector('.kyv-gs-result.active')?.scrollIntoView({block:'nearest'});return;}
 if(e.key==='Enter'&&results.length&&document.activeElement===root.querySelector('#kyv-gs-input')){e.preventDefault();openResult(active);}
}

function mountSidebarButton(){
 if(document.getElementById('kyv-global-search-button'))return true;
 const nav=document.querySelector('#sidebar nav');if(!nav)return false;
 const wrap=document.createElement('div');wrap.className='px-0 pb-1';wrap.innerHTML='<button id="kyv-global-search-button" class="kyv-global-search-button" type="button"><span class="flex items-center gap-2"><i data-lucide="search" class="w-4 h-4 text-indigo-300"></i>Cerca</span><span class="text-[9px] text-slate-500">⌘K</span></button>';nav.insertAdjacentElement('afterbegin',wrap);wrap.querySelector('button').addEventListener('click',open);if(window.lucide)lucide.createIcons({root:wrap});return true;
}
function boot(){
 ensureStyle();ensureModal();document.addEventListener('keydown',keydown);
 // Menu.js and Producer Mode announce mounts. No timer-based polling.
 document.addEventListener('kyv:sidebar-ready',mountSidebarButton);
 document.addEventListener('kyv:producer-nav-ready',mountSidebarButton);
 // Aggiornamento solo su eventi espliciti di modifica, mai polling o scansione in background.
 ['kyv:record-saved','kyv:invoice-updated','kyv:project-updated'].forEach(name=>{
  document.addEventListener(name,refreshIndex);
 });
 mountSidebarButton();
}
window.KYV_GLOBAL_SEARCH={open,close,mountSidebarButton,refresh:refreshIndex};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();