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
    return `${plot.name} \u00b7 ${location} \u00b7 ${plot.areaSizeLabel}`;
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
