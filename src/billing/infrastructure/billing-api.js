/**
 * @file billing-api.js
 * @description Infrastructure gateway for the Billing bounded context (referral
 * code + coupons). Extends BaseApi and exposes simple promise-based methods.
 */
import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';
import { ReferralCodeAssembler, CouponAssembler } from './billing-response.js';

const referralsEndpointPath = import.meta.env.VITE_REFERRALS_ENDPOINT_PATH || '/referrals';
const couponsEndpointPath = import.meta.env.VITE_COUPONS_ENDPOINT_PATH || '/coupons';

const defaultUserId = import.meta.env.VITE_DEFAULT_USER_ID;

/**
 * @class BillingApi
 * @extends BaseApi
 */
export class BillingApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #referralsEndpoint;
    /** @type {BaseEndpoint} */
    #couponsEndpoint;

    constructor() {
        super();
        this.#referralsEndpoint = new BaseEndpoint(this, referralsEndpointPath);
        this.#couponsEndpoint = new BaseEndpoint(this, couponsEndpointPath);
    }

    /**
     * Fetches (or provisions on first access) the active user's referral code.
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    getReferralCode() {
        return this.#referralsEndpoint.getById(defaultUserId);
    }

    /**
     * Lists the coupons the active user holds.
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    getCoupons() {
        return this.#couponsEndpoint.getAll({ userId: defaultUserId });
    }

    /**
     * Redeems a coupon by code for the active user.
     * @param {string} code
     * @returns {Promise<import('axios').AxiosResponse<Object>>}
     */
    redeemCoupon(code) {
        return this.#couponsEndpoint.http.post(
            `${this.#couponsEndpoint.endpointPath}/redeem`,
            { userId: defaultUserId, code },
        );
    }
}
