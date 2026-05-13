/**
 * Application service store for the `Surveillance` bounded context.
 * Coordinates alert-related use cases and manages the global state for security and monitoring.
 *
 * @module useSurveillanceStore
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import { SurveillanceApi } from "../infrastructure/surveillance-api.js";
import { AlertAssembler } from "../infrastructure/alert.assembler.js";

const surveillanceApi = new SurveillanceApi();

/**
 * Reactive store that exposes Surveillance commands and queries.
 * @returns {Object} Store state and actions.
 */
export const useSurveillanceStore = defineStore('surveillance', () => {
    /**
     * List of current alert entities.
     * @type {import('vue').Ref<import('../domain/model/alert.entity.js').Alert[]>}
     */
    const alerts = ref([]);

    /**
     * Whether the alerts have been loaded from the API.
     * @type {import('vue').Ref<boolean>}
     */
    const alertsLoaded = ref(false);

    /**
     * List of errors encountered during API operations.
     * @type {import('vue').Ref<Error[]>}
     */
    const errors = ref([]);

    /**
     * Loads the most recent alerts from the infrastructure layer.
     * Automatically applies sorting and limits for the dashboard view.
     * @param {number} [limit=3] - Maximum number of alerts to fetch.
     * @returns {Promise<void>}
     */
    async function fetchRecentAlerts(limit = 3) {
        try {
            const params = {
                _limit: limit,
                _sort: 'date',
                _order: 'desc'
            };
            const response = await surveillanceApi.getAlerts(params);
            alerts.value = AlertAssembler.toEntitiesFromResponse(response);
            alertsLoaded.value = true;
        } catch (error) {
            console.error("[SurveillanceStore] Error fetching alerts:", error);
            errors.value.push(error);
        }
    }

    /**
     * Clears the current alerts from the state.
     */
    function clearAlerts() {
        alerts.value = [];
        alertsLoaded.value = false;
    }

    return {
        alerts,
        alertsLoaded,
        errors,
        fetchRecentAlerts,
        clearAlerts
    };
});

export default useSurveillanceStore;
