/**
 * ChillHourRecord entity to track thermal accumulation for olive dormancy.
 * Updated to include threshold for progress bar calculation.
 * @class ChillHourRecord
 */
export class ChillHourRecord {
    /**
     * @param {Object} params
     * @param {?number} [params.id=null]
     * @param {number} [params.plotId=0]
     * @param {number} [params.accumulatedChillPortions=0] - Total CP units.
     * @param {number} [params.weeklyDiff=0] - Comparison with the previous week.
     * @param {number} [params.threshold=600] - Target CP units for the season.
     * @param {string} [params.generatedAt=''] - Timestamp of the calculation.
     */
    constructor({
                    id = null,
                    plotId = 0,
                    accumulatedChillPortions = 0,
                    weeklyDiff = 0,
                    threshold = 600,
                    generatedAt = ''
                }) {
        this.id = id;
        this.plotId = plotId;
        this.accumulatedChillPortions = accumulatedChillPortions;
        this.weeklyDiff = weeklyDiff;
        this.threshold = threshold;
        this.generatedAt = generatedAt;
    }

    /**
     * Formats the weekly difference for UI badges.
     * @returns {string} E.g., "+6 from last week" or "-2 from last week".
     */
    get weeklyDiffLabel() {
        const sign = this.weeklyDiff >= 0 ? '+' : '-';
        return `${sign}${this.weeklyDiff} from last week`;
    }

    /**
     * Returns true if the accumulation is higher than last week.
     * @returns {boolean}
     */
    get isImproving() {
        return this.weeklyDiff > 0;
    }

    /**
     * Calculates the completion percentage.
     * @returns {number} 0-100 percentage.
     */
    get progressPercentage() {
        return Math.min(Math.round((this.accumulatedChillPortions / this.threshold) * 100), 100);
    }
}