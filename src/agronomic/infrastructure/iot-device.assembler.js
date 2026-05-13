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
        return new IotDevice({
            id: resource.id,
            name: resource.name,
            plotId: resource.plotId,
            soilMoisture: resource.soilMoisture,
            temperature: resource.temperature,
            leafHumidity: resource.leafHumidity,
            status: resource.status,
            lastUpdate: resource.lastUpdate
        });
    }

    /**
     * Maps an Axios response to an array of IotDevice entities.
     * @param {import('axios').AxiosResponse} response 
     * @returns {IotDevice[]}
     */
    static toEntitiesFromResponse(response) {
        if (!response || !response.data) return [];
        const resources = Array.isArray(response.data) ? response.data : [response.data];
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * Maps an IotDevice entity to a resource object for the API.
     * @param {IotDevice} entity 
     * @returns {Object}
     */
    static toResourceFromEntity(entity) {
        return {
            id: entity.id,
            name: entity.name,
            plotId: entity.plotId,
            soilMoisture: entity.soilMoisture,
            temperature: entity.temperature,
            leafHumidity: entity.leafHumidity,
            status: entity.status,
            lastUpdate: entity.lastUpdate
        };
    }
}