import { BaseApi } from "../../shared/infrastructure/base-api.js";
import { BaseEndpoint } from "../../shared/infrastructure/base-endpoint.js";
import { hasConfiguredApiUrl, mockVioraResponses } from "../../shared/infrastructure/mock-viora-resources.js";

const plotsEndpointPath = import.meta.env.VITE_PLOTS_ENDPOINT_PATH || "/api/v1/plots";
const plotsOverviewEndpointPath = import.meta.env.VITE_PLOTS_OVERVIEW_ENDPOINT_PATH || "/api/v1/plots/overview";
const recordsEndpointPath = import.meta.env.VITE_AGRONOMIC_RECORDS_ENDPOINT_PATH || "/api/v1/agronomic-statistics/series";
const currentSummaryEndpointPath = import.meta.env.VITE_MONITORING_SUMMARY_CURRENT_ENDPOINT_PATH || "/api/v1/monitoring-summaries/current";
const statisticsEndpointPath = import.meta.env.VITE_AGRONOMIC_STATISTICS_ENDPOINT_PATH || "/api/v1/agronomic-statistics";
const statisticsSeriesEndpointPath = import.meta.env.VITE_AGRONOMIC_STATISTICS_SERIES_ENDPOINT_PATH || "/api/v1/agronomic-statistics/series";
const nutritionPlansEndpointPath = import.meta.env.VITE_DYNAMIC_NUTRITION_PLANS_ENDPOINT_PATH || "/api/v1/dynamic-nutrition-plans";

/**
 * Infrastructure service gateway for the Agronomic bounded-context endpoints.
 * Mirrors the OS Viora platform contracts while serving local data when no API
 * URL is configured.
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

    constructor() {
        super();
        this.#plotsEndpoint = new BaseEndpoint(this, plotsEndpointPath);
        this.#plotsOverviewEndpoint = new BaseEndpoint(this, plotsOverviewEndpointPath);
        this.#recordsEndpoint = new BaseEndpoint(this, recordsEndpointPath);
        this.#currentSummaryEndpoint = new BaseEndpoint(this, currentSummaryEndpointPath);
        this.#statisticsEndpoint = new BaseEndpoint(this, statisticsEndpointPath);
        this.#statisticsSeriesEndpoint = new BaseEndpoint(this, statisticsSeriesEndpointPath);
        this.#nutritionPlansEndpoint = new BaseEndpoint(this, nutritionPlansEndpointPath);
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

    #toCreateIotDeviceResource(device = {}) {
        return {
            deviceName: device.deviceName || device.name || "",
            status: String(device.status || "ACTIVE").toUpperCase()
        };
    }

    #toUpdateIotDeviceResource(device = {}) {
        return {
            deviceName: device.deviceName || device.name || "",
            iotDeviceStatus: String(device.iotDeviceStatus || device.status || "ACTIVE").toUpperCase()
        };
    }

    getPlots() {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.plots();
        return this.#plotsEndpoint.getAll({ includeCurrentImagery: true });
    }

    getPlotsOverview() {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.plotsOverview();
        return this.#plotsOverviewEndpoint.getAll();
    }

    getPlotById(id) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.plotById(id);
        return this.#plotsEndpoint.getById(id);
    }

    createPlot(plot) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.createPlot(plot);
        return this.#plotsEndpoint.create(plot);
    }

    updatePlot(plotId, plot) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.updatePlot(plotId, plot);
        return this.#plotsEndpoint.update(plotId, plot);
    }

    deletePlot(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.deletePlot(plotId);
        return this.#plotsEndpoint.delete(plotId);
    }

    configureChillRequirement(plotId, chillRequirement) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.configureChillRequirement(plotId, chillRequirement);
        return this.http.put(this.#plotPath(plotId, "/chill-requirement"), chillRequirement);
    }

    resetChillRequirement(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.resetChillRequirement(plotId);
        return this.http.delete(this.#plotPath(plotId, "/chill-requirement"));
    }

    getPlotDetail(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.plotDetail(plotId);
        return this.http.get(this.#plotPath(plotId, "/detail"));
    }

    getRecords(params = {}) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.records(params);
        return this.#recordsEndpoint.getAll(this.#withBackendTimeRange(params));
    }

    getSummaries() {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.monitoringSummary();
        return this.#currentSummaryEndpoint.getAll();
    }

    getPlotMonitoringSummary(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.plotMonitoringSummary(plotId);
        return this.http.get(this.#plotPath(plotId, "/monitoring-summary"));
    }

    getCurrentNdviTile(plotId, zoom, x, y) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.ndviTile(plotId, zoom, x, y);
        return this.http.get(this.#plotPath(plotId, `/imagery/tile/${zoom}/${x}/${y}`), {
            responseType: "blob"
        });
    }

    getWeather(params = {}) {
        const plotId = params.plotId || 1;
        return this.getPlotWeatherForecast(plotId);
    }

    getPlotWeatherForecast(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.plotWeatherForecast(plotId);
        return this.http.get(this.#plotPath(plotId, "/weather-forecast"));
    }

    getYieldForecastByPlot(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.yieldForecast(plotId);
        return this.getPlotMonitoringSummary(plotId);
    }

    getStatistics(params = {}) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.statistics(params);
        return this.#statisticsEndpoint.getAll(this.#withBackendTimeRange(params));
    }

    getStatisticsSeries(params = {}) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.statisticsSeries(params);
        return this.#statisticsSeriesEndpoint.getAll(this.#withBackendTimeRange(params));
    }

    ingestAgronomicStatistics(snapshot) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.ingestAgronomicStatistics(snapshot);
        return this.http.post(`${this.#statisticsEndpoint.endpointPath}/ingest`, snapshot);
    }

    generateNutritionPlan(params = {}) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.generateNutritionPlan(params);
        return this.#nutritionPlansEndpoint.http.post(this.#nutritionPlansEndpoint.endpointPath, null, { params });
    }

    getActiveNutritionPlan(params = {}) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.activeNutritionPlan(params);
        return this.#nutritionPlansEndpoint.http.get(`${this.#nutritionPlansEndpoint.endpointPath}/active`, { params });
    }

    certifyNutritionPlan(planId, certification) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.certifyNutritionPlan(planId, certification);
        return this.#nutritionPlansEndpoint.http.post(
            `${this.#nutritionPlansEndpoint.endpointPath}/${planId}/certification`,
            certification
        );
    }

    getIotDevices(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.iotDevices(plotId);
        if (!plotId) return Promise.reject(new Error("plotId is required by the IoT device contract."));
        return this.getIotDevicesByPlot(plotId);
    }

    getIotDevicesByPlot(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.iotDevicesByPlot(plotId);
        return this.http.get(this.#plotPath(plotId, "/iot-devices"));
    }

    getIotDeviceSummaries() {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.iotDeviceSummaries();
        return this.getPlotsOverview();
    }

    getIotDeviceSummariesByPlot(plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.iotDeviceSummaries(plotId);
        return this.getIotDevicesByPlot(plotId);
    }

    getIotDeviceById(id) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.iotDeviceById(id);
        return Promise.reject(new Error("The platform contract lists IoT devices by plot, not by global device id."));
    }

    createIotDevice(device) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.createIotDevice(device);
        return this.http.post(
            this.#plotPath(device.plotId, "/iot-devices"),
            this.#toCreateIotDeviceResource(device)
        );
    }

    updateIotDevice(id, device) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.updateIotDevice(id, device);
        return this.http.patch(
            this.#plotPath(device.plotId, `/iot-devices/${id}`),
            this.#toUpdateIotDeviceResource(device)
        );
    }

    deleteIotDevice(id, plotId) {
        if (!hasConfiguredApiUrl()) return mockVioraResponses.deleteIotDevice(id);
        if (!plotId) return Promise.reject(new Error("plotId is required by the IoT delete contract."));
        return this.http.delete(this.#plotPath(plotId, `/iot-devices/${id}`));
    }
}
