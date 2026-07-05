/**
 * @file subscription-api.js
 * @description Infrastructure gateway for the Subscription slice of the Billing
 * bounded context. Plan changes open a MercadoPago hosted checkout; reads
 * (plans, invoices, payment methods) are real.
 */
import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';
import { requireActiveUserId } from '../../shared/infrastructure/active-session.js';

const plansEndpointPath = import.meta.env.VITE_PLANS_ENDPOINT_PATH || '/plans';
const subscriptionsEndpointPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH || '/subscriptions';
const checkoutsEndpointPath = import.meta.env.VITE_CHECKOUTS_ENDPOINT_PATH || '/checkouts';
const invoicesEndpointPath = import.meta.env.VITE_INVOICES_ENDPOINT_PATH || '/invoices';
const paymentMethodsEndpointPath = import.meta.env.VITE_PAYMENT_METHODS_ENDPOINT_PATH || '/payment-methods';

/**
 * @class SubscriptionApi
 * @extends BaseApi
 */
export class SubscriptionApi extends BaseApi {
    /** @type {BaseEndpoint} */
    #plansEndpoint;
    /** @type {BaseEndpoint} */
    #subscriptionsEndpoint;
    /** @type {BaseEndpoint} */
    #checkoutsEndpoint;
    /** @type {BaseEndpoint} */
    #invoicesEndpoint;
    /** @type {BaseEndpoint} */
    #paymentMethodsEndpoint;

    constructor() {
        super();
        this.#plansEndpoint = new BaseEndpoint(this, plansEndpointPath);
        this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsEndpointPath);
        this.#checkoutsEndpoint = new BaseEndpoint(this, checkoutsEndpointPath);
        this.#invoicesEndpoint = new BaseEndpoint(this, invoicesEndpointPath);
        this.#paymentMethodsEndpoint = new BaseEndpoint(this, paymentMethodsEndpointPath);
    }

    /**
     * @returns {Promise<import('axios').AxiosResponse<import('./subscription-response.js').PlanResource[]>>}
     */
    getPlans() {
        return this.#plansEndpoint.getAll();
    }

    /**
     * @returns {Promise<import('axios').AxiosResponse<import('./subscription-response.js').SubscriptionResource>>}
     */
    getSubscription() {
        return this.#subscriptionsEndpoint.getById(requireActiveUserId());
    }

    /**
     * @returns {Promise<import('axios').AxiosResponse<import('./subscription-response.js').InvoiceResource[]>>}
     */
    getInvoices() {
        return this.#invoicesEndpoint.getAll({ userId: requireActiveUserId() });
    }

    /**
     * @returns {Promise<import('axios').AxiosResponse<import('./subscription-response.js').PaymentMethodResource[]>>}
     */
    getPaymentMethods() {
        return this.#paymentMethodsEndpoint.getAll({ userId: requireActiveUserId() });
    }

    /**
     * Opens a MercadoPago checkout for the target plan; returns the redirect URL.
     * @param {string} planCode
     * @param {'MONTHLY'|'ANNUAL'} interval
     * @returns {Promise<import('axios').AxiosResponse<import('./subscription-response.js').CheckoutResource>>}
     */
    checkout(planCode, interval) {
        return this.#checkoutsEndpoint.create({ userId: requireActiveUserId(), planCode, interval });
    }

    /**
     * Cancels the subscription at period end.
     * @returns {Promise<import('axios').AxiosResponse<import('./subscription-response.js').SubscriptionResource>>}
     */
    cancel() {
        return this.#subscriptionsEndpoint.http.patch(
            `${this.#subscriptionsEndpoint.endpointPath}/${requireActiveUserId()}`,
            { status: 'CANCELED' },
        );
    }
}
