<script setup>
/**
 * SpecialistDashboardOverview view.
 * Coordinates the specialist dashboard surface: headline KPIs, the zonal risk
 * radar, incoming producer requests awaiting verify/decline, and the
 * accepted-cases performance chart (monthly/annual toggle).
 * Ports the behavior of os-viora's `SpecialistDashboard` Angular component to
 * Vue composition idioms — state management lives entirely in
 * `useSpecialistDashboardStore` (intervention/application), this view only
 * renders the read model and dispatches actions.
 */
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { useSpecialistDashboardStore } from '../../../intervention/application/specialist-dashboard.store.js';
import { DateTimeFormatter } from '../../infrastructure/date-time.formatter.js';
import DashboardHeader from '../components/dashboard-header.vue';
import DashboardCoachmarks from '../components/dashboard-coachmarks.vue';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

const specialistDashboardStore = useSpecialistDashboardStore();
const { t } = useI18n();

const breadcrumbs = computed(() => [
  { label: t('sidebar.dashboard'), route: '/dashboard' },
  { label: t('specialistDashboard.overview'), disabled: true }
]);

const updatedLabel = computed(() => {
  if (!specialistDashboardStore.updatedAt) return t('specialistDashboard.noSyncYet');
  return `${t('dashboard.updated-label')} ${DateTimeFormatter.formatRelativeTime(specialistDashboardStore.updatedAt)}`;
});

/** Signed delta for the Acceptance Rate KPI (e.g. "+2.4%"), or null if none. */
const acceptanceDeltaLabel = computed(() => {
  const delta = specialistDashboardStore.kpis?.acceptanceRateDeltaPercent;
  if (delta === null || delta === undefined) return null;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta}%`;
});

const incomingCount = computed(() => specialistDashboardStore.incomingRequests.length);

const chartData = computed(() => {
  const series = specialistDashboardStore.performanceSeries;
  return {
    labels: series.map((point) => point.label),
    datasets: [
      {
        label: t('specialistDashboard.performance.legend'),
        data: series.map((point) => point.value),
        borderColor: '#2e4a3a',
        backgroundColor: 'rgba(46, 74, 58, 0.16)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true
      }
    ]
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1f2523',
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: "'Poppins', sans-serif" },
      bodyFont: { family: "'Poppins', sans-serif" }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b716d', font: { family: "'Poppins', sans-serif" } }
    },
    y: {
      grid: { color: '#edeae4' },
      ticks: { color: '#6b716d', font: { family: "'Poppins', sans-serif" } }
    }
  }
}));

const formatDate = (date) => {
  if (!date) return '';
  return DateTimeFormatter.formatRelativeTime(date);
};

const setPerformanceView = (view) => specialistDashboardStore.setPerformanceView(view);
const verify = (request) => specialistDashboardStore.verify(request);
const decline = (request) => specialistDashboardStore.decline(request);
const refresh = () => specialistDashboardStore.refresh();

onMounted(() => {
  specialistDashboardStore.load();
});
</script>

<template>
  <div class="specialist-dashboard-container">
    <DashboardHeader
      :breadcrumbs="breadcrumbs"
      :subtitle="t('specialistDashboard.subtitle')"
      :updated-label="updatedLabel"
      @refresh="refresh"
    />

    <!-- Real empty state: never fabricate KPI numbers or fake data. -->
    <section v-if="!specialistDashboardStore.loaded" class="state-card">
      <p>{{ t('common.loading') }}</p>
    </section>

    <section v-else-if="!specialistDashboardStore.dashboard" class="state-card">
      <h3>{{ t('specialistDashboard.emptyState.title') }}</h3>
      <p>{{ t('specialistDashboard.emptyState.body') }}</p>
    </section>

    <template v-else>
      <!-- KPI cards -->
      <section class="kpi-grid">
        <article class="card kpi-card" data-onboarding-target="sp-resolved">
          <span class="kpi-label">{{ t('specialistDashboard.kpis.resolved') }}</span>
          <strong class="kpi-value">{{ specialistDashboardStore.kpis.resolvedInterventions ?? 0 }}</strong>
          <span class="kpi-foot">{{ t('specialistDashboard.kpis.thisMonth') }}</span>
        </article>

        <article class="card kpi-card" data-onboarding-target="sp-acceptance">
          <span class="kpi-label">{{ t('specialistDashboard.kpis.acceptance') }}</span>
          <template v-if="specialistDashboardStore.kpis.acceptanceRatePercent !== null">
            <strong class="kpi-value">{{ specialistDashboardStore.kpis.acceptanceRatePercent }}%</strong>
            <div class="kpi-bar">
              <span class="kpi-bar-fill is-neutral" :style="{ width: `${specialistDashboardStore.kpis.acceptanceRatePercent}%` }"></span>
            </div>
            <span v-if="acceptanceDeltaLabel" class="kpi-foot">{{ acceptanceDeltaLabel }}</span>
          </template>
          <template v-else>
            <strong class="kpi-value is-empty">&mdash;</strong>
            <span class="kpi-foot">{{ t('specialistDashboard.noDataYet') }}</span>
          </template>
        </article>

        <article class="card kpi-card" data-onboarding-target="sp-phyto">
          <span class="kpi-label">{{ t('specialistDashboard.kpis.phytosanitary') }}</span>
          <template v-if="specialistDashboardStore.kpis.phytosanitaryEfficiencyPercent !== null">
            <strong class="kpi-value">{{ specialistDashboardStore.kpis.phytosanitaryEfficiencyPercent }}%</strong>
            <div class="kpi-bar">
              <span class="kpi-bar-fill is-green" :style="{ width: `${specialistDashboardStore.kpis.phytosanitaryEfficiencyPercent}%` }"></span>
            </div>
            <span
              v-if="specialistDashboardStore.kpis.phytosanitaryStatus"
              class="kpi-pill"
              :data-status="specialistDashboardStore.kpis.phytosanitaryStatus"
            >
              {{ t(`specialistDashboard.kpis.status.${specialistDashboardStore.kpis.phytosanitaryStatus}`) }}
            </span>
          </template>
          <template v-else>
            <strong class="kpi-value is-empty">&mdash;</strong>
            <span class="kpi-foot">{{ t('specialistDashboard.noDataYet') }}</span>
          </template>
        </article>
      </section>

      <!-- Zonal radar + incoming requests -->
      <section class="mid-grid">
        <article class="card zonal-card" data-onboarding-target="sp-zonal">
          <header class="card-head">
            <div>
              <h3>{{ t('specialistDashboard.zonal.title') }}</h3>
              <p>{{ t('specialistDashboard.zonal.subtitle') }}</p>
            </div>
            <router-link class="card-link" to="/surveillance/alerts">
              {{ t('specialistDashboard.zonal.fullMap') }} <span aria-hidden="true">↗</span>
            </router-link>
          </header>

          <ul class="zonal-list">
            <li v-for="risk in specialistDashboardStore.zonalRisks" :key="risk.id" class="zonal-item">
              <span class="severity-pill" :data-severity="risk.severity">
                {{ t(`specialistDashboard.severity.${risk.severity}`) }}
              </span>
              <div class="zonal-body">
                <strong>{{ risk.title }}</strong>
                <span>{{ risk.distanceKm }} {{ t('specialistDashboard.zonal.kmAway') }} &middot; {{ risk.sector }}</span>
              </div>
              <span class="zonal-chevron" aria-hidden="true">&rsaquo;</span>
            </li>
            <li v-if="specialistDashboardStore.zonalRisks.length === 0" class="zonal-empty">
              {{ t('specialistDashboard.zonal.empty') }}
            </li>
          </ul>
        </article>

        <article class="card incoming-card" data-onboarding-target="sp-incoming">
          <header class="card-head">
            <h3>{{ t('specialistDashboard.incoming.title') }}</h3>
            <span v-if="incomingCount > 0" class="new-badge">
              {{ incomingCount }} {{ t('specialistDashboard.incoming.new') }}
            </span>
          </header>

          <div v-if="specialistDashboardStore.incomingRequests.length > 0" class="incoming-table" role="table">
            <div class="incoming-row incoming-head" role="row">
              <span role="columnheader">{{ t('specialistDashboard.incoming.plot') }}</span>
              <span role="columnheader">{{ t('specialistDashboard.incoming.problem') }}</span>
              <span role="columnheader">{{ t('specialistDashboard.incoming.date') }}</span>
              <span role="columnheader">{{ t('specialistDashboard.incoming.action') }}</span>
            </div>

            <div v-for="request in specialistDashboardStore.incomingRequests" :key="request.id" class="incoming-row" role="row">
              <div class="incoming-plot">
                <strong>{{ request.plotLabel }}</strong>
                <span>{{ request.growerLabel }}</span>
              </div>
              <span class="incoming-problem">{{ request.problem }}</span>
              <span class="incoming-date">{{ formatDate(request.createdAt) }}</span>
              <div class="incoming-actions">
                <button type="button" class="btn-verify" @click="verify(request)">
                  {{ t('specialistDashboard.incoming.verify') }}
                </button>
                <button type="button" class="btn-decline" @click="decline(request)">
                  {{ t('specialistDashboard.incoming.decline') }}
                </button>
              </div>
            </div>
          </div>
          <p v-else class="incoming-empty">{{ t('specialistDashboard.incoming.empty') }}</p>
        </article>
      </section>

      <!-- Performance chart -->
      <article class="card performance-card">
        <header class="card-head">
          <div>
            <h3>{{ t('specialistDashboard.performance.title') }}</h3>
            <p>{{ t('specialistDashboard.performance.subtitle') }}</p>
          </div>
          <div class="view-toggle" role="group" :aria-label="t('specialistDashboard.performance.title')">
            <button
              type="button"
              :class="{ 'is-active': specialistDashboardStore.performanceView === 'monthly' }"
              @click="setPerformanceView('monthly')"
            >
              {{ t('specialistDashboard.performance.monthly') }}
            </button>
            <button
              type="button"
              :class="{ 'is-active': specialistDashboardStore.performanceView === 'annual' }"
              @click="setPerformanceView('annual')"
            >
              {{ t('specialistDashboard.performance.annual') }}
            </button>
          </div>
        </header>

        <div v-if="specialistDashboardStore.performanceSeries.length > 0" class="chart-frame">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <p v-else class="chart-empty">{{ t('specialistDashboard.performance.empty') }}</p>
      </article>
    </template>

    <div v-if="specialistDashboardStore.errors.length > 0" class="error-box">
      <strong>{{ t('errors.occurred') }}</strong>
    </div>

    <DashboardCoachmarks />
  </div>
</template>

<style scoped>
.specialist-dashboard-container {
  width: 100%;
  margin: 0 auto;
  padding: 0;
  font-family: 'Poppins', sans-serif;
  color: #1f2523;
}

.card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.state-card {
  padding: 48px 26px;
  text-align: center;
  color: #6b716d;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
  margin-bottom: 26px;
}

.state-card h3 {
  margin: 0 0 8px;
  color: #1f2523;
  font-size: 18px;
  font-weight: 600;
}

.state-card p {
  margin: 0;
  font-size: 13px;
}

/* ----- KPI cards ----- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 26px;
  margin-bottom: 26px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px 26px;
}

.kpi-label {
  color: #1f2523;
  font-size: 14px;
  font-weight: 500;
}

.kpi-value {
  font-size: 40px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
}

.kpi-value.is-empty {
  color: #c8c2b8;
}

.kpi-bar {
  height: 5px;
  border-radius: 999px;
  background: #eceae5;
  overflow: hidden;
}

.kpi-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.kpi-bar-fill.is-neutral {
  background: #c8c2b8;
}

.kpi-bar-fill.is-green {
  background: #2e4a3a;
}

.kpi-foot {
  color: #6b716d;
  font-size: 12px;
}

.kpi-pill {
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 999px;
  background: #e7f0e9;
  color: #2e4a3a;
  font-size: 12px;
  font-weight: 500;
}

.kpi-pill[data-status='watch'] {
  background: #fdf2e0;
  color: #a86a1a;
}

.kpi-pill[data-status='critical'] {
  background: #fbe7e6;
  color: #b23b34;
}

/* ----- Mid grid: zonal radar + incoming ----- */
.mid-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.85fr) minmax(0, 1.4fr);
  gap: 26px;
  margin-bottom: 26px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 26px 12px;
}

.card-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.card-head p {
  margin: 4px 0 0;
  color: #6b716d;
  font-size: 12px;
}

.card-link {
  flex-shrink: 0;
  color: #2e4a3a;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
}

.card-link:hover {
  text-decoration: underline;
}

.zonal-list {
  margin: 0;
  padding: 8px 18px 20px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zonal-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #faf8f4;
}

.severity-pill {
  flex-shrink: 0;
  min-width: 62px;
  text-align: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
}

.severity-pill[data-severity='HIGH'] {
  background: #e2483d;
}

.severity-pill[data-severity='MEDIUM'] {
  background: #c06a2b;
}

.severity-pill[data-severity='LOW'] {
  background: #3fa27a;
}

.zonal-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.zonal-body strong {
  font-size: 13px;
  font-weight: 600;
}

.zonal-body span {
  color: #6b716d;
  font-size: 12px;
}

.zonal-chevron {
  color: #b7b1a7;
  font-size: 20px;
  line-height: 1;
}

.zonal-empty,
.incoming-empty {
  margin: 0;
  padding: 24px 26px 28px;
  color: #6b716d;
  font-size: 13px;
}

/* Incoming requests table */
.incoming-card .new-badge {
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 999px;
  background: #b4532a;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
}

.incoming-table {
  padding: 4px 26px 8px;
}

.incoming-row {
  display: grid;
  grid-template-columns: 1.3fr 1.2fr 0.9fr auto;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid #edeae4;
}

.incoming-row.incoming-head {
  border-top: none;
  padding-bottom: 8px;
}

.incoming-head span {
  color: #9a9187;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.incoming-plot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.incoming-plot strong {
  font-size: 13px;
  font-weight: 600;
}

.incoming-plot span {
  color: #6b716d;
  font-size: 12px;
}

.incoming-problem {
  font-size: 13px;
}

.incoming-date {
  color: #6b716d;
  font-size: 12px;
}

.incoming-actions {
  display: flex;
  gap: 8px;
}

.btn-verify,
.btn-decline {
  padding: 8px 16px;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.btn-verify {
  border: none;
  background: #2e4a3a;
  color: #ffffff;
}

.btn-verify:hover {
  background: #24382c;
}

.btn-decline {
  border: 1px solid #ddd7cd;
  background: #ffffff;
  color: #1f2523;
}

.btn-decline:hover {
  background: #f4f1ea;
}

/* ----- Performance chart ----- */
.performance-card {
  padding-bottom: 20px;
  margin-bottom: 26px;
}

.view-toggle {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 10px;
  background: #f4f1ea;
}

.view-toggle button {
  padding: 7px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b716d;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.view-toggle button.is-active {
  background: #ffffff;
  color: #1f2523;
  box-shadow: 0 2px 6px rgba(31, 37, 35, 0.08);
}

.chart-frame {
  height: 260px;
  padding: 8px 26px 16px;
}

.chart-empty {
  margin: 0;
  padding: 48px 26px;
  text-align: center;
  color: #6b716d;
  font-size: 13px;
}

.error-box {
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(255, 92, 92, 0.12);
  color: #d63b3b;
  margin-bottom: 26px;
}

@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .mid-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .incoming-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .incoming-row.incoming-head {
    display: none;
  }

  .incoming-actions {
    margin-top: 6px;
  }
}
</style>
