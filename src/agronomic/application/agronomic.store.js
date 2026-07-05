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
import { IotDeviceSummaryAssembler } from "../infrastructure/iot-device-summary.assembler.js";
import { PlotDetailAssembler } from "../infrastructure/plot-detail.assembler.js";
import { MyPlotsOverviewAssembler } from "../infrastructure/my-plots-overview.assembler.js";
import { PlotRegistrationAssembler } from "../infrastructure/plot-registration.assembler.js";
import { DynamicNutritionPlanAssembler } from "../infrastructure/dynamic-nutrition-plan.assembler.js";
import { DateTimeFormatter } from "../../shared/infrastructure/date-time.formatter.js";

const agronomicApi = new AgronomicApi();

/**
 * Reactive store that exposes Agronomic commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
export const useAgronomicStore = defineStore('agronomic', () => {
    /** @type {import('vue').Ref<Array<import('../domain/model/plot.entity.js').Plot>>} */
    const plots = ref([]);

    /** @type {import('vue').Ref<number|string|null>} */
    const selectedPlotId = ref(null);

    /** @type {import('vue').Ref<number|string>} */
    const dashboardScope = ref('all');

    /** @type {import('vue').Ref<string>} */
    const dashboardTimeRange = ref('current');

    /** @type {import('vue').Ref<Array<import('../domain/model/agronomic-record.entity.js').AgronomicRecord>>} */
    const agronomicRecords = ref([]);

    /** @type {import('vue').Ref<import('../domain/model/weather-summary.entity.js').WeatherSummary|null>} */
    const weatherSummary = ref(null);

    /** @type {import('vue').Ref<import('../domain/model/yield-forecast.entity.js').YieldForecast|null>} */
    const yieldForecast = ref(null);

    /** @type {import('vue').Ref<import('../domain/model/chill-hour-record.entity.js').ChillHourRecord|null>} */
    const chillHourRecord = ref(null);

    /** @type {import('vue').Ref<import('../domain/model/monitoring-summary.entity.js').MonitoringSummary|null>} */
    const monitoringSummary = ref(null);

    /** @type {import('vue').Ref<import('../domain/model/agronomic-analysis.entity.js').AgronomicAnalysis|null>} */
    const dashboardStatistics = ref(null);

    /** @type {import('vue').Ref<Array<Error>>} */
    const errors = ref([]);

    /** @type {import('vue').Ref<Array<import('../domain/model/iot-device.entity.js').IotDevice>>} */
    const iotDevices = ref([]);

    /** @type {import('vue').Ref<Object|null>} */
    const iotDeviceSummary = ref(null);

    /** @type {import('vue').Ref<boolean>} */
    const iotDevicesLoaded = ref(false);

    /** @type {import('vue').Ref<boolean>} */
    const plotsLoaded = ref(false);

    /** @type {import('vue').Ref<boolean>} */
    const summaryLoaded = ref(false);

    /** @type {import('vue').Ref<string|number>} */
    const analysisPlotId = ref('all');

    /** @type {import('vue').Ref<string>} */
    const analysisTimeRange = ref('30days');

    /** @type {import('vue').Ref<import('../domain/model/agronomic-analysis.entity.js').AgronomicAnalysis|null>} */
    const analysisData = ref(null);

    /** @type {import('vue').Ref<boolean>} */
    const analysisLoading = ref(false);

    /** @type {import('vue').ComputedRef<import('../domain/model/plot.entity.js').Plot|null>} */
    const selectedPlot = computed(() => {
        return plots.value.find(p => String(p.id) === String(selectedPlotId.value)) || null;
    });

    /** @type {import('vue').ComputedRef<import('../domain/model/plot.entity.js').Plot|null>} */
    const selectedDashboardPlot = computed(() => {
        return plots.value.find(p => String(p.id) === String(dashboardScope.value)) || null;
    });

    /** @type {import('vue').ComputedRef<number>} */
    const plotsCount = computed(() => {
        return plotsLoaded.value ? plots.value.length : 0;
    });

    /** @type {import('vue').ComputedRef<number>} */
    const recordsCount = computed(() => {
        return agronomicRecords.value.length;
    });

    /** @type {import('vue').ComputedRef<string>} */
    const selectedPlotTimeElapsed = computed(() => {
        return DateTimeFormatter.formatRelativeTime(selectedPlot.value?.lastUpdate);
    });

    /** @type {import('vue').ComputedRef<Array<import('../domain/model/iot-device.entity.js').IotDevice>>} */
    const selectedPlotIotDevices = computed(() => {
        const selectedId = selectedPlotId.value;
        if (selectedId === null) return [];
        return iotDevices.value.filter(device => String(device.plotId) === String(selectedId));
    });

    /** @type {import('vue').ComputedRef<Array<Object>>} */
    const dashboardInsightCards = computed(() => {
        const cards = iotDeviceSummary.value?.sensorCards || [];

        if (dashboardScope.value === 'all') {
            return cards;
        }

        return cards.filter(card => String(card.plotId) === String(dashboardScope.value));
    });

    /** @type {import('vue').ComputedRef<number>} */
    const onlineDevicesCount = computed(() => {
        if (!iotDeviceSummary.value) return 0;

        if (dashboardScope.value === 'all') {
            return iotDeviceSummary.value.totalOnlineDevices || 0;
        }

        return dashboardInsightCards.value.length;
    });

    /** @type {import('vue').ComputedRef<number>} */
    const plotsWithIotCount = computed(() => {
        return iotDeviceSummary.value?.plotsWithIot || 0;
    });

    /** @type {import('vue').ComputedRef<string>} */
    const lastSyncLabel = computed(() => {
        const lastSync = iotDeviceSummary.value?.lastSync;
        if (!lastSync) return 'No sync yet';

        const date = new Date(lastSync);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 24) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return diffInMinutes < 60 ? `${diffInMinutes} mins ago` : `${diffInHours} hours ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    });

    /** @type {import('vue').ComputedRef<Object>} */
    const analysisChartData = computed(() => {
        if (!analysisData.value) return { labels: [], datasets: [] };
        return {
            labels: analysisData.value.labels,
            datasets: [
                {
                    type: 'bar', label: 'NDVI Index', backgroundColor: '#2E4A3A', hoverBackgroundColor: '#2E4A3A',
                    data: analysisData.value.ndviSeries, yAxisID: 'yNDVI', borderRadius: 4, barThickness: 20
                },
                {
                    type: 'line', label: 'Chill Portions (CP)', borderColor: '#5B8DEF', borderWidth: 3, fill: false,
                    data: analysisData.value.cpSeries, yAxisID: 'yCP', tension: 0.4, pointRadius: 4, pointBackgroundColor: '#5B8DEF'
                },
                {
                    type: 'line', label: 'Threshold', borderColor: '#FF8080', borderWidth: 2, borderDash: [5, 5],
                    pointRadius: 0, fill: false, data: analysisData.value.cpSeries.map(() => analysisData.value.threshold), yAxisID: 'yCP'
                }
            ]
        };
    });

    /**
     * @param {number[]} values
     * @returns {'up'|'down'|'stable'}
     */
    const toNdviTrend = (values) => {
        if (!values || values.length === 0) return 'stable';
        const first = values[0];
        const last = values[values.length - 1];
        if (first === last) return 'stable';
        return last > first ? 'up' : 'down';
    };

    /**
     * @param {Object} statistics
     * @param {string} timeRange
     * @param {number} points
     * @returns {Object|null}
     */
    const sliceStatistics = (statistics, timeRange, points) => {
        if (!statistics) return null;
        const labels = statistics.labels.slice(-points);
        const ndviSeries = statistics.ndviSeries.slice(-points);
        const cpSeries = statistics.cpSeries.slice(-points);

        return {
            ...statistics,
            timeRange,
            labels,
            ndviSeries,
            cpSeries,
            trend: toNdviTrend(ndviSeries) === 'down' ? 'Down' : (toNdviTrend(ndviSeries) === 'up' ? 'Up' : 'Stable'),
        };
    };

    /**
     * @param {Object} statistics
     * @param {string} timeRange
     * @param {boolean} fromFallback
     * @returns {Object}
     */
    const toDashboardStatistics = (statistics, timeRange, fromFallback = false) => {
        if (timeRange === 'current') {
            return sliceStatistics(statistics, timeRange, 1);
        }
        if (timeRange === '7days' && fromFallback) {
            return sliceStatistics(statistics, timeRange, 2);
        }
        return statistics;
    };

    /**
     * @returns {Object|null}
     */
    const createDashboardRecordFromStatistics = () => {
        if (dashboardTimeRange.value === 'current') return null;
        const stats = dashboardStatistics.value;
        if (!stats || !stats.ndviSeries || stats.ndviSeries.length === 0) return null;
        return {
            ndviIndex: stats.ndviSeries[stats.ndviSeries.length - 1],
            ndviTrend: toNdviTrend(stats.ndviSeries),
            ndviStatusLabel: stats.statusLabel || (toNdviTrend(stats.ndviSeries) === 'up' ? 'Healthy' : 'Review')
        };
    };

    /**
     * @returns {Object|null}
     */
    const createChillRecordFromStatistics = () => {
        if (dashboardTimeRange.value === 'current') return null;
        const stats = dashboardStatistics.value;
        if (!stats || !stats.cpSeries || stats.cpSeries.length === 0) return null;

        const currentCp = stats.cpSeries[stats.cpSeries.length - 1];
        const previousCp = stats.cpSeries[0] !== undefined ? stats.cpSeries[0] : currentCp;

        return {
            accumulatedChillPortions: currentCp,
            weeklyDiff: currentCp - previousCp,
            threshold: stats.threshold || 600
        };
    };

    /** @type {import('vue').ComputedRef<Object|null>} */
    const adaptiveNdvi = computed(() => {
        const statsRecord = createDashboardRecordFromStatistics();
        if (statsRecord) return statsRecord;

        if (dashboardScope.value === 'all') {
            return monitoringSummary.value?.ndvi || null;
        }
        if (agronomicRecords.value.length > 0) {
            return [...agronomicRecords.value].sort((a, b) => new Date(b.date || b.recordedAt) - new Date(a.date || a.recordedAt))[0];
        }
        return monitoringSummary.value?.ndvi || null;
    });

    /** @type {import('vue').ComputedRef<Object|null>} */
    const adaptiveYield = computed(() => {
        if (dashboardScope.value === 'all') return monitoringSummary.value?.yieldForecast || null;
        return yieldForecast.value || monitoringSummary.value?.yieldForecast || null;
    });

    /** @type {import('vue').ComputedRef<Object|null>} */
    const adaptiveChill = computed(() => {
        const statsChill = createChillRecordFromStatistics();
        if (statsChill) return statsChill;
        return chillHourRecord.value || monitoringSummary.value?.chillAccumulation || null;
    });

    /** @type {import('vue').ComputedRef<Object|null>} */
    const adaptiveHealth = computed(() => monitoringSummary.value?.overallHealth || null);

    function fetchMonitoringSummary(period = 'current', fallbackToCurrent = false) {
        errors.value = [];
        agronomicApi.getSummaries(period).then(response => {
            const summary = MonitoringSummaryAssembler.toEntityFromResponse(response);
            if (!summary && fallbackToCurrent && period !== 'current') {
                fetchMonitoringSummary('current', false);
                return;
            }
            monitoringSummary.value = summary;
            chillHourRecord.value = summary?.chillAccumulation || null;
            summaryLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function fetchFallbackAgronomicStatistics(plotId, timeRange) {
        if (timeRange === '30days') {
            dashboardStatistics.value = null;
            return;
        }
        agronomicApi.getStatisticsSeries({ plotId: String(plotId), timeRange: '30days' })
            .then(response => {
                const data = response.data || response;
                const entities = AgronomicAnalysisAssembler.toEntitiesFromResponse(data);
                const stats = entities.length > 0 ? entities[0] : null;
                dashboardStatistics.value = stats ? toDashboardStatistics(stats, timeRange, true) : null;
            }).catch(err => errors.value.push(err));
    }

    function fetchDashboardStatistics(scope, timeRange) {
        const apiTimeRange = timeRange === 'current' ? '30days' : timeRange;

        agronomicApi.getStatisticsSeries({ plotId: String(scope), timeRange: apiTimeRange })
            .then(response => {
                const data = response.data || response;
                const entities = AgronomicAnalysisAssembler.toEntitiesFromResponse(data);
                const stats = entities.length > 0 ? entities[0] : null;

                if (!stats) {
                    fetchFallbackAgronomicStatistics(scope, timeRange);
                    return;
                }
                dashboardStatistics.value = toDashboardStatistics(stats, timeRange, false);
            }).catch(err => {
            errors.value.push(err);
            dashboardStatistics.value = null;
        });
    }

    function fetchPlots() {
        errors.value = [];
        return agronomicApi.getPlots().then(response => {
            plots.value = PlotAssembler.toEntitiesFromResponse(response);
            plotsLoaded.value = true;
            if (plots.value.length > 0 && !selectedPlotId.value) {
                selectedPlotId.value = plots.value[0].id;
            }
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function selectPlot(id) {
        selectedPlotId.value = id;
    }

    function setDashboardScope(scope) {
        dashboardScope.value = scope;
        agronomicRecords.value = [];
        yieldForecast.value = null;
        dashboardStatistics.value = null;

        fetchMonitoringSummary(dashboardTimeRange.value, true);
        fetchDashboardStatistics(scope, dashboardTimeRange.value);
        fetchIotDeviceSummary(scope);

        if (scope !== 'all') {
            const period = dashboardTimeRange.value === 'current' ? undefined : dashboardTimeRange.value;
            fetchRecords(scope, period);
            fetchYieldForecast(scope);
        }
    }

    function setDashboardTimeRange(range) {
        dashboardTimeRange.value = range;
        dashboardStatistics.value = null;

        fetchMonitoringSummary(range, true);
        fetchDashboardStatistics(dashboardScope.value, range);

        if (dashboardScope.value !== 'all') {
            const period = range === 'current' ? undefined : range;
            fetchRecords(dashboardScope.value, period);
            fetchYieldForecast(dashboardScope.value);
        }
    }

    function refreshDashboardData() {
        fetchPlots();
        fetchMonitoringSummary(dashboardTimeRange.value, true);
        fetchDashboardStatistics(dashboardScope.value, dashboardTimeRange.value);
        fetchWeather();
        fetchIotDevices();
        fetchIotDeviceSummary(dashboardScope.value);
        fetchAnalysisStatistics();

        if (dashboardScope.value !== 'all') {
            const period = dashboardTimeRange.value === 'current' ? undefined : dashboardTimeRange.value;
            fetchRecords(dashboardScope.value, period);
            fetchYieldForecast(dashboardScope.value);
        } else {
            agronomicRecords.value = [];
            yieldForecast.value = null;
        }
    }

    function setAnalysisPlot(id) {
        analysisPlotId.value = id;
        fetchAnalysisStatistics();
    }

    function setAnalysisTimeRange(range) {
        analysisTimeRange.value = range;
        fetchAnalysisStatistics();
    }

    function fetchAnalysisStatistics() {
        analysisLoading.value = true;
        const params = { plotId: String(analysisPlotId.value), timeRange: analysisTimeRange.value };
        agronomicApi.getStatisticsSeries(params).then(response => {
            const data = response.data || response;
            const entities = AgronomicAnalysisAssembler.toEntitiesFromResponse(data);
            analysisData.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            errors.value.push(error);
            analysisData.value = null;
        }).finally(() => {
            analysisLoading.value = false;
        });
    }

    function fetchRecords(plotId, period) {
        const params = period ? { plotId, period } : { plotId };
        agronomicApi.getRecords(params).then(response => {
            agronomicRecords.value = AgronomicRecordAssembler.toEntitiesFromResponse(response);
        }).catch(error => {
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

    function fetchYieldForecast(plotId) {
        agronomicApi.getYieldForecastByPlot(plotId).then(response => {
            const entities = YieldForecastAssembler.toEntitiesFromResponse(response);
            yieldForecast.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function fetchChillHourSummary(period = 'current') {
        agronomicApi.getSummaries(period).then(response => {
            const entities = ChillHourRecordAssembler.toEntitiesFromResponse(response);
            chillHourRecord.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function fetchIotDevices() {
        return agronomicApi.getIotDevices().then(response => {
            iotDevices.value = IotDeviceAssembler.toEntitiesFromResponse(response);
            iotDevicesLoaded.value = true;
        }).catch(error => {
            errors.value.push(error);
        });
    }

    /**
     * @param {string|number} scope
     */
    function fetchIotDeviceSummary(scope) {
        return agronomicApi.getIotDeviceSummaries().then(response => {
            const entities = IotDeviceSummaryAssembler.toEntitiesFromResponse(response);
            iotDeviceSummary.value = entities.length > 0 ? entities[0] : null;
        }).catch(error => {
            console.error("Problems with getting IoT: ", error);
            iotDeviceSummary.value = null;
        });


    }

    function getIotDeviceById(id) {
        return iotDevices.value.find(d => String(d.id) === String(id)) || null;
    }

    function addIotDevice(device) {
        agronomicApi.createIotDevice(device).then(response => {
            const entity = IotDeviceAssembler.toEntityFromResource(response.data);
            iotDevices.value.push(entity);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function updateIotDevice(device) {
        agronomicApi.updateIotDevice(device).then(response => {
            const index = iotDevices.value.findIndex(d => d.id === device.id);
            if (index !== -1) {
                iotDevices.value[index] = IotDeviceAssembler.toEntityFromResource(response.data);
            }
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function deleteIotDevice(device) {
        agronomicApi.deleteIotDevice(device.plotId, device.id).then(() => {
            iotDevices.value = iotDevices.value.filter(d => d.id !== device.id);
        }).catch(error => {
            errors.value.push(error);
        });
    }

    function clearTelemetry() {
        agronomicRecords.value = [];
        chillHourRecord.value = null;
        yieldForecast.value = null;
        monitoringSummary.value = null;
        summaryLoaded.value = false;
    }

    // ── Infrastructure-free data loading (Phase 1: DDD compliance) ─────

    /** Extracts the first resource from an Axios response (array or object). */
    const firstResource = (response) => {
        const data = response?.data;
        if (Array.isArray(data)) return data[0] ?? null;
        return data ?? null;
    };

    /**
     * Fetches plot detail by ID.
     * @param {string|number} plotId
     * @returns {Promise<Object|null>} PlotDetail entity or null.
     */
    async function fetchPlotDetail(plotId) {
        if (!plotId) return null;
        try {
            const response = await agronomicApi.getPlotDetail(plotId);
            return PlotDetailAssembler.toEntityFromResponse(response);
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    /**
     * Fetches monitoring summary for a specific plot.
     * @param {string|number} plotId
     * @returns {Promise<Object|null>} Summary data or null.
     */
    async function fetchPlotSummary(plotId) {
        if (!plotId) return null;
        try {
            const response = await agronomicApi.getPlotMonitoringSummary(plotId);
            return firstResource(response);
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    /**
     * Fetches weather forecast for a specific plot.
     * @param {string|number} plotId
     * @returns {Promise<Object|null>} Weather data or null.
     */
    async function fetchPlotWeather(plotId) {
        if (!plotId) return null;
        try {
            const response = await agronomicApi.getPlotWeatherForecast(plotId);
            return firstResource(response);
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    /**
     * Fetches aggregated My Plots overview.
     * @returns {Promise<Object>} MyPlotsOverview entity.
     */
    async function fetchMyPlotsOverview() {
        try {
            const response = await agronomicApi.getPlotsOverview();
            return MyPlotsOverviewAssembler.toEntityFromResponse(response);
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    /**
     * Fetches plot registration data for edit mode.
     * @param {string|number} plotId
     * @returns {Promise<Object|null>} Raw plot data or null.
     */
    async function fetchPlotForEdit(plotId) {
        if (!plotId) return null;
        try {
            const response = await agronomicApi.getPlotById(plotId);
            return response?.data ?? null;
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    /**
     * Registers a new plot.
     * @param {Object} plotData - Plot registration payload.
     * @returns {Promise<Object|null>} Registration response or null.
     */
    async function registerPlot(plotData) {
        try {
            const response = await agronomicApi.createPlot(plotData);
            return PlotRegistrationAssembler.toEntityFromResource(response.data);
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    /**
     * Updates an existing plot.
     * @param {string|number} plotId
     * @param {Object} plotData - Plot update payload.
     * @returns {Promise<boolean>} Success flag.
     */
    async function updatePlot(plotId, plotData) {
        try {
            await agronomicApi.updatePlot(plotId, plotData);
            return true;
        } catch (error) {
            errors.value.push(error);
            return false;
        }
    }

    /**
     * Deletes a plot.
     * @param {string|number} plotId
     * @returns {Promise<boolean>} Success flag.
     */
    async function deletePlot(plotId) {
        try {
            await agronomicApi.deletePlot(plotId);
            return true;
        } catch (error) {
            errors.value.push(error);
            return false;
        }
    }

    /**
     * Fetches the active nutrition plan for a plot.
     * @param {string|number} plotId
     * @returns {Promise<Object|null>} DynamicNutritionPlan entity or null.
     */
    async function fetchActiveNutritionPlan(plotId) {
        if (!plotId) return null;
        try {
            const response = await agronomicApi.getActiveNutritionPlan({ plotId });
            return DynamicNutritionPlanAssembler.toEntityFromResponse(response);
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    /**
     * Generates a new nutrition plan for a plot.
     * @param {string|number} plotId
     * @returns {Promise<boolean>} Success flag.
     */
    async function generateNutritionPlan(plotId) {
        if (!plotId) return false;
        try {
            await agronomicApi.generateNutritionPlan({ plotId });
            return true;
        } catch (error) {
            errors.value.push(error);
            return false;
        }
    }

    /**
     * Certifies a nutrition plan with application data.
     * @param {string|number} planId
     * @param {Object} application - Certification payload.
     * @returns {Promise<Object|null>} Updated DynamicNutritionPlan or null.
     */
    async function certifyNutritionPlan(planId, application) {
        if (!planId) return null;
        try {
            const response = await agronomicApi.certifyNutritionPlan(planId, application);
            return DynamicNutritionPlanAssembler.toEntityFromResponse(response);
        } catch (error) {
            errors.value.push(error);
            return null;
        }
    }

    return {
        plots,
        selectedPlotId,
        dashboardScope,
        dashboardTimeRange,
        selectedPlot,
        selectedDashboardPlot,
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
        adaptiveNdvi,
        adaptiveYield,
        adaptiveChill,
        adaptiveHealth,
        dashboardInsightCards,
        onlineDevicesCount,
        plotsWithIotCount,
        lastSyncLabel,
        fetchMonitoringSummary,
        fetchPlots,
        selectPlot,
        setDashboardScope,
        setDashboardTimeRange,
        refreshDashboardData,
        fetchRecords,
        fetchWeather,
        fetchYieldForecast,
        fetchChillHourSummary,
        clearTelemetry,
        selectedPlotTimeElapsed,
        selectedPlotIotDevices,
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
        fetchIotDeviceSummary,
        getIotDeviceById,
        addIotDevice,
        updateIotDevice,
        deleteIotDevice,
        firstResource,
        fetchPlotDetail,
        fetchPlotSummary,
        fetchPlotWeather,
        fetchMyPlotsOverview,
        fetchPlotForEdit,
        registerPlot,
        updatePlot,
        deletePlot,
        fetchActiveNutritionPlan,
        generateNutritionPlan,
        certifyNutritionPlan
    };
});

export default useAgronomicStore;
