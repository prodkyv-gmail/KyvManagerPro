// KYV v2.54 — read-only grouped discovery and exact, eligible user-checked mass classification.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),root={},ctx={window:root,Map,Set,Object,Number,Date,Intl,Error,URL};
for(const file of ['kyv-audio-finder-v245.js','kyv-audio-consent-v248.js','kyv-audio-groups-v249.js','kyv-audio-review-batch-v254.js'])
 vm.runInNewContext(read(file),ctx,{filename:file});
const J=root.KYV_AUDIO_REVIEW_BATCH_V254,C=root.KYV_AUDIO_CONSENT_V248;
const f=(id,name,overrides={})=>({
 id,provider:'drive',account_label:'Studio',external_key:id,nome_file:name,mime_type:'audio/wav',
 _sync:{state:'pending',previousDecision:'da_verificare'},decision:'da_verificare',_explicit:false,...overrides
});
const rows=[
 f('a','Emma - Luce blu DEMO_v1.wav'),
 f('b','Emma - Luce blu MIX_v2.wav',{provider:'dropbox'}),
 f('c','Giorgia - Luce blu master.wav'),
 f('d','Luce blu master.wav'),
 f('e','audio.wav'),
 f('r','Emma - Luce blu demo.wav',{decision:'reference',_sync:{state:'excluded',previousDecision:'reference'}}),
 f('m','Emma - Luce blu MASTER.wav',{decision:'mio',_sync:{state:'unchanged',previousDecision:'mio'}}),
 f('u','Emma - Luce blu v5.wav',{decision:'mio',_sync:{state:'changed',previousDecision:'mio'}}),
 f('p','Emma - Luce blu demo v6.wav',{_explicit:true,decision:'mio'})
];
const groups=J.classifyGroups(rows),emma=groups.find(x=>x.artist==='Emma'&&x.title==='Luce blu'),
 giorgia=groups.find(x=>x.artist==='Giorgia'&&x.title==='Luce blu'),
 unknown=groups.find(x=>x.title==='Luce blu'&&x.artistUnknown);
assert.ok(emma&&giorgia&&unknown,'Different artists and unknown artist must have distinct groups');
assert.equal(emma.count,6);
assert.equal(giorgia.count,1);assert.equal(unknown.count,1);
assert.ok(emma.sources.includes('drive')&&emma.sources.includes('dropbox'));
assert.equal(groups.reduce((sum,g)=>sum+g.count,0),rows.length);
assert.ok(groups.find(x=>x.title==='audio.wav'),'Generic title preserved as isolated review item');
assert.equal(J.filteredGroups(groups,{mode:'multi'}).some(g=>g.id===emma.id),true);
assert.equal(J.filteredGroups(groups,{query:'Luce blu',source:'dropbox'}).length,1);
assert.equal(J.find(groups,'does-not-exist'),null);
assert.deepEqual(Array.from(J.narrowIndices([0,1,2,3],groups,emma.id)),[0,1]);
assert.equal(J.narrowIndices([2,3],groups,emma.id).length,0);
assert.ok(J.bulkEligible(rows[0])&&J.bulkEligible(rows[1]));
assert.equal(J.bulkEligible(rows[5]),false,'Cannot mass reclassify known reference');
assert.equal(J.bulkEligible(rows[6]),false,'Cannot mass overwrite approved audio');
assert.equal(J.bulkEligible(rows[7]),false,'Changed metadata uses separate confirmation');
assert.equal(J.bulkEligible(rows[8]),false,'Explicit manual decisions cannot be bulk-overwritten');
assert.deepEqual(Array.from(J.candidates(rows,[0,1,5,6,7,8])),[0,1]);
assert.deepEqual(Array.from(J.selectionPlan(rows,[1,0],[0,1,2])),[0,1]);
assert.throws(()=>J.selectionPlan(rows,[0,0],[0,1]),/diversi/);
assert.throws(()=>J.selectionPlan(rows,[0,2],[0,1]),/nascosti/);
assert.throws(()=>J.selectionPlan(rows,[5],[5]),/reference/);
assert.throws(()=>J.selectionPlan(rows,[6],[6]),/approvati/);
assert.throws(()=>J.selectionPlan(rows,[7],[7]),/approvati/);
const many=Array.from({length:120},(_,i)=>f('file-'+i,'Studio - Canzone '+i+' demo.wav'));
assert.equal(J.candidates(many,many.map((_,i)=>i)).length,120);
assert.throws(()=>J.selectionPlan(many,Array.from({length:101},(_,i)=>i),Array.from({length:120},(_,i)=>i)),/fino a 100/);
const check=J.selectionPlan(many,Array.from({length:100},(_,i)=>i),Array.from({length:100},(_,i)=>i));
assert.equal(check.length,100);
const original=rows.map(x=>({...x}));
const marked=C.markMany(rows,[0,1],'mio');
assert.equal(marked.filter(x=>x._explicit&&x.decision==='mio').length,3);
assert.equal(original[0].decision,'da_verificare','Pure classification preview must not mutate source');
assert.equal(marked[5].decision,'reference','Reference unchanged');
const html=read('kyv_audio_finder.html'),ui=read('kyv-audio-finder-ui-v245.js'),sw=read('sw.js');
for(const id of ['scan-group-query','scan-group-source','scan-group-mode','scan-group-summary','scan-group-list',
 'scan-group-more','scan-group-clear','scan-select-visible','scan-clear-selected','scan-selected-count'])
 assert.ok(html.includes('id="'+id+'"'),id);
assert.ok(html.includes('kyv-audio-review-batch-v254.js'));
assert.ok(html.includes('file spuntati'),'Clear user-visible checked-only workflow');
assert.ok(ui.includes('J.classifyGroups(preview)'),'Group only current discovered files');
assert.ok(ui.includes('J.narrowIndices(initial,scanGroups(),scanReviewGroup)'),'Group filter must narrow results');
assert.ok(ui.includes('J.selectionPlan(preview,[...scanChecked],previewIndices().slice(0,previewShown))'));
assert.ok(ui.includes('if(!confirm('),'Explicit user approval required');
assert.ok(ui.includes("preview=C.markMany(preview,selected,decision)"),'Confirm only selections');
assert.ok(ui.includes("C.plan(I.safeRows(preview),owner)"),'Indexing remains a second explicit action');
assert.ok(ui.includes('function guardScanChanges()')&&ui.includes('preview.some(f=>f._explicit)')&&ui.includes('scanChecked.clear()'),
 'Changing scans must confirm pending approvals before new source reads, then clear only review selection');
assert.ok(!read('kyv-audio-review-batch-v254.js').includes('.from('),'Grouping engine must not talk to database');
assert.ok(sw.includes("'./kyv-audio-review-batch-v254.js'"));
assert.equal(JSON.parse(read('package.json')).version,(require('./release-contract').version()+'.0'));
assert.equal(read('VERSION').trim() ,require('./release-contract').version());
assert.ok(read('guida.html').includes('v2.54'));
assert.ok(read('kyv-help.js').includes('v2.54'));
console.log('OK: v2.54 safe artist-separated groups, checked-only ≤100 review and explicit 2-step approval');
