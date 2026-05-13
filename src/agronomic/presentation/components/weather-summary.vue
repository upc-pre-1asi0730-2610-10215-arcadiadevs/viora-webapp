<script setup>
/**
 * WeatherSummary component.
 * Displays real-time weather conditions, forecasts, and climate risk analysis.
 *
 * @component
 */
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgronomicStore } from '../../application/agronomic.store.js';

const { t } = useI18n();
const agronomicStore = useAgronomicStore();

onMounted(async () => {
  await agronomicStore.fetchWeather('Tacna');
});

/**
 * Theme configuration (icons and gradients) based on weather conditions.
 * @type {import('vue').ComputedRef<Object>}
 */
const weatherTheme = computed(() => {
  const condition = agronomicStore.weatherSummary?.condition || 'Clear';
  const themes = {
    'Partly cloudy': {
      icon: 'pi pi-cloud',
      gradient: 'linear-gradient(180deg, #5B8DEF 0%, #87CEEB 100%)'
    },
    'Sunny': {
      icon: 'pi pi-sun',
      gradient: 'linear-gradient(180deg, #FFB347 0%, #FFCC33 100%)'
    },
    'Rainy': {
      icon: 'pi pi-cloud-download',
      gradient: 'linear-gradient(180deg, #4B6CB7 0%, #182848 100%)'
    }
  };
  return themes[condition] || themes['Partly cloudy'];
});

/**
 * Localized or formatted last update time.
 * @type {import('vue').ComputedRef<string>}
 */
const currentTime = computed(() => {
  if (!agronomicStore.weatherSummary?.lastUpdate) return '2:34 pm';
  return agronomicStore.weatherSummary.lastUpdate;
});

/**
 * Visual styles for the thermal range bar based on current and forecast temperatures.
 * @type {import('vue').ComputedRef<Object>}
 */
const rangeProgressStyles = computed(() => {
  if (!agronomicStore.weatherSummary) return { width: '0%' };
  const current = agronomicStore.weatherSummary.currentTemp;
  const forecast = agronomicStore.weatherSummary.forecastTemp;
  const min = Math.min(current, forecast);
  const max = Math.max(current, forecast);
  const totalScale = 40;
  const width = ((max - min) / totalScale) * 100;
  return { width: `${Math.max(width, 20)}%` };
});

/**
 * Color code for climate risk levels.
 * @type {import('vue').ComputedRef<string>}
 */
const riskColor = computed(() => {
  const risk = agronomicStore.weatherSummary?.climateRisk;
  if (risk === 'High') return '#CC4E4E';
  if (risk === 'Low') return '#57EBA1';
  return '#FF914D';
});
</script>

<template>
  <div class="weather-summary-card">
    <pv-card class="weather-card-container shadow-none">
      <template #content>
        <div v-if="agronomicStore.weatherSummary" class="main-layout-viora">
          <div class="header-row">
            <h2 class="widget-title">{{ t('dashboard.weather-summary-title') }}</h2>
            <i class="pi pi-cloud cloud-icon"></i>
          </div>

          <div class="main-gradient-box" :style="{ background: weatherTheme.gradient }">
            <div class="box-left">
              <i :class="weatherTheme.icon" class="weather-status-icon"></i>
              <span class="time-text">{{ currentTime }}</span>
            </div>
            <div class="box-right">
              <span class="temp-val">{{ Math.round(agronomicStore.weatherSummary.currentTemp) }}°C</span>
              <span class="city-text">{{ agronomicStore.weatherSummary.city }}</span>
              <span class="condition-label">{{ agronomicStore.weatherSummary.condition }}</span>
            </div>
          </div>

          <div class="details-body">
            <h3 class="forecast-section-title">{{ t('dashboard.forecast-title') }}</h3>

            <div class="forecast-item-row">
              <span class="day-label">{{ t('dashboard.today-label') }}</span>
              <span class="range-min">{{ Math.round(agronomicStore.weatherSummary.currentTemp) }}°C</span>
              <div class="adaptive-bar-container">
                <div class="bar-fill" :style="rangeProgressStyles"></div>
              </div>
              <span class="range-max">{{ Math.round(agronomicStore.weatherSummary.forecastTemp) }}°C</span>
            </div>

            <div class="viora-divider"></div>

            <div class="metric-info-row">
              <span class="metric-name">{{ t('dashboard.temperature-anomaly-label') }}</span>
              <div class="metric-pill" style="border: 1px solid #FF914D; background: #FF914D;">
                <span class="pill-text">{{ agronomicStore.weatherSummary.anomalyLabel }}</span>
              </div>
            </div>

            <div class="metric-info-row">
              <span class="metric-name">{{ t('dashboard.climate-risk-label') }}</span>
              <div class="metric-pill" :style="{ border: `1px solid ${riskColor}`, background: riskColor }">
                <span class="pill-text">{{ agronomicStore.weatherSummary.climateRisk }}</span>
              </div>
            </div>
          </div>

        </div>

        <div v-else class="weather-loader">
          <i class="pi pi-spin pi-spinner text-2xl text-green-600"></i>
        </div>
      </template>
    </pv-card>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

:deep(.p-card-content) {
  padding: 2px 5px 8px 5px !important;
  height: 100%;
}

.main-layout-viora {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 2px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 0 8px;
}

.widget-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 20px;
  color: #1C1D21;
  margin: 0;
  text-align: left;
}

.cloud-icon {
  font-size: 18px;
  color: #1C1D21;
}

.weather-card-container {
  border-radius: 12px;
  border: 1px solid #F0F0F3;
  background-color: #ffffff;
  overflow: hidden;
}

.main-gradient-box {
  margin: 5px;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #FFFFFF;
}

.box-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weather-status-icon {
  font-size: 36px;
}

.time-text {
  font-weight: 400;
  font-size: 13px;
}

.box-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.temp-val {
  font-weight: 600;
  font-size: 42px;
  line-height: 1;
  margin-bottom: 12px;
}

.city-text {
  font-weight: 500;
  font-size: 13px;
  line-height: 1.5;
}

.condition-label {
  font-weight: 400;
  font-size: 13px;
  line-height: 1;
}

.details-body {
  padding: 0 8px 0 8px;
  display: flex;
  flex-direction: column;
}

.forecast-section-title {
  font-weight: 500;
  font-size: 17px;
  line-height: 1.5;
  color: #1C1D21;
  margin: 5px 0 10px 0;
  text-align: left;
}

.forecast-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.day-label {
  font-weight: 500;
  font-size: 14px;
  color: #1C1D21;
  width: 140px !important;
  flex-shrink: 0;
  text-align: left;
}

.range-min, .range-max {
  font-weight: 500;
  font-size: 14px;
  color: #1C1D21;
}

.adaptive-bar-container {
  flex-grow: 1;
  height: 6px;
  background: #F0F0F3;
  border-radius: 100px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  left: 0;
  height: 100%;
  background: #2E4A3A;
  border-radius: 100px;
}

.viora-divider {
  height: 1px;
  background-color: #F0F0F3;
  width: 100%;
  margin-bottom: 15px;
}

.metric-info-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 6px;
  gap: 12px;
  width: 100%;
}

.metric-name {
  font-weight: 500;
  font-size: 14px;
  color: #1C1D21;
  width: 140px !important;
  flex-shrink: 0;
  line-height: 1.2;
  text-align: left;
}

.metric-pill {
  padding: 4px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-text {
  color: #FFFFFF;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
}

.weather-loader {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>le>