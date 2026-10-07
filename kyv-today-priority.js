/* KYV Today Priority — cabina di regia leggera, solo lettura. */
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
if(page!=='index.html'&&page!=='')return;

const STALE_DAYS=14;
const FOLLOWUP_DAYS=5;
let db=null,projects=[],pitchRows=[],legacyObserver=null,legacyTimer=null;

function text(v){return String(v??'').trim();}
function H(v){if(window.KYV&&typeof KYV.safeHtml==='function')return KYV.safeHtml(v??'');return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function client(){if(db)return db;db=window.KYV?.createSupabaseClient?.()||null;return db;}
function time(v){const n=new Date(v||0).getTime();return Number.isFinite(n)?n:0;}
function daysSince(v){const t=time(v);return t?Math.max(0,Math.floor((Date.now()-t)/86400000)):0;}
function isDone(p){return /uscita|pubblicat|completat|chius|finita/i.test(`${text(p?.STATO)} ${text(p?.SVILUPPO)}`);}
function hasAction(p){return !!text(p?.SVILUPPO)&&!isDone(p);}
function projectDate(p){return p?.updated_at||p?.Data_Sessione||p?.created_at||'';}
function projectLabel(p){return [text(p?.ARTISTA)||'Artista non indicato',text(p?.TITOLO)||'Senza titolo'].join(' · ');}
function pitchDate(r){return r?.Data_Conferma||r?.Data_Invio||r?.updated_at||r?.created_at||'';}
function pitchClosed(r){return /confermat|approvat|accettat|(^|\s|\/)(no|pass)(\s|$)|rifiut|declin|non interess/i.test(text(r?.Stato).toLowerCase());}
function pitchDue(r){return !pitchClosed(r)&&daysSince(pitchDate(r))>=FOLLOWUP_DAYS;}
function currentProject(id){return projects.find(p=>String(p.ID)===String(id))||null;}
function item(type,priority,title,subtitle,href,meta=''){return{type,priority,title,subtitle,href,meta};}

function injectStyles(){
 if(document.getElementById('kyv-today-priority-style'))return;
 const s=document.createElement('style');s.id='kyv-today-priority-style';s.textContent=`
#kyv-today-priority{border:1px solid rgba(255,255,255,.09);border-radius:1rem;padding:1rem;margin-bottom:1rem;background:linear-gradient(135deg,rgba(166,235,211,.07),rgba(15,17,26,.62))}.kyv-today-priority-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.kyv-today-priority-head h3{font-size:1.05rem;font-weight:900;color:#fff}.kyv-today-priority-head p{font-size:.7rem;color:#94a3b8;margin-top:.25rem}.kyv-today-priority-stats{display:flex;flex-wrap:wrap;gap:.38rem;margin-top:.75rem}.kyv-today-priority-stat{padding:.32rem .5rem;border-radius:999px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);font-size:.6rem;font-weight:850;color:#cbd5e1}.kyv-today-priority-list{display:grid;gap:.48rem;margin-top:.8rem}.kyv-today-priority-item{display:flex;align-items:flex-start;gap:.7rem;padding:.7rem .75rem;border-radius:.8rem;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}.kyv-today-priority-item:hover{background:rgba(255,255,255,.055)}.kyv-today-priority-icon{width:34px;height:34px;border-radius:.7rem;display:flex;align-items:center;justify-content:center;flex:none;border:1px solid rgba(255,255,255,.09)}.kyv-today-priority-item strong{display:block;color:#fff;font-size:.76rem;line-height:1.35}.kyv-today-priority-item span{display:block;color:#94a3b8;font-size:.63rem;margin-top:.16rem;line-height:1.35}.kyv-today-priority-item em{display:block;font-style:normal;color:#cbd5e1;font-size:.58rem;font-weight:850;margin-top:.24rem}.kyv-today-priority-followup .kyv-today-priority-icon{color:#fed7aa;background:rgba(249,115,22,.09)}.kyv-today-priority-deadline .kyv-today-priority-icon{color:#fecaca;background:rgba(244,63,94,.08)}.kyv-today-priority-session .kyv-today-priority-icon{color:#c7d2fe;background:rgba(99,102,241,.09)}.kyv-today-priority-stale .kyv-today-priority-icon{color:#fde68a;background:rgba(234,179,8,.08)}.kyv-today-priority-action .kyv-today-priority-icon{color:#bbf7d0;background:rgba(34,197,94,.08)}.kyv-today-priority-empty{padding:1rem;border:1px dashed rgba(255,255,255,.1);border-radius:.8rem;color:#94a3b8;font-size:.7rem;text-align:center}@media(max-width:640px){.kyv-today-priority-head{flex-direction:column}}
`;document.head.appendChild(s);
}

async function safeRows(table,limit){try{const {data,error}=await client().from(table).select('*').limit(limit);return error?[]:(data||[]);}catch(_){return[];}}
async function load(){if(!client())return;const [p,i]=await Promise.all([safeRows('PROGETTI',750),safeRows('INVII_AUDIO',1200)]);projects=p;pitchRows=i;render();watchLegacy();}

function legacyItems(){
 const root=document.getElementById('activity-list');if(!root)return[];
 const out=[],seen=new Set();
 [...root.children].forEach(node=>{
   const raw=text(node.textContent),low=raw.toLowerCase();if(!raw)return;
   let type='';
   if(/scaden|deadline|consegna|pubblicaz|release|deposito|pagament|fattur/.test(low))type='deadline';
   else if(/session|studio|registr|writing|scritt|riunion|meeting|mix|master/.test(low))type='session';
   if(!type)return;
   const title=text(node.querySelector('strong,h3,h4')?.textContent)||raw.slice(0,120);
   const key=`${type}:${title}`;if(seen.has(key))return;seen.add(key);
   const href=node.querySelector('a[href]')?.getAttribute('href')||'kyv_calendar.html';
   out.push(item(type,type==='deadline'?96:88,title,type==='deadline'?'Scadenza già presente nelle attività':'Sessione / appuntamento',href,type==='deadline'?'Scadenza':'Sessione'));
 });
 return out;
}
function buildItems(){
 const items=[];
 pitchRows.filter(pitchDue).forEach(r=>{const p=currentProject(r.ID_PROGETTO);const d=daysSince(pitchDate(r));items.push(item('followup',110+d,`Sollecitare ${text(r.Destinatario)||'destinatario'}`,projectLabel(p),`scheda_progetto.html?id=${encodeURIComponent(text(r.ID_PROGETTO))}&tab=produzione`,`${d}g senza attività`));});
 items.push(...legacyItems());
 projects.filter(p=>!isDone(p)&&projectDate(p)&&daysSince(projectDate(p))>=STALE_DAYS).forEach(p=>{const d=daysSince(projectDate(p));items.push(item('stale',75+d/10,`Progetto fermo da ${d} giorni`,projectLabel(p),`scheda_progetto.html?id=${encodeURIComponent(p.ID)}`,text(p.SVILUPPO)||'Nessuna prossima azione'));});
 projects.filter(hasAction).forEach(p=>items.push(item('action',60,text(p.SVILUPPO),projectLabel(p),`scheda_progetto.html?id=${encodeURIComponent(p.ID)}`,'Prossima azione')));
 const seen=new Set();return items.sort((a,b)=>b.priority-a.priority).filter(x=>{const k=`${x.type}|${x.title}|${x.subtitle}`;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,7);
}
function icon(type){return type==='followup'?'send':type==='deadline'?'alarm-clock':type==='session'?'music-2':type==='stale'?'hourglass':'move-right';}
function stats(){return{followup:pitchRows.filter(pitchDue).length,stale:projects.filter(p=>!isDone(p)&&projectDate(p)&&daysSince(projectDate(p))>=STALE_DAYS).length,actions:projects.filter(hasAction).length,calendar:legacyItems().length};}
function mount(){
 let panel=document.getElementById('kyv-today-priority');if(panel)return panel;
 const anchor=document.getElementById('kyv-today-project-actions')||document.querySelector('.kyv-quick-actions')||document.getElementById('kyv-producer-start');if(!anchor)return null;
 panel=document.createElement('section');panel.id='kyv-today-priority';anchor.insertAdjacentElement('afterend',panel);return panel;
}
function render(){
 const panel=mount();if(!panel)return;const rows=buildItems(),s=stats();
 panel.innerHTML=`<div class="kyv-today-priority-head"><div><p class="text-[9px] uppercase tracking-[.14em] font-black text-emerald-200">Focus</p><h3 class="mt-1">Priorità di oggi</h3><p>Solo ciò che merita attenzione adesso. La gestione completa resta in Progetti, Agenda e Pitch.</p></div><div class="flex gap-2"><a href="kyv_calendar.html" class="kyv-chip">Agenda</a><a href="progetti.html" class="kyv-chip">Progetti</a></div></div><div class="kyv-today-priority-stats"><span class="kyv-today-priority-stat">${s.followup} follow-up dovuti</span><span class="kyv-today-priority-stat">${s.stale} progetti fermi</span><span class="kyv-today-priority-stat">${s.actions} azioni aperte</span><span class="kyv-today-priority-stat">${s.calendar} sessioni/scadenze visibili</span></div><div class="kyv-today-priority-list">${rows.length?rows.map(x=>`<a class="kyv-today-priority-item kyv-today-priority-${x.type}" href="${H(x.href)}"><span class="kyv-today-priority-icon"><i data-lucide="${icon(x.type)}" class="w-4 h-4"></i></span><span class="min-w-0 flex-1"><strong>${H(x.title)}</strong><span>${H(x.subtitle)}</span>${x.meta?`<em>${H(x.meta)}</em>`:''}</span></a>`).join(''):'<div class="kyv-today-priority-empty">Nessuna priorità urgente: puoi lavorare direttamente da Progetti o Agenda.</div>'}</div>`;
 if(window.lucide)lucide.createIcons({root:panel});
}
function watchLegacy(){
 const root=document.getElementById('activity-list');if(root&&!legacyObserver){legacyObserver=new MutationObserver(()=>{clearTimeout(legacyTimer);legacyTimer=setTimeout(render,100);});legacyObserver.observe(root,{childList:true,subtree:true});}
 setTimeout(render,250);
}
function boot(){injectStyles();load();const o=new MutationObserver(()=>{if(!document.getElementById('kyv-today-priority'))render();if(document.getElementById('activity-list'))watchLegacy();});o.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),10000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
