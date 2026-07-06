/**
 * Application store for the Interventions section — the technical-service lifecycle
 * downstream of Expert Assistance (prescription -> certify -> recovery -> impact -> close).
 *
 * @module useInterventionsStore
 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { InterventionApi } from "../infrastructure/intervention-api.js";
import { InterventionSummaryAssembler } from "../infrastructure/intervention-summary-response.js";
import { TreatmentPrescriptionAssembler } from "../infrastructure/treatment-prescription-response.js";

const interventionApi = new InterventionApi();

/**
 * Reactive store that exposes the Interventions lifecycle commands and queries.
 * @returns {Object} Store state and actions.
 */
export const useInterventionsStore = defineStore('interventions', () => {
    // ── State ──────────────────────────────────────────────────────────
    const interventions = ref([]);
    const loaded = ref(false);
    const selectedCode = ref(null);
    const prescription = ref(null);
    const specialistNames = ref({});
    const loading = ref({ list: false, action: false });
    const errors = ref([]);
    const lastSyncedAt = ref(null);

    // ── Computed (Getters) ─────────────────────────────────────────────

    const selected = computed(() =>
        interventions.value.find((item) => item.code === selectedCode.value) ?? null,
    );

    const totalAmount = computed(() =>
        interventions.value.reduce((sum, item) => sum + (item.amount ?? 0), 0),
    );

    const pendingCertificationCount = computed(() => countByStatus('PRESCRIPTION_ISSUED'));
    const recoveryMonitoringCount = computed(() => countByStatus('RECOVERY_MONITORING'));
    const closurePendingCount = computed(() => countByStatus('READY_TO_CLOSE'));

    const lastSyncLabel = computed(() => {
        if (!lastSyncedAt.value) return 'Not synced yet';
        const diffMinutes = Math.max(0, Math.round((Date.now() - lastSyncedAt.value) / 60000));
        if (diffMinutes < 1) return 'Updated just now';
        if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;
        return `Updated ${Math.round(diffMinutes / 60)} h ago`;
    });

    // ── Actions ────────────────────────────────────────────────────────

    async function loadInterventions() {
        try {
            loading.value.list = true;
            const response = await interventionApi.getInterventions();
            const resources = response?.data ?? [];
            interventions.value = InterventionSummaryAssembler.toEntitiesFromResponse(resources);
            loaded.value = true;
            lastSyncedAt.value = Date.now();

            const stillSelected = interventions.value.some((item) => item.code === selectedCode.value);
            if (!stillSelected) {
                selectedCode.value = interventions.value[0]?.code ?? null;
            }
            await loadPrescriptionFor(selected.value);
            await loadSpecialistNames(interventions.value);
        } catch (error) {
            errors.value.push(error);
        } finally {
            loading.value.list = false;
        }
    }

    function select(code) {
        selectedCode.value = code;
        loadPrescriptionFor(selected.value);
    }

    function clearSelection() {
        selectedCode.value = null;
        prescription.value = null;
    }

    function specialistName(specialistId) {
        if (specialistId == null) return '\u2014';
        return specialistNames.value[specialistId] ?? `Specialist #${specialistId}`;
    }

    async function certifyApplication(request, onDone) {
        await runAction(() => interventionApi.certifyApplication(request), onDone);
    }

    async function reportImpact(request, onDone) {
        await runAction(() => interventionApi.reportImpact(request), onDone);
    }

    async function closeIntervention(outcomeId, request, onDone) {
        await runAction(() => interventionApi.closeIntervention(outcomeId, request), onDone);
    }

    // ── Private helpers ────────────────────────────────────────────────

    async function runAction(actionFn, onDone) {
        try {
            loading.value.action = true;
            await actionFn();
            await loadInterventions();
            onDone?.(true);
        } catch (error) {
            errors.value.push(error);
            onDone?.(false);
        } finally {
            loading.value.action = false;
        }
    }

    async function loadPrescriptionFor(intervention) {
        const prescriptionId = intervention?.treatmentPrescriptionId ?? null;
        if (prescriptionId == null) {
            prescription.value = null;
            return;
        }
        try {
            const response = await interventionApi.getPrescription(prescriptionId);
            const resource = response?.data;
            if (resource) {
                prescription.value = TreatmentPrescriptionAssembler.toView(resource);
            } else {
                prescription.value = null;
            }
        } catch (error) {
            errors.value.push(error);
            prescription.value = null;
        }
    }

    async function loadSpecialistNames(interventionList) {
        const ids = [
            ...new Set(
                interventionList
                    .map((item) => item.specialistId)
                    .filter((id) => id != null),
            ),
        ].filter((id) => specialistNames.value[id] == null);

        if (ids.length === 0) return;

        try {
            const responses = await Promise.all(ids.map((id) => interventionApi.getSpecialistProfile(id)));
            const next = { ...specialistNames.value };
            responses.forEach((response) => {
                const profile = response?.data;
                if (profile?.id != null) {
                    next[profile.id] = profile.fullName || `Specialist #${profile.id}`;
                }
            });
            specialistNames.value = next;
        } catch (error) {
            errors.value.push(error);
        }
    }

    function countByStatus(status) {
        return interventions.value.filter((item) => item.status === status).length;
    }

    return {
        interventions,
        loaded,
        selectedCode,
        prescription,
        specialistNames,
        loading,
        errors,
        lastSyncedAt,
        selected,
        totalAmount,
        pendingCertificationCount,
        recoveryMonitoringCount,
        closurePendingCount,
        lastSyncLabel,
        loadInterventions,
        select,
        clearSelection,
        specialistName,
        certifyApplication,
        reportImpact,
        closeIntervention,
    };
});

export default useInterventionsStore;
