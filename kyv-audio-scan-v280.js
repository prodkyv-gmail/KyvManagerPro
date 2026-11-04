/* Audio Finder v2.80 — metadata-only scan preflight and coverage, without I/O or permission elevation. */
(function(root){'use strict';
 const S=v=>String(v??'').trim();
 const MAX_FILES=5000;
 function preflight(files,{isAudio,max=MAX_FILES}={}){
  const all=Array.from(files||[]);
  if(!all.length)throw Error('Seleziona una cartella o almeno un file');
  if(all.length>max)throw Error('La selezione contiene '+all.length+' elementi: massimo '+max+'. Scegli una cartella più piccola o meno file.');
  if(typeof isAudio!=='function')throw Error('Verifica audio non disponibile');
  const accepted=all.filter(f=>f&&isAudio(f.name,f.type));
  if(!accepted.length)throw Error('La selezione contiene '+all.length+' elementi ma nessun file audio supportato');
  return {files:accepted,selected:all.length,audio:accepted.length,ignored:all.length-accepted.length};
 }
 function coverage(rows=[]){
  const counts={local:0,drive:0,dropbox:0,onedrive:0};
  const identities=new Set();
  for(const file of rows){
   if(!file||!Object.hasOwn(counts,file.provider))continue;
   const key=[file.provider,S(file.account_label),S(file.external_key)].join('\u0000');
   if(!S(file.external_key)||identities.has(key))continue;
   identities.add(key);counts[file.provider]++;
  }
  const labels={local:'Dispositivo',drive:'Google Drive',dropbox:'Dropbox',onedrive:'OneDrive'};
  const details=Object.entries(counts).filter(([,n])=>n>0).map(([key,n])=>labels[key]+': '+n);
  return {total:identities.size,counts,details};
 }
 function readiness({secure=false,cryptoReady=false,filePicker=false,folderPicker=false,driveAccounts=0,driveReader=false,
   dropboxChooser=false,dropboxOAuth=false,onedriveOAuth=false,onedriveIndex=false}={}){
  const notes=[];
  notes.push('File da dispositivo: '+(filePicker?'selezione manuale disponibile':'selettore non rilevato')+
   (secure&&cryptoReady?' · identificazione metadati disponibile':' · HTTPS/crypto richiesti per indicizzare'));
  notes.push('Cartelle: '+(folderPicker?'selettore supportato dal browser (verifica sul dispositivo)':'selettore cartella non disponibile qui; usa File'));
  notes.push('Google Drive: '+(driveReader?driveAccounts+' account configurati (accesso e permessi verificati solo alla ricerca)':'connettore non pronto'));
  notes.push('Dropbox: archivio KYV · Chooser '+(dropboxChooser?'configurato':'da configurare')+
   ' · OAuth '+(dropboxOAuth?'configurato':'da configurare'));
  notes.push('OneDrive: '+(onedriveOAuth?'OAuth configurato':'OAuth da configurare')+
   ' · indicizzazione '+(onedriveIndex?'abilitata':'non abilitata; selezione da File disponibile'));
  return notes;
 }
 root.KYV_AUDIO_SCAN_V280=Object.freeze({MAX_FILES,preflight,coverage,readiness});
})(typeof window!=='undefined'?window:globalThis);
