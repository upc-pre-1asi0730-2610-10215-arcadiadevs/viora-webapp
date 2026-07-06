import { SpecialistDashboard } from '../domain/model/specialist-dashboard.entity.js';

/**
 * Backend resource shape for `GET /specialist-dashboard`.
 * @typedef {Object} SpecialistDashboardResource
 * @property {number|null} resolvedInterventions
 * @property {number|null} acceptanceRatePercent
 * @property {number|null} acceptanceRateDeltaPercent
 * @property {number|null} phytosanitaryEfficiencyPercent
 * @property {string|null} phytosanitaryStatus
 * @property {Array<Object>|null} zonalRisks
 * @property {Array<Object>|null} incomingRequests
 * @property {Array<Object>|null} performanceMonthly
 * @property {Array<Object>|null} performanceAnnual
 * @property {string|null} updatedAt
 */

const SEVERITIES = ['HIGH', 'MEDIUM', 'LOW'];
const PHYTO_STATUSES = ['optimal', 'watch', 'critical'];

function toDate(raw) {
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class SpecialistDashboardAssembler {
    /**
     * @param {SpecialistDashboardResource} resource
     * @returns {SpecialistDashboard}
     */
    static toEntityFromResource(resource) {
        const status = (resource.phytosanitaryStatus ?? '').toLowerCase();

        return new SpecialistDashboard({
            kpis: {
                resolvedInterventions: resource.resolvedInterventions ?? 0,
                // Null metrics stay null so the view can show an empty state
                // instead of a misleading zero — no fabricated data.
                acceptanceRatePercent: resource.acceptanceRatePercent ?? null,
                acceptanceRateDeltaPercent: resource.acceptanceRateDeltaPercent ?? null,
                phytosanitaryEfficiencyPercent: resource.phytosanitaryEfficiencyPercent ?? null,
                phytosanitaryStatus: PHYTO_STATUSES.includes(status) ? status : null,
            },
            zonalRisks: (resource.zonalRisks ?? []).map(SpecialistDashboardAssembler.toZonalRisk),
            incomingRequests: (resource.incomingRequests ?? []).map(SpecialistDashboardAssembler.toIncomingRequest),
            performanceMonthly: (resource.performanceMonthly ?? []).map(SpecialistDashboardAssembler.toPerformancePoint),
            performanceAnnual: (resource.performanceAnnual ?? []).map(SpecialistDashboardAssembler.toPerformancePoint),
            updatedAt: toDate(resource.updatedAt),
        });
    }

    static toZonalRisk(resource) {
        const severity = (resource.severity ?? '').toUpperCase();
        return {
            id: resource.id ?? '',
            severity: SEVERITIES.includes(severity) ? severity : 'LOW',
            title: resource.title ?? '',
            distanceKm: resource.distanceKm ?? 0,
            sector: resource.sector ?? '',
        };
    }

    static toIncomingRequest(resource) {
        return {
            id: resource.id ?? '',
            referenceCode: resource.referenceCode ?? '',
            plotLabel: resource.plotLabel ?? '',
            growerLabel: resource.growerLabel ?? '',
            problem: resource.problem ?? '',
            createdAt: toDate(resource.createdAt),
        };
    }

    static toPerformancePoint(resource) {
        return {
            label: resource.label ?? '',
            value: resource.value ?? 0,
        };
    }
}
