import { BaseApi } from "../../shared/infrastructure/base-api.js";
import { BaseEndpoint } from "../../shared/infrastructure/base-endpoint.js";

const plotsEndpointPath = import.meta.env.VITE_PLOTS_ENDPOINT_PATH;

/**
 * Infrastructure service gateway for the Agronomic bounded-context endpoints.
 * Manages multiple specific endpoints for agronomic entities.
 * * @class AgronomicApi
 * @extends BaseApi
 */
export class AgronomicApi extends BaseApi {
    #plotsEndpoint;

    /** * Initializes all internal endpoints using environment variable paths.
     */
    constructor() {
        super();
        this.#plotsEndpoint = new BaseEndpoint(this, plotsEndpointPath);
    }

    /**
     * Fetches all plot resources.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getPlots() {
        return this.#plotsEndpoint.getAll();
    }

    /**
     * Fetches a plot by its unique identifier.
     * @param {number|string} id - Plot identifier.
     */
    getPlotById(id) {
        return this.#plotsEndpoint.getById(id);
    }
}