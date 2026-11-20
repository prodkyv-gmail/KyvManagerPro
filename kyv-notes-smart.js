/* KYV Taccuino D: transparent, on-device only suggestions and historical timeline. */
(function(root){
'use strict';
const categories=Object.freeze([
 {id:'todo',terms:/\b(da fare|devo|ricordare|promemoria|scadenza|entro domani|entro venerdi|chiamare|inviare|sollecitare|follow.?up|consegnare)\b/i},
 {id:'event',terms:/\b(ho parlato|abbiamo parlato|e successo|riunione|telefonata|incontro|oggi ho|ieri ho|mi ha detto|sessione fatta)\b/i},
 {id:'idea',terms:/\b(idea|ritornello|melodia|strofa|arrangiamento|testo canzone|produzione|riff|accordi|beat|sound design)\b/i}
]);
function normalize(input){return String(input||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
function suggest(input){
 const content=String(input?.content||''),title=String(input?.title||'');
 const normalized=normalize(title+' '+content);
 const category=categories.find(item=>item.terms.test(normalized))?.id||'info';
 const first=content.split(/\r?\n/).map(x=>x.trim()).find(Boolean)||'';
 const proposal=(title.trim()||first.replace(/^[\-•\d.\s]+/,'').slice(0,75))||'Nuova nota';
 const lines=content.replace(/\s+/g,' ').trim();
 const summary=lines.length>240?lines.slice(0,237).trimEnd()+'…':lines;
 return {category,title:proposal.slice(0,180),summary,source:'Regole locali (nessun servizio AI esterno)'};
}
function sortTimeline(items){
 return [...(items||[])].sort((a,b)=>{
  const x=Date.parse(a.created_at||'')||0,y=Date.parse(b.created_at||'')||0;
  return y-x||String(a.id||'').localeCompare(String(b.id||''));
 });
}
function dayLabel(value,locale='it-IT'){
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return 'Data non disponibile';
 return new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric'}).format(d);
}
function groupTimeline(items){
 const buckets=new Map();
 for(const note of sortTimeline(items)){
  const day=dayLabel(note.created_at);
  if(!buckets.has(day))buckets.set(day,[]);
  buckets.get(day).push(note);
 }
 return [...buckets.entries()].map(([label,notes])=>({label,notes}));
}
function agendaUrl(noteId){
 if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(noteId||'')))
  throw Error('Nota non valida.');
 return 'kyv_calendar.html?fromNote='+encodeURIComponent(noteId);
}
root.KYV_NOTES_SMART=Object.freeze({suggest,groupTimeline,sortTimeline,dayLabel,agendaUrl});
})(typeof window!=='undefined'?window:globalThis);
