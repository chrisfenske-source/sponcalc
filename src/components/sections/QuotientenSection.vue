<template>
  <v-expansion-panels class="op-panel mb-n1" multiple>
    <v-expansion-panel>
      <v-expansion-panel-title>
        <span class="panel-num">02</span>
        Bewertungsquotienten
        <span class="ms-auto text-caption text-medium-emphasis pe-2 d-none d-sm-block">
          HEK/COS · UVP/COS
        </span>
      </v-expansion-panel-title>
      <v-expansion-panel-text>

        <div class="lock-box mb-4">
          <v-icon size="20" :color="store.quotientUnlocked ? 'warning' : 'secondary'">
            {{ store.quotientUnlocked ? 'mdi-lock-open-outline' : 'mdi-lock-outline' }}
          </v-icon>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:#111">
              {{ store.quotientUnlocked ? 'Quotienten entsperrt' : 'Quotienten gesperrt' }}
            </div>
            <div style="font-size:12px;color:#4a4946;margin-top:2px">
              Standard: HEK/COS {{ store.hekCosQuotient }} · UVP/COS {{ store.uvpCosQuotient }}
            </div>
          </div>
          <v-btn
            size="small"
            variant="outlined"
            color="secondary"
            @click="store.quotientUnlocked = !store.quotientUnlocked"
          >
            {{ store.quotientUnlocked ? 'Sperren' : 'Entsperren' }}
          </v-btn>
        </div>

        <v-row dense>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">
              HEK/COS-Quotient
              <v-tooltip text="Verhältnis HEK zu Herstellkosten (COS). Standard: 2.5" location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon>
                </template>
              </v-tooltip>
            </div>
            <v-text-field
              v-model.number="store.hekCosQuotient"
              type="number"
              step="0.1"
              min="1"
              :disabled="!store.quotientUnlocked"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <div class="label-mono mb-1">
              UVP/COS-Quotient
              <v-tooltip text="Verhältnis UVP zu Herstellkosten (COS). Standard: 5.0" location="top">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" class="ms-1">mdi-information-outline</v-icon>
                </template>
              </v-tooltip>
            </div>
            <v-text-field
              v-model.number="store.uvpCosQuotient"
              type="number"
              step="0.1"
              min="1"
              :disabled="!store.quotientUnlocked"
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
