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
        return new WeatherSummary({
            id: resource?.id ?? null,
            city: resource?.city ?? '',
            currentTemp: resource?.currentTemp ?? 0,
            condition: resource?.condition ?? '',
            lastUpdate: resource?.lastUpdate ?? '',
            icon: resource?.icon ?? '',
            backgroundImage: resource?.backgroundImage ?? '',
            forecast3Days: (resource?.forecast3Days ?? []).map(day => ({
                dayLabel: day.dayLabel ?? '',
                minTemp: day.minTemp ?? 0,
                maxTemp: day.maxTemp ?? 0,
                condition: day.condition ?? ''
            })),
            temperatureAnomaly: resource?.temperatureAnomaly ?? 0,
            climateRisk: resource?.climateRisk ?? 'Low'
        });
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