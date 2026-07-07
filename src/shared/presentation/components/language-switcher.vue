<script setup>
import { watch } from 'vue';
import {useI18n} from "vue-i18n";
const { locale, availableLocales } = useI18n();

// Persist to the same key the pre-login language toggle reads/writes, so the
// choice made here also survives a reload before the user reaches this screen again.
watch(locale, (next) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('viora-language', next);
  }
});
</script>

<template>
  <pv-select-button v-model="locale" :options="availableLocales">
    <template #option="slotProps">
      <span>{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>

<style scoped>
:deep(.p-select-button) {
  display: flex;
  gap: 2px;
  background: #F5F5FA;
  padding: 2px;
  border-radius: 6px;
}

:deep(.p-togglebutton) {
  font-size: 11px !important;
  font-weight: 600;
  padding: 4px 8px !important;
  border: none !important;
  border-radius: 4px !important;
  min-width: 36px;
  background: transparent;
  color: #8C877F;
  transition: all 0.2s ease;
}

:deep(.p-togglebutton-checked) {
  background: #ffffff !important;
  color: #2E4A3A !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>