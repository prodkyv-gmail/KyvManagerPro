// kyv-priority.js - Regole visive condivise per campi critici del progetto musicale
(function () {
    const critical = new Set(['TITOLO', 'ARTISTA', 'AUTORI', 'Contratto link', 'Data_Sessione']);
    const medium = new Set(['MANAGEMENT', 'Label', 'FEE', 'ROY', 'PAGAMENTO', 'Data_Consegna_Master', 'LINK', 'Data Contratto']);
    const rights = new Set(['Codice_ISRC', 'Ruolo_IMAIE_Kyv', 'Data_Pubblicazione', 'Produttore_Fonografico', 'Codice_IPI_Artista', 'Quota_Musica_Kyv', 'Quota_Musica_Artista', 'Quota_Testo_Artista', 'Strumenti_Suonati_Kyv']);

    function clean(value) { return String(value ?? '').trim(); }
    function levelFor(key) {
        if (critical.has(key)) return 'critical';
        if (rights.has(key)) return 'rights';
        if (medium.has(key)) return 'medium';
        return 'low';
    }
    function classFor(key, value) {
        if (clean(value)) return 'kyv-field-filled';
        const level = levelFor(key);
        if (level === 'critical') return 'kyv-field-empty-critical';
        if (level === 'rights') return 'kyv-field-empty-rights';
        if (level === 'medium') return 'kyv-field-empty-medium';
        return 'kyv-field-empty-low';
    }
    function labelClassFor(key, value) {
        if (clean(value)) return '';
        const level = levelFor(key);
        if (level === 'critical') return 'kyv-field-label-critical';
        if (level === 'medium' || level === 'rights') return 'kyv-field-label-medium';
        return '';
    }
    function explain(key) {
        const level = levelFor(key);
        if (level === 'critical') return 'Dato critico: se manca, il progetto resta scoperto o difficile da ritrovare.';
        if (level === 'rights') return 'Dato diritti/SIAE/IMAIE: compilarlo aiuta protezione, deposito e rendiconti.';
        if (level === 'medium') return 'Dato consigliato: utile per amministrazione, follow-up o archivio.';
        return 'Dato informativo.';
    }
    function applyToInput(input) {
        if (!input) return;
        const key = input.dataset.key || input.name || input.id || '';
        input.classList.remove('kyv-field-filled', 'kyv-field-empty-low', 'kyv-field-empty-medium', 'kyv-field-empty-critical', 'kyv-field-empty-rights');
        input.classList.add('kyv-priority-field', classFor(key, input.value));
        input.title = explain(key);
        const wrapper = input.closest('[data-field-wrapper]');
        if (wrapper) {
            const label = wrapper.querySelector('[data-field-label]');
            if (label) {
                label.classList.remove('kyv-field-label-critical', 'kyv-field-label-medium');
                const cls = labelClassFor(key, input.value);
                if (cls) label.classList.add(cls);
            }
        }
    }
    function bind(container = document) {
        container.querySelectorAll('[data-key], .kyv-priority-input').forEach(input => {
            applyToInput(input);
            input.addEventListener('input', () => applyToInput(input));
            input.addEventListener('change', () => applyToInput(input));
        });
    }
    window.KYV_PRIORITY = { levelFor, classFor, labelClassFor, explain, applyToInput, bind };
})();
