/**
 * Read model for the specialist Intervention Marketplace: the inbox of
 * incoming producer cases routed to the signed-in specialist and still
 * awaiting a response, plus the headline counters.
 *
 * Domain-derived, backend-provided strings (problem, producer name, plot
 * name, location) are treated as data and shown verbatim — only chrome is
 * translated. Fields with no real source for a given case are `null` and the
 * view renders an empty state; case distance is intentionally absent (no
 * specialist geolocation).
 * @class SpecialistMarketplace
 */

/** @typedef {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} CaseSeverity */

export class SpecialistMarketplace {
    /**
     * @param {Object} params
     * @param {Array<{
     *   id: number|string,
     *   referenceCode: string,
     *   specialistId: number|null,
     *   severity: CaseSeverity|null,
     *   problem: string,
     *   ndvi: number|null,
     *   producerName: string,
     *   producerPhotoUrl: string|null,
     *   productionType: string|null,
     *   plotName: string,
     *   location: string|null,
     *   areaHectares: number|null,
     *   plotCount: number|null,
     *   createdAt: Date|null,
     * }>} [params.cases=[]]
     * @param {number|null} [params.acceptanceRatePercent=null]
     * @param {number} [params.activeCasesCount=0]
     * @param {Date|null} [params.updatedAt=null]
     */
    constructor({
        cases = [],
        acceptanceRatePercent = null,
        activeCasesCount = 0,
        updatedAt = null,
    } = {}) {
        this.cases = cases;
        this.acceptanceRatePercent = acceptanceRatePercent;
        this.activeCasesCount = activeCasesCount;
        this.updatedAt = updatedAt;
    }
}
