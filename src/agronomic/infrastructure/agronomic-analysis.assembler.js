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
            plotId: resource.plotId,
            timeRange: resource.timeRange,
            labels: resource.labels || [],
            ndviSeries: resource.ndviSeries || [],
            cpSeries: resource.cpSeries || [],
            chillHoursSeries: resource.chillHoursSeries || [],
            threshold: resource.threshold || 600,
            chillRequirementSource: resource.chillRequirementSource || '',
            chillMetricModel: resource.chillMetricModel || '',
            chillUnit: resource.chillUnit || '',
            observation: resource.observation || '',
            trend: resource.trend || '',
            statusLabel: resource.statusLabel || '',
            ndviTrend: resource.ndviTrend || null,
            chillPortionsTrend: resource.chillPortionsTrend || null,
            chillHoursTrend: resource.chillHoursTrend || null
        });
    }

    /**
     * Transforms API response data into an array of entities.
     * @param {Array|Object} response - Raw response or data array.
     * @returns {AgronomicAnalysis[]}
     */
    static toEntitiesFromResponse(response) {
        const data = response.data || response;

        const resources = Array.isArray(data) ? data : [data];

        return resources.map(resource => this.toEntityFromResource(resource));
    }
}
