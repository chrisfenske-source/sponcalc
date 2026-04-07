<template>
  <div class="umsatz-wrap mt-3">
    <div class="umsatz-header">
      <span class="umsatz-header-num">04</span>
      <span class="umsatz-header-title">Sponsoring &amp; Invest</span>
      <v-tabs v-model="activeTab" class="year-tabs ms-auto" color="primary" density="compact">
        <v-tab v-for="(yr, i) in store.years" :key="i" :value="i">{{ yr.label }}</v-tab>
      </v-tabs>
    </div>

    <v-window v-model="activeTab">
      <v-window-item v-for="(yr, i) in store.years" :key="i" :value="i">

        <!-- Freiware -->
        <v-expansion-panels class="op-panel mb-n1" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>Freiware-Kontingent</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12">
                  <div class="label-mono mb-1">Bewertung der Freiware
                    <v-tooltip text="Zu HEK = Händlereinkaufspreis. Zu UVP = Endkundenpreis." location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon>
                      </template>
                    </v-tooltip>
                  </div>
                  <div class="mode-toggle" style="max-width:280px">
                    <button class="mode-toggle-btn" :class="{ active: yr.freiwareMode === 'hek' }"
                      @click="yr.freiwareMode = 'hek'">Zu HEK</button>
                    <button class="mode-toggle-btn" :class="{ active: yr.freiwareMode === 'uvp' }"
                      @click="yr.freiwareMode = 'uvp'">Zu UVP</button>
                  </div>
                </v-col>
                <v-col v-if="yr.freiwareMode === 'hek'" cols="12" sm="6">
                  <div class="label-mono mb-1">Freiware zu HEK (€)
                    <v-tooltip text="Wert der Freiware zum Händlereinkaufspreis." location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon>
                      </template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.freiwareHek" type="number" min="0" placeholder="0" />
                </v-col>
                <v-col v-if="yr.freiwareMode === 'uvp'" cols="12" sm="6">
                  <div class="label-mono mb-1">Freiware zu UVP (€)
                    <v-tooltip text="Wird intern über den UVP/COS-Quotienten bewertet." location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon>
                      </template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.freiwareUvp" type="number" min="0" placeholder="0" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Cash -->
        <v-expansion-panels class="op-panel" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>Cash-Leistung</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <div class="label-mono mb-1">Cash p. a. (€)
                    <v-tooltip text="Direkte Geldzahlung an den Verein pro Saison." location="top">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon>
                      </template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.cash" type="number" min="0" placeholder="0" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCalcStore } from '../../stores/calc'

const store    = useCalcStore()
const activeTab = ref(0)
</script>
