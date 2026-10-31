/* KYV Audio Finder v2.45 - metadata-only index, no automatic project links. */
(function(){
'use strict';
const $=id=>document.getElementById(id),F=window.KYV_AUDIO_FINDER_V245;
const T=v=>String(v??'').trim(),H=v=>T(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAX=5000,PAGE=400;
let db=null,owner='',catalogue=[],links=[],projects=[],sessions=[],preview=[],selected=null,busy=false,shown=120;
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
 [catalogue,links,projects,sessions]=await Promise.all([
  all('KYV_AUDIO_INDICE','id,provider,account_label,external_key,nome_file,percorso_relativo,mime_type,size_bytes,content_hash,link_file,origine,ultimo_avvistamento','ultimo_avvistamento'),
  all('KYV_AUDIO_ASSOCIAZIONI','id,id_audio,id_progetto,id_sessione,confermata,annullata,metodo,created_at','created_at'),
  all('PROGETTI','ID,TITOLO,ARTISTA','ID'),
  all('KYV_SESSIONI','id,titolo,data_sessione,archiviata','data_sessione')
 ]);
}
const pn=p=>(p.ARTISTA?p.ARTISTA+' · ':'')+(p.TITOLO||'Senza titolo')+' #'+p.ID;
const sn=p=>(p.titolo||'Sessione')+' · '+(p.data_sessione||'');
const active=id=>links.filter(l=>l.id_audio===id&&!l.annullata);
function fillSelects(){
 const make=(arr,id,name)=>'<option value="">Seleziona</option>'+arr.map(p=>'<option value="'+H(id(p))+'">'+H(name(p))+'</option>').join('');
 $('link-project').innerHTML=make(projects,p=>p.ID,pn);
 $('link-session').innerHTML=make(sessions.filter(s=>!s.archiviata),p=>p.id,sn);
}
function render(){
 const q=F.norm($('finder-query').value),source=$('finder-source').value;
 const rows=catalogue.filter(f=>(!source||f.provider===source)&&(!q||F.norm([f.nome_file,f.percorso_relativo,f.account_label].join(' ')).includes(q)));
 $('finder-count').textContent=rows.length+' file trovati · '+catalogue.length+' nel catalogo';
 $('finder-list').innerHTML=rows.slice(0,shown).map(f=>
  '<button class="finder-file'+(selected===f.id?' selected':'')+'" type="button" data-audio="'+H(f.id)+'"><strong>'+H(f.nome_file)+'</strong>'+
  '<small>'+H(f.provider+' · '+f.account_label)+'</small><small>'+H(f.percorso_relativo||'Cartella non indicata')+'</small>'+
  '<small>'+active(f.id).length+' collegamenti verificati</small></button>').join('')||'<p>Nessun file corrispondente.</p>';
 $('finder-more').hidden=rows.length<=shown;
 renderDetail();
}
function renderDetail(){
 const f=catalogue.find(x=>x.id===selected);$('link-panel').hidden=!f;
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
 (same.length?'<p>Possibili duplicati da hash identico: '+H(same.slice(0,8).map(x=>x.nome_file).join(' · '))+'</p>':'');
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
  await fetchAll();fillSelects();
  const params=new URLSearchParams(location.search);
  const project=params.get('project'),session=params.get('session');
  if(project&&projects.some(p=>String(p.ID)===project)){$('link-kind').value='project';kindChanged();$('link-project').value=project;}
  if(session&&sessions.some(p=>p.id===session&&!p.archiviata)){$('link-kind').value='session';kindChanged();$('link-session').value=session;}
  render();info(catalogue.length+' file indicizzati. Nessuna scansione automatica attiva.');
 });
}
function previewScan(rows,note){
 if(!rows.length)throw Error('Nessun file audio nella selezione');
 if(rows.length>MAX)throw Error('Oltre '+MAX+' file: restringi la selezione');
 const keys=new Set();preview=rows.filter(f=>{const id=[f.provider,f.account_label,f.external_key].join('\0');if(keys.has(id))return false;keys.add(id);return true});
 $('finder-preview').hidden=false;
 $('finder-preview-note').textContent=preview.length+' file audio rilevati. '+note+' Nessun audio sarà caricato nel database.';
 $('finder-preview-list').textContent=preview.slice(0,15).map(f=>f.nome_file).join(' · ')+(preview.length>15?' …':'');
 info('Ricerca completata. Conferma “Salva metadati” per indicizzare.');
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
 if(!preview.length)throw Error('Nessuna anteprima da salvare');
 if(!confirm('Salvare i metadati di '+preview.length+' file? Non verranno caricati audio.'))return;
 const rows=preview.map(x=>{
  const old=catalogue.find(p=>p.provider===x.provider&&p.account_label===x.account_label&&p.external_key===x.external_key);
  return {...x,content_hash:x.content_hash||old?.content_hash||null,
    link_file:x.link_file||old?.link_file||null,owner_id:owner,ultimo_avvistamento:new Date().toISOString()};
 });
 for(let i=0;i<rows.length;i+=100){
  const r=await db.from('KYV_AUDIO_INDICE').upsert(rows.slice(i,i+100),{onConflict:'owner_id,provider,account_label,external_key'}).select('id');
  if(r.error)throw Error('Indicizzazione interrotta dopo '+i+' file: '+r.error.message+'. Ripetere è sicuro: la chiave elimina i duplicati identici.');
 }
 preview=[];$('finder-preview').hidden=true;await fetchAll();fillSelects();render();
 info('Metadati salvati. Associazioni a brani e sessioni ancora da confermare.');
}
async function associate(){
 const f=catalogue.find(x=>x.id===selected);if(!f)throw Error('Seleziona un audio');
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
 render();info('Collegamento registrato.');
}
async function unlink(id){
 const x=links.find(a=>a.id===id&&!a.annullata);if(!x)throw Error('Collegamento non trovato');
 if(!confirm('Scollegare questo file senza cancellarlo?'))return;
 const q=await db.from('KYV_AUDIO_ASSOCIAZIONI').update({annullata:true}).eq('id',id).select('id').single();
 if(q.error||!q.data?.id)throw Error(q.error?.message||'Scollegamento non registrato');
 links=await all('KYV_AUDIO_ASSOCIAZIONI','id,id_audio,id_progetto,id_sessione,confermata,annullata,metodo,created_at','created_at');
 render();info('Collegamento annullato. File originale intatto.');
}
function kindChanged(){
 const isProject=$('link-kind').value==='project';
 $('project-wrap').hidden=!isProject;$('session-wrap').hidden=isProject;
}
function boot(){
 $('finder-reload').addEventListener('click',refresh);
 $('finder-query').addEventListener('input',()=>{shown=120;render()});
 $('finder-source').addEventListener('change',()=>{shown=120;render()});
 $('finder-more').addEventListener('click',()=>{shown+=120;render()});
 $('finder-drive').addEventListener('click',()=>run(drive));
 $('finder-dropbox').addEventListener('click',()=>run(dropbox));
 $('finder-folder').addEventListener('change',e=>run(()=>local(Array.from(e.target.files||[]))));
 $('finder-files').addEventListener('change',e=>run(()=>local(Array.from(e.target.files||[]))));
 $('finder-save').addEventListener('click',()=>run(savePreview));
 $('finder-cancel').addEventListener('click',()=>{preview=[];$('finder-preview').hidden=true;info('Anteprima scartata, nulla salvato.')});
 $('finder-list').addEventListener('click',e=>{const b=e.target.closest('[data-audio]');if(b){selected=b.dataset.audio;render()}});
 $('finder-detail').addEventListener('click',e=>{
  const b=e.target.closest('[data-suggest],[data-unlink]');if(!b)return;
  if(b.dataset.suggest){$('link-kind').value='project';kindChanged();$('link-project').value=b.dataset.suggest;}
  if(b.dataset.unlink)run(()=>unlink(b.dataset.unlink));
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
