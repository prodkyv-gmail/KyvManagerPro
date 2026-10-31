/* KYV Studio Manager v2.44 - session/pitch analytics, no inferred history or monetization. */
(function(root){
'use strict';
const t=v=>String(v??'').trim();
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(t(v))&&!Number.isNaN(Date.parse(t(v)+'T12:00:00Z'));
const days=(from,to)=>Math.round((Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000);
function analyze({sessions=[],links=[],pitches=[],projects=[],events=[]}={},asOf='2026-10-31'){
 if(!date(asOf))throw Error('Data analisi non valida');
 const activeSessions=sessions.filter(s=>!s.archiviata);
 const activePitches=pitches.filter(p=>!p.archiviata);
 const activeLinks=links.filter(l=>!l.annullato);
 const sessionIds=new Set(activeSessions.map(s=>t(s.id)));
 const projectIds=new Set(projects.map(p=>t(p.ID)));
 const validLinks=activeLinks.filter(l=>sessionIds.has(t(l.id_sessione))&&projectIds.has(t(l.id_progetto)));
 const sessionProjects=new Map();
 for(const l of validLinks){
  const key=t(l.id_sessione),ids=sessionProjects.get(key)||new Set();ids.add(t(l.id_progetto));sessionProjects.set(key,ids);
 }
 const stages=['in_lavorazione','demo','proposta','produzione','pubblicazione','accantonato'];
 const pitchStages=['da_proporre','inviato','in_ascolto','interessato','opzionato','confermato','rifiutato','accantonato'];
 const byStage=Object.fromEntries(stages.map(k=>[k,activeSessions.filter(s=>s.esito===k).length]));
 const byPitch=Object.fromEntries(pitchStages.map(k=>[k,activePitches.filter(p=>p.stato===k).length]));
 const overdue=activePitches.filter(p=>date(p.prossimo_followup)&&p.prossimo_followup<asOf&&!['confermato','rifiutato','accantonato'].includes(p.stato))
   .sort((a,b)=>a.prossimo_followup.localeCompare(b.prossimo_followup));
 const upcoming=activePitches.filter(p=>date(p.prossimo_followup)&&p.prossimo_followup>=asOf&&days(asOf,p.prossimo_followup)<=7)
   .sort((a,b)=>a.prossimo_followup.localeCompare(b.prossimo_followup));
 const durations=activeSessions.filter(s=>Number.isInteger(s.durata_minuti)&&s.durata_minuti>0);
 const durationMin=durations.reduce((sum,s)=>sum+s.durata_minuti,0);
 const uniqueSessionProjects=new Set(validLinks.map(l=>t(l.id_progetto))).size;
 const sessionsWithoutProject=activeSessions.filter(s=>!(sessionProjects.get(t(s.id))?.size)).length;
 const pitchesWithoutRecordedSession=activePitches.filter(p=>!validLinks.some(l=>t(l.id_progetto)===t(p.id_progetto))).length;
 // No automatic conversion: session records may be incomplete and one song can span multiple sessions.
 return Object.freeze({asOf,
  sessions:activeSessions.length,pitches:activePitches.length,
  projectsWithSession:uniqueSessionProjects,sessionsWithoutProject,
  pitchesWithoutRecordedSession,
  durationMin,datedDurationSessions:durations.length,
  sessionOutcomes:byStage,pitchStages:byPitch,overdue,upcoming,
  attributedProjects:projectIds.size,
  eventsLogged:events.length,conversionRate:null,
  caveat:'Nessuna conversione storica automatica: le vecchie schede non equivalgono a una sessione ciascuna e una canzone può averne molte.',
  feeCaveat:'Sessioni creative senza compenso diretto non equivalgono a insoluti; FEE=0 non genera un credito.'
 });
}
root.KYV_CREATIVE_DESK_V244=Object.freeze({analyze,date,days});
})(typeof window!=='undefined'?window:globalThis);
