/* KYV Audio Finder v2.45 - metadata-only index, no automatic project links. */
(function(){
'use strict';
const $=id=>document.getElementById(id),F=window.KYV_AUDIO_FINDER_V245,R=window.KYV_AUDIO_REVIEW_V246,C=window.KYV_AUDIO_CONSENT_V248,G=window.KYV_AUDIO_GROUPS_V249,W=window.KYV_AUDIO_WORKSPACE_V251;
const T=v=>String(v??'').trim(),H=v=>T(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAX=5000,PAGE=400;
let db=null,owner='',catalogue=[],links=[],projects=[],sessions=[],decisions=[],preview=[],previewShown=60,selected=null,busy=false,shown=120,reviewItems=[],reviewShown=80,reviewChoices=new Map(),approvedKeys=new Set(),groupKey='',groupShown=24,groupFileShown=35,groupSelected=new Set(),groupProject='',explorerShown=60,transientFiles=new Map(),playerObjectUrl=null,chooserLoad=null;
const info=(v,error=false)=>{const el=$('finder-status');el.textContent=v;el.className='finder-status'+(error?' error':'')};
const lock=v=>{busy=v;document.querySelectorAll('[data-finder-action]').forEach(el=>el.disabled=v)};
async function all(table,fields,sort){
 const x=await db.from(table).select(fields,{count:'exact'}).order(sort,{ascending:false}).range(0,PAGE-1);
 if(x.error)throw Error(table+': '+x.error.message);
 if(x.count===null||x.count>MAX)throw Error(table+': oltre il limite o conteggio non verificato');
 const rows=[...(x.data||[])];
 while(rows.length<x.count){
  const r=await db.from(table).select(fields).order(sort,{ascending:false}).range(rows.length,Math.min(x.count-1,rows.length+PAGE-1));
  if(r.error||!r.data?.length)throw Error(table+': lettura incompleta');rows.push(...r.data);
 }
 if(rows.length!==x.count)throw Error(table+': lettura incompleta');
 return rows;
}
async function fetchAll(){
 [catalogue,links,projects,sessions,decisions]=await Promise.all([
  all('KYV_AUDIO_INDICE','id,provider,account_label,external_key,nome_file,percorso_relativo,mime_type,size_bytes,modificato_il,content_hash,link_file,origine,ultimo_avvistamento','ultimo_avvistamento'),
  all('KYV_AUDIO_ASSOCIAZIONI','id,id_audio,id_progetto,id_sessione,confermata,annullata,metodo,created_at','created_at'),
  all('PROGETTI','ID,TITOLO,ARTISTA','ID'),
  all('KYV_SESSIONI','id,titolo,data_sessione,archiviata','data_sessione'),
  all('KYV_AUDIO_DECISIONI','provider,account_label,external_key,decision','updated_at')
 ]);
 approvedKeys=new Set(decisions.filter(d=>d.decision==='mio').map(C.key));
}
const pn=p=>(p.ARTISTA?p.ARTISTA+' · ':'')+(p.TITOLO||'Senza titolo')+' #'+p.ID;
const sn=p=>(p.titolo||'Sessione')+' · '+(p.data_sessione||'');
const active=id=>links.filter(l=>l.id_audio===id&&!l.annullata);
const personalCatalogue=()=>catalogue.filter(f=>approvedKeys.has(C.key(f)));
function fillSelects(){
 const make=(arr,id,name)=>'<option value="">Seleziona</option>'+arr.map(p=>'<option value="'+H(id(p))+'">'+H(name(p))+'</option>').join('');
 $('link-project').innerHTML=make(projects,p=>p.ID,pn);
 $('link-session').innerHTML=make(sessions.filter(s=>!s.archiviata),p=>p.id,sn);
}

function explorerApproved(){return W.approved(catalogue,decisions,links);}
function explorerRows(){return W.query(explorerApproved(),{text:$('explorer-query').value,provider:$('explorer-source').value,
 account:$('explorer-account').value,status:$('explorer-linked').value,sort:$('explorer-sort').value});}
function syncExplorerAccounts(){
 const sel=$('explorer-account'),previous=sel.value,accounts=W.accounts(explorerApproved(),$('explorer-source').value);
 sel.innerHTML='<option value="">Tutti gli archivi</option>'+accounts.map(a=>'<option value="'+H(a)+'">'+H(a)+'</option>').join('');
 sel.value=accounts.includes(previous)?previous:'';
}
function closeExplorerPlayer(){
 const audio=$('explorer-player');audio.pause();audio.removeAttribute('src');audio.load();
 if(playerObjectUrl){URL.revokeObjectURL(playerObjectUrl);playerObjectUrl=null;}
 $('explorer-player-wrap').hidden=true;
}
function openLocalAudio(fileId){
 const record=explorerApproved().find(x=>String(x.id)===String(fileId));
 if(!record||record.provider!=='local')throw Error('Solo i file locali già approvati possono essere ascoltati qui');
 const file=transientFiles.get(W.KEY(record));
 if(!file)throw Error('Riseleziona il file dal dispositivo per ascoltarlo. Il browser non conserva accessi permanenti.');
 closeExplorerPlayer();
 playerObjectUrl=URL.createObjectURL(file);
 $('explorer-player').src=playerObjectUrl;
 $('explorer-player-title').textContent='Ascolto locale · '+file.name;
 $('explorer-player-wrap').hidden=false;$('explorer-player-wrap').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function safeCloudLink(f){
 if(f.provider==='local'||!f.link_file)return null;
 const link=F.safeUrl(f.link_file);if(!link)return null;
 try{const host=new URL(link).hostname;
   if(f.provider==='drive'&&/(^|\.)drive\.google\.com$/i.test(host))return link;
   if(f.provider==='dropbox'&&/(^|\.)dropbox\.com$/i.test(host))return link;
 }catch{}return null;
}
function renderExplorer(){
 const approved=explorerApproved(),stats=W.stats(approved),items=explorerRows();
 $('explorer-status').textContent=stats.total+' miei audio approvati · '+stats.linked+' collegati · '+stats.unlinked+
  ' da collegare · '+stats.bySource.local+' locali · '+stats.bySource.drive+' Drive · '+stats.bySource.dropbox+
  ' Dropbox · '+items.length+' risultati';
 $('explorer-items').innerHTML=items.slice(0,explorerShown).map(f=>{
  const link=safeCloudLink(f),listen=f.provider==='local'&&transientFiles.has(W.KEY(f));
  return '<div class="explorer-item"><div><strong>'+H(f.nome_file)+'</strong><small>'+
   H(f.provider+' · '+f.account_label+' · '+(f.percorso_relativo||'Cartella non indicata'))+'</small>'+
   '<small>'+f.linkCount+' collegamenti · '+(f.size_bytes!=null?Number(f.size_bytes).toLocaleString('it-IT')+' byte':'Dimensione ignota')+
   '</small></div><div class="explorer-item-actions">'+
   (listen?'<button type="button" data-explorer-play="'+H(f.id)+'">Ascolta</button>':'')+
   (link?'<a href="'+H(link)+'" target="_blank" rel="noopener noreferrer">Apri in '+H(f.provider==='drive'?'Drive':'Dropbox')+'</a>':'')+
   '<button type="button" data-explorer-detail="'+H(f.id)+'">Dettaglio / collega</button></div></div>';
 }).join('')||'<p class="explorer-desc">Nessun tuo audio nella ricerca. Seleziona i file da una sorgente, quindi classifica soltanto i tuoi lavori.</p>';
 $('explorer-more').hidden=items.length<=explorerShown;
 $('explorer-more').textContent='Mostra altri '+Math.min(60,items.length-explorerShown);
}
function explorerDetail(id){
 const file=explorerApproved().find(f=>String(f.id)===String(id));if(!file)throw Error('Audio non approvato');
 selected=file.id;const advanced=$('finder-advanced');if(advanced)advanced.open=true;
 render();$('finder-detail').scrollIntoView({behavior:'smooth',block:'start'});
}
function render(){
 const personal=personalCatalogue();
 const rows=R.filterCatalogue(personal,links,{query:$('finder-query').value,source:$('finder-source').value,status:$('finder-link-status').value});
 $('finder-count').textContent=rows.length+' file trovati · '+personal.length+' tuoi brani approvati';
 $('finder-list').innerHTML=rows.slice(0,shown).map(f=>
  '<button class="finder-file'+(selected===f.id?' selected':'')+'" type="button" data-audio="'+H(f.id)+'"><strong>'+H(f.nome_file)+'</strong>'+
  '<small>'+H(f.provider+' · '+f.account_label)+'</small><small>'+H(f.percorso_relativo||'Cartella non indicata')+'</small>'+
  '<small>'+active(f.id).length+' collegamenti verificati</small></button>').join('')||'<p>Nessun file corrispondente.</p>';
 $('finder-more').hidden=rows.length<=shown;
 renderDetail();
 renderGroups();
 renderExplorer();
}
function renderDetail(){
 const f=personalCatalogue().find(x=>x.id===selected);$('link-panel').hidden=!f;
 if(!f){$('finder-detail').innerHTML='<p>Seleziona un file indicizzato per visualizzare i suggerimenti e collegarlo a un progetto o una sessione.</p>';return}
 const a=active(f.id),suggest=F.suggestions(f,projects);
 const url=f.link_file?F.safeUrl(f.link_file):null;
 const link=url?'<a href="'+H(url)+'" target="_blank" rel="noopener noreferrer">Apri file nella sorgente</a>':'<small>File locale: per aprirlo devi riselezionarlo dal computer.</small>';
 const same=F.duplicates(f,personalCatalogue()).sameHash.filter(x=>x.id!==f.id);
 $('finder-detail').innerHTML='<h3>'+H(f.nome_file)+'</h3><p>'+H(f.provider+' · '+f.account_label)+'</p><p>'+H(f.percorso_relativo)+'</p>'+link+
 '<p>Dimensione: '+(f.size_bytes===null?'non disponibile':Number(f.size_bytes).toLocaleString('it-IT')+' byte')+
 ' · Hash verificato: '+(f.content_hash?'sì':'no')+'</p><h3>Collegamenti confermati</h3>'+
 (a.length?a.map(l=>'<div class="finder-link">'+H(l.id_progetto?pn(projects.find(p=>String(p.ID)===String(l.id_progetto))||{ID:l.id_progetto}):sn(sessions.find(p=>p.id===l.id_sessione)||{}))+
 ' <button type="button" data-unlink="'+H(l.id)+'">Scollega</button></div>').join(''):'<p>Nessun collegamento.</p>')+
 '<h3>Possibili progetti dal nome · da confermare</h3>'+
 (suggest.length?suggest.map(p=>'<button type="button" class="finder-suggestion" data-suggest="'+H(p.id)+'">'+H(p.artist+' · '+p.title)+'<small>'+H(p.reason)+'</small></button>').join(''):'<p>Nessuna corrispondenza precisa.</p>')+
 (same.length?'<p>Possibili duplicati da hash identico: '+H(same.slice(0,8).map(x=>x.nome_file).join(' · '))+'</p>':'')+
 '<p><button type="button" data-new-project="'+H(f.id)+'">Apri proposta progetto / versione (solo su mia scelta)</button></p>';
}
// v2.49 — all grouping is read-only and uses approved personal audio only.
function groupList(){
 return G.groups(personalCatalogue(),links);
}
function renderGroups(){
 const all=groupList();
 const filtered=G.filter(all,{query:$('finder-group-query').value,source:$('finder-group-source').value,mode:$('finder-group-mode').value});
 const multi=all.filter(x=>x.files.length>1).length;
 $('finder-group-count').textContent=all.length+' possibili brani · '+multi+' con più versioni · '+
  filtered.length+' gruppi nella vista. Raggruppamenti da verificare, nessuna associazione automatica.';
 $('finder-group-list').innerHTML=filtered.slice(0,groupShown).map((g,i)=>
  '<button type="button" class="finder-group-tile'+(groupKey===g.key?' active':'')+'" data-group-index="'+i+'">'+
  '<strong>'+H(g.artist?g.artist+' · '+g.title:g.title)+'</strong>'+
  '<small>'+g.files.length+' file · '+H(g.versionKinds.join(', '))+'</small>'+
  '<small>'+H(g.providers.join(' + '))+(g.ambiguousArtist?' · artista ambiguo':'')+'</small>'+
  '</button>').join('')||'<p class="finder-note">Nessun gruppo in questa ricerca. Prova «Tutti i brani» oppure indica un altro termine.</p>';
 $('finder-group-more').hidden=filtered.length<=groupShown;
 if(groupKey&&!all.some(g=>g.key===groupKey)){groupKey='';groupSelected.clear();groupProject='';}
 renderGroupDetail(all);
}
function renderGroupDetail(all=groupList()){
 const el=$('finder-group-detail'),g=all.find(x=>x.key===groupKey);
 if(!g){el.hidden=true;el.innerHTML='';return;}
 el.hidden=false;
 const available=new Set(G.allowedForLink(g,links).map(f=>String(f.id)));
 // If a saved link or source changed, a previous checkbox is never silently reused.
 groupSelected=new Set([...groupSelected].filter(id=>available.has(id)));
 const sorted=[...g.files].sort((a,b)=>a.version.kind.localeCompare(b.version.kind,'it')||
  a.file.nome_file.localeCompare(b.file.nome_file,'it'));
 const rows=sorted.slice(0,groupFileShown);
 const opts='<option value="">Scegli un progetto esistente</option>'+
  [...projects].sort((a,b)=>pn(a).localeCompare(pn(b),'it')).map(p=>
   '<option value="'+H(p.ID)+'"'+(String(p.ID)===groupProject?' selected':'')+'>'+H(pn(p))+'</option>').join('');
 el.innerHTML='<h3>'+H(g.artist?g.artist+' · '+g.title:g.title)+'</h3>'+
  '<p class="finder-note">Queste versioni sono accostate solo per somiglianza del nome: verifica che siano davvero dello stesso lavoro prima di associarle.'+
  (g.ambiguousArtist?' Il nome dell’artista non è sufficiente per attribuirle.':'')+
  (g.exactHashDuplicates?' · '+g.exactHashDuplicates+' hash identici verificati fra le versioni.':'')+'</p>'+
  '<div class="finder-group-approve"><button type="button" data-group-action="select">Seleziona fino a 25 versioni non collegate</button>'+
  '<button type="button" data-group-action="clear">Deseleziona</button><span class="finder-note" id="finder-group-selected-count">'+groupSelected.size+' selezionate</span></div>'+
  rows.map(({file,version})=>{
   const eligible=available.has(String(file.id)),checked=groupSelected.has(String(file.id));
   return '<div class="finder-group-file"><input type="checkbox" data-group-file="'+H(file.id)+'"'+
    (checked?' checked':'')+(eligible?'':' disabled')+' aria-label="Seleziona versione '+H(file.nome_file)+'">'+
    '<div style="min-width:0;flex:1"><strong>'+H(file.nome_file)+'</strong><small>'+
    H(version.label+' · '+file.provider+' · '+file.account_label)+
    (eligible?'':' · già collegato a un progetto')+'</small></div>'+
    '<button type="button" data-group-open-file="'+H(file.id)+'">Dettaglio</button></div>';
  }).join('')+
  (sorted.length>groupFileShown?'<button type="button" data-group-action="more">Mostra altre versioni</button>':'')+
  '<div class="finder-group-approve"><select id="finder-group-project" aria-label="Progetto di destinazione">'+opts+'</select>'+
  '<button type="button" data-finder-action data-group-action="save">Collega solo le versioni selezionate</button></div>'+
  '<p class="finder-note">Per creare invece un nuovo progetto, apri il Dettaglio di un file selezionato e scegli «Apri proposta progetto / versione». Il popup richiede una seconda conferma. Gli altri file del gruppo non saranno collegati automaticamente.</p>';
}
function showGroup(key){
 const match=groupList().find(g=>g.key===key);if(!match)return;
 groupKey=key;groupShown=Math.max(24,groupShown);groupFileShown=35;groupSelected.clear();
 groupProject=''; // Never preselect a destination from filename matching or past group links.
 renderGroups();
}
function groupSelection(action){
 const g=groupList().find(x=>x.key===groupKey);if(!g)return;
 if(action==='clear'){groupSelected.clear();renderGroupDetail();return}
 if(action==='select'){
  const candidates=G.allowedForLink(g,links).sort((a,b)=>G.versionOf(a).kind.localeCompare(G.versionOf(b).kind,'it')||a.nome_file.localeCompare(b.nome_file,'it')).slice(0,Math.min(25,groupFileShown));
  groupSelected=new Set(candidates.map(f=>String(f.id)));renderGroupDetail();
 }
 if(action==='more'){groupFileShown+=35;renderGroupDetail();}
}
async function saveGroup(){
 const g=groupList().find(x=>x.key===groupKey);if(!g)throw Error('Scegli un gruppo');
 const chosen=[...groupSelected],projectId=groupProject;
 const plan=G.planVersionLinks({group:g,selectedIds:chosen,projectId,files:personalCatalogue(),projects,links,owner,review:R});
 if(!confirm('Confermi '+plan.length+' versioni selezionate per il progetto #'+projectId+
  '? Hai verificato che appartengano al tuo brano? Nessun nuovo progetto sarà creato.'))return;
 info('Controllo dell’indice e dei collegamenti prima del salvataggio…');
 await fetchAll();
 const refreshed=groupList().find(x=>x.key===g.key);
 const verified=G.planVersionLinks({group:refreshed,selectedIds:chosen,projectId,files:personalCatalogue(),projects,links,owner,review:R});
 const result=await db.from('KYV_AUDIO_ASSOCIAZIONI').insert(verified).select('id');
 if(result.error||result.data?.length!==verified.length)
  throw Error('Collegamento non completamente verificato: '+(result.error?.message||'rileggi il catalogo prima di ripetere'));
 await fetchAll();fillSelects();invalidateReview();groupSelected.clear();render();
 info(verified.length+' versioni collegate al progetto scelto dopo conferma. Nessun progetto creato.');
}

async function run(task){
 if(busy)return;lock(true);
 try{await task()}catch(e){info('Operazione non completata: '+(e?.message||e),true)}
 finally{lock(false)}
}
async function refresh(){
 await run(async()=>{
  db=db||window.KYV?.createSupabaseClient?.();if(!db)throw Error('Client Supabase autenticato non disponibile');
  const u=await db.auth.getUser();if(u.error||!u.data?.user?.id)throw Error('Sessione scaduta');
  owner=u.data.user.id;info('Lettura completa dell’indice…');
  await fetchAll();fillSelects();invalidateReview();
  const params=new URLSearchParams(location.search);
  const project=params.get('project'),session=params.get('session');
  if(project&&projects.some(p=>String(p.ID)===project)){$('link-kind').value='project';kindChanged();$('link-project').value=project;}
  if(session&&sessions.some(p=>p.id===session&&!p.archiviata)){$('link-kind').value='session';kindChanged();$('link-session').value=session;}
  render();info(personalCatalogue().length+' audio personali confermati. Nessuna scansione automatica attiva.');
 });
}
function previewIndices(){
 const q=F.norm($('finder-preview-query').value),status=$('finder-preview-state').value;
 return preview.map((file,index)=>({file,index})).filter(x=>
  (status==='all'||x.file.decision===status)&&
  (!q||F.norm([x.file.nome_file,x.file.percorso_relativo,x.file.provider,x.file.account_label].join(' ')).includes(q)))
 .map(x=>x.index);
}
function renderPreview(){
 const indices=previewIndices(),visible=indices.slice(0,previewShown);
 const classified=preview.filter(x=>x._explicit);
 $('finder-preview-count').textContent=preview.length+' file · '+indices.length+' nella ricerca · '+
 classified.filter(x=>x.decision==='mio').length+' miei · '+
 classified.filter(x=>x.decision==='reference').length+' reference · '+classified.length+' decisioni';
 $('finder-preview-list').innerHTML=visible.map(i=>{
  const f=preview[i],listen=f.provider==='local'&&transientFiles.has(W.KEY(f));
  return '<div class="finder-intake-row"><div><strong>'+H(f.nome_file)+'</strong><small>'+
   H(f.provider+' · '+f.account_label+' · '+(f.percorso_relativo||'File selezionato'))+'</small>'+
   (listen?'<button type="button" class="explorer-small-btn" data-preview-play="'+i+'">Ascolta file locale</button>':'')+
   '</div><label>È una mia produzione?<select data-preview-choice="'+i+'">'+
   '<option value="da_verificare"'+(f.decision==='da_verificare'?' selected':'')+'>Da verificare</option>'+
   '<option value="mio"'+(f.decision==='mio'?' selected':'')+'>Sì, mio brano o collaborazione</option>'+
   '<option value="reference"'+(f.decision==='reference'?' selected':'')+'>No, reference o brano di altri</option>'+
   '</select></label></div>';
 }).join('')||'<p class="explorer-desc">Nessun file corrisponde al filtro. Le scelte precedenti restano memorizzate.</p>';
 $('finder-preview-more').hidden=visible.length>=indices.length;
}
function previewScan(rows,note,localRefs=null){
 if(!rows.length)throw Error('Nessun file audio nella selezione');
 if(rows.length>MAX)throw Error('Oltre '+MAX+' file: restringi la selezione');
 closeExplorerPlayer();transientFiles.clear();
 if(localRefs)for(const [key,file] of localRefs)transientFiles.set(key,file);
 preview=C.preview(rows,decisions);previewShown=60;
 $('finder-preview-query').value='';$('finder-preview-state').value='all';
 $('finder-preview').hidden=false;
 $('finder-preview-note').textContent=preview.length+' audio rilevati. '+note+
  ' Sono soltanto candidati: nessun progetto o collegamento viene creato.';
 renderPreview();info('Scansione completata. Classifica soltanto le tue produzioni.');
}
function bulkPreview(decision){
 const indices=previewIndices().slice(0,Math.min(100,previewShown));
 if(!indices.length)return;
 if(!confirm('Confermi la classificazione di '+indices.length+' file VISIBILI come '+
 (decision==='mio'?'tuoi lavori':'reference da escludere')+'?'))return;
 preview=C.markMany(preview,indices,decision);renderPreview();
}
function listenPreview(index){
 const f=preview[index];if(!f||f.provider!=='local')throw Error('Anteprima disponibile solo per audio selezionato localmente');
 const file=transientFiles.get(W.KEY(f));if(!file)throw Error('Riseleziona il file per ascoltarlo');
 closeExplorerPlayer();playerObjectUrl=URL.createObjectURL(file);
 $('explorer-player').src=playerObjectUrl;
 $('explorer-player-title').textContent='Ascolto temporaneo · '+f.nome_file;
 $('explorer-player-wrap').hidden=false;
 $('explorer-player-wrap').scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function drive(){
 if(!window.KYV_DRIVE?.listFiles)throw Error('Connettore Google Drive non disponibile');
 info('Lettura Google Drive in corso…');
 const r=await KYV_DRIVE.listFiles({accountId:$('drive-account').value||'all',pages:12,audioOnly:true});
 if(r.errors?.length)throw Error('Drive non letto completamente: '+r.errors.join('; '));
 const rows=(r.files||[]).map(f=>{
  const id=T(f.id),account=T(f.driveEmail||f.driveAccount||f.driveLabel);
  if(!id||!account||!F.isAudio(f.name,f.mimeType))return null;
  try{return F.record({provider:'drive',account,externalKey:id,name:f.name,path:f.folder||'',mime:f.mimeType,
    size:f.size,modified:f.updated,url:f.webViewLink||f.url||null});}catch{return null}
 }).filter(Boolean);
 previewScan(rows,'Massimo 12 pagine per Drive: archivi molto grandi possono richiedere più scansioni.');
}
async function dropbox(){
 info('Lettura archivio Dropbox…');
 const rows=await all('DROPBOX_AUDIO_FILES','ID_FILE,Nome_File,Link_Dropbox,Hash_SHA256,created_at','ID_FILE');
 const data=rows.map(f=>{try{return F.record({provider:'dropbox',account:'Archivio Dropbox KYV',
  externalKey:'id:'+f.ID_FILE,name:f.Nome_File||'',hash:f.Hash_SHA256,url:f.Link_Dropbox,modified:f.created_at,origin:'archivio'})}
  catch{return null}}).filter(Boolean);
 previewScan(data,'La ricerca usa gli audio già registrati: non esplora l’intero Dropbox.');
}
async function local(files){
 if(!files.length)throw Error('Seleziona cartella o file');
 if(files.length>MAX)throw Error('Seleziona meno di '+MAX+' file');
 const label=T($('local-label').value);
 if(label.length<2||label.length>180)throw Error('Indica un nome per il tuo archivio locale');
 if(!crypto?.subtle)throw Error('L’identità locale richiede HTTPS');
 info('Lettura dei soli metadati selezionati…');
 const data=[];
 for(const f of files){
  if(!F.isAudio(f.name,f.type))continue;
  const relative=T(f.webkitRelativePath||f.name).replaceAll('\\','/');
  const segments=relative.split('/').filter(Boolean);
  const path=segments.length>2?segments.slice(1,-1).join('/'):'';
  const input=new TextEncoder().encode(relative+'|'+f.size+'|'+f.lastModified);
  const digest=await crypto.subtle.digest('SHA-256',input);
  const key=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  data.push(F.record({provider:'local',account:label,externalKey:key,name:f.name,path,mime:f.type,
   size:f.size,modified:new Date(f.lastModified).toISOString(),origin:'selezione'}));
 }
 previewScan(data,'Le cartelle locali, anche OneDrive sincronizzate, devono essere selezionate da te. Non salviamo percorsi assoluti.');
}
async function savePreview(){
 const plan=C.plan(preview,owner);
 if(!confirm('Confermi '+plan.approved.length+' tuoi file audio da indicizzare, '+plan.excluded+' reference escluse e '+plan.pending+' da verificare? Non verranno creati progetti o caricati audio.'))return;
 // Decisions are persisted first so exclusions survive new scans; upserts are idempotent.
 for(let i=0;i<plan.changes.length;i+=100){
  const r=await db.from('KYV_AUDIO_DECISIONI').upsert(plan.changes.slice(i,i+100),{onConflict:'owner_id,provider,account_label,external_key'});
  if(r.error)throw Error('Classificazioni non completamente salvate: '+r.error.message+'. Ripeti la scansione se necessario.');
 }
 for(let i=0;i<plan.approved.length;i+=100){
  const rows=plan.approved.slice(i,i+100).map(x=>{
   const old=catalogue.find(p=>C.key(p)===C.key(x));
   return {...x,content_hash:x.content_hash||old?.content_hash||null,link_file:x.link_file||old?.link_file||null};
  });
  const r=await db.from('KYV_AUDIO_INDICE').upsert(rows,{onConflict:'owner_id,provider,account_label,external_key'}).select('id');
  if(r.error)throw Error('Indicizzazione parziale: '+r.error.message+'. Nessun progetto creato; puoi ripetere la scansione.');
 }
 preview=[];$('finder-preview').hidden=true;
 await fetchAll();fillSelects();invalidateReview();render();
 info(plan.approved.length+' tuoi brani indicizzati; '+plan.excluded+' reference escluse. Per creare un progetto seleziona manualmente un file nel catalogo.');
}
async function associate(){
 const f=personalCatalogue().find(x=>x.id===selected);if(!f)throw Error('Seleziona un audio personale approvato');
 const kind=$('link-kind').value,project=$('link-project').value,session=$('link-session').value;
 if(!['project','session'].includes(kind))throw Error('Destinazione non valida');
 const target=kind==='project'?project:session;
 if(!target)throw Error('Seleziona la destinazione');
 if(kind==='project'&&!projects.some(x=>String(x.ID)===target))throw Error('Progetto non valido');
 if(kind==='session'&&!sessions.some(x=>x.id===target&&!x.archiviata))throw Error('Sessione non valida');
 if(active(f.id).some(x=>kind==='project'?String(x.id_progetto)===target:x.id_sessione===target))throw Error('Collegamento già attivo');
 if(!confirm('Confermi il collegamento di '+f.nome_file+'? Il file non sarà modificato.'))return;
 const payload={owner_id:owner,id_audio:f.id,metodo:'manuale',confermata:true,
  id_progetto:kind==='project'?Number(target):null,id_sessione:kind==='session'?target:null};
 const r=await db.from('KYV_AUDIO_ASSOCIAZIONI').insert(payload).select('id').single();
 if(r.error||!r.data?.id)throw Error(r.error?.message||'Associazione non confermata');
 links=await all('KYV_AUDIO_ASSOCIAZIONI','id,id_audio,id_progetto,id_sessione,confermata,annullata,metodo,created_at','created_at');
 invalidateReview();render();info('Collegamento registrato.');
}
async function unlink(id){
 const x=links.find(a=>a.id===id&&!a.annullata);if(!x)throw Error('Collegamento non trovato');
 if(!confirm('Scollegare questo file senza cancellarlo?'))return;
 const q=await db.from('KYV_AUDIO_ASSOCIAZIONI').update({annullata:true}).eq('id',id).select('id').single();
 if(q.error||!q.data?.id)throw Error(q.error?.message||'Scollegamento non registrato');
 links=await all('KYV_AUDIO_ASSOCIAZIONI','id,id_audio,id_progetto,id_sessione,confermata,annullata,metodo,created_at','created_at');
 invalidateReview();render();info('Collegamento annullato. File originale intatto.');
}

function invalidateReview(){
 reviewItems=[];reviewShown=80;reviewChoices.clear();
 $('review-panel').hidden=true;$('review-list').innerHTML='';
 $('review-status').textContent='Genera nuovamente le proposte dopo un aggiornamento.';
}
function generateReview(){
 if(!owner)throw Error('Prima effettua la lettura autenticata');
 reviewChoices.clear();reviewItems=R.queue(personalCatalogue(),projects,links);
 reviewShown=80;$('review-panel').hidden=false;renderReview();
 info('Proposte generate in sola lettura: nessun collegamento è stato creato.');
}
function rememberReview(){
 $('review-list').querySelectorAll('[data-review-check]').forEach(input=>{
  const audioId=input.dataset.reviewCheck;
  const target=Array.from($('review-list').querySelectorAll('[data-review-project]'))
   .find(x=>x.dataset.reviewProject===audioId);
  reviewChoices.set(audioId,{checked:input.checked,projectId:target?.value||''});
 });
}
function renderReview(){
 if($('review-list').children.length)rememberReview();
 const visible=reviewItems.slice(0,reviewShown);
 $('review-status').textContent=reviewItems.length+' file con corrispondenze · '+
 reviewItems.filter(x=>x.status==='ambigua').length+' ambigui · '+Array.from(reviewChoices.values()).filter(x=>x.checked).length+' selezionati.';
 $('review-list').innerHTML=visible.map(({file,candidates,status,proposedId})=>{
  const prior=reviewChoices.get(String(file.id));const projectId=prior?.projectId??proposedId;
  const opts='<option value="">Seleziona progetto…</option>'+
   candidates.map(p=>'<option value="'+H(p.id)+'"'+(projectId===String(p.id)?' selected':'')+'>'+
   H((p.artist?p.artist+' · ':'')+p.title+' #'+p.id+' ('+p.reason+')')+'</option>').join('');
  return '<div class="review-row"><label><input type="checkbox" data-review-check="'+H(file.id)+
   '" aria-label="Conferma '+H(file.nome_file)+'" '+(prior?.checked?'checked':'')+'> <strong>'+H(file.nome_file)+'</strong></label>'+
   '<small>'+H(file.provider+' · '+file.account_label)+' · '+H(status==='ambigua'?'Ambiguo: scegliere manualmente':status==='forte'?'Titolo + artista':'Da verificare')+'</small>'+
   '<select data-review-project="'+H(file.id)+'" aria-label="Progetto per '+H(file.nome_file)+'">'+opts+'</select></div>';
 }).join('')||'<p>Nessuna corrispondenza: per un file senza suggerimenti usa il collegamento manuale nel dettaglio.</p>';
 $('review-more').hidden=reviewShown>=reviewItems.length;
}
async function saveReviewed(){
 rememberReview();
 const selections=Array.from(reviewChoices.entries()).filter(([,x])=>x.checked)
  .map(([audioId,x])=>({audioId,projectId:x.projectId}));
 const ready=R.planLinks(selections,personalCatalogue(),projects,links,owner);
 if(!confirm('Confermi '+ready.length+' associazioni audio → progetto, scelte esplicitamente? Non verrà caricato alcun audio.'))return;
 info('Controllo dei collegamenti aggiornati prima del salvataggio…');
 await fetchAll();
 const payload=R.planLinks(selections,personalCatalogue(),projects,links,owner);
 const saved=await db.from('KYV_AUDIO_ASSOCIAZIONI').insert(payload).select('id');
 if(saved.error)throw Error('Associazioni non confermate: '+saved.error.message);
 if(saved.data?.length!==payload.length)throw Error('Esito incerto: rileggi l’indice prima di riprovare.');
 await fetchAll();fillSelects();invalidateReview();render();
 info(payload.length+' collegamenti confermati; puoi annullare singolarmente dal dettaglio.');
}

function kindChanged(){
 const isProject=$('link-kind').value==='project';
 $('project-wrap').hidden=!isProject;$('session-wrap').hidden=isProject;
}
function boot(){
 $('finder-reload').addEventListener('click',refresh);
 $('finder-group-query').addEventListener('input',()=>{groupShown=24;renderGroups()});
 $('finder-group-source').addEventListener('change',()=>{groupShown=24;renderGroups()});
 $('finder-group-mode').addEventListener('change',()=>{groupShown=24;renderGroups()});
 $('finder-group-more').addEventListener('click',()=>{groupShown+=24;renderGroups()});
 $('finder-group-list').addEventListener('click',e=>{
  const b=e.target.closest('[data-group-index]');if(!b)return;
  const groups=G.filter(groupList(),{query:$('finder-group-query').value,source:$('finder-group-source').value,mode:$('finder-group-mode').value});
  const g=groups[Number(b.dataset.groupIndex)];if(g)showGroup(g.key);
 });
 $('finder-group-detail').addEventListener('change',e=>{
  if(e.target.id==='finder-group-project'){groupProject=e.target.value;return;}
  const x=e.target.closest('[data-group-file]');if(!x)return;
  if(x.checked){if(groupSelected.size>=25){x.checked=false;info('Massimo 25 versioni per conferma, poi ripeti con le successive.',true);return;}groupSelected.add(x.dataset.groupFile);}
  else groupSelected.delete(x.dataset.groupFile);
  const count=$('finder-group-selected-count');if(count)count.textContent=groupSelected.size+' selezionate';
 });
 $('finder-group-detail').addEventListener('click',e=>{
  const b=e.target.closest('[data-group-action],[data-group-open-file]');if(!b)return;
  if(b.dataset.groupOpenFile){selected=b.dataset.groupOpenFile;renderDetail();$('finder-detail').scrollIntoView({behavior:'smooth',block:'nearest'});return;}
  if(b.dataset.groupAction==='save')return run(saveGroup);
  groupSelection(b.dataset.groupAction);
 });
 $('finder-query').addEventListener('input',()=>{shown=120;render()});
 $('finder-source').addEventListener('change',()=>{shown=120;render()});
 $('finder-link-status').addEventListener('change',()=>{shown=120;render()});
 $('review-generate').addEventListener('click',()=>run(async()=>generateReview()));
 $('review-more').addEventListener('click',()=>{reviewShown+=80;renderReview()});
 $('review-save').addEventListener('click',()=>run(saveReviewed));
 $('review-list').addEventListener('change',rememberReview);
 $('finder-more').addEventListener('click',()=>{shown+=120;render()});
 $('finder-drive').addEventListener('click',()=>run(drive));
 $('finder-dropbox').addEventListener('click',()=>run(dropbox));
 $('finder-folder').addEventListener('change',e=>run(()=>local(Array.from(e.target.files||[]))));
 $('finder-files').addEventListener('change',e=>run(()=>local(Array.from(e.target.files||[]))));
 $('finder-save').addEventListener('click',()=>run(savePreview));
 $('finder-preview-list').addEventListener('change',e=>{
  const x=e.target.closest('[data-preview-choice]');if(!x)return;
  preview=C.mark(preview,Number(x.dataset.previewChoice),x.value);
  renderPreview();
 });
 $('finder-preview-more').addEventListener('click',()=>{previewShown+=60;renderPreview()});
 $('preview-mark-mine').addEventListener('click',()=>bulkPreview('mio'));
 $('preview-mark-reference').addEventListener('click',()=>bulkPreview('reference'));
 $('finder-cancel').addEventListener('click',()=>{preview=[];$('finder-preview').hidden=true;info('Anteprima scartata, nulla salvato.')});
 $('finder-list').addEventListener('click',e=>{const b=e.target.closest('[data-audio]');if(b){selected=b.dataset.audio;render()}});
 $('finder-detail').addEventListener('click',e=>{
  const b=e.target.closest('[data-suggest],[data-unlink],[data-new-project]');if(!b)return;
  if(b.dataset.suggest){$('link-kind').value='project';kindChanged();$('link-project').value=b.dataset.suggest;}
  if(b.dataset.unlink)run(()=>unlink(b.dataset.unlink));
  if(b.dataset.newProject)run(async()=>{
   const f=personalCatalogue().find(x=>String(x.id)===String(b.dataset.newProject));
   if(!f)throw Error('Prima devi approvare il file come tuo');
   if(active(f.id).some(l=>l.id_progetto!=null))throw Error('Versione già collegata: apri il collegamento esistente per verificarlo.');
   if(!window.KYV_AUDIO_PROJECT?.createFromItem)throw Error('Modulo progetti non disponibile');
   // Only a direct, human-initiated click may open the project creation workflow.
   const result=await KYV_AUDIO_PROJECT.createFromItem({
    fileName:f.nome_file,name:f.nome_file,title:f.nome_file,
    mimeType:f.mime_type||'audio/unknown',type:f.mime_type||'audio/unknown',
    provider:f.provider,
    source:f.provider==='drive'?'Google Drive':f.provider==='dropbox'?'Dropbox':'Archivio locale',
    link:f.link_file||'',fileId:f.external_key,providerId:f.external_key,
    modifiedTime:f.modificato_il||null,content_hash:f.content_hash||null
   },{db,projects});
   if(result?.ID){
    // The user's modal confirmed both creation/linking of this selected file.
    // Keep the Finder association in sync with the audio-version project.
    await fetchAll();
    if(!personalCatalogue().some(x=>String(x.id)===String(f.id)))
     throw Error('Il file non risulta più autorizzato. Progetto/versione salvati, collegamento Finder da verificare.');
    const verified=R.planLinks([{audioId:f.id,projectId:String(result.ID)}],
      personalCatalogue(),projects,links,owner);
    const linkRes=await db.from('KYV_AUDIO_ASSOCIAZIONI').insert(verified).select('id');
    if(linkRes.error||linkRes.data?.length!==1)
     throw Error('Progetto/versione salvati, ma il collegamento Finder è da completare: '+(linkRes.error?.message||'nessuna conferma'));
    await fetchAll();fillSelects();invalidateReview();render();
    info('Versione personale collegata al progetto #'+result.ID+' dopo la tua conferma.');
   }
  });
 });
 $('link-kind').addEventListener('change',kindChanged);
 $('finder-link-form').addEventListener('submit',e=>{e.preventDefault();run(associate)});
 kindChanged();
 const accounts=window.KYV_DRIVE?.accountList?.()||[];
 $('drive-account').innerHTML='<option value="all">Tutti i Drive configurati</option>'+
  accounts.map(a=>'<option value="'+H(a.id)+'"'+(a.url?'':' disabled')+'>'+H(a.label||a.id)+'</option>').join('');
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
