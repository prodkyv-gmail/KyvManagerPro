const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const source=fs.readFileSync('kyv-aruba-import.js','utf8');
const register=fs.readFileSync('fatture.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const window={};
vm.runInNewContext(source,{window,console}, {filename:'kyv-aruba-import.js'});
const api=window.KYV_ARUBA_IMPORT;
assert.ok(api&&api.boot&&api.parseInvoiceDocument,'Importer API must boot and parse XML');
assert.ok(register.includes('<script src="kyv-aruba-import.js" defer></script>'),'Invoice register must load importer');
assert.ok(register.includes('id="kyv-aruba-open"'),'Import button must exist');
assert.ok(register.includes('data-kyv-new-table="FATTURE"'),'Manual invoice creation must remain');
assert.ok(register.includes('KYV_ARUBA_IMPORT?.boot'),'Importer must receive authenticated Supabase client');
assert.ok(register.includes('Numero_Originale || f.Numero'),'Invoice table must show exact Aruba invoice number');
assert.ok(fs.readFileSync('kyv-record-editor.js','utf8').includes("['Numero', 'Numero_Originale'"),'Manual editor must permit correcting the original document number');
assert.ok(source.includes('crypto.subtle.digest'),'Imported XML must have a SHA-256 signature');
assert.ok(source.includes("if(/<!DOCTYPE|<!ENTITY/i.test(string))"),'XML external entities must be blocked');
assert.ok(source.includes("Numero_Originale")&&source.includes("XML_SHA256"),'Stable original number and SHA fields required');
assert.ok(source.includes("count:'exact'")&&source.includes("res.count>READ_LIMIT"),'Duplicate read must fail closed on incomplete datasets');
assert.ok(source.includes("PAGATA:'NO'"),'Payment instructions do not imply paid');
assert.ok(source.includes("if(projectId)data.ID_PROGETTO=Number(projectId)"),'Projects are only assigned explicitly');
assert.ok(source.includes("if(!window.confirm("),'Final user confirmation required');
assert.ok(source.includes("item.kind!=='ok'"),'Conflicts and duplicates must be skipped');
assert.ok(source.includes("state.busy=true"),'Guard repeated UI actions');
assert.doesNotMatch(source,/new\s+MutationObserver/,'Importer must not create MutationObservers');
assert.match(sw,/kyv-aruba-import\.js/,'PWA cache must contain importer');
assert.equal(api.normalizedNumber('FPR 14/26'),14);
assert.equal(api.normalizedNumber('FPR 01/27'),1);
assert.equal(api.normalizedNumber('FATTURA ABC'),null);

function node(name, value='', children=[]){
  return {localName:name,children,textContent:String(value),getElementsByTagName(match){
    const collected=[];function visit(n){for(const c of n.children){if(match==='*'||c.localName===match)collected.push(c);visit(c);}}visit(this);return collected;
  }};
}
const x=node;
const buyer=x('CessionarioCommittente','',[
  x('DatiAnagrafici','',[x('IdFiscaleIVA','',[x('IdCodice','12345678901')]),x('Anagrafica','',[x('Denominazione','Cliente Test SRL')])])
]);
const seller=x('CedentePrestatore','',[
  x('DatiAnagrafici','',[x('IdFiscaleIVA','',[x('IdCodice','98765432109')]),x('Anagrafica','',[x('Denominazione','Produttore Test')])])
]);
const hdr=x('FatturaElettronicaHeader','',[seller,buyer,x('DatiTrasmissione','',[x('ProgressivoInvio','14'),x('CodiceDestinatario','M5UXCR1')])]);
const docInfo=x('DatiGeneraliDocumento','',[
  x('TipoDocumento','TD01'),x('Numero','FPR 14/26'),x('Data','2026-10-26'),x('ImportoTotaleDocumento','1068.41')
]);
const line=(num,descr,value)=>x('DettaglioLinee','',[x('NumeroLinea',num),x('Descrizione',descr),x('PrezzoUnitario',value),x('PrezzoTotale',value)]);
const body=x('FatturaElettronicaBody','',[
  x('DatiGenerali','',[docInfo]),
  x('DatiBeniServizi','',[line('1','Royalties 2025','1066.41'),line('2','Bollo virtuale','2.00')]),
  x('DatiPagamento','',[x('DettaglioPagamento','',[x('ImportoPagamento','1068.41')])])
]);
const root=x('FatturaElettronica','',[hdr,body]);
const parsed=api.parseInvoiceDocument({documentElement:root,getElementsByTagName:root.getElementsByTagName.bind(root)});
assert.equal(parsed.Numero_Originale,'FPR 14/26');
assert.equal(parsed.Numero,14);assert.equal(parsed.Data,'2026-10-26');
assert.equal(parsed.ImportoTotaleDocumento,'1068.41');
assert.equal(parsed.Denominazione,'Cliente Test SRL');
assert.equal(parsed.PrezzoUnitario,'1066.41');
assert.equal(parsed.PrezzoTotale,'1068.41');
assert.equal(parsed.PAGATA,'NO');
assert.equal(parsed.IdCodice5,'12345678901');
assert.equal(api.payload({...parsed,XML_SHA256:'a'.repeat(64)},'19').ID_PROGETTO,19);
assert.ok(!Object.hasOwn(api.payload(parsed,''),'ID_PROGETTO'),'Unselected project must remain unassigned');
assert.throws(()=>api.parseInvoiceDocument({documentElement:x('Invalid'),getElementsByTagName:()=>[]}),/non valido/);

const incoming={...parsed,XML_SHA256:'a'.repeat(64)};
const hist={ID_FT:101,Numero:14,Data:'2026-10-26',TipoDocumento:'TD01',
  Denominazione:'Cliente Test SRL',IdCodice5:'12345678901',ImportoTotaleDocumento:'1068,41'};
const check=(row,db)=>api.classify(row,db).kind;
assert.equal(check(incoming,[]),'ok','New invoice');
assert.equal(check(incoming,[{...hist,XML_SHA256:'a'.repeat(64)}]),'duplicate','Same XML hash');
assert.equal(check(incoming,[hist]),'duplicate','Same historic number/year/customer/amount');
assert.equal(check(incoming,[{...hist,Denominazione:'Altra Azienda',IdCodice5:'00000000000'}]),'review','Same historic number/year conflicting client');
assert.equal(check(incoming,[{...hist,Data:'2025-10-26'}]),'ok','Same number different years allowed');
assert.equal(check(incoming,[{...hist,Numero_Originale:'FPR 14/26',ImportoTotaleDocumento:'999.00'}]),'review','Same original number with divergent amount');
assert.equal(check(incoming,[{...hist,Numero_Originale:'FPR 14/26'}]),'duplicate','Same original number and details');
assert.equal(check({...incoming,TipoDocumento:'TD04'},[{...hist,Numero_Originale:'FPR 14/26'}]),'review','Historic number conflict must still be reviewed');

console.log('OK: Aruba XML parsing, invoice mapping, SHA256, deduplication and manual linking safeguards');
