/* Audit mirato dei link già registrati: autenticato, limitato e senza HEAD/fetch verso cloud. */
(function(){
'use strict';
const LIMIT=75,COOLDOWN_MS=30000,PAGE_SIZE=24;
let lastRun=0,items=[],visibleCount=PAGE_SIZE;
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
function notify(message,kind){if(window.KYV?.showToast)KYV.showToast(message,kind);}
function mount(){
  const scroll=document.querySelector('main > section');
  const header=scroll?.querySelector('header');
  if(!scroll||!header||document.getElementById('kyv-link-audit'))return;
  const panel=document.createElement('section');
  panel.id='kyv-link-audit';
  panel.className='mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 sm:p-5';
  panel.innerHTML=`<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><p class="text-[10px] uppercase tracking-[0.16em] font-black text-cyan-300">Controllo interno · nessuna scansione cloud</p><h3 class="text-lg font-black text-white mt-1">Link audio registrati</h3><p class="text-xs text-kyv-text mt-1 max-w-3xl">Analizza solo i riferimenti già salvati nel database (massimo ${LIMIT} per archivio). Non contatta Drive o Dropbox e non garantisce la riproduzione: permessi e CORS restano decisivi.</p></div><button id="kyv-run-link-audit" type="button" class="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black shrink-0"><i data-lucide="shield-check" class="w-4 h-4 inline mr-2"></i>Controlla link</button></div><div id="kyv-link-audit-status" class="mt-4 text-xs text-kyv-text" role="status" aria-live="polite">Controllo non ancora eseguito.</div><div id="kyv-link-audit-results" class="hidden mt-4 space-y-2"></div>`;
  header.insertAdjacentElement('afterend',panel);
  panel.querySelector('#kyv-run-link-audit').addEventListener('click',run);
  panel.querySelector('#kyv-link-audit-results').addEventListener('click',event=>{
    if(event.target.closest('[data-audit-more]')){visibleCount+=PAGE_SIZE;render();return;}
    playSelected(event);
  });
  const player=document.getElementById('audio-player');
  player?.addEventListener('error',()=>{
    if(player.dataset.kyvAuditUrl && player.src===player.dataset.kyvAuditUrl){
      delete player.dataset.kyvAuditUrl;
      notify('Il link non è riproducibile qui: usa Apri esterno e controlla i permessi del file.','warning');
    }
  });
  if(window.lucide)lucide.createIcons({root:panel});
}
function rows(data,source,linkKey,labelKey){
  return(data||[]).map((row,index)=>{
    const link=row[linkKey]||'';
    return{source,projectId:row.ID_PROGETTO||'',label:row[labelKey]||`${source} #${index+1}`,link,audit:KYV_LINK_AUDIT.inspect(link)};
  });
}
async function run(){
  const now=Date.now();
  if(now-lastRun<COOLDOWN_MS){notify('Attendi qualche secondo prima di ripetere il controllo.','warning');return;}
  const button=document.getElementById('kyv-run-link-audit');
  const status=document.getElementById('kyv-link-audit-status');
  const results=document.getElementById('kyv-link-audit-results');
  button.disabled=true;status.textContent='Controllo dei riferimenti autorizzati in corso…';results.classList.add('hidden');
  try{
    if(!window.KYV_LINK_AUDIT)throw new Error('Modulo link non caricato. Aggiorna la pagina.');
    const session=await KYV_AUTH.getSession();
    if(!session)throw new Error('Sessione non disponibile. Accedi nuovamente.');
    const db=KYV.createSupabaseClient();
    const responses=await Promise.all([
      db.from('AUDIO_VERSIONI').select('ID_PROGETTO,LINK_FILE,NOME_FILE').limit(LIMIT),
      db.from('DROPBOX_AUDIO_FILES').select('ID_PROGETTO,Link_Dropbox').limit(LIMIT),
      db.from('DOCUMENTI_PROGETTO').select('ID_PROGETTO,Link_Drive,Titolo_Documento').limit(LIMIT)
    ]);
    if(responses.some(r=>r.error))throw new Error('Uno o più archivi non sono leggibili con questa sessione.');
    items=[
      ...rows(responses[0].data,'Versione audio','LINK_FILE','NOME_FILE'),
      ...rows(responses[1].data,'Dropbox','Link_Dropbox',''),
      ...rows(responses[2].data,'Documento progetto','Link_Drive','Titolo_Documento')
    ];
    visibleCount=PAGE_SIZE;lastRun=Date.now();render();
  }catch(error){
    status.textContent=`Controllo non riuscito: ${error.message||'errore sconosciuto'}. Nessun dato è stato modificato.`;
    status.className='mt-4 text-xs text-rose-300';
  }finally{button.disabled=false;}
}
function render(){
  const status=document.getElementById('kyv-link-audit-status');
  const results=document.getElementById('kyv-link-audit-results');
  const counts=items.reduce((acc,item)=>(acc[item.audit.status]=(acc[item.audit.status]||0)+1,acc),{});
  status.className='mt-4 text-xs text-kyv-text';
  status.textContent=`${items.length} riferimenti controllati: ${counts.direct||0} diretti, ${counts.conditional||0} condizionati, ${counts.external||0} solo esterni, ${counts.invalid||0} mancanti/non validi. Nessun file cloud è stato interrogato.`;
  const labels={direct:'Probabile stream',conditional:'Permessi/CORS da verificare',external:'Apri esternamente',invalid:'Link non utilizzabile'};
  results.innerHTML=items.slice(0,visibleCount).map((item,index)=>{
    const playable=item.audit.playUrl&&item.audit.status!=='invalid';
    const external=item.audit.externalUrl;
    return `<article class="rounded-xl border border-kyv-border bg-kyv-bg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div class="min-w-0"><p class="text-xs font-black text-white truncate">${esc(item.label)}</p><p class="text-[11px] text-kyv-text mt-1">${esc(item.source)}${item.projectId?` · Progetto #${esc(item.projectId)}`:''} · ${esc(labels[item.audit.status]||item.audit.status)}</p><p class="text-[10px] text-slate-500 mt-1">${esc(item.audit.reason)}</p></div><div class="flex flex-wrap gap-2 shrink-0">${playable?`<button type="button" data-audit-play="${index}" class="px-3 py-2 rounded-lg bg-violet-600/15 border border-violet-500/25 text-violet-200 text-xs font-bold">Prova nel player</button>`:''}${external?`<a href="${esc(external)}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 rounded-lg border border-kyv-border text-kyv-text text-xs font-bold">Apri esterno</a>`:''}</div></article>`;
  }).join('')||'<p class="text-xs text-kyv-text">Nessun riferimento presente.</p>';
  if(visibleCount<items.length)results.insertAdjacentHTML('beforeend',`<button type="button" data-audit-more class="px-4 py-3 rounded-xl border border-cyan-500/30 text-cyan-100 text-xs font-bold">Mostra altri (${items.length-visibleCount})</button>`);
  results.classList.remove('hidden');
}
function playSelected(event){
  const button=event.target.closest('[data-audit-play]');if(!button)return;
  const item=items[Number(button.dataset.auditPlay)];if(!item?.audit?.playUrl)return;
  const player=document.getElementById('audio-player');if(!player)return;
  player.pause();player.src=item.audit.playUrl;
  player.dataset.kyvAuditUrl=player.src;
  player.load();
  player.play().then(()=>notify('Riproduzione avviata dal link registrato.','success')).catch(()=>{
    if(player.dataset.kyvAuditUrl){delete player.dataset.kyvAuditUrl;notify('Il browser non può riprodurre questo link. Usa Apri esterno e verifica permessi/CORS.','warning');}
  });
}
// Config.js inietta il modulo dinamicamente: DOMContentLoaded potrebbe essere già passato.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();
