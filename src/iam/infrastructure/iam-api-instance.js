/**
 * Shared IamApi singleton for the IAM bounded context.
 * Prevents multiple stores from creating separate Axios client instances.
 *
 * @module iam-api-instance
 */
import { IamApi } from './iam-api.js';

let instance = null;

/**
 * Returns the shared IamApi instance (lazy singleton).
 * @returns {IamApi}
 */
export function getIamApi() {
    if (!instance) instance = new IamApi();
    return instance;
}
