// Editor condiviso per record KYV — modifica sicura dei campi senza cambiare schema.
(function () {
    const DEFAULT_TABLES = {
        FATTURE: {
            pk: 'ID_FT',
            label: 'Fattura',
            fields: ['Numero', 'Data', 'Denominazione', 'Descrizione', 'PrezzoUnitario', 'PrezzoTotale', 'PAGATA', 'ID_PROGETTO', 'TIPO FT']
        },
        PROGETTI: {
            pk: 'ID',
            label: 'Progetto',
            fields: ['TITOLO', 'ARTISTA', 'STATO', 'SVILUPPO', 'FEE', 'ROY', 'PAGAMENTO', 'Data_Sessione', 'Data_Pubblicazione', 'Codice_ISRC', 'IDFT', 'NOTE']
        }
    };

    const excludedFields = new Set(['created_at', 'updated_at', '_RowNumber']);
    const numericFields = new Set(['PrezzoUnitario', 'PrezzoTotale', 'ImportoTotaleDocumento', 'ImportoPagamento', 'FEE', 'ROY', 'Importo']);
    const H = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));

    function humanLabel(key) {
        return String(key).replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    function ensureModal() {
        let modal = document.getElementById('kyv-record-editor-modal');
        if (modal) return modal;
        document.body.insertAdjacentHTML('beforeend', `
            <div id="kyv-record-editor-modal" class="fixed inset-0 hidden items-center justify-center bg-black/75 backdrop-blur-sm z-[95] p-3" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="kyv-record-editor-title">
                <div class="kyv-record-editor-shell bg-kyv-card border border-kyv-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
                    <div class="p-4 sm:p-5 border-b border-kyv-border flex justify-between items-start gap-3 bg-kyv-bg/50 shrink-0">
                        <div>
                            <p class="kyv-eyebrow">Editor campi</p>
                            <h3 id="kyv-record-editor-title" class="text-xl font-black text-white mt-1">Record</h3>
                            <p id="kyv-record-editor-subtitle" class="text-xs text-kyv-text mt-1">Compila solo i dati disponibili.</p>
                        </div>
                        <button type="button" data-kyv-record-close class="kyv-icon-action shrink-0" aria-label="Chiudi editor"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>
                    <form id="kyv-record-editor-form" class="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                        <div id="kyv-record-editor-fields" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
                        <div class="mt-6 pt-4 border-t border-kyv-border flex justify-end gap-2 sticky bottom-0 bg-[#171b25]/95 backdrop-blur-md">
                            <button type="button" data-kyv-record-close class="px-4 py-2 rounded-xl border border-kyv-border text-kyv-text hover:bg-kyv-border hover:text-white font-bold text-xs">Annulla</button>
                            <button id="kyv-record-editor-save" type="submit" class="kyv-primary-action"><i data-lucide="save" class="w-4 h-4 mr-2"></i>Salva</button>
                        </div>
                    </form>
                </div>
            </div>`);
        return document.getElementById('kyv-record-editor-modal');
    }

    function create(options) {
        const client = options?.client;
        if (!client) throw new Error('KYV Record Editor richiede il client dati.');
        const tables = { ...DEFAULT_TABLES, ...(options.tables || {}) };
        const modal = ensureModal();
        const form = modal.querySelector('#kyv-record-editor-form');
        const fieldsRoot = modal.querySelector('#kyv-record-editor-fields');
        const title = modal.querySelector('#kyv-record-editor-title');
        const subtitle = modal.querySelector('#kyv-record-editor-subtitle');
        const saveButton = modal.querySelector('#kyv-record-editor-save');
        let current = null;
        let projectOptions = [];

        function close() {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            modal.setAttribute('aria-hidden', 'true');
            current = null;
        }

        async function loadProjectOptions() {
            if (projectOptions.length) return projectOptions;
            const { data } = await client.from('PROGETTI').select('ID, TITOLO, ARTISTA').order('ID', { ascending: false }).limit(1000);
            projectOptions = data || [];
            return projectOptions;
        }

        function valueForInput(value) {
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        }

        async function renderField(key, value) {
            const raw = valueForInput(value);
            const safeValue = H(raw);
            const label = H(humanLabel(key));
            const lower = key.toLowerCase();
            const common = `data-key="${H(key)}" class="kyv-input dyn-record-input w-full"`;

            if (key === 'PAGATA' || key === 'PAGAMENTO') {
                return `<label class="block"><span class="kyv-record-label">${label}</span><select ${common}><option value="">Non indicato</option><option value="SI" ${raw.toUpperCase() === 'SI' ? 'selected' : ''}>Sì</option><option value="NO" ${raw.toUpperCase() === 'NO' ? 'selected' : ''}>No</option></select></label>`;
            }

            if (key === 'ID_PROGETTO') {
                await loadProjectOptions();
                const choices = projectOptions.map(project => {
                    const selected = String(project.ID) === raw ? 'selected' : '';
                    return `<option value="${H(project.ID)}" ${selected}>${H([project.TITOLO, project.ARTISTA].filter(Boolean).join(' · ') || `Progetto #${project.ID}`)}</option>`;
                }).join('');
                return `<label class="block"><span class="kyv-record-label">${label}</span><select ${common}><option value="">Nessun progetto collegato</option>${choices}</select></label>`;
            }

            if (lower.includes('descrizione') || lower.includes('note') || lower.includes('oggetto')) {
                return `<label class="block md:col-span-2"><span class="kyv-record-label">${label}</span><textarea ${common} rows="4">${safeValue}</textarea></label>`;
            }

            const isDate = lower.includes('data');
            const inputValue = isDate && raw ? raw.slice(0, 10) : raw;
            return `<label class="block"><span class="kyv-record-label">${label}</span><input ${common} type="${isDate ? 'date' : 'text'}" value="${H(inputValue)}" placeholder="Inserisci valore"></label>`;
        }

        async function open(tableName, rowId = null, openOptions = {}) {
            const config = tables[tableName];
            if (!config) throw new Error(`Tabella non configurata: ${tableName}`);
            const requestedFields = Array.isArray(openOptions.fields) ? openOptions.fields.filter(Boolean) : null;
            current = { tableName, rowId, config, requestedFields };
            title.textContent = openOptions.title || `${rowId === null || rowId === undefined ? 'Nuova' : 'Modifica'} ${config.label.toLowerCase()}`;
            subtitle.textContent = openOptions.subtitle || (rowId === null || rowId === undefined
                ? 'Inserisci i dati disponibili. I campi vuoti resteranno non compilati.'
                : requestedFields?.length === 1
                    ? 'Correggi soltanto il campo indicato e salva.'
                    : 'Aggiungi o correggi i valori senza uscire dalla pagina.');
            fieldsRoot.innerHTML = '<div class="md:col-span-2 lg:col-span-3 p-8 text-center text-kyv-text"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-300"></i>Caricamento campi…</div>';
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            modal.setAttribute('aria-hidden', 'false');
            if (window.lucide) lucide.createIcons({ root: modal });

            let row = {};
            if (rowId !== null && rowId !== undefined) {
                const { data, error } = await client.from(tableName).select('*').eq(config.pk, rowId).single();
                if (error) {
                    close();
                    throw error;
                }
                row = data || {};
            }

            const sourceKeys = requestedFields?.length
                ? requestedFields
                : (Object.keys(row).length ? Object.keys(row) : config.fields);
            const keys = sourceKeys.filter(key => key !== config.pk && !excludedFields.has(key));
            const markup = [];
            for (const key of keys) markup.push(await renderField(key, row[key]));
            fieldsRoot.innerHTML = markup.join('');

            if (window.KYV_PRIORITY) KYV_PRIORITY.bind(fieldsRoot);
            if (tableName === 'PROGETTI' && window.KYV_FIELD_MEMORY?.attachProjectDynamicInputs) {
                KYV_FIELD_MEMORY.attachProjectDynamicInputs(fieldsRoot);
            }
            if (window.lucide) lucide.createIcons({ root: modal });
            fieldsRoot.querySelector('input, select, textarea')?.focus();
        }

        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (!current) return;
            const payload = {};
            fieldsRoot.querySelectorAll('.dyn-record-input').forEach(input => {
                const key = input.dataset.key;
                const value = input.value.trim();
                if (!value) payload[key] = null;
                else if (numericFields.has(key)) payload[key] = window.KYV?.parseNumber ? KYV.parseNumber(value) : value;
                else if (/^ID_/.test(key) && /^\d+$/.test(value)) payload[key] = Number(value);
                else payload[key] = value;
            });

            saveButton.disabled = true;
            saveButton.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i>Salvataggio…';
            if (window.lucide) lucide.createIcons({ root: saveButton });
            try {
                const { error } = current.rowId === null || current.rowId === undefined
                    ? await client.from(current.tableName).insert([payload])
                    : await client.from(current.tableName).update(payload).eq(current.config.pk, current.rowId);
                if (error) throw error;
                const message = `${current.config.label} ${current.rowId === null || current.rowId === undefined ? 'inserita' : 'aggiornata'}.`;
                const savedTable = current.tableName;
                if (window.KYV_TOAST) KYV_TOAST.show(message, 'success');
                else if (window.KYV?.showToast) KYV.showToast(message, 'success');
                close();
                if (typeof options.onSaved === 'function') await options.onSaved(savedTable);
            } catch (error) {
                console.error(error);
                const message = `Salvataggio non riuscito: ${error.message || 'controlla i dati inseriti'}`;
                if (window.KYV_TOAST) KYV_TOAST.show(message, 'error');
                else if (window.KYV?.showToast) KYV.showToast(message, 'error');
            } finally {
                saveButton.disabled = false;
                saveButton.innerHTML = '<i data-lucide="save" class="w-4 h-4 mr-2"></i>Salva';
                if (window.lucide) lucide.createIcons({ root: saveButton });
            }
        });

        modal.querySelectorAll('[data-kyv-record-close]').forEach(button => button.addEventListener('click', close));
        modal.addEventListener('click', event => { if (event.target === modal) close(); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.classList.contains('hidden')) close(); });
        document.addEventListener('click', event => {
            const edit = event.target.closest('[data-kyv-edit-table]');
            const add = event.target.closest('[data-kyv-new-table]');
            const trigger = edit || add;
            if (!trigger) return;
            event.preventDefault();
            event.stopPropagation();
            const tableName = edit ? edit.dataset.kyvEditTable : add.dataset.kyvNewTable;
            const rowId = edit ? edit.dataset.kyvEditId : null;
            open(tableName, rowId).catch(error => {
                console.error(error);
                const message = 'Impossibile aprire il record.';
                if (window.KYV_TOAST) KYV_TOAST.show(message, 'error');
                else if (window.KYV?.showToast) KYV.showToast(message, 'error');
            });
        });

        return { open, close };
    }

    window.KYV_RECORD_EDITOR = { create };
})();
