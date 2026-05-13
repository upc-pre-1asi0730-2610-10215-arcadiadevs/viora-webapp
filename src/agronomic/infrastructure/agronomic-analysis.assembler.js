import { AgronomicAnalysis } from "../domain/model/agronomic-analysis.entity.js";

/**
 * @file agronomic-analysis.assembler.js
 * @description specialized assembler for mapping statistical resources to domain entities.
 */
export class AgronomicAnalysisAssembler {
    /**
     * Transforms a single resource into an entity.
     * @param {Object} resource - Raw data point.
     * @returns {AgronomicAnalysis}
     */
    static toEntityFromResource(resource) {
        return new AgronomicAnalysis({
            id: resource.id,
            plotId: resource.plotId,
            timeRange: resource.timeRange,
            labels: resource.labels || [],
            ndviSeries: resource.ndviSeries || [],
            cpSeries: resource.cpSeries || [],
            threshold: resource.threshold || 600,
            observation: resource.observation,
            trend: resource.trend,
            statusLabel: resource.statusLabel,
            description: resource.description
        });
    }

    /**
     * Transforms API response data into an array of entities.
     * @param {Array|Object} response - Raw response or data array.
     * @returns {AgronomicAnalysis[]}
     */
    static toEntitiesFromResponse(response) {
        const data = response.data || response;

        if (!Array.isArray(data)) {
            console.warn("AgronomicAnalysisAssembler: Expected an array but received:", data);
            return [];
        }

        return data.map(resource => this.toEntityFromResource(resource));
    }
}
