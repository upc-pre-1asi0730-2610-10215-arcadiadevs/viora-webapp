import { SpecialistMarketplace } from '../domain/model/marketplace-case.entity.js';

/**
 * Backend resource shape for `GET /intervention-marketplace`.
 * @typedef {Object} SpecialistMarketplaceResource
 * @property {number|null} newCasesCount
 * @property {number|null} acceptanceRatePercent
 * @property {number|null} activeCasesCount
 * @property {Array<Object>|null} cases
 * @property {string|null} updatedAt
 */

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function toDate(raw) {
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class SpecialistMarketplaceAssembler {
    /**
     * @param {SpecialistMarketplaceResource} resource
     * @returns {SpecialistMarketplace}
     */
    static toEntityFromResource(resource) {
        return new SpecialistMarketplace({
            // Null stays null so the view shows an empty state, not a misleading 0%.
            acceptanceRatePercent: resource.acceptanceRatePercent ?? null,
            activeCasesCount: resource.activeCasesCount ?? 0,
            cases: (resource.cases ?? []).map(SpecialistMarketplaceAssembler.toCase),
            updatedAt: toDate(resource.updatedAt),
        });
    }

    static toCase(resource) {
        const severity = (resource.severity ?? '').toUpperCase();
        return {
            id: resource.id ?? '',
            referenceCode: resource.referenceCode ?? '',
            specialistId: resource.specialistId ?? null,
            // Unmatched/missing severity stays null (unlike the dashboard's zonal
            // risk, which defaults to 'LOW') — the view renders no badge.
            severity: SEVERITIES.includes(severity) ? severity : null,
            problem: resource.problem ?? '',
            ndvi: resource.ndvi ?? null,
            producerName: resource.producerName ?? '',
            producerPhotoUrl: resource.producerPhotoUrl ?? null,
            productionType: resource.productionType ?? null,
            plotName: resource.plotName ?? '',
            location: resource.location ?? null,
            areaHectares: resource.areaHectares ?? null,
            plotCount: resource.plotCount ?? null,
            createdAt: toDate(resource.createdAt),
        };
    }
}
