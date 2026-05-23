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
    required: true
  },
  selectedScope: {
    type: [String, Number],
    required: true
  },
  timeRangeOptions: {
    type: Array,
    required: true
  },
  selectedTimeRange: {
    type: String,
    required: true
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
</script>

<template>
  <section class="dashboard-toolbar">
    <div class="view-buttons hidden lg:flex">
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

    <div class="filter-buttons flex-1 lg:flex-none">
      <pv-dropdown
          v-model="internalScope"
          :options="scopeOptions"
          optionLabel="label"
          optionValue="value"
          class="scope-select-viora w-full lg:w-[180px]"
      >
        <template #value="slotProps">
          <div v-if="slotProps.value" class="flex items-center gap-2">
            <span>{{ scopeOptions.find(o => o.value === slotProps.value)?.label }}</span>
            <span
                v-if="scopeOptions.find(o => o.value === slotProps.value)?.badge !== undefined"
                class="scope-badge"
            >
              {{ scopeOptions.find(o => o.value === slotProps.value)?.badge }}
            </span>
          </div>
        </template>
        <template #option="slotProps">
          <div class="flex items-center justify-between w-full">
            <span>{{ slotProps.option.label }}</span>
            <span v-if="slotProps.option.badge !== undefined" class="scope-badge">
              {{ slotProps.option.badge }}
            </span>
          </div>
        </template>
      </pv-dropdown>

      <pv-select-button
          v-model="internalTimeRange"
          :options="timeRangeOptions"
          optionLabel="label"
          optionValue="value"
          class="segmented-control-viora"
      />
    </div>
  </section>
</template>

<style scoped>
.dashboard-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 28px;
  background: #ffffff;
  border-radius: 16px;
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

:deep(.toolbar-btn) {
  border-radius: 8px;
  color: #333333;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  border: 1px solid #e8e4df;
  padding: 8px 16px;
}

:deep(.toolbar-btn.is-active) {
  background-color: #2e4a3a !important;
  color: #ffffff !important;
  border-color: #2e4a3a !important;
}

:deep(.toolbar-btn:disabled) {
  pointer-events: none;
  opacity: 0.5;
}

:deep(.scope-select-viora) {
  min-height: 36px;
  display: flex;
  align-items: center;
  border: 1px solid #2e4a3a;
  border-radius: 8px;
  background: #ffffff;
}

:deep(.scope-select-viora .p-dropdown-label),
:deep(.scope-select-viora .p-dropdown-trigger) {
  color: #2e4a3a;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

.scope-badge {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f8f4ed;
  color: #4f4f4f;
  font-size: 11px;
}

:deep(.segmented-control-viora) {
  background: #ffffff;
  border: 1px solid #e8e4df;
  border-radius: 8px;
  padding: 2px;
  display: flex;
  gap: 2px;
}

:deep(.segmented-control-viora .p-togglebutton) {
  border: none;
  background: transparent;
  color: #333333;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.segmented-control-viora .p-togglebutton-checked) {
  background: #2E4A3A !important;
  color: #ffffff !important;
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