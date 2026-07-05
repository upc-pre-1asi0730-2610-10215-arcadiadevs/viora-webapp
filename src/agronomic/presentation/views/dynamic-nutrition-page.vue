<script setup>
/**
 * DynamicNutritionPage — Active Plan.
 * Renders the backend-generated compensatory nutrition plan for the selected
 * plot (recommended inputs, rationale, application window, execution) and drives
 * certification (real POST, mock-tolerant) plus a client-side mitigation expense
 * declaration. Sourced from the platform Dynamic Nutrition contracts. Mirrors the
 * OS Angular `DynamicNutritionPage`.
 *
 * @component
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgronomicStore } from '../../application/agronomic.store.js';
import { DynamicNutritionPlan } from '../../domain/model/dynamic-nutrition-plan.entity.js';
import { normalizeClimateRisk } from '../../infrastructure/status-normalizers.js';
import LanguageSwitcher from '../../../shared/presentation/components/language-switcher.vue';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';

/**
 * Reference olive farm-gate price (S/ per tonne) used to estimate the margin in
 * the client-side expense modal. Placeholder until a finance endpoint exists.
 */
const REFERENCE_PRICE_PER_TONNE = 4200;

const { t } = useI18n();
const agronomicStore = useAgronomicStore();

const breadcrumbs = computed(() => [
  { label: t('sidebar.dashboard'), route: '/dashboard' },
  { label: t('sidebar.dynamicNutrition'), disabled: true },
  { label: t('dynamicNutrition.activePlan'), disabled: true }
]);

const plots = ref([]);
const selectedPlotId = ref(null);
const plan = ref(null);
const summary = ref(null);
const loading = ref(false);
const saving = ref(false);
const generateMessage = ref(null);

const showCertify = ref(false);
const showExpense = ref(false);

const certForm = reactive({ date: '', time: '', dose: 'Applied as recommended', operator: '', notes: '' });
const appliedInputs = reactive({});
const expenseForm = reactive({ input: null, labor: null, equipment: null, code: '', notes: '' });
const savedExpenseTotal = ref(null);

const selectedPlot = computed(
    () => plots.value.find((plot) => String(plot.id) === String(selectedPlotId.value)) ?? null
);

const areaLabel = computed(() =>
    selectedPlot.value ? `${selectedPlot.value.areaSizeHectares.toFixed(1)} ha` : '—'
);

const chillAccumulated = computed(() => summary.value?.chillPortions ?? 0);
const chillThreshold = computed(() => summary.value?.chillRequirementPortions ?? 0);
const chillGap = computed(() => Math.round(chillAccumulated.value - chillThreshold.value));
const chillProgress = computed(() =>
    chillThreshold.value ? Math.min(100, (chillAccumulated.value / chillThreshold.value) * 100) : 0
);
const yieldRiskLabel = computed(() =>
    summary.value ? normalizeClimateRisk(summary.value.climateRiskLevel) : '—'
);

const updatedLabel = computed(() => {
  const date = plan.value?.generatedDate ? new Date(plan.value.generatedDate) : null;
  if (!date || Number.isNaN(date.getTime())) return 'No sync yet';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
});

const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

const formatWindow = (start, end) => `${formatDate(start)} – ${formatDate(end)}`;

// ----- Data loading -----

const loadPlots = async () => {
  try {
    const overview = await agronomicStore.fetchMyPlotsOverview();
    plots.value = overview?.plots ?? [];
    if (!selectedPlotId.value && plots.value.length) {
      selectedPlotId.value = String(plots.value[0].id);
    }
  } catch (error) {
    console.error('[DynamicNutrition] Failed to load plots.', error);
  }
};

const loadPlan = async (plotId) => {
  if (!plotId) return;
  loading.value = true;
  generateMessage.value = null;
  savedExpenseTotal.value = null;
  try {
    const [planResult, summaryResult] = await Promise.all([
      agronomicStore.fetchActiveNutritionPlan(plotId),
      agronomicStore.fetchPlotSummary(plotId)
    ]);
    plan.value = planResult;
    summary.value = summaryResult;
  } catch (error) {
    plan.value = null;
    console.error('[DynamicNutrition] Failed to load plan.', error);
  } finally {
    loading.value = false;
  }
};

watch(selectedPlotId, (plotId) => loadPlan(plotId));

const refresh = () => loadPlan(selectedPlotId.value);

const onPlotChange = (event) => {
  selectedPlotId.value = event.target.value;
};

// ----- Generate (empty state) -----

const generatePlan = async () => {
  if (!selectedPlotId.value) return;
  saving.value = true;
  generateMessage.value = null;
  try {
    const success = await agronomicStore.generateNutritionPlan(selectedPlotId.value);
    if (success) await loadPlan(selectedPlotId.value);
  } catch (error) {
    generateMessage.value =
        error?.response?.data?.details ||
        error?.response?.data?.message ||
        'Could not generate the plan.';
  } finally {
    saving.value = false;
  }
};

// ----- Certify modal -----

const appliedInputNames = computed(() => Object.keys(appliedInputs).filter((name) => appliedInputs[name]));

const canCertify = computed(
    () =>
        Boolean(certForm.date) &&
        Boolean(certForm.time) &&
        Boolean(certForm.operator.trim()) &&
        appliedInputNames.value.length > 0 &&
        !saving.value
);

const openCertify = () => {
  if (!plan.value) return;
  const now = new Date();
  certForm.date = now.toISOString().slice(0, 10);
  certForm.time = now.toTimeString().slice(0, 5);
  certForm.dose = 'Applied as recommended';
  certForm.operator = '';
  certForm.notes = '';
  Object.keys(appliedInputs).forEach((key) => delete appliedInputs[key]);
  plan.value.inputs.forEach((input) => {
    appliedInputs[input.name] = input.status === 'Recommended';
  });
  showCertify.value = true;
};

const closeCertify = () => { showCertify.value = false; };

/** Builds a certified copy of the current plan (used as the mock fallback). */
const certifiedPlan = (application) =>
    new DynamicNutritionPlan({
      ...plan.value,
      certificationStatus: 'Certified',
      application
    });

const submitCertify = async () => {
  if (!plan.value?.id || !canCertify.value) return;
  const application = {
    applicationDate: certForm.date,
    applicationTime: certForm.time,
    appliedInputs: appliedInputNames.value,
    doseConfirmation: certForm.dose,
    fieldOperator: certForm.operator.trim(),
    fieldNotes: certForm.notes.trim()
  };

  saving.value = true;
  try {
    const result = await agronomicStore.certifyNutritionPlan(plan.value.id, application);
    plan.value = result ?? certifiedPlan(application);
  } catch {
    // json-server does not expose the certification command endpoint; apply the
    // certified state optimistically so the mock mirrors the backend outcome.
    plan.value = certifiedPlan(application);
  } finally {
    saving.value = false;
    closeCertify();
  }
};

// ----- Expense modal (client-side) -----

const expenseTotal = computed(
    () => (expenseForm.input ?? 0) + (expenseForm.labor ?? 0) + (expenseForm.equipment ?? 0)
);

const expenseMargin = computed(() => {
  const tonnes = summary.value?.yieldForecastTonnes ?? 0;
  if (tonnes <= 0) return null;
  const revenue = tonnes * REFERENCE_PRICE_PER_TONNE;
  if (revenue <= 0) return null;
  return Math.round(((revenue - expenseTotal.value) / revenue) * 1000) / 10;
});

const canSaveExpense = computed(() => expenseTotal.value > 0);

const openExpense = () => {
  expenseForm.input = null;
  expenseForm.labor = null;
  expenseForm.equipment = null;
  expenseForm.code = '';
  expenseForm.notes = '';
  showExpense.value = true;
};

const closeExpense = () => { showExpense.value = false; };

const submitExpense = () => {
  if (!canSaveExpense.value) return;
  savedExpenseTotal.value = expenseTotal.value;
  closeExpense();
};

onMounted(loadPlots);
</script>

<template>
  <section class="nutrition-page">
    <!-- Header -->
    <DashboardHeader
      :breadcrumbs="breadcrumbs"
      :subtitle="t('dynamicNutrition.subtitle')"
      :updated-label="`${t('common.updated')} · ${updatedLabel}`"
      @refresh="refresh"
    >
      <template #actions>
        <LanguageSwitcher />
      </template>
    </DashboardHeader>

    <!-- Quick actions -->
    <nav class="quick-actions">
      <router-link to="/dashboard" class="ghost-button">
        <i class="pi pi-th-large"></i> {{ t('sidebar.dashboard') }}
      </router-link>
      <template v-if="selectedPlotId">
        <router-link :to="`/dashboard/plot-overview/${selectedPlotId}`" class="ghost-button">
          <i class="pi pi-map"></i> {{ t('toolbar.plotOverview') }}
        </router-link>
        <router-link :to="`/dashboard/weather/${selectedPlotId}`" class="ghost-button">
          <i class="pi pi-cloud"></i> {{ t('toolbar.weather') }}
        </router-link>
      </template>

      <span class="qa-spacer"></span>

      <div class="plot-picker">
        <span class="picker-label">{{ t('dynamicNutrition.plot') }}:</span>
        <select class="plot-select" :value="selectedPlotId" @change="onPlotChange">
          <option v-for="plot in plots" :key="plot.id" :value="String(plot.id)">{{ plot.name }}</option>
        </select>
      </div>

      <span v-if="plan?.rationale?.triggeringRiskLevel" class="linked-alert">
        <i class="pi pi-exclamation-triangle"></i>
        {{ t('dynamicNutrition.linkedAlert') }}: <strong>{{ plan.rationale.triggeringRiskLevel }}</strong>
      </span>
    </nav>

    <div v-if="loading && !plan" class="state-box">{{ t('dynamicNutrition.loading') }}</div>

    <!-- Empty state -->
    <div v-else-if="!plan" class="state-box empty-plan">
      <i class="pi pi-sun empty-plan-icon"></i>
      <h2>{{ t('dynamicNutrition.empty.title') }}</h2>
      <p>{{ t('dynamicNutrition.empty.body', { plot: selectedPlot?.name || '—' }) }}</p>
      <p class="empty-hint">{{ t('dynamicNutrition.empty.hint') }}</p>
      <button type="button" class="primary-button" :disabled="saving" @click="generatePlan">
        <i class="pi" :class="saving ? 'pi-spin pi-spinner' : 'pi-sparkles'"></i>
        {{ saving ? t('dynamicNutrition.empty.generating') : t('dynamicNutrition.empty.generate') }}
      </button>
      <p v-if="generateMessage" class="generate-error"><i class="pi pi-info-circle"></i> {{ generateMessage }}</p>
    </div>

    <template v-else>
      <!-- Status cards -->
      <section class="status-cards">
        <article class="status-card">
          <header>
            <h3>{{ t('dynamicNutrition.cards.activePlan') }}</h3>
            <span class="pill pill-green">{{ plan.status }}</span>
          </header>
          <strong class="big">{{ t('dynamicNutrition.plan') }} #{{ plan.planCode }}</strong>
          <p class="muted">{{ plan.rationale?.summary || t('dynamicNutrition.cards.activePlanNote') }}</p>
        </article>

        <article class="status-card">
          <header>
            <h3>{{ t('dynamicNutrition.cards.linkedPlot') }}</h3>
            <span v-if="selectedPlot?.cropType" class="pill pill-soft">{{ selectedPlot.cropType }}</span>
          </header>
          <strong class="big">{{ selectedPlot?.name || '—' }}</strong>
          <p class="muted"><i class="pi pi-map-marker inline"></i> {{ selectedPlot?.location || '—' }} · {{ areaLabel }}</p>
          <router-link v-if="selectedPlot?.id" :to="`/agronomic/plots/${selectedPlot.id}`" class="ghost-button wide">
            <i class="pi pi-th-large"></i> {{ t('dynamicNutrition.cards.viewInMyPlots') }}
          </router-link>
        </article>

        <article class="status-card">
          <header><h3>{{ t('dynamicNutrition.cards.applicationWindow') }}</h3></header>
          <strong class="big">{{ formatWindow(plan.applicationWindow?.startDate, plan.applicationWindow?.endDate) }}</strong>
          <p class="muted">{{ t('dynamicNutrition.cards.windowNote') }}</p>
          <div class="divider"></div>
          <div class="climate-row">
            <span>{{ t('dynamicNutrition.cards.climate') }}</span>
            <span class="pill pill-green">{{ t('dynamicNutrition.stable') }}</span>
          </div>
        </article>

        <article class="status-card">
          <header><h3>{{ t('dynamicNutrition.cards.certification') }}</h3></header>
          <span class="pill" :class="plan.isCertified ? 'pill-green' : 'pill-red'">{{ plan.certificationStatus }}</span>
          <p class="muted">{{ plan.isCertified ? t('dynamicNutrition.cards.certifiedNote') : t('dynamicNutrition.cards.pendingNote') }}</p>
          <button type="button" class="ghost-button wide" @click="openCertify">
            <i class="pi pi-verified"></i> {{ t('dynamicNutrition.certify') }}
          </button>
        </article>
      </section>

      <!-- Recommended nutrition plan -->
      <section class="table-card">
        <header class="table-head">
          <div>
            <h2>{{ t('dynamicNutrition.table.title') }}</h2>
            <p class="muted">{{ plan.rationale?.summary }}</p>
          </div>
          <span class="pill pill-green">{{ plan.planCode }}</span>
        </header>

        <div class="plan-table">
          <div class="row row-head">
            <span>{{ t('dynamicNutrition.table.input') }}</span>
            <span>{{ t('dynamicNutrition.table.purpose') }}</span>
            <span>{{ t('dynamicNutrition.table.coverage') }}</span>
            <span>{{ t('dynamicNutrition.table.rate') }}</span>
            <span>{{ t('dynamicNutrition.table.status') }}</span>
          </div>
          <div v-for="input in plan.inputs" :key="input.name" class="row">
            <span class="cell-input"><strong>{{ input.name }}</strong></span>
            <span class="muted">{{ input.purpose }}</span>
            <span>{{ areaLabel }}</span>
            <span><strong>{{ input.dosage }} {{ input.dosageUnit }}</strong></span>
            <span>
              <span class="pill" :class="input.status === 'Recommended' ? 'pill-green' : 'pill-soft'">{{ input.status }}</span>
            </span>
          </div>
        </div>
      </section>

      <!-- Rationale + window -->
      <section class="two-col">
        <article class="info-card">
          <header>
            <i class="pi pi-file"></i>
            <div>
              <h3>{{ t('dynamicNutrition.rationale.title') }}</h3>
              <p class="muted">{{ t('dynamicNutrition.rationale.subtitle') }}</p>
            </div>
          </header>
          <div class="divider"></div>

          <div class="kv">
            <span><i class="pi pi-exclamation-triangle inline"></i> {{ t('dynamicNutrition.linkedAlert') }}</span>
            <strong class="accent-red">{{ plan.rationale?.triggeringRiskLevel || '—' }}</strong>
          </div>

          <div class="kv">
            <span><i class="pi pi-snowflake inline"></i> {{ t('dynamicNutrition.rationale.chill') }}</span>
            <strong class="accent-blue">{{ chillAccumulated }} / {{ chillThreshold }} CP</strong>
          </div>
          <div class="chill-bar">
            <span class="chill-fill" :style="{ width: `${chillProgress}%` }"></span>
          </div>
          <div class="chill-legend">
            <span>{{ chillAccumulated }} CP</span>
            <span class="accent-blue">{{ t('dynamicNutrition.rationale.gap') }}: {{ chillGap }} CP</span>
            <span>{{ chillThreshold }} CP</span>
          </div>

          <div class="kv">
            <span><i class="pi pi-bolt inline"></i> {{ t('dynamicNutrition.rationale.anomaly') }}</span>
            <strong class="accent-orange">{{ (plan.rationale?.temperatureAnomaly ?? 0) > 0 ? '+' : '' }}{{ plan.rationale?.temperatureAnomaly ?? 0 }}°C</strong>
          </div>

          <div class="kv">
            <span><i class="pi pi-shield inline"></i> {{ t('dynamicNutrition.rationale.yieldRisk') }}</span>
            <span class="pill pill-soft">{{ yieldRiskLabel }}</span>
          </div>

          <div class="note">
            <i class="pi pi-info-circle inline"></i> {{ t('dynamicNutrition.rationale.note') }}
          </div>
        </article>

        <article class="info-card">
          <header>
            <i class="pi pi-clock"></i>
            <div>
              <h3>{{ t('dynamicNutrition.window.title') }}</h3>
              <p class="muted">{{ t('dynamicNutrition.window.subtitle') }}</p>
            </div>
          </header>
          <div class="divider"></div>

          <div class="kv">
            <span><i class="pi pi-tag inline"></i> {{ t('dynamicNutrition.window.current') }}</span>
            <strong>{{ formatWindow(plan.applicationWindow?.startDate, plan.applicationWindow?.endDate) }}</strong>
          </div>

          <div class="timeline"><span class="timeline-fill"></span></div>
          <div class="timeline-legend">
            <span>{{ formatDate(plan.applicationWindow?.startDate) }}</span>
            <strong>{{ formatWindow(plan.applicationWindow?.startDate, plan.applicationWindow?.endDate) }}</strong>
            <span>{{ formatDate(plan.applicationWindow?.endDate) }}+</span>
          </div>

          <div class="kv">
            <span><i class="pi pi-cloud inline"></i> {{ t('dynamicNutrition.window.climateCheck') }}</span>
            <span class="dot-ok">{{ t('dynamicNutrition.window.stableConditions') }}</span>
          </div>

          <div class="note">
            <i class="pi pi-info-circle inline"></i> {{ t('dynamicNutrition.window.note') }}
          </div>
        </article>
      </section>

      <!-- Execution -->
      <section class="exec-card">
        <header>
          <i class="pi pi-bullseye"></i>
          <div>
            <h3>{{ t('dynamicNutrition.exec.title') }}</h3>
            <p class="muted">{{ t('dynamicNutrition.exec.subtitle') }}</p>
          </div>
        </header>

        <div class="exec-tiles">
          <div class="exec-tile">
            <span class="muted">{{ t('dynamicNutrition.exec.applicationStatus') }}</span>
            <span :class="plan.isCertified ? 'dot-ok' : 'dot-pending'">{{ plan.certificationStatus }}</span>
          </div>
          <div class="exec-tile">
            <span class="muted">{{ t('dynamicNutrition.exec.requiredCertification') }}</span>
            <span class="dot-pending">{{ t('dynamicNutrition.exec.dateAndInputs') }}</span>
          </div>
          <div class="exec-tile">
            <span class="muted">{{ t('dynamicNutrition.exec.expenseDeclaration') }}</span>
            <span :class="savedExpenseTotal != null ? 'dot-ok' : 'dot-pending'">
              {{ savedExpenseTotal != null ? t('dynamicNutrition.exec.declared') : t('dynamicNutrition.exec.pending') }}
            </span>
          </div>
        </div>

        <div class="exec-actions">
          <button type="button" class="ghost-button wide" @click="openCertify">
            <i class="pi pi-verified"></i> {{ t('dynamicNutrition.certify') }}
          </button>
          <button type="button" class="ghost-button wide" @click="openExpense">
            <i class="pi pi-save"></i> {{ t('dynamicNutrition.registerExpense') }}
          </button>
        </div>
      </section>
    </template>

    <!-- Certify modal -->
    <div v-if="showCertify && plan" class="modal-backdrop" @click.self="closeCertify">
      <div class="modal">
        <header class="modal-head">
          <div>
            <h2>{{ t('dynamicNutrition.certifyModal.title') }}</h2>
            <p class="muted">{{ t('dynamicNutrition.certifyModal.subtitle') }}</p>
          </div>
          <button type="button" class="icon-button" @click="closeCertify"><i class="pi pi-times"></i></button>
        </header>

        <div class="modal-body">
          <div class="field-row">
            <label>{{ t('dynamicNutrition.certifyModal.date') }}
              <input type="date" v-model="certForm.date" />
            </label>
            <label>{{ t('dynamicNutrition.certifyModal.time') }}
              <input type="time" v-model="certForm.time" />
            </label>
          </div>

          <label class="block-label">{{ t('dynamicNutrition.certifyModal.appliedInputs') }}</label>
          <div class="input-checks">
            <label v-for="input in plan.inputs" :key="input.name" class="check-row">
              <span>{{ input.name }} - {{ input.dosage }} {{ input.dosageUnit }}</span>
              <input type="checkbox" v-model="appliedInputs[input.name]" />
            </label>
          </div>

          <div class="field-row">
            <label>{{ t('dynamicNutrition.certifyModal.doseConfirmation') }}
              <select v-model="certForm.dose">
                <option value="Applied as recommended">{{ t('dynamicNutrition.certifyModal.doseRecommended') }}</option>
                <option value="Adjusted dose">{{ t('dynamicNutrition.certifyModal.doseAdjusted') }}</option>
                <option value="Partial application">{{ t('dynamicNutrition.certifyModal.dosePartial') }}</option>
              </select>
            </label>
            <label>{{ t('dynamicNutrition.certifyModal.fieldOperator') }}
              <input type="text" v-model="certForm.operator" />
            </label>
          </div>

          <label class="block-label">{{ t('dynamicNutrition.certifyModal.fieldNotes') }}
            <textarea rows="2" v-model="certForm.notes"></textarea>
          </label>

          <div class="info-banner">
            <i class="pi pi-info-circle inline"></i> {{ t('dynamicNutrition.certifyModal.note') }}
          </div>
        </div>

        <button type="button" class="primary-button block" :disabled="!canCertify" @click="submitCertify">
          <i class="pi" :class="saving ? 'pi-spin pi-spinner' : 'pi-verified'"></i>
          {{ t('dynamicNutrition.certifyModal.save') }}
        </button>
      </div>
    </div>

    <!-- Expense modal -->
    <div v-if="showExpense" class="modal-backdrop" @click.self="closeExpense">
      <div class="modal">
        <header class="modal-head">
          <div>
            <h2>{{ t('dynamicNutrition.expenseModal.title') }}</h2>
            <p class="muted">{{ t('dynamicNutrition.expenseModal.subtitle') }}</p>
          </div>
          <button type="button" class="icon-button" @click="closeExpense"><i class="pi pi-times"></i></button>
        </header>

        <div class="modal-body">
          <div class="field-row">
            <label>{{ t('dynamicNutrition.expenseModal.inputCost') }}
              <input type="number" min="0" v-model.number="expenseForm.input" />
            </label>
            <label>{{ t('dynamicNutrition.expenseModal.laborCost') }}
              <input type="number" min="0" v-model.number="expenseForm.labor" />
            </label>
          </div>
          <div class="field-row">
            <label>{{ t('dynamicNutrition.expenseModal.equipmentCost') }}
              <input type="number" min="0" v-model.number="expenseForm.equipment" />
            </label>
            <label>{{ t('dynamicNutrition.expenseModal.code') }}
              <input type="text" v-model="expenseForm.code" />
            </label>
          </div>
          <label class="block-label">{{ t('dynamicNutrition.expenseModal.notes') }}
            <textarea rows="2" v-model="expenseForm.notes"></textarea>
          </label>

          <div class="totals">
            <div class="total-row">
              <span class="muted">{{ t('dynamicNutrition.expenseModal.total') }}</span>
              <strong>S/ {{ expenseTotal.toFixed(2) }}</strong>
            </div>
            <div class="total-row">
              <span class="muted">{{ t('dynamicNutrition.expenseModal.margin') }}</span>
              <strong>{{ expenseMargin != null ? expenseMargin + '%' : '—' }}</strong>
            </div>
          </div>

          <div class="info-banner">
            <i class="pi pi-info-circle inline"></i> {{ t('dynamicNutrition.expenseModal.note') }}
          </div>
        </div>

        <button type="button" class="primary-button block" :disabled="!canSaveExpense" @click="submitExpense">
          <i class="pi pi-save"></i> {{ t('dynamicNutrition.expenseModal.save') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.nutrition-page {
  width: 100%;
  color: #1f2523;
  font-family: 'Poppins', sans-serif;
}


/* ---------- Quick actions ---------- */
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 22px;
  background: #ffffff;
  border-radius: 16px;
}

.qa-spacer {
  flex: 1;
}

.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
}

.ghost-button i {
  font-size: 16px;
}

.ghost-button:hover {
  background: #f3f6f2;
  color: #2e4a3a;
}

.ghost-button.wide {
  width: 100%;
  margin-top: 12px;
}

.plot-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid #e0dbd2;
  border-radius: 10px;
  background: #ffffff;
}

.picker-label {
  font-size: 13px;
  font-weight: 500;
  color: #4f4f4f;
}

.plot-select {
  min-width: 130px;
  border: none;
  background: transparent;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #2e4a3a;
  outline: none;
  cursor: pointer;
}

.linked-alert {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  background: #fdece6;
  color: #4f4f4f;
  font-size: 13px;
  font-weight: 500;
}

.linked-alert strong {
  color: #d45a19;
}

.linked-alert i {
  font-size: 16px;
  color: #d45a19;
}

/* ---------- Pills ---------- */
.pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.pill-green { background: #d9f2e3; color: #1f7a4d; }
.pill-red { background: #f6a59a; color: #7a2718; }
.pill-soft { background: #f5e2d6; color: #9a5b33; }

/* ---------- State boxes ---------- */
.state-box {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  min-height: 280px;
  padding: 40px;
  border-radius: 18px;
  background: #ffffff;
  text-align: center;
  color: #6b716d;
}

.empty-plan-icon {
  font-size: 44px;
  color: #2e8b57;
}

.empty-plan h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2523;
}

.empty-hint {
  max-width: 420px;
  font-size: 12px;
  color: #8a8f8b;
}

.generate-error {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 10px 16px;
  border-radius: 10px;
  background: #fbf3d6;
  color: #8a6d1f;
  font-size: 13px;
  font-weight: 500;
}

/* ---------- Status cards ---------- */
.status-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  margin-bottom: 22px;
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 22px 24px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.status-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.status-card h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.status-card .big {
  font-size: 24px;
  font-weight: 600;
  color: #1f2523;
}

.muted {
  margin: 0;
  color: #6b716d;
  font-size: 13px;
  font-weight: 400;
}

.inline {
  font-size: 15px;
  vertical-align: middle;
}

.divider {
  height: 1px;
  background: #efece6;
  margin: 6px 0;
}

.climate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #4f4f4f;
}

/* ---------- Table ---------- */
.table-card {
  padding: 24px 26px;
  margin-bottom: 22px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.table-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.table-head h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 500;
}

.plan-table {
  display: flex;
  flex-direction: column;
}

.plan-table .row {
  display: grid;
  grid-template-columns: 1.4fr 2fr 0.8fr 1.4fr 1fr;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #efece6;
  font-size: 13px;
}

.plan-table .row-head {
  border-top: none;
  color: #8a8f8b;
  font-weight: 500;
}

.cell-input strong {
  font-size: 14px;
}

/* ---------- Two-col info cards ---------- */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  margin-bottom: 22px;
}

.info-card,
.exec-card {
  padding: 24px 26px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.info-card header,
.exec-card header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-card header > i,
.exec-card header > i {
  font-size: 20px;
  color: #2e4a3a;
}

.info-card h3,
.exec-card h3 {
  margin: 0 0 2px;
  font-size: 18px;
  font-weight: 500;
}

.kv {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f4f1ec;
  font-size: 14px;
}

.kv span {
  color: #4f4f4f;
}

.accent-red { color: #d45a19; }
.accent-blue { color: #2f6df0; }
.accent-orange { color: #e07b2a; }

.chill-bar {
  height: 6px;
  border-radius: 999px;
  background: #eceef3;
  margin: 10px 0 6px;
  overflow: hidden;
}

.chill-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #2f6df0;
}

.chill-legend,
.timeline-legend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #8a8f8b;
  margin-bottom: 8px;
}

.timeline {
  height: 8px;
  border-radius: 999px;
  background: #eceef3;
  margin: 14px 0 6px;
  position: relative;
  overflow: hidden;
}

.timeline-fill {
  position: absolute;
  left: 30%;
  width: 40%;
  height: 100%;
  background: #f1b13a;
  border-radius: 999px;
}

.timeline-legend strong {
  color: #1f2523;
}

.dot-ok::before,
.dot-pending::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 7px;
  vertical-align: middle;
}

.dot-ok { color: #1f7a4d; font-weight: 500; }
.dot-ok::before { background: #1f7a4d; }
.dot-pending { color: #d45a19; font-weight: 500; }
.dot-pending::before { background: #d45a19; }

.note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  background: #f6f3ee;
  color: #6b716d;
  font-size: 12px;
  line-height: 1.4;
}

/* ---------- Execution ---------- */
.exec-card {
  margin-bottom: 22px;
}

.exec-tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin: 18px 0;
}

.exec-tile {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 12px;
  background: #f6f3ee;
  font-size: 13px;
}

.exec-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.exec-actions .ghost-button.wide {
  margin-top: 0;
}

/* ---------- Modals ---------- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 30, 0.45);
  backdrop-filter: blur(2px);
}

.modal {
  width: min(560px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 26px 28px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px solid #efece6;
}

.modal-head h2 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b716d;
  cursor: pointer;
}

.icon-button:hover {
  background: #f3f1ec;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.modal label,
.block-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #2e4a3a;
}

.modal input,
.modal select,
.modal textarea {
  padding: 10px 12px;
  border: 1px solid #d9d4cb;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  color: #1f2523;
}

.modal textarea {
  resize: vertical;
}

.input-checks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #ece8e1;
  border-radius: 12px;
}

.check-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #1f2523;
}

.check-row input {
  width: 18px;
  height: 18px;
}

.totals {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  background: #f6f3ee;
}

.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.total-row strong {
  font-size: 16px;
}

.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fbf3d6;
  color: #8a6d1f;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 22px;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #2e4a3a;
  color: #ffffff;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
}

.primary-button:disabled {
  background: #e2ded7;
  color: #9a958c;
  cursor: not-allowed;
}

.primary-button.block {
  width: 100%;
  margin-top: 18px;
  height: 48px;
}

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .status-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .two-col,
  .exec-actions {
    grid-template-columns: 1fr;
  }
  .exec-tiles {
    grid-template-columns: 1fr;
  }
  .plan-table .row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
