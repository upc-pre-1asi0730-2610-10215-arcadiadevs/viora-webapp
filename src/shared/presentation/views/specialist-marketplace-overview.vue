<script setup>
/**
 * SpecialistMarketplaceOverview view.
 * The specialist's Intervention Marketplace: headline KPIs (new cases,
 * contact visibility, acceptance rate, active cases), the inbox of incoming
 * producer cases as cards + a compact case log table, and a submit-proposal
 * modal. Ports the behavior of os-viora's `SpecialistMarketplace` Angular
 * component to Vue composition idioms — state management lives entirely in
 * `useSpecialistMarketplaceStore` (intervention/application), this view only
 * renders the read model and dispatches actions.
 */
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSpecialistMarketplaceStore } from '../../../intervention/application/specialist-marketplace.store.js';
import { DateTimeFormatter } from '../../infrastructure/date-time.formatter.js';
import DashboardHeader from '../components/dashboard-header.vue';

/** Default proposal the specialist can adjust before sending (real product default). */
const DEFAULT_SCOPE = [
  'Inspect the affected zones in the plot',
  'Validate the symptom report in field',
  'Review low-vigor areas',
  'Recommend the next technical action'
];

const store = useSpecialistMarketplaceStore();
const { t } = useI18n();

const breadcrumbs = computed(() => [
  { label: t('specialistMarketplace.breadcrumb.marketplace'), disabled: true },
  { label: t('specialistMarketplace.breadcrumb.overview'), disabled: true }
]);

const updatedLabel = computed(() => {
  if (!store.updatedAt) return t('specialistMarketplace.noSyncYet');
  return `${t('dashboard.updated-label')} ${DateTimeFormatter.formatRelativeTime(store.updatedAt)}`;
});

const formatDate = (date) => {
  if (!date) return '';
  return DateTimeFormatter.formatRelativeTime(date);
};

/** Two-letter avatar initials from the producer name. */
const initials = (name) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + second).toUpperCase();
};

const severityKey = (severity) => severity ?? 'LOW';

const refresh = () => store.refresh();
const decline = (caseItem) => store.decline(caseItem);

// ----- Submit proposal modal -----
const modalCase = ref(null);
const formTitle = ref('');
const formDuration = ref('');
const formScope = ref('');
const formAmount = ref('');
const formCurrency = ref('PEN');
const formDetails = ref('');

const openProposal = (caseItem) => {
  modalCase.value = caseItem;
  formTitle.value = 'Field inspection and phytosanitary evaluation';
  formDuration.value = '2-3 hours';
  formScope.value = DEFAULT_SCOPE.join('\n');
  formAmount.value = '280';
  formCurrency.value = 'PEN';
  formDetails.value = 'The initial visit will focus on confirming the probable biological threat and defining whether a technical prescription is required.';
};

const closeModal = () => {
  modalCase.value = null;
};

const canSubmit = computed(() => (
  modalCase.value != null &&
  formTitle.value.trim().length > 0 &&
  formScope.value.trim().length > 0 &&
  Number(formAmount.value) > 0 &&
  !store.submitting
));

const submitProposal = () => {
  const caseItem = modalCase.value;
  if (!caseItem || !canSubmit.value) return;

  const scope = formScope.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  store.submitProposal(
    caseItem,
    {
      serviceTitle: formTitle.value.trim(),
      durationLabel: formDuration.value.trim(),
      scope,
      // Real proposed date: three days out from now (specialist can be given
      // a picker later; the marketplace ships with a sensible default window).
      proposedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      amount: Number(formAmount.value),
      currency: formCurrency.value.trim() || 'PEN',
      proposalDetails: formDetails.value.trim()
    },
    (ok) => {
      if (ok) closeModal();
    }
  );
};

onMounted(() => {
  store.load();
});
</script>

<template>
  <section class="specialist-marketplace">
    <DashboardHeader
      :breadcrumbs="breadcrumbs"
      :subtitle="t('specialistMarketplace.subtitle')"
      :updated-label="updatedLabel"
      @refresh="refresh"
    />

    <!-- KPI cards -->
    <section class="kpi-grid">
      <article class="card kpi-card">
        <div class="kpi-head">
          <span class="kpi-label">{{ t('specialistMarketplace.kpis.newCases') }}</span>
          <span v-if="store.newCasesCount > 0" class="new-badge">
            {{ store.newCasesCount }} {{ t('specialistMarketplace.kpis.new') }}
          </span>
        </div>
        <strong class="kpi-value">{{ store.newCasesCount }}</strong>
        <span class="kpi-foot">{{ t('specialistMarketplace.kpis.newCasesFoot') }}</span>
      </article>

      <article class="card kpi-card kpi-card--contact">
        <div class="kpi-head">
          <span class="kpi-label">{{ t('specialistMarketplace.kpis.contact') }}</span>
          <span class="kpi-pill">{{ t('specialistMarketplace.kpis.public') }}</span>
        </div>
        <span class="kpi-contact-body">{{ t('specialistMarketplace.kpis.contactFoot') }}</span>
        <router-link class="contact-button" to="/settings">
          <i class="pi pi-id-card"></i> {{ t('specialistMarketplace.kpis.viewProfile') }}
        </router-link>
      </article>

      <article class="card kpi-card">
        <span class="kpi-label">{{ t('specialistMarketplace.kpis.acceptance') }}</span>
        <template v-if="store.acceptanceRatePercent !== null">
          <strong class="kpi-value">{{ store.acceptanceRatePercent }}%</strong>
          <div class="kpi-bar">
            <span class="kpi-bar-fill" :style="{ width: `${store.acceptanceRatePercent}%` }"></span>
          </div>
        </template>
        <template v-else>
          <strong class="kpi-value is-empty">&mdash;</strong>
          <span class="kpi-foot">{{ t('specialistMarketplace.noDataYet') }}</span>
        </template>
      </article>

      <article class="card kpi-card">
        <span class="kpi-label">{{ t('specialistMarketplace.kpis.active') }}</span>
        <strong class="kpi-value">{{ store.activeCasesCount }}</strong>
        <span class="kpi-foot">{{ t('specialistMarketplace.kpis.activeFoot') }}</span>
      </article>
    </section>

    <!-- Separator -->
    <div class="section-divider">
      <div class="divider-copy">
        <h2>{{ t('specialistMarketplace.producers.title') }}</h2>
        <p>{{ t('specialistMarketplace.producers.subtitle') }}</p>
      </div>
      <span v-if="store.newCasesCount > 0" class="divider-count">
        {{ t('specialistMarketplace.producers.count', { count: store.newCasesCount }) }}
      </span>
    </div>

    <!-- Incoming case cards -->
    <section v-if="store.cases.length > 0" class="case-grid">
      <article v-for="caseItem in store.cases" :key="caseItem.id" class="card case-card">
        <div class="case-top">
          <span class="severity-pill" :data-severity="severityKey(caseItem.severity)">
            {{ t(`specialistMarketplace.severity.${severityKey(caseItem.severity)}`) }}
          </span>
          <span class="new-tag">{{ t('specialistMarketplace.card.new') }}</span>
        </div>

        <div class="case-identity">
          <img v-if="caseItem.producerPhotoUrl" class="avatar" :src="caseItem.producerPhotoUrl" alt="" />
          <span v-else class="avatar">{{ initials(caseItem.producerName) }}</span>
          <div class="identity-text">
            <div class="identity-name">
              <strong>{{ caseItem.producerName || t('specialistMarketplace.card.producerFallback') }}</strong>
              <span class="producer-tag">{{ t('specialistMarketplace.card.producer') }}</span>
            </div>
            <span v-if="caseItem.productionType" class="identity-sub">
              {{ caseItem.productionType }} {{ t('specialistMarketplace.card.production') }}
            </span>
          </div>
        </div>

        <div class="case-meta">
          <span v-if="caseItem.location"><i class="pi pi-map-marker"></i> {{ caseItem.location }}</span>
          <span v-if="caseItem.areaHectares != null || caseItem.plotCount != null">
            <i class="pi pi-th-large"></i>
            <template v-if="caseItem.areaHectares != null">
              {{ caseItem.areaHectares.toFixed(1) }} {{ t('specialistMarketplace.card.ha') }}
            </template>
            <template v-if="caseItem.plotCount != null">
              &middot; {{ t('specialistMarketplace.card.plots', { count: caseItem.plotCount }) }}
            </template>
          </span>
        </div>

        <div class="case-subrow">
          <span><i class="pi pi-map"></i> {{ caseItem.plotName }}</span>
          <span v-if="caseItem.createdAt"><i class="pi pi-clock"></i> {{ formatDate(caseItem.createdAt) }}</span>
        </div>

        <div class="case-tags">
          <span v-if="caseItem.problem" class="case-tag">
            <i class="pi pi-exclamation-triangle"></i> {{ caseItem.problem }}
          </span>
          <span v-if="caseItem.ndvi != null" class="case-tag case-tag--ndvi">
            <i class="pi pi-wifi"></i> {{ t('specialistMarketplace.card.ndvi') }} &middot; {{ caseItem.ndvi.toFixed(2) }}
          </span>
        </div>

        <div class="case-actions">
          <button type="button" class="btn-decline" @click="decline(caseItem)">
            {{ t('specialistMarketplace.card.decline') }}
          </button>
          <button type="button" class="btn-review" @click="openProposal(caseItem)">
            <i class="pi pi-send"></i> {{ t('specialistMarketplace.card.review') }}
          </button>
        </div>
      </article>
    </section>
    <section v-else class="card empty-panel">
      <i class="pi pi-inbox"></i>
      <p v-if="store.errors.length > 0">{{ t('specialistMarketplace.emptyError') }}</p>
      <p v-else>{{ t('specialistMarketplace.empty') }}</p>
    </section>

    <!-- Incoming case log (tabular index of the same cases) -->
    <article class="card log-card">
      <header class="card-head">
        <div>
          <h3>{{ t('specialistMarketplace.log.title') }}</h3>
          <p>{{ t('specialistMarketplace.log.subtitle') }}</p>
        </div>
        <router-link class="card-link" to="/specialist/requests">
          {{ t('specialistMarketplace.log.viewPipeline') }} <span aria-hidden="true">&rarr;</span>
        </router-link>
      </header>

      <div v-if="store.cases.length > 0" class="log-table" role="table">
        <div class="log-row log-head" role="row">
          <span role="columnheader">{{ t('specialistMarketplace.log.colRequest') }}</span>
          <span role="columnheader">{{ t('specialistMarketplace.log.colProducer') }}</span>
          <span role="columnheader">{{ t('specialistMarketplace.log.colProblem') }}</span>
          <span role="columnheader">{{ t('specialistMarketplace.log.colReceived') }}</span>
          <span role="columnheader">{{ t('specialistMarketplace.log.colAction') }}</span>
        </div>

        <div v-for="caseItem in store.cases" :key="caseItem.id" class="log-row" role="row">
          <span class="log-code">{{ caseItem.referenceCode || '—' }}</span>
          <span>{{ caseItem.producerName || t('specialistMarketplace.card.producerFallback') }}</span>
          <span class="log-problem">{{ caseItem.problem || '—' }}</span>
          <span class="log-date">{{ formatDate(caseItem.createdAt) || '—' }}</span>
          <span>
            <button type="button" class="log-action" @click="openProposal(caseItem)">
              {{ t('specialistMarketplace.log.review') }}
            </button>
          </span>
        </div>
      </div>
      <p v-else class="log-empty">{{ t('specialistMarketplace.log.empty') }}</p>
    </article>

    <!-- Submit proposal modal -->
    <div v-if="modalCase" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-head">
          <div>
            <h2>{{ t('specialistMarketplace.modal.title') }}</h2>
            <p class="modal-subtitle">{{ t('specialistMarketplace.modal.subtitle') }}</p>
          </div>
          <button type="button" class="modal-close" @click="closeModal">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div class="modal-case">
          <img v-if="modalCase.producerPhotoUrl" class="avatar" :src="modalCase.producerPhotoUrl" alt="" />
          <span v-else class="avatar">{{ initials(modalCase.producerName) }}</span>
          <div class="identity-text">
            <strong>{{ modalCase.producerName || t('specialistMarketplace.card.producerFallback') }}</strong>
            <span class="modal-case-sub">
              {{ modalCase.plotName }}
              <template v-if="modalCase.problem"> &middot; {{ modalCase.problem }}</template>
            </span>
          </div>
          <span class="severity-pill" :data-severity="severityKey(modalCase.severity)">
            {{ t(`specialistMarketplace.severity.${severityKey(modalCase.severity)}`) }}
          </span>
        </div>

        <div class="modal-grid">
          <label class="field">
            <span>{{ t('specialistMarketplace.modal.serviceTitle') }}</span>
            <input type="text" v-model="formTitle" />
          </label>
          <label class="field">
            <span>{{ t('specialistMarketplace.modal.duration') }}</span>
            <input type="text" v-model="formDuration" />
          </label>
        </div>

        <label class="field">
          <span>{{ t('specialistMarketplace.modal.scope') }}</span>
          <textarea rows="4" v-model="formScope"></textarea>
          <small>{{ t('specialistMarketplace.modal.scopeHint') }}</small>
        </label>

        <div class="modal-grid">
          <label class="field">
            <span>{{ t('specialistMarketplace.modal.amount') }}</span>
            <input type="number" min="0" v-model="formAmount" />
          </label>
          <label class="field">
            <span>{{ t('specialistMarketplace.modal.currency') }}</span>
            <input type="text" v-model="formCurrency" />
          </label>
        </div>

        <label class="field">
          <span>{{ t('specialistMarketplace.modal.details') }}</span>
          <textarea rows="3" v-model="formDetails"></textarea>
        </label>

        <div class="modal-actions">
          <button type="button" class="btn-decline" @click="closeModal">
            {{ t('specialistMarketplace.modal.cancel') }}
          </button>
          <button type="button" class="btn-review" :disabled="!canSubmit" @click="submitProposal">
            <i class="pi pi-send"></i>
            {{ store.submitting ? t('specialistMarketplace.modal.sending') : t('specialistMarketplace.modal.send') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.specialist-marketplace {
  min-height: 100%;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
}

.card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

/* ----- KPI cards ----- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 24px;
}

.kpi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.kpi-label {
  color: #1f2523;
  font-size: 14px;
  font-weight: 500;
}

.kpi-value {
  font-size: 38px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
}

.kpi-value.is-empty {
  color: #c8c2b8;
}

.kpi-foot {
  color: #6b716d;
  font-size: 12px;
  line-height: 1.4;
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
  background: #2e4a3a;
}

.kpi-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: #e7f0e9;
  color: #2e4a3a;
  font-size: 11px;
  font-weight: 600;
}

.new-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: #b4532a;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
}

.kpi-card--contact {
  justify-content: space-between;
}

.kpi-contact-body {
  color: #6b716d;
  font-size: 12px;
  line-height: 1.45;
}

.contact-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: auto;
  padding: 10px 14px;
  border: 1px solid #ddd7cd;
  border-radius: 10px;
  background: #ffffff;
  color: #2e4a3a;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease;
}

.contact-button:hover {
  background: #f4f1ea;
}

/* ----- Section divider ----- */
.section-divider {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #edeae4;
}

.divider-copy h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.divider-copy p {
  margin: 4px 0 0;
  color: #6b716d;
  font-size: 13px;
}

.divider-count {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  background: #d6f3e3;
  color: #1f7a54;
  font-size: 12px;
  font-weight: 600;
}

/* ----- Case cards ----- */
.case-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.case-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 24px;
}

.case-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.severity-pill {
  min-width: 58px;
  text-align: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
}

.severity-pill[data-severity='CRITICAL'] { background: #b0271d; }
.severity-pill[data-severity='HIGH'] { background: #e2483d; }
.severity-pill[data-severity='MEDIUM'] { background: #c06a2b; }
.severity-pill[data-severity='LOW'] { background: #3fa27a; }

.new-tag {
  padding: 5px 12px;
  border-radius: 999px;
  background: #e7f0e9;
  color: #2e4a3a;
  font-size: 11px;
  font-weight: 600;
}

.case-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 999px;
  background: #2e4a3a;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  object-fit: cover;
}

.identity-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.identity-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.identity-name strong {
  font-size: 15px;
  font-weight: 600;
}

.producer-tag {
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef2ea;
  color: #2e4a3a;
  font-size: 10px;
  font-weight: 600;
}

.identity-sub {
  color: #6b716d;
  font-size: 12px;
}

.case-meta,
.case-subrow {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  color: #6b716d;
  font-size: 12px;
}

.case-meta span,
.case-subrow span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.case-meta i,
.case-subrow i {
  font-size: 13px;
  color: #9a9187;
}

.case-subrow {
  padding-top: 12px;
  border-top: 1px solid #edeae4;
}

.case-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.case-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 999px;
  background: #faf8f4;
  color: #4f5651;
  font-size: 12px;
  font-weight: 500;
}

.case-tag i {
  font-size: 13px;
  color: #8a827a;
}

.case-tag--ndvi {
  background: #eef3ff;
  color: #3a5bb0;
}

.case-tag--ndvi i {
  color: #5b7fd8;
}

.case-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 6px;
}

.btn-decline,
.btn-review {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 9px;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-decline {
  border: 1px solid #ddd7cd;
  background: #ffffff;
  color: #1f2523;
}

.btn-decline:hover {
  background: #f4f1ea;
}

.btn-review {
  flex: 1;
  border: none;
  background: #2e4a3a;
  color: #ffffff;
}

.btn-review:hover {
  background: #24382c;
}

.btn-review:disabled {
  opacity: 0.55;
  cursor: default;
}

/* ----- Empty panel ----- */
.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding: 52px 24px;
  color: #6b716d;
  text-align: center;
}

.empty-panel i {
  font-size: 34px;
  color: #c8c2b8;
}

.empty-panel p {
  margin: 0;
  font-size: 13px;
  max-width: 420px;
}

/* ----- Case log table ----- */
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px 12px;
}

.card-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
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
  font-weight: 600;
  text-decoration: none;
}

.card-link:hover {
  text-decoration: underline;
}

.log-table {
  padding: 4px 26px 12px;
}

.log-row {
  display: grid;
  grid-template-columns: 0.9fr 1.2fr 1.3fr 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 13px 0;
  border-top: 1px solid #edeae4;
  font-size: 13px;
}

.log-row.log-head {
  border-top: none;
}

.log-head span {
  color: #9a9187;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.log-code {
  font-weight: 600;
}

.log-problem {
  color: #4f5651;
}

.log-date {
  color: #6b716d;
  font-size: 12px;
}

.log-action {
  padding: 7px 14px;
  border: 1px solid #ddd7cd;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.log-action:hover {
  background: #f4f1ea;
}

.log-empty {
  margin: 0;
  padding: 20px 26px 26px;
  color: #6b716d;
  font-size: 13px;
}

/* ----- Modal ----- */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(24, 34, 29, 0.42);
}

.modal {
  width: min(560px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 26px 28px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(24, 34, 29, 0.24);
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.modal-head h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 600;
}

.modal-subtitle {
  margin: 4px 0 0;
  color: #6b716d;
  font-size: 13px;
}

.modal-close {
  border: none;
  background: transparent;
  color: #6b716d;
  cursor: pointer;
  line-height: 0;
}

.modal-case {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #faf8f4;
}

.modal-case .identity-text {
  flex: 1;
}

.modal-case strong {
  font-size: 14px;
  font-weight: 600;
}

.modal-case-sub {
  color: #6b716d;
  font-size: 12px;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field > span {
  font-size: 12px;
  font-weight: 500;
  color: #1f2523;
}

.field small {
  color: #6b716d;
  font-size: 11px;
}

.field input,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #ddd7cd;
  border-radius: 10px;
  background: #ffffff;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #2e4a3a;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

/* ----- Responsive ----- */
@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .case-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .log-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .log-row.log-head {
    display: none;
  }

  .modal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
