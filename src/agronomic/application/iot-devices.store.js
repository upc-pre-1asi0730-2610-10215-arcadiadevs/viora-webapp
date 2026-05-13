import { defineStore } from "pinia";
import { ref } from "vue";
import { IotDevice } from "../domain/model/iot-device.entity.js";

/**
 * Application service store for IoT Device management.
 * 
 * @returns {Object} Store state and actions.
 */
export const useIotDevicesStore = defineStore('iot-devices', () => {
    const devices = ref([
        new IotDevice({ id: 1, name: 'Sensor Alpha-1', plotId: 1, soilMoisture: 35, temperature: 24, leafHumidity: 60, status: 'active', lastUpdate: new Date() }),
        new IotDevice({ id: 2, name: 'Sensor Beta-2', plotId: 1, soilMoisture: 12, temperature: 28, leafHumidity: 45, status: 'warning', lastUpdate: new Date() }),
        new IotDevice({ id: 3, name: 'Sensor Gamma-3', plotId: 2, soilMoisture: 42, temperature: 22, leafHumidity: 70, status: 'active', lastUpdate: new Date() })
    ]);
    const errors = ref([]);
    const devicesLoaded = ref(true);

    /**
     * Fetches all IoT devices.
     */
    function fetchDevices() {
        // In a real app, this would call an API
        devicesLoaded.value = true;
    }

    /**
     * Adds a new IoT device.
     * @param {IotDevice} device 
     */
    function addDevice(device) {
        device.id = devices.value.length + 1;
        devices.value.push(device);
    }

    /**
     * Updates an existing IoT device.
     * @param {IotDevice} updatedDevice 
     */
    function updateDevice(updatedDevice) {
        const index = devices.value.findIndex(d => d.id === Number(updatedDevice.id));
        if (index !== -1) {
            devices.value[index] = updatedDevice;
        }
    }

    /**
     * Deletes an IoT device.
     * @param {number|string} id 
     */
    function deleteDevice(id) {
        devices.value = devices.value.filter(d => d.id !== id);
    }

    /**
     * Gets a device by its ID.
     * @param {number|string} id 
     * @returns {IotDevice|null}
     */
    function getDeviceById(id) {
        return devices.value.find(d => d.id === Number(id)) || null;
    }

    return {
        devices,
        errors,
        devicesLoaded,
        fetchDevices,
        addDevice,
        updateDevice,
        deleteDevice,
        getDeviceById
    };
});

export default useIotDevicesStore;