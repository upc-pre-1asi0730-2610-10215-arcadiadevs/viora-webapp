import { Plot } from "../domain/model/plot.entity.js";
import { SatelliteImageryAssembler } from "./satellite-imagery.assembler.js";

/**
 * PlotAssembler class.
 * Responsible for mapping raw plot resources from the API into rich Plot domain entities.
 * * @class PlotAssembler
 */
export class PlotAssembler {
    /**
     * Maps a raw plot resource into a Plot entity instance.
     * It ensures nested resources like satellite imagery are also hydrated
     * and provides defaults for health and risk status.
     * * @param {Object} resource - Raw plot data from the infrastructure layer.
     * @returns {Plot} A fully hydrated Plot entity.
     */
    static toEntityFromResource(resource) {
        // Hydrate satellite imagery if available
        const imagery = resource.currentImagery
            ? SatelliteImageryAssembler.toEntityFromResource(resource.currentImagery)
            : null;

        return new Plot({
            id: resource.id,
            name: resource.name,
            polygonCoordinates: resource.polygonCoordinates,
            areaSize: resource.areaSize,
            lastUpdate: resource.lastUpdate,
            currentImagery: imagery,
            healthStatus: resource.healthStatus,
            phenologicalRisk: resource.phenologicalRisk
        });
    }

    /**
     * Parses a collection of plot resources from an Axios response.
     * Handles both single object responses and arrays.
     * * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - Axios response.
     * @returns {Plot[]} Array of Plot domain entities.
     */
    static toEntitiesFromResponse(response) {
        if (!response || response.status !== 200 || !response.data) {
            console.error(`[PlotAssembler] Mapping error: Invalid response status ${response?.status}`);
            return [];
        }

        const resources = Array.isArray(response.data) ? response.data : [response.data];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}