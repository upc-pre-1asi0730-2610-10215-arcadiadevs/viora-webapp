import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const specialistDashboardPath = import.meta.env.VITE_SPECIALIST_DASHBOARD_ENDPOINT_PATH || '/specialist-dashboard';
const interventionRequestsPath = import.meta.env.VITE_INTERVENTION_REQUESTS_ENDPOINT_PATH || '/intervention-requests';

/**
 * Infrastructure gateway for the Specialist segment dashboard. The signed-in
 * specialist is derived from the bearer token, so no id travels in the URL.
 *
 * @class SpecialistDashboardApi
 * @extends BaseApi
 */
export class SpecialistDashboardApi extends BaseApi {
    #dashboardEndpoint;
    #requestsEndpoint;

    constructor() {
        super();
        this.#dashboardEndpoint = new BaseEndpoint(this, specialistDashboardPath);
        this.#requestsEndpoint = new BaseEndpoint(this, interventionRequestsPath);
    }

    /**
     * Fetches the specialist's aggregated dashboard read model.
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    getDashboard() {
        return this.#dashboardEndpoint.getAll();
    }

    /**
     * Verifies (accepts) an incoming producer request, taking on the case.
     * @param {number|string} id
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    verifyRequest(id) {
        return this.http.post(`${this.#requestsEndpoint.endpointPath}/${id}/verifications`, {});
    }

    /**
     * Declines an incoming producer request, returning it to specialist search.
     * @param {number|string} id
     * @param {string} [reason='']
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    declineRequest(id, reason = '') {
        return this.http.post(`${this.#requestsEndpoint.endpointPath}/${id}/declines`, { reason });
    }
}
