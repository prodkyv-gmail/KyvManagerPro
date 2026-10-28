// kyv-data-quality.js - Regole pure per audit e correzione assistita dei dati.
(function(root, factory){
    const api = factory();
    if(typeof module === 'object' && module.exports) module.exports = api;
    if(root) root.KYV_DATA_QUALITY = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){
    const text = value => String(value ?? '').trim();
    const has = value => text(value) !== '';
    const normalize = value => text(value)
        .toLocaleLowerCase('it')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    function projectLabel(project){
        return [text(project?.ARTISTA), text(project?.TITOLO)].filter(Boolean).join(' — ') || `Progetto #${text(project?.ID) || '?'}`;
    }

    function audit(input = {}){
        const projects = Array.isArray(input.projects) ? input.projects : [];
        const audioVersions = Array.isArray(input.audioVersions) ? input.audioVersions : [];
        const dropboxAudio = Array.isArray(input.dropboxAudio) ? input.dropboxAudio : [];
        const documents = Array.isArray(input.documents) ? input.documents : [];
        const invoices = Array.isArray(input.invoices) ? input.invoices : [];
        const sends = Array.isArray(input.sends) ? input.sends : [];
        const projectById = new Map(projects.map(project => [text(project.ID), project]));
        const invoiceById = new Map(invoices.map(invoice => [text(invoice.ID_FT), invoice]));
        const projectFor = id => projectById.get(text(id));

        const missingTitles = projects.filter(project => !has(project.TITOLO)).map(project => ({
            id: text(project.ID),
            projectId: text(project.ID),
            title: projectLabel(project),
            detail: 'Titolo del progetto non compilato.',
            editTable: 'PROGETTI',
            editId: text(project.ID),
            editField: 'TITOLO'
        }));

        const missingArtists = projects.filter(project => !has(project.ARTISTA)).map(project => ({
            id: text(project.ID),
            projectId: text(project.ID),
            title: projectLabel(project),
            detail: has(project.Nome_Vero_Artista)
                ? `Artista mancante; nome anagrafico presente: ${text(project.Nome_Vero_Artista)}.`
                : 'Artista del progetto non compilato.',
            editTable: 'PROGETTI',
            editId: text(project.ID),
            editField: 'ARTISTA'
        }));

        const duplicateMap = new Map();
        projects.forEach(project => {
            const title = normalize(project.TITOLO);
            const artist = normalize(project.ARTISTA);
            if(!title || !artist) return;
            const key = `${title}::${artist}`;
            if(!duplicateMap.has(key)) duplicateMap.set(key, []);
            duplicateMap.get(key).push(project);
        });
        const duplicates = [...duplicateMap.values()]
            .filter(group => group.length > 1)
            .map(group => ({
                id: group.map(project => text(project.ID)).join('-'),
                projectId: text(group[0].ID),
                projectIds: group.map(project => text(project.ID)),
                title: projectLabel(group[0]),
                detail: `Possibile duplicato: progetti ${group.map(project => `#${text(project.ID)}`).join(', ')}.`,
                action: 'compare-projects'
            }));

        const versionIssues = audioVersions.filter(row => !has(row.CONTENT_HASH)).map(row => {
            const project = projectFor(row.ID_PROGETTO);
            return {
                id: `version-${text(row.ID_VERSIONE)}`,
                projectId: text(row.ID_PROGETTO),
                title: text(row.NOME_FILE) || text(row.TITOLO) || `Versione #${text(row.ID_VERSIONE)}`,
                detail: `${project ? projectLabel(project) : `Progetto #${text(row.ID_PROGETTO) || '?'}`} · hash SHA-256 mancante.`,
                source: 'AUDIO_VERSIONI',
                editTable: 'AUDIO_VERSIONI',
                editId: text(row.ID_VERSIONE),
                editField: 'CONTENT_HASH'
            };
        });
        const dropboxIssues = dropboxAudio.filter(row => !has(row.Hash_SHA256)).map(row => {
            const project = projectFor(row.ID_PROGETTO);
            return {
                id: `dropbox-${text(row.ID_FILE)}`,
                projectId: text(row.ID_PROGETTO),
                title: text(row.Nome_File) || text(row.Titolo) || `Audio #${text(row.ID_FILE)}`,
                detail: `${project ? projectLabel(project) : `Progetto #${text(row.ID_PROGETTO) || '?'}`} · hash SHA-256 mancante.`,
                source: 'DROPBOX_AUDIO_FILES',
                editTable: 'DROPBOX_AUDIO_FILES',
                editId: text(row.ID_FILE),
                editField: 'Hash_SHA256'
            };
        });

        const documentsWithoutLink = documents.filter(row => !has(row.Link_Drive)).map(row => {
            const project = projectFor(row.ID_PROGETTO);
            return {
                id: `document-${text(row.ID_DOCUMENTO)}`,
                projectId: text(row.ID_PROGETTO),
                title: text(row.Titolo_Documento) || text(row.Tipo_Documento) || `Documento #${text(row.ID_DOCUMENTO)}`,
                detail: `${project ? projectLabel(project) : `Progetto #${text(row.ID_PROGETTO) || '?'}`} · link non presente; verificare se il record è una nota interna.`,
                source: 'DOCUMENTI_PROGETTO',
                editTable: 'DOCUMENTI_PROGETTO',
                editId: text(row.ID_DOCUMENTO),
                editField: 'Link_Drive'
            };
        });


        const isPaid = value => /^(si|sì|yes|true|1|pagata|pagato|incassato|60gg pagata)$/i.test(text(value));
        const orphanInvoices = invoices
            .filter(row => has(row.ID_PROGETTO) && !projectFor(row.ID_PROGETTO))
            .map(row => ({
                id: `invoice-${text(row.ID_FT)}`,
                title: `Fattura ${text(row.Numero) || '#'+text(row.ID_FT)} · ${text(row.Denominazione) || 'senza denominazione'}`,
                detail: `ID_PROGETTO ${text(row.ID_PROGETTO)} non corrisponde a un progetto esistente.`,
                source:'FATTURE',
                editTable:'FATTURE',
                editId:text(row.ID_FT),
                editField:'ID_PROGETTO'
            }));

        const orphanProjectInvoices = projects
            .filter(row => has(row.IDFT) && !invoiceById.has(text(row.IDFT)))
            .map(row => ({
                id:`project-invoice-${text(row.ID)}`,
                projectId:text(row.ID),
                title:projectLabel(row),
                detail:`IDFT ${text(row.IDFT)} non corrisponde a una fattura esistente.`,
                source:'PROGETTI',
                editTable:'PROGETTI',
                editId:text(row.ID),
                editField:'IDFT'
            }));

        const orphanSends = sends
            .filter(row => has(row.ID_PROGETTO) && !projectFor(row.ID_PROGETTO))
            .map(row => ({
                id:`send-${text(row.ID_INVIO)}`,
                title:text(row.Destinatario) || `Invio #${text(row.ID_INVIO)}`,
                detail:`ID_PROGETTO ${text(row.ID_PROGETTO)} non corrisponde a un progetto esistente.`,
                source:'INVII_AUDIO',
                editTable:'INVII_AUDIO',
                editId:text(row.ID_INVIO),
                editField:'ID_PROGETTO'
            }));

        const invalidHashes = [
            ...audioVersions.filter(row => has(row.CONTENT_HASH) && !/^[a-f0-9]{64}$/i.test(text(row.CONTENT_HASH))).map(row => ({
                id:`version-invalid-${text(row.ID_VERSIONE)}`, projectId:text(row.ID_PROGETTO),
                title:text(row.NOME_FILE)||text(row.TITOLO)||`Versione #${text(row.ID_VERSIONE)}`,
                detail:'Hash presente ma non conforme a SHA-256 (64 caratteri esadecimali).',
                source:'AUDIO_VERSIONI', editTable:'AUDIO_VERSIONI', editId:text(row.ID_VERSIONE), editField:'CONTENT_HASH'
            })),
            ...dropboxAudio.filter(row => has(row.Hash_SHA256) && !/^[a-f0-9]{64}$/i.test(text(row.Hash_SHA256))).map(row => ({
                id:`dropbox-invalid-${text(row.ID_FILE)}`, projectId:text(row.ID_PROGETTO),
                title:text(row.Nome_File)||text(row.Titolo)||`Audio #${text(row.ID_FILE)}`,
                detail:'Hash presente ma non conforme a SHA-256 (64 caratteri esadecimali).',
                source:'DROPBOX_AUDIO_FILES', editTable:'DROPBOX_AUDIO_FILES', editId:text(row.ID_FILE), editField:'Hash_SHA256'
            }))
        ];

        const paidMismatches = invoices
            .filter(invoice => isPaid(invoice.PAGATA) && has(invoice.ID_PROGETTO))
            .map(invoice => ({invoice, project:projectFor(invoice.ID_PROGETTO)}))
            .filter(pair => pair.project && !isPaid(pair.project.PAGAMENTO))
            .map(({invoice,project}) => ({
                id:`paid-mismatch-${text(invoice.ID_FT)}`,
                projectId:text(project.ID),
                title:`${projectLabel(project)} · fattura ${text(invoice.Numero)||'#'+text(invoice.ID_FT)}`,
                detail:`La fattura risulta pagata (${text(invoice.PAGATA)}), mentre PAGAMENTO progetto è “${text(project.PAGAMENTO)||'vuoto'}”. Verifica senza sincronizzazione automatica.`,
                source:'FATTURE ↔ PROGETTI'
            }));

        const groups = [
            { key:'missing-title', label:'Titoli mancanti', severity:'high', description:'Progetti che non hanno un titolo utilizzabile.', items:missingTitles },
            { key:'missing-artist', label:'Artisti mancanti', severity:'medium', description:'Progetti senza artista principale.', items:missingArtists },
            { key:'duplicate-project', label:'Possibili duplicati', severity:'high', description:'Stessa coppia titolo + artista dopo la normalizzazione. Nessuna fusione viene eseguita automaticamente.', items:duplicates },
            { key:'missing-audio-hash', label:'Audio senza hash', severity:'medium', description:'Versioni audio senza impronta SHA-256. La pagina apre il record, ma non inventa né calcola hash.', items:[...versionIssues, ...dropboxIssues] },
            { key:'missing-document-link', label:'Documenti senza link', severity:'low', description:'Documenti senza URL: possono essere anomalie oppure note interne legittime.', items:documentsWithoutLink },
            { key:'orphan-relations', label:'Relazioni orfane', severity:'high', description:'Collegamenti verso Progetti o Fatture che non esistono più. Nessuna relazione viene corretta automaticamente.', items:[...orphanInvoices,...orphanProjectInvoices,...orphanSends] },
            { key:'invalid-audio-hash', label:'Hash non validi', severity:'high', description:'Hash compilati ma non conformi al formato SHA-256.', items:invalidHashes },
            { key:'payment-mismatch', label:'Pagamento incoerente', severity:'medium', description:'Fatture segnate pagate col progetto non coerentemente marcato come incassato. Solo verifica, nessuna sincronizzazione automatica.', items:paidMismatches }
        ];

        return {
            groups,
            totalIssues: groups.reduce((sum, group) => sum + group.items.length, 0),
            stats: {
                projects: projects.length,
                audio: audioVersions.length + dropboxAudio.length,
                documents: documents.length,
                invoices: invoices.length,
                sends: sends.length,
                relationIssues: orphanInvoices.length + orphanProjectInvoices.length + orphanSends.length,
                paymentIssues: paidMismatches.length,
                duplicateGroups: duplicates.length
            }
        };
    }

    return { audit, has, normalize, projectLabel };
});
