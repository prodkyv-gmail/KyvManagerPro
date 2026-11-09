# v2.85 · Fatture condivise tra più progetti (da ripartire a mano)

Rilevate il 2026-11-09 sul database (sola lettura). Sono fatture citate da più progetti col vecchio campo `PROGETTI.IDFT`, senza righe in `FATTURE_RIPARTIZIONI`.
Le quote non si possono dedurre dalle fee: le somme non coincidono quasi mai con l'importo della fattura, quindi **nessuna migrazione automatica**. Ogni fattura si ripartisce da *Fatture → Ripartisci* (il popup parte già dai progetti elencati, con la fee come riferimento).

| Fattura (ID_FT) | Importo riga | Progetto titolare | Progetti che la citano (IDFT) | Somma fee | Differenza |
|---|---:|---:|---|---:|---:|
| 3 | 1.275,00 | 13 | 12, 13 | 100,00 | 1.175,00 |
| 18 | 1.875,00 | 15 | 15, 20 | 1.250,00 | 625,00 |
| 20 | 2.250,00 | 155 | 155, 156 | 2.200,00 | 50,00 |
| 57 | 4.480,00 | 77 | 57, 75, 76, 77 | 5.600,00 | −1.120,00 |
| 61 | 6.400,00 | 39 | 38, 39, 40, 41, 42 | 5.330,00 | 1.070,00 |
| 66 | 1.600,00 | 44 | 44, 69, 70 | 0,00 | 1.600,00 |
| 74 | 1.920,00 | 48 | 47, 48 | 3.840,00 | −1.920,00 |
| 82 | 3.600,00 | 82 | 52, 53, 54 | 0,00 | 3.600,00 |
| 97 | 8.000,00 | 68 | 68, 129 | 8.000,00 | 0,00 |

Da controllare a mano: i progetti 8 e 46 citano le fatture 86 e 45, intestate ai progetti 86 e 18 (possibile scambio tra `ID_FT` e `ID_PROGETTO`).

Non toccato in questa versione: importi salvati come testo con formati misti (virgola/punto), `Numero_Originale` vuoto, fatture senza alcun collegamento (42 righe).
