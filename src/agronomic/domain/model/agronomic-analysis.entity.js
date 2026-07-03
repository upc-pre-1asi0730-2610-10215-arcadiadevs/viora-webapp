/**
 * @file agronomic-analysis.entity.js
 * @description Domain entity representing historical agronomic performance data.
 */
export class AgronomicAnalysis {
    /**
     * @param {Object} params - Entity data.
     * @param {string|number} params.plotId - Associated plot ID.
     * @param {string} params.timeRange - Selection range.
     * @param {string[]} params.labels - Date labels for the chart.
     * @param {number[]} params.ndviSeries - NDVI values for the bars.
     * @param {number[]} params.cpSeries - Chill Portions values for the line.
     * @param {number[]} params.chillHoursSeries - Chill Hours values for the line.
     * @param {number} params.threshold - CP threshold for reference.
     * @param {string} params.chillRequirementSource - Source of chill requirement.
     * @param {string} params.chillMetricModel - Chill metric model used.
     * @param {string} params.chillUnit - Chill unit type.
     * @param {string} params.observation - Observation note.
     * @param {string} params.trend - Trend description.
     * @param {string} params.statusLabel - Status label.
     * @param {string} [params.description=''] - Summary description (derived from statusLabel + trend).
     * @param {Object} params.ndviTrend - NDVI trend data.
     * @param {Object} params.chillPortionsTrend - Chill portions trend data.
     * @param {Object} params.chillHoursTrend - Chill hours trend data.
     */
    constructor({
        plotId,
        timeRange,
        labels,
        ndviSeries,
        cpSeries,
        chillHoursSeries,
        threshold,
        chillRequirementSource,
        chillMetricModel,
        chillUnit,
        observation,
        trend,
        statusLabel,
        ndviTrend,
        chillPortionsTrend,
        chillHoursTrend
    }) {
        this.plotId = plotId;
        this.timeRange = timeRange;
        this.labels = labels || [];
        this.ndviSeries = ndviSeries || [];
        this.cpSeries = cpSeries || [];
        this.chillHoursSeries = chillHoursSeries || [];
        this.threshold = threshold || 600;
        this.chillRequirementSource = chillRequirementSource || '';
        this.chillMetricModel = chillMetricModel || '';
        this.chillUnit = chillUnit || '';
        this.observation = observation || '';
        this.trend = trend || '';
        this.statusLabel = statusLabel || '';
        this.description = this.#buildDescription(statusLabel, trend);
        this.ndviTrend = ndviTrend || null;
        this.chillPortionsTrend = chillPortionsTrend || null;
        this.chillHoursTrend = chillHoursTrend || null;
    }

    /**
     * Builds a description string from statusLabel and trend.
     * @param {string} statusLabel - Status label.
     * @param {string} trend - Trend description.
     * @returns {string} Built description.
     */
    #buildDescription(statusLabel, trend) {
        if (statusLabel && trend) {
            return `${statusLabel} - ${trend}`;
        }
        return statusLabel || trend || '';
    }
}