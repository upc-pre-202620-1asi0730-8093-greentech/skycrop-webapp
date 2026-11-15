
import {createApp} from 'vue'
import './fonts.css'
import './style.css'
import App from './app.vue'
import router from './router.js'
import i18n from './i18n.js'
import {createPinia} from 'pinia'

import PrimeVue from 'primevue/config'
import Material from '@primeuix/themes/material'

import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'

import {
    AutoComplete,
    Button,
    Card,
    Column,
    ConfirmDialog,
    DataTable,
    DatePicker,
    FloatLabel,
    InputText,
    Select,
    SelectButton,
    Textarea,
    Toolbar
} from 'primevue'

const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY

createApp(App)
    .use(i18n)
    .use(createPinia())
    .use(PrimeVue, {
        theme: {
            preset: Material,
            options: {
                darkModeSelector: false
            }
        },
        ripple: true,
        license: primeUiLicenseKey
    })
    .use(router)
    .component('pv-auto-complete', AutoComplete)
    .component('pv-button', Button)
    .component('pv-card', Card)
    .component('pv-column', Column)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-data-table', DataTable)
    .component('pv-date-picker', DatePicker)
    .component('pv-float-label', FloatLabel)
    .component('pv-input-text', InputText)
    .component('pv-select', Select)
    .component('pv-select-button', SelectButton)
    .component('pv-textarea', Textarea)
    .component('pv-toolbar', Toolbar)
    .mount('#app')
