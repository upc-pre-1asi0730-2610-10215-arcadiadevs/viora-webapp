/**
 * @file payment-method.entity.js
 * @description Domain entity for a saved payment method (display metadata only).
 */

/**
 * @class PaymentMethod
 */
export class PaymentMethod {
    /** @type {number|string|null} */
    id;
    /** @type {string} */
    brand;
    /** @type {string} */
    last4;
    /** @type {number} */
    expMonth;
    /** @type {number} */
    expYear;
    /** @type {boolean} */
    isDefault;

    /**
     * @param {Object} [props={}]
     * @param {number|string|null} [props.id=null]
     * @param {string} [props.brand='']
     * @param {string} [props.last4='']
     * @param {number} [props.expMonth=0]
     * @param {number} [props.expYear=0]
     * @param {boolean} [props.isDefault=false]
     */
    constructor({
        id = null,
        brand = '',
        last4 = '',
        expMonth = 0,
        expYear = 0,
        isDefault = false,
    } = {}) {
        this.id = id;
        this.brand = brand;
        this.last4 = last4;
        this.expMonth = expMonth;
        this.expYear = expYear;
        this.isDefault = isDefault;
    }

    /** "Visa •••• 4242". */
    get label() {
        return `${this.brand} •••• ${this.last4}`;
    }

    /** "Expires 08/28". */
    get expiresLabel() {
        const mm = String(this.expMonth).padStart(2, '0');
        const yy = String(this.expYear).slice(-2);
        return `Expires ${mm}/${yy}`;
    }
}
