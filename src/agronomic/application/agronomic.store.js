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

import { Plot } from "../domain/model/plot.entity.js";
import {DateTimeFormatter} from "../../shared/infrastructure/date-time.formatter.js";

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

    return {
        plots,
        selectedPlotId,
        selectedPlot,
        errors,
        plotsLoaded,
        fetchPlots,
        selectPlot,
        selectedPlotTimeElapsed
    };
});

export default useAgronomicStore;