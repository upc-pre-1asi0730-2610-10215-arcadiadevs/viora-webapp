/**
 * @file invoice.entity.js
 * @description Domain entity for a billing-history invoice.
 */
import { formatMoney } from './plan.entity.js';

/** @typedef {'PAID' | 'PENDING' | 'FAILED'} InvoiceStatus */

/**
 * @class Invoice
 */
export class Invoice {
    /** @type {number|string|null} */
    id;
    /** @type {string|null} */
    issuedAt;
    /** @type {string} */
    description;
    /** @type {number} */
    amountCents;
    /** @type {string} */
    currency;
    /** @type {InvoiceStatus} */
    status;

    /**
     * @param {Object} [props={}]
     * @param {number|string|null} [props.id=null]
     * @param {string|null} [props.issuedAt=null]
     * @param {string} [props.description='']
     * @param {number} [props.amountCents=0]
     * @param {string} [props.currency='USD']
     * @param {InvoiceStatus} [props.status='PENDING']
     */
    constructor({
        id = null,
        issuedAt = null,
        description = '',
        amountCents = 0,
        currency = 'USD',
        status = 'PENDING',
    } = {}) {
        this.id = id;
        this.issuedAt = issuedAt;
        this.description = description;
        this.amountCents = amountCents;
        this.currency = currency;
        this.status = status;
    }

    /** "Jun 01, 2026" issue date. */
    get dateLabel() {
        if (!this.issuedAt) return '';
        const date = new Date(this.issuedAt);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }

    get amountLabel() {
        return formatMoney(this.amountCents, this.currency);
    }

    get statusLabel() {
        return this.status.charAt(0) + this.status.slice(1).toLowerCase();
    }

    /** @returns {boolean} */
    get isPaid() {
        return this.status === 'PAID';
    }
}
