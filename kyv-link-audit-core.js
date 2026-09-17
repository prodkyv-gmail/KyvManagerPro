/* KYV link audit: pure URL classification. Never fetches cloud URLs. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KYV_LINK_AUDIT=api;
})(typeof window!=='undefined'?window:null,function(){
  const AUDIO_EXT=/\.(?:mp3|m4a|aac|wav|flac|ogg|opus)(?:$|[?#])/i;
  function invalid(reason){return{status:'invalid',provider:'unknown',playUrl:'',externalUrl:'',reason};}
  function inspect(value){
    const raw=String(value||'').trim();
    if(!raw)return invalid('Link mancante.');
    let url;
    try{url=new URL(raw);}catch(e){return invalid('Link non valido.');}
    if(url.protocol!=='https:'||url.username||url.password)return invalid('È richiesto un link HTTPS senza credenziali.');
    url.hash='';
    const host=url.hostname.toLowerCase();
    const externalUrl=url.toString();
    if(host==='drive.google.com'||host==='docs.google.com'){
      const match=url.pathname.match(/\/file\/d\/([\w-]+)/i);
      const id=(match&&match[1])||url.searchParams.get('id')||'';
      if(!/^[\w-]{10,}$/.test(id))return invalid('Link Drive non riferito a un file.');
      return{status:'conditional',provider:'drive',playUrl:`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`,externalUrl,reason:'Riproduzione condizionata dai permessi Drive e dal browser.'};
    }
    if(host==='dropbox.com'||host==='www.dropbox.com'||host==='dl.dropboxusercontent.com'){
      if(/^\/scl\/fo\//i.test(url.pathname))return invalid('Il link Dropbox indica una cartella.');
      if(!/^\/(?:s|scl\/fi)\//i.test(url.pathname)&&host!=='dl.dropboxusercontent.com')return invalid('Link Dropbox non riferito a un file.');
      url.searchParams.delete('dl');url.searchParams.set('raw','1');
      return{status:'conditional',provider:'dropbox',playUrl:url.toString(),externalUrl,reason:'Riproduzione possibile solo se la condivisione consente il file raw.'};
    }
    if(AUDIO_EXT.test(url.pathname))return{status:'direct',provider:'https',playUrl:externalUrl,externalUrl,reason:'Link audio HTTPS diretto; il server deve consentire lo streaming.'};
    return{status:'external',provider:'https',playUrl:'',externalUrl,reason:'Link HTTPS registrato, ma non identificabile come stream audio diretto.'};
  }
  return{inspect};
});
