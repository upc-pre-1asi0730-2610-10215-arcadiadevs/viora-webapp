<script setup>
/**
 * PlotDetailPage.
 * "My Plots / Plot Detail" screen: productive-area, monitoring-links and IoT
 * summary cards, the registered boundary preview, plot information, a
 * configuration summary, recent configuration activity and linked IoT devices.
 * Sourced from the platform `GET /plots/{plotId}/detail` contract. Mirrors the
 * OS Angular `PlotDetailView`.
 *
 * @component
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { AgronomicApi } from '../../infrastructure/agronomic-api.js';
import { PlotDetailAssembler } from '../../infrastructure/plot-detail.assembler.js';
import PlotThumbnail from '../components/plot-thumbnail.vue';
import PlotDeleteDialog from '../components/plot-delete-dialog.vue';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const agronomicApi = new AgronomicApi();

const plotId = route.params.id ?? '';

const detail = ref(null);
const loading = ref(false);
const deleting = ref(false);
const showDeleteDialog = ref(false);
const errors = ref([]);

const linkLabel = (status) => {
  switch (status) {
    case 'active':
      return t('plotDetail.status.active');
    case 'initializing':
      return t('plotDetail.status.initializing');
    case 'not-linked':
      return t('plotDetail.status.notLinked');
    default:
      return t('plotDetail.status.pending');
  }
};

const linkClass = (status) => {
  switch (status) {
    case 'active':
      return 'tag-active';
    case 'not-linked':
      return 'tag-muted';
    default:
      return 'tag-init';
  }
};

const dateLabel = (iso) => {
  const timestamp = iso ? Date.parse(iso) : Number.NaN;
  if (!Number.isFinite(timestamp)) return '—';
  return new Date(timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

const dateTimeLabel = (iso) => {
  const timestamp = iso ? Date.parse(iso) : Number.NaN;
  if (!Number.isFinite(timestamp)) return '—';
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const relativeTime = (iso) => {
  const timestamp = iso ? Date.parse(iso) : Number.NaN;
  if (!Number.isFinite(timestamp)) return '—';

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h ago`;

  return `${Math.round(diffHours / 24)} d ago`;
};

const editRoute = computed(() => `/agronomic/plots/${plotId}/edit`);
const dashboardOverviewRoute = computed(() => `/dashboard/plot-overview/${plotId}`);

const loadDetail = async () => {
  if (!plotId) return;
  loading.value = true;
  errors.value = [];
  try {
    const response = await agronomicApi.getPlotDetail(plotId);
    detail.value = PlotDetailAssembler.toEntityFromResponse(response);
  } catch (error) {
    errors.value.push(error);
  } finally {
    loading.value = false;
  }
};

const refresh = () => loadDetail();

const confirmDelete = async () => {
  if (!detail.value?.id) return;
  deleting.value = true;
  try {
    await agronomicApi.deletePlot(detail.value.id);
    showDeleteDialog.value = false;
    await router.push('/agronomic/plots');
  } catch (error) {
    errors.value.push(error);
  } finally {
    deleting.value = false;
  }
};

onMounted(loadDetail);
</script>

<template>
  <section class="detail-page">
    <!-- Header -->
    <header class="detail-header">
      <div class="header-left">
        <router-link to="/agronomic/plots" class="back-button" :aria-label="t('plotDetail.back')">
          <i class="pi pi-arrow-left"></i>
        </router-link>
        <div>
          <h1 class="header-title">
            {{ t('sidebar.myPlots') }}
            <span class="title-sep">/</span>
            {{ t('plotDetail.title') }}
            <template v-if="detail">
              <span class="title-sep">/</span> {{ detail.name }}
            </template>
          </h1>
          <p class="header-subtitle">{{ t('plotDetail.subtitle') }}</p>
        </div>
      </div>

      <div class="header-right">
        <LanguageSwitcher />
        <button type="button" class="reset-button" :aria-label="t('common.refresh')" @click="refresh">
          <i class="pi pi-refresh"></i>
        </button>
      </div>
    </header>

    <article v-if="loading && !detail" class="state-card">{{ t('common.loading') }}…</article>

    <template v-else-if="detail">
      <!-- Top row: summary cards + actions -->
      <section class="top-grid">
        <article class="summary-card">
          <h2 class="card-title">{{ t('plotDetail.productiveArea.title') }}</h2>
          <div class="line">
            <span>{{ t('plotDetail.productiveArea.area') }}</span>
            <strong>{{ detail.areaLabel }}</strong>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.productiveArea.points') }}</span>
            <strong>{{ detail.boundaryPointCount }} {{ t('plotDetail.productiveArea.pointsUnit') }}</strong>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.productiveArea.boundary') }}</span>
            <span class="pill" :class="detail.boundaryValidated ? 'tag-active' : 'tag-muted'">
              {{ detail.boundaryValidated ? t('plotDetail.productiveArea.validated') : t('plotDetail.status.pending') }}
            </span>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.productiveArea.registered') }}</span>
            <strong>{{ dateLabel(detail.registeredAt) }}</strong>
          </div>
        </article>

        <article class="summary-card">
          <h2 class="card-title">{{ t('plotDetail.monitoring.title') }}</h2>
          <div class="line">
            <span>{{ t('plotDetail.monitoring.climate') }}</span>
            <span class="pill" :class="linkClass(detail.climateMonitoring)">{{ linkLabel(detail.climateMonitoring) }}</span>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.monitoring.satellite') }}</span>
            <span class="pill" :class="linkClass(detail.satelliteNdvi)">{{ linkLabel(detail.satelliteNdvi) }}</span>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.monitoring.alerts') }}</span>
            <span class="pill tag-active">{{ t('plotDetail.monitoring.enabled') }}</span>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.monitoring.lastSync') }}</span>
            <strong>{{ relativeTime(detail.climateLastSyncAt) }}</strong>
          </div>
        </article>

        <article class="summary-card">
          <div class="card-title-row">
            <h2 class="card-title">{{ t('plotDetail.iot.title') }}</h2>
            <span class="iot-chip">{{ t('myPlots.kpi.iot') }}</span>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.iot.status') }}</span>
            <span v-if="detail.hasIot" class="pill tag-devices">{{ t('myPlots.devicesOnline', { count: detail.onlineDeviceCount }) }}</span>
            <span v-else class="pill tag-muted">{{ t('plotDetail.status.notLinked') }}</span>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.iot.telemetry') }}</span>
            <strong>{{ detail.hasIot ? t('plotDetail.iot.available') : t('plotDetail.iot.none') }}</strong>
          </div>
          <div class="line">
            <span>{{ t('plotDetail.iot.lastReading') }}</span>
            <strong>{{ relativeTime(detail.iotLastActivityAt) }}</strong>
          </div>
          <router-link to="/agronomic/iot-devices" class="ghost-button block">
            <i class="pi pi-cog"></i> {{ t('plotDetail.iot.manage') }}
          </router-link>
        </article>

        <div class="action-column">
          <router-link :to="editRoute" class="ghost-button">
            <i class="pi pi-pencil"></i> {{ t('plotDetail.actions.edit') }}
          </router-link>
          <router-link to="/dashboard" class="ghost-button">
            <i class="pi pi-th-large"></i> {{ t('plotDetail.actions.openDashboard') }}
          </router-link>
          <router-link to="/agronomic/iot-devices/new" class="ghost-button">
            <i class="pi pi-wifi"></i> {{ t('plotDetail.actions.addIot') }}
          </router-link>
          <button type="button" class="delete-action" @click="showDeleteDialog = true">
            <i class="pi pi-trash"></i> {{ t('plotDetail.actions.delete') }}
          </button>
        </div>
      </section>

      <!-- Middle: boundary + info / configuration + activity -->
      <section class="detail-grid">
        <div class="col">
          <article class="boundary-card">
            <div class="card-title-row">
              <h2 class="card-title">{{ t('plotDetail.boundary.title') }}</h2>
              <router-link :to="dashboardOverviewRoute" class="ghost-button">
                <i class="pi pi-arrow-up-right"></i> {{ t('plotDetail.boundary.expand') }}
              </router-link>
            </div>
            <p class="card-subtitle">{{ t('plotDetail.boundary.subtitle') }}</p>

            <div class="boundary-map">
              <PlotThumbnail :polygon-coordinates="detail.polygonCoordinates" />
              <span class="map-status">
                <span class="status-dot"></span>
                {{ t('plotDetail.boundary.closed', { count: detail.boundaryPointCount }) }}
              </span>
              <span class="map-label">{{ detail.name }} · {{ detail.areaLabel }}</span>
            </div>

            <p class="field-info">
              <i class="pi pi-info-circle"></i> {{ t('plotDetail.boundary.note') }}
            </p>
            <router-link to="/dashboard" class="ghost-button block">
              <i class="pi pi-th-large"></i> {{ t('plotDetail.boundary.openDashboard') }}
            </router-link>
          </article>

          <article class="info-card">
            <div class="card-title-row">
              <h2 class="card-title">{{ t('plotDetail.info.title') }}</h2>
              <router-link :to="editRoute" class="ghost-button">
                <i class="pi pi-pencil"></i> {{ t('plotDetail.info.edit') }}
              </router-link>
            </div>
            <div class="card-divider"></div>
            <div class="info-row">
              <span class="info-name"><i class="pi pi-tag"></i> {{ t('plotCreate.fields.name') }}</span>
              <strong>{{ detail.name }}</strong>
            </div>
            <div class="info-row">
              <span class="info-name"><i class="pi pi-file"></i> {{ t('plotCreate.fields.cropType') }}</span>
              <strong>{{ detail.cropType || '—' }}</strong>
            </div>
            <div class="info-row">
              <span class="info-name"><i class="pi pi-map-marker"></i> {{ t('plotCreate.fields.location') }}</span>
              <strong>{{ detail.location || '—' }}</strong>
            </div>
            <div class="info-row">
              <span class="info-name"><i class="pi pi-calendar"></i> {{ t('plotCreate.fields.campaign') }}</span>
              <strong>{{ detail.campaign || '—' }}</strong>
            </div>
            <div class="info-row">
              <span class="info-name"><i class="pi pi-align-left"></i> {{ t('plotCreate.fields.notes') }}</span>
              <span class="info-notes">{{ detail.notes || '—' }}</span>
            </div>
          </article>
        </div>

        <div class="col">
          <article class="config-card">
            <h2 class="card-title">{{ t('plotDetail.config.title') }}</h2>
            <p class="card-subtitle">{{ t('plotDetail.config.subtitle') }}</p>

            <div class="config-row">
              <span class="config-name"><span class="ico ico-green"><i class="pi pi-sitemap"></i></span> {{ t('plotDetail.config.boundary') }}</span>
              <span class="pill" :class="detail.boundaryValidated ? 'tag-active' : 'tag-muted'">
                <i class="pi pi-check"></i> {{ detail.boundaryValidated ? t('plotDetail.config.done') : t('plotDetail.status.pending') }}
              </span>
            </div>
            <div class="config-row">
              <span class="config-name"><span class="ico ico-blue"><i class="pi pi-cloud"></i></span> {{ t('plotDetail.config.climate') }}</span>
              <span class="pill" :class="linkClass(detail.climateMonitoring)">{{ linkLabel(detail.climateMonitoring) }}</span>
            </div>
            <div class="config-row">
              <span class="config-name"><span class="ico ico-purple"><i class="pi pi-globe"></i></span> {{ t('plotDetail.config.satellite') }}</span>
              <span class="pill" :class="linkClass(detail.satelliteNdvi)">{{ linkLabel(detail.satelliteNdvi) }}</span>
            </div>
            <div class="config-row">
              <span class="config-name"><span class="ico ico-blue4"><i class="pi pi-wifi"></i></span> {{ t('plotDetail.config.iot') }}</span>
              <span v-if="detail.hasIot" class="pill tag-devices">{{ t('myPlots.devicesOnline', { count: detail.linkedDeviceCount }) }}</span>
              <span v-else class="pill tag-muted">{{ t('plotDetail.status.notLinked') }}</span>
            </div>
            <div class="config-row">
              <span class="config-name"><span class="ico ico-secondary"><i class="pi pi-bell"></i></span> {{ t('plotDetail.config.alerts') }}</span>
              <span class="pill tag-on">{{ t('plotDetail.config.on') }}</span>
            </div>
          </article>

          <article class="activity-card">
            <h2 class="card-title">{{ t('plotDetail.activity.title') }}</h2>
            <p class="card-subtitle">{{ t('plotDetail.activity.subtitle') }}</p>

            <p v-if="detail.activity.length === 0" class="field-info">{{ t('plotDetail.activity.empty') }}</p>
            <ul v-else class="timeline">
              <li v-for="(item, index) in detail.activity" :key="index" class="timeline-item">
                <span class="dot"></span>
                <div>
                  <strong>{{ item.description }}</strong>
                  <p>{{ dateTimeLabel(item.occurredAt) }}</p>
                </div>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <!-- Linked IoT devices -->
      <article class="devices-card">
        <div class="card-title-row">
          <div>
            <h2 class="card-title">{{ t('plotDetail.devices.title') }}</h2>
            <p class="card-subtitle">{{ t('plotDetail.devices.subtitle', { name: detail.name }) }}</p>
          </div>
          <router-link to="/agronomic/iot-devices/new" class="ghost-button">
            <i class="pi pi-plus"></i> {{ t('plotDetail.devices.add') }}
          </router-link>
        </div>

        <p v-if="detail.devices.length === 0" class="field-info">{{ t('plotDetail.devices.empty') }}</p>
        <div v-else class="devices-grid">
          <div v-for="device in detail.devices" :key="device.id" class="device-card">
            <div class="device-head">
              <strong>{{ device.name }}</strong>
              <span class="pill" :class="device.status === 'ONLINE' ? 'tag-active' : 'tag-muted'">{{ device.status }}</span>
            </div>
            <div class="device-line">
              <span>{{ t('plotDetail.devices.lastRead') }}</span>
              <strong>{{ relativeTime(device.lastActivityAt) }}</strong>
            </div>
          </div>
        </div>
      </article>
    </template>

    <article v-else class="state-card">{{ t('plotDetail.notFound') }}</article>

    <PlotDeleteDialog
        v-if="showDeleteDialog && detail"
        :plot-name="detail.name"
        @cancel="showDeleteDialog = false"
        @confirm="confirmDelete"
    />
  </section>
</template>

<style scoped>
.detail-page {
  width: 100%;
  font-family: 'Poppins', sans-serif;
  color: #1f2523;
}

/* ---------- Header ---------- */
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button,
.reset-button {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid #d8d3cb;
  border-radius: 10px;
  background: transparent;
  color: #2e4a3a;
  text-decoration: none;
  cursor: pointer;
}

.back-button:hover,
.reset-button:hover {
  background: #f3f6f2;
}

.header-title {
  margin: 0;
  font-weight: 500;
  font-size: 20px;
  color: #333333;
}

.title-sep {
  color: #333333;
  font-weight: 500;
}

.header-subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 400;
  color: #4f4f4f;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ---------- Cards base ---------- */
.summary-card,
.boundary-card,
.info-card,
.config-card,
.activity-card,
.devices-card,
.state-card {
  padding: 20px 22px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.card-title {
  margin: 0;
  font-weight: 600;
  font-size: 18px;
  color: #1f2523;
}

.card-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 400;
  color: #4f4f4f;
}

.card-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-divider {
  height: 1px;
  background: #ece8e1;
  margin: 14px 0;
}

.state-card {
  font-size: 14px;
  color: #6b716d;
}

/* ---------- Top grid ---------- */
.top-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(200px, 0.8fr);
  gap: 20px;
  margin-bottom: 22px;
  align-items: start;
}

.line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  font-size: 14px;
  color: #6b716d;
}

.line strong {
  font-weight: 500;
  color: #1f2523;
}

.iot-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: #5b8def;
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
}

/* ---------- Pills ---------- */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12px;
}

.pill i {
  font-size: 12px;
}

.tag-active {
  background: #57eba1;
  color: #17432f;
}

.tag-init {
  background: #9ff0c6;
  color: #2e4a3a;
}

.tag-muted {
  background: #e6e2db;
  color: #6b716d;
}

.tag-devices {
  background: #5b8def;
  color: #ffffff;
}

.tag-on {
  background: #c15a2e;
  color: #ffffff;
}

/* ---------- Buttons ---------- */
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid #2e4a3a;
  border-radius: 8px;
  background: #ffffff;
  color: #2e4a3a;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
}

.ghost-button i {
  font-size: 16px;
}

.ghost-button:hover {
  background: #f3f6f2;
}

.ghost-button.block {
  width: 100%;
  margin-top: 16px;
  height: 42px;
}

.action-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-column .ghost-button {
  width: 100%;
  height: 42px;
}

.delete-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 42px;
  border: 1px solid #ff5c5c;
  border-radius: 8px;
  background: #ffffff;
  color: #ff5c5c;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
}

.delete-action i {
  font-size: 16px;
}

.delete-action:hover {
  background: #fdecec;
}

/* ---------- Two-column grid ---------- */
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 22px;
  margin-bottom: 22px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ---------- Boundary ---------- */
.boundary-map {
  position: relative;
  height: 300px;
  margin: 16px 0 12px;
}

.map-status {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  font-weight: 500;
  font-size: 13px;
  color: #2e4a3a;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2e4a3a;
}

.map-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  font-size: 13px;
  color: #2e4a3a;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 400;
  color: #4f4f4f;
}

.field-info i {
  font-size: 13px;
  color: #8c877f;
}

/* ---------- Plot information ---------- */
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f1ede6;
  font-size: 14px;
  color: #1f2523;
}

.info-row:last-child {
  border-bottom: none;
}

.info-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b716d;
}

.info-name i {
  font-size: 16px;
  color: #8c877f;
}

.info-notes {
  max-width: 55%;
  text-align: right;
  color: #4f4f4f;
  font-size: 13px;
}

/* ---------- Configuration summary ---------- */
.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  margin-top: 12px;
  border-radius: 12px;
  background: #faf8f4;
  font-size: 14px;
  color: #1f2523;
}

.config-name {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
}

.ico {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.ico i {
  font-size: 16px;
}

.ico-green { background: #d6f7e6; color: #2e4a3a; }
.ico-blue { background: #dfe9fd; color: #5b8def; }
.ico-purple { background: #e6e9fd; color: #7e8cf7; }
.ico-blue4 { background: #e7f0fe; color: #6f9bf0; }
.ico-secondary { background: #fbe6dc; color: #c15a2e; }

/* ---------- Recent activity ---------- */
.timeline {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding-bottom: 18px;
  position: relative;
}

.timeline-item .dot {
  margin-top: 5px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2e4a3a;
  flex: none;
}

.timeline-item strong {
  font-weight: 500;
  font-size: 14px;
  color: #1f2523;
}

.timeline-item p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #8c877f;
}

/* ---------- Linked devices ---------- */
.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.device-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: #faf8f4;
}

.device-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.device-head strong {
  font-weight: 500;
  font-size: 14px;
}

.device-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 13px;
  color: #6b716d;
}

.device-line strong {
  font-weight: 500;
  color: #1f2523;
}

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .top-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .top-grid {
    grid-template-columns: 1fr;
  }
}
</style>
