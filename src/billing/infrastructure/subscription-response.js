/**
 * @file subscription-response.js
 * @description Resource types and assemblers for the Subscription endpoints
 * (plans, subscription, invoices, payment methods, checkout).
 */
import { Plan } from '../domain/model/plan.entity.js';
import { Subscription } from '../domain/model/subscription.entity.js';
import { Invoice } from '../domain/model/invoice.entity.js';
import { PaymentMethod } from '../domain/model/payment-method.entity.js';

/**
 * @typedef {Object} PlanResource
 * @property {number|null} id
 * @property {string|null} code
 * @property {string|null} name
 * @property {number|null} priceCents
 * @property {string|null} currency
 * @property {string|null} interval
 * @property {string|null} tagline
 * @property {string[]|null} features
 * @property {number|null} plotLimit
 * @property {number|null} iotLimit
 */

/**
 * @typedef {Object} SubscriptionResource
 * @property {number|null} userId
 * @property {string|null} planCode
 * @property {string|null} planName
 * @property {string|null} interval
 * @property {string|null} status
 * @property {string|null} currentPeriodEnd
 * @property {number|null} priceCents
 * @property {string|null} currency
 */

/**
 * @typedef {Object} InvoiceResource
 * @property {number|null} id
 * @property {string|null} issuedAt
 * @property {string|null} description
 * @property {number|null} amountCents
 * @property {string|null} currency
 * @property {string|null} status
 */

/**
 * @typedef {Object} PaymentMethodResource
 * @property {number|null} id
 * @property {string|null} brand
 * @property {string|null} last4
 * @property {number|null} expMonth
 * @property {number|null} expYear
 * @property {boolean|null} isDefault
 */

/**
 * @typedef {Object} CheckoutResource
 * @property {string|null} preferenceId
 * @property {string|null} checkoutUrl
 */

/**
 * @typedef {Object} CreateCheckoutRequest
 * @property {string} planCode
 * @property {'MONTHLY'|'ANNUAL'} interval
 */

/**
 * @param {string|null} raw
 * @returns {'MONTHLY'|'ANNUAL'}
 */
function toInterval(raw) {
    return raw?.toUpperCase() === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
}

export class PlanAssembler {
    /**
     * @param {PlanResource} resource
     * @returns {Plan}
     */
    static toEntity(resource) {
        return new Plan({
            id: resource.id ?? null,
            code: resource.code ?? '',
            name: resource.name ?? '',
            priceCents: Math.round((resource.priceAmount ?? 0) * 100),
            currency: resource.currency ?? 'USD',
            interval: toInterval(resource.interval),
            tagline: resource.tagline ?? '',
            features: resource.features ?? [],
            plotLimit: resource.plotLimit ?? 0,
            iotLimit: resource.iotLimit ?? 0,
        });
    }

    /**
     * @param {PlanResource[]} resources
     * @returns {Plan[]}
     */
    static toEntities(resources) {
        return resources.map((r) => PlanAssembler.toEntity(r));
    }
}

export class SubscriptionAssembler {
    /**
     * @param {SubscriptionResource} resource
     * @returns {Subscription}
     */
    static toEntity(resource) {
        return new Subscription({
            userId: resource.userId ?? null,
            planCode: resource.planCode ?? '',
            planName: resource.planName ?? '',
            interval: toInterval(resource.interval),
            status: (resource.status?.toUpperCase()) || 'ACTIVE',
            currentPeriodEnd: resource.currentPeriodEnd ?? null,
            priceCents: resource.priceCents ?? 0,
            currency: resource.currency ?? 'USD',
        });
    }
}

export class InvoiceAssembler {
    /**
     * @param {InvoiceResource} resource
     * @returns {Invoice}
     */
    static toEntity(resource) {
        return new Invoice({
            id: resource.id ?? null,
            issuedAt: resource.issuedAt ?? null,
            description: resource.description ?? '',
            amountCents: resource.amountCents ?? 0,
            currency: resource.currency ?? 'USD',
            status: (resource.status?.toUpperCase()) || 'PENDING',
        });
    }

    /**
     * @param {InvoiceResource[]} resources
     * @returns {Invoice[]}
     */
    static toEntities(resources) {
        return resources.map((r) => InvoiceAssembler.toEntity(r));
    }
}

export class PaymentMethodAssembler {
    /**
     * @param {PaymentMethodResource} resource
     * @returns {PaymentMethod}
     */
    static toEntity(resource) {
        return new PaymentMethod({
            id: resource.id ?? null,
            brand: resource.brand ?? '',
            last4: resource.last4 ?? '',
            expMonth: resource.expMonth ?? 0,
            expYear: resource.expYear ?? 0,
            isDefault: resource.isDefault ?? false,
        });
    }

    /**
     * @param {PaymentMethodResource[]} resources
     * @returns {PaymentMethod[]}
     */
    static toEntities(resources) {
        return resources.map((r) => PaymentMethodAssembler.toEntity(r));
    }
}
