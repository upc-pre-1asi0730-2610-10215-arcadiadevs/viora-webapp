<script setup>
/**
 * MyPlotsOverviewView.
 * Lists every registered plot with its monitoring KPIs (registered plots,
 * monitored area, climate links and online IoT devices) plus a per-plot card
 * row. Sourced from the platform `GET /plots/overview` contract, served by
 * json-server while the C# backend is under construction.
 *
 * @component
 */
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgronomicStore } from '../../application/agronomic.store.js';
import { MyPlotsOverview } from '../../domain/model/my-plots-overview.entity.js';
import PlotThumbnail from '../components/plot-thumbnail.vue';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';

const { t } = useI18n();
const agronomicStore = useAgronomicStore();

const breadcrumbs = computed(() => [
  { label: t('sidebar.myPlots'), disabled: true },
  { label: t('myPlots.overview'), disabled: true }
]);

const overview = ref(new MyPlotsOverview());
const loading = ref(false);
const errors = ref([]);

const tabs = [
  { id: 'dashboard', labelKey: 'toolbar.dashboard', icon: 'pi pi-th-large', route: '/dashboard' },
  { id: 'plot-overview', labelKey: 'toolbar.plotOverview', icon: 'pi pi-map', active: true },
  { id: 'weather', labelKey: 'toolbar.weather', icon: 'pi pi-cloud', route: '/dashboard/weather' }
];

const plots = computed(() => overview.value.plots);

const monitoredAreaLabel = computed(() => `${overview.value.monitoredAreaHectares.toFixed(1)} ha`);

const climateLinkedLabel = computed(
    () => `${overview.value.climateLinkedPlotCount} / ${overview.value.registeredPlotCount}`
);

const updatedLabel = computed(() => `${t('dashboard.updated-label')} ${relativeTime(overview.value.lastUpdatedAt)}`);

/**
 * Maps a normalized health status to a status-pill style modifier.
 * @param {string} status - Display health status.
 * @returns {string} CSS modifier class.
 */
const statusModifier = (status) => {
  switch (status) {
    case 'Healthy':
      return 'is-healthy';
    case 'Critical':
      return 'is-critical';
    default:
      return 'is-review';
  }
};

/**
 * Builds a short "N min/h/d ago" label for a plot's last-update timestamp.
 * @param {string} isoTimestamp - ISO-8601 timestamp.
 * @returns {string} Relative time label.
 */
function relativeTime(isoTimestamp) {
  const timestamp = isoTimestamp ? Date.parse(isoTimestamp) : Number.NaN;
  if (!Number.isFinite(timestamp)) return '—';

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h ago`;

  return `${Math.round(diffHours / 24)} d ago`;
}

const loadOverview = async () => {
  loading.value = true;
  errors.value = [];
  try {
    const result = await agronomicStore.fetchMyPlotsOverview();
    if (result) overview.value = result;
  } catch (error) {
    errors.value.push(error);
  } finally {
    loading.value = false;
  }
};

const refresh = () => loadOverview();

onMounted(loadOverview);
</script>

<template>
  <section class="my-plots-page">
    <DashboardHeader
      :breadcrumbs="breadcrumbs"
      :subtitle="t('myPlots.subtitle')"
      :updated-label="updatedLabel"
      @refresh="refresh"
    >
      <template #actions>
        <LanguageSwitcher />
      </template>
    </DashboardHeader>

    <!-- View tabs -->
    <nav class="plot-tabs" aria-label="My Plots views">
      <template v-for="tab in tabs" :key="tab.id">
        <router-link
            v-if="tab.route"
            :to="tab.route"
            class="plot-tab"
            :class="{ 'is-active': tab.active }"
        >
          <i :class="tab.icon"></i>
          {{ t(tab.labelKey) }}
        </router-link>
        <button
            v-else
            type="button"
            class="plot-tab"
            :class="{ 'is-active': tab.active }"
        >
          <i :class="tab.icon"></i>
          {{ t(tab.labelKey) }}
        </button>
      </template>
    </nav>

    <!-- KPI summary cards -->
    <section class="kpi-grid">
      <article class="kpi-card">
        <h2>{{ t('myPlots.kpi.registeredPlots') }}</h2>
        <span class="kpi-number kpi-number--lg">{{ overview.registeredPlotCount }}</span>
        <p class="kpi-caption">{{ t('myPlots.kpi.registeredPlotsCaption') }}</p>
      </article>

      <article class="kpi-card">
        <h2>{{ t('myPlots.kpi.monitoredArea') }}</h2>
        <span class="kpi-number">{{ monitoredAreaLabel }}</span>
        <p class="kpi-caption">{{ t('myPlots.kpi.monitoredAreaCaption') }}</p>
      </article>

      <article class="kpi-card">
        <h2>{{ t('myPlots.kpi.climateLinked') }}</h2>
        <span class="kpi-number">{{ climateLinkedLabel }}</span>
        <p class="kpi-caption">{{ t('myPlots.kpi.climateLinkedCaption') }}</p>
        <span v-if="overview.allClimateLinked" class="kpi-tag kpi-tag--green">
          <i class="pi pi-check-circle"></i>
          {{ t('myPlots.kpi.allLinked') }}
        </span>
      </article>

      <article class="kpi-card">
        <h2>{{ t('myPlots.kpi.iotDevices') }}</h2>
        <span class="kpi-number">{{ overview.onlineDeviceCount }} {{ t('myPlots.kpi.online') }}</span>
        <p class="kpi-caption">{{ t('myPlots.kpi.iotDevicesCaption') }}</p>
        <span v-if="overview.plotsWithIotCount > 0" class="kpi-tag kpi-tag--green">
          <i class="pi pi-wifi"></i>
          {{ t('myPlots.kpi.iot') }}
        </span>
      </article>
    </section>

    <!-- Your Plots header -->
    <section class="plots-header">
      <div class="plots-header-title">
        <h2>{{ t('myPlots.yourPlots') }}</h2>
        <span class="plots-count">
          {{ t('myPlots.plotsRegistered', { count: overview.registeredPlotCount }) }}
        </span>
      </div>

      <div class="plots-header-actions">
        <router-link to="/agronomic/plots/import" class="ghost-button">
          <i class="pi pi-upload"></i>
          {{ t('myPlots.importCoordinates') }}
        </router-link>
        <router-link to="/agronomic/plots/new" class="ghost-button">
          <i class="pi pi-plus"></i>
          {{ t('myPlots.addPlot') }}
        </router-link>
      </div>
    </section>

    <!-- Plot cards -->
    <article v-if="loading && plots.length === 0" class="state-card">{{ t('common.loading') }}…</article>
    <article v-else-if="plots.length === 0" class="state-card">{{ t('myPlots.empty') }}</article>
    <section v-else class="plot-list">
      <article v-for="plot in plots" :key="plot.id" class="plot-card">
        <div class="plot-thumb">
          <PlotThumbnail :polygon-coordinates="plot.polygonCoordinates" />
        </div>

        <div class="plot-body">
          <div class="plot-title-row">
            <h3 class="plot-name">{{ plot.name }}</h3>
            <span class="status-pill" :class="statusModifier(plot.healthStatus)">
              {{ plot.healthStatus }}
            </span>
          </div>

          <p class="plot-meta">{{ plot.metaLabel }}</p>

          <div class="plot-indicators">
            <span class="indicator">
              <svg class="indicator-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M13 2.5c-4.5 0-8 2.6-8 7 0 1 .2 1.9.6 2.7L3.3 14.4a.7.7 0 0 0 1 1l2.2-2.3c.8.4 1.7.6 2.7.6 0 0 3.3-5.2 3.3-8.8 0-1 .2-1.7.5-2.4Z" />
              </svg>
              {{ t('myPlots.ndvi') }} ·
              <strong>{{ plot.ndviLabel }}</strong>
            </span>
            <span class="indicator">
              <svg class="indicator-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 1v14M2.1 4.5l11.8 7M13.9 4.5 2.1 11.5M8 3.4 5.9 1.8m2.1 1.6L10.1 1.8M8 12.6l-2.1 1.6m2.1-1.6 2.1 1.6M2.7 6.3l.2-2.6m-.2 2.6L.4 6.7m13.2-.4.2-2.6m-.2 2.6 2.3.4M2.7 9.7l-2.3.4m2.3-.4-.2 2.6m13.4-2.6-2.3-.4m2.3.4-.2 2.6" />
              </svg>
              {{ t('myPlots.chill') }} ·
              <strong>{{ plot.chillLabel }}</strong>
            </span>
          </div>

          <div class="plot-tags">
            <span v-if="plot.hasAlerts" class="tag tag--alert">
              <i class="pi pi-exclamation-triangle"></i>
              {{ t('myPlots.activeAlerts', { count: plot.activeAlertCount }) }}
            </span>
            <span v-if="plot.hasIot" class="tag tag--devices">
              <i class="pi pi-wifi"></i>
              {{ t('myPlots.devicesOnline', { count: plot.onlineDeviceCount }) }}
            </span>
            <span class="tag tag--time">
              <i class="pi pi-clock"></i>
              {{ relativeTime(plot.lastUpdatedAt) }}
            </span>
          </div>
        </div>

        <div class="plot-action">
          <router-link :to="`/agronomic/plots/${plot.id}`" class="ghost-button">
            {{ t('myPlots.viewDetails') }}
          </router-link>
        </div>
      </article>
    </section>

    <section v-if="errors.length > 0" class="error-box">
      <strong>{{ t('dashboard.empty-alerts-msg') }}</strong>
    </section>
  </section>
</template>

<style scoped>
.my-plots-page {
  width: 100%;
  font-family: 'Poppins', sans-serif;
  color: #1f2523;
}

/* ---------- View tabs ---------- */
.plot-tabs {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 24px;
  background: #ffffff;
  border-radius: 16px;
}

.plot-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #e8e4df;
  border-radius: 8px;
  background: #ffffff;
  color: #333333;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.plot-tab i {
  font-size: 16px;
}

.plot-tab:hover {
  background: #f3f6f2;
  color: #2e4a3a;
}

.plot-tab.is-active {
  border-color: #2e4a3a;
  color: #2e4a3a;
  background: #f3f6f2;
}

/* ---------- KPI cards ---------- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 24px;
  margin-bottom: 28px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  min-height: 168px;
  box-sizing: border-box;
  padding: 22px 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.kpi-card h2 {
  margin: 0;
  font-weight: 500;
  font-size: 18px;
  color: #1f2523;
}

.kpi-number {
  margin-top: 6px;
  font-weight: 600;
  font-size: 32px;
  line-height: 1.1;
  color: #1f2523;
}

.kpi-number--lg {
  font-size: 48px;
}

.kpi-caption {
  margin: 10px 0 0;
  font-weight: 400;
  font-size: 12px;
  color: #8c877f;
}

.kpi-tag {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 5px 12px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
}

.kpi-tag i {
  font-size: 14px;
}

.kpi-tag--green {
  background: #57eba1;
  color: #2e4a3a;
}

/* ---------- Your Plots header ---------- */
.plots-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  margin-bottom: 20px;
  background: #ffffff;
  border-radius: 16px;
}

.plots-header-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.plots-header-title h2 {
  margin: 0;
  font-weight: 500;
  font-size: 20px;
  color: #1f2523;
}

.plots-count {
  font-weight: 400;
  font-size: 16px;
  color: #333333;
}

.plots-header-actions {
  display: flex;
  gap: 12px;
}

/* ---------- Ghost buttons ---------- */
.ghost-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  border: 1.5px solid #2e4a3a;
  border-radius: 8px;
  background: transparent;
  color: #2e4a3a;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghost-button i {
  font-size: 14px;
}

.ghost-button:hover {
  background: #2e4a3a;
  color: #ffffff;
}

/* ---------- Plot cards ---------- */
.plot-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.plot-card {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.plot-thumb {
  width: 148px;
  height: 132px;
}

.plot-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plot-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plot-name {
  margin: 0;
  font-weight: 500;
  font-size: 18px;
  color: #333333;
}

.plot-meta {
  margin: 0;
  font-weight: 500;
  font-size: 12px;
  color: #828282;
}

.plot-indicators {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 2px;
}

.indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 400;
  font-size: 12px;
  color: #333333;
}

.indicator strong {
  font-weight: 500;
}

.indicator-icon {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: #6b716d;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---------- Tags ---------- */
.plot-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
}

.tag i {
  font-size: 13px;
}

.tag--alert {
  background: #ff5c5c;
  color: #ffffff;
}

.tag--devices {
  background: #5b8def;
  color: #ffffff;
}

.tag--time {
  background: #f0ebe3;
  color: #8c877f;
}

/* ---------- Status pills ---------- */
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
}

.status-pill.is-healthy {
  background: #57eba1;
  color: #17432f;
}

.status-pill.is-review {
  background: #e6e2db;
  color: #6b716d;
}

.status-pill.is-critical {
  background: #ff5c5c;
  color: #ffffff;
}

.plot-action {
  display: flex;
  align-items: center;
}

/* ---------- States ---------- */
.state-card {
  padding: 28px 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
  font-size: 14px;
  color: #6b716d;
}

.error-box {
  margin-top: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  background: #fdecea;
  color: #b3261e;
  font-size: 13px;
}

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 760px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .plot-card {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .plot-thumb {
    width: 100%;
    height: 160px;
  }

  .plots-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
