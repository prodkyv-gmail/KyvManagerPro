/* KYV Audio Finder v2.45 - metadata-only index, no automatic project links. */
(function(){
'use strict';
const $=id=>document.getElementById(id),F=window.KYV_AUDIO_FINDER_V245,R=window.KYV_AUDIO_REVIEW_V246,C=window.KYV_AUDIO_CONSENT_V248;
const T=v=>String(v??'').trim(),H=v=>T(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAX=5000,PAGE=400;
let db=null,owner='',catalogue=[],links=[],projects=[],sessions=[],decisions=[],preview=[],previewShown=60,selected=null,busy=false,shown=120,reviewItems=[],reviewShown=80,reviewChoices=new Map();
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
  all('KYV_AUDIO_INDICE','id,provider,account_label,external_key,nome_file,percorso_relativo,mime_type,size_bytes,content_hash,link_file,origine,ultimo_avvistamento','ultimo_avvistamento'),
  all('KYV_AUDIO_ASSOCIAZIONI','id,id_audio,id_progetto,id_sessione,confermata,annullata,metodo,created_at','created_at'),
  all('PROGETTI','ID,TITOLO,ARTISTA','ID'),
  all('KYV_SESSIONI','id,titolo,data_sessione,archiviata','data_sessione'),
  all('KYV_AUDIO_DECISIONI','provider,account_label,external_key,decision','updated_at')
 ]);
}
const pn=p=>(p.ARTISTA?p.ARTISTA+' · ':'')+(p.TITOLO||'Senza titolo')+' #'+p.ID;
const sn=p=>(p.titolo||'Sessione')+' · '+(p.data_sessione||'');
const active=id=>links.filter(l=>l.id_audio===id&&!l.annullata);
const personalCatalogue=()=>catalogue.filter(f=>C.isAllowed(f,decisions));
function fillSelects(){
 const make=(arr,id,name)=>'<option value="">Seleziona</option>'+arr.map(p=>'<option value="'+H(id(p))+'">'+H(name(p))+'</option>').join('');
 $('link-project').innerHTML=make(projects,p=>p.ID,pn);
 $('link-session').innerHTML=make(sessions.filter(s=>!s.archiviata),p=>p.id,sn);
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
}
function renderDetail(){
 const f=personalCatalogue().find(x=>x.id===selected);$('link-panel').hidden=!f;
 if(!f){$('finder-detail').innerHTML='<p>Seleziona un file indicizzato per visualizzare i suggerimenti e collegarlo a un progetto o una sessione.</p>';return}
 const a=active(f.id),suggest=F.suggestions(f,projects);
 const url=f.link_file?F.safeUrl(f.link_file):null;
 const link=url?'<a href="'+H(url)+'" target="_blank" rel="noopener noreferrer">Apri file nella sorgente</a>':'<small>File locale: per aprirlo devi riselezionarlo dal computer.</small>';
 const same=F.duplicates(f,catalogue).sameHash.filter(x=>x.id!==f.id);
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
function renderPreview(){
 const visible=preview.slice(0,previewShown);
 const changed=preview.filter(x=>x._explicit);
 const mine=changed.filter(x=>x.decision==='mio').length;
 const references=changed.filter(x=>x.decision==='reference').length;
 $('finder-preview-count').textContent=preview.length+' audio trovati · '+mine+' tuoi selezionati · '+references+' reference escluse · '+changed.length+' decisioni esplicite';
 $('finder-preview-list').innerHTML=visible.map((f,i)=>
 '<div class="finder-intake-row"><div><strong>'+H(f.nome_file)+'</strong><small>'+H(f.provider+' · '+f.account_label+' · '+(f.percorso_relativo||'File selezionato'))+'</small></div>'+
 '<label>È una mia produzione?<select data-preview-choice="'+i+'">'+
 '<option value="da_verificare"'+(f.decision==='da_verificare'?' selected':'')+'>Da verificare</option>'+
 '<option value="mio"'+(f.decision==='mio'?' selected':'')+'>Sì, è un mio brano / collaborazione</option>'+
 '<option value="reference"'+(f.decision==='reference'?' selected':'')+'>No, reference o brano di altri</option>'+
 '</select></label></div>').join('');
 $('finder-preview-more').hidden=previewShown>=preview.length;
}
function previewScan(rows,note){
 if(!rows.length)throw Error('Nessun file audio nella selezione');
 if(rows.length>MAX)throw Error('Oltre '+MAX+' file: restringi la selezione');
 preview=C.preview(rows,decisions);previewShown=60;
 $('finder-preview').hidden=false;
 $('finder-preview-note').textContent=preview.length+' file audio rilevati. '+note+' Nessun file o progetto viene creato prima della tua scelta.';
 renderPreview();info('Ricerca completata. Classifica solo le tue produzioni prima di salvare.');
}
function bulkPreview(decision){
 const indices=preview.slice(0,Math.min(100,previewShown)).map((_,i)=>i);
 if(!indices.length)return;
 if(!confirm('Confermi la classificazione di '+indices.length+' file come '+(decision==='mio'?'tuoi lavori':'reference da escludere')+'?'))return;
 preview=C.markMany(preview,indices,decision);renderPreview();
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
 reviewItems=R.queue(personalCatalogue(),projects,links);
 reviewShown=80;$('review-panel').hidden=false;renderReview();
 info('Proposte generate in sola lettura: nessun collegamento è stato creato.');
}
function renderReview(){
 const visible=reviewItems.slice(0,reviewShown);
 $('review-status').textContent=reviewItems.length+' file con corrispondenze · '+
 reviewItems.filter(x=>x.status==='ambigua').length+' ambigui. Le caselle di conferma sono tutte vuote.';
 $('review-list').innerHTML=visible.map(({file,candidates,status,proposedId})=>{
  const opts='<option value="">Seleziona progetto…</option>'+
   candidates.map(p=>'<option value="'+H(p.id)+'"'+(proposedId===String(p.id)?' selected':'')+'>'+
   H((p.artist?p.artist+' · ':'')+p.title+' #'+p.id+' ('+p.reason+')')+'</option>').join('');
  return '<div class="review-row"><label><input type="checkbox" data-review-check="'+H(file.id)+
   '" aria-label="Conferma '+H(file.nome_file)+'"> <strong>'+H(file.nome_file)+'</strong></label>'+
   '<small>'+H(file.provider+' · '+file.account_label)+' · '+H(status==='ambigua'?'Ambiguo: scegliere manualmente':status==='forte'?'Titolo + artista':'Da verificare')+'</small>'+
   '<select data-review-project="'+H(file.id)+'" aria-label="Progetto per '+H(file.nome_file)+'">'+opts+'</select></div>';
 }).join('')||'<p>Nessuna corrispondenza: per un file senza suggerimenti usa il collegamento manuale nel dettaglio.</p>';
 $('review-more').hidden=reviewShown>=reviewItems.length;
}
async function saveReviewed(){
 const selections=Array.from(document.querySelectorAll('[data-review-check]:checked')).map(input=>{
  const audioId=input.dataset.reviewCheck;
  const target=Array.from(document.querySelectorAll('[data-review-project]')).find(x=>x.dataset.reviewProject===audioId);
  return {audioId,projectId:target?.value||''};
 });
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
 $('finder-query').addEventListener('input',()=>{shown=120;render()});
 $('finder-source').addEventListener('change',()=>{shown=120;render()});
 $('finder-link-status').addEventListener('change',()=>{shown=120;render()});
 $('review-generate').addEventListener('click',()=>run(async()=>generateReview()));
 $('review-more').addEventListener('click',()=>{reviewShown+=80;renderReview()});
 $('review-save').addEventListener('click',()=>run(saveReviewed));
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
   if(!window.KYV_AUDIO_PROJECT?.createFromItem)throw Error('Modulo progetti non disponibile');
   // Only a direct, human-initiated click may open the project creation workflow.
   const result=await KYV_AUDIO_PROJECT.createFromItem({
    fileName:f.nome_file,name:f.nome_file,title:f.nome_file,
    source:f.provider==='drive'?'Google Drive':f.provider==='dropbox'?'Dropbox':'Archivio locale',
    link:f.link_file||'',fileId:f.external_key,providerId:f.external_key
   },{db,projects});
   if(result?.ID){await fetchAll();fillSelects();render();info('Progetto/verifica conclusa per '+f.nome_file+'.');}
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
