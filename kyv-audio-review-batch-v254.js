/* KYV v2.54 — guided grouping of DISCOVERED audio; strictly read-only suggestions.
   A filename never proves that a file is the user's work or belongs to a project. */
(function(root){
'use strict';
const F=root.KYV_AUDIO_FINDER_V245,G=root.KYV_AUDIO_GROUPS_V249,C=root.KYV_AUDIO_CONSENT_V248;
if(!F||!G||!C)throw Error('Audio classification helpers missing');
const txt=v=>String(v??'').trim();
const ownKey=C.key;
const SEP='\u0000';
const status=f=>f?._sync?.state||'pending';
function groupId(f){
 const m=G.stem(f);
 // Do not merge an unknown artist into a named artist's project by title.
 // Ambiguous/generic names are kept as individual review records.
 if(!m.searchable)return 'file'+SEP+ownKey(f);
 return 'title'+SEP+m.normalizedTitle+SEP+(m.normalizedArtist||'__artist_unknown__');
}
function classifyGroups(files=[]){
 const grouped=new Map();
 for(let index=0;index<files.length;index++){
  const f=files[index],m=G.stem(f),id=groupId(f);
  let g=grouped.get(id);
  if(!g){
   g={id,title:m.searchable?m.title:(txt(f.nome_file)||'Senza titolo'),artist:m.artist||'Artista da verificare',
     artistUnknown:!m.artist,files:[],indices:[],versions:new Set(),sources:new Set(),states:new Map()};
   grouped.set(id,g);
  }
  g.files.push(f);g.indices.push(index);g.versions.add(G.versionOf(f).kind);
  g.sources.add(txt(f.provider));
  g.states.set(status(f),(g.states.get(status(f))||0)+1);
 }
 return [...grouped.values()].map(g=>({
  id:g.id,title:g.title,artist:g.artist,artistUnknown:g.artistUnknown,
  count:g.files.length,indices:g.indices,
  sources:[...g.sources].sort((a,b)=>a.localeCompare(b,'it')),
  versions:[...g.versions].sort((a,b)=>a.localeCompare(b,'it')),
  needsReview:g.files.some(f=>!f._explicit&&['new','changed','pending','unverified'].includes(status(f))),
  conflictingMetadata:false // identical-name ambiguity is never promoted to proof of match
 })).sort((a,b)=>Number(b.needsReview)-Number(a.needsReview)||b.count-a.count||
  a.title.localeCompare(b.title,'it')||a.artist.localeCompare(b.artist,'it'));
}
function find(groups=[],id=''){return groups.find(g=>g.id===id)||null;}
function filteredGroups(groups=[],{query='',source='',mode='all'}={}){
 const tokens=F.norm(query).split(' ').filter(Boolean);
 return groups.filter(g=>
  (mode==='all'||mode==='multi'&&g.count>1||mode==='review'&&g.needsReview)&&
  (!source||g.sources.includes(source))&&
  tokens.every(q=>F.norm([g.title,g.artist,g.versions.join(' ')].join(' ')).includes(q)));
}
function narrowIndices(indices=[],groups=[],selectedGroup=''){
 if(!selectedGroup)return indices;
 const group=find(groups,selectedGroup);
 if(!group)return [];
 const allowed=new Set(group.indices);
 return indices.filter(i=>allowed.has(i));
}
function bulkEligible(f){
 if(!f||f._explicit)return false;
 const existing=f._sync?.previousDecision||'da_verificare';
 // Never bulk-reclassify past references or already approved productions;
 // never silently approve changed metadata without its dedicated v2.52 action.
 return existing==='da_verificare'&&!['changed','excluded','unchanged'].includes(status(f));
}
function selectionPlan(files=[],checked=[],visible=[]){
 const visibleSet=new Set(visible),unique=new Set(checked);
 if(unique.size!==checked.length||unique.size>100)throw Error('La selezione deve contenere fino a 100 file diversi');
 if([...unique].some(i=>!Number.isSafeInteger(i)||i<0||i>=files.length||
     !visibleSet.has(i)||!bulkEligible(files[i])))
  throw Error('La selezione contiene file nascosti, reference già escluse o lavori già approvati');
 return [...unique].sort((a,b)=>a-b);
}
function candidates(files=[],visible=[]){return visible.filter(i=>bulkEligible(files[i]));}
root.KYV_AUDIO_REVIEW_BATCH_V254=Object.freeze({
 groupId,classifyGroups,find,filteredGroups,narrowIndices,bulkEligible,selectionPlan,candidates
});
})(typeof window!=='undefined'?window:globalThis);
