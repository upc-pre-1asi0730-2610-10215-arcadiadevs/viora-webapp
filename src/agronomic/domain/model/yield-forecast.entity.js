/**
 * YieldForecast domain entity.
 * Provides harvest estimations and risk assessments.
 * @class YieldForecast
 */
export class YieldForecast {
    /**
     * @param {Object} params
     * @param {number} [params.tonnes=0] - Estimated metric tonnes.
     * @param {string} [params.riskLevel='Low'] - Risk classification (Low, Medium, High).
     * @param {string} [params.description=''] - Footer text for detailed risk info.
     */
    constructor({ tonnes = 0, riskLevel = 'Low', description = '' }) {
        this.tonnes = tonnes;
        this.riskLevel = riskLevel;
        this.description = description;
    }
}