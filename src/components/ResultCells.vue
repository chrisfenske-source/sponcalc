<template>
  <td
    v-for="r in results"
    :key="r.label"
    :class="cellClass(fn(r))"
    :style="bold ? 'font-weight:700' : ''"
  >
    {{ fmt(fn(r)) }}
  </td>
  <td
    v-if="results.length > 1"
    :class="cellClass(total)"
    :style="bold ? 'font-weight:700' : ''"
  >
    {{ fmt(total) }}
  </td>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { YearResult } from '../stores/calc'

const props = defineProps<{
  fn: (r: YearResult) => number
  results: YearResult[]
  bold?: boolean
  sub?: boolean
}>()

const total = computed(() => props.results.reduce((a, r) => a + props.fn(r), 0))

function cellClass(n: number) {
  if (n > 0) return 'v-pos'
  if (n < 0) return 'v-neg'
  return ''
}

function fmt(n: number) {
  if (!n) return '—'
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}
</script>
