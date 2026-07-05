<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgronomicStore } from '../../application/agronomic.store.js';
import { useExpenseStore } from '../../application/expense.store.js';
import { Expense } from '../../domain/model/expense.entity.js';
import DashboardHeader from '../../../shared/presentation/components/dashboard-header.vue';

const { t } = useI18n();
const agronomicStore = useAgronomicStore();
const expenseStore = useExpenseStore();

const breadcrumbs = [
  { label: 'Expense History', disabled: true },
  { label: 'Overview', disabled: true }
];

const selectedScope = ref('all');
const modalOpen = ref(false);
const formType = ref('CLIMATE_MITIGATION');
const formPlotId = ref(null);
const formLinkedAction = ref('');
const formCategory = ref('INPUTS');
const formAmount = ref('');
const formDate = ref(new Date().toISOString().slice(0, 10));
const formPayment = ref('PAID');
const formNote = ref('');

const isAllScope = computed(() => selectedScope.value === 'all');

const selectedPlot = computed(() => {
  if (isAllScope.value) return null;
  return agronomicStore.plots.find(p => String(p.id) === String(selectedScope.value)) || null;
});

const scopeLabel = computed(() => {
  return isAllScope.value ? 'All plots' : selectedPlot.value?.name ?? 'Plot';
});

const expensesByPlot = computed(() => {
  const groups = new Map();
  for (const expense of expenseStore.expenses) {
    const key = String(expense.plotId ?? '\u2014');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(expense);
  }

  const rows = [...groups.entries()].map(([key, items]) => {
    const total = items.reduce((sum, e) => sum + e.amount, 0);
    const dominantType = dominantTypeFn(items);
    const plotName = agronomicStore.plots.find(p => String(p.id) === key)?.name ?? `Plot #${key}`;
    return {
      plotId: items[0]?.plotId ?? null,
      name: plotName,
      total,
      totalLabel: Expense.formatMoney(total),
      count: items.length,
      caption: `${typeLabelFn(dominantType)} \u00B7 ${items.length} ${items.length === 1 ? 'record' : 'records'}`,
      barWidth: 0,
      barClass: dominantType === 'PEST_INTERVENTION' ? 'bar-pest' : 'bar-climate'
    };
  });

  rows.sort((a, b) => b.total - a.total);
  const max = rows[0]?.total ?? 0;
  return rows.map(row => ({
    ...row,
    barWidth: max > 0 ? Math.round((row.total / max) * 100) : 0
  }));
});

const mostAffectedPlotName = computed(() => expensesByPlot.value[0]?.name ?? '\u2014');

const impactNote = computed(() => {
  const driver = expenseStore.highestCostDriver;
  if (driver === 'PEST_INTERVENTION') {
    return 'Expenses are concentrated in phytosanitary response. Review intervention outcomes before the next campaign investment decision.';
  }
  if (driver === 'CLIMATE_MITIGATION') {
    return 'Expenses are concentrated in climate/nutrition mitigation. Review phenological risk before the next campaign investment decision.';
  }
  return 'No expenses registered yet for this scope.';
});

const canSave = computed(() => {
  return formPlotId.value != null &&
    Number(formAmount.value) >= 0 &&
    formAmount.value.trim().length > 0 &&
    formDate.value.trim().length > 0 &&
    !expenseStore.loadingSubmitting;
});

function typeLabelFn(type) {
  return type === 'PEST_INTERVENTION' ? 'Pest intervention' : 'Climate mitigation';
}

function dominantTypeFn(items) {
  const pest = items.filter(e => e.type === 'PEST_INTERVENTION').reduce((sum, e) => sum + e.amount, 0);
  const climate = items.filter(e => e.type === 'CLIMATE_MITIGATION').reduce((sum, e) => sum + e.amount, 0);
  return pest > climate ? 'PEST_INTERVENTION' : 'CLIMATE_MITIGATION';
}

function onSelectScope(value) {
  selectedScope.value = value;
  expenseStore.loadExpenses(isAllScope.value ? null : selectedScope.value);
}

function refresh() {
  expenseStore.loadExpenses(isAllScope.value ? null : selectedScope.value);
}

function openRegister() {
  formType.value = 'CLIMATE_MITIGATION';
  formPlotId.value = isAllScope.value
    ? (agronomicStore.plots.find(p => p.id != null)?.id ?? null)
    : selectedScope.value;
  formLinkedAction.value = '';
  formCategory.value = 'INPUTS';
  formAmount.value = '';
  formDate.value = new Date().toISOString().slice(0, 10);
  formPayment.value = 'PAID';
  formNote.value = '';
  modalOpen.value = true;
}

function closeRegister() {
  modalOpen.value = false;
}

function saveExpense() {
  if (!canSave.value) return;
  expenseStore.submitExpense({
    plotId: Number(formPlotId.value),
    type: formType.value,
    category: formCategory.value,
    linkedActionCode: formLinkedAction.value.trim() || undefined,
    amount: Number(formAmount.value),
    currency: 'PEN',
    expenseDate: formDate.value,
    paymentStatus: formPayment.value,
    note: formNote.value.trim() || undefined
  }, (created) => {
    if (created) {
      modalOpen.value = false;
      refresh();
    }
  });
}

function exportCsv() {
  const rows = expenseStore.expenses;
  if (rows.length === 0) return;

  const header = ['Date', 'Plot', 'Type', 'Linked action', 'Category', 'Amount', 'Currency', 'Status'];
  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = rows.map(expense => [
    expense.expenseDate ?? '',
    agronomicStore.plots.find(p => String(p.id) === String(expense.plotId))?.name ?? 'Unknown',
    expense.typeLabel,
    expense.linkedActionCode || '',
    expense.categoryLabel,
    expense.amount.toFixed(2),
    expense.currency,
    expense.statusLabel
  ].map(cell => escape(cell)).join(','));

  const csv = [header.map(escape).join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `expenses-${isAllScope.value ? 'all-plots' : scopeLabel.value}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

onMounted(() => {
  agronomicStore.fetchPlots();
  expenseStore.loadExpenses(null);
});
</script>

<template>
  <section class="expense-page">
    <DashboardHeader
      :breadcrumbs="breadcrumbs"
      subtitle="Track mitigation and intervention costs across your plots."
      :updated-label="expenseStore.lastSyncLabel"
      @refresh="refresh"
    />

    <!-- Toolbar -->
    <div class="toolbar">
      <label class="scope-field">
        <span class="scope-icon">&#x1F4CD;</span>
        <span class="scope-label">Plot:</span>
        <select :value="selectedScope" @change="onSelectScope($event.target.value)">
          <option value="all">All plots</option>
          <option v-for="plot in agronomicStore.plots" :key="plot.id" :value="plot.id">{{ plot.name }}</option>
        </select>
      </label>
      <button class="primary-button" @click="openRegister">+ Register expense</button>
    </div>

    <!-- KPI cards -->
    <section class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-head">
          <h2>Total expenses</h2>
          <span class="kpi-pill kpi-pill--green">Current campaign</span>
        </div>
        <span class="kpi-value kpi-value--primary">{{ Expense.formatMoney(expenseStore.totalExpenses) }}</span>
        <p class="kpi-foot">Recorded during the current campaign.</p>
      </div>

      <div class="kpi-card">
        <div class="kpi-head"><h2>Climate mitigation</h2></div>
        <span class="kpi-value kpi-value--blue">{{ Expense.formatMoney(expenseStore.climateTotal) }}</span>
        <p class="kpi-foot">Nutrition and corrective actions linked to phenological risk.</p>
      </div>

      <div class="kpi-card">
        <div class="kpi-head"><h2>Pest intervention</h2></div>
        <span class="kpi-value kpi-value--amber">{{ Expense.formatMoney(expenseStore.pestTotal) }}</span>
        <p class="kpi-foot">Treatment-related costs linked to phytosanitary alerts.</p>
      </div>

      <div class="kpi-card kpi-card--danger">
        <div class="kpi-head">
          <h2>Pending records</h2>
          <span v-if="expenseStore.pendingRecords > 0" class="kpi-pill kpi-pill--danger">Action required</span>
        </div>
        <span class="kpi-value kpi-value--red">{{ expenseStore.pendingRecords }}</span>
        <p class="kpi-foot">Certified actions without registered expense yet.</p>
      </div>
    </section>

    <!-- Expense records -->
    <div class="section-card">
      <div class="section-head">
        <div>
          <h2 class="section-title">Expense records</h2>
          <p class="section-subtitle">Registered costs for {{ scopeLabel }}, linked to mitigation and intervention actions.</p>
        </div>
        <button class="ghost-button ghost-button--sm" @click="exportCsv">Export</button>
      </div>

      <div class="records-table">
        <div class="records-header">
          <span>Date</span><span>Plot</span><span>Type</span><span>Linked action</span>
          <span>Category</span><span>Amount</span><span>Status</span>
        </div>

        <div v-if="expenseStore.loadingExpenses && expenseStore.expenses.length === 0" class="records-state">
          Loading expenses...
        </div>
        <div v-else-if="expenseStore.expenses.length === 0" class="records-state">
          No expenses registered for this scope yet.
        </div>
        <template v-else>
          <div v-for="expense in expenseStore.expenses" :key="expense.id" class="records-row">
            <span>{{ expense.dateLabel }}</span>
            <span>{{ agronomicStore.plots.find(p => String(p.id) === String(expense.plotId))?.name ?? 'Unknown' }}</span>
            <span><span class="pill" :class="expense.typeClass">{{ expense.typeTag }}</span></span>
            <span class="linked-action">{{ expense.linkedActionCode || '\u2014' }}</span>
            <span>{{ expense.categoryLabel }}</span>
            <span class="amount">{{ expense.amountLabel }}</span>
            <span><span class="pill" :class="expense.statusClass">{{ expense.statusLabel }}</span></span>
          </div>
        </template>
      </div>
    </div>

    <!-- Bottom grid -->
    <div class="bottom-grid">
      <div class="section-card">
        <h2 class="section-title">Financial impact summary</h2>
        <div class="impact-rows">
          <div class="impact-row">
            <span class="impact-label">Campaign expense</span>
            <strong>{{ Expense.formatMoney(expenseStore.totalExpenses) }}</strong>
          </div>
          <div class="impact-row">
            <span class="impact-label">Highest cost driver</span>
            <span v-if="expenseStore.highestCostDriver" class="pill"
              :class="expenseStore.highestCostDriver === 'PEST_INTERVENTION' ? 'type-pest' : 'type-climate'">
              {{ expenseStore.highestCostDriverLabel }}
            </span>
            <strong v-else>\u2014</strong>
          </div>
          <div class="impact-row">
            <span class="impact-label">Most affected plot</span>
            <strong>{{ mostAffectedPlotName }}</strong>
          </div>
          <div class="impact-row">
            <span class="impact-label">Registered records</span>
            <strong>{{ expenseStore.expenseCount }}</strong>
          </div>
        </div>
        <div class="impact-note">{{ impactNote }}</div>
      </div>

      <div class="section-card">
        <div class="section-head">
          <h2 class="section-title">Expense by plot</h2>
          <span class="kpi-pill kpi-pill--muted">{{ expensesByPlot.length }} {{ expensesByPlot.length === 1 ? 'plot' : 'plots' }}</span>
        </div>
        <div v-if="expensesByPlot.length === 0" class="records-state">No expenses to break down yet.</div>
        <div v-else class="plot-list">
          <div v-for="group in expensesByPlot" :key="group.plotId" class="plot-row">
            <div class="plot-row-head">
              <div class="plot-identity">
                <span class="plot-name">{{ group.name }}</span>
                <span class="plot-caption">{{ group.caption }}</span>
              </div>
              <strong class="plot-total">{{ group.totalLabel }}</strong>
            </div>
            <div class="plot-bar">
              <span class="plot-bar-fill" :class="group.barClass" :style="{ width: group.barWidth + '%' }"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeRegister">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2>Register expense</h2>
            <p class="modal-subtitle">Record a mitigation or intervention cost and link it to a plot action.</p>
          </div>
          <button class="modal-close" @click="closeRegister">&times;</button>
        </div>

        <div class="modal-grid">
          <label class="field">
            <span>Expense type</span>
            <select v-model="formType">
              <option value="CLIMATE_MITIGATION">Climate mitigation</option>
              <option value="PEST_INTERVENTION">Pest intervention</option>
            </select>
          </label>
          <label class="field">
            <span>Linked plot</span>
            <select v-model="formPlotId">
              <option v-for="plot in agronomicStore.plots" :key="plot.id" :value="plot.id">{{ plot.name }}</option>
            </select>
          </label>
        </div>

        <label class="field">
          <span>Linked action</span>
          <input type="text" v-model="formLinkedAction" placeholder="e.g. DN-042, INT-011 (optional)" />
        </label>

        <div class="modal-grid">
          <label class="field">
            <span>Category</span>
            <select v-model="formCategory">
              <option value="INPUTS">Inputs</option>
              <option value="LABOR">Labor</option>
              <option value="SPECIALIST">Specialist</option>
            </select>
          </label>
          <label class="field">
            <span>Amount (S/)</span>
            <input type="number" v-model="formAmount" min="0" step="0.01" placeholder="0.00" />
          </label>
        </div>

        <div class="modal-grid">
          <label class="field">
            <span>Date</span>
            <input type="date" v-model="formDate" />
          </label>
          <label class="field">
            <span>Payment status</span>
            <select v-model="formPayment">
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </label>
        </div>

        <label class="field">
          <span>Note (optional)</span>
          <textarea v-model="formNote" rows="3" placeholder="Add a short description of the expense, supplier, or field context..."></textarea>
        </label>

        <div class="modal-actions">
          <button class="ghost-button" @click="closeRegister">Cancel</button>
          <button class="primary-button" :disabled="!canSave" @click="saveExpense">
            {{ expenseStore.loadingSubmitting ? 'Saving...' : 'Save expense' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.expense-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
  font-family: 'Poppins', sans-serif;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.scope-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e2ddd4;
  background: #ffffff;
}

.scope-icon { font-size: 14px; }
.scope-label { font-size: 13px; font-weight: 500; color: #6f6a62; }

.scope-field select {
  border: none;
  outline: none;
  background: transparent;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
}

/* KPI cards */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 24px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid transparent;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.kpi-card--danger { border-color: #e53535; }
.kpi-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.kpi-card h2 { margin: 0; font-size: 18px; font-weight: 500; color: #1f2523; }
.kpi-value { font-size: 32px; font-weight: 500; line-height: 1.1; }
.kpi-value--primary { color: #2e4a3a; }
.kpi-value--blue { color: #004fc4; }
.kpi-value--amber { color: #a07d0f; }
.kpi-value--red { color: #e53535; }
.kpi-foot { margin: 0; font-size: 14px; font-weight: 500; color: #4f4f4f; }
.kpi-pill { align-self: flex-start; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 500; white-space: nowrap; }
.kpi-pill--green { background: rgba(87, 235, 161, 0.22); color: #2e7d55; }
.kpi-pill--danger { background: rgba(229, 53, 53, 0.14); color: #e53535; }
.kpi-pill--muted { background: #f0ebe3; color: #8c877f; }

/* Section cards */
.section-card {
  padding: 22px 24px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(31, 37, 35, 0.05);
}

.section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 20px; }
.section-title { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 18px; font-weight: 500; color: #1f2523; }
.section-subtitle { margin: 4px 0 0; font-size: 14px; font-weight: 400; color: #828282; }

/* Buttons */
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  border-radius: 10px;
  border: none;
  background: #2e4a3a;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

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
  color: #333;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 500;
  background: #fff;
  cursor: pointer;
}

.ghost-button--sm { height: 34px; padding: 0 14px; }

/* Records table */
.records-table { display: grid; }
.records-header, .records-row {
  display: grid;
  grid-template-columns: minmax(100px, 0.9fr) minmax(110px, 1fr) minmax(90px, 0.7fr) minmax(110px, 0.9fr) minmax(90px, 0.8fr) minmax(100px, 0.8fr) minmax(120px, 0.9fr);
  align-items: center;
  gap: 14px;
  padding: 0 4px;
}
.records-header { min-height: 46px; color: #6f6a62; font-size: 12px; font-weight: 500; }
.records-row { min-height: 62px; border-top: 1px solid #f0ece4; font-size: 13px; color: #333; }
.linked-action { font-weight: 500; color: #1f2523; }
.amount { font-weight: 600; color: #1f2523; }
.records-state { min-height: 110px; display: grid; place-items: center; color: #8a8f8b; font-size: 13px; }

/* Pills */
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

.type-climate { background: rgba(0, 79, 196, 0.12); color: #004fc4; }
.type-pest { background: rgba(193, 90, 46, 0.14); color: #c15a2e; }
.status-registered { background: rgba(87, 235, 161, 0.22); color: #2e7d55; }
.status-alert { background: rgba(193, 90, 46, 0.14); color: #c15a2e; }

/* Bottom grid */
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.impact-rows { display: flex; flex-direction: column; }
.impact-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; border-top: 1px solid #f0ece4; font-size: 14px; }
.impact-row:first-child { border-top: none; }
.impact-label { display: inline-flex; align-items: center; gap: 10px; color: #4f4f4f; font-weight: 500; }
.impact-row strong { color: #1f2523; font-weight: 600; }
.impact-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; padding: 14px 16px; border-radius: 12px; background: #f4f7f4; font-size: 12px; color: #4f6a58; }

/* Expense by plot */
.plot-list { display: flex; flex-direction: column; gap: 22px; }
.plot-row-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.plot-identity { display: flex; flex-direction: column; gap: 2px; }
.plot-name { font-size: 14px; font-weight: 600; color: #1f2523; }
.plot-caption { font-size: 12px; font-weight: 400; color: #828282; }
.plot-total { font-size: 16px; font-weight: 600; color: #1f2523; }
.plot-bar { height: 8px; border-radius: 999px; background: #f0ece4; overflow: hidden; }
.plot-bar-fill { display: block; height: 100%; border-radius: 999px; min-width: 6px; }
.bar-climate { background: #004fc4; }
.bar-pest { background: #c15a2e; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: rgba(31, 37, 35, 0.45); }
.modal { width: min(560px, 100%); max-height: 90vh; overflow-y: auto; padding: 24px 26px; border-radius: 16px; background: #fff; box-shadow: 0 24px 60px rgba(31, 37, 35, 0.25); display: flex; flex-direction: column; gap: 16px; }
.modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.modal-head h2 { margin: 0; font-size: 20px; font-weight: 600; color: #1f2523; }
.modal-subtitle { margin: 4px 0 0; font-size: 13px; color: #6f6a62; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6f6a62; padding: 0 4px; }
.modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field > span { font-size: 13px; font-weight: 500; color: #333; }
.field select, .field input, .field textarea {
  padding: 10px 12px;
  border: 1px solid #e2ddd4;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #333;
  outline: none;
  background: #fff;
}
.field textarea { resize: vertical; }
.field select { cursor: pointer; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 4px; }

/* Responsive */
@media (max-width: 1180px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .bottom-grid { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .modal-grid { grid-template-columns: 1fr; }
  .records-header { display: none; }
  .records-row { grid-template-columns: 1fr 1fr; gap: 8px; padding: 14px 4px; }
}
</style>
