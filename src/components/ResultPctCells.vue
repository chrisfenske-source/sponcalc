<template>
  <td
    v-for="r in results"
    :key="r.label"
    :class="cellClass(fn(r))"
    style="color:#4a4946;font-size:12px"
  >
    {{ pct(fn(r)) }}
  </td>
  <td
    v-if="results.length > 1"
    :class="cellClass(totalVal)"
    style="color:#4a4946;font-size:12px"
  >
    {{ pct(totalVal) }}
  </td>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { YearResult } from '../stores/calc'

const props = defineProps<{
  fn: (r: YearResult) => number
  results: YearResult[]
  totalOverride?: number
}>()

const totalVal = computed(() =>
  props.totalOverride !== undefined
    ? props.totalOverride
    : props.results.length > 0 ? props.fn(props.results[props.results.length - 1]) : 0
)

function cellClass(n: number) {
  if (n > 0) return 'v-pos'
  if (n < 0) return 'v-neg'
  return ''
}

function pct(n: number) {
  return (n * 100).toFixed(1) + '%'
}
</script>
