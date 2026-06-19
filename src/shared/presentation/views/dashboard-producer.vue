<script setup>
/**
 * ProducerDashboardView component.
 * Coordinates the producer dashboard surface:
 * - Toolbar and top actions.
 * - Adaptive KPI grid.
 * - IoT device and sensor grid with plot filters.
 * - Plot overview, weather, alerts, and trend sections.
 */

import { onMounted, computed } from 'vue';
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
import DashboardToolbar from "../components/dashboard-toolbar.vue";
import LanguageSwitcher from "../components/language-switcher.vue";
import IotDevicesCard from '../../../agronomic/presentation/components/iot-devices-card.vue';
import IotSensorCard from '../../../agronomic/presentation/components/iot-sensor-card.vue';

const agronomicStore = useAgronomicStore();
const { t } = useI18n();

/**
 * Human label for the active dashboard scope, used in the breadcrumb trail.
 * @type {import('vue').ComputedRef<string>}
 */
const scopeLabel = computed(() => {
  if (agronomicStore.dashboardScope === 'all') return t('dashboard.scope.allPlots');
  return agronomicStore.selectedDashboardPlot?.name || t('dashboard.scope.allPlots');
});

const activePlotOverviewId = computed(() => {
  return agronomicStore.selectedDashboardPlot?.id
      || agronomicStore.selectedPlot?.id
      || agronomicStore.plots[0]?.id
      || 1;
});

const viewOptions = computed(() => [
  { id: 'iot-devices', label: 'IoT Devices', labelKey: 'toolbar.iotDevices', route: '/agronomic/iot-devices', icon: 'wifi' },
  { id: 'plot-overview', label: 'Plot Overview', labelKey: 'toolbar.plotOverview', route: `/dashboard/plot-overview/${activePlotOverviewId.value}`, icon: 'map' },
  { id: 'weather', label: 'Weather', labelKey: 'toolbar.weather', route: `/dashboard/weather/${activePlotOverviewId.value}`, icon: 'cloud' }
]);

const scopeOptions = computed(() => {
  const options = [{ value: 'all', label: t('dashboard.scope.allPlots'), badge: agronomicStore.plotsCount }];
  agronomicStore.plots.forEach(plot => options.push({ value: plot.id, label: plot.name }));
  return options;
});

const timeRangeOptions = computed(() => [
  { label: t('dashboard.time-range-current'), value: 'current' },
  { label: t('dashboard.time-range-7days'), value: '7days' },
  { label: t('dashboard.time-range-30days'), value: '30days' }
]);

const lastUpdatedText = computed(() => DateTimeFormatter.formatRelativeTime(agronomicStore.monitoringSummary?.updatedAt));

const onScopeChange = (newScope) => agronomicStore.setDashboardScope(newScope);
const onTimeRangeChange = (newRange) => agronomicStore.setDashboardTimeRange(newRange);
const onRefreshSummary = () => agronomicStore.refreshDashboardData();

const onViewChange = (viewId) => {
  const sectionIds = { 'plot-overview': 'plot-overview-section', 'weather': 'weather-section' };
  const sectionId = sectionIds[viewId];
  if (sectionId) document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

onMounted(() => {
  agronomicStore.refreshDashboardData();
});
</script>

<template>

  <div class="producer-dashboard-container">

    <header class="dashboard-header-bar">
      <div class="header-left">
        <nav class="dashboard-breadcrumb" aria-label="Page breadcrumb">
          <router-link to="/dashboard" class="breadcrumb-item">{{ t('sidebar.dashboard') }}</router-link>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item">{{ t('dashboard.overview') }}</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item is-current">{{ scopeLabel }}</span>
        </nav>
        <p class="header-subtitle">{{ t('dashboard.header-description') }}</p>
      </div>

      <div class="dashboard-actions">
        <div class="status-sync-box">
          <span class="status-label">{{ t('dashboard.updated-label') }}</span>
          <span class="status-time">{{ lastUpdatedText }}</span>
        </div>
        <LanguageSwitcher />
        <pv-button icon="pi pi-refresh" class="refresh-btn-viora" @click="onRefreshSummary" />
      </div>
    </header>

    <div class="dashboard-header-row">
      <DashboardToolbar
          class="toolbar-flex"
          :view-options="viewOptions"
          :scope-options="scopeOptions"
          :selected-scope="agronomicStore.dashboardScope"
          :time-range-options="timeRangeOptions"
          :selected-time-range="agronomicStore.dashboardTimeRange"
          @update:selected-scope="onScopeChange"
          @update:selected-time-range="onTimeRangeChange"
          @viewChange="onViewChange"
      />
    </div>

    <section v-if="agronomicStore.summaryLoaded" class="kpi-grid-container">
      <OverallPlotHealthCard
          :status="agronomicStore.adaptiveHealth?.status || 'Stable'"
          :is-healthy="!(agronomicStore.adaptiveHealth?.isCritical)"
          :healthy-plots-count="agronomicStore.adaptiveHealth?.healthyPlotsCount || 0"
          :review-plots-count="agronomicStore.adaptiveHealth?.reviewPlotsCount || 0"
      />
      <NdviStatusCard
          :value="agronomicStore.adaptiveNdvi?.ndviIndex || 0"
          :trend="agronomicStore.adaptiveNdvi?.ndviTrend || 'stable'"
          :status-label="agronomicStore.adaptiveNdvi?.ndviStatusLabel || ''"
      />
      <ChillAccumulationCard
          :value="agronomicStore.adaptiveChill?.accumulatedChillPortions || 0"
          :weekly-diff="agronomicStore.adaptiveChill?.weeklyDiff || 0"
          :threshold="agronomicStore.adaptiveChill?.threshold || 600"
      />
      <YieldForecastCard
          :tonnes="agronomicStore.adaptiveYield?.tonnes || 0"
          :risk-level="agronomicStore.adaptiveYield?.riskLevel || 'Low'"
      />
    </section>

    <section class="iot-grid">
      <IotDevicesCard />
      <IotSensorCard
          v-for="sensor in agronomicStore.dashboardInsightCards"
          :key="sensor.id"
          :sensor="sensor"
      />
      <div class="add-iot-card">
        <h2>{{ t('dashboard.addIotDevice') }}</h2>
        <router-link to="/agronomic/iot-devices/new" aria-label="Add Device">
          +
        </router-link>
      </div>
    </section>

    <section class="lower-grid" :style="{ marginBottom : '26px' }">
      <PlotOverviewWidget
          v-if="agronomicStore.plotsLoaded"
          :plots="agronomicStore.plots"
          :selected-plot="agronomicStore.selectedPlot"
          @update:selected-plot="(plot) => agronomicStore.selectPlot(plot.id)"
      />
      <div id="weather-section" class="weather-container">
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

.add-iot-card {
  height: 186px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 18px;
  border-radius: 4px;
}

.add-iot-card h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
}

.add-iot-card a {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid #2E4A3A;
  background: transparent;
  color: #2E4A3A;
  font-size: 32px;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-iot-card a:hover {
  background: #2E4A3A;
  color: #ffffff;
}

.producer-dashboard-container {
  width: 100%;
  margin: 0 auto;
  padding: 0;
}

.dashboard-header-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  margin-bottom: 20px;
}

.header-left {
  min-width: 0;
}

.dashboard-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.breadcrumb-item {
  color: #8c877f;
  font-family: var(--viora-font);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
}

a.breadcrumb-item:hover {
  color: #2e4a3a;
}

.breadcrumb-item.is-current {
  color: #1f2523;
}

.breadcrumb-separator {
  color: #c8c2b8;
  font-size: 20px;
  font-weight: 500;
}

.header-subtitle {
  margin: 6px 0 0;
  color: #8c877f;
  font-family: var(--viora-font);
  font-size: 14px;
  font-weight: 400;
}

.dashboard-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.dashboard-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 26px;
}

.toolbar-flex { flex: 1; }

.status-sync-box {
  background: transparent;
  border: 1.5px solid #2E4A3A;
  border-radius: 8px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--viora-font);
  height: 42px;
}

.status-label { color: #8C877F; font-size: 12px; font-weight: 500; }
.status-time { color: #2E4A3A; font-size: 12px; font-weight: 500; }

.refresh-btn-viora {
  background: transparent !important;
  border: 1.5px solid #2E4A3A !important;
  color: #2E4A3A !important;
  border-radius: 8px !important;
  width: 42px; height: 42px;
  padding: 0 !important;
}

.kpi-grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 26px;
  margin-bottom: 26px;
}

.iot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 26px;
  margin-bottom: 26px;
  align-items: stretch;
}

.lower-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 26px;
}

@media (max-width: 1100px) {
  .lower-grid { grid-template-columns: 1fr; }
  .iot-grid { grid-template-columns: repeat(2, 1fr); }
  .kpi-grid-container { grid-template-columns: repeat(2, 1fr); }
}
</style>
