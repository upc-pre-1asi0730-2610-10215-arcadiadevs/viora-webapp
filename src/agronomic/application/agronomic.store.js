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

import { Plot } from "../domain/model/plot.entity.js";
import { AgronomicRecord } from "../domain/model/agronomic-record.entity.js";
import { ChillHourRecord } from "../domain/model/chill-hour-record.entity.js";
import { MonitoringSummary } from "../domain/model/monitoring-summary.entity.js";
import { OverallPlotHealth } from "../domain/model/overall-plot-health.entity.js";
import { YieldForecast } from "../domain/model/yield-forecast.entity.js";
import {DateTimeFormatter} from "../../shared/infrastructure/date-time.formatter.js";

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
     * Currently selected plot identifier for detailed overview.
     * @type {import('vue').Ref<number|string|null>}
     */
    const selectedPlotId = ref(null);

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
        selectedPlotTimeElapsed
    };
});

export default useAgronomicStore;
