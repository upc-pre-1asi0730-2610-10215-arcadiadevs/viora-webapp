<script setup>
/**
 * Discreet EN/ES toggle for pre-login screens (login/register) that have no
 * sidebar language switcher. Persists the choice to the `viora-language`
 * localStorage key that `src/i18n.js` reads on startup, so the choice survives
 * a reload even before the user signs in.
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();

const STORAGE_KEY = 'viora-language';

const current = computed(() => (locale.value === 'es' ? 'es' : 'en'));

function toggle() {
  const next = current.value === 'en' ? 'es' : 'en';
  locale.value = next;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, next);
  }
}
</script>

<template>
  <button
    type="button"
    class="language-toggle"
    @click="toggle"
    :aria-label="t('auth.language-toggle-label')"
    :title="current === 'en' ? t('auth.language-toggle-to-spanish') : t('auth.language-toggle-to-english')"
  >
    <i class="pi pi-globe" aria-hidden="true"></i>
    <span>{{ current.toUpperCase() }}</span>
  </button>
</template>

<style scoped>
.language-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.language-toggle:hover {
  background: rgba(255, 255, 255, 0.24);
  border-color: rgba(255, 255, 255, 0.45);
}

.language-toggle i {
  font-size: 15px;
}
</style>
