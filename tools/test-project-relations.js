const assert=require('node:assert/strict');
const fs=require('node:fs');
const R=require('../kyv-project-relations.js');
const source=fs.readFileSync('kyv-project-relations.js','utf8');
assert.doesNotMatch(source,/\.from\(|\bfetch\(|new MutationObserver/,
  'il resolver deve restare puro: nessuna query, rete o observer');

const invoices=[
  {ID_FT:11,ID_PROGETTO:7,PrezzoUnitario:'300',Descrizione:'Diretta'},
  {ID_FT:22,ID_PROGETTO:null,PrezzoUnitario:'500',Descrizione:'Legacy'},
  {ID_FT:33,ID_PROGETTO:8,PrezzoUnitario:'900',Descrizione:'Condivisa'},
  {ID_FT:44,ID_PROGETTO:7,PrezzoUnitario:'700',Descrizione:'Ripartita'}
];

assert.deepEqual(R.resolveProjectInvoices({project:{ID:7,IDFT:22},invoices}).map(row=>row.ID_FT),[11,44,22],
  'collegamenti diretti e IDFT distinti devono coesistere');
assert.deepEqual(R.resolveProjectInvoices({project:{ID:7,IDFT:11},invoices}).map(row=>row.ID_FT),[11,44],
  'la stessa fattura collegata da due fonti non deve duplicarsi');

const unallocated=R.resolveProjectInvoices({project:{ID:7,IDFT:33},invoices});
assert.equal(unallocated.length,3);
assert.equal(unallocated.find(row=>row.ID_FT===33)._kyvRelation.kind,'idft-shared');
assert.equal(unallocated.find(row=>row.ID_FT===33).PrezzoUnitario,'0');

const allocations=[
  {id_ft:44,id_progetto:7,prezzo_unitario:'250,00',descrizione:'Produzione'},
  {id_ft:44,id_progetto:7,prezzo_unitario:'100',descrizione:'Mix'},
  {id_ft:44,id_progetto:8,prezzo_unitario:'350',descrizione:'Master'}
];
const allocated=R.resolveProjectInvoices({project:{ID:7,IDFT:44},invoices,allocations});
assert.deepEqual(allocated.map(row=>row.ID_FT).sort((a,b)=>a-b),[11,44]);
assert.equal(allocated.find(row=>row.ID_FT===44).PrezzoUnitario,'350');
assert.equal(allocated.find(row=>row.ID_FT===44).Descrizione,'Produzione · Mix');
assert.equal(allocated.find(row=>row.ID_FT===44)._kyvRelation.kind,'allocation');
assert.equal(R.resolveProjectInvoices({project:{ID:9,IDFT:44},invoices,allocations}).length,0,
  'una fattura ripartita non appartiene a progetti privi di quota esplicita');

const projects=[{ID:7,TITOLO:'Uno',IDFT:33},{ID:8,TITOLO:'Due'},{ID:9,TITOLO:'Tre',IDFT:33}];
assert.deepEqual(R.projectsForInvoice({invoice:invoices[2],projects}).map(link=>link.project.ID),[8,7,9],
  'senza quote, proprietario diretto e riferimenti IDFT devono essere uniti');
assert.deepEqual(R.projectsForInvoice({invoice:invoices[3],projects,allocations}).map(link=>[link.project.ID,link.amount]),[[7,350],[8,350]],
  'le ripartizioni esplicite sostituiscono i collegamenti legacy nel riepilogo fattura');

const project={ID:7,TITOLO:'Brano Blu',ARTISTA:'KYV'};
const audio=R.resolveProjectAudio({
  project,
  audioVersions:[
    {ID_VERSIONE:1,ID_PROGETTO:7,NOME_FILE:'mix.wav',PROVIDER:'dropbox',LINK_FILE:'https://db/mix',DATA_FILE:'2026-10-01'},
    {ID_VERSIONE:2,ID_PROGETTO:8,NOME_FILE:'altro.wav'}
  ],
  dropboxFiles:[{ID_FILE:'db-2',ID_PROGETTO:7,Nome_File:'master.wav',Link_Dropbox:'https://db/master',Data_Caricamento:'2026-10-02'}],
  driveDocuments:[
    {ID_DOCUMENTO:3,ID_PROGETTO:7,Tipo_Documento:'AUDIO_DRIVE',Titolo_Documento:'stems.zip',Link_Drive:'https://drive/stems',Data_Documento:'2026-10-03'},
    {ID_DOCUMENTO:4,ID_PROGETTO:7,Tipo_Documento:'Contratto',Titolo_Documento:'contratto.pdf',Data_Documento:'2026-10-04'}
  ]
});
assert.deepEqual(audio.files.map(row=>row.Nome_File),['master.wav','mix.wav','stems.zip'],
  'versioni, Dropbox e documenti audio Drive devono coesistere; i documenti non audio restano esclusi');
assert.equal(audio.usedFallback,false);

const fallback=R.resolveProjectAudio({project,audioVersions:[],dropboxFiles:[
  {ID_FILE:'legacy-1',Progetto:'Brano Blu',Nome_File:'legacy.mp3'},
  {ID_FILE:'legacy-2',Progetto:'Altro',Nome_File:'altro.mp3'}
]});
assert.deepEqual(fallback.files.map(row=>row.ID_FILE),['legacy-1']);
assert.equal(fallback.usedFallback,true);

const latest=R.latestAudioByProject([
  {ID_VERSIONE:1,ID_PROGETTO:7,NOME_FILE:'mix.wav',DATA_FILE:'2026-10-01'},
  {ID_FILE:'db-2',ID_PROGETTO:7,Nome_File:'master.wav',Data_Caricamento:'2026-10-02'},
  {ID_DOCUMENTO:3,ID_PROGETTO:7,Tipo_Documento:'AUDIO_DRIVE',Titolo_Documento:'stems.zip',Data_Documento:'2026-10-03'},
  {ID_DOCUMENTO:4,ID_PROGETTO:7,Tipo_Documento:'Contratto',Titolo_Documento:'contratto.pdf',Data_Documento:'2026-10-04'}
]);
assert.equal(latest.get('7').row.Titolo_Documento,'stems.zip',
  'il riepilogo deve scegliere l’ultimo audio reale, non l’ultimo documento generico');

console.log('OK: regole condivise progetti/fatture/ripartizioni e audio Drive/Dropbox/versioni.');
