import { SatelliteImagery } from "../domain/model/satellite-imagery.entity.js";

/**
 * Maps satellite data resources into SatelliteImagery domain entities.
 * * @class SatelliteImageryAssembler
 */
export class SatelliteImageryAssembler {
    /**
     * @param {Object} resource - Raw imagery data.
     * @returns {SatelliteImagery} SatelliteImagery entity.
     */
    static toEntityFromResource(resource) {
        return new SatelliteImagery({ ...resource });
    }

    /**
     * Parses imagery resources from a response.
     * * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {SatelliteImagery[]} List of imagery entities.
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