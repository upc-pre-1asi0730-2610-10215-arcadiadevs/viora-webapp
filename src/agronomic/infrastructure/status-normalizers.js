/**
 * @file status-normalizers.js
 * @description Maps the Viora platform's UPPERCASE enum names (serialized via
 * `Enum.name()`) into the display values used by the agronomic domain entities.
 * Ported from the OS Angular frontend so the Vue contracts line up with the
 * same backend responses.
 */

/**
 * Normalizes a plot/general health status.
 * Backend GeneralHealthStatus: HEALTHY | WARNING | CRITICAL | UNKNOWN.
 *
 * @param {string|null|undefined} value - Raw health status from the API.
 * @returns {'Healthy'|'Moderate'|'Critical'} Display health status.
 */
export function normalizePlotHealthStatus(value) {
    switch ((value ?? '').trim().toUpperCase()) {
        case 'HEALTHY':
            return 'Healthy';
        case 'CRITICAL':
            return 'Critical';
        case 'WARNING':
        case 'UNDER REVIEW':
        case 'UNDER_REVIEW':
        case 'MODERATE':
        case 'UNKNOWN':
            return 'Moderate';
        default:
            return 'Healthy';
    }
}

/**
 * Normalizes the three-level phenological risk scale.
 * Backend ClimateRiskLevel: LOW | MODERATE | HIGH | EXTREME | UNKNOWN.
 *
 * @param {string|null|undefined} value - Raw phenological risk from the API.
 * @returns {'Low'|'Moderate'|'High'} Display risk level.
 */
export function normalizePhenologicalRisk(value) {
    switch ((value ?? '').trim().toUpperCase()) {
        case 'MODERATE':
        case 'MEDIUM':
            return 'Moderate';
        case 'HIGH':
        case 'EXTREME':
            return 'High';
        default:
            return 'Low';
    }
}

/**
 * Normalizes a climate/phenological risk level.
 * Backend ClimateRiskLevel: LOW | MODERATE | HIGH | EXTREME | UNKNOWN.
 *
 * @param {string|null|undefined} value - Raw risk level from the API.
 * @returns {'Low'|'Moderate'|'High'|'Extreme'} Display risk level.
 */
export function normalizeClimateRisk(value) {
    switch ((value ?? '').trim().toUpperCase()) {
        case 'LOW':
            return 'Low';
        case 'MODERATE':
        case 'MEDIUM':
            return 'Moderate';
        case 'HIGH':
            return 'High';
        case 'EXTREME':
            return 'Extreme';
        default:
            return 'Low';
    }
}

/**
 * Normalizes an automatic monitoring-link state reported after registration.
 * Backend values are enum names such as ACTIVE | INITIALIZING | NOT_LINKED.
 *
 * @param {string|null|undefined} value - Raw link status from the API.
 * @returns {'active'|'initializing'|'not-linked'|'unknown'} Display link status.
 */
export function normalizeMonitoringLink(value) {
    switch ((value ?? '').trim().toUpperCase()) {
        case 'ACTIVE':
        case 'LINKED':
        case 'ENABLED':
        case 'READY':
            return 'active';
        case 'INITIALIZING':
        case 'PENDING':
        case 'PROCESSING':
        case 'IN_PROGRESS':
            return 'initializing';
        case 'NOT_LINKED':
        case 'UNLINKED':
        case 'DISABLED':
        case 'NONE':
            return 'not-linked';
        default:
            return 'unknown';
    }
}
