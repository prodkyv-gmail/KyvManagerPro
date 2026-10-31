/* v2.46: candidate review is advisory; user approval is mandatory. */
(function(root){
'use strict';
const F=root.KYV_AUDIO_FINDER_V245;
if(!F)throw Error('Audio Finder base missing');
const str=v=>String(v??'').trim();
const active=(links,id,kind='any')=>links.filter(x=>str(x.id_audio)===str(id)&&!x.annullata&&x.confermata!==false&&(kind==='any'||kind==='project'&&x.id_progetto!=null));
function filterCatalogue(files,links,{query='',source='',status='all'}={}){
 const words=F.norm(query).split(' ').filter(Boolean);
 return files.filter(f=>(!source||f.provider===source)&&
  (status==='all'||(status==='linked')===(active(links,f.id).length>0))&&
  words.every(w=>F.norm([f.nome_file,f.percorso_relativo,f.account_label].join(' ')).includes(w)));
}
function match(file,p){
 const name=F.cleanTitle(file.nome_file),title=F.norm(p.TITOLO),artist=F.norm(p.ARTISTA);
 if(title.length<4||name.length<4||!(' '+name+' ').includes(' '+title+' '))return null;
 const artistInName=artist.length>=3&&(' '+name+' ').includes(' '+artist+' ');
 const exact=name===title||(artistInName&&(name===artist+' '+title||name===title+' '+artist));
 const score=exact&&artistInName?3:exact?2:1;
 return {id:p.ID,title:p.TITOLO,artist:p.ARTISTA,score,reason:score===3?'Titolo e artista esatti':score===2?'Titolo esatto':'Titolo contenuto nel nome'};
}
function queue(files=[],projects=[],links=[]){
 return files.filter(f=>!active(links,f.id,'project').length).map(file=>{
  const matches=projects.map(p=>match(file,p)).filter(Boolean).sort((a,b)=>b.score-a.score||String(a.title).localeCompare(String(b.title),'it')).slice(0,15);
  const status=matches.length>1?'ambigua':matches.length===1?(matches[0].score===3?'forte':'verificare'):'nessuna';
  return {file,candidates:matches,status,proposedId:status==='forte'?String(matches[0].id):''};
 }).filter(x=>x.candidates.length).sort((a,b)=>a.file.nome_file.localeCompare(b.file.nome_file,'it'));
}
function planLinks(selections,files,projects,links,owner){
 if(!str(owner))throw Error('Sessione non autenticata');
 if(!Array.isArray(selections)||!selections.length||selections.length>25)throw Error('Seleziona da 1 a 25 collegamenti');
 const used=new Set();
 return selections.map(({audioId,projectId})=>{
  const a=str(audioId),p=str(projectId);
  if(!a||used.has(a))throw Error('File duplicato nella selezione');used.add(a);
  if(!files.some(f=>str(f.id)===a))throw Error('File non più disponibile');
  if(!projects.some(x=>str(x.ID)===p))throw Error('Scegli un progetto valido per ogni file');
  if(active(links,a,'project').length)throw Error('File già collegato a un progetto');
  return {owner_id:owner,id_audio:a,id_progetto:Number(p),id_sessione:null,confermata:true,metodo:'manuale'};
 });
}
root.KYV_AUDIO_REVIEW_V246=Object.freeze({active,filterCatalogue,match,queue,planLinks});
})(typeof window!=='undefined'?window:globalThis);
