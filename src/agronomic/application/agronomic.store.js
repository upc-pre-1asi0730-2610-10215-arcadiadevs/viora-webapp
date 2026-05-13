/**
 * Application service store for the `Agronomic` bounded context.
 * It coordinates plots, telemetry, weather, and yield forecast use cases and keeps a UI-facing state.
 *
 * @module useAgronomicStore
 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { AgronomicApi } from "../infrastructure/agronomic-api.js";
import { PlotAssembler } from "../infrastructure/plot.assembler.js";
import { MonitoringSummaryAssembler } from "../infrastructure/monitoring-summary.assembler.js";
import { IotDeviceAssembler } from "../infrastructure/iot-device.assembler.js";
import { WeatherSummaryAssembler } from "../infrastructure/weather-summary.assembler.js";

import { Plot } from "../domain/model/plot.entity.js";
import { AgronomicRecord } from "../domain/model/agronomic-record.entity.js";
import { ChillHourRecord } from "../domain/model/chill-hour-record.entity.js";
import { MonitoringSummary } from "../domain/model/monitoring-summary.entity.js";
import { OverallPlotHealth } from "../domain/model/overall-plot-health.entity.js";
import { YieldForecast } from "../domain/model/yield-forecast.entity.js";
import {DateTimeFormatter} from "../../shared/infrastructure/date-time.formatter.js";
import {AgronomicAnalysisAssembler} from "../infrastructure/agronomic-analysis.assembler.js";
import { IotDevice } from "../domain/model/iot-device.entity.js";
import { WeatherSummary } from "../domain/model/weather-summary.entity.js";

const agronomicApi = new AgronomicApi();
const monitoringSummariesEndpointPath = import.meta.env.VITE_MONITORING_SUMMARIES_ENDPOINT_PATH;

/**
 * Reactive store that exposes Agronomic commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
export const useAgronomicStore = defineStore('agronomic', () => {
    /**
     * List of plot entities.
     * @type {import('vue').Ref<Plot[]>}
     */
    const plots = ref([]);


    /**
     * Selected plot identifier for the independent Analysis Module.
     * Can be 'all' or a numeric plot ID.
     * @type {import('vue').Ref<string|number>}
     */
    const analysisPlotId = ref('all');

    /**
     * Selected time range span for the historical analysis.
     * Options: '7days', '30days', 'campaign'.
     * @type {import('vue').Ref<string>}
     */
    const analysisTimeRange = ref('30days');

    /**
     * Pre-calculated analysis data fetched from the backend.
     * @type {import('vue').Ref<import('../domain/model/agronomic-analysis.entity.js').AgronomicAnalysis|null>}
     */
    const analysisData = ref(null);

    /**
     * Whether the analysis data is currently being fetched.
     * @type {import('vue').Ref<boolean>}
     */
    const analysisLoading = ref(false);


    /**
     * Currently selected plot identifier for detailed overview.
     * @type {import('vue').Ref<number|string|null>}
     */
    const selectedPlotId = ref(null);

    /**
     * Current weather summary entity.
     * @type {import('vue').Ref<WeatherSummary|null>}
     */
    const weatherSummary = ref(null);
     * Number of loaded plots.
     * @type {import('vue').ComputedRef<number>}
     */
    const plotsCount = computed(() => {
        return plotsLoaded.value ? plots.value.length : 0;
    });

    /**
     * List of errors encountered during API operations.
     * @type {import('vue').Ref<Error[]>}
     */
    const errors = ref([]);

    /**
     * Whether plots have been loaded from the API.
     * @type {import('vue').Ref<boolean>}
     */
    const plotsLoaded = ref(false);

    /**
     * Dashboard monitoring aggregate for the summary cards.
     * @type {import('vue').Ref<MonitoringSummary|null>}
     */
    const monitoringSummary = ref(null);

    /**
     * Overall Plot Health card entity.
     * @type {import('vue').Ref<OverallPlotHealth>}
     */
    const overallPlotHealth = ref(new OverallPlotHealth({}));

    /**
     * NDVI Status card entity.
     * @type {import('vue').Ref<AgronomicRecord>}
     */
    const ndviStatus = ref(new AgronomicRecord({}));

    /**
     * Chill Accumulation card entity.
     * @type {import('vue').Ref<ChillHourRecord>}
     */
    const chillAccumulation = ref(new ChillHourRecord({}));

    /**
     * Yield Forecast card entity.
     * @type {import('vue').Ref<YieldForecast>}
     */
    const yieldForecast = ref(new YieldForecast({}));

    /**
     * Whether the dashboard summary cards have been loaded from the API.
     * @type {import('vue').Ref<boolean>}
     */
    const monitoringSummaryLoaded = ref(false);

    /**
     * Returns the full Plot entity based on the current selected ID.
     * @type {import('vue').ComputedRef<Plot|null>}
     */
    const selectedPlot = computed(() => {
        return plots.value.find(p => p.id === selectedPlotId.value) || null;
    });

    /**
     * Time elapsed since the last update of the selected plot.
     * @type {import('vue').ComputedRef<string>}
     */
    const selectedPlotTimeElapsed = computed(() => {
        return DateTimeFormatter.formatRelativeTime(selectedPlot.value?.lastUpdate);
    });

    /**
     * UI-facing props for the Overall Plot Health card.
     * @type {import('vue').ComputedRef<Object>}
     */
    const overallPlotHealthCard = computed(() => {
        const normalizedStatus = overallPlotHealth.value.status.toLowerCase();

        return {
            status: overallPlotHealth.value.status,
            isHealthy: normalizedStatus === 'healthy' && !overallPlotHealth.value.isCritical,
            healthyPlotsCount: overallPlotHealth.value.healthyPlotsCount,
            reviewPlotsCount: overallPlotHealth.value.reviewPlotsCount
        };
    });

    /**
     * UI-facing props for the NDVI Status card.
     * @type {import('vue').ComputedRef<Object>}
     */
    const ndviStatusCard = computed(() => ({
        value: ndviStatus.value.ndviIndex,
        trend: ndviStatus.value.ndviTrend,
        statusLabel: ndviStatus.value.ndviStatusLabel
    }));

    /**
     * UI-facing props for the Chill Accumulation card.
     * @type {import('vue').ComputedRef<Object>}
     */
    const chillAccumulationCard = computed(() => ({
        value: chillAccumulation.value.accumulatedChillPortions,
        weeklyDiff: chillAccumulation.value.weeklyDiff,
        threshold: chillAccumulation.value.threshold
    }));

    /**
     * UI-facing props for the Yield Forecast card.
     * @type {import('vue').ComputedRef<Object>}
     */
    const yieldForecastCard = computed(() => ({
        tonnes: yieldForecast.value.tonnes,
        riskLevel: yieldForecast.value.riskLevel,
        description: yieldForecast.value.description
    }));
     * Computed property that prepares analysis data for the PrimeVue Chart component.
     * Transforms backend analysis entities into Chart.js compatible data objects.
     * @type {import('vue').ComputedRef<Object>}
     */
    const analysisChartData = computed(() => {
        if (!analysisData.value) return { labels: [], datasets: [] };

        return {
            labels: analysisData.value.labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'NDVI Index',
                    backgroundColor: '#2E4A3A',
                    hoverBackgroundColor: '#2E4A3A',
                    data: analysisData.value.ndviSeries,
                    yAxisID: 'yNDVI',
                    borderRadius: 4,
                    barThickness: 20
                },
                {
                    type: 'line',
                    label: 'Chill Portions (CP)',
                    borderColor: '#5B8DEF',
                    borderWidth: 3,
                    fill: false,
                    data: analysisData.value.cpSeries,
                    yAxisID: 'yCP',
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#5B8DEF'
                },
                {
                    type: 'line',
                    label: 'Threshold',
                    borderColor: '#FF8080',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    data: analysisData.value.cpSeries.map(() => analysisData.value.threshold),
                    yAxisID: 'yCP'
                }
            ]
        };
    });
     * List of IoT devices.
     * @type {import('vue').Ref<IotDevice[]>}
     */
    const iotDevices = ref([]);

    /**
     * Whether IoT devices have been loaded.
     * @type {import('vue').Ref<boolean>}
     */
    const iotDevicesLoaded = ref(false);


    /**
     * Loads plots from infrastructure and updates the application state.
     * @returns {void}
     */
    function fetchPlots() {
        errors.value = [];
        agronomicApi.getPlots().then(response => {
            plots.value = PlotAssembler.toEntitiesFromResponse(response);
            plotsLoaded.value = true;
            if (plots.value.length > 0 && !selectedPlotId.value) {
                selectedPlotId.value = plots.value[0].id;
            }
        }).catch(error => {
            console.error("Error loading plots:", error);
            errors.value.push(error);
        });
    }

    function fetchWeather(city = 'Tacna') {
        agronomicApi.getWeather({ city }).then(response => {
            const entities = WeatherSummaryAssembler.toEntitiesFromResponse(response);
            weatherSummary.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            errors.value.push(error);
        });
    }


    /**
     * Loads the dashboard monitoring summary and hydrates the four independent card entities.
     * @returns {void}
     */
    function fetchMonitoringSummary() {
        errors.value = [];
        agronomicApi.http.get(monitoringSummariesEndpointPath).then(response => {
            const summary = MonitoringSummaryAssembler.toEntityFromResponse(response);

            monitoringSummary.value = summary;
            overallPlotHealth.value = summary?.overallPlotHealth || new OverallPlotHealth({});
            ndviStatus.value = summary?.latestNdvi || new AgronomicRecord({});
            chillAccumulation.value = summary?.chillHourRecord || new ChillHourRecord({});
            yieldForecast.value = summary?.yieldForecast || new YieldForecast({});
            monitoringSummaryLoaded.value = true;
        }).catch(error => {
            console.error("Error loading monitoring summary:", error);
            errors.value.push(error);
        });
    }

    /**
     * Updates the selected plot identifier.
     * @param {number|string} id - Plot identifier.
     */
    function selectPlot(id) {
        selectedPlotId.value = id;
    }

    /**
     * Updates the plot filter for the analysis chart and triggers a data refresh.
     * @param {string|number} id - Plot identifier or 'all'.
     */
    function setAnalysisPlot(id) {
        analysisPlotId.value = id;
        fetchAnalysisStatistics();
    }

    /**
     * Updates the time range for the analysis chart and triggers a data refresh.
     * @param {string} range - Time span ('7days', '30days', 'campaign').
     */
    function setAnalysisTimeRange(range) {
        analysisTimeRange.value = range;
        fetchAnalysisStatistics();
    }

    /**
     * Fetches pre-calculated agronomic statistics from the infrastructure layer.
     * Syncs the analysisData state with the backend response.
     */
    function fetchAnalysisStatistics() {
        analysisLoading.value = true;
        const params = {
            plotId: String(analysisPlotId.value),
            timeRange: analysisTimeRange.value
        };

        agronomicApi.getStatistics(params).then(response => {
            const data = response.data || response;
            const entities = AgronomicAnalysisAssembler.toEntitiesFromResponse(data);
            analysisData.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            console.error("Error fetching statistics:", error);
            errors.value.push(error);
            analysisData.value = null;
        }).finally(() => {
            analysisLoading.value = false;
     * Fetches all IoT devices.
     */
    function fetchIotDevices() {
        agronomicApi.getIotDevices().then(response => {
            iotDevices.value = IotDeviceAssembler.toEntitiesFromResponse(response);
            iotDevicesLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Gets an IoT device by ID from the local state.
     * @param {number|string} id 
     * @returns {IotDevice|null}
     */
    function getIotDeviceById(id) {
        return iotDevices.value.find(d => String(d.id) === String(id)) || null;
    }

    /**
     * Adds a new IoT device.
     * @param {IotDevice} device 
     */
    function addIotDevice(device) {
        const resource = IotDeviceAssembler.toResourceFromEntity(device);
        agronomicApi.createIotDevice(resource).then(response => {
            const entity = IotDeviceAssembler.toEntityFromResource(response.data);
            iotDevices.value.push(entity);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Updates an existing IoT device.
     * @param {IotDevice} device 
     */
    function updateIotDevice(device) {
        const resource = IotDeviceAssembler.toResourceFromEntity(device);
        agronomicApi.updateIotDevice(device.id, resource).then(response => {
            const index = iotDevices.value.findIndex(d => d.id === device.id);
            if (index !== -1) {
                iotDevices.value[index] = IotDeviceAssembler.toEntityFromResource(response.data);
            }
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Deletes an IoT device.
     * @param {IotDevice} device 
     */
    function deleteIotDevice(device) {
        agronomicApi.deleteIotDevice(device.id).then(() => {
            iotDevices.value = iotDevices.value.filter(d => d.id !== device.id);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    return {
        plots,
        selectedPlotId,
        selectedPlot,
        monitoringSummary,
        overallPlotHealth,
        ndviStatus,
        chillAccumulation,
        yieldForecast,
        overallPlotHealthCard,
        ndviStatusCard,
        chillAccumulationCard,
        yieldForecastCard,
        errors,
        plotsLoaded,
        monitoringSummaryLoaded,
        fetchPlots,
        fetchMonitoringSummary,
        selectPlot,
        selectedPlotTimeElapsed,
        analysisPlotId,
        analysisTimeRange,
        analysisData,
        analysisLoading,
        setAnalysisPlot,
        setAnalysisTimeRange,
        fetchAnalysisStatistics,
        analysisChartData
        iotDevices,
        iotDevicesLoaded,
        fetchIotDevices,
        getIotDeviceById,
        addIotDevice,
        updateIotDevice,
        weatherSummary,
        deleteIotDevice
    };
});

export default useAgronomicStore;
