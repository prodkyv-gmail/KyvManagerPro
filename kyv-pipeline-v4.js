// kyv-pipeline-v4.js - Pipeline & Opportunità professionale, read-only
(function(){
'use strict';

const FOLLOWUP_DAYS=5;
const STAGES=[
 {key:'idea',label:'Idea',icon:'lightbulb',hint:'Bozze e spunti ancora da attivare'},
 {key:'da_inviare',label:'Da inviare',icon:'package-open',hint:'Demo e lavori pronti da proporre'},
 {key:'inviato',label:'Inviato',icon:'send',hint:'Proposte inviate, risposta non ancora registrata'},
 {key:'followup',label:'Follow-up',icon:'alarm-clock',hint:'Invii da sollecitare o con riscontro aperto'},
 {key:'interesse',label:'Interesse',icon:'sparkles',hint:'Provini, interesse o opzioni in corso'},
 {key:'trattativa',label:'Trattativa',icon:'handshake',hint:'Accordo, produzione o chiusura in corso'},
 {key:'confermato',label:'Confermato',icon:'badge-check',hint:'Progetti acquisiti, master o pubblicati'},
 {key:'perso',label:'Perso',icon:'circle-x',hint:'Opportunità chiuse senza seguito'}
];
const state={projects:[],sends:[],rows:[],filtered:[],stageFilter:'all',search:'',artist:'',partner:'',priority:'all'};

const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const N=v=>String(v??'').trim().toLocaleLowerCase('it');
const has=v=>String(v??'').trim()!=='';
const ts=v=>{const n=new Date(v||0).getTime();return Number.isFinite(n)?n:0;};
function fmt(v){if(!v)return'—';if(window.KYV?.formatDate)return KYV.formatDate(v,'—');const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('it-IT');}
function daysSince(v){const n=ts(v);return n?Math.max(0,Math.floor((Date.now()-n)/86400000)):null;}
function latestSend(rows){return [...(rows||[])].sort((a,b)=>ts(b.Data_Conferma||b.Data_Invio)-ts(a.Data_Conferma||a.Data_Invio)||Number(b.ID_INVIO||0)-Number(a.ID_INVIO||0))[0]||null;}
function sendKey(row){
 const raw=N(row?.Stato);
 if(/interess|confermat|approvat|accettat|scelt/.test(raw))return'interesse';
 if(/revision|feedback|comment/.test(raw))return'followup';
 if(/chius|non interess|rifiut|declin|(^|\s|\/)(no|pass)(\s|$)/.test(raw))return'perso';
 const age=daysSince(row?.Data_Conferma||row?.Data_Invio);
 return age!==null&&age>=FOLLOWUP_DAYS?'followup':'inviato';
}
function projectSends(projectId){return state.sends.filter(r=>String(r.ID_PROGETTO||'')===String(projectId));}
function historicalRecipient(row){
 const raw=String(row.STATO||'');
 const m=raw.match(/(?:MANDATA A|INVIATA A|PROPOSTA A|PROVINATA DA)\s+(.+)/i);
 return m?m[1].replace(/\s*\([^)]*\)\s*$/,'').trim():'';
}
function stageFor(row){
 const invii=row._sends||[],latest=row._latestSend,stato=N(row.STATO),svil=N(row.SVILUPPO),blob=stato+' '+svil;
 if(latest){
   const key=sendKey(latest);
   if(key==='perso')return'perso';
   if(/contratto|accordo|trattativ|negozia|fee|royalt/.test(blob))return'trattativa';
   if(has(row.Data_Pubblicazione)||has(row.Data_Consegna_Master)||/pubblicat|uscita|uscito|release|finita/.test(blob))return'confermato';
   if(key==='interesse')return'interesse';
   if(key==='followup')return'followup';
   return'inviato';
 }
 if(/rifiut|non interess|pers[oa]|declin|passato|scartat/.test(blob))return'perso';
 if(has(row.Data_Pubblicazione)||has(row.Data_Consegna_Master)||/pubblicat|uscita|uscito|release|finita/.test(blob))return'confermato';
 if(has(row['Data Contratto'])||has(row['Contratto link'])||/contratto|accordo|trattativ|negozia/.test(blob))return'trattativa';
 if(/provinat|interess|opzion|selezionat|scelt|tenut|presa da|in forse/.test(blob))return'interesse';
 if(has(row.Prossimo_Followup)||has(row.Esito_Ascolto)||/feedback|riscontro|attesa risposta|follow.?up/.test(blob))return'followup';
 if(/mandat|inviat|propost|pitch|presentat/.test(blob))return'inviato';
 if(/demo|wip|sessione|session|produzione|acustica/.test(blob)||has(row.Data_Sessione))return'da_inviare';
 return'idea';
}
function urgency(row){
 const latest=row._latestSend;
 if(latest&&sendKey(latest)==='followup'){
   const age=daysSince(latest.Data_Conferma||latest.Data_Invio);
   return{rank:0,label:age!==null?age+'g senza attività':'Follow-up',cls:'border-rose-500/30 bg-rose-500/10 text-rose-200'};
 }
 const delta=row.Prossimo_Followup?Math.round((new Date(String(row.Prossimo_Followup).slice(0,10)+'T12:00:00')-new Date(new Date().toDateString()+' 12:00:00'))/86400000):null;
 const p=N(row.Priorita_Followup);
 if(delta!==null&&delta<0)return{rank:0,label:Math.abs(delta)+'g in ritardo',cls:'border-rose-500/30 bg-rose-500/10 text-rose-200'};
 if(delta===0)return{rank:1,label:'Follow-up oggi',cls:'border-amber-500/30 bg-amber-500/10 text-amber-200'};
 if(p.includes('alta')||p.includes('urgent'))return{rank:1,label:'Priorità alta',cls:'border-orange-500/30 bg-orange-500/10 text-orange-200'};
 if(delta!==null&&delta<=7)return{rank:2,label:'Follow-up tra '+delta+'g',cls:'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'};
 return null;
}
function rowRank(row){
 const u=urgency(row);if(u)return u.rank;
 const stage=stageFor(row);return({followup:2,interesse:3,trattativa:4,inviato:5,da_inviare:6,idea:7,confermato:20,perso:30})[stage]??10;
}
function nextAction(row){
 const stage=stageFor(row),u=urgency(row),latest=row._latestSend;
 if(u)return u.label;
 if(stage==='idea')return'Valuta demo/sessione';
 if(stage==='da_inviare')return'Scegli destinatario';
 if(stage==='inviato')return latest?'Attendi risposta':'Verifica invio storico';
 if(stage==='followup')return'Fai follow-up';
 if(stage==='interesse')return'Porta avanti il contatto';
 if(stage==='trattativa')return'Chiudi accordo / produzione';
 if(stage==='confermato')return'Archiviato come acquisito';
 return'Opportunità chiusa';
}
function partner(row){return textFirst(row._latestSend?.Destinatario,row.Label,row.MANAGEMENT,historicalRecipient(row));}
function textFirst(...v){return v.map(x=>String(x??'').trim()).find(Boolean)||'';}
function optionValues(selector){return[...new Set(state.rows.map(selector).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it',{sensitivity:'base'}));}
function fillFilters(){
 const artist=document.getElementById('pipeline-artist'),p=document.getElementById('pipeline-partner');
 if(artist)artist.innerHTML='<option value="">Tutti gli artisti</option>'+optionValues(r=>textFirst(r.ARTISTA)).map(v=>'<option value="'+H(v)+'">'+H(v)+'</option>').join('');
 if(p)p.innerHTML='<option value="">Partner / destinatario</option>'+optionValues(partner).map(v=>'<option value="'+H(v)+'">'+H(v)+'</option>').join('');
}
function passesPriority(row){
 const mode=state.priority,u=urgency(row),stage=stageFor(row);
 if(mode==='all')return true;
 if(mode==='scaduti')return Boolean(u&&u.rank===0);
 if(mode==='oggi')return Boolean(u&&/oggi/i.test(u.label));
 if(mode==='7g')return Boolean(u&&/tra \d+g|oggi/i.test(u.label));
 if(mode==='followup')return stage==='followup';
 if(mode==='alta')return N(row.Priorita_Followup).includes('alta')||Boolean(u&&u.rank<=1);
 if(mode==='media')return N(row.Priorita_Followup).includes('media');
 if(mode==='bassa')return N(row.Priorita_Followup).includes('bassa');
 return true;
}
function applyFilters(){
 const q=N(state.search);
 state.filtered=state.rows.filter(row=>{
   if(state.stageFilter!=='all'&&stageFor(row)!==state.stageFilter)return false;
   if(state.artist&&String(row.ARTISTA||'')!==state.artist)return false;
   if(state.partner&&partner(row)!==state.partner)return false;
   if(!passesPriority(row))return false;
   if(q&&!N([row.TITOLO,row.ARTISTA,row.AUTORI,row.STATO,row.SVILUPPO,row.Label,row.MANAGEMENT,row.Esito_Ascolto,row.Note_Followup,partner(row),row._latestSend?.Contesto].join(' ')).includes(q))return false;
   return true;
 }).sort((a,b)=>rowRank(a)-rowRank(b)||Number(b.ID||0)-Number(a.ID||0));
 render();
}
function card(row){
 const stage=stageFor(row),u=urgency(row),dest=partner(row),latest=row._latestSend,structured=(row._sends||[]).length>0;
 const last=latest?(latest.Data_Conferma||latest.Data_Invio):null;
 return '<article class="pipeline-card" data-project-id="'+H(row.ID)+'">'+
 '<div class="flex items-start justify-between gap-3"><div class="min-w-0"><h4 class="font-black text-white text-sm leading-tight break-words">'+H(row.TITOLO||'Senza titolo')+'</h4><p class="text-xs font-bold text-cyan-200 mt-1 break-words">'+H(row.ARTISTA||'Artista non indicato')+'</p></div><span class="kyv-chip shrink-0">#'+H(row.ID)+'</span></div>'+
 '<div class="flex flex-wrap gap-1.5 mt-3">'+
 (u?'<span class="pipeline-pill '+u.cls+'">'+H(u.label)+'</span>':'')+
 (dest?'<span class="pipeline-pill border-slate-500/20 bg-slate-500/10 text-slate-300">'+H(dest)+'</span>':'')+
 '<span class="pipeline-pill border-indigo-500/20 bg-indigo-500/5 text-indigo-200">'+(structured?'Invii strutturati':'Storico interpretato')+'</span></div>'+
 '<div class="mt-3 p-2.5 rounded-xl border border-indigo-500/15 bg-indigo-500/5 text-[11px] leading-relaxed"><p class="text-indigo-100 font-bold">'+H(nextAction(row))+'</p>'+
 (latest?'<p class="text-slate-400 mt-1">'+H([latest.Stato,latest.Canale,last?fmt(last):''].filter(Boolean).join(' · '))+'</p>':
  (row.STATO?'<p class="text-slate-400 mt-1">'+H(row.STATO)+'</p>':''))+
 '</div><div class="mt-3 flex items-center gap-2"><a href="scheda_progetto.html?id='+encodeURIComponent(row.ID)+'" class="pipeline-open"><i data-lucide="external-link" class="w-3.5 h-3.5"></i>Apri scheda</a>'+
 (stage==='inviato'||stage==='followup'||stage==='interesse'?'<a href="scheda_progetto.html?id='+encodeURIComponent(row.ID)+'&tab=produzione#kyv-pitch-followup-project" class="pipeline-open"><i data-lucide="send" class="w-3.5 h-3.5"></i>Pitch</a>':'')+
 '</div></article>';
}
function renderSummary(){
 const active=state.filtered.filter(r=>!['confermato','perso'].includes(stageFor(r))).length;
 const due=state.filtered.filter(r=>stageFor(r)==='followup').length;
 const hot=state.filtered.filter(r=>['interesse','trattativa'].includes(stageFor(r))).length;
 const won=state.filtered.filter(r=>stageFor(r)==='confermato').length;
 const structured=state.filtered.filter(r=>(r._sends||[]).length).length;
 const el=document.getElementById('pipeline-summary');if(!el)return;
 el.innerHTML=[
 ['Opportunità attive',active,'activity'],['Follow-up',due,'alarm-clock'],['Calde',hot,'flame'],['Confermate',won,'badge-check'],['Con invii strutturati',structured,'database']
 ].map(([l,v,i])=>'<div class="pipeline-metric"><i data-lucide="'+i+'" class="w-4 h-4 text-indigo-300"></i><div><strong>'+v+'</strong><span>'+l+'</span></div></div>').join('');
}
function renderStageTabs(){
 const el=document.getElementById('pipeline-stage-tabs');if(!el)return;
 const base=state.rows.filter(r=>{
   if(state.artist&&String(r.ARTISTA||'')!==state.artist)return false;
   if(state.partner&&partner(r)!==state.partner)return false;
   if(!passesPriority(r))return false; return true;
 });
 const counts=Object.fromEntries(STAGES.map(s=>[s.key,base.filter(r=>stageFor(r)===s.key).length]));
 el.innerHTML='<button class="pipeline-stage-filter '+(state.stageFilter==='all'?'active':'')+'" data-stage="all">Tutte <span>'+base.length+'</span></button>'+
 STAGES.map(s=>'<button class="pipeline-stage-filter '+(state.stageFilter===s.key?'active':'')+'" data-stage="'+s.key+'">'+H(s.label)+' <span>'+(counts[s.key]||0)+'</span></button>').join('');
 el.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{state.stageFilter=b.dataset.stage;applyFilters();});
}
function renderBoard(){
 const board=document.getElementById('pipeline-board');if(!board)return;
 const stages=state.stageFilter==='all'?STAGES:STAGES.filter(s=>s.key===state.stageFilter);
 board.innerHTML=stages.map(s=>{const rows=state.filtered.filter(r=>stageFor(r)===s.key);return'<section class="pipeline-column" data-stage="'+s.key+'"><header class="pipeline-column-head"><div><h3><i data-lucide="'+s.icon+'" class="w-4 h-4"></i>'+H(s.label)+'</h3><p>'+H(s.hint)+'</p></div><span>'+rows.length+'</span></header><div class="pipeline-column-body">'+(rows.length?rows.map(card).join(''):'<div class="pipeline-empty">Nessuna opportunità in questa fase.</div>')+'</div></section>';}).join('');
}
function render(){renderSummary();renderStageTabs();renderBoard();const c=document.getElementById('pipeline-count');if(c)c.textContent=state.filtered.length+' progetti';if(window.lucide)lucide.createIcons();}
async function load(){
 const board=document.getElementById('pipeline-board');if(board)board.innerHTML='<div class="pipeline-loading"><i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i>Caricamento opportunità…</div>';
 try{
   const client=window.KYV?.createSupabaseClient?.();if(!client)throw new Error('Client Supabase non disponibile');
   const [pRes,iRes]=await Promise.all([
     client.from('PROGETTI').select('*').order('ID',{ascending:false}).limit(1000),
     client.from('INVII_AUDIO').select('*').order('ID_INVIO',{ascending:false}).limit(2000)
   ]);
   if(pRes.error)throw pRes.error;if(iRes.error)throw iRes.error;
   state.projects=pRes.data||[];state.sends=iRes.data||[];
   state.rows=state.projects.map(p=>{const sends=projectSends(p.ID);return{...p,_sends:sends,_latestSend:latestSend(sends)};});
   fillFilters();applyFilters();
 }catch(err){console.error('[KYV Pipeline v4]',err);if(board)board.innerHTML='<div class="pipeline-error"><i data-lucide="circle-alert" class="w-7 h-7"></i><strong>Pipeline non disponibile</strong><span>'+H(err.message||'Errore caricamento')+'</span></div>';}
 if(window.lucide)lucide.createIcons();
}
function bind(){
 document.getElementById('pipeline-search')?.addEventListener('input',e=>{state.search=e.target.value;applyFilters();});
 document.getElementById('pipeline-artist')?.addEventListener('change',e=>{state.artist=e.target.value;applyFilters();});
 document.getElementById('pipeline-partner')?.addEventListener('change',e=>{state.partner=e.target.value;applyFilters();});
 document.getElementById('pipeline-priority')?.addEventListener('change',e=>{state.priority=e.target.value;applyFilters();});
 document.getElementById('pipeline-reset')?.addEventListener('click',()=>{state.search='';state.artist='';state.partner='';state.priority='all';state.stageFilter='all';['pipeline-search','pipeline-artist','pipeline-partner'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});const p=document.getElementById('pipeline-priority');if(p)p.value='all';applyFilters();});
 document.getElementById('pipeline-refresh')?.addEventListener('click',load);
}
document.addEventListener('DOMContentLoaded',()=>{bind();load();});
})();