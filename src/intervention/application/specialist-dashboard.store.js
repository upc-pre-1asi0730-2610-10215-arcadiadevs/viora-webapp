/**
 * Application store for the Specialist segment dashboard. Loads the read
 * model once and caches it, exposes the monthly/annual performance toggle,
 * and drives the verify/decline actions on incoming producer requests.
 *
 * @module useSpecialistDashboardStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SpecialistDashboardApi } from '../infrastructure/specialist-dashboard-api.js';
import { SpecialistDashboardAssembler } from '../infrastructure/specialist-dashboard-response.js';

const specialistDashboardApi = new SpecialistDashboardApi();

/**
 * Reactive store that exposes the Specialist dashboard read model and actions.
 * @returns {Object} Store state and actions.
 */
export const useSpecialistDashboardStore = defineStore('specialist-dashboard', () => {
    // ── State ──────────────────────────────────────────────────────────
    const dashboard = ref(null);
    const loaded = ref(false);
    const loading = ref(false);
    const performanceView = ref('annual');
    const errors = ref([]);

    // ── Computed (Getters) ─────────────────────────────────────────────
    const kpis = computed(() => dashboard.value?.kpis ?? null);
    const zonalRisks = computed(() => dashboard.value?.zonalRisks ?? []);
    const incomingRequests = computed(() => dashboard.value?.incomingRequests ?? []);
    const updatedAt = computed(() => dashboard.value?.updatedAt ?? null);

    const performanceSeries = computed(() => {
        if (!dashboard.value) return [];
        return performanceView.value === 'monthly'
            ? dashboard.value.performanceMonthly
            : dashboard.value.performanceAnnual;
    });

    // ── Actions ────────────────────────────────────────────────────────

    /** Loads the dashboard once; later calls reuse the cached read model. */
    async function load() {
        if (loaded.value || loading.value) return;
        await fetch();
    }

    /** Forces a reload (header refresh button). */
    async function refresh() {
        if (loading.value) return;
        await fetch();
    }

    function setPerformanceView(view) {
        performanceView.value = view;
    }

    /** Verifies (accepts) an incoming request, then drops it from the queue. */
    async function verify(request) {
        await settleRequest(request, () => specialistDashboardApi.verifyRequest(request.id));
    }

    /** Declines an incoming request, then drops it from the queue. */
    async function decline(request, reason = '') {
        await settleRequest(request, () => specialistDashboardApi.declineRequest(request.id, reason));
    }

    // ── Private helpers ────────────────────────────────────────────────

    async function fetch() {
        try {
            loading.value = true;
            const response = await specialistDashboardApi.getDashboard();
            dashboard.value = SpecialistDashboardAssembler.toEntityFromResource(response?.data ?? {});
        } catch (error) {
            // Endpoint not reachable yet or a transient failure. Surface a real
            // empty state — never fabricated data.
            dashboard.value = null;
            errors.value.push(error);
        } finally {
            loading.value = false;
            loaded.value = true;
        }
    }

    /**
     * Optimistically removes the request from the incoming queue, then calls
     * the action against the backend. On failure, reloads so the view
     * reconciles with the backend (the request may still be pending).
     */
    async function settleRequest(request, action) {
        removeIncomingRequest(request.id);
        try {
            await action();
        } catch (error) {
            errors.value.push(error);
            await refresh();
        }
    }

    function removeIncomingRequest(id) {
        if (!dashboard.value) return;
        dashboard.value.incomingRequests = dashboard.value.incomingRequests.filter((item) => item.id !== id);
    }

    return {
        dashboard,
        loaded,
        loading,
        performanceView,
        errors,
        kpis,
        zonalRisks,
        incomingRequests,
        updatedAt,
        performanceSeries,
        load,
        refresh,
        setPerformanceView,
        verify,
        decline,
    };
});

export default useSpecialistDashboardStore;
