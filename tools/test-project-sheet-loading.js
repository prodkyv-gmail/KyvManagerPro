const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.resolve(__dirname, '..', 'scheda_progetto.html'), 'utf8');

assert.match(source, /safeProjectRows\([\s\S]*?\.eq\('ID_PROGETTO', projectId\)/, 'Le relazioni devono essere filtrate per ID_PROGETTO');
assert.match(source, /q=>q\.in\('ID_FILE',audioIds\)/, 'Gli invii legacy devono essere recuperati tramite gli ID file collegati');
assert.match(source, /select\(column,\{count:'exact',head:true\}\)/, 'Le statistiche globali devono usare conteggi senza scaricare righe');
assert.match(source, /q=>q\.ilike\(column,/, 'Le relazioni legacy testuali devono essere filtrate lato server');
assert.doesNotMatch(source, /safeTable\('DROPBOX_AUDIO_FILES'/, 'Non deve restare il caricamento globale dell’archivio audio');
assert.doesNotMatch(source, /\.limit\(2000\)/, 'La scheda non deve più scaricare blocchi globali da 2000 righe');
assert.doesNotMatch(source, /eq\('Numero',p\.FT\)/, 'FT è un numero fattura annuale e non deve essere usato come chiave di relazione');
assert.match(source, /q=>q\.eq\('ID_FT',p\.IDFT\)/, 'Il fallback legacy ammesso deve usare IDFT → ID_FT');


const vm=require('node:vm');
assert.match(source,/const fatture=mergeRows\(\[/,'Fatture dirette + IDFT devono essere unite, non alternative');
assert.doesNotMatch(source,/fattureByProject\.length\?fattureByProject:fattureById/,'No first-source-wins for invoices');
assert.match(source,/fromVersions=matchByProjectId\(unified,p\)/);
assert.match(source,/fromDropbox=matchByProjectId\(state\.audio,p\)/);
const startAudio=source.indexOf('function matchAudio(p){');
const endAudio=source.indexOf('function matchConsegne(p){',startAudio);
assert.ok(startAudio>0&&endAudio>startAudio);
const audioContext={
  state:{versions:[{ID_VERSIONE:1,ID_FILE:'version-1',ID_PROGETTO:7}],
    audio:[{ID_FILE:'dropbox-2',ID_PROGETTO:7}]},
  normalizeUnifiedAudio:row=>({...row}),
  matchByProjectId:(rows,p)=>rows.filter(row=>String(row.ID_PROGETTO)===String(p.ID)),
  mergeRows:(groups,key)=>[...new Map(groups.flat().map(row=>[String(row[key]),row])).values()],
  N:v=>String(v??'').trim().toLowerCase()
};
vm.runInNewContext(source.slice(startAudio,endAudio)+'\nthis.matchAudio=matchAudio;',audioContext);
assert.deepEqual(Array.from(audioContext.matchAudio({ID:7,TITOLO:'Brano',ARTISTA:'Artista'}),row=>row.ID_FILE).sort(),
  ['dropbox-2','version-1'],'Audio Versioni e Dropbox associati allo stesso progetto devono essere entrambi visibili');

const financeSource=fs.readFileSync(path.resolve(__dirname,'..','kyv-project-finance-summary.js'),'utf8');
const fStart=financeSource.indexOf('async function fetchInvoices(pid){');
const fEnd=financeSource.indexOf('function ensureStyle(){',fStart);
assert.ok(fStart>0&&fEnd>fStart);
assert.doesNotMatch(financeSource.slice(fStart,fEnd),/if\(explicit\.length\|\|legacyDirect\.length\)return/,
  'Una fattura diretta non deve nascondere la fattura collegata tramite IDFT');
function mockClient(invoiceId=22,allocations=[]){
  const invoices=[
    {ID_FT:11,ID_PROGETTO:7,PrezzoUnitario:'300',Numero:'11'},
    {ID_FT:22,ID_PROGETTO:null,PrezzoUnitario:'500',Numero:'22'}
  ];
  return {from(table){
    let filter=null;
    return {
      select(){return this;},order(){return this;},
      eq(k,v){filter={kind:'eq',k,v};return this;},
      in(k,values){filter={kind:'in',k,values};return this;},
      limit(){
        const rows=table==='FATTURE'?invoices:table==='FATTURE_RIPARTIZIONI'?allocations:[];
        let selected=rows;
        if(filter?.kind==='eq')selected=rows.filter(row=>String(row[filter.k])===String(filter.v));
        if(filter?.kind==='in')selected=rows.filter(row=>filter.values.some(v=>String(row[filter.k])===String(v)));
        return Promise.resolve({data:selected,error:null});
      },
      maybeSingle(){return Promise.resolve({data:{ID:7,IDFT:invoiceId},error:null});}
    };
  }};
}
async function testCombinedFinance(){
  const context={
    fields:'*',
    client:()=>mockClient(),
    text:value=>String(value??'').trim(),
    unique:rows=>[...new Map((rows||[]).map((row,i)=>[String(row.ID_FT??i),row])).values()],
    console
  };
  vm.runInNewContext(financeSource.slice(fStart,fEnd)+'\nthis.fetchInvoices=fetchInvoices;',context);
  const result=await context.fetchInvoices(7);
  assert.deepEqual(Array.from(result,row=>row.ID_FT).sort((a,b)=>a-b),[11,22],
    'Riepilogo fatture: mostra sia ID_PROGETTO sia IDFT distinto');
  context.client=()=>mockClient(11);
  const duplicate=await context.fetchInvoices(7);
  assert.deepEqual(Array.from(duplicate,row=>row.ID_FT),[11],
    'Una fattura collegata da entrambe le fonti non deve essere conteggiata due volte');
  const allocation=[{id_ft:22,id_progetto:7,prezzo_unitario:350}];
  context.client=()=>mockClient(22,allocation);
  const shared=await context.fetchInvoices(7);
  assert.deepEqual(Array.from(shared,row=>row.ID_FT).sort((a,b)=>a-b),[11,22]);
  assert.equal(shared.find(row=>row.ID_FT===22)._v247_shared,true);
  assert.equal(shared.find(row=>row.ID_FT===22).PrezzoUnitario,'350',
    'La quota esplicita prevale sul valore complessivo della fattura');
}
testCombinedFinance().then(()=>console.log('Scheda Progetto: unioni audio/fatture, zero doppi conteggi e quote esplicite OK.'))
  .catch(error=>{console.error(error);process.exitCode=1;});

