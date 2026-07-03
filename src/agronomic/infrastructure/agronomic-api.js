import { BaseApi } from "../../shared/infrastructure/base-api.js";
import { BaseEndpoint } from "../../shared/infrastructure/base-endpoint.js";
import { polygonAreaHectares } from "./geo-area.js";

const defaultUserId = import.meta.env.VITE_DEFAULT_USER_ID;

// Endpoint paths are relative to the API base URL (which already includes the
// `/api/v1` prefix), matching the OS frontend convention.
const plotsEndpointPath = import.meta.env.VITE_PLOTS_ENDPOINT_PATH || "/plots";
const plotsOverviewEndpointPath = import.meta.env.VITE_PLOTS_OVERVIEW_ENDPOINT_PATH || "/plots/overview";
const recordsEndpointPath = import.meta.env.VITE_AGRONOMIC_RECORDS_ENDPOINT_PATH || "/agronomic-statistics/series";
const currentSummaryEndpointPath = import.meta.env.VITE_MONITORING_SUMMARY_CURRENT_ENDPOINT_PATH || "/monitoring-summaries/current";
const statisticsEndpointPath = import.meta.env.VITE_AGRONOMIC_STATISTICS_ENDPOINT_PATH || "/agronomic-statistics";
const statisticsSeriesEndpointPath = import.meta.env.VITE_AGRONOMIC_STATISTICS_SERIES_ENDPOINT_PATH || "/agronomic-statistics/series";
const nutritionPlansEndpointPath = import.meta.env.VITE_DYNAMIC_NUTRITION_PLANS_ENDPOINT_PATH || "/dynamic-nutrition-plans";
// IoT sensor telemetry and the dashboard insight cards are not yet served by the
// Viora platform backend, so they are routed to the mock API target (json-server).
const iotDevicesEndpointPath = import.meta.env.VITE_IOT_DEVICES_ENDPOINT_PATH || "/iot-devices";
const iotDeviceSummariesEndpointPath = import.meta.env.VITE_IOT_DEVICE_SUMMARIES_ENDPOINT_PATH || "/iot-device-summaries";

/**
 * Infrastructure service gateway for the Agronomic bounded-context endpoints.
 *
 * Every method targets the Viora platform contracts directly. IoT endpoints
 * still target the mock API (json-server) while the backend implementation
 * is completed.
 *
 * @class AgronomicApi
 * @extends BaseApi
 */
export class AgronomicApi extends BaseApi {
    #plotsEndpoint;
    #plotsOverviewEndpoint;
    #recordsEndpoint;
    #currentSummaryEndpoint;
    #statisticsEndpoint;
    #statisticsSeriesEndpoint;
    #nutritionPlansEndpoint;
    #iotDevicesEndpoint;
    #iotDeviceSummariesEndpoint;

    constructor() {
        super();
        this.#plotsEndpoint = new BaseEndpoint(this, plotsEndpointPath);
        this.#plotsOverviewEndpoint = new BaseEndpoint(this, plotsOverviewEndpointPath);
        this.#recordsEndpoint = new BaseEndpoint(this, recordsEndpointPath);
        this.#currentSummaryEndpoint = new BaseEndpoint(this, currentSummaryEndpointPath);
        this.#statisticsEndpoint = new BaseEndpoint(this, statisticsEndpointPath);
        this.#statisticsSeriesEndpoint = new BaseEndpoint(this, statisticsSeriesEndpointPath);
        this.#nutritionPlansEndpoint = new BaseEndpoint(this, nutritionPlansEndpointPath);
        this.#iotDevicesEndpoint = new BaseEndpoint(this, iotDevicesEndpointPath, { mock: true });
        this.#iotDeviceSummariesEndpoint = new BaseEndpoint(this, iotDeviceSummariesEndpointPath, { mock: true });
    }

    #plotPath(plotId, suffix = "") {
        return `${this.#plotsEndpoint.endpointPath}/${plotId}${suffix}`;
    }

    #toBackendTimeRange(timeRange = "LAST_30_DAYS") {
        const value = String(timeRange || "").trim();
        const ranges = {
            current: "LAST_30_DAYS",
            "7days": "LAST_7_DAYS",
            "30days": "LAST_30_DAYS",
            campaign: "CAMPAIGN"
        };

        return ranges[value] || value.toUpperCase();
    }

    #withBackendTimeRange(params = {}) {
        const normalized = {
            ...params,
            timeRange: this.#toBackendTimeRange(params.timeRange)
        };

        // The platform's `plotId` is an optional numeric param: omitting it means
        // "aggregate across all plots". The dashboard uses the sentinel 'all',
        // which the backend cannot parse as a Long (400), so drop it here.
        const plotId = String(normalized.plotId ?? "").trim().toLowerCase();
        if (plotId === "" || plotId === "all") {
            delete normalized.plotId;
        }

        return normalized;
    }

    getPlots() {
        return this.#plotsEndpoint.getAll({ includeCurrentImagery: true });
    }

    getPlotsOverview() {
        return this.#plotsOverviewEndpoint.getAll();
    }

    getPlotById(id) {
        return this.#plotsEndpoint.getById(id);
    }

    /**
     * Registers a plot. Injects the owner `userId` into the body (as the platform
     * `CreatePlotResource` requires) and, while json-server backs the contract,
     * enriches the echoed payload with the area and automatic-link statuses the
     * real backend computes on registration. Once the C# backend is live those
     * fields arrive populated and the enrichment becomes a no-op.
     *
     * @param {Object} plot - Create plot request (without userId).
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    async createPlot(plot) {
        const body = {
            userId: Number(defaultUserId) || 1,
            cropType: "",
            variety: "",
            location: "",
            campaign: "",
            notes: "",
            ...plot
        };
        const response = await this.#plotsEndpoint.create(body);
        response.data = this.#withRegistrationDefaults(response.data);
        return response;
    }

    updatePlot(plotId, plot) {
        return this.#plotsEndpoint.update(plotId, plot);
    }

    /**
     * Fills the registration fields json-server does not compute, so the wizard's
     * confirmation step matches the platform `PlotRegistrationResource` shape.
     *
     * @param {Object} data - Echoed plot payload from the mock.
     * @returns {Object} Contract-shaped registration resource.
     */
    #withRegistrationDefaults(data = {}) {
        const coordinates = Array.isArray(data.polygonCoordinates) ? data.polygonCoordinates : [];
        return {
            ...data,
            areaSizeHectares: data.areaSizeHectares ?? Number(polygonAreaHectares(coordinates).toFixed(2)),
            state: data.state ?? "enable",
            climateMonitoring: data.climateMonitoring ?? "ACTIVE",
            satelliteNdvi: data.satelliteNdvi ?? "ACTIVE",
            iotDevices: data.iotDevices ?? "NOT_LINKED"
        };
    }

    deletePlot(plotId) {
        return this.#plotsEndpoint.delete(plotId);
    }

    configureChillRequirement(plotId, chillRequirement) {
        return this.http.put(this.#plotPath(plotId, "/chill-requirement"), chillRequirement);
    }

    resetChillRequirement(plotId) {
        return this.http.delete(this.#plotPath(plotId, "/chill-requirement"));
    }

    getPlotDetail(plotId) {
        return this.http.get(this.#plotPath(plotId, "/detail"));
    }

    getRecords(params = {}) {
        return this.#recordsEndpoint.getAll(this.#withBackendTimeRange(params));
    }

    getSummaries() {
        return this.#currentSummaryEndpoint.getAll();
    }

    getPlotMonitoringSummary(plotId) {
        return this.http.get(this.#plotPath(plotId, "/monitoring-summary"));
    }

    getCurrentNdviTile(plotId, zoom, x, y) {
        return this.http.get(this.#plotPath(plotId, `/imagery/tile/${zoom}/${x}/${y}`), {
            responseType: "blob"
        });
    }

    getWeather(params = {}) {
        const plotId = params.plotId || 1;
        return this.getPlotWeatherForecast(plotId);
    }

    getPlotWeatherForecast(plotId) {
        return this.http.get(this.#plotPath(plotId, "/weather-forecast"));
    }

    getYieldForecastByPlot(plotId) {
        return this.getPlotMonitoringSummary(plotId);
    }

    getStatistics(params = {}) {
        return this.#statisticsEndpoint.getAll(this.#withBackendTimeRange(params));
    }

    getStatisticsSeries(params = {}) {
        return this.#statisticsSeriesEndpoint.getAll(this.#withBackendTimeRange(params));
    }

    ingestAgronomicStatistics(userId) {
        return this.http.post(this.#statisticsEndpoint.endpointPath, null, { params: { userId } });
    }

    generateNutritionPlan(params = {}) {
        return this.#nutritionPlansEndpoint.http.post(this.#nutritionPlansEndpoint.endpointPath, null, { params });
    }

    getActiveNutritionPlan(params = {}) {
        return this.#nutritionPlansEndpoint.http.get(`${this.#nutritionPlansEndpoint.endpointPath}/active`, { params });
    }

    certifyNutritionPlan(planId, certification) {
        return this.#nutritionPlansEndpoint.http.post(
            `${this.#nutritionPlansEndpoint.endpointPath}/${planId}/certification`,
            certification
        );
    }

    getIotDevices(plotId) {
        return this.#iotDevicesEndpoint.getAll(plotId ? { plotId } : {});
    }

    getIotDevicesByPlot(plotId) {
        return this.#iotDevicesEndpoint.getAll({ plotId });
    }

    getIotDeviceSummaries() {
        return this.#iotDeviceSummariesEndpoint.getAll();
    }

    getIotDeviceSummariesByPlot(plotId) {
        return this.#iotDeviceSummariesEndpoint.getAll({ plotId });
    }

    getIotDeviceById(id) {
        return this.#iotDevicesEndpoint.getById(id);
    }

    createIotDevice(device) {
        return this.#iotDevicesEndpoint.create(device);
    }

    updateIotDevice(id, device) {
        return this.#iotDevicesEndpoint.update(id, device);
    }

    deleteIotDevice(id, plotId) {
        return this.#iotDevicesEndpoint.delete(id);
    }
}
