import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import pinia from "./pinia.js";
import i18n from "./i18n.js";
import router from "./router.js";

createApp(App)
    .use(pinia)
    .use(i18n)
    .use(router)
    .mount('#app')
