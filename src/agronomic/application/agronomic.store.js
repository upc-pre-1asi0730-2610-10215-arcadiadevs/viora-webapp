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
import { IotDeviceAssembler } from "../infrastructure/iot-device.assembler.js";


import { Plot } from "../domain/model/plot.entity.js";
import {DateTimeFormatter} from "../../shared/infrastructure/date-time.formatter.js";
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

    /**
     * Updates the selected plot identifier.
     * @param {number|string} id - Plot identifier.
     */
    function selectPlot(id) {
        selectedPlotId.value = id;
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

    return {
        plots,
        selectedPlotId,
        selectedPlot,
        errors,
        plotsLoaded,
        fetchPlots,
        selectPlot,
        selectedPlotTimeElapsed,
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