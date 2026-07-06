/**
 * Read model for the Specialist segment dashboard: headline KPIs, the zonal
 * risk radar, incoming producer requests awaiting verify/decline, and the
 * accepted-cases performance series (monthly/annual).
 * @class SpecialistDashboard
 */

/** @typedef {'HIGH'|'MEDIUM'|'LOW'} ZonalRiskSeverity */
/** @typedef {'optimal'|'watch'|'critical'} PhytosanitaryStatus */

export class SpecialistDashboard {
    /**
     * @param {Object} params
     * @param {Object} [params.kpis]
     * @param {number} [params.kpis.resolvedInterventions=0]
     * @param {number|null} [params.kpis.acceptanceRatePercent=null]
     * @param {number|null} [params.kpis.acceptanceRateDeltaPercent=null]
     * @param {number|null} [params.kpis.phytosanitaryEfficiencyPercent=null]
     * @param {PhytosanitaryStatus|null} [params.kpis.phytosanitaryStatus=null]
     * @param {Array<{id: number|string, severity: ZonalRiskSeverity, title: string, distanceKm: number, sector: string}>} [params.zonalRisks=[]]
     * @param {Array<{id: number|string, referenceCode: string, plotLabel: string, growerLabel: string, problem: string, createdAt: Date|null}>} [params.incomingRequests=[]]
     * @param {Array<{label: string, value: number}>} [params.performanceMonthly=[]]
     * @param {Array<{label: string, value: number}>} [params.performanceAnnual=[]]
     * @param {Date|null} [params.updatedAt=null]
     */
    constructor({
        kpis = {
            resolvedInterventions: 0,
            acceptanceRatePercent: null,
            acceptanceRateDeltaPercent: null,
            phytosanitaryEfficiencyPercent: null,
            phytosanitaryStatus: null,
        },
        zonalRisks = [],
        incomingRequests = [],
        performanceMonthly = [],
        performanceAnnual = [],
        updatedAt = null,
    } = {}) {
        this.kpis = kpis;
        this.zonalRisks = zonalRisks;
        this.incomingRequests = incomingRequests;
        this.performanceMonthly = performanceMonthly;
        this.performanceAnnual = performanceAnnual;
        this.updatedAt = updatedAt;
    }
}
