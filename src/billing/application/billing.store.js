/**
 * @file billing.store.js
 * @description Application service store for the `Billing` bounded context
 * (referral code + coupons). Backs the Settings > Referrals tab.
 *
 * @module useBillingStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { BillingApi } from '../infrastructure/billing-api.js';
import { ReferralCodeAssembler, CouponAssembler } from '../infrastructure/billing-response.js';
import { ReferralCode } from '../domain/model/referral-code.entity.js';

const billingApi = new BillingApi();

/**
 * @returns {Object} Store state and actions.
 */
export const useBillingStore = defineStore('billing', () => {
    /** @type {import('vue').Ref<import('../domain/model/referral-code.entity.js').ReferralCode>} */
    const referralCode = ref(new ReferralCode());

    /** @type {import('vue').Ref<Array<import('../domain/model/coupon.entity.js').Coupon>>} */
    const coupons = ref([]);

    /** @type {import('vue').Ref<boolean>} */
    const loading = ref(false);

    /** @type {import('vue').Ref<boolean>} */
    const redeeming = ref(false);

    /** @type {import('vue').Ref<string|null>} */
    const redeemError = ref(null);

    /** @type {import('vue').ComputedRef<boolean>} */
    const hasCoupons = computed(() => coupons.value.length > 0);

    /**
     * Loads the referral code and coupons for the active user.
     */
    function load() {
        loading.value = true;
        billingApi.getReferralCode()
            .then((response) => {
                referralCode.value = ReferralCodeAssembler.toEntityFromResource(response.data);
            })
            .catch(() => {});

        billingApi.getCoupons()
            .then((response) => {
                coupons.value = CouponAssembler.toEntitiesFromResources(response.data ?? []);
            })
            .catch(() => {})
            .finally(() => {
                loading.value = false;
            });
    }

    /**
     * Redeems a coupon by code, refreshing the list on success.
     * @param {string} code
     * @param {(ok: boolean) => void} [onDone]
     */
    function redeem(code, onDone) {
        redeeming.value = true;
        redeemError.value = null;

        billingApi.redeemCoupon(code)
            .then((response) => {
                coupons.value = [...coupons.value, CouponAssembler.toEntityFromResource(response.data)];
                onDone?.(true);
            })
            .catch((err) => {
                redeemError.value =
                    err?.response?.data?.message ?? 'That coupon code is not valid or already in your account.';
                onDone?.(false);
            })
            .finally(() => {
                redeeming.value = false;
            });
    }

    function clearRedeemError() {
        redeemError.value = null;
    }

    return {
        referralCode,
        coupons,
        loading,
        redeeming,
        redeemError,
        hasCoupons,
        load,
        redeem,
        clearRedeemError,
    };
});
