<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgronomicStore } from '../../application/agronomic.store.js';

const { t } = useI18n();
const agronomicStore = useAgronomicStore();

onMounted(async () => {
  await agronomicStore.fetchWeather('Tacna');
});

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

const currentTime = computed(() => {
  const lastUpdate = agronomicStore.weatherSummary?.lastUpdate;
  if (!lastUpdate) return '—';
  const date = new Date(lastUpdate);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

const rangeProgressStyles = computed(() => {
  const weather = agronomicStore.weatherSummary;
  const today = weather?.forecast3Days?.[0];
  if (!weather || !today || today.maxTemp <= today.minTemp) return { width: '20%' };
  const progress = ((weather.currentTemp - today.minTemp) / (today.maxTemp - today.minTemp)) * 100;
  return { width: `${Math.min(100, Math.max(20, Math.round(progress)))}%` };
});

const heroBackground = computed(() => {
  const bg = agronomicStore.weatherSummary?.backgroundImage;
  return bg ? `url("${bg}")` : '';
});

const riskColor = computed(() => {
  const risk = agronomicStore.weatherSummary?.climateRisk;
  if (risk === 'High') return 'linear-gradient(135deg, #ca6639, #bd5428)';
  if (risk === 'Low') return 'linear-gradient(135deg, #3a9d6e, #2e7d56)';
  return 'linear-gradient(135deg, #ca6639, #bd5428)';
});
</script>

<template>
  <div class="weather-summary-card">
    <pv-card class="weather-card-container shadow-none">
      <template #content>
        <div v-if="agronomicStore.weatherSummary" class="main-layout-viora">
          <div class="header-row">
            <h2 class="widget-title">{{ t('dashboard.weather-summary-title') }}</h2>
            <button class="cloud-btn" :aria-label="t('dashboard.weather-summary-title')">
              <i class="pi pi-cloud"></i>
            </button>
          </div>

          <div
            class="weather-hero"
            :style="heroBackground
              ? { backgroundImage: heroBackground, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { backgroundColor: 'rgba(66,89,143,0.62)' }"
          >
            <img
              v-if="agronomicStore.weatherSummary.icon"
              :src="agronomicStore.weatherSummary.icon"
              :alt="agronomicStore.weatherSummary.condition"
              class="weather-hero-icon"
            />
            <i v-else :class="weatherTheme.icon" class="weather-hero-icon-fallback"></i>

            <span class="weather-time">{{ currentTime }}</span>

            <div class="weather-current">
              <strong>{{ Math.round(agronomicStore.weatherSummary.currentTemp) }}°C</strong>
              <span>{{ agronomicStore.weatherSummary.city }}</span>
              <span>{{ agronomicStore.weatherSummary.condition }}</span>
            </div>
          </div>

          <div class="details-body">
            <h3 class="forecast-section-title">{{ t('dashboard.forecast-title') }}</h3>

            <div v-if="agronomicStore.weatherSummary.forecast3Days?.[0]" class="forecast-item-row">
              <span class="day-label">{{ agronomicStore.weatherSummary.forecast3Days[0].dayLabel }}</span>
              <strong class="temp-bound">{{ Math.round(agronomicStore.weatherSummary.forecast3Days[0].minTemp) }}°</strong>
              <div class="adaptive-bar-container">
                <div class="bar-fill" :style="rangeProgressStyles"></div>
              </div>
              <strong class="temp-bound">{{ Math.round(agronomicStore.weatherSummary.forecast3Days[0].maxTemp) }}°</strong>
              <i class="pi pi-chevron-right chevron-icon"></i>
            </div>

            <section class="weather-metrics">
              <div class="metric-info-row">
                <span class="metric-name">{{ t('dashboard.temperature-anomaly-label') }}</span>
                <div class="metric-pill anomaly-pill">
                  <span class="pill-text">{{ agronomicStore.weatherSummary.anomalyLabel }}</span>
                </div>
              </div>

              <div class="metric-info-row">
                <span class="metric-name">{{ t('dashboard.climate-risk-label') }}</span>
                <div class="metric-pill risk-pill" :style="{ background: riskColor }">
                  <span class="pill-text">{{ agronomicStore.weatherSummary.climateRisk }}</span>
                </div>
              </div>
            </section>
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

.weather-summary-card {
  height: 100%;
}

.weather-card-container {
  height: 100%;
  min-height: 460px;
  box-sizing: border-box;
  border-radius: 18px;
  border: none;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
  overflow: visible;
  font-family: 'Poppins', sans-serif;
}

:deep(.p-card-body) {
  padding: 28px;
  height: 100%;
  box-sizing: border-box;
}

:deep(.p-card-content) {
  padding: 0 !important;
  height: 100%;
}

.main-layout-viora {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 32px;
}

.widget-title {
  margin: 0;
  color: #1f2523;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.15;
  font-family: 'Poppins', sans-serif;
}

.cloud-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #2e4a3a;
  border-radius: 10px;
  color: #2e4a3a;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cloud-btn .pi {
  font-size: 18px;
  width: 18px;
  height: 18px;
}

.weather-hero {
  position: relative;
  min-height: 112px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 14px 28px;
  border: 2px solid #ebebf0;
  border-radius: 18px;
  background-color: rgba(66, 89, 143, 0.62);
  background-position: center;
  background-size: cover;
  color: #ffffff;
  overflow: visible;
}

.weather-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(90deg, rgba(47, 79, 128, 0.58), rgba(255, 255, 255, 0.01)),
    rgba(255, 255, 255, 0.01);
  backdrop-filter: blur(4px) saturate(135%);
}

.weather-hero-icon {
  position: absolute;
  left: -30px;
  top: -38px;
  z-index: 1;
  width: 120px;
  max-width: 48%;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.weather-hero-icon-fallback {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  font-size: 42px;
}

.weather-time,
.weather-current {
  position: relative;
  z-index: 1;
}

.weather-time {
  position: absolute;
  left: 30px;
  bottom: 16px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1;
}

.weather-current {
  min-width: 118px;
  display: grid;
  justify-items: start;
  gap: 6px;
}

.weather-current strong {
  font-size: 48px;
  font-weight: 600;
  line-height: 0.95;
}

.weather-current span {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.05;
}

.weather-current span:first-of-type {
  font-weight: 500;
}

.details-body {
  display: flex;
  flex-direction: column;
  margin-top: 24px;
}

.forecast-section-title {
  margin: 0 0 18px;
  color: #1f2523;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.1;
  font-family: 'Poppins', sans-serif;
}

.forecast-item-row {
  display: grid;
  grid-template-columns: minmax(78px, 1fr) auto minmax(86px, 1.35fr) auto 26px;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #ece8e0;
  color: #1f2523;
}

.day-label {
  font-size: 16px;
  font-weight: 500;
}

.temp-bound {
  font-size: 16px;
  font-weight: 500;
}

.chevron-icon {
  color: #000000;
  font-size: 22px;
  width: 22px;
  height: 22px;
}

.adaptive-bar-container {
  position: relative;
  height: 6px;
  display: block;
  border-radius: 999px;
  background: #ebe9ec;
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  min-width: 12px;
  border-radius: inherit;
  background: linear-gradient(90deg, #f3cf2d, #d45a19);
}

.weather-metrics {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.metric-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.metric-name {
  color: #1f2523;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.15;
  font-family: 'Poppins', sans-serif;
}

.metric-pill {
  min-width: 118px;
  box-sizing: border-box;
  padding: 8px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #eca31e, #c65a2d);
  color: #ffffff;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.risk-pill {
  background: linear-gradient(135deg, #ca6639, #bd5428);
}

.pill-text {
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
}

.weather-loader {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viora-divider {
  display: none;
}

@media (max-width: 1100px) {
  .weather-card-container {
    height: auto;
    min-height: 460px;
  }

  .weather-hero-icon {
    width: 120px;
  }
}

@media (max-width: 720px) {
  :deep(.p-card-body) {
    padding: 24px 22px;
  }

  .header-row {
    margin-bottom: 32px;
  }

  .widget-title,
  .forecast-section-title {
    font-size: 18px;
  }

  .weather-hero {
    min-height: 112px;
    padding: 22px;
  }

  .weather-hero-icon {
    left: -22px;
    top: -36px;
    width: 116px;
  }

  .weather-time {
    left: 22px;
    bottom: 24px;
    font-size: 14px;
  }

  .weather-current {
    min-width: 116px;
  }

  .weather-current strong {
    font-size: 48px;
  }

  .weather-current span,
  .day-label,
  .temp-bound {
    font-size: 16px;
  }

  .metric-name {
    font-size: 14px;
  }

  .metric-pill {
    font-size: 12px;
    min-width: 118px;
    padding-inline: 18px;
  }

  .forecast-item-row {
    grid-template-columns: minmax(66px, 0.9fr) auto minmax(70px, 1fr) auto 24px;
    gap: 10px;
  }
}
</style>