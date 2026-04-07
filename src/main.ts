import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import App from './App.vue'
import './assets/global.css'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'uhlsport',
    themes: {
      uhlsport: {
        dark: false,
        colors: {
          primary:    '#F05A00',
          secondary:  '#111111',
          background: '#f2f2f2',
          surface:    '#ffffff',
          error:      '#bf1e1e',
          success:    '#0d7a3e',
          warning:    '#F05A00',
          'on-primary':   '#ffffff',
          'on-secondary': '#ffffff',
          'on-background':'#111111',
          'on-surface':   '#111111',
        },
      },
    },
  },
  defaults: {
    VTextField:   { variant: 'outlined', density: 'comfortable', color: 'primary', hideDetails: 'auto' },
    VSelect:      { variant: 'outlined', density: 'comfortable', color: 'primary', hideDetails: 'auto' },
    VTextarea:    { variant: 'outlined', density: 'comfortable', color: 'primary', hideDetails: 'auto' },
    VNumberInput: { variant: 'outlined', density: 'comfortable', color: 'primary', hideDetails: 'auto' },
    VExpansionPanels: { variant: 'accordion', eager: true },
    VExpansionPanel: { elevation: 0 },
    VBtn:         { rounded: 'sm' },
    VBtnToggle:   { rounded: 'sm', color: 'secondary', divided: true },
  },
})

const pinia = createPinia()
const app   = createApp(App)
app.use(pinia)
app.use(vuetify)
app.mount('#app')
