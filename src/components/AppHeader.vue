<template>
  <header class="site-header">
    <div class="logo-wrap">
      <img src="/images/logo.png" alt="uhlsport" class="logo-img" />
      <div class="header-divider" />
      <span class="header-tool">Kalkulation Ausrüstungsverträge</span>
    </div>
    <span class="header-date">{{ today }}</span>
  </header>
</template>

<script setup lang="ts">
const today = new Date().toLocaleDateString('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
})
</script>
