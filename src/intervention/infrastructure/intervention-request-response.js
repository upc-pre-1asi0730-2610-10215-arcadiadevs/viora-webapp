import { InterventionRequest } from '../domain/model/intervention-request.entity.js';

/**
 * Backend resource shape for an intervention request (`/intervention-requests`).
 * @typedef {Object} InterventionRequestResource
 * @property {number|null} id
 * @property {string|null} referenceCode
 * @property {number|null} growerId
 * @property {number|null} plotId
 * @property {number|null} specialistId
 * @property {number|null} alertId
 * @property {string|null} reason
 * @property {string|null} message
 * @property {string|null} status
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 */

/**
 * Request body for `POST /intervention-requests` (userId/grower injected by the API).
 * @typedef {Object} CreateInterventionRequestRequest
 * @property {number} growerId
 * @property {number} plotId
 * @property {number} specialistId
 * @property {number} alertId
 * @property {string} reason
 * @property {string} [message]
 */

const KNOWN_STATUSES = ['PENDING', 'AWAITING_RESPONSE', 'PROPOSAL_RECEIVED', 'ACCEPTED', 'DECLINED'];

export class InterventionRequestAssembler {
    /**
     * @param {InterventionRequestResource} resource
     * @returns {InterventionRequest}
     */
    static toEntityFromResource(resource) {
        const status = (resource.status ?? '').toUpperCase();

        return new InterventionRequest({
            id: resource.id ?? null,
            referenceCode: resource.referenceCode ?? '',
            growerId: resource.growerId ?? null,
            plotId: resource.plotId ?? null,
            specialistId: resource.specialistId ?? null,
            alertId: resource.alertId ?? null,
            reason: resource.reason ?? '',
            message: resource.message ?? '',
            status: KNOWN_STATUSES.includes(status) ? status : 'PENDING',
            createdAt: resource.createdAt ?? null,
            updatedAt: resource.updatedAt ?? null,
        });
    }

    /**
     * @param {InterventionRequestResource[]} resources
     * @returns {InterventionRequest[]}
     */
    static toEntitiesFromResponse(resources) {
        return resources.map((resource) => InterventionRequestAssembler.toEntityFromResource(resource));
    }
}
