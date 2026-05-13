import { AgronomicRecord } from "../domain/model/agronomic-record.entity.js";

/**
 * Maps telemetry resources into AgronomicRecord domain entities.
 *
 * @class AgronomicRecordAssembler
 */
export class AgronomicRecordAssembler {
    /**
     * Maps a telemetry resource into an AgronomicRecord entity.
     * @param {Object} resource - Raw telemetry record.
     * @returns {AgronomicRecord} Record entity.
     */
    static toEntityFromResource(resource) {
        return new AgronomicRecord({
            ...resource
        });
    }

    /**
     * Parses records from a response and maps them into entities.
     *
     * @param {import('axios').AxiosResponse<Array<Object>|Object>} response - HTTP response.
     * @returns {AgronomicRecord[]} List of AgronomicRecord entities.
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`Mapping error: ${response.status}, ${response.statusText}`);
            return [];
        }

        // Extracts the list of resources from the response data.
        // It handles both direct arrays and object-wrapped resources.
        let resources = response.data instanceof Array
            ? response.data
            : response.data['agronomicRecords'] || [];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}