/**
 * @file subscription.entity.js
 * @description Domain entity for a user's subscription.
 */
import { formatMoney } from '../../../shared/domain/model/money.js';

/** @typedef {'ACTIVE' | 'PENDING' | 'CANCELED'} SubscriptionStatus */

/**
 * @class Subscription
 */
export class Subscription {
    /** @type {number|string|null} */
    userId;
    /** @type {string} */
    planCode;
    /** @type {string} */
    planName;
    /** @type {'MONTHLY'|'ANNUAL'} */
    interval;
    /** @type {SubscriptionStatus} */
    status;
    /** @type {string|null} */
    currentPeriodEnd;
    /** @type {number} */
    priceCents;
    /** @type {string} */
    currency;

    /**
     * @param {Object} [props={}]
     * @param {number|string|null} [props.userId=null]
     * @param {string} [props.planCode='']
     * @param {string} [props.planName='']
     * @param {'MONTHLY'|'ANNUAL'} [props.interval='MONTHLY']
     * @param {SubscriptionStatus} [props.status='ACTIVE']
     * @param {string|null} [props.currentPeriodEnd=null]
     * @param {number} [props.priceCents=0]
     * @param {string} [props.currency='USD']
     */
    constructor({
        userId = null,
        planCode = '',
        planName = '',
        interval = 'MONTHLY',
        status = 'ACTIVE',
        currentPeriodEnd = null,
        priceCents = 0,
        currency = 'USD',
    } = {}) {
        this.userId = userId;
        this.planCode = planCode;
        this.planName = planName;
        this.interval = interval;
        this.status = status;
        this.currentPeriodEnd = currentPeriodEnd;
        this.priceCents = priceCents;
        this.currency = currency;
    }

    /** @returns {boolean} */
    get isAnnual() {
        return this.interval === 'ANNUAL';
    }

    /** @returns {boolean} */
    get isCanceled() {
        return this.status === 'CANCELED';
    }

    get priceLabel() {
        return formatMoney(this.priceCents, this.currency);
    }

    get intervalSuffix() {
        return this.isAnnual ? '/ year' : '/ month';
    }

    /** "Jul 01, 2026" renewal date. */
    get periodEndLabel() {
        if (!this.currentPeriodEnd) return '';
        const date = new Date(this.currentPeriodEnd);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }

    /** "Renews Jul 01, 2026 · monthly billing" caption. */
    get renewalCaption() {
        const cadence = this.isAnnual ? 'annual billing' : 'monthly billing';
        const verb = this.isCanceled ? 'Ends' : 'Renews';
        return this.periodEndLabel ? `${verb} ${this.periodEndLabel} · ${cadence}` : cadence;
    }
}
