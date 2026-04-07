<template>
  <v-app>
    <div class="app-wrap">
      <!-- Header -->
      <AppHeader />

      <!-- Sections -->
      <StammdatenSection />
      <QuotientenSection />
      <QualitativSection />
      <SponsoringSection />
      <UmsatzSection />

      <!-- Result -->
      <ResultView v-if="showResult" />
    </div>

    <!-- Sticky bottom bar -->
    <StickyBar @calculate="calculate" />

    <!-- Email modal -->
    <EmailModal v-model="emailModalOpen" />
  </v-app>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import AppHeader       from './components/AppHeader.vue'
import StickyBar       from './components/StickyBar.vue'
import StammdatenSection from './components/sections/StammdatenSection.vue'
import QuotientenSection from './components/sections/QuotientenSection.vue'
import QualitativSection from './components/sections/QualitativSection.vue'
import SponsoringSection from './components/sections/SponsoringSection.vue'
import UmsatzSection     from './components/sections/UmsatzSection.vue'
import ResultView        from './components/ResultView.vue'
import EmailModal        from './components/EmailModal.vue'

const showResult     = ref(false)
const emailModalOpen = ref(false)

function calculate() {
  showResult.value = true
  setTimeout(() => {
    document.getElementById('result-anchor')?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}

provide('openEmailModal', () => { emailModalOpen.value = true })
</script>
