/**
 * Shared interceptor registry.
 * Allows bounded contexts to register Axios request interceptors without
 * creating direct import dependencies from the shared kernel to any context.
 *
 * Usage:
 *   // In a bounded context's infrastructure layer:
 *   import { registerRequestInterceptor } from '../../shared/infrastructure/interceptor-registry.js';
 *   registerRequestInterceptor(myInterceptor);
 *
 *   // In shared/infrastructure/base-api.js:
 *   import { getRequestInterceptors } from './interceptor-registry.js';
 *   // Iterates registered interceptors at construction time.
 *
 * @module interceptor-registry
 */

/** @type {Array<Function>} Registered Axios request interceptor functions. */
const interceptors = [];

/**
 * Registers an Axios request interceptor function.
 * @param {Function} interceptor - (config) => config Axios request interceptor.
 */
export function registerRequestInterceptor(interceptor) {
    if (typeof interceptor === 'function' && !interceptors.includes(interceptor)) {
        interceptors.push(interceptor);
    }
}

/**
 * Returns all registered request interceptors (shallow copy).
 * @returns {Function[]} Array of registered interceptor functions.
 */
export function getRequestInterceptors() {
    return [...interceptors];
}
