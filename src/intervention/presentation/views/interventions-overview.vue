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
      <pv-input-text v-model="certArea" placeholder="e.g. South-west block &middot; 0.6 ha" />
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
    const alertId = item.alertId;
    const resolvedTheThreat = closeResult.value === 'RESOLVED';
    store.closeIntervention(
        item.interventionOutcomeId,
        {
            serviceResult: closeResult.value,
            hireAgain: closeHire.value,
            privateFeedback: closeFeedback.value.trim() || undefined,
        },
        (ok) => {
            if (!ok) return;
            closeModalVisible.value = false;
            // Close the loop back to Surveillance: a RESOLVED service resolves the
            // alert that triggered the whole cycle. Best-effort.
            if (resolvedTheThreat && alertId != null) {
                surveillance.resolveAlert(alertId);
            }
        },
    );
}
</script>

<style scoped>
.interventions-page {
    display: flex;
    flex-direction: column;
    gap: 22px;
    font-family: 'Poppins', sans-serif;
}

/* ---------- Toolbar ---------- */
.toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid #F0F0F3;
}

.scope-field {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.scope-field i {
    font-size: 18px;
    color: #8c877f;
}

.scope-label {
    font-size: 13px;
    font-weight: 500;
    color: #6f6a62;
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

.kpi-card--amber { border-color: rgba(160, 125, 15, 0.5); }

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

.kpi-value {
    font-size: 32px;
    font-weight: 500;
    line-height: 1.1;
}

.kpi-value--primary { color: #2E4A3A; }
.kpi-value--blue { color: #004fc4; }
.kpi-value--amber { color: #a07d0f; }
.kpi-value--red { color: #E53535; }

.kpi-foot {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #4B5563;
}

.kpi-pill {
    align-self: flex-start;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
}

.kpi-pill--danger {
    background: rgba(229, 53, 53, 0.14);
    color: #E53535;
}

/* ---------- Section cards ---------- */
.section-card {
    padding: 22px 24px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #F0F0F3;
}

.detail-grid {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 20px;
    align-items: start;
}

.detail-col {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: #1C1D21;
}

.title-icon { font-size: 20px; color: #6f6a62; }

.section-subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 400;
    color: #828282;
}

.tag-purple {
    align-self: flex-start;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(126, 140, 247, 0.18);
    color: #5b57c8;
    font-size: 12px;
    font-weight: 500;
}

/* ---------- Records table ---------- */
.records-table { display: grid; overflow-x: auto; }

.records-header,
.records-row {
    display: grid;
    grid-template-columns: minmax(80px, 0.7fr) minmax(90px, 0.9fr) minmax(120px, 1.1fr) minmax(110px, 1fr) minmax(120px, 1fr);
    align-items: center;
    gap: 12px;
    padding: 0 6px;
    text-align: left;
    min-width: 560px;
}

.records-header {
    min-height: 44px;
    color: #6f6a62;
    font-size: 12px;
    font-weight: 500;
}

.records-row {
    min-height: 60px;
    border-top: 1px solid #f0ece4;
    border-left: none;
    border-right: none;
    border-bottom: none;
    font-size: 13px;
    color: #333333;
    background: transparent;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    width: 100%;
}

.records-row:hover { background: #faf8f4; }
.records-row.is-selected { background: #f4f7f4; }

.record-code { font-weight: 600; color: #1C1D21; }

.records-state {
    min-height: 90px;
    display: grid;
    place-items: center;
    text-align: center;
    color: #8a8f8b;
    font-size: 13px;
    padding: 12px;
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

.records-row .pill {
    white-space: normal;
    text-align: center;
    line-height: 1.15;
    min-height: 0;
    padding: 5px 10px;
    border-radius: 12px;
    max-width: 100%;
}

.status-awaiting { background: #F0EBE3; color: #8c877f; }
.status-issued { background: rgba(0, 79, 196, 0.12); color: #004fc4; }
.status-recovery { background: rgba(91, 141, 239, 0.16); color: #3f6fd0; }
.status-ready { background: rgba(160, 125, 15, 0.18); color: #a07d0f; }
.status-closed { background: #eeeeee; color: #6f6a62; }

.severity-critical { background: rgba(255, 92, 92, 0.18); color: #d63b3b; }
.severity-high { background: rgba(255, 92, 92, 0.16); color: #e05656; }
.severity-medium { background: rgba(240, 136, 62, 0.2); color: #C15A2E; }
.severity-low { background: #eeeeee; color: #6f6a62; }

/* ---------- Selected intervention detail ---------- */
.detail-rows { display: flex; flex-direction: column; }

.detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 52px;
    border-top: 1px solid #f0ece4;
    font-size: 14px;
    color: #4B5563;
}

.detail-row:first-child { border-top: none; }
.detail-row strong { color: #1C1D21; font-weight: 600; }

.next-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 16px 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: #f4f7f4;
    font-size: 13px;
    color: #4f6a58;
}

.next-note i { flex: 0 0 auto; font-size: 16px; color: #6f9a7f; }

.closed-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(87, 235, 161, 0.18);
    color: #2e7d55;
    font-size: 13px;
    font-weight: 500;
}

.recovery-ok { color: #3f6fd0; }

.recovery-note {
    margin: 12px 0 0;
    font-size: 12px;
    color: #6f6a62;
}

/* ---------- Prescription summary ---------- */
.rx-specialist,
.close-specialist {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #f8f4ed;
    margin-bottom: 14px;
}

.close-specialist .pill { margin-left: auto; }

.avatar {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #2E4A3A;
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
}

.avatar--sm { width: 40px; height: 40px; font-size: 13px; }

.identity-text { display: flex; flex-direction: column; gap: 2px; }
.specialist-name { font-size: 13px; font-weight: 600; color: #1C1D21; }
.specialist-role { font-size: 12px; font-weight: 400; color: #6f6a62; }

.scope-list {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.scope-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #333333;
}

.scope-list i { font-size: 16px; color: #2e7d55; }

.rx-products strong { font-size: 13px; color: #1C1D21; }

.product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}

.product-tag {
    padding: 5px 12px;
    border-radius: 8px;
    background: #f8f4ed;
    color: #2E4A3A;
    font-size: 12px;
    font-weight: 500;
}

/* ---------- Buttons ---------- */
.primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 42px;
    padding: 0 18px;
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
.primary-button.block { width: 100%; }

.ghost-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 42px;
    padding: 0 16px;
    border-radius: 10px;
    border: 1px solid #e2ddd4;
    color: #333333;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 500;
    background: #ffffff;
}

/* ---------- Modal content ---------- */
.modal-subtitle { margin: 4px 0 0; font-size: 13px; color: #6f6a62; }

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

.field :deep(input),
.field :deep(textarea) {
    padding: 10px 12px;
    border: 1px solid #e2ddd4;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #333333;
}

.radio-list { display: flex; flex-direction: column; gap: 10px; }

.radio-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid #e2ddd4;
    font-size: 13px;
    color: #333333;
    cursor: pointer;
}

.radio-item.is-active {
    border-color: #2E4A3A;
    background: rgba(46, 74, 58, 0.05);
    font-weight: 500;
}

.segmented {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.segmented--two { grid-template-columns: repeat(2, 1fr); }

.seg {
    height: 40px;
    border-radius: 10px;
    border: 1px solid #e2ddd4;
    background: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #333333;
    cursor: pointer;
}

.seg.is-active {
    border-color: #2E4A3A;
    background: rgba(87, 235, 161, 0.18);
    color: #2e7d55;
}

/* ---------- Responsive ---------- */
@media (max-width: 1180px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .detail-grid { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
    .kpi-grid { grid-template-columns: 1fr; }
    .modal-grid { grid-template-columns: 1fr; }
    .segmented { grid-template-columns: repeat(2, 1fr); }
}
</style>

