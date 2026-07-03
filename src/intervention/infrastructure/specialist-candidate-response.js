import { SpecialistCandidate } from '../domain/model/specialist-candidate.entity.js';

/**
 * Backend resource shape for `GET /specialist-candidates`.
 * @typedef {Object} SpecialistCandidateResource
 * @property {number|null} id
 * @property {string|null} name
 * @property {string|null} role
 * @property {number|null} successRate
 * @property {number|null} caseCount
 * @property {number|null} distanceKm
 * @property {string[]|null} tags
 * @property {string|null} availability
 * @property {boolean|null} available
 */

/**
 * Maps the backend availability enum to the local presentation availability.
 * @param {SpecialistCandidateResource} resource
 * @returns {'today'|'tomorrow'|'week'|'unavailable'}
 */
function toAvailability(resource) {
    switch ((resource.availability ?? '').toUpperCase()) {
        case 'AVAILABLE_TODAY':
            return 'today';
        case 'AVAILABLE_TOMORROW':
            return 'tomorrow';
        case 'AVAILABLE_THIS_WEEK':
            return 'week';
        case 'UNAVAILABLE':
            return 'unavailable';
        default:
            return resource.available ? 'today' : 'unavailable';
    }
}

export class SpecialistCandidateAssembler {
    /**
     * @param {SpecialistCandidateResource} resource
     * @param {boolean} [bestMatch=false]
     * @returns {SpecialistCandidate}
     */
    static toEntityFromResource(resource, bestMatch = false) {
        return new SpecialistCandidate({
            id: resource.id ?? null,
            name: resource.name ?? '',
            role: resource.role ?? 'Phytosanitary specialist',
            successRate: resource.successRate ?? 0,
            caseCount: resource.caseCount ?? 0,
            distanceKm: resource.distanceKm ?? 0,
            tags: resource.tags ?? [],
            availability: toAvailability(resource),
            bestMatch,
        });
    }

    /**
     * @param {SpecialistCandidateResource[]} resources
     * @returns {SpecialistCandidate[]}
     */
    static toEntitiesFromResponse(resources) {
        return resources.map((resource, index) =>
            SpecialistCandidateAssembler.toEntityFromResource(resource, index === 0),
        );
    }
}
