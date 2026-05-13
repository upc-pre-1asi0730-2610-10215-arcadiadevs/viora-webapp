import { Alert } from "../domain/model/alert.entity.js";

/**
 * AlertAssembler class.
 * Responsible for mapping raw alert resources from the API into Alert domain entities.
 * @class AlertAssembler
 */
export class AlertAssembler {
    /**
     * Maps a raw alert resource into an Alert entity instance.
     * @param {Object} resource - Raw alert data from the infrastructure layer.
     * @returns {Alert} A hydrated Alert entity.
     */
    static toEntityFromResource(resource) {
        return new Alert({
            id: resource.id,
            type: resource.type,
            description: resource.description,
            severity: resource.severity,
            date: resource.date,
            status: resource.status,
            plot: {
                name: resource.plot?.name || '',
                location: resource.plot?.location || '',
                hectares: resource.plot?.hectares || 0
            }
        });
    }

    /**
     * Parses a collection of alert resources from an Axios response.
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - Axios response.
     * @returns {Alert[]} Array of Alert domain entities.
     */
    static toEntitiesFromResponse(response) {
        if (!response || response.status !== 200 || !response.data) {
            console.error(`[AlertAssembler] Mapping error: Invalid response status ${response?.status}`);
            return [];
        }

        const resources = Array.isArray(response.data) ? response.data : [response.data];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
