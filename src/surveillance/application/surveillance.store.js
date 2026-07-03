/**
 * Application service store for the `Surveillance` bounded context.
 * Coordinates alert, pest report, and community risk use cases and keeps a UI-facing state.
 *
 * @module useSurveillanceStore
 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { SurveillanceApi } from "../infrastructure/surveillance-api.js";
import { SurveillanceAssembler } from "../infrastructure/surveillance.assembler.js";
import { PestReportAssembler } from "../infrastructure/pest-report.assembler.js";
import { CommunityRiskAssembler } from "../infrastructure/community-risk.assembler.js";

const surveillanceApi = new SurveillanceApi();

const OPEN_STATUSES = ['Pending', 'Active', 'Suggest', 'Under review', 'In Progress'];

/**
 * Reactive store that exposes Surveillance commands and queries.
 * @returns {Object} Store state and actions.
 */
export const useSurveillanceStore = defineStore('surveillance', () => {
    // ── State ──────────────────────────────────────────────────────────
    const alerts = ref([]);
    const selectedAlertId = ref(null);
    const alertsLoaded = ref(false);
    const lastSyncedAt = ref(null);
    const errors = ref([]);

    const loading = ref({
        alerts: false,
        reports: false,
        submitting: false
    });

    const pestReports = ref([]);
    const symptoms = ref([]);
    const communityRisk = ref(null);
    const selectedSignalId = ref(null);
    const pestScopePlotId = ref(null);

    // ── Computed (Getters) ─────────────────────────────────────────────

    const recentAlerts = computed(() => {
        return [...alerts.value]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
    });

    const urgentAlerts = computed(() => {
        return alerts.value.filter(a => a.requiresUrgentAction);
    });

    const selectedAlert = computed(() => {
        if (selectedAlertId.value === null) return null;
        return alerts.value.find(a => String(a.id) === String(selectedAlertId.value)) || null;
    });

    const openAlerts = computed(() => {
        return alerts.value.filter(a => OPEN_STATUSES.includes(a.status));
    });

    const activeAlertsCount = computed(() => {
        return openAlerts.value.length;
    });

    const highPriorityCount = computed(() => {
        return alerts.value.filter(a => a.severity === 'High' || a.severity === 'Critical').length;
    });

    const criticalCount = computed(() => {
        return alerts.value.filter(a => a.severity === 'Critical').length;
    });

    const affectedPlotNames = computed(() => {
        const names = new Set(alerts.value.map(a => a.plot?.name).filter(Boolean));
        return [...names];
    });

    const affectedPlotCount = computed(() => {
        return affectedPlotNames.value.length;
    });

    const recommendedActionsCount = computed(() => {
        return communityRisk.value?.preventiveRecommendations?.length || 0;
    });

    const selectedSignal = computed(() => {
        if (selectedSignalId.value === null || !communityRisk.value) return null;
        return communityRisk.value.signals.find(s => String(s.id) === String(selectedSignalId.value)) || null;
    });

    const lastSyncLabel = computed(() => {
        if (!lastSyncedAt.value) return 'No sync yet';
        const date = new Date(lastSyncedAt.value);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    });

    const confirmedReports = computed(() => {
        return pestReports.value.filter(r => r.isConfirmed);
    });

    const activeConfirmedReports = computed(() => {
        return confirmedReports.value.filter(r => r.isActive);
    });

    const communityExposureCount = computed(() => {
        return communityRisk.value?.signals?.length || 0;
    });

    const probableThreatLabel = computed(() => {
        if (!communityRisk.value || communityRisk.value.signals.length === 0) return 'None detected';
        const highSev = communityRisk.value.signals.find(s => s.severity === 'High');
        if (highSev) return highSev.probableThreat || highSev.title;
        return communityRisk.value.signals[0].probableThreat || communityRisk.value.signals[0].title;
    });

    const riskConfidence = computed(() => {
        if (!communityRisk.value) return 0;
        const total = communityRisk.value.signals.length;
        if (total === 0) return 0;
        const highCount = communityRisk.value.signals.filter(s => s.severity === 'High').length;
        const medCount = communityRisk.value.signals.filter(s => s.severity === 'Medium').length;
        return Math.min(100, Math.round(((highCount * 30 + medCount * 15 + (total - highCount - medCount) * 5) / (total * 30)) * 100));
    });

    // ── Actions ────────────────────────────────────────────────────────

    async function fetchRecentAlerts(limit = 3) {
        try {
            loading.value.alerts = true;
            const params = { limit, sort: 'recent' };
            const response = await surveillanceApi.getAlerts(params);
            alerts.value = SurveillanceAssembler.toEntitiesFromResponse(response);
            alertsLoaded.value = true;
            lastSyncedAt.value = new Date().toISOString();
        } catch (error) {
            console.error("[SurveillanceStore] Error fetching recent alerts:", error);
            errors.value.push(error);
        } finally {
            loading.value.alerts = false;
        }
    }

    async function fetchAlerts(limit = 50) {
        try {
            loading.value.alerts = true;
            const params = { limit, sort: 'recent' };
            const response = await surveillanceApi.getAlerts(params);
            alerts.value = SurveillanceAssembler.toEntitiesFromResponse(response);
            alertsLoaded.value = true;
            lastSyncedAt.value = new Date().toISOString();
        } catch (error) {
            console.error("[SurveillanceStore] Error fetching alerts:", error);
            errors.value.push(error);
        } finally {
            loading.value.alerts = false;
        }
    }

    async function markUnderReview(id) {
        try {
            await surveillanceApi.markAlertUnderReview(id);
            const alert = alerts.value.find(a => String(a.id) === String(id));
            if (alert) alert.status = 'Under review';
        } catch (error) {
            console.error("[SurveillanceStore] Error marking alert under review:", error);
            errors.value.push(error);
        }
    }

    async function resolveAlert(id) {
        try {
            await surveillanceApi.resolveAlert(id);
            const alert = alerts.value.find(a => String(a.id) === String(id));
            if (alert) alert.status = 'Resolved';
        } catch (error) {
            console.error("[SurveillanceStore] Error resolving alert:", error);
            errors.value.push(error);
        }
    }

    async function dismissAlert(id) {
        try {
            await surveillanceApi.dismissAlert(id);
            const alert = alerts.value.find(a => String(a.id) === String(id));
            if (alert) alert.status = 'Dismissed';
        } catch (error) {
            console.error("[SurveillanceStore] Error dismissing alert:", error);
            errors.value.push(error);
        }
    }

    async function loadCommunityRisk(plotId, radiusKm = 5) {
        try {
            const response = await surveillanceApi.getCommunityRisk(plotId, radiusKm);
            const snapshots = CommunityRiskAssembler.toEntitiesFromResponse(response);
            communityRisk.value = snapshots.length > 0 ? snapshots[0] : null;
        } catch (error) {
            console.error("[SurveillanceStore] Error loading community risk:", error);
            errors.value.push(error);
        }
    }

    async function loadPestReports() {
        try {
            loading.value.reports = true;
            const response = await surveillanceApi.getPestReports();
            pestReports.value = PestReportAssembler.toEntitiesFromResponse(response);
        } catch (error) {
            console.error("[SurveillanceStore] Error loading pest reports:", error);
            errors.value.push(error);
        } finally {
            loading.value.reports = false;
        }
    }

    async function loadSymptoms() {
        try {
            const response = await surveillanceApi.getSymptomDictionary();
            symptoms.value = response?.data || [];
        } catch (error) {
            console.error("[SurveillanceStore] Error loading symptoms:", error);
            errors.value.push(error);
        }
    }

    async function submitReport(request, onDone) {
        try {
            loading.value.submitting = true;
            await surveillanceApi.createPestReport(request);
            await loadPestReports();
            if (onDone) onDone();
        } catch (error) {
            console.error("[SurveillanceStore] Error submitting report:", error);
            errors.value.push(error);
        } finally {
            loading.value.submitting = false;
        }
    }

    function selectAlert(id) {
        selectedAlertId.value = id;
    }

    function selectSignal(id) {
        selectedSignalId.value = id;
    }

    function clearErrors() {
        errors.value = [];
    }

    return {
        alerts,
        selectedAlertId,
        alertsLoaded,
        lastSyncedAt,
        errors,
        loading,
        pestReports,
        symptoms,
        communityRisk,
        selectedSignalId,
        pestScopePlotId,
        recentAlerts,
        urgentAlerts,
        selectedAlert,
        openAlerts,
        activeAlertsCount,
        highPriorityCount,
        criticalCount,
        affectedPlotNames,
        affectedPlotCount,
        recommendedActionsCount,
        selectedSignal,
        lastSyncLabel,
        confirmedReports,
        activeConfirmedReports,
        communityExposureCount,
        probableThreatLabel,
        riskConfidence,
        fetchRecentAlerts,
        fetchAlerts,
        markUnderReview,
        resolveAlert,
        dismissAlert,
        loadCommunityRisk,
        loadPestReports,
        loadSymptoms,
        submitReport,
        selectAlert,
        selectSignal,
        clearErrors
    };
});

export default useSurveillanceStore;
