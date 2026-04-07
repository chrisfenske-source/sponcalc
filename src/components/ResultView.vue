<template>
  <div id="result-anchor" class="mt-4">

    <!-- Verdict banner -->
    <div class="verdict-banner" :class="store.isPositive ? 'pos' : 'neg'">
      <div class="verdict-icon">{{ store.isPositive ? '🏆' : '🚨' }}</div>
      <div>
        <div class="verdict-title">{{ store.isPositive ? 'Deal empfehlenswert' : 'Deal nicht empfehlenswert' }}</div>
        <div class="verdict-sub">
          {{ store.isPositive
            ? `DB gesamt: ${fmt(store.totalDB)} · DB-Quote: ${pct(store.totalDbQuote)}`
            : `Negativer Deckungsbeitrag: ${fmt(store.totalDB)} — der Deal kostet mehr als er einbringt.`
          }}
        </div>
      </div>
    </div>

    <!-- KPI strip -->
    <div class="kpi-strip mb-6">
      <div class="kpi-cell">
        <div class="kpi-lbl">Nettoumsatz</div>
        <div class="kpi-val" :class="store.totalNetto > 0 ? 'pos' : ''">{{ fmtK(store.totalNetto) }}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-lbl">Invest</div>
        <div class="kpi-val neg">{{ fmtK(-store.totalInvest) }}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-lbl">Deckungsbeitrag</div>
        <div class="kpi-val" :class="store.isPositive ? 'pos' : 'neg'">{{ fmtK(store.totalDB) }}</div>
      </div>
    </div>

    <!-- Result table -->
    <div class="section-divider mb-4">
      <div class="section-divider-line" />
      <span class="section-divider-label">Detailergebnis je Jahr</span>
      <div class="section-divider-line" />
    </div>

    <div style="overflow-x: auto;">
      <table class="rtable">
        <thead>
          <tr>
            <th>Position</th>
            <th v-for="r in store.results" :key="r.label">{{ r.label }}</th>
            <th v-if="store.results.length > 1">Gesamt</th>
          </tr>
        </thead>
        <tbody>
          <tr class="section-head-row"><td :colspan="cols">Sponsoring-Invest</td></tr>
          <tr v-bind="rowAttrs(r => -r.cashCost)"><td>Cash-Leistung</td><ResultCells :fn="r => -r.cashCost" :results="store.results" /></tr>
          <tr v-bind="rowAttrs(r => -r.freiwareCos, false, true)"><td><span class="sub-label">Freiware (zu COS bewertet)</span></td><ResultCells :fn="r => -r.freiwareCos" :results="store.results" sub /></tr>
          <tr class="total"><td>Gesamt Sponsoring-Invest (COS)</td><ResultCells :fn="r => -r.sponsoringInvest" :results="store.results" bold /></tr>
          <tr class="tbl-spacer"><td :colspan="cols"></td></tr>

          <tr class="section-head-row"><td :colspan="cols">Umsatz Verein direkt</td></tr>
          <tr><td>Nettoumsatz Verein</td><ResultCells :fn="r => r.vereinNetto" :results="store.results" /></tr>
          <tr class="row-sub"><td><span class="sub-label">./. Wareneinsatz (COS)</span></td><ResultCells :fn="r => -r.vereinCos" :results="store.results" sub /></tr>
          <tr class="row-sub"><td><span class="sub-label">Wareneinsatz / Nettoumsatz</span></td><ResultPctCells :fn="r => r.vereinNetto ? -r.vereinCos/r.vereinNetto : 0" :results="store.results" /></tr>
          <tr class="total"><td>DB I Verein</td><ResultCells :fn="r => r.vereinDB1" :results="store.results" bold /></tr>
          <tr class="row-sub"><td><span class="sub-label">DB I / Nettoumsatz</span></td><ResultPctCells :fn="r => r.vereinNetto ? r.vereinDB1/r.vereinNetto : 0" :results="store.results" /></tr>
          <tr class="tbl-spacer"><td :colspan="cols"></td></tr>

          <tr class="section-head-row"><td :colspan="cols">Umsatz Fachhändler direkt</td></tr>
          <tr><td>Nettoumsatz Händler direkt</td><ResultCells :fn="r => r.hdNetto" :results="store.results" /></tr>
          <tr class="row-sub"><td><span class="sub-label">./. Wareneinsatz (COS)</span></td><ResultCells :fn="r => -r.hdCos" :results="store.results" sub /></tr>
          <tr class="row-sub"><td><span class="sub-label">Wareneinsatz / Nettoumsatz</span></td><ResultPctCells :fn="r => r.hdNetto ? -r.hdCos/r.hdNetto : 0" :results="store.results" /></tr>
          <tr class="total"><td>DB I Händler direkt</td><ResultCells :fn="r => r.hdDB1" :results="store.results" bold /></tr>
          <tr class="row-sub"><td><span class="sub-label">DB I / Nettoumsatz</span></td><ResultPctCells :fn="r => r.hdNetto ? r.hdDB1/r.hdNetto : 0" :results="store.results" /></tr>
          <tr class="tbl-spacer"><td :colspan="cols"></td></tr>

          <tr class="section-head-row"><td :colspan="cols">Umsatz Fachhändler indirekt</td></tr>
          <tr><td>Nettoumsatz Händler indirekt</td><ResultCells :fn="r => r.hiNetto" :results="store.results" /></tr>
          <tr class="row-sub"><td><span class="sub-label">./. Wareneinsatz (COS)</span></td><ResultCells :fn="r => -r.hiCos" :results="store.results" sub /></tr>
          <tr class="row-sub"><td><span class="sub-label">Wareneinsatz / Nettoumsatz</span></td><ResultPctCells :fn="r => r.hiNetto ? -r.hiCos/r.hiNetto : 0" :results="store.results" /></tr>
          <tr class="total"><td>DB I Händler indirekt</td><ResultCells :fn="r => r.hiDB1" :results="store.results" bold /></tr>
          <tr class="row-sub"><td><span class="sub-label">DB I / Nettoumsatz</span></td><ResultPctCells :fn="r => r.hiNetto ? r.hiDB1/r.hiNetto : 0" :results="store.results" /></tr>
          <tr class="tbl-spacer"><td :colspan="cols"></td></tr>

          <tr class="section-head-row"><td :colspan="cols">Sonstige Kosten</td></tr>
          <tr><td>Sonstige Kosten gesamt</td><ResultCells :fn="r => -r.sonstige" :results="store.results" /></tr>
          <tr class="tbl-spacer"><td :colspan="cols"></td></tr>

          <tr class="section-head-row section-head-row--total"><td :colspan="cols" style="color:#fff">Gesamtergebnis</td></tr>
          <tr class="total"><td>Nettoumsatz gesamt</td><ResultCells :fn="r => r.gesamtNetto" :results="store.results" bold /></tr>
          <tr class="total"><td>Deckungsbeitrag gesamt</td><ResultCells :fn="r => r.gesamtDB" :results="store.results" bold /></tr>
          <tr><td>DB-Quote</td><ResultPctCells :fn="r => r.dbQuote" :results="store.results" :total-override="store.totalDbQuote" /></tr>
        </tbody>
      </table>
    </div>

    <!-- Qualitative Einschätzung -->
    <template v-if="hasQual">
      <div class="section-divider mt-6 mb-4">
        <div class="section-divider-line" />
        <span class="section-divider-label">Qualitative Einschätzung</span>
        <div class="section-divider-line" />
      </div>
      <div class="qual-grid">
        <div v-if="store.qualVerein" class="qual-cell span-2">
          <div class="qual-cell-label">Qualitative Beurteilung Verein</div>
          <div class="qual-cell-text">{{ store.qualVerein }}</div>
        </div>
        <div v-if="store.warumVerein" class="qual-cell">
          <div class="qual-cell-label">Warum dieser Verein?</div>
          <div class="qual-cell-text">{{ store.warumVerein }}</div>
        </div>
        <div v-if="store.qualHandel" class="qual-cell">
          <div class="qual-cell-label">Qualitative Beurteilung Fachhandel</div>
          <div class="qual-cell-text">{{ store.qualHandel }}</div>
        </div>
        <div v-if="store.andereVereine" class="qual-cell">
          <div class="qual-cell-label">Andere Vereine beim Händler</div>
          <div class="qual-cell-text">{{ store.andereVereine }}</div>
        </div>
        <div v-if="store.umsatzPotenziale" class="qual-cell span-2">
          <div class="qual-cell-label">Zusätzliche Umsatzpotenziale</div>
          <div class="qual-cell-text">{{ store.umsatzPotenziale }}</div>
        </div>
      </div>
    </template>

    <!-- Info strip -->
    <div class="info-strip mt-4">
      <div class="info-strip-section">
        <div class="info-strip-heading">Verein</div>
        <div class="info-strip-grid">
          <div><div class="info-strip-lbl">Name</div><div class="info-strip-val">{{ store.vereinName || '–' }}</div></div>
          <div><div class="info-strip-lbl">Liga</div><div class="info-strip-val">{{ store.liga || '–' }}</div></div>
          <div><div class="info-strip-lbl">Sportart</div><div class="info-strip-val">{{ store.sportart || '–' }}</div></div>
          <div><div class="info-strip-lbl">Laufzeit</div><div class="info-strip-val">{{ store.laufzeit }} Jahr{{ store.laufzeit > 1 ? 'e' : '' }}</div></div>
          <div><div class="info-strip-lbl">Kdnr. Freiware</div><div class="info-strip-val">{{ store.kdnrVereinFreiware || '–' }}</div></div>
          <div><div class="info-strip-lbl">Kdnr. Nachkauf</div><div class="info-strip-val">{{ store.kdnrVereinNachkauf || '–' }}</div></div>
          <div><div class="info-strip-lbl">Nachkauf-Kondition</div><div class="info-strip-val">{{ pct(store.vereinNachkauf) }}</div></div>
          <div><div class="info-strip-lbl">Erlösschmälerungen</div><div class="info-strip-val">{{ pct(store.vereinErloesschmaelerung) }}</div></div>
        </div>
      </div>
      <div class="info-strip-section">
        <div class="info-strip-heading">Fachhändler</div>
        <div class="info-strip-grid">
          <div><div class="info-strip-lbl">Name</div><div class="info-strip-val">{{ store.haendlerName || '–' }}</div></div>
          <div><div class="info-strip-lbl">Kundennr.</div><div class="info-strip-val">{{ store.kdnrHaendler || '–' }}</div></div>
          <div><div class="info-strip-lbl">Nachkauf-Kondition</div><div class="info-strip-val">{{ pct(store.haendlerNachkauf) }}</div></div>
          <div><div class="info-strip-lbl">Erlösschmälerungen</div><div class="info-strip-val">{{ pct(store.haendlerErloesschmaelerung) }}</div></div>
        </div>
      </div>
      <div class="info-strip-section">
        <div class="info-strip-heading">Intern</div>
        <div class="info-strip-grid">
          <div><div class="info-strip-lbl">Außendienst</div><div class="info-strip-val">{{ store.aussendienst || '–' }}</div></div>
          <div><div class="info-strip-lbl">Verantwortlich</div><div class="info-strip-val">{{ store.verantwortlich || '–' }}</div></div>
          <div><div class="info-strip-lbl">HEK/COS</div><div class="info-strip-val">{{ store.hekCosQuotient }}</div></div>
          <div><div class="info-strip-lbl">UVP/COS</div><div class="info-strip-val">{{ store.uvpCosQuotient }}</div></div>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="result-actions d-flex flex-column gap-2 mt-4 mb-10">
      <v-btn color="primary" size="large" block prepend-icon="mdi-file-pdf-box" @click="exportPDF">
        Kalkulation als PDF speichern
      </v-btn>
      <v-btn variant="outlined" color="secondary" size="large" block prepend-icon="mdi-email-outline" @click="openEmail">
        Auswertung per E-Mail senden
      </v-btn>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useCalcStore } from '../stores/calc'
import type { YearResult } from '../stores/calc'
import ResultCells    from './ResultCells.vue'
import ResultPctCells from './ResultPctCells.vue'

const store = useCalcStore()
const openEmailModal = inject<() => void>('openEmailModal')!

const cols = computed(() => store.results.length + (store.results.length > 1 ? 2 : 1))

const hasQual = computed(() =>
  store.qualVerein || store.warumVerein || store.qualHandel ||
  store.andereVereine || store.umsatzPotenziale
)

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function fmtK(n: number) {
  const abs = Math.abs(n)
  const prefix = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return prefix + (abs / 1_000_000).toFixed(1) + ' M€'
  if (abs >= 1_000)     return prefix + (abs / 1_000).toFixed(1) + ' k€'
  return fmt(n)
}
function pct(n: number) { return (n * 100).toFixed(1) + '%' }

function rowAttrs(_fn: (r: YearResult) => number, _bold = false, _sub = false) { return {} }

function openEmail() { openEmailModal() }

async function exportPDF() { window.print() }
</script>

<style scoped>
.sub-label { padding-left: 14px; color: #8a8985; font-size: 12px; }
</style>
