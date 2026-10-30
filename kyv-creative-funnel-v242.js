/* KYV v2.42 - creative funnel, no false inference from a zero fee.
 * Fee zero is often a customary exploratory songwriting session.
 * STATO='USCITA' indicates a labelled outcome; confirmed release date is separate.
 */
(function(root){
'use strict';
const txt=v=>String(v??'').trim();
const money=v=>{
 if(typeof v==='number')return Number.isFinite(v)?v:null;
 let x=txt(v).replace(/[€\s]/g,'').replace(/[^\d,.-]/g,'');
 if(!x)return null;
 const comma=x.lastIndexOf(','),dot=x.lastIndexOf('.');
 if(comma>dot)x=x.replace(/\./g,'').replace(',','.');
 else if(dot>comma&&comma>=0)x=x.replace(/,/g,'');
 const n=Number(x);return Number.isFinite(n)?n:null;
};
const date=x=>/^\d{4}-\d{2}-\d{2}$/.test(txt(x))&&!Number.isNaN(Date.parse(x+'T12:00:00Z'));
function stage(p){
 const status=txt(p.STATO).toLocaleUpperCase('it-IT');
 const progress=txt(p.SVILUPPO).toLocaleUpperCase('it-IT');
 const explicitRelease=date(p.Data_Pubblicazione);
 const releasedLabel=/(^|[\s/])(USCITA|PUBBLICATA?|RELEASED)(?:$|[\s/])/.test(status);
 const preparing=/\b(BOZZA|DEMO|WORK.IN.PROGRESS|IN PRODUZIONE|WIP|LIMBO)\b/.test(status+' '+progress);
 const pitched=/INVIAT|MANDAT|PROPOST|PROVINAT|PITCH|IN FORSE/.test(status);
 let name='non_classificato';
 if(explicitRelease)name='pubblicazione_datata';
 else if(releasedLabel)name='uscita_dichiarata';
 else if(pitched)name='proposta_o_ascolto';
 else if(preparing)name='sviluppo';
 return {key:name,explicitRelease,releasedLabel,hasSessionDate:date(p.Data_Sessione)};
}
function analyze(raw=[]){
 const projects=raw.map(p=>({...p,fee:money(p.FEE),stage:stage(p)}));
 const zero=projects.filter(p=>p.fee===0);
 const missing=projects.filter(p=>p.fee===null);
 const positive=projects.filter(p=>p.fee!==null&&p.fee>0);
 const count=(all,key)=>all.filter(p=>p.stage.key===key).length;
 const byStage={
  publicationDated:count(projects,'pubblicazione_datata'),
  releaseLabeled:count(projects,'uscita_dichiarata'),
  pitched:count(projects,'proposta_o_ascolto'),
  developing:count(projects,'sviluppo'),
  notClassified:count(projects,'non_classificato')
 };
 const zeroByStage={
  publicationDated:count(zero,'pubblicazione_datata'),
  releaseLabeled:count(zero,'uscita_dichiarata'),
  pitched:count(zero,'proposta_o_ascolto'),
  developing:count(zero,'sviluppo'),
  notClassified:count(zero,'non_classificato')
 };
 const datedSessions=projects.filter(p=>p.stage.hasSessionDate);
 const datedReleases=projects.filter(p=>p.stage.explicitRelease);
 // Rate may be reported only with sufficient sample AND traceable release dates.
 const completeDates=datedSessions.filter(p=>p.stage.explicitRelease);
 const conversionReliable=datedSessions.length>=20&&datedSessions.length===projects.length&&completeDates.length>0;
 const examples=(stageKey,limit=12)=>zero.filter(p=>p.stage.key===stageKey).slice(0,limit)
  .map(p=>({label:(txt(p.TITOLO)||'Senza titolo')+' · '+(txt(p.ARTISTA)||'—'),
           detail:'FEE 0 · '+(txt(p.STATO)||'stato non specificato')+(p.stage.explicitRelease?' · pubblicazione '+p.Data_Pubblicazione:''),
           url:'scheda_progetto.html?id='+encodeURIComponent(p.ID)}));
 return Object.freeze({total:projects.length,zeroFee:zero.length,positiveFee:positive.length,missingFee:missing.length,
   datedSessions:datedSessions.length,datedReleases:datedReleases.length,
   byStage,zeroByStage,conversionReliable,
   conversion:conversionReliable?Math.round(100*completeDates.length/datedSessions.length):null,
   examples,
   caveats:[
    'FEE=0 è una condizione frequente nelle sessioni di scrittura a rischio creativo; non indica una fattura insoluta.',
    'Lo stato USCITA è una classificazione della scheda, non una data di pubblicazione verificata.',
    'BOZZA, DEMO o un brano proposto non dimostrano che il progetto sia definitivamente scartato.',
    'Senza date per tutte le sessioni e pubblicazioni non è possibile stimare in modo attendibile la conversione o il tempo investito.',
    'Per calcolare ore di lavoro non monetizzate servono dati sulle ore effettive, non stime implicite.'
   ]});
}
root.KYV_CREATIVE_FUNNEL_V242=Object.freeze({analyze,stage,money});
})(typeof window!=='undefined'?window:globalThis);
