/* KYV Easy UX v9 — progressive disclosure + project action wizard.
   Nessuna query o scrittura dati: orchestra soltanto i moduli già esistenti. */
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
if(page!=='scheda_progetto.html')return;

const MODE_KEY='kyv-easy-ux-v9-mode';
const ESSENTIAL_FIELDS=new Set(['TITOLO','ARTISTA','AUTORI','MANAGEMENT','Label','STATO','SVILUPPO','Data_Sessione','Data_Consegna_Master','Data_Pubblicazione']);
let mode=readMode(),wrappedTab=false,wrappedEdit=false,lastWizardTask='';

const text=v=>String(v??'').trim();
const H=v=>window.KYV?.safeHtml?KYV.safeHtml(v??''):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isPaid=v=>window.KYV?.isPaid?KYV.isPaid(v):/^(si|sì|yes|true|1|pagat|incassat)/i.test(text(v));

function readMode(){try{return localStorage.getItem(MODE_KEY)==='complete'?'complete':'easy';}catch(_){return'easy';}}
function saveMode(next){try{localStorage.setItem(MODE_KEY,next);}catch(_){}}
function view(){try{return typeof state!=='undefined'?state?.currentView:null;}catch(_){return null;}}
function current(){return view()?.p||null;}

function ensureStyle(){
 if(document.getElementById('kyv-easy-ux-v9-style'))return;
 const s=document.createElement('style');s.id='kyv-easy-ux-v9-style';s.textContent=`
.kyv-easy-switch{display:inline-flex;align-items:center;padding:.2rem;border:1px solid rgba(148,163,184,.14);background:rgba(15,17,26,.72);border-radius:.75rem;gap:.15rem}.kyv-easy-switch button{border:0;background:transparent;color:#94a3b8;font-size:.62rem;font-weight:900;padding:.42rem .62rem;border-radius:.55rem;cursor:pointer}.kyv-easy-switch button.active{background:rgba(99,102,241,.16);color:#e0e7ff}.kyv-easy-switch small{color:#64748b;font-size:.55rem;margin:0 .35rem}
.kyv-easy-primary{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;border:1px solid rgba(99,102,241,.36);background:linear-gradient(135deg,rgba(79,70,229,.92),rgba(37,99,235,.9));color:#fff;border-radius:.75rem;padding:.68rem .95rem;font-size:.72rem;font-weight:900;box-shadow:0 8px 24px rgba(79,70,229,.18)}.kyv-easy-secondary{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;border:1px solid rgba(148,163,184,.14);background:rgba(255,255,255,.025);color:#cbd5e1;border-radius:.75rem;padding:.65rem .85rem;font-size:.68rem;font-weight:850}
body.kyv-easy-mode #hero-badges,body.kyv-easy-mode #hero-subtitle,body.kyv-easy-mode #tabs,body.kyv-easy-mode .tab-panel,body.kyv-easy-mode .kyv-easy-advanced,body.kyv-easy-mode #global-stats{display:none!important}
body.kyv-easy-mode #project-view{gap:1rem}body.kyv-easy-mode #hero-title{font-size:clamp(1.5rem,4vw,2.3rem)!important}body.kyv-easy-mode #hero-artist{font-size:1rem!important;margin-top:.35rem!important}
body.kyv-easy-mode .kyv-project-original-actions>*{display:none!important}body.kyv-easy-mode .kyv-project-original-actions>#kyv-project-wizard-btn,body.kyv-easy-mode .kyv-project-original-actions>#kyv-project-details-btn{display:inline-flex!important}
body.kyv-complete-mode #kyv-project-wizard-btn,body.kyv-complete-mode #kyv-project-details-btn{display:none!important}
#kyv-easy-wizard{position:fixed;inset:0;z-index:10020;background:rgba(2,6,23,.76);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:1rem}#kyv-easy-wizard.open{display:flex}.kyv-wizard-dialog{width:min(680px,100%);max-height:90vh;overflow:auto;background:#0f111a;border:1px solid #30364a;border-radius:1rem;box-shadow:0 30px 90px rgba(0,0,0,.58)}.kyv-wizard-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1rem;border-bottom:1px solid #232838}.kyv-wizard-head p{font-size:.55rem;text-transform:uppercase;letter-spacing:.14em;color:#a5b4fc;font-weight:900}.kyv-wizard-head h3{font-size:1.08rem;color:#fff;font-weight:900;margin-top:.2rem}.kyv-wizard-close{width:36px;height:36px;border-radius:.65rem;border:1px solid #30364a;background:#151923;color:#94a3b8;display:flex;align-items:center;justify-content:center}.kyv-wizard-body{padding:1rem}.kyv-wizard-intro{color:#94a3b8;font-size:.68rem;line-height:1.5}.kyv-wizard-grid{display:grid;grid-template-columns:1fr 1fr;gap:.55rem;margin-top:.8rem}.kyv-wizard-choice{display:flex;gap:.65rem;align-items:flex-start;text-align:left;border:1px solid rgba(148,163,184,.12);background:rgba(255,255,255,.025);border-radius:.8rem;padding:.75rem;color:#fff;cursor:pointer}.kyv-wizard-choice:hover,.kyv-wizard-choice.recommended{border-color:rgba(99,102,241,.38);background:rgba(99,102,241,.075)}.kyv-wizard-choice i{width:18px;height:18px;color:#c7d2fe;flex:none}.kyv-wizard-choice strong{display:block;font-size:.72rem}.kyv-wizard-choice span{display:block;color:#94a3b8;font-size:.6rem;line-height:1.4;margin-top:.15rem}.kyv-wizard-choice em{display:inline-flex;margin-top:.35rem;font-size:.5rem;font-style:normal;color:#c7d2fe;border:1px solid rgba(99,102,241,.25);border-radius:999px;padding:.15rem .34rem}.kyv-wizard-status{border:1px solid rgba(148,163,184,.1);background:rgba(255,255,255,.025);border-radius:.85rem;padding:.85rem;margin-top:.8rem}.kyv-wizard-status h4{font-size:.86rem;color:#fff;font-weight:900}.kyv-wizard-status p{font-size:.65rem;color:#94a3b8;line-height:1.5;margin-top:.28rem}.kyv-wizard-bullets{display:grid;gap:.35rem;margin-top:.65rem}.kyv-wizard-bullet{display:flex;align-items:center;gap:.45rem;font-size:.62rem;color:#cbd5e1}.kyv-wizard-bullet i{width:14px;height:14px;color:#a5b4fc}.kyv-wizard-actions{display:flex;justify-content:space-between;gap:.55rem;margin-top:.85rem}.kyv-advanced-fields{grid-column:1/-1;border:1px solid rgba(148,163,184,.12);border-radius:.8rem;padding:.7rem;background:rgba(255,255,255,.018)}.kyv-advanced-fields summary{cursor:pointer;color:#cbd5e1;font-size:.68rem;font-weight:900}.kyv-advanced-fields-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-top:.8rem}
@media(max-width:700px){.kyv-wizard-grid{grid-template-columns:1fr}.kyv-wizard-actions{flex-direction:column-reverse}.kyv-advanced-fields-grid{grid-template-columns:1fr}.kyv-easy-switch small{display:none}}
`;document.head.appendChild(s);
}

function markAdvanced(){
 const score=document.getElementById('score-ring')?.closest('.kyv-soft');if(score)score.classList.add('kyv-easy-advanced');
}
function ensureModeSwitch(){
 if(document.getElementById('kyv-easy-mode-switch'))return;
 const headerActions=document.querySelector('main section > header > div:last-child');if(!headerActions)return;
 const wrap=document.createElement('div');wrap.id='kyv-easy-mode-switch';wrap.className='kyv-easy-switch';wrap.innerHTML='<button type="button" data-mode="easy">Easy</button><button type="button" data-mode="complete">Completa</button><small>vista</small>';
 headerActions.insertAdjacentElement('afterbegin',wrap);
 wrap.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
}

function ensureProjectActions(){
 const edit=document.querySelector('#project-view [onclick="openQuickEdit()"]');if(!edit)return false;
 const host=edit.parentElement;if(!host)return false;
 host.classList.add('kyv-project-original-actions');
 if(!document.getElementById('kyv-project-wizard-btn')){
   const btn=document.createElement('button');btn.id='kyv-project-wizard-btn';btn.type='button';btn.className='kyv-easy-primary';btn.innerHTML='<i data-lucide="route" class="w-4 h-4"></i>Continua progetto';btn.addEventListener('click',openWizard);host.insertAdjacentElement('afterbegin',btn);
 }
 if(!document.getElementById('kyv-project-details-btn')){
   const btn=document.createElement('button');btn.id='kyv-project-details-btn';btn.type='button';btn.className='kyv-easy-secondary';btn.innerHTML='<i data-lucide="sliders-horizontal" class="w-4 h-4"></i>Mostra dettagli';btn.addEventListener('click',()=>setMode('complete'));host.appendChild(btn);
 }
 if(window.lucide)lucide.createIcons({root:host});return true;
}
function refreshModeUi(){
 document.body.classList.toggle('kyv-easy-mode',mode==='easy');
 document.body.classList.toggle('kyv-complete-mode',mode==='complete');
 document.querySelectorAll('#kyv-easy-mode-switch [data-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mode===mode));
 const picker=document.getElementById('project-picker');if(mode==='easy'&&picker&&current())picker.removeAttribute('open');
 markAdvanced();ensureProjectActions();
}
function setMode(next,{persist=true}={}){
 mode=next==='complete'?'complete':'easy';if(persist)saveMode(mode);refreshModeUi();
 if(mode==='easy'&&typeof window.setTab==='function'&&current())window.setTab.__kyvEasyOriginal?.('sintesi');
}
function wrapSetTab(){
 if(wrappedTab||typeof window.setTab!=='function')return false;
 const original=window.setTab;
 const wrapped=function(tab){if(mode==='easy')setMode('complete');return original.apply(this,arguments);};
 wrapped.__kyvEasyOriginal=original;window.setTab=wrapped;wrappedTab=true;return true;
}
function restructureQuickEdit(){
 if(mode!=='easy')return;
 const root=document.getElementById('quick-edit-fields');if(!root||root.querySelector('.kyv-advanced-fields'))return;
 const labels=[...root.children].filter(el=>el.matches('label'));
 const advanced=labels.filter(label=>!ESSENTIAL_FIELDS.has(label.querySelector('[data-key]')?.dataset.key));
 if(!advanced.length)return;
 const details=document.createElement('details');details.className='kyv-advanced-fields';details.innerHTML='<summary>Campi avanzati · diritti, link ed economia</summary><div class="kyv-advanced-fields-grid"></div>';
 const grid=details.querySelector('.kyv-advanced-fields-grid');advanced.forEach(label=>grid.appendChild(label));root.appendChild(details);
}
function wrapQuickEdit(){
 if(wrappedEdit||typeof window.openQuickEdit!=='function')return false;
 const original=window.openQuickEdit;
 window.openQuickEdit=function(){const out=original.apply(this,arguments);setTimeout(restructureQuickEdit,0);return out;};
 window.openQuickEdit.__kyvEasyOriginal=original;wrappedEdit=true;return true;
}

function wizardData(){
 const v=view(),p=v?.p||{},m=v?.matches||{};
 const versions=[...(m.audio||[]),...(m.consegne||[])];
 const invoices=m.fatture||[],unpaid=invoices.filter(f=>!isPaid(f.PAGATA)&&!isPaid(f.PAGAMENTO));
 const releaseChecks=[
  ['Data uscita',Boolean(text(p.Data_Pubblicazione))],
  ['ISRC',Boolean(text(p.Codice_ISRC))],
  ['Autori',Boolean(text(p.AUTORI))],
  ['Label / produttore',Boolean(text(p.Label)||text(p.Produttore_Fonografico))],
  ['Quote',Boolean(text(p.Quota_Musica_Kyv)||text(p.Quota_Musica_Artista)||text(p.Quota_Testo_Artista))],
  ['IMAIE',Boolean(text(p.Ruolo_IMAIE_Kyv))]
 ];
 const releaseReady=releaseChecks.filter(x=>x[1]).length,releaseMissing=releaseChecks.filter(x=>!x[1]).map(x=>x[0]);
 const tasks={
  production:{title:'Produzione',icon:'audio-waveform',desc:'Versioni, demo e master.',status:versions.length?versions.length+' versioni collegate':'Nessuna versione collegata',bullets:[versions.length?'Continua dalla versione più recente':'Aggiungi o collega una versione audio',text(p.Data_Consegna_Master)?'Master già datato':'Master non ancora datato'],target:'production'},
  pitch:{title:'Invio / follow-up',icon:'send',desc:'Proponi il brano e segui le risposte.',status:(m.invii||[]).length?(m.invii||[]).length+' invii registrati':'Nessun invio registrato',bullets:[versions.length?'Hai materiale da proporre':'Prima completa una versione', (m.invii||[]).length?'Controlla risposte e follow-up':'Registra il primo invio'],target:versions.length?'pitch':'production'},
  release:{title:'Release',icon:'rocket',desc:'Prepara uscita, crediti e diritti.',status:releaseReady+'/'+releaseChecks.length+' dati pronti',bullets:releaseMissing.length?releaseMissing.slice(0,3).map(x=>'Manca: '+x):['Dati release principali completi'],target:'release'},
  economy:{title:'Fattura / incasso',icon:'badge-euro',desc:'Fatturazione e stato degli incassi.',status:invoices.length?invoices.length+' fatture collegate':'Nessuna fattura collegata',bullets:[unpaid.length?unpaid.length+' fatture da verificare/incassare':'Nessun incasso aperto rilevato',text(p.FEE)?'Fee progetto: '+text(p.FEE):'Fee non indicata'],target:'economy'},
  update:{title:'Aggiorna dati',icon:'pencil',desc:'Modifica solo i dati essenziali del progetto.',status:'Modifica guidata',bullets:['Titolo, artista e autori','Stato e prossimo sviluppo','Date principali'],target:'update'}
 };
 let recommended='production';
 if(versions.length&&(m.invii||[]).length===0)recommended='pitch';
 if((m.invii||[]).length&&releaseReady<releaseChecks.length&&(text(p.Data_Consegna_Master)||text(p.Data_Pubblicazione)))recommended='release';
 if((text(p.Data_Pubblicazione)||/uscit|pubblic/i.test(text(p.STATO)))&&invoices.length===0)recommended='economy';
 if(unpaid.length)recommended='economy';
 return{p,m,tasks,recommended,versions,invoices,unpaid};
}
function ensureWizard(){
 let root=document.getElementById('kyv-easy-wizard');if(root)return root;
 root=document.createElement('div');root.id='kyv-easy-wizard';root.innerHTML='<div class="kyv-wizard-dialog" role="dialog" aria-modal="true" aria-label="Continua progetto"><div class="kyv-wizard-head"><div><p>Wizard progetto</p><h3>Che cosa vuoi fare adesso?</h3></div><button type="button" class="kyv-wizard-close" aria-label="Chiudi"><i data-lucide="x"></i></button></div><div id="kyv-wizard-body" class="kyv-wizard-body"></div></div>';document.body.appendChild(root);
 root.querySelector('.kyv-wizard-close').addEventListener('click',closeWizard);root.addEventListener('mousedown',e=>{if(e.target===root)closeWizard();});if(window.lucide)lucide.createIcons({root});return root;
}
function renderWizardChooser(){
 const root=ensureWizard(),body=root.querySelector('#kyv-wizard-body'),d=wizardData();
 body.innerHTML='<p class="kyv-wizard-intro">Scegli l’obiettivo. Ti porto direttamente nel punto giusto senza mostrarti tutto il resto della scheda.</p><div class="kyv-wizard-grid">'+Object.entries(d.tasks).map(([key,t])=>`<button type="button" class="kyv-wizard-choice ${key===d.recommended?'recommended':''}" data-task="${key}"><i data-lucide="${t.icon}"></i><span><strong>${H(t.title)}</strong><span>${H(t.desc)}</span>${key===d.recommended?'<em>Consigliato adesso</em>':''}</span></button>`).join('')+'</div>';
 body.querySelectorAll('[data-task]').forEach(btn=>btn.addEventListener('click',()=>renderWizardTask(btn.dataset.task)));if(window.lucide)lucide.createIcons({root:body});
}
function renderWizardTask(key){
 lastWizardTask=key;const root=ensureWizard(),body=root.querySelector('#kyv-wizard-body'),d=wizardData(),t=d.tasks[key];if(!t)return renderWizardChooser();
 body.innerHTML=`<button type="button" id="kyv-wizard-back" class="kyv-easy-secondary"><i data-lucide="arrow-left" class="w-4 h-4"></i>Indietro</button><div class="kyv-wizard-status"><div class="flex items-center gap-2"><i data-lucide="${t.icon}" class="w-5 h-5 text-indigo-300"></i><h4>${H(t.title)}</h4></div><p>${H(t.status)}</p><div class="kyv-wizard-bullets">${t.bullets.map(b=>`<div class="kyv-wizard-bullet"><i data-lucide="check-circle-2"></i><span>${H(b)}</span></div>`).join('')}</div></div><div class="kyv-wizard-actions"><button type="button" id="kyv-wizard-cancel" class="kyv-easy-secondary">Chiudi</button><button type="button" id="kyv-wizard-go" class="kyv-easy-primary"><i data-lucide="arrow-right" class="w-4 h-4"></i>${key==='update'?'Modifica essenziali':key==='economy'&&!d.invoices.length?'Crea / collega fattura':'Apri '+H(t.title)}</button></div>`;
 body.querySelector('#kyv-wizard-back').addEventListener('click',renderWizardChooser);body.querySelector('#kyv-wizard-cancel').addEventListener('click',closeWizard);body.querySelector('#kyv-wizard-go').addEventListener('click',()=>executeTask(key));if(window.lucide)lucide.createIcons({root:body});
}
function openWizard(){if(!current())return;ensureWizard().classList.add('open');document.body.style.overflow='hidden';renderWizardChooser();}
function closeWizard(){document.getElementById('kyv-easy-wizard')?.classList.remove('open');document.body.style.overflow='';}
function scrollTo(id){setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'center'}),90);}
function executeTask(key){
 const d=wizardData(),p=d.p;closeWizard();
 if(key==='update'){window.openQuickEdit?.();return;}
 if(key==='economy'&&!d.invoices.length&&window.KYV_PROJECT_INVOICES?.openNew){window.KYV_PROJECT_INVOICES.openNew(p.ID,p.TITOLO,p.ARTISTA);return;}
 setMode('complete');
 if(key==='economy'){window.setTab?.('amministrazione');scrollTo('kyv-project-finance-summary');return;}
 window.setTab?.('produzione');
 if(key==='production')scrollTo('kyv-project-v2-versions');
 if(key==='pitch')scrollTo('kyv-pitch-followup-project');
 if(key==='release')scrollTo('kyv-release-desk');
}
function keydown(e){if(e.key==='Escape'&&document.getElementById('kyv-easy-wizard')?.classList.contains('open')){e.preventDefault();closeWizard();}}

function boot(){
 ensureStyle();ensureModeSwitch();ensureWizard();refreshModeUi();document.addEventListener('keydown',keydown);
 let n=0;const t=setInterval(()=>{n++;const a=wrapSetTab(),b=wrapQuickEdit(),c=ensureProjectActions();refreshModeUi();if((a||wrappedTab)&&(b||wrappedEdit)&&c||n>=35)clearInterval(t);},150);setTimeout(()=>clearInterval(t),6000);
 ['kyv:project-v2-ready','kyv:project-hub-v3-ready'].forEach(name=>window.addEventListener(name,()=>{setTimeout(()=>{ensureProjectActions();refreshModeUi();},20);}));
}
window.KYV_EASY_UX_V9={setMode,getMode:()=>mode,openWizard,openTask:key=>{openWizard();renderWizardTask(key);},refresh:refreshModeUi};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();