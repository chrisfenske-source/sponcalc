// ── STATE ──
const state={
  vereinName:'',liga:'',sportart:'',aussendienst:'',verantwortlich:'',laufzeit:3,
  haendlerName:'',kdnrVereinFreiware:'',kdnrVereinNachkauf:'',kdnrHaendler:'',
  haendlerNachkauf:0.3,haendlerFreiware:0.4,haendlerErloesschmaelerung:0.08,
  vereinNachkauf:0,vereinErloesschmaelerung:0,
  hekCosQuotient:2.5,uvpCosQuotient:5.0,
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
        label:`${s}/${(s+1).toString().slice(-2)}`,
        cash:0,freiwareMode:'hek',freiwareHek:0,freiwareUvp:0,
        vereinUmsatzMode:'hek',vereinUmsatzHek:0,vereinUmsatzUvp:0,
        haendlerDirektMode:'hek',haendlerDirektHek:0,haendlerDirektUvp:0,haendlerFreiwareHek:0,
        haendlerIndirektMode:'hek',haendlerIndirektHek:0,haendlerIndirektUvp:0,
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
      label:`${s}/${(s+1).toString().slice(-2)}`,
      cash:0,freiwareMode:'hek',freiwareHek:0,freiwareUvp:0,
      vereinUmsatzMode:'hek',vereinUmsatzHek:0,vereinUmsatzUvp:0,
      haendlerDirektMode:'hek',haendlerDirektHek:0,haendlerDirektUvp:0,haendlerFreiwareHek:0,
      haendlerIndirektMode:'hek',haendlerIndirektHek:0,haendlerIndirektUvp:0,
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
    sv('haendlerNachkauf',state.haendlerNachkauf); sv('haendlerFreiware',state.haendlerFreiware);
    sv('haendlerErloesschmaelerung',state.haendlerErloesschmaelerung);
    sv('vereinNachkauf',state.vereinNachkauf); sv('vereinErloesschmaelerung',state.vereinErloesschmaelerung);
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
      check(id,isNaN(v)||v<0||v>1);
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
    state.haendlerNachkauf=pf('haendlerNachkauf');state.haendlerFreiware=pf('haendlerFreiware');
    state.haendlerErloesschmaelerung=pf('haendlerErloesschmaelerung');
    state.vereinNachkauf=pf('vereinNachkauf');state.vereinErloesschmaelerung=pf('vereinErloesschmaelerung');
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

// ── SPONSORING UI ──
function buildSponsoringUI(){
  const tabs=document.getElementById('yearTabsContainer'),panels=document.getElementById('yearPanelsContainer');
  tabs.innerHTML='';panels.innerHTML='';
  state.years.forEach((yr,i)=>{
    const t=document.createElement('button');
    t.className='year-tab'+(i===0?' active':'');t.textContent=yr.label;t.onclick=()=>switchTab('sp',i);tabs.appendChild(t);
    const p=document.createElement('div');
    p.className='year-panel'+(i===0?' visible':'');p.id=`sp_panel_${i}`;
    p.innerHTML=buildSponsoringPanel(i,yr);panels.appendChild(p);
  });
}

function buildSponsoringPanel(i,yr){
  return`<div class="field-grid" style="margin-top:20px">
    <div class="field-group">
      <div class="field-label">Cash-Leistung (€) <span class="tip">i<span class="tip-box">Direkter Geldbetrag, den uhlsport dem Verein zahlt. Absolutbetrag eingeben.</span></span></div>
      <input type="number" id="sp_cash_${i}" value="${yr.cash}" min="0" placeholder="0">
    </div>
    <div class="field-group span-2">
      <div class="field-label">Freiware – Bewertungsmethode <span class="tip">i<span class="tip-box">Freiware = Sportartikel, die uhlsport kostenlos liefert. Entweder zum HEK (interner Kostenwert) ODER zum UVP (Endpreis). Nie beides eingeben.</span></span></div>
      <div class="mode-toggle" id="sp_toggle_${i}">
        <button class="${yr.freiwareMode==='hek'?'on':''}" onclick="setFreiwareMode(${i},'hek')">Zu HEK</button>
        <button class="${yr.freiwareMode==='uvp'?'on':''}" onclick="setFreiwareMode(${i},'uvp')">Zu UVP</button>
      </div>
    </div>
    <div class="field-group" id="sp_hek_group_${i}" style="${yr.freiwareMode!=='hek'?'display:none':''}">
      <div class="field-label">Freiware zu HEK (€) <span class="tip">i<span class="tip-box">Wert der Freiware zum Händlereinkaufspreis (HEK = COS × HEK/COS-Quotient). Absolutbetrag eingeben.</span></span></div>
      <input type="number" id="sp_freiwareHek_${i}" value="${yr.freiwareHek}" min="0" placeholder="0">
    </div>
    <div class="field-group" id="sp_uvp_group_${i}" style="${yr.freiwareMode!=='uvp'?'display:none':''}">
      <div class="field-label">Freiware zu UVP (€) <span class="tip">i<span class="tip-box">Wert der Freiware zum Endkundenpreis. Wird intern automatisch in den COS-Kostenwert umgerechnet.</span></span></div>
      <input type="number" id="sp_freiwareUvp_${i}" value="${yr.freiwareUvp}" min="0" placeholder="0">
    </div>
  </div>`;
}

function setFreiwareMode(i,mode){
  state.years[i].freiwareMode=mode;
  document.getElementById(`sp_hek_group_${i}`).style.display=mode==='hek'?'':'none';
  document.getElementById(`sp_uvp_group_${i}`).style.display=mode==='uvp'?'':'none';
  document.getElementById(`sp_toggle_${i}`).querySelectorAll('button').forEach((b,bi)=>b.classList.toggle('on',(bi===0&&mode==='hek')||(bi===1&&mode==='uvp')));
}
function collectSponsoringFromDOM(){
  state.years.forEach((yr,i)=>{yr.cash=pfId(`sp_cash_${i}`);yr.freiwareHek=pfId(`sp_freiwareHek_${i}`);yr.freiwareUvp=pfId(`sp_freiwareUvp_${i}`);});
}

// ── UMSATZ UI ──
function buildUmsatzUI(){
  const tabs=document.getElementById('umsatzYearTabsContainer'),panels=document.getElementById('umsatzYearPanelsContainer');
  tabs.innerHTML='';panels.innerHTML='';
  state.years.forEach((yr,i)=>{
    const t=document.createElement('button');
    t.className='year-tab'+(i===0?' active':'');t.textContent=yr.label;t.onclick=()=>switchTab('um',i);tabs.appendChild(t);
    const p=document.createElement('div');
    p.className='year-panel'+(i===0?' visible':'');p.id=`um_panel_${i}`;
    p.innerHTML=buildUmsatzPanel(i,yr);panels.appendChild(p);
  });
  // Trigger initial preview calculations for all years
  setTimeout(()=>state.years.forEach((_,i)=>updateUmsatzPreview(i)),0);
}

function buildUmsatzPanel(i,yr){
  const chev=`<svg class="um-sub-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="6 9 12 15 18 9"/></svg>`;
  return`
  <div class="um-sub" id="um_sub_verein_${i}" style="margin-top:16px">
    <div class="um-sub-header" onclick="toggleUmsatzSub('verein',${i})">
      <span class="um-sub-title">Verein — Direkter Nachkauf</span>${chev}
    </div>
    <div class="um-sub-body" id="um_sub_verein_body_${i}">
      <div class="field-grid">
        <div class="field-group span-2">
          <div class="field-label">Bewertung Vereinsumsatz <span class="tip">i<span class="tip-box">Bestellt der Verein direkt bei uhlsport? Zu HEK oder UVP? Bitte nur eine Option wählen.</span></span></div>
          <div class="mode-toggle" id="um_verein_toggle_${i}">
            <button class="${yr.vereinUmsatzMode==='hek'?'on':''}" onclick="setUmsatzMode(${i},'verein','hek')">Zu HEK</button>
            <button class="${yr.vereinUmsatzMode==='uvp'?'on':''}" onclick="setUmsatzMode(${i},'verein','uvp')">Zu UVP</button>
          </div>
        </div>
        <div class="field-group" id="um_vereinHek_group_${i}" style="${yr.vereinUmsatzMode!=='hek'?'display:none':''}">
          <div class="field-label">Umsatz Verein zu HEK (€) <span class="tip">i<span class="tip-box">Erwarteter Bruttoumsatz des Vereins zum HEK. Davon werden Vereins-Rabatt, Erlösschmälerungen und Wareneinsatz abgezogen.</span></span></div>
          <input type="number" id="um_vereinHek_${i}" value="${yr.vereinUmsatzHek}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})">
        </div>
        <div class="field-group" id="um_vereinUvp_group_${i}" style="${yr.vereinUmsatzMode!=='uvp'?'display:none':''}">
          <div class="field-label">Umsatz Verein zu UVP (€) <span class="tip">i<span class="tip-box">Erwarteter Bruttoumsatz des Vereins zum UVP. Wird intern in HEK umgerechnet.</span></span></div>
          <input type="number" id="um_vereinUvp_${i}" value="${yr.vereinUmsatzUvp}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})">
        </div>
      </div>
      <div class="calc-preview" id="prev_verein_${i}">
        <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Rabatt</div><div class="calc-preview-val neg" id="prev_verein_rabatt_${i}">–</div></div>
        <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Erlösschm.</div><div class="calc-preview-val neg" id="prev_verein_erloess_${i}">–</div></div>
        <div class="calc-preview-cell"><div class="calc-preview-lbl">Nettoumsatz</div><div class="calc-preview-val pos" id="prev_verein_netto_${i}">–</div></div>
        <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Wareneinsatz (COS)</div><div class="calc-preview-val neg" id="prev_verein_cos_${i}">–</div></div>
      </div>
    </div>
  </div>

  <div class="um-sub" id="um_sub_hdirekt_${i}">
    <div class="um-sub-header" onclick="toggleUmsatzSub('hdirekt',${i})">
      <span class="um-sub-title">Fachhändler — Direktumsatz</span>${chev}
    </div>
    <div class="um-sub-body" id="um_sub_hdirekt_body_${i}">
      <div class="field-grid">
        <div class="field-group span-2">
          <div class="field-label">Bewertung Händler-Direktumsatz <span class="tip">i<span class="tip-box">Direktumsätze des Fachhändlers mit dem Verein – entweder zu HEK oder UVP, nie beides.</span></span></div>
          <div class="mode-toggle" id="um_hdirekt_toggle_${i}">
            <button class="${yr.haendlerDirektMode==='hek'?'on':''}" onclick="setUmsatzMode(${i},'hdirekt','hek')">Zu HEK</button>
            <button class="${yr.haendlerDirektMode==='uvp'?'on':''}" onclick="setUmsatzMode(${i},'hdirekt','uvp')">Zu UVP</button>
          </div>
        </div>
        <div class="field-group" id="um_hdirektHek_group_${i}" style="${yr.haendlerDirektMode!=='hek'?'display:none':''}">
          <div class="field-label">Händler-Direkt zu HEK (€) <span class="tip">i<span class="tip-box">Umsatz des Fachhändlers mit dem Verein zu HEK. Abzüge: Nachkauf-Rabatt und Erlösschmälerungen.</span></span></div>
          <input type="number" id="um_hdirektHek_${i}" value="${yr.haendlerDirektHek}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})">
        </div>
        <div class="field-group" id="um_hdirektUvp_group_${i}" style="${yr.haendlerDirektMode!=='uvp'?'display:none':''}">
          <div class="field-label">Händler-Direkt zu UVP (€)</div>
          <input type="number" id="um_hdirektUvp_${i}" value="${yr.haendlerDirektUvp}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})">
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
      </div>
    </div>
  </div>

  <div class="um-sub" id="um_sub_hindirekt_${i}">
    <div class="um-sub-header" onclick="toggleUmsatzSub('hindirekt',${i})">
      <span class="um-sub-title">Fachhändler — Indirekter Umsatz</span>${chev}
    </div>
    <div class="um-sub-body" id="um_sub_hindirekt_body_${i}">
      <div class="field-grid">
        <div class="field-group span-2">
          <div class="field-label">Bewertung indirekter Händlerumsatz <span class="tip">i<span class="tip-box">Umsätze, die der Händler durch diesen Deal zusätzlich mit anderen Vereinen oder Endkunden generiert.</span></span></div>
          <div class="mode-toggle" id="um_hindirekt_toggle_${i}">
            <button class="${yr.haendlerIndirektMode==='hek'?'on':''}" onclick="setUmsatzMode(${i},'hindirekt','hek')">Zu HEK</button>
            <button class="${yr.haendlerIndirektMode==='uvp'?'on':''}" onclick="setUmsatzMode(${i},'hindirekt','uvp')">Zu UVP</button>
          </div>
        </div>
        <div class="field-group" id="um_hindirektHek_group_${i}" style="${yr.haendlerIndirektMode!=='hek'?'display:none':''}">
          <div class="field-label">Indirekter Umsatz zu HEK (€)</div>
          <input type="number" id="um_hindirektHek_${i}" value="${yr.haendlerIndirektHek}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})">
        </div>
        <div class="field-group" id="um_hindirektUvp_group_${i}" style="${yr.haendlerIndirektMode!=='uvp'?'display:none':''}">
          <div class="field-label">Indirekter Umsatz zu UVP (€)</div>
          <input type="number" id="um_hindirektUvp_${i}" value="${yr.haendlerIndirektUvp}" min="0" placeholder="0" oninput="updateUmsatzPreview(${i})">
        </div>
      </div>
      <div class="calc-preview" id="prev_hindirekt_${i}">
        <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Rabatt</div><div class="calc-preview-val neg" id="prev_hi_rabatt_${i}">–</div></div>
        <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Erlösschm.</div><div class="calc-preview-val neg" id="prev_hi_erloess_${i}">–</div></div>
        <div class="calc-preview-cell"><div class="calc-preview-lbl">Nettoumsatz</div><div class="calc-preview-val pos" id="prev_hi_netto_${i}">–</div></div>
        <div class="calc-preview-cell"><div class="calc-preview-lbl">./. Wareneinsatz (COS)</div><div class="calc-preview-val neg" id="prev_hi_cos_${i}">–</div></div>
      </div>
    </div>
  </div>

  <div class="um-sub" id="um_sub_sonstige_${i}">
    <div class="um-sub-header" onclick="toggleUmsatzSub('sonstige',${i})">
      <span class="um-sub-title">Sonstige Kosten</span>${chev}
    </div>
    <div class="um-sub-body" id="um_sub_sonstige_body_${i}">
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
      </div>
    </div>
  </div>`;
}

function toggleUmsatzSub(key,i){
  const sub=document.getElementById(`um_sub_${key}_${i}`);
  const body=document.getElementById(`um_sub_${key}_body_${i}`);
  const isCollapsed=sub.classList.contains('collapsed');
  if(isCollapsed){
    sub.classList.remove('collapsed');
    body.style.maxHeight=body.scrollHeight+'px';
    const onEnd=()=>{
      if(!sub.classList.contains('collapsed')) body.style.maxHeight='none';
      body.removeEventListener('transitionend',onEnd);
    };
    body.addEventListener('transitionend',onEnd);
  } else {
    if(body.style.maxHeight==='none'){
      body.style.maxHeight=body.scrollHeight+'px';
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        sub.classList.add('collapsed');
        body.style.maxHeight='0';
      }));
    } else {
      sub.classList.add('collapsed');
      body.style.maxHeight='0';
    }
  }
}

function setUmsatzMode(i,type,mode){
  const map={verein:['vereinUmsatzMode','vereinHek','vereinUvp'],hdirekt:['haendlerDirektMode','hdirektHek','hdirektUvp'],hindirekt:['haendlerIndirektMode','hindirektHek','hindirektUvp']};
  const[stateKey,hekKey,uvpKey]=map[type];
  state.years[i][stateKey]=mode;
  document.getElementById(`um_${hekKey}_group_${i}`).style.display=mode==='hek'?'':'none';
  document.getElementById(`um_${uvpKey}_group_${i}`).style.display=mode==='uvp'?'':'none';
  document.getElementById(`um_${type}_toggle_${i}`).querySelectorAll('button').forEach((b,bi)=>b.classList.toggle('on',(bi===0&&mode==='hek')||(bi===1&&mode==='uvp')));
  updateUmsatzPreview(i);
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
    const cosR = 1/hek, hekUvpR = hek/uvp;
    const vN = parseFloat(normNum(document.getElementById('vereinNachkauf')?.value)) || state.vereinNachkauf;
    const vE = parseFloat(normNum(document.getElementById('vereinErloesschmaelerung')?.value)) || state.vereinErloesschmaelerung;
    const hN = parseFloat(normNum(document.getElementById('haendlerNachkauf')?.value)) || state.haendlerNachkauf;
    const hE = parseFloat(normNum(document.getElementById('haendlerErloesschmaelerung')?.value)) || state.haendlerErloesschmaelerung;
    const yr = state.years[i] || {};
    const fmtP = n => n===0?'–':new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);

    // Verein
    const vMode = yr.vereinUmsatzMode||'hek';
    const vH = pfId(`um_vereinHek_${i}`)||0, vU = pfId(`um_vereinUvp_${i}`)||0;
    const vB = vMode==='hek'?vH:vU*hekUvpR;
    const vRab = vB*vN, vErl = (vB-vRab)*vE, vNetto = vB-vRab-vErl, vCos = vB*cosR;
    const setV = (id,val) => { const el=document.getElementById(id); if(el) el.textContent=fmtP(val); };
    setV(`prev_verein_rabatt_${i}`, vB>0?-vRab:0);
    setV(`prev_verein_erloess_${i}`, vB>0?-vErl:0);
    setV(`prev_verein_netto_${i}`, vNetto);
    setV(`prev_verein_cos_${i}`, vB>0?-vCos:0);

    // Händler direkt
    const hdMode = yr.haendlerDirektMode||'hek';
    const hdH = pfId(`um_hdirektHek_${i}`)||0, hdU = pfId(`um_hdirektUvp_${i}`)||0;
    const hdFw = pfId(`um_haendlerFreiwareHek_${i}`)||0;
    const hdB = hdMode==='hek'?hdH:hdU*hekUvpR;
    const hdRab = hdB*hN, hdErl = (hdB-hdRab)*hE, hdNetto = hdB-hdRab-hdErl+hdFw, hdCos = (hdB+hdFw)*cosR;
    setV(`prev_hd_rabatt_${i}`, hdB>0?-hdRab:0);
    setV(`prev_hd_erloess_${i}`, hdB>0?-hdErl:0);
    setV(`prev_hd_netto_${i}`, hdNetto);
    setV(`prev_hd_cos_${i}`, hdB>0?-hdCos:0);

    // Händler indirekt
    const hiMode = yr.haendlerIndirektMode||'hek';
    const hiH = pfId(`um_hindirektHek_${i}`)||0, hiU = pfId(`um_hindirektUvp_${i}`)||0;
    const hiB = hiMode==='hek'?hiH:hiU*hekUvpR;
    const hiRab = hiB*hN, hiErl = (hiB-hiRab)*hE, hiNetto = hiB-hiRab-hiErl, hiCos = hiB*cosR;
    setV(`prev_hi_rabatt_${i}`, hiB>0?-hiRab:0);
    setV(`prev_hi_erloess_${i}`, hiB>0?-hiErl:0);
    setV(`prev_hi_netto_${i}`, hiNetto);
    setV(`prev_hi_cos_${i}`, hiB>0?-hiCos:0);
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
  const cosHekRatio=1/s.hekCosQuotient;
  const results=s.years.map(yr=>{
    const cashCost=yr.cash;
    const sponsoringInvest=cashCost+(yr.freiwareMode==='hek'?yr.freiwareHek*cosHekRatio:yr.freiwareUvp*(1/s.uvpCosQuotient));
    const freiwareCosVal=yr.freiwareMode==='hek'?yr.freiwareHek*cosHekRatio:yr.freiwareUvp*(1/s.uvpCosQuotient);

    let vereinHekBrutto=yr.vereinUmsatzMode==='hek'?yr.vereinUmsatzHek:yr.vereinUmsatzUvp*(s.hekCosQuotient/s.uvpCosQuotient);
    const vereinRabatt=vereinHekBrutto*s.vereinNachkauf;
    const vereinErloess=(vereinHekBrutto-vereinRabatt)*s.vereinErloesschmaelerung;
    const vereinNetto=vereinHekBrutto-vereinRabatt-vereinErloess;
    const vereinCos=vereinHekBrutto*cosHekRatio;
    const vereinDB1=vereinNetto-vereinCos;

    let hdHekBrutto=yr.haendlerDirektMode==='hek'?yr.haendlerDirektHek:yr.haendlerDirektUvp*(s.hekCosQuotient/s.uvpCosQuotient);
    const hdFw=yr.haendlerFreiwareHek;
    const hdRabatt=hdHekBrutto*s.haendlerNachkauf;
    const hdErloess=(hdHekBrutto-hdRabatt)*s.haendlerErloesschmaelerung;
    const hdNetto=hdHekBrutto-hdRabatt-hdErloess+hdFw;
    const hdCos=(hdHekBrutto+hdFw)*cosHekRatio;
    const hdDB1=hdNetto-hdCos;

    let hiHekBrutto=yr.haendlerIndirektMode==='hek'?yr.haendlerIndirektHek:yr.haendlerIndirektUvp*(s.hekCosQuotient/s.uvpCosQuotient);
    const hiRabatt=hiHekBrutto*s.haendlerNachkauf;
    const hiErloess=(hiHekBrutto-hiRabatt)*s.haendlerErloesschmaelerung;
    const hiNetto=hiHekBrutto-hiRabatt-hiErloess;
    const hiCos=hiHekBrutto*cosHekRatio;
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
  const pos=totalDB>=0;
  const memePos='https://media.giphy.com/media/fDbzXb6Cv5L56/giphy.gif';
  const memeNeg='https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTZvamw1aWpwMGpubGM4M2tjeWhwOGNxcjkyaXE4dGV6cnByazlnZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/uP89pJyXBDqVi/giphy.gif';
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
    <div class="result-verdict ${pos?'pos':'neg'}">
      <div class="verdict-icon">${pos?'🏆':'🚨'}</div>
      <div class="verdict-text">
        <h2>${pos?'Deal empfehlenswert':'Deal nicht empfehlenswert'}</h2>
        <p>${pos?`DB gesamt: ${fmt(totalDB)} · DB-Quote: ${(totalDbQuote*100).toFixed(1)}%`:`Negativer Deckungsbeitrag: ${fmt(totalDB)} — der Deal kostet mehr als er einbringt.`}</p>
      </div>
    </div>

    <div class="meme-wrap">
      <img src="${pos?memePos:memeNeg}" alt="Reaction">
      <div class="meme-cap">${pos?'"Let\'s close this deal." 🤝':'"Walk away from this one." 🙅'}</div>
    </div>

    <div class="kpi-strip">
      <div class="kpi-cell"><div class="kpi-lbl">Nettoumsatz</div><div class="kpi-val ${totalNetto>0?'pos':''}">${fmtK(totalNetto)}</div></div>
      <div class="kpi-cell"><div class="kpi-lbl">Invest</div><div class="kpi-val neg">${fmtK(-totalInvest)}</div></div>
      <div class="kpi-cell"><div class="kpi-lbl">Deckungsbeitrag</div><div class="kpi-val ${pos?'pos':'neg'}">${fmtK(totalDB)}</div></div>
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
  elD.textContent=fmtK(db);elD.className='live-pill-value'+(db>=0?' pos':' neg');
  elQ.textContent=(dbq*100).toFixed(1)+'%';elQ.className='live-pill-value'+(db>=0?' pos':' neg');
  badge.className='live-verdict'+(db>=0?' pos':' neg');
  badge.textContent=db>=0?'✓ Deal positiv':'✗ Deal negativ';
}

function liveEstimate(){
  if(maxVisited<2) return;
  try{
    const hek=parseFloat(document.getElementById('hekCosQuotient')?.value||state.hekCosQuotient);
    const uvp=parseFloat(document.getElementById('uvpCosQuotient')?.value||state.uvpCosQuotient);
    const cosR=1/hek;
    const hN=parseFloat(document.getElementById('haendlerNachkauf')?.value||state.haendlerNachkauf);
    const hE=parseFloat(document.getElementById('haendlerErloesschmaelerung')?.value||state.haendlerErloesschmaelerung);
    const vN=parseFloat(document.getElementById('vereinNachkauf')?.value||state.vereinNachkauf);
    const vE=parseFloat(document.getElementById('vereinErloesschmaelerung')?.value||state.vereinErloesschmaelerung);
    let tN=0,tI=0,tD=0;
    const n=state.years.length||state.laufzeit;
    for(let i=0;i<n;i++){
      const yr=state.years[i]||{};
      const cash=pfId(`sp_cash_${i}`)||yr.cash||0;
      const fwMode=yr.freiwareMode||'hek';
      const fwH=pfId(`sp_freiwareHek_${i}`)||yr.freiwareHek||0;
      const fwU=pfId(`sp_freiwareUvp_${i}`)||yr.freiwareUvp||0;
      const spI=cash+(fwMode==='hek'?fwH/hek:fwU/uvp);
      const vMode=yr.vereinUmsatzMode||'hek';
      const vH=(pfId(`um_vereinHek_${i}`)||yr.vereinUmsatzHek||0);
      const vU=(pfId(`um_vereinUvp_${i}`)||yr.vereinUmsatzUvp||0);
      const vB=vMode==='hek'?vH:vU*(hek/uvp);
      const vNt=vB*(1-vN)*(1-vE);const vD=vNt-vB*cosR;
      const hdMode=yr.haendlerDirektMode||'hek';
      const hdH=(pfId(`um_hdirektHek_${i}`)||yr.haendlerDirektHek||0);
      const hdU=(pfId(`um_hdirektUvp_${i}`)||yr.haendlerDirektUvp||0);
      const hdFw=(pfId(`um_haendlerFreiwareHek_${i}`)||yr.haendlerFreiwareHek||0);
      const hdB=hdMode==='hek'?hdH:hdU*(hek/uvp);
      const hdNt=(hdB*(1-hN)*(1-hE))+hdFw;const hdD=hdNt-(hdB+hdFw)*cosR;
      const hiMode=yr.haendlerIndirektMode||'hek';
      const hiH=(pfId(`um_hindirektHek_${i}`)||yr.haendlerIndirektHek||0);
      const hiU=(pfId(`um_hindirektUvp_${i}`)||yr.haendlerIndirektUvp||0);
      const hiB=hiMode==='hek'?hiH:hiU*(hek/uvp);
      const hiNt=hiB*(1-hN)*(1-hE);const hiD=hiNt-hiB*cosR;
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
