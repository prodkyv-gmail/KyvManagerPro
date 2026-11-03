/* KYV Audio Finder v2.49 — advisory version grouping only.
   No matching function creates/updates projects, files or database associations. */
(function(root){
'use strict';
const F=root.KYV_AUDIO_FINDER_V245;
if(!F)throw Error('KYV Audio Finder core is required');
const txt=v=>String(v??'').trim();
const label=txt;
const normalize=v=>F.norm(v);
const audioExt=/\.(?:mp3|wav|aiff?|flac|m4a|aac|ogg|opus)$/i;
const versionTags=/^(?:demo|provino|rough|bozza|bounce|mix(?:down)?|premix|master(?:ed|ing)?|pre[\s_-]?master|stems?|instrumental|instrumentale|strumentale|acapella|a[\s_-]?cappella|karaoke|radio[\s_-]?edit|vocal(?:s)?|vox|voce|topline|take[\s_-]?\d{1,3}|ver(?:sione)?[\s._-]?\d{1,3}|v[\s._-]?\d{1,3}|rev[\s._-]?\d{1,3})$/i;
const suffixVersion=/[\s._\-()[\]]+(?:demo|provino|rough|bozza|bounce|mix(?:down)?|premix|master(?:ed|ing)?|pre[\s_-]?master|stems?|instrumental|instrumentale|acapella|a[\s_-]?cappella|karaoke|radio[\s_-]?edit|vocal(?:s)?|vox|voce|topline|take[\s_-]?\d{1,3}|ver(?:sione)?[\s._-]?\d{1,3}|v[\s._-]?\d{1,3}|rev[\s._-]?\d{1,3})[\s.)\]]*$/i;
const detailTags=[
 ['Stems',/\bstems?\b/i],['Master',/\bmaster(?:ed|ing)?\b/i],['Mix',/\b(?:premix|mixdown|mix)\b/i],
 ['Demo',/\b(?:demo|provino|rough|bozza|bounce)\b/i],
 ['Strumentale',/\b(?:instrumental|instrumentale|strumentale|karaoke)\b/i],
 ['Voce',/\b(?:acapella|a cappella|vocal|vox|voce|topline)\b/i],
 ['Radio edit',/\bradio[\s_-]*edit\b/i]
];
function versionOf(file){
 const raw=txt(file?.nome_file).replace(audioExt,'').replace(/[_]+/g,' ');
 const suffix=raw.match(/(?:^|[\s._\-([])(?:v|ver(?:sione)?|rev|take)[\s._\-]?(\d{1,3})(?=$|[\s.)\]-])/i);
 const kind=detailTags.find(([,rx])=>rx.test(raw))?.[0]||'Versione';
 return {kind,number:suffix?suffix[1]:null,label:kind+(suffix?' · v'+suffix[1]:'')};
}
function stem(file){
 let s=txt(file?.nome_file).replace(audioExt,'').replace(/\.(?:mp3|wav|aiff?|flac|m4a|aac|ogg|opus)$/i,'').trim();
 // Strip strictly trailing production labels; preserve internal words in song titles.
 for(let k=0;k<5;k++){
  const next=s.replace(suffixVersion,'').replace(/[\s._\-()[\]]+$/g,'').trim();
  if(next===s||!next)break;s=next;
 }
 s=s.replace(/[\s._\-()[\]]+$/g,'').trim();
 const parts=s.split(/\s+[-–—]\s+/).map(x=>x.trim()).filter(Boolean);
 let artist='',title=s;
 // Only recognize the explicit "artist - title" convention. Everything else is advisory.
 if(parts.length===2&&!versionTags.test(parts[0])&&!versionTags.test(parts[1])&&normalize(parts[1]).length>=4){
  artist=parts[0];title=parts[1];
 }
 title=title.replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
 const ntitle=normalize(title),nartist=normalize(artist);
 const generic=/^(?:audio|track|brano|recording|registrazione|voice memo|untitled|nuovo brano)$/;
 return {title,artist,normalizedTitle:ntitle,normalizedArtist:nartist,
  searchable:ntitle.length>=4&&!generic.test(ntitle)};
}
function verifiedTwins(files){
 const keys=new Set();
 for(const f of files){if(/^[a-f0-9]{64}$/i.test(txt(f.content_hash)))keys.add(txt(f.content_hash).toLowerCase());}
 const dupeKeys=[...keys].filter(k=>files.filter(f=>txt(f.content_hash).toLowerCase()===k).length>1);
 return dupeKeys.length;
}
function groups(files=[],links=[]){
 const byTitle=new Map();
 for(const f of files){
  if(!f?.id||!F.isAudio(f.nome_file,f.mime_type))continue;
  const meta=stem(f);
  if(!meta.searchable)continue;
  let arr=byTitle.get(meta.normalizedTitle);
  if(!arr){arr=[];byTitle.set(meta.normalizedTitle,arr);}
  arr.push({file:f,meta,version:versionOf(f)});
 }
 const active=id=>links.filter(x=>txt(x.id_audio)===txt(id)&&!x.annullata&&x.confermata!==false&&x.id_progetto!=null);
 const out=[];
 for(const [title,entries] of byTitle){
  const artists=new Map();
  for(const e of entries)if(e.meta.normalizedArtist&&!artists.has(e.meta.normalizedArtist))artists.set(e.meta.normalizedArtist,e.meta.artist);
  const splitByArtist=artists.size>1;
  const buckets=new Map();
  for(const e of entries){
   const artistKey=splitByArtist?e.meta.normalizedArtist||'__unknown__':'*';
   const bucket=buckets.get(artistKey)||[];
   bucket.push(e);buckets.set(artistKey,bucket);
  }
  for(const [artistKey,bucket] of buckets){
   const distinct=new Set(bucket.map(x=>txt(x.file.id)));
   const unique=bucket.filter((x,i)=>bucket.findIndex(y=>txt(y.file.id)===txt(x.file.id))===i);
   const names=[...new Set(unique.map(x=>x.version.kind))].sort((a,b)=>a.localeCompare(b,'it'));
   const providers=[...new Set(unique.map(x=>txt(x.file.provider)))].sort();
   const targetIds=[...new Set(unique.flatMap(x=>active(x.file.id).map(a=>txt(a.id_progetto))))];
   const representative=unique[0]?.meta;
   out.push({
    key:title+'::'+(splitByArtist?artistKey:'*'),title:representative?.title||title,
    artist:splitByArtist?(artists.get(artistKey)||'Artista da identificare'):(artists.values().next().value||''),
    ambiguousArtist:splitByArtist&&artistKey==='__unknown__',
    files:unique,versionKinds:names,providers,linkedProjectIds:targetIds,
    exactHashDuplicates:verifiedTwins(unique.map(e=>e.file)),
    needsReview:true
   });
  }
 }
 return out.sort((a,b)=>b.files.length-a.files.length||a.title.localeCompare(b.title,'it')||a.key.localeCompare(b.key,'it'));
}
function filter(groupsList=[],{query='',source='',mode='all'}={}){
 const terms=normalize(query).split(' ').filter(Boolean);
 return groupsList.filter(g=>
  (mode==='all'||mode==='multi'&&g.files.length>1||mode==='unlinked'&&g.files.some(e=>!g.linkedProjectIds.length))&&
  (!source||g.providers.includes(source))&&
  terms.every(term=>normalize([g.title,g.artist,...g.files.map(e=>e.file.nome_file)].join(' ')).includes(term)));
}
function allowedForLink(group,links=[]){
 if(!group)return[];
 return group.files.filter(({file})=>!links.some(l=>txt(l.id_audio)===txt(file.id)&&!l.annullata&&l.confermata!==false&&l.id_progetto!=null)).map(x=>x.file);
}
function planVersionLinks({group,selectedIds=[],projectId,files=[],projects=[],links=[],owner,review}={}){
 if(!group||!Array.isArray(selectedIds))throw Error('Seleziona un gruppo valido');
 if(!Number.isSafeInteger(Number(projectId))||Number(projectId)<=0)throw Error('Scegli un progetto');
 if(!review?.planLinks)throw Error('Validazione collegamenti non disponibile');
 const authorized=new Set(allowedForLink(group,links).map(f=>txt(f.id)));
 if(selectedIds.length>25||selectedIds.length===0)throw Error('Seleziona da 1 a 25 versioni');
 if(selectedIds.some(id=>!authorized.has(txt(id))))throw Error('Sono presenti versioni non autorizzate o già collegate');
 const payload=review.planLinks(selectedIds.map(audioId=>({audioId,projectId})),files,projects,links,owner);
 // The caller still needs an explicit UI confirmation before making its one DB write.
 return payload;
}
root.KYV_AUDIO_GROUPS_V249=Object.freeze({stem,versionOf,groups,filter,allowedForLink,planVersionLinks});
})(typeof window!=='undefined'?window:globalThis);
