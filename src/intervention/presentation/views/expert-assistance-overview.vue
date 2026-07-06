<template>
  <section class="assistance-page">
    <dashboard-header
      :breadcrumbs="breadcrumbs"
      subtitle="Find available phytosanitary specialists near your active alerts and manage assistance requests."
      :updated-label="store.lastSyncLabel"
      @refresh="refresh"
    />

    <dashboard-toolbar
      :view-options="toolbarViewOptions"
      :scope-options="scopeOptions"
      :selected-scope="selectedPlotId ?? ''"
      @update:selected-scope="onSelectPlot"
    />

    <!-- KPI cards -->
    <section class="kpi-grid">
      <pv-card class="kpi-card">
        <template #content>
          <div class="kpi-head">
            <h2>Active assistance case</h2>
            <span v-if="activeAlert" :class="['pill', severityClass(activeAlert.severity)]">
              {{ activeAlert.severity }}
            </span>
          </div>
          <span class="case-title">{{ activeAlert?.typeLabel ?? 'No active case' }}</span>
          <p class="case-location">
            <i class="pi pi-map-marker"></i>
            {{ plotSummary || 'Select a plot to view its active case.' }}
          </p>
        </template>
      </pv-card>

      <pv-card class="kpi-card">
        <template #content>
          <div class="kpi-head">
            <h2>Available specialists</h2>
            <span class="kpi-pill kpi-pill--muted">Within 15 km</span>
          </div>
          <span class="kpi-value">{{ store.availableSpecialistsCount }} nearby</span>
          <p class="kpi-foot">Candidates ranked by distance and availability.</p>
        </template>
      </pv-card>

      <pv-card class="kpi-card">
        <template #content>
          <div class="kpi-head">
            <h2>Request status</h2>
            <span v-if="store.pendingRequestsCount > 0" class="kpi-pill kpi-pill--soft">Pending</span>
          </div>
          <span class="kpi-value">{{ store.pendingRequestsCount }} pending</span>
          <p class="kpi-foot">Waiting for specialist response.</p>
        </template>
      </pv-card>

      <pv-card class="kpi-card">
        <template #content>
          <div class="kpi-head">
            <h2>Contact access</h2>
            <span class="kpi-pill kpi-pill--muted">Proposal required</span>
          </div>
          <span class="kpi-value kpi-value--lock"><i class="pi pi-lock"></i> Locked</span>
          <p class="kpi-foot">Contact details unlock after proposal acceptance.</p>
        </template>
      </pv-card>
    </section>

    <!-- Recommended specialists -->
    <pv-card class="section-card">
      <template #content>
        <div class="section-head">
          <div>
            <h2 class="section-title">Recommended specialists</h2>
            <p class="section-subtitle">
              Available candidates near {{ selectedPlot?.name ?? 'your plot' }} for the selected alert.
            </p>
          </div>
          <span class="tag-green">{{ store.availableSpecialistsCount }} candidates</span>
        </div>

        <div class="specialist-grid">
          <div
            v-for="specialist in store.specialists"
            :key="specialist.id"
            :class="['specialist-card', { 'is-best': specialist.bestMatch }]"
          >
            <div class="specialist-badges">
              <span v-if="specialist.bestMatch" class="badge badge--best">
                <i class="pi pi-star"></i> Best match
              </span>
              <span :class="['badge', availabilityClass(specialist)]">
                <i class="dot"></i> {{ specialist.availabilityLabel }}
              </span>
            </div>

            <div class="specialist-identity">
              <span class="avatar">{{ specialist.initials }}</span>
              <div class="identity-text">
                <span class="specialist-name">{{ specialist.name }}</span>
                <span class="specialist-role">{{ specialist.role }}</span>
                <span class="specialist-stats">
                  <span class="stat-success">{{ specialist.successRateLabel }}</span>
                  <span class="stat-sep">&middot;</span>
                  <span class="stat-cases">{{ specialist.caseCountLabel }}</span>
                </span>
              </div>
            </div>

            <div class="specialist-meta">
              <span><i class="pi pi-map-marker"></i> {{ specialist.distanceLabel }}</span>
            </div>

            <div class="specialist-tags">
              <span v-for="tag in specialist.tags" :key="tag" class="specialist-tag">{{ tag }}</span>
            </div>

            <div class="specialist-foot">
              <span :class="['foot-availability', availabilityClass(specialist)]">
                <i class="dot"></i> {{ specialist.availabilityLabel }}
              </span>
              <pv-button
                type="button"
                class="primary-button"
                @click="openRequest(specialist)"
              >
                <i class="pi pi-send"></i> Request
              </pv-button>
            </div>
          </div>
        </div>
      </template>
    </pv-card>

    <!-- My assistance requests -->
    <pv-card class="section-card">
      <template #content>
        <div class="section-head">
          <div>
            <h2 class="section-title">My assistance requests</h2>
            <p class="section-subtitle">Track requests for this plot and their current status.</p>
          </div>
          <span v-if="store.pendingRequestsCount > 0" class="kpi-pill kpi-pill--soft">
            {{ store.pendingRequestsCount }} pending response
          </span>
        </div>

        <div class="requests-table">
          <div class="requests-header">
            <span>Request</span>
            <span>Specialist</span>
            <span>Status</span>
            <span>Last update</span>
            <span>Action</span>
          </div>

          <div v-if="store.loading.requests && store.requests.length === 0" class="requests-state">
            Loading requests&hellip;
          </div>
          <div v-else-if="store.requests.length === 0" class="requests-state">
            No assistance requests for this plot yet.
          </div>
          <template v-else>
            <div v-for="request in store.requests" :key="request.id" class="requests-row">
              <span class="request-code">{{ request.referenceCode || '\u2014' }}</span>
              <span>{{ store.specialistName(request.specialistId) }}</span>
              <span>
                <span :class="['pill', statusClass(request.status)]">{{ request.statusLabel }}</span>
              </span>
              <span>{{ request.lastUpdateLabel }}</span>
              <span>
                <pv-button
                  type="button"
                  class="ghost-button ghost-button--sm"
                  @click="openCase(request)"
                >
                  {{ request.status === 'PROPOSAL_RECEIVED' ? 'Review proposal' : (request.status === 'DECLINED' ? 'Search again' : 'View case') }}
                </pv-button>
              </span>
            </div>
          </template>
        </div>
      </template>
    </pv-card>
  </section>

  <!-- Request expert assistance modal -->
  <pv-dialog v-if="modalStep === 'form' && modalSpecialist" v-model:visible="modalVisible" modal :closable="false">
    <template #header>
      <div>
        <h2>Request expert assistance</h2>
        <p class="modal-subtitle">Send a formal intervention request linked to the selected alert.</p>
      </div>
    </template>

    <div class="modal-specialist">
      <span class="avatar">{{ modalSpecialist.initials }}</span>
      <div class="identity-text">
        <span class="specialist-name">{{ modalSpecialist.name }}</span>
        <span class="specialist-role">
          {{ modalSpecialist.role }} &middot; {{ modalSpecialist.distanceLabel }}
        </span>
      </div>
      <span :class="['foot-availability', availabilityClass(modalSpecialist)]">
        <i class="dot"></i> {{ modalSpecialist.availabilityLabel }}
      </span>
    </div>

    <div class="modal-grid">
      <div class="field">
        <span>Plot</span>
        <div class="field-readonly">{{ plotSummary || '\u2014' }}</div>
      </div>
      <div class="field">
        <span>Related alert</span>
        <div class="field-readonly">
          <template v-if="activeAlert">
            <span :class="['pill', severityClass(activeAlert.severity)]">{{ activeAlert.severity }}</span>
            {{ activeAlert.typeLabel }}
          </template>
          <template v-else>No active alert</template>
        </div>
      </div>
    </div>

    <label class="field">
      <span>Reason for request</span>
      <pv-textarea v-model="formReason" rows="2" />
    </label>

    <label class="field">
      <span>Message to specialist (optional)</span>
      <pv-textarea
        v-model="formMessage"
        rows="3"
        placeholder="Describe what you need the specialist to evaluate during the field visit..."
      />
    </label>

    <template #footer>
      <pv-button type="button" class="ghost-button" @click="closeModal">Cancel</pv-button>
      <pv-button
        type="button"
        class="primary-button"
        :disabled="!canSubmit"
        @click="submitRequest"
      >
        <i class="pi pi-send"></i> {{ store.loading.submitting ? 'Sending...' : 'Send request' }}
      </pv-button>
    </template>
  </pv-dialog>

  <!-- Request sent successfully modal -->
  <pv-dialog v-if="modalStep === 'success' && createdRequest" v-model:visible="modalVisible" modal :closable="false">
    <template #header>
      <div class="success-header">
        <span class="success-icon"><i class="pi pi-check-circle"></i></span>
        <h2>Request sent successfully</h2>
      </div>
    </template>

    <p class="success-text">
      Your intervention request was sent to <strong>{{ modalSpecialist?.name }}</strong>.
      The request is now pending specialist response.
    </p>

    <div class="success-summary">
      <div class="summary-row"><span>Request ID</span><strong>{{ createdRequest.referenceCode || '\u2014' }}</strong></div>
      <div class="summary-row"><span>Specialist</span><strong>{{ modalSpecialist?.name }}</strong></div>
      <div class="summary-row"><span>Plot</span><strong>{{ selectedPlot?.name ?? '\u2014' }}</strong></div>
      <div class="summary-row">
        <span>Status</span>
        <span class="pill status-pending">{{ createdRequest.statusLabel }}</span>
      </div>
    </div>

    <p class="success-note">
      <i class="pi pi-info-circle"></i>
      You'll be notified when the specialist responds. Contact details remain locked until a proposal is accepted.
    </p>

    <template #footer>
      <pv-button type="button" class="ghost-button block" @click="viewCreatedCase">
        <i class="pi pi-eye"></i> View case
      </pv-button>
      <pv-button type="button" class="ghost-button block" @click="closeModal">
        <i class="pi pi-arrow-left"></i> Back to expert assistance
      </pv-button>
    </template>
  </pv-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';
import DashboardToolbar from '../../../shared/presentation/components/dashboard-toolbar.vue';
import { useInterventionStore } from '../../application/intervention.store.js';
import { useSurveillanceStore } from '../../../surveillance/application/surveillance.store.js';
import { useAgronomicStore } from '../../../agronomic/application/agronomic.store.js';

const store = useInterventionStore();
const surveillance = useSurveillanceStore();
const agronomic = useAgronomicStore();
const router = useRouter();
const route = useRoute();

const breadcrumbs = [
    { label: 'Expert Assistance', disabled: true },
    { label: 'Overview', disabled: true },
];

const plots = ref([]);
const selectedPlotId = ref(null);

const modalStep = ref(null);
const modalSpecialist = ref(null);
const formReason = ref('');
const formMessage = ref('');
const createdRequest = ref(null);
const modalVisible = ref(false);

const selectedPlot = computed(() => {
    const plotId = selectedPlotId.value;
    return plots.value.find((p) => String(p.id) === String(plotId)) ?? null;
});

const activeAlert = computed(() => {
    const plotId = selectedPlotId.value;
    if (plotId == null) return null;
    const openForPlot = surveillance.openAlerts.filter((a) => String(a.plotId) === String(plotId));
    if (openForPlot.length === 0) return null;
    return [...openForPlot].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))[0];
});

const plotSummary = computed(() => {
    const plot = selectedPlot.value;
    if (!plot) return '';
    const location = plot.location || 'Unknown location';
    const areaLabel = `${(plot.areaSize ?? 0).toFixed(1)} ha`;
    return `${plot.name} \u00b7 ${location} \u00b7 ${areaLabel}`;
});

const toolbarViewOptions = computed(() => {
    const plotId = selectedPlotId.value;
    return [
        { id: 'dashboard', label: 'Dashboard', icon: 'pi pi-th-large', route: '/dashboard' },
        { id: 'plot-overview', label: 'Plot Overview', icon: 'pi pi-map', route: '/agronomic/plots' },
        {
            id: 'weather',
            label: 'Weather',
            icon: 'pi pi-cloud',
            route: plotId != null ? `/dashboard/weather/${plotId}` : '/dashboard',
        },
    ];
});

const scopeOptions = computed(() =>
    plots.value
        .filter((p) => p.id != null)
        .map((p) => ({ value: p.id, label: p.name })),
);

onMounted(() => {
    surveillance.fetchAlerts(50);
    loadPlots();
});

async function loadPlots() {
    await agronomic.fetchPlots();
    plots.value = agronomic.plots;
    const requestedPlot = route.query.plot;
    const target =
        plots.value.find((p) => requestedPlot != null && String(p.id) === requestedPlot) ??
        plots.value.find((p) => p.id != null);
    if (target && target.id != null) {
        selectPlot(target.id);
    }
}

function onSelectPlot(plotId) {
    selectPlot(plotId);
}

async function selectPlot(plotId) {
    selectedPlotId.value = plotId;
    await store.loadRequests(plotId);
    const alert = activeAlert.value;
    if (alert?.id != null) {
        await store.loadSpecialists(alert.id);
    }
}

function refresh() {
    surveillance.fetchAlerts(50);
    if (selectedPlotId.value != null) {
        store.loadRequests(selectedPlotId.value);
    }
}

function openCase(request) {
    if (request.referenceCode) {
        router.push({ name: 'intervention-case-detail', params: { code: request.referenceCode } });
    }
}

function viewCreatedCase() {
    const created = createdRequest.value;
    closeModal();
    if (created?.referenceCode) {
        router.push({ name: 'intervention-case-detail', params: { code: created.referenceCode } });
    }
}

function severityClass(severity) {
    return `severity-${(severity ?? 'Low').toLowerCase()}`;
}

function statusClass(status) {
    switch (status) {
        case 'PROPOSAL_RECEIVED':
        case 'ACCEPTED':
            return 'status-proposal';
        case 'DECLINED':
            return 'status-rejected';
        default:
            return 'status-pending';
    }
}

function availabilityClass(specialist) {
    return specialist.availability === 'today' ? 'avail-today' : 'avail-soon';
}

function openRequest(specialist) {
    const alert = activeAlert.value;
    modalSpecialist.value = specialist;
    formReason.value = alert
        ? `Possible ${alert.typeLabel.toLowerCase()} pattern detected from symptom report and NDVI variation.`
        : 'Field inspection requested based on the selected plot condition.';
    formMessage.value = '';
    createdRequest.value = null;
    modalStep.value = 'form';
    modalVisible.value = true;
}

function closeModal() {
    modalStep.value = null;
    modalSpecialist.value = null;
    modalVisible.value = false;
}

const canSubmit = computed(() => {
    return (
        modalSpecialist.value != null &&
        selectedPlotId.value != null &&
        activeAlert.value?.id != null &&
        formReason.value.trim().length > 0 &&
        !store.loading.submitting
    );
});

async function submitRequest() {
    const specialist = modalSpecialist.value;
    const plotId = selectedPlotId.value;
    const alert = activeAlert.value;
    if (!specialist || specialist.id == null || plotId == null || alert?.id == null) return;

    await store.submitRequest(
        {
            plotId: Number(plotId),
            specialistId: Number(specialist.id),
            alertId: Number(alert.id),
            reason: formReason.value.trim(),
            message: formMessage.value.trim() || undefined,
        },
        (created) => {
            if (created) {
                createdRequest.value = created;
                modalStep.value = 'success';
            }
        },
    );
}

function severityWeight(severity) {
    switch (severity) {
        case 'Critical': return 4;
        case 'High': return 3;
        case 'Medium': return 2;
        default: return 1;
    }
}
</script>

<style scoped>
.assistance-page {
    display: flex;
    flex-direction: column;
    gap: 22px;
    font-family: 'Poppins', sans-serif;
}

/* ---------- KPI cards ---------- */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.kpi-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 22px 24px;
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #F0F0F3;
}

:deep(.p-card-content) { padding: 0 !important; }

.kpi-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
}

.kpi-card h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1C1D21;
}

.case-title {
    font-size: 24px;
    font-weight: 500;
    line-height: 1.15;
    color: #4B5563;
}

.case-location {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    color: #828282;
}

.case-location i { font-size: 14px; }

.kpi-value {
    font-size: 20px;
    font-weight: 500;
    color: #333333;
    line-height: 1.1;
}

.kpi-value--lock {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.kpi-foot {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #8c877f;
}

.kpi-pill {
    align-self: flex-start;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
}

.kpi-pill--soft {
    background: rgba(193, 90, 46, 0.16);
    color: #C15A2E;
}

.kpi-pill--muted {
    background: #F0EBE3;
    color: #8c877f;
}

/* ---------- Section cards ---------- */
.section-card {
    padding: 22px 24px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #F0F0F3;
}

.section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 20px;
}

.section-title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1C1D21;
}

.section-subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 400;
    color: #828282;
}

.tag-green {
    align-self: flex-start;
    padding: 6px 14px;
    border-radius: 999px;
    background: #57eba1;
    color: #2E4A3A;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}

/* ---------- Specialist cards ---------- */
.specialist-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
}

.specialist-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid #ece6db;
}

.specialist-card.is-best { border-color: #2E4A3A; }

.specialist-badges { display: flex; flex-wrap: wrap; gap: 8px; }

.badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    background: #ffffff;
    color: #4B5563;
}

.badge i { font-size: 12px; }

.badge--best { background: #57eba1; color: #2E4A3A; }

.badge .dot,
.foot-availability .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
}

.avail-today { color: #2e7d55; }
.avail-soon { color: #3f6fd0; }
.badge.avail-today { background: rgba(87, 235, 161, 0.20); }
.badge.avail-soon { background: rgba(91, 141, 239, 0.16); }

.specialist-identity { display: flex; align-items: flex-start; gap: 12px; }

.avatar {
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #2E4A3A;
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
}

.identity-text { display: flex; flex-direction: column; gap: 2px; }
.specialist-name { font-size: 12px; font-weight: 600; color: #333333; }
.specialist-role { font-size: 10px; font-weight: 400; color: #333333; }

.specialist-stats {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 2px;
    color: #333333;
}

.stat-success { font-size: 10px; font-weight: 600; }
.stat-cases, .stat-sep { font-size: 10px; font-weight: 400; }

.specialist-meta span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 500;
    color: #4B5563;
}

.specialist-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.specialist-tag {
    padding: 5px 12px;
    border-radius: 8px;
    background: #f8f4ed;
    color: #2E4A3A;
    font-size: 12px;
    font-weight: 500;
}

.specialist-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid #ece6db;
}

.foot-availability {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 500;
}

/* ---------- Buttons ---------- */
.primary-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 16px;
    border-radius: 10px;
    border: none;
    background: #2E4A3A;
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 500;
}

.primary-button i { font-size: 14px; }
.primary-button:disabled { opacity: 0.5; cursor: not-allowed; }

.ghost-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    border-radius: 10px;
    border: 1px solid #e2ddd4;
    color: #333333;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 500;
    background: #ffffff;
}

.ghost-button--sm { height: 34px; padding: 0 14px; }
.ghost-button.block { width: 100%; margin-top: 10px; }
.ghost-button i { font-size: 16px; }

/* ---------- Requests table ---------- */
.requests-table { display: grid; overflow-x: auto; }

.requests-header,
.requests-row {
    display: grid;
    grid-template-columns: minmax(90px, 0.7fr) minmax(140px, 1.2fr) minmax(140px, 1fr) minmax(110px, 0.9fr) minmax(120px, 0.9fr);
    align-items: center;
    gap: 14px;
    padding: 0 4px;
    min-width: 640px;
}

.requests-header {
    min-height: 46px;
    color: #6f6a62;
    font-size: 12px;
    font-weight: 500;
}

.requests-row {
    min-height: 64px;
    border-top: 1px solid #f0ece4;
    font-size: 13px;
    color: #333333;
}

.request-code { font-weight: 600; color: #1C1D21; }

.requests-state {
    min-height: 110px;
    display: grid;
    place-items: center;
    color: #8a8f8b;
    font-size: 13px;
}

/* ---------- Pills ---------- */
.pill {
    display: inline-grid;
    place-items: center;
    min-height: 26px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}

.status-pending { background: rgba(193, 90, 46, 0.16); color: #C15A2E; }
.status-proposal { background: rgba(91, 141, 239, 0.18); color: #3f6fd0; }
.status-rejected { background: #eeeeee; color: #6f6a62; }

.severity-critical { background: rgba(255, 92, 92, 0.18); color: #d63b3b; }
.severity-high { background: rgba(255, 92, 92, 0.16); color: #e05656; }
.severity-medium { background: rgba(240, 136, 62, 0.2); color: #C15A2E; }
.severity-low { background: #eeeeee; color: #6f6a62; }

/* ---------- Modal content ---------- */
.modal-subtitle { margin: 4px 0 0; font-size: 13px; color: #6f6a62; }

.modal-specialist {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    background: #f8f4ed;
    margin-bottom: 16px;
}

.modal-specialist .foot-availability { margin-left: auto; }

.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }

.field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.field > span { font-size: 13px; font-weight: 500; color: #333333; }

.field-readonly {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f7f4ef;
    font-size: 13px;
    color: #333333;
}

.field :deep(textarea) {
    padding: 10px 12px;
    border: 1px solid #e2ddd4;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #333333;
}

/* ---------- Success modal ---------- */
.success-header { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.success-header h2 { margin: 0; font-size: 20px; font-weight: 600; color: #1C1D21; }

.success-icon {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(87, 235, 161, 0.25);
    color: #2e7d55;
}

.success-icon i { font-size: 32px; }

.success-text { margin: 0 0 16px; font-size: 14px; color: #4B5563; line-height: 1.5; }

.success-summary {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 18px;
    border-radius: 12px;
    background: #f7f4ef;
    text-align: left;
    margin-bottom: 16px;
}

.summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: #6f6a62;
}

.summary-row strong { color: #1C1D21; font-weight: 600; }

.success-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    font-size: 12px;
    color: #6f6a62;
    text-align: left;
}

.success-note i { flex: 0 0 auto; font-size: 16px; color: #8c877f; }

/* ---------- Responsive ---------- */
@media (max-width: 1180px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .specialist-grid { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
    .kpi-grid { grid-template-columns: 1fr; }
    .modal-grid { grid-template-columns: 1fr; }
}
</style>

