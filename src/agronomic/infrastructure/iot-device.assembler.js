import { IotDevice } from "../domain/model/iot-device.entity.js";

/**
 * Assembler for IoT Device entities.
 * Maps API resources to domain entities and vice versa.
 */
export class IotDeviceAssembler {
    /**
     * Maps a raw resource to an IotDevice entity.
     * @param {Object} resource 
     * @returns {IotDevice}
     */
    static toEntityFromResource(resource) {
        const status = resource.status
            ? String(resource.status).toLowerCase()
            : "active";

        return new IotDevice({
            id: resource.id,
            name: resource.name || resource.deviceName,
            plotId: resource.plotId,
            soilMoisture: resource.soilMoisture,
            temperature: resource.temperature,
            leafHumidity: resource.leafHumidity,
            status,
            lastUpdate: resource.lastUpdate,
            activationCode: resource.activationCode || ''
        });
    }

    /**
     * Maps an Axios response to an array of IotDevice entities.
     * @param {import('axios').AxiosResponse} response 
     * @returns {IotDevice[]}
     */
    static toEntitiesFromResponse(response) {
        if (!response || !response.data) return [];
        const resources = Array.isArray(response.data)
            ? response.data
            : response.data.iotDevices || [response.data];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * Maps an IotDevice entity to a resource object for the API.
     * @param {IotDevice} entity 
     * @returns {Object}
     */
    static toResourceFromEntity(entity) {
        const status = String(entity.status || "active").toUpperCase();

        return {
            id: entity.id,
            name: entity.name,
            deviceName: entity.name,
            plotId: entity.plotId,
            soilMoisture: entity.soilMoisture,
            temperature: entity.temperature,
            leafHumidity: entity.leafHumidity,
            status,
            iotDeviceStatus: status,
            activationCode: entity.activationCode,
            lastUpdate: entity.lastUpdate
        };
    }

    /**
     * Builds the POST body for claiming a device under /plots/{plotId}/iot-devices.
     * @param {IotDevice} entity
     * @returns {{deviceName: string, status: string, activationCode: string}}
     */
    static toCreateRequest(entity) {
        return {
            deviceName: entity.name,
            status: String(entity.status || "active").toUpperCase(),
            activationCode: entity.activationCode
        };
    }

    /**
     * Builds the PATCH body for updating device metadata.
     * @param {IotDevice} entity
     * @returns {{deviceName: string, iotDeviceStatus: string}}
     */
    static toUpdateRequest(entity) {
        return {
            deviceName: entity.name,
            iotDeviceStatus: String(entity.status || "active").toUpperCase()
        };
    }
}
