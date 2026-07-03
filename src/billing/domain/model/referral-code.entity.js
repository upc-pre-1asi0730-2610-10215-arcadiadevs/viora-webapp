/**
 * @file referral-code.entity.js
 * @description Domain entity for a user's personal referral code (Subscription,
 * Billing & Referral). Shared as a link/code; when an invited partner registers,
 * the referrer becomes eligible for the reward coupon.
 */

/**
 * @class ReferralCode
 */
export class ReferralCode {
    /** @type {number|string|null} */
    readonly userId;
    /** @type {string} */
    readonly code;
    /** @type {number} */
    readonly rewardPercent;

    /**
     * @param {Object} [props={}]
     * @param {number|string|null} [props.userId=null]
     * @param {string} [props.code='']
     * @param {number} [props.rewardPercent=0]
     */
    constructor({ userId = null, code = '', rewardPercent = 0 } = {}) {
        this.userId = userId;
        this.code = code;
        this.rewardPercent = rewardPercent;
    }

    /** "20% discount coupon" reward caption. */
    get rewardLabel() {
        return `${this.rewardPercent}% discount coupon`;
    }

    /** Shareable registration link carrying the referral code. */
    get shareLink() {
        return `https://viora.app/register?ref=${encodeURIComponent(this.code)}`;
    }
}
