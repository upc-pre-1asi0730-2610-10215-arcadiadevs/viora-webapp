/**
 * @file subscription.store.js
 * @description Application service store for the Subscription slice of the
 * Billing bounded context. Backs the Subscription screen with the user's real
 * plan, invoices and payment method, and drives the MercadoPago checkout /
 * cancel flows.
 *
 * @module useSubscriptionStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { SubscriptionApi } from '../infrastructure/subscription-api.js';
import {
    PlanAssembler,
    SubscriptionAssembler,
    InvoiceAssembler,
    PaymentMethodAssembler,
} from '../infrastructure/subscription-response.js';

const subscriptionApi = new SubscriptionApi();

/**
 * @returns {Object} Store state and actions.
 */
export const useSubscriptionStore = defineStore('subscription', () => {
    /** @type {import('vue').Ref<import('../domain/model/subscription.entity.js').Subscription|null>} */
    const subscription = ref(null);

    /** @type {import('vue').Ref<Array<import('../domain/model/plan.entity.js').Plan>>} */
    const plans = ref([]);

    /** @type {import('vue').Ref<Array<import('../domain/model/invoice.entity.js').Invoice>>} */
    const invoices = ref([]);

    /** @type {import('vue').Ref<Array<import('../domain/model/payment-method.entity.js').PaymentMethod>>} */
    const paymentMethods = ref([]);

    /** @type {import('vue').Ref<boolean>} */
    const loading = ref(false);

    /** @type {import('vue').Ref<string|null>} */
    const checkoutPending = ref(null);

    /** @type {import('vue').Ref<boolean>} */
    const canceling = ref(false);

    /** @type {import('vue').Ref<string|null>} */
    const error = ref(null);

    /** The default (or only) payment method on file. */
    const defaultPaymentMethod = computed(() => {
        const methods = paymentMethods.value;
        return methods.find((m) => m.isDefault) ?? methods[0] ?? null;
    });

    /** The plan matching the active subscription. */
    const currentPlan = computed(() => {
        const sub = subscription.value;
        if (!sub) return null;
        return plans.value.find((p) => p.code === sub.planCode) ?? null;
    });

    /**
     * Loads every dataset the Subscription screen needs.
     */
    function load() {
        loading.value = true;
        let pending = 4;

        const done = () => {
            pending--;
            if (pending === 0) loading.value = false;
        };

        subscriptionApi.getPlans()
            .then((response) => {
                plans.value = PlanAssembler.toEntities(response.data ?? []);
            })
            .catch(() => {})
            .finally(done);

        subscriptionApi.getInvoices()
            .then((response) => {
                invoices.value = InvoiceAssembler.toEntities(response.data ?? []);
            })
            .catch(() => {})
            .finally(done);

        subscriptionApi.getPaymentMethods()
            .then((response) => {
                paymentMethods.value = PaymentMethodAssembler.toEntities(response.data ?? []);
            })
            .catch(() => {})
            .finally(done);

        subscriptionApi.getSubscription()
            .then((response) => {
                subscription.value = SubscriptionAssembler.toEntity(response.data);
            })
            .catch(() => {})
            .finally(done);
    }

    /**
     * Loads only the plan catalog — usable from the public /plans screen,
     * before a session exists, unlike `load()` which needs an active user.
     */
    function loadPlans() {
        return subscriptionApi.getPlans().then((response) => {
            plans.value = PlanAssembler.toEntities(response.data ?? []);
        });
    }

    /**
     * Opens a MercadoPago checkout for the target plan and redirects the browser
     * to the hosted checkout on success.
     * @param {string} planCode
     * @param {'MONTHLY'|'ANNUAL'} interval
     * @param {() => void} [onError]
     */
    function startCheckout(planCode, interval, onError) {
        checkoutPending.value = planCode;
        error.value = null;

        subscriptionApi.checkout(planCode, interval)
            .then((response) => {
                const session = response.data;
                if (session?.checkoutUrl) {
                    window.location.href = session.checkoutUrl;
                } else {
                    error.value = 'Could not open the payment checkout.';
                    onError?.();
                }
            })
            .catch((err) => {
                error.value =
                    err?.response?.data?.message ?? 'Payments are not available yet. Please try again later.';
                onError?.();
            })
            .finally(() => {
                checkoutPending.value = null;
            });
    }

    /**
     * Cancels the subscription at period end.
     * @param {(ok: boolean) => void} [onDone]
     */
    function cancel(onDone) {
        canceling.value = true;

        subscriptionApi.cancel()
            .then((response) => {
                subscription.value = SubscriptionAssembler.toEntity(response.data);
                onDone?.(true);
            })
            .catch(() => {
                onDone?.(false);
            })
            .finally(() => {
                canceling.value = false;
            });
    }

    function clearError() {
        error.value = null;
    }

    return {
        subscription,
        plans,
        invoices,
        paymentMethods,
        loading,
        checkoutPending,
        canceling,
        error,
        defaultPaymentMethod,
        currentPlan,
        load,
        loadPlans,
        startCheckout,
        cancel,
        clearError,
    };
});
