import { BaseApi } from "../../shared/infrastructure/base-api.js";
import { BaseEndpoint } from "../../shared/infrastructure/base-endpoint.js";

const plotsEndpointPath = import.meta.env.VITE_PLOTS_ENDPOINT_PATH;
const recordsEndpointPath = import.meta.env.VITE_AGRONOMIC_RECORDS_ENDPOINT_PATH;
const summariesEndpointPath = import.meta.env.VITE_MONITORING_SUMMARIES_ENDPOINT_PATH;
const weatherEndpointPath = import.meta.env.VITE_WEATHER_SUMMARIES_ENDPOINT_PATH;
const forecastsEndpointPath = import.meta.env.VITE_YIELD_FORECASTS_ENDPOINT_PATH;
const statisticsEndpointPath = import.meta.env.VITE_AGRONOMIC_STATISTICS_ENDPOINT_PATH;
const iotDevicesEndpointPath = import.meta.env.VITE_IOT_DEVICES_ENDPOINT_PATH;

/**
 * Infrastructure service gateway for the Agronomic bounded-context endpoints.
 * Manages multiple specific endpoints for agronomic entities.
 * * @class AgronomicApi
 * @extends BaseApi
 */
export class AgronomicApi extends BaseApi {
    #plotsEndpoint;
    #recordsEndpoint;
    #summariesEndpoint;
    #weatherEndpoint;
    #forecastsEndpoint;
    #statisticsEndpoint;
    #iotDevicesEndpoint;

    /** * Initializes all internal endpoints using environment variable paths.
     */
    constructor() {
        super();
        this.#plotsEndpoint = new BaseEndpoint(this, plotsEndpointPath);
        this.#recordsEndpoint = new BaseEndpoint(this, recordsEndpointPath);
        this.#summariesEndpoint = new BaseEndpoint(this, summariesEndpointPath);
        this.#weatherEndpoint = new BaseEndpoint(this, weatherEndpointPath);
        this.#forecastsEndpoint = new BaseEndpoint(this, forecastsEndpointPath);
        this.#statisticsEndpoint = new BaseEndpoint(this, statisticsEndpointPath);
        this.#iotDevicesEndpoint = new BaseEndpoint(this, iotDevicesEndpointPath);
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
     * Fetches telemetry records, typically filtered by plotId or period.
     * @param {Object} [params={}] - Query parameters (e.g., { plotId: 1, period: '30d' }).
     */
    getRecords(params = {}) {
        return this.#recordsEndpoint.getAll(params);
    }

    /**
     * Fetches monitoring summaries (KPIs) for the dashboard.
     * @param {string} period - Filter period ('7d', '30d', or 'current').
     */
    getSummaries(period) {
        return this.#summariesEndpoint.getAll({ period });
    }

    /**
     * Fetches weather information for the weather widget.
     * @param {Object} [params={}] - Filter parameters (e.g., { city: 'Tacna' }).
     */
    getWeather(params = {}) {
        return this.#weatherEndpoint.getAll(params);
    }

    /**
     * Fetches yield predictions.
     * @param {number|string} plotId - Plot identifier to get forecast for.
     */
    getYieldForecastByPlot(plotId) {
        return this.#forecastsEndpoint.getAll({ plotId });
    }

    /**
     * Fetches pre-calculated agronomic statistics for analysis.
     * @param {Object} [params={}] - Filter parameters (e.g., { plotId: 'all', timeRange: '30days' }).
     */
    getStatistics(params = {}) {
        return this.#statisticsEndpoint.getAll(params);
    }

    /**
     * Fetches all IoT devices.
     * @returns {Promise<import('axios').AxiosResponse>}
     */
    getIotDevices() {
        return this.#iotDevicesEndpoint.getAll();
    }

    /**
     * Fetches an IoT device by its ID.
     * @param {number|string} id - Device identifier.
     */
    getIotDeviceById(id) {
        return this.#iotDevicesEndpoint.getById(id);
    }

    /**
     * Creates a new IoT device.
     * @param {Object} device - Device data.
     */
    createIotDevice(device) {
        return this.#iotDevicesEndpoint.create(device);
    }

    /**
     * Updates an existing IoT device.
     * @param {number|string} id - Device identifier.
     * @param {Object} device - Updated device data.
     */
    updateIotDevice(id, device) {
        return this.#iotDevicesEndpoint.update(id, device);
    }

    /**
     * Deletes an IoT device.
     * @param {number|string} id - Device identifier.
     */
    deleteIotDevice(id) {
        return this.#iotDevicesEndpoint.delete(id);
    }
}