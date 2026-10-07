/* KYV Agenda Phase 5 — agenda di produzione sopra Google Calendar, senza cambiare il backend Calendar. */
(function(){
'use strict';

const page=(location.pathname.split('/').pop()||'').toLowerCase();
if(page!=='kyv_calendar.html')return;

let db=null;
let projects=[];
let activeFilter='all';
let selectedKind='session';
let observer=null;
let enhanceScheduled=false;

function text(value){
  return String(value??'').trim();
}

function H(value){
  if(window.KYV&&typeof KYV.safeHtml==='function'){
    return KYV.safeHtml(value??'');
  }

  return String(value??'').replace(
    /[&<>"']/g,
    ch=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[ch])
  );
}

function client(){
  if(db)return db;
  db=window.KYV?.createSupabaseClient?.()||null;
  return db;
}

function localDate(){
  const d=new Date();
  const off=d.getTimezoneOffset();

  return new Date(
    d.getTime()-off*60000
  ).toISOString().slice(0,10);
}

function isDone(project){
  return /uscita|pubblicat|completat|chius|finita/i.test(
    text(project?.STATO)
  );
}

function hasAction(project){
  return !!text(project?.SVILUPPO)&&!isDone(project);
}

function projectLabel(project){
  return [
    text(project?.ARTISTA)||'Artista non indicato',
    text(project?.TITOLO)||'Senza titolo'
  ].join(' · ');
}

function classify(value){
  const t=text(value).toLowerCase();

  if(
    /scaden|deadline|consegna|release|uscita|saldo|pagament|fattur|deposito|siae|entro il|chiudere entro/.test(t)
  ){
    return'deadline';
  }

  if(
    /follow|feedback|richiam|rispond|invia|pitch|mail|contatt|sentire|sollecit|manda|mandare|ascolto/.test(t)
  ){
    return'followup';
  }

  if(
    /session|studio|registr|record|writing|scritt|produz|voce|voci|arrang|beat|mix|mastering|riunion|meeting/.test(t)
  ){
    return'session';
  }

  return'other';
}

const kinds={
  session:{
    label:'Sessione',
    icon:'music-2',
    prefix:'Sessione',
    className:'kyv-agenda-session'
  },

  followup:{
    label:'Follow-up',
    icon:'send',
    prefix:'Follow-up',
    className:'kyv-agenda-followup'
  },

  deadline:{
    label:'Scadenza',
    icon:'alarm-clock',
    prefix:'Scadenza',
    className:'kyv-agenda-deadline'
  },

  other:{
    label:'Altro',
    icon:'calendar',
    prefix:'',
    className:'kyv-agenda-other'
  }
};

function injectStyles(){
  if(document.getElementById('kyv-agenda-phase5-style'))return;

  const style=document.createElement('style');

  style.id='kyv-agenda-phase5-style';

  style.textContent=`
#kyv-agenda-phase5{
  margin-bottom:1rem;
}

.kyv-agenda-overview{
  border:1px solid rgba(190,182,255,.20);
  border-radius:1rem;
  padding:1rem;
}

.kyv-agenda-stats{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:.55rem;
}

.kyv-agenda-stat{
  padding:.7rem .75rem;
  border:1px solid rgba(255,255,255,.08);
  border-radius:.8rem;
  background:rgba(255,255,255,.025);
}

.kyv-agenda-stat strong{
  display:block;
  color:#fff;
  font-size:1.05rem;
}

.kyv-agenda-stat span{
  display:block;
  color:#94a3b8;
  font-size:.64rem;
  margin-top:.1rem;
}

.kyv-agenda-actions{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:.55rem;
}

.kyv-agenda-action{
  border:1px solid rgba(255,255,255,.08);
  border-radius:.85rem;
  padding:.8rem;
  background:rgba(255,255,255,.025);
}

.kyv-agenda-action h4{
  color:#fff;
  font-size:.78rem;
  font-weight:900;
}

.kyv-agenda-action p{
  color:#94a3b8;
  font-size:.66rem;
  margin-top:.22rem;
}

.kyv-agenda-buttons{
  display:flex;
  flex-wrap:wrap;
  gap:.35rem;
  margin-top:.65rem;
}

.kyv-agenda-btn{
  display:inline-flex;
  align-items:center;
  gap:.3rem;
  padding:.44rem .58rem;
  border-radius:.62rem;
  border:1px solid rgba(255,255,255,.10);
  background:rgba(255,255,255,.04);
  color:#e5e7eb;
  font-size:.65rem;
  font-weight:850;
}

.kyv-agenda-btn:hover{
  background:rgba(255,255,255,.09);
}

.kyv-agenda-filters{
  display:flex;
  flex-wrap:wrap;
  gap:.4rem;
}

.kyv-agenda-filter{
  padding:.45rem .62rem;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.03);
  color:#94a3b8;
  font-size:.65rem;
  font-weight:850;
}

.kyv-agenda-filter.active{
  color:#fff;
  border-color:rgba(190,182,255,.35);
  background:rgba(190,182,255,.11);
}

.kyv-agenda-event-badge{
  display:inline-flex;
  align-items:center;
  gap:.3rem;
  padding:.22rem .44rem;
  border-radius:999px;
  font-size:.56rem;
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.07em;
  margin-bottom:.38rem;
  border:1px solid rgba(255,255,255,.10);
}

.kyv-agenda-session .kyv-agenda-event-badge{
  color:#c7d2fe;
  background:rgba(129,140,248,.10);
  border-color:rgba(129,140,248,.25);
}

.kyv-agenda-followup .kyv-agenda-event-badge{
  color:#bae6fd;
  background:rgba(56,189,248,.09);
  border-color:rgba(56,189,248,.22);
}

.kyv-agenda-deadline .kyv-agenda-event-badge{
  color:#fed7aa;
  background:rgba(251,146,60,.09);
  border-color:rgba(251,146,60,.23);
}

.kyv-agenda-other .kyv-agenda-event-badge{
  color:#cbd5e1;
  background:rgba(148,163,184,.08);
  border-color:rgba(148,163,184,.18);
}

.kyv-agenda-event-hidden{
  display:none!important;
}

.kyv-agenda-type-field{
  border:1px solid rgba(255,255,255,.08);
  border-radius:.8rem;
  padding:.65rem;
  background:rgba(255,255,255,.02);
}

.kyv-agenda-type-options{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:.35rem;
}

.kyv-agenda-type{
  padding:.48rem .4rem;
  border:1px solid rgba(255,255,255,.08);
  border-radius:.62rem;
  color:#94a3b8;
  font-size:.61rem;
  font-weight:850;
}

.kyv-agenda-type.active{
  color:#fff;
  border-color:rgba(167,139,250,.35);
  background:rgba(167,139,250,.11);
}

/*
 * Il box di sincronizzazione Calendar resta SEMPRE visibile.
 * Non viene più spostato dentro <details>.
 */

@media(max-width:850px){
  .kyv-agenda-stats{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .kyv-agenda-actions{
    grid-template-columns:1fr;
  }
}

@media(max-width:480px){
  .kyv-agenda-type-options{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}
`;

  document.head.appendChild(style);
}

function renamePage(){
  const header=document.querySelector('main section > header');

  if(!header)return;

  const h2=header.querySelector('h2');

  if(h2){
    h2.innerHTML=
      'Agenda <span class="text-violet-300">di produzione</span>';
  }

  const p=header.querySelector('h2 + p');

  if(p){
    p.textContent=
      'Sessioni, follow-up, scadenze e prossime azioni dei progetti in un solo posto.';
  }

  const upcoming=[...document.querySelectorAll('h2')]
    .find(el=>/Prossimi Appuntamenti/i.test(el.textContent||''));

  if(upcoming){
    upcoming.innerHTML=
      '<i data-lucide="calendar-days" class="w-5 h-5 mr-3 text-violet-300"></i> Calendario';
  }

  const form=document.getElementById('form-new-event');
  const card=form?.closest('.bg-kyv-card');
  const heading=card?.querySelector('h3');

  if(heading){
    heading.innerHTML=
      '<i data-lucide="calendar-plus" class="w-5 h-5 mr-2 text-emerald-300"></i> Pianifica attività';
  }

  const submit=document.getElementById('btn-create');

  if(submit){
    submit.innerHTML=
      '<i data-lucide="calendar-plus" class="w-4 h-4 mr-2" id="create-icon"></i> Aggiungi in Agenda';
  }
}

/*
 * IMPORTANTE:
 * La vecchia funzione collapseTechnical() è stata rimossa.
 *
 * Non dobbiamo più prendere il box che contiene #btn-sync
 * e spostarlo dentro un <details>.
 *
 * In questo modo:
 *
 * - Connessione API resta visibile
 * - Account Calendar resta visibile
 * - Sincronizza Ora resta visibile
 * - il pannello Calendario resta nella struttura originale
 */

function mountTypeSelector(){
  const form=document.getElementById('form-new-event');

  if(
    !form||
    document.getElementById('kyv-agenda-type-field')
  ){
    return;
  }

  const field=document.createElement('div');

  field.id='kyv-agenda-type-field';
  field.className='kyv-agenda-type-field';

  field.innerHTML=
    '<label class="block text-[10px] font-bold text-kyv-text uppercase tracking-wider mb-2">Tipo attività</label>'+
    '<div class="kyv-agenda-type-options">'+
    Object.entries(kinds)
      .map(([key,meta])=>`
        <button
          type="button"
          class="kyv-agenda-type ${key===selectedKind?'active':''}"
          data-kind="${key}"
        >
          <i
            data-lucide="${meta.icon}"
            class="w-3.5 h-3.5 inline mr-1"
          ></i>
          ${meta.label}
        </button>
      `)
      .join('')+
    '</div>';

  /*
   * Inserisce Tipo attività sopra Titolo/Data/Ora
   * senza rimuovere nessuno dei campi originali.
   */
  form.insertBefore(
    field,
    form.firstElementChild
  );

  field
    .querySelectorAll('[data-kind]')
    .forEach(btn=>{
      btn.addEventListener(
        'click',
        ()=>setKind(btn.dataset.kind)
      );
    });

  form.addEventListener(
    'submit',
    ()=>{
      const input=document.getElementById('ev-title');

      if(!input)return;

      const raw=text(input.value);
      const meta=kinds[selectedKind]||kinds.other;

      if(
        !raw||
        !meta.prefix
      ){
        return;
      }

      if(
        !/^(sessione|follow-up|scadenza)\s*[·:\-]/i.test(raw)
      ){
        input.value=
          `${meta.prefix} · ${raw}`;
      }
    },
    true
  );
}

function setKind(kind){
  selectedKind=
    kinds[kind]
      ?kind
      :'other';

  document
    .querySelectorAll('.kyv-agenda-type')
    .forEach(btn=>{
      btn.classList.toggle(
        'active',
        btn.dataset.kind===selectedKind
      );
    });
}

function mountOverview(){
  const header=
    document.querySelector(
      'main section > header'
    );

  if(
    !header||
    document.getElementById('kyv-agenda-phase5')
  ){
    return;
  }

  const panel=document.createElement('section');

  panel.id='kyv-agenda-phase5';

  panel.className=
    'kyv-agenda-overview kyv-pastel-lavender';

  panel.innerHTML=`
    <div
      class="flex flex-col xl:flex-row xl:items-start justify-between gap-4"
    >

      <div>

        <p
          class="text-[10px] uppercase tracking-[.16em] font-black text-violet-200"
        >
          Prima il lavoro, poi il calendario
        </p>

        <h3
          class="text-lg font-black text-white mt-1"
        >
          Cosa c’è da organizzare
        </h3>

        <p
          class="text-xs text-kyv-text mt-1"
        >
          Le prossime azioni dei progetti restano da pianificare
          finché non assegni loro un momento in agenda.
        </p>

      </div>

      <div
        id="kyv-agenda-stats"
        class="kyv-agenda-stats min-w-0 xl:min-w-[460px]"
      ></div>

    </div>

    <div class="mt-4">

      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3"
      >

        <h4
          class="text-sm font-black text-white"
        >
          Da pianificare
        </h4>

        <span
          id="kyv-agenda-action-count"
          class="text-[10px] font-black text-kyv-text"
        >
          0 azioni
        </span>

      </div>

      <div
        id="kyv-agenda-actions"
        class="kyv-agenda-actions"
      >
        <div class="text-xs text-kyv-text">
          Carico le prossime azioni…
        </div>
      </div>

    </div>

    <div
      class="mt-4 pt-4 border-t border-white/10"
    >

      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >

        <div>

          <h4
            class="text-sm font-black text-white"
          >
            Filtra calendario
          </h4>

          <p
            class="text-[10px] text-kyv-text mt-1"
          >
            Le categorie vengono riconosciute
            automaticamente dal titolo.
          </p>

        </div>

        <div
          id="kyv-agenda-filters"
          class="kyv-agenda-filters"
        ></div>

      </div>

    </div>
  `;

  header.insertAdjacentElement(
    'afterend',
    panel
  );

  renderFilters();
  updateStats();
}

function renderFilters(){
  const host=
    document.getElementById(
      'kyv-agenda-filters'
    );

  if(!host)return;

  const rows=[
    ['all','Tutto'],
    ['session','Sessioni'],
    ['followup','Follow-up'],
    ['deadline','Scadenze'],
    ['other','Altro']
  ];

  host.innerHTML=
    rows
      .map(([key,label])=>`
        <button
          type="button"
          class="kyv-agenda-filter ${activeFilter===key?'active':''}"
          data-filter="${key}"
        >
          ${label}
        </button>
      `)
      .join('');

  host
    .querySelectorAll('[data-filter]')
    .forEach(btn=>{
      btn.addEventListener(
        'click',
        ()=>{
          activeFilter=
            btn.dataset.filter;

          renderFilters();
          enhanceEvents();
        }
      );
    });
}

function actionSort(a,b){
  const ad=
    new Date(
      a.updated_at||
      a.Data_Sessione||
      a.created_at||
      0
    ).getTime()||
    Number(a.ID||0);

  const bd=
    new Date(
      b.updated_at||
      b.Data_Sessione||
      b.created_at||
      0
    ).getTime()||
    Number(b.ID||0);

  return bd-ad;
}

async function loadProjects(){
  const c=client();

  if(!c)return[];

  try{

    const {
      data,
      error
    }=
      await c
        .from('PROGETTI')
        .select('*')
        .limit(750);

    if(error)throw error;

    projects=
      (data||[])
        .filter(hasAction)
        .sort(actionSort);

  }catch(error){

    console.warn(
      'KYV Agenda: prossime azioni non disponibili',
      error
    );

    projects=[];
  }

  renderProjectActions();
  updateStats();

  return projects;
}

function renderProjectActions(){
  const host=
    document.getElementById(
      'kyv-agenda-actions'
    );

  const count=
    document.getElementById(
      'kyv-agenda-action-count'
    );

  if(!host)return;

  if(count){
    count.textContent=
      `${projects.length} ${
        projects.length===1
          ?'azione'
          :'azioni'
      }`;
  }

  if(!projects.length){

    host.innerHTML=`
      <div
        class="col-span-full rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4 text-center"
      >
        <p
          class="text-sm font-black text-emerald-100"
        >
          Nessuna azione da pianificare.
        </p>

        <p
          class="text-xs text-kyv-text mt-1"
        >
          Le prossime azioni impostate nei progetti
          compariranno qui.
        </p>
      </div>
    `;

    return;
  }

  host.innerHTML=
    projects
      .slice(0,8)
      .map(p=>`
        <article
          class="kyv-agenda-action"
          data-project-id="${H(p.ID)}"
        >

          <div
            class="flex items-start justify-between gap-2"
          >

            <div>

              <p
                class="text-[9px] uppercase tracking-wider font-black text-violet-200"
              >
                ${
                  H(
                    kinds[
                      classify(p.SVILUPPO)
                    ]?.label||
                    'Attività'
                  )
                }
              </p>

              <h4 class="mt-1">
                ${H(p.SVILUPPO)}
              </h4>

              <p>
                ${H(projectLabel(p))}
              </p>

            </div>

            <span
              class="text-[9px] font-black text-kyv-text"
            >
              #${H(p.ID)}
            </span>

          </div>

          <div
            class="kyv-agenda-buttons"
          >

            <button
              type="button"
              class="kyv-agenda-btn"
              data-plan="${H(p.ID)}"
            >
              <i
                data-lucide="calendar-plus"
                class="w-3.5 h-3.5"
              ></i>
              Pianifica
            </button>

            <a
              class="kyv-agenda-btn"
              href="scheda_progetto.html?id=${encodeURIComponent(p.ID)}"
            >
              <i
                data-lucide="panel-top-open"
                class="w-3.5 h-3.5"
              ></i>
              Progetto
            </a>

            <button
              type="button"
              class="kyv-agenda-btn"
              data-done="${H(p.ID)}"
            >
              <i
                data-lucide="check"
                class="w-3.5 h-3.5"
              ></i>
              Fatto
            </button>

          </div>

        </article>
      `)
      .join('');

  host
    .querySelectorAll('[data-plan]')
    .forEach(btn=>{
      btn.addEventListener(
        'click',
        ()=>planProject(btn.dataset.plan)
      );
    });

  host
    .querySelectorAll('[data-done]')
    .forEach(btn=>{
      btn.addEventListener(
        'click',
        ()=>completeProjectAction(
          btn.dataset.done,
          btn
        )
      );
    });

  if(window.lucide){
    lucide.createIcons({
      root:host
    });
  }
}

function planProject(id){
  const p=
    projects.find(
      row=>
        String(row.ID)===
        String(id)
    );

  if(!p)return;

  const action=
    text(p.SVILUPPO);

  const title=
    document.getElementById(
      'ev-title'
    );

  const date=
    document.getElementById(
      'ev-date'
    );

  const time=
    document.getElementById(
      'ev-time'
    );

  setKind(
    classify(action)
  );

  if(title){
    title.value=
      [
        action,
        projectLabel(p)
      ]
        .filter(Boolean)
        .join(' — ');
  }

  if(
    date&&
    !text(date.value)
  ){
    date.value=
      localDate();
  }

  if(
    time&&
    !text(time.value)
  ){
    time.value='12:00';
  }

  const form=
    document.getElementById(
      'form-new-event'
    );

  form?.scrollIntoView({
    behavior:'smooth',
    block:'center'
  });

  setTimeout(
    ()=>title?.focus(),
    250
  );
}

async function completeProjectAction(id,button){
  const p=
    projects.find(
      row=>
        String(row.ID)===
        String(id)
    );

  if(
    !p||
    !client()
  ){
    return;
  }

  if(
    !window.confirm(
      `Segnare come fatta questa azione?\n\n${text(p.SVILUPPO)}`
    )
  ){
    return;
  }

  const before=
    button.innerHTML;

  button.disabled=true;
  button.textContent='Salvo…';

  try{

    const {
      error
    }=
      await client()
        .from('PROGETTI')
        .update({
          SVILUPPO:''
        })
        .eq(
          'ID',
          p.ID
        );

    if(error)throw error;

    projects=
      projects.filter(
        row=>
          String(row.ID)!==
          String(p.ID)
      );

    renderProjectActions();
    updateStats();

    window.KYV_TOAST
      ?.show?.(
        'Azione completata.',
        'success'
      );

  }catch(error){

    button.disabled=false;
    button.innerHTML=before;

    window.KYV_TOAST
      ?.show?.(
        error.message||
        'Impossibile completare l’azione.',
        'error'
      );
  }
}

function eventCards(){
  const list=
    document.getElementById(
      'events-list'
    );

  if(!list)return[];

  return[
    ...list.children
  ].filter(
    card=>
      card.querySelector?.('h3')
  );
}

function enhanceEvents(){
  const cards=
    eventCards();

  cards.forEach(card=>{

    const titleNode=
      card.querySelector('h3');

    const kind=
      classify(
        titleNode?.textContent
      );

    const meta=
      kinds[kind]||
      kinds.other;

    card.dataset.kyvAgendaType=
      kind;

    card.classList.remove(
      ...Object
        .values(kinds)
        .map(k=>k.className)
    );

    card.classList.add(
      meta.className
    );

    card.classList.toggle(
      'kyv-agenda-event-hidden',
      activeFilter!=='all'&&
      activeFilter!==kind
    );

    const parent=
      titleNode?.parentElement;

    if(
      parent&&
      !parent.querySelector(
        '.kyv-agenda-event-badge'
      )
    ){

      const badge=
        document.createElement(
          'span'
        );

      badge.className=
        'kyv-agenda-event-badge';

      badge.innerHTML=`
        <i
          data-lucide="${meta.icon}"
          class="w-3 h-3"
        ></i>
        ${meta.label}
      `;

      parent.insertBefore(
        badge,
        titleNode
      );
    }
  });

  updateStats();

  /*
   * Le icone vengono create solo dopo aver completato
   * tutte le modifiche del DOM.
   */
  if(window.lucide){
    lucide.createIcons({
      root:
        document.getElementById(
          'events-list'
        )||
        document.body
    });
  }
}

function updateStats(){
  const host=
    document.getElementById(
      'kyv-agenda-stats'
    );

  if(!host)return;

  const cards=
    eventCards();

  const counts={
    session:0,
    followup:0,
    deadline:0,
    other:0
  };

  cards.forEach(card=>{

    const k=
      card.dataset.kyvAgendaType||
      classify(
        card
          .querySelector('h3')
          ?.textContent
      );

    if(
      counts[k]!==undefined
    ){
      counts[k]++;
    }
  });

  host.innerHTML=`
    <div class="kyv-agenda-stat">
      <strong>${projects.length}</strong>
      <span>Da pianificare</span>
    </div>

    <div class="kyv-agenda-stat">
      <strong>${counts.session}</strong>
      <span>Sessioni</span>
    </div>

    <div class="kyv-agenda-stat">
      <strong>${counts.followup}</strong>
      <span>Follow-up</span>
    </div>

    <div class="kyv-agenda-stat">
      <strong>${counts.deadline}</strong>
      <span>Scadenze</span>
    </div>
  `;
}

/*
 * FIX LOOP AGENDA
 *
 * Prima:
 *
 * observer.observe(list,{
 *   childList:true,
 *   subtree:true
 * })
 *
 * enhanceEvents() modificava a sua volta il sottoalbero,
 * aggiungendo badge e trasformando le icone Lucide.
 *
 * Il MutationObserver intercettava quindi anche le proprie
 * modifiche e poteva richiamarsi continuamente.
 *
 * Ora osserviamo soltanto i figli diretti di events-list.
 * Quando il calendario sostituisce le card, eseguiamo
 * enhanceEvents() una sola volta nel frame successivo.
 */

function scheduleEnhanceEvents(){
  if(enhanceScheduled)return;

  enhanceScheduled=true;

  requestAnimationFrame(()=>{
    enhanceScheduled=false;
    enhanceEvents();
  });
}

function watchEvents(){
  const list=
    document.getElementById(
      'events-list'
    );

  if(
    !list||
    observer
  ){
    return;
  }

  observer=
    new MutationObserver(
      mutations=>{

        const changed=
          mutations.some(
            mutation=>
              mutation.type==='childList'&&
              (
                mutation.addedNodes.length||
                mutation.removedNodes.length
              )
          );

        if(changed){
          scheduleEnhanceEvents();
        }
      }
    );

  observer.observe(
    list,
    {
      childList:true,
      subtree:false
    }
  );

  enhanceEvents();
}

function inferPrefillKind(){
  const title=
    text(
      document
        .getElementById(
          'ev-title'
        )
        ?.value
    );

  if(title){
    setKind(
      classify(title)
    );
  }
}

function ensureOriginalCalendarVisible(){
  /*
   * Protezione aggiuntiva:
   * il box originale del Calendar non deve essere nascosto
   * o racchiuso in un details.
   */

  const syncButton=
    document.getElementById(
      'btn-sync'
    );

  const eventsList=
    document.getElementById(
      'events-list'
    );

  const form=
    document.getElementById(
      'form-new-event'
    );

  if(syncButton){

    const syncCard=
      syncButton.closest(
        '.bg-kyv-card'
      );

    if(syncCard){
      syncCard.style.display='';
      syncCard.hidden=false;
    }
  }

  if(eventsList){

    const calendarCard=
      eventsList.closest(
        '.bg-kyv-card'
      );

    if(calendarCard){
      calendarCard.style.display='';
      calendarCard.hidden=false;
    }
  }

  if(form){

    const formCard=
      form.closest(
        '.bg-kyv-card'
      );

    if(formCard){
      formCard.style.display='';
      formCard.hidden=false;
    }
  }
}

function boot(){
  injectStyles();

  ensureOriginalCalendarVisible();

  renamePage();

  /*
   * NON richiamare collapseTechnical().
   *
   * Il box Calendar / Connessione API / Sincronizza Ora
   * deve restare nella posizione originale e sempre visibile.
   */

  mountTypeSelector();

  mountOverview();

  watchEvents();

  loadProjects();

  setTimeout(
    ()=>{
      ensureOriginalCalendarVisible();
      renamePage();
      inferPrefillKind();

      if(window.lucide){
        lucide.createIcons();
      }
    },
    350
  );

  if(window.lucide){
    lucide.createIcons();
  }
}

if(
  document.readyState==='loading'
){
  document.addEventListener(
    'DOMContentLoaded',
    boot,
    {
      once:true
    }
  );
}else{
  boot();
}

})();
