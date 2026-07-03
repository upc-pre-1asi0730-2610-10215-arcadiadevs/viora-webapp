/**
 * @file plan.entity.js
 * @description Domain entity for a subscription plan (Subscription, Billing &
 * Referral). Amounts are stored in minor units (cents).
 */

/** @typedef {'MONTHLY' | 'ANNUAL'} PlanInterval */

const CURRENCY_SYMBOLS = {
    USD: '$',
    PEN: 'S/',
    ARS: '$',
    MXN: '$',
    BRL: 'R$',
    COP: '$',
    CLP: '$',
};

/**
 * "$ 149,00" formatting shared by plans, subscription and invoices.
 * @param {number} cents
 * @param {string} currency
 * @returns {string}
 */
export function formatMoney(cents, currency) {
    const symbol = CURRENCY_SYMBOLS[currency?.toUpperCase()] ?? '$';
    const amount = (cents / 100).toFixed(2).replace('.', ',');
    return `${symbol} ${amount}`;
}

/**
 * @class Plan
 */
export class Plan {
    /** @type {number|string|null} */
    readonly id;
    /** @type {string} */
    readonly code;
    /** @type {string} */
    readonly name;
    /** @type {number} */
    readonly priceCents;
    /** @type {string} */
    readonly currency;
    /** @type {PlanInterval} */
    readonly interval;
    /** @type {string} */
    readonly tagline;
    /** @type {string[]} */
    readonly features;
    /** @type {number} */
    readonly plotLimit;
    /** @type {number} */
    readonly iotLimit;

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

    /** "$ 149,00" price. */
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
