/* KYV Taccuino Voice · browser dictation (when supported) and local MediaRecorder. */
(function(root){
'use strict';
function supported(){
 return {recording:!!(root.MediaRecorder&&navigator.mediaDevices?.getUserMedia),
         dictation:!!(root.SpeechRecognition||root.webkitSpeechRecognition)};
}
function create({onText=()=>{},onAudio=()=>{},onState=()=>{},onError=()=>{},getText=()=>{return ''}}={}){
 let recorder=null,stream=null,chunks=[],started=0,stopTimer=null,speech=null,recognizing=false;
 const inform=(kind,msg)=>onState({kind,message:msg});
 function stopTracks(){
  if(stopTimer){clearTimeout(stopTimer);stopTimer=null;}
  try{stream?.getTracks().forEach(t=>t.stop());}catch(_){}
  stream=null;
 }
 async function startRecording(){
  if(recorder?.state==='recording')return;
  if(!supported().recording){onError('Questo browser non supporta la registrazione audio.');return;}
  try{
   stream=await navigator.mediaDevices.getUserMedia({audio:true});
   const type=root.KYV_NOTES_CORE?.voiceFormat(root.MediaRecorder)||'';
   recorder=new root.MediaRecorder(stream,type?{mimeType:type}:undefined);
   chunks=[];started=Date.now();
   recorder.addEventListener('dataavailable',event=>{if(event.data?.size)chunks.push(event.data);});
   recorder.addEventListener('error',event=>onError(event.error?.message||'Registrazione interrotta.'));
   recorder.addEventListener('stop',()=>{
    const duration=Math.min(300,Math.ceil((Date.now()-started)/1000));
    const mime=recorder.mimeType||type||'audio/webm';
    const blob=new Blob(chunks,{type:mime});
    stopTracks();
    if(blob.size>0)onAudio({blob,duration});
    else onError('Il microfono non ha prodotto audio. Riprova.');
    inform('idle','Registrazione terminata.');
   },{once:true});
   recorder.start(250);
   inform('recording','Registrazione in corso: premi Stop per conservarla.');
   stopTimer=setTimeout(()=>stopRecording(),root.KYV_NOTES_CORE?.MAX_AUDIO_SECONDS*1000||300000);
  }catch(error){stopTracks();onError('Microfono non disponibile: '+(error?.message||'permesso negato.'));}
 }
 function stopRecording(){
  if(recorder&&recorder.state==='recording')recorder.stop();
  else stopTracks();
 }
 function startDictation(){
  const Speech=root.SpeechRecognition||root.webkitSpeechRecognition;
  if(!Speech){onError('Dettatura non disponibile in questo browser. Puoi usare il microfono della tastiera del dispositivo.');return;}
  if(recognizing)return;
  speech=new Speech();speech.lang='it-IT';speech.continuous=true;speech.interimResults=true;
  const base=String(getText()||'').trim(),prefix=base?base+' ':'';
  let final='';
  speech.onresult=event=>{
   let interim='';
   for(let i=event.resultIndex;i<event.results.length;i++){
    const text=event.results[i][0]?.transcript||'';
    if(event.results[i].isFinal)final+=text.trim()+' ';else interim+=text;
   }
   onText(prefix+final+interim);
  };
  speech.onerror=event=>onError('Dettatura non riuscita ('+(event.error||'errore')+').');
  speech.onend=()=>{recognizing=false;speech=null;inform('idle','Dettatura terminata. Controlla il testo prima di salvare.');};
  try{speech.start();recognizing=true;inform('dictating','Dettatura attiva: parla e poi premi Stop.');}
  catch(error){recognizing=false;speech=null;onError(error?.message||'Impossibile avviare la dettatura.');}
 }
 function stopDictation(){if(speech){try{speech.stop();}catch(_){}}}
 function dispose(){stopDictation();if(recorder?.state==='recording'){try{recorder.stop();}catch(_){stopTracks();}}else stopTracks();}
 return Object.freeze({supported,startRecording,stopRecording,startDictation,stopDictation,dispose,
  isRecording:()=>recorder?.state==='recording',isDictating:()=>recognizing});
}
root.KYV_NOTES_VOICE=Object.freeze({supported,create});
})(typeof window!=='undefined'?window:globalThis);
