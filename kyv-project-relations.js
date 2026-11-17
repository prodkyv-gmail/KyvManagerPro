/* KYV Project Relations — regole condivise, pure e senza accesso diretto ai dati. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KYV_PROJECT_RELATIONS=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';

function text(value){return String(value??'').trim();}
function numberValue(value){
  if(typeof value==='number')return Number.isFinite(value)?value:0;
  const raw=text(value);if(!raw)return 0;
  const normalized=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
  const parsed=Number(normalized.replace(/[^0-9.-]/g,''));
  return Number.isFinite(parsed)?parsed:0;
}
function projectId(row){return text(row?.ID??row?.id??row?.ID_PROGETTO??row?.id_progetto??row?.Progetto_ID??row?.progetto_id);}
function linkedProjectId(row){return text(row?.ID_PROGETTO??row?.id_progetto??row?.Progetto_ID??row?.progetto_id);}
function invoiceId(row){return text(row?.ID_FT??row?.id_ft);}
function allocationProjectId(row){return text(row?.id_progetto??row?.ID_PROGETTO);}
function uniqueInvoices(rows){
  const map=new Map();
  for(const [index,row] of (rows||[]).entries())map.set(invoiceId(row)||`row-${index}`,row);
  return [...map.values()];
}
function uniqueProjects(rows){
  const map=new Map();
  for(const row of rows||[]){const id=projectId(row);if(id)map.set(id,row);}
  return [...map.values()];
}
function allocationsByInvoice(rows){
  const map=new Map();
  for(const row of rows||[]){
    const id=invoiceId(row);if(!id)continue;
    if(!map.has(id))map.set(id,[]);
    map.get(id).push(row);
  }
  return map;
}
function allocationDetails(rows){
  const descriptions=[];
  let amount=0;
  for(const row of rows||[]){
    amount+=numberValue(row.prezzo_unitario??row.PrezzoUnitario);
    const description=text(row.descrizione??row.Descrizione);
    if(description&&!descriptions.includes(description))descriptions.push(description);
  }
  return{amount,description:descriptions.join(' · '),descriptions};
}
function relationMeta(kind,project,invoice,extra={}){
  return{kind,projectId:projectId(project),invoiceId:invoiceId(invoice),...extra};
}
function allocatedInvoice(invoice,project,rows){
  const detail=allocationDetails(rows);
  return{...invoice,
    Descrizione:detail.description||invoice.Descrizione,
    PrezzoUnitario:String(detail.amount),PrezzoTotale:String(detail.amount),XML_SHA256:null,
    _v247Shared:true,_v247Share:true,_v247_shared:true,
    _kyvRelation:relationMeta('allocation',project,invoice,detail)};
}
function unallocatedSharedInvoice(invoice,project){
  return{...invoice,PrezzoUnitario:'0',PrezzoTotale:'0',ImportoPagamento:null,XML_SHA256:null,
    _idftShared:true,_idft_shared:true,
    _kyvRelation:relationMeta('idft-shared',project,invoice,{amount:0,needsAllocation:true})};
}
function linkedInvoice(invoice,project,kind){
  return{...invoice,_kyvRelation:relationMeta(kind,project,invoice)};
}

function resolveProjectInvoices({project,invoices=[],allocations=[]}={}){
  const pid=projectId(project);if(!pid)return[];
  const legacyId=text(project?.IDFT);
  const docs=uniqueInvoices(invoices);
  const byId=new Map(docs.map(row=>[invoiceId(row),row]));
  const split=allocationsByInvoice(allocations);
  const resolved=new Map();
  const put=row=>{const id=invoiceId(row);if(id)resolved.set(id,row);};

  for(const invoice of docs){
    const id=invoiceId(invoice);if(!id||split.has(id))continue;
    if(linkedProjectId(invoice)===pid)put(linkedInvoice(invoice,project,'direct'));
  }
  if(legacyId&&byId.has(legacyId)&&!split.has(legacyId)){
    const invoice=byId.get(legacyId),owner=linkedProjectId(invoice);
    put(!owner||owner===pid?linkedInvoice(invoice,project,'legacy'):unallocatedSharedInvoice(invoice,project));
  }
  for(const [id,rows] of split){
    const own=rows.filter(row=>allocationProjectId(row)===pid);
    if(own.length&&byId.has(id))put(allocatedInvoice(byId.get(id),project,own));
  }
  return [...resolved.values()];
}

function projectsForInvoice({invoice,projects=[],allocations=[]}={}){
  const id=invoiceId(invoice);if(!id)return[];
  const projectMap=new Map(uniqueProjects(projects).map(row=>[projectId(row),row]));
  const invoiceAllocations=(allocations||[]).filter(row=>invoiceId(row)===id);
  const linked=[];
  if(invoiceAllocations.length){
    const grouped=new Map();
    for(const row of invoiceAllocations){const pid=allocationProjectId(row);if(!pid)continue;if(!grouped.has(pid))grouped.set(pid,[]);grouped.get(pid).push(row);}
    for(const [pid,rows] of grouped){const project=projectMap.get(pid);if(project)linked.push({project,...allocationDetails(rows),kind:'allocation'});}
    return linked;
  }
  const ids=[];
  const owner=linkedProjectId(invoice);if(owner)ids.push(owner);
  for(const project of projectMap.values())if(text(project.IDFT)===id)ids.push(projectId(project));
  for(const pid of [...new Set(ids)]){const project=projectMap.get(pid);if(project)linked.push({project,amount:null,description:'',descriptions:[],kind:pid===owner?'direct':'legacy'});}
  return linked;
}

function normalizedSearch(value){return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function audioTimestamp(row){
  let latest=0;
  for(const key of ['DATA_FILE','Data_Caricamento','Data_Documento','Data_Consegna','modifiedTime','updated_at','created_at']){
    const time=Date.parse(row?.[key]||'');if(Number.isFinite(time))latest=Math.max(latest,time);
  }
  return latest;
}
function isDriveAudioDocument(row){return /audio[_ -]?drive|versione audio/i.test(text(row?.Tipo_Documento));}
function audioSource(row,sourceHint=''){
  if(sourceHint)return sourceHint;
  if(row?.ID_DOCUMENTO!==undefined)return'drive';
  if(row?.ID_VERSIONE!==undefined){const provider=normalizedSearch(row.PROVIDER??row.provider);return provider.includes('drive')?'drive-version':provider.includes('dropbox')?'dropbox-version':'version';}
  return'dropbox';
}
function normalizeAudio(row,sourceHint=''){
  const source=audioSource(row,sourceHint),drive=source.startsWith('drive');
  const versionFileId=text(row?.ID_VERSIONE)?`v-${text(row.ID_VERSIONE)}`:'';
  const normalized={...row,
    ID_FILE:text(row?.ID_FILE)||versionFileId||undefined,
    Nome_File:row?.Nome_File??row?.NOME_FILE??row?.Titolo_Documento,
    Titolo:row?.Titolo??row?.TITOLO,
    Artista:row?.Artista??row?.ARTISTA,
    Titolo_Documento:row?.Titolo_Documento??row?.NOME_FILE??row?.TITOLO,
    Tipo_File:row?.Tipo_File??row?.TIPO_VERSIONE,
    Versione:row?.Versione??row?.ETICHETTA_VERSIONE,
    Link_Drive:drive?(row?.Link_Drive??row?.LINK_FILE):row?.Link_Drive,
    Link_Dropbox:drive?row?.Link_Dropbox:(row?.Link_Dropbox??row?.LINK_FILE),
    Hash_SHA256:row?.Hash_SHA256??row?.CONTENT_HASH,
    Data_Caricamento:row?.Data_Caricamento??row?.DATA_FILE??row?.Data_Documento,
    _source:drive?'drive':'audio',_kyvAudioSource:source};
  normalized._kyvAudioKey=text(row?.ID_FILE)?`file:${text(row.ID_FILE)}`:
    text(row?.ID_VERSIONE)?`version:${text(row.ID_VERSIONE)}`:
    text(row?.ID_DOCUMENTO)?`document:${text(row.ID_DOCUMENTO)}`:
    text(normalized.Link_Drive||normalized.Link_Dropbox)?`link:${text(normalized.Link_Drive||normalized.Link_Dropbox)}`:'';
  return normalized;
}
function uniqueAudio(rows){
  const map=new Map();let anonymous=0;
  for(const row of rows||[]){const key=text(row?._kyvAudioKey)||`row:${anonymous++}`;map.set(key,row);}
  return [...map.values()];
}
function audioFallbackMatch(row,project){
  const title=normalizedSearch(project?.TITOLO),artist=normalizedSearch(project?.ARTISTA);
  const blob=normalizedSearch([row?.Progetto,row?.Titolo,row?.TITOLO,row?.Artista,row?.ARTISTA,row?.Nome_File,row?.NOME_FILE].filter(Boolean).join(' '));
  return Boolean((title&&blob.includes(title))||(artist&&blob.includes(artist)));
}
function resolveProjectAudio({project,audioVersions=[],dropboxFiles=[],driveDocuments=[]}={}){
  const pid=projectId(project);if(!pid)return{files:[],versions:[],dropbox:[],drive:[],usedFallback:false};
  const versions=(audioVersions||[]).map(row=>normalizeAudio(row)).filter(row=>linkedProjectId(row)===pid);
  const exactDropbox=(dropboxFiles||[]).map(row=>normalizeAudio(row,'dropbox')).filter(row=>linkedProjectId(row)===pid);
  const usedFallback=!versions.length&&!exactDropbox.length;
  const dropbox=usedFallback?(dropboxFiles||[]).filter(row=>audioFallbackMatch(row,project)).map(row=>normalizeAudio(row,'dropbox')):exactDropbox;
  const drive=(driveDocuments||[]).filter(isDriveAudioDocument).map(row=>normalizeAudio(row,'drive')).filter(row=>linkedProjectId(row)===pid);
  const files=uniqueAudio([...dropbox,...versions,...drive]);
  return{files,versions:uniqueAudio(versions),dropbox:uniqueAudio(dropbox),drive:uniqueAudio(drive),usedFallback};
}
function latestAudioByProject(rows=[]){
  const map=new Map();let index=0;
  for(const row of rows){
    if(row?.ID_DOCUMENTO!==undefined&&!isDriveAudioDocument(row))continue;
    const normalized=normalizeAudio(row),pid=linkedProjectId(normalized);if(!pid)continue;
    const score=audioTimestamp(normalized)||Number(row.ID_VERSIONE||row.ID_FILE||row.ID_DOCUMENTO||row.ID_CONSEGNA||index++)||0;
    const current=map.get(pid);if(!current||score>current.score)map.set(pid,{row:normalized,score});
  }
  return map;
}

return Object.freeze({
  text,projectId,linkedProjectId,invoiceId,uniqueInvoices,resolveProjectInvoices,projectsForInvoice,
  isDriveAudioDocument,normalizeAudio,resolveProjectAudio,audioTimestamp,latestAudioByProject
});
});
