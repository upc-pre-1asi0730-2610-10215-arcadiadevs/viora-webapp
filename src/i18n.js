import en from './locales/en.json';
import es from './locales/es.json';
import {createI18n} from "vue-i18n";

// Restore the language chosen via the language toggle (pre-login screens) or the
// in-app language switcher, so every screen — including login/register, which
// render before any layout switcher is available — honours the saved choice.
const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('viora-language') : null;
const initialLocale = savedLocale === 'es' || savedLocale === 'en' ? savedLocale : 'en';

const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'en',
    messages: { en, es}
});

export default i18n;