/* KYV v2.58 — opt-in read-only cloud discovery.
   OAuth Authorization Code + PKCE; ONLY verifier/state in sessionStorage.
   Access tokens are held in this page's memory and never saved to KYV/Supabase. */
(function(root){
'use strict';
const F=root.KYV_AUDIO_FINDER_V245;
if(!F)throw Error('KYV Audio Finder core missing');
const T=x=>String(x??'').trim();
const STORAGE_KEY='kyv-cloud-pkce-v258';
const CALLBACK_MAX_MS=10*60*1000;
const VALID=Object.freeze(['dropbox','onedrive']);
const tokens=new Map();
const utf8=x=>new TextEncoder().encode(x);
function b64url(bytes){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
 let out='';
 for(let i=0;i<bytes.length;i+=3){
  const a=bytes[i],b=bytes[i+1],c=bytes[i+2];
  out+=alphabet[a>>2]+alphabet[((a&3)<<4)|((b??0)>>4)];
  if(i+1<bytes.length)out+=alphabet[((b&15)<<2)|((c??0)>>6)];
  if(i+2<bytes.length)out+=alphabet[c&63];
 }
 return out;
}
function callbackUri(url){
 const u=new URL(url);
 if(u.protocol!=='https:'&&u.hostname!=='localhost'&&u.hostname!=='127.0.0.1')
  throw Error('OAuth richiede HTTPS');
 // Keep a stable URI without transient query/hash for registered app redirect.
 return u.origin+u.pathname;
}
function client(provider,config={}){
 if(provider==='dropbox')return T(config.DROPBOX_APP_KEY);
 if(provider==='onedrive')return T(config.MICROSOFT_CLIENT_ID);
 throw Error('Provider cloud non valido');
}
function configured(provider,config={}){
 const id=client(provider,config);
 return provider==='onedrive'?/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id):
  /^[a-zA-Z0-9]{8,80}$/.test(id);
}
async function begin(provider,{config={},url,storage,crypt,now=Date.now()}={}){
 if(!VALID.includes(provider)||!configured(provider,config))
  throw Error(provider==='onedrive'?'OneDrive non configurato: manca il client ID Microsoft e la redirect URI SPA':'Dropbox OAuth non configurato: verifica la app key');
 if(!storage||!crypt?.getRandomValues||!crypt?.subtle?.digest)throw Error('HTTPS e sessionStorage richiesti per OAuth PKCE');
 const redirect=callbackUri(url);
 const bytes=new Uint8Array(32),nonce=new Uint8Array(24);
 crypt.getRandomValues(bytes);crypt.getRandomValues(nonce);
 const verifier=b64url(bytes),state=b64url(nonce);
 const challenge=b64url(new Uint8Array(await crypt.subtle.digest('SHA-256',utf8(verifier))));
 const appId=client(provider,config);
 storage.setItem(STORAGE_KEY,JSON.stringify({provider,appId,verifier,state,redirect,created:now}));
 let auth;
 if(provider==='dropbox'){
  auth=new URL('https://www.dropbox.com/oauth2/authorize');
  auth.searchParams.set('client_id',appId);
  auth.searchParams.set('response_type','code');
  auth.searchParams.set('token_access_type','online');
  auth.searchParams.set('scope','files.metadata.read');
 }else{
  auth=new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  auth.searchParams.set('client_id',appId);
  auth.searchParams.set('response_type','code');
  auth.searchParams.set('response_mode','query');
  auth.searchParams.set('scope','Files.Read');
 }
 auth.searchParams.set('redirect_uri',redirect);
 auth.searchParams.set('state',state);
 auth.searchParams.set('code_challenge',challenge);
 auth.searchParams.set('code_challenge_method','S256');
 return auth.href;
}
function status(provider){
 const session=tokens.get(provider);
 if(!session||!T(session.accessToken)||Date.now()>=session.expires-60*1000){
  if(session)tokens.delete(provider);
  return {connected:false,accountLabel:''};
 }
 return {connected:true,accountLabel:session.accountLabel};
}
function disconnect(provider){
 if(!VALID.includes(provider))throw Error('Provider non valido');
 tokens.delete(provider);
}
async function finish({url,storage,fetcher,now=Date.now(),config={},historyReplace}={}){
 const u=new URL(url);
 const code=T(u.searchParams.get('code')),state=T(u.searchParams.get('state')),
  error=T(u.searchParams.get('error'));
 if(!code&&!error)return {handled:false};
 // Strip callback details from URL before network I/O, success or failure.
 if(typeof historyReplace==='function')historyReplace(u.pathname+u.hash);
 const raw=storage?.getItem(STORAGE_KEY);
 storage?.removeItem(STORAGE_KEY);
 let pending;try{pending=JSON.parse(raw||'null')}catch{}
 if(!pending||!VALID.includes(pending.provider)||!pending.verifier||!pending.state||
  !pending.redirect||pending.redirect!==callbackUri(url)||
  pending.state!==state||now-pending.created>CALLBACK_MAX_MS||now<pending.created||
  !configured(pending.provider,config)||pending.appId!==client(pending.provider,config))
  throw Error('Sessione OAuth non valida o scaduta: ripeti il collegamento.');
 if(error)throw Error('Accesso '+pending.provider+' annullato o non autorizzato: '+error.slice(0,80));
 if(!code||typeof fetcher!=='function')throw Error('Codice OAuth non disponibile');
 const tokenUrl=pending.provider==='dropbox'?
  'https://api.dropboxapi.com/oauth2/token':
  'https://login.microsoftonline.com/common/oauth2/v2.0/token';
 const params=new URLSearchParams({client_id:pending.appId,grant_type:'authorization_code',
  code,redirect_uri:pending.redirect,code_verifier:pending.verifier});
 if(pending.provider==='onedrive')params.set('scope','Files.Read');
 const response=await fetcher(tokenUrl,{method:'POST',
  headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});
 if(!response.ok)throw Error('Autorizzazione cloud non completata (HTTP '+response.status+'). Verifica redirect e permessi.');
 const body=await response.json();
 if(!T(body.access_token)||!Number.isFinite(Number(body.expires_in))||Number(body.expires_in)<1)
  throw Error('Il provider non ha restituito un access token valido');
 if(pending.provider==='dropbox'&&!T(body.account_id))throw Error('L’account Dropbox non è identificabile: nessun token salvato.');
 const accountLabel=pending.provider==='dropbox'?
  'Dropbox OAuth '+T(body.account_id).slice(0,90):
  'OneDrive (autorizzato)';
 tokens.set(pending.provider,{accessToken:body.access_token,accountLabel,
  expires:now+Number(body.expires_in)*1000});
 return {handled:true,provider:pending.provider,accountLabel};
}
function authorization(provider){
 const token=tokens.get(provider);
 if(!token||Date.now()>=token.expires-60*1000)throw Error('Sessione '+provider+' scaduta: riconnetti l’archivio');
 return token;
}
async function readJson(response){
 if(!response.ok){
  if(response.status===401||response.status===403)throw Error('Permesso cloud negato (HTTP '+response.status+'). Verifica i permessi dell’app.');
  throw Error('Lettura cloud non riuscita (HTTP '+response.status+').');
 }
 return response.json();
}
function cleanDropboxPath(value){
 const path=T(value);
 if(path==='' )return '';
 if(path.length>1000||!path.startsWith('/')||path.includes('\\')||
  path.split('/').some(x=>x==='.'||x==='..')||/[\u0000-\u001f]/.test(path))
  throw Error('Cartella Dropbox non valida: usa /Cartella/Sottocartella o lascia vuoto per radice');
 return path.replace(/\/+$/,'');
}
function convertDropbox(entry,accountLabel){
 if(entry?.['.tag']!=='file'||!T(entry?.id)||!F.isAudio(entry.name,''))return null;
 const path=T(entry.path_display||entry.path_lower);
 const folder=path.slice(0,Math.max(path.lastIndexOf('/'),0));
 // IMPORTANT: Dropbox content_hash is a block-based hash, NOT raw SHA-256.
 // Never map it to content_hash (which indicates byte-identical SHA-256 in KYV).
 try{return F.record({provider:'dropbox',account:accountLabel,externalKey:T(entry.id),
  name:entry.name,path:folder,size:entry.size,modified:entry.client_modified||entry.server_modified,
  hash:null,url:null,origin:'scansione'});}catch{return null}
}
async function scanDropbox({path='',fetcher,pages=10,maxEntries=5000}={}){
 if(typeof fetcher!=='function')throw Error('Rete cloud non disponibile');
 if(!Number.isSafeInteger(pages)||pages<1||pages>10||!Number.isSafeInteger(maxEntries)||maxEntries<1||maxEntries>5000)
  throw Error('Limite scansione Dropbox non valido');
 const session=authorization('dropbox'),folder=cleanDropboxPath(path);
 const headers={'Authorization':'Bearer '+session.accessToken,'Content-Type':'application/json'};
 let cursor='',hasMore=true,entriesSeen=0,invalid=0;
 const rows=[],errors=[];
 for(let p=0;p<pages&&hasMore&&entriesSeen<maxEntries;p++){
  const endpoint=p===0?'https://api.dropboxapi.com/2/files/list_folder':
   'https://api.dropboxapi.com/2/files/list_folder/continue';
  const body=p===0?{path:folder,recursive:true,include_deleted:false,limit:500}:{cursor};
  let data;
  try{data=await readJson(await fetcher(endpoint,{method:'POST',headers,body:JSON.stringify(body)}));}
  catch(e){if(rows.length||entriesSeen){errors.push(T(e?.message||e));break;}throw e;}
  if(!Array.isArray(data.entries)||typeof data.has_more!=='boolean')
   throw Error('Metadati Dropbox non validi');
  for(const entry of data.entries){
   entriesSeen++;
   if(entriesSeen>maxEntries)break;
   const f=convertDropbox(entry,session.accountLabel);
   if(f)rows.push(f);
   else if(entry?.['.tag']==='file')invalid++;
  }
  hasMore=data.has_more||entriesSeen>maxEntries;
  cursor=T(data.cursor);
  if(hasMore&&!cursor){errors.push('Dropbox non ha restituito il cursore per la pagina successiva');break;}
 }
 const truncated=hasMore||entriesSeen>maxEntries||errors.length>0;
 if(invalid)errors.push(invalid+' file non audio/invalidi ignorati');
 return {rows,errors,truncated,entriesSeen,scope:folder||'radice',
  complete:!truncated};
}
function graphNext(next){
 const u=new URL(T(next));
 if(u.protocol!=='https:'||u.hostname!=='graph.microsoft.com'||
  !u.pathname.startsWith('/v1.0/me/drive/root/search(')||u.username||u.password)
  throw Error('Paginazione OneDrive non attendibile');
 return u.href;
}
function convertOneDrive(item,driveId){
 if(!item?.file||!T(item?.id)||!F.isAudio(item.name,item.file?.mimeType))return null;
 try{return F.record({provider:'onedrive',account:'OneDrive '+driveId.slice(0,155),
  externalKey:T(item.id),name:item.name,path:T(item.parentReference?.path).slice(0,1300),
  mime:T(item.file?.mimeType),size:item.size,modified:item.lastModifiedDateTime,
  url:item.webUrl,hash:null,origin:'scansione'});}catch{return null}
}
async function scanOneDrive({query,fetcher,pages=8,maxEntries=3000}={}){
 if(typeof fetcher!=='function')throw Error('Rete cloud non disponibile');
 const term=T(query);
 if(term.length<2||term.length>120)throw Error('Indica almeno 2 caratteri per cercare in OneDrive');
 if(!Number.isSafeInteger(pages)||pages<1||pages>10||!Number.isSafeInteger(maxEntries)||maxEntries<1||maxEntries>5000)
  throw Error('Limite ricerca OneDrive non valido');
 const session=authorization('onedrive'),headers={Authorization:'Bearer '+session.accessToken};
 const drive=await readJson(await fetcher('https://graph.microsoft.com/v1.0/me/drive?$select=id',{headers}));
 const driveId=T(drive.id);
 if(!driveId)throw Error('Identità OneDrive non disponibile');
 // Graph search q uses OData single-quote escaping, then encode URI for URL path.
 const escaped=term.replace(/'/g,"''");
 let next='https://graph.microsoft.com/v1.0/me/drive/root/search(q=\''+encodeURIComponent(escaped).replace(/'/g,'%27')+'\')?$top=200';
 let hasMore=true,seen=0,invalid=0;const rows=[],errors=[];
 for(let i=0;i<pages&&hasMore&&seen<maxEntries;i++){
  let data;
  try{data=await readJson(await fetcher(next,{headers}));}
  catch(e){if(rows.length||seen){errors.push(T(e?.message||e));break;}throw e;}
  if(!Array.isArray(data.value))throw Error('Risposta OneDrive senza elenco file valido');
  for(const item of data.value){
   seen++;
   if(seen>maxEntries)break;
   const f=convertOneDrive(item,driveId);
   if(f)rows.push(f);
   else if(item?.file)invalid++;
  }
  hasMore=Boolean(data['@odata.nextLink'])||seen>maxEntries;
  if(hasMore&&seen<=maxEntries){
   try{next=graphNext(data['@odata.nextLink']);}
   catch(e){errors.push(e.message);break;}
  }
 }
 const truncated=hasMore||seen>maxEntries||errors.length>0;
 if(invalid)errors.push(invalid+' file non audio/invalidi ignorati');
 return {rows,errors,truncated,entriesSeen:seen,scope:'ricerca: '+term,complete:!truncated};
}
root.KYV_CLOUD_BROWSER_V258=Object.freeze({
 STORAGE_KEY,configured,begin,finish,status,disconnect,scanDropbox,scanOneDrive,
 cleanDropboxPath,convertDropbox,convertOneDrive,graphNext
});
})(typeof window!=='undefined'?window:globalThis);
