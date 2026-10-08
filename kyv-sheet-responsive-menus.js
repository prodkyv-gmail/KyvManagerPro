// KYV responsive dropdown typography — Progetti + Studio Editor.
(function(){
'use strict';
const page=(location.pathname.split('/').pop()||'').toLowerCase();
if(!['progetti.html','editor.html'].includes(page))return;
if(document.getElementById('kyv-sheet-responsive-menu-style'))return;

const style=document.createElement('style');
style.id='kyv-sheet-responsive-menu-style';
style.textContent=`
/* Desktop: menu compatti, più dati visibili senza sacrificare la leggibilità. */
.kyv-sheet-menu{
  width:min(270px,calc(100vw - 16px))!important;
  padding:8px!important;
  font-size:10.5px!important;
  line-height:1.28!important;
}
.kyv-sheet-menu-head{padding:1px 1px 6px!important;gap:6px!important}
.kyv-sheet-menu-head strong{font-size:10.5px!important;line-height:1.2!important}
.kyv-sheet-menu-head button{font-size:17px!important;line-height:1!important}
.kyv-sheet-sort-actions{gap:5px!important}
.kyv-sheet-menu button{
  padding:5px 7px!important;
  font-size:10px!important;
  line-height:1.2!important;
}
.kyv-sheet-menu-search{
  margin-top:6px!important;
  padding:6px 7px!important;
  font-size:10.5px!important;
  line-height:1.2!important;
}
.kyv-sheet-values{
  max-height:min(220px,34vh)!important;
  margin:6px 0!important;
  padding:4px!important;
  font-size:10.5px!important;
}
.kyv-sheet-values label{
  padding:3px 5px!important;
  font-size:10.5px!important;
  line-height:1.25!important;
}
.kyv-sheet-values input[type="checkbox"]{
  width:12px!important;
  height:12px!important;
  vertical-align:-2px!important;
  margin-right:3px!important;
}
.kyv-sheet-menu-foot{gap:6px!important}

/* Editor della cella / REF dello Studio Editor. */
.kyv-cell-editor{
  width:min(350px,calc(100vw - 18px))!important;
  padding:8px!important;
  font-size:10.5px!important;
}
.kyv-cell-editor label{font-size:10.5px!important;margin-bottom:4px!important}
.kyv-cell-editor input{
  padding:7px 8px!important;
  font-size:10.5px!important;
  line-height:1.25!important;
}
.kyv-cell-editor small{font-size:9.5px!important;margin-top:4px!important;line-height:1.3!important}
.kyv-cell-editor-actions{gap:6px!important;margin-top:8px!important}
.kyv-cell-editor-actions button{padding:5px 8px!important;font-size:10px!important}
.kyv-ref-edit-button{font-size:8.5px!important;padding:1px 4px!important}

/* Anche i datalist già presenti nello Studio Editor ricevono la stessa scala.
   La resa del popup nativo resta in parte controllata dal browser/sistema operativo. */
#modal-dynamic input[list],
#dynamic-form-fields input[list],
.kyv-cell-editor input[list]{font-size:10.5px!important}
datalist option{font-size:10.5px!important;line-height:1.25!important}

/* Tablet: leggermente più grande per mantenere un buon target visivo/touch. */
@media (max-width:1024px){
  .kyv-sheet-menu{width:min(280px,calc(100vw - 16px))!important;font-size:11px!important}
  .kyv-sheet-menu-head strong,.kyv-sheet-menu-search,.kyv-sheet-values,.kyv-sheet-values label{font-size:11px!important}
  .kyv-sheet-menu button{font-size:10.5px!important}
  .kyv-cell-editor,.kyv-cell-editor label,.kyv-cell-editor input{font-size:11px!important}
  .kyv-cell-editor small{font-size:10px!important}
  .kyv-cell-editor-actions button{font-size:10.5px!important}
  #modal-dynamic input[list],#dynamic-form-fields input[list],.kyv-cell-editor input[list],datalist option{font-size:11px!important}
}

/* Smartphone: testo ancora compatto ma non microscopico; contenitore adattato allo schermo. */
@media (max-width:640px){
  .kyv-sheet-menu{
    width:min(310px,calc(100vw - 12px))!important;
    max-height:min(72vh,520px)!important;
    padding:8px!important;
    font-size:11.5px!important;
  }
  .kyv-sheet-menu-head strong,.kyv-sheet-menu-search,.kyv-sheet-values,.kyv-sheet-values label{font-size:11.5px!important}
  .kyv-sheet-menu button{font-size:11px!important;padding:6px 7px!important}
  .kyv-sheet-values{max-height:min(230px,36vh)!important}
  .kyv-cell-editor{width:calc(100vw - 12px)!important;padding:9px!important;font-size:11.5px!important}
  .kyv-cell-editor label,.kyv-cell-editor input{font-size:11.5px!important}
  .kyv-cell-editor small{font-size:10.5px!important}
  .kyv-cell-editor-actions button{font-size:11px!important;padding:6px 9px!important}
  #modal-dynamic input[list],#dynamic-form-fields input[list],.kyv-cell-editor input[list],datalist option{font-size:11.5px!important}
}
`;
document.head.appendChild(style);
})();
