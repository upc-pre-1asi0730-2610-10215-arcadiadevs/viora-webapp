import { OverallPlotHealth } from "../domain/model/overall-plot-health.entity.js";

/**
 * OverallHealthAssembler class.
 * Translates raw health distribution data from the surveillance endpoints
 * into OverallPlotHealth value objects.
 * @class OverallHealthAssembler
 */
export class OverallHealthAssembler {
    /**
     * Maps a raw resource into an OverallPlotHealth entity.
     * @static
     * @param {Object} resource - Raw data from the health distribution endpoint.
     * @returns {OverallPlotHealth}
     */
    static toEntityFromResource(resource) {
        return new OverallPlotHealth({
            status: resource.status,
            healthyPlotsCount: resource.healthyPlotsCount,
            reviewPlotsCount: resource.reviewPlotsCount,
        });
    }

    /**
     * Parses a collection of health resources from a response.
     * @static
     * @param {import('axios').AxiosResponse} response - HTTP response.
     * @returns {OverallPlotHealth[]}
     */
    static toEntitiesFromResponse(response) {
        if (!response || response.status !== 200 || !response.data) {
            console.error(`[OverallHealthAssembler] Invalid response status: ${response?.status}`);
            return [];
        }

        const resources = Array.isArray(response.data)
            ? response.data
            : [response.data];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}