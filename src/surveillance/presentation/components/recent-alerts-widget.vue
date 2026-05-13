<script setup>
/**
 * RecentAlertsWidget component.
 * Displays a high-density tabular view of recent surveillance alerts.
 *
 * @component
 */
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSurveillanceStore } from '../../application/surveillance.store.js';

const surveillanceStore = useSurveillanceStore();
const { t } = useI18n();

onMounted(() => {
  surveillanceStore.fetchRecentAlerts(3);
});

/**
 * Resolves the PrimeIcons class based on the alert type.
 * @param {string} type - The domain-defined alert type.
 * @returns {string} PrimeIcons class name.
 */
const getAlertIcon = (type) => {
  if (type === 'Phenological risk') return 'pi pi-cloud';
  if (type === 'Pest symptom report') return 'pi pi-exclamation-triangle';
  if (type === 'Low NDVI zone') return 'pi pi-map';
  return 'pi pi-bell';
};

/**
 * Calculates the visual style for severity indicators.
 * @param {string} severity - Domain severity level.
 * @returns {Object} CSS style object for background color.
 */
const getSeverityStyle = (severity) => {
  if (severity === 'Critical') return { backgroundColor: '#E53535' };
  if (severity === 'High') return { backgroundColor: '#FF5C5C' };
  if (severity === 'Medium') return { backgroundColor: '#C15A2E' };
  return { backgroundColor: '#9CA3AF' };
};

/**
 * Calculates the visual style for status labels with appropriate alpha transparency.
 * @param {string} status - Domain status value.
 * @returns {Object} CSS style object for background and text color.
 */
const getStatusStyle = (status) => {
  const s = status?.toLowerCase();
  if (s === 'active') return { backgroundColor: 'rgba(87, 235, 161, 0.2)', color: '#2E4A3A' };
  if (s === 'suggest') return { backgroundColor: 'rgba(91, 141, 239, 0.2)', color: '#5B8DEF' };
  if (s === 'under review') return { backgroundColor: 'rgba(193, 90, 46, 0.2)', color: '#C15A2E' };
  return { backgroundColor: '#F3F4F6', color: '#6B7280' };
};

/**
 * Formats a raw date string into a human-readable localized format.
 * @param {string} dateStr - ISO date string or formatted date.
 * @returns {string} Formatted date (e.g., "May 04, 2026").
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
};
</script>

<template>
  <div class="recent-alerts-widget">
    <pv-card class="viora-table-card shadow-none">
      <template #content>
        <div class="widget-layout">
          <div class="widget-header">
            <h2 class="widget-title">{{ t('dashboard.recent-alerts-title') }}</h2>
            <pv-button icon="pi pi-arrow-right" class="header-btn-action" />
          </div>

          <div class="alerts-table">
            <div class="table-thead">
              <div class="col-type">{{ t('dashboard.table-header-type') }}</div>
              <div class="col-plot">{{ t('dashboard.table-header-plot') }}</div>
              <div class="col-severity">{{ t('dashboard.table-header-severity') }}</div>
              <div class="col-date">{{ t('dashboard.table-header-date') }}</div>
              <div class="col-status">{{ t('dashboard.table-header-status') }}</div>
            </div>

            <div v-if="surveillanceStore.alertsLoaded" class="table-tbody">
              <div v-for="alert in surveillanceStore.alerts" :key="alert.id" class="table-row">
                <div class="col-type cell-type">
                  <div class="icon-square">
                    <i :class="[getAlertIcon(alert.type), 'type-icon']"></i>
                  </div>
                  <div class="type-text-wrapper">
                    <span class="type-name">{{ alert.type }}</span>
                    <span class="type-description" :title="alert.description">{{ alert.description }}</span>
                  </div>
                </div>

                <div class="col-plot cell-plot">
                  <span class="plot-name">{{ alert.plot.name }}</span>
                  <span class="plot-meta">{{ alert.plot.location }} • {{ alert.plot.hectares }}ha</span>
                </div>

                <div class="col-severity cell-severity">
                  <div class="severity-tag" :style="getSeverityStyle(alert.severity)">
                    {{ alert.severity }}
                  </div>
                </div>

                <div class="col-date cell-date">
                  {{ formatDate(alert.date) }}
                </div>

                <div class="col-status cell-status">
                  <div class="status-label" :style="getStatusStyle(alert.status)">
                    {{ alert.status }}
                  </div>
                </div>
              </div>

              <div v-if="surveillanceStore.alerts.length === 0" class="empty-msg">
                {{ t('dashboard.empty-alerts-msg') }}
              </div>
            </div>

            <div v-else class="loading-state">
              <div v-for="i in 3" :key="i" class="skeleton-row animate-pulse"></div>
            </div>
          </div>
        </div>
      </template>
    </pv-card>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

.recent-alerts-widget {
  width: 100%;
  font-family: 'Poppins', sans-serif;
}

.viora-table-card {
  border-radius: 12px;
  border: 1px solid #F0F0F3;
  background-color: #ffffff;
  overflow: hidden;
}

:deep(.p-card-content) {
  padding: 0 !important;
}

.widget-layout {
  display: flex;
  flex-direction: column;
}

.widget-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-title {
  font-weight: 500;
  font-size: 20px;
  color: #1C1D21;
  margin: 0;
  text-align: left;
}

.header-btn-action {
  background: transparent;
  border: 1px solid #2E4A3A !important;
  color: #2E4A3A !important;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn-action:hover {
  background: #2E4A3A !important;
  color: #FFFFFF !important;
}

:deep(.header-btn-action .p-button-icon) {
  font-size: 14px;
}

.alerts-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  padding-bottom: 5px;
}

.table-thead, .table-tbody {
  min-width: 800px;
}

.table-thead {
  display: flex;
  background-color: rgba(245, 245, 250, 0.4);
  padding: 8px 20px;
  border-top: 1px solid #F0F0F3;
  border-bottom: 1px solid #F0F0F3;
}

.table-thead div {
  font-weight: 500;
  font-size: 12px;
  color: #333333;
  text-transform: capitalize;
  text-align: left;
}

.table-tbody {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #F0F0F3;
}

.table-row:last-child {
  border-bottom: none;
}

.col-type { flex: 2.5; min-width: 250px; display: flex; justify-content: flex-start; }
.col-plot { flex: 2; min-width: 180px; display: flex; flex-direction: column; align-items: flex-start; }
.col-severity { flex: 1; min-width: 100px; display: flex; justify-content: flex-start; }
.col-date { flex: 1.2; min-width: 110px; display: flex; justify-content: flex-start; }
.col-status { flex: 1.5; min-width: 150px; display: flex; justify-content: flex-start; }

.cell-type {
  display: flex;
  align-items: center;
  gap: 15px;
}

.icon-square {
  width: 60px;
  height: 60px;
  background-color: #F8F9FA;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.type-icon {
  font-size: 28px;
  color: #1C1D21;
}

.type-text-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  text-align: left;
}

.type-name {
  font-weight: 600;
  font-size: 14px;
  color: #1C1D21;
}

.type-description {
  font-weight: 400;
  font-size: 12px;
  color: #6B7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.cell-plot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.plot-name {
  font-weight: 600;
  font-size: 14px;
  color: #1C1D21;
}

.plot-meta {
  font-weight: 400;
  font-size: 12px;
  color: #6B7280;
}

.severity-tag {
  width: 79px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 99px;
  color: #FFFFFF;
  font-weight: 500;
  font-size: 12px;
  text-transform: capitalize;
}

.cell-date {
  font-weight: 400;
  font-size: 14px;
  color: #4B5563;
  text-align: left;
}

.status-label {
  width: 130px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.empty-msg {
  padding: 30px;
  text-align: center;
  color: #9CA3AF;
  font-style: italic;
}

.skeleton-row {
  height: 90px;
  margin: 10px 20px;
  background-color: #F9FAFB;
  border-radius: 8px;
}
</style>
