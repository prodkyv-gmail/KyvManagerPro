// v2.44: verify session and pitch semantics, authorization DDL and UI integration.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),w={};
vm.runInNewContext(read('kyv-creative-desk-v244.js'),{window:w,Map,Set,Date,Math,Number,Object,Error});
const E=w.KYV_CREATIVE_DESK_V244;
assert.ok(E?.analyze);
const input={
 sessions:[
  {id:'s1',data_sessione:'2026-03-01',durata_minuti:210,esito:'demo',archiviata:false},
  {id:'s2',data_sessione:'2026-03-02',durata_minuti:null,esito:'produzione',archiviata:false},
  {id:'s3',data_sessione:'2026-03-03',durata_minuti:90,esito:'pubblicazione',archiviata:true}
 ],
 links:[
  {id:'l1',id_sessione:'s1',id_progetto:1,annullato:false},
  {id:'l2',id_sessione:'s2',id_progetto:1,annullato:false},
  {id:'l3',id_sessione:'s2',id_progetto:2,annullato:true},
  {id:'l4',id_sessione:'s3',id_progetto:2,annullato:false}
 ],
 projects:[{ID:1,TITOLO:'A',FEE:'0,00'},{ID:2,TITOLO:'B',FEE:'1000,00'}],
 pitches:[
  {id:'p1',id_progetto:1,destinatario:'Artista A',stato:'in_ascolto',prossimo_followup:'2026-10-01',archiviata:false},
  {id:'p2',id_progetto:1,destinatario:'Label B',stato:'rifiutato',prossimo_followup:'2026-10-01',archiviata:false},
  {id:'p3',id_progetto:2,destinatario:'A&R C',stato:'confermato',prossimo_followup:'2026-11-05',archiviata:true}
 ],
 events:[{id:'e1',id_piazzamento:'p1',nota:'Note'}]
};
const a=E.analyze(input,'2026-10-31');
assert.equal(a.sessions,2);assert.equal(a.pitches,2);
assert.equal(a.projectsWithSession,1,'Two sessions on one song remain one linked project');
assert.equal(a.sessionsWithoutProject,0);
assert.equal(a.pitchesWithoutRecordedSession,0);
assert.equal(a.durationMin,210,'Archived or unknown durations are excluded');
assert.equal(a.datedDurationSessions,1);
assert.equal(a.sessionOutcomes.demo,1);
assert.equal(a.sessionOutcomes.pubblicazione,0,'Archived session excluded');
assert.equal(a.pitchStages.rifiutato,1);
assert.equal(a.overdue.length,1,'Rejected pitches are not follow-ups');
assert.equal(a.upcoming.length,0);
assert.equal(a.conversionRate,null,'No inferred conversion from projects or dates');
assert.match(a.feeCaveat,/FEE=0/);
assert.throws(()=>E.analyze(input,'not a date'));
const zero=E.analyze({sessions:[],links:[],pitches:[],projects:[{ID:1,FEE:'0,00'}]},'2026-10-31');
assert.equal(zero.sessions,0);assert.equal(zero.conversionRate,null,'No assumed sessions from legacy projects');
const sql=read('docs/v244-creative-sessions-pitches.sql'),audit=read('docs/v244-session-audit.sql');
for(const table of ['KYV_SESSIONI','KYV_SESSIONI_PROGETTI','KYV_PIAZZAMENTI','KYV_PIAZZAMENTI_EVENTI'])
 assert.ok(sql.includes('public."'+table+'"'),'Missing table '+table);
for(const name of ['KYV_SESSIONI','KYV_SESSIONI_PROGETTI','KYV_PIAZZAMENTI','KYV_PIAZZAMENTI_EVENTI'])
 assert.ok(sql.includes('alter table public."'+name+'" enable row level security'),name+' RLS');
assert.ok(sql.includes('auth.uid()'));
assert.ok(sql.includes("exists (select 1 from public.\"PROGETTI\" where \"ID\"=new.id_progetto and owner_id=new.owner_id)"));
assert.ok(sql.includes('foreign key (owner_id,id_sessione)'),'Session link owner must match parent');
assert.ok(sql.includes('foreign key (owner_id,id_piazzamento)'),'Pitch history owner must match parent');
assert.ok(sql.includes('annullato boolean not null default false'),'Links must be reversible');
assert.ok(sql.includes('archiviata boolean not null default false'),'No destructive archive');
assert.doesNotMatch(sql,/alter table public\."PROGETTI"|update public\."PROGETTI"|delete from public\."PROGETTI"/i,'Do not rewrite historical projects');
assert.doesNotMatch(sql+audit,/grant\s+delete|grant\s+truncate/i,'No destructive rights on new tables');
assert.ok(audit.includes('kyv_session_audit_changes'));
assert.ok(audit.includes('enable row level security'));
const ui=read('kyv-creative-desk-ui-v244.js'),html=read('kyv_scrivania_creativa.html');
assert.ok(ui.includes("count:'exact'"),'Read complete paginated data');
for(const table of ['PROGETTI','KYV_SESSIONI','KYV_PIAZZAMENTI','KYV_SESSIONI_PROGETTI','KYV_SESSIONI_EVENTI','KYV_PIAZZAMENTI_EVENTI'])
 assert.ok(ui.includes("'"+table+"'"),'UI must read '+table);
assert.ok(ui.includes("await save('KYV_SESSIONI',payload,id)"));
assert.ok(ui.includes("await save('KYV_PIAZZAMENTI',payload,id)"));
assert.ok(ui.includes("await save('KYV_SESSIONI_PROGETTI',{annullato:true},id)"));
assert.ok(ui.includes('data-archive-session')&&ui.includes('data-archive-pitch'));
assert.ok(!ui.includes(".delete("),'Never delete historic data');
assert.ok(html.includes('id="session-form"')&&html.includes('id="pitch-form"'));
assert.ok(html.includes('id="session-link-form"'));
assert.ok(html.includes('loadKyvSidebar('));
assert.ok(html.includes('id="desk-app-version"')&&ui.includes('KYV_CONFIG?.APP_VERSION'));
assert.ok(read('kyv_analyst.html').includes('id="kyv-analyst-app-version"'));
assert.ok(read('kyv-analyst-ui-v241.js').includes("release.textContent='v'"));
assert.ok(read('kyv-producer-mode.js').includes("kyv_scrivania_creativa.html','Scrivania creativa"));
assert.ok(read('menu.js').includes("'kyv_scrivania_creativa.html', 'calendar-range'"));
assert.ok(read('integrazioni.html').includes('href="kyv_scrivania_creativa.html"'));
assert.ok(read('kyv_analyst.html').includes('id="analyst-creative-desk"'));
assert.ok(read('kyv-analyst-ui-v241.js').includes("allRows(c,'KYV_SESSIONI'"));
const sw=read('sw.js'),pkg=JSON.parse(read('package.json'));
assert.ok(sw.includes("kyv-studio-v2-62-creative-audio-20261104"));
for(const asset of ['kyv_scrivania_creativa.html','kyv-creative-desk-v244.js','kyv-creative-desk-ui-v244.js'])
 assert.ok(sw.includes("'./"+asset+"'"),'PWA must cache '+asset);
assert.equal(pkg.version,'2.62.0');
assert.equal(pkg.scripts['check:creative-desk-v244'],'node tools/test-creative-desk-v244.js');
assert.ok(pkg.scripts.check.includes('check:creative-desk-v244'));
console.log('OK: KYV creative desk v2.44, zero imaginary sessions, owner safeguards, audit, navigation and analyst integration');
