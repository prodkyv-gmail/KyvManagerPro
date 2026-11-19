/* KYV Taccuino A+B · owner access, non-destructive editing, audio and navigation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=name=>fs.readFileSync(name,'utf8');
const owner='11111111-1111-4111-8111-111111111111';
const id='22222222-2222-4222-8222-222222222222';
const other='33333333-3333-4333-8333-333333333333';
const w={crypto:{randomUUID:()=>other}};
vm.runInNewContext(read('kyv-notes-core.js'),{window:w,Blob,Date});
const api=w.KYV_NOTES_CORE;
assert.ok(api&&typeof api.createStore==='function');
assert.equal(api.TABLE,'kyv_notes');
assert.equal(api.BUCKET,'kyv-notes-audio');
assert.equal(api.CATEGORIES.length,4);
assert.equal(api.voiceFormat({isTypeSupported:x=>x==='audio/webm;codecs=opus'}),'audio/webm;codecs=opus');
assert.equal(api.voiceFormat(null),'');
assert.equal(api.audioMime('audio/webm;codecs=opus'),'audio/webm');
assert.equal(api.audioMime('text/plain'),null);
assert.equal(api.readableTitle({title:'',content:'Prima riga\nSeconda riga'}),'Prima riga');
assert.deepEqual(Array.from(api.CATEGORIES,c=>c.id),['idea','info','event','todo']);
assert.throws(()=>api.cleanPayload({id,category:'info',content:'x'},'not-uuid'),/Sessione/);
assert.throws(()=>api.cleanPayload({id,content:'a'.repeat(30001)},owner),/lunga/);
assert.throws(()=>api.cleanPayload({id,project_id:-5,content:'test'},owner),/Progetto/);
assert.equal(api.cleanPayload({id,category:'unexpected',content:' Ciao ',is_pinned:'nonblank'},owner).category,'info');
assert.equal(api.cleanPayload({id,content:'a',project_id:'23'},owner).project_id,23);
let storageData={};
const storage={getItem:k=>storageData[k]||null,setItem:(k,v)=>{storageData[k]=v;}};
const drafts=api.draftStore(owner,storage);
assert.equal(drafts.all().length,0);
assert.equal(drafts.put({id,title:'Bozza'}),true);
assert.equal(drafts.get(id).title,'Bozza');
assert.equal(drafts.all().length,1);
const pending=drafts.get(id).pending_at;
assert.equal(drafts.clear(id,'wrong'),false,'Cannot clear newer unsynced edits');
assert.equal(drafts.clear(id,pending),true);
assert.equal(drafts.all().length,0);
const saved=new Map([[id,{id,owner_id:owner,title:'Vecchia',content:'ciao',category:'info',audio_path:owner+'/'+id+'/memo.webm',is_pinned:false,is_archived:false,updated_at:'2026-11-18T20:00:00Z'}]]);
const tracked={insert:0,update:0,delete:0,uploaded:[],removed:[],download:[],selects:0};
function fakeQuery(){
 let type='select',where=[],payload=null,readCount=false,sort=null,descending=false;
 const self={
  select(_f,opts){if(type==='select'&&opts?.count)readCount=true;return self;},
  eq(key,val){where.push([key,val]);return self;},
  order(key,opts){sort=key;descending=opts?.ascending===false;return self;},
  range:async(start,end)=>{
   tracked.selects++;
   const rows=[...saved.values()].filter(row=>where.every(([k,v])=>String(row[k])===String(v)));
   rows.sort((a,b)=>descending?String(b[sort]).localeCompare(String(a[sort])):String(a[sort]).localeCompare(String(b[sort])));
   return {data:rows.slice(start,end+1),error:null,count:readCount?rows.length:null};
  },
  maybeSingle:async()=>{
   const result=[...saved.values()].find(row=>where.every(([k,v])=>String(row[k])===String(v)));
   return {data:result?{id:result.id}:null,error:null};
  },
  insert(value){type='insert';payload=value;return self;},
  update(value){type='update';payload=value;return self;},
  delete(_opts){type='delete';return self;},
  single:async()=>{
   if(type==='insert'){
    tracked.insert++;saved.set(payload.id,{...payload,created_at:payload.updated_at});return {data:saved.get(payload.id),error:null};
   }
   if(type==='update'){
    const row=[...saved.values()].find(row=>where.every(([k,v])=>String(row[k])===String(v)));
    if(!row)return {data:null,error:{message:'not found'}};
    tracked.update++;saved.set(row.id,{...row,...payload});return {data:saved.get(row.id),error:null};
   }
   throw Error('unsupported single');
  }
 };
 return self;
}
const fakeDb={
 from:table=>{assert.equal(table,'kyv_notes');return fakeQuery();},
 storage:{from:bucket=>{assert.equal(bucket,'kyv-notes-audio');return{
  upload:async(path,blob,opts)=>{tracked.uploaded.push({path,blob,opts});return {error:null};},
  remove:async(paths)=>{tracked.removed.push(...paths);return {error:null};},
  download:async(path)=>{tracked.download.push(path);return {data:new Blob(['voice'],{type:'audio/webm'}),error:null};}
 };}}
};
(async()=>{
 const store=api.createStore(fakeDb,owner);
 const list=await store.listAll();
 assert.equal(list.length,1);
 assert.equal(list[0].audio_path,owner+'/'+id+'/memo.webm');
 let row=await store.save({id,title:'Aggiornata',content:'Nuovo testo',category:'idea'});
 assert.equal(row.audio_path,owner+'/'+id+'/memo.webm','Text edits must preserve existing voice files');
 assert.equal(tracked.insert,0);assert.equal(tracked.update,1);
 const newNote=await store.save({id:other,title:'Nuova',content:'Promemoria',category:'event'});
 assert.equal(tracked.insert,1);
 assert.equal(newNote.owner_id,owner,'Store always assigns current authenticated owner');
 assert.equal((await store.listAll()).length,2);
 const blob=new Blob(['a','b','c'],{type:'audio/webm'});
 row=await store.uploadVoice(other,blob,3);
 assert.match(row.audio_path,new RegExp('^'+owner+'/'+other+'/'));
 assert.equal(tracked.uploaded[0].opts.upsert,false);
 assert.equal(tracked.uploaded[0].opts.contentType,'audio/webm');
 assert.equal((await store.loadVoice(row.audio_path)).size,5);
 await assert.rejects(store.loadVoice('someone-else/'+other+'/memo.webm'),/autorizzata/);
 await assert.rejects(store.uploadVoice(other,new Blob(['x'],{type:'text/plain'}),3),/Formato/);
 assert.equal(api.normalize('È Successo'), 'e successo');
 const home=read('index.html'),producer=read('kyv-producer-mode.js'),menu=read('menu.js'),page=read('kyv_notes.html'),quick=read('kyv-notes-quick.js'),sw=read('sw.js');
 assert.ok(home.indexOf('<strong>+ Note</strong>')<home.indexOf('<strong>Agenda</strong>'),'Home + Note before Agenda');
 assert.ok(producer.indexOf("['kyv_notes.html?new=1','+ Note'")<producer.indexOf("['kyv_calendar.html','Agenda'"),'Producer sidebar order');
 assert.ok(menu.indexOf("navItem('notes'")<menu.indexOf("navItem('calendar'"),'Legacy sidebar order');
 assert.ok(producer.includes("['kyv-notes-core.js','kyv-notes-voice.js','kyv-notes-quick.js']"),'Quick script loaded once');
 for(const key of ['notes-title','notes-content','notes-category','notes-project','notes-search','notes-filter-pinned',
  'notes-filter-archived','notes-upload-audio','notes-dictate','notes-record','notes-status'])
  assert.equal((page.match(new RegExp('id="'+key+'"','g'))||[]).length,1,key);
 assert.match(page,/KYV_AUTH.requireAuth\(\)/,'Notebook requires authenticated session');
 assert.match(page,/core\.draftStore\(session\.user\.id,window\.localStorage\)/,'Offline text draft recovery');
 assert.match(page,/scheduleSave/,'Autosave');
 assert.match(page,/store\.uploadVoice\(/,'Private voice persistence');
 assert.match(page,/store\.loadVoice\(/,'Playback downloads privately with auth');
 assert.match(page,/notes-filter-category/);
 assert.match(page,/if\(voice\?\.isRecording\(\)\|\|busyAudio\|\|audioPending\)/,'Unuploaded voice must not vanish on note switch');
 assert.match(quick,/KYV_AUTH.requireAuth\(\)/,'Quick entry requires authentication');
 assert.match(quick,/KYV_NOTES_VOICE.create/,'Voice capture available from quick entry');
 assert.match(quick,/dismiss\(true\)/,'Successful quick entry closes the dialog');
 assert.match(quick,/cacheDraft/,'Quick capture must write local draft');
 assert.match(quick,/kyv-notes-quick-download/,'Quick audio backup is available');
 assert.doesNotMatch(page,/getPublicUrl\(/,'No public audio URLs');
 for(const asset of ['kyv_notes.html','kyv-notes-core.js','kyv-notes-voice.js','kyv-notes-quick.js','kyv-notes.css'])
  assert.ok(sw.includes("'./"+asset+"'"),'PWA app shell includes '+asset);
 const sql=read('docs/kyv-notes-phase-ab.sql');
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/for select to authenticated/);
 assert.match(sql,/for insert to authenticated/);
 assert.match(sql,/for update to authenticated/);
 assert.match(sql,/for delete to authenticated/);
 assert.match(sql,/public, anon/,'Anonymous grants are revoked');
 assert.match(sql,/false,20971520/,'Private storage, bounded file sizes');
 assert.match(sql,/storage\.foldername\(name\)/,'Every storage policy restricts owner folder');
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.scripts['check:kyv-notes'],'node tools/test-kyv-notes.js');
 console.log('OK Taccuino A+B: secure owner notes, autosave/drafts, quick capture, voice, navigation, storage.');
})().catch(err=>{console.error(err);process.exit(1);});
