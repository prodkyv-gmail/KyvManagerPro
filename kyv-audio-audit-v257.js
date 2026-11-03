/* KYV v2.57 — read-only audio audit from authenticated metadata already fetched by Audio Finder.
   No inferred ownership, no persisted decisions, no project creation, no cloud reads. */
(function(root){
'use strict';
const W=root.KYV_AUDIO_WORKSPACE_V251,C=root.KYV_AUDIO_CONSENT_V248;
if(!W||!C)throw Error('Audio workspace and consent required');
const T=v=>String(v??'').trim();
const fold=v=>T(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it-IT').replace(/\s+/g,' ');
const SHA=/^[a-f0-9]{64}$/i;
const SOURCES=Object.freeze(['local','drive','dropbox']);
const MODES=Object.freeze(['all','pending','unlinked','duplicates','projects']);
const priority={pending:0,unlinked:1,duplicates:2,projects:3};
function report({catalogue=[],decisions=[],links=[],projects=[],preview=[]}={}){
 const mine=W.approved(catalogue,decisions,links);
 const approvedIds=new Set(mine.map(f=>T(f.id)));
 // A session-only link never means the file is linked to a project.
 const projectLinks=new Map(),projectIds=new Set();
 for(const l of links){
  if(!l||l.annullata||l.confermata!==true||l.id_progetto==null)continue;
  const id=T(l.id_audio),pid=T(l.id_progetto);
  if(!approvedIds.has(id)||!pid)continue;
  if(!projectLinks.has(id))projectLinks.set(id,new Set());
  projectLinks.get(id).add(pid);projectIds.add(pid);
 }
 const pending=[],seenPending=new Set();
 for(const f of preview){
  if(!f||f.decision!=='da_verificare'||!T(f.external_key))continue;
  const key=C.key(f);if(seenPending.has(key))continue;seenPending.add(key);
  pending.push({id:'pending:'+key,type:'pending',title:T(f.nome_file)||'Audio senza nome',
   detail:'Non classificato · scansione corrente, non salvato come mio',
   source:T(f.provider),sources:[T(f.provider)],file:null,
   search:[f.nome_file,f.percorso_relativo,f.provider,f.account_label].map(T).join(' ')});
 }
 const unlinked=mine.filter(f=>!(projectLinks.get(T(f.id))?.size>0)).map(f=>({
  id:'unlinked:'+T(f.id),type:'unlinked',title:T(f.nome_file)||'Senza nome',
  detail:'Tuo audio approvato, senza progetto collegato',
  source:T(f.provider),sources:[T(f.provider)],file:f,
  search:[f.nome_file,f.percorso_relativo,f.provider,f.account_label].map(T).join(' ')
 }));
 const byHash=new Map();
 for(const f of mine){
  const hash=T(f.content_hash).toLowerCase();
  if(!SHA.test(hash))continue;
  if(!byHash.has(hash))byHash.set(hash,[]);
  byHash.get(hash).push(f);
 }
 const duplicates=[...byHash].filter(([,items])=>new Set(items.map(f=>T(f.id))).size>=2)
  .map(([hash,items])=>({
   id:'hash:'+hash,type:'duplicates',title:items.length+' file con SHA-256 identico',
   detail:'Stessi byte verificati nell’indice; proprietà e progetto non sono dedotti dal duplicato',
   source:'',sources:[...new Set(items.map(f=>T(f.provider)))].sort(),hash,
   files:items,search:items.map(f=>[f.nome_file,f.percorso_relativo,f.provider,f.account_label].map(T).join(' ')).join(' ')
  }));
 const missing=projects.filter(p=>p&&T(p.ID)&&!projectIds.has(T(p.ID)))
  .map(p=>({id:'project:'+T(p.ID),type:'projects',
   title:(T(p.ARTISTA)?T(p.ARTISTA)+' · ':'')+(T(p.TITOLO)||'Senza titolo')+' #'+T(p.ID),
   detail:'Nessun audio personale collegato nel catalogo KYV; non significa che il progetto sia incompleto',
   source:'',sources:[],project:p,search:[p.ARTISTA,p.TITOLO,p.ID].map(T).join(' ')
  }));
 const findings=[...pending,...unlinked,...duplicates,...missing].sort((a,b)=>
  priority[a.type]-priority[b.type]||fold(a.title).localeCompare(fold(b.title),'it')||a.id.localeCompare(b.id,'it'));
 const savedPending=new Set(decisions.filter(d=>d?.decision==='da_verificare'&&T(d.external_key)).map(C.key)).size;
 return {summary:Object.freeze({approved:mine.length,pendingScan:pending.length,savedPending,
  unlinked:unlinked.length,duplicateGroups:duplicates.length,
  duplicateFiles:duplicates.reduce((n,g)=>n+g.files.length,0),
  projectsWithoutApprovedAudio:missing.length,projectsChecked:projects.length}),
  findings};
}
function filterFindings(data,{type='all',source='',query=''}={}){
 if(!MODES.includes(type))throw Error('Filtro anomalie non valido');
 if(source&&!SOURCES.includes(source))throw Error('Sorgente non valida');
 const tokens=fold(query).split(' ').filter(Boolean);
 return (data?.findings||[]).filter(x=>
  (type==='all'||x.type===type)&&
  (!source||(x.type!=='projects'&&x.sources.includes(source)))&&
  tokens.every(word=>fold([x.title,x.detail,x.search].join(' ')).includes(word)));
}
root.KYV_AUDIO_AUDIT_V257=Object.freeze({report,filterFindings});
})(typeof window!=='undefined'?window:globalThis);
