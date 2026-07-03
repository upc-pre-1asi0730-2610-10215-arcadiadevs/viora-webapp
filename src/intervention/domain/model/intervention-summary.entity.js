/**
 * Producer-facing view of a technical intervention: an accepted assistance case
 * composed with its lifecycle (prescription -> execution -> outcome).
 * @class Intervention
 */

/** @typedef {'AWAITING_PRESCRIPTION'|'PRESCRIPTION_ISSUED'|'RECOVERY_MONITORING'|'READY_TO_CLOSE'|'CLOSED'} InterventionStatus */
/** @typedef {'APPLIED_AS_PRESCRIBED'|'PARTIALLY_APPLIED'|'NOT_APPLIED'} ExecutionStatus */
/** @typedef {'PEST_PRESSURE_REDUCED'|'SYMPTOMS_PERSIST'|'NEW_SYMPTOMS_DETECTED'|'NOT_ENOUGH_EVIDENCE_YET'} ObservedResult */
/** @typedef {'POSITIVE'|'PARTIAL'|'NEGATIVE'|'INCONCLUSIVE'} ImpactLevel */
/** @typedef {'RESOLVED'|'PARTIALLY_RESOLVED'|'NOT_RESOLVED'} ServiceResult */
/** @typedef {'YES'|'NO'} HireAgain */

const STATUS_LABELS = {
    AWAITING_PRESCRIPTION: 'Awaiting prescription',
    PRESCRIPTION_ISSUED: 'Prescription issued',
    RECOVERY_MONITORING: 'Recovery monitoring',
    READY_TO_CLOSE: 'Ready to close',
    CLOSED: 'Closed',
};

const STATUS_CLASSES = {
    AWAITING_PRESCRIPTION: 'status-awaiting',
    PRESCRIPTION_ISSUED: 'status-issued',
    RECOVERY_MONITORING: 'status-recovery',
    READY_TO_CLOSE: 'status-ready',
    CLOSED: 'status-closed',
};

export class Intervention {
    /**
     * @param {Object} params
     * @param {string} [params.code='']
     * @param {number|null} [params.interventionRequestId=null]
     * @param {string} [params.referenceCode='']
     * @param {number|null} [params.plotId=null]
     * @param {number|null} [params.alertId=null]
     * @param {number|null} [params.specialistId=null]
     * @param {number|null} [params.serviceProposalId=null]
     * @param {number|null} [params.treatmentPrescriptionId=null]
     * @param {number|null} [params.interventionExecutionId=null]
     * @param {number|null} [params.interventionOutcomeId=null]
     * @param {InterventionStatus} [params.status='AWAITING_PRESCRIPTION']
     * @param {string} [params.serviceTitle='']
     * @param {number|null} [params.amount=null]
     * @param {string} [params.currency='PEN']
     */
    constructor({
        code = '',
        interventionRequestId = null,
        referenceCode = '',
        plotId = null,
        alertId = null,
        specialistId = null,
        serviceProposalId = null,
        treatmentPrescriptionId = null,
        interventionExecutionId = null,
        interventionOutcomeId = null,
        status = 'AWAITING_PRESCRIPTION',
        serviceTitle = '',
        amount = null,
        currency = 'PEN',
    } = {}) {
        this.code = code;
        this.interventionRequestId = interventionRequestId;
        this.referenceCode = referenceCode;
        this.plotId = plotId;
        this.alertId = alertId;
        this.specialistId = specialistId;
        this.serviceProposalId = serviceProposalId;
        this.treatmentPrescriptionId = treatmentPrescriptionId;
        this.interventionExecutionId = interventionExecutionId;
        this.interventionOutcomeId = interventionOutcomeId;
        this.status = status;
        this.serviceTitle = serviceTitle;
        this.amount = amount;
        this.currency = currency;
    }

    /** @returns {string} */
    get statusLabel() {
        return STATUS_LABELS[this.status] ?? this.status;
    }

    /** @returns {string} */
    get statusClass() {
        return STATUS_CLASSES[this.status] ?? 'status-awaiting';
    }

    /** Human prescription code shown in the UI, e.g. "RX-018". @returns {string} */
    get prescriptionCode() {
        return this.treatmentPrescriptionId != null
            ? `RX-${String(this.treatmentPrescriptionId).padStart(3, '0')}`
            : '\u2014';
    }

    /** @returns {string} Amount formatted with its currency symbol. */
    get amountLabel() {
        if (this.amount == null) return '\u2014';
        const symbol = this.currency === 'PEN' ? 'S/' : this.currency;
        return `${symbol} ${this.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /** @returns {boolean} */
    get needsPrescription() {
        return this.status === 'AWAITING_PRESCRIPTION';
    }

    /** @returns {boolean} */
    get needsCertification() {
        return this.status === 'PRESCRIPTION_ISSUED';
    }

    /** @returns {boolean} */
    get inRecovery() {
        return this.status === 'RECOVERY_MONITORING';
    }

    /** @returns {boolean} */
    get readyToClose() {
        return this.status === 'READY_TO_CLOSE';
    }

    /** @returns {boolean} */
    get isClosed() {
        return this.status === 'CLOSED';
    }
}
