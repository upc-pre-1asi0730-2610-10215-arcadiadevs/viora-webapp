/**
 * Domain entity for a service proposal submitted by a specialist in
 * response to an intervention request.
 * @class ServiceProposal
 */
import { formatMajorMoney } from '../../../shared/domain/model/money.js';


/** @typedef {'PENDING'|'ACCEPTED'|'REJECTED'} ServiceProposalStatus */


export class ServiceProposal {
    /**
     * @param {Object} params
     * @param {number|string|null} [params.id=null]
     * @param {number|null} [params.interventionRequestId=null]
     * @param {number|null} [params.specialistId=null]
     * @param {string} [params.serviceTitle='']
     * @param {string} [params.durationLabel='']
     * @param {string[]} [params.scope=[]]
     * @param {string|null} [params.proposedDate=null]
     * @param {number|null} [params.amount=null]
     * @param {string|null} [params.currency=null]
     * @param {string} [params.proposalDetails='']
     * @param {ServiceProposalStatus} [params.status='PENDING']
     */
    constructor({
        id = null,
        interventionRequestId = null,
        specialistId = null,
        serviceTitle = '',
        durationLabel = '',
        scope = [],
        proposedDate = null,
        amount = null,
        currency = null,
        proposalDetails = '',
        status = 'PENDING',
    } = {}) {
        this.id = id;
        this.interventionRequestId = interventionRequestId;
        this.specialistId = specialistId;
        this.serviceTitle = serviceTitle;
        this.durationLabel = durationLabel;
        this.scope = scope;
        this.proposedDate = proposedDate;
        this.amount = amount;
        this.currency = currency;
        this.proposalDetails = proposalDetails;
        this.status = status;
    }

    /** Amount formatted with its currency symbol, e.g. "S/ 280.00". @returns {string} */
    get costLabel() {
        if (this.amount == null) return '\u2014';
        return formatMajorMoney(this.amount, this.currency ?? 'PEN');
    }

    /** Proposed visit date as a "MMM DD, YYYY" label. @returns {string} */
    get proposedDateLabel() {
        return ServiceProposal.formatDate(this.proposedDate);
    }

    /**
     * @param {string|null} raw
     * @returns {string} Formatted date string.
     */
    static formatDate(raw) {
        if (!raw) return '\u2014';
        const timestamp = Date.parse(raw);
        if (Number.isNaN(timestamp)) return '\u2014';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        }).format(new Date(timestamp));
    }
}
