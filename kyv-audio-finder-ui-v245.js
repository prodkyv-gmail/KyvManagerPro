/* KYV Audio Finder v2.45 - metadata-only index, no automatic project links. */
(function(){
'use strict';
const $=id=>document.getElementById(id),F=window.KYV_AUDIO_FINDER_V245,R=window.KYV_AUDIO_REVIEW_V246,C=window.KYV_AUDIO_CONSENT_V248,G=window.KYV_AUDIO_GROUPS_V249,W=window.KYV_AUDIO_WORKSPACE_V251,I=window.KYV_AUDIO_INCREMENTAL_V252,B=window.KYV_AUDIO_BATCH_V253,J=window.KYV_AUDIO_REVIEW_BATCH_V254,A=window.KYV_AUDIO_AUDIT_V257,CLOUD=window.KYV_CLOUD_BROWSER_V258;
const T=v=>String(v??'').trim(),H=v=>T(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAX=5000,PAGE=400;
let db=null,owner='',catalogue=[],links=[],projects=[],sessions=[],decisions=[],preview=[],previewShown=60,selected=null,busy=false,shown=120,reviewItems=[],reviewShown=80,reviewChoices=new Map(),approvedKeys=new Set(),groupKey='',groupShown=24,groupFileShown=35,groupSelected=new Set(),groupProject='',explorerShown=60,transientFiles=new Map(),playerObjectUrl=null,chooserLoad=null,scanReviewGroup='',scanReviewGroupShown=24,scanChecked=new Set(),auditShown=40;
const info=(v,error=false)=>{const el=$('finder-status');el.textContent=v;el.className='finder-status'+(error?' error':'')};
const lock=v=>{busy=v;document.querySelectorAll('[data-finder-action]').forEach(el=>el.disabled=v);if(!v&&$('cloud-dropbox-status'))renderCloudStatus()};
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
 if($('explorer-account'))syncExplorerAccounts();
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
   if(f.provider==='onedrive'&&(host==='onedrive.live.com'||host==='1drv.ms'||/(^|\.)sharepoint\.com$/i.test(host)))return link;
 }catch{}return null;
}

function renderAudit(){
 // Works exclusively with data already loaded for the authenticated user.
 const data=A.report({catalogue,decisions,links,projects,preview}),stats=data.summary;
 const rows=A.filterFindings(data,{type:$('audit-type').value,source:$('audit-source').value,
   query:$('audit-query').value});
 $('audit-coverage').textContent=stats.approved+' audio personali nel catalogo · '+stats.projectsChecked+
  ' progetti letti. Scansione attuale: '+preview.length+' file; '+stats.savedPending+
  ' decisioni “da verificare” registrate (senza nomi consultabili se non indicizzati).';
 const cards=[
  [stats.pendingScan,'Audio da classificare nella scansione attuale'],
  [stats.unlinked,'Audio personali senza progetto collegato'],
  [stats.duplicateGroups,'Gruppi con SHA-256 identico ('+stats.duplicateFiles+' file)'],
  [stats.projectsWithoutApprovedAudio,'Progetti senza audio personale collegato nel catalogo']
 ];
 $('audit-kpis').innerHTML=cards.map(([count,name])=>'<div class="audit-kpi"><strong>'+
  Number(count).toLocaleString('it-IT')+'</strong><span>'+H(name)+'</span></div>').join('');
 $('audit-status').textContent=rows.length+' verifiche in elenco · '+Math.min(rows.length,auditShown)+
  ' visualizzate. Solo suggerimenti: non sono state create associazioni.';
 $('audit-items').innerHTML=rows.slice(0,auditShown).map(item=>{
  let action='';
  if(item.type==='pending')
   action='<button type="button" data-audit-pending="'+H(item.title)+'">Apri nella scansione corrente</button>';
  if(item.type==='unlinked')
   action='<button type="button" data-audit-file="'+H(item.file.id)+'">Dettaglio / collega manualmente</button>';
  if(item.type==='projects')
   action='<a href="scheda_progetto.html?id='+H(encodeURIComponent(item.project.ID))+
    '">Apri Scheda Progetto</a>';
  const copies=item.type==='duplicates'?'<div class="audit-entry-copies">'+
   item.files.slice(0,8).map(f=>'<div class="audit-entry-copy"><small>'+
   H(f.nome_file+' · '+f.provider+' · '+f.account_label)+'</small>'+
   '<div class="audit-entry-actions"><button type="button" data-audit-file="'+H(f.id)+
   '">Dettaglio audio</button></div></div>').join('')+
   (item.files.length>8?'<small>Altre '+(item.files.length-8)+
   ' copie: cercale in «Esplora i miei brani».</small>':'')+'</div>':'';
  return '<article class="audit-entry"><strong>'+H(item.title)+'</strong><small>'+
   H(item.detail)+(item.source?' · '+H(item.source):'')+
   '</small>'+copies+(action?'<div class="audit-entry-actions">'+action+'</div>':'')+'</article>';
 }).join('')||'<p class="explorer-desc">Nessun risultato per i filtri scelti. Questo non prova che tutti i cloud o dispositivi siano stati scanditi.</p>';
 $('audit-more').hidden=rows.length<=auditShown;
 $('audit-more').textContent='Mostra altre '+Math.min(40,rows.length-auditShown)+' verifiche';
}
function focusAuditPending(name){
 if($('finder-preview').hidden)throw Error('Questa scansione è stata chiusa. Avvia una nuova selezione per rivedere il file.');
 scanReviewGroup='';resetScanSelection();
 $('finder-preview-query').value=name;
 $('finder-preview-state').value='da_verificare';$('finder-sync-state').value='all';
 previewShown=60;renderPreview();
 $('finder-preview').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderExplorer(){
 const approved=explorerApproved(),stats=W.stats(approved),items=explorerRows();
 $('explorer-status').textContent=stats.total+' miei audio approvati · '+stats.linked+' collegati · '+stats.unlinked+
  ' da collegare · '+stats.bySource.local+' locali · '+stats.bySource.drive+' Drive · '+stats.bySource.dropbox+
  ' Dropbox · '+stats.bySource.onedrive+' OneDrive · '+items.length+' risultati';
 $('explorer-items').innerHTML=items.slice(0,explorerShown).map(f=>{
  const link=safeCloudLink(f),listen=f.provider==='local'&&transientFiles.has(W.KEY(f));
  return '<div class="explorer-item"><div><strong>'+H(f.nome_file)+'</strong><small>'+
   H(f.provider+' · '+f.account_label+' · '+(f.percorso_relativo||'Cartella non indicata'))+'</small>'+
   '<small>'+f.linkCount+' collegamenti · '+(f.size_bytes!=null?Number(f.size_bytes).toLocaleString('it-IT')+' byte':'Dimensione ignota')+
   '</small></div><div class="explorer-item-actions">'+
   (listen?'<button type="button" data-explorer-play="'+H(f.id)+'">Ascolta</button>':'')+
   (link?'<a href="'+H(link)+'" target="_blank" rel="noopener noreferrer">Apri in '+H(f.provider==='drive'?'Drive':f.provider==='onedrive'?'OneDrive':'Dropbox')+'</a>':'')+
   '<button type="button" data-explorer-detail="'+H(f.id)+'">Dettaglio / collega</button></div></div>';
 }).join('')||'<p class="explorer-desc">Nessun tuo audio nella ricerca. Seleziona i file da una sorgente, quindi classifica soltanto i tuoi lavori.</p>';
 $('explorer-more').hidden=items.length<=explorerShown;
 $('explorer-more').textContent='Mostra altri '+Math.min(60,items.length-explorerShown);
}
function explorerDetail(id){
 const file=explorerApproved().find(f=>String(f.id)===String(id));if(!file)throw Error('Audio non approvato');
 selected=file.id;const advanced=$('finder-advanced');if(advanced)advanced.open=true;
 renderCatalogue();$('finder-detail').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderCatalogue(){
 const personal=personalCatalogue();
 const rows=R.filterCatalogue(personal,links,{query:$('finder-query').value,source:$('finder-source').value,status:$('finder-link-status').value});
 $('finder-count').textContent=rows.length+' file trovati · '+personal.length+' tuoi brani approvati';
 $('finder-list').innerHTML=rows.slice(0,shown).map(f=>
  '<button class="finder-file'+(selected===f.id?' selected':'')+'" type="button" data-audio="'+H(f.id)+'"><strong>'+H(f.nome_file)+'</strong>'+
  '<small>'+H(f.provider+' · '+f.account_label)+'</small><small>'+H(f.percorso_relativo||'Cartella non indicata')+'</small>'+
  '<small>'+active(f.id).length+' collegamenti verificati</small></button>').join('')||'<p>Nessun file corrispondente.</p>';
 $('finder-more').hidden=rows.length<=shown;
 renderDetail();
}
function render(){
 renderCatalogue();
 renderGroups();
 renderExplorer();
 renderAudit();
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
 (f.provider==='onedrive'?'<p class="finder-note">Per OneDrive crea il nuovo progetto da Progetti, poi collegalo qui manualmente. La proposta diretta non è ancora abilitata.</p>':
 '<p><button type="button" data-new-project="'+H(f.id)+'">Apri proposta progetto / versione (solo su mia scelta)</button></p>');
}
// v2.49 — all grouping is read-only and uses approved personal audio only.
function groupList(){
 return G.groups(personalCatalogue(),links);
}
function selectedGroupView(){
 return G.scopedToProvider(groupList().find(g=>g.key===groupKey),$('finder-group-source').value,links);
}
function renderGroups(){
 const all=groupList();
 const filtered=G.filter(all,{query:$('finder-group-query').value,source:$('finder-group-source').value,mode:$('finder-group-mode').value});
 const multi=all.filter(x=>x.files.length>1).length;
 const source=$('finder-group-source').value;
 $('finder-group-count').textContent=all.length+' possibili brani · '+multi+' con più versioni · '+
  filtered.length+' gruppi nella vista. Raggruppamenti da verificare, nessuna associazione automatica.';
 $('finder-group-list').innerHTML=filtered.slice(0,groupShown).map((g,i)=>{
  const scoped=G.scopedToProvider(g,source,links);
  return '<button type="button" class="finder-group-tile'+(groupKey===g.key?' active':'')+'" data-group-index="'+i+'">'+
  '<strong>'+H(g.artist?g.artist+' · '+g.title:g.title)+'</strong>'+
  '<small>'+scoped.files.length+(source?' file della sorgente · ':' file · ')+H(scoped.versionKinds.join(', '))+'</small>'+
  '<small>'+H(g.providers.join(' + '))+(g.ambiguousArtist?' · artista ambiguo':'')+'</small>'+
  '</button>';}).join('')||'<p class="finder-note">Nessun gruppo in questa ricerca. Prova «Tutti i brani» oppure indica un altro termine.</p>';
 $('finder-group-more').hidden=filtered.length<=groupShown;
 // A filter change must not leave a hidden group or destination actionable.
 if(groupKey&&!filtered.some(g=>g.key===groupKey)){groupKey='';groupSelected.clear();groupProject='';}
 renderGroupDetail(all);
}
function renderGroupDetail(all=groupList()){
 const el=$('finder-group-detail'),g=G.scopedToProvider(all.find(x=>x.key===groupKey),$('finder-group-source').value,links);
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
  '<p class="finder-note">'+($('finder-group-source').value?'Sono mostrate e selezionabili solo le versioni della sorgente scelta. Per collegare versioni di tutti gli archivi scegli «Tutte le sorgenti». ':'')+'Queste versioni sono accostate solo per somiglianza del nome: verifica che siano davvero dello stesso lavoro prima di associarle.'+
  (g.ambiguousArtist?' Artista non dichiarato: verifica ogni file e la destinazione prima di collegare.':'')+
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
 const g=selectedGroupView();if(!g)return;
 if(action==='clear'){groupSelected.clear();renderGroupDetail();return}
 if(action==='select'){
  const candidates=G.allowedForLink(g,links).sort((a,b)=>G.versionOf(a).kind.localeCompare(G.versionOf(b).kind,'it')||a.nome_file.localeCompare(b.nome_file,'it')).slice(0,Math.min(25,groupFileShown));
  groupSelected=new Set(candidates.map(f=>String(f.id)));renderGroupDetail();
 }
 if(action==='more'){groupFileShown+=35;renderGroupDetail();}
}
async function saveGroup(){
 const source=$('finder-group-source').value;
 const g=selectedGroupView();if(!g)throw Error('Scegli un gruppo visibile');
 const chosen=[...groupSelected],projectId=groupProject;
 const destination=projects.find(p=>String(p.ID)===String(projectId));
 const plan=G.planVersionLinks({group:g,selectedIds:chosen,projectId,files:personalCatalogue(),projects,links,owner,review:R});
 const selectedNames=g.files.filter(e=>chosen.includes(String(e.file.id))).map(e=>e.file.nome_file);
 const previewNames=selectedNames.slice(0,6).map(x=>'• '+x).join('\n');
 const destinationName=destination?pn(destination):'Progetto #'+projectId;
 if(!confirm('Confermi '+plan.length+' versioni del gruppo «'+g.title+'» nella sorgente «'+(source||'Tutte')+'»\n'+
  'Progetto scelto: '+destinationName+'\n\n'+previewNames+(selectedNames.length>6?'\n… e altre '+(selectedNames.length-6):'')+
  '\n\nHai verificato che questi file appartengano proprio al progetto? Non viene creato alcun progetto.'))return;
 info('Controllo dell’indice e dei collegamenti prima del salvataggio…');
 await fetchAll();
 if($('finder-group-source').value!==source||groupKey!==g.key)
  throw Error('Sorgente o gruppo cambiati durante il controllo: riseleziona file e progetto.');
 const refreshed=G.scopedToProvider(groupList().find(x=>x.key===g.key),source,links);
 if(!refreshed)throw Error('Gruppo o sorgente non più disponibili');
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
// v2.54: group suggestions are transient and never write or assign ownership.
function scanGroups(){return J.classifyGroups(preview);}
function filteredScanGroups(){return J.filteredGroups(scanGroups(),{
 query:$('scan-group-query').value,source:$('scan-group-source').value,mode:$('scan-group-mode').value
});}
function renderScanGroups(){
 const all=scanGroups(),shownGroups=filteredScanGroups();
 $('scan-group-summary').textContent=all.length+' possibili brani, '+
  all.filter(g=>g.count>1).length+' con più versioni; '+shownGroups.length+' nella vista'+
  (scanReviewGroup?' · un gruppo aperto':'')+'. Nessun raggruppamento equivale a un progetto.';
 $('scan-group-list').innerHTML=shownGroups.slice(0,scanReviewGroupShown).map((g,i)=>
  '<button type="button" data-scan-group="'+i+'" aria-pressed="'+String(g.id===scanReviewGroup)+'">'+
  '<strong>'+H(g.artist+' · '+g.title)+'</strong>'+
  '<small>'+g.count+' file · '+H(g.versions.join(', '))+'</small>'+
  '<small>'+H(g.sources.join(' + '))+(g.artistUnknown?' · artista non dichiarato':'')+'</small>'+
  '</button>').join('')||'<p class="finder-note">Nessun gruppo in questa ricerca. Puoi cercare per file nella coda sotto.</p>';
 $('scan-group-more').hidden=shownGroups.length<=scanReviewGroupShown;
 $('scan-group-clear').hidden=!scanReviewGroup;
}
function updateScanSelected(){
 $('scan-selected-count').textContent=scanChecked.size+' file spuntati (massimo 100)';
}
function resetScanSelection(){
 scanChecked.clear();updateScanSelected();
}
function activateScanGroup(id){
 if(!scanGroups().some(g=>g.id===id))throw Error('Gruppo non più disponibile');
 scanReviewGroup=id;resetScanSelection();
 $('finder-preview-query').value='';$('finder-preview-state').value='all';$('finder-sync-state').value='all';
 previewShown=60;renderPreview();
}
function batchSelectVisible(){
 const visible=previewIndices().slice(0,previewShown);
 const indices=J.candidates(preview,visible).slice(0,100);
 scanChecked=new Set(indices);renderPreview();
 info(indices.length+' file della vista selezionati per revisione. Nessuna classificazione eseguita.');
}
function previewIndices(){
 const initial=I.filter(preview,{
  query:$('finder-preview-query').value,
  status:$('finder-sync-state').value,
  decision:$('finder-preview-state').value
 });
 return J.narrowIndices(initial,scanGroups(),scanReviewGroup);
}
const syncLabels={
 new:'Nuovo · classificazione richiesta',
 changed:'Metadati diversi · approvazione aggiornamento richiesta',
 unchanged:'Già indicizzato · metadati confrontabili invariati',
 unverified:'Già noto · revisione non verificabile dai dati disponibili',
 excluded:'Reference esclusa · nessun inserimento',
 pending:'Classificazione sospesa · nessun inserimento'
};
function renderPreview(){
 renderScanGroups();
 const indices=previewIndices(),visible=indices.slice(0,previewShown);
 const sum=I.summary(preview),selected=preview.filter(x=>x._explicit);
 $('finder-sync-summary').textContent=sum.new+' nuovi · '+sum.changed+' con metadati cambiati · '+
  sum.unchanged+' già indicizzati senza variazioni rilevate · '+sum.unverified+' senza dati di revisione · '+
  sum.excluded+' reference escluse · '+sum.pending+' in attesa di classificazione. Non vengono rimossi file mancanti.';
 $('finder-preview-count').textContent=preview.length+' file rilevati · '+indices.length+' nel filtro · '+
  selected.filter(x=>x.decision==='mio').length+' approvati ora · '+
  selected.filter(x=>x.decision==='reference').length+' reference escluse ora · '+selected.length+' decisioni esplicite';
 const knownPersonal=personalCatalogue();
 $('finder-preview-list').innerHTML=visible.map(i=>{
  const f=preview[i],listen=f.provider==='local'&&transientFiles.has(W.KEY(f)),
   state=f._sync?.state||'new',changes=f._sync?.changedFields||[];
  const hints=['new','changed'].includes(state)?B.propose(f,knownPersonal,2):[];
  const update=state==='changed'&&f.decision==='mio'&&!f._explicit,
   selectable=J.bulkEligible(f),checked=scanChecked.has(i);
  return '<div class="finder-intake-row"><div><label class="scan-selection-label">'+
   '<input type="checkbox" data-preview-select="'+i+'" '+(selectable?'':'disabled ')+
   (checked?'checked ':'')+'aria-label="Spunta '+H(f.nome_file)+' per classificazione multipla">'+
   '<strong>'+H(f.nome_file)+'</strong></label><small>'+
   H(f.provider+' · '+f.account_label+' · '+(f.percorso_relativo||'File selezionato'))+'</small>'+
   '<em>'+H(syncLabels[state]||'Da esaminare')+'</em>'+
   (changes.length?'<span class="finder-sync-meta">Differenze: '+H(changes.join(', '))+'</span>':'')+
   (hints.length?'<span class="finder-sync-meta">Possibili versioni: '+H(hints.map(x=>x.name+' ('+x.relationship+')').join(' · '))+' — verifica tu, nessun collegamento creato</span>':'')+
   (listen?'<button type="button" class="explorer-small-btn" data-preview-play="'+i+'">Ascolta file locale</button>':'')+
   (update?'<button type="button" class="finder-action-update" data-confirm-update="'+i+'">Confermo aggiornamento metadati del mio file</button>':'')+
   '</div><label>È una mia produzione?<select data-preview-choice="'+i+'">'+
   '<option value="da_verificare"'+(f.decision==='da_verificare'?' selected':'')+'>Da verificare</option>'+
   '<option value="mio"'+(f.decision==='mio'?' selected':'')+'>Sì, mio brano o collaborazione</option>'+
   '<option value="reference"'+(f.decision==='reference'?' selected':'')+'>No, reference o brano di altri</option>'+
   '</select></label></div>';
 }).join('')||'<p class="explorer-desc">Nessun file corrisponde a questo filtro. I risultati già approvati restano nel catalogo: scegli “Tutti i risultati” per visualizzarli.</p>';
 $('finder-preview-more').hidden=visible.length>=indices.length;
 updateScanSelected();
 renderAudit();
}
function previewScan(rows,note,localRefs=null,checkedUnsaved=false){
 if(!rows.length)throw Error('Nessun file audio nella selezione');
 if(rows.length>MAX)throw Error('Oltre '+MAX+' file: restringi la selezione');
 if(!checkedUnsaved&&preview.some(x=>x._explicit)&&!confirm('Ci sono classificazioni non ancora salvate. Vuoi scartarle e iniziare una nuova scansione?'))return;
 closeExplorerPlayer();transientFiles.clear();
 scanReviewGroup='';scanReviewGroupShown=24;resetScanSelection();
 $('scan-group-query').value='';$('scan-group-source').value='';$('scan-group-mode').value='review';
 if(localRefs)for(const [key,file] of localRefs)transientFiles.set(key,file);
 const compared=I.compare(rows,catalogue,decisions);
 preview=C.preview(compared,decisions);previewShown=60;
 $('finder-preview-query').value='';$('finder-preview-state').value='all';$('finder-sync-state').value='attention';
 $('finder-preview').hidden=false;
 $('finder-preview-note').textContent=preview.length+' audio rilevati. '+note+
  ' Confronto effettuato sui metadati/ID della sorgente, non sul contenuto audio. Nessun progetto o collegamento viene creato.';
 renderPreview();
 const sum=I.summary(preview);
 info('Confronto terminato: '+sum.new+' nuovi, '+sum.changed+' con metadati cambiati, '+sum.unchanged+' già noti. Nessuna modifica automatica.');
}
function bulkPreview(decision){
 // The review applies to explicitly checked, currently rendered files, not every search result.
 const selected=J.selectionPlan(preview,[...scanChecked],previewIndices().slice(0,previewShown));
 if(!selected.length)throw Error('Spunta prima i file che hai verificato nella vista');
 if(!confirm('Confermi di classificare ESATTAMENTE i '+selected.length+' file SPUNTATI come '+
  (decision==='mio'?'tuoi lavori personali':'reference non tue')+
  '? Non verrà creato, collegato o eliminato nessun progetto.'))return;
 preview=C.markMany(preview,selected,decision);
 resetScanSelection();renderPreview();
 info(selected.length+' classificazioni impostate ma NON salvate. Premi Salva dopo aver verificato le scelte.');
}
function confirmMetadataUpdate(index){
 const file=preview[index];
 if(!file||file._sync?.state!=='changed'||file.decision!=='mio')throw Error('Aggiornamento non disponibile');
 if(!confirm('Confermi che i metadati aggiornati si riferiscono ancora al tuo stesso file? Nessuna versione o progetto sarà creato automaticamente.'))return;
 preview=C.mark(preview,index,'mio');renderPreview();
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

function renderCloudStatus(){
 for(const source of ['dropbox','onedrive']){
  const state=CLOUD.status(source),ready=CLOUD.configured(source,window.KYV_CONFIG||{});
  const caption=source==='onedrive'?'OneDrive':'Dropbox';
  $('cloud-'+source+'-status').textContent=!ready?
   caption+' non configurato: controlla le credenziali pubbliche e l’URI di ritorno OAuth.':
   state.connected?caption+' collegato temporaneamente · '+state.accountLabel+
    (source==='onedrive'&&!window.KYV_CONFIG?.ONEDRIVE_INDEX_ENABLED?
     ' · Solo ricerca: salvataggio richiede migrazione provider.':''):
    'Non collegato · per cercare i file occorre una tua autorizzazione.';
  $('finder-'+source+'-connect').disabled=!ready;
  $('finder-'+source+'-disconnect').disabled=!state.connected;
  $('finder-'+(source==='onedrive'?'onedrive-search':'dropbox-online')).disabled=!state.connected;
 }
}
async function beginCloud(source){
 const url=await CLOUD.begin(source,{config:window.KYV_CONFIG||{},url:location.href,
  storage:window.sessionStorage,crypt:window.crypto});
 window.location.assign(url);
}
async function resumeCloud(){
 try{
  const result=await CLOUD.finish({url:location.href,storage:window.sessionStorage,
   fetcher:window.fetch.bind(window),config:window.KYV_CONFIG||{},
   historyReplace:path=>history.replaceState(null,'',path)});
  if(result.handled)info(result.provider+' autorizzato per questa pagina. Avvia tu la ricerca: nessuna scansione automatica.');
 }catch(e){info('Autorizzazione cloud non completata: '+(e?.message||e),true);}
 renderCloudStatus();
}
function guardScanChanges(){
 if(preview.some(f=>f._explicit)&&
   !confirm('Ci sono classificazioni audio non salvate. Vuoi scartarle e iniziare una nuova ricerca cloud?'))return false;
 return true;
}
async function onlineDropbox(){
 if(!guardScanChanges())return;
 info('Dropbox online: lettura dei soli metadati della cartella richiesta…');
 const r=await CLOUD.scanDropbox({path:$('finder-dropbox-folder').value,
  fetcher:window.fetch.bind(window),pages:10,maxEntries:5000});
 const note='Ricerca Dropbox online nella cartella '+r.scope+'. '+r.entriesSeen+
  ' elementi esaminati'+(r.truncated?' · SCANSIONE PARZIALE / da verificare.':' · pagine lette.')+
  (r.errors.length?' Avvisi: '+r.errors.join(' · '):'')+
  ' Dropbox content_hash NON è SHA-256 del contenuto: nessun hash viene attribuito per supposizione.';
 if(!r.rows.length){info('Nessun audio Dropbox trovato nei metadati. '+note,true);return;}
 previewScan(r.rows,note,null,true);
 $('finder-preview').scrollIntoView({behavior:'smooth',block:'start'});
}
async function onlineOneDrive(){
 if(!guardScanChanges())return;
 if(!CLOUD.configured('onedrive',window.KYV_CONFIG||{}))throw Error('Configura prima Microsoft Entra e il client ID pubblico');
 info('OneDrive Graph: ricerca manuale per parola chiave…');
 const r=await CLOUD.scanOneDrive({query:$('finder-onedrive-query').value,
  fetcher:window.fetch.bind(window),pages:8,maxEntries:3000});
 const note='OneDrive Graph: '+r.entriesSeen+' risultati esaminati con Files.Read.'+
  (r.truncated?' Ricerca parziale, limite di pagine o errore.':' Pagine lette.')+
  (r.errors.length?' Avvisi: '+r.errors.join(' · '):'')+
  (!window.KYV_CONFIG?.ONEDRIVE_INDEX_ENABLED?
   ' ATTENZIONE: sola anteprima. Salvataggio disattivato fino alla migrazione SQL e attivazione esplicita del provider.':'');
 if(!r.rows.length){info('Nessun audio OneDrive nel risultato della ricerca. '+note,true);return;}
 previewScan(r.rows,note,null,true);
 $('finder-preview').scrollIntoView({behavior:'smooth',block:'start'});
}
async function readDriveRecords(){
 if(!window.KYV_DRIVE?.listFiles)throw Error('Connettore Google Drive non disponibile');
 const r=await KYV_DRIVE.listFiles({accountId:$('drive-account').value||'all',pages:12,audioOnly:true});
 let invalid=0;
 const rows=(r.files||[]).map(f=>{
  const id=T(f.id),account=T(f.driveEmail||f.driveAccount||f.driveLabel);
  if(!id||!account||!F.isAudio(f.name,f.mimeType)){invalid++;return null;}
  try{return F.record({provider:'drive',account,externalKey:id,name:f.name,path:f.folder||'',mime:f.mimeType,
    size:f.size,modified:f.updated,url:f.webViewLink||f.url||null});}catch{invalid++;return null}
 }).filter(Boolean);
 const errors=[...(r.errors||[])];
 if(invalid)errors.push(invalid+' file Drive con metadati non validi esclusi');
 return {rows,errors,truncated:Boolean(r.truncated)};
}
async function drive(){
 info('Lettura Google Drive in corso…');
 const r=await readDriveRecords();
 if(r.errors.length)throw Error('Drive non letto completamente: '+r.errors.join('; '));
 previewScan(r.rows,r.truncated?'Scansione Drive PARZIALE: limite di 12 pagine raggiunto; file non trovati non eliminati.':
  'Google Drive: i file assenti dalla scansione non vengono eliminati.');
}
async function readDropboxRecords(){
 const rows=await all('DROPBOX_AUDIO_FILES','ID_FILE,Nome_File,Link_Dropbox,Hash_SHA256,created_at','ID_FILE');
 let invalid=0;
 const data=rows.map(f=>{
  try{return F.record({provider:'dropbox',account:'Archivio Dropbox KYV',
   externalKey:'id:'+f.ID_FILE,name:f.Nome_File||'',hash:f.Hash_SHA256,url:f.Link_Dropbox,
   modified:f.created_at,origin:'archivio'});}
  catch{invalid++;return null}
 }).filter(Boolean);
 return {rows:data,errors:invalid?[invalid+' righe Dropbox senza audio/identità validi escluse']:[],truncated:false};
}
async function dropbox(){
 info('Lettura archivio Dropbox…');
 const result=await readDropboxRecords();
 previewScan(result.rows,result.errors.length?
  'Archivio Dropbox con risultati esclusi: '+result.errors.join('; ')+'. Non è una scansione di tutto l’account.':
  'La ricerca usa solo gli audio già registrati: non esplora l’intero Dropbox.');
}
async function batchCloud(){
 const driveSelected=$('batch-drive').checked,dropboxSelected=$('batch-dropbox').checked;
 if(!driveSelected&&!dropboxSelected)throw Error('Seleziona almeno una sorgente cloud');
 if(preview.some(f=>f._explicit)&&
   !confirm('Hai classificazioni non salvate. Vuoi scartarle e avviare una nuova ricerca sulle sorgenti selezionate?'))return;
 $('batch-status').textContent='Lettura delle sorgenti selezionate in corso…';
 $('batch-warnings').textContent='';
 info('Scansione cloud guidata in corso…');
 await fetchAll();
 const result=await B.scan({drive:driveSelected,dropbox:dropboxSelected,
  driveReader:readDriveRecords,dropboxReader:readDropboxRecords,limit:MAX});
 $('batch-status').textContent='Ricerca completata: '+result.total+' file distinti per identità sorgente.\n'+
  result.reports.map(x=>x.label+': '+x.unique+' file unici · '+x.redundant+
   ' ripetizioni stessa identità · '+(x.status==='complete'?'letti senza errori':x.status==='error'?'lettura non riuscita':'lettura parziale')).join('\n');
 $('batch-warnings').textContent=result.warnings.join('\n')||
  'Nessuna anomalia segnalata dalle sorgenti selezionate.';
 if(!result.rows.length){
  info('Nessun file audio utilizzabile dalle sorgenti selezionate. Nessun dato modificato.',true);return;
 }
 const warnings=result.partial?'ATTENZIONE: alcune fonti sono parziali o non disponibili. La coda mostra soltanto i file effettivamente trovati. ':'';
 previewScan(result.rows,warnings+
  'Risultati unificati per identità sorgente (non per titolo). Conferma solo i tuoi lavori; nessuna creazione o aggiornamento automatici.',null,true);
 $('finder-preview').scrollIntoView({behavior:'smooth',block:'start'});
}
function ensureChooser(){
 if(window.Dropbox?.choose)return Promise.resolve(window.Dropbox);
 if(chooserLoad)return chooserLoad;
 const key=T(window.KYV_CONFIG?.DROPBOX_APP_KEY);
 if(!key)throw Error('Dropbox Chooser non configurato. Usa l’archivio Dropbox esistente.');
 chooserLoad=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.id='dropboxjs';
  script.src='https://www.dropbox.com/static/api/2/dropins.js';
  script.setAttribute('data-app-key',key);
  const timer=setTimeout(()=>reject(Error('Dropbox non ha risposto: verifica rete e dominio autorizzato.')),12000);
  script.onload=()=>{clearTimeout(timer);window.Dropbox?.choose?resolve(window.Dropbox):reject(Error('Dropbox Chooser non disponibile'));};
  script.onerror=()=>{clearTimeout(timer);reject(Error('Impossibile caricare il selettore Dropbox'));};
  document.head.appendChild(script);
 }).catch(e=>{chooserLoad=null;document.getElementById('dropboxjs')?.remove();throw e;});
 return chooserLoad;
}
async function chooseDropbox(){
 const chooser=await ensureChooser();
 chooser.choose({
  success:files=>run(async()=>{
   const chosen=(files||[]).map(W.chooserItem).filter(Boolean);
   if(!chosen.length)throw Error('Nessun audio Dropbox valido selezionato');
   const rows=[];
   for(const file of chosen){
    const old=catalogue.find(x=>x.provider==='dropbox'&&x.link_file===file.link);
    let identity=file.id;
    if(!identity){
     if(!crypto?.subtle)throw Error('Connessione HTTPS richiesta per identificare il link Dropbox');
     const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(file.link));
     identity='chooser:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    }
    rows.push(F.record({provider:'dropbox',account:old?.account_label||'Dropbox Chooser',
     externalKey:old?.external_key||identity,name:file.name,size:file.size,url:file.link,origin:'selezione-chooser'}));
   }
   previewScan(rows,'File selezionati nel Chooser ufficiale. Non è una ricerca dell’intero account e non crea progetti.');
  }),
  cancel(){info('Selezione Dropbox annullata. Nessun dato salvato.');},
  linkType:'preview',multiselect:true,extensions:['audio']
 });
}
async function local(files){
 if(!files.length)throw Error('Seleziona cartella o file');
 if(files.length>MAX)throw Error('Seleziona meno di '+MAX+' file');
 const label=T($('local-label').value);
 if(label.length<2||label.length>180)throw Error('Indica un nome per il tuo archivio locale');
 if(!crypto?.subtle)throw Error('L’identità locale richiede HTTPS');
 info('Lettura dei soli metadati selezionati…');
 const data=[],localRefs=new Map();
 for(const f of files){
  if(!F.isAudio(f.name,f.type))continue;
  const relative=T(f.webkitRelativePath||f.name).replaceAll('\\','/');
  const segments=relative.split('/').filter(Boolean);
  const path=segments.length>2?segments.slice(1,-1).join('/'):'';
  const input=new TextEncoder().encode(relative+'|'+f.size+'|'+f.lastModified);
  const digest=await crypto.subtle.digest('SHA-256',input);
  const key=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  const record=F.record({provider:'local',account:label,externalKey:key,name:f.name,path,mime:f.type,
   size:f.size,modified:new Date(f.lastModified).toISOString(),origin:'selezione'});
  data.push(record);localRefs.set(W.KEY(record),f);
 }
 previewScan(data,'Le cartelle locali, anche OneDrive sincronizzate, devono essere selezionate da te. Non salviamo percorsi assoluti.',localRefs);
}
async function savePreview(){
 const approvedSelections=preview.filter(f=>f._explicit);
 if(!approvedSelections.length){
  info('Nessuna classificazione o modifica selezionata: i file già noti sono rimasti invariati. Nessun dato salvato.');return;
 }
 const plan=C.plan(I.safeRows(preview),owner);
 if(plan.changes.some(f=>f.provider==='onedrive')&&!window.KYV_CONFIG?.ONEDRIVE_INDEX_ENABLED)
  throw Error('Salvataggio OneDrive disattivato: esegui prima la migrazione SQL v2.58 e abilita ONEDRIVE_INDEX_ENABLED nella configurazione.');
 if(!confirm('Confermi '+plan.approved.length+' tuoi file da indicizzare o aggiornare, '+plan.excluded+
  ' reference escluse e '+plan.pending+' da verificare? Il programma non crea progetti, non cancella file e non carica audio.'))return;
 info('Verifica dell’indice aggiornato prima del salvataggio…');
 // Re-read to avoid overwriting decisions/revisions changed by another session.
 await fetchAll();
 const indexByKey=new Map(catalogue.map(f=>[C.key(f),f]));
 const decisionByKey=new Map(decisions.map(f=>[C.key(f),f.decision]));
 for(const f of approvedSelections){
  const key=C.key(f),previous=f._previous||null,latest=indexByKey.get(key)||null;
  const before=f._sync?.previousDecision||'da_verificare',now=decisionByKey.get(key)||'da_verificare';
  if(before!==now)throw Error('La classificazione è cambiata da un altro accesso. Rileggi la sorgente prima di aggiornare.');
  if(Boolean(previous)!==Boolean(latest)||
   (previous&&latest&&(I.differs(previous,latest).length||I.differs(latest,previous).length)))
   throw Error('I metadati sono stati modificati da un altro accesso. Rileggi la sorgente prima di salvare.');
 }
 // Decisions first; an interrupted second step never creates projects or binary uploads.
 for(let i=0;i<plan.changes.length;i+=100){
  const r=await db.from('KYV_AUDIO_DECISIONI').upsert(plan.changes.slice(i,i+100),
   {onConflict:'owner_id,provider,account_label,external_key'});
  if(r.error)throw Error('Classificazioni non completamente salvate: '+r.error.message+'. Rileggi e verifica prima di ripetere.');
 }
 for(let i=0;i<plan.approved.length;i+=100){
  const rows=plan.approved.slice(i,i+100).map(x=>I.preserveRecord(x,indexByKey.get(C.key(x))));
  const r=await db.from('KYV_AUDIO_INDICE').upsert(rows,
   {onConflict:'owner_id,provider,account_label,external_key'}).select('id');
  if(r.error||r.data?.length!==rows.length)
   throw Error('Indicizzazione non completamente confermata: '+(r.error?.message||'risultato non verificato')+'. Rileggi prima di ripetere.');
 }
 preview=[];scanReviewGroup='';resetScanSelection();$('finder-preview').hidden=true;
 await fetchAll();fillSelects();invalidateReview();render();
 info(plan.approved.length+' file personali confermati/aggiornati; '+plan.excluded+
  ' reference escluse. Nessun progetto creato o collegamento modificato.');
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
 // The source sections are optional, but anchor navigation always reveals the requested section.
 const jumpIds=['finder-sources-details','finder-audit-details','finder-review-details','finder-version-groups-details','finder-advanced'];
 const revealJump=id=>{
  if(!jumpIds.includes(id))return;
  const node=$(id);
  if(node?.tagName==='DETAILS')node.open=true;
  for(let parent=node?.parentElement;parent;parent=parent.parentElement)
   if(parent.tagName==='DETAILS')parent.open=true;
 };
 document.querySelectorAll('[data-finder-jump]').forEach(link=>
  link.addEventListener('click',()=>revealJump(link.dataset.finderJump)));
 const initialHash=decodeURIComponent(location.hash.slice(1));
 if(initialHash==='finder-sources')revealJump('finder-sources-details');
 else revealJump(initialHash);
 window.addEventListener('hashchange',()=>{
  const hash=decodeURIComponent(location.hash.slice(1));
  revealJump(hash==='finder-sources'?'finder-sources-details':hash);
 });
 $('finder-reload').addEventListener('click',refresh);
 for(const source of ['dropbox','onedrive']){
  $('finder-'+source+'-connect').addEventListener('click',()=>run(()=>beginCloud(source)));
  $('finder-'+source+'-disconnect').addEventListener('click',()=>{
   CLOUD.disconnect(source);renderCloudStatus();
   info('Sessione '+source+' scollegata da questa pagina. Nessun file modificato.');
  });
 }
 $('finder-dropbox-online').addEventListener('click',()=>run(onlineDropbox));
 $('finder-onedrive-search').addEventListener('click',()=>run(onlineOneDrive));

 $('audit-query').addEventListener('input',()=>{auditShown=40;renderAudit()});
 $('audit-type').addEventListener('change',()=>{auditShown=40;renderAudit()});
 $('audit-source').addEventListener('change',()=>{auditShown=40;renderAudit()});
 $('audit-more').addEventListener('click',()=>{auditShown+=40;renderAudit()});
 $('audit-items').addEventListener('click',e=>{
  const file=e.target.closest('[data-audit-file]');
  const pending=e.target.closest('[data-audit-pending]');
  if(file)return explorerDetail(file.dataset.auditFile);
  if(pending)return run(()=>focusAuditPending(pending.dataset.auditPending));
 });
 $('explorer-query').addEventListener('input',()=>{explorerShown=60;renderExplorer()});
 $('explorer-source').addEventListener('change',()=>{explorerShown=60;syncExplorerAccounts();renderExplorer()});
 $('explorer-account').addEventListener('change',()=>{explorerShown=60;renderExplorer()});
 $('explorer-linked').addEventListener('change',()=>{explorerShown=60;renderExplorer()});
 $('explorer-sort').addEventListener('change',()=>{explorerShown=60;renderExplorer()});
 $('explorer-more').addEventListener('click',()=>{explorerShown+=60;renderExplorer()});
 $('explorer-stop').addEventListener('click',closeExplorerPlayer);
 $('explorer-items').addEventListener('click',e=>{
  const detail=e.target.closest('[data-explorer-detail]'),listen=e.target.closest('[data-explorer-play]');
  if(detail)return explorerDetail(detail.dataset.explorerDetail);
  if(listen)run(()=>openLocalAudio(listen.dataset.explorerPlay));
 });
 window.addEventListener('pagehide',()=>{closeExplorerPlayer();transientFiles.clear()});

 $('finder-group-query').addEventListener('input',()=>{groupShown=24;renderGroups()});
 $('finder-group-source').addEventListener('change',()=>{groupShown=24;groupSelected.clear();groupProject='';renderGroups()});
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
  if(b.dataset.groupOpenFile){selected=b.dataset.groupOpenFile;$('finder-advanced').open=true;renderCatalogue();$('finder-detail').scrollIntoView({behavior:'smooth',block:'nearest'});return;}
  if(b.dataset.groupAction==='save')return run(saveGroup);
  groupSelection(b.dataset.groupAction);
 });
 $('finder-query').addEventListener('input',()=>{shown=120;renderCatalogue()});
 $('finder-source').addEventListener('change',()=>{shown=120;renderCatalogue()});
 $('finder-link-status').addEventListener('change',()=>{shown=120;renderCatalogue()});
 $('review-generate').addEventListener('click',()=>run(async()=>generateReview()));
 $('review-more').addEventListener('click',()=>{reviewShown+=80;renderReview()});
 $('review-save').addEventListener('click',()=>run(saveReviewed));
 $('review-list').addEventListener('change',rememberReview);
 $('finder-more').addEventListener('click',()=>{shown+=120;renderCatalogue()});
 $('finder-drive').addEventListener('click',()=>run(drive));
 $('batch-scan').addEventListener('click',()=>run(batchCloud));
 $('finder-dropbox').addEventListener('click',()=>run(dropbox));
 $('finder-dropbox-choose').addEventListener('click',()=>run(chooseDropbox));
 $('finder-folder').addEventListener('change',e=>run(()=>local(Array.from(e.target.files||[]))));
 $('finder-files').addEventListener('change',e=>run(()=>local(Array.from(e.target.files||[]))));
 $('finder-save').addEventListener('click',()=>run(savePreview));
 $('finder-preview-list').addEventListener('change',e=>{
  const checked=e.target.closest('[data-preview-select]');
  if(checked){
   const index=Number(checked.dataset.previewSelect);
   if(checked.checked){
    if(scanChecked.size>=100){checked.checked=false;info('Massimo 100 file spuntati. Esamina il resto separatamente.',true);return;}
    if(!J.bulkEligible(preview[index])){checked.checked=false;info('Il file richiede la classificazione individuale.',true);return;}
    scanChecked.add(index);
   }else scanChecked.delete(index);
   updateScanSelected();return;
  }
  const x=e.target.closest('[data-preview-choice]');if(!x)return;
  const index=Number(x.dataset.previewChoice);scanChecked.delete(index);
  preview=C.mark(preview,index,x.value);renderPreview();
 });
 $('finder-preview-more').addEventListener('click',()=>{previewShown+=60;renderPreview()});
 $('finder-preview-query').addEventListener('input',()=>{previewShown=60;resetScanSelection();renderPreview()});
 $('finder-preview-state').addEventListener('change',()=>{previewShown=60;resetScanSelection();renderPreview()});
 $('finder-sync-state').addEventListener('change',()=>{previewShown=60;resetScanSelection();renderPreview()});
 $('finder-preview-list').addEventListener('click',e=>{
  const update=e.target.closest('[data-confirm-update]');
  if(update){confirmMetadataUpdate(Number(update.dataset.confirmUpdate));return;}
  const b=e.target.closest('[data-preview-play]');if(b)run(()=>listenPreview(Number(b.dataset.previewPlay)));
 });
 $('scan-group-query').addEventListener('input',()=>{scanReviewGroup='';scanReviewGroupShown=24;previewShown=60;resetScanSelection();renderPreview()});
 $('scan-group-source').addEventListener('change',()=>{scanReviewGroup='';scanReviewGroupShown=24;previewShown=60;resetScanSelection();renderPreview()});
 $('scan-group-mode').addEventListener('change',()=>{scanReviewGroup='';scanReviewGroupShown=24;previewShown=60;resetScanSelection();renderPreview()});
 $('scan-group-more').addEventListener('click',()=>{scanReviewGroupShown+=24;renderScanGroups()});
 $('scan-group-clear').addEventListener('click',()=>{scanReviewGroup='';resetScanSelection();previewShown=60;renderPreview()});
 $('scan-group-list').addEventListener('click',e=>{
  const button=e.target.closest('[data-scan-group]');if(!button)return;
  const group=filteredScanGroups()[Number(button.dataset.scanGroup)];
  if(group)activateScanGroup(group.id);
 });
 $('scan-select-visible').addEventListener('click',batchSelectVisible);
 $('scan-clear-selected').addEventListener('click',()=>{resetScanSelection();renderPreview()});
 $('preview-mark-mine').addEventListener('click',()=>run(()=>bulkPreview('mio')));
 $('preview-mark-reference').addEventListener('click',()=>run(()=>bulkPreview('reference')));
 $('finder-cancel').addEventListener('click',()=>{preview=[];scanReviewGroup='';resetScanSelection();$('finder-preview').hidden=true;closeExplorerPlayer();transientFiles.clear();renderExplorer();renderAudit();info('Anteprima scartata, nulla salvato.')});
 $('finder-list').addEventListener('click',e=>{const b=e.target.closest('[data-audio]');if(b){selected=b.dataset.audio;render()}});
 $('finder-detail').addEventListener('click',e=>{
  const b=e.target.closest('[data-suggest],[data-unlink],[data-new-project]');if(!b)return;
  if(b.dataset.suggest){$('link-kind').value='project';kindChanged();$('link-project').value=b.dataset.suggest;}
  if(b.dataset.unlink)run(()=>unlink(b.dataset.unlink));
  if(b.dataset.newProject)run(async()=>{
   const f=personalCatalogue().find(x=>String(x.id)===String(b.dataset.newProject));
   if(!f)throw Error('Prima devi approvare il file come tuo');
   if(f.provider==='onedrive')throw Error('Per OneDrive crea il progetto manualmente da Progetti e collegalo qui; nessuna archiviazione compatibile non verificata.');
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
 resumeCloud();
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
