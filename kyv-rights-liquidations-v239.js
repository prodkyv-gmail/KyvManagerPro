/* KYV v2.39 - verified rights transfers only. Never auto-promote SIAE statement entries. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const t=x=>String(x??'').trim();
const H=v=>window.KYV?.safeHtml?window.KYV.safeHtml(v):t(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro=x=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(x)||0);
const dateOK=x=>/^\d{4}-\d{2}-\d{2}$/.test(t(x))&&!Number.isNaN(Date.parse(x+'T12:00:00Z'));
const base=()=>window.KYV?.createSupabaseClient?.();
let client=null,rows=[],busy=false;
async function load(){
 if(!client)client=base();if(!client)return $('rights-message').textContent='Connessione non disponibile.';
 const q=await client.from('KYV_LIQUIDAZIONI_DIRITTI').select('ID_LIQUIDAZIONE,Ente,DataAccredito,PeriodoDa,PeriodoA,ImportoNetto,Riferimento,Note').order('DataAccredito',{ascending:false}).limit(5000);
 if(q.error){$('rights-message').textContent='Lettura non riuscita: '+q.error.message;return;}
 rows=q.data||[];$('rights-message').textContent=rows.length+' liquidazioni registrate manualmente. Nessun movimento SIAE grezzo importato automaticamente.';
 render();
}
function render(){
 const years=[...new Set(rows.map(x=>x.DataAccredito.slice(0,4)))].sort().reverse();
 const selected=$('rights-year').value;
 $('rights-year').innerHTML='<option value="all">Tutti gli anni</option>'+years.map(y=>'<option '+(selected===y?'selected ':'')+'value="'+H(y)+'">'+H(y)+'</option>').join('');
 const year=$('rights-year').value,filtered=rows.filter(x=>year==='all'||x.DataAccredito.startsWith(year));
 const sum=e=>filtered.filter(x=>x.Ente===e).reduce((s,x)=>s+Math.round(Number(x.ImportoNetto)*100),0)/100;
 $('rights-totals').textContent='SIAE: '+euro(sum('SIAE'))+' · Nuovo IMAIE: '+euro(sum('NUOVO IMAIE'))+' · Totale bonifici dichiarati: '+euro(sum('SIAE')+sum('NUOVO IMAIE'));
 $('rights-rows').innerHTML=filtered.map(x=>'<tr><td>'+H(x.DataAccredito)+'</td><td>'+H(x.Ente)+'</td><td>'+H(euro(x.ImportoNetto))+'</td><td>'+H([x.PeriodoDa,x.PeriodoA].filter(Boolean).join(' / ')||'—')+'</td><td>'+H(x.Riferimento||'—')+'</td></tr>').join('')||'<tr><td colspan="5">Nessuna liquidazione registrata per il periodo</td></tr>';
}
async function submit(event){
 event.preventDefault();if(busy)return;
 const form=event.currentTarget,p=Object.fromEntries(new FormData(form).entries());
 const amount=Number(t(p.ImportoNetto).replace(',','.'));
 if(!['SIAE','NUOVO IMAIE'].includes(p.Ente)||!dateOK(p.DataAccredito)||!Number.isFinite(amount)||amount<=0||Math.round(amount*100)/100!==amount) return $('rights-message').textContent='Controlla ente, data e importo positivo (massimo due decimali).';
 if(p.PeriodoDa&&!dateOK(p.PeriodoDa)||p.PeriodoA&&!dateOK(p.PeriodoA)||p.PeriodoDa&&p.PeriodoA&&p.PeriodoA<p.PeriodoDa)return $('rights-message').textContent='Periodo di competenza non valido.';
 if(!window.confirm('Confermi di avere ricevuto il bonifico '+p.Ente+' di '+euro(amount)+' il '+p.DataAccredito+'? Non è una fattura e non potrà essere cancellato da questa schermata.'))return;
 busy=true;try{
 const payload={Ente:p.Ente,DataAccredito:p.DataAccredito,ImportoNetto:amount,PeriodoDa:p.PeriodoDa||null,PeriodoA:p.PeriodoA||null,Riferimento:t(p.Riferimento)||null,Note:t(p.Note)||null};
 const res=await client.from('KYV_LIQUIDAZIONI_DIRITTI').insert(payload).select('ID_LIQUIDAZIONE');
 if(res.error||res.data?.length!==1)throw Error(res.error?.message||'Registrazione non confermata');
 form.reset();await load();window.dispatchEvent(new CustomEvent('kyv:rights-liquidation-updated'));
 }catch(e){$('rights-message').textContent='Operazione non completata: '+e.message;}finally{busy=false;}
}
function boot(){if(!$('rights-form'))return;$('rights-form').addEventListener('submit',submit);$('rights-year').addEventListener('change',render);$('rights-reload').addEventListener('click',load);load();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
