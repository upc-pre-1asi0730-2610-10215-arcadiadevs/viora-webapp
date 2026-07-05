<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAgronomicStore } from '../../application/agronomic.store.js';
import { DateTimeFormatter } from '../../../shared/infrastructure/date-time.formatter.js';
import { mapboxService } from '../../../shared/infrastructure/mapbox.service.js';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';

const WEATHER_ICON_ROOT = '/assets/icons/weather';
const WEATHER_BACKGROUND_ROOT = '/assets/icons/backgrounds';

const router = useRouter();
const route = useRoute();
const agronomicStore = useAgronomicStore();

const plots = ref([]);
const selectedPlotId = ref(null);
const weatherByPlotId = ref({});
const summaryByPlotId = ref({});
const searchTerm = ref('');
const loading = ref(false);
const loadingPlots = ref(false);
const errors = ref([]);
const precipitationMapContainer = ref(null);
const precipitationMap = shallowRef(null);

const normalizeStatus = (status = '') => String(status || '').replace(/_/g, ' ').trim();

const humanizeStatus = (status = '') => {
  const value = normalizeStatus(status).toLowerCase();
  if (!value) return 'Cloudy';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const iconFor = (status = '') => {
  const value = normalizeStatus(status).toUpperCase();
  if (value.includes('STORM') || value.includes('THUNDER')) return `${WEATHER_ICON_ROOT}/thunderstorm.png`;
  if (value.includes('RAIN') || value.includes('DRIZZLE') || value.includes('SNOW')) return `${WEATHER_ICON_ROOT}/light_rain.png`;
  if (value.includes('SAND') || value.includes('DUST') || value.includes('WIND')) return `${WEATHER_ICON_ROOT}/blowing_sand.png`;
  if (value.includes('PARTLY')) return `${WEATHER_ICON_ROOT}/sun_cloudy.png`;
  if (value.includes('CLOUD')) return `${WEATHER_ICON_ROOT}/cloud.png`;
  if (value.includes('SUN') || value.includes('CLEAR')) return `${WEATHER_ICON_ROOT}/sunny.png`;
  return `${WEATHER_ICON_ROOT}/sun_cloudy.png`;
};

const backgroundFor = (status = '') => {
  const value = normalizeStatus(status).toLowerCase();
  if (value.includes('storm') || value.includes('thunder')) return `${WEATHER_BACKGROUND_ROOT}/Thunderstorm.png`;
  if (value.includes('rain') || value.includes('drizzle') || value.includes('snow')) return `${WEATHER_BACKGROUND_ROOT}/rain.png`;
  if (value.includes('wind') || value.includes('breez') || value.includes('sand') || value.includes('dust')) return `${WEATHER_BACKGROUND_ROOT}/breezy.png`;
  if (value.includes('clear') || value.includes('sun')) return `${WEATHER_BACKGROUND_ROOT}/clear.png`;
  return `${WEATHER_BACKGROUND_ROOT}/party-cloudy.png`;
};

const formatHourLabel = (timestamp, index) => {
  if (index === 0) return 'Now';
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true
  }).replace(/\s/g, '');
};

const formatWeekday = (date, index) => {
  if (index === 0) return 'Today';
  if (!date) return '';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
};

const metersPerSecondToKmh = (value = 0) => Math.round(Number(value || 0) * 3.6);

const selectedPlot = computed(() => {
  return plots.value.find((plot) => String(plot.id) === String(selectedPlotId.value)) ?? null;
});

const breadcrumbs = computed(() => [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Weather', disabled: true },
  { label: selectedPlot.value?.name || 'Plot', disabled: true }
]);

const selectedWeather = computed(() => weatherByPlotId.value[String(selectedPlotId.value)] ?? null);
const selectedSummary = computed(() => summaryByPlotId.value[String(selectedPlotId.value)] ?? null);
const selectedHourly = computed(() => selectedWeather.value?.hourly ?? []);
const selectedDaily = computed(() => selectedWeather.value?.daily ?? []);
const currentHour = computed(() => selectedHourly.value[0] ?? {});
const todayForecast = computed(() => selectedDaily.value[0] ?? {});

const currentStatus = computed(() => currentHour.value.weatherStatus ?? todayForecast.value.dominantStatus ?? '');
const currentCondition = computed(() => humanizeStatus(currentStatus.value));
const currentTemperature = computed(() => currentHour.value.temperatureCelsius ?? todayForecast.value.averageTemperatureCelsius ?? 0);
const highTemperature = computed(() => todayForecast.value.maxTemperatureCelsius ?? currentTemperature.value);
const lowTemperature = computed(() => todayForecast.value.minTemperatureCelsius ?? currentTemperature.value);
const climateRisk = computed(() => humanizeStatus(selectedWeather.value?.overallRisk ?? 'Low'));
const plotArea = computed(() => selectedPlot.value?.areaSize ?? 0);
const plotLocation = computed(() => selectedPlot.value?.locationReference || selectedPlot.value?.location || 'Tacna');

const updatedLabel = computed(() => {
  if (selectedWeather.value?.updatedLabel) return selectedWeather.value.updatedLabel;
  return DateTimeFormatter.formatRelativeTime(selectedWeather.value?.generatedAt);
});

const filteredPlots = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return plots.value;
  return plots.value.filter((plot) => {
    const haystack = `${plot.name} ${plot.locationReference || ''}`.toLowerCase();
    return haystack.includes(term);
  });
});

const heroBackgroundStyle = computed(() => ({
  backgroundImage: `linear-gradient(180deg, rgba(16,34,55,0.42), rgba(16,34,55,0.5) 45%, rgba(16,34,55,0.62)), url("${backgroundFor(currentStatus.value)}")`
}));

const plotCardStyle = (plot) => {
  const weather = weatherByPlotId.value[String(plot.id)];
  const status = weather?.hourly?.[0]?.weatherStatus ?? weather?.daily?.[0]?.dominantStatus ?? '';
  return {
    backgroundImage: `linear-gradient(120deg, rgba(20,32,48,0.55), rgba(20,32,48,0.2)), url("${backgroundFor(status)}")`
  };
};

const hourlyForecast = computed(() => {
  const source = selectedHourly.value.length ? selectedHourly.value : [currentHour.value];
  return source.slice(0, 6).map((hour, index) => ({
    id: `${hour.timestamp || index}-${index}`,
    label: formatHourLabel(hour.timestamp, index),
    icon: iconFor(hour.weatherStatus ?? currentStatus.value),
    temperature: Math.round(hour.temperatureCelsius ?? currentTemperature.value)
  }));
});

const dailyForecast = computed(() => {
  const days = selectedDaily.value.slice(0, 5);
  const min = Math.min(...days.map((day) => day.minTemperatureCelsius ?? 0));
  const max = Math.max(...days.map((day) => day.maxTemperatureCelsius ?? 1));
  const range = Math.max(max - min, 1);

  return days.map((day, index) => {
    const dayMin = day.minTemperatureCelsius ?? 0;
    const dayMax = day.maxTemperatureCelsius ?? dayMin;
    const leftPct = ((dayMin - min) / range) * 100;
    const widthPct = Math.max(8, ((dayMax - dayMin) / range) * 100);

    return {
      id: day.date || index,
      label: formatWeekday(day.date, index),
      icon: iconFor(day.dominantStatus),
      min: Math.round(dayMin),
      max: Math.round(dayMax),
      rangeStyle: {
        left: `${Math.min(92, Math.max(0, leftPct))}%`,
        width: `${Math.min(100, widthPct)}%`
      }
    };
  });
});

const precipitationAmount = computed(() => {
  const total = todayForecast.value.totalPrecipitationMillimeters
      ?? selectedHourly.value.reduce((sum, hour) => sum + Number(hour.precipitationMillimeters || 0), 0);
  return Number(total || 0).toFixed(1);
});

const windGustKmh = computed(() => {
  const gust = currentHour.value.windGustMetersPerSecond ?? todayForecast.value.maxWindGustMetersPerSecond ?? 0;
  return metersPerSecondToKmh(gust);
});

const humidity = computed(() => Math.round(currentHour.value.humidityPercentage ?? todayForecast.value.averageHumidityPercentage ?? 0));
const chillCurrent = computed(() => selectedSummary.value?.chillPortions ?? 0);
const chillTarget = computed(() => selectedSummary.value?.chillRequirementPortions ?? 40);
const chillGap = computed(() => chillCurrent.value - chillTarget.value);
const chillTrend = computed(() => chillGap.value < 0 ? 'Below range' : 'On track');
const anomalyLabel = computed(() => {
  const anomaly = selectedWeather.value?.thermalAnomalyCelsius;
  if (anomaly === undefined || anomaly === null) return '-';
  const sign = anomaly > 0 ? '+' : anomaly < 0 ? '-' : '';
  return `${sign}${Math.abs(Number(anomaly)).toFixed(1)}C`;
});

const statisticTiles = computed(() => [
  { id: 'anomaly', icon: 'pi-thermometer', label: 'Temperature anomaly', value: anomalyLabel.value },
  { id: 'risk', icon: 'pi-shield', label: 'Climate risk', value: climateRisk.value, tone: 'risk' },
  { id: 'wind', icon: 'pi-align-right', label: 'Wind gusts', value: `${windGustKmh.value} km/h` },
  { id: 'humidity', icon: 'pi-tint', label: 'Humidity', value: `${humidity.value}%` },
  { id: 'chill', icon: 'pi-snowflake', label: 'Current chill accumulation', value: `${chillCurrent.value} CP` },
  { id: 'target', icon: 'pi-bullseye', label: 'Target for campaign', value: `${chillTarget.value} CP` },
  { id: 'gap', icon: 'pi-chart-line', label: 'Gap', value: `${chillGap.value > 0 ? '+' : ''}${chillGap.value} CP` },
  { id: 'trend', icon: 'pi-chart-line', label: 'Trend', value: chillTrend.value, tone: chillGap.value < 0 ? 'warn' : 'risk' }
]);

const impactBullets = computed(() => {
  const bullets = [];
  if (String(climateRisk.value).toLowerCase() === 'low' && selectedSummary.value?.healthStatus === 'Healthy') {
    bullets.push(`Conditions remain stable for ${selectedPlot.value?.name || 'this plot'} (climate risk: Low).`);
  } else {
    bullets.push(`Conditions require attention for ${selectedPlot.value?.name || 'this plot'} (climate risk: ${climateRisk.value}).`);
  }

  if (chillGap.value < 0) {
    bullets.push(`Below-target chill accumulation (${Math.abs(chillGap.value)} CP) may affect flowering consistency.`);
  } else {
    bullets.push('Chill accumulation is on track for the current campaign.');
  }

  bullets.push('Short-term recommendation: monitor phenological risk and review the nutrition plan.');
  return bullets;
});

const weatherAlerts = computed(() => {
  const warnings = selectedWeather.value?.warnings ?? [];
  if (warnings.length) return warnings.map((warning, index) => ({ id: warning.type || index, message: warning.message || warning.type }));

  const alerts = [];
  if (Math.abs(Number(selectedWeather.value?.thermalAnomalyCelsius || 0)) >= 3) {
    alerts.push({ id: 'thermal', message: 'Thermal anomaly expected during the next forecast window.' });
  }
  if (chillGap.value < 0) {
    alerts.push({ id: 'chill', message: `Chill accumulation gap of ${Math.abs(chillGap.value)} CP detected.` });
  }
  if (String(climateRisk.value).toLowerCase().includes('high')) {
    alerts.push({ id: 'risk', message: 'High climate risk requires agronomic review.' });
  }
  return alerts;
});

const loadWeatherForPlot = async (plotId, { force = false } = {}) => {
  if (!plotId) return null;
  const key = String(plotId);
  if (!force && weatherByPlotId.value[key]) return weatherByPlotId.value[key];

  const weather = await agronomicStore.fetchPlotWeather(plotId);
  weatherByPlotId.value = { ...weatherByPlotId.value, [key]: weather };
  return weather;
};

const loadSummaryForPlot = async (plotId, { force = false } = {}) => {
  if (!plotId) return null;
  const key = String(plotId);
  if (!force && summaryByPlotId.value[key]) return summaryByPlotId.value[key];

  const summary = await agronomicStore.fetchPlotSummary(plotId);
  summaryByPlotId.value = { ...summaryByPlotId.value, [key]: summary };
  return summary;
};

const loadPlots = async () => {
  loadingPlots.value = true;
  try {
    await agronomicStore.fetchPlots();
    plots.value = agronomicStore.plots;
    await Promise.all(plots.value.map((plot) => loadWeatherForPlot(plot.id).catch((error) => errors.value.push(error))));
  } catch (error) {
    errors.value.push(error);
  } finally {
    loadingPlots.value = false;
  }
};

const selectedPlotCenter = computed(() => {
  const coordinates = selectedPlot.value?.polygonCoordinates ?? [];
  if (!coordinates.length) return [-70.29, -18.08];
  const total = coordinates.reduce((acc, coordinate) => {
    acc[0] += coordinate[0];
    acc[1] += coordinate[1];
    return acc;
  }, [0, 0]);
  return [total[0] / coordinates.length, total[1] / coordinates.length];
});

const renderPrecipitationMap = async () => {
  await nextTick();
  if (!precipitationMapContainer.value || !selectedPlot.value) return;

  try {
    if (!precipitationMap.value) {
      precipitationMap.value = await mapboxService.createMapInstance({
        container: precipitationMapContainer.value,
        center: selectedPlotCenter.value,
        zoom: 6,
        style: 'mapbox://styles/mapbox/light-v11',
        interactive: false
      });
      return;
    }

    precipitationMap.value.setCenter(selectedPlotCenter.value);
  } catch (error) {
    errors.value.push(error);
  }
};

const loadSelectedData = async (plotId, options = {}) => {
  if (!plotId) return;
  loading.value = true;
  errors.value = [];

  try {
    await Promise.all([
      loadWeatherForPlot(plotId, options),
      loadSummaryForPlot(plotId, options)
    ]);
    await renderPrecipitationMap();
  } catch (error) {
    errors.value.push(error);
  } finally {
    loading.value = false;
  }
};

const ensureRoutePlot = async () => {
  if (!plots.value.length) await loadPlots();
  const routePlotId = route.params.plotId;
  const nextPlotId = plots.value.some((plot) => String(plot.id) === String(routePlotId))
      ? routePlotId
      : plots.value[0]?.id;

  if (!nextPlotId) return;

  selectedPlotId.value = nextPlotId;
  if (!routePlotId || String(routePlotId) !== String(nextPlotId)) {
    await router.replace(`/dashboard/weather/${nextPlotId}`);
  }

  await loadSelectedData(nextPlotId);
};

const selectPlot = (plotId) => {
  if (!plotId || String(plotId) === String(selectedPlotId.value)) return;
  router.push(`/dashboard/weather/${plotId}`);
};

const refresh = () => loadSelectedData(selectedPlotId.value, { force: true });

const goToNutrition = () => router.push('/agronomic/dynamic-nutrition');
const goToAlerts = () => router.push('/surveillance/alerts');
const goToPlotOverview = () => {
  if (!selectedPlotId.value) return;
  router.push(`/dashboard/plot-overview/${selectedPlotId.value}`);
};

watch(() => route.params.plotId, async (plotId, previousPlotId) => {
  if (!plotId || String(plotId) === String(previousPlotId)) return;
  selectedPlotId.value = plotId;
  await loadSelectedData(plotId);
});

watch(selectedPlotCenter, renderPrecipitationMap);

onMounted(ensureRoutePlot);

onUnmounted(() => {
  if (precipitationMap.value) {
    precipitationMap.value.remove();
    precipitationMap.value = null;
  }
});
</script>

<template>
  <section class="weather-page">
    <DashboardHeader
      :breadcrumbs="breadcrumbs"
      subtitle="Detailed forecast and indicators for the selected plot."
      :updated-label="updatedLabel"
      @refresh="refresh"
    >
      <template #actions>
        <LanguageSwitcher />
      </template>
    </DashboardHeader>

    <section class="weather-layout">
      <aside class="plot-list" aria-label="Weather plots">
        <label class="search-box">
          <i class="pi pi-search"></i>
          <input v-model="searchTerm" type="search" placeholder="Search" />
        </label>

        <div class="plot-card-list">
          <button
              v-for="plot in filteredPlots"
              :key="plot.id"
              type="button"
              :class="['weather-plot-card', { 'is-selected': String(plot.id) === String(selectedPlotId) }]"
              :style="plotCardStyle(plot)"
              @click="selectPlot(plot.id)"
          >
            <span class="plot-card-copy">
              <strong>{{ plot.name }}</strong>
              <span>{{ humanizeStatus(weatherByPlotId[String(plot.id)]?.overallRisk || plot.phenologicalRisk) }} climate risk</span>
              <span>{{ humanizeStatus(weatherByPlotId[String(plot.id)]?.hourly?.[0]?.weatherStatus || 'Cloudy') }}</span>
            </span>
            <span class="plot-card-temp">{{ Math.round(weatherByPlotId[String(plot.id)]?.hourly?.[0]?.temperatureCelsius ?? 0) }}&deg;</span>
          </button>
        </div>
      </aside>

      <article class="weather-detail" :style="heroBackgroundStyle">
        <div v-if="selectedWeather && selectedPlot" class="weather-detail-content">
          <section class="weather-hero-block">
            <h1>{{ selectedPlot.name }}</h1>
            <p>{{ plotLocation }} &middot; {{ plotArea.toFixed(1) }} ha</p>
            <strong>{{ Math.round(currentTemperature) }}&deg;</strong>
            <span>{{ currentCondition }}</span>
            <span>H: {{ Math.round(highTemperature) }}&deg; &nbsp; L: {{ Math.round(lowTemperature) }}&deg;</span>
          </section>

          <section class="glass-card hourly-card">
            <p>{{ currentCondition.toLowerCase() }} conditions expected. Wind gusts around {{ windGustKmh }} km/h.</p>
            <div class="hourly-strip">
              <div v-for="hour in hourlyForecast" :key="hour.id" class="hour-item">
                <strong>{{ hour.label }}</strong>
                <img :src="hour.icon" alt="" />
                <span>{{ hour.temperature }}&deg;</span>
              </div>
            </div>
          </section>

          <section class="mid-row">
            <article class="glass-card forecast-card">
              <h2>5-day forecast</h2>
              <div v-for="day in dailyForecast" :key="day.id" class="day-row">
                <strong>{{ day.label }}</strong>
                <img :src="day.icon" alt="" />
                <span>{{ day.min }}&deg;</span>
                <div class="range-track"><span :style="day.rangeStyle"></span></div>
                <span>{{ day.max }}&deg;</span>
              </div>
            </article>

            <article class="glass-card precipitation-card">
              <h2>Precipitation</h2>
              <div class="precip-map">
                <div ref="precipitationMapContainer" class="precip-mapbox"></div>
                <div class="precip-marker">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ selectedPlot.name }}</span>
                </div>
              </div>
              <strong><i class="pi pi-tint"></i> {{ precipitationAmount }} mm</strong>
            </article>
          </section>

          <section class="glass-card statistics-card">
            <h2>Today Statistics</h2>
            <div class="stats-grid">
              <article
                  v-for="tile in statisticTiles"
                  :key="tile.id"
                  :class="['stat-tile', tile.tone ? `tone-${tile.tone}` : '']"
              >
                <span><i :class="['pi', tile.icon]"></i> {{ tile.label }}</span>
                <strong>{{ tile.value }}</strong>
              </article>
            </div>
          </section>

          <section class="bottom-row">
            <article class="glass-card impact-card">
              <h2>Agronomic Impact</h2>
              <ul>
                <li v-for="bullet in impactBullets" :key="bullet">{{ bullet }}</li>
              </ul>
              <div class="impact-actions">
                <button type="button" @click="goToNutrition"><i class="pi pi-send"></i> Nutrition plan</button>
                <button type="button" @click="goToAlerts"><i class="pi pi-bell"></i> View alerts</button>
                <button type="button" @click="goToPlotOverview"><i class="pi pi-eye"></i> Inspect plot</button>
              </div>
            </article>

            <article class="glass-card alerts-card">
              <h2>Weather Alerts</h2>
              <div v-if="weatherAlerts.length" class="alert-list">
                <span v-for="alert in weatherAlerts" :key="alert.id" class="alert-chip">
                  {{ alert.message }}
                </span>
              </div>
              <p v-else>No weather alerts for this plot.</p>
            </article>
          </section>
        </div>

        <div v-else class="weather-loading">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading weather data...</span>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.weather-page {
  width: 100%;
  color: #1f2523;
}

.weather-layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 22px;
  align-items: stretch;
}

.plot-list {
  min-height: 1040px;
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(180deg, #14304a 0%, #0e2235 100%);
  overflow-y: auto;
}

.search-box {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 0 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.64);
}

.search-box input {
  min-width: 0;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #ffffff;
  font-family: var(--viora-font);
  font-size: 15px;
  font-weight: 400;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.plot-card-list {
  display: grid;
  gap: 14px;
}

.weather-plot-card {
  min-height: 104px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: none;
  border-radius: 18px;
  background-color: #395b79;
  background-position: center;
  background-size: cover;
  color: #ffffff;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.weather-plot-card.is-selected {
  outline: 2px solid rgba(255, 255, 255, 0.85);
}

.plot-card-copy {
  display: grid;
  gap: 2px;
}

.plot-card-copy strong {
  color: #ffffff;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.1;
}

.plot-card-copy span {
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.15;
}

.plot-card-temp {
  color: #ffffff;
  font-size: 48px;
  font-weight: 600;
  line-height: 0.95;
}

.weather-detail {
  min-height: 1040px;
  padding: 34px;
  border-radius: 22px;
  background-color: #445a6e;
  background-position: center;
  background-size: cover;
  color: #ffffff;
  overflow: hidden;
}

.weather-detail-content {
  display: grid;
  gap: 20px;
}

.weather-hero-block {
  display: grid;
  justify-items: center;
  padding: 6px 0 20px;
  text-align: center;
}

.weather-hero-block h1 {
  margin: 0;
  color: #ffffff;
  font-size: 32px;
  font-weight: 500;
  line-height: 1.1;
  text-transform: uppercase;
}

.weather-hero-block p {
  margin: 2px 0 24px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 20px;
  font-weight: 400;
}

.weather-hero-block strong {
  color: #ffffff;
  font-size: 96px;
  font-weight: 200;
  line-height: 0.9;
}

.weather-hero-block span {
  margin-top: 10px;
  color: #ffffff;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.1;
}

.glass-card {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 10px 30px rgba(20, 40, 70, 0.18);
  backdrop-filter: blur(18px);
}

.glass-card h2 {
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 500;
}

.hourly-card {
  padding: 22px 24px;
}

.hourly-card > p {
  margin: 0 0 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.92);
  text-align: center;
  font-size: 12px;
  font-weight: 500;
}

.hourly-strip {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.hour-item {
  display: grid;
  justify-items: center;
  gap: 9px;
}

.hour-item strong {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
}

.hour-item img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.hour-item span {
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
}

.mid-row,
.bottom-row {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(260px, 1fr);
  gap: 20px;
}

.forecast-card,
.precipitation-card,
.statistics-card,
.impact-card,
.alerts-card {
  padding: 22px;
}

.day-row {
  display: grid;
  grid-template-columns: 98px 28px 36px minmax(80px, 1fr) 36px;
  align-items: center;
  gap: 12px;
  min-height: 36px;
}

.day-row strong,
.day-row span {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
}

.day-row strong {
  font-size: 18px;
}

.day-row img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.range-track {
  position: relative;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
}

.range-track span {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffd25a, #ff8a4c);
}

.precipitation-card {
  display: flex;
  flex-direction: column;
}

.precip-map {
  position: relative;
  min-height: 150px;
  overflow: hidden;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.precip-mapbox {
  position: absolute;
  inset: 0;
}

.precip-map :deep(.mapboxgl-ctrl-top-right) {
  display: none;
}

.precip-marker {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  color: #2e4a3a;
  font-size: 12px;
  font-weight: 600;
}

.precip-marker i {
  display: block;
  color: #2e4a3a;
  font-size: 34px;
  filter: drop-shadow(0 4px 8px rgba(31, 37, 35, 0.18));
}

.precip-marker span {
  display: block;
  margin-top: 40px;
  color: rgba(31, 37, 35, 0.52);
}

.precipitation-card > strong {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
}

.statistics-card {
  display: grid;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-tile {
  min-height: 102px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
}

.stat-tile span {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.25;
}

.stat-tile strong {
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.1;
}

.stat-tile.tone-risk strong {
  color: #ffd25a;
}

.stat-tile.tone-warn strong {
  color: #ffb27a;
}

.impact-card ul {
  display: grid;
  gap: 8px;
  margin: 0 0 18px;
  padding-left: 18px;
}

.impact-card li {
  color: #ffffff;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.45;
}

.impact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.impact-actions button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  cursor: pointer;
  font-family: var(--viora-font);
  font-size: 12px;
  font-weight: 500;
}

.impact-actions button:hover {
  background: rgba(255, 255, 255, 0.28);
}

.alert-list {
  display: grid;
  gap: 12px;
}

.alert-chip {
  display: block;
  padding: 14px 16px;
  border: 1px solid rgba(255, 150, 120, 0.4);
  border-radius: 12px;
  background: rgba(255, 120, 90, 0.28);
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}

.alerts-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 13px;
}

.weather-loading {
  min-height: 760px;
  display: grid;
  place-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.weather-loading i {
  font-size: 40px;
}

@media (max-width: 1280px) {
  .weather-layout {
    grid-template-columns: 320px minmax(0, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .weather-layout,
  .mid-row,
  .bottom-row {
    grid-template-columns: 1fr;
  }

  .plot-list,
  .weather-detail {
    min-height: auto;
  }

  .plot-list {
    max-height: 460px;
  }
}

@media (max-width: 720px) {
  .weather-detail {
    padding: 20px;
  }

  .weather-hero-block strong {
    font-size: 72px;
  }

  .hourly-strip {
    grid-template-columns: repeat(3, 1fr);
  }

  .day-row {
    grid-template-columns: 88px 26px 34px minmax(60px, 1fr) 34px;
    gap: 8px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
