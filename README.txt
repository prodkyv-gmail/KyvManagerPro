KYV Manager Pro — Calendar fix 2026-10-07

Sostituisci nel repository i file mantenendo esattamente questi percorsi:

1. config.js
2. kyv_calendar.html
3. kyv-drive-bridge.js
4. sw.js
5. api/drive-proxy.js

Correzioni incluse:
- nuovo Google Apps Script Calendar: https://script.google.com/macros/s/AKfycbxJAwkYrKZk-qVkyvHEfc3T53LpS4rQMSAjJAvRHklnBmzXx5x-D2EWsbVXsNnnYL7Xrg/exec
- allowlist aggiornata nel proxy Vercel
- errori proxy mostrati direttamente, senza essere nascosti da timeout JSONP in produzione
- Agenda responsive: pannelli impilati su tablet/notebook e due colonne solo su schermi molto larghi
- Data/Ora sempre verticali nel pannello Pianifica attività
- nessuna sincronizzazione automatica all'apertura
- massimo 120 eventi renderizzati per ciclo
- /api escluso dalla cache PWA
- JS/CSS/JSON network-first
- nuova cache PWA v2.32
- rimosso dal service worker l'inserimento automatico di kyv-calendar-safety.js

Dopo il commit e il deploy Vercel:
1. chiudi completamente la PWA/scheda KYV
2. riaprila
3. vai in Agenda
4. premi Sincronizza Ora

Se il Calendar restituisce ancora un errore, ora il messaggio dovrebbe mostrare il problema reale del proxy/Apps Script.
