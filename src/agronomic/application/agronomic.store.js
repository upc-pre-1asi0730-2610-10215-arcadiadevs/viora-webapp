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
import { AgronomicRecordAssembler } from "../infrastructure/agronomic-record.assembler.js";
import { WeatherSummaryAssembler } from "../infrastructure/weather-summary.assembler.js";
import { YieldForecastAssembler } from "../infrastructure/yield-forecast.assembler.js";
import { ChillHourRecordAssembler } from "../infrastructure/chill-hour-record.assembler.js";
import { MonitoringSummaryAssembler } from "../infrastructure/monitoring-summary.assembler.js";
import { AgronomicAnalysisAssembler } from "../infrastructure/agronomic-analysis.assembler.js";
import { IotDeviceAssembler } from "../infrastructure/iot-device.assembler.js";
import { DateTimeFormatter } from "../../shared/infrastructure/date-time.formatter.js";

import { Plot } from "../domain/model/plot.entity.js";
import { AgronomicRecord } from "../domain/model/agronomic-record.entity.js";
import { WeatherSummary } from "../domain/model/weather-summary.entity.js";
import { YieldForecast } from "../domain/model/yield-forecast.entity.js";
import { ChillHourRecord } from "../domain/model/chill-hour-record.entity.js";
import { MonitoringSummary } from "../domain/model/monitoring-summary.entity.js";
import { IotDevice } from "../domain/model/iot-device.entity.js";

const agronomicApi = new AgronomicApi();

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
     * Currently selected plot identifier for detailed overview.
     * @type {import('vue').Ref<number|string|null>}
     */
    const selectedPlotId = ref(null);

    /**
     * List of telemetry record entities.
     * @type {import('vue').Ref<AgronomicRecord[]>}
     */
    const agronomicRecords = ref([]);

    /**
     * Current weather summary entity.
     * @type {import('vue').Ref<WeatherSummary|null>}
     */
    const weatherSummary = ref(null);

    /**
     * Current yield forecast entity.
     * @type {import('vue').Ref<YieldForecast|null>}
     */
    const yieldForecast = ref(null);

    /**
     * Current chill hour accumulation entity.
     * @type {import('vue').Ref<ChillHourRecord|null>}
     */
    const chillHourRecord = ref(null);

    /**
     * Global monitoring summary for the dashboard.
     * @type {import('vue').Ref<MonitoringSummary|null>}
     */
    const monitoringSummary = ref(null);

    /**
     * List of errors encountered during API operations.
     * @type {import('vue').Ref<Error[]>}
     */
    const errors = ref([]);

    /**
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
     * Whether plots have been loaded from the API.
     * @type {import('vue').Ref<boolean>}
     */
    const plotsLoaded = ref(false);

    /**
     * Whether the monitoring summary has been loaded.
     * @type {import('vue').Ref<boolean>}
     */
    const summaryLoaded = ref(false);

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
     * Returns the full Plot entity based on the current selected ID.
     * @type {import('vue').ComputedRef<Plot|null>}
     */
    const selectedPlot = computed(() => {
        return plots.value.find(p => p.id === selectedPlotId.value) || null;
    });

    /**
     * Number of loaded plots.
     * @type {import('vue').ComputedRef<number>}
     */
    const plotsCount = computed(() => {
        return plotsLoaded.value ? plots.value.length : 0;
    });

    /**
     * Number of loaded telemetry records.
     * @type {import('vue').ComputedRef<number>}
     */
    const recordsCount = computed(() => {
        return agronomicRecords.value.length;
    });

    /**
     * Time elapsed since the last update of the selected plot.
     * @type {import('vue').ComputedRef<string>}
     */
    const selectedPlotTimeElapsed = computed(() => {
        return DateTimeFormatter.formatRelativeTime(selectedPlot.value?.lastUpdate);
    });

    /**
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

    /**
     * Loads the global farm summary from infrastructure.
     * @param {string} [period='current'] - Filter period.
     * @returns {void}
     */
    function fetchMonitoringSummary(period = 'current') {
        errors.value = [];
        agronomicApi.getSummaries(period).then(response => {
            const entity = MonitoringSummaryAssembler.toEntityFromResponse(response);
            monitoringSummary.value = entity;
            summaryLoaded.value = true;
        }).catch(error => {
            console.error("Error loading monitoring summary:", error);
            errors.value.push(error);
        });
    }

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
        });
    }

    /**
     * Loads telemetry records for a plot and calculates yield based on area.
     * @param {number|string} plotId - Target plot identifier.
     * @param {string} [period='30d'] - Time span.
     * @returns {void}
     */
    function fetchRecords(plotId, period = '30d') {
        const plotIdNum = typeof plotId === 'string' ? parseInt(plotId) : plotId;
        const plot = plots.value.find(p => p.id === plotIdNum);
        const areaSize = plot ? plot.areaSize : 0;

        agronomicApi.getRecords({ plotId, period }).then(response => {
            agronomicRecords.value = AgronomicRecordAssembler.toEntitiesFromResponse(response);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Loads current weather information for the specified city.
     * @param {string} [city='Tacna'] - Target city.
     * @returns {void}
     */
    function fetchWeather(city = 'Tacna') {
        agronomicApi.getWeather({ city }).then(response => {
            const entities = WeatherSummaryAssembler.toEntitiesFromResponse(response);
            weatherSummary.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Loads yield predictions for a specific plot.
     * @param {number|string} plotId - Plot identifier.
     * @returns {void}
     */
    function fetchYieldForecast(plotId) {
        agronomicApi.getYieldForecastByPlot(plotId).then(response => {
            const entities = YieldForecastAssembler.toEntitiesFromResponse(response);
            yieldForecast.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * Loads thermal accumulation summary for the dashboard.
     * @param {string} [period='current'] - Filter period.
     * @returns {void}
     */
    function fetchChillHourSummary(period = 'current') {
        agronomicApi.getSummaries(period).then(response => {
            const entities = ChillHourRecordAssembler.toEntitiesFromResponse(response);
            chillHourRecord.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
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

    /**
     * Resets temporary telemetry and summary states.
     * @returns {void}
     */
    function clearTelemetry() {
        agronomicRecords.value = [];
        chillHourRecord.value = null;
        yieldForecast.value = null;
        monitoringSummary.value = null;
        summaryLoaded.value = false;
    }

    return {
        plots,
        selectedPlotId,
        selectedPlot,
        agronomicRecords,
        weatherSummary,
        yieldForecast,
        chillHourRecord,
        monitoringSummary,
        errors,
        plotsLoaded,
        summaryLoaded,
        plotsCount,
        recordsCount,
        fetchMonitoringSummary,
        fetchPlots,
        selectPlot,
        fetchRecords,
        fetchWeather,
        fetchYieldForecast,
        fetchChillHourSummary,
        clearTelemetry,
        selectedPlotTimeElapsed,
        analysisPlotId,
        analysisTimeRange,
        analysisData,
        analysisLoading,
        analysisChartData,
        setAnalysisPlot,
        setAnalysisTimeRange,
        fetchAnalysisStatistics,
        iotDevices,
        iotDevicesLoaded,
        fetchIotDevices,
        getIotDeviceById,
        addIotDevice,
        updateIotDevice,
        deleteIotDevice
    };
});

export default useAgronomicStore;