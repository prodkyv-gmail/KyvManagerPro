// kyv-core.js - Utility condivise per KYV Studio Manager Pro
// Modulo vanilla JS pensato per progetto statico su Vercel.
(function () {
    const euroFormatter = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
    const dateFormatter = new Intl.DateTimeFormat('it-IT');

    function parseNumber(value) {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
        let raw = String(value)
            .trim()
            .replace(/€/g, '')
            .replace(/\s/g, '')
            .replace(/[^0-9,.-]/g, '');
        if (!raw) return 0;
        const lastComma = raw.lastIndexOf(',');
        const lastDot = raw.lastIndexOf('.');
        if (lastComma > lastDot) raw = raw.replace(/\./g, '').replace(',', '.');
        else if (lastDot > lastComma && lastComma !== -1) raw = raw.replace(/,/g, '');
        else if ((raw.match(/,/g) || []).length === 1 && lastComma !== -1) raw = raw.replace(',', '.');
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function toDbNumber(value) {
        const parsed = parseNumber(value);
        return Number.isFinite(parsed) ? String(parsed) : null;
    }

    function formatEuro(value) { return euroFormatter.format(parseNumber(value)); }

    function formatDate(value, fallback = '-') {
        if (!value) return fallback;
        const d = value instanceof Date ? value : new Date(value);
        return Number.isNaN(d.getTime()) ? fallback : dateFormatter.format(d);
    }

    function toDbDate(value) {
        if (!value) return null;
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
        let raw = String(value).trim();
        if (!raw) return null;
        // Excel serial date, indicativo per file importati con raw true/false misto
        if (/^\d{5}$/.test(raw)) {
            const base = new Date(Date.UTC(1899, 11, 30));
            base.setUTCDate(base.getUTCDate() + Number(raw));
            return base.toISOString().slice(0, 10);
        }
        let m = raw.match(/^(\d{1,2})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{2,4})$/);
        if (m) {
            const year = m[3].length === 2 ? `20${m[3]}` : m[3];
            return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        }
        m = raw.match(/^(\d{4})[\/\-\.\s](\d{1,2})[\/\-\.\s](\d{1,2})/);
        if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
    }

    function safeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function normalize(value) {
        return String(value ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '');
    }

    function isPaid(value) {
        const v = normalize(value);
        return ['si', 'yes', 'pagata', 'pagato', 'paid', 'true', '1'].includes(v);
    }

    function pickField(row, names, fallback = '') {
        if (!row) return fallback;
        for (const name of names) {
            if (Object.prototype.hasOwnProperty.call(row, name) && row[name] !== null && row[name] !== undefined && row[name] !== '') return row[name];
        }
        return fallback;
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function createSupabaseClient() {
        if (window.KYV_SUPABASE_CLIENT) return window.KYV_SUPABASE_CLIENT;
        if (!window.supabase) throw new Error('Supabase JS non è stato caricato.');
        const cfg = window.KYV_CONFIG || {};
        if (!cfg.SUPABASE_URL || !cfg.SUPABASE_KEY) throw new Error('KYV_CONFIG mancante: controlla config.js.');
        window.KYV_SUPABASE_CLIENT = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
            auth: { storageKey: 'kyv-manager-auth-token' }
        });
        return window.KYV_SUPABASE_CLIENT;
    }

    function showToast(message, type = 'info') {
        const existing = document.getElementById('kyv-global-toast');
        if (existing) existing.remove();
        const palette = {
            info: 'border-indigo-500/30 text-indigo-100 bg-indigo-950/90',
            success: 'border-emerald-500/30 text-emerald-100 bg-emerald-950/90',
            warning: 'border-amber-500/30 text-amber-100 bg-amber-950/90',
            error: 'border-rose-500/30 text-rose-100 bg-rose-950/90'
        };
        const toast = document.createElement('div');
        toast.id = 'kyv-global-toast';
        toast.className = `fixed bottom-5 right-5 z-[9999] max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${palette[type] || palette.info}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3600);
    }

    function downloadTextFile(filename, text, mime = 'text/plain;charset=utf-8') {
        const blob = new Blob([text], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    window.KYV = { parseNumber, parseKyvNumber: parseNumber, toDbNumber, formatEuro, formatDate, toDbDate, safeHtml, normalize, isPaid, pickField, setText, createSupabaseClient, showToast, downloadTextFile };
})();
