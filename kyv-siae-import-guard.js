// KYV SIAE Import Guard — deduplica conservativa per tabelle SIAE.
// Regola: duplicato identico -> salta; stessa opera con payload diverso -> segnala, mai scartare come falso doppione.
(function(){
'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='importexport.html')return;

const SIAE_TABLES=new Set(['ESTRATTO SIAE','EXPORT SIAE','EXPORT SIAE VERTICALE']);
const TECHNICAL_FIELDS={
  'ESTRATTO SIAE':new Set(['ID_ECSIAE','owner_id']),
  'EXPORT SIAE':new Set(['owner_id']),
  'EXPORT SIAE VERTICALE':new Set(['ID_SIAVERT','owner_id'])
};
const EXACT_FIELDS={
  'ESTRATTO SIAE':['DATA','OPERAZIONE','IMPORTO'],
  'EXPORT SIAE VERTICALE':['Cod. Opera','Codice ISWC','Titolo','Posiz. SIAE','Codice IPI','Cognome / Denominazione','Nome','Qualifica','Tag','Quota DEM','Società DEM','Quota DRM','Società DRM']
};
const state={fileConflicts:[],dbConflicts:[]};

function norm(value){
  if(value===null||value===undefined)return'';
  const raw=String(value).trim();
  if(!raw)return'';
  if(window.KYV?.normalize)return KYV.normalize(raw);
  return raw.toLocaleLowerCase('it').replace(/\s+/g,' ');
}
function schemaFields(tableName){
  if(EXACT_FIELDS[tableName])return EXACT_FIELDS[tableName];
  const cols=window.KYV_DB?.getColumns?.(tableName)||[];
  const technical=TECHNICAL_FIELDS[tableName]||new Set();
  return cols.map(col=>col.id).filter(id=>!technical.has(id));
}
function exactSignature(tableName,row){
  const fields=schemaFields(tableName);
  return fields.map(field=>`${field}:${norm(row?.[field])}`).join('|');
}
function primaryIdentity(tableName,row){
  if(tableName==='EXPORT SIAE'){
    const value=row?.['Cod. Opera'];
    return value===null||value===undefined||String(value).trim()===''?'':norm(value);
  }
  return'';
}
function dedupeSiaeFile(tableName,rows){
  const seenExact=new Set();
  const seenPrimary=new Map();
  const unique=[];
  const skipped=[];
  const conflicts=[];

  rows.forEach((row,index)=>{
    const signature=exactSignature(tableName,row);
    if(signature&&seenExact.has(signature)){
      skipped.push({row,index,reason:'Duplicato SIAE identico nel file'});
      return;
    }
    if(tableName==='EXPORT SIAE'){
      const primary=primaryIdentity(tableName,row);
      if(primary&&seenPrimary.has(primary)&&seenPrimary.get(primary)!==signature){
        conflicts.push({row,index,reason:'Stessa Cod. Opera con dati diversi nel file',key:row?.['Cod. Opera']});
        skipped.push({row,index,reason:'Conflitto SIAE: stessa Cod. Opera con dati diversi'});
        return;
      }
      if(primary)seenPrimary.set(primary,signature);
    }
    if(signature)seenExact.add(signature);
    unique.push(row);
  });
  return{unique,skipped,conflicts};
}
async function fetchAllExisting(tableName){
  const rows=[];
  const pageSize=1000;
  for(let from=0;;from+=pageSize){
    const {data,error}=await supabaseClient.from(tableName).select('*').range(from,from+pageSize-1);
    if(error)throw new Error(`Controllo doppioni fallito su ${tableName}: ${error.message||error.details||error}`);
    rows.push(...(data||[]));
    if(!data||data.length<pageSize)break;
  }
  return rows;
}
async function filterSiaeAgainstDb(tableName,rows){
  const existing=await fetchAllExisting(tableName);
  const exact=new Set(existing.map(row=>exactSignature(tableName,row)).filter(Boolean));
  const primaryMap=new Map();
  if(tableName==='EXPORT SIAE'){
    existing.forEach(row=>{const primary=primaryIdentity(tableName,row);if(primary)primaryMap.set(primary,exactSignature(tableName,row));});
  }
  const insertable=[];
  const skipped=[];
  const conflicts=[];
  rows.forEach((row,index)=>{
    const signature=exactSignature(tableName,row);
    if(signature&&exact.has(signature)){
      skipped.push({row,index,reason:'Record SIAE identico già presente'});
      return;
    }
    if(tableName==='EXPORT SIAE'){
      const primary=primaryIdentity(tableName,row);
      if(primary&&primaryMap.has(primary)){
        conflicts.push({row,index,reason:'Stessa Cod. Opera già presente ma dati differenti',key:row?.['Cod. Opera']});
        skipped.push({row,index,reason:'Conflitto SIAE: stessa Cod. Opera con dati diversi'});
        return;
      }
    }
    insertable.push(row);
  });
  return{insertable,skipped,conflicts,checkedExisting:existing.length};
}
function conflictSummary(conflicts){
  if(!conflicts.length)return'';
  const examples=[...new Set(conflicts.map(item=>item.key).filter(v=>v!==undefined&&v!==null))].slice(0,8);
  return `\nConflitti (stessa opera, dati diversi): ${conflicts.length}${examples.length?`\nCod. Opera: ${examples.join(', ')}`:''}`;
}
function updateSiaeHint(){
  const tableName=document.getElementById('target-table')?.value;
  const hint=document.getElementById('duplicate-hint');
  if(!hint||!SIAE_TABLES.has(tableName))return false;
  if(tableName==='ESTRATTO SIAE')hint.textContent='SIAE: vengono saltati solo movimenti identici per DATA + OPERAZIONE + IMPORTO.';
  if(tableName==='EXPORT SIAE')hint.textContent='SIAE: il record identico viene saltato; stessa Cod. Opera con dati diversi viene segnalata come conflitto e non inserita.';
  if(tableName==='EXPORT SIAE VERTICALE')hint.textContent='SIAE: vengono saltate solo righe identiche su tutti i campi dell’opera/avente diritto. Quote o Tag diversi restano righe distinte.';
  return true;
}

function buildPayload(targetTable){
  const mappingRules={};let atLeastOneMapped=false;
  excelColumns.forEach((colName,index)=>{
    const selected=document.getElementById(`map-col-${index}`)?.value;
    if(selected&&selected!=='IGNORE'){mappingRules[colName]=selected;atLeastOneMapped=true;}
  });
  if(!atLeastOneMapped)throw new Error('Devi mappare almeno una colonna per poter importare i dati.');
  const payload=[];
  rawExcelData.forEach(row=>{
    const out={};let hasData=false;
    Object.keys(row).forEach(excelCol=>{
      const targetKey=mappingRules[excelCol];if(!targetKey)return;
      let value=row[excelCol];
      if(value===undefined||value===null||value==='')return;
      hasData=true;
      value=normalizeValueForDb(targetTable,targetKey,value);
      if(value!==null&&value!==undefined&&value!=='')out[targetKey]=value;
    });
    if(hasData&&Object.keys(out).length)payload.push(out);
  });
  return payload;
}
async function insertChunks(tableName,rows){
  const chunkSize=200;
  for(let i=0;i<rows.length;i+=chunkSize){
    const chunk=rows.slice(i,i+chunkSize);
    const {error}=await supabaseClient.from(tableName).insert(chunk);
    if(error)throw new Error(`Inserimento bloccato alla riga ${i}. Messaggio Database: ${error.message||error.details||error}`);
  }
}

function install(){
  if(typeof window.executeImport!=='function'||typeof window.updateDuplicateHint!=='function')return false;
  if(window.executeImport.__kyvSiaeGuard)return true;
  const originalExecuteImport=window.executeImport;
  const originalHint=window.updateDuplicateHint;

  window.updateDuplicateHint=function(){if(!updateSiaeHint())return originalHint.apply(this,arguments);};
  const guardedExecuteImport=async function(){
    const targetTable=document.getElementById('target-table')?.value;
    if(!SIAE_TABLES.has(targetTable))return originalExecuteImport.apply(this,arguments);

    const btn=document.getElementById('import-btn');
    const originalText=btn?.innerHTML||'';
    if(btn){btn.innerHTML='<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> Importazione in corso...';btn.disabled=true;}
    if(window.lucide&&btn)lucide.createIcons({root:btn});
    state.fileConflicts=[];state.dbConflicts=[];
    try{
      let cleanPayload=buildPayload(targetTable);
      if(!cleanPayload.length)throw new Error('Nessun dato valido trovato da importare.');

      const fileCheck=dedupeSiaeFile(targetTable,cleanPayload);
      cleanPayload=fileCheck.unique;
      state.fileConflicts=fileCheck.conflicts;

      let skippedInDb=[];let checkedExisting=0;
      if(document.getElementById('skip-duplicates')?.checked&&cleanPayload.length){
        const dbCheck=await filterSiaeAgainstDb(targetTable,cleanPayload);
        cleanPayload=dbCheck.insertable;
        skippedInDb=dbCheck.skipped;
        checkedExisting=dbCheck.checkedExisting;
        state.dbConflicts=dbCheck.conflicts;
      }
      const allConflicts=[...state.fileConflicts,...state.dbConflicts];
      if(!cleanPayload.length){
        alert(`⚠️ Nessun nuovo record da importare.\n\nDuplicati identici nel file saltati: ${fileCheck.skipped.length-state.fileConflicts.length}\nGià presenti nel database saltati: ${skippedInDb.length-state.dbConflicts.length}${conflictSummary(allConflicts)}${checkedExisting?`\nRecord esistenti controllati: ${checkedExisting}`:''}`);
        return;
      }

      await insertChunks(targetTable,cleanPayload);
      alert(`✅ SUCCESSO! ${cleanPayload.length} nuovi record importati nella tabella ${targetTable}.\n\nDuplicati identici nel file saltati: ${fileCheck.skipped.length-state.fileConflicts.length}\nGià presenti identici nel database saltati: ${skippedInDb.length-state.dbConflicts.length}${conflictSummary(allConflicts)}${checkedExisting?`\nRecord esistenti controllati: ${checkedExisting}`:''}${allConflicts.length?'\n\n⚠️ I conflitti NON sono stati sovrascritti né inseriti: vanno verificati.':''}`);
      document.getElementById('mapping-area')?.classList.add('hidden');
      rawExcelData=[];
      const fileInput=document.getElementById('file-upload');if(fileInput)fileInput.value='';
    }catch(error){
      console.error('[KYV SIAE import guard]',error);
      alert('❌ IMPORT SIAE NON COMPLETATO:\n'+(error.message||String(error)));
    }finally{
      if(btn){btn.innerHTML=originalText;btn.disabled=false;}
      if(window.lucide)lucide.createIcons();
    }
  };
  guardedExecuteImport.__kyvSiaeGuard=true;
  window.executeImport=guardedExecuteImport;
  window.updateDuplicateHint();
  window.KYV_SIAE_IMPORT_GUARD={exactSignature,dedupeSiaeFile,filterSiaeAgainstDb,state};
  return true;
}

let attempts=0;
const timer=setInterval(()=>{attempts++;if(install()||attempts>=30)clearInterval(timer);},100);
if(document.readyState!=='loading')install();
})();
