// ── STATE ──
const state={
  vereinName:'',liga:'',sportart:'',aussendienst:'',verantwortlich:'',laufzeit:3,
  haendlerName:'',kdnrVereinFreiware:'',kdnrVereinNachkauf:'',kdnrHaendler:'',
  haendlerNachkauf:0.3,haendlerFreiware:0.4,haendlerErloesschmaelerung:0.08,
  vereinNachkauf:0,vereinErloesschmaelerung:0,
  hekCosQuotient:2.5,uvpCosQuotient:5.0,
  vereinMode:'uvp',haendlerMode:'hek',sponsoringMode:'hek',steuer:0,
  qualVerein:'',warumVerein:'',qualHandel:'',andereVereine:'',umsatzPotenziale:'',
  years:[]
};
let currentStep=1, maxVisited=1;

// Date
document.getElementById('headerDate').textContent=new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});

function toggleQuotientLock(){
  document.getElementById('quotientFields').classList.toggle('unlocked',document.getElementById('quotientUnlock').checked);
}

function initYears(n){
  const base=new Date().getFullYear();
  const current=state.years.length;
  if(current===n) return; // Laufzeit unverändert – nichts tun
  if(n>current){
    // Laufzeit verlängert: nur neue Jahre anhängen
    for(let i=current;i<n;i++){
      const s=base+i;
      state.years.push({
        label:`${s}/${(s+1).toString().slice(-2)}`,ligaLabel:'',
        cash:0,freiwareHek:0,freiwareUvp:0,
        vereinUmsatzHek:0,vereinUmsatzUvp:0,
        haendlerDirektHek:0,haendlerDirektUvp:0,haendlerFreiwareHek:0,
        haendlerIndirektHek:0,haendlerIndirektUvp:0,
        marketingkosten:0,logistikkosten:0,sonstigeKosten:0
      });
    }
  } else {
    // Laufzeit verkürzt: überzählige Jahre abschneiden
    state.years=state.years.slice(0,n);
  }
}

function initYearsFresh(n){
  // Vollständiger Reset – nur beim ersten Laden
  const base=new Date().getFullYear(); state.years=[];
  for(let i=0;i<n;i++){
    const s=base+i;
    state.years.push({
      label:`${s}/${(s+1).toString().slice(-2)}`,ligaLabel:'',
      cash:0,freiwareHek:0,freiwareUvp:0,
      vereinUmsatzHek:0,vereinUmsatzUvp:0,
      haendlerDirektHek:0,haendlerDirektUvp:0,haendlerFreiwareHek:0,
      haendlerIndirektHek:0,haendlerIndirektUvp:0,
      marketingkosten:0,logistikkosten:0,sonstigeKosten:0
    });
  }
}

function updateProgress(step){
  document.querySelectorAll('.step-node').forEach(el=>{
    const s=parseInt(el.dataset.step);
    el.classList.remove('active','done');
    if(s<step) el.classList.add('done');
    else if(s===step) el.classList.add('active');
  });
}

function navToStep(step){
  // From result page (6), allow going back to any step freely
  if(currentStep===6){
    collectStep(currentStep);
    if(step===4) buildSponsoringUI();
    if(step===5) buildUmsatzUI();
    showStep(step);
    return;
  }
  if(step>maxVisited+1) return;
  if(step>currentStep&&!validateStep(currentStep)) return;
  collectStep(currentStep);
  if(step===4) buildSponsoringUI();
  if(step===5) buildUmsatzUI();
  showStep(step);
}

function goTo(step){
  if(step>currentStep&&!validateStep(currentStep)) return;
  collectStep(currentStep);
  if(step===4) buildSponsoringUI();
  if(step===5) buildUmsatzUI();
  if(step>maxVisited) maxVisited=step;
  // Keep maxVisited at 6 so result step stays reachable
  if(currentStep===6&&step<6) maxVisited=6;
  showStep(step);
}

function showStep(step){
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('visible'));
  document.getElementById('step6').classList.remove('visible');
  const el=document.getElementById('step'+step);
  if(el) el.classList.add('visible');
  currentStep=step;
  updateProgress(step);
  if(step>=2) document.getElementById('liveBar').classList.add('visible');
  // Recalc-Banner auf allen Eingabe-Schritten zeigen, sobald einmal berechnet wurde
  const reCalcBanner = document.getElementById('recalcBanner');
  if(reCalcBanner) reCalcBanner.style.display = (maxVisited===6 && step<=5) ? 'flex' : 'none';
  // Werte aus State zurück ins DOM schreiben
  restoreStep(step);
  window.scrollTo({top:0,behavior:'smooth'});
}

function sv(id,val){const el=document.getElementById(id);if(el)el.value=val;}

function restoreStep(step){
  if(step===1){
    sv('vereinName',state.vereinName); sv('liga',state.liga); sv('sportart',state.sportart||'');
    sv('aussendienst',state.aussendienst); sv('verantwortlich',state.verantwortlich);
    sv('laufzeit',state.laufzeit);
    sv('haendlerName',state.haendlerName); sv('kdnrHaendler',state.kdnrHaendler||'');
    sv('kdnrVereinFreiware',state.kdnrVereinFreiware||''); sv('kdnrVereinNachkauf',state.kdnrVereinNachkauf||'');
    sv('haendlerNachkauf',state.haendlerNachkauf*100); sv('haendlerFreiware',state.haendlerFreiware*100);
    sv('haendlerErloesschmaelerung',state.haendlerErloesschmaelerung*100);
    sv('vereinNachkauf',state.vereinNachkauf*100); sv('vereinErloesschmaelerung',state.vereinErloesschmaelerung*100);
    sv('steuer',state.steuer*100);
  }
  if(step===2){
    sv('hekCosQuotient',state.hekCosQuotient); sv('uvpCosQuotient',state.uvpCosQuotient);
    // Quotient-Lock: Felder entsperren falls Werte von Standard abweichen
    const unlocked = state.hekCosQuotient!==2.5||state.uvpCosQuotient!==5.0;
    const cb=document.getElementById('quotientUnlock');
    const fields=document.getElementById('quotientFields');
    if(cb&&fields){cb.checked=unlocked;fields.classList.toggle('unlocked',unlocked);}
  }
  if(step===3){
    sv('qualVerein',state.qualVerein||''); sv('warumVerein',state.warumVerein||'');
    sv('qualHandel',state.qualHandel||''); sv('andereVereine',state.andereVereine||'');
    sv('umsatzPotenziale',state.umsatzPotenziale||'');
  }
}

function validateStep(step){
  if(step===1){
    let ok=true;
    let firstErr=null;
    const check=(id,invalid)=>{
      if(invalid){showErr(id);ok=false;if(!firstErr)firstErr=id;}else hideErr(id);
    };
    check('vereinName',!gv('vereinName'));
    check('liga',!gv('liga'));
    ['haendlerNachkauf','haendlerFreiware','haendlerErloesschmaelerung'].forEach(id=>{
      const v=parseFloat(normNum(document.getElementById(id)?.value));
      check(id,isNaN(v)||v<0||v>100);
    });
    if(!ok&&firstErr){
      const el=document.getElementById(firstErr);
      if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
    }
    return ok;
  }
  return true;
}
function showErr(id){const e=document.getElementById('err_'+id),i=document.getElementById(id);if(e)e.style.display='block';if(i)i.classList.add('err');}
function hideErr(id){const e=document.getElementById('err_'+id),i=document.getElementById(id);if(e)e.style.display='none';if(i)i.classList.remove('err');}

function collectStep(step){
  if(step===1){
    state.vereinName=gv('vereinName');state.liga=gv('liga');state.sportart=gv('sportart');
    state.aussendienst=gv('aussendienst');state.verantwortlich=gv('verantwortlich');
    state.laufzeit=parseInt(gv('laufzeit'));state.haendlerName=gv('haendlerName');
    state.kdnrVereinFreiware=gv('kdnrVereinFreiware');state.kdnrVereinNachkauf=gv('kdnrVereinNachkauf');
    state.kdnrHaendler=gv('kdnrHaendler');
    state.haendlerNachkauf=pfPct('haendlerNachkauf');state.haendlerFreiware=pfPct('haendlerFreiware');
    state.haendlerErloesschmaelerung=pfPct('haendlerErloesschmaelerung');
    state.vereinNachkauf=pfPct('vereinNachkauf');state.vereinErloesschmaelerung=pfPct('vereinErloesschmaelerung');
    state.steuer=pf('steuer')/100;
    state.years.forEach((yr,i)=>{const el=document.getElementById(`ligaLabel_${i}`);if(el)yr.ligaLabel=el.value;});
    initYears(state.laufzeit);
  }
  if(step===2){state.hekCosQuotient=pf('hekCosQuotient');state.uvpCosQuotient=pf('uvpCosQuotient');}
  if(step===3){
    state.qualVerein=gv('qualVerein');state.warumVerein=gv('warumVerein');
    state.qualHandel=gv('qualHandel');state.andereVereine=gv('andereVereine');
    state.umsatzPotenziale=gv('umsatzPotenziale');
  }
  if(step===4) collectSponsoringFromDOM();
  if(step===5) collectUmsatzFromDOM();
}

function gv(id){const el=document.getElementById(id);return el?el.value.trim():'';}
function normNum(v){return typeof v==='string'?v.replace(',','.'):v;}
function pf(id){const el=document.getElementById(id);return el?parseFloat(normNum(el.value))||0:0;}
function pfId(id){const el=document.getElementById(id);return el?parseFloat(normNum(el.value))||0:0;}
function pfPct(id){return pf(id)/100;}

// ── SPONSORING UI ──
function buildSponsoringUI(){
  const tabs=document.getElementById('yearTabsContainer'),panels=document.getElementById('yearPanelsContainer');
  if(tabs) tabs.style.display='none';
  panels.innerHTML='';
  state.years.forEach((yr,i)=>{
    const item=document.createElement('div');
    item.className='year-stack-item';
    item.id=`sp_panel_${i}`;
    item.innerHTML=`<div class="year-stack-label"><span>${yr.label}</span></div>${buildSponsoringPanel(i,yr)}`;
    panels.appendChild(item);
  });
}

function buildSponsoringPanel(i,yr){
  const spMode=state.sponsoringMode||'hek';
  const isHek=spMode==='hek';
  return`<div class="field-grid" style="margin-top:20px">
    <div class="field-group">
      <div class="field-label">Cash-Leistung (€) <span class="tip">i<span class="tip-box">Direkter Geldbetrag, den uhlsport dem Verein zahlt. Absolutbetrag eingeben.</span></span></div>
      <input type="number" id="sp_cash_${i}" value="${yr.cash}" min="0" placeholder="0">
    </div>
    <div class="field-group" id="sp_freiware_group_${i}">
      <div class="field-label">Freiware zu ${isHek?'HEK':'UVP'} (€) <span class="tip">i<span class="tip-box">Wert der Freiware zum ${isHek?'Händlereinkaufspreis (HEK)':'Endkundenpreis (UVP)'}. Absolutbetrag eingeben.</span></span></div>
      <input type="number" id="sp_freiwareHek_${i}" value="${yr.freiwareHek}" min="0" placeholder="0" ${isHek?'':'style="display:none"'}>
      <input type="number" id="sp_freiwareUvp_${i}" value="${yr.freiwareUvp}" min="0" placeholder="0" ${isHek?'style="display:none"':''}>
    </div>
  </div>`;
}
function collectSponsoringFromDOM(){
  state.years.forEach((yr,i)=>{yr.cash=pfId(`sp_cash_${i}`);yr.freiwareHek=pfId(`sp_freiwareHek_${i}`);yr.freiwareUvp=pfId(`sp_freiwareUvp_${i}`);});
}

// ── UMSATZ UI ──
// ── UMSATZ UI ──
function buildUmsatzUI(){
  const container=document.getElementById('umsatzYearAccordionsContainer');
  if(!container) return;
  container.innerHTML='';
  const chev=`<svg class="op-section-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="6 9 12 15 18 9"/></svg>`;
  const cats=[
    {key:'verein',    num:'01', title:'Verein — Direkter Nachkauf',      desc:'Direkter Nachkauf des Vereins',        build:buildUmsatzVereinPanel},
    {key:'hdirekt',   num:'02', title:'Fachhändler — Direktumsatz',      desc:'Direktumsatz & Freiware',              build:buildUmsatzHdirektPanel},
    {key:'hindirekt', num:'03', title:'Fachhändler — Indirekter Umsatz', desc:'Indirekter Händlerumsatz',             build:buildUmsatzHindirektPanel},
    {key:'sonstige',  num:'04', title:'Sonstige Kosten',                  desc:'Marketing, Logistik & weitere Kosten', build:buildUmsatzSonstigePanel},
  ];
  cats.forEach(cat=>{
    const panels=state.years.map((yr,i)=>`
      <div class="year-stack-item" id="umsatz_${cat.key}_panel_${i}">
        <div class="year-stack-label"><span>${yr.label}</span></div>
        ${cat.build(i,yr)}
      </div>`).join('');
    const sec=document.createElement('div');
    sec.className='op-section collapsed';
    sec.id=`umsatz_cat_${cat.key}`;
    sec.innerHTML=`
      <div class="op-section-header" onclick="toggleUmsatzCat('${cat.key}')">
        <div class="op-section-num">${cat.num}</div>
        <div class="op-section-title">${cat.title}</div>
        <div class="op-section-desc">${cat.desc}</div>
        ${chev}
      </div>
      <div class="op-section-body" id="umsatz_cat_body_${cat.key}" style="max-height:0;padding-top:0;padding-bottom:0">
        <div id="umsatz_panels_${cat.key}">${panels}</div>
      </div>`;
    container.appendChild(sec);
  });
  setTimeout(()=>state.years.forEach((_,i)=>updateUmsatzPreview(i)),0);
}

function toggleUmsatzCat(cat){
  const sec=document.getElementById('umsatz_cat_'+cat);
  const body=document.getElementById('umsatz_cat_body_'+cat);
  const isCollapsed=sec.classList.contains('collapsed');
  if(isCollapsed){
    sec.classList.remove('collapsed');
    body.style.paddingTop='';
    body.style.paddingBottom='';
    body.style.maxHeight=body.scrollHeight+'px';
    const onEnd=()=>{
      if(!sec.classList.contains('collapsed')) body.style.maxHeight='none';
      body.removeEventListener('transitionend',onEnd);
    };
    body.addEventListener('transitionend',onEnd);
  } else {
    if(body.style.maxHeight==='none'){
      body.style.maxHeight=body.scrollHeight+'px';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        sec.classList.add('collapsed');
        body.style.maxHeight='0';
      }));
    } else {
      sec.classList.add('collapsed');
      body.style.maxHeight='0';
    }
  }
}

function switchUmsatzTab(cat,idx){
  document.querySelectorAll('#umsatz_tabs_'+cat+' .year-tab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  document.querySelectorAll('#umsatz_panels_'+cat+' .year-panel').forEach((p,i)=>p.classList.toggle('visible',i===idx));
}

function buildUmsatzVereinPanel(i,yr){
  const mode=state.vereinMode||'hek';
  const isHek=mode==='hek';
  return`
  <div class="field-grid">
    <div class="field-group">
      <div class="field-label">Umsatz Verein zu ${isHek?'HEK':'UVP'} (€) <span class="tip">i<span class="tip-box">Erwarteter Bruttoumsatz des Vereins zum ${isHek?'HEK':'UVP'}. Davon werden Vereins-Rabatt, Erlösschmälerungen und Wareneinsatz abgezogen.</span></span></div>
      <input type="number" id="um_vereinHek_${i}" value="${yr.vereinUmsatzHek}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})" ${isHek?'':'style="display:none"'}>
      <input type="number" id="um_vereinUvp_${i}" value="${yr.vereinUmsatzUvp}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})" ${isHek?'style="display:none"':''}>
    </div>
  </div>
  <div class="calc-preview" id="prev_verein_${i}">
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Rabatt</div><div class="calc-preview-val neg" id="prev_verein_rabatt_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Erlösschm.</div><div class="calc-preview-val neg" id="prev_verein_erloess_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">Nettoumsatz</div><div class="calc-preview-val pos" id="prev_verein_netto_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Wareneinsatz (COS)</div><div class="calc-preview-val neg" id="prev_verein_cos_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">Deckungsbeitrag I</div><div class="calc-preview-val" id="prev_verein_db_${i}">–</div></div>
  </div>`;}

function buildUmsatzHdirektPanel(i,yr){
  const mode=state.haendlerMode||'hek';
  const isHek=mode==='hek';
  return`
  <div class="field-grid">
    <div class="field-group">
      <div class="field-label">Händler-Direkt zu ${isHek?'HEK':'UVP'} (€) <span class="tip">i<span class="tip-box">Umsatz des Fachhändlers mit dem Verein zu ${isHek?'HEK':'UVP'}. Abzüge: Nachkauf-Rabatt und Erlösschmälerungen.</span></span></div>
      <input type="number" id="um_hdirektHek_${i}" value="${yr.haendlerDirektHek}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})" ${isHek?'':'style="display:none"'}>
      <input type="number" id="um_hdirektUvp_${i}" value="${yr.haendlerDirektUvp}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})" ${isHek?'style="display:none"':''}>
    </div>
    <div class="field-group">
      <div class="field-label">Freiware Händler → Verein (HEK, €) <span class="tip">i<span class="tip-box">Ware, die der Händler aus seinem Freiwarenkontingent kostenlos an den Verein weitergibt. Bewertet zu HEK.</span></span></div>
      <input type="number" id="um_haendlerFreiwareHek_${i}" value="${yr.haendlerFreiwareHek}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})">
    </div>
  </div>
  <div class="calc-preview" id="prev_hdirekt_${i}">
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Rabatt</div><div class="calc-preview-val neg" id="prev_hd_rabatt_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Erlösschm.</div><div class="calc-preview-val neg" id="prev_hd_erloess_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">Nettoumsatz</div><div class="calc-preview-val pos" id="prev_hd_netto_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Wareneinsatz (COS)</div><div class="calc-preview-val neg" id="prev_hd_cos_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">Deckungsbeitrag I</div><div class="calc-preview-val" id="prev_hd_db_${i}">–</div></div>
  </div>`;}

function buildUmsatzHindirektPanel(i,yr){
  const mode=state.haendlerMode||'hek';
  const isHek=mode==='hek';
  return`
  <div class="field-grid">
    <div class="field-group">
      <div class="field-label">Indirekter Umsatz zu ${isHek?'HEK':'UVP'} (€) <span class="tip">i<span class="tip-box">Umsätze, die der Händler durch diesen Deal zusätzlich mit anderen Vereinen oder Endkunden generiert.</span></span></div>
      <input type="number" id="um_hindirektHek_${i}" value="${yr.haendlerIndirektHek}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})" ${isHek?'':'style="display:none"'}>
      <input type="number" id="um_hindirektUvp_${i}" value="${yr.haendlerIndirektUvp}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})" ${isHek?'style="display:none"':''}>
    </div>
  </div>
  <div class="calc-preview" id="prev_hindirekt_${i}">
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Rabatt</div><div class="calc-preview-val neg" id="prev_hi_rabatt_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Erlösschm.</div><div class="calc-preview-val neg" id="prev_hi_erloess_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">Nettoumsatz</div><div class="calc-preview-val pos" id="prev_hi_netto_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Wareneinsatz (COS)</div><div class="calc-preview-val neg" id="prev_hi_cos_${i}">–</div></div>
    <div class="calc-preview-cell"><div class="calc-preview-lbl">Deckungsbeitrag I</div><div class="calc-preview-val" id="prev_hi_db_${i}">–</div></div>
  </div>`;}

function buildUmsatzSonstigePanel(i,yr){
  return`
  <div class="field-grid cols-3">
    <div class="field-group">
      <div class="field-label">Marketingkosten (€) <span class="tip">i<span class="tip-box">Kosten für Marketing-Maßnahmen rund um den Vertrag.</span></span></div>
      <input type="number" id="um_marketing_${i}" value="${yr.marketingkosten}" min="0" placeholder="0">
    </div>
    <div class="field-group">
      <div class="field-label">Logistikkosten (€) <span class="tip">i<span class="tip-box">Versand-, Lager- und Logistikkosten für diesen Deal.</span></span></div>
      <input type="number" id="um_logistik_${i}" value="${yr.logistikkosten}" min="0" placeholder="0">
    </div>
    <div class="field-group">
      <div class="field-label">Sonstige Kosten (€) <span class="tip">i<span class="tip-box">Alle weiteren Kosten, die nicht in die anderen Kategorien passen.</span></span></div>
      <input type="number" id="um_sonstige_${i}" value="${yr.sonstigeKosten}" min="0" placeholder="0">
    </div>
  </div>`;}

// setUmsatzMode removed — mode is now global per category (setGlobalMode)

function setGlobalMode(cat, mode, btn) {
  if(cat==='verein') state.vereinMode=mode;
  else if(cat==='haendler') state.haendlerMode=mode;
  else if(cat==='sponsoring') state.sponsoringMode=mode;
  const toggle = btn.closest('.mode-toggle');
  toggle.querySelectorAll('button').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  buildUmsatzUI();
  buildSponsoringUI();
  // Re-measure open Sponsoring section
  const sec4 = document.getElementById('sec4');
  const body4 = document.getElementById('sec4-body');
  if (sec4 && body4 && !sec4.classList.contains('collapsed')) {
    setTimeout(() => { body4.style.maxHeight = body4.scrollHeight + 'px'; }, 100);
  }
}

function buildLigaLabelSection() {
  const container = document.getElementById('ligaLabelContainer');
  if (!container) return;
  container.innerHTML = state.years.map((yr, i) => `
    <div class="field-group">
      <div class="field-label">${yr.label} – Liga</div>
      <input type="text" id="ligaLabel_${i}" value="${yr.ligaLabel||''}" placeholder="z. B. Bundesliga">
    </div>
  `).join('');
}
function collectUmsatzFromDOM(){
  state.years.forEach((yr,i)=>{
    yr.vereinUmsatzHek=pfId(`um_vereinHek_${i}`);yr.vereinUmsatzUvp=pfId(`um_vereinUvp_${i}`);
    yr.haendlerDirektHek=pfId(`um_hdirektHek_${i}`);yr.haendlerDirektUvp=pfId(`um_hdirektUvp_${i}`);
    yr.haendlerFreiwareHek=pfId(`um_haendlerFreiwareHek_${i}`);
    yr.haendlerIndirektHek=pfId(`um_hindirektHek_${i}`);yr.haendlerIndirektUvp=pfId(`um_hindirektUvp_${i}`);
    yr.marketingkosten=pfId(`um_marketing_${i}`);yr.logistikkosten=pfId(`um_logistik_${i}`);yr.sonstigeKosten=pfId(`um_sonstige_${i}`);
  });
}

function updateUmsatzPreview(i){
  try{
    const hek = parseFloat(normNum(document.getElementById('hekCosQuotient')?.value)) || state.hekCosQuotient;
    const uvp = parseFloat(normNum(document.getElementById('uvpCosQuotient')?.value)) || state.uvpCosQuotient;
    const cosR = 1/hek;
    const steuer = (parseFloat(normNum(document.getElementById('steuer')?.value))||0)/100;
    const vN = (parseFloat(normNum(document.getElementById('vereinNachkauf')?.value))||0)/100;
    const vE = (parseFloat(normNum(document.getElementById('vereinErloesschmaelerung')?.value))||0)/100;
    const hN = (parseFloat(normNum(document.getElementById('haendlerNachkauf')?.value))||0)/100;
    const hE = (parseFloat(normNum(document.getElementById('haendlerErloesschmaelerung')?.value))||0)/100;
    const hFR = (parseFloat(normNum(document.getElementById('haendlerFreiware')?.value))||0)/100;
    const yr = state.years[i] || {};
    const fmtP = n => n===0?'–':new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
    const setV = (id,val,pos) => {
      const el=document.getElementById(id); if(!el) return;
      el.textContent=fmtP(val);
      if(pos!==undefined){ el.className='calc-preview-val'+(val>0&&pos?' pos':val<0?' neg':''); }
    };

    // Verein
    const vMode = state.vereinMode||'hek';
    const vH = pfId(`um_vereinHek_${i}`)||(vMode==='hek'?yr.vereinUmsatzHek||0:0);
    const vU = pfId(`um_vereinUvp_${i}`)||(vMode==='uvp'?yr.vereinUmsatzUvp||0:0);
    const vB = vMode==='hek'?vH:vU;
    let vRab,vErl,vNetto,vCos;
    if(vMode==='hek'){
      vRab=vB*vN; vErl=(vB-vRab)*vE; vNetto=vB-vRab-vErl; vCos=vB/hek;
    } else {
      const vNachRabatt=vB*(1-vN); const vNachSteuer=vNachRabatt/(1+steuer);
      vErl=vNachSteuer*vE; vNetto=vNachSteuer*(1-vE); vRab=vB-vNachRabatt; vCos=vB/uvp;
    }
    const vDB = vNetto-vCos;
    setV(`prev_verein_rabatt_${i}`, vB>0?-vRab:0);
    setV(`prev_verein_erloess_${i}`, vB>0?-vErl:0);
    setV(`prev_verein_netto_${i}`, vNetto);
    setV(`prev_verein_cos_${i}`, vB>0?-vCos:0);
    setV(`prev_verein_db_${i}`, vB>0?vDB:0, true);

    // Händler direkt: netto = (direktUmsatz_net + FW_net) * (1 - hE)
    const hdMode = state.haendlerMode||'hek';
    const hdH = pfId(`um_hdirektHek_${i}`)||(hdMode==='hek'?yr.haendlerDirektHek||0:0);
    const hdU = pfId(`um_hdirektUvp_${i}`)||(hdMode==='uvp'?yr.haendlerDirektUvp||0:0);
    const hdFw = pfId(`um_haendlerFreiwareHek_${i}`)||yr.haendlerFreiwareHek||0;
    const hdB = hdMode==='hek'?hdH:hdU;
    let hdDirektNet;
    if(hdMode==='hek'){hdDirektNet=hdB*(1-hN);}
    else{hdDirektNet=hdB*(1-hN)/(1+steuer);}
    const hdFwNet=hdFw*(1-hFR);
    const hdBasis=hdDirektNet+hdFwNet;
    const hdErl=hdBasis*hE; const hdNetto=hdBasis*(1-hE);
    let hdCos;
    if(hdMode==='hek'){hdCos=(hdB+hdFw)/hek;}
    else{hdCos=hdB/uvp+hdFw/hek;}
    const hdRab=hdB*hN;
    const hdDB=hdNetto-hdCos;
    setV(`prev_hd_rabatt_${i}`, hdB>0?-hdRab:0);
    setV(`prev_hd_erloess_${i}`, (hdB>0||hdFw>0)?-hdErl:0);
    setV(`prev_hd_netto_${i}`, hdNetto);
    setV(`prev_hd_cos_${i}`, (hdB>0||hdFw>0)?-hdCos:0);
    setV(`prev_hd_db_${i}`, (hdB>0||hdFw>0)?hdDB:0, true);

    // Händler indirekt
    const hiMode = state.haendlerMode||'hek';
    const hiH = pfId(`um_hindirektHek_${i}`)||(hiMode==='hek'?yr.haendlerIndirektHek||0:0);
    const hiU = pfId(`um_hindirektUvp_${i}`)||(hiMode==='uvp'?yr.haendlerIndirektUvp||0:0);
    const hiB = hiMode==='hek'?hiH:hiU;
    let hiRab,hiErl,hiNetto,hiCos;
    if(hiMode==='hek'){
      hiRab=hiB*hN; hiErl=(hiB-hiRab)*hE; hiNetto=hiB-hiRab-hiErl; hiCos=hiB/hek;
    } else {
      const hiNachRabatt=hiB*(1-hN); const hiNachSteuer=hiNachRabatt/(1+steuer);
      hiErl=hiNachSteuer*hE; hiNetto=hiNachSteuer*(1-hE); hiRab=hiB-hiNachRabatt; hiCos=hiB/uvp;
    }
    const hiDB=hiNetto-hiCos;
    setV(`prev_hi_rabatt_${i}`, hiB>0?-hiRab:0);
    setV(`prev_hi_erloess_${i}`, hiB>0?-hiErl:0);
    setV(`prev_hi_netto_${i}`, hiNetto);
    setV(`prev_hi_cos_${i}`, hiB>0?-hiCos:0);
    setV(`prev_hi_db_${i}`, hiB>0?hiDB:0, true);
  }catch(e){}
}

function switchTab(prefix,idx){
  const tId=prefix==='sp'?'yearTabsContainer':'umsatzYearTabsContainer';
  const pId=prefix==='sp'?'yearPanelsContainer':'umsatzYearPanelsContainer';
  document.querySelectorAll('#'+tId+' .year-tab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  document.querySelectorAll('#'+pId+' .year-panel').forEach((p,i)=>p.classList.toggle('visible',i===idx));
}

// ── CALCULATION ──
function berechnen(){
  collectStep(3);
  collectStep(5);
  const s=state;
  const hek=s.hekCosQuotient, uvp=s.uvpCosQuotient;
  const steuer=s.steuer||0;
  const vMode=s.vereinMode||'hek', hdMode=s.haendlerMode||'hek', spMode=s.sponsoringMode||'hek';
  const results=s.years.map(yr=>{
    const cashCost=yr.cash;
    const fwH=yr.freiwareHek, fwU=yr.freiwareUvp;
    const freiwareCosVal=spMode==='hek'?fwH/hek:fwU/uvp;
    const sponsoringInvest=cashCost+freiwareCosVal;

    // Verein
    const vB=vMode==='hek'?yr.vereinUmsatzHek:yr.vereinUmsatzUvp;
    let vereinRabatt,vereinErloess,vereinNetto,vereinCos;
    if(vMode==='hek'){
      vereinRabatt=vB*s.vereinNachkauf; vereinErloess=(vB-vereinRabatt)*s.vereinErloesschmaelerung;
      vereinNetto=vB-vereinRabatt-vereinErloess; vereinCos=vB/hek;
    } else {
      const vNachRabatt=vB*(1-s.vereinNachkauf); const vNachSteuer=vNachRabatt/(1+steuer);
      vereinErloess=vNachSteuer*s.vereinErloesschmaelerung; vereinNetto=vNachSteuer*(1-s.vereinErloesschmaelerung);
      vereinRabatt=vB-vNachRabatt; vereinCos=vB/uvp;
    }
    const vereinDB1=vereinNetto-vereinCos;

    // Händler direkt
    const hdB=hdMode==='hek'?yr.haendlerDirektHek:yr.haendlerDirektUvp;
    const hdFw=yr.haendlerFreiwareHek;
    let hdDirektNet;
    if(hdMode==='hek'){hdDirektNet=hdB*(1-s.haendlerNachkauf);}
    else{hdDirektNet=hdB*(1-s.haendlerNachkauf)/(1+steuer);}
    const hdFwNet=hdFw*(1-s.haendlerFreiware);
    const hdBasis=hdDirektNet+hdFwNet;
    const hdErloess=hdBasis*s.haendlerErloesschmaelerung; const hdNetto=hdBasis*(1-s.haendlerErloesschmaelerung);
    let hdCos;
    if(hdMode==='hek'){hdCos=(hdB+hdFw)/hek;}
    else{hdCos=hdB/uvp+hdFw/hek;}
    const hdDB1=hdNetto-hdCos;

    // Händler indirekt
    const hiB=hdMode==='hek'?yr.haendlerIndirektHek:yr.haendlerIndirektUvp;
    let hiRabatt,hiErloess,hiNetto,hiCos;
    if(hdMode==='hek'){
      hiRabatt=hiB*s.haendlerNachkauf; hiErloess=(hiB-hiRabatt)*s.haendlerErloesschmaelerung;
      hiNetto=hiB-hiRabatt-hiErloess; hiCos=hiB/hek;
    } else {
      const hiNachRabatt=hiB*(1-s.haendlerNachkauf); const hiNachSteuer=hiNachRabatt/(1+steuer);
      hiErloess=hiNachSteuer*s.haendlerErloesschmaelerung; hiNetto=hiNachSteuer*(1-s.haendlerErloesschmaelerung);
      hiRabatt=hiB-hiNachRabatt; hiCos=hiB/uvp;
    }
    const hiDB1=hiNetto-hiCos;

    const sonstige=yr.marketingkosten+yr.logistikkosten+yr.sonstigeKosten;
    const gesamtNetto=vereinNetto+hdNetto+hiNetto;
    const gesamtDB=vereinDB1+hdDB1+hiDB1-sponsoringInvest-sonstige;
    const dbQuote=gesamtNetto>0?gesamtDB/gesamtNetto:0;
    return{label:yr.label,cashCost,freiwareCos:freiwareCosVal,sponsoringInvest,vereinNetto,vereinCos,vereinDB1,hdNetto,hdCos,hdDB1,hiNetto,hiCos,hiDB1,sonstige,gesamtNetto,gesamtDB,dbQuote};
  });
  const totalNetto=results.reduce((a,r)=>a+r.gesamtNetto,0);
  const totalInvest=results.reduce((a,r)=>a+r.sponsoringInvest+r.sonstige,0);
  const totalDB=results.reduce((a,r)=>a+r.gesamtDB,0);
  const totalDbQuote=totalNetto>0?totalDB/totalNetto:0;
  renderResult(results,totalNetto,totalInvest,totalDB,totalDbQuote);
}

// ── RENDER RESULT ──
function renderResult(results,totalNetto,totalInvest,totalDB,totalDbQuote){
  // Tier: pos = DB-Quote > 30%, warn = 20-30%, neg = < 20%
  const tier = totalDbQuote>=0.30 ? 'pos' : totalDbQuote>=0.20 ? 'warn' : 'neg';
  const pos = tier==='pos';
  const memePos='https://media.giphy.com/media/fDbzXb6Cv5L56/giphy.gif';
  const memeWarn='https://media.giphy.com/media/fyitaOqckoJX9k9tf2/giphy.gif';
  const memeNeg='https://media.giphy.com/media/kCoIap1RrUqE1f0fKu/giphy.gif';
  const meme = tier==='pos'?memePos:tier==='warn'?memeWarn:memeNeg;
  const yearCols=results.map(r=>`<th>${r.label}</th>`).join('');
  const totalCol=results.length>1?'<th>Gesamt</th>':'';
  const cols=results.length+(results.length>1?2:1);

  function row(label,fn,bold=false,sub=false){
    const cells=results.map(r=>{const v=fn(r);return`<td class="${v<0?'v-neg':v>0?'v-pos':''}">${fmt(v)}</td>`;}).join('');
    const tot=results.reduce((a,r)=>a+fn(r),0);
    const totTd=results.length>1?`<td class="${tot<0?'v-neg':tot>0?'v-pos':''}">${fmt(tot)}</td>`:'';
    const labelHtml=sub?`<span style="padding-left:14px;color:var(--gray-400);font-size:12px">${label}</span>`:label;
    return`<tr class="${bold?'total':''}" style="${sub?'background:var(--gray-50)':''}"><td>${labelHtml}</td>${cells}${totTd}</tr>`;
  }
  function rowPct(label,fn,sub=false,totalOverride=null){
    const cells=results.map(r=>{const v=fn(r);const col=v<0?'var(--red)':'var(--gray-400)';return`<td style="color:${col};font-family:var(--font-mono)">${(v*100).toFixed(1)}%</td>`;}).join('');
    // Use explicit override if provided, otherwise average of year values
    const totFnVal = totalOverride !== null ? totalOverride : results.reduce((a,r)=>a+fn(r),0)/results.length;
    const totCol=totFnVal<0?'var(--red)':'var(--gray-400)';
    const totTd=results.length>1?`<td style="color:${totCol};font-family:var(--font-mono)">${(totFnVal*100).toFixed(1)}%</td>`:'';
    const labelHtml=sub?`<span style="padding-left:14px;color:var(--gray-400);font-size:12px">${label}</span>`:label;
    return`<tr style="${sub?'background:var(--gray-50)':''}"><td>${labelHtml}</td>${cells}${totTd}</tr>`;
  }

  const hasQual=state.qualVerein||state.warumVerein||state.qualHandel||state.andereVereine||state.umsatzPotenziale;
  const qualBlock=hasQual?`
    <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Qualitative Einschätzung</div><div class="section-head-line"></div></div>
    <div class="qual-grid">
      ${state.qualVerein?`<div class="qual-cell span-2"><div class="qual-cell-label">Qualitative Beurteilung Verein</div><div class="qual-cell-text">${esc(state.qualVerein)}</div></div>`:''}
      ${state.warumVerein?`<div class="qual-cell"><div class="qual-cell-label">Warum dieser Verein?</div><div class="qual-cell-text">${esc(state.warumVerein)}</div></div>`:''}
      ${state.qualHandel?`<div class="qual-cell"><div class="qual-cell-label">Qualitative Beurteilung Fachhandel</div><div class="qual-cell-text">${esc(state.qualHandel)}</div></div>`:''}
      ${state.andereVereine?`<div class="qual-cell"><div class="qual-cell-label">Andere Vereine beim Händler</div><div class="qual-cell-text">${esc(state.andereVereine)}</div></div>`:''}
      ${state.umsatzPotenziale?`<div class="qual-cell span-2"><div class="qual-cell-label">Zusätzliche Umsatzpotenziale</div><div class="qual-cell-text">${esc(state.umsatzPotenziale)}</div></div>`:''}
    </div>`:'';

  document.getElementById('resultContent').innerHTML=`
    <div class="result-verdict ${tier}">
      <div class="verdict-icon">${tier==='pos'?'🏆':tier==='warn'?'🤔':'🚨'}</div>
      <div class="verdict-text">
        <h2>${tier==='pos'?'Deal empfehlenswert':tier==='warn'?'Deal prüfungswürdig':'Deal nicht empfehlenswert'}</h2>
        <p>${tier==='pos'?`DB-Quote über 30% – Deal ist wirtschaftlich.`:tier==='warn'?`DB-Quote zwischen 20–30% – Rücksprache erforderlich.`:`DB-Quote unter 20% – nur im Ausnahmefall genehmigungsfähig.`} DB: ${fmt(totalDB)} · DB-Quote: ${(totalDbQuote*100).toFixed(1)}%</p>
      </div>
    </div>

    <div class="meme-wrap">
      <img src="${meme}" alt="Reaction">
      <div class="meme-cap">${tier==='pos'?'"Let\'s close this deal." 🤝':tier==='warn'?'"Bof… on verra." 🤷':'"Walk away from this one." 🙅'}</div>
    </div>

    <div class="kpi-strip">
      <div class="kpi-cell"><div class="kpi-lbl">Nettoumsatz</div><div class="kpi-val ${totalNetto>0?'pos':''}">${fmtK(totalNetto)}</div></div>
      <div class="kpi-cell"><div class="kpi-lbl">Invest</div><div class="kpi-val neg">${fmtK(-totalInvest)}</div></div>
      <div class="kpi-cell"><div class="kpi-lbl">Deckungsbeitrag</div><div class="kpi-val ${tier==='neg'?'neg':'pos'}">${fmtK(totalDB)}</div></div>
    </div>

    <div class="section-head"><div class="section-head-line"></div><div class="section-head-label">Detailergebnis je Jahr</div><div class="section-head-line"></div></div>
    <div style="overflow-x:auto">
    <table class="rtable">
      <thead><tr><th>Position</th>${yearCols}${totalCol}</tr></thead>
      <tbody>
        <tr class="section-head-row"><td colspan="${cols}">Sponsoring-Invest</td></tr>
        ${row('Cash-Leistung',r=>-r.cashCost)}
        ${row('Freiware (zu COS bewertet)',r=>-r.freiwareCos)}
        ${row('Gesamt Sponsoring-Invest (COS)',r=>-r.sponsoringInvest,true)}
        <tr class="tbl-spacer"><td colspan="${cols}"></td></tr>

        <tr class="section-head-row"><td colspan="${cols}">Umsatz Verein direkt</td></tr>
        ${row('Nettoumsatz Verein',r=>r.vereinNetto)}
        ${row('./. Wareneinsatz (COS)',r=>-r.vereinCos,false,true)}
        ${rowPct('Wareneinsatz / Nettoumsatz',r=>r.vereinNetto?-r.vereinCos/r.vereinNetto:0,true)}
        ${row('DB I Verein',r=>r.vereinDB1)}
        ${rowPct('DB I / Nettoumsatz',r=>r.vereinNetto?r.vereinDB1/r.vereinNetto:0,true)}
        <tr class="tbl-spacer"><td colspan="${cols}"></td></tr>

        <tr class="section-head-row"><td colspan="${cols}">Umsatz Fachhändler direkt</td></tr>
        ${row('Nettoumsatz Händler direkt',r=>r.hdNetto)}
        ${row('./. Wareneinsatz (COS)',r=>-r.hdCos,false,true)}
        ${rowPct('Wareneinsatz / Nettoumsatz',r=>r.hdNetto?-r.hdCos/r.hdNetto:0,true)}
        ${row('DB I Händler direkt',r=>r.hdDB1)}
        ${rowPct('DB I / Nettoumsatz',r=>r.hdNetto?r.hdDB1/r.hdNetto:0,true)}
        <tr class="tbl-spacer"><td colspan="${cols}"></td></tr>

        <tr class="section-head-row"><td colspan="${cols}">Umsatz Fachhändler indirekt</td></tr>
        ${row('Nettoumsatz Händler indirekt',r=>r.hiNetto)}
        ${row('./. Wareneinsatz (COS)',r=>-r.hiCos,false,true)}
        ${rowPct('Wareneinsatz / Nettoumsatz',r=>r.hiNetto?-r.hiCos/r.hiNetto:0,true)}
        ${row('DB I Händler indirekt',r=>r.hiDB1)}
        ${rowPct('DB I / Nettoumsatz',r=>r.hiNetto?r.hiDB1/r.hiNetto:0,true)}
        <tr class="tbl-spacer"><td colspan="${cols}"></td></tr>

        <tr class="section-head-row"><td colspan="${cols}">Sonstige Kosten</td></tr>
        ${row('Sonstige Kosten gesamt',r=>-r.sonstige)}
        <tr class="tbl-spacer"><td colspan="${cols}"></td></tr>

        <tr class="section-head-row section-head-row--total"><td colspan="${cols}" style="color:#fff">Gesamtergebnis</td></tr>
        ${row('Nettoumsatz gesamt',r=>r.gesamtNetto,true)}
        ${row('Deckungsbeitrag gesamt',r=>r.gesamtDB,true)}
        ${rowPct('DB-Quote',r=>r.dbQuote,false,totalDbQuote)}
      </tbody>
    </table>
    </div>

    ${qualBlock}

    <div class="info-strip">
      <div class="info-strip-section">
        <div class="info-strip-heading">Verein</div>
        <div class="info-strip-grid">
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Name</div>
            <div class="info-strip-val">${state.vereinName||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Liga</div>
            <div class="info-strip-val">${state.liga||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Sportart</div>
            <div class="info-strip-val">${state.sportart||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Laufzeit</div>
            <div class="info-strip-val">${state.laufzeit} Jahr${state.laufzeit>1?'e':''}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Kdnr. Freiware</div>
            <div class="info-strip-val">${state.kdnrVereinFreiware||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Kdnr. Nachkauf</div>
            <div class="info-strip-val">${state.kdnrVereinNachkauf||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Nachkauf-Kondition</div>
            <div class="info-strip-val">${(state.vereinNachkauf*100).toFixed(1)}%</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Erlösschmälerungen</div>
            <div class="info-strip-val">${(state.vereinErloesschmaelerung*100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
      <div class="info-strip-section">
        <div class="info-strip-heading">Fachhändler</div>
        <div class="info-strip-grid">
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Name</div>
            <div class="info-strip-val">${state.haendlerName||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Kundennummer</div>
            <div class="info-strip-val">${state.kdnrHaendler||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Nachkauf-Kondition</div>
            <div class="info-strip-val">${(state.haendlerNachkauf*100).toFixed(1)}%</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Einkauf Freiware</div>
            <div class="info-strip-val">${(state.haendlerFreiware*100).toFixed(1)}%</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Erlösschmälerungen</div>
            <div class="info-strip-val">${(state.haendlerErloesschmaelerung*100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
      <div class="info-strip-section">
        <div class="info-strip-heading">Intern</div>
        <div class="info-strip-grid">
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Außendienst</div>
            <div class="info-strip-val">${state.aussendienst||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">Umsatzverantwortlich</div>
            <div class="info-strip-val">${state.verantwortlich||'–'}</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">HEK/COS-Quotient</div>
            <div class="info-strip-val">${state.hekCosQuotient}x</div>
          </div>
          <div class="info-strip-cell">
            <div class="info-strip-lbl">UVP/COS-Quotient</div>
            <div class="info-strip-val">${state.uvpCosQuotient}x</div>
          </div>
        </div>
      </div>
    </div>

    <div class="edit-panel">
      <div class="edit-panel-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" style="vertical-align:-1px;margin-right:6px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Werte anpassen — Schritt direkt öffnen
      </div>
      <div class="edit-btns">
        <button class="edit-btn" onclick="navToStep(1)"><span class="edit-btn-n">1</span>Stammdaten</button>
        <button class="edit-btn" onclick="navToStep(2)"><span class="edit-btn-n">2</span>Quotienten</button>
        <button class="edit-btn" onclick="navToStep(3)"><span class="edit-btn-n">3</span>Qualitativ</button>
        <button class="edit-btn" onclick="navToStep(4)"><span class="edit-btn-n">4</span>Sponsoring</button>
        <button class="edit-btn" onclick="navToStep(5)"><span class="edit-btn-n">5</span>Umsätze</button>
      </div>
    </div>`;

  document.querySelectorAll('.card').forEach(c=>c.classList.remove('visible'));
  document.getElementById('step6').classList.add('visible');
  maxVisited=6;
  updateProgress(6);
  updateLiveBar(totalNetto,totalInvest,totalDB,totalDbQuote,true);
  window._lastResults=results;
  window._lastTotals={netto:totalNetto,invest:totalInvest,db:totalDB,dbQuote:totalDbQuote};
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── FORMATTING ──
function fmt(n){if(n===0)return'–';return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);}
function fmtK(n){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}

// ── LIVE BAR ──
function updateLiveBar(netto,invest,db,dbq,calculated){
  const elN=document.getElementById('liveNetto'),elI=document.getElementById('liveInvest');
  const elD=document.getElementById('liveDB'),elQ=document.getElementById('liveDBQ');
  const badge=document.getElementById('liveVerdict');
  if(!calculated){
    [elN,elI,elD,elQ].forEach(e=>{e.textContent='–';e.className='live-pill-value';});
    badge.className='live-verdict';badge.textContent='In Bearbeitung';return;
  }
  elN.textContent=fmtK(netto);elN.className='live-pill-value'+(netto>0?' active':'');
  elI.textContent=fmtK(-invest);elI.className='live-pill-value neg';
  const liveTier=dbq>=0.30?'pos':dbq>=0.20?'warn':'neg';
  elD.textContent=fmtK(db);elD.className='live-pill-value'+(liveTier==='neg'?' neg':' pos');
  elQ.textContent=(dbq*100).toFixed(1)+'%';elQ.className='live-pill-value'+(liveTier==='neg'?' neg':' pos');
  badge.className='live-verdict '+liveTier;
  badge.textContent=liveTier==='pos'?'✓ Deal positiv':liveTier==='warn'?'⚠ Prüfung erforderlich':'✗ Deal ablehnen';
}

function liveEstimate(){
  if(maxVisited<2) return;
  try{
    const hek=parseFloat(document.getElementById('hekCosQuotient')?.value||state.hekCosQuotient);
    const uvp=parseFloat(document.getElementById('uvpCosQuotient')?.value||state.uvpCosQuotient);
    const cosR=1/hek;
    const steuer=(parseFloat(document.getElementById('steuer')?.value)||0)/100;
    const hN=(parseFloat(document.getElementById('haendlerNachkauf')?.value)||0)/100;
    const hE=(parseFloat(document.getElementById('haendlerErloesschmaelerung')?.value)||0)/100;
    const hFR=(parseFloat(document.getElementById('haendlerFreiware')?.value)||0)/100;
    const vN=(parseFloat(document.getElementById('vereinNachkauf')?.value)||0)/100;
    const vE=(parseFloat(document.getElementById('vereinErloesschmaelerung')?.value)||0)/100;
    const vMode=state.vereinMode||'hek';
    const hdMode=state.haendlerMode||'hek';
    const spMode=state.sponsoringMode||'hek';
    let tN=0,tI=0,tD=0;
    const n=state.years.length||state.laufzeit;
    for(let i=0;i<n;i++){
      const yr=state.years[i]||{};
      const cash=pfId(`sp_cash_${i}`)||yr.cash||0;
      const fwH=pfId(`sp_freiwareHek_${i}`)||yr.freiwareHek||0;
      const fwU=pfId(`sp_freiwareUvp_${i}`)||yr.freiwareUvp||0;
      const spI=cash+(spMode==='hek'?fwH/hek:fwU/uvp);
      const vH=(pfId(`um_vereinHek_${i}`)||(vMode==='hek'?yr.vereinUmsatzHek||0:0));
      const vU=(pfId(`um_vereinUvp_${i}`)||(vMode==='uvp'?yr.vereinUmsatzUvp||0:0));
      const vB=vMode==='hek'?vH:vU;
      let vNt,vD;
      if(vMode==='hek'){vNt=vB*(1-vN)*(1-vE);vD=vNt-vB/hek;}
      else{const vNR=vB*(1-vN)/(1+steuer);vNt=vNR*(1-vE);vD=vNt-vB/uvp;}
      const hdH=(pfId(`um_hdirektHek_${i}`)||(hdMode==='hek'?yr.haendlerDirektHek||0:0));
      const hdU=(pfId(`um_hdirektUvp_${i}`)||(hdMode==='uvp'?yr.haendlerDirektUvp||0:0));
      const hdFwL=(pfId(`um_haendlerFreiwareHek_${i}`)||yr.haendlerFreiwareHek||0);
      const hdB=hdMode==='hek'?hdH:hdU;
      let hdDirNet; if(hdMode==='hek'){hdDirNet=hdB*(1-hN);}else{hdDirNet=hdB*(1-hN)/(1+steuer);}
      const hdFwNet2=hdFwL*(1-hFR); const hdBasis2=hdDirNet+hdFwNet2;
      const hdNt=hdBasis2*(1-hE); let hdCos2; if(hdMode==='hek'){hdCos2=(hdB+hdFwL)/hek;}else{hdCos2=hdB/uvp+hdFwL/hek;}
      const hdD=hdNt-hdCos2;
      const hiH=(pfId(`um_hindirektHek_${i}`)||(hdMode==='hek'?yr.haendlerIndirektHek||0:0));
      const hiU=(pfId(`um_hindirektUvp_${i}`)||(hdMode==='uvp'?yr.haendlerIndirektUvp||0:0));
      const hiB=hdMode==='hek'?hiH:hiU;
      let hiNt,hiD;
      if(hdMode==='hek'){hiNt=hiB*(1-hN)*(1-hE);hiD=hiNt-hiB/hek;}
      else{const hiNR=hiB*(1-hN)/(1+steuer);hiNt=hiNR*(1-hE);hiD=hiNt-hiB/uvp;}
      const so=(pfId(`um_marketing_${i}`)||yr.marketingkosten||0)+(pfId(`um_logistik_${i}`)||yr.logistikkosten||0)+(pfId(`um_sonstige_${i}`)||yr.sonstigeKosten||0);
      tN+=vNt+hdNt+hiNt;tI+=spI+so;tD+=vD+hdD+hiD-spI-so;
    }
    const dbq=tN>0?tD/tN:0;
    updateLiveBar(tN,tI,tD,dbq,true);
  }catch(e){}
}

function exportPDF(){
  const slug = s => (s||'').trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-äöüß]/g,'').replace(/--+/g,'-');
  const verein = slug(state.vereinName) || 'verein';
  const verdict = (window._lastTotals && window._lastTotals.db >= 0) ? 'good' : 'bad';
  const filename = `uhlsport-ausruestungsvertrag_${verein}_${verdict}`;
  const prev = document.title;
  document.title = filename;
  window.print();
  document.title = prev;
}

function restart(){
  currentStep=1;maxVisited=1;
  // Vollständigen State zurücksetzen
  Object.assign(state,{
    vereinName:'',liga:'',sportart:'',aussendienst:'',verantwortlich:'',laufzeit:3,
    haendlerName:'',kdnrVereinFreiware:'',kdnrVereinNachkauf:'',kdnrHaendler:'',
    haendlerNachkauf:0.3,haendlerFreiware:0.4,haendlerErloesschmaelerung:0.08,
    vereinNachkauf:0,vereinErloesschmaelerung:0,
    hekCosQuotient:2.5,uvpCosQuotient:5.0,
    vereinMode:'uvp',haendlerMode:'hek',sponsoringMode:'hek',steuer:0,
    qualVerein:'',warumVerein:'',qualHandel:'',andereVereine:'',umsatzPotenziale:''
  });
  initYearsFresh(3);
  document.getElementById('step6').classList.remove('visible');
  document.getElementById('step1').classList.add('visible');
  updateProgress(1);
  updateLiveBar(0,0,0,0,false);
  document.getElementById('liveBar').classList.remove('visible');
  window.scrollTo({top:0,behavior:'smooth'});
}

initYearsFresh(3);
document.addEventListener('input',()=>{if(maxVisited>=2)liveEstimate();});

// Normalize commas to dots in all decimal number inputs
document.querySelectorAll('input[type="number"][step]').forEach(inp=>{
  inp.addEventListener('input',function(){
    if(this.value.includes(',')){
      this.value=this.value.replace(',','.');
    }
  });
});


// ── EMAIL MODAL ──
let emailRecipients = [];

function openEmailModal() {
  emailRecipients = [];
  renderTags();
  document.getElementById('emailRawInput').value = '';
  document.getElementById('emailErr').classList.remove('show');
  document.getElementById('emailErr').textContent = '';
  document.getElementById('emailSendBtn').classList.remove('sending');
  document.getElementById('emailSendBtn').disabled = false;
  document.getElementById('emailModalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('emailRawInput').focus(), 100);
}

function closeEmailModal(e) {
  if (e && e.target !== document.getElementById('emailModalOverlay')) return;
  document.getElementById('emailModalOverlay').classList.remove('open');
}

function renderTags() {
  const container = document.getElementById('emailTagInput');
  const input = document.getElementById('emailRawInput');
  container.querySelectorAll('.email-tag').forEach(t => t.remove());
  emailRecipients.forEach((addr, i) => {
    const tag = document.createElement('div');
    tag.className = 'email-tag';
    tag.innerHTML = `${addr}<button class="email-tag-del" onclick="removeTag(${i})" tabindex="-1">×</button>`;
    container.insertBefore(tag, input);
  });
}

function removeTag(i) {
  emailRecipients.splice(i, 1);
  renderTags();
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

function addEmailFromInput() {
  const raw = document.getElementById('emailRawInput').value;
  const parts = raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  let added = false;
  parts.forEach(addr => {
    if (isValidEmail(addr) && !emailRecipients.includes(addr)) {
      emailRecipients.push(addr);
      added = true;
    }
  });
  if (added) {
    document.getElementById('emailRawInput').value = '';
    renderTags();
  }
}

document.getElementById('emailRawInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    addEmailFromInput();
  } else if (e.key === 'Backspace' && this.value === '' && emailRecipients.length > 0) {
    emailRecipients.pop();
    renderTags();
  }
});

document.getElementById('emailTagInput').addEventListener('focus', () => {
  document.getElementById('emailTagInput').classList.add('focus');
}, true);
document.getElementById('emailTagInput').addEventListener('blur', () => {
  document.getElementById('emailTagInput').classList.remove('focus');
  addEmailFromInput();
}, true);

function buildEmailHTML(resultState, resultHTML) {
  const pos = resultState.totalDB >= 0;
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>uhlsport Kalkulation: ${resultState.vereinName}</title>
<style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
  .wrap { max-width: 700px; margin: 0 auto; background: #fff; }
  .header { background: #111; padding: 24px 32px; display: flex; align-items: center; gap: 16px; }
  .header-title { color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  .verdict { padding: 28px 32px; background: ${pos ? '#111' : '#8b0000'}; }
  .verdict h1 { color: #fff; font-size: 28px; font-weight: 900; margin: 0 0 6px; }
  .verdict p { color: rgba(255,255,255,0.7); font-size: 14px; margin: 0; }
  .kpis { display: table; width: 100%; border-collapse: collapse; border-bottom: 2px solid #111; }
  .kpi { display: table-cell; padding: 20px 24px; border-right: 1px solid #e4e4e4; width: 33.3%; }
  .kpi:last-child { border-right: none; }
  .kpi-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
  .kpi-val { font-size: 22px; font-weight: 900; color: #111; }
  .kpi-val.pos { color: #1a8a4a; } .kpi-val.neg { color: #cc2222; }
  .body { padding: 24px 32px; }
  h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin: 24px 0 10px; border-top: 1px solid #e4e4e4; padding-top: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #999; padding: 8px; text-align: right; border-bottom: 2px solid #111; }
  th:first-child { text-align: left; }
  td { padding: 8px; text-align: right; border-bottom: 1px solid #e4e4e4; color: #555; }
  td:first-child { text-align: left; color: #555; }
  tr.section-row td { background: #f8f8f8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #111; }
  tr.total td { font-weight: 900; color: #111; border-top: 2px solid #111; border-bottom: none; }
  .v-pos { color: #1a8a4a !important; } .v-neg { color: #cc2222 !important; }
  .sub td { background: #f8f8f8; color: #999; font-size: 12px; }
  .info { background: #f8f8f8; padding: 14px 16px; font-size: 12px; color: #555; line-height: 1.8; margin-top: 16px; }
  .info strong { color: #111; }
  .footer { background: #111; padding: 16px 32px; font-size: 11px; color: rgba(255,255,255,0.4); text-align: center; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div>
      <div style="color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px">uhlsport</div>
      <div class="header-title">Kalkulation Ausrüstungsvertrag · ${new Date().toLocaleDateString('de-DE')}</div>
    </div>
  </div>
  <div class="verdict">
    <h1>${pos ? '✓ Deal empfehlenswert' : '✗ Nicht empfehlenswert'}</h1>
    <p>${pos ? 'Deckungsbeitrag: ' + resultState.fmtDB + ' · DB-Quote: ' + resultState.dbQStr : 'Negativer Deckungsbeitrag: ' + resultState.fmtDB}</p>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="kpi-lbl">Nettoumsatz</div><div class="kpi-val">${resultState.fmtNetto}</div></div>
    <div class="kpi"><div class="kpi-lbl">Invest</div><div class="kpi-val neg">${resultState.fmtInvest}</div></div>
    <div class="kpi"><div class="kpi-lbl">Deckungsbeitrag</div><div class="kpi-val ${pos ? 'pos' : 'neg'}">${resultState.fmtDB}</div></div>
  </div>
  <div class="body">
    ${resultHTML}
    <div class="info">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <tr><td colspan="4" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#111;padding:10px 0 6px;border-bottom:1px solid #e4e4e4">Verein</td></tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap">Name</td>
          <td style="padding:6px 12px 6px 0;color:#111;font-weight:500">${resultState.vereinName||'–'}</td>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap">Liga</td>
          <td style="padding:6px 0;color:#111;font-weight:500">${resultState.liga||'–'}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Sportart</td>
          <td style="padding:6px 12px 6px 0;color:#111;font-weight:500">${resultState.sportart||'–'}</td>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Laufzeit</td>
          <td style="padding:6px 0;color:#111;font-weight:500">${resultState.laufzeit} Jahr${resultState.laufzeit>1?'e':''}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Kdnr. Freiware</td>
          <td style="padding:6px 12px 6px 0;color:#111;font-weight:500">${resultState.kdnrFW||'–'}</td>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Kdnr. Nachkauf</td>
          <td style="padding:6px 0;color:#111;font-weight:500">${resultState.kdnrNK||'–'}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Nachkauf-Kond.</td>
          <td style="padding:6px 12px 6px 0;color:#111;font-weight:500">${resultState.kondVerein}</td>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Erlösschmäl.</td>
          <td style="padding:6px 0;color:#111;font-weight:500">${resultState.kondVereinErl}</td>
        </tr>
        <tr><td colspan="4" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#111;padding:12px 0 6px;border-bottom:1px solid #e4e4e4">Fachhändler</td></tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Name</td>
          <td style="padding:6px 12px 6px 0;color:#111;font-weight:500">${resultState.haendlerName||'–'}</td>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Kundennummer</td>
          <td style="padding:6px 0;color:#111;font-weight:500">${resultState.kdnrH||'–'}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Nachkauf-Kond.</td>
          <td style="padding:6px 12px 6px 0;color:#111;font-weight:500">${resultState.kondHaendler}</td>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Einkauf Freiware</td>
          <td style="padding:6px 0;color:#111;font-weight:500">${resultState.kondFreiware}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Erlösschmäl.</td>
          <td colspan="3" style="padding:6px 0;color:#111;font-weight:500">${resultState.kondErloess}</td>
        </tr>
        <tr><td colspan="4" style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#111;padding:12px 0 6px;border-bottom:1px solid #e4e4e4">Intern</td></tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Außendienst</td>
          <td style="padding:6px 12px 6px 0;color:#111;font-weight:500">${resultState.aussendienst||'–'}</td>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">Verantwortlich</td>
          <td style="padding:6px 0;color:#111;font-weight:500">${resultState.verantwortlich||'–'}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">HEK/COS</td>
          <td style="padding:6px 12px 6px 0;color:#111;font-weight:500">${resultState.hekCos}x</td>
          <td style="padding:6px 12px 6px 0;color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.8px">UVP/COS</td>
          <td style="padding:6px 0;color:#111;font-weight:500">${resultState.uvpCos}x</td>
        </tr>
      </table>
    </div>
  </div>
  <div class="footer">uhlsport GmbH · Diese E-Mail wurde automatisch durch das Kalkulationstool generiert.</div>
</div>

<!-- ══ EMAIL MODAL ══ -->
<div class="email-modal-overlay" id="emailModalOverlay" onclick="closeEmailModal(event)">
  <div class="email-modal" onclick="event.stopPropagation()">
    <div class="email-modal-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" style="vertical-align:-2px;margin-right:8px"><rect x="2" y="4" width="20" height="16" rx="1"/><polyline points="2,4 12,13 22,4"/></svg>
      Auswertung per E-Mail senden
    </div>
    <p class="email-modal-sub">Die Kalkulation wird als formatierte E-Mail zugestellt. Mehrere Adressen mit Enter oder Komma bestätigen.</p>
    <div class="email-modal-fixed">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Immer im BCC: <span>cfenske@uhlsport.de</span>
    </div>
    <div class="email-tag-input" id="emailTagInput" onclick="document.getElementById('emailRawInput').focus()">
      <input type="text" id="emailRawInput" class="email-tag-input-field" placeholder="E-Mail-Adresse eingeben …" autocomplete="off" spellcheck="false">
    </div>
    <div class="email-modal-hint">Enter oder Komma = Adresse hinzufügen · Klick auf × = entfernen</div>
    <div class="email-modal-err" id="emailErr"></div>
    <div class="email-modal-actions">
      <button class="email-cancel-btn" onclick="closeEmailModal()">Abbrechen</button>
      <button class="email-send-btn" id="emailSendBtn" onclick="sendEmail()">
        <div class="spinner"></div>
        <span class="send-label">Jetzt senden</span>
      </button>
    </div>
  </div>
</div>

</body>
</html>`;
}

function buildEmailTableHTML(results, state, totalDbQuote) {
  const fmtE = n => n === 0 ? '–' : new Intl.NumberFormat('de-DE', {style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  const yC = results.map(r => `<th>${r.label}</th>`).join('');
  const tC = results.length > 1 ? '<th>Gesamt</th>' : '';
  const cols = results.length + (results.length > 1 ? 2 : 1);
  function erow(label, fn, bold=false, sub=false) {
    const cells = results.map(r => { const v = fn(r); return `<td class="${v<0?'v-neg':v>0?'v-pos':''}">${fmtE(v)}</td>`; }).join('');
    const tot = results.reduce((a,r) => a+fn(r), 0);
    const totTd = results.length > 1 ? `<td class="${tot<0?'v-neg':tot>0?'v-pos':''}">${fmtE(tot)}</td>` : '';
    const cls = bold ? 'total' : sub ? 'sub' : '';
    const lbl = sub ? `<span style="padding-left:14px;color:#999;font-size:12px">${label}</span>` : label;
    return `<tr class="${cls}"><td>${lbl}</td>${cells}${totTd}</tr>`;
  }
  function erowPct(label, fn) {
    const cells = results.map(r => { const v = fn(r); return `<td class="${v<0?'v-neg':'v-pos'}">${(v*100).toFixed(1)}%</td>`; }).join('');
    const totTd = results.length > 1 ? `<td class="${totalDbQuote<0?'v-neg':'v-pos'}">${(totalDbQuote*100).toFixed(1)}%</td>` : '';
    return `<tr><td>${label}</td>${cells}${totTd}</tr>`;
  }
  return `
    <h3>Detailergebnis je Jahr</h3>
    <table>
      <thead><tr><th>Position</th>${yC}${tC}</tr></thead>
      <tbody>
        <tr class="section-row"><td colspan="${cols}">Sponsoring-Invest</td></tr>
        ${erow('Cash-Leistung', r=>-r.cashCost)}
        ${erow('Freiware (zu COS bewertet)', r=>-r.freiwareCos)}
        ${erow('Gesamt Sponsoring-Invest (COS)', r=>-r.sponsoringInvest, true)}
        <tr class="section-row"><td colspan="${cols}">Umsätze & Deckungsbeiträge</td></tr>
        ${erow('Nettoumsatz Verein direkt', r=>r.vereinNetto)}
        ${erow('./. Wareneinsatz Verein (COS)', r=>-r.vereinCos, false, true)}
        ${erow('DB I — Verein', r=>r.vereinDB1)}
        ${erow('Nettoumsatz Händler direkt', r=>r.hdNetto)}
        ${erow('./. Wareneinsatz Händler direkt (COS)', r=>-r.hdCos, false, true)}
        ${erow('DB I — Händler direkt', r=>r.hdDB1)}
        ${erow('Nettoumsatz Händler indirekt', r=>r.hiNetto)}
        ${erow('./. Wareneinsatz Händler indirekt (COS)', r=>-r.hiCos, false, true)}
        ${erow('DB I — Händler indirekt', r=>r.hiDB1)}
        ${erow('Sonstige Kosten', r=>-r.sonstige)}
        ${erow('Nettoumsatz gesamt', r=>r.gesamtNetto, true)}
        ${erow('Deckungsbeitrag gesamt', r=>r.gesamtDB, true)}
        ${erowPct('DB-Quote', r=>r.dbQuote)}
      </tbody>
    </table>`;
}

async function sendEmail() {
  addEmailFromInput();
  const errEl = document.getElementById('emailErr');
  if (emailRecipients.length === 0) {
    errEl.textContent = 'Bitte mindestens eine E-Mail-Adresse eingeben.';
    errEl.classList.add('show');
    return;
  }
  errEl.classList.remove('show');
  const btn = document.getElementById('emailSendBtn');
  btn.classList.add('sending');
  btn.disabled = true;

  const fmtK2 = n => new Intl.NumberFormat('de-DE', {style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  const lastResults = window._lastResults;
  const lastTotals  = window._lastTotals;
  if (!lastResults) {
    errEl.textContent = 'Keine Kalkulation gefunden. Bitte zuerst berechnen.';
    errEl.classList.add('show');
    btn.classList.remove('sending'); btn.disabled = false;
    return;
  }

  const tableHTML = buildEmailTableHTML(lastResults, state, lastTotals.dbQuote);

  // Qual block for email
  const hQ = state.qualVerein||state.warumVerein||state.qualHandel||state.andereVereine||state.umsatzPotenziale;
  let qualHTML = '';
  if (hQ) {
    const escE = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    qualHTML = '<h3>Qualitative Einschätzung</h3><table>';
    if (state.qualVerein)     qualHTML += `<tr><td colspan="2"><strong>Qualitative Beurteilung Verein</strong><br>${escE(state.qualVerein)}</td></tr>`;
    if (state.warumVerein)    qualHTML += `<tr><td colspan="2"><strong>Warum dieser Verein?</strong><br>${escE(state.warumVerein)}</td></tr>`;
    if (state.qualHandel)     qualHTML += `<tr><td colspan="2"><strong>Qualitative Beurteilung Fachhandel</strong><br>${escE(state.qualHandel)}</td></tr>`;
    if (state.andereVereine)  qualHTML += `<tr><td colspan="2"><strong>Andere Vereine beim Händler</strong><br>${escE(state.andereVereine)}</td></tr>`;
    if (state.umsatzPotenziale) qualHTML += `<tr><td colspan="2"><strong>Zusätzliche Umsatzpotenziale</strong><br>${escE(state.umsatzPotenziale)}</td></tr>`;
    qualHTML += '</table>';
  }

  const resultState = {
    totalDB: lastTotals.db,
    fmtDB:   fmtK2(lastTotals.db),
    fmtNetto: fmtK2(lastTotals.netto),
    fmtInvest: fmtK2(-lastTotals.invest),
    dbQStr:  (lastTotals.dbQuote*100).toFixed(1)+'%',
    vereinName: state.vereinName, liga: state.liga, sportart: state.sportart||'',
    laufzeit: state.laufzeit,
    kdnrFW: state.kdnrVereinFreiware, kdnrNK: state.kdnrVereinNachkauf, kdnrH: state.kdnrHaendler,
    haendlerName: state.haendlerName,
    kondVerein:    (state.vereinNachkauf*100).toFixed(1)+'%',
    kondVereinErl: (state.vereinErloesschmaelerung*100).toFixed(1)+'%',
    kondHaendler:  (state.haendlerNachkauf*100).toFixed(1)+'%',
    kondFreiware:  (state.haendlerFreiware*100).toFixed(1)+'%',
    kondErloess:   (state.haendlerErloesschmaelerung*100).toFixed(1)+'%',
    hekCos: state.hekCosQuotient, uvpCos: state.uvpCosQuotient,
    aussendienst: state.aussendienst, verantwortlich: state.verantwortlich
  };

  const emailHTML = buildEmailHTML(resultState, tableHTML + qualHTML);

  try {
    const resp = await fetch(window.location.href, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        recipients: emailRecipients,
        subject: 'Kalkulation ' + state.vereinName + (state.liga ? ' – ' + state.liga : ''),
        html: emailHTML
      })
    });

    let json;
    const rawText = await resp.text();
    try {
      json = JSON.parse(rawText);
    } catch(parseErr) {
      // Server returned non-JSON (e.g. PHP error page)
      btn.classList.remove('sending'); btn.disabled = false;
      errEl.style.color = '';
      errEl.textContent = '✗ Serverfehler (kein gültiges JSON). HTTP ' + resp.status + '. Prüfe die PHP-Konfiguration des Servers.';
      errEl.classList.add('show');
      console.error('Server response:', rawText);
      return;
    }

    btn.classList.remove('sending');
    btn.disabled = false;
    if (json.ok) {
      errEl.style.color = 'var(--green)';
      errEl.textContent = '✓ ' + json.message;
      errEl.classList.add('show');
      emailRecipients = [];
      renderTags();
      setTimeout(() => { document.getElementById('emailModalOverlay').classList.remove('open'); errEl.style.color = ''; }, 2500);
    } else {
      errEl.style.color = '';
      errEl.textContent = '✗ ' + (json.error || 'Unbekannter Fehler');
      errEl.classList.add('show');
    }
  } catch(e) {
    btn.classList.remove('sending'); btn.disabled = false;
    errEl.textContent = '✗ Netzwerkfehler: ' + e.message;
    errEl.classList.add('show');
  }
}
