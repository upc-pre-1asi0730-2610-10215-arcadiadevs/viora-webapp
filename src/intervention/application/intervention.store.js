/**
 * Application service store for the `Intervention` bounded context (Expert Assistance).
 * Coordinates the real intervention-request aggregate (create + per-plot history)
 * and specialist recommendations.
 *
 * @module useInterventionStore
 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { InterventionApi } from "../infrastructure/intervention-api.js";
import { SpecialistCandidateAssembler } from "../infrastructure/specialist-candidate-response.js";
import { InterventionRequestAssembler } from "../infrastructure/intervention-request-response.js";
import { ServiceProposalAssembler } from "../infrastructure/service-proposal-response.js";
import { SpecialistContactAssembler } from "../infrastructure/specialist-contact-response.js";
import { SpecialistCandidate } from "../domain/model/specialist-candidate.entity.js";

const interventionApi = new InterventionApi();

/**
 * Presentation dataset of recommended specialists, kept as a fallback for when
 * the real candidates endpoint is unavailable or returns nothing.
 */
const PRESENTATION_SPECIALISTS = [
    new SpecialistCandidate({
        id: 890,
        name: 'Valeria Rojas',
        role: 'Phytosanitary specialist',
        successRate: 96,
        caseCount: 24,
        distanceKm: 6.4,
        tags: ['Xylella monitoring', 'Biological stress', 'Field inspection'],
        availability: 'today',
        bestMatch: true,
    }),
    new SpecialistCandidate({
        id: 891,
        name: 'Marco Salcedo',
        role: 'Agricultural pest technician',
        successRate: 92,
        caseCount: 17,
        distanceKm: 9.1,
        tags: ['Leaf symptoms', 'Low-vigor inspection', 'Treatment follow-up'],
        availability: 'tomorrow',
    }),
    new SpecialistCandidate({
        id: 892,
        name: 'Camila Torres',
        role: 'Crop health consultant',
        successRate: 94,
        caseCount: 31,
        distanceKm: 12.8,
        tags: ['Olive disease assessment', 'Technical prescriptions'],
        availability: 'week',
    }),
];

/**
 * Reactive store that exposes Expert Assistance commands and queries.
 * @returns {Object} Store state and actions.
 */
export const useInterventionStore = defineStore('intervention', () => {
    // ── State ──────────────────────────────────────────────────────────
    const specialists = ref([...PRESENTATION_SPECIALISTS]);
    const requests = ref([]);
    const requestsLoaded = ref(false);
    const activeProposal = ref(null);
    const activeContact = ref(null);
    const loading = ref({
        specialists: false,
        requests: false,
        submitting: false,
        case: false,
    });
    const errors = ref([]);
    const lastSyncedAt = ref(null);

    // ── Computed (Getters) ─────────────────────────────────────────────

    const availableSpecialists = computed(() =>
        specialists.value.filter((s) => s.isAvailable),
    );

    const availableSpecialistsCount = computed(() => availableSpecialists.value.length);

    const bestMatch = computed(() => {
        const available = availableSpecialists.value;
        return available.find((s) => s.bestMatch) ?? available[0] ?? null;
    });

    const pendingRequests = computed(() =>
        requests.value.filter((r) => r.isPending),
    );

    const pendingRequestsCount = computed(() => pendingRequests.value.length);

    const lastSyncLabel = computed(() => {
        if (!lastSyncedAt.value) return 'Not synced yet';
        const diffMinutes = Math.max(0, Math.round((Date.now() - lastSyncedAt.value) / 60000));
        if (diffMinutes < 1) return 'Updated just now';
        if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;
        return `Updated ${Math.round(diffMinutes / 60)} h ago`;
    });

    // ── Actions ────────────────────────────────────────────────────────

    async function loadSpecialists(alertId) {
        try {
            loading.value.specialists = true;
            const response = await interventionApi.getSpecialistCandidates(alertId, 3);
            const resources = response?.data ?? [];
            const mapped = SpecialistCandidateAssembler.toEntitiesFromResponse(resources);
            if (mapped.length > 0) {
                specialists.value = mapped;
            }
            lastSyncedAt.value = Date.now();
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value.specialists = false;
        }
    }

    async function loadRequests(plotId) {
        try {
            loading.value.requests = true;
            const response = await interventionApi.getRequestsByPlot(plotId);
            const resources = response?.data ?? [];
            requests.value = InterventionRequestAssembler.toEntitiesFromResponse(resources);
            requestsLoaded.value = true;
            lastSyncedAt.value = Date.now();
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value.requests = false;
        }
    }

    async function loadAllRequests() {
        try {
            loading.value.requests = true;
            const response = await interventionApi.getAllRequests();
            const resources = response?.data ?? [];
            requests.value = InterventionRequestAssembler.toEntitiesFromResponse(resources);
            requestsLoaded.value = true;
            lastSyncedAt.value = Date.now();
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value.requests = false;
        }
    }

    function findRequestByCode(code) {
        return requests.value.find((r) => r.referenceCode === code) ?? null;
    }

    async function loadCaseArtifacts(request) {
        activeProposal.value = null;
        activeContact.value = null;

        if (request.id == null) return;

        try {
            loading.value.case = true;
            const response = await interventionApi.getProposalsByRequest(request.id);
            const resources = response?.data ?? [];
            const proposals = ServiceProposalAssembler.toEntitiesFromResponse(resources);

            const proposal =
                proposals.find((p) => p.status === 'ACCEPTED') ?? proposals[proposals.length - 1] ?? null;
            activeProposal.value = proposal;

            if (request.status === 'ACCEPTED' && request.specialistId != null) {
                await loadContact(request.specialistId, request.id);
            }
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value.case = false;
        }
    }

    async function loadContact(specialistId, requestId) {
        try {
            const response = await interventionApi.getSpecialistContact(specialistId, requestId);
            const resource = response?.data;
            if (resource) {
                activeContact.value = SpecialistContactAssembler.toEntityFromResource(resource);
            } else {
                activeContact.value = null;
            }
        } catch {
            activeContact.value = null;
        }
    }

    async function acceptProposal(code, onDone) {
        const request = findRequestByCode(code);
        const proposal = activeProposal.value;
        if (!request || proposal?.id == null) {
            onDone?.(false);
            return;
        }

        try {
            const response = await interventionApi.updateProposalStatus(proposal.id, 'ACCEPTED');
            const resource = response?.data;
            if (resource) {
                activeProposal.value = ServiceProposalAssembler.toEntityFromResource(resource);
            }
            if (request.plotId != null) {
                await loadRequests(request.plotId);
            }
            if (request.specialistId != null && request.id != null) {
                await loadContact(request.specialistId, request.id);
            }
            onDone?.(true);
        } catch (error) {
            errors.value.push(error);
            onDone?.(false);
        }
    }

    async function declineProposal(code, reason, onDone) {
        const request = findRequestByCode(code);
        if (!request || request.id == null) {
            onDone?.(false);
            return;
        }

        try {
            const proposal = activeProposal.value;
            if (proposal?.id != null) {
                await interventionApi.updateProposalStatus(proposal.id, 'REJECTED', reason);
            } else {
                await interventionApi.declineRequest(request.id, reason);
            }
            activeProposal.value = null;
            activeContact.value = null;
            if (request.plotId != null) {
                await loadRequests(request.plotId);
            }
            onDone?.(true);
        } catch (error) {
            errors.value.push(error);
            onDone?.(false);
        }
    }

    async function submitRequest(request, onDone) {
        try {
            loading.value.submitting = true;
            const response = await interventionApi.createRequest(request);
            const resource = response?.data;
            if (resource) {
                const created = InterventionRequestAssembler.toEntityFromResource(resource);
                await loadRequests(request.plotId);
                onDone?.(created);
            } else {
                onDone?.(null);
            }
        } catch (error) {
            errors.value.push(error);
            onDone?.(null);
        } finally {
            loading.value.submitting = false;
        }
    }

    function specialistName(specialistId) {
        if (specialistId == null) return '\u2014';
        const match = specialists.value.find(
            (s) => String(s.id) === String(specialistId),
        );
        return match?.name ?? `Specialist #${specialistId}`;
    }

    function clearErrors() {
        errors.value = [];
    }

    return {
        specialists,
        requests,
        requestsLoaded,
        activeProposal,
        activeContact,
        loading,
        errors,
        lastSyncedAt,
        availableSpecialists,
        availableSpecialistsCount,
        bestMatch,
        pendingRequests,
        pendingRequestsCount,
        lastSyncLabel,
        loadSpecialists,
        loadRequests,
        loadAllRequests,
        findRequestByCode,
        loadCaseArtifacts,
        loadContact,
        acceptProposal,
        declineProposal,
        submitRequest,
        specialistName,
        clearErrors,
    };
});

export default useInterventionStore;
