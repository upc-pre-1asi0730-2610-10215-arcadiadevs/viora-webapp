import { ChillHourRecord } from "../domain/model/chill-hour-record.entity.js";

/**
 * Maps thermal accumulation resources into ChillHourRecord entities.
 * * @class ChillHourRecordAssembler
 */
export class ChillHourRecordAssembler {
    /**
     * @param {Object} resource - Raw chill hour data.
     * @returns {ChillHourRecord} ChillHourRecord entity.
     */
    static toEntityFromResource(resource) {
        return new ChillHourRecord({ ...resource });
    }

    /**
     * Parses chill hour resources from a response.
     * * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {ChillHourRecord[]} List of entities.
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