/**
 * OverallPlotHealth value object.
 * Represents the aggregated health status of all plots within the farm.
 * Used for the Surveillance context dashboard card.
 * @class OverallPlotHealth
 */
export class OverallPlotHealth {
    /**
     * @param {Object} params
     * @param {string} [params.status='Healthy'] - General health status (e.g., 'Healthy', 'Warning').
     * @param {number} [params.healthyPlotsCount=0] - Number of plots with stable or rising NDVI.
     * @param {number} [params.reviewPlotsCount=0] - Number of plots with significant NDVI drops.
     */
    constructor({ status = 'Healthy', healthyPlotsCount = 0, reviewPlotsCount = 0 }) {
        /** @type {string} Global status label. */
        this.status = status;
        /** @type {number} Count of healthy plots. */
        this.healthyPlotsCount = healthyPlotsCount;
        /** @type {number} Count of plots requiring attention. */
        this.reviewPlotsCount = reviewPlotsCount;
    }

    /**
     * Returns true if there are more plots under review than healthy ones.
     * @returns {boolean}
     */
    get isCritical() {
        return this.reviewPlotsCount > this.healthyPlotsCount;
    }
}