/* KYV v2.45: confirmed Audio Finder links in project detail (read only). */
(function(root){
'use strict';
const H=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let version=0;
async function showProject(id){
 const panel=document.getElementById('kyv-project-audio-finder');if(!panel)return;
 const token=++version;panel.hidden=false;
 const href='kyv_audio_finder.html?project='+encodeURIComponent(id);
 panel.innerHTML='<h3 class="font-black text-white text-base">Audio Finder · File collegati</h3><p class="text-slate-300 text-xs">Lettura dei collegamenti confermati…</p>';
 try{
  const db=root.KYV?.createSupabaseClient?.();if(!db)throw Error('Sessione non disponibile');
  const x=await db.from('KYV_AUDIO_ASSOCIAZIONI').select('id_audio').eq('id_progetto',id).eq('annullata',false).eq('confermata',true).limit(500);
  if(x.error)throw x.error;if(token!==version)return;
  const ids=[...new Set((x.data||[]).map(v=>v.id_audio))];
  let rows=[];
  if(ids.length){
   const files=await db.from('KYV_AUDIO_INDICE').select('id,nome_file,provider,account_label,link_file').in('id',ids).limit(500);
   if(files.error)throw files.error;rows=files.data||[];
  }
  if(token!==version)return;
  panel.innerHTML='<div class="flex gap-3 flex-wrap items-center justify-between"><h3 class="font-black text-white text-base">Audio Finder · '+rows.length+' file collegati</h3>'+
   '<a class="text-cyan-200 text-xs font-bold" href="'+H(href)+'">Cerca o collega altri file</a></div>'+
   (rows.length?'<ul class="mt-3 space-y-2">'+rows.map(f=>'<li class="text-xs text-slate-300">'+
   H(f.nome_file)+' · '+H(f.provider)+(f.link_file&&/^https:\/\//.test(f.link_file)?' · <a target="_blank" rel="noopener noreferrer" href="'+H(f.link_file)+'">Apri</a>':'')+'</li>').join('')+'</ul>':
   '<p class="text-slate-300 text-xs mt-2">Nessun file associato tramite Audio Finder. I file nelle altre sezioni restano invariati.</p>');
 }catch(e){if(token!==version)return;panel.innerHTML='<p class="text-amber-200 text-xs">Audio Finder non disponibile: '+H(e?.message||e)+'</p>'+
  '<a class="text-cyan-200 text-xs" href="'+H(href)+'">Apri Audio Finder</a>';}
}
root.KYV_AUDIO_LINKED_V245={showProject};
})(typeof window!=='undefined'?window:globalThis);
