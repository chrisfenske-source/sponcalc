<template>
  <v-expansion-panels class="op-panel mb-n1" multiple>
    <v-expansion-panel>
      <v-expansion-panel-title>
        <span class="panel-num">03</span>
        Qualitative Einschätzung
        <span class="ms-auto text-caption text-medium-emphasis pe-2 d-none d-sm-block">
          Verein, Handel, Potenziale
        </span>
      </v-expansion-panel-title>
      <v-expansion-panel-text>

        <div class="section-divider">
          <div class="section-divider-line" />
          <span class="section-divider-label">Verein</span>
          <div class="section-divider-line" />
        </div>
        <v-row dense>
          <v-col cols="12">
            <div class="label-mono mb-1">Qualitative Beurteilung des Vereins</div>
            <v-textarea
              v-model="store.qualVerein"
              placeholder="Vereinsgröße, Reichweite, Bekanntheit, strategische Bedeutung …"
              rows="3"
              auto-grow
            />
          </v-col>
          <v-col cols="12">
            <div class="label-mono mb-1">Warum dieser Verein?</div>
            <v-textarea
              v-model="store.warumVerein"
              placeholder="Regionale Präsenz, Zielgruppe, Wachstumspotenzial …"
              rows="3"
              auto-grow
            />
          </v-col>
        </v-row>

        <div class="section-divider">
          <div class="section-divider-line" />
          <span class="section-divider-label">Fachhandel</span>
          <div class="section-divider-line" />
        </div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Qualitative Beurteilung Fachhandel</div>
            <v-textarea
              v-model="store.qualHandel"
              placeholder="Händlergröße, Sortiment, Kundenbindung …"
              rows="3"
              auto-grow
            />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Andere Vereine beim Händler</div>
            <v-textarea
              v-model="store.andereVereine"
              placeholder="Welche anderen Vereine betreut der Händler?"
              rows="3"
              auto-grow
            />
          </v-col>
        </v-row>

        <div class="section-divider">
          <div class="section-divider-line" />
          <span class="section-divider-label">Potenziale</span>
          <div class="section-divider-line" />
        </div>
        <v-row dense>
          <v-col cols="12">
            <div class="label-mono mb-1">Zusätzliche Umsatzpotenziale</div>
            <v-textarea
              v-model="store.umsatzPotenziale"
              placeholder="Cross-Selling, neue Produkte, Wachstum …"
              rows="3"
              auto-grow
            />
          </v-col>
        </v-row>

      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { useCalcStore } from '../../stores/calc'
const store = useCalcStore()
</script>
