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
assert.match(html,/KYV_AGENDA_STORE\.importGoogle\(events\)/);
assert.match(html,/KYV_AGENDA_STORE\.saveCreated\(input,created\)/);
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
const rows=new Map(),userId='11111111-1111-4111-8111-111111111111';
const client={
 auth:{getUser:async()=>({data:{user:{id:userId}},error:null})},
 from(table){
  assert.equal(table,'KYV_AGENDA_EVENTI');
  return {
   select(){return {order(){return {range:async(a,b)=>{const data=[...rows.values()].sort((x,y)=>x.starts_at.localeCompare(y.starts_at)).slice(a,b+1);return {data,count:rows.size,error:null};}}}};},
   upsert:async(batch)=>{for(const x of batch)rows.set(x.owner_id+'|'+x.source+'|'+x.source_key,{...rows.get(x.owner_id+'|'+x.source+'|'+x.source_key),...x});return{error:null};}
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
assert.equal(api.normalizeGoogle({...google,id:null},userId),null,'Never pretend Google IDs are verified');
assert.equal(api.normalizeGoogle({...google,date:'invalid'},userId),null,'Invalid event date is not silently archived');
async function run(){
 await api.importGoogle([google,google]);assert.equal(rows.size,1,'Repeated ID in same sync deduped');
 await api.importGoogle([google]);assert.equal(rows.size,1,'Repeated sync must upsert not duplicate');
 await api.importGoogle([{...google,date:'2026-11-26T11:00:00+01:00',endDate:'2026-11-26T13:00:00+01:00'}]);
 assert.equal(rows.size,2,'Recurring occurrence with new day survives');
 await api.saveCreated({title:'Nota nel gestionale',date:'2026-11-27',time:'10:00',endTime:'11:00',description:'Solo app',location:'',activityType:'other'},null);
 assert.equal(rows.size,3,'Local-only planning is included in same table');
 assert.equal([...rows.values()].filter(x=>x.source==='manual').length,1);
 await api.importGoogle([]);
 assert.equal(rows.size,3,'Empty Google response cannot erase saved history');
 assert.ok(events.some(e=>e.type==='kyv:calendar-events'),'All views receive the same saved source');
 console.log('OK Agenda archivio: fonte unica, sync idempotente, storico, attività locali, RLS e responsive.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
