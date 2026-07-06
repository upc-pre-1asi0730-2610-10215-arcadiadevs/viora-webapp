/**
 * Shared currency formatting helpers. Amounts are stored in minor units by default.
 */

export const CURRENCY_SYMBOLS = {
    USD: '$',
    PEN: 'S/',
    ARS: '$',
    MXN: '$',
    BRL: 'R$',
    COP: '$',
    CLP: '$',
    EUR: '\u20ac',
};

/**
 * Formats a minor-unit amount with a stable dot decimal separator, e.g. "S/ 350.00".
 * @param {number} cents
 * @param {string} currency
 * @returns {string}
 */
export function formatMoney(cents, currency = 'USD') {
    return formatMajorMoney(Number(cents ?? 0) / 100, currency);
}

/**
 * Formats a major-unit amount with a stable dot decimal separator and thousands
 * grouping, e.g. "S/ 1,350.00".
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export function formatMajorMoney(amount, currency = 'USD') {
    const symbol = CURRENCY_SYMBOLS[currency?.toUpperCase()] ?? currency ?? '$';
    const formatted = Number(amount ?? 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${symbol} ${formatted}`.trim();
}
