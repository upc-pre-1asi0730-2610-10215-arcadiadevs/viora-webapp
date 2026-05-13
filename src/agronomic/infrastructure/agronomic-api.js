import { BaseApi } from "../../shared/infrastructure/base-api.js";
import { BaseEndpoint } from "../../shared/infrastructure/base-endpoint.js";

const plotsEndpointPath = import.meta.env.VITE_PLOTS_ENDPOINT_PATH;
const weatherEndpointPath = import.meta.env.VITE_WEATHER_SUMMARIES_ENDPOINT_PATH;
const statisticsEndpointPath = import.meta.env.VITE_AGRONOMIC_STATISTICS_ENDPOINT_PATH;

/**
 * Infrastructure service gateway for the Agronomic bounded-context endpoints.
 * Manages multiple specific endpoints for agronomic entities.
 * * @class AgronomicApi
 * @extends BaseApi
 */
export class AgronomicApi extends BaseApi {
    #plotsEndpoint;
    #weatherEndpoint;
    #statisticsEndpoint;

    /** * Initializes all internal endpoints using environment variable paths.
     */
    constructor() {
        super();
        this.#plotsEndpoint = new BaseEndpoint(this, plotsEndpointPath);
        this.#weatherEndpoint = new BaseEndpoint(this, weatherEndpointPath);
        this.#statisticsEndpoint = new BaseEndpoint(this, statisticsEndpointPath);
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

    /**
     * Fetches weather information for the weather widget.
     * @param {Object} [params={}] - Filter parameters (e.g., { city: 'Tacna' }).
     */
    getWeather(params = {}) {
        return this.#weatherEndpoint.getAll(params);
    }

    /**
     * Fetches pre-calculated agronomic statistics for analysis.
     * @param {Object} [params={}] - Filter parameters (e.g., { plotId: 'all', timeRange: '30days' }).
     */
    getStatistics(params = {}) {
        return this.#statisticsEndpoint.getAll(params);
    }
}