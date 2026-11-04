// KYV v2.58 — OAuth PKCE, strict manual cloud discovery and no implicit ownership or writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8'),root={};
const context={window:root,Map,Set,Object,Number,Date,Intl,URL,URLSearchParams,TextEncoder,Uint8Array,Promise,Error};
for(const path of ['kyv-audio-finder-v245.js','kyv-cloud-browser-v258.js'])
 vm.runInNewContext(read(path),context,{filename:path});
const B=root.KYV_CLOUD_BROWSER_V258,F=root.KYV_AUDIO_FINDER_V245;
const memory=()=>{const m=new Map();return {
 getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),
 removeItem:k=>m.delete(k),_m:m
}};
const ok=data=>({ok:true,status:200,json:async()=>data});
const config={DROPBOX_APP_KEY:'abcdefgh123',MICROSOFT_CLIENT_ID:'abcdef00-abcd-1234-9876-abcdef012345'};
const url='https://kyv.example/kyv_audio_finder.html?project=12';
async function main(){
 assert.equal(B.configured('onedrive',{}),false);
 assert.equal(B.configured('dropbox',{DROPBOX_APP_KEY:'bad'}),false);
 assert.equal(B.configured('dropbox',config),true);
 assert.equal(B.configured('onedrive',config),true);
 await assert.rejects(B.begin('onedrive',{config:{},url,storage:memory(),crypt:webcrypto}),/OneDrive non configurato/);
 const store=memory(),now=Date.now(),callback='https://kyv.example/kyv_audio_finder.html';
 const authorization=await B.begin('dropbox',{config,url,storage:store,crypt:webcrypto,now});
 const page=new URL(authorization);
 assert.equal(page.hostname,'www.dropbox.com');
 assert.equal(page.searchParams.get('response_type'),'code');
 assert.equal(page.searchParams.get('code_challenge_method'),'S256');
 assert.equal(page.searchParams.get('scope'),'files.metadata.read');
 assert.equal(page.searchParams.get('redirect_uri'),callback);
 const pkce=JSON.parse(store.getItem(B.STORAGE_KEY));
 assert.ok(pkce.verifier.length>=40);
 assert.equal(pkce.provider,'dropbox');
 assert.equal(pkce.redirect,callback);
 assert.ok(!store.getItem(B.STORAGE_KEY).includes('access_token'));
 let exchange=0,cleaned='';
 await assert.rejects(B.finish({url:callback+'?state=wrong&code=abc',storage:store,config,
   fetcher:async()=>{exchange++;return ok({access_token:'x'})},historyReplace:s=>cleaned=s,now:now+1000}),/non valida/);
 assert.equal(exchange,0,'Never exchange code on invalid OAuth state');
 assert.equal(cleaned,'/kyv_audio_finder.html');
 assert.equal(store.getItem(B.STORAGE_KEY),null,'PKCE state cleaned even on failed callback');
 const retry=await B.begin('dropbox',{config,url,storage:store,crypt:webcrypto,now});
 const state=new URL(retry).searchParams.get('state');
 const finished=await B.finish({url:callback+'?code=oauth_code&state='+state,storage:store,config,now:now+1000,
  historyReplace:s=>cleaned=s,
  fetcher:async(u,opts)=>{
   exchange++;
   assert.equal(u,'https://api.dropboxapi.com/oauth2/token');
   assert.ok(opts.body.includes('code_verifier='));
   assert.ok(!opts.body.includes('client_secret'));
   return ok({access_token:'TEMPORARY_DROPBOX',expires_in:3600,account_id:'dbid:studio'});
  }});
 assert.equal(finished.provider,'dropbox');
 assert.equal(B.status('dropbox').connected,true);
 assert.equal(B.status('dropbox').accountLabel,'Dropbox OAuth dbid:studio');
 assert.equal(store.getItem(B.STORAGE_KEY),null);
 let requests=[];
 const drop=await B.scanDropbox({path:'/Studio/Mie sessioni',pages:3,fetcher:async(u,opts)=>{
  requests.push([u,JSON.parse(opts.body),opts.headers.Authorization]);
  if(u.endsWith('/list_folder'))return ok({entries:[
   {'.tag':'file',id:'id:a',name:'Emma demo.wav',path_display:'/Studio/Mie sessioni/Emma demo.wav',
    size:1400,client_modified:'2026-10-30T11:00:00Z',content_hash:'a'.repeat(64)},
   {'.tag':'file',id:'id:skip',name:'Manuale.pdf'},
   {'.tag':'folder',id:'id:folder',name:'Subfolder'}],has_more:true,cursor:'cursor1'});
  return ok({entries:[{'.tag':'file',id:'id:b',name:'Emma master.flac',size:1900}],has_more:false,cursor:'cursor2'});
 }});
 assert.equal(drop.rows.length,2);
 assert.equal(drop.rows[0].provider,'dropbox');
 assert.equal(drop.rows[0].external_key,'id:a');
 assert.equal(drop.rows[0].content_hash,null,'Dropbox content_hash is not raw SHA-256');
 assert.ok(drop.rows.every(f=>!f.link_file),'Do not create speculative Dropbox links');
 assert.equal(drop.rows[0].account_label,'Dropbox OAuth dbid:studio');
 assert.equal(drop.truncated,false);
 assert.equal(requests.length,2);
 assert.equal(requests[0][1].recursive,true);
 assert.equal(requests[0][1].path,'/Studio/Mie sessioni');
 assert.equal(requests[1][1].cursor,'cursor1');
 assert.equal(requests[0][2],'Bearer TEMPORARY_DROPBOX');
 assert.throws(()=>B.cleanDropboxPath('../x'),/Cartella/);
 assert.throws(()=>B.cleanDropboxPath('/x/../secret'),/Cartella/);
 assert.throws(()=>B.cleanDropboxPath('/x\\secret'),/Cartella/);
 const limited=await B.scanDropbox({pages:1,fetcher:async()=>ok({entries:[
 {'.tag':'file',id:'id:limited',name:'Provino.wav'}],has_more:true,cursor:'more'})});
 assert.equal(limited.truncated,true,'Must not call capped discovery complete');
 B.disconnect('dropbox');assert.equal(B.status('dropbox').connected,false);
 await assert.rejects(B.scanDropbox({fetcher:async()=>ok({entries:[]})}),/scaduta/);
 const store2=memory(),onedriveAuth=await B.begin('onedrive',{config,url,storage:store2,crypt:webcrypto,now});
 const microsoft=new URL(onedriveAuth);
 assert.equal(microsoft.hostname,'login.microsoftonline.com');
 assert.equal(microsoft.searchParams.get('scope'),'Files.Read');
 assert.equal(microsoft.searchParams.get('response_type'),'code');
 const result=await B.finish({url:callback+'?code=ms_code&state='+microsoft.searchParams.get('state'),
  storage:store2,config,now:now+1000,historyReplace:s=>cleaned=s,
  fetcher:async(u,opts)=>{
   assert.ok(u.endsWith('/oauth2/v2.0/token'));
   assert.ok(opts.body.includes('scope=Files.Read'));
   return ok({access_token:'TEMPORARY_GRAPH',expires_in:3600});
  }});
 assert.equal(result.provider,'onedrive');
 const requests2=[];
 const search=await B.scanOneDrive({query:"L'estate",fetcher:async(u,opts)=>{
  requests2.push(u);
  assert.equal(opts.headers.Authorization,'Bearer TEMPORARY_GRAPH');
  if(u.includes('/me/drive?$select=id'))return ok({id:'drive-kyv'});
  if(requests2.length===2)return ok({value:[
    {id:'item1',name:'Mia estate mix.wav',file:{mimeType:'audio/wav'},size:4000,
     webUrl:'https://example-my.sharepoint.com/personal/user/Documents/mix.wav',
     parentReference:{path:'/drive/root:/Studio'},lastModifiedDateTime:'2026-11-03T10:00:00Z'},
    {id:'item2',name:'Doc.pdf',file:{mimeType:'application/pdf'}}],
   '@odata.nextLink':'https://graph.microsoft.com/v1.0/me/drive/root/search(q=%27estate%27)?$skiptoken=next'});
  return ok({value:[{id:'item3',name:'Mia estate master.flac',file:{mimeType:'audio/flac'},size:7000}],});
 }});
 assert.equal(search.rows.length,2);
 assert.equal(search.rows[0].provider,'onedrive');
 assert.equal(search.rows[0].account_label,'OneDrive drive-kyv');
 assert.equal(search.rows[0].external_key,'item1');
 assert.equal(search.truncated,false);
 assert.ok(requests2[1].includes("L%27%27estate"),'Graph OData apostrophe must be escaped');
 assert.throws(()=>B.graphNext('https://evil.test/v1.0/me/drive/root/search(q=x)'),/non attendibile/);
 const partial=await B.scanOneDrive({query:'estate',pages:1,fetcher:async(u)=>
  u.includes('?$select=id')?ok({id:'drive-kyv'}):ok({value:[{id:'x',name:'ok.wav',file:{mimeType:'audio/wav'}}],
  '@odata.nextLink':'https://graph.microsoft.com/v1.0/me/drive/root/search(q=x)?skiptoken=again'})});
 assert.equal(partial.truncated,true);
 await assert.rejects(B.scanOneDrive({query:'x',fetcher:async()=>ok({})}),/2 caratteri/);
 B.disconnect('onedrive');
 const html=read('kyv_audio_finder.html'),ui=read('kyv-audio-finder-ui-v245.js'),sw=read('sw.js'),
  sql=read('docs/v258-onedrive-provider.sql'),configJs=read('config.js');
 for(const id of ['finder-dropbox-connect','finder-dropbox-online','finder-dropbox-folder',
   'finder-onedrive-connect','finder-onedrive-search','finder-onedrive-query',
   'cloud-dropbox-status','cloud-onedrive-status'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.includes('src="kyv-cloud-browser-v258.js"'));
 assert.ok(ui.includes('CLOUD.scanDropbox('));
 assert.ok(ui.includes('CLOUD.scanOneDrive('));
 assert.ok(ui.includes('history.replaceState(null'));
 assert.ok(ui.includes('!window.KYV_CONFIG?.ONEDRIVE_INDEX_ENABLED'));
 assert.ok(ui.includes("previewScan(r.rows,note,null,true)"));
 assert.ok(!read('kyv-cloud-browser-v258.js').includes('localStorage'),'OAuth token not persisted');
 assert.ok(sql.includes("check(provider in ('local','drive','dropbox','onedrive'))"));
 assert.ok(sql.includes('KYV_AUDIO_DECISIONI')&&sql.includes('KYV_AUDIO_INDICE'));
 assert.ok(configJs.includes('ONEDRIVE_INDEX_ENABLED: false'));
 assert.ok(sw.includes("'./kyv-cloud-browser-v258.js'"));
 assert.equal(JSON.parse(read('package.json')).version,'2.67.0');
 assert.equal(read('VERSION').trim(),'2.67');
 assert.ok(read('guida.html').includes('v2.58'));
 assert.ok(read('kyv-help.js').includes('v2.58'));
 console.log('OK: v2.58 PKCE and strictly triggered read-only Dropbox + OneDrive discovery');
}
main().catch(e=>{console.error(e);process.exitCode=1});
