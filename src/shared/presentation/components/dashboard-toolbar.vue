<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  viewOptions: {
    type: Array,
    required: true
  },
  scopeOptions: {
    type: Array,
    default: () => []
  },
  selectedScope: {
    type: [String, Number],
    default: 'all'
  },
  timeRangeOptions: {
    type: Array,
    default: () => []
  },
  selectedTimeRange: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:selectedScope', 'update:selectedTimeRange', 'viewChange']);
const { t } = useI18n();

const internalScope = computed({
  get: () => props.selectedScope,
  set: (val) => emit('update:selectedScope', val)
});

const internalTimeRange = computed({
  get: () => props.selectedTimeRange,
  set: (val) => {
    if (val) emit('update:selectedTimeRange', val);
  }
});

/**
 * Resolves the option matching the currently selected scope value, tolerating
 * both primitive values and option objects from the Select value slot.
 */
const findScopeOption = (value) => {
  const target = value && typeof value === 'object' ? value.value : value;
  return props.scopeOptions.find((option) => option.value === target);
};
</script>

<template>
  <section class="dashboard-toolbar">
    <div class="view-buttons">
      <template v-for="option in viewOptions" :key="option.id">
        <pv-button
            v-if="!option.route"
            :label="option.labelKey ? t(option.labelKey) : option.label"
            :icon="option.icon ? `pi pi-${option.icon}` : null"
            :class="['toolbar-btn', { 'is-active': option.active }]"
            :disabled="option.disabled"
            @click="emit('viewChange', option.id)"
            text
        />
        <router-link
            v-else
            :to="option.route"
            custom
            v-slot="{ navigate, isActive }"
        >
          <pv-button
              :label="option.labelKey ? t(option.labelKey) : option.label"
              :icon="option.icon ? `pi pi-${option.icon}` : null"
              :class="['toolbar-btn', { 'is-active': isActive || option.active }]"
              :disabled="option.disabled"
              @click="navigate"
              text
          />
        </router-link>
      </template>
    </div>

    <div v-if="scopeOptions.length > 0 || timeRangeOptions.length > 0" class="filter-buttons">
      <pv-dropdown
          v-if="scopeOptions.length > 0"
          v-model="internalScope"
          :options="scopeOptions"
          optionLabel="label"
          optionValue="value"
          :placeholder="t('toolbar.selectScope')"
          class="scope-select-viora"
      >
        <template #value="slotProps">
          <div v-if="findScopeOption(slotProps.value)" class="scope-value">
            <span class="scope-value-text">{{ findScopeOption(slotProps.value)?.label }}</span>
            <span
                v-if="findScopeOption(slotProps.value)?.badge !== undefined"
                class="scope-badge"
            >
              {{ findScopeOption(slotProps.value)?.badge }}
            </span>
          </div>
          <span v-else class="scope-value-text scope-placeholder">{{ t('toolbar.selectScope') }}</span>
        </template>
        <template #option="slotProps">
          <div class="scope-option">
            <span>{{ slotProps.option.label }}</span>
            <span v-if="slotProps.option.badge !== undefined" class="scope-badge">
              {{ slotProps.option.badge }}
            </span>
          </div>
        </template>
      </pv-dropdown>

      <pv-select-button
          v-if="timeRangeOptions.length > 0"
          v-model="internalTimeRange"
          :options="timeRangeOptions"
          optionLabel="label"
          optionValue="value"
          :allow-empty="false"
          class="segmented-control-viora"
      />
    </div>
  </section>
</template>

<style scoped>
.dashboard-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.view-buttons,
.filter-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-buttons {
  margin-left: auto;
}

/* ---- View buttons (IoT Devices / Plot Overview / Weather) ---- */
:deep(.toolbar-btn.p-button) {
  height: 40px;
  padding: 0 16px;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid #e8e4df;
  background: #ffffff;
  color: #333333;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
}

:deep(.toolbar-btn.p-button .p-button-label) {
  color: inherit;
  font-weight: 500;
}

:deep(.toolbar-btn.p-button .p-button-icon) {
  font-size: 15px;
  color: inherit;
}

:deep(.toolbar-btn.p-button:hover) {
  background: #f8f4ed;
  border-color: #d9d3ca;
  color: #2e4a3a;
}

:deep(.toolbar-btn.p-button.is-active),
:deep(.toolbar-btn.p-button.is-active:hover) {
  background: #2e4a3a;
  border-color: #2e4a3a;
  color: #ffffff;
}

:deep(.toolbar-btn.p-button:disabled) {
  pointer-events: none;
  opacity: 0.5;
}

/* ---- Scope dropdown ---- */
:deep(.scope-select-viora.p-select) {
  min-width: 180px;
  height: 40px;
  display: flex;
  align-items: center;
  border: 1px solid #2e4a3a;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: none;
}

:deep(.scope-select-viora .p-select-label) {
  display: flex;
  align-items: center;
  padding: 0 14px;
  color: #2e4a3a;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

:deep(.scope-select-viora .p-select-dropdown) {
  color: #2e4a3a;
  width: 2.4rem;
}

.scope-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scope-value-text {
  color: #2e4a3a;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

.scope-placeholder {
  color: #8c877f;
}

.scope-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.scope-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: #f8f4ed;
  color: #4f4f4f;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
}

/* ---- Time-range segmented control ---- */
:deep(.segmented-control-viora.p-selectbutton) {
  background: #ffffff;
  border: 1px solid #e8e4df;
  border-radius: 8px;
  padding: 3px;
  display: flex;
  gap: 3px;
}

:deep(.segmented-control-viora .p-togglebutton) {
  border: none;
  background: transparent;
  border-radius: 6px;
  padding: 6px 14px;
  min-height: 32px;
  transition: all 0.2s ease;
}

:deep(.segmented-control-viora .p-togglebutton .p-togglebutton-label),
:deep(.segmented-control-viora .p-togglebutton .p-togglebutton-content) {
  color: #4f4f4f;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
}

:deep(.segmented-control-viora .p-togglebutton:hover:not(.p-togglebutton-checked)) {
  background: #f8f4ed;
}

:deep(.segmented-control-viora .p-togglebutton.p-togglebutton-checked) {
  background: #2e4a3a;
}

:deep(.segmented-control-viora .p-togglebutton.p-togglebutton-checked .p-togglebutton-label),
:deep(.segmented-control-viora .p-togglebutton.p-togglebutton-checked .p-togglebutton-content) {
  color: #ffffff;
}

/* PrimeVue paints an active background layer behind the checked toggle; hide it
   so our flat green fill shows through cleanly. */
:deep(.segmented-control-viora .p-togglebutton::before) {
  background: transparent;
  box-shadow: none;
}

@media (max-width: 1100px) {
  .dashboard-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .view-buttons,
  .filter-buttons {
    flex-wrap: wrap;
  }

  .filter-buttons {
    margin-left: 0;
  }
}
</style>
