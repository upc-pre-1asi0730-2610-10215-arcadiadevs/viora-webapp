/**
 * AgronomicRecord entity for telemetry data and yield calculations.
 * Updated to support UI trends and status labels.
 * @class AgronomicRecord
 */
export class AgronomicRecord {
    /**
     * @param {Object} params
     * @param {string} [params.date=''] - Record date.
     * @param {number} [params.ndviIndex=0] - Vegetation index (NDVI).
     * @param {string} [params.ndviTrend='stable'] - Trend direction ('up', 'down', 'stable').
     * @param {string} [params.ndviStatusLabel=''] - Human-readable status (e.g., 'Stable vegetation vigor').
     * @param {number} [params.temp=0] - Measured temperature.
     * @param {number} [params.cp=0] - Accumulated Chill Portions on that date.
     * @param {number} [params.yieldValue=0] - Calculated yield (Area * NDVI).
     */
    constructor({
                    date = '',
                    ndviIndex = 0,
                    ndviTrend = 'stable',
                    ndviStatusLabel = '',
                    temp = 0,
                    cp = 0,
                    yieldValue = 0
                }) {
        this.date = date;
        this.ndviIndex = ndviIndex;
        this.ndviTrend = ndviTrend;
        this.ndviStatusLabel = ndviStatusLabel;
        this.temp = temp;
        this.cp = cp;
        this.yieldValue = yieldValue;
    }

    /**
     * Determines if this record meets the alternate bearing (vecería) threshold.
     * @param {number} threshold - Chill Portions threshold (e.g., 600).
     * @returns {boolean}
     */
    hasAlternanceRisk(threshold) {
        return this.cp < threshold;
    }
}