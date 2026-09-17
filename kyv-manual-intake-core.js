/* KYV manual intake - pure helpers, no cloud scans or writes. */
(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.KYV_MANUAL_INTAKE = api;
})(typeof window !== 'undefined' ? window : null, function(){
  function norm(value){
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function parseLink(value){
    let url;
    try { url = new URL(String(value || '').trim()); } catch(e){ throw new Error('Incolla un collegamento HTTPS valido.'); }
    if(url.protocol !== 'https:' || url.username || url.password) throw new Error('Sono ammessi solo collegamenti HTTPS senza credenziali.');
    const host = url.hostname.toLowerCase();
    let provider = '', id = '';
    if(host === 'drive.google.com' || host === 'docs.google.com'){
      provider = 'drive';
      const file = url.pathname.match(/^\/file\/d\/([\w-]+)/i);
      const document = url.pathname.match(/^\/(?:document|spreadsheets|presentation)\/d\/([\w-]+)/i);
      id = (file || document || [])[1] || url.searchParams.get('id') || '';
      if(!/^[\w-]{10,}$/.test(id)) throw new Error('Usa un link diretto a un file Google Drive, non a una cartella.');
    }else if(host === 'dropbox.com' || host === 'www.dropbox.com' || host === 'dl.dropboxusercontent.com'){
      provider = 'dropbox';
      if(!/^\/(?:s|scl\/fi|scl\/fo)\//i.test(url.pathname)) throw new Error('Usa un link di condivisione a un file Dropbox.');
      if(/^\/scl\/fo\//i.test(url.pathname)) throw new Error('Seleziona un file Dropbox, non una cartella.');
      // Non inventare un ID Dropbox dai segmenti di una URL condivisa: il link è la chiave di confronto.
    }else throw new Error('Sono supportati soltanto link Google Drive e Dropbox.');
    url.hash = '';
    const canonical = provider === 'drive' ? `https://drive.google.com/file/d/${id}/view` : `https://www.dropbox.com${url.pathname.replace(/\/$/, '')}`;
    return {provider, providerId:id, link:url.toString(), canonical};
  }
  function fileIdentity(row){
    const provider = String(row.PROVIDER || row.source || '').toLowerCase();
    const id = String(row.PROVIDER_ID || row.providerId || '').trim();
    return provider && id ? `${provider}:${id}` : '';
  }
  function classify(item, rows, projects){
    const parsed = parseLink(item.link);
    const matching = (rows || []).find(row => {
      if(parsed.providerId && fileIdentity(row) === `${parsed.provider}:${parsed.providerId}`) return true;
      const oldLink = row.LINK_FILE || row.Link_Drive || row.Link_Dropbox || row.link || '';
      if(!oldLink) return false;
      try {
        const prior = parseLink(oldLink);
        return prior.provider === parsed.provider && prior.canonical === parsed.canonical;
      }catch(e){ return String(oldLink).trim() === parsed.link; }
    });
    if(matching) return {status:'existing',projectId:String(matching.ID_PROGETTO || matching.projectId || ''),reason:'Il file è già archiviato (stesso ID Drive o collegamento cloud).'};
    const title = norm(item.title || String(item.name || '').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/\b(?:demo|mix|master|rough|final|v\s*\d+)\b/ig, ' '));
    const artist = norm(item.artist);
    const candidates = (projects || []).filter(p => {
      const pTitle = norm(p.TITOLO);
      const pArtist = norm(p.ARTISTA);
      return title.length >= 3 && pTitle && (pTitle === title || (pTitle.length >= 6 && title.includes(pTitle)) || (title.length >= 6 && pTitle.includes(title))) && (!artist || !pArtist || pArtist === artist);
    });
    return {status:candidates.length ? 'review' : 'new', candidates:candidates.slice(0,8),reason:candidates.length ? 'Possibili progetti già presenti: conferma il collegamento.' : 'Non è stata trovata una corrispondenza certa.'};
  }
  return {norm,parseLink,classify};
});
