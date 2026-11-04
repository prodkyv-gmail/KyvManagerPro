/* KYV v2.59 — unified, read-only music-desk projections from authenticated archives.
 * No inferred sessions, ownership, royalties, invoice projects or split cash allocations.
 */
(function(root){
'use strict';
const T=v=>String(v??'').trim();
const FOLD=v=>T(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it-IT').replace(/\s+/g,' ');
const CENTS=v=>Math.round(v*100);
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(T(v))&&!Number.isNaN(Date.parse(v+'T12:00:00Z'));
const terminals=new Set(['confermato','rifiutato','accantonato']);
const allowedFilters=new Set(['all','audio','noaudio','sessions','pitches','overdue','in_ascolto','invoices']);
const KEY=f=>[T(f.provider),T(f.account_label),T(f.external_key)].join('\u0000');
function build(data={},dateToday='2026-11-04',line=root.KYV_INVOICE_LINE){
 if(!date(dateToday))throw Error('Data scrivania non valida');
 const {projects=[],sessions=[],links=[],pitches=[],audioLinks=[],audioFiles=[],audioDecisions=[]}=data;
 const finance=data.finance?.ready===true?data.finance:null;
 const infos=new Map();
 for(const p of projects){
  const id=T(p?.ID);if(!id||infos.has(id))continue;
  const fee=line?.parse?.(p.FEE);
  infos.set(id,{id,title:T(p.TITOLO)||'Senza titolo',artist:T(p.ARTISTA),
   status:T(p.STATO),development:T(p.SVILUPPO),releaseDate:date(p.Data_Pubblicazione)?p.Data_Pubblicazione:'',
   fee:fee!==null&&Number.isFinite(fee)&&fee>=0?fee:null,
   sessionIds:new Set(),pitchIds:new Set(),audioIds:new Set(),
   pitches:[],sessions:[],audio:[],invoiceIds:new Set(),invoiceRecords:[],
   billedCents:0,billedIncomplete:false,documentedReceiptsCents:0,
   receiptUnknownCount:0,legacyPaidFlags:0,splitInvoiceCount:0,overdue:0});
 }
 const validSessions=new Map(sessions.filter(s=>s&&!s.archiviata&&T(s.id)).map(s=>[T(s.id),s]));
 for(const relation of links){
  if(!relation||relation.annullato)continue;
  const p=infos.get(T(relation.id_progetto)),s=validSessions.get(T(relation.id_sessione));
  if(!p||!s||p.sessionIds.has(T(s.id)))continue;
  p.sessionIds.add(T(s.id));p.sessions.push(s);
 }
 const activePitches=pitches.filter(p=>p&&!p.archiviata&&T(p.id));
 for(const pitch of activePitches){
  const p=infos.get(T(pitch.id_progetto));
  if(!p||p.pitchIds.has(T(pitch.id)))continue;
  p.pitchIds.add(T(pitch.id));p.pitches.push(pitch);
  if(date(pitch.prossimo_followup)&&pitch.prossimo_followup<dateToday&&!terminals.has(T(pitch.stato)))p.overdue++;
 }
 const owned=new Set(audioDecisions.filter(d=>d?.decision==='mio').map(KEY));
 const files=new Map(audioFiles.filter(f=>f&&T(f.id)&&owned.has(KEY(f))).map(f=>[T(f.id),f]));
 for(const a of audioLinks){
  if(!a||a.annullata||a.confermata!==true||a.id_progetto==null)continue;
  const p=infos.get(T(a.id_progetto)),f=files.get(T(a.id_audio));
  if(!p||!f||p.audioIds.has(T(f.id)))continue;
  p.audioIds.add(T(f.id));p.audio.push(f);
 }
 const totals={invoicesLinked:0,billedCents:0,receiptsCents:0,legacyPaidFlags:0,
  missingLineAmounts:0,splitReceiptsNotAllocated:0,invalidAllocations:0};
 if(finance){
  if(!line?.info||!line?.parse)throw Error('Motore PrezzoUnitario non disponibile');
  const invoices=finance.invoices||[],allocations=finance.allocations||[],
   payments=finance.payments||[],reversals=finance.reversals||[];
  const splitByInvoice=new Map(),paymentsByInvoice=new Map(),
   reversed=new Set(reversals.map(x=>T(x.ID_INCASSO)));
  for(const a of allocations){
   const id=T(a?.id_ft);
   if(!id)continue;
   const xs=splitByInvoice.get(id)||[];xs.push(a);splitByInvoice.set(id,xs);
  }
  for(const payment of payments){
   const id=T(payment?.ID_FT);if(!id)continue;
   const xs=paymentsByInvoice.get(id)||[];xs.push(payment);paymentsByInvoice.set(id,xs);
  }
  const unique=new Set();
  for(const invoice of invoices){
   const iid=T(invoice?.ID_FT);
   if(!iid||unique.has(iid))continue;
   unique.add(iid);
   const amount=line.info(invoice);
   const invoiceCents=amount.valid?CENTS(amount.amount):null;
   const split=splitByInvoice.get(iid)||[],direct=infos.get(T(invoice.ID_PROGETTO));
   let projectParts=[];
   if(split.length){
    const allocated=new Map();
    for(const row of split){
     const p=infos.get(T(row.id_progetto)),v=line.parse(row.prezzo_unitario);
     if(!p||v===null||!Number.isFinite(v)||v<0||Math.abs(CENTS(v)-v*100)>1e-5){
      totals.invalidAllocations++;continue;
     }
     allocated.set(p.id,(allocated.get(p.id)||0)+CENTS(v));
    }
    projectParts=[...allocated].map(([pid,cents])=>({p:infos.get(pid),cents,split:true}));
   }else if(direct){
    projectParts=[{p:direct,cents:invoiceCents,split:false}];
   }
   if(!projectParts.length)continue;
   totals.invoicesLinked++;
   const moves=paymentsByInvoice.get(iid)||[];
   const received=moves.filter(x=>!reversed.has(T(x.ID_INCASSO)))
    .map(x=>line.parse(x.Importo)).filter(v=>v!==null&&Number.isFinite(v)&&v>0)
    .reduce((sum,v)=>sum+CENTS(v),0);
   const receiptCents=invoiceCents===null?null:Math.min(invoiceCents,Math.max(0,received));
   for(const part of projectParts){
    const p=part.p;
    if(!p.invoiceIds.has(iid))p.invoiceIds.add(iid);
    p.invoiceRecords.push({id:iid,number:T(invoice.Numero_Originale)||T(invoice.Numero)||iid,
     amountCents:part.cents,split:part.split,date:T(invoice.Data)});
    if(part.cents===null){p.billedIncomplete=true;totals.missingLineAmounts++;}
    else {p.billedCents+=part.cents;totals.billedCents+=part.cents;}
    // Never allocate a cash receipt across multiple projects without an explicit payment breakdown.
    if(part.split){
     p.splitInvoiceCount++;
    }else if(receiptCents!==null){
     p.documentedReceiptsCents+=receiptCents;totals.receiptsCents+=receiptCents;
     if(!moves.length&&/^(si|sì|yes|true|1|pagat|incassat)/i.test(T(invoice.PAGATA))){
      p.legacyPaidFlags++;totals.legacyPaidFlags++;
     }
    }else p.receiptUnknownCount++;
   }
   if(split.length&&receiptCents!==null&&receiptCents>0)totals.splitReceiptsNotAllocated+=receiptCents;
  }
 }
 const entries=[...infos.values()].map(p=>{
  const {sessionIds,pitchIds,audioIds,invoiceIds,...rest}=p;
  return {...rest,sessionCount:sessionIds.size,pitchCount:pitchIds.size,
   audioCount:audioIds.size,invoiceCount:invoiceIds.size,
   latestSession:p.sessions.map(s=>date(s.data_sessione)?s.data_sessione:'').sort().at(-1)||'',
   hasEconomicData:!!finance};
 }).sort((a,b)=>b.overdue-a.overdue||b.pitchCount-a.pitchCount||
  FOLD(a.artist+' '+a.title).localeCompare(FOLD(b.artist+' '+b.title),'it')||a.id.localeCompare(b.id,'it'));
 const inAudio=entries.filter(x=>x.audioCount>0).length,
  inSession=entries.filter(x=>x.sessionCount>0).length,
  withPitch=entries.filter(x=>x.pitchCount>0).length;
 return Object.freeze({entries,summary:Object.freeze({projects:entries.length,
  projectsWithSession:inSession,projectsWithApprovedAudio:inAudio,
  projectsWithPitch:withPitch,overduePitches:entries.reduce((n,p)=>n+p.overdue,0),
  totalRecordedPitches:entries.reduce((n,p)=>n+p.pitchCount,0),
  activeSessions:validSessions.size,financeAvailable:!!finance,
  ...totals}),caveat:'Solo archivi documentati: nessuna sessione o conversione viene dedotta dai progetti storici. Audio soltanto se confermati come tuoi.'});
}
function filter(model,{query='',artist='',status='',mode='all'}={}){
 if(!allowedFilters.has(mode))throw Error('Filtro scrivania non valido');
 const terms=FOLD(query).split(' ').filter(Boolean);
 return (model?.entries||[]).filter(p=>
  (!artist||FOLD(p.artist)===FOLD(artist))&&
  (!status||FOLD(p.status)===FOLD(status))&&
  (mode==='all'||mode==='audio'&&p.audioCount>0||
   mode==='noaudio'&&p.audioCount===0||mode==='sessions'&&p.sessionCount>0||
   mode==='pitches'&&p.pitchCount>0||mode==='overdue'&&p.overdue>0||
   mode==='in_ascolto'&&p.pitches.some(x=>x.stato==='in_ascolto')||
   mode==='invoices'&&p.invoiceCount>0)&&
  terms.every(term=>FOLD([p.title,p.artist,p.status,p.development,
   ...p.pitches.map(x=>x.destinatario+' '+T(x.referente)),
   ...p.sessions.map(x=>x.titolo)].join(' ')).includes(term)));
}
root.KYV_MUSIC_HUB_V259=Object.freeze({build,filter});
})(typeof window!=='undefined'?window:globalThis);
