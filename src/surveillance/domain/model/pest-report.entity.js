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
     * @param {string} [params.riskZone='FULL_PLOT']
     * @param {string[]} [params.symptoms=[]]
     * @param {string} [params.observedSeverity='Low']
     * @param {string} [params.notes='']
     * @param {boolean} [params.evaluated=false]
     * @param {string} [params.calculatedRisk='']
     * @param {string} [params.probableThreat='']
     * @param {string} [params.status='']
     * @param {boolean} [params.alertConfirmed=false]
     * @param {string} [params.date='']
     * @param {string} [params.reportedBy='']
     */
    constructor({
        id = null,
        code = '',
        plotId = null,
        plotName = '',
        riskZone = 'FULL_PLOT',
        symptoms = [],
        observedSeverity = 'Low',
        notes = '',
        description = '',
        evaluated = false,
        calculatedRisk = '',
        probableThreat = '',
        status = '',
        alertConfirmed = false,
        result = '',
        date = '',
        reportedBy = ''
    } = {}) {
        this.id = id;
        this.code = code;
        this.plotId = plotId;
        this.plotName = plotName;
        this.riskZone = riskZone;
        this.symptoms = symptoms;
        this.observedSeverity = observedSeverity;
        this.notes = notes || description;
        this.description = this.notes;
        this.evaluated = evaluated;
        this.calculatedRisk = calculatedRisk;
        this.probableThreat = probableThreat;
        this.status = status || result;
        this.alertConfirmed = alertConfirmed;
        this.date = date;
        this.reportedBy = reportedBy;
    }

    /** @returns {string} Formatted report code like SR-REP-XXX */
    get codeLabel() {
        return this.code || 'SR-REP-' + String(this.id ?? 0).padStart(3, '0');
    }

    /** @returns {string} Human-readable symptoms label */
    get symptomsLabel() {
        if (!this.symptoms || this.symptoms.length === 0) return 'No symptoms recorded';
        return this.symptoms
            .map(symptom => typeof symptom === 'object' ? (symptom.description || symptom.id || '') : symptom)
            .filter(Boolean)
            .join(', ');
    }

    /** @returns {string} Human-readable risk zone label */
    get riskZoneLabel() {
        return RISK_ZONE_LABELS[this.riskZone] || this.riskZone;
    }

    /** @returns {PestReportResult} Outcome derived from backend evaluation status */
    get result() {
        const status = String(this.status || '').trim().toUpperCase();

        if (this.alertConfirmed || status === 'CONFIRMED') return 'Alert confirmed';
        if (status === 'UNDER_REVIEW') return 'Under review';
        return 'Archived';
    }

    /** @returns {string} Human-readable result label */
    get resultLabel() {
        return RESULT_LABELS[this.result] || this.result;
    }

    /** @returns {boolean} Whether this report is still active (under review or confirmed) */
    get isActive() {
        return this.result === 'Under review' || this.result === 'Alert confirmed';
    }

    /** @returns {boolean} Whether this report has been confirmed */
    get isConfirmed() {
        return this.result === 'Alert confirmed';
    }
}
