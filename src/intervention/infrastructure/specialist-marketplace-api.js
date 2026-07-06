import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const interventionMarketplacePath =
    import.meta.env.VITE_INTERVENTION_MARKETPLACE_ENDPOINT_PATH || '/intervention-marketplace';
const serviceProposalsPath = import.meta.env.VITE_SERVICE_PROPOSALS_ENDPOINT_PATH || '/service-proposals';
const interventionRequestsPath = import.meta.env.VITE_INTERVENTION_REQUESTS_ENDPOINT_PATH || '/intervention-requests';

/**
 * Infrastructure gateway for the specialist Intervention Marketplace. The
 * signed-in specialist is derived from the bearer token, so no id travels in
 * the marketplace URL.
 *
 * The two case actions reuse the real intervention endpoints: submitting a
 * proposal (`POST /service-proposals`, which moves the request out of the
 * specialist's PENDING inbox) and declining a case as the assigned specialist
 * (`POST /intervention-requests/{id}/declines`).
 *
 * @class SpecialistMarketplaceApi
 * @extends BaseApi
 */
export class SpecialistMarketplaceApi extends BaseApi {
    #marketplaceEndpoint;
    #proposalsEndpoint;
    #requestsEndpoint;

    constructor() {
        super();
        this.#marketplaceEndpoint = new BaseEndpoint(this, interventionMarketplacePath);
        this.#proposalsEndpoint = new BaseEndpoint(this, serviceProposalsPath);
        this.#requestsEndpoint = new BaseEndpoint(this, interventionRequestsPath);
    }

    /**
     * Fetches the specialist's marketplace of incoming cases.
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    getMarketplace() {
        return this.#marketplaceEndpoint.getAll();
    }

    /**
     * Submits a service proposal for an incoming case. On success the linked
     * request moves to PROPOSAL_RECEIVED and drops out of the marketplace inbox.
     * @param {Object} payload
     * @param {number|string} payload.interventionRequestId
     * @param {number} payload.specialistId
     * @param {string} payload.serviceTitle
     * @param {string} payload.durationLabel
     * @param {string[]} payload.scope
     * @param {string} payload.proposedDate
     * @param {number} payload.amount
     * @param {string} payload.currency
     * @param {string} payload.proposalDetails
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    submitProposal(payload) {
        return this.#proposalsEndpoint.create(payload);
    }

    /**
     * Declines an incoming case as the assigned specialist, returning it to
     * specialist search.
     * @param {number|string} requestId
     * @param {string} [reason='']
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    declineCase(requestId, reason = '') {
        return this.http.post(`${this.#requestsEndpoint.endpointPath}/${requestId}/declines`, { reason });
    }
}
