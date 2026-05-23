/**
 * @file iot-device-summary.assembler.js
 * @description Specialized assembler for mapping Iot Device Summary resources to domain entities.
 */

export class IotDeviceSummaryAssembler {
    /**
     * Transforms a single resource into an entity object.
     * @param {Object} resource - Raw data point.
     * @returns {Object|null}
     */
    static toEntityFromResource(resource) {
        if (!resource) return null;

        return {
            id: resource.id ?? null,
            totalOnlineDevices: resource.totalOnlineDevices ?? 0,
            plotsWithIot: resource.plotsWithIot ?? 0,
            lastSync: resource.lastSync ?? '',
            sensorCards: this.toSensorCards(resource.sensorCards ?? [])
        };
    }

    /**
     * Transforms a collection of resources into entities.
     * @param {Array|Object} response - Raw API response.
     * @returns {Array<Object>}
     */
    static toEntitiesFromResponse(response) {
        const data = response.data || response;
        if (!Array.isArray(data)) {
            const singleEntity = this.toEntityFromResource(data);
            return singleEntity ? [singleEntity] : [];
        }
        return data.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * @private
     * @param {Array<Object>} resources
     * @returns {Array<Object>}
     */
    static toSensorCards(resources) {
        return resources.map(resource => ({
            id: resource.id ?? null,
            plotId: resource.plotId ?? null,
            title: resource.title ?? '',
            sourceLabel: resource.sourceLabel ?? 'IoT',
            metricLabel: resource.metricLabel ?? '',
            metricValue: resource.metricValue ?? 0,
            metricUnit: resource.metricUnit ?? '',
            trend: this.toIotTrend(resource.trend),
            riskLevel: this.toIotRiskLevel(resource.riskLevel),
            recommendation: resource.recommendation ?? ''
        }));
    }

    /**
     * @private
     * @param {string|undefined} value
     * @returns {'Low'|'Medium'|'High'}
     */
    static toIotRiskLevel(value) {
        const validRiskLevels = ['Low', 'Medium', 'High'];
        return validRiskLevels.includes(value) ? value : 'Low';
    }

    /**
     * @private
     * @param {string|undefined} value
     * @returns {'up'|'down'|'stable'}
     */
    static toIotTrend(value) {
        const validTrends = ['up', 'down', 'stable'];
        return validTrends.includes(value) ? value : 'stable';
    }
}