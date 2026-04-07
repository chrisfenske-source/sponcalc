<template>
  <div class="umsatz-wrap mt-3">
    <!-- Section header -->
    <div class="umsatz-header">
      <span class="umsatz-header-num">05</span>
      <span class="umsatz-header-title">Umsatzplanung</span>
      <v-tabs v-model="activeTab" class="year-tabs ms-auto" color="primary" density="compact">
        <v-tab v-for="(yr, i) in store.years" :key="i" :value="i">{{ yr.label }}</v-tab>
      </v-tabs>
    </div>

    <!-- Year panels -->
    <v-window v-model="activeTab">
      <v-window-item v-for="(yr, i) in store.years" :key="i" :value="i">

        <!-- Verein -->
        <v-expansion-panels class="op-panel mb-n1" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>Verein — Direkter Nachkauf</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12">
                  <div class="label-mono mb-1">Bewertung Vereinsumsatz
                    <v-tooltip text="Bestellt der Verein direkt bei uhlsport? Zu HEK oder UVP?" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <div class="mode-toggle" style="max-width:280px">
                    <button class="mode-toggle-btn" :class="{ active: yr.vereinUmsatzMode === 'hek' }"
                      @click="yr.vereinUmsatzMode = 'hek'">Zu HEK</button>
                    <button class="mode-toggle-btn" :class="{ active: yr.vereinUmsatzMode === 'uvp' }"
                      @click="yr.vereinUmsatzMode = 'uvp'">Zu UVP</button>
                  </div>
                </v-col>
                <v-col v-if="yr.vereinUmsatzMode === 'hek'" cols="12" sm="6">
                  <div class="label-mono mb-1">Umsatz Verein zu HEK (€)
                    <v-tooltip text="Erwarteter Bruttoumsatz zu HEK." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.vereinUmsatzHek" type="number" min="0" placeholder="0" />
                </v-col>
                <v-col v-if="yr.vereinUmsatzMode === 'uvp'" cols="12" sm="6">
                  <div class="label-mono mb-1">Umsatz Verein zu UVP (€)
                    <v-tooltip text="Wird intern in HEK umgerechnet." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.vereinUmsatzUvp" type="number" min="0" placeholder="0" />
                </v-col>
              </v-row>
              <CalcPreview :preview="store.calcPreviewVerein(i)" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Händler direkt -->
        <v-expansion-panels class="op-panel mb-n1" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>Fachhändler — Direktumsatz</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12">
                  <div class="label-mono mb-1">Bewertung Händler-Direktumsatz
                    <v-tooltip text="Direktumsätze des Fachhändlers – HEK oder UVP, nie beides." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <div class="mode-toggle" style="max-width:280px">
                    <button class="mode-toggle-btn" :class="{ active: yr.haendlerDirektMode === 'hek' }"
                      @click="yr.haendlerDirektMode = 'hek'">Zu HEK</button>
                    <button class="mode-toggle-btn" :class="{ active: yr.haendlerDirektMode === 'uvp' }"
                      @click="yr.haendlerDirektMode = 'uvp'">Zu UVP</button>
                  </div>
                </v-col>
                <v-col v-if="yr.haendlerDirektMode === 'hek'" cols="12" sm="6">
                  <div class="label-mono mb-1">Händler-Direkt zu HEK (€)
                    <v-tooltip text="Umsatz des Händlers zu HEK." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.haendlerDirektHek" type="number" min="0" placeholder="0" />
                </v-col>
                <v-col v-if="yr.haendlerDirektMode === 'uvp'" cols="12" sm="6">
                  <div class="label-mono mb-1">Händler-Direkt zu UVP (€)</div>
                  <v-text-field v-model.number="yr.haendlerDirektUvp" type="number" min="0" placeholder="0" />
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="label-mono mb-1">Freiware Händler → Verein (HEK, €)
                    <v-tooltip text="Ware aus dem Freiwarenkontingent, bewertet zu HEK." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.haendlerFreiwareHek" type="number" min="0" placeholder="0" />
                </v-col>
              </v-row>
              <CalcPreview :preview="store.calcPreviewHDirekt(i)" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Händler indirekt -->
        <v-expansion-panels class="op-panel mb-n1" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>Fachhändler — Indirekter Umsatz</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12">
                  <div class="label-mono mb-1">Bewertung indirekter Händlerumsatz
                    <v-tooltip text="Umsätze, die der Händler durch diesen Deal mit anderen Kunden generiert." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <div class="mode-toggle" style="max-width:280px">
                    <button class="mode-toggle-btn" :class="{ active: yr.haendlerIndirektMode === 'hek' }"
                      @click="yr.haendlerIndirektMode = 'hek'">Zu HEK</button>
                    <button class="mode-toggle-btn" :class="{ active: yr.haendlerIndirektMode === 'uvp' }"
                      @click="yr.haendlerIndirektMode = 'uvp'">Zu UVP</button>
                  </div>
                </v-col>
                <v-col v-if="yr.haendlerIndirektMode === 'hek'" cols="12" sm="6">
                  <div class="label-mono mb-1">Indirekter Umsatz zu HEK (€)</div>
                  <v-text-field v-model.number="yr.haendlerIndirektHek" type="number" min="0" placeholder="0" />
                </v-col>
                <v-col v-if="yr.haendlerIndirektMode === 'uvp'" cols="12" sm="6">
                  <div class="label-mono mb-1">Indirekter Umsatz zu UVP (€)</div>
                  <v-text-field v-model.number="yr.haendlerIndirektUvp" type="number" min="0" placeholder="0" />
                </v-col>
              </v-row>
              <CalcPreview :preview="store.calcPreviewHIndirekt(i)" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Sonstige Kosten -->
        <v-expansion-panels class="op-panel" multiple>
          <v-expansion-panel>
            <v-expansion-panel-title>Sonstige Kosten</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="12" sm="4">
                  <div class="label-mono mb-1">Marketingkosten (€)
                    <v-tooltip text="Kosten für Marketing-Maßnahmen rund um den Vertrag." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.marketingkosten" type="number" min="0" placeholder="0" />
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="label-mono mb-1">Logistikkosten (€)
                    <v-tooltip text="Versand-, Lager- und Logistikkosten." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.logistikkosten" type="number" min="0" placeholder="0" />
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="label-mono mb-1">Sonstige Kosten (€)
                    <v-tooltip text="Alle weiteren Kosten." location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
                    </v-tooltip>
                  </div>
                  <v-text-field v-model.number="yr.sonstigeKosten" type="number" min="0" placeholder="0" />
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
import CalcPreview from '../CalcPreview.vue'

const store    = useCalcStore()
const activeTab = ref(0)
</script>
