/**
 * @file coupon.entity.js
 * @description Domain entity for a discount coupon the user holds (Subscription,
 * Billing & Referral). Granted (e.g. the referral reward) or redeemed by code,
 * and later applied against a subscription.
 */

/**
 * @class Coupon
 */
export class Coupon {
    /** @type {number|string|null} */
    id;
    /** @type {string} */
    code;
    /** @type {string} */
    description;
    /** @type {number} */
    discountPercent;
    /** ISO timestamp of the expiry, or null when the coupon never expires. */
    validUntil;
    /** @type {string} */
    conditions;

    /**
     * @param {Object} [props={}]
     * @param {number|string|null} [props.id=null]
     * @param {string} [props.code='']
     * @param {string} [props.description='']
     * @param {number} [props.discountPercent=0]
     * @param {string|null} [props.validUntil=null]
     * @param {string} [props.conditions='']
     */
    constructor({
        id = null,
        code = '',
        description = '',
        discountPercent = 0,
        validUntil = null,
        conditions = '',
    } = {}) {
        this.id = id;
        this.code = code;
        this.description = description;
        this.discountPercent = discountPercent;
        this.validUntil = validUntil;
        this.conditions = conditions;
    }

    /** @returns {Date|null} */
    get #validUntilDate() {
        if (!this.validUntil) return null;
        const date = new Date(this.validUntil);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    /** "Valid until 30/7/2026" caption; empty when there is no expiry. */
    get validUntilLabel() {
        const date = this.#validUntilDate;
        return date ? `Valid until ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}` : '';
    }

    /** "Aug 31, 2026" long form for the coupon face. */
    get validUntilLong() {
        const date = this.#validUntilDate;
        if (!date) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /** Description without the leading "X% ", e.g. "off your next subscription". */
    get discountSubtitle() {
        return this.description.replace(/^\s*\d+%\s*/, '') || 'off your next subscription';
    }

    /** @returns {number} */
    get #serialSeed() {
        const raw = this.id != null ? Number(this.id) : 0;
        return Number.isFinite(raw) && raw > 0 ? raw : 1;
    }

    /** Back-face serial, e.g. "#318-B123" (deterministic per coupon). */
    get serialLabel() {
        const seed = this.#serialSeed;
        return `#${300 + (seed % 90)}-B${100 + ((seed * 7) % 90)}`;
    }

    /** Front-face type code, e.g. "#232-A-REFER". */
    get typeLabel() {
        const seed = this.#serialSeed;
        const kind = this.code.toUpperCase().includes('REFER') ? 'REFER' : 'PROMO';
        return `#${200 + ((seed * 3) % 90)}-A-${kind}`;
    }

    /** Two-digit year for the back face, e.g. "'26". */
    get yearShort() {
        const date = this.#validUntilDate ?? new Date();
        return `'${String(date.getFullYear()).slice(-2)}`;
    }

    /** Uppercase month for the back face, e.g. "APRIL". */
    get monthLabel() {
        const date = this.#validUntilDate ?? new Date();
        return date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    }
}
