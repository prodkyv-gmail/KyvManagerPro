// kyv-link-viewer.js - Anteprima popup per campi LINK e invio audio alla Stazione Ascolto
// v2.11.10
(function () {
    const URL_RE = /https?:\/\/[^\s<>'"`]+/i;
    const AUDIO_EXT = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'oga', 'aif', 'aiff', 'opus'];
    const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
    const PDF_EXT = ['pdf'];
    const SHEET_EXT = ['xls', 'xlsx', 'xlsm', 'csv', 'ods', 'numbers'];
    const DOC_EXT = ['doc', 'docx', 'odt', 'rtf', 'txt', 'ppt', 'pptx', 'odp', 'pages'];

    function cleanUrl(value) {
        return String(value || '')
            .trim()
            .replace(/[),.;\]]+$/g, '')
            .replace(/^['"`]+|['"`]+$/g, '');
    }

    function extractFirstUrl(value) {
        const m = String(value || '').match(URL_RE);
        return m ? cleanUrl(m[0]) : '';
    }

    function extensionFromUrl(url) {
        try {
            const parsed = new URL(url);
            const last = decodeURIComponent(parsed.pathname.split('/').pop() || '').toLowerCase();
            const clean = last.split('?')[0].split('#')[0];
            const m = clean.match(/\.([a-z0-9]{2,5})$/i);
            return m ? m[1].toLowerCase() : '';
        } catch (err) {
            const clean = String(url || '').split('?')[0].split('#')[0].toLowerCase();
            const m = clean.match(/\.([a-z0-9]{2,5})$/i);
            return m ? m[1].toLowerCase() : '';
        }
    }

    function normalizeDropbox(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname.includes('dropbox.com')) {
                parsed.searchParams.delete('dl');
                parsed.searchParams.set('raw', '1');
                return parsed.toString();
            }
        } catch (err) {}
        return url;
    }

    function extractDriveId(url) {
        const raw = String(url || '');
        let m = raw.match(/\/file\/d\/([^/]+)/);
        if (m) return m[1];
        m = raw.match(/\/d\/([^/]+)/);
        if (m) return m[1];
        m = raw.match(/[?&]id=([^&]+)/);
        if (m) return decodeURIComponent(m[1]);
        return '';
    }

    function isDriveUrl(url) {
        try { return new URL(url).hostname.includes('drive.google.com') || new URL(url).hostname.includes('docs.google.com'); }
        catch (err) { return false; }
    }

    function isAppsScriptUrl(url) {
        try {
            const parsed = new URL(url);
            return parsed.hostname === 'script.google.com' && parsed.pathname.includes('/macros/s/');
        } catch (err) { return false; }
    }

    function isAudioUrl(url, metaType) {
        const type = String(metaType || '').toLowerCase();
        if (type.startsWith('audio/')) return true;
        const ext = extensionFromUrl(url);
        if (AUDIO_EXT.includes(ext)) return true;
        return /\b(mp3|wav|m4a|flac|aiff?|aac|ogg|opus)\b/i.test(String(url || ''));
    }

    function detectType(url, metaType) {
        const type = String(metaType || '').toLowerCase();
        const ext = extensionFromUrl(url);
        if (isAudioUrl(url, metaType)) return 'audio';
        if (type.includes('pdf') || PDF_EXT.includes(ext)) return 'pdf';
        if (type.startsWith('image/') || IMAGE_EXT.includes(ext)) return 'image';
        if (type.includes('sheet') || type.includes('excel') || SHEET_EXT.includes(ext)) return 'sheet';
        if (type.includes('document') || type.includes('presentation') || DOC_EXT.includes(ext)) return 'document';
        if (isAppsScriptUrl(url)) return 'apps-script';
        if (isDriveUrl(url)) return 'drive';
        return 'link';
    }

    function buildDrivePreview(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname.includes('docs.google.com')) {
                const clean = parsed.toString().replace(/\/edit(\?.*)?$/i, '/preview').replace(/\/view(\?.*)?$/i, '/preview');
                return clean.includes('/preview') ? clean : clean.replace(/\?.*$/, '') + '/preview';
            }
            const id = extractDriveId(url);
            if (id) return `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
        } catch (err) {}
        return url;
    }

    function googleDocViewer(url) {
        return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
    }

    function viewerUrl(url, type) {
        const clean = normalizeDropbox(url);
        if (isDriveUrl(clean)) return buildDrivePreview(clean);
        if (type === 'sheet' || type === 'document') return googleDocViewer(clean);
        return clean;
    }

    function ensureModal() {
        let modal = document.getElementById('kyv-link-viewer-modal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'kyv-link-viewer-modal';
        modal.className = 'kyv-link-viewer hidden';
        modal.innerHTML = `
            <div class="kyv-link-viewer__backdrop" data-kyv-link-close="1"></div>
            <section class="kyv-link-viewer__panel" role="dialog" aria-modal="true" aria-labelledby="kyv-link-viewer-title">
                <header class="kyv-link-viewer__header">
                    <div class="min-w-0">
                        <p class="kyv-link-viewer__eyebrow">Anteprima LINK</p>
                        <h3 id="kyv-link-viewer-title" class="kyv-link-viewer__title">Documento</h3>
                    </div>
                    <div class="kyv-link-viewer__actions">
                        <button type="button" class="kyv-link-viewer__btn" id="kyv-link-copy">Copia link</button>
                        <a class="kyv-link-viewer__btn" id="kyv-link-external" target="_blank" rel="noopener noreferrer">Apri esterno</a>
                        <button type="button" class="kyv-link-viewer__btn kyv-link-viewer__btn--close" data-kyv-link-close="1">Chiudi</button>
                    </div>
                </header>
                <div id="kyv-link-viewer-body" class="kyv-link-viewer__body"></div>
            </section>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', (event) => {
            if (event.target.closest('[data-kyv-link-close]')) close();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') close();
        });
        return modal;
    }

    function close() {
        const modal = document.getElementById('kyv-link-viewer-modal');
        if (modal) modal.classList.add('hidden');
    }

    function openAudio(url, title) {
        const page = `ascolto.html?audio=${encodeURIComponent(normalizeDropbox(url))}&title=${encodeURIComponent(title || 'Audio da link')}`;
        const win = window.open(page, 'kyv_ascolto', 'popup=yes,width=1280,height=860,noopener,noreferrer');
        if (!win) window.location.href = page;
    }

    function open(url, options = {}) {
        const clean = extractFirstUrl(url) || cleanUrl(url);
        if (!clean) return false;
        const title = options.title || options.label || clean;
        const type = detectType(clean, options.mimeType || options.type);
        if (type === 'audio') {
            openAudio(clean, title);
            return true;
        }

        const modal = ensureModal();
        const body = modal.querySelector('#kyv-link-viewer-body');
        const titleEl = modal.querySelector('#kyv-link-viewer-title');
        const external = modal.querySelector('#kyv-link-external');
        const copyBtn = modal.querySelector('#kyv-link-copy');
        const src = viewerUrl(clean, type);

        titleEl.textContent = String(title || 'Documento').slice(0, 180);
        external.href = clean;
        copyBtn.onclick = () => navigator.clipboard?.writeText(clean).then(() => window.KYV?.showToast?.('Link copiato.', 'success')).catch(() => {});

        if (type === 'apps-script') {
            body.innerHTML = `
                <div class="p-6 text-sm leading-relaxed text-slate-200">
                    <p class="font-semibold text-amber-200 mb-3">Questo è un URL tecnico Apps Script, non un file Google Drive.</p>
                    <p>Non viene aperto in anteprima perché Google può mostrare una pagina tipo “Impossibile aprire il file”. Usalo come collegamento di configurazione Drive oppure aprilo esternamente per test/diagnosi.</p>
                    <p class="mt-4 break-all text-slate-300">${escapeHtml(clean)}</p>
                </div>`;
        } else if (type === 'image') {
            body.innerHTML = `<div class="kyv-link-viewer__image-wrap"><img src="${escapeAttr(src)}" alt="Anteprima immagine"></div>`;
        } else {
            body.innerHTML = `
                <iframe class="kyv-link-viewer__iframe" src="${escapeAttr(src)}" title="Anteprima documento" loading="lazy"></iframe>
                <div class="kyv-link-viewer__fallback">
                    Se l’anteprima non si carica, usa <b>Apri esterno</b>. Alcuni file Drive/Dropbox richiedono permessi o link pubblici.
                </div>`;
        }
        modal.classList.remove('hidden');
        return true;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }

    function isPreviewableUrl(url) {
        if (!/^https?:\/\//i.test(String(url || ''))) return false;
        return true;
    }

    window.KYV_LINK_VIEWER = {
        open,
        close,
        extractFirstUrl,
        isAudioUrl,
        detectType,
        isPreviewableUrl,
        isAppsScriptUrl,
        normalizeDropbox,
        extensionFromUrl
    };
})();
