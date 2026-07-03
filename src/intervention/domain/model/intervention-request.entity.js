/**
 * Domain entity for an intervention (expert assistance) request.
 * @class InterventionRequest
 */

/** @typedef {'PENDING'|'AWAITING_RESPONSE'|'PROPOSAL_RECEIVED'|'ACCEPTED'|'DECLINED'} InterventionRequestStatus */

const STATUS_LABELS = {
    PENDING: 'Pending response',
    AWAITING_RESPONSE: 'Awaiting response',
    PROPOSAL_RECEIVED: 'Proposal received',
    ACCEPTED: 'Accepted',
    DECLINED: 'Rejected',
};

export class InterventionRequest {
    /**
     * @param {Object} params
     * @param {number|string|null} [params.id=null]
     * @param {string} [params.referenceCode='']
     * @param {number|null} [params.growerId=null]
     * @param {number|null} [params.plotId=null]
     * @param {number|null} [params.specialistId=null]
     * @param {number|null} [params.alertId=null]
     * @param {string} [params.reason='']
     * @param {string} [params.message='']
     * @param {InterventionRequestStatus} [params.status='PENDING']
     * @param {string|null} [params.createdAt=null]
     * @param {string|null} [params.updatedAt=null]
     */
    constructor({
        id = null,
        referenceCode = '',
        growerId = null,
        plotId = null,
        specialistId = null,
        alertId = null,
        reason = '',
        message = '',
        status = 'PENDING',
        createdAt = null,
        updatedAt = null,
    } = {}) {
        this.id = id;
        this.referenceCode = referenceCode;
        this.growerId = growerId;
        this.plotId = plotId;
        this.specialistId = specialistId;
        this.alertId = alertId;
        this.reason = reason;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /** @returns {string} Producer-facing label for the current status. */
    get statusLabel() {
        return STATUS_LABELS[this.status] ?? this.status;
    }

    /** @returns {boolean} Whether the case is still waiting on the specialist. */
    get isPending() {
        return this.status === 'PENDING' || this.status === 'AWAITING_RESPONSE';
    }

    /** @returns {string} Relative "N min ago" / dated label for the "Last update" column. */
    get lastUpdateLabel() {
        const raw = this.updatedAt ?? this.createdAt;
        if (!raw) return '\u2014';

        const timestamp = Date.parse(raw);
        if (Number.isNaN(timestamp)) return '\u2014';

        const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} min ago`;
        if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)} h ago`;

        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        }).format(new Date(timestamp));
    }
}
