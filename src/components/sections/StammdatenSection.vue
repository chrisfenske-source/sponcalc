<template>
  <v-expansion-panels class="op-panel mb-n1" multiple>
    <v-expansion-panel>
      <v-expansion-panel-title>
        <span class="panel-num">01</span>
        Allgemeine Informationen
        <span class="ms-auto text-caption text-medium-emphasis pe-2 d-none d-sm-block">
          Verein, Fachhändler, interne Ansprechpartner
        </span>
      </v-expansion-panel-title>
      <v-expansion-panel-text>

        <!-- Verein -->
        <div class="section-divider">
          <div class="section-divider-line" />
          <span class="section-divider-label">Verein</span>
          <div class="section-divider-line" />
        </div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Name Verein *</div>
            <v-text-field v-model="store.vereinName" placeholder="z. B. FC Musterstadt"
              :rules="[v => !!v || 'Pflichtfeld']" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Liga *</div>
            <v-text-field v-model="store.liga" placeholder="Bundesliga"
              :rules="[v => !!v || 'Pflichtfeld']" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Sportart</div>
            <v-text-field v-model="store.sportart" placeholder="z. B. Fußball" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Kundennr. Freiware</div>
            <v-text-field v-model="store.kdnrVereinFreiware" placeholder="z. B. 123456" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Kundennr. Nachkauf</div>
            <v-text-field v-model="store.kdnrVereinNachkauf" placeholder="z. B. 123456" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Nachkauf-Kondition Verein
              <v-tooltip text="Dezimalzahl, z.B. 0.10 für 10%" location="top">
                <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
              </v-tooltip>
            </div>
            <v-text-field v-model.number="store.vereinNachkauf" type="number" step="0.01" min="0" max="1"
              hint="Dezimal, z.B. 0.10 = 10%" persistent-hint />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Erlösschmälerungen Verein
              <v-tooltip text="Skonto, Boni etc. Dezimalzahl." location="top">
                <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
              </v-tooltip>
            </div>
            <v-text-field v-model.number="store.vereinErloesschmaelerung" type="number" step="0.01" min="0" max="1"
              hint="Dezimal, z.B. 0.05 = 5%" persistent-hint />
          </v-col>
        </v-row>

        <!-- Fachhändler -->
        <div class="section-divider">
          <div class="section-divider-line" />
          <span class="section-divider-label">Fachhändler</span>
          <div class="section-divider-line" />
        </div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Name Fachhändler</div>
            <v-text-field v-model="store.haendlerName" placeholder="z. B. Teamworld" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Kundennr. Fachhändler</div>
            <v-text-field v-model="store.kdnrHaendler" placeholder="z. B. 123456" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Nachkauf-Kondition Händler
              <v-tooltip text="Standard: 30% → 0.30" location="top">
                <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
              </v-tooltip>
            </div>
            <v-text-field v-model.number="store.haendlerNachkauf" type="number" step="0.01" min="0" max="1" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Einkauf Freiware Händler
              <v-tooltip text="Standard: 40% → 0.40" location="top">
                <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
              </v-tooltip>
            </div>
            <v-text-field v-model.number="store.haendlerFreiware" type="number" step="0.01" min="0" max="1" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Erlösschmälerungen Händler
              <v-tooltip text="Standard: 8% → 0.08" location="top">
                <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
              </v-tooltip>
            </div>
            <v-text-field v-model.number="store.haendlerErloesschmaelerung" type="number" step="0.01" min="0" max="1" />
          </v-col>
        </v-row>

        <!-- Intern -->
        <div class="section-divider">
          <div class="section-divider-line" />
          <span class="section-divider-label">Intern</span>
          <div class="section-divider-line" />
        </div>
        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Außendienst</div>
            <v-text-field v-model="store.aussendienst" placeholder="z. B. Max Mustermann" />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">Umsatzverantwortliche Person</div>
            <v-text-field v-model="store.verantwortlich" placeholder="z. B. Max Mustermann" />
          </v-col>
          <v-col cols="12" sm="4">
            <div class="label-mono mb-1">Laufzeit
              <v-tooltip text="Pro Jahr wird ein eigener Tab für Sponsoring und Umsatz angelegt." location="top">
                <template #activator="{ props }"><v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon></template>
              </v-tooltip>
            </div>
            <v-select
              :model-value="store.laufzeit"
              @update:model-value="store.setLaufzeit"
              :items="[1,2,3,4,5]"
              :item-title="(n: number) => `${n} Jahr${n > 1 ? 'e' : ''}`"
              :item-value="(n: number) => n"
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
