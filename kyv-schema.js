// kyv-schema.js - Schema Supabase generato dal markdown del database
(function () {
    const schemas = {
        "PROGETTI": [
                {
                        "id": "ID",
                        "label": "ID",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "FT",
                        "label": "FT",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Datafattura",
                        "label": "Datafattura",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "TITOLO",
                        "label": "TITOLO",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "AUTORI",
                        "label": "AUTORI",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "ARTISTA",
                        "label": "ARTISTA",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Data Contratto",
                        "label": "Data Contratto",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Label",
                        "label": "Label",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "FEE",
                        "label": "FEE",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "ROY",
                        "label": "ROY",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "MANAGEMENT",
                        "label": "MANAGEMENT",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "NOTE",
                        "label": "NOTE",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "STATO",
                        "label": "STATO",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "SVILUPPO",
                        "label": "SVILUPPO",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "IMPORTO",
                        "label": "IMPORTO",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "PAGAMENTO",
                        "label": "PAGAMENTO",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Contratto link",
                        "label": "Contratto link",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "LINK",
                        "label": "LINK",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "IDFT",
                        "label": "IDFT",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_Vero_Artista",
                        "label": "Nome_Vero_Artista",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota_Musica_Kyv",
                        "label": "Quota_Musica_Kyv",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota_Musica_Artista",
                        "label": "Quota_Musica_Artista",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota_Testo_Artista",
                        "label": "Quota_Testo_Artista",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Data_Sessione",
                        "label": "Data_Sessione",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Data_Consegna_Master",
                        "label": "Data_Consegna_Master",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Strumenti_Suonati_Kyv",
                        "label": "Strumenti_Suonati_Kyv",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice_ISRC",
                        "label": "Codice_ISRC",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Ruolo_IMAIE_Kyv",
                        "label": "Ruolo_IMAIE_Kyv",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Data_Pubblicazione",
                        "label": "Data_Pubblicazione",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Produttore_Fonografico",
                        "label": "Produttore_Fonografico",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Genera_Documenti",
                        "label": "Genera_Documenti",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Anticipo_Kill_Fee",
                        "label": "Anticipo_Kill_Fee",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice_IPI_Artista",
                        "label": "Codice_IPI_Artista",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Prossimo_Followup",
                        "label": "Prossimo_Followup",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Ultimo_Sollecito",
                        "label": "Ultimo_Sollecito",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Esito_Ascolto",
                        "label": "Esito_Ascolto",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Priorita_Followup",
                        "label": "Priorita_Followup",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Note_Followup",
                        "label": "Note_Followup",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "FATTURE": [
                {
                        "id": "ID_FT",
                        "label": "ID_FT",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "Numero",
                        "label": "Numero",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Data",
                        "label": "Data",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "ID_PROGETTO",
                        "label": "ID_PROGETTO",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "ProgressivoInvio",
                        "label": "ProgressivoInvio",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "CodiceDestinatario",
                        "label": "CodiceDestinatario",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome",
                        "label": "Cognome",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "IdCodice5",
                        "label": "IdCodice5",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "CodiceFiscale6",
                        "label": "CodiceFiscale6",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Denominazione",
                        "label": "Denominazione",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Indirizzo7",
                        "label": "Indirizzo7",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "NumeroCivico8",
                        "label": "NumeroCivico8",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "CAP9",
                        "label": "CAP9",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Comune10",
                        "label": "Comune10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Provincia11",
                        "label": "Provincia11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "TipoDocumento",
                        "label": "TipoDocumento",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "ImportoTotaleDocumento",
                        "label": "ImportoTotaleDocumento",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "NumeroLinea",
                        "label": "NumeroLinea",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Descrizione",
                        "label": "Descrizione",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "PrezzoUnitario",
                        "label": "PrezzoUnitario",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "PrezzoTotale",
                        "label": "PrezzoTotale",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "ImportoPagamento",
                        "label": "ImportoPagamento",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "PAGATA",
                        "label": "PAGATA",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "TIPO FT",
                        "label": "TIPO FT",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "Spese Extra": [
                {
                        "id": "ID_SPESE",
                        "label": "ID_SPESE",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "ID_PROGETTO",
                        "label": "ID_PROGETTO",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Data",
                        "label": "Data",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Descrizione",
                        "label": "Descrizione",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Categoria",
                        "label": "Categoria",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Importo",
                        "label": "Importo",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "EXPORT SIAE VERTICALE": [
                {
                        "id": "ID_SIAVERT",
                        "label": "ID_SIAVERT",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "Cod. Opera",
                        "label": "Cod. Opera",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice ISWC",
                        "label": "Codice ISWC",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Titolo",
                        "label": "Titolo",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE",
                        "label": "Posiz. SIAE",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI",
                        "label": "Codice IPI",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione",
                        "label": "Cognome / Denominazione",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome",
                        "label": "Nome",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica",
                        "label": "Qualifica",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag",
                        "label": "Tag",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM",
                        "label": "Quota DEM",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM",
                        "label": "Società DEM",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM",
                        "label": "Quota DRM",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM",
                        "label": "Società DRM",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "ESTRATTO SIAE": [
                {
                        "id": "ID_ECSIAE",
                        "label": "ID_ECSIAE",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "DATA",
                        "label": "DATA",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "OPERAZIONE",
                        "label": "OPERAZIONE",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "IMPORTO",
                        "label": "IMPORTO",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "EXPORT SIAE": [
                {
                        "id": "Cod. Opera",
                        "label": "Cod. Opera",
                        "type": "int8",
                        "primary": true,
                        "identity": false,
                        "nullable": false
                },
                {
                        "id": "Titolo",
                        "label": "Titolo",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice ISWC",
                        "label": "Codice ISWC",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE",
                        "label": "Posiz. SIAE",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI",
                        "label": "Codice IPI",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione",
                        "label": "Cognome / Denominazione",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome",
                        "label": "Nome",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica",
                        "label": "Qualifica",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag",
                        "label": "Tag",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM",
                        "label": "Quota DEM",
                        "type": "float8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM",
                        "label": "Società DEM",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM",
                        "label": "Quota DRM",
                        "type": "float8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM",
                        "label": "Società DRM",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_1",
                        "label": "Posiz. SIAE_1",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_1",
                        "label": "Codice IPI_1",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_1",
                        "label": "Cognome / Denominazione_1",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_1",
                        "label": "Nome_1",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_1",
                        "label": "Qualifica_1",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_1",
                        "label": "Tag_1",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_1",
                        "label": "Quota DEM_1",
                        "type": "float8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_1",
                        "label": "Società DEM_1",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_1",
                        "label": "Quota DRM_1",
                        "type": "float8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_1",
                        "label": "Società DRM_1",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_2",
                        "label": "Posiz. SIAE_2",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_2",
                        "label": "Codice IPI_2",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_2",
                        "label": "Cognome / Denominazione_2",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_2",
                        "label": "Nome_2",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_2",
                        "label": "Qualifica_2",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_2",
                        "label": "Tag_2",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_2",
                        "label": "Quota DEM_2",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_2",
                        "label": "Società DEM_2",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_2",
                        "label": "Quota DRM_2",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_2",
                        "label": "Società DRM_2",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_3",
                        "label": "Posiz. SIAE_3",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_3",
                        "label": "Codice IPI_3",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_3",
                        "label": "Cognome / Denominazione_3",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_3",
                        "label": "Nome_3",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_3",
                        "label": "Qualifica_3",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_3",
                        "label": "Tag_3",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_3",
                        "label": "Quota DEM_3",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_3",
                        "label": "Società DEM_3",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_3",
                        "label": "Quota DRM_3",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_3",
                        "label": "Società DRM_3",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_4",
                        "label": "Posiz. SIAE_4",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_4",
                        "label": "Codice IPI_4",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_4",
                        "label": "Cognome / Denominazione_4",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_4",
                        "label": "Nome_4",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_4",
                        "label": "Qualifica_4",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_4",
                        "label": "Tag_4",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_4",
                        "label": "Quota DEM_4",
                        "type": "float8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_4",
                        "label": "Società DEM_4",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_4",
                        "label": "Quota DRM_4",
                        "type": "float8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_4",
                        "label": "Società DRM_4",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_5",
                        "label": "Posiz. SIAE_5",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_5",
                        "label": "Codice IPI_5",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_5",
                        "label": "Cognome / Denominazione_5",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_5",
                        "label": "Nome_5",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_5",
                        "label": "Qualifica_5",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_5",
                        "label": "Tag_5",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_5",
                        "label": "Quota DEM_5",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_5",
                        "label": "Società DEM_5",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_5",
                        "label": "Quota DRM_5",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_5",
                        "label": "Società DRM_5",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_6",
                        "label": "Posiz. SIAE_6",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_6",
                        "label": "Codice IPI_6",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_6",
                        "label": "Cognome / Denominazione_6",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_6",
                        "label": "Nome_6",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_6",
                        "label": "Qualifica_6",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_6",
                        "label": "Tag_6",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_6",
                        "label": "Quota DEM_6",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_6",
                        "label": "Società DEM_6",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_6",
                        "label": "Quota DRM_6",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_6",
                        "label": "Società DRM_6",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_7",
                        "label": "Posiz. SIAE_7",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_7",
                        "label": "Codice IPI_7",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_7",
                        "label": "Cognome / Denominazione_7",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_7",
                        "label": "Nome_7",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_7",
                        "label": "Qualifica_7",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_7",
                        "label": "Tag_7",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_7",
                        "label": "Quota DEM_7",
                        "type": "float8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_7",
                        "label": "Società DEM_7",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_7",
                        "label": "Quota DRM_7",
                        "type": "float8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_7",
                        "label": "Società DRM_7",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_8",
                        "label": "Posiz. SIAE_8",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_8",
                        "label": "Codice IPI_8",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_8",
                        "label": "Cognome / Denominazione_8",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_8",
                        "label": "Nome_8",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_8",
                        "label": "Qualifica_8",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_8",
                        "label": "Tag_8",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_8",
                        "label": "Quota DEM_8",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_8",
                        "label": "Società DEM_8",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_8",
                        "label": "Quota DRM_8",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_8",
                        "label": "Società DRM_8",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_9",
                        "label": "Posiz. SIAE_9",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_9",
                        "label": "Codice IPI_9",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_9",
                        "label": "Cognome / Denominazione_9",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_9",
                        "label": "Nome_9",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_9",
                        "label": "Qualifica_9",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_9",
                        "label": "Tag_9",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_9",
                        "label": "Quota DEM_9",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_9",
                        "label": "Società DEM_9",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_9",
                        "label": "Quota DRM_9",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_9",
                        "label": "Società DRM_9",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_10",
                        "label": "Posiz. SIAE_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_10",
                        "label": "Codice IPI_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_10",
                        "label": "Cognome / Denominazione_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_10",
                        "label": "Nome_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_10",
                        "label": "Qualifica_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_10",
                        "label": "Tag_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_10",
                        "label": "Quota DEM_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_10",
                        "label": "Società DEM_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_10",
                        "label": "Quota DRM_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_10",
                        "label": "Società DRM_10",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_11",
                        "label": "Posiz. SIAE_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_11",
                        "label": "Codice IPI_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_11",
                        "label": "Cognome / Denominazione_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_11",
                        "label": "Nome_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_11",
                        "label": "Qualifica_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_11",
                        "label": "Tag_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_11",
                        "label": "Quota DEM_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_11",
                        "label": "Società DEM_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_11",
                        "label": "Quota DRM_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_11",
                        "label": "Società DRM_11",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_12",
                        "label": "Posiz. SIAE_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_12",
                        "label": "Codice IPI_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_12",
                        "label": "Cognome / Denominazione_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_12",
                        "label": "Nome_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_12",
                        "label": "Qualifica_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_12",
                        "label": "Tag_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_12",
                        "label": "Quota DEM_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_12",
                        "label": "Società DEM_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_12",
                        "label": "Quota DRM_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_12",
                        "label": "Società DRM_12",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_13",
                        "label": "Posiz. SIAE_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_13",
                        "label": "Codice IPI_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_13",
                        "label": "Cognome / Denominazione_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_13",
                        "label": "Nome_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_13",
                        "label": "Qualifica_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_13",
                        "label": "Tag_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_13",
                        "label": "Quota DEM_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_13",
                        "label": "Società DEM_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_13",
                        "label": "Quota DRM_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_13",
                        "label": "Società DRM_13",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_14",
                        "label": "Posiz. SIAE_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_14",
                        "label": "Codice IPI_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_14",
                        "label": "Cognome / Denominazione_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_14",
                        "label": "Nome_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_14",
                        "label": "Qualifica_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_14",
                        "label": "Tag_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_14",
                        "label": "Quota DEM_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_14",
                        "label": "Società DEM_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_14",
                        "label": "Quota DRM_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_14",
                        "label": "Società DRM_14",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_15",
                        "label": "Posiz. SIAE_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_15",
                        "label": "Codice IPI_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_15",
                        "label": "Cognome / Denominazione_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_15",
                        "label": "Nome_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_15",
                        "label": "Qualifica_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_15",
                        "label": "Tag_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_15",
                        "label": "Quota DEM_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_15",
                        "label": "Società DEM_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_15",
                        "label": "Quota DRM_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_15",
                        "label": "Società DRM_15",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_16",
                        "label": "Posiz. SIAE_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_16",
                        "label": "Codice IPI_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_16",
                        "label": "Cognome / Denominazione_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_16",
                        "label": "Nome_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_16",
                        "label": "Qualifica_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_16",
                        "label": "Tag_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_16",
                        "label": "Quota DEM_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_16",
                        "label": "Società DEM_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_16",
                        "label": "Quota DRM_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_16",
                        "label": "Società DRM_16",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_17",
                        "label": "Posiz. SIAE_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_17",
                        "label": "Codice IPI_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_17",
                        "label": "Cognome / Denominazione_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_17",
                        "label": "Nome_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_17",
                        "label": "Qualifica_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_17",
                        "label": "Tag_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_17",
                        "label": "Quota DEM_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_17",
                        "label": "Società DEM_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_17",
                        "label": "Quota DRM_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_17",
                        "label": "Società DRM_17",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_18",
                        "label": "Posiz. SIAE_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_18",
                        "label": "Codice IPI_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_18",
                        "label": "Cognome / Denominazione_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_18",
                        "label": "Nome_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_18",
                        "label": "Qualifica_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_18",
                        "label": "Tag_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_18",
                        "label": "Quota DEM_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_18",
                        "label": "Società DEM_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_18",
                        "label": "Quota DRM_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_18",
                        "label": "Società DRM_18",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_19",
                        "label": "Posiz. SIAE_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_19",
                        "label": "Codice IPI_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_19",
                        "label": "Cognome / Denominazione_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_19",
                        "label": "Nome_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_19",
                        "label": "Qualifica_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_19",
                        "label": "Tag_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_19",
                        "label": "Quota DEM_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_19",
                        "label": "Società DEM_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_19",
                        "label": "Quota DRM_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_19",
                        "label": "Società DRM_19",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_20",
                        "label": "Posiz. SIAE_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_20",
                        "label": "Codice IPI_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_20",
                        "label": "Cognome / Denominazione_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_20",
                        "label": "Nome_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_20",
                        "label": "Qualifica_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_20",
                        "label": "Tag_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_20",
                        "label": "Quota DEM_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_20",
                        "label": "Società DEM_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_20",
                        "label": "Quota DRM_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_20",
                        "label": "Società DRM_20",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_21",
                        "label": "Posiz. SIAE_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_21",
                        "label": "Codice IPI_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_21",
                        "label": "Cognome / Denominazione_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_21",
                        "label": "Nome_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_21",
                        "label": "Qualifica_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_21",
                        "label": "Tag_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_21",
                        "label": "Quota DEM_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_21",
                        "label": "Società DEM_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_21",
                        "label": "Quota DRM_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_21",
                        "label": "Società DRM_21",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_22",
                        "label": "Posiz. SIAE_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_22",
                        "label": "Codice IPI_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_22",
                        "label": "Cognome / Denominazione_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_22",
                        "label": "Nome_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_22",
                        "label": "Qualifica_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_22",
                        "label": "Tag_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_22",
                        "label": "Quota DEM_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_22",
                        "label": "Società DEM_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_22",
                        "label": "Quota DRM_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_22",
                        "label": "Società DRM_22",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_23",
                        "label": "Posiz. SIAE_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_23",
                        "label": "Codice IPI_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_23",
                        "label": "Cognome / Denominazione_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_23",
                        "label": "Nome_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_23",
                        "label": "Qualifica_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_23",
                        "label": "Tag_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_23",
                        "label": "Quota DEM_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_23",
                        "label": "Società DEM_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_23",
                        "label": "Quota DRM_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_23",
                        "label": "Società DRM_23",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_24",
                        "label": "Posiz. SIAE_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_24",
                        "label": "Codice IPI_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_24",
                        "label": "Cognome / Denominazione_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_24",
                        "label": "Nome_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_24",
                        "label": "Qualifica_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_24",
                        "label": "Tag_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_24",
                        "label": "Quota DEM_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_24",
                        "label": "Società DEM_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_24",
                        "label": "Quota DRM_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_24",
                        "label": "Società DRM_24",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_25",
                        "label": "Posiz. SIAE_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_25",
                        "label": "Codice IPI_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_25",
                        "label": "Cognome / Denominazione_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_25",
                        "label": "Nome_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_25",
                        "label": "Qualifica_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_25",
                        "label": "Tag_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_25",
                        "label": "Quota DEM_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_25",
                        "label": "Società DEM_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_25",
                        "label": "Quota DRM_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_25",
                        "label": "Società DRM_25",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_26",
                        "label": "Posiz. SIAE_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_26",
                        "label": "Codice IPI_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_26",
                        "label": "Cognome / Denominazione_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_26",
                        "label": "Nome_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_26",
                        "label": "Qualifica_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_26",
                        "label": "Tag_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_26",
                        "label": "Quota DEM_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_26",
                        "label": "Società DEM_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_26",
                        "label": "Quota DRM_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_26",
                        "label": "Società DRM_26",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_27",
                        "label": "Posiz. SIAE_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_27",
                        "label": "Codice IPI_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_27",
                        "label": "Cognome / Denominazione_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_27",
                        "label": "Nome_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_27",
                        "label": "Qualifica_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_27",
                        "label": "Tag_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_27",
                        "label": "Quota DEM_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_27",
                        "label": "Società DEM_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_27",
                        "label": "Quota DRM_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_27",
                        "label": "Società DRM_27",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_28",
                        "label": "Posiz. SIAE_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_28",
                        "label": "Codice IPI_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_28",
                        "label": "Cognome / Denominazione_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_28",
                        "label": "Nome_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_28",
                        "label": "Qualifica_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_28",
                        "label": "Tag_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_28",
                        "label": "Quota DEM_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_28",
                        "label": "Società DEM_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_28",
                        "label": "Quota DRM_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_28",
                        "label": "Società DRM_28",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_29",
                        "label": "Posiz. SIAE_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_29",
                        "label": "Codice IPI_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_29",
                        "label": "Cognome / Denominazione_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_29",
                        "label": "Nome_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_29",
                        "label": "Qualifica_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_29",
                        "label": "Tag_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_29",
                        "label": "Quota DEM_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_29",
                        "label": "Società DEM_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_29",
                        "label": "Quota DRM_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_29",
                        "label": "Società DRM_29",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_30",
                        "label": "Posiz. SIAE_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_30",
                        "label": "Codice IPI_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_30",
                        "label": "Cognome / Denominazione_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_30",
                        "label": "Nome_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_30",
                        "label": "Qualifica_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_30",
                        "label": "Tag_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_30",
                        "label": "Quota DEM_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_30",
                        "label": "Società DEM_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_30",
                        "label": "Quota DRM_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_30",
                        "label": "Società DRM_30",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_31",
                        "label": "Posiz. SIAE_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_31",
                        "label": "Codice IPI_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_31",
                        "label": "Cognome / Denominazione_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_31",
                        "label": "Nome_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_31",
                        "label": "Qualifica_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_31",
                        "label": "Tag_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_31",
                        "label": "Quota DEM_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_31",
                        "label": "Società DEM_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_31",
                        "label": "Quota DRM_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_31",
                        "label": "Società DRM_31",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_32",
                        "label": "Posiz. SIAE_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_32",
                        "label": "Codice IPI_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_32",
                        "label": "Cognome / Denominazione_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_32",
                        "label": "Nome_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_32",
                        "label": "Qualifica_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_32",
                        "label": "Tag_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_32",
                        "label": "Quota DEM_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_32",
                        "label": "Società DEM_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_32",
                        "label": "Quota DRM_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_32",
                        "label": "Società DRM_32",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_33",
                        "label": "Posiz. SIAE_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_33",
                        "label": "Codice IPI_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_33",
                        "label": "Cognome / Denominazione_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_33",
                        "label": "Nome_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_33",
                        "label": "Qualifica_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_33",
                        "label": "Tag_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_33",
                        "label": "Quota DEM_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_33",
                        "label": "Società DEM_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_33",
                        "label": "Quota DRM_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_33",
                        "label": "Società DRM_33",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_34",
                        "label": "Posiz. SIAE_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_34",
                        "label": "Codice IPI_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_34",
                        "label": "Cognome / Denominazione_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_34",
                        "label": "Nome_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_34",
                        "label": "Qualifica_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_34",
                        "label": "Tag_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_34",
                        "label": "Quota DEM_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_34",
                        "label": "Società DEM_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_34",
                        "label": "Quota DRM_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_34",
                        "label": "Società DRM_34",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_35",
                        "label": "Posiz. SIAE_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_35",
                        "label": "Codice IPI_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_35",
                        "label": "Cognome / Denominazione_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_35",
                        "label": "Nome_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_35",
                        "label": "Qualifica_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_35",
                        "label": "Tag_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_35",
                        "label": "Quota DEM_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_35",
                        "label": "Società DEM_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_35",
                        "label": "Quota DRM_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_35",
                        "label": "Società DRM_35",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_36",
                        "label": "Posiz. SIAE_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_36",
                        "label": "Codice IPI_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_36",
                        "label": "Cognome / Denominazione_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_36",
                        "label": "Nome_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_36",
                        "label": "Qualifica_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_36",
                        "label": "Tag_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_36",
                        "label": "Quota DEM_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_36",
                        "label": "Società DEM_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_36",
                        "label": "Quota DRM_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_36",
                        "label": "Società DRM_36",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_37",
                        "label": "Posiz. SIAE_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_37",
                        "label": "Codice IPI_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_37",
                        "label": "Cognome / Denominazione_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_37",
                        "label": "Nome_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_37",
                        "label": "Qualifica_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_37",
                        "label": "Tag_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_37",
                        "label": "Quota DEM_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_37",
                        "label": "Società DEM_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_37",
                        "label": "Quota DRM_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_37",
                        "label": "Società DRM_37",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_38",
                        "label": "Posiz. SIAE_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_38",
                        "label": "Codice IPI_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_38",
                        "label": "Cognome / Denominazione_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_38",
                        "label": "Nome_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_38",
                        "label": "Qualifica_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_38",
                        "label": "Tag_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_38",
                        "label": "Quota DEM_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_38",
                        "label": "Società DEM_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_38",
                        "label": "Quota DRM_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_38",
                        "label": "Società DRM_38",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Posiz. SIAE_39",
                        "label": "Posiz. SIAE_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice IPI_39",
                        "label": "Codice IPI_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Cognome / Denominazione_39",
                        "label": "Cognome / Denominazione_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Nome_39",
                        "label": "Nome_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Qualifica_39",
                        "label": "Qualifica_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Tag_39",
                        "label": "Tag_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DEM_39",
                        "label": "Quota DEM_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DEM_39",
                        "label": "Società DEM_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Quota DRM_39",
                        "label": "Quota DRM_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Società DRM_39",
                        "label": "Società DRM_39",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "PIANI_FISCALI": [
                {
                        "id": "id",
                        "label": "id",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "Anno",
                        "label": "Anno",
                        "type": "int8",
                        "primary": false,
                        "identity": false,
                        "nullable": false
                },
                {
                        "id": "Fatturato_Lordo",
                        "label": "Fatturato_Lordo",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Imponibile_Netto",
                        "label": "Imponibile_Netto",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "IRPEF_Dovuta",
                        "label": "IRPEF_Dovuta",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "INPS_Dovuta",
                        "label": "INPS_Dovuta",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "F24_IRPEF_Giugno",
                        "label": "F24_IRPEF_Giugno",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "F24_IRPEF_Novembre",
                        "label": "F24_IRPEF_Novembre",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "F24_INPS_Giugno",
                        "label": "F24_INPS_Giugno",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "F24_INPS_Novembre",
                        "label": "F24_INPS_Novembre",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Credito_IRPEF",
                        "label": "Credito_IRPEF",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Credito_INPS",
                        "label": "Credito_INPS",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Totale_Accantonato",
                        "label": "Totale_Accantonato",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Data_Aggiornamento",
                        "label": "Data_Aggiornamento",
                        "type": "timestamp",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Diritti_Autore_Correlati_Lordi",
                        "label": "Diritti_Autore_Correlati_Lordi",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Percentuale_Diritti_Autore",
                        "label": "Percentuale_Diritti_Autore",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Diritti_Autore_Tassati_60",
                        "label": "Diritti_Autore_Tassati_60",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Reddito_Attivita_67",
                        "label": "Reddito_Attivita_67",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Reddito_Lordo_Fiscale",
                        "label": "Reddito_Lordo_Fiscale",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Aliquota_Imposta_Sostitutiva",
                        "label": "Aliquota_Imposta_Sostitutiva",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Aliquota_INPS_Stimata",
                        "label": "Aliquota_INPS_Stimata",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "INPS_Versata_Deducibile",
                        "label": "INPS_Versata_Deducibile",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Base_INPS_Stimata",
                        "label": "Base_INPS_Stimata",
                        "type": "numeric",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "CLIENTI": [
                {
                        "id": "ID_CLIENTE",
                        "label": "ID_CLIENTE",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "Nome_Denominazione",
                        "label": "Nome_Denominazione",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": false
                },
                {
                        "id": "Tipologia",
                        "label": "Tipologia",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Email",
                        "label": "Email",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Telefono",
                        "label": "Telefono",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Partita_IVA",
                        "label": "Partita_IVA",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Codice_SDI",
                        "label": "Codice_SDI",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Indirizzo",
                        "label": "Indirizzo",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Note",
                        "label": "Note",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "CONSEGNE_MASTER": [
                {
                        "id": "ID_CONSEGNA",
                        "label": "ID_CONSEGNA",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "Data_Inserimento",
                        "label": "Data_Inserimento",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Progetto",
                        "label": "Progetto",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": false
                },
                {
                        "id": "Cliente",
                        "label": "Cliente",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "Link_Dropbox",
                        "label": "Link_Dropbox",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": false
                },
                {
                        "id": "Hash_File",
                        "label": "Hash_File",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "ESTRATTO_IMAIE": [
                {
                        "id": "id",
                        "label": "id",
                        "type": "int8",
                        "primary": true,
                        "identity": true,
                        "nullable": false
                },
                {
                        "id": "created_at",
                        "label": "created_at",
                        "type": "timestamptz",
                        "primary": false,
                        "identity": false,
                        "nullable": false
                },
                {
                        "id": "TITOLO_OPERA",
                        "label": "TITOLO_OPERA",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "CATALOGO",
                        "label": "CATALOGO",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "PRODUTTORE",
                        "label": "PRODUTTORE",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "ETICHETTA",
                        "label": "ETICHETTA",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "DATA_PUBBL",
                        "label": "DATA_PUBBL",
                        "type": "date",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "INTERPRETE",
                        "label": "INTERPRETE",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "CATEGORIA",
                        "label": "CATEGORIA",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "LIV_IND",
                        "label": "LIV_IND",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "UTILIZ_VEND",
                        "label": "UTILIZ_VEND",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                },
                {
                        "id": "COD_OPERA",
                        "label": "COD_OPERA",
                        "type": "text",
                        "primary": false,
                        "identity": false,
                        "nullable": true
                }
        ],
        "AUDIO_VERSIONI": [
                {"id": "ID_VERSIONE", "label": "ID_VERSIONE", "type": "int8", "primary": true, "identity": true, "nullable": false},
                {"id": "ID_PROGETTO", "label": "ID_PROGETTO", "type": "int8", "primary": false, "identity": false, "nullable": false},
                {"id": "PROVIDER", "label": "PROVIDER", "type": "text", "primary": false, "identity": false, "nullable": false},
                {"id": "PROVIDER_ID", "label": "PROVIDER_ID", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "REVISIONE_PROVIDER", "label": "REVISIONE_PROVIDER", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "NOME_FILE", "label": "NOME_FILE", "type": "text", "primary": false, "identity": false, "nullable": false},
                {"id": "TITOLO", "label": "TITOLO", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "ARTISTA", "label": "ARTISTA", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "TIPO_VERSIONE", "label": "TIPO_VERSIONE", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "ETICHETTA_VERSIONE", "label": "ETICHETTA_VERSIONE", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "STATO_VERSIONE", "label": "STATO_VERSIONE", "type": "text", "primary": false, "identity": false, "nullable": false},
                {"id": "LINK_FILE", "label": "LINK_FILE", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "CONTENT_HASH", "label": "CONTENT_HASH", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "FONTE_LABEL", "label": "FONTE_LABEL", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "DATA_FILE", "label": "DATA_FILE", "type": "timestamptz", "primary": false, "identity": false, "nullable": true},
                {"id": "METADATI", "label": "METADATI", "type": "jsonb", "primary": false, "identity": false, "nullable": false},
                {"id": "NOTE", "label": "NOTE", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "DEDUPE_KEY", "label": "DEDUPE_KEY", "type": "text", "primary": false, "identity": false, "nullable": false},
                {"id": "created_at", "label": "created_at", "type": "timestamptz", "primary": false, "identity": false, "nullable": false},
                {"id": "updated_at", "label": "updated_at", "type": "timestamptz", "primary": false, "identity": false, "nullable": false}
        ],
        "DROPBOX_AUDIO_FILES": [
                {"id": "ID_FILE", "label": "ID_FILE", "type": "int8", "primary": true, "identity": true, "nullable": false},
                {"id": "ID_PROGETTO", "label": "ID_PROGETTO", "type": "int8", "primary": false, "identity": false, "nullable": true},
                {"id": "Progetto", "label": "Progetto", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Artista", "label": "Artista", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Titolo", "label": "Titolo", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Tipo_File", "label": "Tipo_File", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Versione", "label": "Versione", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Nome_File", "label": "Nome_File", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Link_Dropbox", "label": "Link_Dropbox", "type": "text", "primary": false, "identity": false, "nullable": false},
                {"id": "Hash_SHA256", "label": "Hash_SHA256", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Data_Caricamento", "label": "Data_Caricamento", "type": "date", "primary": false, "identity": false, "nullable": true},
                {"id": "Data_Consegna", "label": "Data_Consegna", "type": "date", "primary": false, "identity": false, "nullable": true},
                {"id": "Note", "label": "Note", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "created_at", "label": "created_at", "type": "timestamptz", "primary": false, "identity": false, "nullable": false}
        ],
        "INVII_AUDIO": [
                {"id": "ID_INVIO", "label": "ID_INVIO", "type": "int8", "primary": true, "identity": true, "nullable": false},
                {"id": "ID_FILE", "label": "ID_FILE", "type": "int8", "primary": false, "identity": false, "nullable": true},
                {"id": "ID_PROGETTO", "label": "ID_PROGETTO", "type": "int8", "primary": false, "identity": false, "nullable": true},
                {"id": "Destinatario", "label": "Destinatario", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Tipo_Destinatario", "label": "Tipo_Destinatario", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Canale", "label": "Canale", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Contesto", "label": "Contesto", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Messaggio", "label": "Messaggio", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Data_Invio", "label": "Data_Invio", "type": "timestamptz", "primary": false, "identity": false, "nullable": false},
                {"id": "Conferma_Ricezione", "label": "Conferma_Ricezione", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Data_Conferma", "label": "Data_Conferma", "type": "timestamptz", "primary": false, "identity": false, "nullable": true},
                {"id": "Link_Prova_Drive", "label": "Link_Prova_Drive", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Stato", "label": "Stato", "type": "text", "primary": false, "identity": false, "nullable": false}
        ],
        "DOCUMENTI_PROGETTO": [
                {"id": "ID_DOCUMENTO", "label": "ID_DOCUMENTO", "type": "int8", "primary": true, "identity": true, "nullable": false},
                {"id": "ID_PROGETTO", "label": "ID_PROGETTO", "type": "int8", "primary": false, "identity": false, "nullable": true},
                {"id": "Tipo_Documento", "label": "Tipo_Documento", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Titolo_Documento", "label": "Titolo_Documento", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Fonte", "label": "Fonte", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Link_Drive", "label": "Link_Drive", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "Data_Documento", "label": "Data_Documento", "type": "date", "primary": false, "identity": false, "nullable": true},
                {"id": "Note", "label": "Note", "type": "text", "primary": false, "identity": false, "nullable": true},
                {"id": "created_at", "label": "created_at", "type": "timestamptz", "primary": false, "identity": false, "nullable": false}
        ]
};
    const pks = {
        "PROGETTI": "ID",
        "FATTURE": "ID_FT",
        "Spese Extra": "ID_SPESE",
        "EXPORT SIAE VERTICALE": "ID_SIAVERT",
        "ESTRATTO SIAE": "ID_ECSIAE",
        "EXPORT SIAE": "Cod. Opera",
        "PIANI_FISCALI": "id",
        "CLIENTI": "ID_CLIENTE",
        "CONSEGNE_MASTER": "ID_CONSEGNA",
        "ESTRATTO_IMAIE": "id",
        "AUDIO_VERSIONI": "ID_VERSIONE",
        "DROPBOX_AUDIO_FILES": "ID_FILE",
        "INVII_AUDIO": "ID_INVIO",
        "DOCUMENTI_PROGETTO": "ID_DOCUMENTO"
};
    const labels = {
        "PROGETTI": "Progetti Musicali",
        "FATTURE": "Fatture & Contabilità",
        "Spese Extra": "Spese Extra",
        "EXPORT SIAE VERTICALE": "Export SIAE Verticale",
        "ESTRATTO SIAE": "Estratto SIAE",
        "EXPORT SIAE": "Export SIAE Orizzontale",
        "PIANI_FISCALI": "Piani Fiscali",
        "CLIENTI": "Rubrica CRM",
        "CONSEGNE_MASTER": "Consegne Master",
        "ESTRATTO_IMAIE": "Estratto Nuovo IMAIE",
        "AUDIO_VERSIONI": "Versioni Audio Unificate",
        "DROPBOX_AUDIO_FILES": "Archivio Audio Dropbox",
        "INVII_AUDIO": "Invii Audio",
        "DOCUMENTI_PROGETTO": "Documenti Progetto"
};
    const aliases = {
        "CLIENTI": {
                "Nome_Denominazione": [
                        "nome cliente",
                        "nome",
                        "cliente",
                        "ragione sociale",
                        "denominazione",
                        "nome_denominazione",
                        "nomecliente",
                        "nome/ragione sociale"
                ],
                "Tipologia": [
                        "tipo",
                        "tipologia",
                        "categoria cliente"
                ],
                "Email": [
                        "mail",
                        "e-mail",
                        "email"
                ],
                "Telefono": [
                        "tel",
                        "telefono",
                        "cellulare"
                ],
                "Partita_IVA": [
                        "piva",
                        "p iva",
                        "partita iva",
                        "cf",
                        "codice fiscale",
                        "p_iva"
                ],
                "Codice_SDI": [
                        "sdi",
                        "codice sdi",
                        "codice destinatario"
                ],
                "Indirizzo": [
                        "indirizzo",
                        "via"
                ],
                "Note": [
                        "note",
                        "notes"
                ]
        },
        "PROGETTI": {
                "TITOLO": [
                        "titolo",
                        "titolo progetto",
                        "titolo brano",
                        "brano",
                        "canzone",
                        "song",
                        "TITOLO_PROGETTO"
                ],
                "ARTISTA": [
                        "artista",
                        "artist",
                        "cliente rif",
                        "cliente",
                        "interprete"
                ],
                "AUTORI": [
                        "autori",
                        "authors",
                        "writers"
                ],
                "FEE": [
                        "fee",
                        "compenso",
                        "fee totale",
                        "FEE_TOTALE"
                ],
                "ROY": [
                        "roy",
                        "royalty",
                        "royalties",
                        "punti"
                ],
                "STATO": [
                        "stato",
                        "status"
                ],
                "SVILUPPO": [
                        "sviluppo",
                        "fase"
                ],
                "PAGAMENTO": [
                        "pagamento",
                        "pagata",
                        "pagato"
                ],
                "Data_Sessione": [
                        "data sessione",
                        "data_inizio",
                        "sessione"
                ],
                "Data_Consegna_Master": [
                        "data consegna",
                        "data consegna master",
                        "DATA_CONSEGNA"
                ],
                "Codice_ISRC": [
                        "isrc",
                        "codice isrc"
                ],
                "LINK": [
                        "link",
                        "drive",
                        "dropbox"
                ],
                "NOTE": [
                        "note",
                        "notes"
                ]
        },
        "FATTURE": {
                "Numero": [
                        "numero fattura",
                        "numero",
                        "n fattura",
                        "NUMERO_FATTURA"
                ],
                "Data": [
                        "data emissione",
                        "data",
                        "DATA_EMISSIONE"
                ],
                "ID_PROGETTO": [
                        "id progetto",
                        "progetto",
                        "progetto di riferimento"
                ],
                "Denominazione": [
                        "cliente",
                        "denominazione",
                        "ragione sociale"
                ],
                "Descrizione": [
                        "descrizione",
                        "causale"
                ],
                "PrezzoUnitario": [
                        "prezzo unitario",
                        "importo",
                        "IMPORTO",
                        "compenso"
                ],
                "PrezzoTotale": [
                        "prezzo totale",
                        "totale"
                ],
                "ImportoTotaleDocumento": [
                        "totale documento",
                        "importo totale documento"
                ],
                "ImportoPagamento": [
                        "importo pagamento",
                        "pagamento"
                ],
                "PAGATA": [
                        "pagata",
                        "pagato",
                        "paid"
                ],
                "TIPO FT": [
                        "tipo ft",
                        "tipo fattura",
                        "tipo documento"
                ]
        },
        "CONSEGNE_MASTER": {
                "Progetto": [
                        "titolo brano",
                        "titolo",
                        "progetto",
                        "TITOLO_BRANO"
                ],
                "Link_Dropbox": [
                        "link dropbox",
                        "dropbox",
                        "LINK_DROPBOX"
                ],
                "Hash_File": [
                        "hash sha256",
                        "hash",
                        "sha256",
                        "HASH_SHA256"
                ],
                "Data_Inserimento": [
                        "data certificazione",
                        "data",
                        "DATA_CERTIFICAZIONE"
                ],
                "Cliente": [
                        "cliente"
                ]
        },
        "Spese Extra": {
                "ID_PROGETTO": [
                        "id progetto",
                        "progetto"
                ],
                "Data": [
                        "data"
                ],
                "Descrizione": [
                        "descrizione",
                        "causale"
                ],
                "Categoria": [
                        "categoria",
                        "fornitore"
                ],
                "Importo": [
                        "importo",
                        "costo"
                ]
        },
        "PIANI_FISCALI": {
                "Anno": [
                        "anno",
                        "anno riferimento"
                ],
                "Fatturato_Lordo": [
                        "fatturato lordo",
                        "fatturato totale"
                ],
                "IRPEF_Dovuta": [
                        "irpef"
                ],
                "INPS_Dovuta": [
                        "inps"
                ],
                "Imponibile_Netto": [
                        "imponibile netto"
                ],
                "Totale_Accantonato": [
                        "totale accantonato",
                        "totale tasse"
                ],
                "Data_Aggiornamento": [
                        "data aggiornamento"
                ]
        },
        "ESTRATTO SIAE": {
                "DATA": [
                        "data"
                ],
                "OPERAZIONE": [
                        "operazione",
                        "descrizione"
                ],
                "IMPORTO": [
                        "importo"
                ]
        },
        "EXPORT SIAE VERTICALE": {
                "Titolo": [
                        "titolo",
                        "titolo brano"
                ],
                "Cognome / Denominazione": [
                        "avente diritto",
                        "cognome denominazione",
                        "denominazione"
                ],
                "Quota DEM": [
                        "quota dem",
                        "quota"
                ],
                "Quota DRM": [
                        "quota drm"
                ],
                "Qualifica": [
                        "qualifica",
                        "ruolo"
                ]
        },
        "ESTRATTO_IMAIE": {
                "COD_OPERA": [
                        "cod opera",
                        "codice opera"
                ],
                "TITOLO_OPERA": [
                        "titolo opera",
                        "titolo"
                ],
                "DATA_PUBBL": [
                        "data pubblicazione",
                        "data pubbl"
                ],
                "INTERPRETE": [
                        "interprete",
                        "artista"
                ],
                "PRODUTTORE": [
                        "produttore"
                ],
                "ETICHETTA": [
                        "etichetta"
                ]
        },
        "AUDIO_VERSIONI": {
                "ID_PROGETTO": ["progetto", "id progetto"],
                "PROVIDER": ["provider", "origine", "sorgente"],
                "PROVIDER_ID": ["id provider", "id file cloud"],
                "REVISIONE_PROVIDER": ["revisione", "versione cloud"],
                "NOME_FILE": ["nome file", "file"],
                "TIPO_VERSIONE": ["tipo", "fase", "tipo versione"],
                "ETICHETTA_VERSIONE": ["versione", "etichetta versione"],
                "LINK_FILE": ["link", "drive", "dropbox"],
                "CONTENT_HASH": ["hash", "impronta"],
                "DATA_FILE": ["data file", "data modifica"]
        },
        "DROPBOX_AUDIO_FILES": {
                "Progetto": ["progetto", "brano"],
                "Artista": ["artista", "interprete"],
                "Titolo": ["titolo", "titolo brano"],
                "Tipo_File": ["tipo", "tipo file", "contesto"],
                "Versione": ["versione", "v"],
                "Nome_File": ["nome file", "file"],
                "Link_Dropbox": ["link", "dropbox", "link dropbox"],
                "Hash_SHA256": ["hash", "sha256", "impronta"],
                "Data_Consegna": ["data consegna", "consegna"]
        },
        "INVII_AUDIO": {
                "Destinatario": ["destinatario", "a", "cliente"],
                "Tipo_Destinatario": ["tipo destinatario", "ruolo"],
                "Canale": ["canale", "whatsapp", "email"],
                "Contesto": ["contesto", "tipo invio"],
                "Messaggio": ["messaggio", "testo"],
                "Stato": ["stato", "status"]
        },
        "DOCUMENTI_PROGETTO": {
                "Tipo_Documento": ["tipo documento", "tipo"],
                "Titolo_Documento": ["titolo documento", "titolo"],
                "Fonte": ["fonte", "mail", "whatsapp"],
                "Link_Drive": ["link", "drive", "link drive"],
                "Data_Documento": ["data documento", "data"],
                "Note": ["note"]
        }
};

    function getColumns(tableName, options = {}) {
        const includeIdentity = !!options.includeIdentity;
        const includeCreatedAt = !!options.includeCreatedAt;
        return (schemas[tableName] || []).filter(col => {
            if (!includeIdentity && col.identity) return false;
            if (!includeCreatedAt && col.id === 'created_at') return false;
            return true;
        });
    }

    function getType(tableName, columnName) {
        const col = (schemas[tableName] || []).find(c => c.id === columnName);
        return col ? col.type : 'text';
    }

    function isNumericType(type) {
        return ['int2', 'int4', 'int8', 'numeric', 'float4', 'float8', 'real', 'double precision'].includes(String(type || '').toLowerCase());
    }

    function isDateType(type) {
        return ['date', 'timestamp', 'timestamptz', 'timestampz'].includes(String(type || '').toLowerCase());
    }

    function findBestField(tableName, sourceColumn) {
        const normalize = window.KYV?.normalize || (v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ''));
        const sourceNorm = normalize(sourceColumn);
        const fields = getColumns(tableName);
        for (const field of fields) {
            if (normalize(field.id) === sourceNorm || normalize(field.label) === sourceNorm) return field.id;
        }
        const tableAliases = aliases[tableName] || {};
        for (const [fieldId, names] of Object.entries(tableAliases)) {
            if (normalize(fieldId) === sourceNorm) return fieldId;
            if ((names || []).some(name => normalize(name) === sourceNorm || sourceNorm.includes(normalize(name)) || normalize(name).includes(sourceNorm))) return fieldId;
        }
        for (const field of fields) {
            const fieldNorm = normalize(field.id);
            if (sourceNorm && (sourceNorm.includes(fieldNorm) || fieldNorm.includes(sourceNorm))) return field.id;
        }
        return '';
    }

    window.KYV_DB = {
        SCHEMAS: schemas,
        TABLES: Object.keys(schemas),
        PRIMARY_KEYS: pks,
        TABLE_LABELS: labels,
        FIELD_ALIASES: aliases,
        getColumns,
        getType,
        isNumericType,
        isDateType,
        findBestField
    };
})();
