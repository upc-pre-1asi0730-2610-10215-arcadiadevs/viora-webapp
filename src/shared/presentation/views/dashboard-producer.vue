<script setup>
/**
 * ProducerDashboardView component.
 * Main dashboard for agricultural producers, orchestrating real-time surveillance and agronomic monitoring.
 *
 * @component
 */

import { onMounted, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgronomicStore } from '../../../agronomic/application/agronomic.store.js';
import { DateTimeFormatter } from '../../infrastructure/date-time.formatter.js';

import OverallPlotHealthCard from '../../../agronomic/presentation/components/overall-plot-health-card.vue';
import NdviStatusCard from '../../../agronomic/presentation/components/ndvi-status-card.vue';
import ChillAccumulationCard from '../../../agronomic/presentation/components/chill-accumulation-card.vue';
import YieldForecastCard from '../../../agronomic/presentation/components/yield-forecast-card.vue';
import PlotOverviewWidget from "../../../agronomic/presentation/components/plot-overview-widget.vue";
import AgronomicAnalysisWidget from "../../../agronomic/presentation/components/agronomic-analysis-widget.vue";
import WeatherSummary from "../../../agronomic/presentation/components/weather-summary.vue";
import RecentAlertsWidget from "../../../surveillance/presentation/components/recent-alerts-widget.vue";

const agronomicStore = useAgronomicStore();
const { t } = useI18n();

/**
 * Current time range selected for the KPI summary.
 * @type {import('vue').Ref<string>}
 */
const summaryTimeRange = ref('current');

/**
 * Localized options for the summary time range selector.
 * @type {import('vue').ComputedRef<Array<{label: string, value: string}>>}
 */
const summaryRangeOptions = computed(() => [
  { label: t('dashboard.time-range-7days'), value: '7days' },
  { label: t('dashboard.time-range-30days'), value: '30days' },
  { label: t('dashboard.time-range-current'), value: 'current' }
]);

/**
 * Relative time string indicating when the data was last updated.
 * @type {import('vue').ComputedRef<string>}
 */
const lastUpdatedText = computed(() => {
  return DateTimeFormatter.formatRelativeTime(summary.value?.updatedAt);
});

/**
 * Triggers a manual refresh of the monitoring summary.
 */
const onRefreshSummary = () => {
  agronomicStore.fetchMonitoringSummary(summaryTimeRange.value);
};

/**
 * Updates the summary data when the time range selection changes.
 * @param {Object} event - SelectButton change event.
 */
const onSummaryRangeChange = (event) => {
  if (event.value) {
    agronomicStore.fetchMonitoringSummary(event.value);
  }
};

/**
 * Computed reference to the hydrated domain monitoring summary entity.
 * @type {import('vue').ComputedRef<Object|null>}
 */
const summary = computed(() => {
  return agronomicStore.monitoringSummary;
});

onMounted(() => {
  agronomicStore.fetchPlots();
  agronomicStore.fetchMonitoringSummary('current');
});
</script>

<template>
  <div class="producer-dashboard-container bg-[#F8F4ED] min-h-screen">

    <div class="dashboard-toolbar mb-4">
      <div class="toolbar-side hidden lg:flex"></div>

      <div class="toolbar-center">
        <pv-select-button
            v-model="summaryTimeRange"
            :options="summaryRangeOptions"
            optionLabel="label"
            optionValue="value"
            class="segmented-control-viora"
            @change="onSummaryRangeChange"
        />
      </div>

      <div class="toolbar-side right-align">
        <div class="status-sync-box">
          <span class="status-label">{{ t('dashboard.updated-label') }}</span>
          <span class="status-time">{{ lastUpdatedText }}</span>
        </div>
        <pv-button
            icon="pi pi-refresh"
            class="refresh-btn-viora"
            @click="onRefreshSummary"
        />
      </div>
    </div>

    <div
        v-if="agronomicStore.summaryLoaded && summary"
        class="kpi-grid-container mx-auto mb-[26px]"
    >
      <OverallPlotHealthCard
          :status="summary.overallPlotHealth.status"
          :is-healthy="!summary.overallPlotHealth.isCritical"
          :healthy-plots-count="summary.overallPlotHealth.healthyPlotsCount"
          :review-plots-count="summary.overallPlotHealth.reviewPlotsCount"
      />

      <NdviStatusCard
          :value="summary.latestNdvi.ndviIndex"
          :trend="summary.latestNdvi.ndviTrend"
          :status-label="summary.latestNdvi.ndviStatusLabel"
      />

      <ChillAccumulationCard
          :value="summary.chillHourRecord.accumulatedChillPortions"
          :weekly-diff="summary.chillHourRecord.weeklyDiff"
          :threshold="summary.chillHourRecord.threshold"
      />

      <YieldForecastCard
          :tonnes="summary.yieldForecast.tonnes"
          :risk-level="summary.yieldForecast.riskLevel"
      />
    </div>

    <div v-else-if="agronomicStore.summaryLoaded && !summary" class="kpi-empty-state mx-auto mb-[26px]">
      <div class="empty-card-viora">
        <i class="pi pi-exclamation-circle text-gray-300 text-3xl"></i>
        <p>{{ t('dashboard.insufficient-records-msg') }}</p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-full mx-auto mb-[26px] px-4 lg:px-0">
      <div
          v-for="i in 4"
          :key="i"
          class="h-[172px] w-full w-[280px] bg-white/50 animate-pulse rounded-xl border border-gray-100 shadow-sm"
      ></div>
    </div>

    <section class="w-full max-w-[1200px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-start gap-6 px-4 lg:px-0"
             :style="{ marginBottom : '26px' }"
    >
      <div class="flex-1 min-w-[350px]">
        <PlotOverviewWidget
            v-if="agronomicStore.plotsLoaded"
            :plots="agronomicStore.plots"
            :selected-plot="agronomicStore.selectedPlot"
            @update:selected-plot="(plot) => agronomicStore.selectPlot(plot.id)"
        />

        <div v-else class="h-[380px] w-full bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
          <div class="flex flex-col items-center gap-3">
            <i class="pi pi-spin pi-spinner text-3xl text-green-600"></i>
            <span class="text-gray-400 font-poppins font-medium">{{ t('dashboard.loading-telemetry') }}</span>
          </div>
        </div>
      </div>

      <div class="flex-shrink-0 ml-0 lg:ml-0 mx-auto lg:mx-0" style="width: 323px; max-width: 100%;">
        <WeatherSummary />
      </div>
    </section>

    <section class="w-full max-w-full mx-auto px-4 lg:px-0 mb-[26px] flex">
      <div class="w-full lg:w-[75%]">
        <RecentAlertsWidget />
      </div>
      <div class="hidden lg:block lg:w-[25%]"></div>
    </section>

    <section class="w-full max-w-full mx-auto px-4 lg:px-0 pb-10">
      <AgronomicAnalysisWidget />
    </section>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.font-poppins {
  font-family: 'Poppins', sans-serif;
}

.producer-dashboard-container {
  width: 100%;
}

.dashboard-toolbar {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 4px;
}

.toolbar-side {
  flex: 1;
  display: flex;
}

.toolbar-side.right-align {
  justify-content: flex-end;
  gap: 12px;
}

.toolbar-center {
  display: flex;
  justify-content: center;
}

.status-sync-box {
  background: transparent;
  border: 1.5px solid #2E4A3A;
  border-radius: 8px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Poppins', sans-serif;
  height: 42px;
}

.status-label {
  color: #8C877F;
  font-size: 12px;
  font-weight: 500;
}

.status-time {
  color: #2E4A3A;
  font-size: 12px;
  font-weight: 600;
}

.refresh-btn-viora {
  background: transparent !important;
  border: 1.5px solid #2E4A3A !important;
  color: #2E4A3A !important;
  border-radius: 8px !important;
  width: 42px;
  height: 42px;
  padding: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.refresh-btn-viora:hover {
  background: #2E4A3A !important;
  color: #ffffff !important;
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

.kpi-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 26px;
  max-width: 1200px;
  justify-items: start;
  margin-bottom: 26px;
}

.kpi-empty-state {
  max-width: 1200px;
  width: 100%;
  margin-bottom: 26px;
}

.empty-card-viora {
  background: #ffffff;
  border-radius: 12px;
  border: 1px dashed #EBEBF0;
  height: 172px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #8C877F;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
}

@media (min-width: 1024px) {
  .kpi-grid-container {
    grid-template-columns: 300px 240px 240px 240px;
    justify-content: center;
  }
}

@media (max-width: 1023px) and (min-width: 640px) {
  .kpi-grid-container {
    grid-template-columns: 300px 240px;
    justify-content: center;
  }
}
</style>