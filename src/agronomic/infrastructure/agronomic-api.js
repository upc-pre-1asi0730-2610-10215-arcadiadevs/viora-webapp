import { BaseApi } from "../../shared/infrastructure/base-api.js";
import { BaseEndpoint } from "../../shared/infrastructure/base-endpoint.js";

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
// Viora platform backend, so they are routed to the mock API target (json-server),
// mirroring the OS frontend.
const iotDevicesEndpointPath = import.meta.env.VITE_IOT_DEVICES_ENDPOINT_PATH || "/iot-devices";
const iotDeviceSummariesEndpointPath = import.meta.env.VITE_IOT_DEVICE_SUMMARIES_ENDPOINT_PATH || "/iot-device-summaries";

/**
 * Infrastructure service gateway for the Agronomic bounded-context endpoints.
 *
 * Every method targets the Viora platform contracts directly. While the C# .NET
 * backend is under construction the contracts are served by json-server from
 * `server/db.json` (see `VITE_VIORA_PLATFORM_API_URL` / `VITE_MOCK_API_URL`);
 * switching to the real backend only requires changing those URLs.
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
        return {
            ...params,
            timeRange: this.#toBackendTimeRange(params.timeRange)
        };
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

    createPlot(plot) {
        return this.#plotsEndpoint.create(plot);
    }

    updatePlot(plotId, plot) {
        return this.#plotsEndpoint.update(plotId, plot);
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

    ingestAgronomicStatistics(snapshot) {
        return this.http.post(`${this.#statisticsEndpoint.endpointPath}/ingest`, snapshot);
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
