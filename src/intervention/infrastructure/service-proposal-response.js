import { ServiceProposal } from '../domain/model/service-proposal.entity.js';

/**
 * Backend resource shape for `GET/POST/PATCH /service-proposals`.
 * @typedef {Object} ServiceProposalResource
 * @property {number|null} id
 * @property {number|null} interventionRequestId
 * @property {number|null} specialistId
 * @property {string|null} serviceTitle
 * @property {string|null} durationLabel
 * @property {string[]|null} scope
 * @property {string|null} proposedDate
 * @property {number|null} amount
 * @property {string|null} currency
 * @property {string|null} proposalDetails
 * @property {string|null} status
 */

/**
 * Request body for `PATCH /service-proposals/{id}` (accept / reject).
 * @typedef {Object} UpdateServiceProposalStatusRequest
 * @property {'ACCEPTED'|'REJECTED'} status
 * @property {string} [reason]
 */

const KNOWN_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED'];

export class ServiceProposalAssembler {
    /**
     * @param {ServiceProposalResource} resource
     * @returns {ServiceProposal}
     */
    static toEntityFromResource(resource) {
        const status = (resource.status ?? '').toUpperCase();

        return new ServiceProposal({
            id: resource.id ?? null,
            interventionRequestId: resource.interventionRequestId ?? null,
            specialistId: resource.specialistId ?? null,
            serviceTitle: resource.serviceTitle ?? '',
            durationLabel: resource.durationLabel ?? '',
            scope: resource.scope ?? [],
            proposedDate: resource.proposedDate ?? null,
            amount: resource.amount ?? null,
            currency: resource.currency ?? null,
            proposalDetails: resource.proposalDetails ?? '',
            status: KNOWN_STATUSES.includes(status) ? status : 'PENDING',
        });
    }

    /**
     * @param {ServiceProposalResource[]} resources
     * @returns {ServiceProposal[]}
     */
    static toEntitiesFromResponse(resources) {
        return resources.map((resource) => ServiceProposalAssembler.toEntityFromResource(resource));
    }
}
