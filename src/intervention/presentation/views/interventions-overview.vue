<template>
  <section class="interventions-page">
    <dashboard-header
      :breadcrumbs="breadcrumbs"
      subtitle="Track technical interventions linked to alerts, proposals and field prescriptions."
      :updated-label="store.lastSyncLabel"
      @refresh="refresh"
    />

    <!-- Toolbar: plot scope -->
    <div class="toolbar">
      <label class="scope-field">
        <i class="pi pi-map-marker"></i>
        <span class="scope-label">Plot:</span>
        <pv-dropdown
          v-model="selectedScope"
          :options="plotOptions"
          option-label="label"
          option-value="value"
          placeholder="All plots"
          @change="onSelectScope"
        />
      </label>
    </div>

    <!-- KPI cards -->
    <section class="kpi-grid">
      <pv-card class="kpi-card">
        <template #content>
          <div class="kpi-head"><h2>Total interventions</h2></div>
          <span class="kpi-value kpi-value--primary">{{ totalCount }}</span>
          <p class="kpi-foot">Accepted cases in the technical-service lifecycle.</p>
        </template>
      </pv-card>

      <pv-card class="kpi-card">
        <template #content>
          <div class="kpi-head">
            <h2>Pending certification</h2>
            <span v-if="pendingCertificationCount > 0" class="kpi-pill kpi-pill--danger">Action required</span>
          </div>
          <span class="kpi-value kpi-value--red">{{ pendingCertificationCount }}</span>
          <p class="kpi-foot">Prescriptions waiting for field application confirmation.</p>
        </template>
      </pv-card>

      <pv-card class="kpi-card">
        <template #content>
          <div class="kpi-head"><h2>Recovery monitoring</h2></div>
          <span class="kpi-value kpi-value--blue">{{ recoveryMonitoringCount }}</span>
          <p class="kpi-foot">Post-intervention vigor under observation.</p>
        </template>
      </pv-card>

      <pv-card class="kpi-card kpi-card--amber">
        <template #content>
          <div class="kpi-head"><h2>Closure pending</h2></div>
          <span class="kpi-value kpi-value--amber">{{ closurePendingCount }}</span>
          <p class="kpi-foot">Cases ready for service evaluation and closure.</p>
        </template>
      </pv-card>
    </section>

    <div class="detail-grid">
      <!-- Left: records + prescription summary -->
      <div class="detail-col">
        <pv-card class="section-card">
          <template #content>
            <div class="section-head">
              <div>
                <h2 class="section-title"><i class="pi pi-file-o title-icon"></i> Intervention records</h2>
                <p class="section-subtitle">Technical interventions linked to alerts, proposals and field prescriptions.</p>
              </div>
            </div>

            <div class="records-table">
              <div class="records-header">
                <span>ID</span><span>Plot</span><span>Service</span><span>Specialist</span><span>Status</span>
              </div>

              <div v-if="store.loading.list && store.interventions.length === 0" class="records-state">
                Loading interventions&hellip;
              </div>
              <div v-else-if="visibleInterventions.length === 0" class="records-state">
                No interventions yet. Accept a specialist proposal in Expert Assistance to start one.
              </div>
              <template v-else>
                <button
                  v-for="item in visibleInterventions"
                  :key="item.code"
                  type="button"
                  :class="['records-row', { 'is-selected': item.code === store.selectedCode }]"
                  @click="selectIntervention(item)"
                >
                  <span class="record-code">{{ item.code }}</span>
                  <span>{{ plotName(item.plotId) }}</span>
                  <span>{{ item.serviceTitle || 'Assistance case' }}</span>
                  <span>{{ store.specialistName(item.specialistId) }}</span>
                  <span><span :class="['pill', item.statusClass]">{{ item.statusLabel }}</span></span>
                </button>
              </template>
            </div>
          </template>
        </pv-card>

        <!-- Prescription summary -->
        <pv-card v-if="selected && store.prescription" class="section-card">
          <template #content>
            <div class="section-head">
              <div>
                <h2 class="section-title">Prescription summary</h2>
                <p class="section-subtitle">Technical prescription issued by the specialist &mdash; read-only.</p>
              </div>
              <span class="tag-purple">{{ store.prescription.code }}</span>
            </div>

            <div class="rx-specialist">
              <span class="avatar avatar--sm">{{ store.specialistName(selected.specialistId).slice(0,2).toUpperCase() }}</span>
              <div class="identity-text">
                <span class="specialist-name">{{ store.specialistName(selected.specialistId) }}</span>
                <span class="specialist-role">{{ store.prescription.treatment }}</span>
              </div>
            </div>

            <ul class="scope-list">
              <li v-for="item in store.prescription.scope" :key="item">
                <i class="pi pi-check"></i> {{ item }}
              </li>
            </ul>

            <template v-if="store.prescription.products.length > 0">
              <div class="rx-products">
                <strong>Products</strong>
                <div class="product-tags">
                  <span v-for="product in store.prescription.products" :key="product" class="product-tag">
                    {{ product }}
                  </span>
                </div>
              </div>
            </template>
          </template>
        </pv-card>
      </div>

      <!-- Right: selected intervention + recovery -->
      <div class="detail-col">
        <template v-if="selected">
          <pv-card class="section-card">
            <template #content>
              <div class="section-head">
                <div>
                  <h2 class="section-title">Selected intervention</h2>
                  <p class="section-subtitle">{{ selected.code }} &middot; {{ plotName(selected.plotId) }}</p>
                </div>
                <span :class="['pill', selected.statusClass]">{{ selected.statusLabel }}</span>
              </div>

              <div class="detail-rows">
                <div class="detail-row">
                  <span>Linked alert</span>
                  <span>
                    <template v-if="linkedAlert">
                      <span :class="['pill', severityClass(linkedAlert.severity)]">{{ linkedAlert.severity }}</span>
                      {{ linkedAlert.typeLabel }}
                    </template>
                    <template v-else>{{ selected.serviceTitle || 'Assistance case' }}</template>
                  </span>
                </div>
                <div class="detail-row">
                  <span>Specialist</span>
                  <strong>{{ store.specialistName(selected.specialistId) }}</strong>
                </div>
                <div class="detail-row">
                  <span>Prescription</span>
                  <strong>{{ selected.prescriptionCode }}</strong>
                </div>
                <div class="detail-row">
                  <span>Estimated cost</span>
                  <strong>{{ selected.amountLabel }}</strong>
                </div>
              </div>

              <div class="next-note">
                <i class="pi pi-info-circle"></i>
                <span>{{ nextActionLabel }}</span>
              </div>

              <template v-if="nextAction === 'simulate'">
                <pv-button type="button" class="primary-button block" :disabled="store.loading.action" @click="handleSimulatePrescription">
                  <i class="pi pi-bolt"></i> Simulate specialist prescription
                </pv-button>
              </template>
              <template v-else-if="nextAction === 'certify'">
                <pv-button type="button" class="primary-button block" @click="openModal('certify')">
                  <i class="pi pi-verified"></i> Certify application
                </pv-button>
              </template>
              <template v-else-if="nextAction === 'impact'">
                <pv-button type="button" class="primary-button block" @click="openModal('impact')">
                  <i class="pi pi-leaf"></i> Report impact
                </pv-button>
              </template>
              <template v-else-if="nextAction === 'close'">
                <pv-button type="button" class="primary-button block" @click="openModal('close')">
                  <i class="pi pi-check-square"></i> Close intervention
                </pv-button>
              </template>
              <template v-else>
                <div class="closed-banner"><i class="pi pi-check-circle"></i> Service closed and evaluated.</div>
              </template>
            </template>
          </pv-card>

          <!-- Recovery -->
          <template v-if="selected.inRecovery || selected.readyToClose || selected.isClosed">
            <pv-card class="section-card">
              <template #content>
                <div class="section-head">
                  <h2 class="section-title">Post-intervention recovery</h2>
                  <span class="tag-purple">{{ selected.prescriptionCode }}</span>
                </div>
                <div class="detail-rows">
                  <div class="detail-row">
                    <span>Monitoring period</span>
                    <strong>14 days</strong>
                  </div>
                  <div class="detail-row">
                    <span>Recovery status</span>
                    <strong class="recovery-ok">
                      {{ selected.isClosed ? 'Service closed' : (selected.readyToClose ? 'Impact reported' : 'Under observation') }}
                    </strong>
                  </div>
                </div>
                <p class="recovery-note">
                  Vegetation vigor is monitored during the grace period. Report the impact once the recovery window completes.
                </p>
              </template>
            </pv-card>
          </template>
        </template>

        <pv-card v-else-if="!store.loading.list" class="section-card">
          <template #content>
            <div class="records-state">Select an intervention to view its details.</div>
          </template>
        </pv-card>
      </div>
    </div>
  </section>

  <!-- Certify application modal -->
  <pv-dialog v-model:visible="certifyModalVisible" modal :closable="false">
    <template #header>
      <div>
        <h2>Certify application</h2>
        <p class="modal-subtitle">Register the field execution of the technical prescription.</p>
      </div>
    </template>

    <div class="modal-grid">
      <div class="field"><span>Linked intervention</span><div class="field-readonly">{{ selected?.code }} &middot; {{ plotName(selected?.plotId) }}</div></div>
      <div class="field"><span>Prescription</span><div class="field-readonly">{{ selected?.prescriptionCode }}</div></div>
    </div>

    <label class="field">
      <span>Applied area</span>
      <pv-inputtext v-model="certArea" placeholder="e.g. South-west block &middot; 0.6 ha" />
    </label>

    <div class="field">
      <span>Execution status</span>
      <div class="radio-list">
        <label v-for="opt in executionStatusOptions" :key="opt" :class="['radio-item', { 'is-active': certStatus === opt }]">
          <input type="radio" name="certStatus" :value="opt" v-model="certStatus" /> {{ formatEnumLabel(opt) }}
        </label>
      </div>
    </div>

    <label class="field">
      <span>Field note (optional)</span>
      <pv-textarea v-model="certNote" rows="3" placeholder="Describe field conditions or any deviation from the prescription..." />
    </label>

    <template #footer>
      <pv-button type="button" class="ghost-button" @click="certifyModalVisible = false">Cancel</pv-button>
      <pv-button type="button" class="primary-button" :disabled="certArea.trim().length === 0 || store.loading.action" @click="submitCertify">
        <i class="pi pi-verified"></i> {{ store.loading.action ? 'Saving...' : 'Certify application' }}
      </pv-button>
    </template>
  </pv-dialog>

  <!-- Report impact modal -->
  <pv-dialog v-model:visible="impactModalVisible" modal :closable="false">
    <template #header>
      <div>
        <h2>Report intervention impact</h2>
        <p class="modal-subtitle">Report whether the phytosanitary issue improved after the grace period.</p>
      </div>
    </template>

    <div class="modal-grid">
      <div class="field"><span>Linked intervention</span><div class="field-readonly">{{ selected?.code }} &middot; {{ plotName(selected?.plotId) }}</div></div>
      <div class="field"><span>Grace period</span><div class="field-readonly">14 days completed</div></div>
    </div>

    <div class="field">
      <span>Observed result</span>
      <div class="radio-list">
        <label v-for="opt in observedResultOptions" :key="opt" :class="['radio-item', { 'is-active': impactResult === opt }]">
          <input type="radio" name="obs" :value="opt" v-model="impactResult" /> {{ formatEnumLabel(opt) }}
        </label>
      </div>
    </div>

    <div class="field">
      <span>Impact level</span>
      <div class="segmented">
        <button
          v-for="level in impactLevelOptions"
          :key="level"
          type="button"
          :class="['seg', { 'is-active': impactLevel === level }]"
          @click="impactLevel = level"
        >
          {{ formatEnumLabel(level) }}
        </button>
      </div>
    </div>

    <label class="field">
      <span>Producer assessment</span>
      <pv-textarea v-model="impactAssessment" rows="3" placeholder="Describe the observed change in the affected area..." />
    </label>

    <template #footer>
      <pv-button type="button" class="ghost-button" @click="impactModalVisible = false">Cancel</pv-button>
      <pv-button type="button" class="primary-button" :disabled="impactAssessment.trim().length === 0 || store.loading.action" @click="submitImpact">
        <i class="pi pi-send"></i> {{ store.loading.action ? 'Sending...' : 'Submit impact report' }}
      </pv-button>
    </template>
  </pv-dialog>

  <!-- Close intervention modal -->
  <pv-dialog v-model:visible="closeModalVisible" modal :closable="false">
    <template #header>
      <div>
        <h2>Close intervention</h2>
        <p class="modal-subtitle">Finalize the technical service and evaluate your experience with the specialist.</p>
      </div>
    </template>

    <div class="close-specialist">
      <span class="avatar avatar--sm">{{ store.specialistName(selected?.specialistId).slice(0,2).toUpperCase() }}</span>
      <div class="identity-text">
        <span class="specialist-name">{{ store.specialistName(selected?.specialistId) }}</span>
        <span class="specialist-role">{{ selected?.code }} &middot; {{ plotName(selected?.plotId) }}</span>
      </div>
      <span class="pill status-ready">Ready to close</span>
    </div>

    <div class="field">
      <span>Service result</span>
      <div class="radio-list">
        <label v-for="opt in serviceResultOptions" :key="opt" :class="['radio-item', { 'is-active': closeResult === opt }]">
          <input type="radio" name="svc" :value="opt" v-model="closeResult" /> {{ formatEnumLabel(opt) }}
        </label>
      </div>
    </div>

    <div class="field">
      <span>Would you hire this specialist again?</span>
      <div class="segmented segmented--two">
        <button type="button" :class="['seg', { 'is-active': closeHire === 'YES' }]" @click="closeHire = 'YES'">Yes</button>
        <button type="button" :class="['seg', { 'is-active': closeHire === 'NO' }]" @click="closeHire = 'NO'">No</button>
      </div>
    </div>

    <label class="field">
      <span>Private feedback (optional)</span>
      <pv-textarea v-model="closeFeedback" rows="3" placeholder="Add a short comment about the service quality, punctuality, or technical support..." />
    </label>

    <template #footer>
      <pv-button type="button" class="ghost-button" @click="closeModalVisible = false">Cancel</pv-button>
      <pv-button type="button" class="primary-button" :disabled="store.loading.action" @click="submitClose">
        <i class="pi pi-check-square"></i> {{ store.loading.action ? 'Closing...' : 'Close intervention' }}
      </pv-button>
    </template>
  </pv-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';
import { useInterventionsStore } from '../../application/interventions.store.js';
import { useSurveillanceStore } from '../../../surveillance/application/surveillance.store.js';
import { useAgronomicStore } from '../../../agronomic/application/agronomic.store.js';

const store = useInterventionsStore();
const surveillance = useSurveillanceStore();
const agronomic = useAgronomicStore();

const ALL_PLOTS = 'all';

const breadcrumbs = [
    { label: 'Interventions', disabled: true },
    { label: 'Overview', disabled: true },
];

const plots = ref([]);
const selectedScope = ref(ALL_PLOTS);

const certifyModalVisible = ref(false);
const impactModalVisible = ref(false);
const closeModalVisible = ref(false);

const certArea = ref('');
const certStatus = ref('APPLIED_AS_PRESCRIBED');
const certNote = ref('');

const impactResult = ref('PEST_PRESSURE_REDUCED');
const impactLevel = ref('POSITIVE');
const impactAssessment = ref('');

const closeResult = ref('RESOLVED');
const closeHire = ref('YES');
const closeFeedback = ref('');

const executionStatusOptions = ['APPLIED_AS_PRESCRIBED', 'PARTIALLY_APPLIED', 'NOT_APPLIED'];
const observedResultOptions = ['PEST_PRESSURE_REDUCED', 'SYMPTOMS_PERSIST', 'NEW_SYMPTOMS_DETECTED', 'NOT_ENOUGH_EVIDENCE_YET'];
const impactLevelOptions = ['POSITIVE', 'PARTIAL', 'NEGATIVE', 'INCONCLUSIVE'];
const serviceResultOptions = ['RESOLVED', 'PARTIALLY_RESOLVED', 'NOT_RESOLVED'];

const plotOptions = computed(() => [
    { value: ALL_PLOTS, label: 'All plots' },
    ...plots.value.filter((p) => p.id != null).map((p) => ({ value: p.id, label: p.name })),
]);

const visibleInterventions = computed(() => {
    if (selectedScope.value === ALL_PLOTS) return store.interventions;
    return store.interventions.filter((item) => String(item.plotId) === String(selectedScope.value));
});

const totalCount = computed(() => visibleInterventions.value.length);
const pendingCertificationCount = computed(() => visibleInterventions.value.filter((item) => item.needsCertification).length);
const recoveryMonitoringCount = computed(() => visibleInterventions.value.filter((item) => item.inRecovery).length);
const closurePendingCount = computed(() => visibleInterventions.value.filter((item) => item.readyToClose).length);

const selected = computed(() => store.selected);

const linkedAlert = computed(() => {
    const alertId = selected.value?.alertId ?? null;
    if (alertId == null) return null;
    return surveillance.alerts.find((alert) => String(alert.id) === String(alertId)) ?? null;
});

const nextAction = computed(() => {
    const item = selected.value;
    if (!item) return null;
    if (item.needsPrescription) return 'simulate';
    if (item.needsCertification) return 'certify';
    if (item.inRecovery) return 'impact';
    if (item.readyToClose) return 'close';
    return null;
});

const nextActionLabel = computed(() => {
    switch (nextAction.value) {
        case 'simulate': return 'Next: the specialist issues the technical prescription.';
        case 'certify': return 'Next required action: certify the application after field execution.';
        case 'impact': return 'Under recovery monitoring \u2014 report the impact after the grace period.';
        case 'close': return 'Ready to close \u2014 evaluate the service and finalize.';
        default: return 'This intervention is closed.';
    }
});

onMounted(async () => {
    if (surveillance.alerts.length === 0) {
        surveillance.fetchAlerts(50);
    }
    await agronomic.fetchPlots();
    plots.value = agronomic.plots;
    await store.loadInterventions();
});

function refresh() {
    surveillance.fetchAlerts(50);
    store.loadInterventions();
}

function onSelectScope() {
    const visible = visibleInterventions.value;
    const stillVisible = visible.some((item) => item.code === store.selectedCode);
    if (!stillVisible) {
        if (visible.length > 0) {
            store.select(visible[0].code);
        } else {
            store.clearSelection();
        }
    }
}

function selectIntervention(intervention) {
    store.select(intervention.code);
}

function plotName(plotId) {
    if (plotId == null) return '\u2014';
    return plots.value.find((p) => String(p.id) === String(plotId))?.name ?? `Plot #${plotId}`;
}

function severityClass(severity) {
    return `severity-${(severity ?? 'Low').toLowerCase()}`;
}

function formatEnumLabel(value) {
    return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

function handleSimulatePrescription() {
    const item = selected.value;
    if (item?.interventionRequestId != null) {
        store.simulatePrescription(item.interventionRequestId);
    }
}

function openModal(kind) {
    if (kind === 'certify') {
        certArea.value = '';
        certStatus.value = 'APPLIED_AS_PRESCRIBED';
        certNote.value = '';
        certifyModalVisible.value = true;
    } else if (kind === 'impact') {
        impactResult.value = 'PEST_PRESSURE_REDUCED';
        impactLevel.value = 'POSITIVE';
        impactAssessment.value = '';
        impactModalVisible.value = true;
    } else {
        closeResult.value = 'RESOLVED';
        closeHire.value = 'YES';
        closeFeedback.value = '';
        closeModalVisible.value = true;
    }
}

function submitCertify() {
    const item = selected.value;
    if (item?.treatmentPrescriptionId == null || certArea.value.trim().length === 0) return;
    store.certifyApplication(
        {
            treatmentPrescriptionId: item.treatmentPrescriptionId,
            applicationDate: new Date().toISOString(),
            appliedArea: certArea.value.trim(),
            executionStatus: certStatus.value,
            fieldNote: certNote.value.trim() || undefined,
        },
        (ok) => ok && (certifyModalVisible.value = false),
    );
}

function submitImpact() {
    const item = selected.value;
    if (item?.interventionExecutionId == null || impactAssessment.value.trim().length === 0) return;
    store.reportImpact(
        {
            interventionExecutionId: item.interventionExecutionId,
            gracePeriod: '14 days completed',
            observedResult: impactResult.value,
            impactLevel: impactLevel.value,
            producerAssessment: impactAssessment.value.trim(),
        },
        (ok) => ok && (impactModalVisible.value = false),
    );
}

function submitClose() {
    const item = selected.value;
    if (item?.interventionOutcomeId == null) return;
    store.closeIntervention(
        item.interventionOutcomeId,
        {
            serviceResult: closeResult.value,
            hireAgain: closeHire.value,
            privateFeedback: closeFeedback.value.trim() || undefined,
        },
        (ok) => ok && (closeModalVisible.value = false),
    );
}
</script>
