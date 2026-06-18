import { BaseApi } from "../../shared/infrastructure/base-api.js";
import { BaseEndpoint } from "../../shared/infrastructure/base-endpoint.js";

// Surveillance alerts are not yet served by the Viora platform backend, so they
// are routed to the mock API target (json-server), mirroring the OS frontend.
const alertsEndpointPath = import.meta.env.VITE_ALERTS_ENDPOINT_PATH || "/alerts";

/**
 * Infrastructure service gateway for the Surveillance bounded-context endpoints.
 * @class SurveillanceApi
 * @extends BaseApi
 */
export class SurveillanceApi extends BaseApi {
    #alertsEndpoint;

    /**
     * Initializes all internal endpoints using environment variable paths.
     */
    constructor() {
        super();
        this.#alertsEndpoint = new BaseEndpoint(this, alertsEndpointPath, { mock: true });
    }

    /**
     * Fetches alerts, typically the most recent ones for the dashboard.
     * @param {Object} [params={}] - Query parameters (e.g., { _limit: 3, _sort: 'date', _order: 'desc' }).
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getAlerts(params = {}) {
        return this.#alertsEndpoint.getAll(params);
    }

    /**
     * Fetches a specific alert by its ID.
     * @param {number|string} id - Alert identifier.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getAlertById(id) {
        return this.#alertsEndpoint.getById(id);
    }
}
