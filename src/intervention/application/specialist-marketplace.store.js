/**
 * Application store for the specialist Intervention Marketplace. Loads the
 * real read model once and caches it (mirroring the specialist dashboard),
 * and drives the two case actions — submit a proposal, decline — against the
 * real backend.
 *
 * No simulated data: when the endpoint is unavailable the view shows a real
 * empty state and the `errors` array is populated, never fabricated cases.
 * Both actions optimistically remove the case from the inbox (it leaves the
 * specialist's PENDING queue on the backend); a failure reloads so the view
 * reconciles.
 *
 * @module useSpecialistMarketplaceStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SpecialistMarketplaceApi } from '../infrastructure/specialist-marketplace-api.js';
import { SpecialistMarketplaceAssembler } from '../infrastructure/specialist-marketplace-response.js';

const specialistMarketplaceApi = new SpecialistMarketplaceApi();

/**
 * Reactive store that exposes the specialist marketplace read model and actions.
 * @returns {Object} Store state and actions.
 */
export const useSpecialistMarketplaceStore = defineStore('specialist-marketplace', () => {
    // ── State ──────────────────────────────────────────────────────────
    const marketplace = ref(null);
    const loaded = ref(false);
    const loading = ref(false);
    const errors = ref([]);
    const submitting = ref(false);

    // ── Computed (Getters) ─────────────────────────────────────────────
    const cases = computed(() => marketplace.value?.cases ?? []);
    const newCasesCount = computed(() => cases.value.length);
    const acceptanceRatePercent = computed(() => marketplace.value?.acceptanceRatePercent ?? null);
    const activeCasesCount = computed(() => marketplace.value?.activeCasesCount ?? 0);
    const updatedAt = computed(() => marketplace.value?.updatedAt ?? null);

    // ── Actions ────────────────────────────────────────────────────────

    /** Loads the marketplace once; later calls reuse the cached read model. */
    async function load() {
        if (loaded.value || loading.value) return;
        await fetch();
    }

    /** Forces a reload (header refresh button). */
    async function refresh() {
        if (loading.value) return;
        await fetch();
    }

    /**
     * Submits a proposal for a case, then drops it from the inbox. Reports the
     * outcome so the view can close the modal or surface a failure.
     */
    async function submitProposal(caseItem, payload, onDone) {
        if (caseItem.specialistId == null) {
            onDone?.(false);
            return;
        }

        try {
            submitting.value = true;
            await specialistMarketplaceApi.submitProposal({
                interventionRequestId: caseItem.id,
                specialistId: caseItem.specialistId,
                ...payload,
            });
            removeCase(caseItem.id);
            onDone?.(true);
        } catch (error) {
            errors.value.push(error);
            onDone?.(false);
        } finally {
            submitting.value = false;
        }
    }

    /** Declines a case, then drops it from the inbox. */
    async function decline(caseItem, reason = '') {
        removeCase(caseItem.id);
        try {
            await specialistMarketplaceApi.declineCase(caseItem.id, reason);
        } catch (error) {
            errors.value.push(error);
            await refresh();
        }
    }

    // ── Private helpers ────────────────────────────────────────────────

    async function fetch() {
        try {
            loading.value = true;
            const response = await specialistMarketplaceApi.getMarketplace();
            marketplace.value = SpecialistMarketplaceAssembler.toEntityFromResource(response?.data ?? {});
        } catch (error) {
            // Endpoint not reachable yet or a transient failure. Surface a real
            // empty state — never fabricated data.
            marketplace.value = null;
            errors.value.push(error);
        } finally {
            loading.value = false;
            loaded.value = true;
        }
    }

    function removeCase(id) {
        if (!marketplace.value) return;
        marketplace.value.cases = marketplace.value.cases.filter((item) => item.id !== id);
    }

    return {
        marketplace,
        loaded,
        loading,
        errors,
        submitting,
        cases,
        newCasesCount,
        acceptanceRatePercent,
        activeCasesCount,
        updatedAt,
        load,
        refresh,
        submitProposal,
        decline,
    };
});

export default useSpecialistMarketplaceStore;
