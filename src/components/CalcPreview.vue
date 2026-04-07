<template>
  <div v-if="hasValues" class="calc-preview mt-3">
    <div class="calc-preview-cell">
      <div class="calc-preview-lbl">Rabatt</div>
      <div class="calc-preview-val" :class="preview.rabatt < 0 ? 'neg' : ''">{{ fmt(preview.rabatt) }}</div>
    </div>
    <div class="calc-preview-cell">
      <div class="calc-preview-lbl">Erlösschm.</div>
      <div class="calc-preview-val" :class="preview.erloess < 0 ? 'neg' : ''">{{ fmt(preview.erloess) }}</div>
    </div>
    <div class="calc-preview-cell">
      <div class="calc-preview-lbl">Nettoumsatz</div>
      <div class="calc-preview-val" :class="preview.netto > 0 ? 'pos' : ''">{{ fmt(preview.netto) }}</div>
    </div>
    <div class="calc-preview-cell">
      <div class="calc-preview-lbl">Wareneinsatz</div>
      <div class="calc-preview-val" :class="preview.cos < 0 ? 'neg' : ''">{{ fmt(preview.cos) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  preview: { rabatt: number; erloess: number; netto: number; cos: number }
}>()

const hasValues = computed(() =>
  props.preview.netto !== 0 || props.preview.cos !== 0
)

function fmt(n: number) {
  if (!n) return '—'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}
</script>
