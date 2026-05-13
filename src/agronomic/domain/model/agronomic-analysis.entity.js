/**
 * @file agronomic-analysis.entity.js
 * @description Domain entity representing historical agronomic performance data.
 */
export class AgronomicAnalysis {
    /**
     * @param {Object} params - Entity data.
     * @param {string|number} params.id - Unique identifier.
     * @param {string|number} params.plotId - Associated plot ID.
     * @param {string} params.timeRange - Selection range.
     * @param {string[]} params.labels - Date labels for the chart.
     * @param {number[]} params.ndviSeries - NDVI values for the bars.
     * @param {number[]} params.cpSeries - Chill Portions values for the line.
     * @param {number} params.threshold - CP threshold for reference.
     * @param {string} params.observation - Observation note.
     * @param {string} params.trend - Trend description.
     * @param {string} params.statusLabel - Status label.
     * @param {string} params.description - Summary description.
     */
    constructor({ id, plotId, timeRange, labels, ndviSeries, cpSeries, threshold, observation, trend, statusLabel, description }) {
        this.id = id;
        this.plotId = plotId;
        this.timeRange = timeRange;
        this.labels = labels;
        this.ndviSeries = ndviSeries;
        this.cpSeries = cpSeries;
        this.threshold = threshold;
        this.observation = observation || '';
        this.trend = trend || '';
        this.statusLabel = statusLabel || '';
        this.description = description || '';
    }
}