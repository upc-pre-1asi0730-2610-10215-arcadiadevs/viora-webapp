<script setup>
/**
 * PlotOverviewWidget component.
 * Provides a satellite-view map and KPI summary for a selected plot.
 *
 * @component
 */
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { usePlotMap } from '../../application/use-plot-map.js';
import { useAgronomicStore } from '../../application/agronomic.store.js';

const { t } = useI18n();
const router = useRouter();

const props = defineProps({
  /**
   * List of plot entities available for selection.
   */
  plots: {
    type: Array,
    required: true
  },
  /**
   * Currently active plot entity.
   */
  selectedPlot: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:selectedPlot']);
const mapContainer = ref(null);

const agronomicStore = useAgronomicStore();
const { init, render } = usePlotMap(mapContainer);

onMounted(() => {
  if (props.selectedPlot) {
    init(props.selectedPlot);
  }
});

watch(() => props.selectedPlot, (newPlot) => {
  if (newPlot && render) {
    render(newPlot);
  }
});

/**
 * Emits the updated plot selection to the parent.
 * @param {Object} event - Selection change event.
 */
const onPlotChange = (event) => {
  emit('update:selectedPlot', event.value);
};

/**
 * Checks if the selected plot is considered healthy.
 * @type {import('vue').ComputedRef<boolean>}
 */
const isHealthy = computed(() => {
  return props.selectedPlot?.healthStatus?.toLowerCase() === 'healthy';
});

/**
 * Computed CSS styles for the health status indicator.
 * @type {import('vue').ComputedRef<Object>}
 */
const healthStyles = computed(() => ({
  backgroundColor: isHealthy.value ? '#57EBA1' : '#FF8080',
  color: '#1A2B24'
}));

/**
 * Determines the recommended action based on plot health status.
 * @returns {string} Recommended action label.
 */
const recommendedAction = computed(() => {
  return isHealthy.value ? t('dashboard.none-action') : t('dashboard.review-nutrition-action');
});

/**
 * Tooltip content explaining the NDVI risk relationship.
 * @type {string}
 */
const tooltipContent = t('dashboard.ndvi-risk-tooltip');

const openPlotOverview = () => {
  if (!props.selectedPlot?.id) return;
  router.push(`/dashboard/plot-overview/${props.selectedPlot.id}`);
};
</script>

<template>
  <pv-card class="plot-overview-container">
    <template #content>
      <div class="main-layout-viora">

        <div class="header-row">
          <h2 class="widget-title">{{ t('dashboard.plot-overview-title') }}</h2>

          <div class="controls-wrapper">
            <pv-button
                icon="pi pi-arrow-right"
                class="header-btn-action"
                aria-label="Open plot overview"
                @click="openPlotOverview"
            />
            <pv-dropdown
                :modelValue="selectedPlot"
                @change="onPlotChange"
                :options="plots"
                optionLabel="name"
                :placeholder="t('dashboard.select-plot-placeholder')"
                class="selector-viora-custom"
            />
          </div>
        </div>

        <div class="content-body">

          <div class="map-section-frame">
            <div ref="mapContainer" class="map-inner"></div>
            <div class="map-tag">
              {{ t('dashboard.satellite-data-source') }} &copy; AgroMonitoring
            </div>
          </div>

          <div v-if="selectedPlot" class="kpi-panel">

            <div class="panel-segment">
              <span class="segment-title">{{ t('dashboard.health-status-label') }}</span>
              <div class="status-pill-viora" :style="healthStyles">
                {{ selectedPlot.healthStatus }}
              </div>
            </div>

            <div class="panel-divider"></div>

            <div class="panel-segment">
              <span class="segment-title">{{ t('dashboard.phenological-risk-label') }}</span>
              <div class="risk-pill-viora">
                {{ selectedPlot.phenologicalRisk }}
              </div>
            </div>

            <div class="panel-divider"></div>

            <div class="panel-segment row-between">
              <span class="segment-title m-0">{{ t('dashboard.ndvi-label') }}</span>
              <div class="ndvi-content-group">
                <span class="ndvi-val">
                  {{ selectedPlot.currentImagery?.ndviMean?.toFixed(2) || '0.00' }}
                </span>
                <i class="pi pi-arrow-down ndvi-icon-trend"></i>
              </div>
            </div>

            <div class="panel-divider"></div>

            <div class="panel-segment last-update-row">
              <span class="segment-title-small">{{ t('dashboard.last-update-label') }}</span>
              <div class="pill-container">
                <div class="update-pill-viora">{{ agronomicStore.selectedPlotTimeElapsed }}</div>
              </div>
            </div>

            <div class="panel-divider"></div>

            <div class="footer-recommendation">
              <i class="pi pi-info-circle info-icon-small" v-tooltip="tooltipContent"></i>
              <div class="rec-texts">
                <span class="rec-label">{{ t('dashboard.recommended-action-label') }}</span>
                <button class="rec-action-link">{{ recommendedAction }}</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </template>
  </pv-card>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.plot-overview-container {
  width: 100%;
  height: 100%;
  min-height: 380px;
  border-radius: 12px;
  border: 1px solid #F0F0F3;
  background-color: #ffffff;
  box-shadow: none;
  overflow: hidden;
}

:deep(.p-card-content) {
  padding: 5px 5px 12px 10px !important;
  height: 100%;
}

.main-layout-viora {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  gap: 8px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.widget-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 20px;
  color: #1C1D21;
  margin: 0;
}

.controls-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-btn-action {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid #2E4A3A !important;
  color: #2E4A3A !important;
  background: transparent;
  transition: all 0.2s ease;
}

.header-btn-action:hover {
  background-color: #2E4A3A !important;
  color: #FFF !important;
}

:deep(.selector-viora-custom) {
  border: 1.5px solid #2E4A3A !important;
  border-radius: 6px;
  width: 192px !important;
  height: 32px;
  background-color: #ffffff;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

:deep(.selector-viora-custom:hover) {
  background-color: #2E4A3A !important;
  --p-select-color: #FFFFFF !important;
  --p-select-placeholder-color: #FFFFFF !important;
  --p-select-trigger-color: #FFFFFF !important;
  --p-dropdown-color: #FFFFFF !important;
}

:deep(.selector-viora-custom:hover .p-dropdown-label),
:deep(.selector-viora-custom:hover .p-select-label),
:deep(.selector-viora-custom:hover .p-placeholder),
:deep(.selector-viora-custom:hover .p-dropdown-trigger-icon),
:deep(.selector-viora-custom:hover .p-select-dropdown-icon),
:deep(.selector-viora-custom:hover svg) {
  color: #FFFFFF !important;
  fill: #FFFFFF !important;
}

:deep(.selector-viora-custom .p-dropdown-label) {
  font-family: Poppins, sans-serif;
  font-weight: 500;
  font-size: 12px !important;
  color: #2E4A3A;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center;
  height: 100%;
  padding: 0 8px !important;
  transition: color 0.2s ease;
}

:deep(.selector-viora-custom .p-dropdown-trigger) {
  color: #2E4A3A;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.content-body {
  display: flex;
  gap: 16px;
  flex-grow: 1;
  justify-content: space-between;
  align-items: center;
}

.map-section-frame {
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: 12px;
  border: 1px solid #F0F0F3;
  position: relative;
  overflow: hidden;
}

.map-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-tag {
  position: absolute;
  bottom: 8px;
  left: 10px;
  font-size: 9px;
  color: #8C877F;
}

.kpi-panel {
  width: 192px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: fit-content;
}

.panel-segment {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.panel-segment.row-between {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.segment-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #1C1D21;
  margin-bottom: 4px;
}

.segment-title-small {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: #1C1D21;
  line-height: 14px;
  flex: 1;
  text-align: left;
  padding-right: 12px;
}

.last-update-row {
  display: flex;
  flex-direction: row !important;
  align-items: center;
  width: 100%;
}

.pill-container {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.panel-divider {
  width: 100%;
  height: 1px;
  background-color: #EBEBF0;
  margin: 6px 0;
}

.status-pill-viora {
  padding: 4px 16px;
  border-radius: 99px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 12px;
}

.risk-pill-viora {
  background-color: #2E4A3A;
  color: #ffffff;
  padding: 4px 20px;
  border-radius: 99px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
}

.update-pill-viora {
  background-color: #F8F4ED;
  color: #2E4A3A;
  padding: 2px 10px;
  border-radius: 99px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
}

.ndvi-content-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ndvi-val {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 24px;
  color: #1C1D21;
  line-height: 1;
}

.ndvi-icon-trend {
  color: #2E4A3A;
  font-size: 14px;
}

.footer-recommendation {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: auto;
  padding-bottom: 2px;
}

.info-icon-small {
  color: #8C877F;
  font-size: 14px;
  margin-top: 2px;
}

.rec-texts {
  display: flex;
  flex-direction: column;
}

.rec-label {
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  color: #8C877F;
  line-height: 14px;
}

.rec-action-link {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: #1C1D21;
  text-decoration: underline;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  line-height: 14px;
}
</style>
