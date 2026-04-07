import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface YearData {
  label: string
  cash: number
  freiwareMode: 'hek' | 'uvp'
  freiwareHek: number
  freiwareUvp: number
  vereinUmsatzMode: 'hek' | 'uvp'
  vereinUmsatzHek: number
  vereinUmsatzUvp: number
  haendlerDirektMode: 'hek' | 'uvp'
  haendlerDirektHek: number
  haendlerDirektUvp: number
  haendlerFreiwareHek: number
  haendlerIndirektMode: 'hek' | 'uvp'
  haendlerIndirektHek: number
  haendlerIndirektUvp: number
  marketingkosten: number
  logistikkosten: number
  sonstigeKosten: number
}

export interface YearResult {
  label: string
  cashCost: number
  freiwareCos: number
  sponsoringInvest: number
  vereinNetto: number
  vereinCos: number
  vereinDB1: number
  hdNetto: number
  hdCos: number
  hdDB1: number
  hiNetto: number
  hiCos: number
  hiDB1: number
  sonstige: number
  gesamtNetto: number
  gesamtDB: number
  dbQuote: number
}

function makeYear(index: number): YearData {
  const base = new Date().getFullYear()
  const s = base + index
  return {
    label: `${s}/${(s + 1).toString().slice(-2)}`,
    cash: 0, freiwareMode: 'hek', freiwareHek: 0, freiwareUvp: 0,
    vereinUmsatzMode: 'hek', vereinUmsatzHek: 0, vereinUmsatzUvp: 0,
    haendlerDirektMode: 'hek', haendlerDirektHek: 0, haendlerDirektUvp: 0, haendlerFreiwareHek: 0,
    haendlerIndirektMode: 'hek', haendlerIndirektHek: 0, haendlerIndirektUvp: 0,
    marketingkosten: 0, logistikkosten: 0, sonstigeKosten: 0,
  }
}

export const useCalcStore = defineStore('calc', () => {
  // ── Stammdaten ──
  const vereinName    = ref('')
  const liga          = ref('')
  const sportart      = ref('')
  const aussendienst  = ref('')
  const verantwortlich = ref('')
  const laufzeit      = ref(3)
  const haendlerName  = ref('')
  const kdnrVereinFreiware = ref('')
  const kdnrVereinNachkauf = ref('')
  const kdnrHaendler  = ref('')
  const haendlerNachkauf = ref(0.3)
  const haendlerFreiware = ref(0.4)
  const haendlerErloesschmaelerung = ref(0.08)
  const vereinNachkauf = ref(0)
  const vereinErloesschmaelerung = ref(0)

  // ── Quotienten ──
  const hekCosQuotient = ref(2.5)
  const uvpCosQuotient = ref(5.0)
  const quotientUnlocked = ref(false)

  // ── Qualitativ ──
  const qualVerein    = ref('')
  const warumVerein   = ref('')
  const qualHandel    = ref('')
  const andereVereine = ref('')
  const umsatzPotenziale = ref('')

  // ── Jahre ──
  const years = ref<YearData[]>([makeYear(0), makeYear(1), makeYear(2)])

  function setLaufzeit(n: number) {
    laufzeit.value = n
    const current = years.value.length
    if (n > current) {
      for (let i = current; i < n; i++) years.value.push(makeYear(i))
    } else {
      years.value = years.value.slice(0, n)
    }
  }

  // ── Berechnungen ──
  const results = computed<YearResult[]>(() => {
    const cosHekRatio = 1 / hekCosQuotient.value
    const hekUvpRatio = hekCosQuotient.value / uvpCosQuotient.value

    return years.value.map(yr => {
      const cashCost = yr.cash
      const freiwareCos = yr.freiwareMode === 'hek'
        ? yr.freiwareHek * cosHekRatio
        : yr.freiwareUvp * (1 / uvpCosQuotient.value)
      const sponsoringInvest = cashCost + freiwareCos

      // Verein direkt
      const vBrutto = yr.vereinUmsatzMode === 'hek' ? yr.vereinUmsatzHek : yr.vereinUmsatzUvp * hekUvpRatio
      const vRabatt = vBrutto * vereinNachkauf.value
      const vErl    = (vBrutto - vRabatt) * vereinErloesschmaelerung.value
      const vereinNetto = vBrutto - vRabatt - vErl
      const vereinCos   = vBrutto * cosHekRatio
      const vereinDB1   = vereinNetto - vereinCos

      // Händler direkt
      const hdBrutto = yr.haendlerDirektMode === 'hek' ? yr.haendlerDirektHek : yr.haendlerDirektUvp * hekUvpRatio
      const hdFw     = yr.haendlerFreiwareHek
      const hdRabatt = hdBrutto * haendlerNachkauf.value
      const hdErl    = (hdBrutto - hdRabatt) * haendlerErloesschmaelerung.value
      const hdNetto  = hdBrutto - hdRabatt - hdErl + hdFw
      const hdCos    = (hdBrutto + hdFw) * cosHekRatio
      const hdDB1    = hdNetto - hdCos

      // Händler indirekt
      const hiBrutto = yr.haendlerIndirektMode === 'hek' ? yr.haendlerIndirektHek : yr.haendlerIndirektUvp * hekUvpRatio
      const hiRabatt = hiBrutto * haendlerNachkauf.value
      const hiErl    = (hiBrutto - hiRabatt) * haendlerErloesschmaelerung.value
      const hiNetto  = hiBrutto - hiRabatt - hiErl
      const hiCos    = hiBrutto * cosHekRatio
      const hiDB1    = hiNetto - hiCos

      const sonstige    = yr.marketingkosten + yr.logistikkosten + yr.sonstigeKosten
      const gesamtNetto = vereinNetto + hdNetto + hiNetto
      const gesamtDB    = vereinDB1 + hdDB1 + hiDB1 - sponsoringInvest - sonstige
      const dbQuote     = gesamtNetto > 0 ? gesamtDB / gesamtNetto : 0

      return {
        label: yr.label, cashCost, freiwareCos, sponsoringInvest,
        vereinNetto, vereinCos, vereinDB1,
        hdNetto, hdCos, hdDB1,
        hiNetto, hiCos, hiDB1,
        sonstige, gesamtNetto, gesamtDB, dbQuote,
      }
    })
  })

  const totalNetto  = computed(() => results.value.reduce((a, r) => a + r.gesamtNetto, 0))
  const totalInvest = computed(() => results.value.reduce((a, r) => a + r.sponsoringInvest + r.sonstige, 0))
  const totalDB     = computed(() => results.value.reduce((a, r) => a + r.gesamtDB, 0))
  const totalDbQuote = computed(() => totalNetto.value > 0 ? totalDB.value / totalNetto.value : 0)
  const isPositive  = computed(() => totalDB.value >= 0)

  // Live preview per year (for UmsatzCard)
  function calcPreviewVerein(i: number) {
    const yr = years.value[i]
    if (!yr) return { rabatt: 0, erloess: 0, netto: 0, cos: 0 }
    const cosHek = 1 / hekCosQuotient.value
    const hekUvp = hekCosQuotient.value / uvpCosQuotient.value
    const b = yr.vereinUmsatzMode === 'hek' ? yr.vereinUmsatzHek : yr.vereinUmsatzUvp * hekUvp
    const rab = b * vereinNachkauf.value
    const erl = (b - rab) * vereinErloesschmaelerung.value
    return { rabatt: b > 0 ? -rab : 0, erloess: b > 0 ? -erl : 0, netto: b - rab - erl, cos: b > 0 ? -(b * cosHek) : 0 }
  }

  function calcPreviewHDirekt(i: number) {
    const yr = years.value[i]
    if (!yr) return { rabatt: 0, erloess: 0, netto: 0, cos: 0 }
    const cosHek = 1 / hekCosQuotient.value
    const hekUvp = hekCosQuotient.value / uvpCosQuotient.value
    const b  = yr.haendlerDirektMode === 'hek' ? yr.haendlerDirektHek : yr.haendlerDirektUvp * hekUvp
    const fw = yr.haendlerFreiwareHek
    const rab = b * haendlerNachkauf.value
    const erl = (b - rab) * haendlerErloesschmaelerung.value
    return { rabatt: b > 0 ? -rab : 0, erloess: b > 0 ? -erl : 0, netto: b - rab - erl + fw, cos: b > 0 ? -((b + fw) * cosHek) : 0 }
  }

  function calcPreviewHIndirekt(i: number) {
    const yr = years.value[i]
    if (!yr) return { rabatt: 0, erloess: 0, netto: 0, cos: 0 }
    const cosHek = 1 / hekCosQuotient.value
    const hekUvp = hekCosQuotient.value / uvpCosQuotient.value
    const b = yr.haendlerIndirektMode === 'hek' ? yr.haendlerIndirektHek : yr.haendlerIndirektUvp * hekUvp
    const rab = b * haendlerNachkauf.value
    const erl = (b - rab) * haendlerErloesschmaelerung.value
    return { rabatt: b > 0 ? -rab : 0, erloess: b > 0 ? -erl : 0, netto: b - rab - erl, cos: b > 0 ? -(b * cosHek) : 0 }
  }

  return {
    // state
    vereinName, liga, sportart, aussendienst, verantwortlich, laufzeit,
    haendlerName, kdnrVereinFreiware, kdnrVereinNachkauf, kdnrHaendler,
    haendlerNachkauf, haendlerFreiware, haendlerErloesschmaelerung,
    vereinNachkauf, vereinErloesschmaelerung,
    hekCosQuotient, uvpCosQuotient, quotientUnlocked,
    qualVerein, warumVerein, qualHandel, andereVereine, umsatzPotenziale,
    years,
    // actions
    setLaufzeit,
    // computed
    results, totalNetto, totalInvest, totalDB, totalDbQuote, isPositive,
    // preview helpers
    calcPreviewVerein, calcPreviewHDirekt, calcPreviewHIndirekt,
  }
})
