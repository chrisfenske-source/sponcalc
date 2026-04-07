<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="480">
    <v-card>
      <v-card-title class="text-mono pt-5 px-6" style="font-size:16px;font-weight:700">
        Auswertung per E-Mail senden
      </v-card-title>
      <v-card-text class="px-6">
        <div class="label-mono mb-1 mt-2">Empfänger-Adresse *</div>
        <v-text-field
          v-model="email"
          type="email"
          placeholder="empfaenger@beispiel.de"
          :rules="[v => !!v || 'Pflichtfeld', v => /.+@.+\..+/.test(v) || 'Keine gültige E-Mail']"
        />
        <div class="label-mono mb-1 mt-2">Betreff</div>
        <v-text-field v-model="betreff" placeholder="Kalkulation Ausrüstungsvertrag" />
        <div class="label-mono mb-1 mt-2">Nachricht (optional)</div>
        <v-textarea v-model="nachricht" rows="3" placeholder="Zusätzliche Informationen …" auto-grow />
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Abbrechen</v-btn>
        <v-btn
          color="primary"
          :loading="sending"
          :disabled="!email || sending"
          @click="send"
        >
          Senden
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCalcStore } from '../stores/calc'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()

const store    = useCalcStore()
const email    = ref('')
const betreff  = ref(`Kalkulation – ${store.vereinName || 'Ausrüstungsvertrag'}`)
const nachricht = ref('')
const sending  = ref(false)

async function send() {
  if (!email.value) return
  sending.value = true
  try {
    const body = new FormData()
    body.append('to',       email.value)
    body.append('subject',  betreff.value)
    body.append('message',  nachricht.value)
    body.append('verein',   store.vereinName)
    body.append('liga',     store.liga)
    body.append('totalDB',  String(store.totalDB))
    await fetch('send.php', { method: 'POST', body })
  } finally {
    sending.value = false
  }
}
</script>
