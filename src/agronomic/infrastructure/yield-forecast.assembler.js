import { YieldForecast } from "../domain/model/yield-forecast.entity.js";

/**
 * Maps harvest prediction resources into YieldForecast entities.
 * * @class YieldForecastAssembler
 */
export class YieldForecastAssembler {
    /**
     * @param {Object} resource - Raw yield forecast data.
     * @returns {YieldForecast} YieldForecast entity.
     */
    static toEntityFromResource(resource) {
        return new YieldForecast({ ...resource });
    }

    /**
     * Parses yield forecast resources from a response.
     * * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {YieldForecast[]} List of entities.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`Mapping error: ${response.status}, ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : [response.data];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}