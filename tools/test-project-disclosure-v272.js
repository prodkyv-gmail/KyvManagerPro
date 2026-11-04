// v2.72 — actual project quick view rendering and one Easy/Complete switch.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const projects=read('progetti.html'),easy=read('kyv-easy-ux-v9.js');
const config=read('config.js'),sw=read('sw.js'),pkg=require('../package.json');
const markupScript=projects.slice(projects.lastIndexOf('<script>')+8,projects.lastIndexOf('</script>'));
new vm.Script(markupScript,{filename:'progetti.html:inline'});
new vm.Script(easy,{filename:'kyv-easy-ux-v9.js'});
assert.ok(projects.includes('.quick-more>summary'),'Secondary data uses native disclosure');
assert.ok(projects.includes('id="project-quick-info"'),'Date/note disclosure exists');
assert.ok(projects.includes('id="project-quick-destinations"'),'Project destinations disclosure exists');
assert.ok(projects.includes("Vista rapida in sola lettura. Nessun dato modificato."),'No-write notice remains');
assert.ok(projects.includes("state.lastFocus=trigger||document.activeElement"),'Focus capture preserved');
assert.ok(projects.includes('if(focus?.isConnected)focus.focus()'),'Focus restore preserved');
assert.ok(easy.includes("wrap.setAttribute('role','group')"),'Mode switch is grouped');
assert.ok(easy.includes("wrap.setAttribute('aria-label','Vista scheda progetto')"),'Mode switch is named');
assert.ok(easy.includes("btn.setAttribute('aria-pressed',String(selected))"),'Mode switch announces state');
assert.ok(!easy.includes('kyv-project-details-btn'),'Redundant details button removed');
assert.ok(easy.includes('kyv-project-wizard-btn'),'Wizard remains in Easy');
assert.ok(easy.includes("if(mode==='easy')setMode('complete')"),'Technical tab still opens full view');
assert.doesNotMatch(projects,/\.from\(['"]PROGETTI['"]\)\.(?:insert|update|upsert|delete)\(/,'Safe project page must not write');
const start=markupScript.indexOf('function openQuick(id,trigger){');
const end=markupScript.indexOf('function closeQuick(){',start);
assert.ok(start>=0&&end>start);
const nodes={};
const modal={hidden:true,classList:{add(x){this.last=x;},remove(){}}};
nodes['project-quick-modal']=modal;
nodes['quick-title']={textContent:''};
nodes['quick-subtitle']={textContent:''};
nodes['project-quick-body']={innerHTML:''};
let focused=0;nodes['project-quick-close']={focus(){focused++;}};
const rows=[
 {ID:41,TITOLO:'Demo & test',ARTISTA:'Prova',STATO:'In lavorazione',
  SVILUPPO:'Da mandare',Data_Sessione:'2026-10-01',Prossimo_Followup:'2026-12-01',
  Data_Pubblicazione:'',NOTE:'<script>danger</script>'},
 {ID:42,TITOLO:'Seconda',ARTISTA:'Altro',STATO:'Attesa',SVILUPPO:'Follow-up'}
];
const state={rows,lastFocus:null};
const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sandbox={state,document:{activeElement:null},M:{recentDate:()=>true},
 text:v=>String(v??'').trim(),H,el:id=>nodes[id],
 activityLabel:()=>'Ieri',detailDate:x=>x||'Non indicata',encodeURIComponent};
const open=vm.runInNewContext(markupScript.slice(start,end)+'\nopenQuick',sandbox);
const trigger={};open(41,trigger);
const first=nodes['project-quick-body'].innerHTML;
assert.equal(nodes['quick-title'].textContent,'Demo & test');
assert.equal(state.lastFocus,trigger);
assert.equal(modal.hidden,false);assert.equal(focused,1);
assert.equal((first.match(/<a /g)||[]).length,4,'All destinations survive, no duplicates');
assert.ok(first.indexOf('Azione principale del progetto')<first.indexOf('id="project-quick-info"'));
assert.ok(first.includes('class="quick-primary" href="scheda_progetto.html?id=41"'));
assert.ok(first.includes('sessioni.html?projectId=41'));
assert.ok(first.includes('kyv_audio_finder.html?project=41'));
assert.ok(first.includes('fatture.html?ripartizione_progetto=41'));
assert.ok(first.includes('Scadenze e note')&&first.includes('Sessioni, audio e fatture'));
assert.ok(first.includes('&lt;script&gt;danger&lt;/script&gt;'),'Note must be escaped');
assert.ok(!first.includes('<script>danger</script>'),'User note must not inject markup');
open(42,trigger);
const second=nodes['project-quick-body'].innerHTML;
assert.ok(second.includes('scheda_progetto.html?id=42'));
assert.ok(!second.includes('projectId=41'),'Opening a new project must reset old context');
assert.ok(!second.includes('danger'),'Old project notes may not leak');
assert.ok(config.includes("APP_VERSION: '2.72'"));
assert.equal(read('VERSION').trim(),'2.72');
assert.equal(pkg.version,'2.72.0');
assert.ok(pkg.scripts.check.includes('check:project-disclosure-v272'));
assert.ok(sw.includes('kyv-studio-v2-72-project-disclosure-20261104'));
assert.ok(read('guida.html').includes('v2.72')&&read('kyv-help.js').includes('v2.72'));
console.log('OK: v2.72 one-action quick view, escaped notes, preserved destinations, accessible mode switch');
