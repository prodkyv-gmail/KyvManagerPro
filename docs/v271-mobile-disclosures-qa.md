# KYVManagerPro v2.71 — QA mobile e pannelli Easy/Completa

1. Su Progetti mobile aprire il menu: stato aria-expanded=true, focus al primo collegamento e barra inferiore non selezionabile.
2. Tab e Shift+Tab al primo e ultimo elemento devono mantenere il focus nel menu.
3. Escape chiude menu e ripristina focus; anche il backdrop chiude. Rotazione a desktop chiude la sidebar mobile.
4. Barra inferiore: cinque voci, un solo set di link, Progetti con aria-current=page. Non creare una seconda barra se già presente quella comune.
5. In Easy aprire manualmente Registro fatture completo o Storico e grafici tecnici: dopo i refresh il pannello resta aperto.
6. Cambiare esplicitamente Completa/Easy: il pannello segue la modalità; aria-pressed indica sempre quella attiva.
7. Collaudare tastiera, touch e screen reader su 320–820 px e desktop, senza alterare dati.

Test: npm run check:mobile-disclosures-v271 e npm run check. Nessun deploy Vercel incluso.
