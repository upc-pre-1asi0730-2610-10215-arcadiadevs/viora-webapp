<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { usePlotMap } from '../../application/use-plot-map.js';
import { useAgronomicStore } from '../../application/agronomic.store.js';
import { DateTimeFormatter } from '../../../shared/infrastructure/date-time.formatter.js';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const agronomicStore = useAgronomicStore();

const plots = ref([]);
const selectedPlotId = ref(null);
const plotDetail = ref(null);
const plotSummary = ref(null);
const weatherSummary = ref(null);
const iotDevices = ref([]);
const iotDeviceSummary = ref(null);
const loading = ref(false);
const loadingPlots = ref(false);
const errors = ref([]);
const mapContainer = ref(null);
const mapInitialized = ref(false);
const mapLoadError = ref(false);
const { init: initPlotMap, render: renderPlotMap } = usePlotMap(mapContainer, {
  onError: () => {
    mapLoadError.value = true;
    mapInitialized.value = false;
  }
});

const selectedPlot = computed(() => {
  return plots.value.find((plot) => String(plot.id) === String(selectedPlotId.value)) ?? null;
});

const selectedPlotModel = computed({
  get: () => selectedPlotId.value,
  set: (value) => {
    if (value) selectPlot(value);
  }
});

const plotOptions = computed(() => plots.value.map((plot) => ({
  label: plot.name,
  value: plot.id
})));

const plotName = computed(() => plotDetail.value?.plotName || selectedPlot.value?.name || 'Plot');

const breadcrumbs = computed(() => [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Plot Overview', disabled: true },
  { label: plotName.value, disabled: true }
]);
const plotArea = computed(() => plotDetail.value?.areaSizeHectares ?? selectedPlot.value?.areaSize ?? 0);
const plotLocation = computed(() => plotDetail.value?.locationLabel || selectedPlot.value?.locationReference || 'Tacna, Peru');

const ndviValue = computed(() => {
  return plotSummary.value?.currentNdvi
      ?? selectedPlot.value?.currentImagery?.ndviMean
      ?? 0;
});

const ndviTrend = computed(() => String(plotSummary.value?.ndviTrend?.direction || 'STABLE').toLowerCase());
const chillValue = computed(() => plotSummary.value?.chillPortions ?? 0);
const chillTarget = computed(() => plotSummary.value?.chillRequirementPortions ?? 600);
const chillProgress = computed(() => Math.min(100, Math.round((chillValue.value / Math.max(chillTarget.value, 1)) * 100)));
const yieldTonnes = computed(() => plotSummary.value?.yieldForecastTonnes ?? 0);
const healthStatus = computed(() => plotSummary.value?.healthStatus || selectedPlot.value?.healthStatus || 'Healthy');
const phenologicalRisk = computed(() => plotSummary.value?.phenologicalRisk || selectedPlot.value?.phenologicalRisk || 'Low');
const climateRisk = computed(() => plotSummary.value?.climateRiskLevel || weatherSummary.value?.climateRisk || phenologicalRisk.value);

const dataFreshness = computed(() => plotDetail.value?.dataFreshness || {});

const updatedLabel = computed(() => {
  if (dataFreshness.value.updatedLabel) return dataFreshness.value.updatedLabel;
  const dates = [
    plotSummary.value?.lastUpdatedAt,
    weatherSummary.value?.lastUpdate,
    selectedPlot.value?.lastUpdate
  ].filter(Boolean).map((date) => new Date(date).getTime());
  if (!dates.length) return 'N/A';
  return DateTimeFormatter.formatRelativeTime(new Date(Math.max(...dates)));
});

const activeDevices = computed(() => {
  return iotDevices.value.filter((device) => String(device.status).toLowerCase() === 'active').length;
});

const plotSensorCards = computed(() => {
  const cards = iotDeviceSummary.value?.sensorCards || [];
  return cards.filter((card) => String(card.plotId) === String(selectedPlotId.value));
});

const visibleSensorCards = computed(() => {
  if (plotSensorCards.value.length) return plotSensorCards.value.slice(0, 2);
  return iotDevices.value.slice(0, 2).map((device) => ({
    id: device.id,
    title: 'Water Stress',
    sourceLabel: 'IoT',
    metricLabel: device.soilMoisture ? 'Soil moisture' : 'Soil temperature',
    metricValue: device.soilMoisture || device.temperature || 0,
    metricUnit: device.soilMoisture ? '%' : '&deg;C',
    trend: device.status === 'warning' ? 'up' : 'stable',
    riskLevel: device.status === 'warning' ? 'High' : 'Low',
    recommendation: device.status === 'warning'
        ? 'Temperature may increase water stress.'
        : 'Moisture conditions are stable.'
  }));
});

const ndviStatusLabel = computed(() => {
  if (ndviValue.value >= 0.58) return 'Healthy';
  if (ndviValue.value >= 0.5) return 'Stable';
  return 'Review';
});

const healthClass = computed(() => {
  const value = String(healthStatus.value).toLowerCase();
  if (value.includes('critical')) return 'is-critical';
  if (value.includes('review') || value.includes('moderate')) return 'is-moderate';
  return 'is-healthy';
});

const riskClass = computed(() => {
  const value = String(phenologicalRisk.value).toLowerCase();
  if (value.includes('high') || value.includes('critical')) return 'is-high';
  if (value.includes('medium') || value.includes('moderate')) return 'is-moderate';
  return 'is-low';
});

const yieldRiskClass = computed(() => {
  const value = String(climateRisk.value).toLowerCase();
  if (value.includes('high') || value.includes('critical')) return 'is-high';
  if (value.includes('medium') || value.includes('moderate')) return 'is-moderate';
  return 'is-low';
});

const ndviProgressStyle = computed(() => ({
  width: `${Math.min(100, Math.max(8, Math.round(ndviValue.value * 100)))}%`
}));

const chillProgressStyle = computed(() => ({
  width: `${Math.min(100, Math.max(8, chillProgress.value))}%`
}));

const weatherHeroStyle = computed(() => {
  if (!weatherSummary.value?.backgroundImage) return {};
  return {
    backgroundImage: `linear-gradient(90deg, rgba(47,79,128,0.45), rgba(16,23,94,0.16)), url("${weatherSummary.value.backgroundImage}")`
  };
});

const todayForecast = computed(() => weatherSummary.value?.forecast3Days?.[0] ?? null);

const temperatureProgressStyle = computed(() => {
  const today = todayForecast.value;
  if (!today || today.maxTemp <= today.minTemp) return { width: '35%' };
  const progress = ((weatherSummary.value.currentTemp - today.minTemp) / (today.maxTemp - today.minTemp)) * 100;
  return { width: `${Math.min(100, Math.max(12, Math.round(progress)))}%` };
});

const recommendedActions = computed(() => plotDetail.value?.recommendedActions || [
  { id: 'view-plot-details', label: 'View plot details', icon: 'pi-eye' },
  { id: 'report-symptoms', label: 'Report symptoms', icon: 'pi-shield' },
  { id: 'open-nutrition-plan', label: 'Open nutrition plan', icon: 'pi-send' },
  { id: 'request-expert', label: 'Request expert', icon: 'pi-headphones' }
]);

const splitFreshnessLabel = (label) => {
  const value = String(label || 'N/A').trim();
  const match = value.match(/^([+-]?\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (!match) return { amount: value, unit: '' };
  return { amount: match[1], unit: match[2] };
};

const satelliteFreshness = computed(() => dataFreshness.value.satelliteImage || DateTimeFormatter.formatRelativeTime(selectedPlot.value?.currentImagery?.captureDate));
const weatherFreshness = computed(() => dataFreshness.value.weatherSync || DateTimeFormatter.formatRelativeTime(weatherSummary.value?.lastUpdate));
const predictionFreshness = computed(() => dataFreshness.value.predictionModel || DateTimeFormatter.formatRelativeTime(plotSummary.value?.lastUpdatedAt));
const satelliteFreshnessParts = computed(() => splitFreshnessLabel(satelliteFreshness.value));
const weatherFreshnessParts = computed(() => splitFreshnessLabel(weatherFreshness.value));
const predictionFreshnessParts = computed(() => splitFreshnessLabel(predictionFreshness.value));

const renderSelectedPlotMap = async () => {
  await nextTick();
  if (!selectedPlot.value || !mapContainer.value) return;

  mapLoadError.value = false;

  if (!mapInitialized.value) {
    mapInitialized.value = true;
    initPlotMap(selectedPlot.value);
    return;
  }

  renderPlotMap(selectedPlot.value);
};

const loadPlots = async () => {
  loadingPlots.value = true;
  try {
    await agronomicStore.fetchPlots();
    plots.value = agronomicStore.plots;
  } catch (error) {
    errors.value.push(error);
  } finally {
    loadingPlots.value = false;
  }
};

const loadPlotData = async (plotId) => {
  if (!plotId) return;
  loading.value = true;
  errors.value = [];

  try {
    const [detail, summary, weather] = await Promise.all([
      agronomicStore.fetchPlotDetail(plotId),
      agronomicStore.fetchPlotSummary(plotId),
      agronomicStore.fetchPlotWeather(plotId)
    ]);

    plotDetail.value = detail;
    plotSummary.value = summary;
    weatherSummary.value = weather;

    await Promise.all([
      agronomicStore.fetchIotDevices(),
      agronomicStore.fetchIotDeviceSummary(plotId)
    ]);

    iotDevices.value = agronomicStore.iotDevices;
    iotDeviceSummary.value = agronomicStore.iotDeviceSummary;
    await renderSelectedPlotMap();
  } catch (error) {
    errors.value.push(error);
  } finally {
    loading.value = false;
  }
};

const ensureRoutePlot = async () => {
  if (!plots.value.length) await loadPlots();
  const routePlotId = route.params.plotId;
  const nextPlotId = routePlotId || plots.value[0]?.id;

  if (!nextPlotId) return;

  selectedPlotId.value = nextPlotId;
  if (!routePlotId) {
    await router.replace(`/dashboard/plot-overview/${nextPlotId}`);
    await loadPlotData(nextPlotId);
    return;
  }

  await loadPlotData(nextPlotId);
};

const selectPlot = (plotId) => {
  router.push(`/dashboard/plot-overview/${plotId}`);
};

const refresh = () => loadPlotData(selectedPlotId.value);

const scrollToWeather = () => {
  if (!selectedPlotId.value) return;
  router.push(`/dashboard/weather/${selectedPlotId.value}`);
};

const scrollToMap = () => {
  document.getElementById('plot-map-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const goToEditPlot = () => {
  if (!selectedPlotId.value) {
    router.push('/agronomic/plots');
    return;
  }
  router.push(`/agronomic/plots/${selectedPlotId.value}/edit`);
};

const handleRecommendedAction = (action) => {
  if (action.id === 'open-nutrition-plan') {
    router.push('/agronomic/dynamic-nutrition');
    return;
  }
  if (action.id === 'report-symptoms') {
    router.push('/surveillance/alerts');
    return;
  }
  scrollToMap();
};

watch(() => route.params.plotId, async (plotId, previousPlotId) => {
  if (!plotId || String(plotId) === String(previousPlotId)) return;
  selectedPlotId.value = plotId;
  await loadPlotData(plotId);
});

onMounted(ensureRoutePlot);
</script>

<template>
  <section class="plot-overview-page">
    <DashboardHeader
      :breadcrumbs="breadcrumbs"
      subtitle="Detailed satellite view and indicators for this plot."
      :updated-label="updatedLabel"
      @refresh="refresh"
    >
      <template #actions>
        <LanguageSwitcher />
      </template>
    </DashboardHeader>

    <section class="quick-actions">
      <pv-button label="Plot detail" icon="pi pi-th-large" class="quick-action-btn" text @click="scrollToMap" />
      <pv-button label="Edit plot" icon="pi pi-pencil" class="quick-action-btn" text @click="goToEditPlot" />
      <pv-button label="Weather" icon="pi pi-cloud" class="quick-action-btn" text @click="scrollToWeather" />
    </section>

    <section id="plot-map-section" class="map-card">
      <div class="map-card-header">
        <h1>Plot Overview</h1>
        <pv-select
            v-model="selectedPlotModel"
            :options="plotOptions"
            optionLabel="label"
            optionValue="value"
            class="plot-select"
            :loading="loadingPlots"
        >
          <template #value>
            <span class="plot-select-value">{{ plotName }}</span>
          </template>
          <template #option="slotProps">
            <span class="plot-select-value">{{ slotProps.option.label }}</span>
          </template>
        </pv-select>
      </div>

      <div class="satellite-map">
        <div ref="mapContainer" class="mapbox-map" aria-label="Plot satellite map"></div>
        <div v-if="mapLoadError" class="map-empty-state">
          <strong>Map unavailable</strong>
          <span>Check the local Mapbox access token.</span>
        </div>

        <div class="ndvi-legend">
          <strong>NDVI legend</strong>
          <div class="legend-bar"></div>
          <div class="legend-labels">
            <span>Low vigor</span>
            <span>High vigor</span>
          </div>
        </div>

        <div class="location-chip">
          <i class="pi pi-map-marker"></i>
          <span>{{ plotLocation }}</span>
        </div>

        <div class="plot-map-label">
          <strong>{{ plotName }}</strong>
          <span>{{ plotArea.toFixed(1) }} ha</span>
        </div>
      </div>
    </section>

    <section class="kpi-grid">
      <article class="metric-card health-card">
        <h2>Overall Plot Health</h2>
        <span class="metric-caption">Status</span>
        <div class="wide-pill" :class="healthClass">{{ healthStatus }}</div>
        <div class="card-divider"></div>
        <p>{{ plotName }} / {{ plotArea.toFixed(1) }} ha</p>
      </article>

      <article class="metric-card">
        <h2>NDVI Status</h2>
        <div class="metric-value-row">
          <strong>{{ ndviValue.toFixed(2) }}</strong>
          <i :class="['pi', ndviTrend === 'down' ? 'pi-arrow-down' : ndviTrend === 'up' ? 'pi-arrow-up' : 'pi-arrow-right']"></i>
        </div>
        <div class="wide-pill dark">{{ ndviStatusLabel }}</div>
        <div class="progress-track">
          <span :style="ndviProgressStyle"></span>
        </div>
        <footer><i class="pi pi-info-circle"></i> 0.00 from last update</footer>
      </article>

      <article class="metric-card">
        <h2>Chill Accumulation</h2>
        <div class="metric-value-row">
          <strong>{{ chillValue }} CP</strong>
        </div>
        <p class="target-line"><i class="pi pi-star"></i> Target: {{ chillTarget }} CP</p>
        <div class="progress-track muted">
          <span :style="chillProgressStyle"></span>
        </div>
        <footer><i class="pi pi-info-circle"></i> Chill builds up only during the cold hours of the dormancy season.</footer>
      </article>

      <article class="metric-card">
        <h2>Yield Forecast</h2>
        <div class="metric-value-row">
          <strong>{{ yieldTonnes.toFixed(1) }} t</strong>
        </div>
        <div class="wide-pill harvest" :class="yieldRiskClass">{{ climateRisk }}</div>
        <div class="card-divider"></div>
        <p class="risk-copy">Risk of alternate bearing: <strong>{{ climateRisk }}</strong></p>
        <footer>Estimated for current campaign</footer>
      </article>

      <article class="metric-card risk-card">
        <h2>Phenological Risk</h2>
        <span class="small-pill" :class="riskClass">{{ phenologicalRisk }}</span>
        <div class="card-divider"></div>
        <footer><i class="pi pi-info-circle"></i> Based on accumulated chill vs the crop requirement during the chill season.</footer>
      </article>
    </section>

    <section class="iot-grid">
      <article class="iot-overview-card">
        <h2>IoT Devices</h2>
        <p><span></span>{{ activeDevices }} sensors online</p>
        <p><span></span>{{ plotName }} IoT scope</p>
        <div class="card-divider"></div>
        <footer><i class="pi pi-info-circle"></i> Last sync: {{ DateTimeFormatter.formatRelativeTime(iotDeviceSummary?.lastSync) }}</footer>
      </article>

      <article v-for="sensor in visibleSensorCards" :key="sensor.id" class="sensor-card">
        <div class="sensor-header">
          <h2>{{ sensor.title }}</h2>
          <span>IoT</span>
        </div>
        <div class="sensor-row">
          <span>{{ sensor.metricLabel }}:</span>
          <strong>{{ sensor.metricValue }}<span v-html="sensor.metricUnit"></span></strong>
          <i :class="['pi', sensor.trend === 'up' ? 'pi-arrow-up' : sensor.trend === 'down' ? 'pi-arrow-down' : 'pi-arrow-right']"></i>
        </div>
        <div class="sensor-row">
          <span>Risk:</span>
          <strong class="sensor-risk">{{ sensor.riskLevel }}</strong>
        </div>
        <div class="card-divider"></div>
        <footer><i class="pi pi-info-circle"></i> {{ sensor.recommendation }}</footer>
      </article>

      <article class="add-iot-card">
        <h2>Add IoT Device</h2>
        <router-link to="/agronomic/iot-devices/new" aria-label="Add IoT Device">
          <i class="pi pi-plus"></i>
        </router-link>
      </article>
    </section>

    <section class="bottom-grid">
      <article class="freshness-card">
        <div class="section-title-row">
          <h2>Data Freshness</h2>
          <span><i class="pi pi-clock"></i></span>
        </div>

        <div class="freshness-item">
          <span>Satellite image</span>
          <strong class="freshness-value" :aria-label="satelliteFreshness">
            <span class="freshness-amount">{{ satelliteFreshnessParts.amount }}</span>
            <span v-if="satelliteFreshnessParts.unit" class="freshness-unit">{{ satelliteFreshnessParts.unit }}</span>
          </strong>
        </div>
        <div class="freshness-item">
          <span>Weather sync</span>
          <strong class="freshness-value" :aria-label="weatherFreshness">
            <span class="freshness-amount">{{ weatherFreshnessParts.amount }}</span>
            <span v-if="weatherFreshnessParts.unit" class="freshness-unit">{{ weatherFreshnessParts.unit }}</span>
          </strong>
        </div>
        <div class="freshness-item">
          <span>Prediction model</span>
          <strong class="freshness-value" :aria-label="predictionFreshness">
            <span class="freshness-amount">{{ predictionFreshnessParts.amount }}</span>
            <span v-if="predictionFreshnessParts.unit" class="freshness-unit">{{ predictionFreshnessParts.unit }}</span>
          </strong>
        </div>
      </article>

      <article id="weather-section" class="weather-card">
        <div class="section-title-row">
          <h2>{{ t('dashboard.weather-summary-title') }}</h2>
          <button type="button" aria-label="Weather">
            <i class="pi pi-cloud"></i>
          </button>
        </div>

        <div class="weather-hero" :style="weatherHeroStyle">
          <img src="/assets/icons/dashboard/weather-cloud.png" alt="" />
          <span class="weather-time">5:22 pm</span>
          <div>
            <strong>{{ Math.round(weatherSummary?.currentTemp || 0) }}&deg;</strong>
            <span>{{ plotName }}</span>
            <span>{{ weatherSummary?.condition || 'Clear' }}</span>
          </div>
        </div>

        <h3>3-Day forecast</h3>
        <div v-if="todayForecast" class="forecast-row">
          <span>{{ todayForecast.dayLabel }}</span>
          <strong>{{ Math.round(todayForecast.minTemp) }}&deg;</strong>
          <div class="temp-track"><span :style="temperatureProgressStyle"></span></div>
          <strong>{{ Math.round(todayForecast.maxTemp) }}&deg;</strong>
          <i class="pi pi-chevron-right"></i>
        </div>

        <div class="weather-metric">
          <span>Temperature anomaly:</span>
          <strong>{{ weatherSummary?.anomalyLabel || '0.0C' }}</strong>
        </div>
        <div class="weather-metric">
          <span>Climate risk:</span>
          <strong>{{ weatherSummary?.climateRisk || climateRisk }}</strong>
        </div>
      </article>
    </section>

    <section class="recommended-bar">
      <strong>Recommended Action</strong>
      <button
          v-for="action in recommendedActions"
          :key="action.id"
          type="button"
          @click="handleRecommendedAction(action)"
      >
        <i :class="['pi', action.icon]"></i>
        <span>{{ action.label }}</span>
      </button>
    </section>
  </section>
</template>

<style scoped>
.plot-overview-page {
  width: 100%;
  margin: 0 auto;
  color: #1f2523;
}

.quick-actions,
.section-title-row,
.sensor-header,
.sensor-row,
.weather-metric,
.recommended-bar {
  display: flex;
  align-items: center;
}

.quick-actions {
  gap: 12px;
  margin-bottom: 24px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

:deep(.quick-action-btn.p-button) {
  height: 40px;
  padding: 0 18px;
  border: 1px solid #e8e4df;
  border-radius: 8px;
  background: #ffffff;
  color: #333333;
  font-size: 12px;
  font-weight: 500;
}

:deep(.quick-action-btn.p-button:hover) {
  background: #f8f4ed;
  color: #2e4a3a;
}

.map-card,
.metric-card,
.iot-overview-card,
.sensor-card,
.freshness-card,
.weather-card,
.recommended-bar {
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.map-card {
  padding: 28px 30px;
  border-radius: 18px;
  margin-bottom: 24px;
}

.map-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.map-card-header h1,
.metric-card h2,
.iot-overview-card h2,
.sensor-card h2,
.freshness-card h2,
.weather-card h2 {
  margin: 0;
  color: #1f2523;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.15;
}

:deep(.plot-select.p-select),
:deep(.plot-select.p-dropdown) {
  width: 220px;
  height: 42px;
  border: 1px solid #e0dbd2;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: none;
}

:deep(.plot-select .p-select-label),
:deep(.plot-select .p-dropdown-label) {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e4a3a;
  font-size: 12px;
  font-weight: 600;
}

.plot-select-value {
  color: #2e4a3a;
  font-size: 12px;
  font-weight: 600;
}

.satellite-map {
  position: relative;
  height: 560px;
  overflow: hidden;
  border-radius: 14px;
  background-color: #e7e2d9;
}

.satellite-map::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(46, 74, 58, 0.02), rgba(46, 74, 58, 0.08));
}

.mapbox-map {
  position: absolute;
  inset: 0;
}

.map-empty-state {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-content: center;
  gap: 6px;
  background: #e7e2d9;
  color: #2e4a3a;
  text-align: center;
}

.map-empty-state strong {
  color: #1f2523;
  font-size: 14px;
  font-weight: 600;
}

.map-empty-state span {
  color: #6b716d;
  font-size: 12px;
  font-weight: 500;
}

:deep(.mapboxgl-canvas) {
  outline: none;
}

:deep(.mapboxgl-ctrl-top-right) {
  top: 14px;
  right: 14px;
}

:deep(.mapboxgl-ctrl-group) {
  overflow: hidden;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 20px rgba(31, 37, 35, 0.12);
}

:deep(.mapboxgl-ctrl-group button) {
  width: 38px;
  height: 36px;
}

.ndvi-legend,
.location-chip,
.plot-map-label {
  position: absolute;
  z-index: 2;
}

.ndvi-legend {
  top: 18px;
  left: 18px;
  width: 174px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(46, 74, 58, 0.86);
  color: #ffffff;
}

.ndvi-legend strong {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
}

.legend-bar {
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, #d45a19, #f3cf2d, #9ff0c6, #2e8b3a);
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 7px;
  font-size: 10px;
  font-weight: 500;
}

.location-chip {
  left: 18px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 220px);
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #4f4f4f;
  font-size: 12px;
  font-weight: 500;
}

.location-chip i {
  color: #2e4a3a;
}

.plot-map-label {
  right: 16px;
  bottom: 16px;
  min-width: 74px;
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  text-align: center;
}

.plot-map-label strong {
  color: #1f2523;
  font-size: 14px;
  font-weight: 600;
}

.plot-map-label span {
  color: #4f4f4f;
  font-size: 12px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: minmax(300px, 1.35fr) repeat(4, minmax(178px, 1fr));
  gap: 24px;
  margin-bottom: 28px;
  overflow-x: auto;
}

.metric-card {
  min-height: 208px;
  display: flex;
  flex-direction: column;
  padding: 24px 20px 18px;
  border-radius: 12px;
}

.metric-caption {
  display: block;
  margin-top: 8px;
  color: #4f4f4f;
  font-size: 14px;
}

.wide-pill,
.small-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.wide-pill {
  width: 100%;
  min-height: 30px;
  margin-top: 18px;
  padding: 8px 16px;
}

.small-pill {
  align-self: flex-start;
  margin-top: 16px;
  padding: 8px 18px;
}

.is-healthy,
.wide-pill.is-healthy {
  background: #57eba1;
  color: #17432f;
}

.is-moderate,
.wide-pill.is-moderate {
  background: #c15a2e;
  color: #ffffff;
}

.is-critical,
.is-high,
.wide-pill.is-high {
  background: #9f2f22;
  color: #ffffff;
}

.is-low {
  background: #2e4a3a;
  color: #ffffff;
}

.dark {
  background: #1f2c26;
  color: #ffffff;
}

.harvest {
  background: #c15a2e;
  color: #ffffff;
}

.metric-value-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.metric-value-row strong {
  color: #1f2523;
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.metric-value-row i {
  color: #2e4a3a;
  font-size: 18px;
}

.progress-track,
.temp-track {
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  background: #ebe9ec;
}

.progress-track {
  height: 7px;
  margin-top: 14px;
}

.progress-track span,
.temp-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.progress-track span {
  background: #5b8def;
}

.progress-track.muted span {
  background: #d7d1c7;
}

.target-line {
  margin: 10px 0 0;
  color: #5b8def;
  font-size: 12px;
  font-weight: 500;
}

.risk-copy {
  margin: 12px 0 0;
  color: #c15a2e;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.25;
}

.risk-copy strong {
  font-weight: 600;
}

.card-divider {
  width: 100%;
  height: 1px;
  margin: auto 0 12px;
  background: #ece8e0;
}

.metric-card p,
.metric-card footer,
.iot-overview-card footer,
.sensor-card footer {
  margin: 0;
  color: #8c877f;
  font-size: 11px;
  line-height: 1.25;
}

.metric-card footer,
.iot-overview-card footer,
.sensor-card footer {
  display: flex;
  align-items: flex-start;
  gap: 7px;
}

.iot-grid {
  display: grid;
  grid-template-columns: minmax(300px, 1.35fr) repeat(3, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 28px;
}

.iot-overview-card,
.sensor-card,
.add-iot-card {
  min-height: 186px;
  border-radius: 12px;
}

.iot-overview-card,
.sensor-card {
  padding: 24px 20px 18px;
}

.iot-overview-card p {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0 0;
  color: #2e4a3a;
  font-size: 12px;
  font-weight: 500;
}

.iot-overview-card p span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #57eba1;
}

.sensor-card {
  display: flex;
  flex-direction: column;
}

.sensor-header {
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #4f4f4f;
}

.sensor-header span {
  padding: 8px 12px;
  border-radius: 6px;
  background: #4f4f4f;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
}

.sensor-row {
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  color: #1f2523;
}

.sensor-row span {
  font-size: 13px;
  font-weight: 500;
}

.sensor-row strong {
  margin-left: auto;
  font-size: 24px;
  font-weight: 600;
}

.sensor-row strong span {
  font-size: inherit;
}

.sensor-risk {
  min-width: 112px;
  padding: 8px 18px;
  border-radius: 999px;
  background: #4f4f4f;
  color: #ffffff;
  text-align: center;
  font-size: 12px !important;
  font-weight: 500 !important;
}

.add-iot-card {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 18px;
  background: transparent;
}

.add-iot-card h2 {
  margin: 0;
  color: #4f4f4f;
  font-size: 16px;
  font-weight: 500;
}

.add-iot-card a {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border: 2px solid #4f4f4f;
  border-radius: 50%;
  color: #4f4f4f;
  text-decoration: none;
  font-size: 22px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 1fr);
  gap: 24px;
  margin-bottom: 28px;
}

.freshness-card,
.weather-card {
  border-radius: 18px;
  padding: 28px;
}

.section-title-row {
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title-row > span,
.section-title-row button {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1.5px solid #2e4a3a;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.58);
  color: #2e4a3a;
}

.section-title-row > span {
  border: none;
  background: #f0ebe2;
  color: #8c877f;
}

.freshness-item {
  margin-top: 18px;
  text-align: center;
}

.freshness-item > span {
  display: block;
  padding: 8px 12px;
  border-radius: 999px;
  background: #e7e2d9;
  color: #8c877f;
  font-size: 12px;
  font-weight: 500;
}

.freshness-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
  color: #1f2523;
  font-weight: 600;
}

.freshness-amount {
  color: #1f2523;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.05;
}

.freshness-unit {
  color: #4f4f4f;
  font-size: 15px;
  font-weight: 400;
  line-height: 1;
}

.weather-hero {
  position: relative;
  min-height: 142px;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 30px;
  padding: 18px 34px;
  border-radius: 22px;
  background-color: #506a9b;
  background-position: center;
  background-size: cover;
  color: #ffffff;
  box-shadow: 0 16px 30px rgba(16, 23, 94, 0.16), 0 0 0 4px rgba(164, 170, 195, 0.22);
}

.weather-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 18px 38px rgba(255, 255, 255, 0.1);
}

.weather-hero img {
  position: absolute;
  top: -34px;
  left: -16px;
  z-index: 1;
  width: 116px;
  max-width: 48%;
  filter: drop-shadow(0 14px 18px rgba(16, 23, 94, 0.12));
}

.weather-time {
  position: absolute;
  left: 30px;
  bottom: 24px;
  z-index: 1;
  color: #ffffff;
  font-size: 16px;
}

.weather-hero div {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 5px;
  min-width: 124px;
}

.weather-hero strong {
  color: #ffffff;
  font-size: 48px;
  font-weight: 600;
  line-height: 0.95;
}

.weather-hero span {
  color: #ffffff;
  font-size: 15px;
  line-height: 1.05;
}

.weather-card h3 {
  margin: 28px 0 18px;
  color: #1f2523;
  font-size: 18px;
  font-weight: 500;
}

.forecast-row {
  display: grid;
  grid-template-columns: minmax(60px, 1fr) auto minmax(86px, 1.2fr) auto 24px;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ece8e0;
}

.forecast-row span,
.forecast-row strong {
  color: #1f2523;
  font-size: 16px;
  font-weight: 500;
}

.temp-track {
  height: 6px;
}

.temp-track span {
  background: linear-gradient(90deg, #f3cf2d, #d45a19);
}

.weather-metric {
  justify-content: space-between;
  gap: 18px;
  margin-top: 14px;
}

.weather-metric span {
  color: #1f2523;
  font-size: 14px;
  font-weight: 500;
}

.weather-metric strong {
  min-width: 118px;
  padding: 8px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #eca31e, #c65a2d);
  color: #ffffff;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
}

.recommended-bar {
  gap: 28px;
  flex-wrap: wrap;
  padding: 18px 24px;
  border-radius: 16px;
}

.recommended-bar strong {
  color: #1f2523;
  font-size: 14px;
  font-weight: 600;
}

.recommended-bar button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: #6b716d;
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
}

.recommended-bar button:hover {
  color: #2e4a3a;
}

@media (max-width: 1280px) {
  .kpi-grid,
  .iot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow-x: visible;
  }

  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .quick-actions {
    flex-wrap: wrap;
  }

  .map-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  :deep(.plot-select.p-select),
  :deep(.plot-select.p-dropdown) {
    width: 100%;
  }

  .satellite-map {
    height: 360px;
  }

  .kpi-grid,
  .iot-grid {
    grid-template-columns: 1fr;
  }

  .location-chip {
    max-width: calc(100% - 36px);
    right: 18px;
  }

  .plot-map-label {
    display: none;
  }
}
</style>
