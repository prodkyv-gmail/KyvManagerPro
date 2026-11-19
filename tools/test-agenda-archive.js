/* Agenda archive: idempotency, ownership, history and unified UI regression. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
const store=read('kyv-agenda-store.js'),html=read('kyv_calendar.html'),
 views=read('kyv-calendar-views.js'),css=read('kyv-agenda-table.css'),
 sql=read('docs/agenda-archive-v282.sql'),workflow=read('kyv-workflow-nav.js'),
 sw=read('sw.js'),pkg=require('../package.json');
new vm.Script(store,{filename:'kyv-agenda-store.js'});
new vm.Script(views,{filename:'kyv-calendar-views.js'});
const inline=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(inline,{filename:'kyv_calendar:inline'});
assert.match(sql,/create table if not exists public\."KYV_AGENDA_EVENTI"/i);
assert.match(sql,/unique\(owner_id,source,source_key\)/);
assert.match(sql,/row level security/i);
assert.match(sql,/auth\.uid\(\)/);
assert.match(sql,/revoke delete on public/);
assert.doesNotMatch(sql,/for delete to authenticated/i);
assert.match(store,/\.upsert\(batch,\{onConflict:'owner_id,source,source_key'\}\)/);
assert.doesNotMatch(store,/\.delete\(|\.truncate\(/);
assert.match(html,/store\.importGoogle\(googleEvents\)/);
assert.match(html,/store\.saveCreated\(input,created\)/);
assert.match(html,/store\.validateNewEvent\(input\)/);
for(const field of ['ev-end-date','ev-all-day','ev-status','ev-remind-on','ev-workflow-note'])
  assert.ok(html.includes('id="'+field+'"'),'Main Nuova Attività includes popup field '+field);
for(const field of ['endDate','allDay','workflowStatus','remindOn','workflowNote'])
  assert.match(store,new RegExp('name="'+field+'"'),'Inline table form includes '+field);
assert.match(html,/created=await calendarRequest\('createEvent'/);
assert.match(html,/googleError=String/,'Google failure must be distinguishable from database persistence');
assert.match(html,/activeEvents=window\.KYV_AGENDA_STORE\?\.getEvents\(\)/,'Stored event details must remain clickable on reload');
assert.match(html,/id="kyv-calendar-connection-banner"/);
assert.ok(html.indexOf('id="kyv-calendar-connection-banner"')<html.indexOf('class="kyv-calendar-layout'));
assert.ok(html.includes('type="range" min="65" max="100"'));
assert.ok(!workflow.split('const supported=new Set(')[1].split(');')[0].includes("'kyv_calendar.html'"),'Agenda does not include top Scheda/Ascolto/Agenda/Oggi workflow strip');
assert.match(css,/\.kyv-cal-group[\s\S]*flex-wrap:nowrap!important/,'View selector must remain one row');
assert.match(css,/overflow-y:scroll!important/,'Full-height vertical scrollbar must be available');
assert.match(views,/return 'list';/,'Unified table is default');
assert.match(views,/state\.periodEvents=eventsInRange\(state\.events,savedBounds\)/,'Existing calendar views must use persisted events');
assert.ok(sw.includes("'./kyv-agenda-store.js'")&&sw.includes("'./kyv-agenda-table.css'"));
assert.equal(pkg.scripts['check:agenda-archive'],'node tools/test-agenda-archive.js');
let sequence=0;
const rows=new Map(),userId='11111111-1111-4111-8111-111111111111';
let suppressUpsert=false;
const client={
 auth:{getUser:async()=>({data:{user:{id:userId}},error:null})},
 from(table){
  assert.equal(table,'KYV_AGENDA_EVENTI');
  return {
   select(){return {order(){return {range:async(a,b)=>{const data=[...rows.values()].sort((x,y)=>x.starts_at.localeCompare(y.starts_at)).slice(a,b+1);return {data,count:rows.size,error:null};}}}};},
   upsert:async(batch)=>{if(suppressUpsert)return {error:null};for(const x of batch){const key=x.owner_id+'|'+x.source+'|'+x.source_key;rows.set(key,{id:rows.get(key)?.id||'fake-row-'+(++sequence),...rows.get(key),...x,workflow_status:x.workflow_status||rows.get(key)?.workflow_status||'da_fare',remind_on:x.remind_on===undefined?rows.get(key)?.remind_on||null:x.remind_on});}return{error:null};},
   update(patch){const filters={};return {eq(k,v){filters[k]=v;return this;},is(k,v){filters[k]=v;return this;},async select(){for(const [key,row]of rows){if(row.id===filters.id&&row.owner_id===filters.owner_id&&
      (filters.deleted_at===undefined||(row.deleted_at||null)===filters.deleted_at)){
      const updated={...row,...patch};rows.set(key,updated);return{data:[updated],error:null};}}
      return{data:[],error:null};}};}
  };
 }
};
const events=[];
const win={location:{pathname:'/kyv_calendar.html'},
 document:{readyState:'loading',addEventListener(){},getElementById:id=>id==='events-list'?{innerHTML:''}:null},
 KYV:{createSupabaseClient:()=>client},
 dispatchEvent:e=>events.push(e)};
const context={window:win,CustomEvent:class{constructor(type,data){this.type=type;this.detail=data.detail;}},Date,Map,Set,Error,Array,Number,Math,Intl};
vm.runInNewContext(store,context);
const api=win.KYV_AGENDA_STORE;
assert.ok(api,'Archive API initialized');
const google={
 id:'recurring-event',title:'Sessione studio',date:'2026-11-25T11:00:00+01:00',
 endDate:'2026-11-25T13:00:00+01:00',description:'Bozza di prova',location:'Studio'
};
assert.equal(api.normalizeGoogle(google,userId).source_key,'recurring-event#2026-11-25');
assert.equal(api.normalizeGoogle({...google,date:'2026-11-26T11:00:00+01:00'},userId).source_key,'recurring-event#2026-11-26',
 'Recurring dates must not overwrite one another');
assert.equal(api.normalizeGoogle({...google,id:null},userId).calendar_id,null,'Legacy event has no Google ID but must still be visible and persistable');
assert.equal(api.normalizeGoogle({...google,date:'invalid'},userId),null,'Invalid event date is not silently archived');
assert.match(store,/workflow_status=kept.workflow_status/,'Google refresh must retain manually assigned status');
assert.match(store,/kyv-agenda-inline-form/,'Table has native manual entry form');
assert.match(store,/updateWorkflow\(id,workflow_status,remind_on/,'Table can update workflow state and reminder');
assert.match(html,/reportSync/,'Sync exposes separate Google/archive stages');
assert.match(html,/segment<3/,'Read 90 days via three supported date windows');
assert.match(read('docs/agenda-workflow-reminders-v283.sql'),/workflow_status/);
assert.match(read('docs/agenda-workflow-reminders-v283.sql'),/remind_on/);
const editMigration=read('docs/agenda-event-editor-soft-delete-v284.sql');
assert.match(editMigration,/add column if not exists edited_in_app/);
assert.match(editMigration,/add column if not exists deleted_at/);
assert.doesNotMatch(editMigration,/\bdelete\s+from\b/i,'No destructive migration');
const phase5=read('kyv-agenda-phase5.js');
assert.match(phase5,/Nuova Attività/);
assert.doesNotMatch(phase5,/Pianifica attività/);
assert.match(phase5,/kyv-activity-width/,'Planner uses its own width slider');
assert.match(views,/root\.KYV_AGENDA_STORE\.updateEvent\(ev\.archiveId,input\)/);
assert.match(views,/root\.KYV_AGENDA_STORE\.deleteEvent\(ev\.archiveId\)/);
assert.match(css,/\.kyv-cal-detail-dialog/,'Editable popup has responsive styles');
async function run(){
 await api.importGoogle([google,google]);assert.equal(rows.size,1,'Repeated ID in same sync deduped');
 await api.importGoogle([google]);assert.equal(rows.size,1,'Repeated sync must upsert not duplicate');
 const first=[...rows.values()][0];
 await api.updateWorkflow(first.id,'da_rivedere','2026-12-01','Richiamare il cliente');
 assert.equal([...rows.values()][0].workflow_status,'da_rivedere');
 assert.equal([...rows.values()][0].remind_on,'2026-12-01');
 await api.importGoogle([google]); // Reimport never resets the saved manual workflow.
 assert.equal([...rows.values()][0].workflow_status,'da_rivedere');
 assert.equal([...rows.values()][0].workflow_note,'Richiamare il cliente');
 assert.equal([...rows.values()][0].remind_on,'2026-12-01');
 await assert.rejects(api.updateWorkflow(first.id,'posticipato','', ''),/scegli prima una data/);
 await api.updateWorkflow(first.id,'posticipato','2026-12-07','Spostato promemoria');
 assert.equal([...rows.values()][0].remind_on,'2026-12-07');

 await api.importGoogle([{...google,date:'2026-11-26T11:00:00+01:00',endDate:'2026-11-26T13:00:00+01:00'}]);
 assert.equal(rows.size,2,'Recurring occurrence with new day survives');
 await api.saveCreated({title:'Nota nel gestionale',date:'2026-11-27',time:'10:00',endTime:'11:00',description:'Solo app',location:'',activityType:'other'},null);
 assert.equal(rows.size,3,'Local-only planning is included in same table');
 assert.equal([...rows.values()].filter(x=>x.source==='manual').length,1);
 await api.importGoogle([]);
 assert.equal(rows.size,3,'Empty Google response cannot erase saved history');
 await api.saveManual({title:'Attività locale',date:'2026-11-28',time:'08:30',endTime:'09:30',activityType:'followup'},);
 assert.equal(rows.size,4,'Inline manual row is persisted in same table');
 const edited=await api.updateEvent(first.id,{
   title:'Sessione · prova aggiornata',date:'2026-11-25',endDate:'2026-11-25',
   time:'12:00',endTime:'14:00',activityType:'session',
   description:'Partecipanti integrati',location:'Studio 2',
   workflowStatus:'da_rivedere',remindOn:'2026-12-04',workflowNote:'Contattare manager'
 });
 assert.equal(edited.title,'Sessione · prova aggiornata');
 assert.equal(edited.description,'Partecipanti integrati');
 assert.equal(api.toEvent(edited).archiveId,first.id,'Popup must receive Supabase row ID');
 await api.importGoogle([google]);
 assert.equal([...rows.values()].find(r=>r.id===first.id).title,'Sessione · prova aggiornata',
   'Google reimport must preserve manually edited title');
 assert.equal([...rows.values()].find(r=>r.id===first.id).location,'Studio 2',
   'Google reimport must preserve supplemented details');
 await api.deleteEvent(first.id);
 assert.equal(rows.size,4,'Soft removal never destroys historical records');
 assert.equal(api.getState().rows.some(r=>r.id===first.id),false,'Deleted events disappear from visible Agenda');
 assert.equal(api.getState().hiddenKeys.has('google|recurring-event#2026-11-25'),true);
 await api.importGoogle([google]);
 assert.equal(api.getState().rows.some(r=>r.id===first.id),false,'Removed Google event must not resurrect');
 assert.equal([...rows.values()].find(r=>r.id===first.id).deleted_at!=null,true);
 assert.equal(events[events.length-1].detail.persisted,true,'Successful table saves are marked as persisted');
 suppressUpsert=true;
 await assert.rejects(api.importGoogle([{...google,id:'unverified',title:'Evento Google mai scritto'}]),/non presenti nella tabella/,
   'An acknowledged but missing database write must never be reported as saved');
 suppressUpsert=false;
 assert.equal(rows.size,4,'Silent failure cannot add a row');
 api.showPreview([google,{...google,id:'preview-1',title:'Evento Google non salvato'}],'Rete Supabase non disponibile');
 assert.equal(rows.size,4,'Preview never writes unverified rows to database');
 assert.equal(api.getState().previewRows.length,1,'Already persisted events are excluded from unsaved preview');
 assert.ok(api.getEvents().some(x=>x.title==='Evento Google non salvato'));
 assert.equal(api.getEvents().find(x=>x.title==='Evento Google non salvato').stored,false,
   'Google preview events must not claim to be stored');
 assert.equal(events[events.length-1].detail.persisted,false,'Combined calendar events must flag an unsaved preview');
 api.reportSync({stage:'salvataggio',googleCount:1,savedCount:null,storedCount:4,error:'Rete indisponibile'});
 assert.equal(api.getState().diagnostics.stage,'salvataggio');
 assert.ok(events.some(e=>e.type==='kyv:calendar-events'),'All views receive the same saved source');
 await assert.rejects(api.saveManual({title:'Spostata',date:'2026-12-10',endDate:'2026-12-10',
   allDay:true,activityType:'session',workflowStatus:'posticipato'}),/indica una data/,
   'Posticipato requires a reminder date before any write');
 const full=await api.saveManual({title:'Sessione · Intera giornata',date:'2026-12-24',endDate:'2026-12-26',
   allDay:true,activityType:'session',location:'Studio A',description:'Autori e partecipanti',
   workflowStatus:'posticipato',remindOn:'2027-01-03',workflowNote:'Da spostare'});
 assert.equal(full.all_day,true);
 assert.equal(full.workflow_status,'posticipato');
 assert.equal(full.remind_on,'2027-01-03');
 assert.equal(full.workflow_note,'Da spostare');
 assert.equal(full.description,'Autori e partecipanti');
 assert.equal(full.event_date,'2026-12-24');
 assert.equal(api.toEvent(full).allDay,true);
 assert.equal(rows.size,5,'New all-day row is persisted once without losing history');
 console.log('OK Agenda archivio: nuove attività complete, stati, scadenze, storico e viste.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
