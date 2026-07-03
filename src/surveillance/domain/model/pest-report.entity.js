/**
 * PestReport entity representing a pest sighting report submitted
 * through the surveillance bounded context.
 * @class PestReport
 */

const RISK_ZONE_LABELS = {
    FULL_PLOT: 'Full Plot',
    PARTIAL_PLOT: 'Partial Plot',
    EDGES: 'Edges'
};

const RESULT_LABELS = {
    'Alert confirmed': 'Alert confirmed',
    'Under review': 'Under review',
    'Archived': 'Archived'
};

/**
 * @typedef {'FULL_PLOT' | 'PARTIAL_PLOT' | 'EDGES'} RiskZone
 * @typedef {'Alert confirmed' | 'Under review' | 'Archived'} PestReportResult
 */

export class PestReport {
    /**
     * @param {Object} params
     * @param {number|null} [params.id=null]
     * @param {string} [params.code='']
     * @param {number|null} [params.plotId=null]
     * @param {string} [params.plotName='']
     * @param {string} [params.riskZone='PARTIAL_PLOT']
     * @param {string[]} [params.symptoms=[]]
     * @param {string} [params.description='']
     * @param {string} [params.result='Under review']
     * @param {string} [params.date='']
     * @param {string} [params.reportedBy='']
     */
    constructor({
        id = null,
        code = '',
        plotId = null,
        plotName = '',
        riskZone = 'PARTIAL_PLOT',
        symptoms = [],
        description = '',
        result = 'Under review',
        date = '',
        reportedBy = ''
    }) {
        this.id = id;
        this.code = code;
        this.plotId = plotId;
        this.plotName = plotName;
        this.riskZone = riskZone;
        this.symptoms = symptoms;
        this.description = description;
        this.result = result;
        this.date = date;
        this.reportedBy = reportedBy;
    }

    /** @returns {string} Formatted report code like SR-REP-XXX */
    get codeLabel() {
        return this.code || `SR-REP-${String(this.id).padStart(3, '0')}`;
    }

    /** @returns {string} Human-readable symptoms label */
    get symptomsLabel() {
        if (!this.symptoms || this.symptoms.length === 0) return 'No symptoms recorded';
        return this.symptoms.join(', ');
    }

    /** @returns {string} Human-readable risk zone label */
    get riskZoneLabel() {
        return RISK_ZONE_LABELS[this.riskZone] || this.riskZone;
    }

    /** @returns {string} Human-readable result label */
    get resultLabel() {
        return RESULT_LABELS[this.result] || this.result;
    }

    /** @returns {boolean} Whether this report is still active (under review) */
    get isActive() {
        return this.result === 'Under review';
    }

    /** @returns {boolean} Whether this report has been confirmed */
    get isConfirmed() {
        return this.result === 'Alert confirmed';
    }
}
