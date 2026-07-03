/**
 * @file billing-response.js
 * @description Resource types and assemblers for the Billing (referral/coupon)
 * endpoints.
 */
import { ReferralCode } from '../domain/model/referral-code.entity.js';
import { Coupon } from '../domain/model/coupon.entity.js';

/**
 * Backend resource shape for `GET /referrals/{userId}`.
 * @typedef {Object} ReferralCodeResource
 * @property {number|null} userId
 * @property {string|null} code
 * @property {number|null} rewardPercent
 */

/**
 * Backend resource shape for `GET /coupons?userId=` items.
 * @typedef {Object} CouponResource
 * @property {number|null} id
 * @property {string|null} code
 * @property {string|null} description
 * @property {number|null} discountPercent
 * @property {string|null} validUntil
 * @property {string|null} conditions
 */

/**
 * Request body for `POST /coupons/redeem`.
 * @typedef {Object} RedeemCouponRequest
 * @property {number|string} userId
 * @property {string} code
 */

export class ReferralCodeAssembler {
    /**
     * @param {ReferralCodeResource} resource
     * @returns {ReferralCode}
     */
    static toEntityFromResource(resource) {
        return new ReferralCode({
            userId: resource.userId ?? null,
            code: resource.code ?? '',
            rewardPercent: resource.rewardPercent ?? 0,
        });
    }
}

export class CouponAssembler {
    /**
     * @param {CouponResource} resource
     * @returns {Coupon}
     */
    static toEntityFromResource(resource) {
        return new Coupon({
            id: resource.id ?? null,
            code: resource.code ?? '',
            description: resource.description ?? '',
            discountPercent: resource.discountPercent ?? 0,
            validUntil: resource.validUntil ?? null,
            conditions: resource.conditions ?? '',
        });
    }

    /**
     * @param {CouponResource[]} resources
     * @returns {Coupon[]}
     */
    static toEntitiesFromResources(resources) {
        return resources.map((resource) => CouponAssembler.toEntityFromResource(resource));
    }
}
