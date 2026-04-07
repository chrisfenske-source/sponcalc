<template>
  <div class="sticky-bar">
    <div class="sticky-inner">
      <div class="sticky-pills">
        <div class="sticky-pill">
          <span class="sticky-pill-lbl">Nettoumsatz</span>
          <span class="sticky-pill-val" :class="totalNetto > 0 ? 'pos' : ''">
            {{ totalNetto ? fmt(totalNetto) : '–' }}
          </span>
        </div>
        <div class="sticky-pill">
          <span class="sticky-pill-lbl">Invest</span>
          <span class="sticky-pill-val neg">
            {{ totalInvest ? fmt(-totalInvest) : '–' }}
          </span>
        </div>
        <div class="sticky-pill">
          <span class="sticky-pill-lbl">Deckungsbeitrag</span>
          <span class="sticky-pill-val" :class="totalDB >= 0 ? 'pos' : 'neg'">
            {{ totalDB !== 0 ? fmt(totalDB) : '–' }}
          </span>
        </div>
        <div class="sticky-pill">
          <span class="sticky-pill-lbl">DB-Quote</span>
          <span class="sticky-pill-val" :class="totalDB >= 0 ? 'pos' : 'neg'">
            {{ totalNetto > 0 ? (totalDbQuote * 100).toFixed(1) + '%' : '–' }}
          </span>
        </div>
      </div>
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-lightning-bolt"
        @click="$emit('calculate')"
      >
        Kalkulation berechnen
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCalcStore } from '../stores/calc'

defineEmits<{ calculate: [] }>()

const store = useCalcStore()
const { totalNetto, totalInvest, totalDB, totalDbQuote } = storeToRefs(store)

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
</script>
