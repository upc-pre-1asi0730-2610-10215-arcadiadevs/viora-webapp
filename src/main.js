import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import Material from '@primeuix/themes/material';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import {
    Button, Card, ConfirmDialog, Drawer, Dropdown, ProgressBar, Select, SelectButton, Tag, Toolbar, Toast, Tooltip,
    InputNumber, InputText, DataTable, Column
} from "primevue";
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import i18n from "./i18n.js"
import pinia from "./pinia.js";
import Chart from "primevue/chart";
import router from "./router.js";

createApp(App)
    .use(pinia)
    .use(i18n)
    .use(router)
    .use(PrimeVue, { theme: { preset: Material }, ripple: true })
    .use(ToastService)
    .use(ConfirmationService)
    .component('pv-card', Card)
    .component('pv-button', Button)
    .component('pv-tag', Tag)
    .component('pv-dropdown', Dropdown)
    .component('pv-progress-bar', ProgressBar)
    .component('pv-select', Select)
    .component('pv-select-button', SelectButton)
    .component('pv-chart', Chart)
    .component('pv-toolbar', Toolbar)
    .component('pv-drawer', Drawer)
    .component('pv-toast', Toast)
    .component('pv-input-number', InputNumber)
    .component('pv-input-text', InputText)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-data-table', DataTable)
    .component('pv-column', Column)
    .directive('tooltip', Tooltip)
    .mount('#app')
