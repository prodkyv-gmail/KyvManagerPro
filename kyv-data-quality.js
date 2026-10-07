// kyv-data-quality.js - Regole pure per l'audit dati in sola lettura.
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
        const projectById = new Map(projects.map(project => [text(project.ID), project]));
        const projectFor = id => projectById.get(text(id));

        const missingTitles = projects.filter(project => !has(project.TITOLO)).map(project => ({
            id: text(project.ID),
            projectId: text(project.ID),
            title: projectLabel(project),
            detail: 'Titolo del progetto non compilato.'
        }));

        const missingArtists = projects.filter(project => !has(project.ARTISTA)).map(project => ({
            id: text(project.ID),
            projectId: text(project.ID),
            title: projectLabel(project),
            detail: has(project.Nome_Vero_Artista)
                ? `Artista mancante; nome anagrafico presente: ${text(project.Nome_Vero_Artista)}.`
                : 'Artista del progetto non compilato.'
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
                detail: `Possibile duplicato: progetti ${group.map(project => `#${text(project.ID)}`).join(', ')}.`
            }));

        const versionIssues = audioVersions.filter(row => !has(row.CONTENT_HASH)).map(row => {
            const project = projectFor(row.ID_PROGETTO);
            return {
                id: `version-${text(row.ID_VERSIONE)}`,
                projectId: text(row.ID_PROGETTO),
                title: text(row.NOME_FILE) || text(row.TITOLO) || `Versione #${text(row.ID_VERSIONE)}`,
                detail: `${project ? projectLabel(project) : `Progetto #${text(row.ID_PROGETTO) || '?'}`} · hash SHA-256 mancante.`,
                source: 'AUDIO_VERSIONI'
            };
        });
        const dropboxIssues = dropboxAudio.filter(row => !has(row.Hash_SHA256)).map(row => {
            const project = projectFor(row.ID_PROGETTO);
            return {
                id: `dropbox-${text(row.ID_FILE)}`,
                projectId: text(row.ID_PROGETTO),
                title: text(row.Nome_File) || text(row.Titolo) || `Audio #${text(row.ID_FILE)}`,
                detail: `${project ? projectLabel(project) : `Progetto #${text(row.ID_PROGETTO) || '?'}`} · hash SHA-256 mancante.`,
                source: 'DROPBOX_AUDIO_FILES'
            };
        });

        const documentsWithoutLink = documents.filter(row => !has(row.Link_Drive)).map(row => {
            const project = projectFor(row.ID_PROGETTO);
            return {
                id: `document-${text(row.ID_DOCUMENTO)}`,
                projectId: text(row.ID_PROGETTO),
                title: text(row.Titolo_Documento) || text(row.Tipo_Documento) || `Documento #${text(row.ID_DOCUMENTO)}`,
                detail: `${project ? projectLabel(project) : `Progetto #${text(row.ID_PROGETTO) || '?'}`} · link non presente; verificare se il record è una nota interna.`,
                source: 'DOCUMENTI_PROGETTO'
            };
        });

        const groups = [
            { key:'missing-title', label:'Titoli mancanti', severity:'high', description:'Progetti che non hanno un titolo utilizzabile.', items:missingTitles },
            { key:'missing-artist', label:'Artisti mancanti', severity:'medium', description:'Progetti senza artista principale.', items:missingArtists },
            { key:'duplicate-project', label:'Possibili duplicati', severity:'high', description:'Stessa coppia titolo + artista dopo la normalizzazione.', items:duplicates },
            { key:'missing-audio-hash', label:'Audio senza hash', severity:'medium', description:'Versioni audio senza impronta SHA-256.', items:[...versionIssues, ...dropboxIssues] },
            { key:'missing-document-link', label:'Documenti senza link', severity:'low', description:'Documenti senza URL: possono essere anomalie oppure note interne legittime.', items:documentsWithoutLink }
        ];

        return {
            groups,
            totalIssues: groups.reduce((sum, group) => sum + group.items.length, 0),
            stats: {
                projects: projects.length,
                audio: audioVersions.length + dropboxAudio.length,
                documents: documents.length,
                duplicateGroups: duplicates.length
            }
        };
    }

    return { audit, has, normalize, projectLabel };
});
