/**
 * @file plan.entity.js
 * @description Domain entity for a subscription plan (Subscription, Billing &
 * Referral). Amounts are stored in minor units (cents).
 */
import { formatMoney } from '../../../shared/domain/model/money.js';

/** @typedef {'MONTHLY' | 'ANNUAL'} PlanInterval */

/**
 * @class Plan
 */
export class Plan {
    /** @type {number|string|null} */
    id;
    /** @type {string} */
    code;
    /** @type {string} */
    name;
    /** @type {number} */
    priceCents;
    /** @type {string} */
    currency;
    /** @type {PlanInterval} */
    interval;
    /** @type {string} */
    tagline;
    /** @type {string[]} */
    features;
    /** @type {number} */
    plotLimit;
    /** @type {number} */
    iotLimit;

    /**
     * @param {Object} [props={}]
     * @param {number|string|null} [props.id=null]
     * @param {string} [props.code='']
     * @param {string} [props.name='']
     * @param {number} [props.priceCents=0]
     * @param {string} [props.currency='USD']
     * @param {PlanInterval} [props.interval='MONTHLY']
     * @param {string} [props.tagline='']
     * @param {string[]} [props.features=[]]
     * @param {number} [props.plotLimit=0]
     * @param {number} [props.iotLimit=0]
     */
    constructor({
        id = null,
        code = '',
        name = '',
        priceCents = 0,
        currency = 'USD',
        interval = 'MONTHLY',
        tagline = '',
        features = [],
        plotLimit = 0,
        iotLimit = 0,
    } = {}) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.priceCents = priceCents;
        this.currency = currency;
        this.interval = interval;
        this.tagline = tagline;
        this.features = features;
        this.plotLimit = plotLimit;
        this.iotLimit = iotLimit;
    }

    /** "$ 149.00" price. */
    get priceLabel() {
        return formatMoney(this.priceCents, this.currency);
    }

    /** "/ month" or "/ year" suffix. */
    get intervalSuffix() {
        return this.interval === 'ANNUAL' ? '/ year' : '/ month';
    }

    /** @returns {boolean} */
    get isAnnual() {
        return this.interval === 'ANNUAL';
    }
}
