/* KYV Taccuino C+D · regression on private files, local intelligence and manual Agenda handoff. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const uid='11111111-1111-4111-8111-111111111111';
const noteId='22222222-2222-4222-8222-222222222222';
const fileId='33333333-3333-4333-8333-333333333333';
const mock={crypto:{randomUUID:()=>fileId}};
vm.runInNewContext(read('kyv-notes-files.js'),{window:mock});
vm.runInNewContext(read('kyv-notes-smart.js'),{window:mock,Date,Intl});
const Files=mock.KYV_NOTES_FILES,Smart=mock.KYV_NOTES_SMART;
assert.equal(Files.MAX_BYTES,15*1024*1024);
assert.equal(Files.MAX_PER_NOTE,30);
assert.equal(Files.BUCKET,'kyv-notes-files');
assert.equal(Files.TYPES['application/pdf'],'pdf');
assert.equal(Files.TYPES['image/heic'],'heic');
assert.throws(()=>Files.validate({name:'evil.html',size:123,type:'text/html'}),/Formato/);
assert.throws(()=>Files.validate({name:'large.pdf',size:16*1024*1024,type:'application/pdf'}),/15 MB/);
assert.deepEqual(JSON.parse(JSON.stringify(Files.validate({name:'secret.pdf',size:200,type:'application/pdf'}))),
 {name:'secret.pdf',mime:'application/pdf',extension:'pdf',size:200});
assert.equal(Smart.suggest({content:'Devo chiamare il management domani'}).category,'todo');
assert.equal(Smart.suggest({content:'Ieri ho parlato con una label'}).category,'event');
assert.equal(Smart.suggest({content:'Idea per il ritornello'}).category,'idea');
assert.equal(Smart.suggest({content:'Una nota ordinaria'}).category,'info');
assert.equal(Smart.suggest({content:'La prima riga\nSeconda riga'}).title,'La prima riga');
assert.equal(Smart.suggest({content:'A'.repeat(500)}).summary.length<=240,true);
assert.match(Smart.suggest({content:'Idea'}).source,/locali/);
assert.equal(Smart.agendaUrl(noteId),'kyv_calendar.html?fromNote='+noteId);
assert.throws(()=>Smart.agendaUrl('../etc'),/non valida/);
const events=[{id:'a',created_at:'2026-11-18T09:00:00Z'},{id:'b',created_at:'2026-11-20T08:00:00Z'},
 {id:'c',created_at:'2026-11-20T10:00:00Z'}];
const grouped=Smart.groupTimeline(events);
assert.equal(grouped.length,2);
assert.deepEqual(Array.from(grouped[0].notes,e=>e.id),['c','b']);
assert.deepEqual(Array.from(grouped[1].notes,e=>e.id),['a']);
const state={notes:new Map([[noteId,{id:noteId,owner_id:uid}]]),files:[],
 uploads:[],downloads:[],removes:[],inserts:0,deletes:0};
function query(table){
 let filters=[],payload=null,method='select',wantCount=false;
 const q={
  select(cols,options){if(options?.count)wantCount=true;return q;},
  eq(k,v){filters.push([k,v]);return q;},
  order(){return q;},
  range:async(from,to)=>({data:state.files.filter(f=>filters.every(([k,v])=>String(f[k])===String(v))).slice(from,to+1),
    error:null,count:wantCount?state.files.filter(f=>filters.every(([k,v])=>String(f[k])===String(v))).length:null}),
  maybeSingle:async()=>({data:table==='kyv_notes'?state.notes.get(noteId):null,error:null}),
  insert(value){method='insert';payload=value;return q;},
  delete(){method='delete';return q;},
  single:async()=>{
   if(method==='insert'){state.inserts++;state.files.push(payload);return {data:payload,error:null};}
   throw Error('unsupported');
  },
 };
 if(table==='kyv_note_files'){
  q.select=(cols,options)=>{if(options?.count)wantCount=true;return q;};
  q.delete=()=>{method='delete';return q;};
  // Query delete .select('id') must return array, not normal select builder.
  const orig=q.select;
  q.select=(cols,options)=>{
   if(method==='delete'){
    const before=state.files.length;state.files=state.files.filter(f=>!filters.every(([k,v])=>String(f[k])===String(v)));
    state.deletes+=before-state.files.length;
    return Promise.resolve({data:before>state.files.length?[{id:fileId}]:[],error:null});
   }
   return orig(cols,options);
  };
 }
 return q;
}
const db={from:query,storage:{from:bucket=>{
 assert.equal(bucket,'kyv-notes-files');
 return {
  upload:async(path,file,opts)=>{state.uploads.push({path,file,opts});return {error:null};},
  download:async(path)=>{state.downloads.push(path);return {data:new Blob(['private']),error:null};},
  remove:async(paths)=>{state.removes.push(...paths);return {error:null};}
 };
}}};
(async()=>{
 const store=Files.createStore(db,uid);
 assert.deepEqual(Array.from(await store.list(noteId)),[]);
 const blob=new Blob(['%PDF-1.4'],{type:'application/pdf'});blob.name='documento.pdf';
 const meta=await store.upload(noteId,blob);
 assert.equal(meta.note_id,noteId);
 assert.equal(meta.owner_id,uid);
 assert.equal(meta.kind,'attachment');
 assert.equal(meta.mime_type,'application/pdf');
 assert.equal(meta.storage_path,uid+'/'+noteId+'/'+fileId+'.pdf');
 assert.equal(state.uploads[0].opts.upsert,false);
 assert.equal((await store.list(noteId)).length,1);
 assert.equal((await store.download(meta)).size,7);
 await assert.rejects(store.download({...meta,owner_id:'another'}),/autorizzato/);
 const gone=await store.remove(meta);
 assert.equal(gone.orphan,false);
 assert.equal(state.files.length,0);
 assert.deepEqual(state.removes,[meta.storage_path]);
 const html=read('kyv_notes.html'),agenda=read('kyv-agenda-from-note.js'),calendar=read('kyv_calendar.html'),
  advanced=read('kyv-notes-advanced.js'),style=read('kyv-notes-advanced.css'),sw=read('sw.js'),
  sql=read('docs/kyv-notes-phase-cd.sql');
 for(const script of ['kyv-notes-files.js','kyv-notes-smart.js','kyv-notes-advanced.js'])
  assert.ok(html.includes('src="'+script+'"'),script+' must load in Taccuino');
 assert.ok(html.includes('kyv-notes-advanced.css'));
 assert.ok(html.includes('advanced=KYV_NOTES_ADVANCED.init('),'Advanced panels are wired to authenticated notes');
 assert.ok(html.includes('advanced.renderTimeline(filtered,list)'),'Timeline respects existing search and filters');
 assert.ok(html.includes('advanced?.canLeave()'),'Unsaved pen strokes are guarded');
 assert.ok(html.includes('advanced?.hasUnsavedDrawing()'),'Beforeunload safeguards unsaved pen strokes');
 assert.ok(html.includes('makeSnapshot(forceAudio)'),'Existing blank notes can hold a drawing');
 for(const id of ['kyv-notes-canvas','kyv-notes-save-drawing','kyv-notes-pen-clear','kyv-notes-undo','kyv-notes-file-input',
  'kyv-notes-camera-input','kyv-notes-files-list','kyv-notes-view-timeline','kyv-notes-agenda','kyv-notes-suggest'])
  assert.ok(advanced.includes('id="'+id+'"'),id+' exists in panel');
 assert.match(advanced,/canvas\.addEventListener\('pointerdown',penStart\)/,'Pen/touch/mouse use pointer events');
 assert.match(advanced,/new File\(\[blob\],filename,\{type:'image\/png'\}\)/,'Canvas upload is lossless PNG');
 assert.match(advanced,/getImageData\(/,'Undo restores prior stroke');
 assert.match(advanced,/root\.confirm\('Hai un disegno non salvato/,'Do not discard ink silently');
 assert.match(advanced,/files\.upload\(/,'Files persist through private Storage');
 assert.match(advanced,/files\.download\(/,'Private downloads, never public links');
 assert.match(advanced,/S\.suggest\(/,'Deterministic offline suggestions');
 assert.match(advanced,/S\.agendaUrl\(saved\.id\)/,'Agenda note link only after verified note save');
 assert.doesNotMatch(advanced,/getPublicUrl\(|ai\.generate|openai\.com|anthropic\.com/,'No public files or unconsented AI API');
 assert.match(agenda,/\.eq\('owner_id',session\.user\.id\)/,'Agenda imports only owner note');
 assert.match(agenda,/get\('ev-date'\)\.value='';get\('ev-end-date'\)\.value='';/,'No invented appointment dates');
 assert.match(agenda,/allDay\.checked=true/,'Imported note defaults to local-only Agenda');
 assert.doesNotMatch(agenda,/saveManual\(|saveCreated\(|createEvent\(/,'Preview never schedules automatically');
 assert.ok(calendar.includes('src="kyv-agenda-from-note.js"'),'Agenda loads prefill bridge');
 assert.ok(style.includes('touch-action:none'),'Canvas is pen-and-touch friendly');
 for(const path of ['kyv-notes-files.js','kyv-notes-smart.js','kyv-notes-advanced.js','kyv-notes-advanced.css','kyv-agenda-from-note.js'])
  assert.ok(sw.includes("'./"+path+"'"),path+' included in PWA shell');
 assert.match(sql,/enable row level security/);
 assert.match(sql,/for insert to authenticated/);
 assert.match(sql,/for select to authenticated/);
 assert.match(sql,/for delete to authenticated/);
 assert.match(sql,/false,15728640/,'Dedicated private storage bucket');
 assert.match(sql,/owner_id::text \|\| '\/' \|\| note_id::text/,'Storage metadata linked to owner and note path');
 assert.equal(JSON.parse(read('package.json')).scripts['check:notes-advanced'],'node tools/test-notes-advanced.js');
 console.log('OK notes C+D: private files, owner control, drawing, chronology, local hints and confirmed Agenda handoff.');
})().catch(e=>{console.error(e);process.exitCode=1;});
