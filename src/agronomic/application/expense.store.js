import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ExpenseApi } from '../infrastructure/expense-api.js';
import { ExpenseAssembler } from '../infrastructure/expense-response.js';

const expenseApi = new ExpenseApi();

export const useExpenseStore = defineStore('expense', () => {
  const expenses = ref([]);
  const expensesLoaded = ref(false);
  const loadingExpenses = ref(false);
  const loadingSubmitting = ref(false);
  const errors = ref([]);
  const lastSyncedAt = ref(null);
  const pendingRecords = ref(0);

  const expenseCount = computed(() => expenses.value.length);
  const totalExpenses = computed(() => expenses.value.reduce((sum, e) => sum + e.amount, 0));
  const climateTotal = computed(() => sumByType('CLIMATE_MITIGATION'));
  const pestTotal = computed(() => sumByType('PEST_INTERVENTION'));

  const highestCostDriver = computed(() => {
    if (expenses.value.length === 0) return null;
    return pestTotal.value > climateTotal.value ? 'PEST_INTERVENTION' : 'CLIMATE_MITIGATION';
  });

  const highestCostDriverLabel = computed(() => {
    switch (highestCostDriver.value) {
      case 'PEST_INTERVENTION': return 'Pest intervention';
      case 'CLIMATE_MITIGATION': return 'Climate mitigation';
      default: return '\u2014';
    }
  });

  const lastSyncLabel = computed(() => {
    if (!lastSyncedAt.value) return 'Not synced yet';
    const diffMinutes = Math.max(0, Math.round((Date.now() - lastSyncedAt.value) / 60000));
    if (diffMinutes < 1) return 'Updated just now';
    if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;
    return `Updated ${Math.round(diffMinutes / 60)} h ago`;
  });

  function sumByType(type) {
    return expenses.value.filter(e => e.type === type).reduce((sum, e) => sum + e.amount, 0);
  }

  async function loadExpenses(plotId = null) {
    loadingExpenses.value = true;
    try {
      const response = await expenseApi.getExpenses(plotId);
      expenses.value = ExpenseAssembler.toEntitiesFromResponse(response);
      expensesLoaded.value = true;
      lastSyncedAt.value = Date.now();
    } catch (error) {
      errors.value.push(error);
    } finally {
      loadingExpenses.value = false;
    }
  }

  async function submitExpense(request, onDone) {
    loadingSubmitting.value = true;
    try {
      const response = await expenseApi.createExpense(request);
      const data = response?.data ?? null;
      const created = data ? ExpenseAssembler.toEntityFromResource(data) : null;
      onDone?.(created);
    } catch (error) {
      errors.value.push(error);
      onDone?.(null);
    } finally {
      loadingSubmitting.value = false;
    }
  }

  async function recordFromSpecialistIntervention({ plotId, interventionReferenceCode, amount, currency, serviceTitle }) {
    return submitExpense({
      plotId,
      type: 'PEST_INTERVENTION',
      category: 'SPECIALIST',
      linkedActionCode: interventionReferenceCode || undefined,
      amount,
      currency,
      expenseDate: new Date().toISOString().slice(0, 10),
      paymentStatus: 'PENDING',
      note: serviceTitle || undefined,
      status: 'ALERT_CONFIRMED',
    });
  }

  return {
    expenses,
    expensesLoaded,
    loadingExpenses,
    loadingSubmitting,
    errors,
    lastSyncedAt,
    pendingRecords,
    expenseCount,
    totalExpenses,
    climateTotal,
    pestTotal,
    highestCostDriver,
    highestCostDriverLabel,
    lastSyncLabel,
    loadExpenses,
    submitExpense,
    recordFromSpecialistIntervention
  };
});

export default useExpenseStore;
