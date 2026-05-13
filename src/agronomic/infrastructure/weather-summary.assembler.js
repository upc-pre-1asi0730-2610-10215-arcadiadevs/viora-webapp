import { WeatherSummary } from "../domain/model/weather-summary.entity.js";

/**
 * Maps weather resources into WeatherSummary domain entities.
 * * @class WeatherSummaryAssembler
 */
export class WeatherSummaryAssembler {
    /**
     * @param {Object} resource - Raw weather summary data.
     * @returns {WeatherSummary} WeatherSummary entity.
     */
    static toEntityFromResource(resource) {
        return new WeatherSummary({ ...resource });
    }

    /**
     * Parses weather resources from a response.
     * * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {WeatherSummary[]} List of entities.
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