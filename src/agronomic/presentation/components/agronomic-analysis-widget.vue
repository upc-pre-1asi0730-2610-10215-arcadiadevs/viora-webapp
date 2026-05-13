<script setup>
/**
 * AgronomicAnalysisWidget component.
 * Visualizes historical agronomic trends (NDVI) using interactive charts.
 * Supports filtering by plot and time range.
 *
 * @component
 */
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgronomicStore } from '../../application/agronomic.store.js';
import { AgronomicAnalysisFormatter } from "../../infrastructure/agronomic-analysis.formatter.js";

const { t } = useI18n();
const agronomicStore = useAgronomicStore();

/**
 * Currently hovered NDVI value on the chart.
 * @type {import('vue').Ref<string|null>}
 */
const currentNdvi = ref(null);

/**
 * Available time ranges for analysis.
 * @type {Array<{label: string, value: string}>}
 */
const timeRangeOptions = [
  { label: t('dashboard.time-range-7days'), value: '7days' },
  { label: t('dashboard.time-range-30days'), value: '30days' },
  { label: t('dashboard.time-range-campaign'), value: 'campaign' }
];

/**
 * Plots available for selection, including an aggregate option.
 * @type {import('vue').ComputedRef<Array<{name: string, id: string|number}>>}
 */
const plotOptions = computed(() => {
  const options = [{ name: t('dashboard.all-plots-label'), id: 'all' }];
  return [...options, ...agronomicStore.plots];
});

/**
 * Handles chart hover events to update the reactive currentNdvi state.
 * @param {Object} element - Hovered chart element.
 */
const handleChartHover = (element) => {
  if (element && element.datasetIndex === 0) {
    const index = element.index;
    const value = agronomicStore.analysisData?.ndviSeries[index];
    currentNdvi.value = value !== undefined ? value.toFixed(2) : null;
  } else {
    currentNdvi.value = null;
  }
};

/**
 * Configuration options for the PrimeVue Chart.
 * @type {import('vue').Ref<Object>}
 */
const chartOptions = ref(AgronomicAnalysisFormatter.getChartOptions(handleChartHover));

/**
 * Updates the selected plot in the store.
 * @param {Object} e - Event containing the new plot selection.
 */
const onPlotChange = (e) => {
  agronomicStore.setAnalysisPlot(e.value);
};

/**
 * Updates the selected time range in the store.
 * @param {Object} e - Event containing the new time range.
 */
const onTimeRangeChange = (e) => {
  agronomicStore.setAnalysisTimeRange(e.value);
};

/**
 * Label for the trend indicator based on the active time range.
 * @type {import('vue').ComputedRef<string>}
 */
const trendLabel = computed(() => {
  const range = agronomicStore.analysisTimeRange;
  if (range === '7days') return t('dashboard.trend-label-7days');
  if (range === 'campaign') return t('dashboard.trend-label-campaign');
  return t('dashboard.trend-label-30days');
});

/**
 * Visual styles for the status tag.
 * @type {import('vue').ComputedRef<Object>}
 */
const statusTagStyles = computed(() => {
  const status = agronomicStore.analysisData?.statusLabel;
  let baseColor = '#57EBA1';
  if (status === 'Review' || status === 'Requires attention') {
    baseColor = '#FF8080';
  } else if (status === 'Stable') {
    baseColor = '#F0F4FF';
  }

  return {
    backgroundColor: `${baseColor}33`,
    color: '#333'
  };
});

onMounted(async () => {
  if (!agronomicStore.plotsLoaded) {
    await agronomicStore.fetchPlots();
  }
  await agronomicStore.fetchAnalysisStatistics();
});

</script>

<template>
  <div class="analysis-widget-container">
    <pv-card class="analysis-card-viora">
      <template #content>
        <div class="analysis-wrapper">
          <header class="analysis-header">
            <div class="text-section">
              <h2 class="analysis-title">{{ t('dashboard.analysis-title') }}</h2>
              <p class="analysis-subtitle">{{ t('dashboard.analysis-subtitle') }}</p>
            </div>

            <div class="controls-section">
              <pv-select-button
                  :modelValue="agronomicStore.analysisTimeRange"
                  :options="timeRangeOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="segmented-control-viora"
                  @change="onTimeRangeChange"
              />

              <pv-select
                  :modelValue="agronomicStore.analysisPlotId"
                  :options="plotOptions"
                  optionLabel="name"
                  optionValue="id"
                  :placeholder="t('dashboard.select-plot-placeholder')"
                  class="selector-viora-custom plot-select"
                  @change="onPlotChange"
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="flex items-center justify-center gap-2 w-full">
                    <span>{{ slotProps.value === 'all' ? t('dashboard.all-plots-label') : agronomicStore.plots.find(p => p.id === slotProps.value)?.name }}</span>
                    <span v-if="slotProps.value === 'all'" class="plot-count-badge">
                      {{ agronomicStore.plots.length }}
                    </span>
                  </div>
                  <span v-else class="w-full text-center">{{ slotProps.placeholder }}</span>
                </template>

                <template #option="slotProps">
                  <div class="flex items-center justify-between w-full">
                    <span>{{ slotProps.option.name }}</span>
                    <span v-if="slotProps.option.id === 'all'" class="plot-count-badge no-hover">
                      {{ agronomicStore.plots.length }}
                    </span>
                  </div>
                </template>
              </pv-select>
            </div>
          </header>

          <div class="analysis-description-centered">
            {{ agronomicStore.analysisData?.description || t('dashboard.loading-analysis-description') }}
          </div>

          <div class="chart-display-area">
            <pv-chart
                v-if="agronomicStore.analysisData && !agronomicStore.analysisLoading"
                type="bar"
                :data="agronomicStore.analysisChartData"
                :options="chartOptions"
                class="agronomic-chart"
            />

            <div v-else-if="agronomicStore.analysisLoading" class="chart-loader">
              <i class="pi pi-spin pi-spinner text-3xl text-green-700"></i>
              <span>{{ t('dashboard.synchronizing-historical-series') }}</span>
            </div>

            <div v-else class="chart-loader empty-state">
              <i class="pi pi-filter-slash text-3xl text-gray-300"></i>
              <span>{{ t('dashboard.insufficient-records-msg') }}</span>
            </div>
          </div>

          <footer class="analysis-footer-labels">
            <div class="footer-tag tag-left">
              <span class="tag-label">{{ t('dashboard.current-value-label') }}</span>
              <span class="tag-value">{{ currentNdvi || '--' }}</span>
            </div>

            <div class="footer-tag tag-middle">
              <span class="tag-label">{{ t('dashboard.observation-label') }}</span>
              <span class="tag-text">{{ agronomicStore.analysisData?.observation || t('dashboard.no-observations-msg') }}</span>
            </div>

            <div class="footer-tag tag-right" :style="statusTagStyles">
              <span class="tag-label">{{ trendLabel }}</span>
              <span class="tag-value">{{ agronomicStore.analysisData?.trend || '--' }}</span>
            </div>
          </footer>
        </div>
      </template>
    </pv-card>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

.analysis-widget-container {
  width: 100%;
  max-width: 1200px;
  margin: 26px auto 0 auto;
}

.analysis-card-viora {
  border-radius: 12px;
  border: 1px solid #F0F0F3;
  box-shadow: none;
  background: #ffffff;
}

:deep(.p-card-content) {
  padding: 24px 32px !important;
}

.analysis-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  width: 100%;
}

.text-section {
  text-align: left;
}

.analysis-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 20px;
  color: #1C1D21;
  margin: 0;
}

.analysis-subtitle {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #8C877F;
  margin: 2px 0 0 0;
}

.analysis-description-centered {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 400;
  color: #4F4F4F;
  text-align: center;
  width: 100%;
}

.controls-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

:deep(.segmented-control-viora) {
  background: #ffffff;
  border: 1.5px solid #EBEBF0;
  border-radius: 8px;
  padding: 2px;
  display: flex;
  gap: 2px;
}

:deep(.segmented-control-viora .p-togglebutton) {
  border: none;
  background: transparent;
  color: #8C877F;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

:deep(.segmented-control-viora .p-togglebutton-checked) {
  background: #F2F2F5 !important;
  color: #2E4A3A !important;
}

:deep(.selector-viora-custom) {
  border: 1.5px solid #2E4A3A !important;
  border-radius: 4px;
  width: 144px !important;
  height: 32px;
  background-color: #ffffff;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 !important;
}

:deep(.selector-viora-custom:hover) {
  background-color: #2E4A3A !important;
  --p-select-color: #FFFFFF !important;
  --p-select-placeholder-color: #FFFFFF !important;
  --p-select-trigger-color: #FFFFFF !important;
}

:deep(.selector-viora-custom:hover .p-select-label),
:deep(.selector-viora-custom:hover .p-placeholder),
:deep(.selector-viora-custom:hover .p-select-dropdown-icon),
:deep(.selector-viora-custom:hover svg) {
  color: #FFFFFF !important;
  fill: #FFFFFF !important;
}

:deep(.selector-viora-custom .p-select-label) {
  font-family: Poppins, sans-serif;
  font-weight: 500;
  font-size: 12px !important;
  color: #2E4A3A;
  padding: 0 !important;
  margin: 0 !important;
  display: grid !important;
  place-items: center !important;
  width: 100%;
  height: 100%;
}

:deep(.selector-viora-custom .p-select-dropdown) {
  position: absolute;
  right: 8px;
}

.plot-count-badge {
  background-color: #F2F2F5;
  color: #2E4A3A;
  border-radius: 99px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
}

:deep(.selector-viora-custom:hover) .plot-count-badge {
  color: #2E4A3A !important;
  background-color: #F2F2F5 !important;
}

.chart-display-area {
  width: 100%;
  height: 350px;
  position: relative;
}

.agronomic-chart {
  width: 100%;
  height: 100%;
}

.chart-loader {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #FAFAFB;
  border-radius: 12px;
  color: #8C877F;
  font-family: 'Poppins', sans-serif;
}

.empty-state {
  border: 1px dashed #EBEBF0;
}

.analysis-footer-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
  margin-top: 10px;
}

.footer-tag {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 500;
}

.tag-left {
  width: 200px;
  background-color: #F8F4ED;
  color: #333;
  justify-content: center;
}

.tag-middle {
  max-width: 500px;
  width: 100%;
  height: auto;
  min-height: 36px;
  background-color: #F8F4ED;
  color: #333;
  justify-content: center;
  text-align: center;
  padding: 8px 16px;
}

.tag-right {
  width: 200px;
  justify-content: center;
}

.tag-label {
  margin-right: 6px;
}

.tag-value, .tag-text {
  font-weight: 500;
}

@media (max-width: 991px) {
  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .controls-section {
    width: 100%;
    flex-direction: column;
  }
  :deep(.selector-viora-custom) {
    width: 100% !important;
  }
  .segmented-control-viora {
    width: 100%;
    justify-content: space-between;
  }
  :deep(.segmented-control-viora .p-togglebutton) {
    flex: 1;
    text-align: center;
  }
  .analysis-footer-labels {
    flex-direction: column;
    align-items: center;
  }
  .footer-tag {
    width: 100% !important;
    max-width: none !important;
  }
}
</style>